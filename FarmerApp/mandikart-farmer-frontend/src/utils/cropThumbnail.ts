/**
 * MandiKart — Crop Thumbnail Resolution Utility
 * 
 * Provides accurate, curated high-resolution agricultural produce thumbnails
 * with smart fallback matching for English & vernacular crop names.
 */

import { Platform } from 'react-native';

export const CROP_IMAGE_MAP: Record<string, string> = {
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',
  soybean: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&auto=format&fit=crop&q=80',
  corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=80',
  chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&auto=format&fit=crop&q=80',
  garlic: 'https://images.unsplash.com/photo-1615477550926-25ccbf3a9ec1?w=500&auto=format&fit=crop&q=80',
  ginger: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80',
  apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80',
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80',
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80',
  pomegranate: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80',
  grape: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=80',
  orange: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=500&auto=format&fit=crop&q=80',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop&q=80',
  cabbage: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=500&auto=format&fit=crop&q=80',
  cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500&auto=format&fit=crop&q=80',
  peas: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=500&auto=format&fit=crop&q=80',
  cucumber: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500&auto=format&fit=crop&q=80',
  brinjal: 'https://images.unsplash.com/photo-1628773822503-930a84d9435b?w=500&auto=format&fit=crop&q=80',
  okra: 'https://images.unsplash.com/photo-1604544203292-067571343719?w=500&auto=format&fit=crop&q=80',
  lemon: 'https://images.unsplash.com/photo-1533082603883-3be80a3a68b7?w=500&auto=format&fit=crop&q=80',
  papaya: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=500&auto=format&fit=crop&q=80',
  watermelon: 'https://images.unsplash.com/photo-1589984662646-e7b2e495949c?w=500&auto=format&fit=crop&q=80',
  mustard: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=500&auto=format&fit=crop&q=80',
  cotton: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=500&auto=format&fit=crop&q=80',
  sugarcane: 'https://images.unsplash.com/photo-1598030304671-5aa1d6f21128?w=500&auto=format&fit=crop&q=80',
  pulse: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop&q=80',
};

export const CATEGORY_FALLBACKS: Record<string, string> = {
  vegetable: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=500&auto=format&fit=crop&q=80',
  fruit: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80',
  grain: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80',
  cereal: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80',
  pulse: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop&q=80',
  oilseed: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&auto=format&fit=crop&q=80',
  spice: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&auto=format&fit=crop&q=80',
};

/**
 * Returns a high-quality produce thumbnail matching the crop's name or category.
 */
