/**
 * MandiKart — FPO Lot Inventory Screen
 *
 * Provides FPOs with institutional-grade bulk lot management:
 * - Aggregated harvest lots across member farmers
 * - AGMARKNET grade classification (Grade A, B, C)
 * - Live buyer bids and contract progress
 * - Create new aggregated bulk lot with instant simulation fallback
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  Building2,
  Users,
  Warehouse,
  ShieldCheck,
  ChevronRight,
  X,
  FileCheck,
  Tag,
  AlertCircle,
  Eye,
  Check,
  Sparkles,
  Scale,
} from 'lucide-react-native';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import type { FPOLot, FPOLotGrade, FPOLotStatus } from '@/types';

const NAVY_DEEP = '#08162B';
const NAVY_MID  = '#0F2C56';
const NAVY_FPO  = '#1A4D8E';
const FPO_BLUE = '#1B4D8E';
const FPO_BLUE_BG = '#EBF2FF';
const ACCENT_GOLD = '#B45309';

export default function FPOInventoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [lots, setLots] = useState<FPOLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LIVE' | 'CONTRACTED' | 'DRAFT'>('ALL');

  // Create Lot Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [newGrade, setNewGrade] = useState<FPOLotGrade>('A');
  const [newQtyMT, setNewQtyMT] = useState('');
  const [newAskPrice, setNewAskPrice] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newMemberCount, setNewMemberCount] = useState('15');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Lot Details Modal
  const [selectedLot, setSelectedLot] = useState<FPOLot | null>(null);

  const fetchLots = async () => {
    try {
      const res: any = await apiClient.getFPOLots(user?.fpoDetails?.fpoId);
      if (res?.data && Array.isArray(res.data)) {
        setLots(res.data as FPOLot[]);
      }
    } catch (err) {
      console.warn('Failed to load FPO lots:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLots();
  };

  const handleCreateLot = async () => {
    if (!newCropName.trim() || !newQtyMT || !newAskPrice) {
      Alert.alert('Required Fields', 'Please enter crop name, quantity (MT), and asking price.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        cropName: newCropName.trim(),
        grade: newGrade,
        estimatedQtyMT: parseFloat(newQtyMT) || 10,
        askPricePerKg: parseFloat(newAskPrice) || 30,
        minimumBidPerKg: (parseFloat(newAskPrice) || 30) * 0.95,
        storageLocation: newLocation.trim() || 'FPO Central Godown',
        contributingMembers: parseInt(newMemberCount, 10) || 10,
        availableFromDate: new Date().toISOString().split('T')[0],
        availableToDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'LIVE' as FPOLotStatus,
      };

      const res: any = await apiClient.createFPOLot(payload);
      if (res?.data) {
        setLots((prev) => [res.data as FPOLot, ...prev]);
        setIsCreateModalOpen(false);
        setNewCropName('');
        setNewQtyMT('');
        setNewAskPrice('');
        setNewLocation('');
        Alert.alert('Lot Created', `Bulk Lot "${payload.cropName}" is now active and published for institutional buyers.`);
      }
    } catch {
      Alert.alert('Error', 'Unable to create lot at this moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalMT = useMemo(() => lots.reduce((acc, l) => acc + (l.estimatedQtyMT || 0), 0), [lots]);
  const liveCount = useMemo(() => lots.filter((l) => l.status === 'LIVE').length, [lots]);
  const contractedMT = useMemo(() => lots.filter((l) => l.status === 'CONTRACTED').reduce((acc, l) => acc + l.estimatedQtyMT, 0), [lots]);
  const totalContributingMembers = useMemo(() => lots.reduce((acc, l) => acc + (l.contributingMembers || 0), 0), [lots]);

  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      const matchesSearch =
        lot.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lot.storageLocation && lot.storageLocation.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (activeFilter === 'ALL') return true;
      return lot.status === activeFilter;
    });
  }, [lots, searchQuery, activeFilter]);

  const topInset = Math.max(insets.top, 16);

  return (
    <View style={styles.container}>
      {/* ── Top Header ─────────────────────────────────────────── */}
      <LinearGradient
        colors={[NAVY_DEEP, NAVY_MID, NAVY_FPO]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topInset }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fpoOrgLabel}>{user?.fpoDetails?.fpoName || 'Farmer Producer Org'}</Text>
            <Text style={styles.screenTitle}>Lot Inventory & Aggregation</Text>
          </View>
          <Pressable
            style={styles.createBtn}
            onPress={() => setIsCreateModalOpen(true)}
            accessibilityLabel="Create Bulk Lot"
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.4} />
            <Text style={styles.createBtnText}>New Lot</Text>
          </Pressable>
        </View>

        {/* ── KPI Strip ───────────────────────────────────────── */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue} numberOfLines={1}>{totalMT} MT</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Aggregated</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#34D399' }]} numberOfLines={1}>{liveCount} Lots</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Live Bidding</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#FDE047' }]} numberOfLines={1}>{contractedMT} MT</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Contracted</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiValue, { color: '#93C5FD' }]} numberOfLines={1}>{totalContributingMembers}</Text>
            <Text style={styles.kpiLabel} numberOfLines={1}>Farmers</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Search & Filter Controls ─────────────────────────── */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search crop, lot ID, or godown location..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={16} color="#6B7280" />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {(['ALL', 'LIVE', 'CONTRACTED', 'DRAFT'] as const).map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <Pressable
                key={tab}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                  {tab === 'ALL' ? 'All Lots' : tab === 'LIVE' ? 'Live on Market' : tab === 'CONTRACTED' ? 'Contracted' : 'Drafts'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Lots List ────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={FPO_BLUE} />
          <Text style={styles.loadingText}>Fetching FPO Aggregate Lots...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={FPO_BLUE} />}
        >
          {filteredLots.length === 0 ? (
            <View style={styles.emptyState}>
              <Warehouse size={48} color="#94A3B8" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No Bulk Lots Found</Text>
              <Text style={styles.emptySubtitle}>
                Aggregate produce from member farmers to publish high-volume lots for institutional buyers.
              </Text>
              <Pressable style={styles.emptyBtn} onPress={() => setIsCreateModalOpen(true)}>
                <Plus size={16} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.emptyBtnText}>Create First Lot</Text>
              </Pressable>
            </View>
          ) : (
            filteredLots.map((lot) => {
              const isLive = lot.status === 'LIVE';
              const isContracted = lot.status === 'CONTRACTED';

              return (
                <Pressable
                  key={lot.id}
                  style={styles.lotCard}
                  onPress={() => setSelectedLot(lot)}
                >
                  {/* Card Top Row */}
                  <View style={styles.lotTopRow}>
                    <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                      <View style={styles.lotBadgeRow}>
                        <View style={[styles.gradeBadge, { backgroundColor: lot.grade === 'A' ? '#DEF7EC' : '#FEF3C7' }]}>
                          <ShieldCheck size={13} color={lot.grade === 'A' ? '#046C4E' : '#B45309'} />
                          <Text style={[styles.gradeText, { color: lot.grade === 'A' ? '#046C4E' : '#B45309' }]}>
                            Grade {lot.grade}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, isLive ? styles.statusLive : isContracted ? styles.statusContracted : styles.statusDraft]}>
                          <Text style={[styles.statusText, isLive ? styles.textLive : isContracted ? styles.textContracted : styles.textDraft]}>
                            {lot.status}
                          </Text>
                        </View>
                        <Text style={styles.lotIdText} numberOfLines={1}>{lot.id.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.cropTitle} numberOfLines={1} ellipsizeMode="tail">{lot.cropName}</Text>
                    </View>
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyNumber}>{lot.estimatedQtyMT}</Text>
                      <Text style={styles.qtyUnit}>MT</Text>
                    </View>
                  </View>

                  {/* Pricing & Bids row */}
                  <View style={styles.priceRow}>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceItemLabel} numberOfLines={1}>FPO Ask Price</Text>
                      <Text style={styles.priceItemVal} numberOfLines={1}>₹{lot.askPricePerKg}<Text style={styles.perKg}>/kg</Text></Text>
                    </View>

                    {lot.highestBidPerKg ? (
                      <View style={styles.priceItemHighlight}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <TrendingUp size={14} color="#059669" />
                          <Text style={styles.highestBidLabel} numberOfLines={1}>Highest Bid</Text>
                        </View>
                        <Text style={styles.highestBidVal} numberOfLines={1}>₹{lot.highestBidPerKg}<Text style={styles.perKg}>/kg</Text></Text>
                        <Text style={styles.buyerName} numberOfLines={1}>by {lot.highestBidBuyer}</Text>
                      </View>
                    ) : (
                      <View style={styles.priceItem}>
                        <Text style={styles.priceItemLabel} numberOfLines={1}>Market Status</Text>
                        <Text style={styles.noBidText} numberOfLines={1}>Awaiting Quotes</Text>
                      </View>
                    )}
                  </View>

                  {/* Foot metadata */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Users size={13} color="#4B5563" />
                      <Text style={styles.metaText}>{lot.contributingMembers ?? 12} Farmers Aggregated</Text>
                    </View>
                    {lot.storageLocation && (
                      <View style={styles.metaItem}>
                        <Warehouse size={13} color="#4B5563" />
                        <Text style={styles.metaText} numberOfLines={1}>{lot.storageLocation}</Text>
                      </View>
                    )}
                  </View>

                  {/* Action Bar */}
                  <View style={styles.lotActionRow}>
                    <Text style={styles.bidsCountText}>
                      {lot.totalBids && lot.totalBids > 0 ? `🔥 ${lot.totalBids} Active Bids Placed` : 'No bids yet'}
                    </Text>
                    <View style={styles.viewLotBtn}>
                      <Text style={styles.viewLotBtnText}>Manage Lot</Text>
                      <ChevronRight size={15} color={FPO_BLUE} />
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── CREATE LOT MODAL ─────────────────────────────────── */}
      <Modal
        visible={isCreateModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Create Aggregate Lot</Text>
                <Text style={styles.modalSubtitle}>Consolidate produce from member farmers</Text>
              </View>
              <Pressable onPress={() => setIsCreateModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#374151" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.inputLabel}>Crop & Variety Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sharbati Wheat, Pusa Basmati, Mustard"
                value={newCropName}
                onChangeText={setNewCropName}
              />

              <Text style={styles.inputLabel}>AGMARKNET Quality Grade *</Text>
              <View style={styles.gradeSelectRow}>
                {(['A', 'B', 'C', 'UNGRADED'] as FPOLotGrade[]).map((grade) => (
                  <Pressable
                    key={grade}
                    style={[styles.gradeOption, newGrade === grade && styles.gradeOptionActive]}
                    onPress={() => setNewGrade(grade)}
                  >
                    <Text style={[styles.gradeOptionText, newGrade === grade && styles.gradeOptionTextActive]}>
                      Grade {grade}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Quantity (Metric Tonnes) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 40"
                    keyboardType="numeric"
                    value={newQtyMT}
                    onChangeText={setNewQtyMT}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Asking Price (₹/kg) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 34.50"
                    keyboardType="numeric"
                    value={newAskPrice}
                    onChangeText={setNewAskPrice}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Storage Godown / Yard Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Warehouse 3, Mandi Parishad Yard"
                value={newLocation}
                onChangeText={setNewLocation}
              />

              <Text style={styles.inputLabel}>Contributing Member Farmers</Text>
              <TextInput
                style={styles.input}
                placeholder="Number of farmers contributing (e.g. 24)"
                keyboardType="numeric"
                value={newMemberCount}
                onChangeText={setNewMemberCount}
              />

              <View style={styles.infoBanner}>
                <ShieldCheck size={16} color={FPO_BLUE} />
                <Text style={styles.infoBannerText}>
                  Aggregated lots are broadcasted directly to verified B2B processors, retail chains, and e-NAM buyers.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleCreateLot}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={18} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.submitBtnText}>Publish Lot to Buyers</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── LOT DETAILS MODAL ─────────────────────────────────── */}
      <Modal
        visible={!!selectedLot}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedLot(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedLot && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lotIdText}>{selectedLot.id.toUpperCase()}</Text>
                    <Text style={styles.modalTitle}>{selectedLot.cropName}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedLot(null)} style={styles.closeBtn}>
                    <X size={20} color="#374151" />
                  </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.modalBody}>
                  <View style={styles.specGrid}>
                    <View style={styles.specBox}>
                      <Text style={styles.specBoxLabel}>Quality Grade</Text>
                      <Text style={styles.specBoxVal}>Grade {selectedLot.grade}</Text>
                    </View>
                    <View style={styles.specBox}>
                      <Text style={styles.specBoxLabel}>Total Quantity</Text>
                      <Text style={styles.specBoxVal}>{selectedLot.estimatedQtyMT} MT</Text>
                    </View>
                    <View style={styles.specBox}>
                      <Text style={styles.specBoxLabel}>Ask Price</Text>
                      <Text style={styles.specBoxVal}>₹{selectedLot.askPricePerKg}/kg</Text>
                    </View>
                    <View style={styles.specBox}>
                      <Text style={styles.specBoxLabel}>Contributing Farmers</Text>
                      <Text style={styles.specBoxVal}>{selectedLot.contributingMembers ?? 16} Farmers</Text>
                    </View>
                  </View>

                  {selectedLot.highestBidPerKg && (
                    <View style={styles.leadBidBox}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.leadBidTitle}>Leading Institutional Bid</Text>
                        <View style={styles.verifiedTag}>
                          <ShieldCheck size={12} color="#046C4E" />
                          <Text style={styles.verifiedText}>Verified Buyer</Text>
                        </View>
                      </View>
                      <Text style={styles.leadBidAmount}>₹{selectedLot.highestBidPerKg} / kg</Text>
                      <Text style={styles.leadBidBuyer}>Offered by: {selectedLot.highestBidBuyer}</Text>
                      <Pressable
                        style={styles.acceptBidBtn}
                        onPress={() => {
                          Alert.alert(
                            'Accept Offer & Generate Contract',
                            `Lock in ₹${selectedLot.highestBidPerKg}/kg for ${selectedLot.estimatedQtyMT} MT with ${selectedLot.highestBidBuyer}? Total contract value: ₹${(((selectedLot.highestBidPerKg || 0) * selectedLot.estimatedQtyMT * 1000)).toLocaleString('en-IN')}`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Confirm Contract',
                                onPress: () => {
                                  setSelectedLot(null);
                                  Alert.alert('Contract Drafted', 'Contract dispatched to buyer legal team. Escrow payment link initiated.');
                                },
                              },
                            ]
                          );
                        }}
                      >
                        <CheckCircle2 size={16} color="#FFFFFF" />
                        <Text style={styles.acceptBidBtnText}>Accept Bid & Sign Contract</Text>
                      </Pressable>
                    </View>
                  )}

                  {selectedLot.notes && (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesLabel}>Grading & Quality Notes</Text>
                      <Text style={styles.notesContent}>{selectedLot.notes}</Text>
                    </View>
                  )}

                  <View style={styles.godownBox}>
                    <Warehouse size={16} color="#4B5563" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.godownLabel}>Storage Location</Text>
                      <Text style={styles.godownText}>{selectedLot.storageLocation || 'Central Yard Godown'}</Text>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  fpoOrgLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#93C5FD',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FPO_BLUE,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2,
    fontWeight: '500',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabChipActive: {
    backgroundColor: FPO_BLUE_BG,
    borderColor: FPO_BLUE,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabChipTextActive: {
    color: FPO_BLUE,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 30,
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
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FPO_BLUE,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    shadowColor: '#0F294D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lotTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  lotBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gradeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusLive: { backgroundColor: '#DEF7EC' },
  statusContracted: { backgroundColor: '#E0F2FE' },
  statusDraft: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 10, fontWeight: '800' },
  textLive: { color: '#046C4E' },
  textContracted: { color: '#0369A1' },
  textDraft: { color: '#64748B' },
  lotIdText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  qtyBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qtyNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: FPO_BLUE,
  },
  qtyUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  priceItem: {
    flex: 1,
  },
  priceItemHighlight: {
    flex: 1.2,
    backgroundColor: '#F0FDF4',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  priceItemLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  priceItemVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  perKg: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
  },
  highestBidLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  highestBidVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#047857',
  },
  buyerName: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: '500',
    marginTop: 1,
  },
  noBidText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11,
    color: '#4B5563',
  },
  lotActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F8FAFC',
  },
  bidsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: ACCENT_GOLD,
  },
  viewLotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewLotBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: FPO_BLUE,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 16,
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#111827',
  },
  gradeSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gradeOption: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gradeOptionActive: {
    backgroundColor: FPO_BLUE_BG,
    borderColor: FPO_BLUE,
  },
  gradeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  gradeOptionTextActive: {
    color: FPO_BLUE,
    fontWeight: '800',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 6,
  },
  infoBannerText: {
    fontSize: 11,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: FPO_BLUE,
    paddingVertical: 13,
    borderRadius: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  specBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specBoxLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  specBoxVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  leadBidBox: {
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
    gap: 4,
    marginVertical: 4,
  },
  leadBidTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  leadBidAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803D',
  },
  leadBidBuyer: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  acceptBidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  acceptBidBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notesBox: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  notesContent: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
  godownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
  },
  godownLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  godownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
});
