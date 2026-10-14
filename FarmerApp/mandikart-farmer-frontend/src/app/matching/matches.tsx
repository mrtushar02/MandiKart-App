/**
 * MandiKart Farmer App — Supplier Matches Screen (Screen 14)
 *
 * Route: /matching/matches?id=...
 *
 * Displays verified suppliers matching a published procurement requirement with
 * transparent score breakdowns, capacity coverage, asking prices, and multi-supplier
 * comparison selection.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  MapPin,
  Clock,
  Package,
  IndianRupee,
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
  Check,
  Star,
  ExternalLink,
  Layers,
  ArrowUpDown,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useRequirementsStore } from '@/store/requirementsStore';
import {
  useSupplierMatchingStore,
  SupplierMatchItem,
} from '@/store/supplierMatchingStore';

type FilterType = 'ALL' | 'VERIFIED_FPO' | 'BELOW_BUDGET' | 'NEAREST' | 'HIGH_CAPACITY';
type SortType = 'MATCH' | 'PRICE_LOW' | 'DISTANCE_NEAR' | 'CAPACITY_HIGH';

export default function SupplierMatchesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getRequirementById } = useRequirementsStore();
  const {
    matchesByRequirementId,
    selectedSupplierIdsForComparison,
    isLoading,
    error,
    fetchMatchesForRequirement,
    toggleSupplierComparison,
    clearComparison,
  } = useSupplierMatchingStore();

  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [activeSort, setActiveSort] = useState<SortType>('MATCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const requirement = useMemo(() => {
    if (!id) return undefined;
    return getRequirementById(id);
  }, [id, getRequirementById]);

  // Load matches
  useEffect(() => {
    if (id) {
      const primaryProduct = requirement?.products[0];
      fetchMatchesForRequirement(id, {
        cropName: primaryProduct?.productName || 'Red Onion',
        totalQuantity: primaryProduct?.quantity || requirement?.totalQuantity || 100,
        targetPricePerUnit: primaryProduct?.targetPricePerUnit || 2400,
        unit: primaryProduct?.unit || requirement?.primaryUnit || 'quintal',
        grade: primaryProduct?.grade || 'Grade A',
      });
    }
  }, [id, requirement, fetchMatchesForRequirement]);

  const onRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    await fetchMatchesForRequirement(id);
    setRefreshing(false);
  };

  const allMatches: SupplierMatchItem[] = useMemo(() => {
    if (!id) return [];
    return matchesByRequirementId[id] || [];
  }, [id, matchesByRequirementId]);

  // Filter & Sort
  const displayedMatches = useMemo(() => {
    let list = [...allMatches];

    // Search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.supplier.name.toLowerCase().includes(q) ||
          m.supplier.location.toLowerCase().includes(q) ||
          m.cropName.toLowerCase().includes(q)
      );
    }

    // Filter type
    if (activeFilter === 'VERIFIED_FPO') {
      list = list.filter((m) => m.supplier.isVerified && m.supplier.type === 'FPO_CLUSTER');
    } else if (activeFilter === 'BELOW_BUDGET') {
      list = list.filter((m) => m.priceDiffPerUnit <= 0);
    } else if (activeFilter === 'NEAREST') {
      list = list.filter((m) => m.supplier.distanceKm <= 30);
    } else if (activeFilter === 'HIGH_CAPACITY') {
      list = list.filter((m) => m.coveragePct >= 100);
    }

    // Sort
    if (activeSort === 'PRICE_LOW') {
      list.sort((a, b) => a.askingPricePerUnit - b.askingPricePerUnit);
    } else if (activeSort === 'DISTANCE_NEAR') {
      list.sort((a, b) => a.supplier.distanceKm - b.supplier.distanceKm);
    } else if (activeSort === 'CAPACITY_HIGH') {
      list.sort((a, b) => b.availableCapacity - a.availableCapacity);
    } else {
      list.sort((a, b) => b.matchScore - a.matchScore);
    }

    return list;
  }, [allMatches, searchQuery, activeFilter, activeSort]);

  const topInset = Math.max(insets.top, 16);

  const handleToggleCompare = (supplierId: string) => {
    const isSelected = selectedSupplierIdsForComparison.includes(supplierId);
    if (!isSelected && selectedSupplierIdsForComparison.length >= 3) {
      Alert.alert(
        'Comparison Limit Reached',
        'You can select up to 3 suppliers to compare side-by-side. Unselect one to choose another.'
      );
      return;
    }
    toggleSupplierComparison(supplierId);
  };

  const handleOpenDetails = (supplierId: string) => {
    router.push(`/matching/details?id=${id}&supplierId=${supplierId}` as any);
  };

  const handleOpenCompare = () => {
    if (selectedSupplierIdsForComparison.length < 2) {
      Alert.alert('Select at least 2', 'Please select at least 2 suppliers to compare.');
      return;
    }
    router.push(`/matching/compare?id=${id}` as any);
  };

  const handleOpenDeliveredCost = () => {
    if (selectedSupplierIdsForComparison.length < 2) {
      Alert.alert('Select at least 2', 'Please select at least 2 suppliers to compare delivered costs.');
      return;
    }
    router.push(`/matching/delivered-cost?id=${id}` as any);
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={MKColors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Supplier Matches</Text>
          <Text style={styles.headerSubtitle}>
            Tender: {requirement?.title || id || 'Procurement Tender'}
          </Text>
        </View>
        <Pressable
          style={styles.recommendedLinkBtn}
          onPress={() => router.push(`/matching/recommended?id=${id}` as any)}
        >
          <Sparkles size={14} color="#15803D" />
          <Text style={styles.recommendedLinkText}>Recommendations</Text>
        </Pressable>
      </View>

      {/* ── Requirement Context Strip ───────────────────────────── */}
      {requirement && (
        <View style={styles.requirementStrip}>
          <View style={styles.reqCol}>
            <Text style={styles.reqLabel}>Crop & Grade</Text>
            <Text style={styles.reqValue} numberOfLines={1}>
              {requirement.products[0]?.productName} ({requirement.products[0]?.grade || 'A'})
            </Text>
          </View>
          <View style={styles.reqDivider} />
          <View style={styles.reqCol}>
            <Text style={styles.reqLabel}>Target Vol.</Text>
            <Text style={styles.reqValue}>
              {requirement.totalQuantity} {requirement.primaryUnit}
            </Text>
          </View>
          <View style={styles.reqDivider} />
          <View style={styles.reqCol}>
            <Text style={styles.reqLabel}>Target Price</Text>
            <Text style={[styles.reqValue, { color: '#15803D' }]}>
              ₹{requirement.products[0]?.targetPricePerUnit || 2400}/{requirement.primaryUnit}
            </Text>
          </View>
        </View>
      )}

      {/* ── Multi-Supplier Aggregation Banner ───────────────────── */}
      <Pressable
        style={styles.aggregationBanner}
        onPress={() => router.push(`/matching/aggregation?id=${id}` as any)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Layers size={18} color="#6B21A8" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.aggregationBannerTitle}>Multi-Supplier Supply Aggregation</Text>
            <Text style={styles.aggregationBannerSub}>
              Pool volume across suppliers to fulfill large requirement quotas.
            </Text>
          </View>
        </View>
        <ChevronRight size={16} color="#6B21A8" />
      </Pressable>

      {/* ── Search Bar ─────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search verified suppliers, FPOs, locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* ── Filter Chips Row ────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterStrip}
      >
        <Pressable
          style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
          onPress={() => setActiveFilter('ALL')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'ALL' && styles.filterChipTextActive]}>
            All ({allMatches.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, activeFilter === 'VERIFIED_FPO' && styles.filterChipActive]}
          onPress={() => setActiveFilter('VERIFIED_FPO')}
        >
          <ShieldCheck size={13} color={activeFilter === 'VERIFIED_FPO' ? '#FFFFFF' : '#15803D'} />
          <Text style={[styles.filterChipText, activeFilter === 'VERIFIED_FPO' && styles.filterChipTextActive]}>
            Verified FPOs
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, activeFilter === 'BELOW_BUDGET' && styles.filterChipActive]}
          onPress={() => setActiveFilter('BELOW_BUDGET')}
        >
          <IndianRupee size={13} color={activeFilter === 'BELOW_BUDGET' ? '#FFFFFF' : '#0369A1'} />
          <Text style={[styles.filterChipText, activeFilter === 'BELOW_BUDGET' && styles.filterChipTextActive]}>
            Below Budget
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, activeFilter === 'NEAREST' && styles.filterChipActive]}
          onPress={() => setActiveFilter('NEAREST')}
        >
          <MapPin size={13} color={activeFilter === 'NEAREST' ? '#FFFFFF' : '#D97706'} />
          <Text style={[styles.filterChipText, activeFilter === 'NEAREST' && styles.filterChipTextActive]}>
            Nearest (&lt;30 km)
          </Text>
        </Pressable>

        <Pressable
          style={[styles.filterChip, activeFilter === 'HIGH_CAPACITY' && styles.filterChipActive]}
          onPress={() => setActiveFilter('HIGH_CAPACITY')}
        >
          <Package size={13} color={activeFilter === 'HIGH_CAPACITY' ? '#FFFFFF' : '#7E22CE'} />
          <Text style={[styles.filterChipText, activeFilter === 'HIGH_CAPACITY' && styles.filterChipTextActive]}>
            Full Capacity (100%+)
          </Text>
        </Pressable>
      </ScrollView>

      {/* ── Sort Controls Strip ─────────────────────────────────── */}
      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>
          Showing {displayedMatches.length} supplier match{displayedMatches.length === 1 ? '' : 'es'}:
        </Text>
        <View style={styles.sortButtonsRow}>
          <Pressable
            style={[styles.sortBtn, activeSort === 'MATCH' && styles.sortBtnActive]}
            onPress={() => setActiveSort('MATCH')}
          >
            <Text style={[styles.sortBtnText, activeSort === 'MATCH' && styles.sortBtnTextActive]}>
              Best Fit
            </Text>
          </Pressable>

          <Pressable
            style={[styles.sortBtn, activeSort === 'PRICE_LOW' && styles.sortBtnActive]}
            onPress={() => setActiveSort('PRICE_LOW')}
          >
            <Text style={[styles.sortBtnText, activeSort === 'PRICE_LOW' && styles.sortBtnTextActive]}>
              Lowest Price
            </Text>
          </Pressable>

          <Pressable
            style={[styles.sortBtn, activeSort === 'DISTANCE_NEAR' && styles.sortBtnActive]}
            onPress={() => setActiveSort('DISTANCE_NEAR')}
          >
            <Text style={[styles.sortBtnText, activeSort === 'DISTANCE_NEAR' && styles.sortBtnTextActive]}>
              Nearest
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Main Matches List ───────────────────────────────────── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (selectedSupplierIdsForComparison.length > 0 ? 110 : 30) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MKColors.primaryGreen} />}
      >
        {isLoading && allMatches.length === 0 ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color={MKColors.primaryGreen} />
            <Text style={styles.loaderText}>Running matching engine across verified suppliers...</Text>
          </View>
        ) : displayedMatches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Layers size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Matching Suppliers Found</Text>
            <Text style={styles.emptySubtitle}>
              No suppliers in the network matched your current filter criteria. Try relaxing distance or price limits.
            </Text>
          </View>
        ) : (
          displayedMatches.map((match) => {
            const isSelectedForCompare = selectedSupplierIdsForComparison.includes(
              match.supplier.id
            );
            const isCheaper = match.priceDiffPerUnit < 0;

            return (
              <View key={match.supplier.id} style={styles.supplierCard}>
                {/* Top Row: Name, Type, Match Score */}
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.supplierName} numberOfLines={1}>
                        {match.supplier.name}
                      </Text>
                      {match.supplier.isVerified && (
                        <ShieldCheck size={16} color="#15803D" />
                      )}
                    </View>
                    <Text style={styles.supplierSub}>
                      {match.supplier.type.replace('_', ' ')} • {match.supplier.location}
                    </Text>
                  </View>

                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreBadgeText}>{match.matchScore}%</Text>
                    <Text style={styles.scoreBadgeSub}>Fit Score</Text>
                  </View>
                </View>

                {/* Metrics Box: Price vs Target, Capacity, Distance */}
                <View style={styles.cardMetricsGrid}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLbl}>Asking Quote</Text>
                    <Text style={styles.metricItemVal}>
                      ₹{match.askingPricePerUnit?.toLocaleString('en-IN')}/{match.capacityUnit}
                    </Text>
                    <Text
                      style={[
                        styles.metricItemSub,
                        isCheaper ? { color: '#15803D' } : { color: '#B45309' },
                      ]}
                    >
                      {isCheaper
                        ? `₹${Math.abs(match.priceDiffPerUnit)} below target`
                        : match.priceDiffPerUnit === 0
                        ? 'At parity with target'
                        : `₹${match.priceDiffPerUnit} above target`}
                    </Text>
                  </View>

                  <View style={styles.metricSep} />

                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLbl}>Available Vol.</Text>
                    <Text style={styles.metricItemVal}>
                      {match.availableCapacity} {match.capacityUnit}
                    </Text>
                    <Text style={[styles.metricItemSub, { color: '#0369A1' }]}>
                      {match.coveragePct}% coverage
                    </Text>
                  </View>

                  <View style={styles.metricSep} />

                  <View style={styles.metricItem}>
                    <Text style={styles.metricItemLbl}>Proximity</Text>
                    <Text style={styles.metricItemVal}>{match.supplier.distanceKm} km</Text>
                    <Text style={styles.metricItemSub}>
                      ~{match.estimatedDispatchDays} day dispatch
                    </Text>
                  </View>
                </View>

                {/* Primary Recommendation Reason callout */}
                {match.recommendationReasons.length > 0 && (
                  <View style={styles.reasonStrip}>
                    <Sparkles size={13} color="#15803D" style={{ marginTop: 2, marginRight: 4 }} />
                    <Text style={styles.reasonText} numberOfLines={2}>
                      {match.recommendationReasons[0]}
                    </Text>
                  </View>
                )}

                {/* Card Actions: Checkbox to Compare + View Details */}
                <View style={styles.cardActionsRow}>
                  <Pressable
                    style={[
                      styles.compareCheckboxBtn,
                      isSelectedForCompare && styles.compareCheckboxBtnSelected,
                    ]}
                    onPress={() => handleToggleCompare(match.supplier.id)}
                  >
                    <View
                      style={[
                        styles.miniCheckbox,
                        isSelectedForCompare && styles.miniCheckboxActive,
                      ]}
                    >
                      {isSelectedForCompare && <Check size={12} color="#FFFFFF" />}
                    </View>
                    <Text
                      style={[
                        styles.compareCheckboxText,
                        isSelectedForCompare && styles.compareCheckboxTextSelected,
                      ]}
                    >
                      {isSelectedForCompare ? 'Selected to Compare' : 'Add to Compare'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.detailsBtn}
                    onPress={() => handleOpenDetails(match.supplier.id)}
                  >
                    <Text style={styles.detailsBtnText}>Match Details</Text>
                    <ChevronRight size={15} color="#0284C7" />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Floating Comparison Drawer when items selected ───────── */}
      {selectedSupplierIdsForComparison.length > 0 && (
        <View style={[styles.floatingCompareBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.compareBarLeft}>
            <Text style={styles.compareCountText}>
              {selectedSupplierIdsForComparison.length} of 3 Selected
            </Text>
            <Pressable onPress={clearComparison}>
              <Text style={styles.clearCompareText}>Clear</Text>
            </Pressable>
          </View>

          <View style={styles.compareBtnGroup}>
            <Pressable
              style={[
                styles.floatingCompareBtn,
                selectedSupplierIdsForComparison.length < 2 && styles.disabledFloatingBtn,
              ]}
              onPress={handleOpenCompare}
            >
              <Text style={styles.floatingCompareBtnText}>Compare Specs</Text>
            </Pressable>

            <Pressable
              style={[
                styles.floatingLandedCostBtn,
                selectedSupplierIdsForComparison.length < 2 && styles.disabledFloatingBtn,
              ]}
              onPress={handleOpenDeliveredCost}
            >
              <IndianRupee size={15} color="#FFFFFF" />
              <Text style={styles.floatingLandedCostBtnText}>Delivered Cost</Text>
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
  recommendedLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recommendedLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  requirementStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  reqCol: {
    flex: 1,
  },
  reqLabel: {
    fontSize: 10,
    color: MKColors.textSecondary,
    fontWeight: '500',
  },
  reqValue: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textPrimary,
    marginTop: 1,
  },
  reqDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  aggregationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  aggregationBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#581C87',
  },
  aggregationBannerSub: {
    fontSize: 11,
    color: '#7E22CE',
    marginTop: 1,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: MKColors.textPrimary,
    paddingVertical: 0,
  },
  filterStrip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sortLabel: {
    fontSize: 11,
    color: MKColors.textSecondary,
    fontWeight: '600',
  },
  sortButtonsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  sortBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  sortBtnActive: {
    backgroundColor: '#E0F2FE',
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  sortBtnTextActive: {
    color: '#0369A1',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  loaderCenter: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    color: MKColors.textSecondary,
    textAlign: 'center',
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
  },
  supplierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  supplierName: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  supplierSub: {
    fontSize: 11,
    color: MKColors.textSecondary,
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#15803D',
  },
  scoreBadgeSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#166534',
  },
  cardMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricItem: {
    flex: 1,
  },
  metricItemLbl: {
    fontSize: 10,
    color: MKColors.textSecondary,
    fontWeight: '500',
  },
  metricItemVal: {
    fontSize: 13,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginTop: 2,
  },
  metricItemSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  metricSep: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 6,
  },
  reasonStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  reasonText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  compareCheckboxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  compareCheckboxBtnSelected: {
    backgroundColor: '#EFF6FF',
  },
  miniCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCheckboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  compareCheckboxText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  compareCheckboxTextSelected: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  floatingCompareBar: {
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
  compareBarLeft: {
    gap: 2,
  },
  compareCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clearCompareText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  compareBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  floatingCompareBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  floatingCompareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingLandedCostBtn: {
    backgroundColor: '#15803D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  floatingLandedCostBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledFloatingBtn: {
    opacity: 0.5,
  },
});
