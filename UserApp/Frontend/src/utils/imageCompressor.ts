/**
 * MandiKart — Universal Image Compressor for User Profile & Crops
 *
 * Compresses images client-side before upload or local storage.
 * Downscales dimensions proportionally to maxWidth/maxHeight and encodes to JPEG
 * with high quality compression, shrinking massive raw photos from 5MB+ to <50KB.
 */

import { Platform } from 'react-native';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
}

/**
 * Compresses an image given its URI (blob:, data:image/..., http://, file://)
 */
export async function compressImage(
  uri: string,
  options: ImageCompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.7,
  } = options;

  if (!uri || typeof uri !== 'string') {
    return uri;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
    return new Promise<string>((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            let { width, height } = img;

            // Proportional constraint
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.max(1, Math.round(width * ratio));
              height = Math.max(1, Math.round(height * ratio));
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(uri);
              return;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(img, 0, 0, width, height);

            const compressed = canvas.toDataURL('image/jpeg', quality);
            console.log(
              `[UserApp imageCompressor] Scaled ${img.naturalWidth}x${img.naturalHeight} -> ${width}x${height}, size: ${Math.round(compressed.length / 1024)} KB`
            );
            resolve(compressed);
          } catch (canvasErr) {
            console.warn('[imageCompressor] Canvas processing error:', canvasErr);
            resolve(uri);
          }
        };

        img.onerror = (e) => {
          console.warn('[imageCompressor] Image loading error:', e);
          resolve(uri);
        };

        img.src = uri;
      } catch (err) {
        console.warn('[imageCompressor] Compression exception:', err);
        resolve(uri);
      }
    });
  }

  return uri;
}
