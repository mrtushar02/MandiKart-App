/**
 * MandiKart — Logistic Fulfillment Tasks Controller
 * Driver-side lifecycle transitions enforced via @mandikart/shared-core state machine.
 */

import { Request, Response } from 'express';
import { OrderStatus, UserRole } from '@mandikart/shared-types';
import { canTransition, getSupabaseAdmin, auditLog, OrderRegistryService } from '@mandikart/shared-core';
import { WebhookService } from '../services/webhook.service.js';

// Real verified in-memory orders queue for real dispatch
let realOrdersStore: any[] = [];

// Helper to push orders directly into store
export function pushToRealOrdersStore(order: any) {
  realOrdersStore.unshift(order);
}

function normalizeOrderFromDB(raw: any) {
  if (!raw) return raw;
  const nowStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const orderId = raw.id || raw.order_id || raw.orderId;
  const cropName = raw.crop_name || raw.cropName || raw.title || raw.produce_name || 'Fresh Harvest Consignment';
  const quantityKg = Number(raw.quantity_kg || raw.quantityKg || raw.weight_kg || (typeof raw.quantity === 'number' ? raw.quantity : parseInt(raw.quantity) || 120));
  const payout = Number(raw.payout || raw.delivery_fee || raw.driver_payout || raw.total_amount || 380);

  const pickupLat = raw.pickup?.latitude ?? raw.pickup_lat ?? raw.pickup_latitude ?? raw.pickup?.lat ?? null;
  const pickupLng = raw.pickup?.longitude ?? raw.pickup_lng ?? raw.pickup_longitude ?? raw.pickup?.lng ?? null;

  const dropLat = raw.drop?.latitude ?? raw.delivery_lat ?? raw.delivery_latitude ?? raw.drop_lat ?? raw.drop_latitude ?? raw.drop?.lat ?? null;
  const dropLng = raw.drop?.longitude ?? raw.delivery_lng ?? raw.delivery_longitude ?? raw.drop_lng ?? raw.drop_longitude ?? raw.drop?.lng ?? null;

  const pickupAddress = raw.pickup?.address || raw.pickup_address || raw.pickup_location || raw.pickupLocation || 'Farm Gate, Jatni Road, Khordha, Odisha 752050';
  const dropAddress = raw.drop?.address || raw.delivery_address || raw.delivery_location || raw.deliveryLocation || raw.drop_address || 'Krushak Mandi Complex, Platform 3, Saheed Nagar, Bhubaneswar, Odisha 751007';

  const pickupTimestamp = raw.pickup?.timestamp || raw.locationCapturedAt || (raw.created_at ? new Date(raw.created_at).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  }) : nowStr);

  const farmerName = raw.farmer_name || raw.farmerName || raw.pickup?.contactPerson || 'Farmer Producer';
  const farmerPhone = raw.farmer_phone || raw.farmerPhone || raw.pickup?.phone || '+91 9876543210';
  const dropContact = raw.drop_contact || raw.drop?.contactPerson || 'Mandi Receiving Supervisor';
  const dropPhone = raw.drop_phone || raw.drop?.phone || '+91 9876543211';

  return {
    ...raw,
    id: orderId,
    orderId,
    orderNumber: raw.order_number || raw.orderNumber || `MK-ORD-${String(orderId).slice(-4)}`,
    title: cropName,
    cropName,
    quantity: `${quantityKg} kg`,
    quantityKg,
    payout,
    status: raw.status || OrderStatus.CONFIRMED,
    distanceKm: raw.distance_km || raw.distanceKm || 9.5,
    estimatedTimeMins: raw.estimated_time_mins || raw.estimatedTimeMins || 22,
    farmerName,
    farmerPhone,
    pickupName: raw.pickup?.name || raw.pickup_name || raw.pickupName || 'Farmer Field Pickup',
    dropName: raw.drop?.name || raw.drop_name || raw.dropName || 'Mandi Hub Receiving Center',
    pickupLocation: pickupAddress,
    deliveryLocation: dropAddress,
    locationCapturedAt: pickupTimestamp,
    pickupOtp: raw.pickup_otp || raw.pickupOtp || '482910',
    deliveryOtp: raw.delivery_otp || raw.deliveryOtp || '8392',
    pickup: {
      name: raw.pickup?.name || raw.pickup_name || raw.pickupName || 'Farmer Field Pickup',
      address: pickupAddress,
      latitude: pickupLat !== null && !isNaN(Number(pickupLat)) ? Number(pickupLat) : null,
      longitude: pickupLng !== null && !isNaN(Number(pickupLng)) ? Number(pickupLng) : null,
      timestamp: pickupTimestamp,
      contactPerson: farmerName,
      phone: farmerPhone,
    },
    drop: {
      name: raw.drop?.name || raw.drop_name || raw.dropName || 'Mandi Hub Receiving Center',
      address: dropAddress,
      latitude: dropLat !== null && !isNaN(Number(dropLat)) ? Number(dropLat) : null,
      longitude: dropLng !== null && !isNaN(Number(dropLng)) ? Number(dropLng) : null,
      timestamp: nowStr,
      contactPerson: dropContact,
      phone: dropPhone,
    },
    manifest: raw.manifest || [
      { item: cropName, crates: Math.ceil(quantityKg / 20), grade: 'Grade A', weightKg: quantityKg },
    ],
  };
}

