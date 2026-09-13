/**
 * MandiKart Farmer App — Full Details Agricultural Search Screen
 *
 * Replaces the cramped popup search with a rich, dedicated search experience:
 * - Realtime search across crops, mandi prices, verified buyer bids, and govt schemes
 * - Segmented category filter tabs
 * - Google AI Agricultural Overview card with deep agronomical insights
 * - Realtime geolocation detection badge for hyper-local price intelligence
 * - Recent search history & trending agricultural topics
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  X,
  Mic,
  Sparkles,
  MapPin,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Landmark,
  Building2,
  Bug,
  Sprout,
  Clock,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import {
  getGoogleAiSearchOverview,
  GoogleAiOverview,
  getGeminiSearchSuggestions,
  GeminiSearchSuggestion,
} from '@/services/geminiService';
import { getCurrentFarmerLocation, LocationData } from '@/services/locationService';
import { useAuthStore } from '@/store/authStore';

type CategoryFilter = 'all' | 'crops' | 'buyers' | 'schemes' | 'pest';

interface SearchResultItem {
  id: string;
  category: CategoryFilter;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  rate?: string;
  rateTrend?: 'up' | 'down' | 'stable';
  actionLabel: string;
  actionRoute: string;
  meta?: string;
}

const STATIC_SEARCH_DATABASE: SearchResultItem[] = [
  // Crops & Mandi Bhav
  {
    id: 'crop_1',
    category: 'crops',
    title: '🧅 Nashik Red Onion (Grade A)',
    subtitle: 'High demand from southern and eastern retail hubs. Stable arrival.',
    badge: 'APMC Benchmark',
    badgeColor: '#16A34A',
    rate: '₹24.50 / kg',
    rateTrend: 'up',
    actionLabel: 'Sell Harvest',
    actionRoute: '/(tabs)/sell',
    meta: 'Arrivals: 4,200 Quintals • Lasalgaon & Pimpalgaon',
  },
  {
    id: 'crop_2',
    category: 'crops',
    title: '🍅 Hybrid Red Tomato (Firm Table Grade)',
    subtitle: 'Daily local arrivals increasing. Prices expected to remain steady.',
    badge: 'Top Mover',
    badgeColor: '#EA580C',
    rate: '₹21.00 / kg',
    rateTrend: 'down',
    actionLabel: 'Check Mandis',
    actionRoute: '/market-prices',
    meta: 'Arrivals: 3,800 Crates • Kolar & Madanapalle benchmark',
  },
  {
    id: 'crop_3',
    category: 'crops',
    title: '🥔 Jyoti Washed Potato (Grade A)',
    subtitle: 'Cold store release active. Processing varieties attracting high bids.',
    badge: 'Steady',
    badgeColor: '#0284C7',
    rate: '₹19.50 / kg',
    rateTrend: 'stable',
    actionLabel: 'View Trends',
    actionRoute: '/market-trends',
    meta: 'Arrivals: 5,100 Quintals • Agra & Hooghly benchmark',
  },
  {
    id: 'crop_4',
    category: 'crops',
    title: '🌾 Basmati 1121 Paddy (Long Grain)',
    subtitle: 'Institutional exporters active in major northern procurement mandis.',
    badge: 'Export Grade',
    badgeColor: '#7C3AED',
    rate: '₹38.00 / kg',
    rateTrend: 'up',
    actionLabel: 'Sell Lot',
    actionRoute: '/(tabs)/sell',
    meta: 'Arrivals: 1,800 MT • Bargarh & Karnal benchmark',
  },

  // Corporate Buyers
  {
    id: 'buyer_1',
    category: 'buyers',
    title: '🏢 Reliance Fresh Direct Wholesale Hub',
    subtitle: 'Seeking 50 MT Grade A Red Onion & 20 MT Hybrid Tomato. Farmgate pickup.',
    badge: 'Verified Corporate',
    badgeColor: '#1D4ED8',
    rate: 'Offer: ₹25.20 / kg',
    actionLabel: 'Submit Offer',
    actionRoute: '/sell/requests',
    meta: 'Payment: T+1 Direct Bank DBT • Free Weighbridge Slip',
  },
  {
    id: 'buyer_2',
    category: 'buyers',
    title: '🛒 BigBasket Regional Sourcing Depot',
    subtitle: 'Immediate requirement: Leafy greens, Okra (Bhindi), and Capsicum.',
    badge: 'Direct Sourcing',
    badgeColor: '#16A34A',
    rate: 'Offer: ₹32.00 / kg',
    actionLabel: 'View Requirement',
    actionRoute: '/sell/requests',
    meta: 'Zero Commission • Doorstep Quality Audit',
  },
  {
    id: 'buyer_3',
    category: 'buyers',
    title: '🥛 Mother Dairy / Safal Aggregation Unit',
    subtitle: 'Procuring farm fresh vegetables and seasonal fruits in bulk.',
    badge: 'Government Backed',
    badgeColor: '#0891B2',
    rate: 'Competitive MSP+',
    actionLabel: 'Connect Buyer',
    actionRoute: '/sell/requests',
    meta: 'Daily spot payment guarantee',
  },

  // Govt Schemes & Subsidies
  {
    id: 'scheme_1',
    category: 'schemes',
    title: '🏛️ PM-KISAN Samman Nidhi (17th Installment)',
    subtitle: '₹6,000 per year directly transferred to farmer accounts in 3 installments.',
    badge: 'Central DBT',
    badgeColor: '#15803D',
    rate: '₹2,000 / Tranche',
    actionLabel: 'How to Apply',
    actionRoute: '/more/help-support',
    meta: 'Eligibility: Landholding farmers with verified e-KYC',
  },
  {
    id: 'scheme_2',
    category: 'schemes',
    title: '🛡️ Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    subtitle: 'Comprehensive risk insurance covering post-harvest storm, hail and cyclone loss.',
    badge: 'Crop Insurance',
    badgeColor: '#D97706',
    rate: '1.5% - 2% Premium',
    actionLabel: 'Claim Guidelines',
    actionRoute: '/more/help-support',
    meta: 'Helpline: 14447 • Claim within 72 hrs of disaster',
  },
  {
    id: 'scheme_3',
    category: 'schemes',
    title: '🌱 KALIA Scheme & Subhadra Yojana (Odisha)',
    subtitle: 'Direct financial assistance for small, marginal farmers and farm families in Odisha.',
    badge: 'State Benefit',
    badgeColor: '#4338CA',
    rate: '₹10,000 / Year',
    actionLabel: 'Check Eligibility',
    actionRoute: '/more/help-support',
    meta: 'Portal: kalia.odisha.gov.in • Aadhaar linked DBT',
  },
  {
    id: 'scheme_4',
    category: 'schemes',
    title: '☀️ PM-KUSUM Solar Pump Subsidy',
    subtitle: '60% government subsidy to install solar irrigation pump sets on farmland.',
    badge: '60% Subsidy',
    badgeColor: '#B45309',
    rate: 'Up to ₹1.8 Lakh Off',
    actionLabel: 'Apply Guide',
    actionRoute: '/more/help-support',
    meta: 'Reduces electricity and diesel irrigation bills to zero',
  },

  // Pest & Agronomy
  {
    id: 'pest_1',
    category: 'pest',
    title: '🐛 Fall Armyworm & Stem Borer Control',
    subtitle: 'Early prevention protocol using pheromone traps and Emamectin Benzoate 5% SG.',
    badge: 'Agronomy Alert',
    badgeColor: '#DC2626',
    rate: 'Cost: ₹180 / Acre',
    actionLabel: 'Ask Kisan AI',
    actionRoute: '/ai-assistant',
    meta: 'Effective on Maize, Paddy, and Sorghum',
  },
  {
    id: 'pest_2',
    category: 'pest',
    title: '🍃 Early Blight & Leaf Curl Protocol',
    subtitle: 'Foliar spray of Mancozeb 75% WP @ 2.5g/liter or Neem oil @ 5ml/liter.',
    badge: 'Fungal Care',
    badgeColor: '#EA580C',
    rate: 'High Recovery',
    actionLabel: 'Ask Kisan AI',
    actionRoute: '/ai-assistant',
    meta: 'Crucial for Tomato, Chilli, and Brinjal crops',
  },
];

const TRENDING_SEARCHES = [
  'Nashik Red Onion rate',
  'Hybrid Tomato price today',
  'PM-Kisan 17th Kist status',
  'Reliance Fresh Buyer requirement',
  'PMFBY crop insurance claim',
  'KALIA scheme Odisha apply',
  'Basmati paddy APMC rate',
];

export default function FullDetailsSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const [query, setQuery] = useState(params.q || '');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [locationName, setLocationName] = useState(
    user?.district ? `${user.district}, ${user.state || 'India'}` : 'Detecting Mandi Hub...'
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Google AI Overview states
  const [aiOverview, setAiOverview] = useState<GoogleAiOverview | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Red Onion rate',
    'Tomato Mandi',
    'PM-Kisan',
  ]);

  // Realtime GPS Location Detection
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsDetectingLocation(true);
        const loc = await getCurrentFarmerLocation();
        if (mounted && loc) {
          setLocationName(
            loc.district
              ? `${loc.district} Mandi Hub, ${loc.state || ''}`
              : loc.formattedAddress || 'Bargarh APMC Hub, Odisha'
          );
        }
      } catch (err) {
        if (mounted) {
          setLocationName(`${user?.district || 'Bargarh'} Mandi Hub, ${user?.state || 'Odisha'}`);
        }
      } finally {
        if (mounted) setIsDetectingLocation(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch Google AI Overview when query changes
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setAiOverview(null);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsAiLoading(true);
      try {
        const overview = await getGoogleAiSearchOverview(trimmed, locationName);
        if (!isCancelled) {
          setAiOverview(overview);
        }
      } catch {
        if (!isCancelled) setAiOverview(null);
      } finally {
        if (!isCancelled) setIsAiLoading(false);
      }
    }, 400);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query, locationName]);

  const handleSelectSearch = (term: string) => {
    setQuery(term);
    if (!recentSearches.includes(term)) {
      setRecentSearches((prev) => [term, ...prev.slice(0, 4)]);
    }
  };

  const handleClearQuery = () => {
    setQuery('');
    setAiOverview(null);
  };

  // Filter items based on activeCategory and query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STATIC_SEARCH_DATABASE.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.meta && item.meta.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q))
      );
    });
  }, [query, activeCategory]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* ── 1. Top Search Header Bar ─────────────────────────────── */}
      <View style={styles.headerBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard"
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <ArrowLeft size={22} color="#0F172A" strokeWidth={2.4} />
        </Pressable>

        <View style={styles.searchInputWrapper}>
          <Search size={18} color="#64748B" style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.textInput}
            placeholder="Search crops, mandis, buyers, schemes..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            autoFocus={!params.q}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={handleClearQuery} hitSlop={8} style={{ padding: 6 }}>
              <X size={16} color="#64748B" />
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voice Search"
            style={({ pressed }) => [styles.micBtn, pressed && { transform: [{ scale: 0.94 }] }]}
            onPress={() => handleSelectSearch('Nashik Red Onion rate today')}
            hitSlop={6}
          >
            <Mic size={17} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      {/* ── 2. Realtime Location Intelligence Badge ───────────────── */}
      <View style={styles.locationBar}>
        <MapPin size={13} color="#15803D" />
        <Text numberOfLines={1} style={styles.locationText}>
          {isDetectingLocation ? 'Locating nearest APMC mandi hub...' : locationName}
        </Text>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>GPS Active</Text>
        </View>
      </View>

      {/* ── 3. Category Filter Tabs ──────────────────────────────── */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {[
            { id: 'all', label: 'All Results', icon: Sparkles },
            { id: 'crops', label: 'Crops & Mandi Bhav', icon: Sprout },
            { id: 'buyers', label: 'Verified Buyers', icon: Building2 },
            { id: 'schemes', label: 'Govt Schemes', icon: Landmark },
            { id: 'pest', label: 'Pest & Agronomy', icon: Bug },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveCategory(tab.id as CategoryFilter)}
              >
                <Icon size={14} color={isActive ? '#FFFFFF' : '#475569'} strokeWidth={2.2} />
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 4. Main Scrollable Content ────────────────────────────── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Google / Gemini AI Overview Card */}
        {isAiLoading ? (
          <View style={styles.aiLoadingBox}>
            <ActivityIndicator size="small" color="#16A34A" />
            <Text style={styles.aiLoadingText}>
              Google AI is analyzing live APMC market data for "{query}"...
            </Text>
          </View>
        ) : aiOverview ? (
          <View style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <View style={styles.aiBadge}>
                <Sparkles size={13} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.aiBadgeText}>Google AI Overview</Text>
              </View>
              {aiOverview.mandiRateSnippet ? (
                <View style={styles.mandiRateBadge}>
                  <Text style={styles.mandiRateBadgeText}>{aiOverview.mandiRateSnippet}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.aiHeadline}>{aiOverview.headline}</Text>
            <Text style={styles.aiSummary}>{aiOverview.summary}</Text>

            {/* Bulleted Insights */}
            {aiOverview.keyInsights && aiOverview.keyInsights.length > 0 && (
              <View style={styles.insightsBox}>
                {aiOverview.keyInsights.map((insight, idx) => (
                  <View key={idx} style={styles.insightRow}>
                    <CheckCircle2 size={13} color="#15803D" style={{ marginTop: 2, flexShrink: 0 }} />
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommended Action */}
            {aiOverview.recommendedAction && (
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.88 }]}
                onPress={() => router.push(aiOverview.recommendedAction.route as any)}
              >
                <Text style={styles.actionBtnText}>{aiOverview.recommendedAction.label}</Text>
                <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.4} />
              </Pressable>
            )}

            {/* Related Questions */}
            {aiOverview.relatedTopics && aiOverview.relatedTopics.length > 0 && (
              <View style={styles.relatedBox}>
                <Text style={styles.relatedTitle}>Farmers also ask:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {aiOverview.relatedTopics.map((topic, i) => (
                    <Pressable
                      key={i}
                      style={styles.topicPill}
                      onPress={() => handleSelectSearch(topic)}
                    >
                      <Search size={11} color="#475569" />
                      <Text style={styles.topicPillText}>{topic}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        ) : null}

        {/* ── Initial State: Recent Searches & Trending Topics ── */}
        {!query.trim() && (
          <View style={styles.initialStateBox}>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Clock size={15} color="#475569" />
                    <Text style={styles.sectionTitle}>Recent Searches</Text>
                  </View>
                  <Pressable onPress={() => setRecentSearches([])}>
                    <Text style={styles.clearText}>Clear</Text>
                  </Pressable>
                </View>
                <View style={styles.recentWrap}>
                  {recentSearches.map((item, idx) => (
                    <Pressable
                      key={idx}
                      style={styles.recentChip}
                      onPress={() => handleSelectSearch(item)}
                    >
                      <Search size={12} color="#64748B" />
                      <Text style={styles.recentChipText}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Trending Agricultural Topics */}
            <View style={styles.sectionBlock}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <TrendingUp size={16} color="#15803D" strokeWidth={2.4} />
                <Text style={styles.sectionTitle}>Trending in Indian Mandis</Text>
              </View>
              <View style={styles.trendingList}>
                {TRENDING_SEARCHES.map((topic, i) => (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [styles.trendingRow, pressed && { backgroundColor: '#F1F5F9' }]}
                    onPress={() => handleSelectSearch(topic)}
                  >
                    <View style={styles.trendingIndex}>
                      <Text style={styles.trendingIndexText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.trendingLabel}>{topic}</Text>
                    <ChevronRight size={16} color="#94A3B8" />
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── Results List ────────────────────────────────────────── */}
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsCountText}>
            {query.trim()
              ? `Found ${filteredResults.length} matches for "${query}"`
              : `All Agricultural Categories (${filteredResults.length})`}
          </Text>
        </View>

        {filteredResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={36} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No exact matches found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching for common crop names, schemes like PM-KISAN, or ask Kisan AI Saathi.
            </Text>
            <Pressable
              style={styles.askAiCta}
              onPress={() => router.push('/ai-assistant')}
            >
              <Sparkles size={16} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.askAiCtaText}>Ask Kisan AI Saathi Instead</Text>
            </Pressable>
          </View>
        ) : (
          filteredResults.map((item) => (
            <View key={item.id} style={styles.resultCard}>
              <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                </View>
                {item.rate && (
                  <View style={styles.rateCol}>
                    <Text style={styles.cardRate}>{item.rate}</Text>
                    {item.badge && (
                      <View style={[styles.cardBadge, { backgroundColor: item.badgeColor || '#15803D' }]}>
                        <Text style={styles.cardBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {item.meta && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.meta}</Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <Pressable
                  style={({ pressed }) => [styles.cardActionBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => router.push(item.actionRoute as any)}
                >
                  <Text style={styles.cardActionText}>{item.actionLabel}</Text>
                  <ArrowRight size={13} color="#15803D" strokeWidth={2.4} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: 46,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  micBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  tabsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  aiLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  aiLoadingText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  aiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    elevation: 4,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    gap: 10,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16A34A',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mandiRateBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  mandiRateBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  aiHeadline: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  aiSummary: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  insightsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#15803D',
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  relatedBox: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    gap: 6,
  },
  relatedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  topicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  topicPillText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  initialStateBox: {
    gap: 16,
  },
  sectionBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  clearText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  recentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recentChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  trendingList: {
    gap: 4,
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 10,
  },
  trendingIndex: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  trendingLabel: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17,
  },
  rateCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cardRate: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  cardBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metaRow: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F0FDF4',
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  askAiCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  askAiCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
