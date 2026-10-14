/**
 * MandiKart Farmer App — Negotiation Summary Screen (Screen 28)
 *
 * Route: /offers/summary?id=...
 *
 * Executive commercial negotiation summary:
 * - Contrasts original starting terms with latest proposed terms
 * - Explicit distinction between confirmed savings (accepted) vs estimated savings (pending)
 * - Identifies outstanding decisions and next valid actions based on status
 * - Provides seamless direct links to requirement, supplier profile, offer details, and chat
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
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
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Info,
  Building2,
  Calendar,
  Truck,
  Repeat,
  FileText,
  MessageSquare,
  History,
  Check,
  ExternalLink,
  CreditCard,
  Percent,
  Clock,
  Send,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useOffersStore, ProcurementOffer, OfferSummaryResult } from '@/store/offersStore';

export default function NegotiationSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    currentOffer,
    fetchOfferById,
    fetchOfferSummary,
    summaryByOfferId,
    acceptOffer,
    isLoading,
  } = useOffersStore();

  useEffect(() => {
    if (id) {
      fetchOfferById(id);
      fetchOfferSummary(id);
    }
  }, [id, fetchOfferById, fetchOfferSummary]);

  const offer: ProcurementOffer | null = currentOffer;
  const summary: OfferSummaryResult | null = id ? summaryByOfferId[id] || null : null;

  if (isLoading && !offer) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={MKColors.primary} />
        <Text style={styles.loadingText}>Loading negotiation executive summary...</Text>
      </View>
    );
  }

  if (!offer) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <AlertCircle size={42} color="#DC2626" />
        <Text style={styles.errorTitle}>Summary Unavailable</Text>
        <Text style={styles.errorSubtitle}>Could not load summary for offer #{id}.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Offers</Text>
        </Pressable>
      </View>
    );
  }

  const initialTerms = summary?.initialTerms || {
    unitPrice: offer.targetPrice || offer.unitPrice,
    quantity: offer.quantity,
    unit: offer.unit,
    deliveryDate: offer.deliveryDate,
    deliveryTerms: offer.deliveryTerms,
    paymentTerms: offer.paymentTerms,
    totalLandedAmount: offer.totalLandedAmount,
  };

  const latestTerms = summary?.latestTerms || {
    unitPrice: offer.unitPrice,
    quantity: offer.quantity,
    unit: offer.unit,
    deliveryDate: offer.deliveryDate,
    deliveryTerms: offer.deliveryTerms,
    paymentTerms: offer.paymentTerms,
    totalLandedAmount: offer.totalLandedAmount,
  };

  const priceDelta = latestTerms.unitPrice - initialTerms.unitPrice;
  const landedDelta = latestTerms.totalLandedAmount - initialTerms.totalLandedAmount;
  const isConfirmed = offer.status === 'ACCEPTED';
  const isActionRequired = offer.status === 'PENDING_FARMER';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1E293B" />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Negotiation Summary</Text>
          <Text style={styles.headerSubtitle}>
            Tender #{offer.requirementId} • #{offer.id}
          </Text>
        </View>
        <Pressable
          style={styles.chatIconBtn}
          onPress={() => router.push(`/offers/chat?id=${offer.id}` as any)}
        >
          <MessageSquare size={18} color={MKColors.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Outstanding Decision & Status Card */}
        <View
          style={[
            styles.statusBannerCard,
            isConfirmed
              ? styles.statusCardConfirmed
              : isActionRequired
              ? styles.statusCardAction
              : styles.statusCardPending,
          ]}
        >
          <View style={styles.statusBannerTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isConfirmed ? (
                <CheckCircle2 size={18} color="#15803D" style={{ marginRight: 6 }} />
              ) : isActionRequired ? (
                <Clock size={18} color="#B45309" style={{ marginRight: 6 }} />
              ) : (
                <Info size={18} color="#1D4ED8" style={{ marginRight: 6 }} />
              )}
              <Text
                style={[
                  styles.statusBannerTitle,
                  isConfirmed
                    ? { color: '#15803D' }
                    : isActionRequired
                    ? { color: '#B45309' }
                    : { color: '#1D4ED8' },
                ]}
              >
                {offer.status.replace('_', ' ')}
              </Text>
            </View>
            <Text style={styles.roundsBadgeText}>{offer.history.length} round(s) recorded</Text>
          </View>

          <Text style={styles.statusDecisionText}>
            {summary?.outstandingDecision ||
              (isActionRequired
                ? `Supplier quoted ₹${offer.unitPrice}/${offer.unit}. Review commercial terms to accept or submit a counteroffer.`
                : isConfirmed
                ? 'Procurement agreement accepted and finalized under Safe Escrow.'
                : 'Waiting for supplier response to counteroffer proposal.')}
          </Text>
        </View>

        {/* Commodity & Supplier Header Card */}
        <View style={styles.card}>
          <View style={styles.supplierCardHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.clusterTypeTag}>{offer.supplierType.replace('_', ' ')}</Text>
                {offer.isVerified && (
                  <View style={styles.verifiedTag}>
                    <ShieldCheck size={10} color="#15803D" style={{ marginRight: 2 }} />
                    <Text style={styles.verifiedTagText}>Verified Supplier</Text>
                  </View>
                )}
              </View>
              <Text style={styles.supplierNameText}>{offer.supplierName}</Text>
              <Text style={styles.commodityDetailText}>
                {offer.cropName} • {offer.grade} ({offer.variety})
              </Text>
            </View>

            <Pressable
              style={styles.chatShortcutBtn}
              onPress={() => router.push(`/offers/chat?id=${offer.id}` as any)}
            >
              <MessageSquare size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.chatShortcutBtnText}>Chat</Text>
            </Pressable>
          </View>

          {/* Quick links to related entities */}
          <View style={styles.relatedLinksDivider} />
          <View style={styles.relatedLinksRow}>
            <Pressable
              style={styles.relatedLinkChip}
              onPress={() => router.push(`/requirements/${offer.requirementId}` as any)}
            >
              <Package size={12} color="#475569" style={{ marginRight: 4 }} />
              <Text style={styles.relatedLinkText} numberOfLines={1}>
                Tender: {offer.requirementTitle}
              </Text>
              <ExternalLink size={10} color="#64748B" style={{ marginLeft: 4 }} />
            </Pressable>

            <Pressable
              style={styles.relatedLinkChip}
              onPress={() => router.push(`/offers/history?id=${offer.id}` as any)}
            >
              <History size={12} color="#475569" style={{ marginRight: 4 }} />
              <Text style={styles.relatedLinkText}>Audit Trail ({offer.history.length})</Text>
              <ChevronRight size={12} color="#64748B" />
            </Pressable>
          </View>
        </View>

        {/* Terms Comparison Table: Initial vs Latest */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Terms Evolution</Text>
            <Text style={styles.cardSubtitle}>Starting Quote vs Current Proposed</Text>
          </View>

          {/* Table Header */}
          <View style={styles.compHeaderRow}>
            <Text style={[styles.compColHead, { flex: 1.2 }]}>Commercial Parameter</Text>
            <Text style={[styles.compColHead, { flex: 1, textAlign: 'center' }]}>Starting</Text>
            <Text style={[styles.compColHead, { flex: 1.1, textAlign: 'right', color: MKColors.primary }]}>
              Current
            </Text>
          </View>

          {/* Row 1: Unit Price */}
          <View style={styles.compRow}>
            <View style={{ flex: 1.2 }}>
              <Text style={styles.compParamName}>Quoted Rate</Text>
              <Text style={styles.compParamSub}>per {offer.unit}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.compStartVal}>₹{initialTerms.unitPrice}</Text>
            </View>
            <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
              <Text style={styles.compLatestVal}>₹{latestTerms.unitPrice}</Text>
              {priceDelta !== 0 && (
                <Text
                  style={[
                    styles.compDeltaText,
                    priceDelta < 0 ? { color: '#15803D' } : { color: '#B45309' },
                  ]}
                >
                  {priceDelta < 0 ? `-₹${Math.abs(priceDelta)}` : `+₹${priceDelta}`}
                </Text>
              )}
            </View>
          </View>

          {/* Row 2: Quantity */}
          <View style={styles.compRow}>
            <View style={{ flex: 1.2 }}>
              <Text style={styles.compParamName}>Volume</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.compStartVal}>
                {initialTerms.quantity} {offer.unit}
              </Text>
            </View>
            <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
              <Text style={styles.compLatestVal}>
                {latestTerms.quantity} {offer.unit}
              </Text>
            </View>
          </View>

          {/* Row 3: Delivery Terms */}
          <View style={styles.compRow}>
            <View style={{ flex: 1.2 }}>
              <Text style={styles.compParamName}>Delivery Method</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.compStartValSmall}>
                {initialTerms.deliveryTerms ? initialTerms.deliveryTerms.replace('_', ' ') : 'Seller Delivery'}
              </Text>
            </View>
            <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
              <Text style={styles.compLatestValSmall}>
                {latestTerms.deliveryTerms.replace('_', ' ')}
              </Text>
            </View>
          </View>

          {/* Row 4: Dispatch Date */}
          <View style={styles.compRow}>
            <View style={{ flex: 1.2 }}>
              <Text style={styles.compParamName}>Delivery Date</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.compStartValSmall}>{initialTerms.deliveryDate}</Text>
            </View>
            <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
              <Text style={styles.compLatestValSmall}>{latestTerms.deliveryDate}</Text>
            </View>
          </View>

          {/* Row 5: Total Landed Amount */}
          <View style={[styles.compRow, styles.compTotalRow]}>
            <View style={{ flex: 1.2 }}>
              <Text style={styles.compTotalLabel}>Total Landed Cost</Text>
              <Text style={styles.compTotalSub}>All statutory cess & freight</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.compStartTotal}>
                ₹{initialTerms.totalLandedAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
              <Text style={styles.compLatestTotal}>
                ₹{latestTerms.totalLandedAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Savings Analysis Card: Distinguish Confirmed vs Estimated */}
        <View style={styles.savingsCard}>
          <View style={styles.savingsCardTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isConfirmed ? (
                <ShieldCheck size={20} color="#15803D" style={{ marginRight: 6 }} />
              ) : (
                <Clock size={20} color="#B45309" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.savingsTypeHeading}>
                {isConfirmed ? 'Confirmed Sourcing Savings' : 'Estimated Potential Savings'}
              </Text>
            </View>

            <View
              style={[
                styles.savingsTagBadge,
                isConfirmed ? styles.savingsTagConfirmed : styles.savingsTagEstimated,
              ]}
            >
              <Text
                style={[
                  styles.savingsTagText,
                  isConfirmed ? { color: '#15803D' } : { color: '#B45309' },
                ]}
              >
                {isConfirmed ? 'Contract Executed' : 'Pending Final Acceptance'}
              </Text>
            </View>
          </View>

          <View style={styles.savingsAmountRow}>
            <Text style={styles.savingsAmountFigure}>
              ₹{Math.abs(landedDelta).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.savingsAmountSub}>
              {landedDelta <= 0
                ? 'saved compared to starting initial proposal'
                : 'increase due to revised volume or upgraded logistics'}
            </Text>
          </View>

          <Text style={styles.savingsExplanationText}>
            {isConfirmed
              ? 'These savings are guaranteed under the bilateral procurement order and locked in MandiKart Safe Escrow.'
              : 'Savings will be confirmed and locked once the supplier accepts the latest counteroffer.'}
          </Text>
        </View>

        {/* Cost Breakdown Sheet */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Cost Basis Breakdown</Text>
          <View style={styles.breakdownList}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>
                Produce Base ({offer.quantity} {offer.unit} @ ₹{offer.unitPrice})
              </Text>
              <Text style={styles.breakdownVal}>
                ₹{(offer.quantity * offer.unitPrice).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>
                Freight ({offer.deliveryTerms.replace('_', ' ')})
              </Text>
              <Text style={styles.breakdownVal}>
                ₹{offer.deliveryCost.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>Statutory APMC Market Fee (1.0%)</Text>
              <Text style={styles.breakdownVal}>
                ₹{offer.taxesAndCess.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>Weighbridge & Depot Handling</Text>
              <Text style={styles.breakdownVal}>
                ₹{offer.handlingCost.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownTotalRow}>
              <View>
                <Text style={styles.breakdownTotalLabel}>Effective Landed Sourcing Budget</Text>
                <Text style={styles.breakdownUnitRate}>
                  ₹{offer.costPerUnitLanded.toLocaleString('en-IN')} / {offer.unit} all-in
                </Text>
              </View>
              <Text style={styles.breakdownGrandTotal}>
                ₹{offer.totalLandedAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Dynamic Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          style={styles.btnSecondary}
          onPress={() => router.push(`/offers/details?id=${offer.id}` as any)}
        >
          <Text style={styles.btnSecondaryText}>Offer Details</Text>
        </Pressable>

        {isActionRequired ? (
          <Pressable
            style={styles.btnPrimary}
            onPress={() => router.push(`/offers/counter?id=${offer.id}` as any)}
          >
            <Repeat size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnPrimaryText}>Counteroffer</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.btnPrimary}
            onPress={() => router.push(`/offers/chat?id=${offer.id}` as any)}
          >
            <MessageSquare size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnPrimaryText}>Open Negotiation Chat</Text>
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
  chatIconBtn: {
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
  statusBannerCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  statusCardConfirmed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusCardAction: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusCardPending: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  statusBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  roundsBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  statusDecisionText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
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
  supplierCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clusterTypeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: MKColors.primary,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  supplierNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  commodityDetailText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chatShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MKColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chatShortcutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  relatedLinksDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  relatedLinksRow: {
    flexDirection: 'row',
    gap: 8,
  },
  relatedLinkChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  relatedLinkText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  cardTitleRow: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  compHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  compColHead: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  compTotalRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderBottomWidth: 0,
    marginTop: 6,
  },
  compParamName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  compParamSub: {
    fontSize: 10,
    color: '#64748B',
  },
  compStartVal: {
    fontSize: 13,
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  compStartValSmall: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  compLatestVal: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.primary,
  },
  compLatestValSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.primary,
    textAlign: 'right',
  },
  compDeltaText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  compTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  compTotalSub: {
    fontSize: 10,
    color: '#64748B',
  },
  compStartTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  compLatestTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  savingsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  savingsCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savingsTypeHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  savingsTagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  savingsTagConfirmed: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  savingsTagEstimated: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
  },
  savingsTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  savingsAmountRow: {
    marginVertical: 6,
  },
  savingsAmountFigure: {
    fontSize: 26,
    fontWeight: '800',
    color: '#4ADE80',
  },
  savingsAmountSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  savingsExplanationText: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
  },
  breakdownList: {
    gap: 8,
    marginTop: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownKey: {
    fontSize: 13,
    color: '#64748B',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  breakdownTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  breakdownUnitRate: {
    fontSize: 11,
    color: MKColors.primary,
    marginTop: 2,
  },
  breakdownGrandTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: MKColors.primary,
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
    flex: 1.5,
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
