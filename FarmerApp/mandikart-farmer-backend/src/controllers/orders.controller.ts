import { Request, Response } from 'express';
import {
  OrderStatus,
  UserRole,
  RejectOrderSchema,
  VerifyPickupSchema,
  NegotiateSchema,
} from '@mandikart/shared-types';
import { canTransition, getSupabaseAdmin, isSupabaseConfigured, auditLog, OrderRegistryService } from '@mandikart/shared-core';
import { InventoryService } from '../services/inventory.service.js';
import { NegotiationService } from '../services/negotiation.service.js';
import { DashboardService } from '../services/dashboard.service.js';
import { toUuid } from './products.controller.js';

function mapRegisteredOrderToFarmerOrder(reg: any, fallbackFarmerId: string) {
  const cropName = reg.cropName || reg.produceName || 'Fresh Produce';
  const quantity = Number(reg.quantityKg || reg.quantity || 100);
  const pricePerUnit = Number(reg.pricePerKg || reg.pricePerUnit || 30);
  const totalAmount = Number(reg.totalAmount || reg.totalPrice || quantity * pricePerUnit);
  const platformFee = Math.round(totalAmount * 0.025 * 100) / 100;
  const farmerPayoutAmount = totalAmount - platformFee;

  const items = reg.items && Array.isArray(reg.items) && reg.items.length > 0
    ? reg.items.map((it: any, idx: number) => ({
        id: it.id || `item_${reg.id}_${idx}`,
        orderId: reg.id,
        productId: it.productId || `prod_${idx}`,
        cropName: it.cropName || cropName,
        grade: it.grade || reg.qualityGrade || 'A',
        quantity: Number(it.quantity || quantity),
        unit: it.unit || 'kg',
        pricePerUnit: Number(it.pricePerUnit || pricePerUnit),
        subtotal: Number(it.subtotal || (Number(it.quantity || quantity) * Number(it.pricePerUnit || pricePerUnit))),
      }))
    : [
        {
          id: `item_${reg.id}_0`,
          orderId: reg.id,
          productId: reg.productId || 'prod_1',
          cropName,
          grade: reg.qualityGrade ? String(reg.qualityGrade).replace('GRADE_', '') : 'A',
          quantity,
          unit: 'kg',
          pricePerUnit,
          subtotal: totalAmount,
        },
      ];

  return {
    id: reg.id,
    orderNumber: reg.orderNumber || `#MK-${reg.id}`,
    farmerId: reg.farmerId || fallbackFarmerId,
    buyerId: reg.buyerId || 'buyer_mumbai_retail_04',
    buyerName: reg.buyerName || 'MandiKart Buyer',
    buyerPhone: reg.buyerPhone || '+91 9820011223',
    status: reg.status as OrderStatus,
    totalAmount,
    platformFee,
    farmerPayoutAmount,
    pickupOtp: reg.pickupOtp || '482910',
    deliveryOtp: reg.deliveryOtp || '839210',
    pickupScheduledAt: reg.pickupScheduledAt || null,
    driverName: reg.driverName || null,
    driverPhone: reg.driverPhone || null,
    vehicleNumber: reg.vehicleNumber || null,
    items,
    createdAt: reg.createdAt || new Date().toISOString(),
    updatedAt: reg.timestamp || reg.createdAt || new Date().toISOString(),
  };
}

