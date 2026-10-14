/**
 * MandiKart Farmer App — Delivered-Cost Comparison Screen (Screen 18)
 *
 * Route: /matching/delivered-cost?id=...
 *
 * Detailed side-by-side landed cost engineering across compared suppliers:
 * Base Produce + Transport Freight + APMC Statutory Cess + Handling - Volume Discounts.
 * Explicitly separates confirmed quotes from estimated 3PL rates, and never defaults
 * missing logistics costs to zero.
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  MapPin,
  Clock,
  Package,
  IndianRupee,
  Layers,
  ChevronRight,
  TrendingDown,
  Info,
  Truck,
  Scale,
  Percent,
  SlidersHorizontal,
  Building2,
  Sparkles,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useRequirementsStore } from '@/store/requirementsStore';
import {
  useSupplierMatchingStore,
  SupplierMatchItem,
} from '@/store/supplierMatchingStore';

export default function DeliveredCostComparisonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getRequirementById } = useRequirementsStore();
  const {
    matchesByRequirementId,
    selectedSupplierIdsForComparison,
    toggleSupplierComparison,
    fetchMatchesForRequirement,
    isLoading,
  } = useSupplierMatchingStore();

  const requirement = useMemo(() => {
    if (!id) return undefined;
    return getRequirementById(id);
  }, [id, getRequirementById]);

  useEffect(() => {
    if (id) {
      const p = requirement?.products[0];
      fetchMatchesForRequirement(id, {
        cropName: p?.productName || 'Red Onion',
        totalQuantity: p?.quantity || requirement?.totalQuantity || 100,
        targetPricePerUnit: p?.targetPricePerUnit || 2400,
        unit: p?.unit || requirement?.primaryUnit || 'quintal',
        grade: p?.grade || 'Grade A',
      });
    }
  }, [id, requirement, fetchMatchesForRequirement]);

  const allMatches: SupplierMatchItem[] = useMemo(() => {
    if (!id) return [];
    return matchesByRequirementId[id] || [];
  }, [id, matchesByRequirementId]);

  // If none or only 1 selected, auto-select top 2 for comparative calculation
  useEffect(() => {
    if (allMatches.length >= 2 && selectedSupplierIdsForComparison.length < 2) {
      const topTwo = allMatches.slice(0, 2).map((m) => m.supplier.id);
      topTwo.forEach((sId) => {
        if (!selectedSupplierIdsForComparison.includes(sId)) {
          toggleSupplierComparison(sId);
        }
      });
    }
  }, [allMatches, selectedSupplierIdsForComparison, toggleSupplierComparison]);

  const comparedItems = useMemo(() => {
    const list = allMatches.filter((m) =>
      selectedSupplierIdsForComparison.includes(m.supplier.id)
    );
    return list.length > 0 ? list : allMatches.slice(0, 2);
  }, [allMatches, selectedSupplierIdsForComparison]);

  // Determine lowest landed cost
  const bestLandedDeal = useMemo(() => {
    if (comparedItems.length === 0) return undefined;
    return [...comparedItems].sort(
      (a, b) => a.deliveredCost.deliveredCostPerUnit - b.deliveredCost.deliveredCostPerUnit
    )[0];
  }, [comparedItems]);

  const primaryProduct = requirement?.products[0];
  const targetQuantity = primaryProduct?.quantity || requirement?.totalQuantity || 100;
  const unit = primaryProduct?.unit || requirement?.primaryUnit || 'quintal';
  const targetPrice = primaryProduct?.targetPricePerUnit || 2400;
  const targetBudget = targetQuantity * targetPrice;

  if (isLoading && allMatches.length === 0) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={MKColors.primary} />
        <Text style={styles.loadingText}>Calculating landed cost models across suppliers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
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
            <Text style={styles.headerTitle}>Delivered-Cost Comparison</Text>
            <Text style={styles.headerSubtitle}>
              Landed Cost Breakdown • {targetQuantity} {unit} Base
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.matrixBtn}
          onPress={() => router.push(`/matching/compare?id=${id}` as any)}
        >
          <SlidersHorizontal size={14} color={MKColors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.matrixBtnText}>Specs Matrix</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Baseline Tender Requirement Banner */}
        <View style={styles.baselineCard}>
          <View style={styles.baselineRow}>
            <View>
              <Text style={styles.baselineLabel}>TENDER REQUIREMENT</Text>
              <Text style={styles.baselineTitle}>
                {primaryProduct?.productName || 'Red Onion'} • {primaryProduct?.grade || 'Grade A'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.baselineLabel}>TARGET BUDGET CEILING</Text>
              <Text style={styles.baselineBudget}>₹{targetBudget.toLocaleString('en-IN')}</Text>
              <Text style={styles.baselineUnit}>
                ₹{targetPrice}/{unit}
              </Text>
            </View>
          </View>

          <View style={styles.baselineDepotRow}>
            <MapPin size={13} color="#0D9488" style={{ marginRight: 4 }} />
            <Text style={styles.baselineDepotText}>
              Destination: {requirement?.delivery?.destinationName || 'Nashik Central Depot'} (
              {requirement?.delivery?.city || 'Nashik'})
            </Text>
          </View>
        </View>

        {/* Multi-Supplier Aggregation Quick Link */}
        <Pressable
          style={styles.aggregationBanner}
          onPress={() => router.push(`/matching/aggregation?id=${id}` as any)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Layers size={18} color="#6B21A8" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.aggregationBannerTitle}>Pool Supply (Multi-Supplier Aggregation)</Text>
              <Text style={styles.aggregationBannerSub}>
                Combine multiple supplier capacities to optimize landed costs.
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color="#6B21A8" />
        </Pressable>

        {/* Most Cost-Effective Landed Deal Recommendation Callout */}
        {bestLandedDeal && (
          <View style={styles.bestDealBanner}>
            <View style={styles.bestDealTop}>
              <View style={styles.bestDealBadge}>
                <Sparkles size={12} color="#15803D" style={{ marginRight: 4 }} />
                <Text style={styles.bestDealBadgeText}>Lowest Landed Delivered Cost</Text>
              </View>
              <Text style={styles.bestDealRate}>
                ₹{bestLandedDeal.deliveredCost.deliveredCostPerUnit}/{unit}
              </Text>
            </View>

            <Text style={styles.bestDealSupplierName}>
              {bestLandedDeal.supplier.name}
            </Text>

            <Text style={styles.bestDealReasonText}>
              Delivers total savings with lowest landed rate of ₹
              {bestLandedDeal.deliveredCost.deliveredCostPerUnit}/{unit} (Total: ₹
              {bestLandedDeal.deliveredCost.totalLandedCost.toLocaleString('en-IN')}) inclusive of transit freight
              and APMC statutory cess.
            </Text>
          </View>
        )}

        {/* Side-by-Side Detailed Cost Line Items */}
        <Text style={styles.sectionHeaderTitle}>Line-Item Cost Breakdown</Text>

        <View style={styles.cardsContainer}>
          {comparedItems.map((item) => {
            const cost = item.deliveredCost;
            const sup = item.supplier;
            const isBest = bestLandedDeal?.supplier.id === sup.id;

            return (
              <View
                key={sup.id}
                style={[styles.costCard, isBest && styles.costCardHighlighted]}
              >
                {/* Supplier Head in Card */}
                <View style={styles.cardSupHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.supBadgeRow}>
                      <Text style={styles.supTypeTag}>{sup.type.replace('_', ' ')}</Text>
                      {sup.isVerified && (
                        <View style={styles.supVerifiedTag}>
                          <ShieldCheck size={10} color="#15803D" style={{ marginRight: 2 }} />
                          <Text style={styles.supVerifiedText}>Verified</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardSupName}>{sup.name}</Text>
                    <Text style={styles.cardSupLocation}>
                      <MapPin size={11} color="#64748B" /> {sup.location} ({sup.distanceKm} km away)
                    </Text>
                  </View>

                  <View style={styles.landedBigPill}>
                    <Text style={styles.landedBigPrice}>₹{cost.deliveredCostPerUnit}</Text>
                    <Text style={styles.landedBigUnit}>per {cost.unit}</Text>
                  </View>
                </View>

                {/* Line Item Table */}
                <View style={styles.lineItemsList}>
                  {/* Line 1: Produce */}
                  <View style={styles.lineItem}>
                    <View>
                      <Text style={styles.lineItemTitle}>1. Base Produce Cost</Text>
                      <Text style={styles.lineItemDesc}>
                        {targetQuantity} {unit} × ₹{item.askingPricePerUnit}
                      </Text>
                    </View>
                    <Text style={styles.lineItemAmount}>
                      ₹{cost.productBaseCost.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {/* Line 2: Freight */}
                  <View style={styles.lineItem}>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.lineItemTitle}>2. Transport Freight</Text>
                        {cost.isTransportQuoteConfirmed ? (
                          <View style={styles.confirmedBadge}>
                            <Text style={styles.confirmedBadgeText}>Confirmed Quote</Text>
                          </View>
                        ) : (
                          <View style={styles.estimateBadge}>
                            <Text style={styles.estimateBadgeText}>3PL Estimate</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.lineItemDesc}>
                        {sup.distanceKm} km distance @ dedicated truck rate
                      </Text>
                    </View>
                    <Text style={styles.lineItemAmount}>
                      ₹{cost.transportFreightCost.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {/* Line 3: Mandi Cess */}
                  <View style={styles.lineItem}>
                    <View>
                      <Text style={styles.lineItemTitle}>3. APMC Statutory Market Cess</Text>
                      <Text style={styles.lineItemDesc}>1.0% statutory market charge on produce</Text>
                    </View>
                    <Text style={styles.lineItemAmount}>
                      ₹{cost.mandiCessCost.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {/* Line 4: Handling */}
                  <View style={styles.lineItem}>
                    <View>
                      <Text style={styles.lineItemTitle}>4. Handling & Weighment</Text>
                      <Text style={styles.lineItemDesc}>Loading, unloading and weighbridge fees</Text>
                    </View>
                    <Text style={styles.lineItemAmount}>
                      ₹{cost.handlingLoadingCost.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {/* Line 5: Volume Discount (if applicable) */}
                  {cost.volumeDiscountAmount > 0 && (
                    <View style={styles.lineItem}>
                      <View>
                        <Text style={[styles.lineItemTitle, { color: '#15803D' }]}>
                          5. Volume Bulk Rebate
                        </Text>
                        <Text style={styles.lineItemDesc}>Order volume discount applied</Text>
                      </View>
                      <Text style={[styles.lineItemAmount, { color: '#15803D' }]}>
                        -₹{cost.volumeDiscountAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}

                  {/* Total Bar */}
                  <View style={styles.cardTotalBar}>
                    <View>
                      <Text style={styles.totalBarLabel}>Total Landed Investment</Text>
                      <Text style={styles.totalBarSub}>Inclusive of taxes & delivery</Text>
                    </View>
                    <Text style={styles.totalBarAmount}>
                      ₹{cost.totalLandedCost.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Estimate Warning if unconfirmed */}
                {cost.missingChargesNote && (
                  <View style={styles.noteBox}>
                    <AlertTriangle size={13} color="#B45309" style={{ marginRight: 6, marginTop: 2 }} />
                    <Text style={styles.noteText}>{cost.missingChargesNote}</Text>
                  </View>
                )}

                {/* Card Bottom CTA */}
                <View style={styles.cardActionsRow}>
                  <Pressable
                    style={styles.cardActionBtnSecondary}
                    onPress={() =>
                      router.push(`/matching/details?id=${id}&supplierId=${sup.id}` as any)
                    }
                  >
                    <Text style={styles.cardActionBtnSecondaryText}>View Full Terms</Text>
                  </Pressable>

                  <Pressable
                    style={styles.cardActionBtnPrimary}
                    onPress={() =>
                      router.push(`/matching/details?id=${id}&supplierId=${sup.id}` as any)
                    }
                  >
                    <Text style={styles.cardActionBtnPrimaryText}>Select Supplier</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        {/* Cost Optimization & Statutory Guidance Note */}
        <View style={styles.guidanceCard}>
          <Info size={16} color="#0284C7" style={{ marginRight: 8, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.guidanceTitle}>Landed Cost Transparency Protocol</Text>
            <Text style={styles.guidanceText}>
              1. <Text style={{ fontWeight: '700' }}>Freight Discrepancies:</Text> A lower farmgate crop price can
              be negated by higher freight if the source cluster is further than 40 km.
            </Text>
            <Text style={[styles.guidanceText, { marginTop: 4 }]}>
              2. <Text style={{ fontWeight: '700' }}>No Zero-Cost Assumptions:</Text> Missing delivery quotes are
              flagged as 3PL estimates rather than ₹0, avoiding hidden unexpected costs at delivery.
            </Text>
            <Text style={[styles.guidanceText, { marginTop: 4 }]}>
              3. <Text style={{ fontWeight: '700' }}>Mandi Cess:</Text> Statutory 1% market fee is collected under
              Maharashtra APMC regulations for legitimate market yard transactions.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={styles.btnSecondary}
          onPress={() => router.push(`/matching/compare?id=${id}` as any)}
        >
          <SlidersHorizontal size={18} color="#1E293B" />
          <Text style={styles.btnSecondaryText}>Specs Matrix</Text>
        </Pressable>

        {bestLandedDeal && (
          <Pressable
            style={styles.btnPrimary}
            onPress={() =>
              router.push(
                `/matching/details?id=${id}&supplierId=${bestLandedDeal.supplier.id}` as any
              )
            }
          >
            <Text style={styles.btnPrimaryText}>
              Select Lowest Cost ({bestLandedDeal.supplier.name.slice(0, 16)}…)
            </Text>
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
    backgroundColor: '#FAF8F5',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
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
  matrixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  matrixBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primary,
  },
  scrollContent: {
    padding: 16,
  },
  baselineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  baselineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  baselineLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  baselineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  baselineBudget: {
    fontSize: 16,
    fontWeight: '800',
    color: MKColors.primary,
    marginTop: 2,
  },
  baselineUnit: {
    fontSize: 11,
    color: '#64748B',
  },
  baselineDepotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 10,
  },
  baselineDepotText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F766E',
  },
  aggregationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  aggregationBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#581C87',
  },
  aggregationBannerSub: {
    fontSize: 11,
    color: '#7E22CE',
    marginTop: 2,
  },
  bestDealBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  bestDealTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bestDealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bestDealBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  bestDealRate: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
  },
  bestDealSupplierName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  bestDealReasonText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 17,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  cardsContainer: {
    gap: 14,
  },
  costCard: {
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
  costCardHighlighted: {
    borderColor: '#86EFAC',
    borderWidth: 2,
  },
  cardSupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  supBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  supTypeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  supVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  supVerifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  cardSupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSupLocation: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  landedBigPill: {
    alignItems: 'flex-end',
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  landedBigPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6B21A8',
  },
  landedBigUnit: {
    fontSize: 10,
    color: '#7E22CE',
  },
  lineItemsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  lineItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  lineItemDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  lineItemAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  confirmedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 6,
  },
  confirmedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  estimateBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 6,
  },
  estimateBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  cardTotalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalBarLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalBarSub: {
    fontSize: 10,
    color: '#64748B',
  },
  totalBarAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#6B21A8',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  noteText: {
    fontSize: 11,
    color: '#B45309',
    flex: 1,
    lineHeight: 15,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  cardActionBtnSecondary: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cardActionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  cardActionBtnPrimary: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: MKColors.primary,
    alignItems: 'center',
  },
  cardActionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  guidanceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  guidanceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 4,
  },
  guidanceText: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 17,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
