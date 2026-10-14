/**
 * MandiKart Farmer App — Accept Offer Confirmation Screen (Screen 29)
 *
 * Route: /offers/accept?id=...
 *
 * Final commercial commitment and bilateral contract execution:
 * - Complete specification and landed cost verification sheet
 * - Explains binding fair-trade and Safe Escrow rules
 * - Server-side status and expiration pre-validation
 * - Explicit two-step confirmation authorization
 * - Prevents duplicate submissions with in-flight locks and idempotency
 * - Success state displays contract number and escrow commitment
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Package,
  IndianRupee,
  Building2,
  Calendar,
  Truck,
  CreditCard,
  Percent,
  Lock,
  Clock,
  FileCheck,
  Check,
  Scale,
  ChevronRight,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useOffersStore, ProcurementOffer } from '@/store/offersStore';

export default function AcceptOfferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { currentOffer, fetchOfferById, acceptOffer, isLoading } = useOffersStore();

  const [agreementChecked, setAgreementChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedResult, setAcceptedResult] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchOfferById(id);
    }
  }, [id, fetchOfferById]);

  const offer: ProcurementOffer | null = currentOffer;

  // Validation: Check if offer is already finalized or expired
  const isAlreadyAccepted = offer?.status === 'ACCEPTED';
  const isRejected = offer?.status === 'REJECTED';
  const isExpired = useMemo(() => {
    if (!offer?.validityUntil) return false;
    return new Date(offer.validityUntil).getTime() < Date.now();
  }, [offer]);

  const canAccept = Boolean(offer && !isAlreadyAccepted && !isRejected && !isExpired);

  const handleConfirmAcceptance = async () => {
    if (!id || !canAccept || !agreementChecked || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await acceptOffer(id);
      setIsSubmitting(false);

      if (res.success && res.data) {
        setAcceptedResult(res.data);
      } else {
        Alert.alert(
          'Acceptance Failed',
          res.error || 'Server rejected offer acceptance. Please check current status.'
        );
      }
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Error', err.message || 'An unexpected network error occurred.');
    }
  };

  if (isLoading && !offer) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={MKColors.primary} />
        <Text style={styles.loadingText}>Loading commercial offer for confirmation...</Text>
      </View>
    );
  }

  if (!offer) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <AlertCircle size={42} color="#DC2626" />
        <Text style={styles.errorTitle}>Offer Not Found</Text>
        <Text style={styles.errorSubtitle}>Could not load offer #{id} for acceptance.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Offers</Text>
        </Pressable>
      </View>
    );
  }

  // Post-Acceptance Success View
  if (acceptedResult) {
    const contractNum =
      acceptedResult.contractNumber || `AGR-${offer.id.replace('OFFER-', '')}`;
    const escrowRef = acceptedResult.escrowReference || `ESC-${contractNum}`;

    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.successScreenContent}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={56} color="#15803D" />
          </View>
          <Text style={styles.successHeading}>Bilateral Contract Executed</Text>
          <Text style={styles.successSubtext}>
            You have successfully accepted the commercial quote from {offer.supplierName}.
            Funds are securely reserved in Safe Escrow.
          </Text>

          {/* Contract Voucher Card */}
          <View style={styles.voucherCard}>
            <View style={styles.voucherHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FileCheck size={18} color={MKColors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.voucherHeaderTitle}>Contract Reference</Text>
              </View>
              <Text style={styles.voucherContractNum}>{contractNum}</Text>
            </View>

            <View style={styles.voucherDivider} />

            <View style={styles.voucherGrid}>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherKey}>Commodity</Text>
                <Text style={styles.voucherVal}>{offer.cropName} ({offer.grade})</Text>
              </View>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherKey}>Contract Volume</Text>
                <Text style={styles.voucherVal}>{offer.quantity} {offer.unit}</Text>
              </View>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherKey}>Agreed Unit Rate</Text>
                <Text style={styles.voucherVal}>₹{offer.unitPrice} / {offer.unit}</Text>
              </View>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherKey}>Total Landed Commitment</Text>
                <Text style={[styles.voucherValBold, { color: MKColors.primary }]}>
                  ₹{offer.totalLandedAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherKey}>Safe Escrow Tag</Text>
                <Text style={styles.voucherVal}>{escrowRef}</Text>
              </View>
              <View style={styles.voucherRow}>
                <Text style={styles.voucherKey}>Scheduled Delivery</Text>
                <Text style={styles.voucherVal}>{offer.deliveryDate}</Text>
              </View>
            </View>

            <View style={styles.voucherFooterNote}>
              <ShieldCheck size={14} color="#15803D" style={{ marginRight: 4 }} />
              <Text style={styles.voucherFooterText}>
                Escrow funds released only upon weighbridge slip verification and depot approval.
              </Text>
            </View>
          </View>

          {/* Success Navigation Buttons */}
          <View style={styles.successActions}>
            <Pressable
              style={styles.btnSuccessPrimary}
              onPress={() => router.push(`/offers/details?id=${offer.id}` as any)}
            >
              <Text style={styles.btnSuccessPrimaryText}>View Accepted Offer Sheet</Text>
            </Pressable>
            <Pressable
              style={styles.btnSuccessSecondary}
              onPress={() => router.push(`/requirements/${offer.requirementId}` as any)}
            >
              <Text style={styles.btnSuccessSecondaryText}>Return to Procurement Tender</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1E293B" />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Accept Commercial Offer</Text>
          <Text style={styles.headerSubtitle}>
            Tender #{offer.requirementId} • Offer #{offer.id}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Invalid Status / Expiry Alert Banners */}
        {isAlreadyAccepted && (
          <View style={[styles.guardBanner, styles.guardAccepted]}>
            <CheckCircle2 size={18} color="#15803D" style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.guardTitle, { color: '#15803D' }]}>Offer Already Accepted</Text>
              <Text style={[styles.guardSub, { color: '#166534' }]}>
                This commercial quote is already executed and bound under contract.
              </Text>
            </View>
          </View>
        )}

        {isRejected && (
          <View style={[styles.guardBanner, styles.guardRejected]}>
            <AlertCircle size={18} color="#DC2626" style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.guardTitle, { color: '#DC2626' }]}>Offer Previously Declined</Text>
              <Text style={[styles.guardSub, { color: '#991B1B' }]}>
                This offer was marked as rejected and cannot be accepted.
              </Text>
            </View>
          </View>
        )}

        {isExpired && (
          <View style={[styles.guardBanner, styles.guardExpired]}>
            <Clock size={18} color="#B45309" style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.guardTitle, { color: '#B45309' }]}>Offer Validity Expired</Text>
              <Text style={[styles.guardSub, { color: '#92400E' }]}>
                The supplier's validity window for this quote has lapsed. Please request a refreshed quote or counter.
              </Text>
            </View>
          </View>
        )}

        {/* Selected Offer & Supplier Overview Card */}
        <View style={styles.card}>
          <View style={styles.supplierTopRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.typeBadge}>{offer.supplierType.replace('_', ' ')}</Text>
                {offer.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <ShieldCheck size={10} color="#15803D" style={{ marginRight: 2 }} />
                    <Text style={styles.verifiedBadgeText}>Verified Supplier</Text>
                  </View>
                )}
              </View>
              <Text style={styles.supplierName}>{offer.supplierName}</Text>
              <Text style={styles.commodityText}>
                {offer.cropName} • {offer.grade} ({offer.variety})
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Sourcing Summary Metrics */}
          <View style={styles.quickSpecsRow}>
            <View style={styles.specBox}>
              <Text style={styles.specBoxLabel}>Accepted Volume</Text>
              <Text style={styles.specBoxValue}>
                {offer.quantity} {offer.unit}
              </Text>
            </View>

            <View style={styles.specBox}>
              <Text style={styles.specBoxLabel}>Unit Price Rate</Text>
              <Text style={[styles.specBoxValue, { color: MKColors.primary }]}>
                ₹{offer.unitPrice} <Text style={{ fontSize: 11, color: '#64748B' }}>/{offer.unit}</Text>
              </Text>
            </View>

            <View style={styles.specBox}>
              <Text style={styles.specBoxLabel}>Delivery Date</Text>
              <Text style={styles.specBoxValue}>{offer.deliveryDate}</Text>
            </View>
          </View>
        </View>

        {/* Complete Commercial Landed Cost Breakdown */}
        <View style={styles.costSheetCard}>
          <View style={styles.costSheetHeader}>
            <Text style={styles.costSheetTitle}>Commercial Landed Cost Sheet</Text>
            <View style={styles.safeEscrowChip}>
              <Lock size={12} color="#15803D" style={{ marginRight: 4 }} />
              <Text style={styles.safeEscrowChipText}>Safe Escrow Protected</Text>
            </View>
          </View>

          <View style={styles.costItemList}>
            <View style={styles.costRow}>
              <Text style={styles.costKey}>
                Produce Base ({offer.quantity} {offer.unit} @ ₹{offer.unitPrice})
              </Text>
              <Text style={styles.costVal}>
                ₹{(offer.quantity * offer.unitPrice).toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.costRow}>
              <Text style={styles.costKey}>
                Freight & Logistics ({offer.deliveryTerms.replace('_', ' ')})
              </Text>
              <Text style={styles.costVal}>
                ₹{offer.deliveryCost.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.costRow}>
              <Text style={styles.costKey}>Statutory APMC Market Cess (1.0%)</Text>
              <Text style={styles.costVal}>
                ₹{offer.taxesAndCess.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.costRow}>
              <Text style={styles.costKey}>Weighbridge Slip & Depot Handling</Text>
              <Text style={styles.costVal}>
                ₹{offer.handlingCost.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.costDivider} />

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Total Landed Budget</Text>
                <Text style={styles.totalUnitSub}>
                  Effective: ₹{offer.costPerUnitLanded.toLocaleString('en-IN')} / {offer.unit}
                </Text>
              </View>
              <Text style={styles.totalAmount}>
                ₹{offer.totalLandedAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Business Rules & What Acceptance Means */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Scale size={18} color={MKColors.primary} />
            <Text style={styles.sectionHeading}>Procurement Commitment Rules</Text>
          </View>

          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <Check size={16} color="#15803D" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.ruleText}>
                <Text style={styles.ruleBold}>Bilateral Contract: </Text>
                Accepting this quote executes a binding commercial procurement contract between you and {offer.supplierName}.
              </Text>
            </View>

            <View style={styles.ruleItem}>
              <Check size={16} color="#15803D" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.ruleText}>
                <Text style={styles.ruleBold}>MandiKart Safe Escrow: </Text>
                Your purchase commitment of ₹{offer.totalLandedAmount.toLocaleString('en-IN')} is reserved in escrow and released only after weighbridge gross slip verification and moisture inspection at your destination depot.
              </Text>
            </View>

            <View style={styles.ruleItem}>
              <Check size={16} color="#15803D" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.ruleText}>
                <Text style={styles.ruleBold}>Lock Competing Quotes: </Text>
                Accepting this offer automatically finalizes sourcing for this tender lot.
              </Text>
            </View>
          </View>

          {/* Two-step Explicit Confirmation Switch */}
          <View style={styles.confirmationSwitchBox}>
            <Switch
              value={agreementChecked}
              onValueChange={setAgreementChecked}
              trackColor={{ false: '#CBD5E1', true: MKColors.primary }}
              thumbColor={agreementChecked ? '#FFFFFF' : '#F1F5F9'}
              disabled={!canAccept}
            />
            <Text
              style={[
                styles.confirmationSwitchLabel,
                !canAccept && { color: '#94A3B8' },
              ]}
              onPress={() => canAccept && setAgreementChecked(!agreementChecked)}
            >
              I confirm the commercial terms above and authorize contract generation under MandiKart Safe Escrow.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          style={styles.btnCancel}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <Text style={styles.btnCancelText}>Cancel</Text>
        </Pressable>

        <Pressable
          style={[
            styles.btnConfirmAccept,
            (!canAccept || !agreementChecked || isSubmitting) && styles.btnDisabled,
          ]}
          onPress={handleConfirmAcceptance}
          disabled={!canAccept || !agreementChecked || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <CheckCircle2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnConfirmAcceptText}>Confirm & Execute Contract</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FAF8F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 16,
    backgroundColor: MKColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  guardBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  guardAccepted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  guardRejected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  guardExpired: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  guardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  guardSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  supplierTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: MKColors.primary,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  supplierName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  commodityText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  quickSpecsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  specBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  specBoxLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  specBoxValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  costSheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  costSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  costSheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  safeEscrowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  safeEscrowChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  costItemList: {
    gap: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costKey: {
    fontSize: 13,
    color: '#64748B',
  },
  costVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  costDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalUnitSub: {
    fontSize: 11,
    color: MKColors.primary,
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 19,
    fontWeight: '800',
    color: MKColors.primary,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  rulesList: {
    gap: 10,
    marginBottom: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  ruleBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  confirmationSwitchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 10,
  },
  confirmationSwitchLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FAF8F5',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  btnConfirmAccept: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
  },
  btnConfirmAcceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    backgroundColor: '#94A3B8',
  },
  successScreenContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  voucherCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  voucherHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  voucherContractNum: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.primary,
  },
  voucherDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  voucherGrid: {
    gap: 8,
  },
  voucherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherKey: {
    fontSize: 13,
    color: '#64748B',
  },
  voucherVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  voucherValBold: {
    fontSize: 14,
    fontWeight: '800',
  },
  voucherFooterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  voucherFooterText: {
    flex: 1,
    fontSize: 11,
    color: '#15803D',
    fontWeight: '500',
  },
  successActions: {
    width: '100%',
    gap: 10,
  },
  btnSuccessPrimary: {
    backgroundColor: MKColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSuccessPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnSuccessSecondary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnSuccessSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});
