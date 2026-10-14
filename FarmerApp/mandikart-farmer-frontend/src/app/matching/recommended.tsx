/**
 * MandiKart Farmer App — Recommended Suppliers Screen (Screen 15)
 *
 * Route: /matching/recommended?id=...
 *
 * Displays top-tier compatible suppliers with transparent recommendation
 * reasoning, full criteria checklists, and clear segregation of verified
 * facts vs unconfirmed 3PL estimates.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Sparkles,
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
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useRequirementsStore } from '@/store/requirementsStore';
import {
  useSupplierMatchingStore,
  SupplierMatchItem,
} from '@/store/supplierMatchingStore';

export default function RecommendedSuppliersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getRequirementById } = useRequirementsStore();
  const {
    matchesByRequirementId,
    fetchMatchesForRequirement,
    toggleSupplierComparison,
    selectedSupplierIdsForComparison,
    isLoading,
  } = useSupplierMatchingStore();

  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    await fetchMatchesForRequirement(id);
    setRefreshing(false);
  };

  const matches: SupplierMatchItem[] = useMemo(() => {
    if (!id) return [];
    return (matchesByRequirementId[id] || []).filter((m) => m.isRecommended);
  }, [id, matchesByRequirementId]);

  const topInset = Math.max(insets.top, 16);

  const handleToggleCompare = (supplierId: string) => {
    const isSelected = selectedSupplierIdsForComparison.includes(supplierId);
    if (!isSelected && selectedSupplierIdsForComparison.length >= 3) {
      Alert.alert('Limit Reached', 'You can compare up to 3 suppliers at once.');
      return;
    }
    toggleSupplierComparison(supplierId);
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={MKColors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Recommended Suppliers</Text>
          <Text style={styles.headerSubtitle}>
            Objective Scoring for Tender: {requirement?.id || id}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (selectedSupplierIdsForComparison.length > 0 ? 100 : 30) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MKColors.primaryGreen} />}
      >
        {/* ── Recommendation Methodology Explainer ───────────────── */}
        <View style={styles.methodologyCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={styles.sparkleWrap}>
              <Sparkles size={16} color="#15803D" />
            </View>
            <Text style={styles.methodologyTitle}>Transparent Recommendation Rationale</Text>
          </View>
          <Text style={styles.methodologySub}>
            Suppliers qualify for recommendation when they meet objective criteria: exact crop/grade match (35%), capacity to fulfill ≥90% of required volume (20%), asking quote within target budget (25%), and logistics feasibility (20%).
          </Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <ShieldCheck size={14} color="#15803D" />
              <Text style={styles.legendText}>Verified: KYC & Audited FPO</Text>
            </View>
            <View style={styles.legendItem}>
              <Info size={14} color="#0284C7" />
              <Text style={styles.legendText}>Estimated: Road Freight</Text>
            </View>
          </View>
        </View>

        {/* ── List of Recommended Suppliers ──────────────────────── */}
        {isLoading && matches.length === 0 ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color={MKColors.primaryGreen} />
            <Text style={styles.loaderText}>Evaluating compatibility benchmarks...</Text>
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Layers size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Top Recommendations Met All Criteria</Text>
            <Text style={styles.emptySubtitle}>
              To see all available suppliers with partial matches, view the full Supplier Matches directory.
            </Text>
            <Pressable
              style={styles.actionBtnPrimary}
              onPress={() => router.replace(`/matching/matches?id=${id}` as any)}
            >
              <Text style={styles.actionBtnText}>View All Matches</Text>
            </Pressable>
          </View>
        ) : (
          matches.map((match, idx) => {
            const isSelected = selectedSupplierIdsForComparison.includes(match.supplier.id);

            return (
              <View key={match.supplier.id} style={styles.recCard}>
                {/* Ranking Tag */}
                <View style={styles.recTagRow}>
                  <View style={styles.rankPill}>
                    <Text style={styles.rankPillText}>#{idx + 1} Best Fit</Text>
                  </View>
                  <View style={styles.scorePill}>
                    <Sparkles size={12} color="#15803D" />
                    <Text style={styles.scorePillText}>{match.matchScore}% Compatibility</Text>
                  </View>
                </View>

                {/* Supplier Profile Info */}
                <View style={styles.supplierHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.supplierTitle}>{match.supplier.name}</Text>
                      {match.supplier.isVerified && (
                        <ShieldCheck size={16} color="#15803D" />
                      )}
                    </View>
                    <Text style={styles.supplierSubtitle}>
                      {match.supplier.type.replace('_', ' ')} • {match.supplier.location}
                    </Text>
                    {match.supplier.registrationNumber && (
                      <Text style={styles.regNoText}>
                        Govt/NABARD Reg: {match.supplier.registrationNumber}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Recommendation Reasons Bulleted List */}
                <View style={styles.reasonsBox}>
                  <Text style={styles.reasonsHeading}>Why Recommended for This Requirement:</Text>
                  {match.recommendationReasons.map((reason, rIdx) => (
                    <View key={rIdx} style={styles.reasonBulletRow}>
                      <CheckCircle2 size={14} color="#15803D" style={{ marginTop: 2, marginRight: 6 }} />
                      <Text style={styles.reasonBulletText}>{reason}</Text>
                    </View>
                  ))}
                </View>

                {/* Compatibility Checklist Grid */}
                <View style={styles.checklistGrid}>
                  <View style={styles.checkItem}>
                    <CheckCircle2
                      size={14}
                      color={match.transparencyChecklist.cropGradeMatch ? '#15803D' : '#94A3B8'}
                    />
                    <Text style={styles.checkText}>Grade {match.grade} Match</Text>
                  </View>

                  <View style={styles.checkItem}>
                    <CheckCircle2
                      size={14}
                      color={match.transparencyChecklist.capacitySufficient ? '#15803D' : '#94A3B8'}
                    />
                    <Text style={styles.checkText}>Full Capacity ({match.coveragePct}%)</Text>
                  </View>

                  <View style={styles.checkItem}>
                    <CheckCircle2
                      size={14}
                      color={match.transparencyChecklist.priceWithinCeiling ? '#15803D' : '#94A3B8'}
                    />
                    <Text style={styles.checkText}>Within Target Price</Text>
                  </View>

                  <View style={styles.checkItem}>
                    <CheckCircle2
                      size={14}
                      color={match.transparencyChecklist.logisticsViable ? '#15803D' : '#94A3B8'}
                    />
                    <Text style={styles.checkText}>{match.supplier.distanceKm} km Transit</Text>
                  </View>
                </View>

                {/* Pricing & Delivered Cost Preview */}
                <View style={styles.pricingStrip}>
                  <View>
                    <Text style={styles.pricingStripLbl}>Asking Farmgate Quote</Text>
                    <Text style={styles.pricingStripVal}>
                      ₹{match.askingPricePerUnit?.toLocaleString()}/{match.capacityUnit}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.pricingStripLbl}>Est. Landed Delivered</Text>
                    <Text style={[styles.pricingStripVal, { color: '#15803D' }]}>
                      ₹{match.deliveredCost.deliveredCostPerUnit?.toLocaleString()}/{match.capacityUnit}
                    </Text>
                  </View>
                </View>

                {/* Actions: Compare + Details */}
                <View style={styles.cardActionsRow}>
                  <Pressable
                    style={[styles.compareBtn, isSelected && styles.compareBtnSelected]}
                    onPress={() => handleToggleCompare(match.supplier.id)}
                  >
                    <Text style={[styles.compareBtnText, isSelected && styles.compareBtnTextSelected]}>
                      {isSelected ? '✓ In Comparison' : '+ Compare'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.detailsBtn}
                    onPress={() =>
                      router.push(
                        `/matching/details?id=${id}&supplierId=${match.supplier.id}` as any
                      )
                    }
                  >
                    <Text style={styles.detailsBtnText}>View Full Dossier</Text>
                    <ChevronRight size={15} color="#0284C7" />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Floating Comparison Drawer ───────────────────────────── */}
      {selectedSupplierIdsForComparison.length > 0 && (
        <View style={[styles.floatingBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Text style={styles.floatingCountText}>
            {selectedSupplierIdsForComparison.length} Selected
          </Text>
          <View style={styles.floatingBtnsRow}>
            <Pressable
              style={[
                styles.floatingActionBtn,
                selectedSupplierIdsForComparison.length < 2 && styles.disabledBtn,
              ]}
              onPress={() => {
                if (selectedSupplierIdsForComparison.length < 2) {
                  Alert.alert('Select at least 2', 'Please select at least 2 suppliers to compare.');
                  return;
                }
                router.push(`/matching/compare?id=${id}` as any);
              }}
            >
              <Text style={styles.floatingActionBtnText}>Compare Specs</Text>
            </Pressable>
            <Pressable
              style={[
                styles.floatingPrimaryBtn,
                selectedSupplierIdsForComparison.length < 2 && styles.disabledBtn,
              ]}
              onPress={() => {
                if (selectedSupplierIdsForComparison.length < 2) {
                  Alert.alert('Select at least 2', 'Please select at least 2 suppliers to compare.');
                  return;
                }
                router.push(`/matching/delivered-cost?id=${id}` as any);
              }}
            >
              <IndianRupee size={15} color="#FFFFFF" />
              <Text style={styles.floatingPrimaryBtnText}>Compare Landed Cost</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: MKColors.textSecondary,
    fontWeight: '500',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  methodologyCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 14,
  },
  sparkleWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  methodologyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  methodologySub: {
    fontSize: 12,
    color: '#14532D',
    lineHeight: 17,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  recCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  recTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rankPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scorePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  supplierHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  supplierTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  supplierSubtitle: {
    fontSize: 12,
    color: MKColors.textSecondary,
    marginTop: 2,
  },
  regNoText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  reasonsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reasonsHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  reasonBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  reasonBulletText: {
    fontSize: 11,
    color: '#1E293B',
    lineHeight: 16,
    flex: 1,
  },
  checklistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  checkItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAFAF9',
    padding: 6,
    borderRadius: 6,
  },
  checkText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  pricingStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pricingStripLbl: {
    fontSize: 10,
    color: MKColors.textSecondary,
    fontWeight: '500',
  },
  pricingStripVal: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  compareBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  compareBtnSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  compareBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  compareBtnTextSelected: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  floatingCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  floatingActionBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  floatingActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingPrimaryBtn: {
    backgroundColor: '#15803D',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  floatingPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  loaderCenter: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    color: MKColors.textSecondary,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: MKColors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  actionBtnPrimary: {
    backgroundColor: MKColors.primaryGreen,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
