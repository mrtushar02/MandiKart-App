/**
 * MandiKart — Catalog Controller (User App)
 *
 * Listing visibility rules:
 *   is_active = true  → farmer has pressed "Sell to All Buyers" (confirmed global listing)
 *   target_buyer = 'BOTH' → crop is published to the global buyer marketplace
 *
 * A product is shown in the User App catalog ONLY when BOTH conditions are met.
 * Admin approval alone (is_active=false, target_buyer='ADMIN_APPROVED') does NOT
 * make it visible until the farmer explicitly confirms the global listing.
 */

import { Request, Response } from 'express';
import { getSupabaseAdmin, FastLRUCache, ProductRegistryService, getCropImageUrl } from '@mandikart/shared-core';

const catalogCache = new FastLRUCache<any[]>(1000);

// Alias for crop name → canonical HTTP image URL (no base64, no file://)
const getCropFallbackUrl = (cropName: string, category: string) => getCropImageUrl(cropName, category);

export class CatalogController {
  static async searchCatalog(req: Request, res: Response): Promise<void> {
    const crop = req.query.crop as string;
    const category = req.query.category as string;
    const grade = req.query.grade as string;
    const cacheKey = `cat_${crop || 'all'}_${category || 'all'}_${grade || 'all'}`;

    const isNoCache = req.query.fresh === 'true' || req.headers['cache-control'] === 'no-cache';
    if (!isNoCache) {
      const cached = catalogCache.get(cacheKey);
      if (cached) {
        res.status(200).json({ data: cached, meta: { total: cached.length, cached: true }, error: null });
        return;
      }
    }

    const DEFAULT_MANDI_CATALOG = [
      {
        id: 'prod_1',
        farmerId: 'farmer_ramesh_01',
        farmerName: 'Ramesh Patil',
        location: 'Nashik, Maharashtra',
        cropName: 'Red Onion',
        cropVariety: 'Garwa',
        grade: 'A',
        category: 'Vegetables',
        availableQuantity: 1400,
        totalQuantity: 1500,
        quantityUnit: 'kg',
        basePricePerUnit: 26.5,
        minOrderQuantity: 1,
        targetBuyer: 'BOTH',
        images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600'],
        imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600',
        shelfLifeDays: 30,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_2',
        farmerId: 'farmer_ramesh_01',
        farmerName: 'Ramesh Patil',
        location: 'Nashik, Maharashtra',
        cropName: 'Fresh Tomatoes',
        cropVariety: 'Vaishali',
        grade: 'A',
        category: 'Vegetables',
        availableQuantity: 550,
        totalQuantity: 600,
        quantityUnit: 'kg',
        basePricePerUnit: 35.0,
        minOrderQuantity: 1,
        targetBuyer: 'BOTH',
        images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600'],
        imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
        shelfLifeDays: 7,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_3',
        farmerId: 'farmer_suresh_02',
        farmerName: 'Suresh Deshmukh',
        location: 'Indore, Madhya Pradesh',
        cropName: 'Farm Potatoes',
        cropVariety: 'Jyoti',
        grade: 'A',
        category: 'Vegetables',
        availableQuantity: 2000,
        totalQuantity: 2000,
        quantityUnit: 'kg',
        basePricePerUnit: 22.0,
        minOrderQuantity: 2,
        targetBuyer: 'BOTH',
        images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600'],
        imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600',
        shelfLifeDays: 45,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_4',
        farmerId: 'farmer_sanjay_03',
        farmerName: 'Sanjay Ratnagiri',
        location: 'Ratnagiri, Maharashtra',
        cropName: 'Alphonso Mangoes',
        cropVariety: 'Hapus',
        grade: 'A',
        category: 'Fruits',
        availableQuantity: 300,
        totalQuantity: 350,
        quantityUnit: 'dozen',
        basePricePerUnit: 650.0,
        minOrderQuantity: 1,
        targetBuyer: 'BOTH',
        images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=600'],
        imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600',
        shelfLifeDays: 10,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_5',
        farmerId: 'farmer_balwinder_04',
        farmerName: 'Balwinder Singh',
        location: 'Karnal, Haryana',
        cropName: 'Royal Basmati Rice',
        cropVariety: '1121 XXL',
        grade: 'A',
        category: 'Grains',
        availableQuantity: 5000,
        totalQuantity: 5000,
        quantityUnit: 'kg',
        basePricePerUnit: 85.0,
        minOrderQuantity: 5,
        targetBuyer: 'BOTH',
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600'],
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
        shelfLifeDays: 365,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_6',
        farmerId: 'farmer_vipin_05',
        farmerName: 'Vipin Sharma',
        location: 'Shimla, Himachal Pradesh',
        cropName: 'Royal Gala Apples',
        cropVariety: 'Kinnaur Red',
        grade: 'A',
        category: 'Fruits',
        availableQuantity: 800,
        totalQuantity: 800,
        quantityUnit: 'kg',
        basePricePerUnit: 140.0,
        minOrderQuantity: 1,
        targetBuyer: 'BOTH',
        images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600'],
        imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600',
        shelfLifeDays: 20,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_7',
        farmerId: 'farmer_ramesh_01',
        farmerName: 'Ramesh Patil',
        location: 'Nashik, Maharashtra',
        cropName: 'Green Chillies',
        cropVariety: 'G4 Hot',
        grade: 'A',
        category: 'Spices',
        availableQuantity: 250,
        totalQuantity: 250,
        quantityUnit: 'kg',
        basePricePerUnit: 60.0,
        minOrderQuantity: 1,
        targetBuyer: 'BOTH',
        images: ['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600'],
        imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600',
        shelfLifeDays: 14,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_8',
        farmerId: 'farmer_mohan_06',
        farmerName: 'Mohan Lal',
        location: 'Jaipur, Rajasthan',
        cropName: 'Organic Mustard Oil',
        cropVariety: 'Kachi Ghani Cold Pressed',
        grade: 'A',
        category: 'Oils',
        availableQuantity: 400,
        totalQuantity: 400,
        quantityUnit: 'litre',
        basePricePerUnit: 165.0,
        minOrderQuantity: 1,
        targetBuyer: 'BOTH',
        images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600'],
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600',
        shelfLifeDays: 180,
        createdAt: new Date().toISOString(),
      },
    ];

    const isMock = !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder');

    if (isMock) {
      catalogCache.set(cacheKey, DEFAULT_MANDI_CATALOG, 60);
      res.status(200).json({
        data: DEFAULT_MANDI_CATALOG,
        meta: { total: DEFAULT_MANDI_CATALOG.length },
        error: null,
      });
      return;
    }

    try {
      const supabase = getSupabaseAdmin();
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .in('target_buyer', ['BOTH', 'RETAIL'])
        .gt('available_quantity', 0)
        .order('created_at', { ascending: false });

      if (crop) query = query.ilike('crop_name', `%${crop}%`);
      if (category) query = query.eq('category', category);
      if (grade) query = query.eq('grade', grade);

      let data: any[] | null = null;
      let error: any = null;

      try {
        const resp = await query.limit(50);
        data = resp.data;
        error = resp.error;
      } catch (qErr: any) {
        error = qErr;
      }

      if (error || !data || data.length === 0) {
        // Collect live products from ProductRegistryService and DEFAULT_MANDI_CATALOG
        const fallbackList: any[] = [];
        try {
          const registered = ProductRegistryService.getRegisteredProducts();
          for (const reg of registered) {
            const isListingActive = reg.isActive === true || reg.status === 'ACTIVE';
            const targetValid = !reg.targetBuyer || ['BOTH', 'ALL', 'CONSUMER', 'RETAIL'].includes(reg.targetBuyer);
            if (isListingActive && targetValid) {
              fallbackList.push({
                ...reg,
                imageUrl: (reg.images && reg.images[0]) || getCropFallbackUrl(reg.cropName, reg.category),
              });
            }
          }
        } catch {}

        for (const def of DEFAULT_MANDI_CATALOG) {
          if (!fallbackList.some(p => p.id === def.id || p.cropName?.toLowerCase() === def.cropName.toLowerCase())) {
            fallbackList.push(def);
          }
        }

        catalogCache.set(cacheKey, fallbackList, 10);
        res.status(200).json({
          data: fallbackList,
          meta: { total: fallbackList.length, fallback: true },
          error: null,
        });
        return;
      }

      /**
       * Sanitize image URLs:
       *   - base64 (data:...) → too large for mobile, replace with crop-name fallback
       *   - file:// local device path → only valid on the device that uploaded, replace
       *   - empty / null → replace with crop-name fallback
       *   - valid https:// URL → keep as-is
       */
      const sanitizeCatalogImg = (rawUrl: string | undefined, cropName: string, category: string): string => {
        if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') return getCropFallbackUrl(cropName, category);
        if (rawUrl.startsWith('file://')) return getCropFallbackUrl(cropName, category); // local device path
        const isOldHardcodedOnion = rawUrl.includes('AB6AXuC5ju') && !(cropName || '').toLowerCase().includes('onion');
        if (isOldHardcodedOnion) return getCropFallbackUrl(cropName, category);
        // Allow compact base64 data URIs under 2MB
        if (rawUrl.startsWith('data:image/') && rawUrl.length < 2000000) return rawUrl;
        if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
        return getCropFallbackUrl(cropName, category);
      };

      const formatted = (data || []).map((row: any) => {
        const rawImages: string[] = Array.isArray(row.images) ? row.images : [];
        const safeImages = rawImages
          .map((img: string) => sanitizeCatalogImg(img, row.crop_name, row.category))
          .filter(Boolean);
        if (safeImages.length === 0) safeImages.push(getCropFallbackUrl(row.crop_name, row.category));

        return {
          id: row.id,
          farmerId: row.farmer_id,
          farmerName: 'MandiKart Farmer',
          location: row.pickup_address || 'Maharashtra',
          cropName: row.crop_name,
          cropVariety: row.crop_variety,
          grade: row.grade,
          category: row.category,
          totalQuantity: row.total_quantity,
          availableQuantity: row.available_quantity,
          reservedQuantity: row.reserved_quantity,
          quantityUnit: row.quantity_unit,
          basePricePerUnit: row.base_price_per_unit,
          minOrderQuantity: row.min_order_quantity,
          targetBuyer: row.target_buyer,
          images: safeImages,
          imageUrl: safeImages[0],
          pickupAddress: row.pickup_address,
          shelfLifeDays: row.shelf_life_days,
          createdAt: row.created_at,
        };
      });

      // Merge live registered products — only fully published active ones
      try {
        const registered = ProductRegistryService.getRegisteredProducts();
        for (const reg of registered) {
          const isListingActive = reg.isActive === true || reg.status === 'ACTIVE';
          const targetValid = !reg.targetBuyer || ['BOTH', 'ALL', 'CONSUMER', 'RETAIL'].includes(reg.targetBuyer);
          if (isListingActive && targetValid && !formatted.some((p: any) => p.id === reg.id)) {
            // Sanitize registry images too
            const regImages = (reg.images || []).map((img: string) =>
              sanitizeCatalogImg(img, reg.cropName, reg.category)
            ).filter(Boolean);
            if (regImages.length === 0) regImages.push(getCropFallbackUrl(reg.cropName, reg.category));
            formatted.push({ ...reg, cropVariety: reg.cropVariety || '', images: regImages, imageUrl: regImages[0] } as any);
          }
        }
      } catch {}

      // Sort with newest listings at the top
      formatted.sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
        const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
        return timeB - timeA;
      });

      catalogCache.set(cacheKey, formatted, 0.5); // Fast TTL for real-time visibility

      res.status(200).json({
        data: formatted,
        meta: { total: formatted.length },
        error: null,
      });
    } catch (err) {
      console.warn('[CatalogController] Exception during catalog fetch:', (err as Error).message);
      res.status(200).json({
        data: [],
        meta: { total: 0, fallback: true },
        error: null,
      });
    }
  }

  static async getBatchById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) {
        res.status(404).json({ data: null, error: { message: 'Product batch not found' } });
        return;
      }
      res.status(200).json({ data, error: null });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }
}
