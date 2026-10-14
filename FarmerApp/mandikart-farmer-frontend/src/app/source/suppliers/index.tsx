/**
 * MandiKart Farmer App — Supplier List Screen (Screen 5)
 *
 * Route: /source/suppliers
 *
 * Domain Capabilities:
 * - Product & category context awareness (shows suppliers associated with selected crop or category)
 * - Real-time search by supplier name, location, contact, or crops
 * - Verified vs Pending/Unverified status distinction (no fake verification badges)
 * - Multi-criteria sorting: Recommended, Distance (Near to Far), Rating, Orders fulfilled
 * - Supplier type filtering: FPO Clusters, Cooperatives, Aggregators, Commercial Traders
 * - Transparent inventory and indicative price display from reliable catalog records
 * - Navigation to Supplier Details and Verification audit
 * - Clean empty and offline fallback states
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  X,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Star,
  Package,
  Truck,
  Building2,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Clock,
  ArrowRight,
  Users,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useSourceProduceStore,
  SourceSupplier,
  SupplierType,
} from '@/store/sourceProduceStore';

const SUPPLIER_TYPE_FILTERS: { label: string; value: string }[] = [
  { label: 'All Suppliers', value: 'ALL' },
  { label: 'Verified Only', value: 'VERIFIED_ONLY' },
  { label: 'FPO Clusters', value: 'FPO_CLUSTER' },
  { label: 'Cooperatives', value: 'COOPERATIVE' },
  { label: 'Mandi Aggregators', value: 'WHOLESALE_AGGREGATOR' },
  { label: 'Commercial Traders', value: 'COMMERCIAL_TRADER' },
];

const SORT_OPTIONS: { id: 'recommended' | 'distance' | 'rating' | 'orders'; label: string; desc: string }[] = [
  { id: 'recommended', label: 'Recommended', desc: 'Highest reliability, verified status & orders' },
  { id: 'distance', label: 'Nearest First', desc: 'Sort by shortest distance in km' },
  { id: 'rating', label: 'Highest Rated', desc: 'Suppliers with verified positive reviews' },
  { id: 'orders', label: 'Most Orders', desc: 'Highest fulfilled consignment volume' },
];

export default function SupplierListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    crop?: string;
    productId?: string;
    category?: string;
    categoryName?: string;
  }>();

  const {
    suppliers,
    supplierSearchQuery,
    supplierFilterVerifiedOnly,
    supplierFilterType,
    supplierSortBy,
    suppliersLoading,
    fetchSuppliers,
    setSupplierSearchQuery,
    setSupplierFilterVerifiedOnly,
    setSupplierFilterType,
    setSupplierSortBy,
    resetSupplierFilters,
  } = useSourceProduceStore();

  // Active crop filter with user override capability without cascading effect
  const [clearedCrop, setClearedCrop] = useState(false);
  const activeCropFilter = clearedCrop ? null : (params.crop || null);

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSuppliers();
    setRefreshing(false);
  };

  // Filter and sort suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter((sup) => {
        // 1. Crop filter from route
        if (activeCropFilter) {
          const cFilter = activeCropFilter.toLowerCase().trim();
          const matchesSupported = sup.supportedCrops.some((c) =>
            c.toLowerCase().includes(cFilter) || cFilter.includes(c.toLowerCase())
          );
          const matchesListing = sup.productListings.some(
            (l) =>
              l.cropName.toLowerCase().includes(cFilter) ||
              (params.productId && l.productId === params.productId)
          );
          if (!matchesSupported && !matchesListing) {
            return false;
          }
        }

        // 2. Category filter from route
        if (params.category && !activeCropFilter) {
          const catFilter = params.category.toLowerCase().trim();
          const matchesCategory = sup.productListings.some((l) =>
            l.category.toLowerCase().includes(catFilter)
          );
          if (!matchesCategory) {
            return false;
          }
        }

        // 3. Verified Only toggle
        if (supplierFilterVerifiedOnly && sup.verification.status !== 'VERIFIED') {
          return false;
        }

        // 4. Supplier Type filter
        if (supplierFilterType && supplierFilterType !== 'ALL' && supplierFilterType !== 'VERIFIED_ONLY') {
          if (sup.type !== (supplierFilterType as SupplierType)) {
            return false;
          }
        }

        // 5. Search query
        if (supplierSearchQuery && supplierSearchQuery.trim()) {
          const sq = supplierSearchQuery.toLowerCase().trim();
          const matchesName = sup.name.toLowerCase().includes(sq);
          const matchesLoc = sup.location.toLowerCase().includes(sq) || sup.district.toLowerCase().includes(sq);
          const matchesPerson = sup.contactPerson.toLowerCase().includes(sq);
          const matchesCrops = sup.supportedCrops.some((c) => c.toLowerCase().includes(sq));
          const matchesListings = sup.productListings.some((l) => l.cropName.toLowerCase().includes(sq));
          if (!matchesName && !matchesLoc && !matchesPerson && !matchesCrops && !matchesListings) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (supplierSortBy === 'distance') {
          return a.distanceKm - b.distanceKm;
        }
        if (supplierSortBy === 'rating') {
          return (b.ratingStars || 0) - (a.ratingStars || 0);
        }
        if (supplierSortBy === 'orders') {
          return b.totalCompletedOrders - a.totalCompletedOrders;
        }
        // 'recommended' default:
        const aScore =
          (a.verification.status === 'VERIFIED' ? 30 : 0) +
          a.reliabilityScorePct * 0.4 +
          Math.min(a.totalCompletedOrders, 100) * 0.3 -
          a.distanceKm * 0.05;
        const bScore =
          (b.verification.status === 'VERIFIED' ? 30 : 0) +
          b.reliabilityScorePct * 0.4 +
          Math.min(b.totalCompletedOrders, 100) * 0.3 -
          b.distanceKm * 0.05;
        return bScore - aScore;
      });
  }, [
    suppliers,
    activeCropFilter,
    params.category,
    params.productId,
    supplierFilterVerifiedOnly,
    supplierFilterType,
    supplierSearchQuery,
    supplierSortBy,
  ]);

  const handleFilterChipPress = (filterVal: string) => {
    if (filterVal === 'VERIFIED_ONLY') {
      setSupplierFilterVerifiedOnly(!supplierFilterVerifiedOnly);
    } else {
      setSupplierFilterType(filterVal);
    }
  };

  const currentSortLabel = SORT_OPTIONS.find((s) => s.id === supplierSortBy)?.label || 'Recommended';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeCropFilter ? `Suppliers for ${activeCropFilter}` : 'Agricultural Suppliers'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeCropFilter
              ? 'Verified FPOs & producers offering this produce'
              : 'Direct sourcing from FPOs, cooperatives & aggregators'}
          </Text>
        </View>

        <Pressable
          style={styles.resetBtn}
          onPress={() => {
            resetSupplierFilters();
            setClearedCrop(true);
          }}
          hitSlop={8}
        >
          <RotateCcw size={16} color="#64748B" />
        </Pressable>
      </View>

      {/* ── Search Input ───────────────────────────────────────── */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by supplier name, location, crop..."
            placeholderTextColor="#94A3B8"
            value={supplierSearchQuery}
            onChangeText={setSupplierSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {supplierSearchQuery.length > 0 && (
            <Pressable onPress={() => setSupplierSearchQuery('')} hitSlop={8}>
              <X size={16} color="#64748B" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Active Context Banner (Crop or Category) ───────────── */}
      {activeCropFilter && (
        <View style={styles.activeCropBanner}>
          <View style={styles.activeCropInfo}>
            <Text style={styles.activeCropLabel}>Selected Produce:</Text>
            <View style={styles.activeCropPill}>
              <Text style={styles.activeCropText}>{activeCropFilter}</Text>
            </View>
          </View>
          <Pressable
            style={styles.clearCropBtn}
            onPress={() => setClearedCrop(true)}
            hitSlop={8}
          >
            <Text style={styles.clearCropBtnText}>Show All Suppliers</Text>
            <X size={13} color={MKColors.primary} />
          </Pressable>
        </View>
      )}

      {/* ── Filter Chips ───────────────────────────────────────── */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {SUPPLIER_TYPE_FILTERS.map((f) => {
            const isSelected =
              f.value === 'VERIFIED_ONLY'
                ? supplierFilterVerifiedOnly
                : supplierFilterType === f.value;

            return (
              <Pressable
                key={f.value}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                  f.value === 'VERIFIED_ONLY' && supplierFilterVerifiedOnly && styles.filterChipVerifiedActive,
                ]}
                onPress={() => handleFilterChipPress(f.value)}
              >
                {f.value === 'VERIFIED_ONLY' && (
                  <ShieldCheck
                    size={13}
                    color={supplierFilterVerifiedOnly ? '#15803D' : '#64748B'}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                    f.value === 'VERIFIED_ONLY' && supplierFilterVerifiedOnly && styles.filterChipTextVerified,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Count & Sort Bar ───────────────────────────────────── */}
      <View style={styles.countSortBar}>
        <Text style={styles.resultCountText}>
          {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'Supplier' : 'Suppliers'} Found
        </Text>

        <Pressable
          style={styles.sortBtn}
          onPress={() => setSortModalVisible(true)}
          hitSlop={8}
        >
          <SlidersHorizontal size={14} color="#0F172A" />
          <Text style={styles.sortBtnText}>{currentSortLabel}</Text>
        </Pressable>
      </View>

      {/* ── Supplier Cards ScrollView ──────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || suppliersLoading}
            onRefresh={onRefresh}
            tintColor={MKColors.primary}
          />
        }
      >
        {filteredSuppliers.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Users size={32} color="#D97706" />
            </View>
            <Text style={styles.emptyTitle}>No Suppliers Found</Text>
            <Text style={styles.emptySub}>
              {activeCropFilter
                ? `No registered suppliers currently list "${activeCropFilter}" with your active filters.`
                : 'No agricultural suppliers match your search filters.'}
            </Text>
            <Pressable
              style={styles.emptyResetBtn}
              onPress={() => {
                resetSupplierFilters();
                setClearedCrop(true);
              }}
            >
              <RotateCcw size={15} color="#FFFFFF" />
              <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
            </Pressable>
          </View>
        ) : (
          filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              highlightedCrop={activeCropFilter}
              onPressDetails={() => router.push(`/source/suppliers/${supplier.id}` as any)}
              onPressVerification={() =>
                router.push({
                  pathname: '/source/suppliers/verification',
                  params: { id: supplier.id },
                } as any)
              }
              onRequestQuote={() =>
                router.push({
                  pathname: '/requirements/create',
                  params: {
                    supplierId: supplier.id,
                    crop: activeCropFilter || supplier.supportedCrops[0],
                  },
                } as any)
              }
            />
          ))
        )}
      </ScrollView>

      {/* ── Sort Selection Modal ───────────────────────────────── */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort Suppliers</Text>
              <Pressable onPress={() => setSortModalVisible(false)} hitSlop={8}>
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            <View style={styles.sortOptionList}>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = supplierSortBy === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    style={[styles.sortOptionRow, isSelected && styles.sortOptionRowSelected]}
                    onPress={() => {
                      setSupplierSortBy(opt.id);
                      setSortModalVisible(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sortOptionLabel, isSelected && styles.sortOptionLabelSelected]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.sortOptionDesc}>{opt.desc}</Text>
                    </View>
                    {isSelected && <Check size={18} color={MKColors.primary} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Supplier Card Component ─────────────────────────────────────────────────

interface SupplierCardProps {
  supplier: SourceSupplier;
  highlightedCrop?: string | null;
  onPressDetails: () => void;
  onPressVerification?: () => void;
  onRequestQuote: () => void;
}

function SupplierCard({
  supplier,
  highlightedCrop,
  onPressDetails,
  onPressVerification,
  onRequestQuote,
}: SupplierCardProps) {
  const status = supplier.verification.status;
  const isVerified = status === 'VERIFIED';
  const isPending = status === 'PENDING';
  const isExpired = status === 'EXPIRED';
  const isRejected = status === 'REJECTED';

  return (
    <View style={styles.card}>
      {/* Top Meta Bar: Type & Verification Badge */}
      <View style={styles.cardHeader}>
        <View style={styles.supplierTypePill}>
          <Building2 size={12} color="#475569" />
          <Text style={styles.supplierTypePillText}>{supplier.typeLabel}</Text>
        </View>

        <Pressable
          onPress={onPressVerification}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Supplier verification status: ${status}`}
        >
          {isVerified ? (
            <View style={styles.badgeVerified}>
              <ShieldCheck size={12} color="#15803D" />
              <Text style={styles.badgeVerifiedText}>{supplier.verification.badgeLabel || 'Verified'}</Text>
            </View>
          ) : isPending ? (
            <View style={styles.badgePending}>
              <Clock size={12} color="#B45309" />
              <Text style={styles.badgePendingText}>Verification Pending</Text>
            </View>
          ) : isExpired ? (
            <View style={styles.badgeExpired}>
              <AlertTriangle size={12} color="#C2410C" />
              <Text style={styles.badgeExpiredText}>License Expired</Text>
            </View>
          ) : isRejected ? (
            <View style={styles.badgeRejected}>
              <XCircle size={12} color="#B91C1C" />
              <Text style={styles.badgeRejectedText}>Rejected</Text>
            </View>
          ) : (
            <View style={styles.badgeUnverified}>
              <AlertCircle size={12} color="#64748B" />
              <Text style={styles.badgeUnverifiedText}>Unverified</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Supplier Name & Location */}
      <Text style={styles.supplierName}>{supplier.name}</Text>
      <View style={styles.locationRow}>
        <MapPin size={13} color="#64748B" />
        <Text style={styles.locationText}>
          {supplier.distanceKm} km away • {supplier.location}
        </Text>
      </View>

      {/* Key Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Reliability</Text>
          <Text style={styles.metricValueGreen}>{supplier.reliabilityScorePct}%</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Fulfilled</Text>
          <Text style={styles.metricValue}>{supplier.totalCompletedOrders} orders</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Rating</Text>
          {supplier.ratingStars ? (
            <View style={styles.ratingBadge}>
              <Star size={12} color="#D97706" fill="#D97706" />
              <Text style={styles.ratingText}>
                {supplier.ratingStars.toFixed(1)}
                {supplier.reviewCount ? ` (${supplier.reviewCount})` : ''}
              </Text>
            </View>
          ) : (
            <Text style={styles.metricNone}>No ratings yet</Text>
          )}
        </View>
      </View>

      {/* Listed Products & Indicative Prices */}
      <View style={styles.inventorySection}>
        <Text style={styles.inventorySectionTitle}>Available Produce & Indicative Rates</Text>

        {supplier.productListings.map((listing, index) => {
          const isHighlight =
            highlightedCrop &&
            listing.cropName.toLowerCase().includes(highlightedCrop.toLowerCase());

          return (
            <View
              key={index}
              style={[
                styles.listingRow,
                isHighlight && styles.listingRowHighlighted,
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.listingCropRow}>
                  <Text style={[styles.listingCropName, isHighlight && styles.listingCropNameHighlighted]}>
                    {listing.cropName}
                  </Text>
                  <View style={styles.listingGradePill}>
                    <Text style={styles.listingGradeText}>{listing.grade}</Text>
                  </View>
                </View>
                <Text style={styles.listingSub}>
                  {listing.variety} • {listing.dispatchLeadDays}-day dispatch
                </Text>
              </View>

              <View style={styles.listingRight}>
                <Text style={styles.listingPrice}>
                  ₹{listing.indicativePrice.toLocaleString('en-IN')}
                  <Text style={styles.listingUnit}>/{listing.unit}</Text>
                </Text>
                <View style={styles.qtyBadge}>
                  <Package size={10} color="#15803D" />
                  <Text style={styles.qtyBadgeText}>
                    {listing.availableQuantity} {listing.unit}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Delivery & Storage Summary */}
      <View style={styles.logisticsRow}>
        <Truck size={13} color="#475569" />
        <Text style={styles.logisticsText} numberOfLines={1}>
          {supplier.deliveryCapabilities.modes
            .map((m) =>
              m === 'FARM_GATE_PICKUP'
                ? 'Farmgate Pickup'
                : m === 'SELLER_DELIVERY'
                ? 'Seller Delivery'
                : 'MandiKart Logistics'
            )
            .join(' • ')}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        <Pressable
          style={styles.detailsBtn}
          onPress={onPressDetails}
        >
          <Text style={styles.detailsBtnText}>View Details & Audit</Text>
          <ChevronRight size={14} color={MKColors.primary} />
        </Pressable>

        <Pressable
          style={styles.tenderBtn}
          onPress={onRequestQuote}
        >
          <Text style={styles.tenderBtnText}>Request Quote</Text>
          <ArrowRight size={14} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchBarRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  activeCropBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  activeCropInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeCropLabel: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
  },
  activeCropPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeCropText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  clearCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearCropBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: MKColors.primary,
  },
  filterRow: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: MKColors.primary,
  },
  filterChipVerifiedActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#15803D',
  },
  filterChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: MKColors.primary,
    fontWeight: '700',
  },
  filterChipTextVerified: {
    color: '#15803D',
    fontWeight: '700',
  },
  countSortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  supplierTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  supplierTypePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  badgeVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#86EFAC',
  },
  badgeVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  badgeExpired: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#FDBA74',
  },
  badgeExpiredText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  badgeRejected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#FCA5A5',
  },
  badgeRejectedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  badgeUnverified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeUnverifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  metricValueGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricNone: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  inventorySection: {
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1EFEA',
  },
  inventorySectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  listingRowHighlighted: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  listingCropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listingCropName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  listingCropNameHighlighted: {
    color: '#15803D',
  },
  listingGradePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  listingGradeText: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '600',
  },
  listingSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  listingRight: {
    alignItems: 'flex-end',
  },
  listingPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  listingUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },
  qtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  qtyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  logisticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  logisticsText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MKColors.primary,
    backgroundColor: '#FFFFFF',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: MKColors.primary,
  },
  tenderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    borderRadius: 8,
    backgroundColor: MKColors.primary,
  },
  tenderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MKColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyResetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sortOptionList: {
    gap: 8,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortOptionRowSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: MKColors.primary,
  },
  sortOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  sortOptionLabelSelected: {
    color: MKColors.primary,
  },
  sortOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
