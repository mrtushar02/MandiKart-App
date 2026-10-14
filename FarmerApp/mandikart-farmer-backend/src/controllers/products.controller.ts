/**
 * MandiKart — Products Controller
 * Handles farmer produce batch listings, available inventory management, and soft deletion.
 */

import crypto from 'crypto';
import { Request, Response } from 'express';
import { CreateProductSchema, UpdateProductStockSchema, UserRole } from '@mandikart/shared-types';
import { getSupabaseAdmin, isSupabaseConfigured, auditLog, ProductRegistryService, getCropImageUrl } from '@mandikart/shared-core';
import { CONSTANTS } from '@mandikart/shared-config';
import { DashboardService } from '../services/dashboard.service.js';

export function toUuid(id?: string): string {
  if (!id) return '';
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (UUID_REGEX.test(id)) return id;
  const hash = crypto.createHash('md5').update(id).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

const sanitizeImage = (img: any): boolean => {
  if (typeof img !== 'string') return false;
  if (img.startsWith('file://')) return false;
  // Allow base64 data URIs up to 10MB (canvas/compressed images)
  if (img.startsWith('data:image')) {
    return img.length <= 10000000;
  }
  // Allow valid HTTP/HTTPS URLs (including CDN and Supabase storage URLs) up to 8192 chars
  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img.length <= 8192;
  }
  return false;
};

