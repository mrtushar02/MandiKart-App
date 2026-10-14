/**
 * MandiKart Farmer App — Offer Details Screen (Screen 23)
 *
 * Route: /offers/details?id=...
 *
 * Full commercial specification sheet of a procurement offer:
 * product specifications, unit pricing, landed transport & statutory cess
 * breakdown, multi-round negotiation history timeline, and role-based
 * action triggers (Accept, Counter, Decline, Chat).
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
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
  IndianRupee,
  ChevronRight,
  TrendingDown,
  Info,
  Building2,
  Calendar,
  Truck,
  Repeat,
  SlidersHorizontal,
  X,
  FileText,
  MessageSquare,
  Check,
  XCircle,
  Scale,
  CreditCard,
  Percent,
  History,
  Send,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useOffersStore, ProcurementOffer } from '@/store/offersStore';

export default function OfferDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    currentOffer,
    fetchOfferById,
    acceptOffer,
    rejectOffer,
    isLoading,
  } = useOffersStore();

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOfferById(id);
    }
  }, [id, fetchOfferById]);

  const offer: ProcurementOffer | null = currentOffer;

  const handleAccept = async () => {
    if (!id) return;
    Alert.alert(
      'Accept Commercial Offer',
      `Are you sure you want to accept this offer from ${offer?.supplierName} for ₹${offer?.totalLandedAmount.toLocaleString('en-IN')}? This creates a binding bilateral procurement contract under MandiKart safe escrow.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Generate Contract',
          onPress: async () => {
            setAccepting(true);
            const res = await acceptOffer(id);
            setAccepting(false);
            if (res.success) {
              Alert.alert('Contract Established', 'Offer accepted. Bilateral procurement order reference generated.');
            } else {
              Alert.alert('Error', res.error || 'Failed to accept offer.');
            }
          },
        },
      ]
    );
  };

  const handleConfirmReject = async () => {
    if (!id) return;
    setRejecting(true);
    const res = await rejectOffer(id, rejectReason);
    setRejecting(false);
    setRejectModalVisible(false);
    if (!res.success) {
      Alert.alert('Error', res.error || 'Failed to decline offer.');
    }
  };

  if (isLoading && !offer) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={MKColors.primary} />
        <Text style={styles.loadingText}>Loading complete offer terms & history...</Text>
      </View>
    );
  }

  if (!offer) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <AlertCircle size={42} color="#DC2626" />
        <Text style={styles.errorTitle}>Offer Not Found</Text>
        <Text style={styles.errorSubtitle}>The requested offer #{id} is unavailable.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Offers</Text>
        </Pressable>
      </View>
    );
  }

  const isIncoming = offer.direction === 'INCOMING';
  const isPendingFarmer = offer.status === 'PENDING_FARMER';
  const isAccepted = offer.status === 'ACCEPTED';
  const isRejected = offer.status === 'REJECTED';
  const isPriceBelow = offer.priceDiffPerUnit < 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.backIconButton}
            onPress={() => router.back()}
            accessibilityLabel="Back"
          >
            <ArrowLeft size={22} color={MKColors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Offer Details</Text>
            <Text style={styles.headerSubtitle}>
              #{offer.id} • {offer.cropName} ({offer.grade})
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.chatHeaderBtn}
          onPress={() => router.push(`/offers/chat?id=${offer.id}` as any)}
        >
          <MessageSquare size={16} color={MKColors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Status & Party Summary Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.directionBadge,
                isIncoming ? styles.directionIncoming : styles.directionOutgoing,
              ]}
            >
              <Text
                style={[
                  styles.directionBadgeText,
                  isIncoming ? { color: '#15803D' } : { color: '#0284C7' },
                ]}
              >
                {isIncoming ? 'INCOMING QUOTE' : 'SENT PURCHASE REQUEST'}
              </Text>
            </View>

            <View style={styles.offerStatusTag}>
              <Text style={styles.offerStatusText}>{offer.status.replace('_', ' ')}</Text>
            </View>
          </View>

          <Text style={styles.cardSupplierName}>{offer.supplierName}</Text>
          <Text style={styles.cardLocationText}>
            <Building2 size={12} color="#64748B" /> {offer.supplierType.replace('_', ' ')} • {offer.contactPerson || 'Authorized Representative'}
          </Text>

          {/* Linked Requirement Reference */}
          <View style={styles.linkedReqBox}>
            <Text style={styles.linkedReqLabel}>LINKED TENDER</Text>
            <Text style={styles.linkedReqTitle}>{offer.requirementTitle}</Text>
            <Text style={styles.linkedReqId}>Tender ID: #{offer.requirementId}</Text>
          </View>
        </View>

        {/* Commercial Specifications & Produce Fit */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Product & Commercial Terms</Text>

          <View style={styles.specGrid}>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Produce & Variety</Text>
              <Text style={styles.specValue}>{offer.cropName}</Text>
              <Text style={styles.specSub}>{offer.variety}</Text>
            </View>

            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Quality Grade</Text>
              <Text style={styles.specValue}>{offer.grade}</Text>
              <Text style={styles.specSub}>Standard Assorted</Text>
            </View>

            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Quantity</Text>
              <Text style={styles.specValue}>
                {offer.quantity} {offer.unit}
              </Text>
              <Text style={styles.specSub}>Full dispatch volume</Text>
            </View>

            <View style={styles.specBox}>
              <Text style={styles.specLabel}>Quoted Unit Rate</Text>
              <Text style={styles.specPriceValue}>
                ₹{offer.unitPrice}/{offer.unit}
              </Text>
              <Text
                style={[
                  styles.specSub,
                  isPriceBelow ? { color: '#15803D', fontWeight: '700' } : {},
                ]}
              >
                {isPriceBelow ? `₹${Math.abs(offer.priceDiffPerUnit)} below target` : 'Target matched'}
              </Text>
            </View>
          </View>

          {/* Delivery & Payment Terms */}
          <View style={styles.termsList}>
            <View style={styles.termRow}>
              <Truck size={15} color="#64748B" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.termTitle}>Logistics Arrangement</Text>
                <Text style={styles.termDesc}>
                  {offer.deliveryTerms === 'SELLER_DELIVERY'
                    ? 'Seller Delivers Directly to Destination Depot'
                    : 'MandiKart 3PL Transport Assisted'}
                </Text>
              </View>
            </View>

            <View style={styles.termRow}>
              <Calendar size={15} color="#64748B" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.termTitle}>Scheduled Delivery Date</Text>
                <Text style={styles.termDesc}>{offer.deliveryDate}</Text>
              </View>
            </View>

            <View style={styles.termRow}>
              <CreditCard size={15} color="#64748B" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.termTitle}>Settlement Mechanism</Text>
                <Text style={styles.termDesc}>{offer.paymentTerms}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Landed Cost Financial Breakdown */}
        <View style={[styles.card, styles.financialCard]}>
          <Text style={styles.finTitle}>Consolidated Landed Cost Breakdown</Text>
          <Text style={styles.finSub}>Transparent itemized landed cost at destination depot</Text>

          <View style={styles.costTable}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>
                Base Produce ({offer.quantity} {offer.unit} @ ₹{offer.unitPrice})
              </Text>
              <Text style={styles.costValue}>
                ₹{(offer.quantity * offer.unitPrice).toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.costRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.costLabel}>Transport Freight</Text>
                {offer.isDeliveryCostEstimated && (
                  <View style={styles.estTag}>
                    <Text style={styles.estTagText}>3PL Estimate</Text>
                  </View>
                )}
              </View>
              <Text style={styles.costValue}>₹{offer.deliveryCost.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.costRow}>
              <Text style={styles.costLabel}>APMC Statutory Market Cess (1%)</Text>
              <Text style={styles.costValue}>₹{offer.taxesAndCess.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Handling, Loading & Weighment</Text>
              <Text style={styles.costValue}>₹{offer.handlingCost.toLocaleString('en-IN')}</Text>
            </View>

            {offer.volumeDiscount > 0 && (
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: '#15803D' }]}>Volume Bulk Rebate</Text>
                <Text style={[styles.costValue, { color: '#15803D' }]}>
                  -₹{offer.volumeDiscount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            <View style={styles.costDivider} />

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Total Landed Value</Text>
                <Text style={styles.totalSub}>
                  Effective landed: ₹{offer.costPerUnitLanded}/{offer.unit}
                </Text>
              </View>
              <Text style={styles.totalAmount}>
                ₹{offer.totalLandedAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Multi-Round Negotiation History Timeline */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <History size={16} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Negotiation Timeline & Audit</Text>
            </View>
            <Pressable
              onPress={() => router.push(`/offers/history?id=${offer.id}` as any)}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: MKColors.primary }}>Full Audit Log</Text>
              <ChevronRight size={14} color={MKColors.primary} />
            </Pressable>
          </View>

          {offer.history.length === 0 ? (
            <Text style={styles.noHistoryText}>No past negotiation steps recorded.</Text>
          ) : (
            offer.history.map((step, idx) => {
              const isSupplier = step.actorRole === 'SUPPLIER';

              return (
                <View key={step.stepId} style={styles.historyStepItem}>
                  <View style={styles.stepDotContainer}>
                    <View
                      style={[
                        styles.stepDot,
                        isSupplier ? styles.stepDotSupplier : styles.stepDotFarmer,
                      ]}
                    />
                    {idx < offer.history.length - 1 && <View style={styles.stepLine} />}
                  </View>

                  <View style={styles.stepContentBox}>
                    <View style={styles.stepHeaderRow}>
                      <Text style={styles.stepActorText}>{step.actorName}</Text>
                      <Text style={styles.stepActionTag}>
                        {step.action.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text style={styles.stepTermsText}>
                      ₹{step.unitPrice}/{step.unit} • {step.quantity} {step.unit}
                    </Text>
                    {step.notes ? (
                      <Text style={styles.stepNotesText}>"{step.notes}"</Text>
                    ) : null}
                    <Text style={styles.stepTimeText}>
                      {new Date(step.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Role-Based Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isPendingFarmer ? (
          <View style={styles.actionRow}>
            <Pressable
              style={styles.btnDecline}
              onPress={() => router.push(`/offers/reject?id=${offer.id}` as any)}
            >
              <XCircle size={16} color="#DC2626" />
              <Text style={styles.btnDeclineText}>Decline</Text>
            </Pressable>

            <Pressable
              style={styles.btnCounter}
              onPress={() => router.push(`/offers/counter?id=${offer.id}` as any)}
            >
              <Repeat size={16} color={MKColors.primary} />
              <Text style={styles.btnCounterText}>Counteroffer</Text>
            </Pressable>

            <Pressable
              style={styles.btnAccept}
              onPress={() => router.push(`/offers/accept?id=${offer.id}` as any)}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.btnAcceptText}>Accept Offer</Text>
            </Pressable>
          </View>
        ) : isAccepted ? (
          <View style={styles.acceptedBar}>
            <CheckCircle2 size={18} color="#15803D" style={{ marginRight: 8 }} />
            <Text style={styles.acceptedBarText}>
              Procurement agreement finalized and binding under MandiKart safe escrow.
            </Text>
          </View>
        ) : isRejected ? (
          <View style={styles.rejectedBar}>
            <XCircle size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.rejectedBarText}>Offer was declined.</Text>
          </View>
        ) : (
          <Pressable
            style={styles.btnCounterSecondary}
            onPress={() => router.push(`/offers/counter?id=${offer.id}` as any)}
          >
            <Repeat size={16} color="#FFFFFF" />
            <Text style={styles.btnCounterSecondaryText}>Revise / Counteroffer</Text>
          </Pressable>
        )}
      </View>

      {/* Decline Reason Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Decline Offer</Text>
            <Text style={styles.modalSub}>
              Please provide a reason to inform {offer.supplierName}:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Found lower price, timing not feasible..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmDeclineBtn}
                onPress={handleConfirmReject}
                disabled={rejecting}
              >
                {rejecting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmDeclineText}>Confirm Decline</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: MKColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  chatHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  directionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  directionIncoming: {
    backgroundColor: '#DCFCE7',
  },
  directionOutgoing: {
    backgroundColor: '#E0F2FE',
  },
  directionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  offerStatusTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  offerStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  cardSupplierName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardLocationText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  linkedReqBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  linkedReqLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  linkedReqTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  linkedReqId: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  specBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  specPriceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.primary,
    marginTop: 2,
  },
  specSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  termsList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 10,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  termTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  termDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  financialCard: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  finTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#581C87',
  },
  finSub: {
    fontSize: 11,
    color: '#7E22CE',
    marginBottom: 12,
  },
  costTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 12,
    color: '#475569',
  },
  costValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  estTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 6,
  },
  estTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  costDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalSub: {
    fontSize: 10,
    color: '#64748B',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6B21A8',
  },
  historyStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepDotContainer: {
    width: 24,
    alignItems: 'center',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  stepDotSupplier: {
    backgroundColor: '#15803D',
  },
  stepDotFarmer: {
    backgroundColor: '#0284C7',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  stepContentBox: {
    flex: 1,
    marginLeft: 10,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepActorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  stepActionTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  stepTermsText: {
    fontSize: 12,
    fontWeight: '800',
    color: MKColors.primary,
    marginTop: 2,
  },
  stepNotesText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 2,
  },
  stepTimeText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  noHistoryText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnDecline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    gap: 4,
  },
  btnDeclineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  btnCounter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 4,
  },
  btnCounterText: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.primary,
  },
  btnAccept: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: MKColors.primary,
    gap: 4,
  },
  btnAcceptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnCounterSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: MKColors.primary,
    gap: 6,
  },
  btnCounterSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  acceptedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 8,
  },
  acceptedBarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    flex: 1,
  },
  rejectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
  },
  rejectedBarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontSize: 13,
    color: '#1E293B',
    textAlignVertical: 'top',
    height: 80,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalConfirmDeclineBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
  },
  modalConfirmDeclineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
