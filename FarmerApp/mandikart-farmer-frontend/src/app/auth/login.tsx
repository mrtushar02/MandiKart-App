/**
 * MandiKart Farmer App — Screen 4: Login (Secure Access)
 * 
 * Implements the approved Stitch visual design:
 * Brand badge header, elevated tactile card, phone + password inputs,
 * primary green CTA, "Login with OTP" alternate option, and signup link.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sprout, Lock, Eye, EyeOff, ArrowRight, KeyRound } from 'lucide-react-native';
import { MKBackground, MKButton, MKInput, MKHeader, MKGoogleButton } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/apiClient';
import { promptGoogleSignIn } from '@/services/googleAuth';
import { firebaseAuthService } from '@/services/firebaseAuthService';
import { GoogleAuthModal } from '@/components/GoogleAuthModal';

export default function LoginScreen() {
  const router = useRouter();
  const { setPhoneNumber, setIsAuthenticated, setAuthenticated, setUser } = useAuthStore();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      setGoogleLoading(true);
      try {
        const cleanPhone = mobile.replace(/\D/g, '').slice(-10);
        const result = await firebaseAuthService.signInWithGoogleFirebase(
          cleanPhone ? `+91${cleanPhone}` : undefined
        );

        if (result.error === 'REDIRECTING') return;

        if (!result.success || !result.farmer) {
          if (result.error && !result.error.includes('cancelled')) {
            Alert.alert('Google Sign-In', result.error);
          }
          return;
        }

        if (result.farmer.village || result.farmer.farmSizeAcres) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/onboarding/permissions');
        }
      } catch (err: any) {
        setErrors({ mobile: err?.message || 'Could not connect to Google authentication service.' });
      } finally {
        setGoogleLoading(false);
      }
      return;
    }

    // On Native (Android / iOS): Open in-app Google Auth Modal
    setGoogleModalVisible(true);
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!mobile.trim() || mobile.length < 10) errs.mobile = 'Enter a valid 10-digit mobile number';
    if (!password.trim()) errs.password = 'Enter your password';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      const cleanPhone = mobile.replace(/\D/g, '').slice(-10);
      const res: any = await apiClient.post('/auth/login', {
        phone: cleanPhone,
        password: password,
      });

      if (res?.data?.token && res?.data?.farmer) {
        setAuthenticated(res.data.token, res.data.farmer);
        setPhoneNumber(`+91${cleanPhone}`);
        router.replace('/(tabs)/home');
        return;
      }
      setErrors({ mobile: res?.error?.message || 'Login failed. Please check your credentials.' });
    } catch (err: any) {
      setErrors({ mobile: err?.message || 'No farmer account found with this mobile number. Please register.' });
    }
  };

  const handleLoginWithOtp = async () => {
    if (!mobile.trim() || mobile.length < 10) {
      setErrors({ mobile: 'Enter your 10-digit number to receive OTP' });
      return;
    }
    const cleanPhone = mobile.replace(/\D/g, '').slice(-10);
    setPhoneNumber(`+91${cleanPhone}`);

    try {
      const res = await firebaseAuthService.sendPhoneOtp(mobile);
      router.push({
        pathname: '/auth/verify-otp',
        params: {
          phone: `+91 ${cleanPhone}`,
          code: res.simulatedCode || '',
        },
      });
    } catch {
      router.push({
        pathname: '/auth/verify-otp',
        params: { phone: `+91 ${cleanPhone}` },
      });
    }
  };

  const handleSignUpNav = () => {
    router.push('/auth/signup');
  };

  return (
    <MKBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <MKHeader showBack={true} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Branding Section */}
          <View style={styles.brandingHeader}>
            <View style={styles.logoBadge}>
              <Sprout size={32} color="#1E5A2A" strokeWidth={2.2} />
            </View>
            <Text style={styles.brandTitle}>MandiKart</Text>
            <Text style={styles.brandSubtitle}>Farmer Platform</Text>
          </View>

          {/* Login Card */}
          <View style={styles.loginCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Text style={styles.cardSubtitle}>Sign in to continue selling produce.</Text>
            </View>

            <View style={styles.form}>
              <MKInput
                label="MOBILE NUMBER"
                placeholder="Enter your 10-digit number"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                maxLength={10}
                isPhoneInput={true}
                error={errors.mobile}
              />

              <MKInput
                label="PASSWORD"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                error={errors.password}
                leftIcon={<Lock size={18} color="#5F6368" />}
                rightIcon={
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={20} color="#5F6368" />
                    ) : (
                      <Eye size={20} color="#5F6368" />
                    )}
                  </Pressable>
                }
              />

              {/* Forgot Password */}
              <Pressable style={styles.forgotPasswordRow}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Pressable>

              {/* Primary Login Button */}
              <View style={styles.buttonWrapper}>
                <MKButton
                  title="LOG IN"
                  onPress={handleLogin}
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />}
                />
              </View>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Authentication Button */}
              <MKGoogleButton
                mode="signin"
                loading={googleLoading}
                onPress={handleGoogleLogin}
                style={{ marginBottom: 12 }}
              />

              {/* Login with OTP Button */}
              <MKButton
                title="LOGIN WITH OTP"
                onPress={handleLoginWithOtp}
                variant="secondary"
                size="md"
                leftIcon={<KeyRound size={18} color="#1E5A2A" strokeWidth={2.2} />}
              />
            </View>
          </View>

          {/* Footer Navigation */}
          <View style={styles.footerLinkRow}>
            <Text style={styles.footerText}>New to MandiKart? </Text>
            <Pressable onPress={handleSignUpNav}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </Pressable>
          </View>

          {/* Terms & Privacy Link */}
          <Pressable onPress={() => router.push('/more/terms-privacy')} style={{ marginTop: 14, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#1E5A2A', textDecorationLine: 'underline', fontWeight: '600' }}>
              MandiKart Terms & Privacy Charter ↗
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* In-App Google Firebase Auth Modal */}
      <GoogleAuthModal
        visible={googleModalVisible}
        onClose={() => setGoogleModalVisible(false)}
        pendingPhone={mobile ? `+91${mobile.replace(/\D/g, '').slice(-10)}` : undefined}
        onSuccess={(farmer, isNewUser) => {
          const isComplete = Boolean(
            !isNewUser &&
            farmer?.village &&
            (farmer?.farmSizeAcres || (farmer as any)?.farm_size_acres)
          );
          if (isComplete) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/onboarding/permissions');
          }
        }}
        onError={(err) => {
          Alert.alert('Google Sign-In', err);
        }}
      />
    </MKBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  brandingHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E5A2A',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#5F6368',
    fontWeight: '500',
    marginTop: 2,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0ECE4',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 22,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#5F6368',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  forgotPasswordRow: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#1E5A2A',
    fontWeight: '600',
  },
  buttonWrapper: {
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E5DD',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#9AA0A6',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#5F6368',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E5A2A',
  },
});
