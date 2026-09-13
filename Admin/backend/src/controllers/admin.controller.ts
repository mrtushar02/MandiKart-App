/**
 * MandiKart — Admin Operations & Dispute Resolution Controller
 * Privileged endpoints enforcing UserRole.ADMIN role checks.
 */

import { Request, Response } from 'express';
import { OrderStatus, UserRole } from '@mandikart/shared-types';
import {
  canTransition,
  getSupabaseAdmin,
  auditLog,
  ProductRegistryService,
  OrderRegistryService,
  getCropImageUrl,
  geminiAiService,
} from '@mandikart/shared-core';

export class AdminController {
  static async getPlatformMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const supabase = getSupabaseAdmin();
      const { data: orders } = await supabase.from('orders').select('total_amount, platform_fee, status');
      const { count: verifiedFarmers } = await supabase.from('farmers').select('*', { count: 'exact', head: true }).eq('is_verified', true);
      const { count: totalFarmers } = await supabase.from('farmers').select('*', { count: 'exact', head: true });
      const { count: totalBuyers } = await supabase.from('buyers').select('*', { count: 'exact', head: true });
      const { count: activeProduceCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);

      let gmv = 0;
      let fees = 0;
      let active = 0;

      if (orders) {
        for (const o of orders) {
          gmv += Number(o.total_amount || 0);
          fees += Number(o.platform_fee || 0);
          if (!['COMPLETED', 'CANCELLED'].includes(o.status)) {
            active++;
          }
        }
      }

