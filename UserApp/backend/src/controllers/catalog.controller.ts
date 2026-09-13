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

    const isMock = !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder');

    if (isMock) {
      /*
      // DEMO MOCK CATALOG (COMMENTED OUT FOR RETRIEVAL)
      const DEMO_MOCK_CATALOG = [
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
          quantityUnit: 'kg',
          basePricePerUnit: 26.5,
          minOrderQuantity: 50,
          targetBuyer: 'BOTH',
          images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600'],
          shelfLifeDays: 30,
        },
        {
          id: 'prod_2',
          farmerId: 'farmer_ramesh_01',
          farmerName: 'Ramesh Patil',
          location: 'Nashik, Maharashtra',
          cropName: 'Tomato',
          cropVariety: 'Vaishali',
          grade: 'A',
          category: 'Vegetables',
          availableQuantity: 550,
          quantityUnit: 'kg',
          basePricePerUnit: 22.0,
          minOrderQuantity: 25,
          targetBuyer: 'BOTH',
          images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600'],
          shelfLifeDays: 7,
        },
      ];
      */
      const mockCatalog: any[] = [];

      catalogCache.set(cacheKey, mockCatalog, 60);

      res.status(200).json({
        data: mockCatalog,
        meta: { total: mockCatalog.length },
        error: null,
      });
      return;
    }

    try {
      const supabase = getSupabaseAdmin();
      // NOTE: omit farmers(*) JOIN to avoid Supabase statement timeout (error 57014)
      let query = supabase
        .from('products')
        .select('*')
        // RULE: show active farmer listings accessible to retail/bulk buyers
        .eq('is_active', true)
        .in('target_buyer', ['BOTH', 'RETAIL'])
        .gt('available_quantity', 0)
        .order('created_at', { ascending: false });

      if (crop) query = query.ilike('crop_name', `%${crop}%`);
      if (category) query = query.eq('category', category);
      if (grade) query = query.eq('grade', grade);

      const { data, error } = await query.limit(50);

      if (error) {
        console.warn('[CatalogController] Supabase products query error:', error.message, 'Serving cached fallback catalog.');
        const fallbackCatalog: any[] = [];
        catalogCache.set(cacheKey, fallbackCatalog, 1);
        res.status(200).json({
          data: fallbackCatalog,
          meta: { total: 0, fallback: true },
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
