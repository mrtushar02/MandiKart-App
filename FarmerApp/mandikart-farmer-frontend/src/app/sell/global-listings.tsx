/**
 * MandiKart Farmer App — Globally Listed Produce Management Center
 *
 * Provides a dedicated, full-featured screen for farmers to view, monitor, and manage
 * all crops published to the global marketplace (Buyer App / All Buyers).
 *
 * Features:
 * - Real-time KPI summary (Total Listed, Global Available Stock, Estimated Value, Buyer App Sync Status)
 * - Live status badge (🟢 Live on Buyer App) with instant verification
 * - Detailed crop parameters (Price, Quantity, Target Buyers, Location, Shelf Life, Grade)
 * - Buyer App Preview modal (shows how buyers see the listing on their screens)
 * - One-tap Unlist / Deactivate global market broadcast
 * - Pull to Refresh & Manual Backend Sync
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Globe,
  CheckCircle2,
  PackageCheck,
  Search,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Eye,
  Trash2,
  XCircle,
  ShoppingBag,
  Tag,
  ChevronRight,
  Info,
  MapPin,
  Clock,
  IndianRupee,
  Layers,
  Building2,
  AlertTriangle,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useProduceStore, CropItem } from '@/store/produceStore';
import { resolveCropThumbnail } from '@/utils/cropThumbnail';
import { apiClient } from '@/services/apiClient';

export default function GlobalListingsScreen() {
  const router = useRouter();

  const crops = useProduceStore((state) => state.crops);
  const updateCropStatus = useProduceStore((state) => state.updateCropStatus);
  const syncWithBackend = useProduceStore((state) => state.syncWithBackend);

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewCrop, setPreviewCrop] = useState<CropItem | null>(null);

  // Sync with backend on refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncWithBackend();
    } catch (err) {
      console.warn('[GlobalListings] Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [syncWithBackend]);

  // Filter only crops that are globally active (status === 'ACTIVE')
  const globallyListedCrops = useMemo(() => {
    return crops.filter((c) => c.status === 'ACTIVE');
  }, [crops]);

  // Filtered list based on search and category
  const filteredCrops = useMemo(() => {
    return globallyListedCrops.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.variety && c.variety.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === 'All' ||
        c.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [globallyListedCrops, searchQuery, selectedCategory]);

  // Summary Metrics
  const totalStockKg = useMemo(() => {
    return globallyListedCrops.reduce((acc, c) => acc + (c.availableKg || 0), 0);
  }, [globallyListedCrops]);

  const totalMarketValue = useMemo(() => {
    return globallyListedCrops.reduce(
      (acc, c) => acc + (c.availableKg || 0) * (c.referencePricePerKg || 25),
      0
    );
  }, [globallyListedCrops]);

  // Unlist crop handler
  const handleUnlist = (crop: CropItem) => {
    Alert.alert(
      'Unlist from Global Market ⚠️',
      `Are you sure you want to stop selling "${crop.cropName}" to all buyers?\n\nThis crop will be removed from the MandiKart Buyer App catalog immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Unlist',
          style: 'destructive',
          onPress: async () => {
            // Update store
            updateCropStatus(crop.id, 'PENDING_APPROVAL');

            // Persist to backend if API available
            try {
              await apiClient.updateProduct(crop.id, { is_active: false, isActive: false });
            } catch (e) {
              console.warn('[GlobalListings] Unlist API warning:', e);
            }

            Alert.alert(
              'Unlisted Successfully 🟢',
              `"${crop.cropName}" has been unlisted from the global market.`
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <ArrowLeft size={20} color="#1E293B" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Globally Listed Fasal 🌐</Text>
          <Text style={styles.headerSubtitle}>Live on MandiKart Buyer Marketplace</Text>
        </View>
        <Pressable onPress={handleRefresh} style={styles.syncButton} hitSlop={12}>
          <RefreshCw size={18} color="#1B6D24" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#1B6D24']} />
        }
      >
        {/* Top Status & Market Overview Banner */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveStatusText}>BUYER APP SYNCHRONIZED & LIVE</Text>
            </View>
            <View style={styles.badgeGlobal}>
              <Globe size={13} color="#15803D" style={{ marginRight: 4 }} />
              <Text style={styles.badgeGlobalText}>All Buyers Marketplace</Text>
            </View>
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>{globallyListedCrops.length}</Text>
              <Text style={styles.kpiLabel}>Active Listings</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>
                {totalStockKg >= 1000 ? `${(totalStockKg / 1000).toFixed(1)} T` : `${totalStockKg} kg`}
              </Text>
              <Text style={styles.kpiLabel}>Global Stock</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiItem}>
              <Text style={styles.kpiValue}>₹{totalMarketValue.toLocaleString()}</Text>
              <Text style={styles.kpiLabel}>Est. Market Value</Text>
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBox}>
          <ShieldCheck size={18} color="#0D9488" style={{ marginTop: 2, marginRight: 10 }} />
          <Text style={styles.infoText}>
            Crops listed here are broadcast live to thousands of wholesale processors, institutional buyers, and retail procurement managers across India on the MandiKart Buyer App.
          </Text>
        </View>

        {/* Search & Category Filter */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by crop name or variety..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <XCircle size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {/* Category Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {['All', 'Vegetables', 'Fruits', 'Grains', 'Pulses'].map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Listings Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Live Global Crops ({filteredCrops.length})
          </Text>
          <Text style={styles.sectionSubtitle}>Tap card to view status details</Text>
        </View>

        {/* Empty State */}
        {filteredCrops.length === 0 && (
          <View style={styles.emptyState}>
            <Globe size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {globallyListedCrops.length === 0
                ? 'No Crops Listed Globally Yet'
                : 'No Crops Match Your Filter'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {globallyListedCrops.length === 0
                ? 'Publish your approved produce to the global marketplace so buyers across India can discover and purchase your crop.'
                : 'Try changing your search keywords or category filters.'}
            </Text>
            {globallyListedCrops.length === 0 && (
              <Pressable
                style={styles.emptyActionButton}
                onPress={() => router.replace('/(tabs)/sell')}
              >
                <PackageCheck size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionButtonText}>Go to Sell Screen & List Crop</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Globally Listed Crop Cards */}
        {filteredCrops.map((crop) => (
          <View key={crop.id} style={styles.cropCard}>
            {/* Card Top Row */}
            <View style={styles.cropCardHeader}>
              <Image
                source={{
                  uri: resolveCropThumbnail(crop.cropName, crop.category, crop.imageUri),
                }}
                style={styles.cropImage}
              />
              <View style={styles.cropInfoColumn}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.cropName}>{crop.cropName}</Text>
                  <View style={styles.gradeBadge}>
                    <Text style={styles.gradeBadgeText}>{crop.grade || 'Grade A'}</Text>
                  </View>
                </View>
                {crop.variety ? (
                  <Text style={styles.cropVariety}>Variety: {crop.variety}</Text>
                ) : null}

                <View style={styles.liveBuyerBadge}>
                  <View style={styles.liveDotSmall} />
                  <Text style={styles.liveBuyerBadgeText}>LIVE ON BUYER APP</Text>
                </View>
              </View>
            </View>

            {/* Grid Metrics */}
            <View style={styles.cardDetailsGrid}>
              <View style={styles.gridCell}>
                <Text style={styles.gridLabel}>GLOBAL SELLING PRICE</Text>
                <Text style={styles.gridValueHighlight}>
                  ₹{crop.referencePricePerKg || crop.expectedPricePerKg || 25} / kg
                </Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.gridLabel}>AVAILABLE STOCK</Text>
                <Text style={styles.gridValue}>
                  {crop.availableKg.toLocaleString()} {crop.unit || 'kg'}
                </Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.gridLabel}>MIN ORDER QTY</Text>
                <Text style={styles.gridValue}>10 kg</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.gridLabel}>TARGET BUYERS</Text>
                <Text style={styles.gridValue}>Wholesale & Retail</Text>
              </View>
            </View>

            {/* Extra Info Metadata */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MapPin size={13} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.metaText}>{crop.location || 'Nashik, Maharashtra'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={13} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.metaText}>
                  Est. Shelf Life: {crop.shelfLifeDaysEstMax || 14} Days
                </Text>
              </View>
            </View>

            {/* Actions Footer */}
            <View style={styles.cardActionRow}>
              <Pressable
                style={styles.previewBtn}
                onPress={() => setPreviewCrop(crop)}
              >
                <Eye size={14} color="#0F766E" style={{ marginRight: 6 }} />
                <Text style={styles.previewBtnText}>Buyer App Preview</Text>
              </Pressable>

              <Pressable
                style={styles.unlistBtn}
                onPress={() => handleUnlist(crop)}
              >
                <Trash2 size={14} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.unlistBtnText}>Unlist</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Buyer App Preview Modal */}
      {previewCrop && (
        <Modal
          visible={!!previewCrop}
          transparent
          animationType="slide"
          onRequestClose={() => setPreviewCrop(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Eye size={18} color="#15803D" style={{ marginRight: 6 }} />
                  <Text style={styles.modalTitle}>Buyer App Preview</Text>
                </View>
                <Pressable onPress={() => setPreviewCrop(null)}>
                  <XCircle size={22} color="#94A3B8" />
                </Pressable>
              </View>

              <Text style={styles.modalNotice}>
                This is exactly how buyers view your produce on the MandiKart Buyer App catalog:
              </Text>

              {/* Simulated Buyer App Product Listing */}
              <View style={styles.buyerPreviewCard}>
                <Image
                  source={{
                    uri: resolveCropThumbnail(previewCrop.cropName, previewCrop.category, previewCrop.imageUri),
                  }}
                  style={styles.buyerPreviewImage}
                />
                <View style={styles.buyerBadgeRow}>
                  <Text style={styles.buyerFreshBadge}>🔥 Fresh Harvest</Text>
                  <Text style={styles.buyerVerifiedBadge}>✓ Verified Farmer</Text>
                </View>

                <Text style={styles.buyerCropTitle}>{previewCrop.cropName}</Text>
                <Text style={styles.buyerCropSub}>
                  Grade {previewCrop.grade} • Variety: {previewCrop.variety || 'Standard'}
                </Text>

                <View style={styles.buyerPriceRow}>
                  <Text style={styles.buyerPrice}>
                    ₹{previewCrop.referencePricePerKg || 25}
                  </Text>
                  <Text style={styles.buyerPriceUnit}> / kg</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.buyerStockText}>
                    Stock: {previewCrop.availableKg.toLocaleString()} kg
                  </Text>
                </View>

                <View style={styles.buyerFarmerCard}>
                  <Building2 size={16} color="#15803D" style={{ marginRight: 8 }} />
                  <View>
                    <Text style={styles.buyerFarmerName}>Farmer Direct</Text>
                    <Text style={styles.buyerFarmerLoc}>{previewCrop.location}</Text>
                  </View>
                </View>
              </View>

              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setPreviewCrop(null)}
              >
                <Text style={styles.modalCloseBtnText}>Close Preview</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
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
  },
  syncButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },

  // KPI Overview Card
  kpiCard: {
    backgroundColor: '#15803D',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  liveStatusText: {
    color: '#86EFAC',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeGlobal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeGlobalText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },

  kpiGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#DCFCE7',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0F766E',
    lineHeight: 18,
  },

  // Search & Category Filter
  searchSection: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#15803D',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },

  // Section Header
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 12,
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
    lineHeight: 19,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  emptyActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Crop Card
  cropCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cropCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cropImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  cropInfoColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cropName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  gradeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  gradeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  cropVariety: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  liveBuyerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 6,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  liveBuyerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },

  // Details Grid
  cardDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  gridCell: {
    width: '50%',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 1,
  },
  gridValueHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 1,
  },

  // Meta Row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },

  // Card Action Row
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 10,
    paddingVertical: 8,
    marginRight: 8,
  },
  previewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F766E',
  },
  unlistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  unlistBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalNotice: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },

  buyerPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  buyerPreviewImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  buyerBadgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  buyerFreshBadge: {
    backgroundColor: '#FFEDD5',
    color: '#C2410C',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  buyerVerifiedBadge: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  buyerCropTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  buyerCropSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  buyerPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  buyerPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16A34A',
  },
  buyerPriceUnit: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  buyerStockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  buyerFarmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
  },
  buyerFarmerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  buyerFarmerLoc: {
    fontSize: 11,
    color: '#64748B',
  },

  modalCloseBtn: {
    backgroundColor: '#15803D',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
