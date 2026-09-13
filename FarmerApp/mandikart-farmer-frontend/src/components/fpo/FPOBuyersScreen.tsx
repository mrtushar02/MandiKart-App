/**
 * MandiKart — FPO B2B Buyers & Institutional Contracts Screen
 *
 * Designed for FPOs to connect with corporate buyers, food processors,
 * wholesale retail chains, and commodity exporters:
 * - Direct contract farming tenders & bulk purchase requests
 * - Escrow-backed payment guarantees & short settlement cycles
 * - Active contracts tracker & delivery schedule
 * - Submit lot quotes directly to buyers
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Handshake,
  Building2,
  ShieldCheck,
  Search,
  Star,
  Clock,
  ChevronRight,
  TrendingUp,
  MapPin,
  CreditCard,
  FileCheck,
  Truck,
  CheckCircle2,
  X,
  Send,
  Sparkles,
  Layers,
} from 'lucide-react-native';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import type { FPOBuyer, FPOLot } from '@/types';

const NAVY_DEEP = '#08162B';
const NAVY_MID  = '#0F2C56';
const NAVY_FPO  = '#1A4D8E';
const FPO_BLUE = '#1B4D8E';
const FPO_BLUE_BG = '#EBF2FF';
const ACCENT_GREEN = '#15803D';

export default function FPOBuyersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [buyers, setBuyers] = useState<FPOBuyer[]>([]);
  const [lots, setLots] = useState<FPOLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuyerType, setSelectedBuyerType] = useState<string>('ALL');

  // Quote Submission Modal
  const [quoteBuyer, setQuoteBuyer] = useState<FPOBuyer | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [offeredRate, setOfferedRate] = useState<string>('');
  const [offeredQtyMT, setOfferedQtyMT] = useState<string>('');
  const [quoteNotes, setQuoteNotes] = useState<string>('');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  const fetchData = async () => {
    try {
      const [buyerRes, lotRes]: any = await Promise.all([
        apiClient.getFPOBuyers(),
        apiClient.getFPOLots(user?.fpoDetails?.fpoId),
      ]);

      if (buyerRes?.data && Array.isArray(buyerRes.data)) {
        setBuyers(buyerRes.data as FPOBuyer[]);
      }
      if (lotRes?.data && Array.isArray(lotRes.data)) {
        setLots(lotRes.data as FPOLot[]);
      }
    } catch (err) {
      console.warn('Failed to load buyers/lots:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleOpenQuote = (buyer: FPOBuyer) => {
    setQuoteBuyer(buyer);
    if (lots.length > 0) {
      setSelectedLotId(lots[0].id);
      setOfferedRate(String(lots[0].askPricePerKg || '32'));
      setOfferedQtyMT(String(Math.min(buyer.minLotMT, lots[0].estimatedQtyMT || 20)));
    }
  };

  const handleSubmitQuote = () => {
    if (!offeredRate || !offeredQtyMT) {
      Alert.alert('Required Fields', 'Please specify offered rate (₹/kg) and quantity (MT).');
      return;
    }

    setIsSubmittingQuote(true);
    setTimeout(() => {
      setIsSubmittingQuote(false);
      setQuoteBuyer(null);
      Alert.alert(
        'Quote Dispatched',
        `Your commercial quote of ₹${offeredRate}/kg for ${offeredQtyMT} MT has been submitted to ${quoteBuyer?.companyName}. The procurement officer will respond within 24 hours.`
      );
    }, 800);
  };

  const filteredBuyers = useMemo(() => {
    return buyers.filter((buyer) => {
      const matchesSearch =
        buyer.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        buyer.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        buyer.requiredCrops.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (selectedBuyerType === 'ALL') return true;
      return buyer.buyerType === selectedBuyerType;
    });
  }, [buyers, searchQuery, selectedBuyerType]);

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
            <Text style={styles.fpoOrgLabel}>Institutional B2B Network</Text>
            <Text style={styles.screenTitle}>Corporate Buyers & Tenders</Text>
          </View>
          <View style={styles.badgeCount}>
            <Handshake size={16} color="#93C5FD" />
            <Text style={styles.badgeCountText}>{buyers.length} Verified</Text>
          </View>
        </View>

        {/* ── Benefit Highlights Banner ──────────────────────── */}
        <View style={styles.benefitBanner}>
          <View style={styles.benefitItem}>
            <ShieldCheck size={16} color="#86EFAC" />
            <Text style={styles.benefitText} numberOfLines={1}>100% Escrow</Text>
          </View>
          <View style={styles.benefitDivider} />
          <View style={styles.benefitItem}>
            <CreditCard size={16} color="#93C5FD" />
            <Text style={styles.benefitText} numberOfLines={1}>T+2 Payouts</Text>
          </View>
          <View style={styles.benefitDivider} />
          <View style={styles.benefitItem}>
            <Truck size={16} color="#FDE68A" />
            <Text style={styles.benefitText} numberOfLines={1}>Buyer Transit</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Search & Buyer Type Filter ─────────────────────────── */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search crop demand (e.g. Wheat, Mustard) or company..."
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
          {[
            { id: 'ALL', label: 'All Buyers' },
            { id: 'PROCESSOR', label: 'Agro Processors & Mills' },
            { id: 'RETAIL_CHAIN', label: 'Retail & Supermarkets' },
            { id: 'INSTITUTION', label: 'Govt & Institutional' },
          ].map((tab) => {
            const isActive = selectedBuyerType === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setSelectedBuyerType(tab.id)}
              >
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Buyers List ────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={FPO_BLUE} />
          <Text style={styles.loadingText}>Connecting to B2B Procurement Desk...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={FPO_BLUE} />}
        >
          {filteredBuyers.length === 0 ? (
            <View style={styles.emptyState}>
              <Building2 size={48} color="#9CA3AF" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No Matching Buyers</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search criteria or filter tags.
              </Text>
            </View>
          ) : (
            filteredBuyers.map((buyer) => (
              <View key={buyer.id} style={styles.buyerCard}>
                {/* Top Company Info */}
                <View style={styles.buyerHeader}>
                  <View style={{ flex: 1, minWidth: 0, marginRight: 6 }}>
                    <View style={styles.buyerTagRow}>
                      {buyer.verified && (
                        <View style={styles.verifiedTag}>
                          <ShieldCheck size={12} color="#047857" />
                          <Text style={styles.verifiedText}>Verified Buyer</Text>
                        </View>
                      )}
                      <View style={styles.typeTag}>
                        <Text style={styles.typeText}>{buyer.buyerType.replace('_', ' ')}</Text>
                      </View>
                      <View style={styles.ratingBadge}>
                        <Star size={11} color="#D97706" fill="#D97706" />
                        <Text style={styles.ratingText}>{buyer.rating}</Text>
                      </View>
                    </View>
                    <Text style={styles.companyName} numberOfLines={1} ellipsizeMode="tail">{buyer.companyName}</Text>
                    <View style={styles.locRow}>
                      <MapPin size={12} color="#64748B" />
                      <Text style={styles.locText} numberOfLines={1}>{buyer.location}</Text>
                    </View>
                  </View>
                </View>

                {/* Demand Crops Pills */}
                <View style={styles.cropsSection}>
                  <Text style={styles.cropsLabel}>Purchasing Requirements:</Text>
                  <View style={styles.cropsRow}>
                    {buyer.requiredCrops.map((crop, idx) => (
                      <View key={idx} style={styles.cropPill}>
                        <Text style={styles.cropPillText}>{crop}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Terms Grid */}
                <View style={styles.termsGrid}>
                  <View style={styles.termBox}>
                    <Text style={styles.termLabel} numberOfLines={1}>Min Order Lot</Text>
                    <Text style={styles.termVal} numberOfLines={1}>{buyer.minLotMT} MT</Text>
                  </View>
                  <View style={styles.termBox}>
                    <Text style={styles.termLabel} numberOfLines={1}>Payment Term</Text>
                    <Text style={[styles.termVal, { color: ACCENT_GREEN }]} numberOfLines={1}>T+{buyer.paymentTermDays} Days</Text>
                  </View>
                  <View style={styles.termBox}>
                    <Text style={styles.termLabel} numberOfLines={1}>Completed Orders</Text>
                    <Text style={styles.termVal} numberOfLines={1}>{buyer.activeContracts}</Text>
                  </View>
                </View>

                {/* Sourcing Manager */}
                <View style={styles.contactRow}>
                  <Text style={styles.contactText}>Procurement: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{buyer.contactPerson}</Text></Text>
                </View>

                {/* CTAs */}
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.quoteBtn}
                    onPress={() => handleOpenQuote(buyer)}
                  >
                    <Send size={15} color="#FFFFFF" />
                    <Text style={styles.quoteBtnText}>Send Lot Quotation</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ── QUOTE SUBMISSION MODAL ───────────────────────────── */}
      <Modal
        visible={!!quoteBuyer}
        animationType="slide"
        transparent
        onRequestClose={() => setQuoteBuyer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {quoteBuyer && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Submit Commercial Quote</Text>
                    <Text style={styles.modalSubtitle}>To {quoteBuyer.companyName}</Text>
                  </View>
                  <Pressable onPress={() => setQuoteBuyer(null)} style={styles.closeBtn}>
                    <X size={20} color="#374151" />
                  </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.modalBody}>
                  <Text style={styles.inputLabel}>Select Your FPO Produce Lot *</Text>
                  {lots.length === 0 ? (
                    <Text style={styles.noLotsWarning}>No active lots available. Please create a lot first.</Text>
                  ) : (
                    <View style={styles.lotSelectContainer}>
                      {lots.map((lot) => {
                        const isSelected = selectedLotId === lot.id;
                        return (
                          <Pressable
                            key={lot.id}
                            style={[styles.lotOption, isSelected && styles.lotOptionSelected]}
                            onPress={() => {
                              setSelectedLotId(lot.id);
                              setOfferedRate(String(lot.askPricePerKg));
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.lotOptionTitle, isSelected && { color: FPO_BLUE, fontWeight: '800' }]}>
                                {lot.cropName} ({lot.estimatedQtyMT} MT)
                              </Text>
                              <Text style={styles.lotOptionSub}>
                                Grade {lot.grade} • Base: ₹{lot.askPricePerKg}/kg
                              </Text>
                            </View>
                            {isSelected && <CheckCircle2 size={18} color={FPO_BLUE} />}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Offered Qty (MT) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={`Min ${quoteBuyer.minLotMT} MT`}
                        keyboardType="numeric"
                        value={offeredQtyMT}
                        onChangeText={setOfferedQtyMT}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Offered Rate (₹/kg) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 34.00"
                        keyboardType="numeric"
                        value={offeredRate}
                        onChangeText={setOfferedRate}
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Commercial Terms / Quality Remarks</Text>
                  <TextInput
                    style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                    placeholder="e.g. Moisture <11%, Delivery from Bilaspur Warehouse Bay 3 within 48h of LC confirmation."
                    multiline
                    value={quoteNotes}
                    onChangeText={setQuoteNotes}
                  />

                  {offeredRate && offeredQtyMT ? (
                    <View style={styles.summaryBox}>
                      <Text style={styles.summaryLabel}>Total Estimated Contract Value:</Text>
                      <Text style={styles.summaryValue}>
                        ₹{(parseFloat(offeredRate) * parseFloat(offeredQtyMT) * 1000).toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.summarySub}>
                        Payment settled via Escrow in {quoteBuyer.paymentTermDays} days upon warehouse gate weighment.
                      </Text>
                    </View>
                  ) : null}
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable
                    style={[styles.submitQuoteBtn, isSubmittingQuote && { opacity: 0.7 }]}
                    onPress={handleSubmitQuote}
                    disabled={isSubmittingQuote}
                  >
                    {isSubmittingQuote ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Send size={16} color="#FFFFFF" />
                        <Text style={styles.submitQuoteBtnText}>Submit Quotation to Buyer</Text>
                      </>
                    )}
                  </Pressable>
                </View>
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
    marginBottom: 12,
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
  badgeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
  },
  benefitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  benefitItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  benefitText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  benefitDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  },
  buyerCard: {
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
    gap: 12,
  },
  buyerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  buyerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
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
  typeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locText: {
    fontSize: 11,
    color: '#64748B',
  },
  cropsSection: {
    gap: 4,
  },
  cropsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  cropsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cropPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cropPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  termsGrid: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  termBox: {
    flex: 1,
    alignItems: 'center',
  },
  termLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  termVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  contactRow: {
    paddingTop: 2,
  },
  contactText: {
    fontSize: 11,
    color: '#64748B',
  },
  actionRow: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  quoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: FPO_BLUE,
    paddingVertical: 10,
    borderRadius: 8,
  },
  quoteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal
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
  noLotsWarning: {
    fontSize: 12,
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 6,
  },
  lotSelectContainer: {
    gap: 8,
  },
  lotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lotOptionSelected: {
    backgroundColor: FPO_BLUE_BG,
    borderColor: FPO_BLUE,
  },
  lotOptionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  lotOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 2,
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  summarySub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  submitQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: FPO_BLUE,
    paddingVertical: 13,
    borderRadius: 8,
  },
  submitQuoteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
