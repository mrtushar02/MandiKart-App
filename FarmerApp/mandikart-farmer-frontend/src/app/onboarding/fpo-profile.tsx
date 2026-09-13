/**
 * MandiKart Farmer App — FPO Onboarding Step 2
 * Screen: FPO Representative Personal Profile
 *
 * Collects the CEO/Chairman's personal info after they chose FPO role.
 * Design: blue FPO identity (#1B4D8E), warm cream background, step 2-of-4.
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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ArrowRight,
  User,
  Phone,
  Mail,
  Briefcase,
  ChevronDown,
  Camera,
  Check,
  ShieldCheck,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/apiClient';
import { pickImageFromGallery, takePhotoWithCamera } from '@/services/imagePickerService';

const FPO_BLUE   = '#1B4D8E';
const FPO_LIGHT  = '#EBF2FF';
const BG_COLOR   = '#F6F1E9';
const TEXT_DARK  = '#1F2937';
const TEXT_GRAY  = '#6B7280';
const BORDER     = '#E5E7EB';

const DESIGNATIONS = ['CEO', 'Chairman', 'Secretary', 'Board Member', 'Manager', 'Other'] as const;
type Designation = (typeof DESIGNATIONS)[number];

const AVATAR_PLACEHOLDER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCt_2-uyTSWqni0gL3Ex7_Rtw8iBT7iAzP0jwrSLSYb7w-kRyA7dtkDrIWjibN6Cky_2P32YV2e4V3d2qw803N-_D5l3_AYMFTh8OMxHzlWbF5VTcdgCVUup9BBHTHb-ZOYLRYkkzOb5ZDGQvM5-fcLOsHUaBdmRJkI7r4PD3lunURNeGTMR3Q1y9o4wFl3iMd0gP2iVEASAPtpyWkGI8yJ1nzDTb98yUhM8XWo40qJtL7d74M073HltQ';

export default function FPOProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();

  const [repName, setRepName]     = useState(user?.fullName || '');
  const [designation, setDesignation] = useState<Designation>('CEO');
  const [repPhone, setRepPhone]   = useState(
    user?.phone ? user.phone.replace('+91', '').trim() : ''
  );
  const [whatsApp, setWhatsApp]   = useState('');
  const [repEmail, setRepEmail]   = useState(user?.email || '');
  const [expYears, setExpYears]   = useState(5);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(user?.avatarUri);
  const [photoModal, setPhotoModal] = useState(false);
  const [desigModal, setDesigModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  async function handlePickGallery() {
    setPhotoModal(false);
    const res = await pickImageFromGallery();
    if (!res.cancelled && res.uri) setAvatarUri(res.uri);
  }

  async function handleTakePhoto() {
    setPhotoModal(false);
    const res = await takePhotoWithCamera();
    if (!res.cancelled && res.uri) setAvatarUri(res.uri);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!repName.trim())  errs.repName  = 'Full name is required';
    if (!repPhone.trim() || repPhone.length < 10) errs.repPhone = 'Valid 10-digit mobile required';
    if (repEmail && !/\S+@\S+\.\S+/.test(repEmail)) errs.repEmail = 'Enter a valid email';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleContinue() {
    if (!validate()) return;
    setSaving(true);
    try {
      // Save partial FPO details to user store
      setUser({
        ...user,
        fullName: repName.trim(),
        role: 'FPO',
        fpoDetails: {
          ...user?.fpoDetails,
          representativeName: repName.trim(),
          designation: designation.toUpperCase().replace(' ', '_') as any,
          experienceYears: expYears,
        },
      });
      router.push('/onboarding/fpo-org-details');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const topPad = Math.max(insets.top, 16);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: BG_COLOR }}
    >
      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={TEXT_DARK} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.stepRow}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[styles.stepDot, s === 2 && styles.stepDotActive, s < 2 && styles.stepDotDone]}
            />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step 2 of 4</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── FPO Hero Banner ── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>🏢</Text>
          </View>
          <Text style={styles.heroTitle}>FPO Representative Profile</Text>
          <Text style={styles.heroSub}>
            Tell us about yourself — the person leading this FPO
          </Text>
        </View>

        {/* ── Avatar Picker ── */}
        <Pressable style={styles.avatarSection} onPress={() => setPhotoModal(true)}>
          <Image
            source={avatarUri || AVATAR_PLACEHOLDER}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.cameraChip}>
            <Camera size={14} color="#FFFFFF" />
            <Text style={styles.cameraLabel}>Photo</Text>
          </View>
        </Pressable>

        {/* ── Section: Personal Details ── */}
        <Text style={styles.sectionTitle}>YOUR PERSONAL DETAILS</Text>

        {/* Full Name */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Full Name *</Text>
          <View style={[styles.inputRow, errors.repName ? styles.inputError : null]}>
            <User size={16} color={TEXT_GRAY} style={styles.inputIcon} />
            <Text
              style={[styles.inputText, !repName && styles.placeholder]}
              onPress={() => {}}
            />
            {/* Using native TextInput directly */}
            <View style={{ flex: 1 }}>
              <TextInputNative
                value={repName}
                onChangeText={setRepName}
                placeholder="e.g. Rajesh Patil"
                placeholderTextColor={TEXT_GRAY}
                style={styles.nativeInput}
              />
            </View>
          </View>
          {errors.repName ? <Text style={styles.errorText}>{errors.repName}</Text> : null}
        </View>

        {/* Designation */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Designation in FPO *</Text>
          <Pressable style={styles.inputRow} onPress={() => setDesigModal(true)}>
            <Briefcase size={16} color={TEXT_GRAY} style={styles.inputIcon} />
            <Text style={[styles.inputText, { flex: 1, color: TEXT_DARK }]}>{designation}</Text>
            <ChevronDown size={16} color={TEXT_GRAY} />
          </Pressable>
        </View>

        {/* Mobile */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Mobile Number *</Text>
          <View style={[styles.inputRow, errors.repPhone ? styles.inputError : null]}>
            <Text style={styles.countryCode}>+91</Text>
            <Phone size={16} color={TEXT_GRAY} style={styles.inputIcon} />
            <View style={{ flex: 1 }}>
              <TextInputNative
                value={repPhone}
                onChangeText={(t) => setRepPhone(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
                placeholderTextColor={TEXT_GRAY}
                keyboardType="phone-pad"
                style={styles.nativeInput}
              />
            </View>
          </View>
          {errors.repPhone ? <Text style={styles.errorText}>{errors.repPhone}</Text> : null}
        </View>

        {/* WhatsApp */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>WhatsApp Number (if different)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.countryCode}>+91</Text>
            <Phone size={16} color={TEXT_GRAY} style={styles.inputIcon} />
            <View style={{ flex: 1 }}>
              <TextInputNative
                value={whatsApp}
                onChangeText={(t) => setWhatsApp(t.replace(/\D/g, '').slice(0, 10))}
                placeholder="Optional"
                placeholderTextColor={TEXT_GRAY}
                keyboardType="phone-pad"
                style={styles.nativeInput}
              />
            </View>
          </View>
        </View>

        {/* Email */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={[styles.inputRow, errors.repEmail ? styles.inputError : null]}>
            <Mail size={16} color={TEXT_GRAY} style={styles.inputIcon} />
            <View style={{ flex: 1 }}>
              <TextInputNative
                value={repEmail}
                onChangeText={setRepEmail}
                placeholder="ceo@fpo.in"
                placeholderTextColor={TEXT_GRAY}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.nativeInput}
              />
            </View>
          </View>
          {errors.repEmail ? <Text style={styles.errorText}>{errors.repEmail}</Text> : null}
        </View>

        {/* Experience Years stepper */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Years of experience in FPO sector</Text>
          <View style={styles.stepperRow}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => setExpYears((y) => Math.max(0, y - 1))}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValue}>{expYears} years</Text>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => setExpYears((y) => Math.min(40, y + 1))}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Trust Card ── */}
        <View style={styles.trustCard}>
          <ShieldCheck size={18} color={FPO_BLUE} />
          <Text style={styles.trustText}>
            Your data is stored securely. Only FPO board members can access member information.
          </Text>
        </View>

        {/* ── Continue Button ── */}
        <Pressable
          style={[styles.continueBtn, saving && { opacity: 0.75 }]}
          onPress={handleContinue}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <>
                <Text style={styles.continueBtnText}>CONTINUE</Text>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
              </>}
        </Pressable>
      </ScrollView>

      {/* ── Designation picker modal ── */}
      <Modal visible={desigModal} transparent animationType="slide" onRequestClose={() => setDesigModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Designation</Text>
            {DESIGNATIONS.map((d) => (
              <Pressable
                key={d}
                style={styles.modalOption}
                onPress={() => { setDesignation(d); setDesigModal(false); }}
              >
                <Text style={[styles.modalOptionText, d === designation && { color: FPO_BLUE, fontWeight: '800' }]}>
                  {d}
                </Text>
                {d === designation && <Check size={16} color={FPO_BLUE} />}
              </Pressable>
            ))}
            <Pressable style={styles.modalCancel} onPress={() => setDesigModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Photo picker modal ── */}
      <Modal visible={photoModal} transparent animationType="slide" onRequestClose={() => setPhotoModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Profile Photo</Text>
            <Pressable style={styles.modalOption} onPress={handlePickGallery}>
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </Pressable>
            <Pressable style={styles.modalOption} onPress={handleTakePhoto}>
              <Text style={styles.modalOptionText}>Take a Photo</Text>
            </Pressable>
            <Pressable style={styles.modalCancel} onPress={() => setPhotoModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// Inline TextInput (avoids import collision with React Native's Text)
import { TextInput as TextInputNative } from 'react-native';

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3DCCF',
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  stepRow: { flex: 1, flexDirection: 'row', gap: 6 },
  stepDot: {
    flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB',
  },
  stepDotActive: { backgroundColor: FPO_BLUE },
  stepDotDone:   { backgroundColor: '#93C5FD' },
  stepLabel:     { fontSize: 11, fontWeight: '700', color: TEXT_GRAY },

  scroll: { padding: 16, paddingBottom: 48, gap: 0 },

  heroBanner: {
    backgroundColor: FPO_BLUE,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroIcon:  { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  heroEmoji: { fontSize: 28 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 6 },

  avatarSection: { alignSelf: 'center', marginBottom: 20, position: 'relative' },
  avatar:        { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: FPO_BLUE },
  cameraChip: {
    position: 'absolute', bottom: 0, right: -4,
    backgroundColor: FPO_BLUE, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  cameraLabel: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: TEXT_GRAY,
    letterSpacing: 0.8, marginBottom: 12, marginTop: 4,
  },

  fieldWrap:  { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: TEXT_DARK, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 12, height: 50,
  },
  inputError: { borderColor: '#DC2626' },
  inputIcon:  { marginRight: 8 },
  inputText:  { fontSize: 14, color: TEXT_DARK },
  placeholder:{ color: TEXT_GRAY },
  nativeInput:{ flex: 1, fontSize: 14, color: TEXT_DARK, height: 50 },
  countryCode:{ fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginRight: 4 },
  errorText:  { fontSize: 11, color: '#DC2626', marginTop: 4, fontWeight: '600' },

  stepperRow:   { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn:   {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: FPO_LIGHT, alignItems: 'center', justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 20, fontWeight: '700', color: FPO_BLUE, lineHeight: 22 },
  stepperValue:   { fontSize: 16, fontWeight: '800', color: TEXT_DARK, minWidth: 80, textAlign: 'center' },

  trustCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: FPO_LIGHT, borderRadius: 14,
    padding: 14, marginBottom: 24, marginTop: 8,
  },
  trustText: { flex: 1, fontSize: 12, color: '#1B4D8E', fontWeight: '600', lineHeight: 18 },

  continueBtn: {
    height: 54, borderRadius: 16,
    backgroundColor: FPO_BLUE,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: FPO_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  continueBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  modalTitle:   { fontSize: 17, fontWeight: '800', color: TEXT_DARK, marginBottom: 16 },
  modalOption:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalOptionText: { fontSize: 15, color: TEXT_DARK, fontWeight: '600' },
  modalCancel:  { marginTop: 12, height: 48, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: TEXT_GRAY },
});
