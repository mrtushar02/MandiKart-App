import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';
import { usePartner } from '../context/PartnerContext';
import { GoogleAuthModal } from '../components/GoogleAuthModal';

export default function PartnerLoginScreen({ navigation }) {
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const { login, loginWithGoogle } = usePartner();

  const handleLogin = () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    // Authenticate delivery partner
    login(mobileNumber, password);

    // Reset navigation stack to MainTabs
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Explorer & Brand Bar */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.canGoBack() && navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Logo & Brand Header */}
          <View style={styles.headerBlock}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="seed" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.brandTitle}>MandiKart Partner</Text>
            <Text style={styles.brandSubtitle}>MandiKart Partner Logistics Network</Text>
          </View>

          {/* Login Card (Ported from Stitch) */}
          <View style={styles.loginCard}>
            <View style={styles.topGreenStripe} />

            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Welcome, Delivery Partner</Text>
              <Text style={styles.cardDesc}>Login to manage your deliveries and earnings.</Text>
            </View>

            {/* Mobile Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="phone-portrait-outline" size={20} color={COLORS.outline} style={styles.inputIcon} />
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor={COLORS.outlineVariant}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password / OTP</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.outline} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Enter password"
                  placeholderTextColor={COLORS.outlineVariant}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={COLORS.outline}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => Alert.alert('OTP Sent', 'A one-time reset code has been sent to your registered number.')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot Password / Request OTP</Text>
            </TouchableOpacity>

            {/* Login CTA */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>Login</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>

            {/* Social Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR LOGIN WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login CTA */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => setShowGoogleModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* New Partner Register */}
          <View style={styles.registerPrompt}>
            <Text style={styles.newPartnerText}>New delivery partner?</Text>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text style={styles.registerBtnText}>Register as Partner</Text>
            </TouchableOpacity>
          </View>

          {/* 3 Trust Badges from Stitch */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <View style={styles.trustIconCircle}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.trustTitle}>Verified{'\n'}Partners</Text>
            </View>

            <View style={styles.trustItem}>
              <View style={styles.trustIconCircle}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.trustTitle}>Secure{'\n'}Payments</Text>
            </View>

            <View style={styles.trustItem}>
              <View style={styles.trustIconCircle}>
                <Ionicons name="wallet" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.trustTitle}>Transparent{'\n'}Earnings</Text>
            </View>
          </View>

          {/* Legal Footnote */}
          <View style={styles.footerBlock}>
            <Text style={styles.footerText}>
              By logging in, you agree to our{' '}
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate('LegalPolicies')}
              >
                Terms of Service
              </Text>{' '}
              &{' '}
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate('LegalPolicies')}
              >
                Privacy Policy
              </Text>
            </Text>
            <Text style={styles.versionText}>v2.4.1 (Build 842)</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <GoogleAuthModal
        visible={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={(data) => {
          loginWithGoogle(data);
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }}
        onError={(err) => {
          Alert.alert('Google Sign-In Notice', err || 'Could not sign in with Google');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxxl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  explorerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  explorerText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: SPACING.sm,
  },
  brandTitle: {
    fontSize: FONT.xxxl,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  loginCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
    gap: SPACING.md,
  },
  topGreenStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.primary,
  },
  cardHeader: {
    marginBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  cardDesc: {
    fontSize: FONT.sm,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    height: 52,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  countryCode: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: FONT.base,
    color: COLORS.onSurface,
  },
  eyeBtn: {
    padding: 4,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
  },
  forgotText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: FONT.md,
    fontWeight: '800',
  },
  registerPrompt: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  newPartnerText: {
    fontSize: FONT.sm,
    color: COLORS.onSurfaceVariant,
  },
  registerBtn: {
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  registerBtnText: {
    color: COLORS.primary,
    fontSize: FONT.md,
    fontWeight: '800',
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.xs,
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  trustIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustTitle: {
    fontSize: FONT.xs,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 14,
  },
  footerBlock: {
    marginTop: SPACING.xxl,
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: FONT.xs,
    color: COLORS.outline,
    textAlign: 'center',
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  versionText: {
    fontSize: 10,
    color: COLORS.outlineVariant,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
    gap: SPACING.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    height: 50,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  googleBtnText: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
});
