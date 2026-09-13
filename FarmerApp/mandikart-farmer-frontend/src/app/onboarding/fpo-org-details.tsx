/**
 * MandiKart Farmer App — FPO Onboarding Step 3
 * Screen: FPO Organization Details
 *
 * Collects legal registration, geography, member scale, crops, and bank account
 * of the FPO. Multi-section scrollable form with blue FPO identity.
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
  TextInput,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ArrowRight,
  Building2,
  Hash,
  MapPin,
  Users,
  ChevronDown,
  Check,
  Plus,
  X,
  Landmark,
  CreditCard,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/authStore';

const FPO_BLUE   = '#1B4D8E';
const FPO_LIGHT  = '#EBF2FF';
const BG_COLOR   = '#F6F1E9';
const TEXT_DARK  = '#1F2937';
const TEXT_GRAY  = '#6B7280';
const BORDER     = '#E5E7EB';
const MK_GREEN   = '#1E5A2A';

const REG_TYPES = ['FPC', 'Cooperative', 'Trust', 'PACS', 'Other'] as const;
type RegType = (typeof REG_TYPES)[number];

const TURNOVER_BRACKETS = ['<10L', '10L–50L', '50L–1Cr', '>1Cr'] as const;
type TurnoverBracket = (typeof TURNOVER_BRACKETS)[number];

const COMMON_CROPS = [
  'Wheat', 'Rice', 'Onion', 'Tomato', 'Grapes', 'Cotton',
  'Soybean', 'Sugarcane', 'Maize', 'Potato', 'Garlic', 'Pomegranate',
  'Banana', 'Turmeric', 'Chilli', 'Jowar',
];

const INDIA_STATES = [
  'Maharashtra', 'Madhya Pradesh', 'Uttar Pradesh', 'Rajasthan',
  'Gujarat', 'Punjab', 'Haryana', 'Bihar', 'West Bengal', 'Karnataka',
  'Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Odisha', 'Other',
];

const BANKS = [
  'State Bank of India', 'Punjab National Bank', 'Bank of Baroda',
  'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Bank of Maharashtra',
  'Canara Bank', 'Union Bank of India', 'Other',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2010 + 1 }, (_, i) => 2010 + i).reverse();

export default function FPOOrgDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();

  // Legal identity
  const [fpoName,     setFpoName]     = useState(user?.fpoDetails?.fpoName || '');
  const [regNumber,   setRegNumber]   = useState(user?.fpoDetails?.registrationNumber || '');
  const [regType,     setRegType]     = useState<RegType>('FPC');
  const [yearFormed,  setYearFormed]  = useState<number>(CURRENT_YEAR - 3);
  const [nabard,      setNabard]      = useState(false);
  const [promoter,    setPromoter]    = useState('');

  // Location
  const [state,       setState]       = useState(user?.state || 'Maharashtra');
  const [district,    setDistrict]    = useState(user?.district || '');
  const [block,       setBlock]       = useState('');
  const [hqVillage,   setHqVillage]   = useState(user?.village || '');
  const [villages,    setVillages]    = useState<string[]>([]);
  const [vilInput,    setVilInput]    = useState('');

  // Scale
  const [memberCount,   setMemberCount]   = useState('');
  const [femalePct,     setFemalePct]     = useState(20);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [turnover,      setTurnover]      = useState<TurnoverBracket>('<10L');

  // Bank
  const [bankName,   setBankName]    = useState('State Bank of India');
  const [accountNo,  setAccountNo]   = useState('');
  const [ifsc,       setIfsc]        = useState('');
  const [accountType, setAccountType] = useState<'Current' | 'Savings'>('Current');

  // UI state
  const [stateModal,   setStateModal]   = useState(false);
  const [bankModal,    setBankModal]    = useState(false);
  const [yearModal,    setYearModal]    = useState(false);
  const [regModal,     setRegModal]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState<Record<string, string>>({});

  function toggleCrop(crop: string) {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  }

  function addVillage() {
    if (vilInput.trim() && !villages.includes(vilInput.trim())) {
      setVillages((v) => [...v, vilInput.trim()]);
      setVilInput('');
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!fpoName.trim())   errs.fpoName   = 'FPO name is required';
    if (!regNumber.trim()) errs.regNumber  = 'Registration number is required';
    if (!district.trim())  errs.district   = 'District is required';
    if (!hqVillage.trim()) errs.hqVillage  = 'HQ village is required';
    if (!memberCount || isNaN(Number(memberCount))) errs.memberCount = 'Member count required';
    if (selectedCrops.length === 0) errs.crops = 'Select at least one crop';
    if (!accountNo.trim()) errs.accountNo  = 'Account number is required';
    if (!ifsc.trim())      errs.ifsc       = 'IFSC code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleContinue() {
    if (!validate()) return;
    setSaving(true);
    try {
      setUser({
        ...user,
        state, district,
        bankName, accountNumber: accountNo, ifscCode: ifsc,
        fpoDetails: {
          ...user?.fpoDetails,
          fpoName: fpoName.trim(),
          registrationNumber: regNumber.trim(),
          registrationType: regType.toUpperCase().replace(' ', '_') as any,
          yearOfFormation: yearFormed,
          nabardPromoted: nabard,
          promoterName: promoter.trim() || undefined,
          state, district,
          block: block.trim() || undefined,
          headquartersVillage: hqVillage.trim(),
          villagesCovered: villages,
          memberCount: Number(memberCount),
          femaleMemberPercent: femalePct,
          primaryCrops: selectedCrops,
          annualTurnoverBracket: turnover as any,
          bankName, accountNumber: accountNo, ifscCode: ifsc,
          accountType: accountType === 'Current' ? 'CURRENT' : 'SAVINGS',
        },
      });
      router.push('/onboarding/fpo-members-setup');
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
              style={[styles.stepDot, s === 3 && styles.stepDotActive, s < 3 && styles.stepDotDone]}
            />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step 3 of 4</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Building2 size={28} color={FPO_BLUE} />
          <Text style={styles.headerTitle}>FPO Organization Details</Text>
          <Text style={styles.headerSub}>Register your FPO officially on MandiKart</Text>
        </View>

        {/* ════ SECTION 1: Legal Identity ════ */}
        <Text style={styles.sectionTitle}>LEGAL IDENTITY</Text>

        <Field label="FPO / Company Name *" error={errors.fpoName}>
          <InputRow icon={<Building2 size={16} color={TEXT_GRAY} />}>
            <TextInput
              value={fpoName} onChangeText={setFpoName}
              placeholder="e.g. Nashik Grape FPO Ltd."
              placeholderTextColor={TEXT_GRAY}
              style={styles.nativeInput}
            />
          </InputRow>
        </Field>

        <Field label="Registration Number *" error={errors.regNumber}>
          <InputRow icon={<Hash size={16} color={TEXT_GRAY} />}>
            <TextInput
              value={regNumber} onChangeText={setRegNumber}
              placeholder="CIN / Registration No."
              placeholderTextColor={TEXT_GRAY}
              style={styles.nativeInput}
              autoCapitalize="characters"
            />
          </InputRow>
        </Field>

        <Field label="Registration Type">
          <View style={styles.chipRow}>
            {REG_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[styles.chip, regType === t && styles.chipActive]}
                onPress={() => setRegType(t)}
              >
                <Text style={[styles.chipText, regType === t && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Year of Formation">
          <Pressable style={styles.inputRow} onPress={() => setYearModal(true)}>
            <Text style={[styles.nativeInput, { color: TEXT_DARK }]}>{yearFormed}</Text>
            <ChevronDown size={16} color={TEXT_GRAY} />
          </Pressable>
        </Field>

        <Field label="NABARD / SFAC Promoted?">
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{nabard ? 'Yes' : 'No'}</Text>
            <Switch
              value={nabard}
              onValueChange={setNabard}
              trackColor={{ true: FPO_BLUE, false: BORDER }}
              thumbColor="#FFFFFF"
            />
          </View>
          {nabard && (
            <View style={[styles.inputRow, { marginTop: 8 }]}>
              <TextInput
                value={promoter}
                onChangeText={setPromoter}
                placeholder="Promoter name (e.g. NABARD)"
                placeholderTextColor={TEXT_GRAY}
                style={styles.nativeInput}
              />
            </View>
          )}
        </Field>

        {/* ════ SECTION 2: Location & Coverage ════ */}
        <Text style={styles.sectionTitle}>LOCATION &amp; COVERAGE</Text>

        <Field label="State *">
          <Pressable style={styles.inputRow} onPress={() => setStateModal(true)}>
            <MapPin size={16} color={TEXT_GRAY} style={{ marginRight: 8 }} />
            <Text style={[styles.nativeInput, { color: TEXT_DARK, flex: 1 }]}>{state}</Text>
            <ChevronDown size={16} color={TEXT_GRAY} />
          </Pressable>
        </Field>

        <Field label="District *" error={errors.district}>
          <InputRow icon={<MapPin size={16} color={TEXT_GRAY} />}>
            <TextInput
              value={district} onChangeText={setDistrict}
              placeholder="e.g. Nashik"
              placeholderTextColor={TEXT_GRAY}
              style={styles.nativeInput}
            />
          </InputRow>
        </Field>

        <Field label="Block / Taluka">
          <InputRow icon={<MapPin size={16} color={TEXT_GRAY} />}>
            <TextInput
              value={block} onChangeText={setBlock}
              placeholder="e.g. Trimbak"
              placeholderTextColor={TEXT_GRAY}
              style={styles.nativeInput}
            />
          </InputRow>
        </Field>

        <Field label="Headquarters Village *" error={errors.hqVillage}>
          <InputRow icon={<MapPin size={16} color={TEXT_GRAY} />}>
            <TextInput
              value={hqVillage} onChangeText={setHqVillage}
              placeholder="Main village where FPO office is"
              placeholderTextColor={TEXT_GRAY}
              style={styles.nativeInput}
            />
          </InputRow>
        </Field>

        <Field label="Villages Covered">
          <View style={styles.tagInputRow}>
            <TextInput
              value={vilInput} onChangeText={setVilInput}
              placeholder="Add a village..."
              placeholderTextColor={TEXT_GRAY}
              style={[styles.nativeInput, { flex: 1 }]}
              onSubmitEditing={addVillage}
              returnKeyType="done"
            />
            <Pressable style={styles.addBtn} onPress={addVillage}>
              <Plus size={16} color="#FFFFFF" />
            </Pressable>
          </View>
          {villages.length > 0 && (
            <View style={styles.tagCloud}>
              {villages.map((v) => (
                <View key={v} style={styles.tag}>
                  <Text style={styles.tagText}>{v}</Text>
                  <Pressable onPress={() => setVillages((vs) => vs.filter((x) => x !== v))}>
                    <X size={12} color={FPO_BLUE} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </Field>

        {/* ════ SECTION 3: Scale & Crops ════ */}
        <Text style={styles.sectionTitle}>SCALE &amp; CROPS</Text>

        <Field label="Total Member Count *" error={errors.memberCount}>
          <InputRow icon={<Users size={16} color={TEXT_GRAY} />}>
            <TextInput
              value={memberCount} onChangeText={(t) => setMemberCount(t.replace(/\D/g, ''))}
              placeholder="e.g. 247"
              placeholderTextColor={TEXT_GRAY}
              keyboardType="number-pad"
              style={styles.nativeInput}
            />
          </InputRow>
        </Field>

        <Field label={`Female Member Percentage: ${femalePct}%`}>
          <View style={styles.stepperRow}>
            <Pressable style={styles.stepperBtn} onPress={() => setFemalePct((p) => Math.max(0, p - 5))}>
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <View style={{ flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4 }}>
              <View style={{ width: `${femalePct}%`, height: 8, backgroundColor: FPO_BLUE, borderRadius: 4 }} />
            </View>
            <Pressable style={styles.stepperBtn} onPress={() => setFemalePct((p) => Math.min(100, p + 5))}>
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>
        </Field>

        <Field label="Primary Crops (select all that apply)" error={errors.crops}>
          <View style={styles.chipRow}>
            {COMMON_CROPS.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, selectedCrops.includes(c) && styles.chipActive]}
                onPress={() => toggleCrop(c)}
              >
                <Text style={[styles.chipText, selectedCrops.includes(c) && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Approximate Annual Turnover">
          <View style={styles.chipRow}>
            {TURNOVER_BRACKETS.map((b) => (
              <Pressable
                key={b}
                style={[styles.chip, turnover === b && styles.chipActive]}
                onPress={() => setTurnover(b)}
              >
                <Text style={[styles.chipText, turnover === b && styles.chipTextActive]}>{b}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        {/* ════ SECTION 4: Bank Details ════ */}
        <Text style={styles.sectionTitle}>BANK DETAILS</Text>

        <Field label="Bank Name">
          <Pressable style={styles.inputRow} onPress={() => setBankModal(true)}>
            <Landmark size={16} color={TEXT_GRAY} style={{ marginRight: 8 }} />
            <Text style={[styles.nativeInput, { color: TEXT_DARK, flex: 1 }]}>{bankName}</Text>
            <ChevronDown size={16} color={TEXT_GRAY} />
          </Pressable>
        </Field>

        <Field label="Account Number *" error={errors.accountNo}>
          <InputRow icon={<CreditCard size={16} color={TEXT_GRAY} />}>
            <TextInput
              value={accountNo} onChangeText={setAccountNo}
              placeholder="FPO bank account number"
              placeholderTextColor={TEXT_GRAY}
              keyboardType="number-pad"
              style={styles.nativeInput}
            />
          </InputRow>
        </Field>

        <Field label="IFSC Code *" error={errors.ifsc}>
          <InputRow icon={<Hash size={16} color={TEXT_GRAY} />}>
            <TextInput
              value={ifsc} onChangeText={(t) => setIfsc(t.toUpperCase())}
              placeholder="e.g. SBIN0001245"
              placeholderTextColor={TEXT_GRAY}
              autoCapitalize="characters"
              style={styles.nativeInput}
            />
          </InputRow>
        </Field>

        <Field label="Account Type">
          <View style={styles.chipRow}>
            {(['Current', 'Savings'] as const).map((t) => (
              <Pressable
                key={t}
                style={[styles.chip, accountType === t && styles.chipActive]}
                onPress={() => setAccountType(t)}
              >
                <Text style={[styles.chipText, accountType === t && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        {/* ── Continue ── */}
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

      {/* ── State picker ── */}
      <PickerModal
        visible={stateModal}
        title="Select State"
        items={INDIA_STATES}
        selected={state}
        onSelect={(v) => { setState(v); setStateModal(false); }}
        onClose={() => setStateModal(false)}
      />

      {/* ── Bank picker ── */}
      <PickerModal
        visible={bankModal}
        title="Select Bank"
        items={BANKS}
        selected={bankName}
        onSelect={(v) => { setBankName(v); setBankModal(false); }}
        onClose={() => setBankModal(false)}
      />

      {/* ── Year picker ── */}
      <PickerModal
        visible={yearModal}
        title="Year of Formation"
        items={YEARS.map(String)}
        selected={String(yearFormed)}
        onSelect={(v) => { setYearFormed(Number(v)); setYearModal(false); }}
        onClose={() => setYearModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ── Helper sub-components ────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function InputRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.inputRow}>
      <View style={{ marginRight: 8 }}>{icon}</View>
      {children}
    </View>
  );
}

function PickerModal({ visible, title, items, selected, onSelect, onClose }: {
  visible: boolean; title: string; items: string[];
  selected: string; onSelect: (v: string) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {items.map((item) => (
              <Pressable key={item} style={styles.modalOption} onPress={() => onSelect(item)}>
                <Text style={[styles.modalOptionText, item === selected && { color: FPO_BLUE, fontWeight: '800' }]}>
                  {item}
                </Text>
                {item === selected && <Check size={16} color={FPO_BLUE} />}
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E3DCCF', gap: 12 },
  backBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  stepRow:       { flex: 1, flexDirection: 'row', gap: 6 },
  stepDot:       { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  stepDotActive: { backgroundColor: FPO_BLUE },
  stepDotDone:   { backgroundColor: '#93C5FD' },
  stepLabel:     { fontSize: 11, fontWeight: '700', color: TEXT_GRAY },

  scroll:        { padding: 16, paddingBottom: 48 },

  header:        { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 22, padding: 20, marginBottom: 20, borderWidth: 1.5, borderColor: '#E3DCCF', gap: 6 },
  headerTitle:   { fontSize: 17, fontWeight: '800', color: FPO_BLUE },
  headerSub:     { fontSize: 12, color: TEXT_GRAY, textAlign: 'center' },

  sectionTitle:  { fontSize: 11, fontWeight: '800', color: TEXT_GRAY, letterSpacing: 0.8, marginBottom: 12, marginTop: 8 },

  fieldLabel:    { fontSize: 12, fontWeight: '700', color: TEXT_DARK, marginBottom: 6 },
  inputRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 12, height: 50 },
  nativeInput:   { flex: 1, fontSize: 14, color: TEXT_DARK, height: 50 },
  errorText:     { fontSize: 11, color: '#DC2626', marginTop: 4, fontWeight: '600' },

  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#FFFFFF' },
  chipActive:    { backgroundColor: FPO_BLUE, borderColor: FPO_BLUE },
  chipText:      { fontSize: 12, fontWeight: '600', color: TEXT_GRAY },
  chipTextActive:{ color: '#FFFFFF' },

  toggleRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel:   { fontSize: 14, fontWeight: '700', color: TEXT_DARK },

  tagInputRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 12, height: 50, gap: 8 },
  addBtn:        { width: 32, height: 32, borderRadius: 16, backgroundColor: FPO_BLUE, alignItems: 'center', justifyContent: 'center' },
  tagCloud:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag:           { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: FPO_LIGHT, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  tagText:       { fontSize: 12, fontWeight: '600', color: FPO_BLUE },

  continueBtn:   { height: 54, borderRadius: 16, backgroundColor: FPO_BLUE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, shadowColor: FPO_BLUE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  continueBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },

  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:       { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  modalTitle:       { fontSize: 17, fontWeight: '800', color: TEXT_DARK, marginBottom: 16 },
  modalOption:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalOptionText:  { fontSize: 14, color: TEXT_DARK, fontWeight: '600' },
  modalCancel:      { marginTop: 12, height: 48, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  modalCancelText:  { fontSize: 14, fontWeight: '700', color: TEXT_GRAY },

  stepperRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  stepperBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: FPO_LIGHT, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontSize: 20, fontWeight: '700', color: FPO_BLUE, lineHeight: 22 },
});

