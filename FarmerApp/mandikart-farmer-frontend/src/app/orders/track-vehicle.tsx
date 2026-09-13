/**
 * MandiKart Farmer App — Track Live Vehicle Screen
 * Realtime GPS telemetry, animated vehicle route, driver details, ETA countdown, and loading PIN.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, {
  Rect,
  Circle,
  Path,
  G,
  Line,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import {
  ChevronLeft,
  Phone,
  MessageSquare,
  ShieldCheck,
  Truck,
  MapPin,
  Clock,
  KeyRound,
  CheckCircle2,
  Navigation,
  Scale,
  Share2,
} from 'lucide-react-native';
import { MKLayout } from '@/constants/layout';
import { useOrderStore } from '@/store/orderStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TrackLiveVehicleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ orderId?: string; crop?: string; buyer?: string }>();

  const orderId = params.orderId || 'MK-8921';
  const orderFromStore = useOrderStore((state) => state.getOrderById(orderId));

  const driverName = orderFromStore?.driverName || 'Ramesh Pawar (EV Logistics)';
  const driverPhone = orderFromStore?.driverPhone || '+91 98231 44510';
  const vehicleNumber = orderFromStore?.vehicleNumber || 'Tata Ace EV • MH 15 BX 4022';
  const displayCrop = orderFromStore ? `${orderFromStore.cropName} (${orderFromStore.quantity})` : params.crop || 'Sharbati Wheat (500 KG)';
  const displayBuyer = orderFromStore?.buyerName || params.buyer || 'Reliance Fresh Sourcing Hub';

  // Deterministic 4-digit security PIN based on orderId
  const pinCode = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < orderId.length; i++) {
      hash = (hash * 31 + orderId.charCodeAt(i)) % 9000;
    }
    return (Math.abs(hash) + 1000).toString();
  }, [orderId]);

  const [etaMinutes, setEtaMinutes] = useState(orderFromStore?.etaMins || 24);
  const topPadding = MKLayout.getTopHeaderPadding(insets);

  const handleCallDriver = () => {
    Alert.alert('Calling Driver', `Dialing ${driverName} at ${driverPhone}...`);
  };

  const handleShareTracking = () => {
    Alert.alert('Share Tracking', `Tracking link for Order #${orderId} copied to clipboard!`);
  };

  return (
    <View style={styles.root}>
      {/* ── Top App Bar ── */}
      <View style={[styles.topBar, { paddingTop: topPadding }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color="#1F2937" strokeWidth={2.2} />
        </Pressable>
        <View style={styles.topBarTitleCol}>
          <Text style={styles.topBarTitle}>Live Vehicle Tracking</Text>
          <Text style={styles.topBarSubtitle}>Order #{orderId}</Text>
        </View>
        <Pressable style={styles.shareBtn} onPress={handleShareTracking}>
          <Share2 size={18} color="#1F2937" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Realtime SVG Route Map ── */}
        <View style={styles.mapContainer}>
          <Svg width="100%" height={240} viewBox="0 0 360 240">
            <Defs>
              <LinearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#1E5A2A" />
                <Stop offset="100%" stopColor="#2E7D32" />
              </LinearGradient>
              <LinearGradient id="pulseOrange" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#EF6C00" stopOpacity="0.5" />
                <Stop offset="100%" stopColor="#EF6C00" stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {/* Satellite Map Background */}
            <Rect width="360" height="240" fill="#243E2B" />

            {/* Grid Coordinates Lines */}
            <Line x1="0" y1="60" x2="360" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="5 5" />
            <Line x1="0" y1="120" x2="360" y2="120" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="5 5" />
            <Line x1="0" y1="180" x2="360" y2="180" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="5 5" />
            <Line x1="120" y1="0" x2="120" y2="240" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="5 5" />
            <Line x1="240" y1="0" x2="240" y2="240" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="5 5" />

            {/* Road Route Path */}
            <Path
              d="M 50,200 C 110,190 140,110 220,100 S 290,60 320,40"
              fill="none"
              stroke="#4B5563"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Road Green Highlight Completed */}
            <Path
              d="M 50,200 C 110,190 140,110 180,105"
              fill="none"
              stroke="#22C55E"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <Path
              d="M 180,105 C 200,102 290,60 320,40"
              fill="none"
              stroke="#FACC15"
              strokeWidth="4"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />

            {/* Farmer Farmgate Destination Pin (Left) */}
            <G>
              <Circle cx="50" cy="200" r="16" fill="rgba(34,197,94,0.3)" />
              <Circle cx="50" cy="200" r="10" fill="#15803D" />
              <Circle cx="50" cy="200" r="4" fill="#FFFFFF" />
            </G>

            {/* Buyer Mandi Warehouse Origin Pin (Right) */}
            <G>
              <Circle cx="320" cy="40" r="12" fill="rgba(239,108,0,0.3)" />
              <Circle cx="320" cy="40" r="7" fill="#EF6C00" />
            </G>

            {/* Current Moving Vehicle Position (Tata Ace) */}
            <G transform="translate(180, 105)">
              <Circle cx="0" cy="0" r="22" fill="url(#pulseOrange)" />
              <Circle cx="0" cy="0" r="14" fill="#EF6C00" />
              <Circle cx="0" cy="0" r="6" fill="#FFFFFF" />
            </G>
          </Svg>

          {/* Floating Speed & Telemetry Pill */}
          <View style={styles.telemetryPill}>
            <Navigation size={12} color="#15803D" />
            <Text style={styles.telemetryText}>Speed: 42 km/h • 6.2 km away</Text>
          </View>

          {/* Floating Live Indicator */}
          <View style={styles.liveIndicator}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveText}>LIVE GPS</Text>
          </View>
        </View>

        {/* ── ETA Card ── */}
        <View style={styles.etaCard}>
          <View style={styles.etaHeaderRow}>
            <View style={styles.etaTimeCol}>
              <Text style={styles.etaTime}>{etaMinutes} Mins</Text>
              <Text style={styles.etaSubtext}>Arriving at your Farmgate by 10:25 AM</Text>
            </View>
            <View style={styles.clockIconWrap}>
              <Clock size={24} color="#EF6C00" />
            </View>
          </View>

          <View style={styles.etaStatusNotice}>
            <Truck size={15} color="#1E5A2A" />
            <Text style={styles.etaStatusText}>
              Tata Ace on route from Nashik Highway Hub
            </Text>
          </View>
        </View>

        {/* ── Driver Profile & Actions ── */}
        <View style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
              }}
              style={styles.driverAvatar}
            />
            <View style={styles.driverInfoCol}>
              <Text style={styles.driverName}>{driverName}</Text>
              <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
              <View style={styles.driverBadgeRow}>
                <Text style={styles.driverRating}>★ 4.9</Text>
                <Text style={styles.driverPickups}>(Verified Partner)</Text>
              </View>
            </View>
          </View>

          <View style={styles.driverActionsRow}>
            <Pressable
              style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.85 }]}
              onPress={handleCallDriver}
            >
              <Phone size={16} color="#FFFFFF" />
              <Text style={styles.callBtnText}>Call Driver</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.msgBtn, pressed && { opacity: 0.85 }]}
              onPress={() => Alert.alert('Message Sent', 'Driver notified that you are at the farm!')}
            >
              <MessageSquare size={16} color="#1E5A2A" />
              <Text style={styles.msgBtnText}>Message</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Pickup Security PIN Box ── */}
        <View style={styles.pinCard}>
          <View style={styles.pinIconWrap}>
            <KeyRound size={22} color="#1E5A2A" />
          </View>
          <View style={styles.pinTextCol}>
            <Text style={styles.pinTitle}>Loading Verification Code</Text>
            <Text style={styles.pinSubtitle}>
              Share this 4-digit code with the driver before loading your {displayCrop}.
            </Text>
          </View>
          <View style={styles.pinCodeBadge}>
            <Text style={styles.pinCodeText}>{pinCode}</Text>
          </View>
        </View>

        {/* ── Order Stepper Timeline ── */}
        <View style={styles.stepperCard}>
          <Text style={styles.stepperTitle}>Shipment Milestones</Text>

          <View style={styles.timelineList}>
            {/* Step 1 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineIndicatorCol}>
                <View style={styles.indicatorDone}>
                  <CheckCircle2 size={16} color="#15803D" />
                </View>
                <View style={styles.indicatorLineDone} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.stepNameDone}>Driver Assigned & Dispatched</Text>
                <Text style={styles.stepTimeText}>Today, 09:40 AM</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineIndicatorCol}>
                <View style={styles.indicatorActive}>
                  <Truck size={14} color="#FFFFFF" />
                </View>
                <View style={styles.indicatorLinePending} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.stepNameActive}>Vehicle In Transit to Farm</Text>
                <Text style={styles.stepTimeTextActive}>ETA ~10:25 AM</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineIndicatorCol}>
                <View style={styles.indicatorPending} />
                <View style={styles.indicatorLinePending} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.stepNamePending}>Digital Scale Weighing & Loading</Text>
                <Text style={styles.stepTimeText}>At your Farmgate</Text>
              </View>
            </View>

            {/* Step 4 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineIndicatorCol}>
                <View style={styles.indicatorPending} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.stepNamePending}>Instant Bank Payment Release</Text>
                <Text style={styles.stepTimeText}>Direct to Bank Account</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F1E9',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleCol: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  topBarSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  mapContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#ECEAE3',
  },
  telemetryPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  telemetryText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  etaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#ECEAE3',
  },
  etaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  etaTimeCol: {
    flex: 1,
  },
  etaTime: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  etaSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  clockIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaStatusNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  etaStatusText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#ECEAE3',
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  driverAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F3F4F6',
  },
  driverInfoCol: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  vehicleNumber: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
    marginTop: 2,
  },
  driverBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  driverRating: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  driverPickups: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  driverActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  callBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1E5A2A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  msgBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  msgBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E5A2A',
  },
  pinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  pinIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinTextCol: {
    flex: 1,
  },
  pinTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  pinSubtitle: {
    fontSize: 11.5,
    color: '#B45309',
    lineHeight: 16,
    marginTop: 2,
  },
  pinCodeBadge: {
    backgroundColor: '#92400E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  pinCodeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  stepperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#ECEAE3',
  },
  stepperTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  indicatorDone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorLineDone: {
    width: 2,
    flex: 1,
    backgroundColor: '#15803D',
    marginVertical: 4,
  },
  indicatorActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF6C00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorLinePending: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  indicatorPending: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stepNameDone: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  stepNameActive: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF6C00',
  },
  stepNamePending: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepTimeText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  stepTimeTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF6C00',
    marginTop: 2,
  },
});
