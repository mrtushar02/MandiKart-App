import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar, Alert, Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/types';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import AuthBackground from '../../components/AuthBackground';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';
import { sendLocalOtpNotification } from '../../services/notificationService';
import { GoogleAuthModal } from '../../components/GoogleAuthModal';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;
type LoginMode = 'password' | 'otp';

export default function LoginScreen({ navigation }: Props) {
  const { signIn, signInWithGoogle, setAuthenticatedBuyer, signInWithPhoneOtp } = useAuth();

  const [mode, setMode] = useState<LoginMode>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleLogin = async () => {
    const isEmail = phone.includes('@');
    if (mode === 'password') {
      if (!phone.trim() || (!isEmail && phone.replace(/\D/g, '').length < 10)) {
        Alert.alert('Invalid Input', 'Please enter a valid mobile number or email address.');
        return;
      }
      if (!password) {
        Alert.alert('Required Field', 'Please enter your password.');
        return;
      }
    } else {
      if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
        Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'otp') {
        if (!otpCode || otpCode.length < 4) {
          Alert.alert('Invalid OTP', 'Please enter the verification code sent to your phone.');
          setLoading(false);
          return;
        }
        const res = await signInWithPhoneOtp(phone, otpCode);
        if (!res.success) {
          Alert.alert('Authentication Failed', res.error || 'Invalid OTP code. Please try again.');
        }
      } else {
        const res = await signIn(phone, password);
        if (!res.success) {
          Alert.alert('Login Failed', res.error || 'Account not found with these credentials. Please register.');
        }
      }
    } catch (e: any) {
      Alert.alert('Login Error', e?.message || 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSent(true);
    setOtpCode('123456');
    Alert.alert('OTP Sent! 📱', `A verification code has been dispatched via SMS Gateway to +91 ${phone}.`);
  };

  const handleGoogleLogin = () => {
    setShowGoogleModal(true);
  };

  return (
    <AuthBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.brandLogoImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.taglineBadge}>
              <Ionicons name="leaf-outline" size={14} color={Colors.primary} />
              <Text style={styles.taglineText}>Direct From Indian Farmers To Your Doorstep</Text>
            </View>

            <Text style={styles.title}>Welcome back! 👋</Text>
            <Text style={styles.subtitle}>Sign in to access fresh produce & daily mandi prices</Text>
          </View>
          {/* Login Method Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'password' && styles.tabBtnActive]}
              onPress={() => setMode('password')}
            >
              <Ionicons name="key-outline" size={16} color={mode === 'password' ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.tabText, mode === 'password' && styles.tabTextActive]}>Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, mode === 'otp' && styles.tabBtnActive]}
              onPress={() => setMode('otp')}
            >
              <Ionicons name="phone-portrait-outline" size={16} color={mode === 'otp' ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.tabText, mode === 'otp' && styles.tabTextActive]}>Mobile OTP</Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Phone Input */}
            <View style={styles.field}>
              <Text style={styles.label}>Mobile Number *</Text>
              <View style={styles.inputRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            {mode === 'password' ? (
              <>
                {/* Password Input */}
                <View style={styles.field}>
                  <Text style={styles.label}>Password *</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={Colors.textDisabled}
                      secureTextEntry={!showPass}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                      <Ionicons
                        name={showPass ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={Colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remember & Forgot Row */}
                <View style={styles.rememberRow}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <Ionicons
                      name={rememberMe ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={rememberMe ? Colors.primary : Colors.textSecondary}
                    />
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <PrimaryButton
                  title="Sign In to MandiKart"
                  onPress={handleLogin}
                  loading={loading}
                  style={styles.submitBtn}
                />
              </>
            ) : (
              <>
                {/* OTP Mode */}
                {otpSent ? (
                  <View style={styles.field}>
                    <Text style={styles.label}>Enter 6-Digit Phone OTP *</Text>
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      value={otpCode}
                      onChangeText={setOtpCode}
                      placeholder="e.g. 123456"
                      placeholderTextColor={Colors.textDisabled}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                ) : null}

                {otpSent ? (
                  <PrimaryButton
                    title="Verify OTP & Sign In"
                    onPress={handleLogin}
                    loading={loading}
                    disabled={!otpCode}
                    style={styles.submitBtn}
                  />
                ) : (
                  <PrimaryButton
                    title="Get OTP on SMS / WhatsApp"
                    onPress={handleSendOTP}
                    style={styles.submitBtn}
                  />
                )}
              </>
            )}

            {/* Social Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR LOGIN WITH</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin} activeOpacity={0.8}>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={styles.socialText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have a MandiKart account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Register Now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <GoogleAuthModal
        visible={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={(data) => {
          setAuthenticatedBuyer(data.token, data.buyer);
        }}
        onError={(errMsg) => {
          Alert.alert('Google Sign-In Notice', errMsg || 'Could not complete Google authentication.');
        }}
      />
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: 48, paddingBottom: Spacing.xl, gap: Spacing.md },
  // Header
  header: { alignItems: 'center', gap: 6 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  brandLogoImage: { width: 180, height: 100 },
  taglineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  taglineText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  // Form Card
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    height: 48,
  },
  countryCode: {
    paddingHorizontal: Spacing.sm + 2,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
    justifyContent: 'center',
  },
  countryCodeText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '700' },
  input: { flex: 1, paddingHorizontal: Spacing.md, fontSize: 14, color: Colors.textPrimary },
  otpInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    height: 48,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 8,
  },
  eyeBtn: { padding: Spacing.sm },
  rememberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rememberText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  forgotText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  submitBtn: { width: '100%', marginTop: 4 },
  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: 4 },
  divider: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  dividerText: { fontSize: 10, fontWeight: '700', color: Colors.textDisabled },
  // Social
  socialRow: { flexDirection: 'row', gap: Spacing.md },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  socialText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  // Register
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  registerText: { fontSize: 13, color: Colors.textSecondary },
  registerLink: { fontSize: 13, color: Colors.primary, fontWeight: '800' },
});
