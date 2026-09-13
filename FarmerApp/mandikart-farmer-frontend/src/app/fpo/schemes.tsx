/**
 * MandiKart — FPO Government Schemes & Grants Tracker
 *
 * Route: /fpo/schemes
 *
 * Real-time eligibility tracker and application center for Indian government
 * central & state agriculture support programs:
 * - 10,000 FPO Formation & Promotion Scheme (Equity + Mgmt Grants)
 * - Agriculture Infrastructure Fund (AIF 3% interest subvention)
 * - Sub-Mission on Agricultural Mechanization (SMAM 80% CHC subsidy)
 * - PM-Fasal Bima Yojana group coverage
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  FileCheck,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  IndianRupee,
  Sparkles,
  Calendar,
  Send,
} from 'lucide-react-native';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import type { FPOScheme } from '@/types';

const NAVY_DEEP = '#08162B';
const NAVY_MID  = '#0F2C56';
const NAVY_FPO  = '#1A4D8E';
const FPO_BLUE = '#1B4D8E';
const FPO_BLUE_BG = '#EBF2FF';
const FPO_DARK = '#0F2D54';
const ACCENT_GREEN = '#15803D';

export default function FPOSchemesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [schemes, setSchemes] = useState<FPOScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSchemes = async () => {
    try {
      const res: any = await apiClient.getFPOSchemes();
      if (res?.data && Array.isArray(res.data)) {
        setSchemes(res.data as FPOScheme[]);
      }
    } catch (err) {
      console.warn('Failed to load schemes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSchemes();
  };

  const handleApply = async (scheme: FPOScheme) => {
    Alert.alert(
      'Apply for Scheme',
      `Submit FPO registration credentials and audited member list for "${scheme.schemeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Portal',
          onPress: async () => {
            try {
              await apiClient.applyFPOScheme(scheme.id);
              setSchemes((prev) =>
                prev.map((s) => (s.id === scheme.id ? { ...s, status: 'IN_REVIEW' as const } : s))
              );
              if (scheme.applyUrl) {
                Linking.openURL(scheme.applyUrl).catch(() => {});
              }
              Alert.alert('Application Submitted', 'Your FPO application has been recorded in the central e-NAM / DAC&FW portal.');
            } catch {
              Alert.alert('Error', 'Could not apply at this moment.');
            }
          },
        },
      ]
    );
  };

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
        <View style={styles.headerTop}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.fpoOrgLabel}>{user?.fpoDetails?.fpoName || 'FPO Grants'}</Text>
            <Text style={styles.screenTitle}>Government Grants & Schemes</Text>
          </View>
        </View>

        {/* ── Subsidy Banner ──────────────────────────────────── */}
        <View style={styles.grantBanner}>
          <View style={styles.grantIconBox}>
            <Sparkles size={18} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.grantTitle}>Up to ₹33 Lakhs in Central Grants</Text>
            <Text style={styles.grantSub}>
              Matching equity grant up to ₹15 Lakhs + ₹18 Lakhs management subsidy available under Ministry of Agriculture guidelines.
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Schemes List ───────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={FPO_BLUE} />
          <Text style={styles.loadingText}>Fetching Government Portals...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={FPO_BLUE} />}
        >
          {schemes.map((scheme) => {
            const isApproved = scheme.status === 'APPROVED';
            const isApplied = scheme.status === 'APPLIED' || scheme.status === 'IN_REVIEW';
            const isEligible = scheme.status === 'ELIGIBLE';

            return (
              <View key={scheme.id} style={styles.schemeCard}>
                {/* Header info */}
                <View style={styles.schemeHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusBadge, isApproved ? styles.tagApproved : isApplied ? styles.tagApplied : styles.tagEligible]}>
                        <Text style={[styles.statusText, isApproved ? styles.textApproved : isApplied ? styles.textApplied : styles.textEligible]}>
                          {scheme.status.replace('_', ' ')}
                        </Text>
                      </View>
                      {scheme.deadline && (
                        <View style={styles.deadlineBadge}>
                          <Clock size={11} color="#92400E" />
                          <Text style={styles.deadlineText}>Deadline: {scheme.deadline}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.schemeName}>{scheme.schemeName}</Text>
                    <Text style={styles.ministryText}>{scheme.ministry}</Text>
                  </View>
                </View>

                {/* Benefit Box */}
                <View style={styles.benefitBox}>
                  <IndianRupee size={16} color={ACCENT_GREEN} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.benefitLabel}>Grant / Subsidy Benefit:</Text>
                    <Text style={styles.benefitText}>{scheme.benefit}</Text>
                  </View>
                </View>

                {/* Qualification Checklist */}
                {scheme.qualificationReasons && scheme.qualificationReasons.length > 0 && (
                  <View style={styles.qualBox}>
                    <Text style={styles.qualLabel}>Why Your FPO Qualifies:</Text>
                    {scheme.qualificationReasons.map((reason, idx) => (
                      <View key={idx} style={styles.qualRow}>
                        <CheckCircle2 size={13} color="#059669" />
                        <Text style={styles.qualText}>{reason}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* CTA Action */}
                <View style={styles.cardFooter}>
                  {isApproved ? (
                    <View style={styles.approvedNotice}>
                      <CheckCircle2 size={16} color="#059669" />
                      <Text style={styles.approvedNoticeText}>Sanctioned • Subsidy credited to Bank A/C</Text>
                    </View>
                  ) : isApplied ? (
                    <View style={styles.appliedNotice}>
                      <Clock size={16} color="#B45309" />
                      <Text style={styles.appliedNoticeText}>Application Under Review by Nodal Agency</Text>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.applyBtn}
                      onPress={() => handleApply(scheme)}
                    >
                      <Send size={15} color="#FFFFFF" />
                      <Text style={styles.applyBtnText}>Apply via MandiKart Desk</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fpoOrgLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  grantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  grantIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  grantSub: {
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 16,
    marginTop: 2,
  },
  content: {
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
  schemeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F294D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    gap: 12,
  },
  schemeHeader: {
    flexDirection: 'row',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagApproved: { backgroundColor: '#DEF7EC' },
  tagApplied: { backgroundColor: '#FEF3C7' },
  tagEligible: { backgroundColor: '#E0F2FE' },
  statusText: { fontSize: 10, fontWeight: '800' },
  textApproved: { color: '#046C4E' },
  textApplied: { color: '#B45309' },
  textEligible: { color: '#0369A1' },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deadlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  schemeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  ministryText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  benefitBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  benefitLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  benefitText: {
    fontSize: 12,
    color: '#14532D',
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 2,
  },
  qualBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    gap: 5,
  },
  qualLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  qualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qualText: {
    fontSize: 11,
    color: '#334155',
  },
  cardFooter: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  approvedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
  },
  approvedNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  appliedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 6,
  },
  appliedNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: FPO_BLUE,
    paddingVertical: 10,
    borderRadius: 8,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
