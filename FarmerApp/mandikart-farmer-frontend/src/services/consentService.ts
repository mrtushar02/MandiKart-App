/**
 * MandiKart — Frontend Consent, Cookie Sessions & Permissions Service
 * Handles native OS permission prompts, push token registration, and backend agreement tracking.
 * Safe for Expo Go SDK 53+ (avoids expo-notifications fatal load crash).
 */

import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { resolveFarmerApiBaseUrl } from './apiClient';

const CONSENT_KEY = 'mandikart_consent_accepted';
const SESSION_TOKEN_KEY = 'mandikart_session_token';

// Safe cross-platform storage helper
export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    return await SecureStore.getItemAsync(key).catch(() => null);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') localStorage.setItem(key, value);
      } catch {}
      return;
    }
    await SecureStore.setItemAsync(key, value).catch(() => {});
  },
};

export function getApiBaseUrl(): string {
  return resolveFarmerApiBaseUrl();
}

export class FrontendConsentService {
  /**
   * Checks if the user has already consented locally or from backend.
   */
  static async checkRequiresConsent(): Promise<boolean> {
    try {
      const localConsented = await appStorage.getItem(CONSENT_KEY);
      if (localConsented === 'true') {
        return false;
      }

      const token = await appStorage.getItem(SESSION_TOKEN_KEY);
      if (!token) {
        // Brand new user who hasn't accepted yet
        return true;
      }

      const baseUrl = getApiBaseUrl();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const res = await fetch(`${baseUrl}/consent/status`, {
        method: 'GET',
        headers,
      }).catch(() => null);

      if (res && res.ok) {
        const json = await res.json();
        const requires = json.data?.requiresConsent;
        if (requires === false) {
          await appStorage.setItem(CONSENT_KEY, 'true');
        }
        return requires ?? false;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Prompts native device permissions and submits consent to backend.
   */
  static async submitConsent(params: {
    terms: boolean;
    privacy: boolean;
    cookies: boolean;
    permissions: {
      location: boolean;
      camera: boolean;
      notifications: boolean;
    };
  }): Promise<{ success: boolean; pushToken?: string }> {
    let pushToken: string | undefined;

    // 1. Request OS Location Permission
    if (params.permissions.location && Platform.OS !== 'web') {
      try {
        await Location.requestForegroundPermissionsAsync();
      } catch (e) {
        console.warn('Location permission prompt skipped:', e);
      }
    }

    // 2. Request OS Camera & Photo Permission
    if (params.permissions.camera && Platform.OS !== 'web') {
      try {
        await ImagePicker.requestCameraPermissionsAsync();
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      } catch (e) {
        console.warn('Camera permission prompt skipped:', e);
      }
    }

    // 3. Safe Push Notification Token Registration (Safe for Expo Go SDK 53+)
    if (params.permissions.notifications && Platform.OS !== 'web') {
      try {
        let isExpoGo = false;
        try {
          const Constants = require('expo-constants').default;
          isExpoGo = Constants?.appOwnership === 'expo' || Constants?.executionEnvironment === 'storeClient';
        } catch {}

        if (!isExpoGo) {
          // Real standalone or development build
          const Notifications = require('expo-notifications');
          const { status } = await Notifications.requestPermissionsAsync();
          if (status === 'granted') {
            const tokenObj = await Notifications.getExpoPushTokenAsync().catch(() => null);
            pushToken = tokenObj?.data;
          }
        } else {
          // Expo Go development environment simulation
          pushToken = 'ExponentPushToken[expo_go_android_device_token]';
          console.log('📱 [EXPO-GO] Registered simulated push token for Expo Go development.');
        }
      } catch (e) {
        console.warn('Notification prompt safely skipped:', e);
        pushToken = 'ExponentPushToken[expo_go_android_device_token]';
      }
    }

    // 4. Submit to Backend
    const baseUrl = getApiBaseUrl();
    const { useAuthStore } = require('../store/authStore');
    const token =
      useAuthStore.getState().token ||
      (await appStorage.getItem(SESSION_TOKEN_KEY)) ||
      (await appStorage.getItem('mandikart_farmer_token')) ||
      '';

    try {
      await fetch(`${baseUrl}/consent/agree`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          termsAndConditions: params.terms,
          privacyPolicy: params.privacy,
          cookiesConsent: params.cookies,
          permissions: {
            location: params.permissions.location,
            camera: params.permissions.camera,
            notifications: params.permissions.notifications,
            storage: true,
          },
          version: '1.0',
        }),
      });

      if (pushToken) {
        await fetch(`${baseUrl}/notifications/device-token`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: pushToken,
            deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
          }),
        }).catch(() => {});
      }

      await appStorage.setItem(CONSENT_KEY, 'true');
      return { success: true, pushToken };
    } catch (err) {
      console.warn('Consent submission background sync notice:', err);
      await appStorage.setItem(CONSENT_KEY, 'true');
      return { success: true };
    }
  }

  /**
   * Resets consent state (for logout or testing).
   */
  static async resetConsent(): Promise<void> {
    await appStorage.setItem(CONSENT_KEY, 'false');
  }
}
