import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar, Alert, Modal, ActivityIndicator,
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type UserRole = 'household' | 'bulk';

export default function RegisterScreen({ navigation }: Props) {
  const { signUp, signInWithGoogle, setAuthenticatedBuyer } = useAuth();

  const [role, setRole] = useState<UserRole>('household');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showReferral, setShowReferral] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [simulatedOtpCode, setSimulatedOtpCode] = useState('123456');

  useEffect(() => {
    let interval: any;
    if (showOtpModal && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, resendTimer]);

  // Live password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { label: '', color: Colors.textDisabled };
    if (password.length < 6) return { label: 'Weak', color: Colors.error };
    if (password.length < 10) return { label: 'Good', color: '#F59E0B' };
    return { label: 'Strong', color: Colors.primary };
  };

  const strength = getPasswordStrength();

  const handleInitiateRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your Full Name.');
      return;
    }
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }
    if (!agreed) {
      Alert.alert('Terms Required', 'Please accept the Terms of Service to create an account.');
      return;
    }

    setLoading(true);
    try {
      // 1. Dispatch SMS OTP & Native Mobile Notification
      const otpRes = await apiClient.auth.sendOtp(phone);
      const code = otpRes?.simulatedCode || '123456';
      setSimulatedOtpCode(code);
      setOtpValue(code); // Pre-fill for seamless testing while still gating verification
      sendLocalOtpNotification(code, phone).catch(() => {});

      setLoading(false);
      setResendTimer(30);
      setShowOtpModal(true);
    } catch (e: any) {
      setLoading(false);
      Alert.alert('OTP Error', e?.message || 'Failed to dispatch verification OTP.');
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      const otpRes = await apiClient.auth.sendOtp(phone);
      const code = otpRes?.simulatedCode || '123456';
      setSimulatedOtpCode(code);
      setOtpValue(code);
      sendLocalOtpNotification(code, phone).catch(() => {});
      setResendTimer(30);
      Alert.alert('OTP Resent', `A fresh 6-digit code was sent to +91 ${phone}`);
    } catch (e: any) {
      Alert.alert('Resend Failed', e?.message || 'Could not resend OTP code.');
    }
  };

  const handleVerifyOtpAndSignUp = async () => {
    if (!otpValue || otpValue.trim().length < 4) {
      Alert.alert('Required', 'Please enter the 6-digit verification code.');
      return;
    }

    setVerifyingOtp(true);
    try {
      // 1. Verify OTP with backend
      const verifyRes = await apiClient.auth.verifyOtp(phone, otpValue.trim());
      if (!verifyRes.success) {
        setVerifyingOtp(false);
        Alert.alert('Invalid Code', verifyRes.message || 'The OTP code is incorrect or expired.');
        return;
      }

      // 2. Register real buyer account with original data in Supabase
      const res = await signUp({
        phone,
        fullName: name.trim(),
        email: email.trim() || undefined,
        password: password.trim() || undefined,
        buyerType: role === 'bulk' ? 'BULK' : 'RETAIL',
      });

      setVerifyingOtp(false);
      if (res.success) {
        setShowOtpModal(false);
        Alert.alert('Account Verified! 🎉', 'Your MandiKart buyer account is now active.');
      } else {
        if (res.error?.includes('already exists')) {
          setShowOtpModal(false);
          Alert.alert(
            'Account Exists',
            res.error,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign In', onPress: () => navigation.navigate('Login') },
            ]
          );
        } else {
          Alert.alert('Registration Notice', res.error || 'Failed to complete registration.');
        }
      }
    } catch (e: any) {
      setVerifyingOtp(false);
      Alert.alert('Error', e?.message || 'Failed to complete account verification.');
    }
  };

  const handleSocialSignup = () => {
    setShowGoogleModal(true);
  };

  return (
    <AuthBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        {/* Back Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Header Title */}
          <View style={styles.header}>
            <View style={styles.badgeWrap}>
              <Ionicons name="sparkles" size={14} color={Colors.primary} />
              <Text style={styles.badgeText}>Welcome to MandiKart</Text>
            </View>
            <Text style={styles.title}>Create Account 🎉</Text>
            <Text style={styles.subtitle}>Direct access to farm-fresh produce at wholesale prices</Text>
          </View>

          {/* Account Role Selector */}
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'household' && styles.roleBtnActive]}
              onPress={() => setRole('household')}
            >
              <Text style={styles.roleEmoji}>🛒</Text>
              <View>
                <Text style={[styles.roleTitle, role === 'household' && styles.roleTextActive]}>Household Buyer</Text>
                <Text style={[styles.roleSub, role === 'household' && styles.roleSubActive]}>For personal fresh groceries</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleBtn, role === 'bulk' && styles.roleBtnActive]}
              onPress={() => setRole('bulk')}
            >
              <Text style={styles.roleEmoji}>🏪</Text>
              <View>
                <Text style={[styles.roleTitle, role === 'bulk' && styles.roleTextActive]}>Hotel & Bulk Buyer</Text>
                <Text style={[styles.roleSub, role === 'bulk' && styles.roleSubActive]}>For commercial quantity rates</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Full Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color={Colors.textSecondary} style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.textDisabled}
                />
              </View>
            </View>

            {/* Mobile Number */}
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
                  placeholder="10-digit mobile number"
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Email (Optional) */}
            <View style={styles.field}>
              <Text style={styles.label}>Email Address (Optional)</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password *</Text>
                {strength.label ? (
                  <Text style={[styles.strengthText, { color: strength.color }]}>
                    Strength: {strength.label}
                  </Text>
                ) : null}
              </View>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min 6 characters"
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

            {/* Expandable Referral Code */}
            {!showReferral ? (
              <TouchableOpacity onPress={() => setShowReferral(true)} style={styles.referralToggle}>
                <Ionicons name="gift-outline" size={16} color={Colors.primary} />
                <Text style={styles.referralToggleText}>Have a referral code? Get ₹50 bonus!</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.field}>
                <Text style={styles.label}>Referral / Promo Code</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="gift-outline" size={18} color={Colors.primary} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.input}
                    value={referralCode}
                    onChangeText={setReferralCode}
                    placeholder="e.g. MANDI50"
                    placeholderTextColor={Colors.textDisabled}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            )}

            {/* Terms Checkbox */}
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgreed(!agreed)}>
              <Ionicons
                name={agreed ? 'checkbox' : 'square-outline'}
                size={20}
                color={agreed ? Colors.primary : Colors.textSecondary}
              />
              <Text style={styles.termsText}>
                I agree to MandiKart's <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <PrimaryButton
              title="Create My Account & Verify OTP"
              onPress={handleInitiateRegister}
              loading={loading}
              disabled={!name || phone.length < 10 || password.length < 6 || !agreed}
              style={styles.submitBtn}
            />

            {/* Social Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={handleSocialSignup}>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialBtn} onPress={handleSocialSignup}>
                <Ionicons name="logo-apple" size={18} color="#000000" />
                <Text style={styles.socialText}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Login Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In Here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 6-Digit OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBadge}>
                <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
                <Text style={styles.modalBadgeText}>Secure Verification</Text>
              </View>
              <TouchableOpacity onPress={() => setShowOtpModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Enter 6-Digit OTP</Text>
            <Text style={styles.modalSubtitle}>
              We sent a verification code to <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>+91 {phone}</Text>
            </Text>

            <View style={styles.otpBanner}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
              <Text style={styles.otpBannerText}>
                Live Test Code: <Text style={{ fontWeight: '800' }}>{simulatedOtpCode}</Text> (auto-filled)
              </Text>
            </View>

            <View style={styles.otpInputContainer}>
              <TextInput
                style={styles.otpInput}
                value={otpValue}
                onChangeText={setOtpValue}
                placeholder="••••••"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            <View style={styles.resendRow}>
              {resendTimer > 0 ? (
                <Text style={styles.timerText}>Resend code in {resendTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={styles.resendLink}>Resend OTP Code</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, (!otpValue || verifyingOtp) && styles.verifyButtonDisabled]}
              onPress={handleVerifyOtpAndSignUp}
              disabled={!otpValue || verifyingOtp}
            >
              {verifyingOtp ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                  <Text style={styles.verifyButtonText}>Verify & Activate Account</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editPhoneBtn}
              onPress={() => setShowOtpModal(false)}
            >
              <Text style={styles.editPhoneText}>Edit Mobile Number</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  headerBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  backBtn: { padding: 4 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.xl, gap: Spacing.md },
  // Header
  header: { gap: 6 },
  badgeWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary },
  // Role Selector
  roleContainer: { gap: Spacing.sm },
  roleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  roleBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  roleEmoji: { fontSize: 22 },
  roleTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  roleTextActive: { color: Colors.primary },
  roleSub: { fontSize: 11, color: Colors.textSecondary },
  roleSubActive: { color: Colors.primary },
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
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  strengthText: { fontSize: 11, fontWeight: '700' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    height: 48,
    paddingHorizontal: Spacing.sm + 2,
  },
  fieldIcon: { marginRight: 8 },
  countryCode: {
    paddingRight: Spacing.sm,
    marginRight: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
    justifyContent: 'center',
    height: '100%',
  },
  countryCodeText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '700' },
  input: { flex: 1, height: '100%', fontSize: 14, color: Colors.textPrimary },
  eyeBtn: { padding: Spacing.xs },
  // Referral Toggle
  referralToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 },
  referralToggleText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  // Terms Checkbox
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginVertical: 2 },
  termsText: { flex: 1, fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  termsLink: { color: Colors.primary, fontWeight: '700' },
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
  // Footer
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  footerText: { fontSize: 13, color: Colors.textSecondary },
  footerLink: { fontSize: 13, color: Colors.primary, fontWeight: '800' },
  // OTP Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  modalBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  closeBtn: { padding: 4 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  modalSubtitle: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  otpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  otpBannerText: { fontSize: 12, color: Colors.primary, flex: 1 },
  otpInputContainer: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpInput: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 12,
    textAlign: 'center',
    width: '100%',
  },
  resendRow: { alignItems: 'center', marginVertical: 4 },
  timerText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  resendLink: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  verifyButtonDisabled: { opacity: 0.6 },
  verifyButtonText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  editPhoneBtn: { alignItems: 'center', paddingVertical: Spacing.xs },
  editPhoneText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
});
