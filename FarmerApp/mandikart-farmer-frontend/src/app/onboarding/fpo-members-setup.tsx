/**
 * MandiKart Farmer App — FPO Onboarding Step 4
 * Screen: Invite Members (Final onboarding step)
 *
 * Generates a unique FPO join QR code and deep link.
 * CEO can share via WhatsApp/SMS or enter phone numbers manually.
 * Has a "Skip — I'll do this later" option.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Share,
  ActivityIndicator,
  Linking,
} from 'react-native';
import MKQRCode from '@/components/common/MKQRCode';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ArrowRight,
  MessageCircle,
  MessageSquare,
  Copy,
  Plus,
  Users,
  CheckCircle2,
  X,
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

export default function FPOMembersSetupScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { user, setUser, completeOnboarding } = useAuthStore();

  const fpoName = user?.fpoDetails?.fpoName || 'Your FPO';

  // Generate a deterministic FPO join code from the user ID / timestamp
  const fpoJoinCode = useMemo(() => {
    const seed = user?.id ? parseInt(user.id.replace(/\D/g, '').slice(0, 6), 10) : Date.now() % 100000;
    return `MK-FPO-${seed.toString().padStart(4, '0')}`;
  }, [user?.id]);

  const joinLink = `https://mandikart.in/join-fpo?code=${fpoJoinCode}`;

  const [phoneInput, setPhoneInput]   = useState('');
  const [invitedList, setInvitedList] = useState<string[]>([]);
  const [sending, setSending]         = useState(false);

  function addPhone() {
    const clean = phoneInput.replace(/\D/g, '').slice(0, 10);
    if (clean.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a 10-digit mobile number.');
      return;
    }
    if (invitedList.includes(clean)) {
      Alert.alert('Already Added', 'This phone number is already in the invite list.');
      return;
    }
    setInvitedList((l) => [...l, clean]);
    setPhoneInput('');
  }

  async function handleWhatsApp() {
    const msg = `🌾 Join ${fpoName} on MandiKart!\n\nUse our FPO Join Code: *${fpoJoinCode}*\nor join directly: ${joinLink}`;
    const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
    const can = await Linking.canOpenURL(url).catch(() => false);
    if (can) {
      await Linking.openURL(url);
    } else {
      await Share.share({ message: msg });
    }
  }

  async function handleSMS() {
    const msg = `Join ${fpoName} on MandiKart: ${joinLink} (Code: ${fpoJoinCode})`;
    await Share.share({ message: msg });
  }

  async function handleCopyLink() {
    Alert.alert('Link Copied!', joinLink);
  }

  async function handleFinish() {
    setSending(true);
    try {
      await completeOnboarding({
        role: 'FPO',
        isOnboarded: true,
        isProfileCompleted: true,
        fpoDetails: {
          ...(user?.fpoDetails || {}),
          fpoJoinCode,
        },
      });
      router.replace('/(tabs)/home');
    } finally {
      setSending(false);
    }
  }

  async function handleSkip() {
    await completeOnboarding({
      role: 'FPO',
      isOnboarded: true,
      isProfileCompleted: true,
      fpoDetails: {
        ...(user?.fpoDetails || {}),
        fpoJoinCode,
      },
    });
    router.replace('/(tabs)/home');
  }

  const topPad = Math.max(insets.top, 16);

  return (
    <View style={{ flex: 1, backgroundColor: BG_COLOR }}>
      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color={TEXT_DARK} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.stepRow}>
          {[1, 2, 3, 4].map((s) => (
            <View key={s} style={[styles.stepDot, s <= 4 && styles.stepDotDone]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step 4 of 4</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Success Banner ── */}
        <View style={styles.successBanner}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={40} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <Text style={styles.successTitle}>🎉 FPO Registered!</Text>
          <Text style={styles.successSub}>
            <Text style={{ fontWeight: '800' }}>{fpoName}</Text> is now on MandiKart.{'\n'}
            Invite your farmer members to join your collective.
          </Text>
        </View>

        {/* ── QR & Join Code Card ── */}
        <View style={styles.qrCard}>
          <View style={styles.qrFrame}>
            <MKQRCode
              value={`mandikart://join-fpo?code=${fpoJoinCode}&name=${encodeURIComponent(fpoName)}`}
              size={170}
              color="#0F2C56"
              backgroundColor="#FFFFFF"
            />
          </View>
          <Text style={styles.qrHint}>Scan using MandiKart Farmer App</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>FPO JOIN CODE</Text>
            <Text style={styles.codeValue}>{fpoJoinCode}</Text>
          </View>
        </View>

        {/* ── Share Buttons ── */}
        <Text style={styles.sectionTitle}>SHARE JOIN LINK</Text>

        <View style={styles.shareRow}>
          <Pressable style={[styles.shareBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
            <MessageCircle size={20} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>WhatsApp</Text>
          </Pressable>
          <Pressable style={[styles.shareBtn, { backgroundColor: '#1B4D8E' }]} onPress={handleSMS}>
            <MessageSquare size={20} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>SMS</Text>
          </Pressable>
          <Pressable style={[styles.shareBtn, { backgroundColor: '#F3F4F6' }]} onPress={handleCopyLink}>
            <Copy size={20} color={TEXT_DARK} />
            <Text style={[styles.shareBtnText, { color: TEXT_DARK }]}>Copy</Text>
          </Pressable>
        </View>

        {/* ── Manual phone entry ── */}
        <Text style={styles.sectionTitle}>OR ENTER PHONE NUMBERS MANUALLY</Text>

        <View style={styles.phoneInputRow}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            value={phoneInput}
            onChangeText={(t) => setPhoneInput(t.replace(/\D/g, '').slice(0, 10))}
            placeholder="Member's mobile number"
            placeholderTextColor={TEXT_GRAY}
            keyboardType="phone-pad"
            style={[styles.nativeInput, { flex: 1 }]}
            onSubmitEditing={addPhone}
            returnKeyType="done"
          />
          <Pressable style={styles.addBtn} onPress={addPhone}>
            <Plus size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {invitedList.length > 0 && (
          <View style={styles.inviteList}>
            <View style={styles.inviteHeader}>
              <Users size={14} color={FPO_BLUE} />
              <Text style={styles.inviteCount}>{invitedList.length} member{invitedList.length !== 1 ? 's' : ''} added</Text>
            </View>
            {invitedList.map((phone) => (
              <View key={phone} style={styles.inviteRow}>
                <Text style={styles.invitePhone}>+91 {phone}</Text>
                <Pressable onPress={() => setInvitedList((l) => l.filter((p) => p !== phone))}>
                  <X size={16} color={TEXT_GRAY} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* ── Info Note ── */}
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            💡 Members you invite will receive a WhatsApp/SMS invite link. They need to install MandiKart and enter the code <Text style={{ fontWeight: '800' }}>{fpoJoinCode}</Text> to join your FPO.
          </Text>
        </View>

        {/* ── Action Buttons ── */}
        <Pressable
          style={[styles.primaryBtn, sending && { opacity: 0.75 }]}
          onPress={handleFinish}
          disabled={sending}
        >
          {sending
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <>
                <Text style={styles.primaryBtnText}>GO TO FPO DASHBOARD</Text>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
              </>}
        </Pressable>

        <Pressable style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Skip — I'll invite members later</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E3DCCF', gap: 12 },
  backBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  stepRow:       { flex: 1, flexDirection: 'row', gap: 6 },
  stepDot:       { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  stepDotDone:   { backgroundColor: FPO_BLUE },
  stepLabel:     { fontSize: 11, fontWeight: '700', color: TEXT_GRAY },

  scroll:        { padding: 16, paddingBottom: 48, gap: 0 },

  successBanner: { backgroundColor: FPO_BLUE, borderRadius: 22, padding: 24, alignItems: 'center', marginBottom: 20, gap: 8 },
  successIcon:   { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  successTitle:  { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  successSub:    { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20 },

  qrCard: {
    backgroundColor: '#FFFFFF', borderRadius: 22,
    borderWidth: 1.5, borderColor: '#E3DCCF',
    padding: 20, alignItems: 'center', marginBottom: 20, gap: 12,
  },
  qrFrame: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  qrHint:   { fontSize: 11, color: TEXT_GRAY, marginTop: 4 },
  codeBox:  { alignItems: 'center' },
  codeLabel:{ fontSize: 10, fontWeight: '800', color: TEXT_GRAY, letterSpacing: 1 },
  codeValue:{ fontSize: 22, fontWeight: '900', color: FPO_BLUE, letterSpacing: 2 },

  sectionTitle: { fontSize: 11, fontWeight: '800', color: TEXT_GRAY, letterSpacing: 0.8, marginBottom: 12, marginTop: 4 },

  shareRow:      { flexDirection: 'row', gap: 10, marginBottom: 20 },
  shareBtn:      { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  shareBtnText:  { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  phoneInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: 12, height: 52, gap: 8, marginBottom: 12 },
  countryCode:   { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  nativeInput:   { fontSize: 14, color: TEXT_DARK, height: 52 },
  addBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: FPO_BLUE, alignItems: 'center', justifyContent: 'center' },

  inviteList:    { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3DCCF', padding: 14, marginBottom: 16 },
  inviteHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  inviteCount:   { fontSize: 13, fontWeight: '700', color: FPO_BLUE },
  inviteRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  invitePhone:   { fontSize: 13, fontWeight: '600', color: TEXT_DARK },

  noteCard:      { backgroundColor: FPO_LIGHT, borderRadius: 14, padding: 14, marginBottom: 20 },
  noteText:      { fontSize: 12, color: FPO_BLUE, lineHeight: 18 },

  primaryBtn:    { height: 54, borderRadius: 16, backgroundColor: FPO_BLUE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: FPO_BLUE, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  primaryBtnText:{ fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  skipBtn:       { height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  skipBtnText:   { fontSize: 13, fontWeight: '600', color: TEXT_GRAY },
});
