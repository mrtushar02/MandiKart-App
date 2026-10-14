/**
 * MandiKart Farmer App — Reject Offer Confirmation Screen (Screen 30)
 *
 * Route: /offers/reject?id=...
 *
 * Final commercial rejection and feedback confirmation:
 * - Displays clear offer and supplier identification
 * - Structured rejection reason selection + custom feedback note
 * - Clear warning on irreversible termination of the negotiation
 * - Guard against modifying already-finalized (ACCEPTED/REJECTED) offers
 * - UI updates only after server-side confirmation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Package,
  IndianRupee,
  Calendar,
  Truck,
  Check,
  Info,
  Clock,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useOffersStore, ProcurementOffer } from '@/store/offersStore';

const REJECTION_REASONS = [
  'Quoted price exceeds our tender budget ceiling',
  'Found more competitive offer from alternative supplier',
  'Delivery schedule does not meet production deadline',
  'Product grading or packaging specifications mismatch',
  'Procurement requirement paused or modified',
  'Other / custom reason (specify below)',
];

export default function RejectOfferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { currentOffer, fetchOfferById, rejectOffer, isLoading } = useOffersStore();

  const [selectedReason, setSelectedReason] = useState<string>(REJECTION_REASONS[0]);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectSuccess, setRejectSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchOfferById(id);
    }
  }, [id, fetchOfferById]);

  const offer: ProcurementOffer | null = currentOffer;

  // Finalized guards
  const isAccepted = offer?.status === 'ACCEPTED';
  const isAlreadyRejected = offer?.status === 'REJECTED';
  const canReject = Boolean(offer && !isAccepted && !isAlreadyRejected);

  const handleConfirmRejection = async () => {
    if (!id || !canReject || isSubmitting) return;

    const fullReason =
      selectedReason === 'Other / custom reason (specify below)'
        ? customNotes.trim() || 'Declined without specific reason.'
        : customNotes.trim()
        ? `${selectedReason}: ${customNotes.trim()}`
        : selectedReason;

    setIsSubmitting(true);
    try {
      const res = await rejectOffer(id, fullReason);
      setIsSubmitting(false);

      if (res.success) {
        setRejectSuccess(true);
      } else {
        Alert.alert(
          'Rejection Failed',
          res.error || 'Server could not record offer rejection. Please try again.'
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
        <Text style={styles.loadingText}>Loading offer details...</Text>
      </View>
    );
  }

  if (!offer) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <XCircle size={42} color="#DC2626" />
        <Text style={styles.errorTitle}>Offer Not Found</Text>
        <Text style={styles.errorSubtitle}>Could not locate offer #{id}.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Offers</Text>
        </Pressable>
      </View>
    );
  }

  // Post-Rejection Success Screen
  if (rejectSuccess) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.successScreenContent}>
          <View style={styles.successIconCircle}>
            <XCircle size={56} color="#DC2626" />
          </View>
          <Text style={styles.successHeading}>Offer Declined</Text>
          <Text style={styles.successSubtext}>
            You have formally declined the commercial quote from {offer.supplierName} for #{offer.id}.
            The supplier has been notified with your feedback.
          </Text>

          <View style={styles.recapCard}>
            <View style={styles.recapRow}>
              <Text style={styles.recapKey}>Supplier</Text>
              <Text style={styles.recapVal}>{offer.supplierName}</Text>
            </View>
            <View style={styles.recapRow}>
              <Text style={styles.recapKey}>Commodity</Text>
              <Text style={styles.recapVal}>{offer.cropName} ({offer.grade})</Text>
            </View>
            <View style={styles.recapRow}>
              <Text style={styles.recapKey}>Quoted Rate</Text>
              <Text style={styles.recapVal}>₹{offer.unitPrice} / {offer.unit}</Text>
            </View>
            <View style={styles.recapRow}>
              <Text style={styles.recapKey}>Reason Recorded</Text>
              <Text style={styles.recapReasonText} numberOfLines={2}>
                {selectedReason}
              </Text>
            </View>
          </View>

          <View style={styles.successActions}>
            <Pressable
              style={styles.btnSuccessPrimary}
              onPress={() => router.push('/offers/incoming' as any)}
            >
              <Text style={styles.btnSuccessPrimaryText}>View Other Incoming Offers</Text>
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
          <Text style={styles.headerTitle}>Decline Commercial Offer</Text>
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
        {/* Guard Banners */}
        {isAccepted && (
          <View style={styles.errorGuardBanner}>
            <AlertTriangle size={18} color="#DC2626" style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorGuardTitle}>Cannot Decline Finalized Contract</Text>
              <Text style={styles.errorGuardSub}>
                This offer has already been accepted and binding procurement terms have been executed.
              </Text>
            </View>
          </View>
        )}

        {isAlreadyRejected && (
          <View style={styles.errorGuardBanner}>
            <Info size={18} color="#DC2626" style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorGuardTitle}>Offer Already Declined</Text>
              <Text style={styles.errorGuardSub}>
                This commercial quote was previously rejected on{' '}
                {new Date(offer.updatedAt).toLocaleDateString('en-IN')}.
              </Text>
            </View>
          </View>
        )}

        {/* Offer Identification Card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.typeBadge}>{offer.supplierType.replace('_', ' ')}</Text>
                {offer.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <ShieldCheck size={10} color="#15803D" style={{ marginRight: 2 }} />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                )}
                <Text style={styles.offerIdText}>#{offer.id}</Text>
              </View>
              <Text style={styles.supplierName}>{offer.supplierName}</Text>
              <Text style={styles.commodityText}>
                {offer.cropName} • {offer.grade} ({offer.variety})
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.offerMetricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Offered Volume</Text>
              <Text style={styles.metricValue}>
                {offer.quantity} {offer.unit}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Quoted Rate</Text>
              <Text style={styles.metricValue}>
                ₹{offer.unitPrice} <Text style={{ fontSize: 11, color: '#64748B' }}>/{offer.unit}</Text>
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Landed</Text>
              <Text style={[styles.metricValue, { color: '#0F172A' }]}>
                ₹{offer.totalLandedAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Irreversible Action Warning */}
        <View style={styles.warningCard}>
          <AlertTriangle size={18} color="#B45309" style={{ marginRight: 8, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.warningTitle}>Irreversible Termination</Text>
            <Text style={styles.warningText}>
              Declining this offer permanently closes this negotiation thread. The supplier will be
              notified that their quote was not accepted for this tender.
            </Text>
          </View>
        </View>

        {/* Structured Rejection Reasons */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Reason for Declining</Text>
          <Text style={styles.sectionSubtitle}>
            Providing specific feedback helps suppliers calibrate better quotes for future tenders.
          </Text>

          <View style={styles.reasonsList}>
            {REJECTION_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <Pressable
                  key={reason}
                  style={[
                    styles.reasonOptionCard,
                    isSelected && styles.reasonOptionActive,
                    !canReject && { opacity: 0.6 },
                  ]}
                  onPress={() => canReject && setSelectedReason(reason)}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.reasonOptionText,
                      isSelected && styles.reasonOptionTextActive,
                    ]}
                  >
                    {reason}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Optional Custom Notes */}
          <View style={styles.customNotesWrap}>
            <Text style={styles.inputLabel}>Additional Notes / Feedback for Supplier (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={customNotes}
              onChangeText={setCustomNotes}
              placeholder="e.g. Willing to reconsider if rate can be revised to ₹2,250/qtl in next cycle..."
              multiline
              numberOfLines={3}
              editable={canReject}
            />
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          style={styles.btnKeepOpen}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <Text style={styles.btnKeepOpenText}>Keep Offer Open</Text>
        </Pressable>

        <Pressable
          style={[styles.btnConfirmDecline, (!canReject || isSubmitting) && styles.btnDisabled]}
          onPress={handleConfirmRejection}
          disabled={!canReject || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <XCircle size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnConfirmDeclineText}>Confirm & Decline Offer</Text>
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
  errorGuardBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  errorGuardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  errorGuardSub: {
    fontSize: 12,
    color: '#991B1B',
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
  cardTopRow: {
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
    color: '#475569',
    backgroundColor: '#F1F5F9',
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
    marginRight: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  offerIdText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
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
  offerMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  warningText: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
  },
  reasonsList: {
    gap: 8,
    marginBottom: 14,
  },
  reasonOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  reasonOptionActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleActive: {
    borderColor: '#DC2626',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  reasonOptionText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  reasonOptionTextActive: {
    color: '#991B1B',
    fontWeight: '600',
  },
  customNotesWrap: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
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
  btnKeepOpen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnKeepOpenText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  btnConfirmDecline: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 14,
  },
  btnConfirmDeclineText: {
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
    backgroundColor: '#FEF2F2',
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
  recapCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    gap: 10,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recapKey: {
    fontSize: 13,
    color: '#64748B',
  },
  recapVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  recapReasonText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
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
