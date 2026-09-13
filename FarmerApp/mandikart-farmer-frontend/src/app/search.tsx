/**
 * MandiKart Farmer App — Full Details Agricultural Search Screen
 *
 * Features:
 * 1. In-Bar Voice Search Toggle with speech recognition and vernacular audio detection.
 * 2. In-Bar AI Mode Switcher: Seamlessly toggle between "Mandi Search" and "Kisan AI Assistant".
 * 3. Realtime Agricultural Search: Aggregates live farmer stock, verified buyer sourcing bids,
 *    APMC mandi benchmark prices, government schemes (PM-KISAN, PMFBY, KALIA, Subhadra), and pest guides.
 * 4. Fuzzy Text Mismatch & "Did You Mean?" Autocorrect Engine:
 *    Resolves typos, phonetic variations, and vernacular terms (Hindi, Odia, Telugu, Bengali).
 * 5. Google AI Agricultural Overview with agronomical synthesis & GPS mandi localization.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  X,
  Mic,
  MicOff,
  Sparkles,
  MapPin,
  TrendingUp,
  ArrowRight,
  Landmark,
  Building2,
  Bug,
  Sprout,
  Clock,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Volume2,
} from 'lucide-react-native';
import {
  getGoogleAiSearchOverview,
  GoogleAiOverview,
} from '@/services/geminiService';
import { getCurrentFarmerLocation } from '@/services/locationService';
import { useAuthStore } from '@/store/authStore';
import { useProduceStore } from '@/store/produceStore';
import { useSellStore } from '@/store/sellStore';
import {
  executeAgriculturalSearch,
  SearchCategory,
  ComprehensiveSearchResult,
} from '@/services/searchService';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';

type FilterCategory = 'all' | 'crops' | 'buyers' | 'schemes' | 'pest';

const TRENDING_SEARCHES = [
  'Nashik Red Onion rate today',
  'Hybrid Tomato price per crate',
  'PM-Kisan 17th Kist DBT status',
  'Reliance Fresh Buyer demand',
  'PMFBY crop insurance claim 72hrs',
  'KALIA scheme Odisha apply online',
  'Stem borer remedy for Paddy',
];

export default function FullDetailsSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  // Search State
  const [query, setQuery] = useState(params.q || '');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>(
    (params.category as FilterCategory) || 'all'
  );
  const [searchMode, setSearchMode] = useState<'mandi' | 'ai'>('mandi');

  // Location State
  const [locationName, setLocationName] = useState(
    user?.district ? `${user.district}, ${user.state || 'India'}` : 'Detecting Mandi Hub...'
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Google AI Overview states
  const [aiOverview, setAiOverview] = useState<GoogleAiOverview | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Voice Search Hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetVoiceSearch,
  } = useVoiceSearch();

  // Pulse animation for active voice mic
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isListening) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, { toValue: 1.25, duration: 450, useNativeDriver: true }),
          Animated.timing(micPulseAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      micPulseAnim.setValue(1);
    }
  }, [isListening, micPulseAnim]);

  // When voice transcribed text arrives, update search input query
  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
      if (searchMode === 'ai') {
        router.push({
          pathname: '/ai-assistant',
          params: { prompt: transcript },
        });
      }
    }
  }, [transcript, searchMode, router]);

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Red Onion rate',
    'Tomato Mandi',
    'PM-Kisan',
    'Jyoti Potato',
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
      } catch {
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
  }, [user]);

  // Execute Agricultural Search with Live Produce, Buyers, Schemes & Mismatch Engine
  const { results: searchResults, didYouMean, totalCount } = useMemo(() => {
    return executeAgriculturalSearch(query, activeCategory as SearchCategory);
  }, [query, activeCategory]);

  // Fetch Google AI Overview when query changes
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setAiOverview(null);
      setIsAiLoading(false);
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
    }, 450);

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
    resetVoiceSearch();
  };

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSwitchToAiMode = () => {
    router.push({
      pathname: '/ai-assistant',
      params: query ? { prompt: query } : undefined,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* ── 1. Top Search Header Bar with Inside Voice Toggle ─────── */}
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

        {/* The Search Input Wrapper */}
        <View style={styles.searchInputWrapper}>
          <Search size={18} color="#15803D" style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.textInput}
            placeholder="Search crops, mandis, buyers, schemes..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            autoFocus={!params.q}
            returnKeyType="search"
          />

          {/* Clear Button */}
          {query.length > 0 && (
            <Pressable onPress={handleClearQuery} hitSlop={8} style={{ padding: 4 }}>
              <X size={16} color="#64748B" />
            </Pressable>
          )}

          {/* Voice Toggle Button Inside the Search Bar */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isListening ? 'Stop Voice Listening' : 'Voice Search'}
            style={({ pressed }) => [
              styles.micInsideBtn,
              isListening && styles.micInsideBtnActive,
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
            onPress={handleToggleVoice}
            hitSlop={6}
          >
            <Animated.View style={{ transform: [{ scale: micPulseAnim }] }}>
              {isListening ? (
                <MicOff size={17} color="#FFFFFF" strokeWidth={2.5} />
              ) : (
                <Mic size={17} color="#FFFFFF" strokeWidth={2.5} />
              )}
            </Animated.View>
          </Pressable>
        </View>
      </View>

      {/* ── 2. In-Bar Search vs Kisan AI Mode Switcher Strip ────── */}
      <View style={styles.modeSwitcherContainer}>
        <View style={styles.modeSegment}>
          <Pressable
            style={[styles.modeBtn, searchMode === 'mandi' && styles.modeBtnActive]}
            onPress={() => setSearchMode('mandi')}
          >
            <Search
              size={13}
              color={searchMode === 'mandi' ? '#15803D' : '#64748B'}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.modeBtnText,
                searchMode === 'mandi' && styles.modeBtnTextActive,
              ]}
            >
              Mandi Search
            </Text>
          </Pressable>

          <Pressable
            style={[styles.modeBtn, styles.modeBtnAi]}
            onPress={handleSwitchToAiMode}
          >
            <Sparkles size={13} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.modeBtnTextAi}>Ask Kisan AI</Text>
            <View style={styles.aiActiveMiniDot} />
          </Pressable>
        </View>
      </View>

      {/* ── 3. Active Voice Listening Alert Banner (When Mic is ON) ── */}
      {isListening && (
        <View style={styles.voiceActiveBanner}>
          <View style={styles.voicePulseRing}>
            <Volume2 size={16} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.voiceActiveTitle}>Listening to your voice...</Text>
            <Text style={styles.voiceActiveSub}>
              Speak in Hindi, Odia, Telugu, or English (e.g., "Pyaaz ka bhav" or "PM Kisan status")
            </Text>
          </View>
          <Pressable onPress={stopListening} style={styles.voiceStopBtn}>
            <Text style={styles.voiceStopBtnText}>Stop</Text>
          </Pressable>
        </View>
      )}

      {/* ── 4. Realtime Location Intelligence Badge ───────────────── */}
      <View style={styles.locationBar}>
        <MapPin size={13} color="#15803D" />
        <Text numberOfLines={1} style={styles.locationText}>
          {isDetectingLocation ? 'Locating nearest APMC mandi hub...' : locationName}
        </Text>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>GPS e-NAM Active</Text>
        </View>
      </View>

      {/* ── 5. Category Filter Tabs ──────────────────────────────── */}
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
                onPress={() => setActiveCategory(tab.id as FilterCategory)}
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

      {/* ── 6. Main Scrollable Content ────────────────────────────── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Did You Mean? Text Mismatch & Typo Suggestion Banner ── */}
        {didYouMean && (
          <Pressable
            style={styles.didYouMeanBanner}
            onPress={() => handleSelectSearch(didYouMean.split('(')[0].trim())}
          >
            <View style={styles.didYouMeanLeft}>
              <Sparkles size={16} color="#15803D" strokeWidth={2.4} />
              <View style={{ flex: 1 }}>
                <Text style={styles.didYouMeanTitle}>
                  Did you mean:{' '}
                  <Text style={styles.didYouMeanHighlight}>{didYouMean}</Text>?
                </Text>
                <Text style={styles.didYouMeanSubtitle}>
                  Tap to search verified agricultural data for this term
                </Text>
              </View>
            </View>
            <View style={styles.didYouMeanBtn}>
              <Text style={styles.didYouMeanBtnText}>Search</Text>
            </View>
          </Pressable>
        )}

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

            {aiOverview.keyInsights && aiOverview.keyInsights.length > 0 && (
              <View style={styles.insightsBox}>
                {aiOverview.keyInsights.map((insight, idx) => (
                  <View key={idx} style={styles.insightRow}>
                    <ShieldCheck size={14} color="#15803D" style={{ marginTop: 2 }} />
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))}
              </View>
            )}

            {aiOverview.recommendedAction?.route && (
              <Pressable
                style={styles.actionBtn}
                onPress={() => router.push(aiOverview.recommendedAction.route as any)}
              >
                <Text style={styles.actionBtnText}>{aiOverview.recommendedAction.label || 'View Details'}</Text>
                <ArrowRight size={14} color="#FFFFFF" />
              </Pressable>
            )}

            {aiOverview.relatedTopics && aiOverview.relatedTopics.length > 0 && (
              <View style={styles.relatedBox}>
                <Text style={styles.relatedTitle}>Related Agricultural Inquiries</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {aiOverview.relatedTopics.map((topic, idx) => (
                    <Pressable
                      key={idx}
                      style={styles.topicPill}
                      onPress={() => handleSelectSearch(topic)}
                    >
                      <Search size={11} color="#64748B" />
                      <Text style={styles.topicPillText}>{topic}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        ) : null}

        {/* Initial Zero-Query State: Recent Searches & Trending Topics */}
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

            {/* Trending Mandi Topics */}
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

        {/* ── Results Header ──────────────────────────────────────── */}
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsCountText}>
            {query.trim()
              ? `Found ${searchResults.length} verified matches for "${query}"`
              : `All Agricultural Categories (${totalCount})`}
          </Text>
        </View>

        {/* Results List */}
        {searchResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No exact matches found</Text>
            <Text style={styles.emptySubtitle}>
              Try typing common crop names (e.g., "Tomato", "Pyaaz", "Dhan"), schemes like "PM-Kisan",
              or ask your personal Kisan AI advisor directly.
            </Text>
            <Pressable
              style={styles.askAiCta}
              onPress={handleSwitchToAiMode}
            >
              <Sparkles size={16} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.askAiCtaText}>Ask Kisan AI Saathi Instead</Text>
            </Pressable>
          </View>
        ) : (
          searchResults.map((item: ComprehensiveSearchResult) => (
            <View key={item.id} style={styles.resultCard}>
              <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                </View>
                {item.mandiRate && (
                  <View style={styles.rateCol}>
                    <Text style={styles.cardRate}>{item.mandiRate}</Text>
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
                <View style={styles.sourceTypeBadge}>
                  <Text style={styles.sourceTypeText}>
                    {item.sourceType === 'user_produce'
                      ? '🌾 My Listed Harvest'
                      : item.sourceType === 'buyer_request'
                      ? '🏢 Verified Buyer'
                      : item.sourceType === 'govt_scheme'
                      ? '🏛️ Govt Benefit'
                      : item.sourceType === 'pest_guide'
                      ? '🩺 Agronomy Doctor'
                      : '📊 APMC Benchmark'}
                  </Text>
                </View>
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
    height: 48,
    paddingRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  micInsideBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  micInsideBtnActive: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },

  /* In-Bar Mode Switcher */
  modeSwitcherContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modeSegment: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderRadius: 11,
  },
  modeBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modeBtnTextActive: {
    color: '#15803D',
    fontWeight: '800',
  },
  modeBtnAi: {
    backgroundColor: '#15803D',
  },
  modeBtnTextAi: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  aiActiveMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#86EFAC',
  },

  /* Voice Active Banner */
  voiceActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  voicePulseRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceActiveTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  voiceActiveSub: {
    fontSize: 11,
    color: '#FEE2E2',
    marginTop: 1,
  },
  voiceStopBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  voiceStopBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#DC2626',
  },

  /* Location Bar */
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

  /* Category Filter Tabs */
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
    paddingHorizontal: 13,
    paddingVertical: 6.5,
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

  /* Scrollable Container */
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },

  /* Did You Mean Suggestion Banner */
  didYouMeanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    gap: 10,
  },
  didYouMeanLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  didYouMeanTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  didYouMeanHighlight: {
    fontWeight: '900',
    color: '#15803D',
    textDecorationLine: 'underline',
  },
  didYouMeanSubtitle: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  didYouMeanBtn: {
    backgroundColor: '#15803D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  didYouMeanBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Google AI Card */
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
    fontSize: 15.5,
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

  /* Initial State: Recent & Trending */
  initialStateBox: {
    gap: 14,
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

  /* Results Display */
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  sourceTypeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourceTypeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
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

  /* Empty State */
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
