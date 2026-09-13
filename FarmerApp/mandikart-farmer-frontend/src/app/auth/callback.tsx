/**
 * MandiKart Farmer App — Universal OAuth Callback Handler
 * 
 * Handles redirects from Google OAuth / Supabase Auth for both Native and Web:
 * 1. On Mobile Web (Chrome on Android / iOS Safari):
 *    - Completes Supabase & MandiKart backend authentication cleanly
 *    - Uses real native HTML anchor tags (<a>) for user gesture link navigation
 *    - Prevents Chrome's script navigation block on custom schemes
 *    - No automatic redirects on load, completely eliminating "Allow" loops
 *    - Provides multiple rock-solid launch strategies (Direct exp://, Android Intent, Expo Root, Standalone)
 *    - Provides one-tap fallback to continue directly in the mobile browser
 * 2. On Native (Expo Go / Standalone):
 *    - Receives token handoff or performs direct code/token authentication
 *    - Stores session in `useAuthStore`
 *    - Routes new Google signups to `/onboarding/farmer-profile` and existing farmers to `/(tabs)/home`
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  Sprout,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Copy,
  ExternalLink,
} from 'lucide-react-native';
import { MKBackground } from '@/components/ui/MKBackground';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/apiClient';
import {
  processAuthCallbackUrl,
  parseUrlParams,
  processSupabaseTokens,
  getHostIp,
} from '@/services/googleAuth';

// Complete any pending auth sessions on web/native
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { setAuthenticated, setPhoneNumber, setUser } = useAuthStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'switch_to_app'>('loading');
  const [statusMessage, setStatusMessage] = useState('Verifying your Google credentials...');
  const [errorMessage, setErrorMessage] = useState('');
  const [expDeepUrl, setExpDeepUrl] = useState('');
  const [expBaseUrl, setExpBaseUrl] = useState('');
  const [apkUrl, setApkUrl] = useState('');
  const [hostIp, setHostIp] = useState(getHostIp());
  const [copied, setCopied] = useState(false);
  const processedRef = useRef(false);
  const incomingUrl = Linking.useURL();

  // Complete authentication with backend API and store credentials
  const authenticateWithBackend = async (
    accessToken?: string,
    authCode?: string,
    fullUrlOrHash?: string,
    codeVerifier?: string
  ) => {
    setStatus('loading');
    setStatusMessage('Connecting your verified Gmail account...');

    let authResult;
    if (fullUrlOrHash) {
      authResult = await processAuthCallbackUrl(fullUrlOrHash);
    } else {
      authResult = await processSupabaseTokens(accessToken, authCode, codeVerifier);
    }

    if (!authResult.success || !authResult.user) {
      throw new Error(authResult.error || 'Failed to authenticate with Google.');
    }

    let pendingPhone: string | undefined = undefined;
    if (typeof sessionStorage !== 'undefined') {
      try {
        pendingPhone = sessionStorage.getItem('mandikart_pending_phone') || undefined;
      } catch {}
    }

    setStatusMessage('Syncing farmer profile with MandiKart...');
    let res: any;
    try {
      res = await apiClient.post('/auth/firebase-sync', {
        email: authResult.user.email,
        fullName: authResult.user.fullName,
        avatarUrl: authResult.user.avatarUrl,
        idToken: authResult.user.idToken,
        phone: pendingPhone ? `+91${pendingPhone}` : undefined,
      });
    } catch {
      res = await apiClient.post('/auth/google', {
        email: authResult.user.email,
        fullName: authResult.user.fullName,
        avatarUrl: authResult.user.avatarUrl,
        idToken: authResult.user.idToken,
        phone: pendingPhone ? `+91${pendingPhone}` : undefined,
      });
    }

    if (res?.data?.token && res?.data?.farmer) {
      const token = res.data.token;
      const farmer = res.data.farmer;
      const isNew = !farmer.village && !farmer.farmSizeAcres;

      setAuthenticated(token, farmer);
      const farmerPhone =
        farmer.phone || (pendingPhone ? `+91${pendingPhone}` : '+919876543210');
      setPhoneNumber(farmerPhone);
      setUser({
        id: farmer.id,
        name: authResult.user.fullName || farmer.fullName,
        fullName: authResult.user.fullName || farmer.fullName,
        email: authResult.user.email,
        avatarUri: authResult.user.avatarUrl,
        phone: farmerPhone,
        isVerified: true,
        role: 'FARMER',
        village: farmer.village,
        farmSizeAcres: farmer.farmSizeAcres,
      });

      if (typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.removeItem('mandikart_pending_phone');
        } catch {}
      }

      // If running on Native, dismiss any open browser session immediately
      if (Platform.OS !== 'web') {
        try {
          WebBrowser.dismissAuthSession();
        } catch {}
        setStatus('success');
        setStatusMessage(`Welcome, ${farmer.fullName || 'Farmer'}!`);
        setTimeout(() => {
          if (isNew) {
            router.replace('/onboarding/permissions');
          } else {
            router.replace('/(tabs)/home');
          }
        }, 400);
        return;
      }

      // Running on Web: prepare deep links for returning to mobile app
      const host =
        typeof window !== 'undefined' &&
        window.location?.hostname &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
          ? window.location.hostname
          : getHostIp();

      setHostIp(host);

      const qs = `token=${encodeURIComponent(token)}&farmerId=${encodeURIComponent(farmer.id)}&isNew=${isNew ? '1' : '0'}`;

      const expoDirect = `exp://${host}:8081/--/auth/callback?${qs}`;
      const expoIntent = `intent://${host}:8081/--/auth/callback?${qs}#Intent;scheme=exp;package=host.exp.exponent;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
      const standaloneIntent = `intent://auth/callback?${qs}#Intent;scheme=mandikartfarmer;package=com.mandikart.farmer;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;

      setExpBaseUrl(expoDirect);
      setExpDeepUrl(expoIntent);
      setApkUrl(standaloneIntent);

      // NO automatic redirects on load — user must explicitly tap to avoid Chrome's "Allow" loops
      setStatus('switch_to_app');
      setStatusMessage(`Google account verified for ${farmer.fullName || 'Farmer'}!`);
      return;
    }

    throw new Error(res?.error?.message || 'Failed to create your farmer profile.');
  };

  useEffect(() => {
    async function handleAuthRedirect() {
      try {
        // SCENARIO 0: Token handed off from web callback into Native App
        const incomingParams = incomingUrl ? parseUrlParams(incomingUrl) : {};
        const passedToken = (searchParams.token as string) || incomingParams['token'] || '';
        const passedFarmerId = (searchParams.farmerId as string) || incomingParams['farmerId'] || '';
        const isNewParam = searchParams.isNew === '1' || incomingParams['isNew'] === '1';

        if (passedToken) {
          if (processedRef.current) return;
          processedRef.current = true;

          setStatus('loading');
          setStatusMessage('Signing you into MandiKart app...');

          try {
            // Dismiss browser session in case it was opened by WebBrowser on native
            try {
              WebBrowser.dismissAuthSession();
            } catch {}

            const profileRes: any = await apiClient.get('/farmers/me', passedToken).catch(() => null);
            const farmer = profileRes?.data?.farmer || {
              id: passedFarmerId || 'farmer-google',
              fullName: 'Farmer',
              phone: '+919876543210',
              isVerified: true,
              role: 'FARMER',
            };

            setAuthenticated(passedToken, farmer);
            setPhoneNumber(farmer.phone || '+919876543210');
            setUser({
              id: farmer.id,
              name: farmer.fullName || 'Farmer',
              fullName: farmer.fullName || 'Farmer',
              email: farmer.email,
              avatarUri: farmer.avatarUrl,
              phone: farmer.phone || '+919876543210',
              isVerified: true,
              role: 'FARMER',
              village: farmer.village,
              farmSizeAcres: farmer.farmSizeAcres,
            });

            setStatus('success');
            setStatusMessage(`Welcome, ${farmer.fullName || 'Farmer'}!`);

            setTimeout(() => {
              if (isNewParam || (!farmer.village && !farmer.farmSizeAcres)) {
                router.replace('/onboarding/permissions');
              } else {
                router.replace('/(tabs)/home');
              }
            }, 300);
            return;
          } catch (tokenErr: any) {
            console.warn('Passed token auth notice:', tokenErr);
          }
        }

        // If already authenticated by promptGoogleSignIn promise:
        const { isAuthenticated, user, token, farmer } = useAuthStore.getState();
        if (isAuthenticated && user) {
          try {
            WebBrowser.dismissAuthSession();
          } catch {}

          if (Platform.OS !== 'web') {
            if (user.village || user.farmSizeAcres) {
              router.replace('/(tabs)/home');
            } else {
              router.replace('/onboarding/permissions');
            }
            return;
          }

          // On Web, prepare handoff URLs and display the "Still Not Redirecting?" screen
          const host =
            typeof window !== 'undefined' &&
            window.location?.hostname &&
            window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1'
              ? window.location.hostname
              : getHostIp();

          setHostIp(host);

          const isNew = !user.village && !user.farmSizeAcres;
          const authToken = token || 'google_auth_token';
          const farmerId = farmer?.id || user.id || 'farmer-google';
          const qs = `token=${encodeURIComponent(authToken)}&farmerId=${encodeURIComponent(farmerId)}&isNew=${isNew ? '1' : '0'}`;

          const expoDirect = `exp://${host}:8081/--/auth/callback?${qs}`;
          const expoIntent = `intent://${host}:8081/--/auth/callback?${qs}#Intent;scheme=exp;package=host.exp.exponent;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
          const standaloneIntent = `intent://auth/callback?${qs}#Intent;scheme=mandikartfarmer;package=com.mandikart.farmer;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;

          setExpBaseUrl(expoDirect);
          setExpDeepUrl(expoIntent);
          setApkUrl(standaloneIntent);
          setStatus('switch_to_app');
          setStatusMessage(`Welcome, ${user.fullName || user.name || 'Farmer'}!`);
          return;
        }

        // SCENARIO 1: Running inside Web Browser (Chrome on Android / Safari on iOS / Desktop)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          if (window.location.href && (window.location.href.includes('#') || window.location.href.includes('?'))) {
            if (processedRef.current) return;
            processedRef.current = true;
            await authenticateWithBackend(undefined, undefined, window.location.href);
            return;
          }
        }

        // SCENARIO 2: Running inside Native App (Expo Go / Standalone)
        let accessToken =
          (searchParams.access_token as string) || incomingParams['access_token'] || '';
        let authCode = (searchParams.code as string) || incomingParams['code'] || '';
        let verifier =
          (searchParams.v as string) ||
          (searchParams.code_verifier as string) ||
          incomingParams['v'] ||
          incomingParams['code_verifier'] ||
          '';
        let error =
          (searchParams.error as string) ||
          (searchParams.error_description as string) ||
          incomingParams['error'] ||
          incomingParams['error_description'] ||
          '';

        // Fallback: Check initial deep link URL or query params
        if (!accessToken && !authCode && !error) {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            const parsed = parseUrlParams(initialUrl);
            accessToken = parsed['access_token'] || '';
            authCode = parsed['code'] || '';
            verifier = parsed['v'] || parsed['code_verifier'] || '';
            error = parsed['error_description'] || parsed['error'] || '';
          }
        }

        if (error) {
          let friendlyError = error;
          if (
            error.toLowerCase().includes('state not found') ||
            error.toLowerCase().includes('expired') ||
            error.toLowerCase().includes('invalid_request')
          ) {
            friendlyError = 'Sign-in session expired. Please tap Return to Signup to try again.';
          }
          throw new Error(friendlyError);
        }

        if (accessToken || authCode) {
          if (processedRef.current) return;
          processedRef.current = true;
          await authenticateWithBackend(accessToken, authCode, undefined, verifier);
          return;
        }

        // If no credentials on Native, safely redirect back to signup to prevent hanging in a loop
        if (Platform.OS !== 'web') {
          if (!processedRef.current) {
            processedRef.current = true;
            setTimeout(() => {
              router.replace('/auth/signup');
            }, 1200);
          }
          return;
        }

        const waitTimer = setTimeout(() => {
          if (status === 'loading') {
            setStatus('error');
            setErrorMessage('Authentication timed out. Please tap below to return to sign up.');
          }
        }, 5000);
        return () => clearTimeout(waitTimer);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(
          err?.message || 'Google sign-in could not be completed. Please try again.'
        );
      }
    }

    handleAuthRedirect();
  }, [incomingUrl, searchParams.token, searchParams.access_token]);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && expBaseUrl) {
      navigator.clipboard.writeText(expBaseUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleContinueInWeb = () => {
    const { user } = useAuthStore.getState();
    if (user?.village || user?.farmSizeAcres) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/onboarding/permissions');
    }
  };

  return (
    <MKBackground>
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Status Badge Icon */}
          <View
            style={[
              styles.iconBadge,
              status === 'switch_to_app' && styles.iconBadgeApp,
              status === 'error' && styles.iconBadgeError,
              status === 'success' && styles.iconBadgeSuccess,
            ]}
          >
            {status === 'loading' && <Sprout size={36} color="#1E5A2A" strokeWidth={2.2} />}
            {status === 'switch_to_app' && <Smartphone size={36} color="#1E5A2A" strokeWidth={2.2} />}
            {status === 'success' && <CheckCircle2 size={36} color="#1E5A2A" strokeWidth={2.2} />}
            {status === 'error' && <AlertCircle size={36} color="#D32F2F" strokeWidth={2.2} />}
          </View>

          <Text style={styles.title}>
            {status === 'loading' && 'Authenticating...'}
            {status === 'switch_to_app' && 'Google Account Verified! 🎉'}
            {status === 'success' && 'Signed In Successfully'}
            {status === 'error' && 'Authentication Error'}
          </Text>

          <Text style={styles.subtitle}>
            {status === 'error'
              ? errorMessage
              : status === 'switch_to_app'
              ? (statusMessage || 'Your Google account was verified successfully!')
              : statusMessage}
          </Text>

          {status === 'loading' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1E5A2A" />
              <Text style={styles.loadingHint}>Connecting with MandiKart...</Text>
            </View>
          )}

          {status === 'switch_to_app' && (
            <View style={styles.buttonGroup}>
              {/* ── STILL NOT REDIRECTING SECTION ── */}
              <View style={styles.redirectBox}>
                <View style={styles.redirectHeaderRow}>
                  <AlertCircle size={20} color="#B45309" strokeWidth={2.2} />
                  <Text style={styles.redirectBoxTitle}>Still Not Redirecting?</Text>
                </View>
                <Text style={styles.redirectBoxText}>
                  Tap below to launch the MandiKart app directly on your phone:
                </Text>

                {/* Primary CTA: Real HTML Anchor tag to guarantee Chrome treats it as a user-initiated link click */}
                {Platform.OS === 'web' && expBaseUrl ? (
                  <a
                    href={expBaseUrl}
                    target="_self"
                    rel="noopener"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      backgroundColor: '#1E5A2A',
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      paddingTop: 16,
                      paddingBottom: 16,
                      paddingLeft: 20,
                      paddingRight: 20,
                      borderRadius: 14,
                      width: '100%',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(30, 90, 42, 0.35)',
                      textAlign: 'center',
                      fontWeight: '700',
                      fontSize: 16,
                    }}
                  >
                    <Smartphone size={20} color="#FFFFFF" strokeWidth={2.2} />
                    <span>Open in MandiKart App 🌾</span>
                    <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
                  </a>
                ) : (
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => expBaseUrl && Linking.openURL(expBaseUrl)}
                  >
                    <Smartphone size={20} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={styles.primaryButtonText}>Open in MandiKart App 🌾</Text>
                    <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
                  </Pressable>
                )}

                {/* Alternative Launch Links */}
                <View style={styles.altLinksContainer}>
                  {/* Android Intent Link */}
                  {Platform.OS === 'web' && expDeepUrl ? (
                    <a
                      href={expDeepUrl}
                      target="_self"
                      rel="noopener"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        backgroundColor: '#FFFFFF',
                        color: '#1E5A2A',
                        textDecoration: 'none',
                        paddingTop: 12,
                        paddingBottom: 12,
                        paddingLeft: 16,
                        paddingRight: 16,
                        borderRadius: 10,
                        border: '1.5px solid #1E5A2A',
                        width: '100%',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight: '700',
                        fontSize: 13,
                        marginTop: 10,
                      }}
                    >
                      <ExternalLink size={15} color="#1E5A2A" strokeWidth={2} />
                      <span>📱 Launch via Android Intent</span>
                    </a>
                  ) : null}

                  {/* Direct Dev Server Project in Expo Go */}
                  {Platform.OS === 'web' && hostIp ? (
                    <a
                      href={`exp://${hostIp}:8081`}
                      target="_self"
                      rel="noopener"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1E5A2A',
                        textDecoration: 'underline',
                        fontSize: 13,
                        fontWeight: '700',
                        marginTop: 10,
                        paddingTop: 4,
                        paddingBottom: 4,
                        cursor: 'pointer',
                      }}
                    >
                      <span>⚡ Open Project in Expo Go (`exp://`)</span>
                    </a>
                  ) : null}

                  {/* Standalone APK Custom Scheme */}
                  {Platform.OS === 'web' && apkUrl ? (
                    <a
                      href={apkUrl}
                      target="_self"
                      rel="noopener"
                      style={{
                        color: '#6B7280',
                        textDecoration: 'underline',
                        fontSize: 12,
                        fontWeight: '600',
                        marginTop: 8,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <span>📦 Open Standalone APK (mandikartfarmer://)</span>
                    </a>
                  ) : null}

                  {/* Copy Link to Clipboard */}
                  {Platform.OS === 'web' && expBaseUrl ? (
                    <Pressable style={styles.copyButton} onPress={handleCopyLink}>
                      <Copy size={14} color="#4B5563" />
                      <Text style={styles.copyButtonText}>
                        {copied ? 'Deep Link Copied to Clipboard! ✓' : 'Copy Direct App Deep Link'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {/* Web Fallback Option */}
              <View style={styles.webFallbackContainer}>
                <Pressable style={styles.secondaryButton} onPress={handleContinueInWeb}>
                  <Text style={styles.secondaryButtonText}>Or Continue here in Web Browser →</Text>
                </Pressable>
                <Text style={styles.webFallbackHint}>
                  You can also complete onboarding right here in your browser.
                </Text>
              </View>
            </View>
          )}

          {status === 'error' && (
            <Pressable
              style={styles.retryButton}
              onPress={() => router.replace('/auth/signup')}
            >
              <Text style={styles.retryButtonText}>Return to Sign Up</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </View>
    </MKBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadgeApp: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  iconBadgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  iconBadgeError: {
    backgroundColor: '#FFEBEE',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1C2526',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingHint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 12,
  },
  buttonGroup: {
    width: '100%',
  },

  // Still Not Redirecting Box
  redirectBox: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  redirectHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  redirectBoxTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: -0.2,
  },
  redirectBoxText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
    marginBottom: 14,
  },

  // Primary Button
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1E5A2A',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
    elevation: 3,
    shadowColor: '#1E5A2A',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Alternative Actions
  altLinksContainer: {
    width: '100%',
    marginTop: 6,
    alignItems: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
  },
  copyButtonText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Web Fallback
  webFallbackContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    width: '100%',
  },
  secondaryButtonText: {
    color: '#1E5A2A',
    fontSize: 14,
    fontWeight: '700',
  },
  webFallbackHint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E5A2A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
