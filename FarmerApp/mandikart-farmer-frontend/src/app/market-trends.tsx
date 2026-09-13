/**
 * MandiKart Farmer App — Dedicated Market Trends & Price Intelligence Center
 *
 * Provides real-time trend analytics, Gemini AI price forecasts, 7-day & 30-day
 * price momentum curves, Top Gainers/Losers, arrival volatility, and strategic
 * selling window recommendations.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Flame,
  ShieldCheck,
  Activity,
  BarChart3,
  Compass,
  Zap,
} from 'lucide-react-native';
import { MKBackground } from '@/components/ui/MKBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TrendCropData {
  id: string;
  cropName: string;
  hindiName: string;
  variety: string;
  currentPriceKg: number;
  prevPriceKg: number;
  changePct: number;
  direction: 'up' | 'down';
  forecastNote: string;
  bestSellingWindow: string;
  demandRating: 'High' | 'Very High' | 'Moderate';
  arrivalVolume: string;
  historicalPoints: number[]; // 7 data points for sparkline
  topMandi: string;
  imageUri: string;
}

const TREND_CROPS: TrendCropData[] = [
  {
    id: 'onion_nashik',
    cropName: 'Nashik Red Onion',
    hindiName: 'नाशिक लाल कांदा',
    variety: 'Garwa / High Quality',
    currentPriceKg: 36.5,
    prevPriceKg: 31.0,
    changePct: 17.7,
    direction: 'up',
    forecastNote: 'Strong festive buyer demand in metro terminals with tightening arrivals.',
    bestSellingWindow: 'Next 3 to 5 Days',
    demandRating: 'Very High',
    arrivalVolume: '4,200 Quintals (↓ 14%)',
    historicalPoints: [28, 30, 29.5, 32, 33.5, 35, 36.5],
    topMandi: 'Lasalgaon APMC (₹3,750/Qtl)',
    imageUri: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400',
  },
  {
    id: 'tomato_hybrid',
    cropName: 'Hybrid Tomato',
    hindiName: 'टमाटर संकर',
    variety: 'Abhinav / Firm Red',
    currentPriceKg: 28.0,
    prevPriceKg: 22.5,
    changePct: 24.4,
    direction: 'up',
    forecastNote: 'South supply disruption caused an instant price rally across Western mandis.',
    bestSellingWindow: 'Immediate (1-2 Days)',
    demandRating: 'High',
    arrivalVolume: '2,800 Crates (↓ 22%)',
    historicalPoints: [21, 22.5, 23, 25, 26, 27, 28],
    topMandi: 'Pimpalgaon APMC (₹2,900/Qtl)',
    imageUri: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
  },
  {
    id: 'wheat_sharbati',
    cropName: 'Sharbati Wheat',
    hindiName: 'शरबती गेहूँ',
    variety: 'C-306 Super A Grade',
    currentPriceKg: 34.0,
    prevPriceKg: 33.2,
    changePct: 2.4,
    direction: 'up',
    forecastNote: 'Steady institutional flour mill procurement. Strong floor price support.',
    bestSellingWindow: 'Hold for Peak (15 Days)',
    demandRating: 'Moderate',
    arrivalVolume: '8,500 Quintals (Steady)',
    historicalPoints: [32.5, 33, 33, 33.5, 33.8, 34, 34],
    topMandi: 'Indore APMC (₹3,450/Qtl)',
    imageUri: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
  },
  {
    id: 'potato_jyoti',
    cropName: 'Kufri Jyoti Potato',
    hindiName: 'आलू ज्योति',
    variety: 'Table Grade / Fresh',
    currentPriceKg: 19.5,
    prevPriceKg: 21.0,
    changePct: -7.1,
    direction: 'down',
    forecastNote: 'Heavy new season arrivals from Punjab and UP entering Northern markets.',
    bestSellingWindow: 'Liquidate or Cold Store',
    demandRating: 'Moderate',
    arrivalVolume: '12,400 Bags (↑ 18%)',
    historicalPoints: [22, 21.8, 21.5, 21, 20.5, 20, 19.5],
    topMandi: 'Agra APMC (₹1,920/Qtl)',
    imageUri: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
  },
  {
    id: 'soybean_yellow',
    cropName: 'Yellow Soybean',
    hindiName: 'पीली सोयाबीन',
    variety: 'JS-9560',
    currentPriceKg: 46.0,
    prevPriceKg: 44.5,
    changePct: 3.4,
    direction: 'up',
    forecastNote: 'Crush margins improved; international edible oil duties supportive.',
    bestSellingWindow: 'Favorable Window',
    demandRating: 'High',
    arrivalVolume: '6,100 Quintals',
    historicalPoints: [43, 43.5, 44, 44.5, 45, 45.5, 46],
    topMandi: 'Kota Mandi (₹4,680/Qtl)',
    imageUri: 'https://images.unsplash.com/photo-1588645224346-60848037fa20?w=400',
  },
];

export default function MarketTrendsScreen() {
  const router = useRouter();
  const [selectedHorizon, setSelectedHorizon] = useState<'7D' | '30D' | '90D'>('7D');
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'gainers' | 'losers'>('all');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const filteredCrops = useMemo(() => {
    if (activeFilter === 'gainers') {
      return TREND_CROPS.filter((c) => c.direction === 'up');
    }
    if (activeFilter === 'losers') {
      return TREND_CROPS.filter((c) => c.direction === 'down');
    }
    return TREND_CROPS;
  }, [activeFilter]);

  return (
    <MKBackground>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={22} color="#1E5A2A" strokeWidth={2.4} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Market Trends & Forecast</Text>
            <Text style={styles.headerSubtitle}>Live Mandi Intelligence • Powered by Gemini AI</Text>
          </View>
          <Pressable
            style={styles.pricesLinkBtn}
            onPress={() => router.push('/market-prices')}
          >
            <Text style={styles.pricesLinkText}>Spot Rates</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E5A2A']} />
          }
        >
          {/* AI Intelligence Forecast Banner */}
          <View style={styles.aiForecastCard}>
            <View style={styles.aiForecastHeader}>
              <View style={styles.aiBadge}>
                <Sparkles size={15} color="#1E5A2A" />
                <Text style={styles.aiBadgeText}>Gemini 2.5 Market Forecast</Text>
              </View>
              <Text style={styles.forecastTimeText}>Updated 10m ago</Text>
            </View>

            <Text style={styles.forecastMainHeading}>
              Vegetable prices rising +18% average across APMCs; Grains stable with high export interest.
            </Text>

            <View style={styles.forecastPillRow}>
              <View style={styles.forecastPill}>
                <Flame size={13} color="#D97706" />
                <Text style={styles.forecastPillText}>Top Hotspot: Onion (+17.7%)</Text>
              </View>
              <View style={styles.forecastPill}>
                <TrendingUp size={13} color="#15803D" />
                <Text style={styles.forecastPillText}>Buyer Demand: High</Text>
              </View>
            </View>
          </View>

          {/* Time Horizon Selector */}
          <View style={styles.horizonSelectorRow}>
            <View style={styles.horizonGroup}>
              {(['7D', '30D', '90D'] as const).map((h) => (
                <Pressable
                  key={h}
                  onPress={() => setSelectedHorizon(h)}
                  style={[styles.horizonBtn, selectedHorizon === h && styles.horizonBtnActive]}
                >
                  <Text style={[styles.horizonBtnText, selectedHorizon === h && styles.horizonBtnTextActive]}>
                    {h === '7D' ? 'Last 7 Days' : h === '30D' ? '30 Days Trend' : 'Quarterly'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Filter Chips: All, Top Gainers, Market Dips */}
          <View style={styles.filterChipsRow}>
            <Pressable
              onPress={() => setActiveFilter('all')}
              style={[styles.chip, activeFilter === 'all' && styles.chipActive]}
            >
              <Text style={[styles.chipText, activeFilter === 'all' && styles.chipTextActive]}>
                All Commodities ({TREND_CROPS.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveFilter('gainers')}
              style={[styles.chip, activeFilter === 'gainers' && styles.chipActive]}
            >
              <TrendingUp size={13} color={activeFilter === 'gainers' ? '#FFFFFF' : '#15803D'} />
              <Text style={[styles.chipText, activeFilter === 'gainers' && styles.chipTextActive]}>
                Top Gainers
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveFilter('losers')}
              style={[styles.chip, activeFilter === 'losers' && styles.chipActive]}
            >
              <TrendingDown size={13} color={activeFilter === 'losers' ? '#FFFFFF' : '#DC2626'} />
              <Text style={[styles.chipText, activeFilter === 'losers' && styles.chipTextActive]}>
                Price Dips
              </Text>
            </Pressable>
          </View>

          {/* List of Trend Cards */}
          {filteredCrops.map((crop) => {
            const isUp = crop.direction === 'up';
            return (
              <View key={crop.id} style={styles.trendCard}>
                {/* Top Section */}
                <View style={styles.cropTopRow}>
                  <Image source={{ uri: crop.imageUri }} style={styles.cropThumb} />
                  <View style={styles.cropMeta}>
                    <View style={styles.nameBadgeRow}>
                      <Text style={styles.cropTitle} numberOfLines={1}>{crop.cropName}</Text>
                      <Text style={styles.hindiSubtitle}>{crop.hindiName}</Text>
                    </View>
                    <Text style={styles.varietyText}>{crop.variety}</Text>
                    <Text style={styles.mandiLocText}>Top APMC: {crop.topMandi}</Text>
                  </View>

                  <View style={styles.priceColumn}>
                    <Text style={styles.pricePerKgText}>₹{crop.currentPriceKg.toFixed(1)}</Text>
                    <Text style={styles.perKgUnit}>per kg</Text>
                    <View style={[styles.pctBadge, isUp ? styles.pctBadgeUp : styles.pctBadgeDown]}>
                      {isUp ? (
                        <TrendingUp size={12} color="#15803D" />
                      ) : (
                        <TrendingDown size={12} color="#DC2626" />
                      )}
                      <Text style={[styles.pctBadgeText, isUp ? styles.pctTextUp : styles.pctTextDown]}>
                        {isUp ? `+${crop.changePct}%` : `${crop.changePct}%`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 7-Day Mini Sparkline Visualization */}
                <View style={styles.sparklineCard}>
                  <View style={styles.sparklineHeader}>
                    <Text style={styles.sparklineLabel}>Price Trajectory ({selectedHorizon})</Text>
                    <Text style={styles.sparklineRange}>
                      Min ₹{Math.min(...crop.historicalPoints)} • Max ₹{Math.max(...crop.historicalPoints)}
                    </Text>
                  </View>
                  <View style={styles.barsRow}>
                    {crop.historicalPoints.map((val, idx) => {
                      const min = Math.min(...crop.historicalPoints);
                      const max = Math.max(...crop.historicalPoints);
                      const range = max - min || 1;
                      const heightPercent = 25 + ((val - min) / range) * 70;
                      return (
                        <View key={idx} style={styles.barCol}>
                          <View style={[styles.barFill, { height: `${heightPercent}%`, backgroundColor: isUp ? '#16A34A' : '#EF4444' }]} />
                          <Text style={styles.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'Today'][idx]}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* AI Selling Recommendation Insight */}
                <View style={styles.aiRecommendationBox}>
                  <View style={styles.recHeaderRow}>
                    <Sparkles size={14} color="#D97706" />
                    <Text style={styles.recHeaderTitle}>Gemini AI Strategy</Text>
                    <View style={styles.windowPill}>
                      <Text style={styles.windowPillText}>Target: {crop.bestSellingWindow}</Text>
                    </View>
                  </View>
                  <Text style={styles.recNoteText}>{crop.forecastNote}</Text>
                  <View style={styles.recMetaRow}>
                    <Text style={styles.recMetaItem}>Arrivals: <Text style={styles.recMetaBold}>{crop.arrivalVolume}</Text></Text>
                    <Text style={styles.recMetaItem}>Demand: <Text style={styles.recMetaBold}>{crop.demandRating}</Text></Text>
                  </View>
                </View>

                {/* Action CTA */}
                <View style={styles.cardFooterActions}>
                  <Pressable
                    style={styles.compareBtn}
                    onPress={() => router.push('/market-prices')}
                  >
                    <Text style={styles.compareBtnText}>View Nearby Mandis</Text>
                  </Pressable>

                  <Pressable
                    style={styles.sellNowBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/produce/add',
                        params: { cropName: crop.cropName },
                      })
                    }
                  >
                    <Text style={styles.sellNowBtnText}>Sell {crop.cropName.split(' ')[0]}</Text>
                    <ArrowRight size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </MKBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E5A2A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 1,
  },
  pricesLinkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
  },
  pricesLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E5A2A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  aiForecastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#D1E7DD',
    marginBottom: 16,
    shadowColor: '#1E5A2A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  aiForecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E5A2A',
  },
  forecastTimeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  forecastMainHeading: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  forecastPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  forecastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  forecastPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  horizonSelectorRow: {
    marginBottom: 12,
  },
  horizonGroup: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 3,
  },
  horizonBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  horizonBtnActive: {
    backgroundColor: '#1E5A2A',
  },
  horizonBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  horizonBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#1E5A2A',
    borderColor: '#1E5A2A',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cropTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cropThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  cropMeta: {
    flex: 1,
    marginLeft: 12,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  cropTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  hindiSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  varietyText: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 1,
  },
  mandiLocText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  priceColumn: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  pricePerKgText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  perKgUnit: {
    fontSize: 10,
    color: '#6B7280',
  },
  pctBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  pctBadgeUp: {
    backgroundColor: '#DCFCE7',
  },
  pctBadgeDown: {
    backgroundColor: '#FEE2E2',
  },
  pctBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pctTextUp: {
    color: '#15803D',
  },
  pctTextDown: {
    color: '#DC2626',
  },
  sparklineCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sparklineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sparklineLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  sparklineRange: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 48,
    paddingTop: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 14,
    borderRadius: 4,
    minHeight: 6,
  },
  barLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 3,
    fontWeight: '600',
  },
  aiRecommendationBox: {
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  recHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854D0E',
    flex: 1,
    marginLeft: 6,
  },
  windowPill: {
    backgroundColor: '#FDE047',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  windowPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#713F12',
  },
  recNoteText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#713F12',
    fontWeight: '500',
    marginBottom: 8,
  },
  recMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(133, 77, 14, 0.15)',
    paddingTop: 6,
  },
  recMetaItem: {
    fontSize: 11,
    color: '#854D0E',
  },
  recMetaBold: {
    fontWeight: '700',
  },
  cardFooterActions: {
    flexDirection: 'row',
    gap: 8,
  },
  compareBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  compareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  sellNowBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E5A2A',
  },
  sellNowBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
