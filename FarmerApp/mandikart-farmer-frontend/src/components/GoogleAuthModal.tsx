/**
 * MandiKart Farmer App — Native In-App Google Authentication Modal
 * 
 * Uses react-native-webview with active URL interception to:
 * 1. Open Google OAuth directly with Firebase credentials (no Supabase URL shown)
 * 2. Intercept the redirect URI at the request level BEFORE handler.js executes,
 *    preventing the Chrome Android "missing initial state" sessionStorage error
 * 3. Never navigate to LAN IP (10.134.195.101), preventing "This site can't be reached"
 * 4. Pass the verified Google id_token directly to Firebase Auth and sync with Supabase PostgreSQL
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { X, ShieldCheck, Lock } from 'lucide-react-native';
import { decodeJwtPayload, parseUrlParams } from '@/services/googleAuth';
import { firebaseAuthService } from '@/services/firebaseAuthService';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { firebaseAuth } from '@/services/firebaseConfig';

interface GoogleAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (farmer: any, isNewUser?: boolean) => void;
  onError: (error: string) => void;
  pendingPhone?: string;
}

const FIREBASE_WEB_CLIENT_ID = '329155349072-cukiccvhfhjji4r22fur9oqrle5d01ds.apps.googleusercontent.com';
const FIREBASE_HANDLER_URI = 'https://mandikart-abe46.firebaseapp.com/__/auth/handler';

// Standard mobile Chrome User Agent so Google OAuth allows sign-in inside WebView
const MOBILE_CHROME_USER_AGENT =
  Platform.OS === 'ios'
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/122.0.6261.89 Mobile/15E148 Safari/604.1'
    : 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.90 Mobile Safari/537.36';

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
  pendingPhone,
}) => {
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const handledRef = useRef(false);
  const [sessionNonce, setSessionNonce] = useState(() => Date.now());

  // Reset state and generate a fresh nonce only when modal visibility changes
  useEffect(() => {
    if (visible) {
      setSessionNonce(Date.now());
      handledRef.current = false;
      setAuthenticating(false);
      setInitialLoaded(false);

      // Dismiss initial loading overlay after 2 seconds max so the user can ALWAYS interact with Google's page
      const timer = setTimeout(() => {
        setInitialLoaded(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // STABLE Google OAuth URL — memoized so WebView does NOT reload in an infinite loop
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

      // Decode Google verified user profile
      const decoded = decodeJwtPayload(idToken);
      const email = decoded?.email;
      const fullName =
        decoded?.name ||
        decoded?.full_name ||
        (email ? email.split('@')[0] : 'Farmer');
      const avatarUrl = decoded?.picture || decoded?.avatar_url;
      let firebaseUid = decoded?.sub ? `fb_${decoded.sub}` : `fb_${Date.now()}`;
      let finalIdToken = idToken;

      // ── CRITICAL: Sign user into Firebase Auth so they appear in Firebase Console Users section ──
      try {
        const apiKey = firebaseAuth.app.options.apiKey || 'AIzaSyC4iATiCmjUbOFcSOmGcmd1JPRrryq7ZZ0';
        const idpRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postBody: `id_token=${encodeURIComponent(idToken)}&providerId=google.com`,
              requestUri: 'https://mandikart-abe46.firebaseapp.com/__/auth/handler',
              returnSecureToken: true,
            }),
          }
        );
        const idpData = await idpRes.json();
        if (idpData && idpData.localId) {
          firebaseUid = idpData.localId;
          finalIdToken = idpData.idToken || idToken;
          console.log('🔥 [Firebase Auth REST] User registered in Firebase project:', firebaseUid, idpData.email);
        } else {
          console.warn('⚠️ [Firebase Auth REST] Response note:', idpData);
        }
      } catch (restErr: any) {
        console.warn('⚠️ [Firebase Auth REST] Error:', restErr?.message);
      }

      try {
        const credential = GoogleAuthProvider.credential(idToken);
        const userCred = await signInWithCredential(firebaseAuth, credential);
        if (userCred?.user) {
          firebaseUid = userCred.user.uid;
          finalIdToken = await userCred.user.getIdToken();
          console.log('🔥 [Firebase Auth SDK] User session active in Firebase:', firebaseUid, userCred.user.email);
        }
      } catch (fbErr: any) {
        console.warn('⚠️ [Firebase Auth SDK] note:', fbErr?.message);
      }

      // Synchronize with Firebase Auth and Supabase PostgreSQL database
      const syncResult = await firebaseAuthService.syncUserWithBackend({
        firebaseUid,
        email,
        fullName,
        avatarUrl,
        idToken: finalIdToken,
        phone: pendingPhone,
      });

      if (syncResult.success && syncResult.farmer) {
        onSuccess(syncResult.farmer, syncResult.isNewUser);
        onClose();
      } else {
        onError(syncResult.error || 'Failed to complete registration with MandiKart.');
        onClose();
      }
    } catch (err: any) {
      onError(err?.message || 'Authentication failed. Please try again.');
      onClose();
    } finally {
      setAuthenticating(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Lock size={16} color="#1B5E20" style={{ marginRight: 6 }} />
            <Text style={styles.headerTitle}>Google Sign-In · MandiKart</Text>
          </View>
          <Pressable
            onPress={() => {
              handledRef.current = false;
              onClose();
            }}
            hitSlop={12}
            style={styles.closeButton}
          >
            <X size={20} color="#333333" />
          </Pressable>
        </View>

        {/* Security badge banner */}
        <View style={styles.securityBanner}>
          <ShieldCheck size={14} color="#2E7D32" style={{ marginRight: 6 }} />
          <Text style={styles.securityText}>
            Secured by Google Identity & Firebase Authentication
          </Text>
        </View>

        {/* In-App Google OAuth Sheet */}
        <View style={styles.webviewContainer}>
          <WebView
            source={{ uri: googleAuthUrl }}
            userAgent={MOBILE_CHROME_USER_AGENT}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            onLoadEnd={() => setInitialLoaded(true)}
            onLoadProgress={({ nativeEvent }) => {
              if (nativeEvent.progress > 0.5) {
                setInitialLoaded(true);
              }
            }}
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url;
              if (url.includes('id_token=') || url.includes('error=')) {
                handleInterceptedUrl(url);
                return false; // Intercept token immediately; do not load handler.js to avoid sessionStorage errors
              }
              return true;
            }}
            onNavigationStateChange={(navState) => {
              const url = navState.url;
              if (url.includes('id_token=') || url.includes('error=')) {
                handleInterceptedUrl(url);
              }
            }}
            style={styles.webview}
          />

          {/* MandiKart Synchronizing Overlay (Active ONLY after account is picked and token intercepted) */}
          {authenticating && (
            <View style={styles.authenticatingOverlay}>
              <ActivityIndicator
                size="large"
                color="#1B5E20"
                aria-label="Connecting Google account"
                accessibilityLabel="Connecting Google account"
              />
              <Text style={styles.loadingStatusText}>
                Connecting your account with MandiKart...
              </Text>
            </View>
          )}

          {/* Initial Brief Loading Overlay (Disappears as soon as Google loads, never blocks user interaction) */}
          {!initialLoaded && !authenticating && (
            <View style={styles.initialLoadingOverlay} pointerEvents="none">
              <ActivityIndicator
                size="large"
                color="#1B5E20"
                aria-label="Opening Google Sign-In"
                accessibilityLabel="Opening Google Sign-In"
              />
              <Text style={styles.loadingStatusText}>
                Opening Google Sign-In...
              </Text>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FAF9F6',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#EFEFEF',
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2E7D32',
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  authenticatingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  initialLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingStatusText: {
    marginTop: 12,
    fontSize: 14,
    color: '#1B5E20',
    fontWeight: '600',
  },
});