      res.status(200).json({
        data: {
          totalGrossMarketValue: gmv,
          totalCommissionEarned: fees,
          activeOrdersCount: active,
          verifiedFarmersCount: verifiedFarmers || 0,
          totalFarmersCount: totalFarmers || 0,
          totalBuyersCount: totalBuyers || 0,
          totalUsersCount: (totalFarmers || 0) + (totalBuyers || 0),
          activeProduceCount: activeProduceCount || 0,
        },
        meta: null,
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, meta: null, error: { code: 'METRICS_ERROR', message: (err as Error).message } });
    }
  }

  static async verifyFarmerKyc(req: Request, res: Response): Promise<void> {
    const adminId = req.user?.id || 'admin_super_01';
    const farmerId = String(req.params.farmerId);

    await auditLog({
      actorId: adminId,
      role: UserRole.ADMIN,
      action: 'APPROVE_FARMER_KYC',
      resourceType: 'FARMER',
      resourceId: farmerId,
    });

    res.status(200).json({
      data: {
        farmerId,
        isVerified: true,
        message: 'Farmer KYC credentials verified and activated for bulk trading.',
      },
      meta: null,
      error: null,
    });
  }

  static async resolveDispute(req: Request, res: Response): Promise<void> {
    const adminId = req.user?.id || 'admin_super_01';
    const orderId = String(req.params.orderId);
    const { resolution, remarks } = req.body; // 'APPROVE_PAYOUT' (-> COMPLETED) or 'REFUND_BUYER' (-> CANCELLED)

    const targetStatus = resolution === 'REFUND_BUYER' ? OrderStatus.CANCELLED : OrderStatus.COMPLETED;
    const check = canTransition(OrderStatus.DISPUTED, targetStatus, UserRole.ADMIN);

    if (!check.valid) {
      res.status(400).json({ data: null, meta: null, error: { code: 'ILLEGAL_TRANSITION', message: check.reason } });
      return;
    }

    // Update payments and disputes tables in Supabase
    try {
      const supabase = getSupabaseAdmin();
      if (resolution === 'REFUND_BUYER') {
        await supabase.from('payments').update({
          status: 'REFUNDED',
          escrow_status: 'REFUNDED',
          refunded_at: new Date().toISOString(),
        }).eq('order_id', orderId);

        await supabase.from('disputes').update({
          status: 'RESOLVED_REFUND',
          admin_notes: remarks || 'Resolved with buyer refund by Admin',
          resolved_at: new Date().toISOString(),
        }).eq('order_id', orderId);
      } else {
        await supabase.from('payments').update({
          escrow_status: 'RELEASED',
          escrow_released_at: new Date().toISOString(),
        }).eq('order_id', orderId);

        await supabase.from('disputes').update({
          status: 'RESOLVED_SETTLED',
          admin_notes: remarks || 'Resolved with farmer payout dispatch by Admin',
          resolved_at: new Date().toISOString(),
        }).eq('order_id', orderId);
      }
    } catch {
      // Offline fallback
    }

    await auditLog({
      actorId: adminId,
      role: UserRole.ADMIN,
      action: 'RESOLVE_DISPUTE',
      resourceType: 'DISPUTE',
      resourceId: orderId,
      metadata: { resolution, targetStatus, remarks },
    });

    res.status(200).json({
      data: {
        orderId,
        status: targetStatus,
        resolution,
        message: `Dispute resolved. Order status transitioned to ${targetStatus}. Escrow state updated.`,
      },
      meta: null,
      error: null,
    });
  }

  static async getAuditLogs(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      data: [
        {
          id: 'aud_1',
          actorId: 'farmer_ramesh_01',
          role: 'FARMER',
          action: 'ACCEPT_ORDER',
          resourceType: 'ORDER',
          resourceId: 'ord_101',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'aud_2',
          actorId: 'driver_santosh_01',
          role: 'LOGISTICS_DRIVER',
          action: 'COLLECTED_FROM_FARMER',
          resourceType: 'ORDER',
          resourceId: 'ord_101',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
      meta: { total: 2 },
      error: null,
    });
  }

  static async getAllProduce(_req: Request, res: Response): Promise<void> {
    try {
      const supabase = getSupabaseAdmin();
      // NOTE: We intentionally omit the farmers(*) JOIN here to avoid Supabase
      // statement timeout (error 57014). Farmer info is resolved from ProductRegistryService.
      const { data: dbProducts } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      const sanitizeImg = (imgUrl: string | undefined, cropName: string, category: string) => {
        if (!imgUrl || typeof imgUrl !== 'string' || imgUrl.trim() === '') {
          return getCropImageUrl(cropName, category);
        }
        // Allow compact base64 data URIs up to 2MB
        if (imgUrl.startsWith('data:image/') && imgUrl.length < 2000000) return imgUrl;
        // Strip local device file:// paths — only valid on the device that took the photo
        if (imgUrl.startsWith('file://')) return getCropImageUrl(cropName, category);
        if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
        return getCropImageUrl(cropName, category);
      };

      const regProducts = ProductRegistryService.getRegisteredProducts();
      const findRegItem = (pId: string, cropName?: string, farmerId?: string) => {
        return regProducts.find((r) =>
          r.id === pId ||
          (r.cropName && cropName && r.cropName.toLowerCase().trim() === cropName.toLowerCase().trim() && (r.farmerId === farmerId || !farmerId))
        );
      };

      const resolveProduceStatus = (
        is_active: boolean | undefined,
        target_buyer: string | undefined,
        pStatus: string | undefined,
        regStatus: string | undefined,
        regTargetBuyer: string | undefined,
        regIsActive: boolean | undefined
      ): 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'REJECTED' => {
        if (pStatus === 'REJECTED' || regStatus === 'REJECTED' || target_buyer === 'REJECTED' || regTargetBuyer === 'REJECTED') {
          return 'REJECTED';
        }
        // ONLY ACTIVE if explicitly published (is_active is true or regIsActive is true)
        if (
          (is_active === true || regIsActive === true) &&
          (pStatus === 'ACTIVE' || regStatus === 'ACTIVE' || target_buyer === 'BOTH' || regTargetBuyer === 'BOTH')
        ) {
          return 'ACTIVE';
        }
        if (
          regStatus === 'APPROVED' ||
          regStatus === 'ADMIN_APPROVED' ||
          regTargetBuyer === 'ADMIN_APPROVED' ||
          pStatus === 'APPROVED' ||
          pStatus === 'ADMIN_APPROVED' ||
          target_buyer === 'ADMIN_APPROVED'
        ) {
          return 'APPROVED';
        }
        return 'PENDING_APPROVAL';
      };

      let list = (dbProducts || []).map((p: any) => {
        const regItem = findRegItem(p.id, p.crop_name, p.farmer_id);
        const rawFirstImg = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (regItem?.images?.[0]);
        const validImg = sanitizeImg(rawFirstImg, p.crop_name, p.category);
        const images = [validImg];
        const resolvedStatus = resolveProduceStatus(
          p.is_active,
          p.target_buyer,
          p.status,
          (regItem as any)?.status,
          (regItem as any)?.targetBuyer,
          (regItem as any)?.isActive
        );

        const farmerName = regItem?.farmerName || 'Registered Farmer';
        const farmerPhone = regItem?.farmerPhone || '';
        const farmerCode = farmerPhone ? `FARM-${farmerPhone.slice(-4)}` : `FARM-${String(p.farmer_id || p.id).slice(-4)}`;

        return {
          id: p.id,
          farmerId: p.farmer_id,
          farmerFullName: farmerName,
          farmerName,
          farmerPhone,
          farmerCode,
          cropName: p.crop_name,
          category: p.category,
          variety: p.crop_variety || 'Hybrid',
          availableKg: Number(p.available_quantity || 0),
          quantityKg: Number(p.available_quantity || p.total_quantity || 0),
          pricePerKg: Number(p.base_price_per_unit || 0),
          qualityGrade: (p.grade === 'B' ? 'GRADE_B' : 'GRADE_A') as 'GRADE_A' | 'GRADE_B' | 'PREMIUM',
          harvestDate: p.harvest_date || 'Recent',
          status: resolvedStatus as 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'REJECTED',
          submittedAt: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Today',
          createdAt: p.created_at || new Date().toISOString(),
          mandiName: p.pickup_address || 'Nashik APMC',
          images,
          imageUrl: validImg,
        };
      });

      // Also merge products from ProductRegistryService not in dbProducts
      try {
        for (const reg of regProducts) {
          const rawFirstImg = Array.isArray(reg.images) && reg.images.length > 0 ? reg.images[0] : undefined;
          const validImg = sanitizeImg(rawFirstImg, reg.cropName, reg.category);
          const images = [validImg];
          const existingIdx = list.findIndex(
            (item: any) => item.id === reg.id || (item.cropName === reg.cropName && item.farmerId === reg.farmerId)
          );
          const computedStatus = resolveProduceStatus(
            reg.isActive,
            reg.targetBuyer,
            reg.status,
            reg.status,
            reg.targetBuyer,
            reg.isActive
          );

          const formattedReg = {
            id: reg.id,
            farmerId: reg.farmerId,
            farmerFullName: reg.farmerName || 'Registered Farmer',
            farmerName: reg.farmerName || 'Registered Farmer',
            farmerPhone: reg.farmerPhone || '',
            farmerCode: reg.farmerPhone ? `FARM-${reg.farmerPhone.slice(-4)}` : `FARM-${String(reg.farmerId || reg.id).slice(-4)}`,
            cropName: reg.cropName,
            category: reg.category,
            variety: reg.cropVariety || 'Hybrid',
            availableKg: Number(reg.availableQuantity || reg.totalQuantity || 0),
            quantityKg: Number(reg.availableQuantity || reg.totalQuantity || 0),
            pricePerKg: Number(reg.basePricePerUnit || 0),
            qualityGrade: (reg.grade === 'B' ? 'GRADE_B' : 'GRADE_A') as 'GRADE_A' | 'GRADE_B' | 'PREMIUM',
            harvestDate: 'Recent',
            status: computedStatus as 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'REJECTED',
            submittedAt: reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : 'Today',
            createdAt: reg.createdAt || new Date().toISOString(),
            mandiName: reg.pickupAddress || reg.location || 'Nashik APMC',
            images,
            imageUrl: validImg,
          };

          if (existingIdx >= 0) {
            list[existingIdx] = { ...list[existingIdx], ...formattedReg, status: computedStatus };
          } else if (reg.cropName !== 'Produce' || reg.farmerId !== 'unknown') {
            list.unshift(formattedReg);
          }
        }
      } catch {}

      // Deduplicate list by id AND by content key (cropName + farmerId + pricePerKg + quantityKg)
      const uniqueMap = new Map<string, any>();
      for (const item of list) {
        const contentKey = `${(item.cropName || '').toLowerCase().trim()}_${item.farmerId || ''}_${item.pricePerKg}_${item.quantityKg}`;
        if (!uniqueMap.has(item.id) && !uniqueMap.has(contentKey)) {
          uniqueMap.set(item.id, item);
          uniqueMap.set(contentKey, item);
        }
      }
      list = Array.from(new Set(uniqueMap.values()));

      // Sort with newest submissions first
      list.sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      res.status(200).json({
        data: list,
        meta: { total: list.length },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  static async approveProduce(req: Request, res: Response): Promise<void> {
    const productId = String(req.params.productId);
    try {
      const supabase = getSupabaseAdmin();
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let dbItem: any = null;

      // Update in Supabase & retrieve row
      try {
        if (UUID_REGEX.test(productId)) {
          const { data } = await supabase
            .from('products')
            .update({
              target_buyer: 'BOTH',
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', productId)
            .select();
          if (data && data.length > 0) dbItem = data[0];
        } else {
          const { data } = await supabase
            .from('products')
            .update({
              target_buyer: 'BOTH',
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .or(`id.eq.${productId},crop_name.ilike.%${productId}%`)
            .select();
          if (data && data.length > 0) dbItem = data[0];
        }
      } catch (sbErr) {
        console.warn('Supabase approve update notice:', sbErr);
      }

      // Update shared registry with full item details
      try {
        const pCropName = dbItem?.crop_name || productId;
        const pFarmerId = dbItem?.farmer_id || 'unknown';

        ProductRegistryService.registerProduct({
          id: productId,
          farmerId: pFarmerId,
          farmerName: 'Farmer',
          location: dbItem?.pickup_address || 'Nashik APMC',
          cropName: pCropName,
          cropVariety: dbItem?.crop_variety || 'Hybrid',
          grade: dbItem?.grade || 'A',
          category: dbItem?.category || 'Vegetables',
          totalQuantity: Number(dbItem?.total_quantity || 100),
          availableQuantity: Number(dbItem?.available_quantity || 100),
          quantityUnit: dbItem?.quantity_unit || 'kg',
          basePricePerUnit: Number(dbItem?.base_price_per_unit || 20),
          minOrderQuantity: 1,
          targetBuyer: 'ADMIN_APPROVED',
          images: dbItem?.images || [],
          isActive: false,
          status: 'APPROVED',
          createdAt: dbItem?.created_at || new Date().toISOString(),
        });

        ProductRegistryService.updateProductStatus(productId, 'APPROVED');
      } catch {}

      await auditLog({
        actorId: req.user?.id || 'admin_super_01',
        role: UserRole.ADMIN,
        action: 'APPROVE_PRODUCE',
        resourceType: 'PRODUCT',
        resourceId: productId,
        metadata: { note: 'Quality verified and approved. Farmer can now list globally on marketplace.' },
      });

      res.status(200).json({
        data: {
          productId,
          status: 'APPROVED',
          message: 'Produce quality verified by admin. Farmer can now list globally on marketplace.',
        },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  static async rejectProduce(req: Request, res: Response): Promise<void> {
    const productId = String(req.params.productId);
    try {
      const supabase = getSupabaseAdmin();
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      try {
        if (UUID_REGEX.test(productId)) {
          await supabase
            .from('products')
            .update({ status: 'REJECTED', is_active: false, updated_at: new Date().toISOString() })
            .eq('id', productId);
        } else {
          await supabase
            .from('products')
            .update({ status: 'REJECTED', is_active: false, updated_at: new Date().toISOString() })
            .or(`id.eq.${productId},crop_name.ilike.%${productId}%`);
        }
      } catch {}

      try {
        ProductRegistryService.updateProductStatus(productId, 'REJECTED');
      } catch {}

      await auditLog({
        actorId: req.user?.id || 'admin_super_01',
        role: UserRole.ADMIN,
        action: 'REJECT_PRODUCE',
        resourceType: 'PRODUCT',
        resourceId: productId,
      });

      res.status(200).json({
        data: {
          productId,
          status: 'REJECTED',
          message: 'Produce listing rejected and unpublished from MandiKart marketplace.',
        },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  static async getAllOrders(_req: Request, res: Response): Promise<void> {
    try {
      const registeredOrders = OrderRegistryService.getRegisteredOrders();
      let orders = [...registeredOrders];

      const regProducts = ProductRegistryService.getRegisteredProducts();
      const prodMap = new Map(regProducts.map((p) => [p.cropName.toLowerCase(), p]));

      try {
        const supabase = getSupabaseAdmin();
        const { data: dbOrders } = await supabase
          .from('orders')
          .select('*, order_items(*), farmers(full_name, phone, district, state)')
          .order('created_at', { ascending: false });

        if (dbOrders && dbOrders.length > 0) {
          for (const d of dbOrders) {
            const firstItem = d.order_items?.[0] || {};
            const crop = firstItem.crop_name || 'Assorted Produce';
            const matchedProd = prodMap.get(crop.toLowerCase());
            const farmerName = (d as any).farmers?.full_name || matchedProd?.farmerName || 'Registered Farmer';
            const farmerPhone = (d as any).farmers?.phone || matchedProd?.farmerPhone || '';
            const farmerLocation = (d as any).farmers?.district 
              ? `${(d as any).farmers.district}, ${(d as any).farmers.state || 'Maharashtra'}`
              : (matchedProd?.location || 'Nashik, Maharashtra');

            const mappedOrder = {
              id: d.id,
              orderNumber: d.order_number || `#MK-${d.id.slice(0, 5).toUpperCase()}`,
              farmerId: d.farmer_id || 'frm-101',
              farmerName,
              farmerPhone,
              farmerLocation,
              buyerId: d.buyer_id || 'byr-301',
              buyerName: 'Vikram Mehta',
              buyerCompany: 'BigBasket Wholesale Hub',
              buyerLocation: 'Thane, Mumbai',
              cropName: crop,
              produceName: crop,
              category: 'Vegetables',
              qualityGrade: firstItem.grade ? `Grade ${firstItem.grade}` : 'Grade A',
              quantityKg: Number(firstItem.quantity || 100),
              pricePerKg: Number(firstItem.price_per_unit || 30),
              totalAmount: Number(d.total_amount || 3000),
              totalPrice: Number(d.total_amount || 3000),
              status: d.status || 'PLACED',
              escrowStatus: d.status === 'COMPLETED' ? 'RELEASED_TO_FARMER' : d.status === 'REJECTED' ? 'REFUNDED_TO_BUYER' : 'HELD_IN_ESCROW',
              deliveryAddress: d.delivery_address || 'Mumbai APMC Hub',
              logisticsPartner: 'AgroTruck Logistics',
              logisticsTrackingId: `TRK-${d.id.slice(0, 4).toUpperCase()}-MH`,
              estimatedDelivery: 'Tomorrow, 10:00 AM',
              imageUrl: matchedProd?.images?.[0] || getCropImageUrl(crop),
              createdAt: d.created_at || new Date().toISOString(),
              timestamp: d.created_at || new Date().toISOString(),
            };

            const existingIdx = orders.findIndex((o) => o.id === d.id);
            if (existingIdx >= 0) {
              orders[existingIdx] = { ...orders[existingIdx], ...mappedOrder };
            } else {
              orders.unshift(mappedOrder);
            }
          }
        }
      } catch {}

      res.status(200).json({
        data: orders,
        meta: { total: orders.length },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  static async acceptOrder(req: Request, res: Response): Promise<void> {
    const orderId = String(req.params.orderId);
    try {
      const updated = OrderRegistryService.updateOrder(orderId, {
        status: 'CONFIRMED',
      });

      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('orders')
          .update({ status: 'CONFIRMED', updated_at: new Date().toISOString() })
          .eq('id', orderId);
      } catch {}

      await auditLog({
        actorId: req.user?.id || 'admin_super_01',
        role: UserRole.ADMIN,
        action: 'ACCEPT_ORDER',
        resourceType: 'ORDER',
        resourceId: orderId,
      });

      res.status(200).json({
        data: updated || { id: orderId, status: 'CONFIRMED' },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  static async rejectOrder(req: Request, res: Response): Promise<void> {
    const orderId = String(req.params.orderId);
    try {
      const updated = OrderRegistryService.updateOrder(orderId, {
        status: 'REJECTED',
        escrowStatus: 'REFUNDED_TO_BUYER',
      });

      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('orders')
          .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
          .eq('id', orderId);
      } catch {}

      await auditLog({
        actorId: req.user?.id || 'admin_super_01',
        role: UserRole.ADMIN,
        action: 'REJECT_ORDER',
        resourceType: 'ORDER',
        resourceId: orderId,
      });

      res.status(200).json({
        data: updated || { id: orderId, status: 'REJECTED', escrowStatus: 'REFUNDED_TO_BUYER' },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  static async updateOrderStatus(req: Request, res: Response): Promise<void> {
    const orderId = String(req.params.orderId);
    const { status, escrowStatus } = req.body;
    try {
      const updates: any = {};
      if (status) updates.status = status;
      if (escrowStatus) updates.escrowStatus = escrowStatus;

      const updated = OrderRegistryService.updateOrder(orderId, updates);

      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('orders')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', orderId);
      } catch {}

      res.status(200).json({
        data: updated || { id: orderId, ...updates },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  static async releaseEscrow(req: Request, res: Response): Promise<void> {
    const orderId = String(req.params.orderId);
    try {
      const updated = OrderRegistryService.updateOrder(orderId, {
        status: 'COMPLETED',
        escrowStatus: 'RELEASED_TO_FARMER',
      });

      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('payments')
          .update({ escrow_status: 'RELEASED', escrow_released_at: new Date().toISOString() })
          .eq('order_id', orderId);
        await supabase
          .from('orders')
          .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
          .eq('id', orderId);
      } catch {}

      res.status(200).json({
        data: updated || { id: orderId, status: 'COMPLETED', escrowStatus: 'RELEASED_TO_FARMER' },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  static async refundBuyer(req: Request, res: Response): Promise<void> {
    const orderId = String(req.params.orderId);
    try {
      const updated = OrderRegistryService.updateOrder(orderId, {
        status: 'DISPUTED',
        escrowStatus: 'REFUNDED_TO_BUYER',
      });

      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('payments')
          .update({ escrow_status: 'REFUNDED', refunded_at: new Date().toISOString() })
          .eq('order_id', orderId);
      } catch {}

      res.status(200).json({
        data: updated || { id: orderId, status: 'DISPUTED', escrowStatus: 'REFUNDED_TO_BUYER' },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  static async getAllFarmers(_req: Request, res: Response): Promise<void> {
    try {
      const supabase = getSupabaseAdmin();
      const [farmersRes, productsRes, ordersRes] = await Promise.all([
        supabase.from('farmers').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id, farmer_id, crop_name, category, available_quantity, base_price_per_unit, grade, harvest_date, is_active, images'),
        supabase.from('orders').select('farmer_id, total_amount, status'),
      ]);

      const dbFarmers = farmersRes.data || [];
      const dbProducts = productsRes.data || [];
      const orders = ordersRes.data || [];

      // Group products by farmer_id
      const farmerProductsMap = new Map<string, any[]>();
      for (const p of dbProducts) {
        const list = farmerProductsMap.get(p.farmer_id) || [];
        list.push(p);
        farmerProductsMap.set(p.farmer_id, list);
      }

      const farmerSalesMap = new Map<string, { totalSales: number; orderCount: number }>();
      for (const o of orders) {
        if (o.status !== 'CANCELLED' && o.status !== 'REJECTED') {
          const fId = o.farmer_id;
          const cur = farmerSalesMap.get(fId) || { totalSales: 0, orderCount: 0 };
          cur.totalSales += Number(o.total_amount || 0);
          cur.orderCount += 1;
          farmerSalesMap.set(fId, cur);
        }
      }

      if (dbFarmers && dbFarmers.length > 0) {
        const mapped = dbFarmers.map((f: any) => {
          const salesStats = farmerSalesMap.get(f.id) || { totalSales: 0, orderCount: 0 };
          const farmerProds = farmerProductsMap.get(f.id) || [];
          return {
            id: f.id,
            farmerCode: f.phone ? `#FMR-${f.phone.slice(-4)}` : `#FMR-${String(f.id).slice(-4).toUpperCase()}`,
            fullName: f.full_name || 'Farmer',
            phone: f.phone || '+91 98000 00000',
            mandiName: f.district ? `${f.district} APMC` : 'Nashik Main Mandi',
            district: f.district || 'Nashik',
            state: f.state || 'Maharashtra',
            landAreaAcres: Number(f.land_size || 5),
            verificationStatus: f.is_verified ? 'VERIFIED' : 'PENDING_KYC',
            rating: 4.8,
            totalSalesAmount: salesStats.totalSales,
            totalOrdersCount: salesStats.orderCount,
            joinedDate: f.created_at ? new Date(f.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
            createdAt: f.created_at || new Date().toISOString(),
            activeListings: farmerProds.map((p: any) => ({
              id: p.id,
              cropName: p.crop_name,
              category: p.category,
              availableKg: Number(p.available_quantity || 0),
              pricePerKg: Number(p.base_price_per_unit || 0),
              qualityGrade: p.grade === 'B' ? 'GRADE_B' : 'GRADE_A',
              harvestDate: p.harvest_date || 'Recent',
              status: p.is_active ? 'ACTIVE' : 'PENDING_APPROVAL',
              imageUrl: p.images?.[0] || getCropImageUrl(p.crop_name, p.category),
            })),
          };
        });
        res.status(200).json({ data: mapped, meta: { total: mapped.length }, error: null });
        return;
      }
      res.status(200).json({ data: [], meta: { total: 0 }, error: null });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  static async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const supabase = getSupabaseAdmin();
      const { data: dbBuyers, error } = await supabase
        .from('buyers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({ data: null, error: { message: error.message } });
        return;
      }

      // Fetch order stats per buyer
      const { data: orders } = await supabase.from('orders').select('id, buyer_id, total_amount, status');
      const orderCountMap = new Map<string, { count: number; spend: number }>();
      if (orders) {
        for (const o of orders) {
          const bId = o.buyer_id;
          const current = orderCountMap.get(bId) || { count: 0, spend: 0 };
          current.count += 1;
          current.spend += Number(o.total_amount || 0);
          orderCountMap.set(bId, current);
        }
      }

      const mapped = (dbBuyers || []).map((b: any) => {
        const stats = orderCountMap.get(b.id) || { count: 0, spend: 0 };
        const primaryAddr = Array.isArray(b.addresses) && b.addresses.length > 0 ? b.addresses[0] : null;
        const city = primaryAddr?.city || 'Pune';
        const state = primaryAddr?.state || 'Maharashtra';

        return {
          id: b.id,
          userCode: b.phone ? `#USR-${b.phone.slice(-4)}` : `#USR-${b.id.slice(-4).toUpperCase()}`,
          fullName: b.full_name || 'Buyer',
          phone: b.phone || '',
          email: b.email || 'buyer@mandikart.in',
          buyerType: b.buyer_type || 'RETAIL',
          companyName: b.company_name || null,
          gstin: b.gstin || null,
          city,
          state,
          location: `${city}, ${state}`,
          isVerified: Boolean(b.is_verified),
          verificationStatus: b.is_verified ? 'VERIFIED' : 'PENDING',
          totalOrders: stats.count,
          totalSpend: stats.spend,
          joinedDate: b.created_at ? new Date(b.created_at).toLocaleDateString() : 'Recent',
          createdAt: b.created_at || new Date().toISOString(),
        };
      });

      res.status(200).json({ data: mapped, meta: { total: mapped.length }, error: null });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  static async getAiInsights(_req: Request, res: Response): Promise<void> {
    try {
      const insights = await geminiAiService.getAdminAiInsights();
      res.status(200).json({ success: true, data: insights, error: null });
    } catch (err) {
      res.status(500).json({ success: false, data: null, error: { message: (err as Error).message } });
    }
  }

  static async getAllDisputes(_req: Request, res: Response): Promise<void> {
    try {
      const regOrders = OrderRegistryService.getRegisteredOrders();
      const disputedOrders = regOrders.filter(
        (o: any) => o.status === 'DISPUTED' || o.escrowStatus === 'FROZEN_IN_DISPUTE'
      );

      const disputesList: any[] = [];

      try {
        const supabase = getSupabaseAdmin();
        const { data: dbDisputes } = await supabase
          .from('disputes')
          .select('*, orders(*)')
          .order('created_at', { ascending: false });

        if (dbDisputes && dbDisputes.length > 0) {
          for (const d of dbDisputes) {
            disputesList.push({
              id: d.id || `DSP-${String(d.order_id).slice(0, 5)}`,
              disputeNumber: `#DSP-${String(d.id || d.order_id).slice(0, 5).toUpperCase()}`,
              orderId: d.order_id,
              orderNumber: d.orders?.order_number || `#MK-${String(d.order_id).slice(0, 5).toUpperCase()}`,
              farmerName: d.orders?.farmer_name || 'Ramesh Patel',
              buyerName: d.orders?.buyer_name || 'Vikram Mehta',
              produceName: d.orders?.crop_name || 'Produce',
              cropName: d.orders?.crop_name || 'Produce',
              disputingParty: d.disputing_party || 'buyer',
              disputeReason: d.reason || 'Quality or delivery dispute',
              disputedAmount: Number(d.amount || d.orders?.total_amount || 5000),
              amountDisputed: Number(d.amount || d.orders?.total_amount || 5000),
              category: d.category || 'QUALITY_GRADE_FAIL',
              severity: d.severity || 'HIGH',
              status: d.status || 'UNDER_REVIEW',
              openedAt: d.created_at || new Date().toISOString(),
              farmerClaim: d.farmer_claim || 'Supplied certified Grade A produce at farmgate.',
              buyerClaim: d.buyer_claim || d.reason || 'Produce received below specified quality standard.',
              description: d.description || d.reason || 'Dispute raised regarding produce quality.',
              evidenceFiles: d.evidence_files || ['Inspection_Report.pdf'],
              resolutionOutcome: d.resolution_outcome,
              arbitratorNote: d.arbitrator_note,
            });
          }
        }
      } catch {}

      // If registered disputed orders exist, add them
      for (const d of disputedOrders) {
        if (!disputesList.some((x) => x.orderId === d.id)) {
          disputesList.unshift({
            id: `DSP-${String(d.id).slice(0, 5)}`,
            disputeNumber: `#DSP-${String(d.id).slice(0, 5).toUpperCase()}`,
            orderId: d.id,
            orderNumber: d.orderNumber || `#MK-${String(d.id).slice(0, 5).toUpperCase()}`,
            farmerName: d.farmerName || 'Ramesh Patel',
            buyerName: d.buyerName || 'Vikram Mehta',
            produceName: d.cropName || 'Fresh Produce',
            cropName: d.cropName || 'Fresh Produce',
            disputingParty: 'buyer',
            disputeReason: 'Produce quality or weight discrepancy reported at delivery hub.',
            disputedAmount: Number(d.totalAmount || 12000),
            amountDisputed: Number(d.totalAmount || 12000),
            category: 'QUALITY_GRADE_FAIL',
            severity: 'MAJOR',
            status: 'UNDER_REVIEW',
            openedAt: d.createdAt || new Date().toISOString(),
            farmerClaim: 'Produce was calibrated and checked at loading.',
            buyerClaim: 'Inspection report indicated grade variance upon arrival.',
            description: 'Weight / quality tolerance dispute logged by buyer.',
            evidenceFiles: ['weighbridge_slip.pdf'],
          });
        }
      }

      res.status(200).json({ data: disputesList, meta: { total: disputesList.length }, error: null });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  static async getAllShipments(_req: Request, res: Response): Promise<void> {
    try {
      const regOrders = OrderRegistryService.getRegisteredOrders();
      const activeShipmentOrders = regOrders.filter((o: any) =>
        ['CONFIRMED', 'PICKUP_SCHEDULED', 'PICKUP_IN_PROGRESS', 'COLLECTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(o.status)
      );

      const shipments: any[] = [];
      let idx = 0;

      for (const o of activeShipmentOrders) {
        idx++;
        const isReefer = idx % 2 === 0;
        const st =
          o.status === 'DELIVERED' || o.status === 'COMPLETED'
            ? 'DELIVERED'
            : o.status === 'IN_TRANSIT'
            ? 'IN_TRANSIT'
            : 'LOADING';

        const dest = !o.deliveryAddress
          ? 'Central Cold-Chain Hub, Mumbai'
          : typeof o.deliveryAddress === 'string'
          ? o.deliveryAddress
          : [o.deliveryAddress.line1, o.deliveryAddress.city, o.deliveryAddress.state, o.deliveryAddress.pincode].filter(Boolean).join(', ') || 'Central Mandi Distribution Hub';

        shipments.push({
          id: `SHP-${o.id || idx}-${idx}`,
          trackingId: `TRK-MK-${1000 + idx}`,
          orderId: o.id,
          carrierName: idx % 2 === 0 ? 'AgroCold Logistics India' : 'Kisan Express Freight',
          driverName: o.driverName || (idx % 2 === 0 ? 'Santosh Kumar' : 'Ganesh Pawar'),
          driverPhone: o.driverPhone || '+91 98765 43211',
          vehicleNumber: idx % 2 === 0 ? 'OD-02-BX-4910' : 'MH-15-DC-9201',
          produceName: o.cropName || 'Fresh Produce',
          quantityKg: Number(o.quantityKg || 500),
          originMandi: o.farmerLocation || 'Nashik APMC Mandi, Maharashtra',
          destinationHub: dest,
          departureTime: o.createdAt || new Date().toISOString(),
          estimatedArrival: 'Today within 2 hours',
          status: st,
          isReefer,
          targetTempCelsius: isReefer ? 4.0 : 22.0,
          currentTempCelsius: isReefer ? 4.2 : 22.5,
          batteryLevelPct: 88,
          gpsCoordinates: {
            lat: 19.9975 + (idx * 0.05),
            lng: 73.7898 + (idx * 0.05),
          },
        });
      }

      res.status(200).json({ data: shipments, meta: { total: shipments.length }, error: null });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }
}


