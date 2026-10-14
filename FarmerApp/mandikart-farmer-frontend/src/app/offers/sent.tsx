/**
 * MandiKart Farmer App — Sent Purchase Requests Screen (Screen 22)
 *
 * Route: /offers/sent
 *
 * Lists all purchase requests and binding price offers initiated by the farmer
 * to suppliers. Clearly distinguishes draft requests from submitted offers,
 * shows latest supplier response activity, and supports status filtering.
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  Plus,
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
  Inbox,
  FileEdit,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useOffersStore, ProcurementOffer } from '@/store/offersStore';

type SentStatusFilter = 'ALL' | 'PENDING_SUPPLIER' | 'COUNTERED' | 'ACCEPTED' | 'DRAFT';

export default function SentPurchaseRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { sentOffers, fetchSentOffers, isLoading } = useOffersStore();

  const [activeStatus, setActiveStatus] = useState<SentStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSentOffers({ status: activeStatus, search: searchQuery });
  }, [activeStatus, searchQuery, fetchSentOffers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSentOffers({ status: activeStatus, search: searchQuery });
    setRefreshing(false);
  };

  const filteredOffers = useMemo(() => {
    let list = [...sentOffers];
    if (activeStatus !== 'ALL') {
      list = list.filter((o) => o.status === activeStatus);
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
  }, [sentOffers, activeStatus, searchQuery]);

  const getStatusBadge = (status: ProcurementOffer['status']) => {
    switch (status) {
      case 'DRAFT':
        return { bg: '#F1F5F9', color: '#475569', label: 'Unsubmitted Draft' };
      case 'PENDING_SUPPLIER':
        return { bg: '#FEF3C7', color: '#B45309', label: 'Awaiting Supplier Response' };
      case 'COUNTERED':
        return { bg: '#EFF6FF', color: '#1D4ED8', label: 'Supplier Countered' };
      case 'ACCEPTED':
        return { bg: '#DCFCE7', color: '#15803D', label: 'Supplier Accepted' };
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
            <Text style={styles.headerTitle}>Sent Purchase Requests</Text>
            <Text style={styles.headerSubtitle}>
              Proposals & Bids Sent to Suppliers
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.incomingSwitchBtn}
          onPress={() => router.push('/offers/incoming' as any)}
        >
          <Inbox size={14} color="#64748B" style={{ marginRight: 4 }} />
          <Text style={styles.incomingSwitchBtnText}>Incoming Quotes</Text>
        </Pressable>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sent proposal, supplier, crop..."
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

      {/* Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabsStrip}
      >
        {(['ALL', 'PENDING_SUPPLIER', 'COUNTERED', 'ACCEPTED', 'DRAFT'] as SentStatusFilter[]).map((tab) => {
          const isSelected = activeStatus === tab;
          const label =
            tab === 'ALL'
              ? 'All Sent'
              : tab === 'PENDING_SUPPLIER'
              ? 'Awaiting Response'
              : tab === 'COUNTERED'
              ? 'Counteroffers'
              : tab === 'ACCEPTED'
              ? 'Accepted'
              : 'Drafts';

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

      {/* Sent Offers Feed */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[MKColors.primary]}
          />
        }
      >
        {isLoading && sentOffers.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={MKColors.primary} />
            <Text style={styles.loadingText}>Fetching sent purchase requests...</Text>
          </View>
        ) : filteredOffers.length === 0 ? (
          <View style={styles.emptyCard}>
            <FileText size={42} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Sent Requests Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.length > 0
                ? 'No sent purchase requests match your search criteria.'
                : 'You have not submitted any direct purchase requests to suppliers yet.'}
            </Text>
            <Pressable
              style={styles.newOfferBtn}
              onPress={() => router.push('/offers/make-offer' as any)}
            >
              <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.newOfferBtnText}>Make a New Offer</Text>
            </Pressable>
          </View>
        ) : (
          filteredOffers.map((item) => {
            const statusBadge = getStatusBadge(item.status);
            const isDraft = item.status === 'DRAFT';
            const lastStep = item.history[item.history.length - 1];

            return (
              <Pressable
                key={item.id}
                style={[styles.offerCard, isDraft && styles.draftCard]}
                onPress={() => router.push(`/offers/details?id=${item.id}` as any)}
              >
                {/* Header Row */}
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardBadgeRow}>
                      <Text style={styles.cardTypeTag}>{item.supplierType.replace('_', ' ')}</Text>
                      {item.isVerified && (
                        <View style={styles.cardVerifiedTag}>
                          <ShieldCheck size={10} color="#15803D" style={{ marginRight: 2 }} />
                          <Text style={styles.cardVerifiedText}>Verified</Text>
                        </View>
                      )}
                      <Text style={styles.offerIdTag}>#{item.id}</Text>
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

                {/* Terms Summary Grid */}
                <View style={styles.termsGrid}>
                  <View style={styles.termCol}>
                    <Text style={styles.termLabel}>Proposed Quantity</Text>
                    <Text style={styles.termVal}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.termDivider} />
                  <View style={styles.termCol}>
                    <Text style={styles.termLabel}>Proposed Rate</Text>
                    <Text style={styles.termValPrice}>
                      ₹{item.unitPrice}/{item.unit}
                    </Text>
                  </View>
                  <View style={styles.termDivider} />
                  <View style={styles.termCol}>
                    <Text style={styles.termLabel}>Total Value</Text>
                    <Text style={styles.termValLanded}>
                      ₹{item.totalLandedAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Activity & Timestamp Banner */}
                <View style={styles.activityBanner}>
                  <Clock size={12} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.activityText}>
                    {isDraft
                      ? 'Draft created — not yet visible to supplier'
                      : lastStep
                      ? `Latest: ${lastStep.action.replace('_', ' ')} on ${new Date(lastStep.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                      : `Sent on ${new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                  </Text>
                </View>

                {/* Card Action Row */}
                <View style={styles.cardBottomRow}>
                  <Text style={styles.deliveryDepotText} numberOfLines={1}>
                    <Truck size={12} color="#64748B" /> {item.deliveryLocation}
                  </Text>

                  <View style={styles.actionBtnGroup}>
                    {isDraft ? (
                      <Pressable
                        style={styles.resumeDraftBtn}
                        onPress={() => router.push(`/offers/make-offer?id=${item.requirementId}&supplierId=${item.supplierId}` as any)}
                      >
                        <FileEdit size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.resumeDraftBtnText}>Resume Draft</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={styles.viewDetailsBtn}
                        onPress={() => router.push(`/offers/details?id=${item.id}` as any)}
                      >
                        <Text style={styles.viewDetailsBtnText}>View Details</Text>
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

      {/* Floating Action Button: Make New Offer */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={styles.createOfferBtn}
          onPress={() => router.push('/offers/make-offer' as any)}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.createOfferBtnText}>Submit New Purchase Offer</Text>
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
  incomingSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  incomingSwitchBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
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
  newOfferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MKColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  newOfferBtnText: {
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
  draftCard: {
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#FAFAFA',
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
  offerIdTag: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
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
  termsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  termCol: {
    flex: 1,
    alignItems: 'center',
  },
  termLabel: {
    fontSize: 9,
    color: '#64748B',
  },
  termVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  termValPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  termValLanded: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B21A8',
    marginTop: 2,
  },
  termDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  activityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 10,
  },
  activityText: {
    fontSize: 11,
    color: '#475569',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  deliveryDepotText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resumeDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MKColors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  resumeDraftBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
    gap: 4,
  },
  viewDetailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primary,
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
  createOfferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  createOfferBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
