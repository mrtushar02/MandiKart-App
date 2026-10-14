/**
 * MandiKart Farmer App — Buyer Requests & Negotiation Screen
 * 
 * Implements screens 12, 13, 15, 16:
 * - Active requests list with filter tabs (All, New, Pending, Negotiating, Accepted, Rejected)
 * - Request details modal with itemized net return & delivery terms
 * - Counter offer modal with real-time net return recalculation & farmer notes
 * - Negotiation history timeline
 * - Atomic order handoff on offer acceptance
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Filter,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Calendar,
  Truck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Repeat,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  Info,
  Send,
  Sparkles,
  Building2,
  Package,
} from 'lucide-react-native';
import {
  useSellStore,
  BuyerRequest,
  BuyerRequestStatus,
  NegotiationMessage,
  BulkCommercialDemand,
} from '../../store/sellStore';
import { useProduceStore } from '../../store/produceStore';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/apiClient';


const TABS: { key: BuyerRequestStatus | 'All' | 'Bulk'; label: string }[] = [
  { key: 'All', label: 'All Requests' },
  { key: 'Bulk', label: 'Bulk Commercial' },
  { key: 'New', label: 'New' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Negotiating', label: 'Negotiating' },
  { key: 'Accepted', label: 'Accepted' },
  { key: 'Rejected', label: 'Declined' },
];

export default function BuyerRequestsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cropFilter?: string; tab?: string }>();

  const {
    requests,
    bulkDemands,
    fetchBulkDemands,
    submitBulkQuote,
    acceptRequest,
    counterOffer,
    rejectRequest,
  } = useSellStore();
  const { crops } = useProduceStore();

  const [activeTab, setActiveTab] = useState<BuyerRequestStatus | 'All' | 'Bulk'>(
    (params.tab as BuyerRequestStatus | 'All' | 'Bulk') || 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>(
    params.cropFilter || 'All'
  );

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState<BuyerRequest | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [orderSuccessModalVisible, setOrderSuccessModalVisible] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>('');

  // Counter offer form state
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [counterQty, setCounterQty] = useState<string>('');
  const [counterMessage, setCounterMessage] = useState<string>('');

  // Decline form state
  const [declineReason, setDeclineReason] = useState<string>('Price too low');
  const [declineNote, setDeclineNote] = useState<string>('');

  // Bulk Procurement Quote form state
  const [selectedBulkDemand, setSelectedBulkDemand] = useState<BulkCommercialDemand | null>(null);
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [quotePrice, setQuotePrice] = useState<string>('');
  const [quoteQty, setQuoteQty] = useState<string>('');
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Unique crop names for filter
  const uniqueCropNames = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => set.add(r.cropName));
    bulkDemands.forEach((b) => set.add(b.cropName));
    return ['All', ...Array.from(set)];
  }, [requests, bulkDemands]);

  // Filtered buyer requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesTab = activeTab === 'All' ? true : req.status === activeTab;
      const matchesSearch =
        req.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.cropName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCrop =
        selectedCropFilter === 'All' ? true : req.cropName === selectedCropFilter;

      return matchesTab && matchesSearch && matchesCrop;
    });
  }, [requests, activeTab, searchQuery, selectedCropFilter]);

  // Filtered bulk commercial demands
  const filteredBulkDemands = useMemo(() => {
    return bulkDemands.filter((demand) => {
      const depot = demand.deliveryDepot || demand.deliveryLocation || '';
      const matchesSearch =
        demand.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        demand.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        depot.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCrop =
        selectedCropFilter === 'All'
          ? true
          : demand.cropName.toLowerCase() === selectedCropFilter.toLowerCase();

      return matchesSearch && matchesCrop;
    });
  }, [bulkDemands, searchQuery, selectedCropFilter]);

  // Open Details Modal
  const handleOpenDetails = (req: BuyerRequest) => {
    setSelectedRequest(req);
    setDetailModalVisible(true);
  };

  // Open Counter Modal
  const handleOpenCounter = (req: BuyerRequest) => {
    setSelectedRequest(req);
    setCounterPrice(req.offerPricePerKg.toString());
    setCounterQty(req.quantityKg.toString());
    setCounterMessage('');
    setCounterModalVisible(true);
  };

  // Open Decline Modal
  const handleOpenDecline = (req: BuyerRequest) => {
    setSelectedRequest(req);
    setDeclineReason('Price too low');
    setDeclineNote('');
    setDeclineModalVisible(true);
  };

  // Open Accept Modal
  const handleOpenAccept = (req: BuyerRequest) => {
    setSelectedRequest(req);
    setAcceptModalVisible(true);
  };

  // Open Bulk Quote Modal
  const handleOpenQuoteModal = (demand: BulkCommercialDemand) => {
    setSelectedBulkDemand(demand);
    const targetPrice = demand.targetPricePerKg ?? demand.maxTargetPricePerUnit ?? 25;
    const minVol = demand.minVolumeKg ?? demand.requiredQuantity ?? 1000;
    setQuotePrice(targetPrice.toString());
    const matchingCrop = crops.find(
      (c) => c.cropName.toLowerCase() === demand.cropName.toLowerCase()
    );
    const defaultQty = matchingCrop
      ? Math.min(matchingCrop.availableKg, minVol)
      : minVol;
    setQuoteQty(defaultQty > 0 ? defaultQty.toString() : minVol.toString());
    setQuoteNotes('');
    setQuoteModalVisible(true);
  };

  // Submit Bulk Quote
  const handleSubmitQuote = async () => {
    if (!selectedBulkDemand) return;
    const priceNum = parseFloat(quotePrice);
    const qtyNum = parseInt(quoteQty, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price per kg.');
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity in kg.');
      return;
    }

    setIsSubmittingQuote(true);
    try {
      const res = await submitBulkQuote(selectedBulkDemand.id, priceNum, qtyNum, quoteNotes);
      setQuoteModalVisible(false);
      if (res.success) {
        Alert.alert(
          'Quote Transmitted! 🚀',
          `Your commercial quote of ₹${priceNum}/kg for ${qtyNum.toLocaleString()} kg has been sent to ${selectedBulkDemand.buyerName}. You will receive a direct notification once reviewed.`
        );
      } else {
        Alert.alert('Submission Error', res.error || 'Failed to submit quote.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit quote.');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Sync backend negotiations on mount and poll every 2.5s for real-time buyer requests
  React.useEffect(() => {
    let isMounted = true;
    const fetchNegotiations = async () => {
      try {
        const data = await apiClient.getNegotiations();
        if (isMounted && Array.isArray(data)) {
          useSellStore.getState().mergeBackendNegotiations(data);
        }
      } catch (e) {}
    };

    fetchNegotiations();
    useSellStore.getState().fetchBulkDemands().catch(() => {});
    const interval = setInterval(() => {
      fetchNegotiations();
      useSellStore.getState().fetchBulkDemands().catch(() => {});
    }, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Submit Counter Offer
  const handleSubmitCounter = async () => {
    if (!selectedRequest) return;
    const priceNum = parseFloat(counterPrice);
    const qtyNum = parseInt(counterQty, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid counter price per kg.');
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid counter quantity.');
      return;
    }

    // Produce inventory validation
    const matchingCrop = crops.find(
      (c) => c.cropName.toLowerCase() === selectedRequest.cropName.toLowerCase()
    );
    if (matchingCrop && matchingCrop.availableKg < qtyNum) {
      Alert.alert(
        'Insufficient Available Stock',
        `You currently have ${matchingCrop.availableKg} kg available in your inventory.`
      );
      return;
    }

    counterOffer(selectedRequest.id, priceNum, qtyNum, counterMessage);

    try {
      await apiClient.respondToNegotiation(selectedRequest.id, 'COUNTER', priceNum, qtyNum, counterMessage);
    } catch (e) {}

    setCounterModalVisible(false);
    setDetailModalVisible(false);
    Alert.alert(
      'Counter Offer Sent',
      `Your counter offer of ₹${priceNum}/kg for ${qtyNum} kg has been transmitted to ${selectedRequest.buyerName}.`
    );
  };

  // Submit Decline
  const handleSubmitDecline = async () => {
    if (!selectedRequest) return;
    const reasonText = declineNote ? `${declineReason} - ${declineNote}` : declineReason;
    rejectRequest(selectedRequest.id, reasonText);

    try {
      await apiClient.respondToNegotiation(selectedRequest.id, 'REJECT', undefined, undefined, reasonText);
    } catch (e) {}

    setDeclineModalVisible(false);
    setDetailModalVisible(false);
    Alert.alert('Offer Declined', 'The buyer has been notified.');
  };

  // Submit Accept Offer
  const handleConfirmAccept = async () => {
    if (!selectedRequest) return;
    const res = acceptRequest(selectedRequest.id);

    if (!res.success) {
      Alert.alert('Cannot Accept Offer', res.error || 'Failed to accept offer.');
      return;
    }

    try {
      await apiClient.acceptNegotiation(selectedRequest.id);
    } catch (e) {}

    setCreatedOrderId(res.orderId || 'MK-ORD-CONFIRMED');
    setAcceptModalVisible(false);
    setDetailModalVisible(false);
    setOrderSuccessModalVisible(true);
  };


  // Status Badge Helper
  const renderStatusBadge = (status: BuyerRequestStatus) => {
    switch (status) {
      case 'New':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5' }]}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.statusBadgeText, { color: '#059669' }]}>New Request</Text>
          </View>
        );
      case 'Pending':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FFFBEB' }]}>
            <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.statusBadgeText, { color: '#D97706' }]}>Pending Action</Text>
          </View>
        );
      case 'Negotiating':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#EFF6FF' }]}>
            <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={[styles.statusBadgeText, { color: '#2563EB' }]}>Negotiating</Text>
          </View>
        );
      case 'Accepted':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#F0FDF4' }]}>
            <CheckCircle2 size={12} color="#16A34A" />
            <Text style={[styles.statusBadgeText, { color: '#16A34A', marginLeft: 4 }]}>
              Accepted
            </Text>
          </View>
        );
      case 'Rejected':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FEF2F2' }]}>
            <XCircle size={12} color="#EF4444" />
            <Text style={[styles.statusBadgeText, { color: '#DC2626', marginLeft: 4 }]}>
              Declined
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Buyer Requests & Deals</Text>
          <Text style={styles.headerSubtitle}>
            {requests.filter((r) => r.status === 'New' || r.status === 'Pending').length} active offers awaiting response
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by buyer name or crop..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {TABS.map((tab) => {
            const count =
              tab.key === 'All'
                ? requests.length
                : tab.key === 'Bulk'
                ? bulkDemands.length
                : requests.filter((r) => r.status === tab.key).length;
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabChip, isSelected && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.tabCountBadge,
                      isSelected && styles.tabCountBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabCountText,
                        isSelected && styles.tabCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Crop Filter Chips */}
        {uniqueCropNames.length > 2 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cropFilterRow}
          >
            {uniqueCropNames.map((crop) => (
              <TouchableOpacity
                key={crop}
                style={[
                  styles.cropChip,
                  selectedCropFilter === crop && styles.cropChipActive,
                ]}
                onPress={() => setSelectedCropFilter(crop)}
              >
                <Text
                  style={[
                    styles.cropChipText,
                    selectedCropFilter === crop && styles.cropChipTextActive,
                  ]}
                >
                  {crop}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* List of Content: Bulk Requirements or Buyer Requests */}
        {activeTab === 'Bulk' ? (
          filteredBulkDemands.length === 0 ? (
            <View style={styles.emptyState}>
              <AlertCircle size={44} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Bulk Requirements</Text>
              <Text style={styles.emptyDesc}>
                There are currently no institutional bulk requirements matching your search/crop filters.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCropFilter('All');
                }}
              >
                <Text style={styles.emptyActionText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredBulkDemands.map((demand) => {
              const matchingCrop = crops.find(
                (c) => c.cropName.toLowerCase() === demand.cropName.toLowerCase()
              );
              const targetPrice = demand.targetPricePerKg ?? demand.maxTargetPricePerUnit ?? 25;
              const benchmarkPrice = demand.marketBenchmarkPricePerKg ?? Math.round(targetPrice * 0.92);
              const priceDelta = targetPrice - benchmarkPrice;
              const isAboveMarket = priceDelta >= 0;
              const minVol = demand.minVolumeKg ?? demand.requiredQuantity ?? 1000;
              const maxVol = demand.maxVolumeKg ?? (minVol * 2);
              const depot = demand.deliveryDepot || demand.deliveryLocation || 'Nashik Central Depot';

              return (
                <View key={demand.id} style={styles.bulkCard}>
                  {/* Top Bar: Buyer + Type + Urgency */}
                  <View style={styles.bulkCardHeader}>
                    <View style={styles.bulkBuyerRow}>
                      <View style={styles.bulkAvatarWrap}>
                        <Building2 size={20} color="#15803D" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.bulkBuyerName} numberOfLines={1}>
                            {demand.buyerName}
                          </Text>
                          {demand.verifiedBuyer && (
                            <ShieldCheck size={14} color="#15803D" />
                          )}
                        </View>
                        <View style={styles.bulkTypeRow}>
                          <Text style={styles.bulkTypeTag}>
                            {demand.buyerType.replace(/_/g, ' ')}
                          </Text>
                          <Text style={styles.bulkDotSeparator}>•</Text>
                          <Text style={styles.bulkDeadline}>Deadline: {demand.deadlineDate || 'Within 7 Days'}</Text>
                        </View>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.bulkUrgencyBadge,
                        demand.urgency === 'URGENT'
                          ? { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }
                          : { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.bulkUrgencyText,
                          demand.urgency === 'URGENT' ? { color: '#B91C1C' } : { color: '#B45309' },
                        ]}
                      >
                        {demand.urgency || 'HIGH'}
                      </Text>
                    </View>
                  </View>

                  {/* Crop & Volume Banner */}
                  <View style={styles.bulkCropBanner}>
                    <View>
                      <Text style={styles.bulkCropTitle}>{demand.cropName}</Text>
                      <Text style={styles.bulkQualityText}>Spec: {demand.qualityStandard || `Grade ${demand.grade || 'A'}`}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.bulkVolumeLabel}>Required Volume</Text>
                      <Text style={styles.bulkVolumeValue}>
                        {minVol.toLocaleString()} - {maxVol.toLocaleString()} kg
                      </Text>
                    </View>
                  </View>

                  {/* Pricing Comparison Grid */}
                  <View style={styles.bulkPriceGrid}>
                    <View style={styles.bulkPriceCol}>
                      <Text style={styles.bulkPriceLabel}>Target Buying Rate</Text>
                      <Text style={[styles.bulkPriceValue, { color: '#15803D' }]}>
                        ₹{targetPrice}/kg
                      </Text>
                    </View>
                    <View style={styles.bulkPriceDivider} />
                    <View style={styles.bulkPriceCol}>
                      <Text style={styles.bulkPriceLabel}>APMC Benchmark</Text>
                      <Text style={styles.bulkPriceValueMuted}>
                        ₹{benchmarkPrice}/kg
                      </Text>
                    </View>
                    <View style={styles.bulkPriceDivider} />
                    <View style={styles.bulkPriceCol}>
                      <Text style={styles.bulkPriceLabel}>Price Advantage</Text>
                      <Text
                        style={[
                          styles.bulkPriceAdvantage,
                          { color: isAboveMarket ? '#15803D' : '#D97706' },
                        ]}
                      >
                        {isAboveMarket ? `+₹${priceDelta}/kg` : `₹${priceDelta}/kg`}
                      </Text>
                    </View>
                  </View>

                  {/* Logistics and Delivery Details */}
                  <View style={styles.bulkLogisticsRow}>
                    <View style={styles.bulkLogisticsItem}>
                      <MapPin size={13} color="#4B5563" />
                      <Text style={styles.bulkLogisticsText} numberOfLines={1}>
                        {depot} ({demand.distanceKm || 30} km)
                      </Text>
                    </View>
                    <View style={styles.bulkLogisticsItem}>
                      <Truck size={13} color="#4B5563" />
                      <Text style={styles.bulkLogisticsText}>
                        Logistics: {demand.logisticsArrangedBy || 'BUYER'}
                      </Text>
                    </View>
                  </View>

                  {/* Match insights pill */}
                  {demand.matchScore && (
                    <View style={styles.bulkMatchBanner}>
                      <Sparkles size={14} color="#15803D" />
                      <Text style={styles.bulkMatchText}>
                        <Text style={{ fontWeight: '700' }}>{demand.matchScore}% Match</Text>
                        {demand.matchReasons && demand.matchReasons[0]
                          ? ` • ${demand.matchReasons[0]}`
                          : ' • High fulfillment alignment with your harvest'}
                      </Text>
                    </View>
                  )}

                  {/* Inventory Status Note */}
                  <View style={styles.bulkInventoryNote}>
                    <Info size={13} color="#2563EB" />
                    <Text style={styles.bulkInventoryText}>
                      {matchingCrop
                        ? `You have ${matchingCrop.availableKg.toLocaleString()} kg of ${demand.cropName} in inventory.`
                        : `You have no ${demand.cropName} registered, but can fulfill if available.`}
                    </Text>
                  </View>

                  {/* Action Bar */}
                  <View style={styles.bulkActionRow}>
                    <TouchableOpacity
                      style={styles.bulkSubmitQuoteBtn}
                      onPress={() => handleOpenQuoteModal(demand)}
                    >
                      <Text style={styles.bulkSubmitQuoteBtnText}>Submit Commercial Quote</Text>
                      <ArrowRight size={15} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={44} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Requests Found</Text>
            <Text style={styles.emptyDesc}>
              {activeTab === 'All'
                ? 'You do not have any incoming buyer requests matching the criteria.'
                : `No requests with status "${activeTab}" right now.`}
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => {
                setActiveTab('All');
                setSearchQuery('');
                setSelectedCropFilter('All');
              }}
            >
              <Text style={styles.emptyActionText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredRequests.map((req) => {
            const gross = req.quantityKg * req.offerPricePerKg;
            const transportTotal = Math.round(req.quantityKg * req.estimatedTransportPerKg);
            const netTotal = gross - transportTotal;
            const priceDiff = (req.offerPricePerKg - req.marketReferencePricePerKg).toFixed(1);
            const isAboveRef = parseFloat(priceDiff) >= 0;

            return (
              <View key={req.id} style={styles.requestCard}>
                {/* Top Row: Buyer Profile & Status */}
                <View style={styles.cardHeader}>
                  <Image source={{ uri: req.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }} style={styles.buyerAvatar} />
                  <View style={styles.buyerInfoWrap}>
                    <View style={styles.buyerNameRow}>
                      <Text style={styles.buyerName} numberOfLines={1}>
                        {req.buyerName}
                      </Text>
                      {req.verified && (
                        <ShieldCheck size={14} color="#16A34A" style={styles.shieldIcon} />
                      )}
                    </View>
                    <Text style={styles.buyerType}>{req.buyerType}</Text>
                    <View style={styles.buyerMetaRow}>
                      <View style={styles.starRow}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.ratingText}>{req.rating.toFixed(1)}</Text>
                      </View>
                      <Text style={styles.metaDivider}>•</Text>
                      <MapPin size={11} color="#6B7280" />
                      <Text style={styles.distanceText}>{req.distanceKm} km away</Text>
                    </View>
                  </View>
                  {renderStatusBadge(req.status)}
                </View>

                {/* Produce & Offer Banner */}
                <View style={styles.produceOfferBanner}>
                  <View style={styles.produceLeft}>
                    <Text style={styles.cropTitle}>
                      {req.cropName}
                      {req.variety ? ` • ${req.variety}` : ''}
                    </Text>
                    {req.items && req.items.length > 1 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginVertical: 3, alignSelf: 'flex-start' }}>
                        <Package size={11} color="#059669" />
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#047857' }} numberOfLines={1}>
                          Multi-Product Demand ({req.items.length} commodities)
                        </Text>
                      </View>
                    )}
                    <View style={styles.cropChipsRow}>
                      <View style={styles.gradeBadge}>
                        <Text style={styles.gradeBadgeText}>{req.qualityGrade}</Text>
                      </View>
                      <Text style={styles.qtyText}>
                        <Text style={styles.qtyNumber}>{req.quantityKg} {req.unit || 'kg'}</Text> requested
                      </Text>
                    </View>
                  </View>

                  <View style={styles.priceRight}>
                    <Text style={styles.pricePerKg}>₹{req.offerPricePerKg}</Text>
                    <Text style={styles.priceUnit}>per {req.unit || 'kg'} offer</Text>
                    <View
                      style={[
                        styles.refDiffBadge,
                        { backgroundColor: isAboveRef ? '#ECFDF5' : '#FEF2F2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.refDiffText,
                          { color: isAboveRef ? '#059669' : '#DC2626' },
                        ]}
                      >
                        {isAboveRef ? `+₹${priceDiff}` : `-₹${Math.abs(parseFloat(priceDiff))}`}{' '}
                        vs AGMARKNET
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Financial Summary Card */}
                <View style={styles.finSummaryRow}>
                  <View style={styles.finCol}>
                    <Text style={styles.finLabel}>Gross Total</Text>
                    <Text style={styles.finVal}>₹{gross.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.finDivider} />
                  <View style={styles.finCol}>
                    <Text style={styles.finLabel}>Est. Transport</Text>
                    <Text style={styles.finValMuted}>-₹{transportTotal.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.finDivider} />
                  <View style={styles.finCol}>
                    <Text style={[styles.finLabel, { color: '#15803D' }]}>Est. Net Return</Text>
                    <Text style={styles.finValHighlight}>₹{netTotal.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Logistics & Timing Strip */}
                <View style={styles.logisticsStrip}>
                  <View style={styles.stripItem}>
                    <Calendar size={13} color="#4B5563" />
                    <Text style={styles.stripText}>Pickup: {req.pickupDate}</Text>
                  </View>
                  <View style={styles.stripItem}>
                    <Clock size={13} color="#DC2626" />
                    <Text style={[styles.stripText, { color: '#DC2626' }]}>
                      Expires in {req.expiresInHours}h
                    </Text>
                  </View>
                </View>

                {/* Negotiation message snippet if present */}
                {req.history && req.history.length > 1 && (
                  <View style={styles.historySnippet}>
                    <MessageSquare size={13} color="#2563EB" />
                    <Text style={styles.snippetText} numberOfLines={1}>
                      Latest: "{req.history[req.history.length - 1].message}"
                    </Text>
                  </View>
                )}

                {/* Rejection note if rejected */}
                {req.status === 'Rejected' && req.rejectionReason && (
                  <View style={styles.rejectionNotice}>
                    <AlertCircle size={13} color="#DC2626" />
                    <Text style={styles.rejectionText}>
                      Decline reason: {req.rejectionReason}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.cardActionsContainer}>
                  {req.status === 'Accepted' ? (
                    <TouchableOpacity
                      style={styles.viewOrderBtn}
                      onPress={() => router.push('/(tabs)/orders')}
                    >
                      <Text style={styles.viewOrderBtnText}>View Confirmed Order</Text>
                      <ChevronRight size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : req.status === 'Rejected' ? (
                    <TouchableOpacity
                      style={styles.detailsOnlyBtn}
                      onPress={() => handleOpenDetails(req)}
                    >
                      <Text style={styles.detailsOnlyBtnText}>View Past Record</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <View style={styles.cardActionsSubRow}>
                        <TouchableOpacity
                          style={styles.actionChatBtn}
                          onPress={() =>
                            router.push({
                              pathname: '/sell/chat',
                              params: {
                                id: req.id,
                                negotiationId: req.id,
                                buyerName: req.buyerName,
                                cropName: req.cropName,
                                items: req.items && req.items.length > 0 ? JSON.stringify(req.items) : undefined,
                              },
                            })
                          }
                        >
                          <MessageSquare size={14} color="#15803D" />
                          <Text style={styles.actionChatText}>Chat with Buyer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionDeclineBtn}
                          onPress={() => handleOpenDecline(req)}
                        >
                          <Text style={styles.actionDeclineText}>Decline</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.cardActionsSubRow}>
                        <TouchableOpacity
                          style={styles.actionCounterBtn}
                          onPress={() => handleOpenCounter(req)}
                        >
                          <Repeat size={14} color="#15803D" />
                          <Text style={styles.actionCounterText}>Counter Offer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionAcceptBtn}
                          onPress={() => handleOpenAccept(req)}
                        >
                          <CheckCircle2 size={15} color="#FFFFFF" />
                          <Text style={styles.actionAcceptText}>Accept Request</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>

                {/* Bottom link to details modal */}
                {req.status !== 'Accepted' && req.status !== 'Rejected' && (
                  <TouchableOpacity
                    style={styles.detailsLink}
                    onPress={() => handleOpenDetails(req)}
                  >
                    <Text style={styles.detailsLinkText}>
                      View full details & negotiation history ({req.history.length})
                    </Text>
                    <ChevronRight size={14} color="#2563EB" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* MODAL 1: REQUEST DETAILS & NEGOTIATION TIMELINE MODAL                      */}
      {/* ========================================================================= */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Details & History</Text>
                <Text style={styles.modalSub}>
                  {selectedRequest?.buyerName} • {selectedRequest?.cropName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollBody}
              >
                {/* Buyer Card */}
                <View style={styles.modalSectionCard}>
                  <Text style={styles.sectionLabel}>BUYER PROFILE</Text>
                  <View style={styles.modalBuyerRow}>
                    <Image
                      source={{ uri: selectedRequest.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
                      style={styles.modalBuyerAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalBuyerName}>
                        {selectedRequest.buyerName}
                      </Text>
                      <Text style={styles.modalBuyerType}>
                        {selectedRequest.buyerType}
                      </Text>
                      <Text style={styles.modalBuyerLoc}>
                        {selectedRequest.distanceKm} km away • Fast farm pickup
                      </Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.ratingNum}>
                        {selectedRequest.rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Offer Economics */}
                <View style={styles.modalSectionCard}>
                  <Text style={styles.sectionLabel}>TRANSACTION BREAKDOWN</Text>
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Crop & Grade</Text>
                    <Text style={styles.specVal}>
                      {selectedRequest.cropName} ({selectedRequest.qualityGrade})
                    </Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Quantity Requested</Text>
                    <Text style={styles.specVal}>{selectedRequest.quantityKg} kg</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Offer Price</Text>
                    <Text style={[styles.specVal, { color: '#15803D', fontWeight: '700' }]}>
                      ₹{selectedRequest.offerPricePerKg} / kg
                    </Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Market Reference (AGMARKNET)</Text>
                    <Text style={styles.specVal}>
                      ₹{selectedRequest.marketReferencePricePerKg} / kg
                    </Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Estimated Transport</Text>
                    <Text style={styles.specValMuted}>
                      -₹{Math.round(selectedRequest.quantityKg * selectedRequest.estimatedTransportPerKg)} (₹{selectedRequest.estimatedTransportPerKg}/kg)
                    </Text>
                  </View>
                  <View style={[styles.specRow, styles.specHighlightRow]}>
                    <Text style={styles.specHighlightKey}>Estimated Net Return</Text>
                    <Text style={styles.specHighlightVal}>
                      ₹{(selectedRequest.quantityKg * selectedRequest.offerPricePerKg - Math.round(selectedRequest.quantityKg * selectedRequest.estimatedTransportPerKg)).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Logistics details */}
                <View style={styles.modalSectionCard}>
                  <Text style={styles.sectionLabel}>LOGISTICS & SCHEDULE</Text>
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Pickup Window</Text>
                    <Text style={styles.specVal}>{selectedRequest.pickupDate}</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Transport Arrangement</Text>
                    <Text style={styles.specVal}>Buyer Vehicle (Farmgate Collection)</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Payment Settlement</Text>
                    <Text style={styles.specVal}>Direct Bank Escrow upon Weighbridge Slip</Text>
                  </View>
                </View>

                {/* Negotiation Timeline */}
                <View style={styles.modalSectionCard}>
                  <Text style={styles.sectionLabel}>NEGOTIATION TIMELINE</Text>
                  {selectedRequest.history.map((item, idx) => {
                    const isFarmer = item.sender === 'farmer';
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.timelineBubble,
                          isFarmer ? styles.timelineBubbleFarmer : styles.timelineBubbleBuyer,
                        ]}
                      >
                        <View style={styles.bubbleHeader}>
                          <Text
                            style={[
                              styles.bubbleSender,
                              { color: isFarmer ? '#15803D' : '#1F2937' },
                            ]}
                          >
                            {isFarmer ? 'You (Farmer)' : selectedRequest.buyerName}
                          </Text>
                          <Text style={styles.bubbleTime}>{item.timestamp}</Text>
                        </View>
                        <Text style={styles.bubblePrice}>
                          Offered: ₹{item.pricePerKg}/kg • {item.quantityKg} kg
                        </Text>
                        {item.message && (
                          <Text style={styles.bubbleMessage}>{item.message}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* Modal Footer Actions */}
            {selectedRequest &&
              selectedRequest.status !== 'Accepted' &&
              selectedRequest.status !== 'Rejected' && (
                <View style={styles.modalFooterActions}>
                  <TouchableOpacity
                    style={styles.modalChatBtn}
                    onPress={() => {
                      setDetailModalVisible(false);
                      router.push({
                        pathname: '/sell/chat',
                        params: {
                          id: selectedRequest.id,
                          buyerName: selectedRequest.buyerName,
                          cropName: selectedRequest.cropName,
                        },
                      });
                    }}
                  >
                    <MessageSquare size={16} color="#15803D" />
                    <Text style={styles.modalChatBtnText}>Open Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalCounterBtn}
                    onPress={() => {
                      setDetailModalVisible(false);
                      handleOpenCounter(selectedRequest);
                    }}
                  >
                    <Repeat size={16} color="#15803D" />
                    <Text style={styles.modalCounterBtnText}>Counter</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalAcceptBtn}
                    onPress={() => {
                      setDetailModalVisible(false);
                      handleOpenAccept(selectedRequest);
                    }}
                  >
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.modalAcceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )}
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: COUNTER OFFER MODAL                                              */}
      {/* ========================================================================= */}
      <Modal
        visible={counterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCounterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Counter Offer</Text>
                <Text style={styles.modalSub}>
                  Propose your revised terms to {selectedRequest?.buyerName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCounterModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollBody}
              >
                {/* Current Terms recap */}
                <View style={styles.recapBanner}>
                  <Text style={styles.recapTitle}>
                    Current Buyer Offer: ₹{selectedRequest.offerPricePerKg}/kg for{' '}
                    {selectedRequest.quantityKg} kg
                  </Text>
                  <Text style={styles.recapSub}>
                    AGMARKNET Reference: ₹{selectedRequest.marketReferencePricePerKg}/kg
                  </Text>
                </View>

                {/* Counter Price Field */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Your Counter Price (₹ / kg)</Text>
                  <View style={styles.priceStepperRow}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => {
                        const val = parseFloat(counterPrice) || selectedRequest.offerPricePerKg;
                        setCounterPrice(Math.max(1, val - 0.5).toFixed(1));
                      }}
                    >
                      <Text style={styles.stepBtnText}>-0.5</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.priceInput}
                      keyboardType="numeric"
                      value={counterPrice}
                      onChangeText={setCounterPrice}
                      placeholder="e.g. 25.5"
                    />
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => {
                        const val = parseFloat(counterPrice) || selectedRequest.offerPricePerKg;
                        setCounterPrice((val + 0.5).toFixed(1));
                      }}
                    >
                      <Text style={styles.stepBtnText}>+0.5</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Counter Quantity Field */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Quantity to Sell (kg)</Text>
                  <TextInput
                    style={styles.regularInput}
                    keyboardType="numeric"
                    value={counterQty}
                    onChangeText={setCounterQty}
                    placeholder="Quantity in kg"
                  />
                </View>

                {/* Counter Message / Note */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Optional Note to Buyer</Text>
                  <TextInput
                    style={styles.textAreaInput}
                    multiline
                    numberOfLines={3}
                    value={counterMessage}
                    onChangeText={setCounterMessage}
                    placeholder="e.g. Cold storage premium crop, properly cured neck, ready for dispatch."
                  />
                </View>

                {/* Live Real-time recalculation */}
                {(() => {
                  const p = parseFloat(counterPrice) || 0;
                  const q = parseInt(counterQty, 10) || 0;
                  const gross = p * q;
                  const trans = Math.round(q * selectedRequest.estimatedTransportPerKg);
                  const net = gross - trans;
                  const diffPerKg = (p - selectedRequest.offerPricePerKg).toFixed(1);

                  return (
                    <View style={styles.calcPreviewCard}>
                      <Text style={styles.calcTitle}>Projected Return at Counter Rate</Text>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>New Gross Total</Text>
                        <Text style={styles.calcVal}>₹{gross.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Estimated Transport</Text>
                        <Text style={styles.calcValMuted}>-₹{trans.toLocaleString('en-IN')}</Text>
                      </View>
                      <View style={[styles.calcRow, { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 6 }]}>
                        <Text style={[styles.calcLabel, { fontWeight: '700', color: '#15803D' }]}>
                          Estimated Net Payout
                        </Text>
                        <Text style={styles.calcValHighlight}>₹{net.toLocaleString('en-IN')}</Text>
                      </View>
                      <Text style={styles.calcDiffNotice}>
                        {parseFloat(diffPerKg) >= 0 ? `+₹${diffPerKg}` : `-₹${Math.abs(parseFloat(diffPerKg))}`}{' '}
                        per kg compared to buyer's current offer.
                      </Text>
                    </View>
                  );
                })()}
              </ScrollView>
            )}

            {/* Modal Footer */}
            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCounterModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitCounterBtn}
                onPress={handleSubmitCounter}
              >
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.submitCounterBtnText}>Send Counter Offer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: DECLINE OFFER MODAL                                              */}
      {/* ========================================================================= */}
      <Modal
        visible={declineModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeclineModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: 440 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Decline Request</Text>
                <Text style={styles.modalSub}>
                  Inform {selectedRequest?.buyerName} why you are declining
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDeclineModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody}>
              <Text style={styles.formLabel}>Select Reason</Text>
              {[
                'Price too low for this quality',
                'Quantity requested not currently available',
                'Pickup date does not suit farm schedule',
                'Already reserved for another channel',
              ].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    declineReason === reason && styles.reasonOptionActive,
                  ]}
                  onPress={() => setDeclineReason(reason)}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      declineReason === reason && styles.radioCircleActive,
                    ]}
                  />
                  <Text style={styles.reasonText}>{reason}</Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.formLabel, { marginTop: 12 }]}>
                Additional Note (Optional)
              </Text>
              <TextInput
                style={styles.regularInput}
                placeholder="e.g. Can supply next week instead"
                value={declineNote}
                onChangeText={setDeclineNote}
              />
            </ScrollView>

            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setDeclineModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeclineBtn}
                onPress={handleSubmitDecline}
              >
                <XCircle size={16} color="#FFFFFF" />
                <Text style={styles.confirmDeclineBtnText}>Confirm Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: ACCEPT OFFER CONFIRMATION MODAL                                  */}
      {/* ========================================================================= */}
      <Modal
        visible={acceptModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAcceptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: 520 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Accept Buyer Offer</Text>
                <Text style={styles.modalSub}>
                  Create dispatch order & reserve produce stock
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAcceptModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView contentContainerStyle={styles.modalScrollBody}>
                <View style={styles.acceptNoticeCard}>
                  <Info size={18} color="#15803D" />
                  <Text style={styles.acceptNoticeText}>
                    By accepting, {selectedRequest.quantityKg} kg of{' '}
                    {selectedRequest.cropName} will be reserved from your available stock,
                    and a confirmed order will be created.
                  </Text>
                </View>

                <View style={styles.contractSummaryBox}>
                  <View style={styles.contractRow}>
                    <Text style={styles.contractKey}>Buyer</Text>
                    <Text style={styles.contractVal}>{selectedRequest.buyerName}</Text>
                  </View>
                  <View style={styles.contractRow}>
                    <Text style={styles.contractKey}>Crop & Grade</Text>
                    <Text style={styles.contractVal}>
                      {selectedRequest.cropName} ({selectedRequest.qualityGrade})
                    </Text>
                  </View>
                  <View style={styles.contractRow}>
                    <Text style={styles.contractKey}>Total Quantity</Text>
                    <Text style={styles.contractVal}>{selectedRequest.quantityKg} kg</Text>
                  </View>
                  <View style={styles.contractRow}>
                    <Text style={styles.contractKey}>Agreed Price</Text>
                    <Text style={[styles.contractVal, { color: '#15803D', fontWeight: '700' }]}>
                      ₹{selectedRequest.offerPricePerKg} / kg
                    </Text>
                  </View>
                  <View style={styles.contractRow}>
                    <Text style={styles.contractKey}>Gross Value</Text>
                    <Text style={styles.contractVal}>
                      ₹{(selectedRequest.quantityKg * selectedRequest.offerPricePerKg).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.contractRow}>
                    <Text style={styles.contractKey}>Est. Transport</Text>
                    <Text style={styles.contractValMuted}>
                      -₹{Math.round(selectedRequest.quantityKg * selectedRequest.estimatedTransportPerKg).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={[styles.contractRow, { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8 }]}>
                    <Text style={[styles.contractKey, { fontWeight: '700', color: '#15803D' }]}>
                      Est. Net Return
                    </Text>
                    <Text style={styles.contractHighlightVal}>
                      ₹{(selectedRequest.quantityKg * selectedRequest.offerPricePerKg - Math.round(selectedRequest.quantityKg * selectedRequest.estimatedTransportPerKg)).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View style={styles.pickupScheduleRow}>
                  <Calendar size={14} color="#374151" />
                  <Text style={styles.pickupScheduleText}>
                    Collection scheduled for: {selectedRequest.pickupDate}
                  </Text>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAcceptModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Review Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmAcceptBtn}
                onPress={handleConfirmAccept}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.confirmAcceptBtnText}>Confirm & Reserve Stock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: ORDER SUCCESS ATOMIC HANDOFF MODAL                               */}
      {/* ========================================================================= */}
      <Modal
        visible={orderSuccessModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOrderSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: 420, alignItems: 'center' }]}>
            <View style={styles.successIconWrap}>
              <Sparkles size={36} color="#16A34A" />
            </View>

            <Text style={styles.successTitle}>Deal Confirmed!</Text>
            <Text style={styles.successSub}>
              Order <Text style={{ fontWeight: '700', color: '#15803D' }}>{createdOrderId}</Text> has been created atomically.
            </Text>

            <View style={styles.successInfoCard}>
              <Text style={styles.successInfoText}>
                ✓ Produce quantity reserved in your inventory{'\n'}
                ✓ Buyer alerted to dispatch logistics team{'\n'}
                ✓ Payout contract secured via MandiKart Escrow
              </Text>
            </View>

            <View style={styles.successActionsCol}>
              <TouchableOpacity
                style={styles.viewInOrdersBtn}
                onPress={() => {
                  setOrderSuccessModalVisible(false);
                  router.push('/(tabs)/orders');
                }}
              >
                <Text style={styles.viewInOrdersBtnText}>Track Order in Orders Tab</Text>
                <ExternalLink size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stayInSellBtn}
                onPress={() => setOrderSuccessModalVisible(false)}
              >
                <Text style={styles.stayInSellBtnText}>Back to Requests</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: SUBMIT BULK COMMERCIAL QUOTE MODAL                                */}
      {/* ========================================================================= */}
      <Modal
        visible={quoteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Submit Commercial Quote</Text>
                <Text style={styles.modalSub}>
                  {selectedBulkDemand?.cropName} • {selectedBulkDemand?.buyerName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setQuoteModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              <View style={styles.quoteSpecBox}>
                <View style={styles.quoteSpecRow}>
                  <Text style={styles.quoteSpecLabel}>Target Buying Rate:</Text>
                  <Text style={styles.quoteSpecValue}>₹{selectedBulkDemand?.targetPricePerKg ?? selectedBulkDemand?.maxTargetPricePerUnit ?? 25}/kg</Text>
                </View>
                <View style={styles.quoteSpecRow}>
                  <Text style={styles.quoteSpecLabel}>Volume Range:</Text>
                  <Text style={styles.quoteSpecValue}>
                    {(selectedBulkDemand?.minVolumeKg ?? selectedBulkDemand?.requiredQuantity ?? 1000).toLocaleString()} - {(selectedBulkDemand?.maxVolumeKg ?? 5000).toLocaleString()} kg
                  </Text>
                </View>
                <View style={styles.quoteSpecRow}>
                  <Text style={styles.quoteSpecLabel}>Delivery Depot:</Text>
                  <Text style={styles.quoteSpecValue}>{selectedBulkDemand?.deliveryDepot || selectedBulkDemand?.deliveryLocation || 'Depot'}</Text>
                </View>
                <View style={styles.quoteSpecRow}>
                  <Text style={styles.quoteSpecLabel}>Payment Terms:</Text>
                  <Text style={styles.quoteSpecValue}>{selectedBulkDemand?.paymentTerms || 'Standard Terms'}</Text>
                </View>
                <View style={styles.quoteSpecRow}>
                  <Text style={styles.quoteSpecLabel}>Quality Spec:</Text>
                  <Text style={styles.quoteSpecValue}>{selectedBulkDemand?.qualityStandard || `Grade ${selectedBulkDemand?.grade || 'A'}`}</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Your Offered Price (₹ / kg)</Text>
                <TextInput
                  style={styles.regularInput}
                  keyboardType="numeric"
                  value={quotePrice}
                  onChangeText={setQuotePrice}
                  placeholder="e.g. 26.50"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Offered Quantity (kg)</Text>
                <TextInput
                  style={styles.regularInput}
                  keyboardType="numeric"
                  value={quoteQty}
                  onChangeText={setQuoteQty}
                  placeholder="e.g. 5000"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Special Notes / Ready-by Date (Optional)</Text>
                <TextInput
                  style={[styles.textAreaInput, { height: 70, textAlignVertical: 'top' }]}
                  multiline
                  value={quoteNotes}
                  onChangeText={setQuoteNotes}
                  placeholder="e.g. Premium Grade A harvest ready for immediate collection."
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setQuoteModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmQuoteBtn, isSubmittingQuote && { opacity: 0.6 }]}
                disabled={isSubmittingQuote}
                onPress={handleSubmitQuote}
              >
                <Send size={15} color="#FFFFFF" />
                <Text style={styles.confirmQuoteBtnText}>
                  {isSubmittingQuote ? 'Submitting...' : 'Send Quote'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* Search */
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#111827',
  },

  /* Tabs */
  tabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabChipActive: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  tabCountBadge: {
    marginLeft: 6,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabCountBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabCountTextActive: {
    color: '#FFFFFF',
  },

  /* Crop Filter */
  cropFilterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  cropChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cropChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  cropChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  cropChipTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyActionBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#15803D',
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  /* Request Card */
  requestCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buyerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
  },
  buyerInfoWrap: {
    flex: 1,
    marginLeft: 12,
  },
  buyerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buyerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    maxWidth: '85%',
  },
  shieldIcon: {
    marginLeft: 4,
  },
  buyerType: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  buyerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 3,
  },
  metaDivider: {
    fontSize: 11,
    color: '#9CA3AF',
    marginHorizontal: 6,
  },
  distanceText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 3,
  },

  /* Status Badge */
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Produce & Offer Banner */
  produceOfferBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  produceLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  cropTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flexShrink: 1,
  },
  cropChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  gradeBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gradeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
  },
  qtyText: {
    fontSize: 12,
    color: '#4B5563',
  },
  qtyNumber: {
    fontWeight: '700',
    color: '#111827',
  },
  priceRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
    flexShrink: 0,
  },
  pricePerKg: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
  },
  priceUnit: {
    fontSize: 10,
    color: '#6B7280',
  },
  refDiffBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  refDiffText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* Financial Summary */
  finSummaryRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  finCol: {
    flex: 1,
    alignItems: 'center',
  },
  finDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  finLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  finVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  finValMuted: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },
  finValHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },

  /* Logistics Strip */
  logisticsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stripItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stripText: {
    fontSize: 11,
    color: '#4B5563',
    marginLeft: 4,
    fontWeight: '500',
  },

  /* Message Snippet */
  historySnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  snippetText: {
    fontSize: 11,
    color: '#1E40AF',
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
  },

  /* Rejection Notice */
  rejectionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  rejectionText: {
    fontSize: 11,
    color: '#B91C1C',
    marginLeft: 6,
  },

  /* Card Action Buttons */
  cardActionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  cardActionsSubRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionChatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
    gap: 6,
  },
  actionChatText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  actionDeclineBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  actionDeclineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  actionCounterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
    gap: 6,
  },
  actionCounterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  actionAcceptBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#15803D',
    gap: 6,
  },
  actionAcceptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewOrderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#15803D',
    gap: 6,
  },
  viewOrderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailsOnlyBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  detailsOnlyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
    marginRight: 4,
  },

  /* Modals Common */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  modalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalScrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  modalSectionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  modalBuyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalBuyerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  modalBuyerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  modalBuyerType: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  modalBuyerLoc: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 4,
  },

  /* Spec Rows */
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  specKey: {
    fontSize: 12,
    color: '#6B7280',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '65%',
  },
  specValMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  specHighlightRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  specHighlightKey: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  specHighlightVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
  },

  /* Timeline */
  timelineBubble: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  timelineBubbleBuyer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timelineBubbleFarmer: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bubbleSender: {
    fontSize: 11,
    fontWeight: '700',
  },
  bubbleTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  bubblePrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  bubbleMessage: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 3,
    lineHeight: 16,
  },

  /* Modal Actions Footer */
  modalFooterActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalChatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
    gap: 5,
  },
  modalChatBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  modalCounterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
    gap: 6,
  },
  modalCounterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  modalAcceptBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#15803D',
    gap: 6,
  },
  modalAcceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Counter Form */
  recapBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  recapTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  recapSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  priceStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  stepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  priceInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  regularInput: {
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  textAreaInput: {
    height: 72,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    fontSize: 13,
    color: '#111827',
    textAlignVertical: 'top',
  },
  calcPreviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },
  calcTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  calcLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  calcValMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  calcValHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  calcDiffNotice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 6,
    fontStyle: 'italic',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  submitCounterBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#15803D',
    gap: 6,
  },
  submitCounterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Decline */
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  reasonOptionActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    marginRight: 10,
  },
  radioCircleActive: {
    borderColor: '#DC2626',
    backgroundColor: '#DC2626',
  },
  reasonText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  confirmDeclineBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    gap: 6,
  },
  confirmDeclineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Accept Modal */
  acceptNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  acceptNoticeText: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 17,
    flex: 1,
    fontWeight: '500',
  },
  contractSummaryBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contractRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  contractKey: {
    fontSize: 12,
    color: '#6B7280',
  },
  contractVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  contractValMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  contractHighlightVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
  },
  pickupScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  pickupScheduleText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  confirmAcceptBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#15803D',
    gap: 6,
  },
  confirmAcceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Success Modal */
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 14,
  },
  successSub: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  successInfoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    width: '90%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  successInfoText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 20,
  },
  successActionsCol: {
    width: '90%',
    marginTop: 20,
    gap: 10,
  },
  viewInOrdersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803D',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  viewInOrdersBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stayInSellBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  stayInSellBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  /* Bulk Demands Cards */
  bulkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  bulkCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bulkBuyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  bulkAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkBuyerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  bulkTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  bulkTypeTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
    textTransform: 'uppercase',
  },
  bulkDotSeparator: {
    marginHorizontal: 4,
    color: '#9CA3AF',
    fontSize: 11,
  },
  bulkDeadline: {
    fontSize: 11,
    color: '#6B7280',
  },
  bulkUrgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  bulkUrgencyText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bulkCropBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  bulkCropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  bulkQualityText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  bulkVolumeLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  bulkVolumeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  bulkPriceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 10,
  },
  bulkPriceCol: {
    alignItems: 'center',
    flex: 1,
  },
  bulkPriceLabel: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '500',
  },
  bulkPriceValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  bulkPriceValueMuted: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  bulkPriceAdvantage: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  bulkPriceDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#BBF7D0',
  },
  bulkLogisticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  bulkLogisticsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  bulkLogisticsText: {
    fontSize: 12,
    color: '#4B5563',
  },
  bulkMatchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 8,
  },
  bulkMatchText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
  },
  bulkInventoryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 12,
  },
  bulkInventoryText: {
    fontSize: 11,
    color: '#1E40AF',
    flex: 1,
  },
  bulkActionRow: {
    marginTop: 4,
  },
  bulkSubmitQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803D',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  bulkSubmitQuoteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Quote Modal Spec Box */
  quoteSpecBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    gap: 6,
  },
  quoteSpecRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteSpecLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  quoteSpecValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  confirmQuoteBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#15803D',
    gap: 8,
  },
  confirmQuoteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