export function getCropThumbnailUrl(cropName: string = '', category: string = ''): string {
  const n = (cropName || '').toLowerCase().trim();
  const c = (category || '').toLowerCase().trim();

  // Tomatoes
  if (n.includes('tomato') || n.includes('tamatar')) return CROP_IMAGE_MAP.tomato;

  // Onions
  if (n.includes('onion') || n.includes('pyaz') || n.includes('kanda')) return CROP_IMAGE_MAP.onion;

  // Potatoes (handles alu, aloo, allo, batata)
  if (n.includes('potato') || n.includes('alu') || n.includes('aloo') || n.includes('allo') || n.includes('batata')) {
    return CROP_IMAGE_MAP.potato;
  }

  // Wheat
  if (n.includes('wheat') || n.includes('gehu') || n.includes('gehun') || n.includes('sharbati') || n.includes('lokwan')) {
    return CROP_IMAGE_MAP.wheat;
  }

  // Rice / Paddy
  if (n.includes('rice') || n.includes('paddy') || n.includes('chawal') || n.includes('basmati')) {
    return CROP_IMAGE_MAP.rice;
  }

  // Soybean
  if (n.includes('soybean') || n.includes('soya')) return CROP_IMAGE_MAP.soybean;

  // Corn / Maize
  if (n.includes('corn') || n.includes('maize') || n.includes('makka') || n.includes('bhutta')) {
    return CROP_IMAGE_MAP.corn;
  }

  // Chillies & Peppers
  if (n.includes('chilli') || n.includes('chili') || n.includes('mirchi') || n.includes('capsicum') || n.includes('shimla')) {
    return CROP_IMAGE_MAP.chilli;
  }

  // Garlic
  if (n.includes('garlic') || n.includes('lahsun') || n.includes('lasun')) return CROP_IMAGE_MAP.garlic;

  // Ginger
  if (n.includes('ginger') || n.includes('adrak')) return CROP_IMAGE_MAP.ginger;

  // Apples
  if (n.includes('apple') || n.includes('seb')) return CROP_IMAGE_MAP.apple;

  // Mangoes
  if (n.includes('mango') || n.includes('aam') || n.includes('alphonso')) return CROP_IMAGE_MAP.mango;

  // Bananas
  if (n.includes('banana') || n.includes('kela')) return CROP_IMAGE_MAP.banana;

  // Pomegranate
  if (n.includes('pomegranate') || n.includes('anar')) return CROP_IMAGE_MAP.pomegranate;

  // Grapes
  if (n.includes('grape') || n.includes('angoor')) return CROP_IMAGE_MAP.grape;

  // Oranges & Citrus
  if (n.includes('orange') || n.includes('santra') || n.includes('mosambi') || n.includes('kinnow')) {
    return CROP_IMAGE_MAP.orange;
  }

  // Carrots
  if (n.includes('carrot') || n.includes('gajar')) return CROP_IMAGE_MAP.carrot;

  // Cabbages
  if (n.includes('cabbage') || n.includes('patta gobi') || n.includes('band gobi')) return CROP_IMAGE_MAP.cabbage;

  // Cauliflower
  if (n.includes('cauliflower') || n.includes('phool gobi') || n.includes('gobi')) return CROP_IMAGE_MAP.cauliflower;

  // Peas
  if (n.includes('peas') || n.includes('matar')) return CROP_IMAGE_MAP.peas;

  // Cucumber
  if (n.includes('cucumber') || n.includes('kheera') || n.includes('kakdi')) return CROP_IMAGE_MAP.cucumber;

  // Brinjal / Eggplant
  if (n.includes('brinjal') || n.includes('eggplant') || n.includes('baingan')) return CROP_IMAGE_MAP.brinjal;

  // Ladyfinger / Okra
  if (n.includes('okra') || n.includes('bhindi') || n.includes('ladyfinger')) return CROP_IMAGE_MAP.okra;

  // Lemon / Lime
  if (n.includes('lemon') || n.includes('lime') || n.includes('nimbu')) return CROP_IMAGE_MAP.lemon;

  // Papaya
  if (n.includes('papaya') || n.includes('papita')) return CROP_IMAGE_MAP.papaya;

  // Watermelon
  if (n.includes('watermelon') || n.includes('tarbooj') || n.includes('tarbuz')) return CROP_IMAGE_MAP.watermelon;

  // Mustard
  if (n.includes('mustard') || n.includes('sarson')) return CROP_IMAGE_MAP.mustard;

  // Cotton
  if (n.includes('cotton') || n.includes('kapas')) return CROP_IMAGE_MAP.cotton;

  // Sugarcane
  if (n.includes('sugarcane') || n.includes('ganna')) return CROP_IMAGE_MAP.sugarcane;

  // Pulses / Dal
  if (n.includes('dal') || n.includes('pulse') || n.includes('chana') || n.includes('moong') || n.includes('urad') || n.includes('toor')) {
    return CROP_IMAGE_MAP.pulse;
  }

  // Category based fallbacks
  if (c.includes('fruit')) return CATEGORY_FALLBACKS.fruit;
  if (c.includes('grain') || c.includes('cereal')) return CATEGORY_FALLBACKS.grain;
  if (c.includes('pulse') || c.includes('dal')) return CATEGORY_FALLBACKS.pulse;
  if (c.includes('oilseed')) return CATEGORY_FALLBACKS.oilseed;
  if (c.includes('spice')) return CATEGORY_FALLBACKS.spice;

  return CATEGORY_FALLBACKS.vegetable;
}

/**
 * Validates and resolves the actual thumbnail to display for a crop.
 * 
 * - If currentImageUri is valid and custom, it is used.
 * - If currentImageUri is missing, invalid, a local file:// on web, or the legacy
 *   default onion photo erroneously assigned to a non-onion crop, it resolves the
 *   correct crop-specific photo matching the crop's name and category.
 */
export function resolveCropThumbnail(
  cropName: string = '',
  category: string = '',
  currentImageUri?: string | null
): string {
  const fallback = getCropThumbnailUrl(cropName, category);

  if (!currentImageUri || typeof currentImageUri !== 'string' || currentImageUri.trim() === '') {
    return fallback;
  }

  const trimmed = currentImageUri.trim();

  // Strip unsupported local file:// URIs when rendering in web/simulator context
  if (Platform.OS === 'web' && trimmed.startsWith('file://')) {
    return fallback;
  }

  // Detect if this crop was mistakenly assigned the default onion photo when it is NOT an onion!
  const n = (cropName || '').toLowerCase().trim();
  const isActuallyOnion = n.includes('onion') || n.includes('pyaz') || n.includes('kanda');
  
  const isDefaultOnionUri =
    trimmed.includes('photo-1618512496248-a07fe83aa8cb') ||
    trimmed.includes('AB6AXuC5juCGxLQ_5fyI4TU5ZyfZdhObSJDnZM42ZAzHiJlSBs31EGGnUyK0QRdyoFAXloh0SkLFb_apbQR_O0o3CiqCV8ckf9U5kVPC_outsYrPisSJV7GpxGLs2L-xGzfoEsXeXb0RDHma0B3LZpqIpwp37q8QDENvGkvpIupjr3XK_RaWZAC1mYGgc0fh9NxnbqD6YkA-qI6_ktMQlwdFD5eo5P3iTDMZmUTjkFoBSsrDOCIoRU8BehqDTw');

  if (isDefaultOnionUri && !isActuallyOnion) {
    // Restore the authentic crop thumbnail for non-onion produce!
    return fallback;
  }

  return trimmed;
}
