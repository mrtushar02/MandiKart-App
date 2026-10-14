/**
 * MandiKart — Catalog Controller (User App)
 *
 * Displays live produce listings for consumers/retail buyers.
 * Listings with status APPROVED, ADMIN_APPROVED, or ACTIVE are visible to buyers.
 * Fast timeouts prevent cloud delays from freezing the user experience.
 */

import { Request, Response } from 'express';
import { getSupabaseAdmin, FastLRUCache, ProductRegistryService, getCropImageUrl } from '@mandikart/shared-core';

const catalogCache = new FastLRUCache<any[]>(1000);

// Helper for timeout
const withTimeout = <T>(promise: PromiseLike<T>, ms = 1200): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
};

// Helper to determine if a product listing is visible to buyers
const isVisibleToBuyers = (reg: any): boolean => {
  if (!reg) return false;
  if (reg.status === 'REJECTED' || reg.status === 'PENDING_APPROVAL') return false;
  if (reg.status === 'APPROVED' || reg.status === 'ADMIN_APPROVED' || reg.status === 'ACTIVE' || reg.isActive === true) return true;
  if (['BOTH', 'ALL', 'CONSUMER', 'RETAIL', 'ADMIN_APPROVED'].includes(reg.targetBuyer)) return true;
  return false;
};

// Alias for crop name → canonical HTTP image URL (no base64, no file://)
const getCropFallbackUrl = (cropName: string, category: string) => getCropImageUrl(cropName, category);

