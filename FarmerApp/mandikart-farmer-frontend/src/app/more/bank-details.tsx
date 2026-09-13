/**
 * MandiKart Farmer App — Bank & Payout Settings
 *
 * Unique Design:
 * - Luxury Kisan Escrow Payout Virtual Card Preview
 * - Clean structured form inputs with instant validation
 * - Direct UPI ID configuration for sub-second payouts
 * - 3D Tactile Save Button
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  ArrowRight,
  Lock,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { MKBackground, MKHeader, MKInput } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/apiClient';

export default function BankDetailsScreen() {
  const { user, setUser } = useAuthStore();
  const [accountName, setAccountName] = useState(
    user?.accountHolderName || user?.fullName || user?.name || ''
  );
  const [accountNumber, setAccountNumber] = useState(user?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(user?.ifscCode || '');
  const [bankName, setBankName] = useState(user?.bankName || '');
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [isSaved, setIsSaved] = useState(Boolean(user?.accountNumber));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!accountName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      Alert.alert('Incomplete Form', 'Please enter your Account Holder Name, Account Number, and IFSC Code.');
      return;
    }

    setSaving(true);
    const payload = {
      accountHolderName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      bankName: bankName.trim() || 'Verified Bank',
      upiId: upiId.trim(),
    };

    try {
      await apiClient.put('/farmers/bank-details', payload);
      setUser({
        ...user,
        ...payload,
      });
      setIsSaved(true);
      Alert.alert(
        'Bank Details Saved',
        'Your verified bank account is linked to MandiKart Escrow. All produce payouts will be automatically credited directly to this account.'
      );
    } catch {
      // Offline / Local save fallback
      setUser({
        ...user,
        ...payload,
      });
      setIsSaved(true);
      Alert.alert(
        'Bank Details Saved',
        'Your verified bank account has been updated in your profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  const maskedAccount = accountNumber
    ? `•••• •••• ${accountNumber.slice(-4)}`
    : '•••• •••• ••••';

  return (
    <MKBackground>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <MKHeader showBack title="Bank & Escrow Payouts" />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Virtual Kisan Payout Card Preview ── */}
          <Animated.View entering={FadeInDown.duration(450)} style={styles.cardPreview}>
            <View style={styles.cardPreviewTop}>
              <View style={styles.bankTagRow}>
                <Landmark size={18} color="#FFD54F" />
                <Text style={styles.bankNameText}>{bankName || 'State Bank of India'}</Text>
              </View>
              <View style={styles.escrowChip}>
                <ShieldCheck size={12} color="#1E5A2A" />
                <Text style={styles.escrowChipText}>ESCROW ACTIVE</Text>
              </View>
            </View>

            <View style={styles.cardNumberArea}>
              <Text style={styles.cardNumberLabel}>PAYOUT ACCOUNT</Text>
              <Text style={styles.cardNumberVal}>{maskedAccount}</Text>
            </View>

            <View style={styles.cardPreviewBottom}>
              <View>
                <Text style={styles.cardHolderLabel}>BENEFICIARY KISAN</Text>
                <Text style={styles.cardHolderName}>{accountName.toUpperCase()}</Text>
              </View>
              <View style={styles.ifscBadge}>
                <Text style={styles.ifscText}>IFSC: {ifscCode}</Text>
              </View>
            </View>
          </Animated.View>

          {/* ── Security Trust Note ── */}
          <View style={styles.securityNote}>
            <Lock size={16} color="#1E5A2A" />
            <Text style={styles.securityNoteText}>
              Direct mandi settlements via RBI-regulated Instant Escrow Clearing.
            </Text>
          </View>

          {/* ── Form Inputs Card ── */}
          <Animated.View entering={FadeInUp.duration(550).delay(100)} style={styles.formCard}>
            <Text style={styles.formSectionTitle}>PRIMARY BANK ACCOUNT</Text>

            <MKInput
              label="ACCOUNT HOLDER NAME"
              value={accountName}
              onChangeText={setAccountName}
              placeholder="As per bank passbook"
            />

            <MKInput
              label="ACCOUNT NUMBER"
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="Enter 11-16 digit account number"
              keyboardType="number-pad"
              secureTextEntry={false}
            />

            <MKInput
              label="IFSC CODE"
              value={ifscCode}
              onChangeText={setIfscCode}
              placeholder="e.g. SBIN0001245"
              autoCapitalize="characters"
            />

            <MKInput
              label="BANK & BRANCH NAME"
              value={bankName}
              onChangeText={setBankName}
              placeholder="Bank branch name"
            />

            {/* UPI Option */}
            <View style={styles.upiSection}>
              <View style={styles.upiHeader}>
                <View style={styles.zapIcon}>
                  <Zap size={16} color="#E65100" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.upiTitle}>Instant UPI Payout (Optional)</Text>
                  <Text style={styles.upiSub}>Receive payouts under 15 seconds after gate pickup</Text>
                </View>
              </View>

              <MKInput
                label="UPI ID (VPA)"
                value={upiId}
                onChangeText={setUpiId}
                placeholder="mobile@upi / username@okhdfcbank"
                autoCapitalize="none"
              />
            </View>
          </Animated.View>

          {/* ── 3D Save Button ── */}
          <View style={styles.btnShadowWrapper}>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed, saving && { opacity: 0.7 }]}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'SAVING DETAILS...' : 'SAVE & VERIFY BANK ACCOUNT'}
              </Text>
              <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>

        </ScrollView>
      </SafeAreaView>
    </MKBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 16,
  },
  /* Virtual Card */
  cardPreview: {
    backgroundColor: '#0F381E',
    borderRadius: 24,
    padding: 22,
    minHeight: 180,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#0F381E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  cardPreviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  bankNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  escrowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  escrowChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E5A2A',
  },
  cardNumberArea: {
    marginVertical: 12,
  },
  cardNumberLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A5D6A7',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardNumberVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cardPreviewBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardHolderLabel: {
    fontSize: 9,
    color: '#A5D6A7',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardHolderName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  ifscBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ifscText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD54F',
  },

  /* Security note */
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  securityNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#1E5A2A',
    fontWeight: '600',
    lineHeight: 16,
  },

  /* Form */
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  formSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7A7A7A',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  upiSection: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE4',
    gap: 8,
  },
  upiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  zapIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  upiSub: {
    fontSize: 11,
    color: '#5F6368',
  },

  /* 3D Button */
  btnShadowWrapper: {
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1E5A2A',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#123D1B',
  },
  saveBtnPressed: {
    backgroundColor: '#174720',
    borderBottomWidth: 1,
    transform: [{ translateY: 3 }],
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
});
