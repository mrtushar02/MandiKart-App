/**
 * MandiKart Farmer App — Home Screen (UI UX Pro Max Refinement)
 *
 * Fully refined according to farmer UX requirements:
 * 1. Farmer Profile Header: Tighter, compact (48x48 avatar, 42x42 bell), aligned more to the left
 * 2. Search Bar with Interactive Auto-Suggestions Dropdown (tap/type reveals instant crop/buyer/rates suggestions)
 * 3. Earnings Hero Card with Interactive "Financial Breakdown & Monthly Target Manager" modal
 *    - Allows farmer to dynamically change monthly target with presets & stepper
 *    - Displays itemized financial stats (Gross, Middleman Saved, Net Received, Escrow Pending)
 * 4. Elevated tactile shadows on Quick Action cards and Your Crops cards
 * 5. Important Updates section removed per request
 * 6. "High Demanded to Sell" and "Produce Recommendations" 2-sided segmented intelligence section
 *    - Side 1: Direct corporate buyer bids with 1-tap "Sell Now" navigation
 *    - Side 2: Regional crop intelligence & margin forecasts with 1-tap "Add to Produce"
 * 7. Smooth, fluid scrolling with bottom tab bar clearance (no screen sticking or cutoff)
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Bell,
  Search,
  Mic,
  Wallet,
  TrendingUp,
  Leaf,
  Sprout,
  Tag,
  Users,
  BarChart3,
  ChevronRight,
  Flame,
  ArrowRight,
  Lightbulb,
  Eye,
  EyeOff,
  X,
  Edit3,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Plus,
  Handshake,
  ArrowUpRight,
  Activity,
  PackagePlus,
  Scale,
  Zap,
  Award,
} from 'lucide-react-native';
import { MKScreen } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useProduceStore } from '@/store/produceStore';
import { useOrderStore } from '@/store/orderStore';
import { apiClient } from '@/services/apiClient';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import {
  getGeminiSearchSuggestions,
  getGoogleAiSearchOverview,
  GeminiSearchSuggestion,
  GoogleAiOverview,
} from '@/services/geminiService';
import QuickActionsRow from '@/components/home/QuickActionsRow';

const FARMER_AVATAR_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDinV_e5owfh89gPtLCA76lilmicdcRz2kVnA2Yc9o1WkX48o_T_n3jQJM14Pd5TzCDO4wlsbaGX0MQobV3MiwbDMh_K5EKRmgf0eI8pRMYw_B6wqagFKWaxqrUJIgxjDZUOYpKdhuUafcuBaY-IYqkRsWsqFJBVqY9DNpM28aWfm0Bx3cC4BIZ7XuRvUVz2QESdXpE_HWcoRfFdn7bX6n8eMifz13XnCsxdFX-ybqll4FE_idueiq4kQ';

const HERO_PLANT_BG_URI =
  'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80';

const ONION_PHOTO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCnSLJjSUyWgLdbXU3_H2F3g0FW9V1FkqNh60JzX2kcs1jUaS2rYWSwYwXwhowBfWfwhrhZjqYfxllcN5Xdcsts1A6kAt5O4LmQPny8e04Fp0y84FS6TpCEv6Ead9nuauzJ7PzfgHsXoqM7YL56z7eugidEni2b94tc7VaVKHgRQpgJqD0FmceLE7P-1C9I838IelI2xmVlACO7rX5mVD65970EQP4WrdCAJY1P_9-3zSyE78Vh_QrNBA';

const TOMATO_PHOTO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAQ3ecH_gXE_S9dnNXqZtMNZsTsKwUugK5npqrXQo96EGz87CNfJWQR-HFQcD_gqEoawXV7pG5-hAyd6KZco66Pdavo3jYBsP6NadIKCnghQ8lYLYXnuyMeQuBB2LxBykis0pTs786s14moakUB0ZH0QgH7VlNElFN4Ns5uWVxgvecQv248hBqi_2ENXcSCSj6gx8CL7fz5xwRqaIpshL2s-Xue0Qb10lRmnHBlDimQ82nr7RG_vmqfBw';

const POTATO_PHOTO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC10xdTnKHpvZre-LhDKBTaZdjrNRAMZKasKH7sJK1nrX10RGhhP2dGCyuePJimnKwCfuueO0HuC0216Hy6PAuxsQXjsHtSvKxV7SDDJosrU95YRzT4oVRjJqioCNfX15LiH_iPMrU7YeT2od9_cv81dzfyjd6LRPtPRGTt1AbXyWGTo6qD1K7KloqXwfi7HTDD6X5PP72m_RLR77_lBfwoQWyjBj1HvTxGZsl55rQEEpNHyiMzAeHoHQ';

const GARLIC_PHOTO_URI =
  'https://images.unsplash.com/photo-1615477550926-db6d36e29780?w=300&auto=format&fit=crop&q=80';

const CORN_PHOTO_URI =
  'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&auto=format&fit=crop&q=80';

const PEAS_PHOTO_URI =
  'https://images.unsplash.com/photo-1592394533824-9440e5d68530?w=300&auto=format&fit=crop&q=80';

const SEARCH_SUGGESTIONS = [
  { id: 's1', label: '🧅 Nashik Red Onion (High Demand)', type: 'crop', query: 'Onion', route: '/(tabs)/sell' },
  { id: 's2', label: '🍅 Hybrid Fresh Tomato (₹24/kg)', type: 'rate', query: 'Tomato', route: '/sell/best-options' },
  { id: 's3', label: '🏢 Reliance Fresh Sourcing Hub', type: 'buyer', query: 'Reliance', route: '/sell/requests' },
  { id: 's4', label: '🥔 Jyoti Washed Potato (Clean Table Quality)', type: 'crop', query: 'Potato', route: '/(tabs)/sell' },
  { id: 's5', label: '🌾 APMC Wheat Benchmark Rates', type: 'rate', query: 'Wheat', route: '/sell/best-options' },
  { id: 's6', label: '🚛 Farmgate Transit Vehicle Tracking', type: 'service', query: 'Tracking', route: '/orders/track-vehicle' },
];

import FPODashboard from '@/components/fpo/FPODashboard';

export default function HomeScreen() {
  const router = useRouter();
  const { user, farmer } = useAuthStore();

  // ── FPO BRANCH — render FPO Command Dashboard instead of farmer home ──────────
  if (user?.role === 'FPO') {
    return <FPODashboard />;
  }

  // Gemini AI Search & Google AI Overview State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<GeminiSearchSuggestion[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [googleAiOverview, setGoogleAiOverview] = useState<GoogleAiOverview | null>(null);
  const [isGoogleAiLoading, setIsGoogleAiLoading] = useState(false);

  // Earnings & Monthly Target State
  const [showEarningsAmount, setShowEarningsAmount] = useState(true);
  const [monthlyTarget, setMonthlyTarget] = useState(100000);
  const [tempTargetInput, setTempTargetInput] = useState('100000');
  const [earningsModalVisible, setEarningsModalVisible] = useState(false);

  // Two-Sided Intelligence Section State ('high_demand' vs 'recommendations')
  const [activeIntelTab, setActiveIntelTab] = useState<'high_demand' | 'recommendations'>('high_demand');

  // 60fps Native Driver Pulse Animation for Live Mandi Radar
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.28,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Voice Search
  const { isListening, transcript, startListening, stopListening, resetVoiceSearch } =
    useVoiceSearch();
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const orders = useOrderStore((state) => state.orders);
  const crops = useProduceStore((state) => state.crops);
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);

  const fetchDashboardStats = React.useCallback(async () => {
    try {
      const res: any = await apiClient.get('/farmers/dashboard-summary');
      if (res?.data) {
        setDashboardSummary(res.data);
      }
    } catch {}
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        useProduceStore.getState().syncWithBackend(),
        useOrderStore.getState().syncWithBackend(),
        fetchDashboardStats(),
      ]);
    } catch {}
    finally {
      setIsRefreshing(false);
    }
  };

  // Continuous 4-second real-time auto-refresh across Farmer App
  React.useEffect(() => {
    useProduceStore.getState().syncWithBackend().catch(() => {});
    useOrderStore.getState().syncWithBackend().catch(() => {});
    fetchDashboardStats();
    const timer = setInterval(() => {
      useProduceStore.getState().syncWithBackend().catch(() => {});
      useOrderStore.getState().syncWithBackend().catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchDashboardStats]);

  const farmerName =
    user?.fullName ||
    user?.firstName ||
    (user?.name ? user.name.split(' ')[0] : undefined) ||
    farmer?.fullName ||
    user?.phone ||
    'Farmer';
  const farmerLocation = (user as any)?.village
    ? `${(user as any).village}${user?.district ? `, ${user.district}` : ''}${user?.state ? `, ${user.state}` : ''}`
    : user?.district
    ? `${user.district}${user?.state ? `, ${user.state}` : ''}`
    : user?.state || farmer?.state || 'Mandi Area';

  const computedEarnings = React.useMemo(() => {
    const fromBackend = Number(dashboardSummary?.totalEarnings || 0);
    const settledFromOrders = orders
      .filter((o) => o.tab === 'Completed' || o.statusType === 'completed')
      .reduce((sum, o) => {
        const val = parseFloat((o.netPayout || o.totalValue || '0').replace(/[^0-9.]/g, '')) || 0;
        return sum + val;
      }, 0);
    return Math.max(fromBackend, settledFromOrders);
  }, [dashboardSummary, orders]);

  const totalEarningsFormatted = `₹${computedEarnings.toLocaleString('en-IN')}`;
  const targetProgressPct = Math.min(100, Math.round((computedEarnings / monthlyTarget) * 100));

  // Live Gemini AI Suggestions Effect
  React.useEffect(() => {
    let isMounted = true;
    setIsAiLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await getGeminiSearchSuggestions(searchQuery, farmerLocation);
        if (isMounted) {
          setAiSuggestions(results);
        }
      } catch {}
      finally {
        if (isMounted) setIsAiLoading(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, farmerLocation]);

  // Live Google AI Agricultural Overview Effect
  React.useEffect(() => {
    let isMounted = true;
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setGoogleAiOverview(null);
      setIsGoogleAiLoading(false);
      return;
    }

    setIsGoogleAiLoading(true);
    const timer = setTimeout(async () => {
      try {
        const overview = await getGoogleAiSearchOverview(trimmed, farmerLocation);
        if (isMounted) {
          setGoogleAiOverview(overview);
        }
      } catch (err) {
        console.warn('Google AI overview load notice:', err);
      } finally {
        if (isMounted) setIsGoogleAiLoading(false);
      }
    }, 280);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, farmerLocation]);

  // Automatically update search query when voice search detects spoken words
  React.useEffect(() => {
    if (transcript && voiceModalVisible) {
      setSearchQuery(transcript);
      setSearchFocused(true);
      const timer = setTimeout(() => {
        handleCloseVoice();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [transcript, voiceModalVisible]);

  const handleSelectSuggestion = (item: GeminiSearchSuggestion) => {
    setSearchQuery(item.query);
    setSearchFocused(false);
    router.push(item.route as any);
  };

  const handleTriggerVoice = () => {
    setVoiceModalVisible(true);
    startListening();
  };

  const handleCloseVoice = () => {
    stopListening();
    resetVoiceSearch();
    setVoiceModalVisible(false);
  };

  const handleSaveMonthlyTarget = (newVal?: number) => {
    const targetVal = newVal !== undefined ? newVal : parseInt(tempTargetInput, 10);
    if (isNaN(targetVal) || targetVal < 10000) {
      Alert.alert('Invalid Target', 'Please enter a target amount of at least ₹10,000.');
      return;
    }
    setMonthlyTarget(targetVal);
    setTempTargetInput(targetVal.toString());
    Alert.alert('Target Updated', `Your monthly earning goal is now set to ₹${targetVal.toLocaleString()}.`);
  };

  const insets = useSafeAreaInsets();
  const safeTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  ) + 10;

  return (
    <MKScreen
      scrollable
      contentContainerStyle={[
        styles.screenScrollContent,
        { paddingTop: safeTopPadding },
      ]}
      bottomClearanceExtra={24}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#16A34A"
          colors={['#16A34A']}
        />
      }
    >
      {/* ── 1. Farmer Profile Header with 3D Depth & Live Radar ────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftCol}>
          {/* Circular 3D Avatar with Glowing Border */}
          <Pressable
            style={({ pressed }) => [styles.avatarWrap, pressed && { transform: [{ scale: 0.96 }] }]}
            onPress={() => router.push('/(tabs)/more')}
          >
            <Image
              source={{ uri: user?.avatarUri || FARMER_AVATAR_URI }}
              style={styles.avatarImg}
            />
            <View style={styles.onlineBadge} />
          </Pressable>

          {/* Greeting & Location & Live Radar */}
          <View style={styles.profileTextCol}>
            <View style={styles.nameBadgeRow}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.greetingText}>
                {new Date().getHours() < 12 ? 'Subh Prabhat' : new Date().getHours() < 17 ? 'Namaste' : 'Subh Sandhya'}, {farmerName} 👋
              </Text>
            </View>
            <View style={styles.locationRow}>
              <MapPin size={12} color="#16A34A" strokeWidth={2.5} style={{ flexShrink: 0 }} />
              <Text numberOfLines={1} ellipsizeMode="tail" style={styles.locationText}>
                {farmerLocation}
              </Text>
              <View style={styles.radarPill}>
                <Animated.View style={[styles.radarDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.radarPillText}>e-NAM Live</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Circular 3D Notification Bell */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] }]}
          onPress={() => router.push('/more/notifications')}
          hitSlop={8}
        >
          <Bell size={19} color="#0F172A" strokeWidth={2.3} />
          <View style={styles.unreadDot} />
        </Pressable>
      </View>

      {/* ── 2. Full Search Screen Launchpad & Kisan AI Saathi ────── */}
      <View style={styles.searchSectionWrap}>
        {/* Full Details Search Bar Launchpad */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Full Agricultural Search"
          style={({ pressed }) => [styles.searchBarContainer, pressed && { opacity: 0.95 }]}
          onPress={() => router.push('/search')}
        >
          <Search size={21} color="#16A34A" style={styles.searchIcon} />
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 13.5, color: '#64748B', fontWeight: '500' }}>
              Search crops, mandis, buyers, schemes, pests...
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voice search"
            style={({ pressed }) => [styles.micCircleBtn, pressed && { transform: [{ scale: 0.94 }] }]}
            onPress={() => router.push('/search')}
            hitSlop={6}
          >
            <Mic size={19} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
        </Pressable>

        {/* Kisan AI Saathi Hero Card */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Kisan AI Saathi"
          style={({ pressed }) => [
            styles.kisanAiHeroCard,
            pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] },
          ]}
          onPress={() => router.push('/ai-assistant')}
        >
          <View style={styles.kisanAiTopRow}>
            <View style={styles.kisanAiBadge}>
              <Sparkles size={13} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.kisanAiBadgeText}>Kisan AI Saathi</Text>
            </View>
            <View style={styles.kisanAiLiveTag}>
              <View style={styles.kisanAiLiveDot} />
              <Text style={styles.kisanAiLiveText}>AI Agronomist Active</Text>
            </View>
          </View>

          <Text style={styles.kisanAiTitle}>Your Personal Farm & Market Advisor</Text>
          <Text style={styles.kisanAiDesc}>
            Deep crop health analysis, next crop recommendations, disaster alerts, and government schemes (PM-KISAN, PMFBY, KALIA) with multi-language voice narration.
          </Text>

          <View style={styles.kisanAiChipsRow}>
            <Pressable
              style={styles.kisanAiChip}
              onPress={() => router.push('/ai-assistant')}
            >
              <Text style={styles.kisanAiChipText}>🌾 Analyze Crops & Income</Text>
            </Pressable>
            <Pressable
              style={styles.kisanAiChip}
              onPress={() => router.push('/ai-assistant')}
            >
              <Text style={styles.kisanAiChipText}>🔮 Next Crop Advice</Text>
            </Pressable>
            <Pressable
              style={styles.kisanAiChip}
              onPress={() => router.push('/ai-assistant')}
            >
              <Text style={styles.kisanAiChipText}>⚠️ Disaster Alerts</Text>
            </Pressable>
            <Pressable
              style={styles.kisanAiChip}
              onPress={() => router.push('/ai-assistant')}
            >
              <Text style={styles.kisanAiChipText}>🏛️ Govt Schemes</Text>
            </Pressable>
          </View>
        </Pressable>
      </View>

      {/* ── Live Mandi Price Ticker (3D Floating Strip) ────── */}
      <View style={styles.tickerCard}>
        <View style={styles.tickerHeader}>
          <View style={styles.tickerTag}>
            <Activity size={12} color="#15803D" strokeWidth={2.5} />
            <Text style={styles.tickerTagText}>LIVE MANDI BENCHMARK</Text>
          </View>
          <Text style={styles.tickerTimeText}>e-NAM Updated 2m ago</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tickerScroll}
        >
          {[
            { crop: 'Sharbati Wheat', rate: '₹2,450/q', change: '+3.2%', isUp: true },
            { crop: 'Nashik Red Onion', rate: '₹1,850/q', change: '+4.5%', isUp: true },
            { crop: 'Hybrid Tomato', rate: '₹2,100/q', change: '+6.1%', isUp: true },
            { crop: 'Jyoti Potato', rate: '₹1,340/q', change: '-0.8%', isUp: false },
            { crop: 'Mustard 42% Oil', rate: '₹5,620/q', change: '+2.1%', isUp: true },
          ].map((item, idx) => (
            <Pressable
              key={idx}
              style={({ pressed }) => [styles.tickerItem, pressed && { opacity: 0.8 }]}
              onPress={() => router.push('/market-prices')}
            >
              <Text style={styles.tickerCrop}>{item.crop}</Text>
              <Text style={styles.tickerRate}>{item.rate}</Text>
              <View style={[styles.tickerBadge, item.isUp ? styles.badgeUp : styles.badgeDown]}>
                <ArrowUpRight size={10} color={item.isUp ? '#15803D' : '#DC2626'} strokeWidth={2.5} />
                <Text style={[styles.tickerChange, { color: item.isUp ? '#15803D' : '#DC2626' }]}>
                  {item.change}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── 3. Earnings Hero Card (3D Modern Fintech Card) ─────────────── */}
      <Pressable
        style={({ pressed }) => [styles.earningsCard, pressed && { opacity: 0.98 }]}
        onPress={() => setEarningsModalVisible(true)}
      >
        <LinearGradient
          colors={['#064E3B', '#047857', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.earningsGradient}
        >
          {/* Ambient Glowing Rings */}
          <View style={styles.glowRing1} />
          <View style={styles.glowRing2} />

          {/* Top Row: Total Earnings & Withdraw */}
          <View style={styles.earningsTopRow}>
            {/* Left Column */}
            <View style={styles.earningsLeftCol}>
              <View style={styles.escrowPill}>
                <ShieldCheck size={12} color="#86EFAC" strokeWidth={2.4} />
                <Text style={styles.escrowPillText}>100% Escrow Guaranteed</Text>
              </View>

              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setShowEarningsAmount(!showEarningsAmount);
                }}
                style={styles.earningsTitleRow}
                hitSlop={8}
              >
                <Text style={styles.earningsTitleText}>Total Earnings</Text>
                {showEarningsAmount ? (
                  <Eye size={14} color="#DCFCE7" />
                ) : (
                  <EyeOff size={14} color="#DCFCE7" />
                )}
              </Pressable>

              <Text style={styles.earningsAmountText}>
                {showEarningsAmount ? totalEarningsFormatted : '••••••'}
              </Text>

              <View style={styles.earningsTrendRow}>
                <TrendingUp size={13} color="#86EFAC" strokeWidth={2.5} />
                <Text style={styles.earningsTrendText}>+18.4% above local mandi</Text>
              </View>
            </View>

            {/* Right Column: Withdraw Button & Live Badge */}
            <View style={styles.earningsRightCol}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Withdraw Earnings"
                style={({ pressed }) => [styles.withdrawBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }]}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push('/earnings');
                }}
                hitSlop={8}
              >
                <Wallet size={14} color="#047857" strokeWidth={2.4} />
                <Text style={styles.withdrawBtnText}>Withdraw</Text>
                <ArrowRight size={13} color="#047857" strokeWidth={2.5} />
              </Pressable>

              <View style={styles.quoteWrap}>
                <Sprout size={12} color="#86EFAC" style={{ marginTop: 1 }} />
                <Text style={styles.quoteText}>Direct to bank · 0% cut</Text>
              </View>
            </View>
          </View>

          {/* Bottom Inset Container: Monthly Target */}
          <View style={styles.monthlyTargetContainer}>
            <View style={styles.targetHeaderRow}>
              <View style={styles.targetTitleLeft}>
                <View style={styles.targetLeafWrap}>
                  <Leaf size={11} color="#86EFAC" strokeWidth={2.4} />
                </View>
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.targetTitleText}>Seasonal Target</Text>
                <View style={styles.editTargetMiniTag}>
                  <Edit3 size={10} color="#DCFCE7" />
                  <Text style={styles.editTargetMiniText}>Set</Text>
                </View>
              </View>
              <Text numberOfLines={1} style={styles.targetAmountText}>
                {totalEarningsFormatted} / ₹{monthlyTarget.toLocaleString()}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${targetProgressPct}%` }]} />
              </View>
              <Text style={styles.progressPctText}>{targetProgressPct}%</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>

      {/* ── 4. Quick Actions (3D Tactile Pastel Canvas Cards) ───────── */}
      <QuickActionsRow />

      {/* ── 5. Your Crops (3D Harvest Showcase) ── */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Your Harvest & Stock</Text>
          <Text style={styles.sectionSubtitle}>Assayed & Ready to Sell</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/produce')}>
          <Text style={styles.seeAllText}>View All ({crops.length || 3}) →</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cropRowScroll}
      >
        {/* Onion Card */}
        <Pressable
          style={({ pressed }) => [styles.crop3DCard, pressed && styles.cardPressed]}
          onPress={() => router.push('/(tabs)/produce')}
        >
          <Image source={{ uri: ONION_PHOTO_URI }} style={styles.crop3DThumb} />
          <View style={styles.crop3DContent}>
            <View style={styles.cropGradeBadge}>
              <Text style={styles.cropGradeText}>Grade A</Text>
            </View>
            <Text numberOfLines={1} style={styles.crop3DName}>Nashik Red Onion</Text>
            <Text style={styles.crop3DQty}>1,000 kg available</Text>
            <View style={styles.cropPriceRow}>
              <Text style={styles.crop3DPrice}>₹24/kg</Text>
              <Text style={styles.crop3DVal}>Est. ₹24,000</Text>
            </View>
          </View>
        </Pressable>

        {/* Tomato Card */}
        <Pressable
          style={({ pressed }) => [styles.crop3DCard, pressed && styles.cardPressed]}
          onPress={() => router.push('/(tabs)/produce')}
        >
          <Image source={{ uri: TOMATO_PHOTO_URI }} style={styles.crop3DThumb} />
          <View style={styles.crop3DContent}>
            <View style={styles.cropGradeBadge}>
              <Text style={styles.cropGradeText}>Fresh Harvest</Text>
            </View>
            <Text numberOfLines={1} style={styles.crop3DName}>Hybrid Tomato</Text>
            <Text style={styles.crop3DQty}>500 kg available</Text>
            <View style={styles.cropPriceRow}>
              <Text style={styles.crop3DPrice}>₹28/kg</Text>
              <Text style={styles.crop3DVal}>Est. ₹14,000</Text>
            </View>
          </View>
        </Pressable>

        {/* Potato Card */}
        <Pressable
          style={({ pressed }) => [styles.crop3DCard, pressed && styles.cardPressed]}
          onPress={() => router.push('/(tabs)/produce')}
        >
          <Image source={{ uri: POTATO_PHOTO_URI }} style={styles.crop3DThumb} />
          <View style={styles.crop3DContent}>
            <View style={styles.cropGradeBadge}>
              <Text style={styles.cropGradeText}>Table Grade</Text>
            </View>
            <Text numberOfLines={1} style={styles.crop3DName}>Jyoti Potato</Text>
            <Text style={styles.crop3DQty}>800 kg available</Text>
            <View style={styles.cropPriceRow}>
              <Text style={styles.crop3DPrice}>₹18/kg</Text>
              <Text style={styles.crop3DVal}>Est. ₹14,400</Text>
            </View>
          </View>
        </Pressable>

        {/* Add Crop Card */}
        <Pressable
          style={({ pressed }) => [styles.addCrop3DCard, pressed && styles.cardPressed]}
          onPress={() => router.push('/produce/add' as any)}
        >
          <View style={styles.addCropCircle}>
            <Plus size={22} color="#15803D" strokeWidth={2.4} />
          </View>
          <Text style={styles.addCropTitle}>Add New Crop</Text>
          <Text style={styles.addCropSub}>List for instant buyer bids</Text>
        </Pressable>
      </ScrollView>

      {/* ── 6. Two-Sided Market Intelligence Section ────────── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Best Opportunity for You</Text>
      </View>

      <View style={styles.intelHeaderBlock}>
        <View style={styles.segmentedToggleContainer}>
          <Pressable
            style={[styles.segmentBtn, activeIntelTab === 'high_demand' && styles.segmentBtnActive]}
            onPress={() => setActiveIntelTab('high_demand')}
          >
            <Flame size={14} color={activeIntelTab === 'high_demand' ? '#EA580C' : '#64748B'} strokeWidth={2.4} />
            <Text style={[styles.segmentBtnText, activeIntelTab === 'high_demand' && styles.segmentBtnTextActive]}>
              High Demanded to Sell
            </Text>
          </Pressable>

          <Pressable
            style={[styles.segmentBtn, activeIntelTab === 'recommendations' && styles.segmentBtnActive]}
            onPress={() => setActiveIntelTab('recommendations')}
          >
            <Sparkles size={14} color={activeIntelTab === 'recommendations' ? '#168A45' : '#64748B'} strokeWidth={2.4} />
            <Text style={[styles.segmentBtnText, activeIntelTab === 'recommendations' && styles.segmentBtnTextActive]}>
              Produce Recommendations
            </Text>
          </Pressable>
        </View>
      </View>

      {/* SIDE 1: High Demanded to Sell Cards */}
      {activeIntelTab === 'high_demand' ? (
        <View style={styles.intelCardsContainer}>
          {/* Card 1: Onion */}
          <View style={styles.oppCard}>
            <View style={styles.oppTopRow}>
              <Image source={{ uri: ONION_PHOTO_URI }} style={styles.oppCropThumb} />
              <View style={styles.oppHeaderInfo}>
                <Text numberOfLines={1} style={styles.oppCropTitle}>Onion • Grade A</Text>
                <Text numberOfLines={1} style={styles.oppCropSubtitle}>Nashik Red Garwa Variety</Text>
              </View>
              <View style={styles.oppBadgePill}>
                <Flame size={12} color="#EA580C" strokeWidth={2.5} />
                <Text style={styles.oppBadgeText}>Very High</Text>
              </View>
            </View>

            <View style={styles.oppRateBox}>
              <View style={styles.oppRateCol}>
                <Text style={styles.oppRateTag}>NET FARMER RATE</Text>
                <Text style={styles.oppRateVal}>
                  ₹22.00 <Text style={styles.oppRateUnit}>/kg</Text>
                </Text>
              </View>
              <View style={styles.oppRateDivider} />
              <View style={styles.oppRateCol}>
                <Text style={styles.oppBenchmarkTag}>Mandi Benchmark</Text>
                <Text style={styles.oppBenchmarkVal}>
                  ₹24.00 <Text style={styles.oppBenchmarkUnit}>/kg</Text>
                </Text>
              </View>
            </View>

            <View style={styles.oppBottomRow}>
              <View style={styles.buyersPill}>
                <ShieldCheck size={14} color="#168A45" strokeWidth={2.4} />
                <Text style={styles.buyersPillText}>18 Active Buyers</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.sellHarvestBtn, pressed && { opacity: 0.9 }]}
                onPress={() => router.push('/(tabs)/sell')}
              >
                <Text style={styles.sellHarvestBtnText}>Sell Harvest</Text>
                <ArrowRight size={13} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>

          {/* Card 2: Hybrid Tomato */}
          <View style={styles.oppCard}>
            <View style={styles.oppTopRow}>
              <Image source={{ uri: TOMATO_PHOTO_URI }} style={styles.oppCropThumb} />
              <View style={styles.oppHeaderInfo}>
                <Text numberOfLines={1} style={styles.oppCropTitle}>Hybrid Tomato • Grade A</Text>
                <Text numberOfLines={1} style={styles.oppCropSubtitle}>Semi-Ripe Fresh Harvest</Text>
              </View>
              <View style={styles.oppBadgePill}>
                <Flame size={12} color="#EA580C" strokeWidth={2.5} />
                <Text style={styles.oppBadgeText}>High</Text>
              </View>
            </View>

            <View style={styles.oppRateBox}>
              <View style={styles.oppRateCol}>
                <Text style={styles.oppRateTag}>NET FARMER RATE</Text>
                <Text style={styles.oppRateVal}>
                  ₹21.50 <Text style={styles.oppRateUnit}>/kg</Text>
                </Text>
              </View>
              <View style={styles.oppRateDivider} />
              <View style={styles.oppRateCol}>
                <Text style={styles.oppBenchmarkTag}>Mandi Benchmark</Text>
                <Text style={styles.oppBenchmarkVal}>
                  ₹23.00 <Text style={styles.oppBenchmarkUnit}>/kg</Text>
                </Text>
              </View>
            </View>

            <View style={styles.oppBottomRow}>
              <View style={styles.buyersPill}>
                <ShieldCheck size={14} color="#168A45" strokeWidth={2.4} />
                <Text style={styles.buyersPillText}>14 Active Buyers</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.sellHarvestBtn, pressed && { opacity: 0.9 }]}
                onPress={() => router.push('/(tabs)/sell')}
              >
                <Text style={styles.sellHarvestBtnText}>Sell Harvest</Text>
                <ArrowRight size={13} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        /* SIDE 2: Produce Recommendations Cards */
        <View style={styles.intelCardsContainer}>
          {/* Recommendation 1: Garlic */}
          <View style={styles.oppCard}>
            <View style={styles.oppTopRow}>
              <Image source={{ uri: GARLIC_PHOTO_URI }} style={styles.oppCropThumb} />
              <View style={styles.oppHeaderInfo}>
                <Text numberOfLines={1} style={styles.oppCropTitle}>Garlic (Ooty Hybrid) • Grade A</Text>
                <Text numberOfLines={1} style={styles.oppCropSubtitle}>High Export Demand • 90 Days Cycle</Text>
              </View>
              <View style={[styles.oppBadgePill, { backgroundColor: '#F3E8FF' }]}>
                <TrendingUp size={12} color="#7C3AED" strokeWidth={2.5} />
                <Text style={[styles.oppBadgeText, { color: '#7C3AED' }]}>+42% Margin</Text>
              </View>
            </View>

            <View style={styles.oppRateBox}>
              <View style={styles.oppRateCol}>
                <Text style={styles.oppRateTag}>EST. HARVEST RATE</Text>
                <Text style={styles.oppRateVal}>
                  ₹180.00 <Text style={styles.oppRateUnit}>/kg</Text>
                </Text>
              </View>
              <View style={styles.oppRateDivider} />
              <View style={styles.oppRateCol}>
                <Text style={styles.oppBenchmarkTag}>Mandi Benchmark</Text>
                <Text style={styles.oppBenchmarkVal}>
                  ₹150.00 <Text style={styles.oppBenchmarkUnit}>/kg</Text>
                </Text>
              </View>
            </View>

            <View style={styles.oppBottomRow}>
              <View style={styles.buyersPill}>
                <ShieldCheck size={14} color="#168A45" strokeWidth={2.4} />
                <Text style={styles.buyersPillText}>22 Active Buyers</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.sellHarvestBtn, pressed && { opacity: 0.9 }]}
                onPress={() =>
                  router.push({
                    pathname: '/produce/add',
                    params: {
                      cropName: 'Garlic',
                      variety: 'Ooty Hybrid',
                      category: 'Vegetables',
                      grade: 'Grade A',
                      price: '180',
                      imageUri: GARLIC_PHOTO_URI,
                      mandi: 'Nashik APMC Mandi',
                    },
                  })
                }
              >
                <Plus size={14} color="#FFFFFF" strokeWidth={2.8} />
                <Text style={styles.sellHarvestBtnText}>Add Crop</Text>
              </Pressable>
            </View>
          </View>

          {/* Recommendation 2: Baby Corn */}
          <View style={styles.oppCard}>
            <View style={styles.oppTopRow}>
              <Image source={{ uri: CORN_PHOTO_URI }} style={styles.oppCropThumb} />
              <View style={styles.oppHeaderInfo}>
                <Text numberOfLines={1} style={styles.oppCropTitle}>Baby Corn (Golden Sweet) • Grade A</Text>
                <Text numberOfLines={1} style={styles.oppCropSubtitle}>Quick Turnaround • 60 Days Harvest</Text>
              </View>
              <View style={[styles.oppBadgePill, { backgroundColor: '#FEF3C7' }]}>
                <TrendingUp size={12} color="#D97706" strokeWidth={2.5} />
                <Text style={[styles.oppBadgeText, { color: '#D97706' }]}>+35% Margin</Text>
              </View>
            </View>

            <View style={styles.oppRateBox}>
              <View style={styles.oppRateCol}>
                <Text style={styles.oppRateTag}>EST. HARVEST RATE</Text>
                <Text style={styles.oppRateVal}>
                  ₹65.00 <Text style={styles.oppRateUnit}>/kg</Text>
                </Text>
              </View>
              <View style={styles.oppRateDivider} />
              <View style={styles.oppRateCol}>
                <Text style={styles.oppBenchmarkTag}>Mandi Benchmark</Text>
                <Text style={styles.oppBenchmarkVal}>
                  ₹52.00 <Text style={styles.oppBenchmarkUnit}>/kg</Text>
                </Text>
              </View>
            </View>

            <View style={styles.oppBottomRow}>
              <View style={styles.buyersPill}>
                <ShieldCheck size={14} color="#168A45" strokeWidth={2.4} />
                <Text style={styles.buyersPillText}>16 Active Buyers</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.sellHarvestBtn, pressed && { opacity: 0.9 }]}
                onPress={() =>
                  router.push({
                    pathname: '/produce/add',
                    params: {
                      cropName: 'Baby Corn',
                      variety: 'Golden Sweet',
                      category: 'Vegetables',
                      grade: 'Grade A',
                      price: '65',
                      imageUri: CORN_PHOTO_URI,
                      mandi: 'Pimpalgaon Mandi Hub',
                    },
                  })
                }
              >
                <Plus size={14} color="#FFFFFF" strokeWidth={2.8} />
                <Text style={styles.sellHarvestBtnText}>Add Crop</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* ── 7. Live APMC Mandi Rates ─────────────────────────── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Live APMC Mandi Rates</Text>
        <Pressable onPress={() => router.push('/market-trends')} hitSlop={8}>
          <Text style={styles.priceTrendsText}>Price Trends</Text>
        </Pressable>
      </View>

      <View style={styles.mandiRatesCard}>
        <View style={styles.mandiRatesHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={16} color="#168A45" strokeWidth={2.4} />
            <Text style={styles.mandiRatesTitle}>Nashik & Pune APMC Benchmarks</Text>
          </View>
          <View style={styles.liveAgmarknetBadge}>
            <View style={styles.liveGreenDot} />
            <Text style={styles.liveAgmarknetText}>Live Agmarknet</Text>
          </View>
        </View>

        <View style={styles.mandiRatesGrid}>
          <View style={styles.mandiRateCol}>
            <Text style={styles.mandiCropName}>Nashik Red Onion</Text>
            <Text style={styles.mandiPrice}>₹2,450 <Text style={styles.mandiUnit}>/q</Text></Text>
            <Text style={[styles.mandiTrendText, { color: '#16A34A' }]}>▲ +4.2% today</Text>
          </View>
          <View style={styles.mandiDivider} />
          <View style={styles.mandiRateCol}>
            <Text style={styles.mandiCropName}>Tomato Hybrid</Text>
            <Text style={styles.mandiPrice}>₹1,820 <Text style={styles.mandiUnit}>/q</Text></Text>
            <Text style={[styles.mandiTrendText, { color: '#DC2626' }]}>▼ -1.5% today</Text>
          </View>
          <View style={styles.mandiDivider} />
          <View style={styles.mandiRateCol}>
            <Text style={styles.mandiCropName}>Potato Jyoti</Text>
            <Text style={styles.mandiPrice}>₹1,540 <Text style={styles.mandiUnit}>/q</Text></Text>
            <Text style={[styles.mandiTrendText, { color: '#16A34A' }]}>▲ +2.1% today</Text>
          </View>
        </View>
      </View>

      {/* ── 8. Weather & Harvest Advisory ────────────────────── */}
      <View style={styles.weatherCard}>
        <View style={styles.weatherHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 18 }}>☀️</Text>
            <Text style={styles.weatherTitle}>Weather & Harvest Advisory</Text>
          </View>
          <View style={styles.weatherBadge}>
            <Text style={styles.weatherBadgeText}>29°C Sunny</Text>
          </View>
        </View>
        <Text style={styles.weatherSub}>
          Sunny conditions expected for next 72 hours with 42% humidity. Optimal conditions for onion drying and open field harvest.
        </Text>
      </View>

      {/* ── 7. Interactive Earnings & Monthly Target Modal ──── */}
      <Modal
        visible={earningsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEarningsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.earningsModalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Wallet size={20} color="#168A45" strokeWidth={2.4} />
                <Text style={styles.modalTitle}>Financial Intelligence</Text>
              </View>
              <Pressable onPress={() => setEarningsModalVisible(false)} hitSlop={10}>
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Gross vs Net Breakdown Cards */}
              <View style={styles.financialStatsBox}>
                <Text style={styles.financialSectionHeading}>This Month Performance</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Realized Sales</Text>
                  <Text style={styles.statVal}>₹56,200</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Direct MandiKart Benefit (Zero Middleman)</Text>
                  <Text style={[styles.statVal, { color: '#168A45' }]}>+ ₹7,700 Saved</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Transit Fees & Weighbridge</Text>
                  <Text style={[styles.statVal, { color: '#DC2626' }]}>- ₹0.00 (Free Pickup)</Text>
                </View>
                <View style={styles.dividerLine} />
                <View style={styles.statRow}>
                  <Text style={styles.statTotalLabel}>Net Farmer Take-Home</Text>
                  <Text style={styles.statTotalVal}>₹48,500</Text>
                </View>
              </View>

              {/* Set New Monthly Target Section */}
              <View style={styles.targetSetterCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Leaf size={16} color="#168A45" />
                  <Text style={styles.targetSetterTitle}>Update Monthly Target</Text>
                </View>
                <Text style={styles.targetSetterSub}>
                  Set your personal revenue goal to track sales motivation and progress.
                </Text>

                {/* Target Value Input */}
                <View style={styles.targetInputRow}>
                  <Text style={styles.targetRupeeSymbol}>₹</Text>
                  <TextInput
                    style={styles.targetTextInput}
                    keyboardType="numeric"
                    value={tempTargetInput}
                    onChangeText={setTempTargetInput}
                    placeholder="100000"
                  />
                </View>

                {/* Quick Target Presets */}
                <Text style={styles.presetLabel}>Quick Presets:</Text>
                <View style={styles.presetsRow}>
                  {[75000, 100000, 150000, 200000].map((val) => (
                    <Pressable
                      key={val}
                      style={[
                        styles.presetPill,
                        monthlyTarget === val && styles.presetPillActive,
                      ]}
                      onPress={() => {
                        setTempTargetInput(val.toString());
                        handleSaveMonthlyTarget(val);
                      }}
                    >
                      <Text style={[styles.presetText, monthlyTarget === val && styles.presetTextActive]}>
                        ₹{(val / 1000)}k
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Save Target CTA */}
                <Pressable
                  style={styles.saveTargetBtn}
                  onPress={() => {
                    handleSaveMonthlyTarget();
                    setEarningsModalVisible(false);
                  }}
                >
                  <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.saveTargetBtnText}>Save Target Goal</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── 8. Voice Search Modal (Interactive with Direct Vernacular Prompts) ── */}
      <Modal
        visible={voiceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseVoice}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseVoice}>
          <Pressable style={styles.voiceModalCard} onPress={(e) => e.stopPropagation()}>
            <Animated.View style={[styles.voiceMicGlow, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.voiceMicCircle}>
              <Mic size={36} color="#FFFFFF" strokeWidth={2.4} />
            </View>

            <Text style={styles.voiceModalTitle}>
              {transcript ? 'Voice Captured!' : 'Listening for your voice...'}
            </Text>
            <Text style={styles.voiceModalHint}>
              {transcript
                ? `Searching Google AI for "${transcript}"...`
                : 'Speak in Hindi, English, Marathi, or Odia (e.g. "प्याज का भाव", "Tomato rates")'}
            </Text>

            {transcript ? (
              <View style={styles.transcriptBox}>
                <CheckCircle2 size={16} color="#16A34A" />
                <Text style={styles.transcriptText}>"{transcript}"</Text>
              </View>
            ) : null}

            {/* Quick Tap Voice Prompt Chips */}
            <View style={styles.quickVoicePromptWrap}>
              <Text style={styles.quickVoicePromptTitle}>Or tap a sample voice query:</Text>
              <View style={styles.quickVoiceGrid}>
                {[
                  { text: '🧅 प्याज का भाव', query: 'Onion Mandi Rates' },
                  { text: '🍅 टमाटर Pimpalgaon Rate', query: 'Tomato Price' },
                  { text: '🥔 आलू Buyer Demand', query: 'Potato Buyers' },
                  { text: '🌾 गेहूं MSP 2026', query: 'Wheat MSP' },
                  { text: '⚡ PM Kisan योजना', query: 'PM Kisan Subsidy' },
                ].map((chip, idx) => (
                  <Pressable
                    key={idx}
                    style={styles.quickVoicePill}
                    onPress={() => {
                      setSearchQuery(chip.query);
                      setSearchFocused(true);
                      handleCloseVoice();
                    }}
                  >
                    <Text style={styles.quickVoicePillText}>{chip.text}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable style={styles.voiceCloseBtn} onPress={handleCloseVoice}>
              <Text style={styles.voiceCloseBtnText}>Done / Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Floating Kisan AI Saathi Quick Access FAB ── */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ask Kisan AI Saathi"
        style={({ pressed }) => [
          styles.floatingAiFab,
          pressed && { transform: [{ scale: 0.94 }], opacity: 0.9 },
        ]}
        onPress={() => router.push('/ai-assistant')}
      >
        <Sparkles size={18} color="#FFFFFF" strokeWidth={2.4} />
        <Text style={styles.floatingAiFabText}>Kisan AI</Text>
      </Pressable>
    </MKScreen>
  );
}

const styles = StyleSheet.create({
  screenScrollContent: {
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },

  /* ── 1. Farmer Profile Header (Shifted Left & Compact) ── */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    position: 'relative',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#E2E8F0',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#16A34A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileTextCol: {
    marginLeft: 10,
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greetingText: {
    fontSize: 18.5,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  radarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginLeft: 4,
  },
  radarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  radarPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  unreadDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  /* ── 2. Search Section & Suggestions ── */
  searchSectionWrap: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 10,
  },
  kisanAiHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    padding: 16,
    marginTop: 12,
    elevation: 4,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    gap: 8,
  },
  kisanAiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kisanAiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16A34A',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  kisanAiBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  kisanAiLiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  kisanAiLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  kisanAiLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  kisanAiTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  kisanAiDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  kisanAiChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  kisanAiChip: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  kisanAiChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  floatingAiFab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#15803D',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    zIndex: 99,
  },
  floatingAiFabText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  searchBarContainerFocused: {
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
    shadowColor: '#10B981',
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 0,
  },
  micCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    elevation: 3,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D1E7DD',
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    elevation: 10,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E5A2A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionsCloseText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  googleAiLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  googleAiLoadingText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
    flex: 1,
  },
  googleAiOverviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  googleAiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  googleAiGradientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E5A2A',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  googleAiBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rateSnippetBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rateSnippetText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  googleAiHeadline: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  googleAiSummary: {
    fontSize: 13,
    lineHeight: 19,
    color: '#334155',
    marginBottom: 10,
  },
  googleAiInsightsList: {
    gap: 6,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  googleAiInsightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  googleAiInsightText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#1E293B',
    fontWeight: '500',
    flex: 1,
  },
  googleAiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#168A45',
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 10,
  },
  googleAiActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  relatedTopicsRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  relatedTopicsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  topicChipText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
  },
  subSuggestionsHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 10,
  },
  suggestionLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },

  /* ── Live Mandi Price Ticker (3D Floating Strip) ── */
  tickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 18,
    elevation: 5,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  tickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tickerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tickerTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  tickerTimeText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tickerScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  tickerItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 120,
  },
  tickerCrop: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  tickerRate: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  tickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 3,
  },
  badgeUp: {
    backgroundColor: '#DCFCE7',
  },
  badgeDown: {
    backgroundColor: '#FEE2E2',
  },
  tickerChange: {
    fontSize: 9.5,
    fontWeight: '800',
  },

  /* ── 3. Earnings Hero Card (3D Modern Fintech) ── */
  earningsCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 22,
    elevation: 8,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  earningsGradient: {
    padding: 22,
    position: 'relative',
  },
  glowRing1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  glowRing2: {
    position: 'absolute',
    bottom: -50,
    left: 60,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
  },
  escrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  escrowPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DCFCE7',
  },
  earningsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  earningsLeftCol: {
    flex: 1,
  },
  earningsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  earningsTitleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#DCFCE7',
  },
  earningsAmountText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 3,
    letterSpacing: -0.5,
  },
  earningsTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  earningsTrendText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#86EFAC',
  },
  earningsRightCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  withdrawBtn: {
    backgroundColor: '#FFFFFF',
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  withdrawBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#047857',
  },
  quoteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  quoteText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#DCFCE7',
    textAlign: 'right',
  },
  monthlyTargetContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  targetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetLeafWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetTitleText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  editTargetMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 5,
  },
  editTargetMiniText: {
    fontSize: 10,
    color: '#DCFCE7',
    fontWeight: '700',
  },
  targetAmountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 4,
  },
  progressPctText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── Headers & Section Titles ── */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },

  /* ── 4. Quick Actions (Tactile 3D Cards 2x2 Grid) ── */
  quickGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 22,
  },
  action3DCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    justifyContent: 'space-between',
    minHeight: 126,
    position: 'relative',
  },
  actionIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    marginTop: 8,
  },
  actionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionSub: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  actionArrowCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionTagGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionTagTextGreen: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
  },
  actionTagAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionTagTextAmber: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },
  actionTagBlue: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionTagTextBlue: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  actionTagPurple: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionTagTextPurple: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6D28D9',
  },

  /* ── 5. Your Crops (3D Harvest Showcase) ── */
  cropRowScroll: {
    gap: 12,
    paddingRight: 8,
    marginBottom: 22,
  },
  crop3DCard: {
    width: 168,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    elevation: 4,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    gap: 6,
  },
  crop3DThumb: {
    width: '100%',
    height: 96,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  crop3DContent: {
    gap: 2,
  },
  cropGradeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  cropGradeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
  },
  crop3DName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  crop3DQty: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cropPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  crop3DPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#15803D',
  },
  crop3DVal: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  addCrop3DCard: {
    width: 145,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addCropCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCropTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
    textAlign: 'center',
  },
  addCropSub: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },

  /* ── 6. Two-Sided Intelligence Segmented Section ── */
  intelHeaderBlock: {
    marginBottom: 12,
  },
  segmentedToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 13,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  intelCardsContainer: {
    gap: 14,
    marginBottom: 20,
  },

  /* Opportunity & Recommendation Card (Modern 3D Elevation - Enlarged) */
  oppCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
  },
  oppTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  oppCropThumb: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  oppHeaderInfo: {
    marginLeft: 14,
    flex: 1,
  },
  oppCropTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  oppCropSubtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  oppBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
  },
  oppBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#EA580C',
  },
  oppRateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#DCFCE7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  oppRateCol: {
    flex: 1,
  },
  oppRateTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  oppRateVal: {
    fontSize: 21,
    fontWeight: '900',
    color: '#111827',
    marginTop: 2,
  },
  oppRateUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  oppRateDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#BBF7D0',
    marginHorizontal: 16,
  },
  oppBenchmarkTag: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  oppBenchmarkVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  oppBenchmarkUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  oppBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buyersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF3',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.2,
    borderColor: '#BBF7D0',
  },
  buyersPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  sellHarvestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#168A45',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    elevation: 3,
    shadowColor: '#168A45',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
  },
  sellHarvestBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── 7. Live APMC Mandi Rates (Enlarged) ── */
  mandiRatesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 18,
    elevation: 5,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  mandiRatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mandiRatesTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveAgmarknetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
  },
  liveGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
  },
  liveAgmarknetText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#15803D',
  },
  mandiRatesGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mandiRateCol: {
    flex: 1,
    alignItems: 'center',
  },
  mandiCropName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  mandiPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 3,
  },
  mandiUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  mandiTrendText: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  mandiDivider: {
    width: 1,
    height: 42,
    backgroundColor: '#E2E8F0',
  },
  priceTrendsText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#15803D',
  },

  /* ── 8. Weather & Harvest Advisory (Enlarged) ── */
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weatherTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  weatherBadge: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  weatherBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
  weatherSub: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#334155',
    lineHeight: 20,
  },

  /* ── 7. Earnings Breakdown & Target Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    justifyContent: 'flex-end',
  },
  earningsModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EBE1',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  financialStatsBox: {
    backgroundColor: '#F8FAF6',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8DC',
    padding: 14,
    marginBottom: 16,
  },
  financialSectionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  statLabel: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '600',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 8,
  },
  statTotalLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  statTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803D',
  },
  targetSetterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2D9CC',
    padding: 14,
    marginBottom: 20,
  },
  targetSetterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  targetSetterSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 16,
  },
  targetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  targetRupeeSymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16A34A',
    marginRight: 6,
  },
  targetTextInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  presetLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetPill: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetPillActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  presetText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  presetTextActive: {
    color: '#15803D',
    fontWeight: '800',
  },
  saveTargetBtn: {
    backgroundColor: '#168A45',
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveTargetBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ── 8. Voice Search Modal ── */
  voiceModalCard: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  voiceMicCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  voiceModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  voiceModalHint: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  transcriptBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 14,
  },
  transcriptText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#168A45',
    textAlign: 'center',
  },
  voiceCloseBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  voiceCloseBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  voiceMicGlow: {
    position: 'absolute',
    top: 20,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(22, 163, 74, 0.18)',
  },
  quickVoicePromptWrap: {
    width: '100%',
    marginTop: 10,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quickVoicePromptTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'center',
  },
  quickVoiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  quickVoicePill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 16,
  },
  quickVoicePillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#15803D',
  },
  cardPressed: {
    opacity: 0.78,
  },
});
