import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCropThumbnailUrl } from './cropThumbnail';

const isStorageAvailable = () => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }
  return true;
};

export const safeAsyncStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (!isStorageAvailable()) {
      return null;
    }
    try {
      return await AsyncStorage.getItem(name);
    } catch (err) {
      console.warn(`[safeAsyncStorage] Error getting ${name}:`, err);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (!isStorageAvailable()) {
      return;
    }
    try {
      let cleanedValue = value;
      try {
        const parsed = JSON.parse(value);
        if (parsed?.state) {
          // Replace oversized base64 data URIs with reliable crop thumbnails
          if (Array.isArray(parsed.state.crops)) {
            parsed.state.crops = parsed.state.crops.map((c: any) => {
              if (c?.imageUri && typeof c.imageUri === 'string' && c.imageUri.startsWith('data:')) {
                return { ...c, imageUri: getCropThumbnailUrl(c?.cropName, c?.category) };
              }
              if (!c?.imageUri) {
                return { ...c, imageUri: getCropThumbnailUrl(c?.cropName, c?.category) };
              }
              return c;
            });
          }
          if (Array.isArray(parsed.state.orders)) {
            parsed.state.orders = parsed.state.orders.map((o: any) => {
              if (o?.cropImage && typeof o.cropImage === 'string' && o.cropImage.startsWith('data:')) {
                return { ...o, cropImage: getCropThumbnailUrl(o?.cropName) };
              }
              return o;
            });
          }
          cleanedValue = JSON.stringify(parsed);
        }
      } catch {}

      await AsyncStorage.setItem(name, cleanedValue);
    } catch (err: any) {
      console.warn(`[safeAsyncStorage] Error setting ${name} (SQLITE_FULL or disk limit):`, err?.message || err);
      try {
        await AsyncStorage.clear();
        let minimalValue = value;
        try {
          const parsed = JSON.parse(value);
          if (parsed?.state) {
            if (Array.isArray(parsed.state.crops)) {
              parsed.state.crops = parsed.state.crops.slice(0, 10).map((c: any) => ({
                ...c,
                imageUri: c?.imageUri?.startsWith('data:') || !c?.imageUri ? getCropThumbnailUrl(c?.cropName, c?.category) : c?.imageUri,
              }));
            }
            if (Array.isArray(parsed.state.orders)) {
              parsed.state.orders = parsed.state.orders.slice(0, 10).map((o: any) => ({
                ...o,
                cropImage: o?.cropImage?.startsWith('data:') ? '' : o?.cropImage,
              }));
            }
            minimalValue = JSON.stringify(parsed);
          }
        } catch {}
        await AsyncStorage.setItem(name, minimalValue);
      } catch (retryErr) {
        console.warn(`[safeAsyncStorage] Fallback setItem failed for ${name}:`, retryErr);
      }
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (!isStorageAvailable()) {
      return;
    }
    try {
      await AsyncStorage.removeItem(name);
    } catch (err) {
      console.warn(`[safeAsyncStorage] Error removing ${name}:`, err);
    }
  },
};