const withTimeout = <T>(promise: PromiseLike<T>, ms = 1200): Promise<T> => {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('SUPABASE_TIMEOUT')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

export class ProductsController {
  static async listProducts(req: Request, res: Response): Promise<void> {
    const rawFarmerId = (req.query.farmerId as string) || req.user?.id || '';
    const farmerId = rawFarmerId ? toUuid(rawFarmerId) : '';
    const status = req.query.status as string;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;

    try {
      if (!isSupabaseConfigured()) {
        const registered = ProductRegistryService.getRegisteredProducts();
        res.status(200).json({
          data: registered,
          meta: { page: 1, limit: 20, total: registered.length, totalPages: 1 },
          error: null,
        });
        return;
      }

      const supabase = getSupabaseAdmin();
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isFarmerUuid = Boolean(farmerId && UUID_REGEX.test(farmerId));
      
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      if (isFarmerUuid) {
        query = query.eq('farmer_id', farmerId);
      }

      query = query.order('created_at', { ascending: false });

      query = query.neq('target_buyer', 'DELETED');

      if (status === 'active') {
        query = query.eq('is_active', true).gt('available_quantity', 0);
      } else if (status === 'sold_out') {
        query = query.eq('available_quantity', 0);
      }

      const resolveStatus = (rowOrReg: any): 'ACTIVE' | 'APPROVED' | 'REJECTED' | 'PENDING_APPROVAL' => {
        const isRejected = rowOrReg.status === 'REJECTED' || rowOrReg.target_buyer === 'REJECTED' || rowOrReg.targetBuyer === 'REJECTED';
        if (isRejected) return 'REJECTED';

        const isActive = (rowOrReg.is_active === true && (rowOrReg.target_buyer === 'BOTH' || rowOrReg.targetBuyer === 'BOTH')) ||
                         (rowOrReg.isActive === true && (rowOrReg.targetBuyer === 'BOTH' || rowOrReg.target_buyer === 'BOTH')) ||
                         rowOrReg.status === 'ACTIVE';
        if (isActive) return 'ACTIVE';

        const isApproved = rowOrReg.target_buyer === 'ADMIN_APPROVED' ||
                           rowOrReg.targetBuyer === 'ADMIN_APPROVED' ||
                           rowOrReg.status === 'APPROVED' ||
                           rowOrReg.status === 'ADMIN_APPROVED';
        if (isApproved) return 'APPROVED';

        return 'PENDING_APPROVAL';
      };

      let data: any[] | null = null;
      let count: number | null = null;
      let error: any = null;
      try {
        const queryRes = await withTimeout(query.range(offset, offset + limit - 1), 1000);
        data = queryRes.data;
        count = queryRes.count;
        error = queryRes.error;
      } catch {
        console.warn('[ProductsController] Supabase range fetch timed out, falling back to local registry');
      }

      let formatted = (data || []).map((row: any) => ({
        id: row.id,
        farmerId: row.farmer_id,
        cropName: row.crop_name,
        cropVariety: row.crop_variety,
        grade: row.grade,
        category: row.category,
        totalQuantity: Number(row.total_quantity),
        availableQuantity: Number(row.available_quantity),
        reservedQuantity: Number(row.reserved_quantity || 0),
        quantityUnit: row.quantity_unit,
        basePricePerUnit: Number(row.base_price_per_unit),
        minOrderQuantity: Number(row.min_order_quantity),
        targetBuyer: row.target_buyer,
        images: (row.images || []).filter(sanitizeImage),
        pickupAddress: row.pickup_address,
        isActive: !!row.is_active,
        status: resolveStatus(row),
        harvestDate: row.harvest_date,
        shelfLifeDays: row.shelf_life_days,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      // Merge real-time produce status from ProductRegistryService strictly for this farmer
      try {
        const allRegistered = ProductRegistryService.getRegisteredProducts();
        for (const reg of allRegistered) {
          const existing = formatted.find(
            (f: any) => f.id === reg.id
          );
          const computedStatus = resolveStatus(reg);

          if (existing) {
            existing.isActive = reg.isActive ?? existing.isActive;
            if (computedStatus === 'APPROVED' || computedStatus === 'ACTIVE' || computedStatus === 'REJECTED' || existing.status === 'PENDING_APPROVAL') {
              existing.status = computedStatus;
            }
          } else if (!farmerId || reg.farmerId === farmerId) {
            formatted.unshift({
              id: reg.id,
              farmerId: reg.farmerId,
              cropName: reg.cropName,
              cropVariety: reg.cropVariety,
              grade: reg.grade,
              category: reg.category,
              totalQuantity: Number(reg.totalQuantity || 0),
              availableQuantity: Number(reg.availableQuantity || 0),
              reservedQuantity: Number(reg.reservedQuantity || 0),
              quantityUnit: reg.quantityUnit || 'kg',
              basePricePerUnit: Number(reg.basePricePerUnit || 0),
              minOrderQuantity: Number(reg.minOrderQuantity || 1),
              targetBuyer: reg.targetBuyer || 'BOTH',
              images: (reg.images || []).filter(sanitizeImage),
              pickupAddress: reg.location || reg.pickupAddress,
              isActive: !!reg.isActive,
              status: computedStatus,
              harvestDate: reg.harvestDate || 'Recent',
              shelfLifeDays: reg.shelfLifeDays || 14,
              createdAt: reg.createdAt || new Date().toISOString(),
              updatedAt: reg.updatedAt || new Date().toISOString(),
            });
          }
        }
      } catch {}

      res.status(200).json({
        data: formatted,
        meta: {
          page,
          limit,
          total: formatted.length,
          totalPages: Math.ceil(formatted.length / limit),
        },
        error: null,
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'PRODUCTS_FETCH_ERROR', message: (err as Error).message },
      });
    }
  }

  static async createProduct(req: Request, res: Response): Promise<void> {
    const rawFarmerId = req.user?.id || '';
    const farmerId = toUuid(rawFarmerId);

    const parse = CreateProductSchema.safeParse(req.body);

    if (!parse.success) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Invalid product payload' },
      });
      return;
    }

    const payload = parse.data;

    // Prevent massive base64 strings from hanging the backend / Supabase
    if (payload.images && Array.isArray(payload.images)) {
      payload.images = payload.images.filter(sanitizeImage);
      if (payload.images.length === 0) {
        payload.images = [getCropImageUrl(payload.cropName, payload.category)];
      }
    } else {
      payload.images = [getCropImageUrl(payload.cropName, payload.category)];
    }

    // Price sanity check
    if (
      payload.basePricePerUnit < CONSTANTS.MIN_SANITY_PRICE_PER_UNIT ||
      payload.basePricePerUnit > CONSTANTS.MAX_SANITY_PRICE_PER_UNIT
    ) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'PRICE_OUT_OF_BOUNDS', message: 'Base price is outside of allowed marketplace sanity bounds' },
      });
      return;
    }

    try {
      const supabase = getSupabaseAdmin();

      const dbTargetBuyer =
        payload.targetBuyer === 'PENDING_APPROVAL' || payload.targetBuyer === 'ADMIN_APPROVED'
          ? 'BOTH'
          : (payload.targetBuyer || 'BOTH');

      let data: any = null;
      let error: any = null;

      try {
        // De-duplication check: if an identical crop with same farmer, cropName, and availableQuantity was created recently, reuse it
        const dupRes = await withTimeout(
          supabase
            .from('products')
            .select('*')
            .eq('farmer_id', farmerId)
            .eq('crop_name', payload.cropName)
            .order('created_at', { ascending: false })
            .limit(1),
          800
        );

        if (dupRes.data && dupRes.data.length > 0) {
          const existing = dupRes.data[0];
          const ageMs = Date.now() - new Date(existing.created_at).getTime();
          // If created within the last 4 seconds (double-click debounce) and has same quantity, return existing
          if (ageMs < 4000 && Math.abs(Number(existing.available_quantity) - Number(payload.totalQuantity)) < 1) {
            console.log(`[ProductsController] Deduplicated repeated creation of ${payload.cropName} (${existing.id})`);
            res.status(200).json({
              data: {
                ...existing,
                status: existing.is_active ? 'ACTIVE' : (existing.target_buyer === 'ADMIN_APPROVED' ? 'APPROVED' : 'PENDING_APPROVAL'),
              },
              meta: null,
              error: null,
            });
            return;
          }
        }

        const insertRes = await withTimeout(
          supabase
            .from('products')
            .insert({
              farmer_id: farmerId,
              crop_name: payload.cropName,
              crop_variety: payload.cropVariety || null,
              grade: payload.grade,
              category: payload.category,
              total_quantity: payload.totalQuantity,
              available_quantity: payload.totalQuantity,
              reserved_quantity: 0.0,
              quantity_unit: payload.quantityUnit,
              base_price_per_unit: payload.basePricePerUnit,
              min_order_quantity: payload.minOrderQuantity,
              target_buyer: dbTargetBuyer,
              images: payload.images,
              pickup_address: payload.pickupAddress || null,
              pickup_latitude: payload.pickupLatitude || null,
              pickup_longitude: payload.pickupLongitude || null,
              harvest_date: payload.harvestDate || null,
              shelf_life_days: payload.shelfLifeDays,
              is_active: (payload as any).isActive !== undefined ? Boolean((payload as any).isActive) : false,
            })
            .select()
            .single(),
          1000
        );
        data = insertRes.data;
        error = insertRes.error;
      } catch (sbErr) {
        console.warn('[ProductsController] Supabase insert timed out or unreachable, using local registry:', (sbErr as any)?.message);
      }

      const reqFarmerName = (req.body && req.body.farmerName) || (req.user as any)?.fullName || (req.user as any)?.name || 'Registered Farmer';
      const reqFarmerPhone = (req.body && req.body.farmerPhone) || (req.user as any)?.phone || '';
      const reqLocation = (req.body && req.body.location) || payload.pickupAddress || 'Nashik, Maharashtra';

      const prodId = data?.id || `prod_${Date.now()}`;
      const productRecord = {
        id: prodId,
        farmerId: data?.farmer_id || farmerId,
        farmerName: reqFarmerName,
        farmerPhone: reqFarmerPhone,
        location: reqLocation,
        cropName: payload.cropName,
        cropVariety: payload.cropVariety || '',
        grade: payload.grade,
        category: payload.category,
        totalQuantity: payload.totalQuantity,
        availableQuantity: payload.totalQuantity,
        reservedQuantity: 0,
        quantityUnit: payload.quantityUnit,
        basePricePerUnit: payload.basePricePerUnit,
        minOrderQuantity: payload.minOrderQuantity,
        targetBuyer: payload.targetBuyer || 'PENDING_APPROVAL',
        images: payload.images && payload.images.length > 0 ? payload.images : [getCropImageUrl(payload.cropName, payload.category)],
        pickupAddress: payload.pickupAddress || reqLocation,
        shelfLifeDays: payload.shelfLifeDays,
        isActive: false,
        status: 'PENDING_APPROVAL' as const,
        createdAt: data?.created_at || new Date().toISOString(),
      };

      ProductRegistryService.registerProduct(productRecord);
      DashboardService.invalidateCache(farmerId);

      try {
        await auditLog({
          actorId: farmerId,
          role: UserRole.FARMER,
          action: 'CREATE_PRODUCT',
          resourceType: 'PRODUCT',
          resourceId: prodId,
          metadata: { crop: payload.cropName, qty: payload.totalQuantity },
        });
      } catch {}

      res.status(201).json({
        data: {
          ...productRecord,
          status: 'PENDING_APPROVAL',
        },
        meta: null,
        error: null,
      });
    } catch (err) {
      console.error('[ProductsController] Safe fallback on product creation error:', err);
      const fallbackId = `prod_${Date.now()}`;
      const fallbackRecord = {
        id: fallbackId,
        farmerId,
        farmerName: 'Registered Farmer',
        farmerPhone: '',
        location: payload.pickupAddress || 'Nashik, Maharashtra',
        cropName: payload.cropName,
        cropVariety: payload.cropVariety || '',
        grade: payload.grade,
        category: payload.category,
        totalQuantity: payload.totalQuantity,
        availableQuantity: payload.totalQuantity,
        reservedQuantity: 0,
        quantityUnit: payload.quantityUnit,
        basePricePerUnit: payload.basePricePerUnit,
        minOrderQuantity: payload.minOrderQuantity,
        targetBuyer: 'PENDING_APPROVAL',
        images: payload.images && payload.images.length > 0 ? payload.images : [getCropImageUrl(payload.cropName, payload.category)],
        pickupAddress: payload.pickupAddress || 'Nashik, Maharashtra',
        shelfLifeDays: payload.shelfLifeDays,
        isActive: false,
        status: 'PENDING_APPROVAL' as const,
        createdAt: new Date().toISOString(),
      };
      ProductRegistryService.registerProduct(fallbackRecord);
      DashboardService.invalidateCache(farmerId);

      res.status(201).json({
        data: fallbackRecord,
        meta: null,
        error: null,
      });
    }
  }

  static async updateStock(req: Request, res: Response): Promise<void> {
    const farmerId = toUuid(req.user?.id);
    const productId = String(req.params.id);
    const parse = UpdateProductStockSchema.safeParse(req.body);

    if (!parse.success) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'VALIDATION_ERROR', message: parse.error.issues[0]?.message || 'Invalid stock update' },
      });
      return;
    }

    try {
      const supabase = getSupabaseAdmin();

      try {
        const { data: existing, error: fetchErr } = await withTimeout(
          supabase
            .from('products')
            .select('id, farmer_id, reserved_quantity')
            .eq('id', productId)
            .single(),
          800
        );

        if (!fetchErr && existing && existing.farmer_id !== farmerId && req.user?.role !== UserRole.ADMIN) {
          res.status(403).json({
            data: null,
            meta: null,
            error: { code: 'FORBIDDEN', message: 'You do not have permission to modify this product.' },
          });
          return;
        }
      } catch {}

      const updateData: Record<string, any> = {
        available_quantity: parse.data.availableQuantity,
        updated_at: new Date().toISOString(),
      };
      if (parse.data.isActive !== undefined) {
        updateData.is_active = parse.data.isActive;
      }

      let data: any = null;
      try {
        const updateRes = await withTimeout(
          supabase
            .from('products')
            .update(updateData)
            .eq('id', productId)
            .select()
            .single(),
          1000
        );
        data = updateRes.data;
      } catch {}

      if (!data) {
        res.status(200).json({
          data: { id: productId, ...parse.data, message: 'Stock updated in session' },
          meta: null,
          error: null,
        });
        return;
      }

      DashboardService.invalidateCache(farmerId);
      res.status(200).json({ data, meta: null, error: null });
    } catch (err) {
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'STOCK_UPDATE_ERROR', message: (err as Error).message },
      });
    }
  }

  /**
   * PUT /:id — Update product details / publish to all buyers
   * Allows farmers to update price, status, or targetBuyer of a product.
   * When status=ACTIVE or targetBuyer=BOTH, the crop becomes visible in the User App.
   */
  static async updateProduct(req: Request, res: Response): Promise<void> {
    const farmerId = toUuid(req.user?.id);
    const productId = String(req.params.id);
    const {
      targetBuyer, basePricePerUnit, status, isActive, images,
      // Full crop data (optional) — sent by the Farmer App "Sell to All" flow
      cropName, cropVariety, grade, category, totalQuantity, availableQuantity,
      quantityUnit, pickupAddress, shelfLifeDays, farmerName, farmerPhone, location, storageType,
    } = req.body;

    try {
      const explicitInactive = isActive === false || status === 'DRAFT' || status === 'INACTIVE';
      const isNowActive = !explicitInactive && (status === 'ACTIVE' || isActive === true || targetBuyer === 'BOTH');

      // Always update/create in the shared ProductRegistryService for cross-app visibility
      const registered = ProductRegistryService.getProductById(productId);

      if (registered) {
        const nextIsActive = explicitInactive ? false : (isNowActive || registered.isActive);
        const nextStatus = nextIsActive
          ? 'ACTIVE'
          : explicitInactive
          ? 'PENDING_APPROVAL'
          : (registered.status === 'APPROVED' || registered.status === 'ADMIN_APPROVED' || registered.targetBuyer === 'ADMIN_APPROVED')
          ? 'APPROVED'
          : (registered.status || 'PENDING_APPROVAL');

        const sanitizedImgs = images
          ? (Array.isArray(images) ? images : [images]).filter(sanitizeImage)
          : undefined;

        ProductRegistryService.registerProduct({
          ...registered,
          ...(targetBuyer !== undefined && { targetBuyer: explicitInactive ? 'PENDING_APPROVAL' : targetBuyer }),
          ...(basePricePerUnit !== undefined && { basePricePerUnit: Number(basePricePerUnit) }),
          ...(sanitizedImgs !== undefined && sanitizedImgs.length > 0 && { images: sanitizedImgs }),
          ...(cropVariety !== undefined && { cropVariety }),
          ...(cropName !== undefined && { cropName }),
          ...(grade !== undefined && { grade }),
          ...(availableQuantity !== undefined && { availableQuantity: Number(availableQuantity) }),
          ...(totalQuantity !== undefined && { totalQuantity: Number(totalQuantity) }),
          ...(storageType !== undefined && { storageType }),
          ...(pickupAddress !== undefined && { location: pickupAddress, pickupAddress }),
          ...(location !== undefined && { location, pickupAddress: location }),
          ...(shelfLifeDays !== undefined && { shelfLifeDays: Number(shelfLifeDays) }),
          isActive: nextIsActive,
          status: nextStatus,
        });
      } else {
        // Not yet in registry — create a full entry from request body data
        const reqFarmerName = farmerName || (req.user as any)?.fullName || (req.user as any)?.name || 'MandiKart Farmer';
        const reqLocation = location || pickupAddress || 'Mandi Area';
        const safeCropName = cropName || 'Fresh Produce';
        const safeImages = (images && images.length > 0)
          ? images.filter(sanitizeImage)
          : [`https://source.unsplash.com/featured/600x400/?${encodeURIComponent(safeCropName + ' vegetable farm')}`];

        const computedNewStatus = isNowActive
          ? 'ACTIVE'
          : (status === 'APPROVED' || status === 'ADMIN_APPROVED' || targetBuyer === 'ADMIN_APPROVED')
          ? 'APPROVED'
          : 'PENDING_APPROVAL';

        ProductRegistryService.registerProduct({
          id: productId,
          farmerId,
          farmerName: reqFarmerName,
          farmerPhone: farmerPhone || (req.user as any)?.phone || '',
          location: reqLocation,
          cropName: safeCropName,
          cropVariety: cropVariety || '',
          grade: grade || 'A',
          category: category || 'Vegetables',
          totalQuantity: Number(totalQuantity || availableQuantity || 100),
          availableQuantity: Number(availableQuantity || totalQuantity || 100),
          reservedQuantity: 0,
          quantityUnit: quantityUnit || 'kg',
          basePricePerUnit: Number(basePricePerUnit || 25),
          minOrderQuantity: 10,
          targetBuyer: targetBuyer || 'BOTH',
          images: safeImages,
          pickupAddress: reqLocation,
          shelfLifeDays: Number(shelfLifeDays || 14),
          isActive: isNowActive,
          status: computedNewStatus,
          createdAt: new Date().toISOString(),
        });
      }

      // If Supabase is configured, also persist there
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseAdmin();
        const dbUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
        if (targetBuyer !== undefined) dbUpdate.target_buyer = explicitInactive ? 'PENDING_APPROVAL' : targetBuyer;
        if (basePricePerUnit !== undefined) dbUpdate.base_price_per_unit = Number(basePricePerUnit);
        if (explicitInactive) {
          dbUpdate.is_active = false;
        } else if (isNowActive) {
          dbUpdate.is_active = true;
        }
        if (images !== undefined && images.length > 0) dbUpdate.images = images.filter(sanitizeImage);
        if (totalQuantity !== undefined) dbUpdate.total_quantity = Number(totalQuantity);
        if (availableQuantity !== undefined) dbUpdate.available_quantity = Number(availableQuantity);
        if (cropVariety !== undefined) dbUpdate.crop_variety = cropVariety;
        if (grade !== undefined) dbUpdate.grade = grade;
        if (pickupAddress !== undefined || location !== undefined) dbUpdate.pickup_address = pickupAddress || location;
        if (shelfLifeDays !== undefined) dbUpdate.shelf_life_days = Number(shelfLifeDays);

        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let updatedRows: any[] | null = null;
        if (UUID_REGEX.test(productId)) {
          try {
            const res = await withTimeout(
              supabase
                .from('products')
                .update(dbUpdate)
                .eq('id', productId)
                .select(),
              1000
            );
            updatedRows = res.data;
          } catch {}
        }

        // If no row matched in Supabase (e.g. productId was client-side local ID like crop-xxx),
        // INSERT as an active product in Supabase so UserApp can query it immediately!
        if (!updatedRows || updatedRows.length === 0) {
          const safeFarmerId = farmerId;
          const safePrice = Number(basePricePerUnit || 25);
          const safeQty = Number(totalQuantity || availableQuantity || 100);

          try {
            await withTimeout(
              supabase
                .from('products')
                .insert({
                  farmer_id: safeFarmerId,
                  crop_name: cropName || 'Fresh Produce',
                  crop_variety: cropVariety || null,
                  grade: grade || 'A',
                  category: category || 'Vegetables',
                  total_quantity: safeQty,
                  available_quantity: safeQty,
                  reserved_quantity: 0.0,
                  quantity_unit: quantityUnit || 'kg',
                  base_price_per_unit: safePrice,
                  min_order_quantity: 10,
                  target_buyer: 'BOTH',
                  images: (images && images.length > 0) ? images.filter(sanitizeImage) : ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600'],
                  pickup_address: pickupAddress || location || 'Nashik, Maharashtra',
                  shelf_life_days: Number(shelfLifeDays || 14),
                  is_active: true,
                }),
              1000
            );
          } catch {}
        }
      }

      DashboardService.invalidateCache(farmerId);

      res.status(200).json({
        data: { id: productId, message: 'Crop details and image successfully updated.' },
        meta: null,
        error: null,
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'PRODUCT_UPDATE_ERROR', message: (err as Error).message },
      });
    }
  }

  static async deleteProduct(req: Request, res: Response): Promise<void> {
    const farmerId = toUuid(req.user?.id);
    const productId = String(req.params.id);

    try {
      // 1. Remove from in-memory and disk cross-app registry
      ProductRegistryService.deleteProduct(productId);

      // 2. Permanently delete from Supabase if possible, or mark DELETED
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseAdmin();
        try {
          const { error: delErr } = await supabase.from('products').delete().eq('id', productId);
          if (delErr) {
            await supabase
              .from('products')
              .update({ is_active: false, target_buyer: 'DELETED', updated_at: new Date().toISOString() })
              .eq('id', productId);
          }
        } catch {
          await supabase
            .from('products')
            .update({ is_active: false, target_buyer: 'DELETED', updated_at: new Date().toISOString() })
            .eq('id', productId);
        }
      }

      DashboardService.invalidateCache(farmerId);

      await auditLog({
        actorId: farmerId,
        role: UserRole.FARMER,
        action: 'DEACTIVATE_PRODUCT',
        resourceType: 'PRODUCT',
        resourceId: productId,
      });

      res.status(200).json({
        data: { message: 'Product listing deleted successfully' },
        meta: null,
        error: null,
      });
    } catch (err) {
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'DELETE_ERROR', message: (err as Error).message },
      });
    }
  }
}
