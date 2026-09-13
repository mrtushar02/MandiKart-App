/**
 * MandiKart — Advanced Modern FPO Command Dashboard
 *
 * Designed to "WOW" with UI UX Pro Max standards:
 * - Deep multi-tone gradient mesh header with glassmorphic accents
 * - Animated pulse indicator for live e-NAM & APMC network synchronization
 * - 3D elevated floating metric cards with tactile shadows & gradient icon containers
 * - Interactive 3D quick action launchpad replacing flat emojis with sleek Lucide vectors
 * - Real-time institutional procurement radar & harvest aggregation pipeline visualizer
 * - Dynamic live operational feed with direct actionable navigation
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  PackageCheck,
  TrendingUp,
  Handshake,
  ShoppingBag,
  Award,
  BarChart3,
  Bell,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Building2,
  Warehouse,
  Scale,
  Clock,
  CheckCircle2,
  PackagePlus,
  Flame,
  Zap,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';

const { width } = Dimensions.get('window');

// ── Color Palette ────────────────────────────────────────────────────────────
const NAVY_DEEP = '#08162B';
const NAVY_MID  = '#0F2C56';
const NAVY_FPO  = '#1A4D8E';

export default function FPODashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const fpo = user?.fpoDetails;

  // Pulse animation for live radar pill
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Infinite gentle pulse for status dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const topPad = Math.max(insets.top, 14);

  // ── Metrics Data ───────────────────────────────────────────────────────────
  const metrics = [
    {
      id: 'members',
      label: 'Shareholder Farmers',
      value: String(fpo?.memberCount || 185),
      change: '+14 this month',
      trendUp: true,
      icon: Users,
      gradient: ['#3B82F6', '#1D4ED8'] as const,
      route: '/fpo/members',
    },
    {
      id: 'inventory',
      label: 'Aggregated Produce',
      value: `${fpo?.totalInventoryMT || 168} MT`,
      change: '88% Grade A/B',
      trendUp: true,
      icon: PackageCheck,
      gradient: ['#10B981', '#047857'] as const,
      route: '/(tabs)/produce',
    },
    {
      id: 'turnover',
      label: 'Gross Seasonal Sales',
      value: fpo?.annualTurnoverBracket || '₹74.5L',
      change: '92.7% Payout Rate',
      trendUp: true,
      icon: TrendingUp,
      gradient: ['#F59E0B', '#B45309'] as const,
      route: '/(tabs)/orders',
    },
    {
      id: 'schemes',
      label: 'Govt Grants Secured',
      value: '₹15.0L',
      change: 'AIF & 10K FPO',
      trendUp: true,
      icon: Award,
      gradient: ['#8B5CF6', '#6D28D9'] as const,
      route: '/fpo/schemes',
    },
  ];

  // ── 3D Quick Actions ───────────────────────────────────────────────────────
  const actions = [
    {
      title: 'Create Bulk Lot',
      subtitle: 'Grading & e-NAM supply',
      icon: PackagePlus,
      gradient: ['#2563EB', '#1E40AF'] as const,
      route: '/(tabs)/produce',
      tag: 'NEW',
    },
    {
      title: 'B2B Buyers',
      subtitle: 'ITC, Adani, BigBasket',
      icon: Handshake,
      gradient: ['#059669', '#065F46'] as const,
      route: '/(tabs)/sell',
      tag: 'ACTIVE',
    },
    {
      title: 'Farmer Registry',
      subtitle: 'KCC, land & shares',
      icon: Users,
      gradient: ['#4F46E5', '#3730A3'] as const,
      route: '/fpo/members',
    },
    {
      title: 'Collective Inputs',
      subtitle: 'Wholesale fertilizer & seeds',
      icon: ShoppingBag,
      gradient: ['#D97706', '#92400E'] as const,
      route: '/fpo/procurement',
      tag: '14% OFF',
    },
    {
      title: 'Govt Schemes',
      subtitle: 'Grants up to ₹33 Lakhs',
      icon: Award,
      gradient: ['#7C3AED', '#5B21B6'] as const,
      route: '/fpo/schemes',
    },
    {
      title: 'Payout Analytics',
      subtitle: 'Farmer realization & audit',
      icon: BarChart3,
      gradient: ['#E11D48', '#9F1239'] as const,
      route: '/(tabs)/orders',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── 1. Hero Gradient Header with Glassmorphic Elements ── */}
      <LinearGradient
        colors={[NAVY_DEEP, NAVY_MID, NAVY_FPO]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topPad }]}
      >
        {/* Ambient Decorative Glowing Rings */}
        <View style={styles.glowRing1} />
        <View style={styles.glowRing2} />

        <View style={styles.headerTopBar}>
          <View style={styles.networkBadge}>
            <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.networkBadgeText}>e-NAM & APMC DESK ACTIVE</Text>
          </View>

          <Pressable style={styles.notificationBtn} onPress={() => router.push('/(tabs)/more')}>
            <Bell size={18} color="#FFFFFF" strokeWidth={2.2} />
            <View style={styles.notifBadge} />
          </Pressable>
        </View>

        <View style={styles.profileSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingText}>Producer Organization Command</Text>
            <Text style={styles.fpoTitle} numberOfLines={1}>
              {fpo?.fpoName || user?.fullName || 'Kisan Producer Company'}
            </Text>
            <View style={styles.metaBadgeRow}>
              <View style={styles.pillBadge}>
                <Building2 size={11} color="#93C5FD" />
                <Text style={styles.pillText}>{fpo?.registrationType || 'FPC'} Reg</Text>
              </View>
              <View style={styles.pillBadge}>
                <Text style={styles.pillText}>📍 {fpo?.district || user?.district || 'Local Cluster'}</Text>
              </View>
              <View style={[styles.pillBadge, { backgroundColor: 'rgba(245, 158, 11, 0.25)', borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                <ShieldCheck size={11} color="#FDE68A" />
                <Text style={[styles.pillText, { color: '#FDE68A', fontWeight: '800' }]}>
                  {fpo?.designation || 'CHAIRMAN & CEO'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── 2. Scrollable Dashboard Body ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── 3. Floating 3D Metric Deck (KPIs) ── */}
          <View style={styles.kpiContainer}>
            {metrics.map((item) => {
              const IconComp = item.icon;
              return (
                <Pressable
                  key={item.id}
                  style={styles.kpiCard}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={styles.kpiCardTop}>
                    <LinearGradient
                      colors={item.gradient}
                      style={styles.kpiIconContainer}
                    >
                      <IconComp size={18} color="#FFFFFF" strokeWidth={2.4} />
                    </LinearGradient>
                    <ArrowUpRight size={14} color="#94A3B8" />
                  </View>

                  <Text style={styles.kpiValue} numberOfLines={1}>{item.value}</Text>
                  <Text style={styles.kpiLabel} numberOfLines={1}>{item.label}</Text>

                  <View style={styles.kpiFooter}>
                    <View style={styles.trendDot} />
                    <Text style={styles.kpiChangeText} numberOfLines={1}>{item.change}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* ── 4. Live Institutional Tender Radar ── */}
          <View style={styles.radarCard}>
            <LinearGradient
              colors={['#1E3A8A', '#0F2C56']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.radarGradient}
            >
              <View style={styles.radarHeader}>
                <View style={styles.radarTag}>
                  <Zap size={12} color="#FDE047" fill="#FDE047" />
                  <Text style={styles.radarTagText}>LIVE TENDER RADAR</Text>
                </View>
                <Text style={styles.radarTime}>Updated 2m ago</Text>
              </View>

              <Text style={styles.radarHeadline}>
                ITC Agri Hub placed ₹35.2/kg bid on Sharbati Wheat Lot #W01
              </Text>
              <Text style={styles.radarSub}>
                Volume: 45 MT • Escrow payout guaranteed within 3 bank days upon gate weighment.
              </Text>

              <Pressable
                style={styles.radarBtn}
                onPress={() => router.push('/(tabs)/sell')}
              >
                <Text style={styles.radarBtnText}>Review & Accept Corporate Offer</Text>
                <ChevronRight size={15} color="#0F2C56" strokeWidth={2.5} />
              </Pressable>
            </LinearGradient>
          </View>

          {/* ── 5. 3D Interactive Action Launchpad ── */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeading}>OPERATIONAL LAUNCHPAD</Text>
              <Text style={styles.sectionSubtitle}>Institutional management tools</Text>
            </View>
            <Sparkles size={16} color="#3B82F6" />
          </View>

          <View style={styles.actionGrid}>
            {actions.map((act) => {
              const IconComp = act.icon;
              return (
                <Pressable
                  key={act.title}
                  style={styles.actionCard}
                  onPress={() => router.push(act.route as any)}
                >
                  <View style={styles.actionCardTop}>
                    <LinearGradient
                      colors={act.gradient}
                      style={styles.actionIconBadge}
                    >
                      <IconComp size={22} color="#FFFFFF" strokeWidth={2.3} />
                    </LinearGradient>
                    {act.tag && (
                      <View style={styles.actionTagBadge}>
                        <Text style={styles.actionTagText}>{act.tag}</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.actionTitle} numberOfLines={1}>{act.title}</Text>
                  <Text style={styles.actionSubtitle} numberOfLines={1}>{act.subtitle}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── 6. Visual Aggregation Pipeline Tracker ── */}
          <View style={styles.pipelineCard}>
            <Text style={styles.pipelineTitle}>Harvest Aggregation Pipeline</Text>
            <Text style={styles.pipelineSub}>Current season flow across member farms</Text>

            <View style={styles.pipelineSteps}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, styles.stepDone]}>
                  <CheckCircle2 size={15} color="#FFFFFF" />
                </View>
                <Text style={styles.stepName} numberOfLines={1}>Farmgate</Text>
                <Text style={styles.stepQty} numberOfLines={1}>218 MT</Text>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, styles.stepDone]}>
                  <Scale size={15} color="#FFFFFF" />
                </View>
                <Text style={styles.stepName} numberOfLines={1}>Grading</Text>
                <Text style={styles.stepQty} numberOfLines={1}>92% Gr. A</Text>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, styles.stepActive]}>
                  <Warehouse size={15} color="#FFFFFF" />
                </View>
                <Text style={[styles.stepName, { color: '#1E40AF', fontWeight: '800' }]} numberOfLines={1}>Lot Stock</Text>
                <Text style={styles.stepQty} numberOfLines={1}>168 MT</Text>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, styles.stepPending]}>
                  <Handshake size={15} color="#64748B" />
                </View>
                <Text style={styles.stepName} numberOfLines={1}>Contracts</Text>
                <Text style={styles.stepQty} numberOfLines={1}>60 MT Sold</Text>
              </View>
            </View>
          </View>

          {/* ── 7. Live Activity Stream ── */}
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeading}>LIVE DESK FEED</Text>
              <Text style={styles.sectionSubtitle}>Recent lots, tenders & shareholder signups</Text>
            </View>
          </View>

          <View style={styles.feedCard}>
            <View style={styles.feedItem}>
              <View style={[styles.feedDot, { backgroundColor: '#10B981' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.feedTitle}>Pusa Basmati 1509 Lot Contracted</Text>
                <Text style={styles.feedDesc}>60 MT secured with Adani Wilmar at ₹43.50/kg</Text>
              </View>
              <Text style={styles.feedTime}>Today</Text>
            </View>

            <View style={styles.feedDivider} />

            <View style={styles.feedItem}>
              <View style={[styles.feedDot, { backgroundColor: '#3B82F6' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.feedTitle}>New Member Enrolled</Text>
                <Text style={styles.feedDesc}>Rajesh Kumar Verma (Bilaspur) added 4.5 acres</Text>
              </View>
              <Text style={styles.feedTime}>Yesterday</Text>
            </View>

            <View style={styles.feedDivider} />

            <View style={styles.feedItem}>
              <View style={[styles.feedDot, { backgroundColor: '#F59E0B' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.feedTitle}>DAP Fertilizer Demand Pool Active</Text>
                <Text style={styles.feedDesc}>450 of 500 bags registered across 68 farmers</Text>
              </View>
              <Text style={styles.feedTime}>2d ago</Text>
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  glowRing1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
  },
  glowRing2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  networkBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#E0F2FE',
    letterSpacing: 0.5,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  notifBadge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#0F2C56',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#93C5FD',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fpoTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Scroll Body ──
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },

  // ── 3D KPI Cards ──
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: -16,
    marginBottom: 16,
  },
  kpiCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    shadowColor: '#0F294D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    justifyContent: 'space-between',
  },
  kpiCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  kpiIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  kpiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  trendDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  kpiChangeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },

  // ── Radar Card ──
  radarCard: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  radarGradient: {
    padding: 16,
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  radarTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(253, 224, 71, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.3)',
  },
  radarTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FDE047',
    letterSpacing: 0.5,
  },
  radarTime: {
    fontSize: 10,
    color: '#93C5FD',
    fontWeight: '500',
  },
  radarHeadline: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  radarSub: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 4,
    lineHeight: 16,
  },
  radarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FDE047',
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 12,
  },
  radarBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2C56',
  },

  // ── Section Title ──
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },

  // ── 3D Action Cards ──
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    shadowColor: '#0F294D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  actionTagBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // ── Visual Pipeline ──
  pipelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    shadowColor: '#0F294D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  pipelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  pipelineSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  pipelineSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 54,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDone: {
    backgroundColor: '#10B981',
  },
  stepActive: {
    backgroundColor: '#2563EB',
  },
  stepPending: {
    backgroundColor: '#E2E8F0',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#CBD5E1',
    marginTop: -22,
  },
  stepName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  stepQty: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },

  // ── Feed Stream ──
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    shadowColor: '#0F294D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  feedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  feedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  feedDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  feedTime: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  feedDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
});
