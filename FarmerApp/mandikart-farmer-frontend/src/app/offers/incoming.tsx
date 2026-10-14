/**
 * MandiKart Farmer App — Incoming Supplier Offers Screen (Screen 21)
 *
 * Route: /offers/incoming
 *
 * Displays quotes and binding offers submitted by verified suppliers for the
 * farmer's published procurement tenders. Supports search, status filtering,
 * commercial terms preview, and direct navigation to negotiation actions.
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  Filter,
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
  Send,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useOffersStore, ProcurementOffer } from '@/store/offersStore';

type StatusFilter = 'ALL' | 'PENDING_FARMER' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED';

export default function IncomingOffersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requirementId } = useLocalSearchParams<{ requirementId?: string }>();

  const { incomingOffers, fetchIncomingOffers, isLoading } = useOffersStore();

  const [activeStatus, setActiveStatus] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchIncomingOffers({ requirementId, status: activeStatus, search: searchQuery });
  }, [requirementId, activeStatus, searchQuery, fetchIncomingOffers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIncomingOffers({ requirementId, status: activeStatus, search: searchQuery });
    setRefreshing(false);
  };

  const filteredOffers = useMemo(() => {
    let list = [...incomingOffers];
    if (activeStatus !== 'ALL') {
      list = list.filter((o) => o.status === activeStatus);
    }
    if (requirementId) {
      list = list.filter((o) => o.requirementId === requirementId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.cropName.toLowerCase().includes(q) ||
          o.supplierName.toLowerCase().includes(q) ||
          o.requirementTitle.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [incomingOffers, activeStatus, requirementId, searchQuery]);

  const getStatusBadge = (status: ProcurementOffer['status']) => {
    switch (status) {
      case 'PENDING_FARMER':
        return { bg: '#FEF3C7', color: '#B45309', label: 'Action Required' };
      case 'COUNTERED':
        return { bg: '#EFF6FF', color: '#1D4ED8', label: 'Counteroffered' };
      case 'ACCEPTED':
        return { bg: '#DCFCE7', color: '#15803D', label: 'Accepted' };
      case 'REJECTED':
        return { bg: '#FEE2E2', color: '#DC2626', label: 'Declined' };
      default:
        return { bg: '#F1F5F9', color: '#64748B', label: status };
    }
  };

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
            <Text style={styles.headerTitle}>Incoming Offers</Text>
            <Text style={styles.headerSubtitle}>
              {requirementId ? `Tender #${requirementId.slice(0, 10)}` : 'Supplier Quotes on Tenders'}
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.sentSwitchBtn}
          onPress={() => router.push('/offers/sent' as any)}
        >
          <Send size={14} color={MKColors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.sentSwitchBtnText}>Sent Requests</Text>
        </Pressable>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search crop, supplier, tender ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={16} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Status Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabsStrip}
      >
        {(['ALL', 'PENDING_FARMER', 'COUNTERED', 'ACCEPTED', 'REJECTED'] as StatusFilter[]).map((tab) => {
          const isSelected = activeStatus === tab;
          const label =
            tab === 'ALL'
              ? 'All Offers'
              : tab === 'PENDING_FARMER'
              ? 'Action Required'
              : tab === 'COUNTERED'
              ? 'Negotiating'
              : tab === 'ACCEPTED'
              ? 'Accepted'
              : 'Declined';

          return (
            <Pressable
              key={tab}
              style={[styles.filterTab, isSelected && styles.filterTabActive]}
              onPress={() => setActiveStatus(tab)}
            >
              <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Offers Feed List */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[MKColors.primary]}
          />
        }
      >
        {isLoading && incomingOffers.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={MKColors.primary} />
            <Text style={styles.loadingText}>Fetching supplier offers...</Text>
          </View>
        ) : filteredOffers.length === 0 ? (
          <View style={styles.emptyCard}>
            <FileText size={42} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Offers Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.length > 0
                ? 'No quotes match your search criteria.'
                : 'No supplier quotes received yet for this requirement category.'}
            </Text>
            <Pressable
              style={styles.browseMatchingBtn}
              onPress={() => router.push('/requirements' as any)}
            >
              <Text style={styles.browseMatchingBtnText}>View Requirements Hub</Text>
            </Pressable>
          </View>
        ) : (
          filteredOffers.map((item) => {
            const statusBadge = getStatusBadge(item.status);
            const isPriceBelow = item.priceDiffPerUnit < 0;

            return (
              <Pressable
                key={item.id}
                style={styles.offerCard}
                onPress={() => router.push(`/offers/details?id=${item.id}` as any)}
              >
                {/* Offer Header Row */}
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardBadgeRow}>
                      <Text style={styles.cardTypeTag}>{item.supplierType.replace('_', ' ')}</Text>
                      {item.isVerified && (
                        <View style={styles.cardVerifiedTag}>
                          <ShieldCheck size={10} color="#15803D" style={{ marginRight: 2 }} />
                          <Text style={styles.cardVerifiedText}>Verified FPO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.supplierNameText}>{item.supplierName}</Text>
                    <Text style={styles.reqTitleText} numberOfLines={1}>
                      Tender: {item.requirementTitle}
                    </Text>
                  </View>

                  <View style={[styles.statusTag, { backgroundColor: statusBadge.bg }]}>
                    <Text style={[styles.statusTagText, { color: statusBadge.color }]}>
                      {statusBadge.label}
                    </Text>
                  </View>
                </View>

                {/* Produce & Price Highlight Box */}
                <View style={styles.produceHighlightBox}>
                  <View style={styles.highlightCol}>
                    <Text style={styles.highlightLabel}>Offered Produce</Text>
                    <Text style={styles.highlightValue}>
                      {item.cropName} ({item.grade})
                    </Text>
                    <Text style={styles.highlightSub}>
                      {item.quantity} {item.unit} available
                    </Text>
                  </View>

                  <View style={styles.highlightDivider} />

                  <View style={styles.highlightColRight}>
                    <Text style={styles.highlightLabel}>Quoted Rate</Text>
                    <Text style={styles.priceValue}>
                      ₹{item.unitPrice}
                      <Text style={styles.priceUnit}>/{item.unit}</Text>
                    </Text>
                    <Text
                      style={[
                        styles.priceDiffText,
                        isPriceBelow ? { color: '#15803D' } : { color: '#B45309' },
                      ]}
                    >
                      {isPriceBelow
                        ? `₹${Math.abs(item.priceDiffPerUnit)} below target ceiling`
                        : `Target: ₹${item.targetPrice}/${item.unit}`}
                    </Text>
                  </View>
                </View>

                {/* Commercial & Delivery Preview */}
                <View style={styles.termsPreviewRow}>
                  <View style={styles.termItem}>
                    <Truck size={13} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.termItemText}>
                      {item.deliveryTerms === 'SELLER_DELIVERY'
                        ? 'Seller Delivers to Depot'
                        : '3PL MandiKart Logistics'}
                    </Text>
                  </View>

                  <View style={styles.termItem}>
                    <Clock size={13} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.termItemText}>
                      Delivery by {item.deliveryDate}
                    </Text>
                  </View>
                </View>

                {/* Landed Cost & CTAs Bottom Bar */}
                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.landedTotalLabel}>Total Landed Value</Text>
                    <Text style={styles.landedTotalAmount}>
                      ₹{item.totalLandedAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.actionsGroup}>
                    {item.status === 'PENDING_FARMER' ? (
                      <>
                        <Pressable
                          style={styles.counterBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/offers/counter?id=${item.id}` as any);
                          }}
                        >
                          <Text style={styles.counterBtnText}>Counter</Text>
                        </Pressable>

                        <Pressable
                          style={styles.viewDetailsBtn}
                          onPress={() => router.push(`/offers/details?id=${item.id}` as any)}
                        >
                          <Text style={styles.viewDetailsBtnText}>Review & Accept</Text>
                          <ChevronRight size={14} color="#FFFFFF" />
                        </Pressable>
                      </>
                    ) : (
                      <Pressable
                        style={styles.viewDetailsBtnSecondary}
                        onPress={() => router.push(`/offers/details?id=${item.id}` as any)}
                      >
                        <Text style={styles.viewDetailsBtnSecondaryText}>View Negotiation</Text>
                        <ChevronRight size={14} color={MKColors.primary} />
                      </Pressable>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
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
  sentSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  sentSwitchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primary,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  filterTabsStrip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: MKColors.primary,
    borderColor: MKColors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
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
  browseMatchingBtn: {
    backgroundColor: MKColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  browseMatchingBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  offerCard: {
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
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  cardTypeTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  cardVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  cardVerifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  supplierNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  reqTitleText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  produceHighlightBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  highlightCol: {
    flex: 1,
  },
  highlightColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  highlightLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  highlightValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  highlightSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  highlightDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },
  priceDiffText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  termsPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termItemText: {
    fontSize: 11,
    color: '#64748B',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  landedTotalLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  landedTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6B21A8',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  counterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: MKColors.primary,
    gap: 4,
  },
  viewDetailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewDetailsBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    gap: 4,
  },
  viewDetailsBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primary,
  },
});
