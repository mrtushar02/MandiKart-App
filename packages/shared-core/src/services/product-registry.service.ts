/**
 * MandiKart — Shared Produce Registry
 * Enables immediate cross-backend discovery of produce listings across microservices
 * with persistent cross-process disk synchronization.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export interface RegisteredProduct {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;
  location: string;
  cropName: string;
  cropVariety?: string;
  grade: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity?: number;
  quantityUnit: string;
  basePricePerUnit: number;
  minOrderQuantity: number;
  targetBuyer: string;
  images: string[];
  pickupAddress?: string;
  shelfLifeDays?: number;
  isActive: boolean;
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'ADMIN_APPROVED' | 'ACTIVE' | 'REJECTED';
  createdAt: string;
  [key: string]: any;
}

const CACHE_FILE = path.join(os.tmpdir(), 'mandikart_shared_products.json');

function readFromDisk(): RegisteredProduct[] {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(content) || [];
    }
  } catch {}
  return [];
}

function writeToDisk(products: RegisteredProduct[]): void {
  try {
    // Keep valid URLs and compact base64 strings (under 2MB)
    const sanitizedProducts = products.map(p => {
      const sanitizedImages = (p.images || []).filter(img => {
        if (!img || typeof img !== 'string') return false;
        if (img.startsWith('data:image') && img.length > 2000000) return false;
        return true;
      });
      return { ...p, images: sanitizedImages };
    });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(sanitizedProducts, null, 2), 'utf8');
  } catch {}
}

export function getCropImageUrl(cropName: string = '', category: string = ''): string {
  const name = (cropName || '').toLowerCase().trim();
  const cat = (category || '').toLowerCase().trim();

  if (name.includes('tomato') || name.includes('tamatar')) {
    return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('onion') || name.includes('pyaz') || name.includes('kanda')) {
    return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('potato') || name.includes('alu') || name.includes('aloo') || name.includes('batata')) {
    return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('wheat') || name.includes('gehu') || name.includes('gehun')) {
    return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('rice') || name.includes('paddy') || name.includes('chawal') || name.includes('basmati')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('soybean') || name.includes('soya')) {
    return 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('corn') || name.includes('maize') || name.includes('makka')) {
    return 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('chilli') || name.includes('chili') || name.includes('mirchi') || name.includes('capsicum')) {
    return 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('garlic') || name.includes('lahsun')) {
    return 'https://images.unsplash.com/photo-1615477550926-25ccbf3a9ec1?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('ginger') || name.includes('adrak')) {
    return 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('apple') || name.includes('seb')) {
    return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('mango') || name.includes('aam')) {
    return 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('banana') || name.includes('kela')) {
    return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('pomegranate') || name.includes('anar')) {
    return 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('grape') || name.includes('angoor')) {
    return 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('orange') || name.includes('santre') || name.includes('santra') || name.includes('mosambi')) {
    return 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('carrot') || name.includes('gajar')) {
    return 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('cabbage') || name.includes('patta gobi')) {
    return 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('cauliflower') || name.includes('phool gobi') || name.includes('gobi')) {
    return 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('pea') || name.includes('matar')) {
    return 'https://images.unsplash.com/photo-1592394533824-9440e5d68530?w=500&auto=format&fit=crop&q=80';
  }
  if (name.includes('cucumber') || name.includes('kheera')) {
    return 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=500&auto=format&fit=crop&q=80';
  }
  if (cat.includes('fruit')) {
    return 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80';
  }
  if (cat.includes('grain') || cat.includes('cereal') || cat.includes('pulse') || cat.includes('dal')) {
    return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80';
  }
  if (cat.includes('oilseed')) {
    return 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=500&auto=format&fit=crop&q=80';
}

export class ProductRegistryService {
  static registerProduct(product: RegisteredProduct): void {
    if (!product.images || product.images.length === 0 || !product.images[0]) {
      product.images = [getCropImageUrl(product.cropName, product.category)];
    }
    const list = readFromDisk();
    const existingIndex = list.findIndex((p) => p.id === product.id);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...product };
    } else {
      list.unshift(product);
    }
    writeToDisk(list);
  }

  static updateProductStatus(id: string, status: 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'REJECTED'): void {
    const list = readFromDisk();
    const existingIndex = list.findIndex((p) => 
      p.id === id || 
      (p.cropName && (p.cropName.toLowerCase() === id.toLowerCase() || id.toLowerCase().includes(p.cropName.toLowerCase())))
    );
    if (existingIndex >= 0) {
      list[existingIndex].status = status;
      if (status === 'APPROVED') {
        list[existingIndex].targetBuyer = 'ADMIN_APPROVED';
      } else if (status === 'REJECTED') {
        list[existingIndex].targetBuyer = 'REJECTED';
        list[existingIndex].isActive = false;
      } else if (status === 'ACTIVE') {
        list[existingIndex].targetBuyer = 'BOTH';
        list[existingIndex].isActive = true;
      }
    } else {
      list.unshift({
        id,
        farmerId: 'unknown',
        farmerName: 'Farmer',
        location: 'Mandi Area',
        cropName: 'Produce',
        grade: 'A',
        category: 'Vegetables',
        totalQuantity: 0,
        availableQuantity: 0,
        quantityUnit: 'kg',
        basePricePerUnit: 0,
        minOrderQuantity: 1,
        targetBuyer: status === 'APPROVED' ? 'ADMIN_APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'BOTH',
        images: [],
        isActive: status === 'ACTIVE',
        status,
        createdAt: new Date().toISOString(),
      });
    }
    writeToDisk(list);
  }

  static deleteProduct(id: string): void {
    const list = readFromDisk();
    const filtered = list.filter((p) => p.id !== id);
    writeToDisk(filtered);
  }

  static updateProduct(id: string, updates: Partial<RegisteredProduct>): void {
    const list = readFromDisk();
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
      writeToDisk(list);
    }
  }

  static clearAllProducts(): void {
    writeToDisk([]);
  }

  static getRegisteredProducts(): RegisteredProduct[] {
    const list = readFromDisk();
    return list.map(p => {
      if (!p.images || p.images.length === 0 || !p.images[0]) {
        p.images = [getCropImageUrl(p.cropName, p.category)];
      }
      return p;
    });
  }

  static getProductById(id: string): RegisteredProduct | undefined {
    const list = readFromDisk();
    const p = list.find((item) => item.id === id);
    if (p && (!p.images || p.images.length === 0 || !p.images[0])) {
      p.images = [getCropImageUrl(p.cropName, p.category)];
    }
    return p;
  }
}
