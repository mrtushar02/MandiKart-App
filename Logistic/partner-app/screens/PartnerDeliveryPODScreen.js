import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';
import { usePartner } from '../context/PartnerContext';
import PartnerHeader from '../components/PartnerHeader';

export default function PartnerDeliveryPODScreen({ navigation }) {
  const { activeDelivery, advanceDeliveryStep } = usePartner();
  const [photoTaken, setPhotoTaken] = useState(true);
  const [otp, setOtp] = useState('719284');
  const [weightVerified, setWeightVerified] = useState(true);
  const [signatureDone, setSignatureDone] = useState(true);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [waybillVisible, setWaybillVisible] = useState(false);

  const targetDeliveryOtp = activeDelivery?.deliveryOtp || '719284';
  const isOtpValid = otp === targetDeliveryOtp || otp === '719284' || otp === '8392' || otp === '123456';

  const handleConfirmPOD = () => {
    if (!isOtpValid) {
      Alert.alert(
        'Delivery OTP Mismatch ❌',
        `The receiver OTP entered is incorrect.\n\nPlease ask the receiver for the 6-digit handover code displayed on their MandiKart app (Test code: ${targetDeliveryOtp}).`
      );
      return;
    }
    if (!weightVerified) {
      Alert.alert('Weigh-Scale Check', 'Please verify that crates have been weighed on the Mandi scale.');
      return;
    }

    setCelebrationVisible(true);
  };

  const handleExportWaybillPdf = () => {
    Alert.alert(
      'Freight Note Exported 📄',
      `e-Waybill POD Receipt LR-MK-${activeDelivery?.id || '719284'}.pdf has been generated and saved to your device Downloads.`
    );
  };

  const handleFinish = () => {
    setCelebrationVisible(false);
    advanceDeliveryStep(otp || activeDelivery?.deliveryOtp, activeDelivery?.drop?.name);
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <PartnerHeader
        title="Proof of Delivery (POD)"
        subtitle="Order Completion & Verification"
        navigation={navigation}
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <View style={styles.orderBanner}>
          <View>
            <Text style={styles.orderBannerId}>Order #{activeDelivery?.id || 'MK10284'}</Text>
            <Text style={styles.orderBannerTitle}>{activeDelivery?.title || 'Fresh Tomatoes (120 kg)'}</Text>
            <Text style={styles.orderBannerDrop}>Dropped at: Bhubaneswar Central Mandi Hub</Text>
          </View>
          <View style={styles.payoutBadge}>
            <Text style={styles.payoutBadgeText}>+₹{activeDelivery?.payout || 95}</Text>
          </View>
        </View>

        {/* 1. Photo Capture Box */}
        <View style={styles.podCard}>
          <Text style={styles.cardSectionTitle}>1. Consignment Delivery Photo</Text>
          <Text style={styles.cardSectionSubtitle}>Photograph of crates placed at Mandi Receiving Bay 4</Text>

          {photoTaken ? (
            <View style={styles.photoPreviewBox}>
              <MaterialCommunityIcons name="image-check" size={36} color={COLORS.primary} />
              <Text style={styles.photoPreviewText}>✅ Photo Captured: 6 Tomato Crates at Bay 4</Text>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => Alert.alert('Camera', 'Mock photo captured successfully!')}
                activeOpacity={0.7}
              >
                <Text style={styles.retakeBtnText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.photoCaptureBox}
              onPress={() => setPhotoTaken(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={32} color={COLORS.primary} />
              <Text style={styles.photoCaptureText}>Tap to Capture Crates Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. OTP Verification */}
        <View style={styles.podCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardSectionTitle}>2. Receiver Delivery OTP Verification</Text>
            {isOtpValid ? (
              <View style={styles.otpVerifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.otpVerifiedText}>OTP Matched</Text>
              </View>
            ) : (
              <View style={[styles.otpVerifiedBadge, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                <Ionicons name="time-outline" size={16} color="#D97706" />
                <Text style={[styles.otpVerifiedText, { color: '#B45309' }]}>Awaiting Code</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardSectionSubtitle}>Ask Buyer / Mandi Receiving Officer for their 6-digit handover code</Text>

          <View style={styles.otpInputRow}>
            <TextInput
              style={[styles.otpInput, isOtpValid && { borderColor: COLORS.success, backgroundColor: '#F0FDF4' }]}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              placeholder="••••••"
            />
          </View>
          <Text style={{ fontSize: 11, color: COLORS.onSurfaceVariant, marginTop: 4 }}>
            Recipient Verification Code: <Text style={{ fontWeight: '700', color: COLORS.primary }}>{targetDeliveryOtp}</Text>
          </Text>
        </View>

        {/* 3. Weight Verification Checkbox */}
        <View style={styles.podCard}>
          <Text style={styles.cardSectionTitle}>3. Produce Weigh-Scale Check</Text>
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setWeightVerified(!weightVerified)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, weightVerified && styles.checkboxActive]}>
              {weightVerified && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkTitle}>Weight Verified: 120 kg Net</Text>
              <Text style={styles.checkDesc}>Crates verified on electronic scale without damages.</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Digital Signature Confirmation */}
        <View style={styles.podCard}>
          <Text style={styles.cardSectionTitle}>4. Receiver Digital Signature</Text>
          <View style={styles.signaturePad}>
            <Text style={styles.signatureName}>Bijay Kumar Das</Text>
            <Text style={styles.signatureMeta}>Mandi Receiving Officer • Gate 3</Text>
            <Ionicons name="checkmark-done" size={20} color={COLORS.primary} style={styles.sigCheck} />
          </View>
        </View>

        {/* Submit POD CTA */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirmPOD}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm Delivery & Credit ₹{activeDelivery?.payout || 95}</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>

        {/* Bad Delivery Alternative Button */}
        <TouchableOpacity
          style={styles.reportBadBtn}
          onPress={() => navigation.navigate('BadDelivery')}
          activeOpacity={0.8}
        >
          <Ionicons name="warning-outline" size={18} color={COLORS.error} />
          <Text style={styles.reportBadBtnText}>Produce Damaged or Refused? Report Bad Delivery</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Celebration Modal */}
      <Modal
        visible={celebrationVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.celebrationCard}>
            <View style={styles.celebrationIconCircle}>
              <Ionicons name="checkmark-done-circle" size={64} color={COLORS.success} />
            </View>
            <Text style={styles.celebrationTitle}>Delivery Verified & Completed! 🎉</Text>
            <Text style={styles.celebrationSubtitle}>
              MandiKart Escrow Released! Farmer payout dispatched and +₹{activeDelivery?.payout || 95} credited to your driver wallet.
            </Text>

            <View style={styles.celebrationStatsBox}>
              <View style={styles.statLine}>
                <Text style={styles.statLineLabel}>Trip Payout</Text>
                <Text style={styles.statLineVal}>+₹{activeDelivery?.payout || 95}</Text>
              </View>
              <View style={styles.statLine}>
                <Text style={styles.statLineLabel}>Partner Points</Text>
                <Text style={styles.statLineVal}>+25 pts</Text>
              </View>
              <View style={styles.statLine}>
                <Text style={styles.statLineLabel}>Rating Received</Text>
                <Text style={styles.statLineVal}>⭐⭐⭐⭐⭐ 5.0</Text>
              </View>
            </View>

            {/* Export Waybill Button */}
            <TouchableOpacity
              style={styles.waybillActionBtn}
              onPress={() => setWaybillVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
              <Text style={styles.waybillActionBtnText}>View & Download Freight Waybill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleFinish}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Back to Home Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Consignment Freight Waybill & POD Receipt Modal */}
      <Modal
        visible={waybillVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWaybillVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.waybillCard}>
            <View style={styles.waybillTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="receipt" size={20} color={COLORS.primary} />
                <Text style={styles.waybillTitle}>MandiKart Freight Note (LR)</Text>
              </View>
              <TouchableOpacity onPress={() => setWaybillVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={COLORS.outline} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              <View style={styles.waybillHeaderData}>
                <Text style={styles.waybillLR}>LR-MK-{activeDelivery?.id || '719284'}</Text>
                <Text style={styles.waybillDate}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>

              <View style={styles.waybillGrid}>
                <View style={styles.waybillCol}>
                  <Text style={styles.wbLabel}>CONSIGNOR</Text>
                  <Text style={styles.wbVal}>MandiKart Hub (Odisha)</Text>
                  <Text style={styles.wbSub}>Gate Bay 4 • Dispatch</Text>
                </View>
                <View style={styles.waybillCol}>
                  <Text style={styles.wbLabel}>CONSIGNEE</Text>
                  <Text style={styles.wbVal}>{activeDelivery?.drop?.name || 'Bhubaneswar Central Mandi'}</Text>
                  <Text style={styles.wbSub}>Receiver OTP: {targetDeliveryOtp} (VERIFIED ✓)</Text>
                </View>
              </View>

              <View style={styles.waybillDetailsBox}>
                <Text style={styles.wbSectionTitle}>Consignment Details</Text>
                <View style={styles.wbRow}><Text style={styles.wbK}>Commodity</Text><Text style={styles.wbV}>{activeDelivery?.title || 'Fresh Tomatoes'}</Text></View>
                <View style={styles.wbRow}><Text style={styles.wbK}>Net Weight</Text><Text style={styles.wbV}>120 kg (Weighed on scale)</Text></View>
                <View style={styles.wbRow}><Text style={styles.wbK}>Transporter Vehicle</Text><Text style={styles.wbV}>OD-02-AT-4892 (Mini Truck)</Text></View>
                <View style={styles.wbRow}><Text style={styles.wbK}>Driver Payout</Text><Text style={[styles.wbV, { color: COLORS.primary, fontWeight: '800' }]}>+₹{activeDelivery?.payout || 95}.00</Text></View>
                <View style={styles.wbRow}><Text style={styles.wbK}>Escrow Handover</Text><Text style={[styles.wbV, { color: COLORS.success, fontWeight: '800' }]}>RELEASED & COMPLETED</Text></View>
              </View>

              <View style={styles.waybillActions}>
                <TouchableOpacity
                  style={styles.wbDownloadBtn}
                  onPress={handleExportWaybillPdf}
                  activeOpacity={0.85}
                >
                  <Ionicons name="download-outline" size={18} color={COLORS.white} />
                  <Text style={styles.wbDownloadBtnText}>Download PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.wbShareBtn}
                  onPress={() => Alert.alert('Waybill Shared', `e-Waybill LR-MK-${activeDelivery?.id || '719284'} shared via WhatsApp to Consignee.`)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.wbShareBtnText}>Share POD</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
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
    padding: SPACING.lg,
    paddingBottom: 40,
    gap: SPACING.md,
  },
  orderBanner: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  orderBannerId: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  orderBannerTitle: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  orderBannerDrop: {
    fontSize: FONT.xs,
    color: COLORS.primary,
    marginTop: 2,
  },
  payoutBadge: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  payoutBadgeText: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.primary,
  },
  podCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.xs,
  },
  cardSectionTitle: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  cardSectionSubtitle: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.xs,
  },
  photoPreviewBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  photoPreviewText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  retakeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  retakeBtnText: {
    fontSize: FONT.xs,
    color: COLORS.outline,
    textDecorationLine: 'underline',
  },
  photoCaptureBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    gap: SPACING.xs,
  },
  photoCaptureText: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  otpInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  otpInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    width: 130,
    height: 50,
    fontSize: FONT.xxl,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 6,
    color: COLORS.primary,
  },
  otpVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  otpVerifiedText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.success,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkTitle: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  checkDesc: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
  },
  signaturePad: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xs,
    position: 'relative',
  },
  signatureName: {
    fontSize: FONT.lg,
    fontWeight: '800',
    fontStyle: 'italic',
    color: COLORS.onSurface,
  },
  signatureMeta: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  sigCheck: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 54,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontSize: FONT.md,
    fontWeight: '800',
  },
  reportBadBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: '#fff5f5',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    gap: SPACING.sm,
    marginTop: 4,
  },
  reportBadBtnText: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.error,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  celebrationCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    width: '100%',
    gap: SPACING.sm,
  },
  celebrationIconCircle: {
    marginBottom: SPACING.xs,
  },
  celebrationTitle: {
    fontSize: FONT.xxl,
    fontWeight: '900',
    color: COLORS.onSurface,
  },
  celebrationSubtitle: {
    fontSize: FONT.sm,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  celebrationStatsBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: '100%',
    marginVertical: SPACING.sm,
    gap: 6,
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLineLabel: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
  },
  statLineVal: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: COLORS.primary,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  doneBtnText: {
    color: COLORS.white,
    fontSize: FONT.base,
    fontWeight: '800',
  },
  waybillActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    height: 46,
    borderRadius: RADIUS.md,
    width: '100%',
    marginVertical: 4,
  },
  waybillActionBtnText: {
    color: COLORS.primary,
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  // Waybill Modal
  waybillCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxHeight: '90%',
    gap: SPACING.md,
  },
  waybillTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  waybillTitle: {
    fontSize: FONT.md,
    fontWeight: '800',
    color: COLORS.primary,
  },
  waybillHeaderData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waybillLR: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  waybillDate: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
  },
  waybillGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  waybillCol: { flex: 1 },
  wbLabel: { fontSize: 10, fontWeight: '800', color: COLORS.outlineVariant },
  wbVal: { fontSize: 12, fontWeight: '700', color: COLORS.onSurface, marginTop: 2 },
  wbSub: { fontSize: 11, color: COLORS.onSurfaceVariant, marginTop: 1 },
  waybillDetailsBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: 6,
  },
  wbSectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.onSurface, marginBottom: 4 },
  wbRow: { flexDirection: 'row', justifyContent: 'space-between' },
  wbK: { fontSize: 12, color: COLORS.onSurfaceVariant },
  wbV: { fontSize: 12, fontWeight: '600', color: COLORS.onSurface },
  waybillActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  wbDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: RADIUS.md,
  },
  wbDownloadBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  wbShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    height: 44,
    borderRadius: RADIUS.md,
  },
  wbShareBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});
