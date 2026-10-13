/**
 * MandiKart — FPO Performance & Financial Analytics Screen
 *
 * Dedicated executive business intelligence for FPO leadership:
 * - Aggregation volume and seasonal turnover
 * - Member farmer payout distribution & pass-through efficiency
 * - Crop-wise volume breakdown
 * - Working capital & procurement savings realization
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Share,
  Alert,
  ActivityIndicator,
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
import { apiClient } from '@/services/apiClient';
import type { FPOLot, FPOMember } from '@/types';

const NAVY_DEEP = '#08162B';
const NAVY_MID  = '#0F2C56';
const NAVY_FPO  = '#1A4D8E';
const FPO_BLUE = '#1B4D8E';
const FPO_BLUE_BG = '#EBF2FF';
const ACCENT_GREEN = '#15803D';

export default function FPOAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { user, isHydrated } = useAuthStore();
  const fpoId = user?.fpoDetails?.fpoId;
  const [members, setMembers] = useState<FPOMember[]>([]);
  const [lots, setLots] = useState<FPOLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (activeFpoId = fpoId) => {
    if (!activeFpoId) {
      setLoading(false);
      setSyncError(isHydrated ? 'This FPO profile has no FPO ID yet.' : 'Waiting for the FPO profile to finish loading…');
      setRefreshing(false);
      return;
    }

    setLoading(true);
    setSyncError(null);
    try {
      const [memberRes, lotRes]: any = await Promise.all([
        apiClient.getFPOMembers(activeFpoId),
        apiClient.getFPOLots(activeFpoId),
      ]);
      setMembers(memberRes?.data && Array.isArray(memberRes.data) ? memberRes.data : []);
      setLots(lotRes?.data && Array.isArray(lotRes.data) ? lotRes.data : []);
    } catch (err) {
      console.warn('Failed to sync FPO analytics:', err);
      setSyncError('Connected member and lot data could not be synced.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(fpoId);
  }, [fpoId, isHydrated]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics(fpoId);
  };

  const handleExportReport = async () => {
    try {
      const totalVolumeMT = lots.reduce((sum, lot) => sum + (lot.estimatedQtyMT || 0), 0);
      const deliveredMT = members.reduce((sum, member) => sum + (member.totalDeliveredMT || 0), 0);
      await Share.share({
        message: `MandiKart FPO connected-record summary — ${user?.fpoDetails?.fpoName || 'FPO'}\nLots: ${lots.length} | Recorded volume: ${totalVolumeMT} MT\nMembers: ${members.length} | Recorded deliveries: ${deliveredMT} MT\nThis is a data summary, not an audited financial statement.`,
      });
    } catch {
      Alert.alert('Share unavailable', 'The connected-record summary could not be shared.');
    }
  };

  const totalVolumeMT = lots.reduce((sum, lot) => sum + (lot.estimatedQtyMT || 0), 0);
  const contractedVolumeMT = lots
    .filter((lot) => lot.status === 'CONTRACTED' || lot.status === 'SOLD')
    .reduce((sum, lot) => sum + (lot.estimatedQtyMT || 0), 0);
  const deliveredMT = members.reduce((sum, member) => sum + (member.totalDeliveredMT || 0), 0);
  const recordedEarnings = members.reduce((sum, member) => sum + (member.totalEarningsViaFPO || 0), 0);
  const cropVolumes = Array.from(
    lots.reduce((map, lot) => map.set(lot.cropName, (map.get(lot.cropName) || 0) + (lot.estimatedQtyMT || 0)), new Map<string, number>())
  ).sort(([, first], [, second]) => second - first);

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

        <View style={styles.syncHeaderRow}>
          <View style={styles.syncHeaderDot} />
          <Text style={styles.syncHeaderText}>{loading ? 'Syncing connected records…' : syncError || 'Metrics sourced from member and lot records'}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={FPO_BLUE} />}
      >
        {loading ? (
          <View style={styles.statePanel}>
            <ActivityIndicator size="large" color={FPO_BLUE} />
            <Text style={styles.stateTitle}>Syncing connected records</Text>
            <Text style={styles.stateText}>Loading member and lot data for this FPO.</Text>
          </View>
        ) : syncError ? (
          <View style={styles.statePanel}>
            <Clock size={42} color="#B45309" />
            <Text style={styles.stateTitle}>Analytics sync unavailable</Text>
            <Text style={styles.stateText}>{syncError}</Text>
            <Pressable style={styles.retryBtn} onPress={() => fetchAnalytics(fpoId)}>
              <Text style={styles.retryBtnText}>Retry sync</Text>
            </Pressable>
          </View>
        ) : members.length === 0 && lots.length === 0 ? (
          <View style={styles.statePanel}>
            <BarChart3 size={46} color="#64748B" />
            <Text style={styles.stateTitle}>No connected records yet</Text>
            <Text style={styles.stateText}>Add members or create a produce lot to see operational metrics here.</Text>
          </View>
        ) : (
          <>
            {/* ── 1. Connected record summary ─────────────────────── */}
            <View style={styles.mainFinCard}>
              <Text style={styles.finCardHeader}>Connected lot volume</Text>
              <Text style={styles.finBigNumber}>{totalVolumeMT} MT</Text>
              <View style={styles.finSubRow}>
                <View style={styles.finSubItem}>
                  <TrendingUp size={14} color="#16A34A" />
                  <Text style={styles.finSubItemText}>{lots.length} lot{lots.length === 1 ? '' : 's'} recorded</Text>
                </View>
                <Text style={styles.volumeSubText}>{members.length} member records</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.payoutGrid}>
                <View style={styles.payoutCol}>
                  <Text style={styles.payoutLabel}>Recorded deliveries</Text>
                  <Text style={[styles.payoutVal, { color: ACCENT_GREEN }]}>{deliveredMT} MT</Text>
                  <Text style={styles.payoutRate}>Member data only</Text>
                </View>
                <View style={styles.payoutDivider} />
                <View style={styles.payoutCol}>
                  <Text style={styles.payoutLabel}>Recorded member earnings</Text>
                  <Text style={[styles.payoutVal, { color: FPO_BLUE }]}>
                    {recordedEarnings > 0 ? `₹${recordedEarnings.toLocaleString('en-IN')}` : 'Not reported'}
                  </Text>
                  <Text style={styles.payoutRate}>No financial estimate</Text>
                </View>
              </View>
            </View>

            {/* ── 2. Member participation & lot status ────────────── */}
            <Text style={styles.sectionHeading}>Member and lot participation</Text>
            <View style={styles.grid2}>
              <View style={styles.metricCard}>
                <View style={[styles.iconCircle, { backgroundColor: '#EBF2FF' }]}>
                  <Users size={18} color={FPO_BLUE} />
                </View>
                <Text style={styles.metricBig}>{members.filter((member) => member.status === 'ACTIVE').length} / {members.length}</Text>
                <Text style={styles.metricTitle}>Active members</Text>
                <Text style={styles.metricSubtitle}>{members.filter((member) => member.status === 'PENDING').length} pending review</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <PackageCheck size={18} color="#0369A1" />
                </View>
                <Text style={styles.metricBig}>{contractedVolumeMT} MT</Text>
                <Text style={styles.metricTitle}>Contracted or sold</Text>
                <Text style={styles.metricSubtitle}>Based on lot status</Text>
              </View>
            </View>

            {/* ── 3. Crop volume breakdown ───────────────────────── */}
            <Text style={styles.sectionHeading}>Commodity volume breakdown</Text>
            <View style={styles.cropListCard}>
              {cropVolumes.length === 0 ? <Text style={styles.stateText}>No lot crop volumes have been recorded.</Text> : cropVolumes.map(([name, volumeMT], index) => {
                const pct = totalVolumeMT > 0 ? Math.round((volumeMT / totalVolumeMT) * 100) : 0;
                return (
                  <View key={name} style={styles.cropItemRow}>
                    <View style={styles.cropItemTop}>
                      <Text style={styles.cropItemName}>{name}</Text>
                      <Text style={styles.cropItemVal}>{volumeMT} MT ({pct}%)</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][index % 4] }]} />
                    </View>
                    <View style={styles.cropItemBot}>
                      <Text style={styles.cropGrossVal}>No price or contract value reported</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* ── 4. Data health ─────────────────────────────────── */}
            <Text style={styles.sectionHeading}>Data connection health</Text>
            <View style={styles.auditCard}>
              <View style={styles.auditRow}>
                <CheckCircle2 size={18} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditTitle}>Member registry connected</Text>
                  <Text style={styles.auditSub}>{members.length} member record{members.length === 1 ? '' : 's'} loaded from the FPO service.</Text>
                </View>
              </View>

              <View style={styles.auditRow}>
                <CheckCircle2 size={18} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditTitle}>Lot inventory connected</Text>
                  <Text style={styles.auditSub}>{lots.length} produce lot{lots.length === 1 ? '' : 's'} loaded from the FPO service.</Text>
                </View>
              </View>

              <View style={styles.auditRow}>
                <Clock size={18} color="#B45309" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditTitle}>Buyer, procurement and scheme services unavailable</Text>
                  <Text style={styles.auditSub}>No tender, payment, grant, or savings claims are included in these metrics.</Text>
                </View>
              </View>
            </View>
          </>
        )}
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
  syncHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  syncHeaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  syncHeaderText: {
    flex: 1,
    color: '#DBEAFE',
    fontSize: 11,
    fontWeight: '700',
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
    minHeight: 44,
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
  statePanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  stateTitle: {
    color: '#1E293B',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },
  stateText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  retryBtn: {
    backgroundColor: FPO_BLUE,
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
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
