/**
 * MandiKart Farmer App — Supplier Comparison Screen (Screen 17)
 *
 * Route: /matching/compare?id=...
 *
 * Side-by-side comparative matrix of 2 to 3 suppliers with normalized
 * units, capacity coverage, commercial terms, verification status, and
 * clear indicators for unconfirmed/estimated metrics.
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
  SlidersHorizontal,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MapPin,
  Clock,
  Package,
  IndianRupee,
  Layers,
  ChevronRight,
  TrendingDown,
  Info,
  X,
  Plus,
  Scale,
  Sparkles,
  Calculator,
  ArrowUpDown,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useRequirementsStore } from '@/store/requirementsStore';
import {
  useSupplierMatchingStore,
  SupplierMatchItem,
} from '@/store/supplierMatchingStore';

export default function SupplierComparisonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getRequirementById } = useRequirementsStore();
  const {
    matchesByRequirementId,
    selectedSupplierIdsForComparison,
    toggleSupplierComparison,
    clearComparison,
    fetchMatchesForRequirement,
    isLoading,
  } = useSupplierMatchingStore();

  const requirement = useMemo(() => {
    if (!id) return undefined;
    return getRequirementById(id);
  }, [id, getRequirementById]);

  // Load matches if not populated
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

  // If fewer than 2 are selected, auto-select top 2 for immediate side-by-side utility
  useEffect(() => {
    if (allMatches.length >= 2 && selectedSupplierIdsForComparison.length < 2) {
      const firstTwo = allMatches.slice(0, 2).map((m) => m.supplier.id);
      firstTwo.forEach((supId) => {
        if (!selectedSupplierIdsForComparison.includes(supId)) {
          toggleSupplierComparison(supId);
        }
      });
    }
  }, [allMatches, selectedSupplierIdsForComparison, toggleSupplierComparison]);

  const comparedSuppliers = useMemo(() => {
    return allMatches.filter((m) =>
      selectedSupplierIdsForComparison.includes(m.supplier.id)
    );
  }, [allMatches, selectedSupplierIdsForComparison]);

  const primaryProduct = requirement?.products[0];
  const targetPrice = primaryProduct?.targetPricePerUnit || 2400;
  const targetQuantity = primaryProduct?.quantity || requirement?.totalQuantity || 100;
  const unit = primaryProduct?.unit || requirement?.primaryUnit || 'quintal';

  if (isLoading && allMatches.length === 0) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={MKColors.primary} />
        <Text style={styles.loadingText}>Loading supplier comparison matrix...</Text>
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>Supplier Comparison</Text>
            <Text style={styles.headerSubtitle}>
              Requirement #{id?.slice(0, 10)} • {comparedSuppliers.length} Suppliers Active
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.switchCostBtn}
          onPress={() => router.push(`/matching/delivered-cost?id=${id}` as any)}
        >
          <Calculator size={15} color={MKColors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.switchCostText}>Delivered Cost</Text>
        </Pressable>
      </View>

      {/* Target Baseline Banner */}
      <View style={styles.baselineBanner}>
        <View style={styles.baselineCol}>
          <Text style={styles.baselineLabel}>CROP & GRADE</Text>
          <Text style={styles.baselineVal}>
            {primaryProduct?.productName || 'Red Onion'} ({primaryProduct?.grade || 'Grade A'})
          </Text>
        </View>
        <View style={styles.baselineCol}>
          <Text style={styles.baselineLabel}>VOLUME REQ.</Text>
          <Text style={styles.baselineVal}>
            {targetQuantity} {unit}
          </Text>
        </View>
        <View style={styles.baselineCol}>
          <Text style={styles.baselineLabel}>TARGET BUDGET</Text>
          <Text style={styles.baselineVal}>
            ₹{targetPrice}/{unit}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {comparedSuppliers.length === 0 ? (
          <View style={styles.emptyCard}>
            <SlidersHorizontal size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Suppliers Selected for Comparison</Text>
            <Text style={styles.emptySubtitle}>
              Select 2 to 3 suppliers from the matches catalog to view their side-by-side evaluation.
            </Text>
            <Pressable
              style={styles.browseMatchesBtn}
              onPress={() => router.push(`/matching/matches?id=${id}` as any)}
            >
              <Text style={styles.browseMatchesBtnText}>Browse Available Matches</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Horizontal Scroll Table for Side-by-Side Comparison */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.matrixContainer}>
                {/* Fixed Label Column */}
                <View style={styles.labelColumn}>
                  <View style={[styles.cell, styles.headerCell, { height: 130 }]}>
                    <Text style={styles.labelCategory}>SUPPLIER OVERVIEW</Text>
                  </View>
                  <View style={[styles.cell, { height: 50 }]}>
                    <Text style={styles.rowLabel}>Match Fit Score</Text>
                  </View>
                  <View style={[styles.cell, { height: 54 }]}>
                    <Text style={styles.rowLabel}>Base Asking Price</Text>
                  </View>
                  <View style={[styles.cell, { height: 50 }]}>
                    <Text style={styles.rowLabel}>Budget Variance</Text>
                  </View>
                  <View style={[styles.cell, { height: 50 }]}>
                    <Text style={styles.rowLabel}>Available Capacity</Text>
                  </View>
                  <View style={[styles.cell, { height: 46 }]}>
                    <Text style={styles.rowLabel}>Volume Coverage</Text>
                  </View>
                  <View style={[styles.cell, { height: 50 }]}>
                    <Text style={styles.rowLabel}>Turnaround / Dispatch</Text>
                  </View>
                  <View style={[styles.cell, { height: 50 }]}>
                    <Text style={styles.rowLabel}>Depot Proximity</Text>
                  </View>
                  <View style={[styles.cell, { height: 50 }]}>
                    <Text style={styles.rowLabel}>Fulfillment Reliability</Text>
                  </View>
                  <View style={[styles.cell, { height: 50 }]}>
                    <Text style={styles.rowLabel}>Institutional Audit</Text>
                  </View>
                  <View style={[styles.cell, { height: 60 }]}>
                    <Text style={styles.rowLabel}>Storage & Infrastructure</Text>
                  </View>
                  <View style={[styles.cell, { height: 54 }]}>
                    <Text style={styles.rowLabel}>Inspection Terms</Text>
                  </View>
                  <View style={[styles.cell, { height: 54 }]}>
                    <Text style={styles.rowLabel}>Payment Mechanism</Text>
                  </View>
                  <View style={[styles.cell, { height: 50 }]}>
                    <Text style={styles.rowLabel}>Advance Required</Text>
                  </View>
                  <View style={[styles.cell, { height: 66, backgroundColor: '#FAF5FF' }]}>
                    <Text style={[styles.rowLabel, { color: '#6B21A8', fontWeight: '700' }]}>
                      Delivered Landed Cost
                    </Text>
                  </View>
                  <View style={[styles.cell, { height: 54 }]}>
                    <Text style={styles.rowLabel}>Actions</Text>
                  </View>
                </View>

                {/* Dynamic Supplier Columns */}
                {comparedSuppliers.map((item) => {
                  const sup = item.supplier;
                  const priceDiff = item.priceDiffPerUnit;
                  const isBelow = priceDiff < 0;
                  const isMatch = priceDiff === 0;

                  return (
                    <View key={sup.id} style={styles.supplierColumn}>
                      {/* Supplier Header Box */}
                      <View style={[styles.cell, styles.headerCell, { height: 130 }]}>
                        <View style={styles.supHeaderTop}>
                          {item.isRecommended ? (
                            <View style={styles.recBadge}>
                              <Sparkles size={11} color="#15803D" style={{ marginRight: 3 }} />
                              <Text style={styles.recBadgeText}>Top Pick</Text>
                            </View>
                          ) : (
                            <View style={styles.neutralBadge}>
                              <Text style={styles.neutralBadgeText}>Candidate</Text>
                            </View>
                          )}
                          <Pressable
                            onPress={() => toggleSupplierComparison(sup.id)}
                            style={styles.removeBtn}
                            accessibilityLabel="Remove supplier"
                          >
                            <X size={14} color="#64748B" />
                          </Pressable>
                        </View>

                        <Text style={styles.supColName} numberOfLines={2}>
                          {sup.name}
                        </Text>
                        <Text style={styles.supColLocation} numberOfLines={1}>
                          <MapPin size={11} color="#64748B" /> {sup.district}, {sup.state}
                        </Text>
                        <View style={styles.supBadgeWrap}>
                          {sup.isVerified ? (
                            <View style={styles.verifiedSmallBadge}>
                              <ShieldCheck size={11} color="#15803D" style={{ marginRight: 2 }} />
                              <Text style={styles.verifiedSmallText}>Verified FPO</Text>
                            </View>
                          ) : (
                            <View style={styles.unverifiedSmallBadge}>
                              <Text style={styles.unverifiedSmallText}>Unverified</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Match Fit Score */}
                      <View style={[styles.cell, { height: 50 }]}>
                        <View style={styles.scorePill}>
                          <Text style={styles.scorePillText}>{item.matchScore}% Match</Text>
                        </View>
                      </View>

                      {/* Base Asking Price */}
                      <View style={[styles.cell, { height: 54 }]}>
                        <Text style={styles.priceVal}>
                          ₹{item.askingPricePerUnit}
                          <Text style={styles.unitVal}>/{item.capacityUnit}</Text>
                        </Text>
                      </View>

                      {/* Budget Variance */}
                      <View style={[styles.cell, { height: 50 }]}>
                        <Text
                          style={[
                            styles.diffVal,
                            isBelow && { color: '#15803D' },
                            isMatch && { color: '#475569' },
                            !isBelow && !isMatch && { color: '#DC2626' },
                          ]}
                        >
                          {isBelow
                            ? `- ₹${Math.abs(priceDiff)} (Saved)`
                            : isMatch
                            ? 'Exact Budget'
                            : `+ ₹${priceDiff} above`}
                        </Text>
                      </View>

                      {/* Available Capacity */}
                      <View style={[styles.cell, { height: 50 }]}>
                        <Text style={styles.cellBoldText}>
                          {item.availableCapacity} {item.capacityUnit}
                        </Text>
                      </View>

                      {/* Volume Coverage */}
                      <View style={[styles.cell, { height: 46 }]}>
                        <View
                          style={[
                            styles.coverageBadge,
                            item.coveragePct >= 100 ? styles.coverageFull : styles.coveragePartial,
                          ]}
                        >
                          <Text
                            style={[
                              styles.coverageText,
                              item.coveragePct >= 100 && { color: '#15803D' },
                            ]}
                          >
                            {item.coveragePct}% Coverage
                          </Text>
                        </View>
                      </View>

                      {/* Turnaround / Dispatch */}
                      <View style={[styles.cell, { height: 50 }]}>
                        <Text style={styles.cellText}>
                          {item.estimatedDispatchDays} business day(s)
                        </Text>
                      </View>

                      {/* Proximity */}
                      <View style={[styles.cell, { height: 50 }]}>
                        <Text style={styles.cellText}>{sup.distanceKm} km transit</Text>
                      </View>

                      {/* Fulfillment Reliability */}
                      <View style={[styles.cell, { height: 50 }]}>
                        <Text style={styles.cellBoldText}>
                          {sup.reliabilityScorePct}% ({sup.totalCompletedOrders} tenders)
                        </Text>
                      </View>

                      {/* Institutional Audit */}
                      <View style={[styles.cell, { height: 50 }]}>
                        <Text style={styles.cellSubText} numberOfLines={2}>
                          {sup.registrationNumber || 'Not provided'}
                        </Text>
                      </View>

                      {/* Storage & Infrastructure */}
                      <View style={[styles.cell, { height: 60 }]}>
                        <Text style={styles.cellSubText} numberOfLines={2}>
                          {sup.storageFacility || 'Standard open shed'}
                        </Text>
                      </View>

                      {/* Inspection Terms */}
                      <View style={[styles.cell, { height: 54 }]}>
                        <Text style={styles.cellText}>
                          {item.commercialTerms.inspectionAt === 'DESTINATION_DEPOT'
                            ? 'At Depot on Arrival'
                            : 'At Weighbridge'}
                        </Text>
                      </View>

                      {/* Payment Mechanism */}
                      <View style={[styles.cell, { height: 54 }]}>
                        <Text style={styles.cellSubText} numberOfLines={2}>
                          {item.commercialTerms.paymentTerms}
                        </Text>
                      </View>

                      {/* Advance Required */}
                      <View style={[styles.cell, { height: 50 }]}>
                        <Text style={styles.cellText}>
                          {item.commercialTerms.advanceRequiredPct === 0
                            ? '0% (Escrow direct)'
                            : `${item.commercialTerms.advanceRequiredPct}% advance`}
                        </Text>
                      </View>

                      {/* Delivered Landed Cost Preview */}
                      <View style={[styles.cell, { height: 66, backgroundColor: '#FAF5FF' }]}>
                        <Text style={styles.landedPreviewPrice}>
                          ₹{item.deliveredCost.deliveredCostPerUnit}/{item.deliveredCost.unit}
                        </Text>
                        <Text style={styles.landedPreviewTotal}>
                          Total: ₹{item.deliveredCost.totalLandedCost.toLocaleString('en-IN')}
                        </Text>
                        {!item.deliveredCost.isTransportQuoteConfirmed && (
                          <Text style={styles.unconfirmedTag}>* 3PL estimate</Text>
                        )}
                      </View>

                      {/* Action Cell */}
                      <View style={[styles.cell, { height: 54 }]}>
                        <Pressable
                          style={styles.colActionBtn}
                          onPress={() =>
                            router.push(`/matching/details?id=${id}&supplierId=${sup.id}` as any)
                          }
                        >
                          <Text style={styles.colActionBtnText}>View Details</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}

                {/* Add Supplier Placeholder Column if < 3 */}
                {comparedSuppliers.length < 3 && (
                  <View style={[styles.supplierColumn, styles.addSupplierCol]}>
                    <Pressable
                      style={styles.addSupplierTouch}
                      onPress={() => router.push(`/matching/matches?id=${id}` as any)}
                    >
                      <View style={styles.addIconCircle}>
                        <Plus size={20} color={MKColors.primary} />
                      </View>
                      <Text style={styles.addSupplierTitle}>Add Supplier</Text>
                      <Text style={styles.addSupplierSub}>
                        Compare up to 3 suppliers side-by-side
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Explanatory Data Integrity Note */}
            <View style={styles.integrityCard}>
              <Info size={16} color="#0D9488" style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.integrityTitle}>Standardized Evaluation Protocol</Text>
                <Text style={styles.integrityText}>
                  All prices, capacities, and transit charges are normalized against your tender baseline of{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {targetQuantity} {unit}
                  </Text>{' '}
                  delivered to your registered depot. Metrics marked with asterisk (*) reflect certified 3PL estimates
                  rather than final confirmed seller bills.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable style={styles.btnSecondary} onPress={clearComparison}>
          <Text style={styles.btnSecondaryText}>Clear Comparison</Text>
        </Pressable>

        <Pressable
          style={styles.btnPrimary}
          onPress={() => router.push(`/matching/delivered-cost?id=${id}` as any)}
        >
          <Calculator size={18} color="#FFFFFF" />
          <Text style={styles.btnPrimaryText}>Compare Delivered Landed Costs</Text>
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
  switchCostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  switchCostText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primary,
  },
  baselineBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  baselineCol: {
    flex: 1,
  },
  baselineLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  baselineVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
  },
  matrixContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  labelColumn: {
    width: 150,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  supplierColumn: {
    width: 190,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  addSupplierCol: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRightWidth: 0,
  },
  addSupplierTouch: {
    padding: 24,
    alignItems: 'center',
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addSupplierTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: MKColors.primary,
  },
  addSupplierSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerCell: {
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  labelCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  supHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  neutralBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  neutralBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  removeBtn: {
    padding: 4,
  },
  supColName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  supColLocation: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  supBadgeWrap: {
    flexDirection: 'row',
    marginTop: 4,
  },
  verifiedSmallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  verifiedSmallText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  unverifiedSmallBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  unverifiedSmallText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626',
  },
  scorePill: {
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scorePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  priceVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  unitVal: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },
  diffVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  cellBoldText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  cellText: {
    fontSize: 12,
    color: '#334155',
  },
  cellSubText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  coverageBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverageFull: {
    backgroundColor: '#DCFCE7',
  },
  coveragePartial: {
    backgroundColor: '#FEF3C7',
  },
  coverageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  landedPreviewPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B21A8',
  },
  landedPreviewTotal: {
    fontSize: 10,
    color: '#7E22CE',
  },
  unconfirmedTag: {
    fontSize: 9,
    color: '#B45309',
    fontStyle: 'italic',
  },
  colActionBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  colActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primary,
  },
  integrityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDFA',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  integrityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
    marginBottom: 4,
  },
  integrityText: {
    fontSize: 12,
    color: '#115E59',
    lineHeight: 17,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  browseMatchesBtn: {
    backgroundColor: MKColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  browseMatchesBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
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
    gap: 8,
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
