import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar, Alert,
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

  // Live password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { label: '', color: Colors.textDisabled };
    if (password.length < 6) return { label: 'Weak', color: Colors.error };
    if (password.length < 10) return { label: 'Good', color: '#F59E0B' };
    return { label: 'Strong', color: Colors.primary };
  };

  const strength = getPasswordStrength();

  const handleRegister = async () => {
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
      if (otpRes?.simulatedCode) {
        sendLocalOtpNotification(otpRes.simulatedCode, phone).catch(() => {});
      }

      // 2. Register real buyer account with original data in Supabase
      const res = await signUp({
        phone,
        fullName: name.trim(),
        email: email.trim() || undefined,
        password: password.trim() || undefined,
        buyerType: role === 'bulk' ? 'BULK' : 'RETAIL',
      });

      setLoading(false);
      if (res.success) {
        Alert.alert('Account Created! 🎉', 'Your MandiKart buyer account is now active.');
      } else {
        if (res.error?.includes('already exists')) {
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
      setLoading(false);
      Alert.alert('Error', e?.message || 'Failed to create account. Please try again.');
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
              onPress={handleRegister}
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
});
