/**
 * MandiKart Farmer App — Market Price Details Screen (Screen 9)
 *
 * Route: /source/prices?commodity=:commodity&mandi=:mandi&crop=:crop
 *
 * Domain Capabilities:
 * - Current verified APMC Mandi benchmark rate display (Min, Modal, Max in ₹/qtl & ₹/kg)
 * - Strict 1 qtl = 100 kg unit consistency with clear conversion formulas
 * - Official statutory source attribution (AGMARKNET & MSAMB)
 * - Clear distinction between APMC Reference Rates, Supplier Quotes, and Confirmed Escrow Orders
 * - Explicit stale data warning when market is closed or records are from previous trading days
 * - Navigation to Price History Screen and Verified Supplier Directory
 * - Graceful loading, missing record, and error states without fabricating fake quotes
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronRight,
  Package,
  Layers,
  ArrowRight,
  RotateCcw,
  Building2,
  FileText,
  Scale,
  Sparkles,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useSourceProduceStore,
  MarketPriceDetails,
} from '@/store/sourceProduceStore';

const QUICK_COMMODITIES = [
  { label: 'Red Onion', key: 'onion' },
  { label: 'Tomato', key: 'tomato' },
  { label: 'Wheat', key: 'wheat' },
  { label: 'Potato', key: 'potato' },
  { label: 'Maize', key: 'maize' },
  { label: 'Desi Chana', key: 'chana' },
];

export default function MarketPriceDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    commodity?: string;
    crop?: string;
    mandi?: string;
    productId?: string;
  }>();

  const initialCommodity = params.commodity || params.crop || 'onion';
  const initialMandi = params.mandi || '';

  const [selectedCommodity, setSelectedCommodity] = useState(initialCommodity);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [priceData, setPriceData] = useState<MarketPriceDetails | null>(null);

  const { fetchMarketPriceDetails, getMarketPriceDetailsLocal } = useSourceProduceStore();

  useEffect(() => {
    let active = true;

    fetchMarketPriceDetails(selectedCommodity, initialMandi)
      .then((data) => {
        if (!active) return;
        if (data) {
          setPriceData(data);
        } else {
          setPriceData(getMarketPriceDetailsLocal(selectedCommodity) || null);
        }
      })
      .catch(() => {
        if (!active) return;
        setPriceData(getMarketPriceDetailsLocal(selectedCommodity) || null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedCommodity, initialMandi, fetchMarketPriceDetails, getMarketPriceDetailsLocal]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMarketPriceDetails(selectedCommodity, initialMandi)
      .then((data) => {
        if (data) {
          setPriceData(data);
        } else {
          setPriceData(getMarketPriceDetailsLocal(selectedCommodity) || null);
        }
      })
      .catch(() => {
        setPriceData(getMarketPriceDetailsLocal(selectedCommodity) || null);
      })
      .finally(() => {
        setRefreshing(false);
      });
  };

  // Price spread calculations
  const priceSpread = useMemo(() => {
    if (!priceData) return { spreadQtl: 0, spreadPct: 0 };
    const spreadQtl = Math.max(0, priceData.maxPriceQtl - priceData.minPriceQtl);
    const spreadPct = priceData.modalPriceQtl > 0
      ? Number(((spreadQtl / priceData.modalPriceQtl) * 100).toFixed(1))
      : 0;
    return { spreadQtl, spreadPct };
  }, [priceData]);

  // Modal price position in spread corridor (0 to 100%)
  const corridorPositionPct = useMemo(() => {
    if (!priceData || priceData.maxPriceQtl === priceData.minPriceQtl) return 50;
    const pos =
      ((priceData.modalPriceQtl - priceData.minPriceQtl) /
        (priceData.maxPriceQtl - priceData.minPriceQtl)) *
      100;
    return Math.min(Math.max(pos, 5), 95);
  }, [priceData]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color="#0F172A" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {priceData ? `${priceData.commodity} Market Price` : 'APMC Market Benchmark'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {priceData
              ? `${priceData.marketMandiName} • ${priceData.district}`
              : 'Official AGMARKNET Mandi Rate Intelligence'}
          </Text>
        </View>

        <Pressable
          style={styles.refreshBtn}
          onPress={onRefresh}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Refresh price data"
        >
          <RotateCcw size={16} color="#64748B" />
        </Pressable>
      </View>

      {/* ── Quick Produce Selector Bar ─────────────────────────── */}
      <View style={styles.quickSelectorBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickSelectorContent}
        >
          {QUICK_COMMODITIES.map((item) => {
            const isSelected =
              selectedCommodity.toLowerCase().includes(item.key) ||
              item.key.includes(selectedCommodity.toLowerCase());
            return (
              <Pressable
                key={item.key}
                style={[styles.quickChip, isSelected && styles.quickChipSelected]}
                onPress={() => {
                  setLoading(true);
                  setSelectedCommodity(item.key);
                }}
              >
                <Text
                  style={[styles.quickChipText, isSelected && styles.quickChipTextSelected]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={MKColors.primary} />
          <Text style={styles.loadingText}>Fetching Statutory Mandi Price Bulletin...</Text>
        </View>
      ) : !priceData ? (
        /* Empty / Unavailable State */
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={MKColors.primary}
            />
          }
        >
          <View style={styles.emptyIconWrap}>
            <Info size={36} color="#D97706" />
          </View>
          <Text style={styles.emptyTitle}>No Official Price Records Reported</Text>
          <Text style={styles.emptySub}>
            No statutory APMC market bulletin was located for &quot;{selectedCommodity}&quot; in the current reporting cycle.
            MandiKart displays verified agricultural data feeds and does not invent speculative rates.
          </Text>
          <Pressable
            style={styles.emptyResetBtn}
            onPress={() => setSelectedCommodity('onion')}
          >
            <RotateCcw size={15} color="#FFFFFF" />
            <Text style={styles.emptyResetBtnText}>Switch to Red Onion Benchmark</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={MKColors.primary}
            />
          }
        >
          {/* ── Stale / Closed Market Warning Banner ──────────────── */}
          {priceData.isStale ? (
            <View style={styles.staleBanner}>
              <View style={styles.staleIconWrap}>
                <AlertTriangle size={18} color="#C2410C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.staleTitle}>Previous Session Benchmark (Not Live)</Text>
                <Text style={styles.staleDesc}>
                  {priceData.staleReason ||
                    'APMC trading session is currently closed. Displaying the authoritative closing benchmark from the previous trading day.'}
                </Text>
                <Text style={styles.staleTimestamp}>
                  Recorded Session: {priceData.bulletinDate} ({priceData.sessionTimestamp})
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.liveBanner}>
              <View style={styles.liveIndicatorDot} />
              <Text style={styles.liveBannerText}>
                Active Session Bulletin • {priceData.sessionTimestamp}
              </Text>
            </View>
          )}

          {/* ── Main Modal Price Hero Card ────────────────────────── */}
          <View style={styles.heroCard}>
            {/* Top Commodity & Variety Meta */}
            <View style={styles.heroTopMeta}>
              <View style={{ flex: 1 }}>
                <Text style={styles.commodityCategory}>{priceData.category}</Text>
                <Text style={styles.commodityName}>{priceData.commodity}</Text>
                <Text style={styles.commodityVariety}>{priceData.variety}</Text>
              </View>
              <View style={styles.gradeBadge}>
                <ShieldCheck size={12} color="#15803D" />
                <Text style={styles.gradeBadgeText}>{priceData.grade}</Text>
              </View>
            </View>

            {/* Price Value Row */}
            <View style={styles.priceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.priceLabel}>APMC Benchmark Modal Rate</Text>
                <View style={styles.priceValueWrap}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <Text style={styles.priceValue}>
                    {priceData.modalPriceQtl.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.priceUnit}>/quintal</Text>
                </View>
                {/* Secondary Normalized Unit Calculation */}
                <View style={styles.unitConversionRow}>
                  <Text style={styles.unitConversionText}>
                    ≈ ₹{priceData.modalPriceKg.toFixed(1)} per kg
                  </Text>
                  <View style={styles.unitFormulaPill}>
                    <Text style={styles.unitFormulaText}>1 Quintal = 100 kg</Text>
                  </View>
                </View>
              </View>

              {/* Trend Badge */}
              <View style={styles.trendBadgeWrap}>
                <View
                  style={[
                    styles.trendBadge,
                    priceData.trendDirection === 'up'
                      ? styles.trendBadgeUp
                      : priceData.trendDirection === 'down'
                      ? styles.trendBadgeDown
                      : styles.trendBadgeStable,
                  ]}
                >
                  {priceData.trendDirection === 'up' ? (
                    <TrendingUp size={16} color="#15803D" />
                  ) : priceData.trendDirection === 'down' ? (
                    <TrendingDown size={16} color="#DC2626" />
                  ) : (
                    <Minus size={16} color="#64748B" />
                  )}
                  <Text
                    style={[
                      styles.trendPctText,
                      priceData.trendDirection === 'up'
                        ? styles.trendPctUp
                        : priceData.trendDirection === 'down'
                        ? styles.trendPctDown
                        : styles.trendPctStable,
                    ]}
                  >
                    {priceData.trendPct > 0 ? `+${priceData.trendPct}%` : `${priceData.trendPct}%`}
                  </Text>
                </View>
                <Text style={styles.trendSessionSub}>vs previous session</Text>
              </View>
            </View>

            {/* ── Min-Max Corridor Gauge Bar ──────────────────────── */}
            <View style={styles.corridorSection}>
              <View style={styles.corridorHeader}>
                <Text style={styles.corridorTitle}>Daily Trading Price Corridor</Text>
                <Text style={styles.corridorSpreadText}>
                  Spread: ₹{priceSpread.spreadQtl}/qtl ({priceSpread.spreadPct}%)
                </Text>
              </View>

              {/* Gauge Track */}
              <View style={styles.gaugeTrack}>
                <View style={styles.gaugeFill} />
                {/* Pointer indicator */}
                <View
                  style={[
                    styles.gaugePointer,
                    { left: `${corridorPositionPct}%` },
                  ]}
                >
                  <View style={styles.gaugePointerDot} />
                </View>
              </View>

              {/* Min, Modal, Max Labels Row */}
              <View style={styles.corridorValuesRow}>
                <View>
                  <Text style={styles.corridorValLabel}>Minimum</Text>
                  <Text style={styles.corridorVal}>
                    ₹{priceData.minPriceQtl.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.corridorKgVal}>₹{priceData.minPriceKg}/kg</Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.corridorValLabelPrimary}>Modal (Benchmark)</Text>
                  <Text style={styles.corridorValPrimary}>
                    ₹{priceData.modalPriceQtl.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.corridorKgValPrimary}>₹{priceData.modalPriceKg}/kg</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.corridorValLabel}>Maximum</Text>
                  <Text style={styles.corridorVal}>
                    ₹{priceData.maxPriceQtl.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.corridorKgVal}>₹{priceData.maxPriceKg}/kg</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Mandi Yard Trading Location Card ─────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Building2 size={16} color={MKColors.primary} />
              <Text style={styles.cardTitle}>Trading Location & APMC Market Yard</Text>
            </View>

            <View style={styles.locationDetailRow}>
              <View style={styles.locationIconCircle}>
                <MapPin size={18} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mandiNameText}>{priceData.marketMandiName}</Text>
                <Text style={styles.mandiLocationSub}>
                  {priceData.district}, {priceData.state} • {priceData.distanceKm} km from your registered farm
                </Text>
              </View>
            </View>

            {/* Key Trading Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricGridBox}>
                <Text style={styles.metricGridLabel}>Daily Arrivals</Text>
                <Text style={styles.metricGridVal}>
                  {priceData.dailyArrivalQtl.toLocaleString('en-IN')} qtl
                </Text>
                <Text style={styles.metricGridSub}>
                  ≈ {(priceData.dailyArrivalQtl / 10).toFixed(0)} MT
                </Text>
              </View>

              <View style={styles.metricGridBox}>
                <Text style={styles.metricGridLabel}>Est. Traded Volume</Text>
                <Text style={styles.metricGridVal}>
                  ₹{priceData.tradedValueLakhs.toFixed(1)} Lakhs
                </Text>
                <Text style={styles.metricGridSub}>Modal turnover</Text>
              </View>

              <View style={styles.metricGridBox}>
                <Text style={styles.metricGridLabel}>Bulletin Date</Text>
                <Text style={styles.metricGridVal}>{priceData.bulletinDate}</Text>
                <Text style={styles.metricGridSub}>Statutory record</Text>
              </View>
            </View>
          </View>

          {/* ── Source Attribution & Data Protection ─────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <ShieldCheck size={16} color="#15803D" />
              <Text style={styles.cardTitle}>Data Source & Regulatory Attribution</Text>
            </View>

            <View style={styles.sourceBox}>
              <FileText size={16} color="#475569" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sourceAuthorityTitle}>{priceData.sourceAuthority}</Text>
                <Text style={styles.sourceAuthoritySub}>
                  Statutory daily electronic market arrivals and prices bulletin published under the Agricultural Produce Marketing Committee (APMC) regulation framework.
                </Text>
                <View style={styles.verifiedAuditBadge}>
                  <ShieldCheck size={11} color="#15803D" />
                  <Text style={styles.verifiedAuditText}>Verified Government Agricultural Feed</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── 3-Layer Pricing Clarity Notice ───────────────────── */}
          <View style={styles.clarityCard}>
            <View style={styles.clarityCardHeader}>
              <Scale size={16} color="#D97706" />
              <Text style={styles.clarityCardTitle}>Understanding Agricultural Pricing</Text>
            </View>

            <View style={styles.clarityItem}>
              <View style={styles.clarityBulletCircle}>
                <Text style={styles.clarityBulletNum}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clarityItemTitle}>APMC Reference Benchmark Rate</Text>
                <Text style={styles.clarityItemDesc}>
                  {priceData.clarityNotice.referenceNotice}
                </Text>
              </View>
            </View>

            <View style={styles.clarityDivider} />

            <View style={styles.clarityItem}>
              <View style={styles.clarityBulletCircle}>
                <Text style={styles.clarityBulletNum}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clarityItemTitle}>Supplier Offer Quotes</Text>
                <Text style={styles.clarityItemDesc}>
                  {priceData.clarityNotice.supplierQuoteVarianceNotice}
                </Text>
              </View>
            </View>

            <View style={styles.clarityDivider} />

            <View style={styles.clarityItem}>
              <View style={styles.clarityBulletCircle}>
                <Text style={styles.clarityBulletNum}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clarityItemTitle}>Confirmed MandiKart Orders</Text>
                <Text style={styles.clarityItemDesc}>
                  {priceData.clarityNotice.transactionExecutionNotice}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Action Buttons & Next Steps ──────────────────────── */}
          <View style={styles.actionSection}>
            {/* View Price History Button */}
            <Pressable
              style={styles.historyBtn}
              onPress={() =>
                router.push({
                  pathname: '/source/prices/history',
                  params: {
                    commodity: priceData.commodity,
                    mandi: priceData.marketMandiName,
                  },
                } as any)
              }
            >
              <View style={styles.historyBtnLeft}>
                <Sparkles size={18} color="#FFFFFF" />
                <View>
                  <Text style={styles.historyBtnText}>View Price History & Charts</Text>
                  <Text style={styles.historyBtnSub}>
                    Compare 7D, 30D, and 90D trend corridors & historical arrivals
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#FFFFFF" />
            </Pressable>

            {/* Find Verified Suppliers for this Produce */}
            <Pressable
              style={styles.findSuppliersBtn}
              onPress={() =>
                router.push({
                  pathname: '/source/suppliers',
                  params: {
                    crop: priceData.commodity,
                  },
                } as any)
              }
            >
              <Package size={16} color={MKColors.primary} />
              <Text style={styles.findSuppliersBtnText}>
                Discover Verified Suppliers for {priceData.commodity}
              </Text>
              <ArrowRight size={15} color={MKColors.primary} />
            </Pressable>

            {/* Post Buy Requirement Tender */}
            <Pressable
              style={styles.tenderBtn}
              onPress={() =>
                router.push({
                  pathname: '/requirements/create',
                  params: {
                    crop: priceData.commodity,
                  },
                } as any)
              }
            >
              <Layers size={16} color="#475569" />
              <Text style={styles.tenderBtnText}>Post Sourcing Tender at Benchmark</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickSelectorBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  quickSelectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickChipSelected: {
    backgroundColor: MKColors.primary,
    borderColor: MKColors.primary,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  quickChipTextSelected: {
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: MKColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyResetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  staleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 12,
    padding: 12,
  },
  staleIconWrap: {
    marginTop: 2,
  },
  staleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
    marginBottom: 2,
  },
  staleDesc: {
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 17,
    marginBottom: 4,
  },
  staleTimestamp: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C2D12',
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  liveBannerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  heroTopMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commodityCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  commodityName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  commodityVariety: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#86EFAC',
  },
  gradeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  priceValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: MKColors.primary,
    marginRight: 2,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: MKColors.primary,
    letterSpacing: -0.5,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  unitConversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  unitConversionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  unitFormulaPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unitFormulaText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  trendBadgeWrap: {
    alignItems: 'flex-end',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendBadgeUp: {
    backgroundColor: '#DCFCE7',
  },
  trendBadgeDown: {
    backgroundColor: '#FEE2E2',
  },
  trendBadgeStable: {
    backgroundColor: '#F1F5F9',
  },
  trendPctText: {
    fontSize: 13,
    fontWeight: '800',
  },
  trendPctUp: {
    color: '#15803D',
  },
  trendPctDown: {
    color: '#DC2626',
  },
  trendPctStable: {
    color: '#64748B',
  },
  trendSessionSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  corridorSection: {
    marginTop: 14,
  },
  corridorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  corridorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  corridorSpreadText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  gaugeTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    marginBottom: 8,
    overflow: 'visible',
  },
  gaugeFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
    backgroundColor: '#93C5FD',
  },
  gaugePointer: {
    position: 'absolute',
    top: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: MKColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -9,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  gaugePointerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MKColors.primary,
  },
  corridorValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  corridorValLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 1,
  },
  corridorVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  corridorKgVal: {
    fontSize: 10,
    color: '#94A3B8',
  },
  corridorValLabelPrimary: {
    fontSize: 10,
    fontWeight: '700',
    color: MKColors.primary,
    marginBottom: 1,
  },
  corridorValPrimary: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.primary,
  },
  corridorKgValPrimary: {
    fontSize: 10,
    fontWeight: '600',
    color: MKColors.primary,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  locationDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  locationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mandiNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  mandiLocationSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  metricGridBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricGridLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  metricGridVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricGridSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  sourceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  sourceAuthorityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  sourceAuthoritySub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  verifiedAuditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedAuditText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  clarityCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  clarityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  clarityCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  clarityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  clarityBulletCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  clarityBulletNum: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  clarityItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 2,
  },
  clarityItemDesc: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  clarityDivider: {
    height: 1,
    backgroundColor: '#FDE68A',
    marginVertical: 10,
  },
  actionSection: {
    gap: 10,
    marginTop: 6,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MKColors.primary,
    padding: 14,
    borderRadius: 12,
    shadowColor: MKColors.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  historyBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  historyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyBtnSub: {
    fontSize: 10,
    color: '#E0E7FF',
    marginTop: 1,
  },
  findSuppliersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: MKColors.primary,
  },
  findSuppliersBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.primary,
  },
  tenderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  tenderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});
