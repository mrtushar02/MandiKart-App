/**
 * MandiKart — Universal Image Compressor
 *
 * Compresses images client-side before transmission or local persistence.
 * Scales dimensions down proportionally to maxWidth/maxHeight and encodes to JPEG
 * with controllable quality (0.0 - 1.0), reducing multi-megabyte camera photos
 * to 30KB - 70KB in milliseconds.
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
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.7,
  } = options;

  if (!uri || typeof uri !== 'string') {
    return uri;
  }

  // Only perform Canvas compression on Web or environments with DOM support
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
    return new Promise<string>((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            let { width, height } = img;

            // Constrain aspect ratio proportionally
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

            // Smoothing for high quality downscaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(img, 0, 0, width, height);

            const compressed = canvas.toDataURL('image/jpeg', quality);
            console.log(
              `[imageCompressor] Resized ${img.naturalWidth}x${img.naturalHeight} -> ${width}x${height}, result size: ${Math.round(compressed.length / 1024)} KB`
            );
            resolve(compressed);
          } catch (canvasErr) {
            console.warn('[imageCompressor] Canvas error, returning source uri:', canvasErr);
            resolve(uri);
          }
        };

        img.onerror = (e) => {
          console.warn('[imageCompressor] Image load failed, returning source uri:', e);
          resolve(uri);
        };

        img.src = uri;
      } catch (err) {
        console.warn('[imageCompressor] Unexpected error, returning source uri:', err);
        resolve(uri);
      }
    });
  }

  // Native fallback: URI is already trimmed by expo-image-picker quality setting
  return uri;
}