const DEFAULT_MANDI_CATALOG = [
  {
    id: 'prod_1',
    farmerId: 'farmer_bashir_01',
    farmerName: 'Bashir Ahmed Wani',
    location: 'Pampore, Jammu & Kashmir',
    cropName: 'Kashmiri Mongra Saffron',
    cropVariety: 'Mongra Grade 1 (GI Certified)',
    grade: 'A',
    category: 'Spices',
    availableQuantity: 45,
    totalQuantity: 50,
    quantityUnit: 'kg',
    basePricePerUnit: 280000.0,
    minOrderQuantity: 1,
    targetBuyer: 'BOTH',
    images: ['https://images.unsplash.com/photo-1608755728617-aefab37d2edd?w=600'],
    imageUrl: 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?w=600',
    shelfLifeDays: 365,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    farmerId: 'farmer_kuttappa_02',
    farmerName: 'Kuttappa Bopanna',
    location: 'Madikeri, Coorg, Karnataka',
    cropName: 'Hass Avocado',
    cropVariety: 'Coorg Hass Premium',
    grade: 'A',
    category: 'Fruits',
    availableQuantity: 1200,
    totalQuantity: 1500,
    quantityUnit: 'kg',
    basePricePerUnit: 340.0,
    minOrderQuantity: 10,
    targetBuyer: 'BOTH',
    images: ['https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600'],
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600',
    shelfLifeDays: 14,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_3',
    farmerId: 'farmer_patel_03',
    farmerName: 'Bhavesh Patel',
    location: 'Bhuj, Kutch, Gujarat',
    cropName: 'Dragon Fruit (Kamalam)',
    cropVariety: 'Red Pitahaya Royal',
    grade: 'A',
    category: 'Fruits',
    availableQuantity: 2800,
    totalQuantity: 3200,
    quantityUnit: 'kg',
    basePricePerUnit: 195.0,
    minOrderQuantity: 15,
    targetBuyer: 'BOTH',
    images: ['https://images.unsplash.com/photo-1527325678964-54921661f888?w=600'],
    imageUrl: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=600',
    shelfLifeDays: 18,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_4',
    farmerId: 'farmer_thakur_04',
    farmerName: 'Sunil Singh Thakur',
    location: 'Doda, Jammu & Kashmir',
    cropName: 'Himalayan Gucchi Mushrooms',
    cropVariety: 'Wild Morel (Morchella)',
    grade: 'A',
    category: 'Vegetables',
    availableQuantity: 65,
    totalQuantity: 80,
    quantityUnit: 'kg',
    basePricePerUnit: 18500.0,
    minOrderQuantity: 1,
    targetBuyer: 'BOTH',
    images: ['https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600'],
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600',
    shelfLifeDays: 180,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_5',
    farmerId: 'farmer_sharma_05',
    farmerName: 'Mahendra Sharma',
    location: 'Solan, Himachal Pradesh',
    cropName: 'Single Clove Black Garlic',
    cropVariety: 'Aged Fermented Himalayan',
    grade: 'A',
    category: 'Vegetables',
    availableQuantity: 400,
    totalQuantity: 500,
    quantityUnit: 'kg',
    basePricePerUnit: 950.0,
    minOrderQuantity: 5,
    targetBuyer: 'BOTH',
    images: ['https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600'],
    imageUrl: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600',
    shelfLifeDays: 120,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_6',
    farmerId: 'farmer_singh_06',
    farmerName: 'Ningthouja Tomba Singh',
    location: 'Imphal East, Manipur',
    cropName: 'Chak-Hao Black Rice',
    cropVariety: 'Aromatic GI Purple-Black',
    grade: 'A',
    category: 'Grains',
    availableQuantity: 3500,
    totalQuantity: 4000,
    quantityUnit: 'kg',
    basePricePerUnit: 240.0,
    minOrderQuantity: 25,
    targetBuyer: 'BOTH',
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
    shelfLifeDays: 365,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_7',
    farmerId: 'farmer_kelkar_07',
    farmerName: 'Dattatray Kelkar',
    location: 'Devgad, Sindhudurg, Maharashtra',
    cropName: 'Ratnagiri Alphonso Mango',
    cropVariety: 'Devgad Hapus (GI Certified)',
    grade: 'A',
    category: 'Fruits',
    availableQuantity: 950,
    totalQuantity: 1200,
    quantityUnit: 'kg',
    basePricePerUnit: 450.0,
    minOrderQuantity: 5,
    targetBuyer: 'BOTH',
    images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=600'],
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600',
    shelfLifeDays: 12,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_8',
    farmerId: 'farmer_mathew_08',
    farmerName: 'George Mathew',
    location: 'Idukki, Kerala',
    cropName: 'Alleppey Green Cardamom',
    cropVariety: '8mm Bold Export Super',
    grade: 'A',
    category: 'Spices',
    availableQuantity: 650,
    totalQuantity: 800,
    quantityUnit: 'kg',
    basePricePerUnit: 2400.0,
    minOrderQuantity: 2,
    targetBuyer: 'BOTH',
    images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600'],
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600',
    shelfLifeDays: 365,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_9',
    farmerId: 'farmer_joseph_09',
    farmerName: 'Thomas Joseph',
    location: 'Wayanad, Kerala',
    cropName: 'Natural Bourbon Vanilla Beans',
    cropVariety: 'Cured Gourmet Pods Grade A',
    grade: 'A',
    category: 'Spices',
    availableQuantity: 180,
    totalQuantity: 220,
    quantityUnit: 'kg',
    basePricePerUnit: 4500.0,
    minOrderQuantity: 1,
    targetBuyer: 'BOTH',
    images: ['https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600'],
    imageUrl: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600',
    shelfLifeDays: 365,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod_10',
    farmerId: 'farmer_deshmukh_10',
    farmerName: 'Rajesh Deshmukh',
    location: 'Mahabaleshwar, Maharashtra',
    cropName: 'Mahabaleshwar Blueberries',
    cropVariety: 'Biloxi Handpicked Punnets',
    grade: 'A',
    category: 'Fruits',
    availableQuantity: 450,
    totalQuantity: 600,
    quantityUnit: 'kg',
    basePricePerUnit: 680.0,
    minOrderQuantity: 2,
    targetBuyer: 'BOTH',
    images: ['https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600'],
    imageUrl: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600',
    shelfLifeDays: 10,
    createdAt: new Date().toISOString(),
  },
];

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
        .in('status', ['ACTIVE', 'APPROVED', 'ADMIN_APPROVED'])
        .gt('available_quantity', 0)
        .order('created_at', { ascending: false });

      if (crop) query = query.ilike('crop_name', `%${crop}%`);
      if (category) query = query.eq('category', category);
      if (grade) query = query.eq('grade', grade);

      let data: any[] | null = null;
      let error: any = null;

      try {
        const resp: any = await withTimeout(query.limit(50), 1200);
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
            if (isVisibleToBuyers(reg)) {
              if (crop && !reg.cropName?.toLowerCase().includes(crop.toLowerCase())) continue;
              if (category && reg.category?.toLowerCase() !== category.toLowerCase()) continue;
              if (grade && reg.grade?.toLowerCase() !== grade.toLowerCase()) continue;
              fallbackList.push({
                ...reg,
                imageUrl: (reg.images && reg.images[0]) || getCropFallbackUrl(reg.cropName, reg.category),
              });
            }
          }
        } catch {}

        for (const def of DEFAULT_MANDI_CATALOG) {
          if (crop && !def.cropName?.toLowerCase().includes(crop.toLowerCase())) continue;
          if (category && def.category?.toLowerCase() !== category.toLowerCase()) continue;
          if (grade && def.grade?.toLowerCase() !== grade.toLowerCase()) continue;
          if (!fallbackList.some(p => p.id === def.id || p.cropName?.toLowerCase() === def.cropName.toLowerCase())) {
            fallbackList.push(def);
          }
        }

        catalogCache.set(cacheKey, fallbackList, 2);
        res.status(200).json({
          data: fallbackList,
          meta: { total: fallbackList.length, fallback: true },
          error: null,
        });
        return;
      }

      const sanitizeCatalogImg = (rawUrl: string | undefined, cropName: string, category: string): string => {
        if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') return getCropFallbackUrl(cropName, category);
        if (rawUrl.startsWith('file://')) return getCropFallbackUrl(cropName, category);
        const isOldHardcodedOnion = rawUrl.includes('AB6AXuC5ju') && !(cropName || '').toLowerCase().includes('onion');
        if (isOldHardcodedOnion) return getCropFallbackUrl(cropName, category);
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

      // Merge live registered products — all approved and active produce
      try {
        const registered = ProductRegistryService.getRegisteredProducts();
        for (const reg of registered) {
          if (isVisibleToBuyers(reg) && !formatted.some((p: any) => p.id === reg.id)) {
            if (crop && !reg.cropName?.toLowerCase().includes(crop.toLowerCase())) continue;
            if (category && reg.category?.toLowerCase() !== category.toLowerCase()) continue;
            if (grade && reg.grade?.toLowerCase() !== grade.toLowerCase()) continue;

            const regImages = (reg.images || []).map((img: string) =>
              sanitizeCatalogImg(img, reg.cropName, reg.category)
            ).filter(Boolean);
            if (regImages.length === 0) regImages.push(getCropFallbackUrl(reg.cropName, reg.category));
            formatted.push({ ...reg, cropVariety: reg.cropVariety || '', images: regImages, imageUrl: regImages[0] } as any);
          }
        }
      } catch {}

      formatted.sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
        const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
        return timeB - timeA;
      });

      catalogCache.set(cacheKey, formatted, 2);

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
    const id = String(req.params.id || '');
    try {
      // 1. Check ProductRegistryService first (fast in-memory / disk lookup)
      const fromRegistry = ProductRegistryService.getProductById(id);
      if (fromRegistry) {
        const regImages = (fromRegistry.images || []).filter(Boolean);
        if (regImages.length === 0) regImages.push(getCropFallbackUrl(fromRegistry.cropName, fromRegistry.category));
        res.status(200).json({
          data: {
            ...fromRegistry,
            crop_name: fromRegistry.cropName,
            crop_variety: fromRegistry.cropVariety,
            base_price_per_unit: fromRegistry.basePricePerUnit,
            available_quantity: fromRegistry.availableQuantity,
            quantity_unit: fromRegistry.quantityUnit,
            images: regImages,
            imageUrl: regImages[0],
          },
          error: null,
        });
        return;
      }

      // 2. Try Supabase with withTimeout
      const supabase = getSupabaseAdmin();
      let sbData: any = null;
      try {
        const sbRes: any = await withTimeout(
          supabase.from('products').select('*').eq('id', id).single(),
          1000
        );
        sbData = sbRes.data;
      } catch {}

      if (sbData) {
        res.status(200).json({ data: sbData, error: null });
        return;
      }

      // 3. Fallback to DEFAULT_MANDI_CATALOG
      const fromDefault = DEFAULT_MANDI_CATALOG.find((p) => p.id === id);
      if (fromDefault) {
        res.status(200).json({ data: fromDefault, error: null });
        return;
      }

      res.status(404).json({ data: null, error: { message: 'Product batch not found' } });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }
}
