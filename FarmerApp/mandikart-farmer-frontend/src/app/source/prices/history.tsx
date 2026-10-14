/**
 * MandiKart Farmer App — Price History Screen (Screen 10)
 *
 * Route: /source/prices/history?commodity=:commodity&mandi=:mandi
 *
 * Domain Capabilities:
 * - Historical APMC Mandi price series visualization using SVG trendline and corridor area
 * - Timeframe filtering: 7D, 15D, 30D (1M), 90D (3M)
 * - Comparative analysis: Min Price, Modal Price, Max Price, and Daily Arrivals
 * - Non-trading day handling: Explicitly flags APMC Sunday & holiday closures without inventing observations
 * - Interactive point inspection: Tap any observation point to view exact trading day parameters
 * - Chronological session audit table with unit consistency (₹/qtl & ₹/kg)
 * - Informative empty and network fallback states
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
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Polyline,
  Polygon,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  Info,
  RotateCcw,
  ShieldCheck,
  Scale,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useSourceProduceStore,
  MarketPriceHistoryResponse,
  HistoricalPriceObservation,
} from '@/store/sourceProduceStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TIMEFRAME_OPTIONS: { label: string; days: number; shortLabel: string }[] = [
  { label: '7 Days', days: 7, shortLabel: '7D' },
  { label: '15 Days', days: 15, shortLabel: '15D' },
  { label: '1 Month', days: 30, shortLabel: '1M' },
  { label: '3 Months', days: 90, shortLabel: '3M' },
];

export default function PriceHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    commodity?: string;
    crop?: string;
    mandi?: string;
  }>();

  const commodity = params.commodity || params.crop || 'Red Onion';
  const mandi = params.mandi || '';

  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(30);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyData, setHistoryData] = useState<MarketPriceHistoryResponse | null>(null);

  const { fetchMarketPriceHistory, getMarketPriceHistoryLocal } = useSourceProduceStore();

  useEffect(() => {
    let active = true;

    fetchMarketPriceHistory(commodity, mandi, selectedTimeframe)
      .then((data) => {
        if (!active) return;
        if (data) {
          setHistoryData(data);
        } else {
          setHistoryData(getMarketPriceHistoryLocal(commodity, selectedTimeframe) || null);
        }
      })
      .catch(() => {
        if (!active) return;
        setHistoryData(getMarketPriceHistoryLocal(commodity, selectedTimeframe) || null);
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
  }, [commodity, selectedTimeframe, mandi, fetchMarketPriceHistory, getMarketPriceHistoryLocal]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMarketPriceHistory(commodity, mandi, selectedTimeframe)
      .then((data) => {
        if (data) {
          setHistoryData(data);
        } else {
          setHistoryData(getMarketPriceHistoryLocal(commodity, selectedTimeframe) || null);
        }
      })
      .catch(() => {
        setHistoryData(getMarketPriceHistoryLocal(commodity, selectedTimeframe) || null);
      })
      .finally(() => {
        setRefreshing(false);
      });
  };

  // Extract trading day observations (excluding closures for chart line math)
  const tradingObservations = useMemo(() => {
    if (!historyData) return [];
    return historyData.observations.filter(
      (o): o is HistoricalPriceObservation & { modalPriceQtl: number } =>
        o.isTradingDay && o.modalPriceQtl !== undefined
    );
  }, [historyData]);

  // Chart layout parameters
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = 180;
  const paddingX = 24;
  const paddingY = 24;

  // Compute SVG coordinates
  const { polylinePoints, polygonAreaPoints, pointCoordinates, minChartPrice, maxChartPrice } =
    useMemo(() => {
      if (tradingObservations.length === 0) {
        return {
          polylinePoints: '',
          polygonAreaPoints: '',
          pointCoordinates: [],
          minChartPrice: 0,
          maxChartPrice: 0,
        };
      }

      const prices = tradingObservations.map((o) => o.modalPriceQtl);
      const minP = Math.floor(Math.min(...prices) * 0.96);
      const maxP = Math.ceil(Math.max(...prices) * 1.04);
      const priceRange = maxP - minP || 1;

      const availableW = chartWidth - paddingX * 2;
      const availableH = chartHeight - paddingY * 2;
      const stepX = availableW / Math.max(1, tradingObservations.length - 1);

      const coords = tradingObservations.map((obs, idx) => {
        const x = paddingX + idx * stepX;
        const normalizedY = (obs.modalPriceQtl - minP) / priceRange;
        const y = paddingY + availableH - normalizedY * availableH;
        return { x, y, observation: obs, originalIndex: idx };
      });

      const polyPoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');

      // Area polygon closing coordinates
      const firstX = coords[0].x.toFixed(1);
      const lastX = coords[coords.length - 1].x.toFixed(1);
      const bottomY = (chartHeight - paddingY + 8).toFixed(1);
      const areaPoints = `${firstX},${bottomY} ${polyPoints} ${lastX},${bottomY}`;

      return {
        polylinePoints: polyPoints,
        polygonAreaPoints: areaPoints,
        pointCoordinates: coords,
        minChartPrice: minP,
        maxChartPrice: maxP,
      };
    }, [tradingObservations, chartWidth, chartHeight, paddingX, paddingY]);

  // Currently active inspection point
  const activePoint = useMemo(() => {
    if (selectedPointIndex !== null && pointCoordinates[selectedPointIndex]) {
      return pointCoordinates[selectedPointIndex].observation;
    }
    // Default to the latest recorded observation
    if (pointCoordinates.length > 0) {
      return pointCoordinates[pointCoordinates.length - 1].observation;
    }
    return null;
  }, [selectedPointIndex, pointCoordinates]);

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
            {commodity} Price History
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {historyData
              ? `${historyData.marketMandiName} • ${historyData.district}`
              : 'APMC Trading Session Archives'}
          </Text>
        </View>

        <Pressable
          style={styles.refreshBtn}
          onPress={onRefresh}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Refresh historical records"
        >
          <RotateCcw size={16} color="#64748B" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={MKColors.primary} />
          <Text style={styles.loadingText}>Loading Historical APMC Market Series...</Text>
        </View>
      ) : !historyData || historyData.observations.length === 0 ? (
        /* Empty State */
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
          <Text style={styles.emptyTitle}>No Historical Trading Data Recorded</Text>
          <Text style={styles.emptySub}>
            Historical daily APMC price bulletins for &quot;{commodity}&quot; are currently unavailable
            for this selected trading window. MandiKart adheres to authentic records and does not
            fabricate historical data.
          </Text>
          <Pressable
            style={styles.emptyBackBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft size={16} color="#FFFFFF" />
            <Text style={styles.emptyBackBtnText}>Return to Current Prices</Text>
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
          {/* ── Timeframe Selector Bar ─────────────────────────────── */}
          <View style={styles.timeframeBar}>
            {TIMEFRAME_OPTIONS.map((opt) => {
              const isSelected = selectedTimeframe === opt.days;
              return (
                <Pressable
                  key={opt.days}
                  style={[styles.timeframeChip, isSelected && styles.timeframeChipSelected]}
                  onPress={() => {
                    setLoading(true);
                    setSelectedPointIndex(null);
                    setSelectedTimeframe(opt.days);
                  }}
                >
                  <Text
                    style={[
                      styles.timeframeChipText,
                      isSelected && styles.timeframeChipTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Aggregate Summary Metric Cards ────────────────────── */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardLabel}>Period Average</Text>
              <Text style={styles.summaryCardVal}>
                ₹{historyData.averageModalPriceQtl.toLocaleString('en-IN')}
                <Text style={styles.summaryCardUnit}>/qtl</Text>
              </Text>
              <Text style={styles.summaryCardSub}>
                ≈ ₹{historyData.averageModalPriceKg}/kg
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardLabel}>Period High</Text>
              <Text style={styles.summaryCardValGreen}>
                ₹{historyData.highestModalPriceQtl.toLocaleString('en-IN')}
                <Text style={styles.summaryCardUnit}>/qtl</Text>
              </Text>
              <Text style={styles.summaryCardSub}>
                on {historyData.highestPriceDate}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardLabel}>Period Low</Text>
              <Text style={styles.summaryCardValOrange}>
                ₹{historyData.lowestModalPriceQtl.toLocaleString('en-IN')}
                <Text style={styles.summaryCardUnit}>/qtl</Text>
              </Text>
              <Text style={styles.summaryCardSub}>
                on {historyData.lowestPriceDate}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardLabel}>Price Volatility</Text>
              <Text style={styles.summaryCardVal}>
                {historyData.spreadVolatilityPct}%
              </Text>
              <Text style={styles.summaryCardSub}>High-to-low range</Text>
            </View>
          </View>

          {/* ── Interactive SVG Price History Chart ───────────────── */}
          <View style={styles.chartCard}>
            <View style={styles.chartCardHeader}>
              <View>
                <Text style={styles.chartCardTitle}>Modal Price Trendline</Text>
                <Text style={styles.chartCardSub}>
                  {historyData.priceUnit} • Tap any point to inspect day parameters
                </Text>
              </View>
              <View style={styles.chartSourceBadge}>
                <ShieldCheck size={11} color="#15803D" />
                <Text style={styles.chartSourceBadgeText}>AGMARKNET</Text>
              </View>
            </View>

            {/* SVG Sparkline Graph */}
            <View style={styles.svgContainer}>
              <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                  <SvgGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={MKColors.primary} stopOpacity={0.25} />
                    <Stop offset="100%" stopColor={MKColors.primary} stopOpacity={0.0} />
                  </SvgGradient>
                </Defs>

                {/* Horizontal reference gridlines */}
                <Line
                  x1={paddingX}
                  y1={paddingY}
                  x2={chartWidth - paddingX}
                  y2={paddingY}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <Line
                  x1={paddingX}
                  y1={chartHeight / 2}
                  x2={chartWidth - paddingX}
                  y2={chartHeight / 2}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <Line
                  x1={paddingX}
                  y1={chartHeight - paddingY + 8}
                  x2={chartWidth - paddingX}
                  y2={chartHeight - paddingY + 8}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />

                {/* Left side price scale indicators */}
                <SvgText
                  x={paddingX}
                  y={paddingY - 6}
                  fill="#94A3B8"
                  fontSize={9}
                  fontWeight="600"
                >
                  ₹{maxChartPrice}
                </SvgText>
                <SvgText
                  x={paddingX}
                  y={chartHeight - paddingY + 18}
                  fill="#94A3B8"
                  fontSize={9}
                  fontWeight="600"
                >
                  ₹{minChartPrice}
                </SvgText>

                {/* Area Gradient */}
                {polygonAreaPoints ? (
                  <Polygon points={polygonAreaPoints} fill="url(#areaGradient)" />
                ) : null}

                {/* Main Modal Price Polyline */}
                {polylinePoints ? (
                  <Polyline
                    points={polylinePoints}
                    fill="none"
                    stroke={MKColors.primary}
                    strokeWidth={3}
                  />
                ) : null}

                {/* Observation Data Points */}
                {pointCoordinates.map((pt, i) => {
                  const isSelected = selectedPointIndex === i;
                  return (
                    <React.Fragment key={i}>
                      {/* Selection vertical crosshair line */}
                      {isSelected && (
                        <Line
                          x1={pt.x}
                          y1={paddingY}
                          x2={pt.x}
                          y2={chartHeight - paddingY + 8}
                          stroke={MKColors.primary}
                          strokeWidth={1.5}
                          strokeDasharray="2 2"
                        />
                      )}
                      <Circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? 6.5 : 4}
                        fill={isSelected ? MKColors.primary : '#FFFFFF'}
                        stroke={MKColors.primary}
                        strokeWidth={2}
                        onPress={() => setSelectedPointIndex(i)}
                      />
                    </React.Fragment>
                  );
                })}
              </Svg>
            </View>

            {/* Inspected Data Point Details Card */}
            {activePoint && (
              <View style={styles.activePointCard}>
                <View style={styles.activePointHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activePointDate}>
                      {activePoint.displayDate} ({activePoint.dayOfWeek})
                    </Text>
                    <Text style={styles.activePointSub}>Recorded APMC Auction Session</Text>
                  </View>
                  {activePoint.changePct !== undefined && (
                    <View
                      style={[
                        styles.activePointChangeBadge,
                        activePoint.changePct >= 0
                          ? styles.activePointChangeUp
                          : styles.activePointChangeDown,
                      ]}
                    >
                      {activePoint.changePct >= 0 ? (
                        <TrendingUp size={11} color="#15803D" />
                      ) : (
                        <TrendingDown size={11} color="#DC2626" />
                      )}
                      <Text
                        style={[
                          styles.activePointChangeText,
                          activePoint.changePct >= 0 ? styles.changeTextUp : styles.changeTextDown,
                        ]}
                      >
                        {activePoint.changePct >= 0
                          ? `+${activePoint.changePct}%`
                          : `${activePoint.changePct}%`}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Detailed Values for the selected day */}
                <View style={styles.activePointGrid}>
                  <View style={styles.activePointBox}>
                    <Text style={styles.activePointBoxLabel}>Modal Rate</Text>
                    <Text style={styles.activePointBoxVal}>
                      ₹{activePoint.modalPriceQtl?.toLocaleString('en-IN') || '—'}
                    </Text>
                    <Text style={styles.activePointBoxKg}>
                      ≈ ₹{activePoint.modalPriceKg || '—'}/kg
                    </Text>
                  </View>

                  <View style={styles.activePointBox}>
                    <Text style={styles.activePointBoxLabel}>Min - Max Corridor</Text>
                    <Text style={styles.activePointBoxVal}>
                      ₹{activePoint.minPriceQtl?.toLocaleString('en-IN') || '—'} - ₹{activePoint.maxPriceQtl?.toLocaleString('en-IN') || '—'}
                    </Text>
                    <Text style={styles.activePointBoxKg}>
                      Spread: ₹{((activePoint.maxPriceQtl || 0) - (activePoint.minPriceQtl || 0)).toLocaleString('en-IN')}/qtl
                    </Text>
                  </View>

                  <View style={styles.activePointBox}>
                    <Text style={styles.activePointBoxLabel}>Daily Arrivals</Text>
                    <Text style={styles.activePointBoxVal}>
                      {activePoint.arrivalQtl?.toLocaleString('en-IN') || '—'} qtl
                    </Text>
                    <Text style={styles.activePointBoxKg}>
                      ≈ {((activePoint.arrivalQtl || 0) / 10).toFixed(0)} MT
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* ── Chronological Observations Audit Table ───────────── */}
          <View style={styles.tableCard}>
            <View style={styles.tableCardHeader}>
              <Calendar size={16} color="#0F172A" />
              <Text style={styles.tableCardTitle}>Daily Session Observations Record</Text>
            </View>
            <Text style={styles.tableCardSub}>
              Official Mandi market transactions recorded chronologically. Sundays and statutory holidays are explicitly recorded as non-trading days.
            </Text>

            <View style={styles.tableWrap}>
              {/* Table Column Headers */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thCell, { flex: 1.5 }]}>Date</Text>
                <Text style={[styles.thCell, { flex: 1.8 }]}>Modal Rate</Text>
                <Text style={[styles.thCell, { flex: 1.6 }]}>Min - Max</Text>
                <Text style={[styles.thCell, { flex: 1.4, textAlign: 'right' }]}>Arrivals</Text>
              </View>

              {/* Rows */}
              {historyData.observations.map((obs, index) => {
                const isSelected =
                  activePoint &&
                  activePoint.date === obs.date &&
                  activePoint.isTradingDay;

                if (!obs.isTradingDay) {
                  return (
                    <View key={index} style={styles.tableClosedRow}>
                      <View style={{ flex: 1.5 }}>
                        <Text style={styles.closedDateText}>{obs.displayDate}</Text>
                        <Text style={styles.closedDayText}>{obs.dayOfWeek}</Text>
                      </View>
                      <View style={{ flex: 4.8 }}>
                        <Text style={styles.closureReasonText}>
                          {obs.closureReason || 'APMC Trading Floor Closed'}
                        </Text>
                      </View>
                    </View>
                  );
                }

                return (
                  <Pressable
                    key={index}
                    style={[styles.tableRow, isSelected && styles.tableRowSelected]}
                    onPress={() => {
                      const foundIdx = pointCoordinates.findIndex(
                        (p) => p.observation.date === obs.date
                      );
                      if (foundIdx !== -1) {
                        setSelectedPointIndex(foundIdx);
                      }
                    }}
                  >
                    <View style={{ flex: 1.5 }}>
                      <Text style={styles.tdDateText}>{obs.displayDate}</Text>
                      <Text style={styles.tdDayText}>{obs.dayOfWeek}</Text>
                    </View>

                    <View style={{ flex: 1.8 }}>
                      <Text style={styles.tdModalText}>
                        ₹{obs.modalPriceQtl?.toLocaleString('en-IN')}
                        <Text style={styles.tdUnit}>/qtl</Text>
                      </Text>
                      <Text style={styles.tdKgText}>₹{obs.modalPriceKg}/kg</Text>
                    </View>

                    <View style={{ flex: 1.6 }}>
                      <Text style={styles.tdRangeText}>
                        ₹{obs.minPriceQtl} - {obs.maxPriceQtl}
                      </Text>
                    </View>

                    <View style={{ flex: 1.4, alignItems: 'flex-end' }}>
                      <Text style={styles.tdArrivalText}>
                        {obs.arrivalQtl?.toLocaleString('en-IN')} qtl
                      </Text>
                      {obs.changePct !== undefined && (
                        <Text
                          style={[
                            styles.tdChangeText,
                            obs.changePct >= 0 ? styles.changeTextUp : styles.changeTextDown,
                          ]}
                        >
                          {obs.changePct >= 0 ? `+${obs.changePct}%` : `${obs.changePct}%`}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Data Integrity Notice ────────────────────────────── */}
          <View style={styles.integrityCard}>
            <View style={styles.integrityHeader}>
              <Scale size={15} color="#475569" />
              <Text style={styles.integrityTitle}>Calculation & Integrity Principles</Text>
            </View>
            <Text style={styles.integrityText}>
              • All historical data is cataloged in statutory ₹/quintal units and normalized using the standard 1 Quintal = 100 kg formula.
              {'\n'}• Non-trading days (Sundays and gazetted closures) are recorded accurately without mathematical interpolation or manufactured quotes.
              {'\n'}• Past price trajectories reflect historical mandi auction auctions and do not guarantee future spot rates.
            </Text>
          </View>

          {/* ── Path Back to Market Price Details ─────────────────── */}
          <Pressable
            style={styles.returnBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft size={16} color="#FFFFFF" />
            <Text style={styles.returnBtnText}>
              Back to Current {commodity} Price Details
            </Text>
          </Pressable>
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
  emptyBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: MKColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyBackBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  timeframeBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 3,
    borderRadius: 10,
    gap: 4,
  },
  timeframeChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeframeChipSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeframeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  timeframeChipTextSelected: {
    color: MKColors.primary,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  summaryCardVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryCardValGreen: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
  },
  summaryCardValOrange: {
    fontSize: 18,
    fontWeight: '800',
    color: '#C2410C',
  },
  summaryCardUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  summaryCardSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chartCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  chartCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  chartSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chartSourceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  svgContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  activePointCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  activePointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activePointDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  activePointSub: {
    fontSize: 10,
    color: '#64748B',
  },
  activePointChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePointChangeUp: {
    backgroundColor: '#DCFCE7',
  },
  activePointChangeDown: {
    backgroundColor: '#FEE2E2',
  },
  activePointChangeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  changeTextUp: {
    color: '#15803D',
  },
  changeTextDown: {
    color: '#DC2626',
  },
  activePointGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  activePointBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activePointBoxLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  activePointBoxVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  activePointBoxKg: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tableCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableCardSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 12,
  },
  tableWrap: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  thCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  tableRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  tableClosedRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  closedDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  closedDayText: {
    fontSize: 9,
    color: '#CBD5E1',
  },
  closureReasonText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  tdDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  tdDayText: {
    fontSize: 10,
    color: '#64748B',
  },
  tdModalText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  tdUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  tdKgText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  tdRangeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  tdArrivalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  tdChangeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  integrityCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  integrityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  integrityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  integrityText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 17,
  },
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: MKColors.primary,
    padding: 13,
    borderRadius: 10,
  },
  returnBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