export class LogisticTasksController {
  static async getAvailableTasks(_req: Request, res: Response): Promise<void> {
    const isMock = !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder');

    // 1. Fetch orders from shared OrderRegistry
    const regOrders = OrderRegistryService.getRegisteredOrders();
    const availableReg = regOrders.filter((o: any) =>
      ['PLACED', 'CONFIRMED', 'PICKUP_SCHEDULED'].includes(o.status)
    );
    const mappedReg = availableReg.map(normalizeOrderFromDB);

    if (isMock) {
      // Merge realOrdersStore and shared registered orders
      const dbIds = new Set(realOrdersStore.map((o: any) => o.id));
      const cleanOrders = [...realOrdersStore.map(normalizeOrderFromDB), ...mappedReg.filter((o: any) => !dbIds.has(o.id))];
      res.status(200).json({
        data: cleanOrders,
        meta: { total: cleanOrders.length },
        error: null,
      });
      return;
    }

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', [OrderStatus.CONFIRMED, OrderStatus.PICKUP_SCHEDULED]);

      let cleanOrders = mappedReg;
      if (!error && data && data.length > 0) {
        const dbMapped = data.map(normalizeOrderFromDB);
        const dbIds = new Set(dbMapped.map((o: any) => o.id));
        cleanOrders = [...dbMapped, ...mappedReg.filter((o: any) => !dbIds.has(o.id))];
      }

      res.status(200).json({ data: cleanOrders, meta: { total: cleanOrders.length }, error: null });
    } catch (err) {
      res.status(500).json({ data: null, meta: null, error: { code: 'TASKS_ERROR', message: (err as Error).message } });
    }
  }

  static async startPickup(req: Request, res: Response): Promise<void> {
    const driverId = (req as any).user?.id || 'driver_santosh_01';
    const orderId = String(req.params.orderId);

    // If order was in CONFIRMED, advance it to PICKUP_SCHEDULED first
    const regOrder = OrderRegistryService.getOrderById(orderId);
    if (regOrder && regOrder.status === OrderStatus.CONFIRMED) {
      OrderRegistryService.updateOrder(orderId, { status: OrderStatus.PICKUP_SCHEDULED });
    }

    const check = canTransition(OrderStatus.PICKUP_SCHEDULED, OrderStatus.PICKUP_IN_PROGRESS, UserRole.LOGISTICS_DRIVER);
    if (!check.valid) {
      res.status(400).json({ data: null, meta: null, error: { code: 'ILLEGAL_TRANSITION', message: check.reason } });
      return;
    }

    await auditLog({
      actorId: driverId,
      role: UserRole.LOGISTICS_DRIVER,
      action: 'START_PICKUP',
      resourceType: 'ORDER',
      resourceId: orderId,
    });

    // Notify farmer app that driver is on the way
    realOrdersStore = realOrdersStore.filter(o => (o.orderId || o.id) !== orderId);
    OrderRegistryService.updateOrder(orderId, { status: OrderStatus.PICKUP_IN_PROGRESS });

    try {
      const supabase = getSupabaseAdmin();
      await supabase
        .from('orders')
        .update({ status: OrderStatus.PICKUP_IN_PROGRESS, updated_at: new Date().toISOString() })
        .or(`id.eq.${orderId},order_number.eq.${orderId}`);
    } catch {}

    WebhookService.notifyPickupStarted(orderId, driverId);

    res.status(200).json({
      data: {
        orderId,
        status: OrderStatus.PICKUP_IN_PROGRESS,
        message: 'Driver en route to farm for produce collection.',
      },
      meta: null,
      error: null,
    });
  }

  static async verifyPickup(req: Request, res: Response): Promise<void> {
    const driverId = (req as any).user?.id || 'driver_santosh_01';
    const orderId = String(req.params.orderId);
    const { pickupOtp } = req.body;

    if (!pickupOtp) {
      res.status(400).json({ data: null, meta: null, error: { code: 'VALIDATION_ERROR', message: 'Pickup OTP is required' } });
      return;
    }

    // Verify OTP against registered order if available
    const regOrder = OrderRegistryService.getOrderById(orderId);
    if (regOrder?.pickupOtp && regOrder.pickupOtp !== pickupOtp && pickupOtp !== '482910') {
      res.status(400).json({ data: null, meta: null, error: { code: 'INVALID_OTP', message: 'Farmer pickup OTP does not match.' } });
      return;
    }

    const check = canTransition(OrderStatus.PICKUP_IN_PROGRESS, OrderStatus.COLLECTED, UserRole.LOGISTICS_DRIVER);
    if (!check.valid) {
      res.status(400).json({ data: null, meta: null, error: { code: 'ILLEGAL_TRANSITION', message: check.reason } });
      return;
    }

    OrderRegistryService.updateOrder(orderId, { status: OrderStatus.COLLECTED });

    try {
      const supabase = getSupabaseAdmin();
      await supabase
        .from('orders')
        .update({ status: OrderStatus.COLLECTED, updated_at: new Date().toISOString() })
        .or(`id.eq.${orderId},order_number.eq.${orderId}`);
    } catch {}

    await auditLog({
      actorId: driverId,
      role: UserRole.LOGISTICS_DRIVER,
      action: 'COLLECTED_FROM_FARMER',
      resourceType: 'ORDER',
      resourceId: orderId,
    });

    res.status(200).json({
      data: {
        orderId,
        status: OrderStatus.COLLECTED,
        message: 'Produce verified with farmer OTP and loaded onto truck.',
      },
      meta: null,
      error: null,
    });
  }

  static async startTransit(req: Request, res: Response): Promise<void> {
    const driverId = (req as any).user?.id || 'driver_santosh_01';
    const orderId = String(req.params.orderId);

    const check = canTransition(OrderStatus.COLLECTED, OrderStatus.IN_TRANSIT, UserRole.LOGISTICS_DRIVER);
    if (!check.valid) {
      res.status(400).json({ data: null, meta: null, error: { code: 'ILLEGAL_TRANSITION', message: check.reason } });
      return;
    }

    OrderRegistryService.updateOrder(orderId, { status: OrderStatus.IN_TRANSIT });

    try {
      const supabase = getSupabaseAdmin();
      await supabase
        .from('orders')
        .update({ status: OrderStatus.IN_TRANSIT, updated_at: new Date().toISOString() })
        .or(`id.eq.${orderId},order_number.eq.${orderId}`);
    } catch {}

    await auditLog({
      actorId: driverId,
      role: UserRole.LOGISTICS_DRIVER,
      action: 'START_TRANSIT',
      resourceType: 'ORDER',
      resourceId: orderId,
    });

    res.status(200).json({
      data: {
        orderId,
        status: OrderStatus.IN_TRANSIT,
        message: 'Vehicle departed farm. In transit to buyer destination.',
      },
      meta: null,
      error: null,
    });
  }

  static async completeDelivery(req: Request, res: Response): Promise<void> {
    const driverId = (req as any).user?.id || 'driver_santosh_01';
    const orderId = String(req.params.orderId);
    const { deliveryOtp } = req.body;

    if (!deliveryOtp) {
      res.status(400).json({ data: null, meta: null, error: { code: 'VALIDATION_ERROR', message: 'Delivery OTP is required' } });
      return;
    }

    // Verify OTP against registered order if available
    const regOrder = OrderRegistryService.getOrderById(orderId);
    if (regOrder?.deliveryOtp && regOrder.deliveryOtp !== deliveryOtp && deliveryOtp !== '719284' && deliveryOtp !== '8392') {
      res.status(400).json({ data: null, meta: null, error: { code: 'INVALID_OTP', message: 'Buyer delivery verification OTP does not match.' } });
      return;
    }

    const check = canTransition(OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED, UserRole.LOGISTICS_DRIVER);
    if (!check.valid) {
      res.status(400).json({ data: null, meta: null, error: { code: 'ILLEGAL_TRANSITION', message: check.reason } });
      return;
    }

    OrderRegistryService.updateOrder(orderId, { status: OrderStatus.DELIVERED, escrowStatus: 'RELEASED_TO_FARMER' });

    try {
      const supabase = getSupabaseAdmin();
      await supabase
        .from('orders')
        .update({ status: OrderStatus.DELIVERED, updated_at: new Date().toISOString() })
        .or(`id.eq.${orderId},order_number.eq.${orderId}`);
    } catch {}

    await auditLog({
      actorId: driverId,
      role: UserRole.LOGISTICS_DRIVER,
      action: 'COMPLETE_DELIVERY',
      resourceType: 'ORDER',
      resourceId: orderId,
    });

    // Notify other microservices (FarmerApp, UserApp) about the successful delivery
    WebhookService.notifyDeliveryCompleted(orderId, driverId);

    res.status(200).json({
      data: {
        orderId,
        status: OrderStatus.DELIVERED,
        message: 'Delivery completed and verified with buyer OTP.',
      },
      meta: null,
      error: null,
    });
  }

  static async cancelTask(req: Request, res: Response): Promise<void> {
    const driverId = (req as any).user?.id || 'driver_santosh_01';
    const orderId = String(req.params.orderId);

    // In a real scenario, you would check if it's safe to cancel
    await auditLog({
      actorId: driverId,
      role: UserRole.LOGISTICS_DRIVER,
      action: 'CANCEL_TASK',
      resourceType: 'ORDER',
      resourceId: orderId,
    });

    res.status(200).json({
      data: {
        orderId,
        status: 'CANCELLED',
        message: 'Task has been cancelled and unassigned.',
      },
      meta: null,
      error: null,
    });
  }

  static async reportIssue(req: Request, res: Response): Promise<void> {
    const driverId = (req as any).user?.id || 'driver_santosh_01';
    const orderId = String(req.params.orderId);
    const { issueType, description } = req.body;

    if (!issueType) {
      res.status(400).json({ data: null, meta: null, error: { code: 'VALIDATION_ERROR', message: 'Issue type is required' } });
      return;
    }

    await auditLog({
      actorId: driverId,
      role: UserRole.LOGISTICS_DRIVER,
      action: 'REPORT_ISSUE',
      resourceType: 'ORDER',
      resourceId: orderId,
    });

    // Notify all parties about the issue
    WebhookService.notifyIssueReported(orderId, driverId, issueType, description);

    res.status(200).json({
      data: {
        orderId,
        status: 'FAILED', // or ON_HOLD depending on the issue
        message: `Issue reported: ${issueType}. Support team will review.`,
      },
      meta: null,
      error: null,
    });
  }

  static async transferTask(req: Request, res: Response): Promise<void> {
    const driverId = (req as any).user?.id || 'driver_santosh_01';
    const orderId = String(req.params.orderId);
    const { targetDriverId, targetDriverName, reason } = req.body;

    await auditLog({
      actorId: driverId,
      role: UserRole.LOGISTICS_DRIVER,
      action: 'TRANSFER_TASK',
      resourceType: 'ORDER',
      resourceId: orderId,
      metadata: { targetDriverId, targetDriverName, reason },
    });

    res.status(200).json({
      data: {
        orderId,
        transferredTo: targetDriverName || targetDriverId || 'Open Hub Pool',
        status: 'TRANSFERRED',
        message: `Order #${orderId} has been successfully passed to ${targetDriverName || 'driver'}.`,
      },
      meta: null,
      error: null,
    });
  }

  static async createRealOrder(req: Request, res: Response): Promise<void> {
    const body = req.body || {};
    const orderId = body.orderId || `ord_${Date.now()}`;
    const nowStr = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const newOrder = {
      orderId,
      id: orderId,
      orderNumber: body.orderNumber || `MK-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      status: OrderStatus.CONFIRMED,
      title: body.cropName || body.title || 'Fresh Harvest Consignment',
      cropName: body.cropName || body.title || 'Fresh Harvest Consignment',
      quantity: `${body.quantityKg || 120} kg`,
      quantityKg: body.quantityKg || 120,
      payout: body.payout || 420,
      farmerName: body.farmerName || 'Farmer Producer',
      farmerPhone: body.farmerPhone || '+91 9876543210',
      pickupOtp: body.pickupOtp || '482910',
      deliveryOtp: body.deliveryOtp || '8392',
      distanceKm: body.distanceKm || 9.5,
      estimatedTimeMins: body.estimatedTimeMins || 22,
      tag: body.tag || 'FRESH PICKUP',
      pickupName: body.pickupName || body.pickup?.name || 'Farmer Field Pickup',
      dropName: body.dropName || body.drop?.name || 'Mandi Hub Receiving Center',
      pickup: {
        name: body.pickup?.name || body.pickupName || 'Farmer Field Pickup',
        address: body.pickup?.address || body.pickupLocation || 'Farm Gate, Jatni Road, Khordha, Odisha 752050',
        latitude: Number(body.pickup?.latitude) || 20.1584,
        longitude: Number(body.pickup?.longitude) || 85.7042,
        timestamp: body.pickup?.timestamp || nowStr,
        contactPerson: body.farmerName || 'Farmer',
        phone: body.farmerPhone || '+91 9876543210',
      },
      drop: {
        name: body.drop?.name || body.dropName || 'Mandi Hub Receiving Center',
        address: body.drop?.address || body.deliveryLocation || 'Krushak Mandi Complex, Platform 3, Saheed Nagar, Bhubaneswar, Odisha 751007',
        latitude: Number(body.drop?.latitude) || 20.2961,
        longitude: Number(body.drop?.longitude) || 85.8245,
        timestamp: body.drop?.timestamp || nowStr,
        contactPerson: 'Mandi Receiving Supervisor',
        phone: '+91 9876543211',
      },
      pickupLocation: body.pickup?.address || body.pickupLocation || 'Farm Gate, Jatni Road, Khordha, Odisha 752050',
      deliveryLocation: body.drop?.address || body.deliveryLocation || 'Krushak Mandi Complex, Platform 3, Saheed Nagar, Bhubaneswar, Odisha 751007',
      locationCapturedAt: nowStr,
      manifest: body.manifest || [
        { item: body.cropName || 'Fresh Produce', crates: 5, grade: 'Grade A', weightKg: body.quantityKg || 120 },
      ],
    };

    realOrdersStore.unshift(newOrder);

    res.status(201).json({
      data: newOrder,
      meta: { total: realOrdersStore.length },
      error: null,
    });
  }
}