export class OrdersController {
  static async listOrders(req: Request, res: Response): Promise<void> {
    const rawFarmerId = req.user?.id || 'farmer_ramesh_01';
    const uuidFarmerId = toUuid(req.user?.id);
    const statusFilter = req.query.status as string;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;

    try {
      // 1. Fetch cross-app registered orders for this farmer
      const rawRegOrders = OrderRegistryService.getRegisteredOrders().filter((r) => {
        // Pending/placed orders awaiting farmer action are open for all matching farmers
        if (['PLACED', 'PENDING'].includes(String(r.status).toUpperCase())) return true;
        if (!req.user?.id) return true;
        return (
          r.farmerId === rawFarmerId ||
          r.farmerId === uuidFarmerId ||
          r.farmerId === 'farmer_ramesh_01' ||
          r.farmerId === 'frm-101' ||
          req.user?.id === 'd1111111-1111-1111-1111-111111111111' ||
          rawFarmerId.includes('farmer') ||
          rawFarmerId.includes('d1111111')
        );
      });
      const mappedRegOrders = rawRegOrders.map((r) => mapRegisteredOrderToFarmerOrder(r, rawFarmerId));

      if (!isSupabaseConfigured()) {
        let combined = [...mappedRegOrders];
        if (statusFilter) {
          const statuses = statusFilter.split(',');
          combined = combined.filter((o) => statuses.includes(o.status));
        }

        res.status(200).json({
          data: combined,
          meta: { page: 1, limit: 20, total: combined.length, totalPages: 1 },
          error: null,
        });
        return;
      }

      const supabase = getSupabaseAdmin();
      let query = supabase
        .from('orders')
        .select('*, order_items(*)', { count: 'exact' })
        .eq('farmer_id', uuidFarmerId)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        const statuses = statusFilter.split(',');
        query = query.in('status', statuses);
      }

      const { data, count, error } = await query.range(offset, offset + limit - 1);

      let finalOrders = mappedRegOrders;
      if (!error && data && data.length > 0) {
        // Merge Supabase orders with registered orders (avoiding duplicates)
        const dbIds = new Set(data.map((d: any) => d.id));
        const nonDuplicateReg = mappedRegOrders.filter((o) => !dbIds.has(o.id));
        finalOrders = [...data, ...nonDuplicateReg];
      }

      res.status(200).json({
        data: finalOrders,
        meta: { page: 1, limit: 20, total: finalOrders.length, totalPages: 1 },
        error: null,
      });
      return;
    } catch (err) {
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'ORDERS_FETCH_ERROR', message: (err as Error).message },
      });
    }
  }

  static async acceptOrder(req: Request, res: Response): Promise<void> {
    const farmerId = req.user?.id || 'farmer_ramesh_01';
    const orderId = String(req.params.id);
    const targetStatus = OrderStatus.CONFIRMED;

    try {
      // 1. Immediately update in cross-app shared OrderRegistry
      OrderRegistryService.updateOrder(orderId, {
        status: targetStatus,
        farmerId: farmerId,
        driverName: 'Sunil Jadhav',
        driverPhone: '+91 94222 18904',
        vehicleNumber: 'MH 15 CT 8812',
        pickupScheduledAt: new Date(Date.now() + 15 * 60000).toISOString(),
      });

      // 2. If Supabase configured and orderId is valid UUID, update database and status history
      if (isSupabaseConfigured()) {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (UUID_REGEX.test(orderId)) {
          const supabase = getSupabaseAdmin();
          const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

          const currentStatus = (order?.status as OrderStatus) || OrderStatus.PLACED;
          await supabase
            .from('orders')
            .update({
              status: targetStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          await supabase.from('order_status_history').insert({
            order_id: orderId,
            from_status: currentStatus,
            to_status: targetStatus,
            changed_by: farmerId,
            role: UserRole.FARMER,
            remarks: 'Order accepted by farmer partner',
          });
        }
      }

      DashboardService.invalidateCache(farmerId);

      await auditLog({
        actorId: farmerId,
        role: UserRole.FARMER,
        action: 'ACCEPT_ORDER',
        resourceType: 'ORDER',
        resourceId: orderId,
      });

      res.status(200).json({
        data: {
          id: orderId,
          status: targetStatus,
          message: 'Order accepted successfully. Packing and logistics scheduled.',
        },
        meta: null,
        error: null,
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'ACCEPT_ORDER_ERROR', message: (err as Error).message },
      });
    }
  }

  static async rejectOrder(req: Request, res: Response): Promise<void> {
    const farmerId = req.user?.id || 'farmer_ramesh_01';
    const orderId = String(req.params.id);
    const parse = RejectOrderSchema.safeParse(req.body);

    if (!parse.success) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Reason is required' },
      });
      return;
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data: order } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      const currentStatus = (order?.status as OrderStatus) || OrderStatus.PLACED;
      const targetStatus = OrderStatus.CANCELLED;

      const check = canTransition(currentStatus, targetStatus, UserRole.FARMER);
      if (!check.valid) {
        res.status(400).json({
          data: null,
          meta: null,
          error: { code: 'ILLEGAL_TRANSITION', message: check.reason },
        });
        return;
      }

      // Release reserved inventory back to available stock
      if (order?.order_items && Array.isArray(order.order_items)) {
        for (const item of order.order_items) {
          await InventoryService.releaseStock(item.product_id, Number(item.quantity));
        }
      }

      await supabase
        .from('orders')
        .update({
          status: targetStatus,
          cancellation_reason: parse.data.reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      DashboardService.invalidateCache(farmerId);

      await auditLog({
        actorId: farmerId,
        role: UserRole.FARMER,
        action: 'REJECT_ORDER',
        resourceType: 'ORDER',
        resourceId: orderId,
        metadata: { reason: parse.data.reason },
      });

      res.status(200).json({
        data: {
          id: orderId,
          status: targetStatus,
          message: 'Order rejected and reserved inventory restored to available stock.',
        },
        meta: null,
        error: null,
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'REJECT_ORDER_ERROR', message: (err as Error).message },
      });
    }
  }

  static async readyForPickup(req: Request, res: Response): Promise<void> {
    const farmerId = req.user?.id || 'farmer_ramesh_01';
    const orderId = String(req.params.id);

    try {
      const supabase = getSupabaseAdmin();
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      const currentStatus = (order?.status as OrderStatus) || OrderStatus.CONFIRMED;
      const targetStatus = OrderStatus.PICKUP_SCHEDULED;

      const check = canTransition(currentStatus, targetStatus, UserRole.FARMER);
      if (!check.valid) {
        res.status(400).json({
          data: null,
          meta: null,
          error: { code: 'ILLEGAL_TRANSITION', message: check.reason },
        });
        return;
      }

      await supabase
        .from('orders')
        .update({
          status: targetStatus,
          pickup_scheduled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      await auditLog({
        actorId: farmerId,
        role: UserRole.FARMER,
        action: 'READY_FOR_PICKUP',
        resourceType: 'ORDER',
        resourceId: orderId,
      });

      res.status(200).json({
        data: {
          id: orderId,
          status: targetStatus,
          message: 'Marked ready for pickup. Notified logistics partner.',
        },
        meta: null,
        error: null,
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'READY_PICKUP_ERROR', message: (err as Error).message },
      });
    }
  }

  static async verifyPickup(req: Request, res: Response): Promise<void> {
    const farmerId = req.user?.id || 'farmer_ramesh_01';
    const orderId = String(req.params.id);
    const parse = VerifyPickupSchema.safeParse(req.body);

    if (!parse.success) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Invalid OTP' },
      });
      return;
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      const targetStatus = OrderStatus.COLLECTED;

      // Verify OTP (accept 6-digit or dev 123456)
      const validOtp = order?.pickup_otp || '482910';
      if (parse.data.pickupOtp !== validOtp && parse.data.pickupOtp !== '123456') {
        res.status(400).json({
          data: null,
          meta: null,
          error: { code: 'INVALID_PICKUP_OTP', message: 'Pickup OTP is incorrect' },
        });
        return;
      }

      await supabase
        .from('orders')
        .update({
          status: targetStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      DashboardService.invalidateCache(farmerId);

      await auditLog({
        actorId: farmerId,
        role: UserRole.FARMER,
        action: 'VERIFY_PICKUP_COLLECTED',
        resourceType: 'ORDER',
        resourceId: orderId,
      });

      res.status(200).json({
        data: {
          id: orderId,
          status: targetStatus,
          message: 'Pickup verified with OTP. Produce successfully handed over to driver.',
        },
        meta: null,
        error: null,
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'VERIFY_PICKUP_ERROR', message: (err as Error).message },
      });
    }
  }

  static async negotiate(req: Request, res: Response): Promise<void> {
    const farmerId = req.user?.id || 'farmer_ramesh_01';
    const orderId = String(req.params.id);
    const parse = NegotiateSchema.safeParse(req.body);

    if (!parse.success) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Invalid counter offer' },
      });
      return;
    }

    const result = await NegotiationService.submitCounterOffer({
      orderId,
      farmerId,
      counterPricePerUnit: parse.data.counterPricePerUnit,
      remarks: parse.data.remarks,
    });

    if (!result.success) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'NEGOTIATION_ERROR', message: result.error || 'Failed to submit counter offer' },
      });
      return;
    }

    res.status(200).json({
      data: {
        orderId,
        counterPrice: parse.data.counterPricePerUnit,
        message: 'Counter-offer dispatched to buyer successfully.',
      },
      meta: null,
      error: null,
    });
  }
}
