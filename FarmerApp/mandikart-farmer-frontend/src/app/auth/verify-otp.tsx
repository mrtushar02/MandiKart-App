/**
 * MandiKart Farmer App — Screen 5: Verify Your Account (Mobile & Email OTP)
 * 
 * Supports both Mobile OTP and Email OTP verification screens with smooth tab
 * switching, 6-digit auto-shifting OTP boxes, resend timers, and state persistence.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  ShoppingBasket,
  Smartphone,
  Mail,
  Check,
  Edit3,
} from 'lucide-react-native';
import { MKBackground, MKButton, MKHeader } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { apiClient } from '@/services/apiClient';
import { firebaseAuthService } from '@/services/firebaseAuthService';

type VerificationMode = 'mobile' | 'email';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; name?: string; email?: string; code?: string }>();
  const { setPhoneNumber, setIsAuthenticated, setAuthenticated, user, setUser } = useAuthStore();
  const { t } = useTranslation();

  const [mode, setMode] = useState<VerificationMode>('mobile');

  // Mobile state
  const displayPhone = params.phone || user?.phone || '+91 98765 43210';
  const [mobileOtp, setMobileOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [mobileTimer, setMobileTimer] = useState<number>(45);
  const [mobileCanResend, setMobileCanResend] = useState<boolean>(false);
  const [mobileError, setMobileError] = useState<string>('');

  const userEnteredEmail = params.email?.trim() || user?.email?.trim() || '';
  const hasEmail = Boolean(userEnteredEmail);

  // Email state
  const [displayEmail, setDisplayEmail] = useState<string>(userEnteredEmail);
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [emailOtp, setEmailOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [emailTimer, setEmailTimer] = useState<number>(60);
  const [emailCanResend, setEmailCanResend] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');

  // Active development code (shown for instant 1-tap testing without waiting for carrier SMS)
  const [activeCode, setActiveCode] = useState<string>(params.code || '');

  const mobileInputRefs = useRef<Array<TextInput | null>>([]);
  const emailInputRefs = useRef<Array<TextInput | null>>([]);

  const autoFillOtp = (code: string) => {
    if (!code) return;
    const digits = code.trim().slice(0, 6).split('');
    while (digits.length < 6) digits.push('');
    if (mode === 'mobile') {
      setMobileOtp(digits);
      setMobileError('');
    } else {
      setEmailOtp(digits);
      setEmailError('');
    }
  };

  useEffect(() => {
    if (params.code) {
      setActiveCode(params.code);
      autoFillOtp(params.code);
    }
  }, [params.code]);

  // Mobile Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (mobileTimer > 0) {
      interval = setInterval(() => {
        setMobileTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setMobileCanResend(true);
    }
    return () => clearInterval(interval);
  }, [mobileTimer]);

  // Email Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (emailTimer > 0) {
      interval = setInterval(() => {
        setEmailTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setEmailCanResend(true);
    }
    return () => clearInterval(interval);
  }, [emailTimer]);

  const handleMobileOtpChange = (text: string, index: number) => {
    const newOtp = [...mobileOtp];
    newOtp[index] = text;
    setMobileOtp(newOtp);
    setMobileError('');

    if (text && index < 5) {
      mobileInputRefs.current[index + 1]?.focus();
    }
  };

  const handleMobileKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !mobileOtp[index] && index > 0) {
      mobileInputRefs.current[index - 1]?.focus();
    }
  };

  const handleEmailOtpChange = (text: string, index: number) => {
    const newOtp = [...emailOtp];
    newOtp[index] = text;
    setEmailOtp(newOtp);
    setEmailError('');

    if (text && index < 5) {
      emailInputRefs.current[index + 1]?.focus();
    }
  };

  const handleEmailKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !emailOtp[index] && index > 0) {
      emailInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (mode === 'mobile') {
      if (!mobileCanResend) return;
      setMobileTimer(45);
      setMobileCanResend(false);
      setMobileOtp(['', '', '', '', '', '']);
      mobileInputRefs.current[0]?.focus();
      try {
        const res = await firebaseAuthService.sendPhoneOtp(displayPhone);
        if (res.simulatedCode) {
          setActiveCode(res.simulatedCode);
          autoFillOtp(res.simulatedCode);
        }
        Alert.alert('OTP Sent', res.message || `A new verification code was sent to ${displayPhone}`);
      } catch (err: any) {
        setMobileError(err?.message || 'Failed to dispatch OTP');
      }
    } else {
      if (!emailCanResend) return;
      setEmailTimer(60);
      setEmailCanResend(false);
      setEmailOtp(['', '', '', '', '', '']);
      emailInputRefs.current[0]?.focus();
      try {
        const res: any = await apiClient.post('/auth/send-otp', { email: displayEmail, channel: 'EMAIL' });
        if (res?.data?.simulatedCode) {
          setActiveCode(res.data.simulatedCode);
          autoFillOtp(res.data.simulatedCode);
        }
        Alert.alert('Email OTP Sent', `A new verification code was sent to ${displayEmail}`);
      } catch (err: any) {
        setEmailError(err?.message || 'Failed to dispatch Email OTP');
      }
    }
  };

  const handleVerify = async () => {
    if (mode === 'mobile') {
      const enteredCode = mobileOtp.join('');
      if (enteredCode.length < 4) {
        setMobileError('Please enter the complete Mobile OTP');
        return;
      }

      try {
        const cleanPhone = displayPhone.replace(/\D/g, '').slice(-10);
        const result = await firebaseAuthService.verifyOtpAndSync(
          displayPhone,
          enteredCode,
          params.name || user?.name
        );

        if (result.success && result.token && result.farmer) {
          setAuthenticated(result.token, result.farmer);
          setUser({
            ...(user || {}),
            id: result.farmer.id,
            name: result.farmer.fullName || params.name || user?.name || `Farmer ${cleanPhone.slice(-4)}`,
            fullName: result.farmer.fullName || params.name || user?.name || `Farmer ${cleanPhone.slice(-4)}`,
            phone: result.farmer.phone || displayPhone,
            village: result.farmer.village || '',
            district: result.farmer.district || '',
            state: result.farmer.state || '',
            isVerified: true,
            role: 'FARMER',
          });

          const isNew = Boolean(
            result.isNewUser ||
            !result.farmer.village ||
            !result.farmer.farmSizeAcres
          );

          if (isNew) {
            router.replace('/onboarding/permissions');
          } else {
            router.replace('/(tabs)/home');
          }
          return;
        }
        setMobileError(result.error || 'Invalid verification code. Please try again.');
      } catch (err: any) {
        setMobileError(err?.message || 'Incorrect OTP or verification expired. Please try again.');
      }
    } else {
      const enteredCode = emailOtp.join('');
      if (enteredCode.length < 4) {
        setEmailError('Please enter the complete Email OTP');
        return;
      }

      try {
        const res: any = await apiClient.post('/auth/verify-otp', {
          email: displayEmail,
          otp: enteredCode,
          name: params.name || user?.name,
        });

        if (res?.data?.token && res?.data?.farmer) {
          setAuthenticated(res.data.token, res.data.farmer);
          setUser({
            ...(user || {}),
            id: res.data.farmer.id,
            name: res.data.farmer.fullName || params.name || user?.name || displayEmail.split('@')[0],
            fullName: res.data.farmer.fullName || params.name || user?.name || displayEmail.split('@')[0],
            email: displayEmail,
            village: res.data.farmer.village || '',
            district: res.data.farmer.district || '',
            state: res.data.farmer.state || '',
            isEmailVerified: true,
            role: 'FARMER',
          });

          const isNew = Boolean(
            res.data.isNewUser ||
            !res.data.farmer.village ||
            !res.data.farmer.farmSizeAcres
          );

          Alert.alert('Email Verified', 'Your email address has been verified successfully.', [
            {
              text: 'Continue',
              onPress: () => {
                if (isNew) {
                  router.replace('/onboarding/permissions');
                } else {
                  router.replace('/(tabs)/home');
                }
              },
            },
          ]);
          return;
        }
        setEmailError(res?.error?.message || 'Invalid email verification code.');
      } catch (err: any) {
        setEmailError(err?.message || 'Verification failed. Please check the code.');
      }
    }
  };

  return (
    <MKBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <MKHeader
          showBack={true}
          rightAction={
            <View style={styles.headerBasketBadge}>
              <ShoppingBasket size={22} color="#8A4A1C" strokeWidth={2.2} />
            </View>
          }
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Title */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>
              Verify Your <Text style={styles.titleGreen}>Account</Text>
            </Text>
            <Text style={styles.subtitle}>
              Secure your MandiKart profile to continue.
            </Text>
          </View>

          {/* Mode Switcher Tabs (Only shown if user entered an email) */}
          {hasEmail && (
            <View style={styles.modeTabsWrapper}>
              <Pressable
                style={[styles.modeTab, mode === 'mobile' && styles.modeTabActive]}
                onPress={() => setMode('mobile')}
              >
                <Smartphone
                  size={16}
                  color={mode === 'mobile' ? '#1B6D24' : '#6B7280'}
                  strokeWidth={mode === 'mobile' ? 2.5 : 2}
                />
                <Text style={[styles.modeTabText, mode === 'mobile' && styles.modeTabTextActive]}>
                  Mobile OTP
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modeTab, mode === 'email' && styles.modeTabActive]}
                onPress={() => setMode('email')}
              >
                <Mail
                  size={16}
                  color={mode === 'email' ? '#1B6D24' : '#6B7280'}
                  strokeWidth={mode === 'email' ? 2.5 : 2}
                />
                <Text style={[styles.modeTabText, mode === 'email' && styles.modeTabTextActive]}>
                  Email OTP
                </Text>
              </Pressable>
            </View>
          )}

          {/* Verification Card */}
          <View style={styles.card}>
            {mode === 'mobile' ? (
              <>
                <View style={styles.stepTitleRow}>
                  <View style={styles.stepCircle}>
                    <Text style={styles.stepNumber}>1</Text>
                  </View>
                  <Text style={styles.stepTitle}>Verify Mobile Number</Text>
                </View>

                {/* Phone Number Display Box */}
                <View style={styles.phoneBox}>
                  <View>
                    <Text style={styles.phoneLabel}>Phone Number</Text>
                    <Text style={styles.phoneValue}>{displayPhone}</Text>
                  </View>
                  <Pressable
                    onPress={() => router.back()}
                    style={styles.editButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.editText}>EDIT</Text>
                  </Pressable>
                </View>

                {/* Active Test OTP Code Helper */}
                {activeCode ? (
                  <Pressable
                    onPress={() => autoFillOtp(activeCode)}
                    style={styles.devCodeBanner}
                  >
                    <View style={styles.devCodeHeader}>
                      <Text style={styles.devCodeBadge}>⚡ TEST CODE AVAILABLE</Text>
                      <Text style={styles.devCodeTapPrompt}>Tap to auto-fill</Text>
                    </View>
                    <Text style={styles.devCodeDigits}>{activeCode}</Text>
                  </Pressable>
                ) : null}

                {/* OTP Section */}
                <View style={styles.otpSection}>
                  <Text style={styles.otpLabel}>Enter 6-digit Mobile OTP</Text>
                  <View style={styles.otpBoxesRow}>
                    {mobileOtp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(el) => {
                          mobileInputRefs.current[index] = el;
                        }}
                        style={[
                          styles.otpBox,
                          Boolean(digit) && styles.otpBoxFilled,
                          Boolean(mobileError) && styles.otpBoxError,
                        ]}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(text) => handleMobileOtpChange(text, index)}
                        onKeyPress={(e) => handleMobileKeyPress(e, index)}
                      />
                    ))}
                  </View>

                  {mobileError ? <Text style={styles.errorText}>{mobileError}</Text> : null}

                  {/* Timer & Resend */}
                  <View style={styles.resendRow}>
                    <Text style={styles.timerText}>
                      {mobileTimer > 0
                        ? `Resend OTP in 00:${mobileTimer < 10 ? `0${mobileTimer}` : mobileTimer}`
                        : 'Did not receive code?'}
                    </Text>
                    <Pressable
                      onPress={handleResend}
                      disabled={!mobileCanResend}
                      style={[styles.resendBtn, !mobileCanResend && styles.resendBtnDisabled]}
                    >
                      <Text
                        style={[
                          styles.resendBtnText,
                          mobileCanResend ? styles.resendBtnTextActive : styles.resendBtnTextDisabled,
                        ]}
                      >
                        RESEND OTP
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.stepTitleRow}>
                  <View style={[styles.stepCircle, { backgroundColor: '#FF8A00' }]}>
                    <Mail size={14} color="#FFF" />
                  </View>
                  <Text style={styles.stepTitle}>Verify Email Address</Text>
                </View>

                {/* Email Display Box */}
                <View style={styles.phoneBox}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.phoneLabel}>Email Address</Text>
                    {isEditingEmail ? (
                      <TextInput
                        style={styles.emailEditInput}
                        value={displayEmail}
                        onChangeText={setDisplayEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoFocus
                      />
                    ) : (
                      <Text numberOfLines={1} style={styles.phoneValue}>
                        {displayEmail}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => setIsEditingEmail(!isEditingEmail)}
                    style={styles.editButton}
                    accessibilityRole="button"
                  >
                    <Text style={styles.editText}>{isEditingEmail ? 'SAVE' : 'EDIT'}</Text>
                  </Pressable>
                </View>

                {/* Active Test OTP Code Helper */}
                {activeCode ? (
                  <Pressable
                    onPress={() => autoFillOtp(activeCode)}
                    style={styles.devCodeBanner}
                  >
                    <View style={styles.devCodeHeader}>
                      <Text style={styles.devCodeBadge}>⚡ TEST CODE AVAILABLE</Text>
                      <Text style={styles.devCodeTapPrompt}>Tap to auto-fill</Text>
                    </View>
                    <Text style={styles.devCodeDigits}>{activeCode}</Text>
                  </Pressable>
                ) : null}

                {/* OTP Section */}
                <View style={styles.otpSection}>
                  <Text style={styles.otpLabel}>Enter 6-digit Email Verification Code</Text>
                  <View style={styles.otpBoxesRow}>
                    {emailOtp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(el) => {
                          emailInputRefs.current[index] = el;
                        }}
                        style={[
                          styles.otpBox,
                          Boolean(digit) && styles.otpBoxFilled,
                          Boolean(emailError) && styles.otpBoxError,
                        ]}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(text) => handleEmailOtpChange(text, index)}
                        onKeyPress={(e) => handleEmailKeyPress(e, index)}
                      />
                    ))}
                  </View>

                  {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                  {/* Timer & Resend */}
                  <View style={styles.resendRow}>
                    <Text style={styles.timerText}>
                      {emailTimer > 0
                        ? `Resend Code in 00:${emailTimer < 10 ? `0${emailTimer}` : emailTimer}`
                        : 'Did not receive code?'}
                    </Text>
                    <Pressable
                      onPress={handleResend}
                      disabled={!emailCanResend}
                      style={[styles.resendBtn, !emailCanResend && styles.resendBtnDisabled]}
                    >
                      <Text
                        style={[
                          styles.resendBtnText,
                          emailCanResend ? styles.resendBtnTextActive : styles.resendBtnTextDisabled,
                        ]}
                      >
                        RESEND CODE
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Security Note & Primary Continue CTA */}
          <View style={styles.footerArea}>
            <View style={styles.securityRow}>
              <ShieldCheck size={16} color="#1E5A2A" strokeWidth={2} />
              <Text style={styles.securityText}>Your information is safe and secure</Text>
            </View>

            <MKButton
              title={mode === 'mobile' ? 'VERIFY MOBILE OTP' : 'VERIFY EMAIL OTP'}
              onPress={handleVerify}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.continueBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </MKBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerBasketBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDEFE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBlock: {
    marginTop: 14,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#241913',
    letterSpacing: -0.5,
  },
  titleGreen: {
    color: '#1E5A2A',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
    lineHeight: 20,
  },

  // Mode Switcher Tabs
  modeTabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#ECEAE3',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  modeTabTextActive: {
    color: '#1B6D24',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 24,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E5A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#241913',
  },
  phoneBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECEAE3',
    marginBottom: 24,
  },
  phoneLabel: {
    fontSize: 12,
    color: '#8A817C',
    fontWeight: '500',
    marginBottom: 4,
  },
  phoneValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#241913',
  },
  emailEditInput: {
    fontSize: 15,
    fontWeight: '700',
    color: '#241913',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#1B6D24',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  editText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E5A2A',
  },
  otpSection: {
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FAF8F5',
    fontSize: 22,
    fontWeight: '700',
    color: '#241913',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: '#1E5A2A',
    backgroundColor: '#FFFFFF',
  },
  otpBoxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  timerText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  resendBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendBtnDisabled: {
    opacity: 0.5,
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resendBtnTextActive: {
    color: '#EF7D1A',
  },
  resendBtnTextDisabled: {
    color: '#9CA3AF',
  },
  footerArea: {
    alignItems: 'center',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  securityText: {
    fontSize: 13,
    color: '#1E5A2A',
    fontWeight: '600',
    marginLeft: 6,
  },
  continueBtn: {
    shadowColor: '#1E5A2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  devCodeBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    width: '100%',
  },
  devCodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  devCodeBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  devCodeTapPrompt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    textDecorationLine: 'underline',
  },
  devCodeDigits: {
    fontSize: 22,
    fontWeight: '900',
    color: '#065F46',
    letterSpacing: 6,
    textAlign: 'center',
  },
});
