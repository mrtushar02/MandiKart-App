/**
 * MandiKart Farmer App — Offer History Screen (Screen 27)
 *
 * Route: /offers/history?id=...
 *
 * Full chronological audit trail of all negotiation rounds:
 * - Preserves immutable historical records (never overwrites original terms)
 * - Highlights round-by-round parameter diffs (Price shift %, Volume, Delivery, Notes)
 * - Clearly tags actor roles (Supplier vs Farmer) with exact timestamps
 * - Tracks status lifecycle (Submitted, Received, Countered, Accepted, Rejected)
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Package,
  IndianRupee,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Info,
  Building2,
  Calendar,
  Truck,
  Repeat,
  FileText,
  Clock,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useOffersStore, ProcurementOffer, OfferHistoryResult } from '@/store/offersStore';

export default function OfferHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    currentOffer,
    fetchOfferById,
    fetchOfferHistory,
    historyByOfferId,
    isLoading,
  } = useOffersStore();

  useEffect(() => {
    if (id) {
      fetchOfferById(id);
      fetchOfferHistory(id);
    }
  }, [id, fetchOfferById, fetchOfferHistory]);

  const offer: ProcurementOffer | null = currentOffer;
  const historyData: OfferHistoryResult | null = id ? historyByOfferId[id] || null : null;

  if (isLoading && !offer) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={MKColors.primary} />
        <Text style={styles.loadingText}>Loading negotiation audit history...</Text>
      </View>
    );
  }

  if (!offer) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <AlertCircle size={42} color="#DC2626" />
        <Text style={styles.errorTitle}>Offer Not Found</Text>
        <Text style={styles.errorSubtitle}>Could not load history for offer #{id}.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return</Text>
        </Pressable>
      </View>
    );
  }

  const steps = historyData?.steps || [];
  const initialStep = steps[0];
  const latestStep = steps[steps.length - 1];
  const overallPriceShift =
    initialStep && latestStep ? latestStep.unitPrice - initialStep.unitPrice : 0;
  const isFinalized =
    offer.status === 'ACCEPTED' || offer.status === 'REJECTED' || offer.status === 'EXPIRED';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1E293B" />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Offer Negotiation History</Text>
          <Text style={styles.headerSubtitle}>
            Tender #{offer.requirementId} • Offer #{offer.id}
          </Text>
        </View>
        <Pressable
          style={styles.summaryIconBtn}
          onPress={() => router.push(`/offers/summary?id=${offer.id}` as any)}
        >
          <FileText size={18} color={MKColors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Executive Overview Banner */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewTopRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.commodityTag}>{offer.cropName} ({offer.grade})</Text>
                <View
                  style={[
                    styles.statusTag,
                    offer.status === 'ACCEPTED'
                      ? styles.statusAccepted
                      : offer.status === 'PENDING_FARMER'
                      ? styles.statusActionRequired
                      : styles.statusNeutral,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
                      offer.status === 'ACCEPTED'
                        ? { color: '#15803D' }
                        : offer.status === 'PENDING_FARMER'
                        ? { color: '#B45309' }
                        : { color: '#1D4ED8' },
                    ]}
                  >
                    {offer.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.supplierNameText}>{offer.supplierName}</Text>
              <Text style={styles.reqTitleText} numberOfLines={1}>
                {offer.requirementTitle}
              </Text>
            </View>
          </View>

          {/* Metric Highlights */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Total Rounds</Text>
              <Text style={styles.metricVal}>{steps.length}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Starting Quote</Text>
              <Text style={styles.metricVal}>
                ₹{initialStep ? initialStep.unitPrice : offer.unitPrice}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Current Term</Text>
              <Text style={[styles.metricVal, { color: MKColors.primary }]}>
                ₹{offer.unitPrice}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Overall Shift</Text>
              <Text
                style={[
                  styles.metricVal,
                  overallPriceShift <= 0 ? { color: '#15803D' } : { color: '#B45309' },
                ]}
              >
                {overallPriceShift <= 0
                  ? `-₹${Math.abs(overallPriceShift)}`
                  : `+₹${overallPriceShift}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Chronological Rounds Section */}
        <View style={styles.roundsHeaderRow}>
          <History size={18} color={MKColors.primary} />
          <Text style={styles.roundsSectionTitle}>Chronological Negotiation Audit Trail</Text>
        </View>

        <View style={styles.timelineList}>
          {steps.map((step, idx) => {
            const isSupplier = step.actorRole === 'SUPPLIER';
            const isFarmer = step.actorRole === 'FARMER';
            const isLast = idx === steps.length - 1;
            const isInitial = idx === 0;

            return (
              <View key={step.stepId || idx} style={styles.timelineStepWrap}>
                {/* Vertical Line & Dot */}
                <View style={styles.timelineGutter}>
                  <View
                    style={[
                      styles.timelineDot,
                      isSupplier ? styles.dotSupplier : styles.dotFarmer,
                      isLast && styles.dotPulse,
                    ]}
                  >
                    <Text style={styles.dotNumber}>{step.roundNumber || idx + 1}</Text>
                  </View>
                  {!isLast && <View style={styles.timelineTrack} />}
                </View>

                {/* Step Card */}
                <View style={[styles.stepCard, isLast && styles.stepCardCurrent]}>
                  {/* Step Header */}
                  <View style={styles.stepTopBar}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text
                          style={[
                            styles.actorTag,
                            isSupplier ? styles.actorSupplier : styles.actorFarmer,
                          ]}
                        >
                          {isSupplier ? 'Supplier' : 'Farmer (You)'}
                        </Text>
                        <Text style={styles.roundTag}>Round {step.roundNumber || idx + 1}</Text>
                      </View>
                      <Text style={styles.stepActorName}>{step.actorName}</Text>
                    </View>

                    <View style={styles.stepTimestampCol}>
                      <Clock size={11} color="#64748B" style={{ marginRight: 3 }} />
                      <Text style={styles.stepTimestampText}>
                        {new Date(step.timestamp).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        •{' '}
                        {new Date(step.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Action Title Badge */}
                  <View style={styles.actionBannerRow}>
                    <Text style={styles.actionBannerTitle}>
                      {step.action === 'INITIAL_OFFER'
                        ? 'Initial Commercial Tender Quote'
                        : step.action === 'COUNTER_OFFER'
                        ? 'Submitted Counteroffer Proposal'
                        : step.action === 'ACCEPTED'
                        ? 'Bilateral Contract Accepted'
                        : 'Offer Rejected'}
                    </Text>
                  </View>

                  {/* Commercial Parameter Grid */}
                  <View style={styles.paramGrid}>
                    {/* Rate & Shift */}
                    <View style={styles.paramBox}>
                      <Text style={styles.paramLabel}>Quoted Rate</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={styles.paramValueBold}>₹{step.unitPrice}</Text>
                        <Text style={styles.paramUnit}>/{step.unit}</Text>
                      </View>
                      {step.priceDiffFromPrevious !== 0 && (
                        <View style={styles.shiftTag}>
                          {step.priceDiffFromPrevious < 0 ? (
                            <TrendingDown size={11} color="#15803D" style={{ marginRight: 2 }} />
                          ) : (
                            <TrendingUp size={11} color="#B45309" style={{ marginRight: 2 }} />
                          )}
                          <Text
                            style={[
                              styles.shiftTagText,
                              step.priceDiffFromPrevious < 0
                                ? { color: '#15803D' }
                                : { color: '#B45309' },
                            ]}
                          >
                            {step.priceDiffFromPrevious < 0
                              ? `-₹${Math.abs(step.priceDiffFromPrevious)} (${step.priceDiffPct}%)`
                              : `+₹${step.priceDiffFromPrevious} (+${step.priceDiffPct}%)`}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Volume */}
                    <View style={styles.paramBox}>
                      <Text style={styles.paramLabel}>Quantity</Text>
                      <Text style={styles.paramValueBold}>
                        {step.quantity} {step.unit}
                      </Text>
                      {step.quantityDiffFromPrevious !== 0 && (
                        <Text style={styles.qtyShiftText}>
                          {step.quantityDiffFromPrevious > 0
                            ? `+${step.quantityDiffFromPrevious} ${step.unit}`
                            : `${step.quantityDiffFromPrevious} ${step.unit}`}
                        </Text>
                      )}
                    </View>

                    {/* Delivery Terms */}
                    <View style={styles.paramBox}>
                      <Text style={styles.paramLabel}>Delivery Terms</Text>
                      <Text style={styles.paramValueMedium} numberOfLines={1}>
                        {step.deliveryTerms ? step.deliveryTerms.replace('_', ' ') : 'Seller Delivery'}
                      </Text>
                      {step.deliveryDate && (
                        <Text style={styles.paramSubDate}>{step.deliveryDate}</Text>
                      )}
                    </View>

                    {/* Landed Sourcing Estimate */}
                    <View style={styles.paramBox}>
                      <Text style={styles.paramLabel}>Landed Sourcing Budget</Text>
                      <Text style={[styles.paramValueBold, { color: MKColors.primary }]}>
                        ₹{step.totalLandedAtStep.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.paramSubLanded}>
                        ₹{step.effectiveCostPerUnit}/{step.unit} all-in
                      </Text>
                    </View>
                  </View>

                  {/* Notes / Commercial Reasoning */}
                  {step.notes ? (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesLabel}>Negotiation Notes:</Text>
                      <Text style={styles.notesContent}>"{step.notes}"</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          style={styles.btnSecondary}
          onPress={() => router.push(`/offers/summary?id=${offer.id}` as any)}
        >
          <FileText size={16} color="#334155" style={{ marginRight: 6 }} />
          <Text style={styles.btnSecondaryText}>View Summary</Text>
        </Pressable>

        {!isFinalized ? (
          <Pressable
            style={styles.btnPrimary}
            onPress={() => router.push(`/offers/counter?id=${offer.id}` as any)}
          >
            <Repeat size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnPrimaryText}>Revise / Counter</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.btnPrimary}
            onPress={() => router.push(`/offers/details?id=${offer.id}` as any)}
          >
            <Text style={styles.btnPrimaryText}>View Complete Offer</Text>
          </Pressable>
        )}
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
    justifyContent: 'center',
    alignItems: 'center',
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
  summaryIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  overviewTopRow: {
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commodityTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusAccepted: {
    backgroundColor: '#DCFCE7',
  },
  statusActionRequired: {
    backgroundColor: '#FEF3C7',
  },
  statusNeutral: {
    backgroundColor: '#EFF6FF',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  supplierNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  reqTitleText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  roundsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  roundsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 8,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineStepWrap: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineGutter: {
    width: 32,
    alignItems: 'center',
    marginRight: 10,
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  dotNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dotSupplier: {
    backgroundColor: '#2563EB',
  },
  dotFarmer: {
    backgroundColor: MKColors.primary,
  },
  dotPulse: {
    borderWidth: 3,
    borderColor: '#BBF7D0',
  },
  timelineTrack: {
    width: 2,
    flex: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 4,
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
  },
  stepCardCurrent: {
    borderColor: MKColors.primary,
    borderWidth: 1.5,
  },
  stepTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  actorTag: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  actorSupplier: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
  },
  actorFarmer: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  roundTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  stepActorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  stepTimestampCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepTimestampText: {
    fontSize: 10,
    color: '#64748B',
  },
  actionBannerRow: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  actionBannerTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  paramGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  paramBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  paramLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  paramValueBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  paramValueMedium: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  paramUnit: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 2,
  },
  paramSubDate: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  paramSubLanded: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  shiftTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  shiftTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  qtyShiftText: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  notesBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: MKColors.primary,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  notesContent: {
    fontSize: 11,
    color: '#1E293B',
    fontStyle: 'italic',
    marginTop: 2,
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
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  btnPrimary: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
