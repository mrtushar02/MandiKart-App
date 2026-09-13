import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';
import { usePartner } from '../context/PartnerContext';
import { GoogleAuthModal } from '../components/GoogleAuthModal';

export default function PartnerRegisterScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Personal, 2: Vehicle, 3: Bank
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('2_wheeler');
  const [dlNumber, setDlNumber] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  
  // OTP Verification States
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('334455');
  const [resendTimer, setResendTimer] = useState(30);

  const { loginWithGoogle } = usePartner();

  useEffect(() => {
    let timer;
    if (showOtpModal && resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, resendTimer]);

  const handleTriggerOtp = () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpInput('334455');
    setResendTimer(30);
    setShowOtpModal(true);
    Alert.alert('OTP Dispatched 📲', `A 6-digit verification code (334455) was sent to +91 ${phone}`);
  };

  const handleVerifyOtp = () => {
    if (!otpInput || otpInput.length < 4) {
      Alert.alert('Required', 'Please enter the 6-digit verification OTP.');
      return;
    }
    setPhoneVerified(true);
    setShowOtpModal(false);
    Alert.alert('Mobile Verified! ✓', 'Your phone number has been verified successfully.');
    setCurrentStep(2);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!fullName.trim()) {
        Alert.alert('Required', 'Please enter your Full Name.');
        return;
      }
      if (!phone || phone.length < 10) {
        Alert.alert('Required', 'Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!phoneVerified) {
        handleTriggerOtp();
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else {
      Alert.alert(
        'Registration Successful! 🎉',
        'Welcome to MandiKart Partner! Your profile and mobile have been verified. Please login to start delivering.',
        [
          {
            text: 'Proceed to Login',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            },
          },
        ]
      );
    }
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
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (currentStep > 1) {
                  setCurrentStep(currentStep - 1);
                } else {
                  navigation.goBack();
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.pageTitle}>Partner Registration</Text>
            <Text style={styles.pageSubtitle}>Join Odisha's Largest Agro-Logistics Delivery Network</Text>
          </View>

          {/* Stepper Header */}
          <View style={styles.stepHeader}>
            <View style={styles.stepIndicatorRow}>
              <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, currentStep >= 1 && styles.stepDotTextActive]}>1</Text>
              </View>
              <View style={[styles.stepBar, currentStep >= 2 && styles.stepBarActive]} />
              <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, currentStep >= 2 && styles.stepDotTextActive]}>2</Text>
              </View>
              <View style={[styles.stepBar, currentStep >= 3 && styles.stepBarActive]} />
              <View style={[styles.stepDot, currentStep >= 3 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, currentStep >= 3 && styles.stepDotTextActive]}>3</Text>
              </View>
            </View>

            <View style={styles.stepLabelsRow}>
              <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelHighlight]}>Personal</Text>
              <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelHighlight]}>Vehicle & DL</Text>
              <Text style={[styles.stepLabel, currentStep === 3 && styles.stepLabelHighlight]}>Bank Payout</Text>
            </View>
          </View>

          {/* Step 1: Personal Details */}
          {currentStep === 1 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepCardTitle}>Personal Details</Text>
              <Text style={styles.stepCardSubtitle}>Enter your official identity details</Text>

              {/* Quick Google Pre-Fill / Signup */}
              <TouchableOpacity
                style={styles.googleRegisterBtn}
                onPress={() => setShowGoogleModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={styles.googleRegisterBtnText}>Quick Sign-Up with Google</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR ENTER MANUALLY</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name (as on Aadhaar / DL)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>WhatsApp / Mobile Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="10-digit number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Aadhaar Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="12-digit UIDAI number"
                  keyboardType="number-pad"
                  maxLength={12}
                  value={aadhaar}
                  onChangeText={setAadhaar}
                />
              </View>

              <View style={styles.uploadBox}>
                <Ionicons name="cloud-upload-outline" size={24} color={COLORS.primary} />
                <Text style={styles.uploadText}>Upload Aadhaar Card Photo (Front & Back)</Text>
                <Text style={styles.uploadSubtext}>JPG, PNG or PDF up to 5MB</Text>
              </View>
            </View>
          )}

          {/* Step 2: Vehicle & Driving License */}
          {currentStep === 2 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepCardTitle}>Vehicle Information</Text>
              <Text style={styles.stepCardSubtitle}>Select what you will use for Mandi farm pickups</Text>

              <View style={styles.vehicleOptions}>
                {[
                  {
                    id: '2_wheeler',
                    title: '2-Wheeler / Electric Bike',
                    capacity: 'Up to 150 kg produce capacity',
                    icon: 'bicycle',
                  },
                  {
                    id: '3_wheeler',
                    title: '3-Wheeler Electric Cargo',
                    capacity: 'Up to 450 kg produce capacity',
                    icon: 'rickshaw',
                  },
                  {
                    id: 'mini_truck',
                    title: 'Mini Truck (Tata Ace / Bolero)',
                    capacity: 'Up to 1,200 kg heavy produce',
                    icon: 'truck',
                  },
                ].map(v => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.vehicleCard,
                      selectedVehicle === v.id && styles.vehicleCardSelected,
                    ]}
                    onPress={() => setSelectedVehicle(v.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioCircle, selectedVehicle === v.id && styles.radioCircleActive]}>
                      {selectedVehicle === v.id && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.vehicleTitle}>{v.title}</Text>
                      <Text style={styles.vehicleDesc}>{v.capacity}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Driving License Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. OD0220220019284"
                  autoCapitalize="characters"
                  value={dlNumber}
                  onChangeText={setDlNumber}
                />
              </View>

              <View style={styles.uploadBox}>
                <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                <Text style={styles.uploadText}>Capture or Upload Driving License Photo</Text>
              </View>
            </View>
          )}

          {/* Step 3: Bank Account for Payouts */}
          {currentStep === 3 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepCardTitle}>Bank & Weekly Payouts</Text>
              <Text style={styles.stepCardSubtitle}>Earnings are auto-credited every Monday</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bank Account Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter Account Number"
                  keyboardType="number-pad"
                  value={bankAccount}
                  onChangeText={setBankAccount}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bank IFSC Code</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. HDFC0001289"
                  autoCapitalize="characters"
                  value={ifsc}
                  onChangeText={setIfsc}
                />
              </View>

              <View style={styles.payoutNotice}>
                <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                <Text style={styles.payoutNoticeText}>
                  Your bank account must match the name on your Aadhaar card for instant weekly settlement.
                </Text>
              </View>
            </View>
          )}

          {/* Next / Submit Button */}
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {currentStep === 3 ? 'Submit Application' : 'Continue to Next Step'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alreadyRegistered}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.alreadyRegisteredText}>
              Already registered? <Text style={{ color: COLORS.primary, fontWeight: '800' }}>Login here</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <GoogleAuthModal
        visible={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={(data) => {
          loginWithGoogle(data);
          Alert.alert(
            'Google Verified! 🎉',
            'Your delivery partner account has been created and verified with Google.',
            [
              {
                text: 'Go to Dashboard',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' }],
                  });
                },
              },
            ]
          );
        }}
        onError={(err) => {
          Alert.alert('Google Sign-In Notice', err || 'Could not sign in with Google');
        }}
      />

      {/* 6-Digit Mobile Verification Modal */}
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
                <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
                <Text style={styles.modalBadgeText}>Partner Verification</Text>
              </View>
              <TouchableOpacity onPress={() => setShowOtpModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.outline} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Enter 6-Digit OTP</Text>
            <Text style={styles.modalSubtitle}>
              Dispatched to registered mobile <Text style={{ fontWeight: '700', color: COLORS.onSurface }}>+91 {phone}</Text>
            </Text>

            <View style={styles.otpBanner}>
              <Ionicons name="information-circle" size={16} color={COLORS.primary} />
              <Text style={styles.otpBannerText}>
                Active Demo Code: <Text style={{ fontWeight: '800' }}>334455</Text> (auto-dispatched)
              </Text>
            </View>

            <View style={styles.otpInputContainer}>
              <TextInput
                style={styles.otpInput}
                value={otpInput}
                onChangeText={setOtpInput}
                placeholder="••••••"
                placeholderTextColor={COLORS.outlineVariant}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            <View style={styles.resendRow}>
              {resendTimer > 0 ? (
                <Text style={styles.timerText}>Resend code in {resendTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleTriggerOtp}>
                  <Text style={styles.resendLink}>Resend OTP Code</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.verifyModalBtn}
              onPress={handleVerifyOtp}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
              <Text style={styles.verifyModalBtnText}>Verify & Proceed to Step 2</Text>
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
  topBar: {
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
  headerTitleBlock: {
    marginBottom: SPACING.lg,
  },
  pageTitle: {
    fontSize: FONT.xxxl,
    fontWeight: '900',
    color: COLORS.primary,
  },
  pageSubtitle: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  stepHeader: {
    marginBottom: SPACING.xl,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepDotText: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  stepDotTextActive: {
    color: COLORS.white,
  },
  stepBar: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.surfaceContainerHighest,
    marginHorizontal: 4,
  },
  stepBarActive: {
    backgroundColor: COLORS.primary,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  stepLabel: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  stepLabelHighlight: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  stepCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.md,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  stepCardTitle: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  stepCardSubtitle: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: -4,
    marginBottom: SPACING.xs,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    marginLeft: 2,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    height: 50,
    paddingHorizontal: SPACING.md,
    fontSize: FONT.base,
    color: COLORS.onSurface,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    gap: 4,
    marginTop: SPACING.xs,
  },
  uploadText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
  },
  vehicleOptions: {
    gap: SPACING.sm,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  vehicleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryBg,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  vehicleTitle: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  vehicleDesc: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  payoutNotice: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  payoutNoticeText: {
    flex: 1,
    fontSize: FONT.xs,
    color: COLORS.primary,
    lineHeight: 16,
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  nextBtnText: {
    color: COLORS.white,
    fontSize: FONT.md,
    fontWeight: '800',
  },
  alreadyRegistered: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  alreadyRegisteredText: {
    fontSize: FONT.sm,
    color: COLORS.onSurfaceVariant,
  },
  googleRegisterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    height: 48,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  googleRegisterBtnText: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  // OTP Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
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
    backgroundColor: COLORS.primaryLight + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  modalBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  closeBtn: { padding: 4 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface },
  modalSubtitle: { fontSize: 13, color: COLORS.onSurfaceVariant, lineHeight: 18 },
  otpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight + '25',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
  },
  otpBannerText: { fontSize: 12, color: COLORS.primary, flex: 1 },
  otpInputContainer: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpInput: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.onSurface,
    letterSpacing: 10,
    textAlign: 'center',
    width: '100%',
  },
  resendRow: { alignItems: 'center', marginVertical: 4 },
  timerText: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '600' },
  resendLink: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  verifyModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  verifyModalBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  editPhoneBtn: { alignItems: 'center', paddingVertical: SPACING.xs },
  editPhoneText: { fontSize: 13, color: COLORS.onSurfaceVariant, fontWeight: '600' },
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
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
});
