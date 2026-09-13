/**
 * MandiKart — Market Prices & Agricultural Intelligence Center
 * 
 * Live APMC Mandi Benchmark Rates, Dynamic Distance Filtering,
 * Trending Crop Radar, "Compare My Produce" Price Arbitrage Engine,
 * and Actionable Strategic Farmer Improvement Advisory.
 * Powered by Google Gemini 2.5 Flash.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  RefreshControl,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X,
  Scale,
  Truck,
  Sparkles,
  Layers,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Zap,
  Flame,
  BarChart3,
  BadgePercent,
} from 'lucide-react-native';
import { MKBackground } from '@/components/ui';
import { apiClient } from '@/services/apiClient';
import { useProduceStore } from '@/store/produceStore';
import { useAuthStore } from '@/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MandiPriceRecord {
  id: string;
  cropName: string;
  variety: string;
  grade: string;
  mandiName: string;
  district: string;
  distanceKm: number;
  minPriceQtl: number;
  modalPriceQtl: number;
  maxPriceQtl: number;
  modalPriceKg: number;
  trendPct: number;
  trendDirection: 'up' | 'down';
  arrivalQtl: number;
  updatedTime: string;
  imageUri: string;
  isTrending?: boolean;
  trendTag?: string;
  demandIndex?: number;
  bestNearbyMandi?: boolean;
}

interface FarmerAdvisoryItem {
  id: string;
  category: 'ARBITRAGE' | 'TIMING' | 'GRADING' | 'DEMAND';
  title: string;
  cropName: string;
  highlightText: string;
  detail: string;
  actionText: string;
  urgency: 'HIGH' | 'MEDIUM' | 'INFO';
  estimatedBenefitPerKg?: number;
}

const DISTRICT_PRESETS = [
  'Nashik',
  'Pune',
  'Navi Mumbai',
  'Thane',
  'Ahmednagar',
  'Latur',
  'Solapur',
  'Cuttack',
  'Bargarh',
];

const CROP_FILTER_CHIPS = [
  'All Crops',
  'Onion',
  'Tomato',
  'Potato',
  'Garlic',
  'Wheat',
  'Chilli',
  'Soybean',
  'Pomegranate',
  'Ginger',
];

const DISTANCE_FILTERS = [
  { label: 'All Mandis', maxKm: 9999 },
  { label: '< 25 km', maxKm: 25 },
  { label: '< 50 km', maxKm: 50 },
  { label: '< 100 km', maxKm: 100 },
];

type ActiveTab = 'RATES' | 'TRENDING' | 'COMPARE' | 'ADVISORY';

export default function MarketPricesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Stores
  const crops = useProduceStore((state) => state.crops);
  const user = useAuthStore((state) => state.user);

  // Active state
  const [activeTab, setActiveTab] = useState<ActiveTab>('RATES');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    user?.district || 'Nashik'
  );
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('All Crops');
  const [selectedDistance, setSelectedDistance] = useState<number>(9999);
  const [onlyTrending, setOnlyTrending] = useState(false);

  // Data & loading states
  const [mandiPrices, setMandiPrices] = useState<MandiPriceRecord[]>([]);
  const [advisories, setAdvisories] = useState<FarmerAdvisoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveGemini, setIsLiveGemini] = useState(false);

  // Animation for refresh button
  const spinAnim = useRef(new Animated.Value(0)).current;

  const startSpin = useCallback(() => {
    spinAnim.setValue(0);
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const stopSpin = useCallback(() => {
    spinAnim.stopAnimation();
    spinAnim.setValue(0);
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Fetch rates and advisories
  const fetchData = useCallback(
    async (showIndicator = false) => {
      if (showIndicator) setIsLoading(true);
      try {
        const [pricesRes, advRes]: any = await Promise.all([
          apiClient.getLiveMarketPrices(undefined, selectedDistrict),
          apiClient.getMarketAdvisories(selectedDistrict),
        ]);

        if (pricesRes?.data && Array.isArray(pricesRes.data) && pricesRes.data.length > 0) {
          setMandiPrices(pricesRes.data);
          setIsLiveGemini(true);
        }

        if (advRes?.data && Array.isArray(advRes.data) && advRes.data.length > 0) {
          setAdvisories(advRes.data);
        }
      } catch (err) {
        console.warn('[MarketPrices] Data fetch notice:', err);
      } finally {
        if (showIndicator) setIsLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDistrict]
  );

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    startSpin();
    try {
      await fetchData(false);
    } finally {
      stopSpin();
      setRefreshing(false);
    }
  }, [fetchData, startSpin, stopSpin]);

  // Filtered Mandi Records
  const filteredRecords = useMemo(() => {
    return mandiPrices.filter((item) => {
      const matchSearch =
        item.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.mandiName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.variety.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCrop =
        selectedCrop === 'All Crops' ||
        item.cropName.toLowerCase().includes(selectedCrop.toLowerCase());

      const matchDistance = item.distanceKm <= selectedDistance;

      const matchTrending = onlyTrending ? item.isTrending === true : true;

      return matchSearch && matchCrop && matchDistance && matchTrending;
    });
  }, [mandiPrices, searchQuery, selectedCrop, selectedDistance, onlyTrending]);

  // Trending only records
  const trendingRecords = useMemo(() => {
    return mandiPrices.filter(
      (item) => item.isTrending === true || item.trendDirection === 'up'
    );
  }, [mandiPrices]);

  // Farmer's Produce Price Comparison Mapping
  const produceComparisonList = useMemo(() => {
    if (!crops || crops.length === 0) return [];

    return crops.map((crop) => {
      const cropNameLower = crop.cropName.toLowerCase();
      // Find matching APMC mandi record
      const matchingMandi = mandiPrices.find((m) =>
        cropNameLower.includes(m.cropName.toLowerCase()) ||
        m.cropName.toLowerCase().includes(cropNameLower)
      );

      const farmerPrice = Number(crop.expectedPricePerKg || 0);
      const mandiPrice = matchingMandi ? Number(matchingMandi.modalPriceKg) : (crop.referencePricePerKg || 25);
      const diffKg = farmerPrice - mandiPrice;
      const diffPct = mandiPrice > 0 ? (diffKg / mandiPrice) * 100 : 0;
      const stockKg = Number(crop.availableKg || crop.totalKg || 100);
      const potentialGain = diffKg * stockKg;

      let statusBadge = 'OPTIMAL';
      let statusColor = '#10B981';
      let statusText = 'Competitive Market Price';

      if (diffKg < -2) {
        statusBadge = 'UNDERPRICED';
        statusColor = '#F59E0B';
        statusText = `Opportunity: Raise by +₹${Math.abs(diffKg).toFixed(1)}/kg`;
      } else if (diffKg > 3) {
        statusBadge = 'PREMIUM';
        statusColor = '#3B82F6';
        statusText = `Premium Grade (+${diffPct.toFixed(0)}% vs APMC)`;
      }

      return {
        crop,
        matchingMandi,
        farmerPrice,
        mandiPrice,
        diffKg,
        diffPct,
        stockKg,
        potentialGain,
        statusBadge,
        statusColor,
        statusText,
      };
    });
  }, [crops, mandiPrices]);

  return (
    <MKBackground disableSafeArea>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) + 6 }]}>
        {/* ── Top Header ────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color="#111827" />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Market Prices & AI</Text>
            <View style={styles.liveSyncRow}>
              <View style={[styles.liveGreenDot, isLiveGemini && { backgroundColor: '#10B981' }]} />
              <Text style={styles.liveSyncText}>
                {isLiveGemini ? 'Gemini 2.5 Flash Grounded' : 'Live Agmarknet APMC'}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.refreshBtn, (pressed || refreshing) && { opacity: 0.6 }]}
            onPress={onRefresh}
            disabled={refreshing}
            hitSlop={8}
            accessibilityLabel="Refresh market prices"
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <RefreshCw size={18} color="#168A45" />
            </Animated.View>
          </Pressable>
        </View>

        {/* ── Location Selector Strip ───────────────────────────── */}
        <View style={styles.locationStripContainer}>
          <Pressable
            style={styles.locationButton}
            onPress={() => setIsLocationPickerOpen((prev) => !prev)}
          >
            <View style={styles.locationButtonLeft}>
              <MapPin size={15} color="#168A45" />
              <Text style={styles.locationLabel}>Your Region:</Text>
              <Text style={styles.locationActiveText}>{selectedDistrict}, MH</Text>
            </View>
            <View style={styles.locationChevronWrap}>
              <Text style={styles.locationChangeText}>Change</Text>
              {isLocationPickerOpen ? (
                <ChevronUp size={14} color="#168A45" />
              ) : (
                <ChevronDown size={14} color="#168A45" />
              )}
            </View>
          </Pressable>

          {/* District Dropdown Drawer */}
          {isLocationPickerOpen && (
            <View style={styles.districtDrawer}>
              <Text style={styles.districtDrawerTitle}>
                Select Your District (Recalculates Mandi Distances):
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.districtScroll}
              >
                {DISTRICT_PRESETS.map((dist) => {
                  const isCur = selectedDistrict === dist;
                  return (
                    <Pressable
                      key={dist}
                      style={[styles.districtChip, isCur && styles.districtChipActive]}
                      onPress={() => {
                        setSelectedDistrict(dist);
                        setIsLocationPickerOpen(false);
                      }}
                    >
                      <Text style={[styles.districtChipText, isCur && styles.districtChipTextActive]}>
                        {dist}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ── 4 Main Tabs ───────────────────────────────────────── */}
        <View style={styles.tabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            <Pressable
              style={[styles.tabButton, activeTab === 'RATES' && styles.tabButtonActive]}
              onPress={() => setActiveTab('RATES')}
            >
              <BarChart3 size={14} color={activeTab === 'RATES' ? '#FFFFFF' : '#475569'} />
              <Text style={[styles.tabText, activeTab === 'RATES' && styles.tabTextActive]}>
                Mandi Rates
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabButton, activeTab === 'TRENDING' && styles.tabButtonActive]}
              onPress={() => setActiveTab('TRENDING')}
            >
              <Flame size={14} color={activeTab === 'TRENDING' ? '#FFFFFF' : '#EA580C'} />
              <Text style={[styles.tabText, activeTab === 'TRENDING' && styles.tabTextActive]}>
                Trending Radar
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabButton, activeTab === 'COMPARE' && styles.tabButtonActive]}
              onPress={() => setActiveTab('COMPARE')}
            >
              <Scale size={14} color={activeTab === 'COMPARE' ? '#FFFFFF' : '#168A45'} />
              <Text style={[styles.tabText, activeTab === 'COMPARE' && styles.tabTextActive]}>
                Compare My Produce
              </Text>
              {crops.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{crops.length}</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={[styles.tabButton, activeTab === 'ADVISORY' && styles.tabButtonActive]}
              onPress={() => setActiveTab('ADVISORY')}
            >
              <Lightbulb size={14} color={activeTab === 'ADVISORY' ? '#FFFFFF' : '#D97706'} />
              <Text style={[styles.tabText, activeTab === 'ADVISORY' && styles.tabTextActive]}>
                Farmer Advisory
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* ── Content Based on Active Tab ───────────────────────── */}
        {activeTab === 'RATES' && (
          <>
            {/* Search Bar */}
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Search size={17} color="#64748B" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search crop, APMC mandi, or variety..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                    <X size={16} color="#64748B" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Filter Strips (Distance + Trending Switch) */}
            <View style={styles.filterStripRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterStripScroll}>
                {/* Trending Toggle Pill */}
                <Pressable
                  style={[styles.quickFilterChip, onlyTrending && styles.quickFilterChipActive]}
                  onPress={() => setOnlyTrending((p) => !p)}
                >
                  <Flame size={12} color={onlyTrending ? '#FFFFFF' : '#EA580C'} />
                  <Text style={[styles.quickFilterText, onlyTrending && styles.quickFilterTextActive]}>
                    Trending Only
                  </Text>
                </Pressable>

                {/* Distance Filter Chips */}
                {DISTANCE_FILTERS.map((df) => {
                  const isSel = selectedDistance === df.maxKm;
                  return (
                    <Pressable
                      key={df.label}
                      style={[styles.quickFilterChip, isSel && styles.quickFilterChipActive]}
                      onPress={() => setSelectedDistance(df.maxKm)}
                    >
                      <Truck size={12} color={isSel ? '#FFFFFF' : '#64748B'} />
                      <Text style={[styles.quickFilterText, isSel && styles.quickFilterTextActive]}>
                        {df.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Crop Chips */}
            <View style={styles.cropChipsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cropChipsScroll}>
                {CROP_FILTER_CHIPS.map((crop) => {
                  const isSelected = selectedCrop === crop;
                  return (
                    <Pressable
                      key={crop}
                      style={[styles.cropChip, isSelected && styles.cropChipSelected]}
                      onPress={() => setSelectedCrop(crop)}
                      hitSlop={4}
                    >
                      <Text style={[styles.cropChipText, isSelected && styles.cropChipTextSelected]}>
                        {crop}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Mandi Cards List */}
            <ScrollView
              style={styles.recordsList}
              contentContainerStyle={[styles.recordsScrollContent, { paddingBottom: insets.bottom + 40 }]}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#168A45']} />}
            >
              {filteredRecords.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Scale size={42} color="#94A3B8" style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyTitle}>No mandi rates match criteria</Text>
                  <Text style={styles.emptySub}>
                    Try expanding distance filter or selecting a different crop.
                  </Text>
                </View>
              ) : (
                filteredRecords.map((item) => {
                  const isUp = item.trendDirection === 'up';
                  return (
                    <View key={item.id} style={styles.priceCard}>
                      {/* Top Row: Photo + Name + Badges */}
                      <View style={styles.cardHeaderRow}>
                        <Image
                          source={{
                            uri:
                              item.imageUri ||
                              'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400',
                          }}
                          style={styles.cropThumb}
                        />
                        <View style={styles.cardCropDetails}>
                          <View style={styles.cropTitleRow}>
                            <Text style={styles.cropName}>{item.cropName}</Text>
                            <View style={styles.gradeBadge}>
                              <Text style={styles.gradeBadgeText}>{item.grade}</Text>
                            </View>
                          </View>
                          <Text style={styles.cropVariety}>{item.variety}</Text>
                          {item.trendTag && (
                            <View style={styles.trendTagPill}>
                              <Text style={styles.trendTagText}>{item.trendTag}</Text>
                            </View>
                          )}
                        </View>

                        <View style={[styles.trendPill, isUp ? styles.trendPillUp : styles.trendPillDown]}>
                          {isUp ? (
                            <TrendingUp size={12} color="#15803D" strokeWidth={2.4} />
                          ) : (
                            <TrendingDown size={12} color="#DC2626" strokeWidth={2.4} />
                          )}
                          <Text style={[styles.trendPillText, isUp ? styles.trendTextUp : styles.trendTextDown]}>
                            {isUp ? `+${item.trendPct}%` : `${item.trendPct}%`}
                          </Text>
                        </View>
                      </View>

                      {/* Mandi Location & Dynamic Distance Strip */}
                      <View style={styles.mandiLocationStrip}>
                        <View style={styles.locationLeft}>
                          <MapPin size={13} color="#168A45" />
                          <Text style={styles.mandiNameText}>{item.mandiName}</Text>
                          <Text style={styles.mandiDistrictText}>({item.district})</Text>
                        </View>
                        <View style={[styles.distanceBadge, item.bestNearbyMandi && styles.distanceBadgeNearby]}>
                          <Truck size={11} color={item.bestNearbyMandi ? '#15803D' : '#64748B'} />
                          <Text style={[styles.distanceText, item.bestNearbyMandi && styles.distanceTextNearby]}>
                            {item.distanceKm} km {item.bestNearbyMandi ? '• Nearby' : ''}
                          </Text>
                        </View>
                      </View>

                      {/* 3-Column Rate Strip (Min / Benchmark Modal / Max) */}
                      <View style={styles.rateBox}>
                        <View style={styles.rateCol}>
                          <Text style={styles.rateColLabel}>MIN RATE</Text>
                          <Text style={styles.rateColVal}>₹{item.minPriceQtl}</Text>
                          <Text style={styles.rateColKg}>₹{(item.minPriceQtl / 100).toFixed(1)}/kg</Text>
                        </View>

                        <View style={styles.rateDivider} />

                        <View style={styles.rateCol}>
                          <Text style={[styles.rateColLabel, { color: '#16A34A', fontWeight: '800' }]}>
                            MODAL BENCHMARK
                          </Text>
                          <Text style={[styles.rateColVal, { color: '#15803D', fontSize: 18 }]}>
                            ₹{item.modalPriceQtl}
                          </Text>
                          <Text style={[styles.rateColKg, { color: '#166534', fontWeight: '800' }]}>
                            ₹{item.modalPriceKg}/kg
                          </Text>
                        </View>

                        <View style={styles.rateDivider} />

                        <View style={styles.rateCol}>
                          <Text style={styles.rateColLabel}>MAX RATE</Text>
                          <Text style={styles.rateColVal}>₹{item.maxPriceQtl}</Text>
                          <Text style={styles.rateColKg}>₹{(item.maxPriceQtl / 100).toFixed(1)}/kg</Text>
                        </View>
                      </View>

                      {/* Footer: Arrival Volume & Sell Button */}
                      <View style={styles.cardFooterRow}>
                        <View style={styles.arrivalBox}>
                          <Clock size={12} color="#64748B" />
                          <Text style={styles.arrivalText}>
                            Arrivals: {item.arrivalQtl} Qtl • {item.updatedTime}
                          </Text>
                        </View>

                        <Pressable
                          style={({ pressed }) => [styles.sellActionBtn, pressed && { opacity: 0.85 }]}
                          onPress={() =>
                            router.push({
                              pathname: '/(tabs)/sell',
                              params: { crop: item.cropName, mandi: item.mandiName },
                            })
                          }
                          hitSlop={6}
                        >
                          <Text style={styles.sellActionBtnText}>Sell at Rate</Text>
                          <ArrowRight size={13} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}

              {/* Mandi Disclaimer Card */}
              <View style={styles.disclaimerCard}>
                <ShieldCheck size={16} color="#168A45" style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={styles.disclaimerText}>
                  Rates are benchmark APMC wholesale prices. Actual realized farm-gate prices on MandiKart may be higher based on quality grade, direct buyer bidding, and doorstep logistics.
                </Text>
              </View>
            </ScrollView>
          </>
        )}

        {/* ── Tab 2: Trending Radar ─────────────────────────────── */}
        {activeTab === 'TRENDING' && (
          <ScrollView
            style={styles.recordsList}
            contentContainerStyle={[styles.recordsScrollContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#168A45']} />}
          >
            <View style={styles.trendingIntroBanner}>
              <Flame size={20} color="#EA580C" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.trendingIntroTitle}>Realtime Market Momentum</Text>
                <Text style={styles.trendingIntroSub}>
                  High buyer velocity and surging APMC benchmark rates across Indian Mandis.
                </Text>
              </View>
            </View>

            {trendingRecords.map((item) => (
              <View key={item.id} style={styles.trendingCard}>
                <View style={styles.cardHeaderRow}>
                  <Image source={{ uri: item.imageUri }} style={styles.cropThumb} />
                  <View style={styles.cardCropDetails}>
                    <Text style={styles.cropName}>{item.cropName}</Text>
                    <Text style={styles.cropVariety}>{item.variety} • {item.mandiName}</Text>
                  </View>
                  <View style={styles.demandPill}>
                    <Zap size={11} color="#EA580C" />
                    <Text style={styles.demandPillText}>Demand: {item.demandIndex || 90}/100</Text>
                  </View>
                </View>

                <View style={styles.trendingStatsGrid}>
                  <View style={styles.trendingStatItem}>
                    <Text style={styles.trendingStatLabel}>Current Modal</Text>
                    <Text style={styles.trendingStatValue}>₹{item.modalPriceKg}/kg</Text>
                  </View>
                  <View style={styles.trendingStatItem}>
                    <Text style={styles.trendingStatLabel}>24h Trend</Text>
                    <Text style={[styles.trendingStatValue, { color: '#16A34A' }]}>
                      +{item.trendPct}%
                    </Text>
                  </View>
                  <View style={styles.trendingStatItem}>
                    <Text style={styles.trendingStatLabel}>Daily Arrivals</Text>
                    <Text style={styles.trendingStatValue}>{item.arrivalQtl} Qtl</Text>
                  </View>
                </View>

                <Pressable
                  style={styles.trendingActionBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/sell',
                      params: { crop: item.cropName, mandi: item.mandiName },
                    })
                  }
                >
                  <Text style={styles.trendingActionText}>List Harvest for Top Buyers</Text>
                  <ArrowRight size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── Tab 3: Compare My Produce ─────────────────────────── */}
        {activeTab === 'COMPARE' && (
          <ScrollView
            style={styles.recordsList}
            contentContainerStyle={[styles.recordsScrollContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#168A45']} />}
          >
            <View style={styles.compareHeaderCard}>
              <Scale size={22} color="#168A45" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.compareHeaderTitle}>Live Produce vs APMC Benchmark</Text>
                <Text style={styles.compareHeaderSub}>
                  Compare your asking prices with real-time APMC Mandi rates to maximize profit.
                </Text>
              </View>
            </View>

            {produceComparisonList.length === 0 ? (
              <View style={styles.emptyCompareCard}>
                <Layers size={44} color="#94A3B8" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No produce listed in your inventory yet</Text>
                <Text style={styles.emptySub}>
                  Add your harvest to unlock real-time price arbitrage, profit tracking, and APMC comparisons.
                </Text>
                <Pressable
                  style={styles.addProduceBtn}
                  onPress={() => router.push('/produce/add')}
                >
                  <Text style={styles.addProduceBtnText}>+ Add Produce to Inventory</Text>
                </Pressable>
              </View>
            ) : (
              produceComparisonList.map((comp) => {
                const isUnderpriced = comp.diffKg < -2;
                const isPremium = comp.diffKg > 3;

                return (
                  <View key={comp.crop.id} style={styles.compareCard}>
                    {/* Crop Header */}
                    <View style={styles.compareCardHeader}>
                      <Image
                        source={{ uri: comp.crop.imageUri || comp.matchingMandi?.imageUri }}
                        style={styles.compareThumb}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.compareCropName}>{comp.crop.cropName}</Text>
                        <Text style={styles.compareVariety}>
                          {comp.crop.variety || 'Standard Quality'} • {comp.stockKg} kg available
                        </Text>
                      </View>
                      <View style={[styles.statusBadgeWrap, { backgroundColor: `${comp.statusColor}15` }]}>
                        <Text style={[styles.statusBadgeText, { color: comp.statusColor }]}>
                          {comp.statusBadge}
                        </Text>
                      </View>
                    </View>

                    {/* Price Comparison Metric Strip */}
                    <View style={styles.compareMetricsStrip}>
                      <View style={styles.compareMetricCol}>
                        <Text style={styles.compareMetricLabel}>YOUR PRICE</Text>
                        <Text style={styles.compareMetricValue}>₹{comp.farmerPrice}/kg</Text>
                        <Text style={styles.compareMetricSub}>Total: ₹{(comp.farmerPrice * comp.stockKg).toLocaleString()}</Text>
                      </View>

                      <View style={styles.compareDivider} />

                      <View style={styles.compareMetricCol}>
                        <Text style={styles.compareMetricLabel}>APMC MODAL</Text>
                        <Text style={[styles.compareMetricValue, { color: '#16A34A' }]}>
                          ₹{comp.mandiPrice}/kg
                        </Text>
                        <Text style={styles.compareMetricSub}>
                          {comp.matchingMandi ? comp.matchingMandi.mandiName : 'Regional Mandi'}
                        </Text>
                      </View>

                      <View style={styles.compareDivider} />

                      <View style={styles.compareMetricCol}>
                        <Text style={styles.compareMetricLabel}>DIFFERENCE</Text>
                        <Text
                          style={[
                            styles.compareMetricValue,
                            { color: comp.diffKg >= 0 ? '#15803D' : '#D97706' },
                          ]}
                        >
                          {comp.diffKg >= 0 ? `+₹${comp.diffKg.toFixed(1)}` : `-₹${Math.abs(comp.diffKg).toFixed(1)}`}
                        </Text>
                        <Text style={styles.compareMetricSub}>
                          {comp.diffKg >= 0 ? `+${comp.diffPct.toFixed(0)}%` : `${comp.diffPct.toFixed(0)}%`}
                        </Text>
                      </View>
                    </View>

                    {/* Actionable Advice Pill */}
                    <View style={[styles.advicePill, { borderColor: `${comp.statusColor}40` }]}>
                      {isUnderpriced ? (
                        <AlertTriangle size={14} color="#D97706" style={{ marginRight: 6 }} />
                      ) : (
                        <CheckCircle2 size={14} color="#15803D" style={{ marginRight: 6 }} />
                      )}
                      <Text style={[styles.advicePillText, { color: comp.statusColor }]}>
                        {comp.statusText}
                      </Text>
                    </View>

                    {/* Quick Adjust & Direct Sell Actions */}
                    <View style={styles.compareActionsRow}>
                      <Pressable
                        style={styles.viewDetailsActionBtn}
                        onPress={() => router.push(`/produce/${comp.crop.id}`)}
                      >
                        <Text style={styles.viewDetailsText}>Manage Batch</Text>
                      </Pressable>

                      <Pressable
                        style={styles.directSellBtn}
                        onPress={() =>
                          router.push({
                            pathname: '/(tabs)/sell',
                            params: { crop: comp.crop.cropName },
                          })
                        }
                      >
                        <Text style={styles.directSellBtnText}>Offer to Buyers</Text>
                        <ArrowRight size={13} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* ── Tab 4: Farmer Advisory ────────────────────────────── */}
        {activeTab === 'ADVISORY' && (
          <ScrollView
            style={styles.recordsList}
            contentContainerStyle={[styles.recordsScrollContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#168A45']} />}
          >
            <View style={styles.advisoryBanner}>
              <Lightbulb size={22} color="#D97706" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.advisoryBannerTitle}>AI Strategic Advisor</Text>
                <Text style={styles.advisoryBannerSub}>
                  Tailored market intelligence to optimize farm-gate realization, arbitrage, and sell timing.
                </Text>
              </View>
            </View>

            {advisories.map((adv) => (
              <View key={adv.id} style={styles.advisoryCard}>
                <View style={styles.advisoryTopRow}>
                  <View style={styles.advisoryCategoryBadge}>
                    <Text style={styles.advisoryCategoryText}>{adv.category}</Text>
                  </View>
                  {adv.estimatedBenefitPerKg && (
                    <View style={styles.benefitPill}>
                      <BadgePercent size={12} color="#15803D" />
                      <Text style={styles.benefitPillText}>
                        Est. +₹{adv.estimatedBenefitPerKg}/kg
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.advisoryTitle}>{adv.title}</Text>
                <Text style={styles.advisoryCropTag}>Focus Crop: {adv.cropName}</Text>

                <View style={styles.advisoryHighlightBox}>
                  <Sparkles size={14} color="#168A45" style={{ marginRight: 6 }} />
                  <Text style={styles.advisoryHighlightText}>{adv.highlightText}</Text>
                </View>

                <Text style={styles.advisoryDetailText}>{adv.detail}</Text>

                <Pressable
                  style={styles.advisoryActionBtn}
                  onPress={() => router.push('/(tabs)/sell')}
                >
                  <Text style={styles.advisoryActionText}>{adv.actionText}</Text>
                  <ArrowRight size={13} color="#168A45" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </MKBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  liveSyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  liveGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  liveSyncText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Location Strip
  locationStripContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  locationButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  locationActiveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  locationChevronWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationChangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#168A45',
  },
  districtDrawer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  districtDrawerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  districtScroll: {
    gap: 6,
  },
  districtChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  districtChipActive: {
    backgroundColor: '#168A45',
    borderColor: '#168A45',
  },
  districtChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  districtChipTextActive: {
    color: '#FFFFFF',
  },

  // 4 Tabs
  tabsWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 6,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabButtonActive: {
    backgroundColor: '#0F172A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: '#168A45',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 2,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Search
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    paddingVertical: 0,
  },

  // Filter Strip
  filterStripRow: {
    marginBottom: 6,
  },
  filterStripScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickFilterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  quickFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },

  // Crop Filter Chips
  cropChipsContainer: {
    marginBottom: 8,
  },
  cropChipsScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  cropChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cropChipSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  cropChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  cropChipTextSelected: {
    color: '#FFFFFF',
  },

  // Mandi Cards List
  recordsList: {
    flex: 1,
  },
  recordsScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cropThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  cardCropDetails: {
    flex: 1,
  },
  cropTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cropName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  gradeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gradeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  cropVariety: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  trendTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  trendTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendPillUp: {
    backgroundColor: '#DCFCE7',
  },
  trendPillDown: {
    backgroundColor: '#FEE2E2',
  },
  trendPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  trendTextUp: {
    color: '#15803D',
  },
  trendTextDown: {
    color: '#DC2626',
  },

  // Location Strip Inside Card
  mandiLocationStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    marginBottom: 10,
  },
  locationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  mandiNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  mandiDistrictText: {
    fontSize: 11,
    color: '#64748B',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  distanceBadgeNearby: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  distanceTextNearby: {
    color: '#15803D',
    fontWeight: '800',
  },

  // 3-Col Rate Strip
  rateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  rateCol: {
    flex: 1,
    alignItems: 'center',
  },
  rateColLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  rateColVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  rateColKg: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rateDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },

  // Card Footer
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrivalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrivalText: {
    fontSize: 11,
    color: '#64748B',
  },
  sellActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#168A45',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  sellActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },

  // Disclaimer
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: '#166534',
  },

  // Trending Tab
  trendingIntroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  trendingIntroTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
  },
  trendingIntroSub: {
    fontSize: 11,
    color: '#9A3412',
    marginTop: 1,
  },
  trendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
    marginBottom: 12,
  },
  demandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  demandPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
  },
  trendingStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  trendingStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendingStatLabel: {
    fontSize: 10,
    color: '#78350F',
    fontWeight: '600',
  },
  trendingStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
    marginTop: 2,
  },
  trendingActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EA580C',
    borderRadius: 8,
    paddingVertical: 9,
  },
  trendingActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Compare Tab
  compareHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  compareHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  compareHeaderSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  emptyCompareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  addProduceBtn: {
    backgroundColor: '#168A45',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 14,
  },
  addProduceBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  compareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  compareCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  compareThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  compareCropName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  compareVariety: {
    fontSize: 11,
    color: '#64748B',
  },
  statusBadgeWrap: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  compareMetricsStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  compareMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  compareMetricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  compareMetricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  compareMetricSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  compareDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  advicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 10,
  },
  advicePillText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  compareActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewDetailsActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 8,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  directSellBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#168A45',
    borderRadius: 8,
    paddingVertical: 8,
  },
  directSellBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Advisory Tab
  advisoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  advisoryBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  advisoryBannerSub: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 2,
  },
  advisoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  advisoryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  advisoryCategoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  advisoryCategoryText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  benefitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  benefitPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  advisoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  advisoryCropTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  advisoryHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  advisoryHighlightText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    flex: 1,
  },
  advisoryDetailText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#475569',
    marginBottom: 10,
  },
  advisoryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  advisoryActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#168A45',
  },
});
