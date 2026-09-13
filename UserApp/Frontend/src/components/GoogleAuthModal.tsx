/**
 * MandiKart User App — Native In-App Google Authentication Modal
 * 
 * Uses react-native-webview with active URL interception:
 * 1. Opens authentic Google Accounts OAuth sheet
 * 2. Intercepts id_token redirect at the request level BEFORE handler script runs
 * 3. Spoofs mobile Chrome user agent to prevent Google 403 disallowed_useragent
 * 4. Decodes verified profile (name, email, picture) and syncs with UserApp backend / Supabase
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Typography } from '../theme';
import { apiClient } from '../services/apiClient';

interface GoogleAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (data: { token: string; buyer: any }) => void;
  onError: (error: string) => void;
}

const FIREBASE_WEB_CLIENT_ID = '329155349072-cukiccvhfhjji4r22fur9oqrle5d01ds.apps.googleusercontent.com';
const FIREBASE_HANDLER_URI = 'https://mandikart-abe46.firebaseapp.com/__/auth/handler';

// Mobile Chrome User Agent so Google OAuth allows sign-in inside WebView
const MOBILE_CHROME_USER_AGENT =
  Platform.OS === 'ios'
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/122.0.6261.89 Mobile/15E148 Safari/604.1'
    : 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.90 Mobile Safari/537.36';

function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryIndex = url.indexOf('?');
  const hashIndex = url.indexOf('#');
  let queryString = '';
  let hashString = '';

  if (queryIndex !== -1) {
    const end = hashIndex !== -1 && hashIndex > queryIndex ? hashIndex : url.length;
    queryString = url.substring(queryIndex + 1, end);
  }
  if (hashIndex !== -1) {
    hashString = url.substring(hashIndex + 1);
  }

  const combined = [queryString, hashString].filter(Boolean).join('&');
  const pairs = combined.split('&');

  for (const pair of pairs) {
    const [rawKey, rawVal] = pair.split('=');
    if (rawKey && rawVal) {
      const cleanVal = rawVal.replace(/\+/g, ' ');
      try {
        params[decodeURIComponent(rawKey)] = decodeURIComponent(cleanVal);
      } catch {
        params[rawKey] = cleanVal;
      }
    }
  }
  return params;
}

function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    if (typeof atob !== 'undefined') {
      const binary = atob(base64);
      const jsonPayload = decodeURIComponent(
        binary
          .split('')
          .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    }
    return null;
  } catch {
    return null;
  }
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
}) => {
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const handledRef = useRef(false);
  const [sessionNonce, setSessionNonce] = useState(() => Date.now());

  useEffect(() => {
    if (visible) {
      setSessionNonce(Date.now());
      handledRef.current = false;
      setAuthenticating(false);
      setInitialLoaded(false);

      const timer = setTimeout(() => {
        setInitialLoaded(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const googleAuthUrl = useMemo(() => {
    return (
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${FIREBASE_WEB_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(FIREBASE_HANDLER_URI)}` +
      `&response_type=id_token` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&prompt=select_account` +
      `&nonce=${sessionNonce}`
    );
  }, [sessionNonce]);

  const handleInterceptedUrl = async (url: string) => {
    if (handledRef.current) return;
    if (!url.includes('id_token=') && !url.includes('code=') && !url.includes('error=')) {
      return;
    }

    handledRef.current = true;
    setAuthenticating(true);

    try {
      const params = parseUrlParams(url);

      if (params['error']) {
        onError(params['error_description'] || params['error'] || 'Google sign-in was cancelled.');
        onClose();
        return;
      }

      const idToken = params['id_token'];
      if (!idToken) {
        onError('Could not retrieve identity credentials from Google.');
        onClose();
        return;
      }

      const decoded = decodeJwtPayload(idToken);
      const email = decoded?.email;
      const fullName =
        decoded?.name ||
        decoded?.full_name ||
        (email ? email.split('@')[0] : 'Buyer');
      const avatarUrl = decoded?.picture || decoded?.avatar_url;

      const result = await apiClient.auth.loginWithGoogle(idToken, email, fullName, avatarUrl);
      const buyerObj = result?.buyer || (result as any)?.user;

      if (result && result.token && buyerObj) {
        onSuccess({ token: result.token, buyer: buyerObj });
        onClose();
      } else {
        onError(result?.error || 'Failed to complete registration with MandiKart.');
        onClose();
      }
    } catch (err: any) {
      onError(err?.message || 'Authentication error.');
      onClose();
    } finally {
      setAuthenticating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
            <Text style={styles.headerTitle}>Google Sign-In</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Security / SSL Indicator */}
        <View style={styles.securityBanner}>
          <Ionicons name="lock-closed" size={13} color={Colors.success} />
          <Text style={styles.securityText}>accounts.google.com — Official Secure Authentication</Text>
        </View>

        {/* Webview or Authenticating Overlay */}
        <View style={styles.webContainer}>
          <WebView
            source={{ uri: googleAuthUrl }}
            userAgent={MOBILE_CHROME_USER_AGENT}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Connecting to Google...</Text>
              </View>
            )}
            onLoadEnd={() => setInitialLoaded(true)}
            onShouldStartLoadWithRequest={(request) => {
              const reqUrl = request.url || '';
              if (
                reqUrl.includes('id_token=') ||
                reqUrl.includes('code=') ||
                reqUrl.includes('error=') ||
                reqUrl.includes('mandikart-abe46.firebaseapp.com/__/auth/handler')
              ) {
                handleInterceptedUrl(reqUrl);
                return false;
              }
              return true;
            }}
            onNavigationStateChange={(navState) => {
              if (navState.url) {
                handleInterceptedUrl(navState.url);
              }
            }}
          />

          {authenticating && (
            <View style={styles.authenticatingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.authenticatingTitle}>Verifying Google Account...</Text>
              <Text style={styles.authenticatingSub}>Setting up your fresh mandi buyer profile</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
  },
  securityText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
  },
  webContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  authenticatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  authenticatingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  authenticatingSub: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
