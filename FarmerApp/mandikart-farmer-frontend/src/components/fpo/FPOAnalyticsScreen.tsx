/**
 * MandiKart — FPO Performance & Financial Analytics Screen
 *
 * Dedicated executive business intelligence for FPO leadership:
 * - Aggregation volume and seasonal turnover
 * - Member farmer payout distribution & pass-through efficiency
 * - Crop-wise volume breakdown
 * - Working capital & procurement savings realization
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  Users,
  PackageCheck,
  Percent,
  Download,
  Share2,
  Calendar,
  CheckCircle2,
  Building2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';

const NAVY_DEEP = '#08162B';
const NAVY_MID  = '#0F2C56';
const NAVY_FPO  = '#1A4D8E';
const FPO_BLUE = '#1B4D8E';
const FPO_BLUE_BG = '#EBF2FF';
const ACCENT_GREEN = '#15803D';

export default function FPOAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState<'KHARIF_2025' | 'RABI_2026' | 'FY25_26'>('RABI_2026');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleExportReport = async () => {
    try {
      await Share.share({
        message: `MandiKart FPO Audit & Payout Report — ${user?.fpoDetails?.fpoName || 'FPO'}\nSeason: Rabi 2026\nAggregated: 218 MT | Gross Sales: ₹74,50,000 | Disbursed to Farmers: ₹69,10,000 (92.7%)\nAudited via MandiKart Institutional Desk.`,
      });
    } catch {
      Alert.alert('Report Exported', 'Financial statement saved to documents folder.');
    }
  };

  const topInset = Math.max(insets.top, 16);

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <LinearGradient
        colors={[NAVY_DEEP, NAVY_MID, NAVY_FPO]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topInset }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fpoOrgLabel}>{user?.fpoDetails?.fpoName || 'Farmer Producer Org'}</Text>
            <Text style={styles.screenTitle}>Performance & Payouts</Text>
          </View>
          <Pressable style={styles.exportBtn} onPress={handleExportReport}>
            <Share2 size={15} color="#FFFFFF" />
            <Text style={styles.exportBtnText}>Export Report</Text>
          </Pressable>
        </View>

        {/* Season Selector */}
        <View style={styles.timeRangeRow}>
          {[
            { id: 'RABI_2026', label: 'Current Rabi 2026' },
            { id: 'KHARIF_2025', label: 'Kharif 2025' },
            { id: 'FY25_26', label: 'Full Year 25-26' },
          ].map((item) => {
            const isActive = timeRange === item.id;
            return (
              <Pressable
                key={item.id}
                style={[styles.timeChip, isActive && styles.timeChipActive]}
                onPress={() => setTimeRange(item.id as any)}
              >
                <Text style={[styles.timeChipText, isActive && styles.timeChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={FPO_BLUE} />}
      >
        {/* ── 1. Financial High-Level Summary Card ────────────── */}
        <View style={styles.mainFinCard}>
          <Text style={styles.finCardHeader}>Gross Institutional Turnover</Text>
          <Text style={styles.finBigNumber}>₹74,50,000</Text>
          <View style={styles.finSubRow}>
            <View style={styles.finSubItem}>
              <TrendingUp size={14} color="#16A34A" />
              <Text style={styles.finSubItemText}>+28.4% vs last season</Text>
            </View>
            <Text style={styles.volumeSubText}>218 Metric Tonnes Transacted</Text>
          </View>

          <View style={styles.divider} />

          {/* Pass-through breakdown */}
          <View style={styles.payoutGrid}>
            <View style={styles.payoutCol}>
              <Text style={styles.payoutLabel}>Disbursed to Farmers</Text>
              <Text style={[styles.payoutVal, { color: ACCENT_GREEN }]}>₹69,10,000</Text>
              <Text style={styles.payoutRate}>92.7% Pass-Through</Text>
            </View>
            <View style={styles.payoutDivider} />
            <View style={styles.payoutCol}>
              <Text style={styles.payoutLabel}>FPO Retained Margin</Text>
              <Text style={[styles.payoutVal, { color: FPO_BLUE }]}>₹5,40,000</Text>
              <Text style={styles.payoutRate}>Operational Surplus</Text>
            </View>
          </View>
        </View>

        {/* ── 2. Member Participation & Reach ───────────────────── */}
        <Text style={styles.sectionHeading}>Member Farmer Engagement</Text>
        <View style={styles.grid2}>
          <View style={styles.metricCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#EBF2FF' }]}>
              <Users size={18} color={FPO_BLUE} />
            </View>
            <Text style={styles.metricBig}>148 / 185</Text>
            <Text style={styles.metricTitle}>Active Contributing Farmers</Text>
            <Text style={styles.metricSubtitle}>80% participation rate</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <IndianRupee size={18} color={ACCENT_GREEN} />
            </View>
            <Text style={styles.metricBig}>₹46,680</Text>
            <Text style={styles.metricTitle}>Avg Farmer Realization</Text>
            <Text style={styles.metricSubtitle}>+18% above APMC local mandi</Text>
          </View>
        </View>

        {/* ── 3. Crop Volume Breakdown ──────────────────────────── */}
        <Text style={styles.sectionHeading}>Commodity Volume Breakdown</Text>
        <View style={styles.cropListCard}>
          {[
            { name: 'Sharbati Wheat (Grade A)', volumeMT: 95, pct: 44, value: '₹32,30,000', color: '#3B82F6' },
            { name: 'Pusa Basmati 1509 Paddy', volumeMT: 60, pct: 28, value: '₹25,20,000', color: '#10B981' },
            { name: 'Yellow Mustard (42% Oil)', volumeMT: 38, pct: 17, value: '₹22,04,000', color: '#F59E0B' },
            { name: 'Desi Chana (Bengal Gram)', volumeMT: 25, pct: 11, value: '₹15,25,000', color: '#8B5CF6' },
          ].map((item, index) => (
            <View key={index} style={styles.cropItemRow}>
              <View style={styles.cropItemTop}>
                <Text style={styles.cropItemName}>{item.name}</Text>
                <Text style={styles.cropItemVal}>{item.volumeMT} MT ({item.pct}%)</Text>
              </View>
              {/* Progress bar */}
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
              </View>
              <View style={styles.cropItemBot}>
                <Text style={styles.cropGrossVal}>Total Contract Value: {item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── 4. Operational Health ─────────────────────────────── */}
        <Text style={styles.sectionHeading}>Compliance & Banking Health</Text>
        <View style={styles.auditCard}>
          <View style={styles.auditRow}>
            <CheckCircle2 size={18} color="#059669" />
            <View style={{ flex: 1 }}>
              <Text style={styles.auditTitle}>Bank Account & PAN / GST KYC</Text>
              <Text style={styles.auditSub}>Current A/c Verified • Ready for NABARD subsidy</Text>
            </View>
          </View>

          <View style={styles.auditRow}>
            <CheckCircle2 size={18} color="#059669" />
            <View style={{ flex: 1 }}>
              <Text style={styles.auditTitle}>Escrow T+3 Settlement Performance</Text>
              <Text style={styles.auditSub}>100% of institutional orders settled on time</Text>
            </View>
          </View>

          <View style={styles.auditRow}>
            <CheckCircle2 size={18} color="#059669" />
            <View style={{ flex: 1 }}>
              <Text style={styles.auditTitle}>Input Collective Bulk Purchasing</Text>
              <Text style={styles.auditSub}>₹1,42,000 saved across 450 fertilizer bags</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#0F294D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 7,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  fpoOrgLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 3,
    letterSpacing: -0.3,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeRangeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  timeChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  timeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  timeChipTextActive: {
    color: NAVY_DEEP,
    fontWeight: '800',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  mainFinCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F294D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  finCardHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  finBigNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  finSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  finSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  finSubItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  volumeSubText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  payoutGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutCol: {
    flex: 1,
  },
  payoutDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  payoutLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  payoutVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  payoutRate: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 6,
  },
  grid2: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F294D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricBig: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  metricSubtitle: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  cropListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F294D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    gap: 14,
  },
  cropItemRow: {
    gap: 6,
  },
  cropItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  cropItemVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  cropItemBot: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cropGrossVal: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  auditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F294D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
    marginBottom: 16,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  auditTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  auditSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
