/**
 * MandiKart — Image Picker Service
 *
 * Handles photo picking from library and camera capture for farmer profiles
 * using native expo-image-picker.
 */

import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { compressImage, ImageCompressionOptions } from '@/utils/imageCompressor';

export interface ImagePickerResult {
  cancelled: boolean;
  uri?: string;
  error?: string;
}

export interface PickerCustomOptions extends ImageCompressionOptions {
  isCrop?: boolean;
}

export async function pickImageFromGallery(customOptions?: PickerCustomOptions): Promise<ImagePickerResult> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant access to your photo library to select an image.'
      );
      return { cancelled: true, error: 'Permission not granted' };
    }

    const isCrop = customOptions?.isCrop ?? true;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: isCrop ? [4, 3] : [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { cancelled: true };
    }

    const asset = result.assets[0];
    let finalUri = asset.uri;

    if (asset.base64) {
      finalUri = `data:image/jpeg;base64,${asset.base64}`;
    } else if (Platform.OS === 'web' && asset.uri && (asset.uri.startsWith('blob:') || asset.uri.startsWith('http'))) {
      try {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        finalUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (blobErr) {
        console.warn('Could not convert web blob to data URL, using asset.uri:', blobErr);
      }
    }

    // Apply client-side image compression
    const maxDim = isCrop ? 800 : 400;
    finalUri = await compressImage(finalUri, {
      maxWidth: customOptions?.maxWidth || maxDim,
      maxHeight: customOptions?.maxHeight || maxDim,
      quality: customOptions?.quality || 0.7,
    });

    return {
      cancelled: false,
      uri: finalUri,
    };
  } catch (err: any) {
    console.error('Error picking image from gallery:', err);
    return {
      cancelled: true,
      error: err?.message || 'Failed to select image',
    };
  }
}

export async function takePhotoWithCamera(customOptions?: PickerCustomOptions): Promise<ImagePickerResult> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera permission to take a picture.'
      );
      return { cancelled: true, error: 'Permission not granted' };
    }

    const isCrop = customOptions?.isCrop ?? true;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: isCrop ? [4, 3] : [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { cancelled: true };
    }

    const asset = result.assets[0];
    let finalUri = asset.uri;

    if (asset.base64) {
      finalUri = `data:image/jpeg;base64,${asset.base64}`;
    } else if (Platform.OS === 'web' && asset.uri && (asset.uri.startsWith('blob:') || asset.uri.startsWith('http'))) {
      try {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        finalUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (blobErr) {
        console.warn('Could not convert web camera blob to data URL, using asset.uri:', blobErr);
      }
    }

    // Apply client-side image compression
    const maxDim = isCrop ? 800 : 400;
    finalUri = await compressImage(finalUri, {
      maxWidth: customOptions?.maxWidth || maxDim,
      maxHeight: customOptions?.maxHeight || maxDim,
      quality: customOptions?.quality || 0.7,
    });

    return {
      cancelled: false,
      uri: finalUri,
    };
  } catch (err: any) {
    console.error('Error taking photo:', err);
    return {
      cancelled: true,
      error: err?.message || 'Failed to take photo',
    };
  }
}
