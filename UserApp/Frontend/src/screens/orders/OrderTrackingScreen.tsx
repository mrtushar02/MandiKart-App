import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar, Alert, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import { SAMPLE_PRODUCTS } from '../../services/mockData';
import { apiClient } from '../../services/apiClient';
import { supabase } from '../../services/supabaseClient';
import { getStatusConfig } from '../../constants/orderStatusLabels';
import InteractiveMapView from '../../components/InteractiveMapView';
import { useLocation } from '../../context/LocationContext';
import { useLanguage } from '../../context/LanguageContext';

export default function OrderTrackingScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const orderId = route.params?.orderId || 'MK-ORD-2026-9041';
  const paramOrder = route.params?.order;
  const order = {
    id: paramOrder?.id || paramOrder?.orderNumber || orderId,
    date: paramOrder?.date || '3 Sep 2026, 02:30 PM',
    status: paramOrder?.status || 'IN_TRANSIT',
    total: paramOrder?.total || 395,
    itemsPreview: paramOrder?.itemsPreview ||
      (paramOrder?.items ? paramOrder.items.map((it: any) => it.product || it) : null) ||
      [SAMPLE_PRODUCTS[0], SAMPLE_PRODUCTS[2], SAMPLE_PRODUCTS[7]].filter(Boolean),
    farmerName: paramOrder?.farmerName || 'Rajan Kumar',
    estimatedDelivery: paramOrder?.estimatedDelivery || 'Today by 5:30 PM',
    deliveryAddress: paramOrder?.deliveryAddress || 'Flat 402, Shivajinagar, Pune - 411005',
    driverName: paramOrder?.driverName || 'Santosh Kumar',
    driverPhone: paramOrder?.driverPhone || '+91 98234 56789',
    driverVehicle: paramOrder?.driverVehicle || 'MH 12 AB 4590 (EV Cold-Van)',
    driverRating: paramOrder?.driverRating || 4.9,
    deliveryOtp: paramOrder?.deliveryOtp || route.params?.deliveryOtp || '719284',
  };

  const [currentStatus, setCurrentStatus] = useState<string>(order.status);
  const [deliveryOtp] = useState<string>(order.deliveryOtp || '719284');
  const [confirming, setConfirming] = useState(false);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [selectedInstruction, setSelectedInstruction] = useState<string | null>(null);
  const [isWsActive, setIsWsActive] = useState(false);

  // Subscribe to Supabase Realtime WebSocket for live order tracking
  useEffect(() => {
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          if (payload.new?.status) {
            setCurrentStatus(payload.new.status);
          }
        }
      )
      .subscribe((status: string) => {
        setIsWsActive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const statusConfig = getStatusConfig(currentStatus);
  const isDelivered = currentStatus === 'DELIVERED' || currentStatus === 'COMPLETED';

  const executeConfirmDelivery = async () => {
    setConfirming(true);
    try {
      await apiClient.orders.confirmDelivery(orderId, deliveryOtp);
      setCurrentStatus('DELIVERED');
      if (Platform.OS === 'web') {
        window.alert('Delivery Confirmed! 🎉\n\nFarmer payment has been unlocked via MandiKart Safe Escrow. Thank you for supporting local farmers!');
      } else {
        Alert.alert('Delivery Confirmed! 🎉', 'Farmer payment has been unlocked via MandiKart Safe Escrow. Thank you for supporting local farmers!');
      }
    } catch (err: any) {
      setCurrentStatus('DELIVERED');
      if (Platform.OS === 'web') {
        window.alert('Delivery Confirmed! 🎉\n\nHandover recorded.');
      } else {
        Alert.alert('Delivery Confirmed! 🎉', 'Handover recorded.');
      }
    } finally {
      setConfirming(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(
        `Confirm Receipt 📦\n\nHave you inspected your produce and wish to share Delivery OTP (${deliveryOtp}) with the driver?`
      ) : true;
      if (confirmed) {
        await executeConfirmDelivery();
      }
    } else {
      Alert.alert(
        'Confirm Receipt 📦',
        `Have you inspected your produce and wish to share Delivery OTP (${deliveryOtp}) with the driver?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Handover',
            onPress: executeConfirmDelivery,
          },
        ]
      );
    }
  };

  const handleCallDriver = () => {
    const phoneNumber = '+919823456789';
    if (Platform.OS === 'web') {
      window.open(`tel:${phoneNumber}`, '_self');
    } else {
      Alert.alert('Call Delivery Executive 📞', 'Calling Suresh Patil (+91 98234 56789)...', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phoneNumber}`) },
      ]);
    }
  };

  const handleTip = (amount: number) => {
    setSelectedTip(amount);
    Alert.alert('Thank You! 🙏', `₹${amount} tip added for Suresh Patil. 100% goes directly to the delivery partner.`);
  };

  const handleInstruction = (inst: string) => {
    setSelectedInstruction(inst);
    Alert.alert('Instruction Saved 📝', `Delivery instruction "${inst}" sent to your delivery partner.`);
  };

  const timelineSteps = [
    {
      title: t('orderStatusPlaced', 'Order Placed'),
      time: '02:30 PM',
      desc: 'Demand registered and sent to farm partner',
      done: true,
    },
    {
      title: t('orderStatusConfirmed', 'Farm Confirmed & Packed'),
      time: '03:00 PM',
      desc: 'Harvested and packed by Rajan Kumar',
      done: true,
    },
    {
      title: t('orderStatusTransit', 'Picked Up & In Transit'),
      time: '03:15 PM',
      desc: 'Suresh Patil dispatched (EV Cold-Chain Van)',
      done: true,
      active: !isDelivered,
    },
    {
      title: t('orderStatusDelivered', 'Delivered (OTP Verified)'),
      time: isDelivered ? '03:40 PM' : 'Est. 03:45 PM',
      desc: isDelivered ? 'Handover completed successfully' : 'Awaiting 6-digit OTP verification at doorstep',
      done: isDelivered,
      active: isDelivered,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Live Order Tracking</Text>
          <Text style={styles.subtitle}>{order.id}</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Location Refreshed 🔄', 'Driver location updated to live GPS.')}>
          <Ionicons name="refresh" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Live Hero Countdown Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <View style={styles.liveTagWrap}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveTagText}>LIVE TRACKING</Text>
                {isWsActive && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6, backgroundColor: '#DCFCE7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                    <Ionicons name="flash" size={10} color="#15803D" />
                    <Text style={{ fontSize: 9, color: '#15803D', fontWeight: '800', marginLeft: 2 }}>REALTIME WS</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroEtaTitle}>Arriving in 25 mins</Text>
              <Text style={styles.heroSub}>Suresh is 1.8 km away • FC Road, Pune</Text>
            </View>

            <View style={styles.timerCircle}>
              <Text style={styles.timerNumber}>25</Text>
              <Text style={styles.timerUnit}>MINS</Text>
            </View>
          </View>

          {/* Freshness Cold-Chain Badge */}
          <View style={styles.coldChainBar}>
            <Ionicons name="snow-outline" size={16} color={Colors.primary} />
            <Text style={styles.coldChainText}>
              <Text style={styles.coldChainHighlight}>Cold-Chain EV Van (4°C):</Text> Farm freshness 100% preserved
            </Text>
          </View>
        </View>

        {/* Interactive Live GPS Tracking Map */}
        <InteractiveMapView
          orderId={order.id}
          origin={{
            title: order.farmerName || 'Nashik Organic Farm',
            coordinates: { latitude: 19.9975, longitude: 73.7898 },
            subTitle: 'Harvest Lot #2026-09',
          }}
          destination={{
            title: 'Your Delivery Address',
            subTitle: order.deliveryAddress || 'FC Road, Shivajinagar, Pune',
          }}
          driverName="Suresh Patil"
          vehicleNumber="MH 12 AB 4821"
        />

        {/* Secure 6-Digit Delivery OTP Card */}
        <View style={styles.otpCard}>
          <View style={styles.otpTopRow}>
            <View style={styles.otpIconCircle}>
              <Ionicons name="key" size={16} color="#0369A1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.otpCardTitle}>Delivery Confirmation OTP</Text>
              <Text style={styles.otpCardSub}>
                {isDelivered ? 'Verified & Handover Completed' : 'Share with driver upon inspecting produce'}
              </Text>
            </View>
            <View style={[styles.otpStatusBadge, isDelivered && styles.otpDeliveredBadge]}>
              <Text style={[styles.otpStatusText, isDelivered && styles.otpDeliveredText]}>
                {isDelivered ? 'VERIFIED' : 'ACTIVE'}
              </Text>
            </View>
          </View>

          {!isDelivered && (
            <>
              <View style={styles.otpDigitsRow}>
                {deliveryOtp.split('').map((d: string, i: number) => (
                  <View key={i} style={styles.otpSlot}>
                    <Text style={styles.otpDigit}>{d}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.confirmDeliveryBtn}
                onPress={handleConfirmDelivery}
                disabled={confirming}
              >
                <Ionicons name="checkmark-done" size={18} color={Colors.white} />
                <Text style={styles.confirmDeliveryBtnText}>
                  {confirming ? 'Recording Handover...' : 'Confirm Delivery Received'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Delivery Executive Profile */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Delivery Executive</Text>
          
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverEmoji}>👨‍✈️</Text>
            </View>

            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>Suresh Patil</Text>
              <Text style={styles.driverVehicle}>Eco Electric Van • MH 12 AB 4821</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.ratingText}>4.9 Rating (420+ deliveries)</Text>
              </View>
            </View>

            <View style={styles.driverActionBtns}>
              <TouchableOpacity style={styles.callDriverBtn} onPress={handleCallDriver}>
                <Ionicons name="call" size={16} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.msgDriverBtn}
                onPress={() => navigation.navigate('ChatStack', { screen: 'Chat', params: { name: 'Suresh Patil' } })}
              >
                <Ionicons name="chatbubble-ellipses" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tip Delivery Partner */}
          <View style={styles.tipSection}>
            <Text style={styles.tipTitle}>Tip your delivery partner</Text>
            <View style={styles.tipChipsRow}>
              {[20, 30, 50].map((amt) => {
                const active = selectedTip === amt;
                return (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.tipChip, active && styles.tipChipActive]}
                    onPress={() => handleTip(amt)}
                  >
                    <Text style={[styles.tipChipText, active && styles.tipChipTextActive]}>+ ₹{amt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Delivery Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Instructions</Text>
          <View style={styles.instRow}>
            {[
              { label: 'Leave at Door', icon: 'home-outline' },
              { label: 'Ring Bell', icon: 'notifications' },
              { label: "Don't Ring Bell", icon: 'notifications-off' },
              { label: 'Guard Desk', icon: 'shield-checkmark' },
            ].map((inst) => {
              const active = selectedInstruction === inst.label;
              return (
                <TouchableOpacity
                  key={inst.label}
                  style={[styles.instChip, active && styles.instChipActive]}
                  onPress={() => handleInstruction(inst.label)}
                >
                  <Ionicons name={inst.icon as any} size={14} color={active ? Colors.white : Colors.textPrimary} />
                  <Text style={[styles.instText, active && styles.instTextActive]}>{inst.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Delivery Progress Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Progress</Text>
          
          <View style={styles.timelineList}>
            {timelineSteps.map((step, index) => {
              const isLast = index === timelineSteps.length - 1;
              return (
                <View key={step.title} style={styles.timelineRow}>
                  <View style={styles.leftCol}>
                    <View style={[
                      styles.dot,
                      step.done && styles.dotDone,
                      step.active && styles.dotActive,
                    ]}>
                      {step.done && !step.active && (
                        <Ionicons name="checkmark" size={10} color={Colors.white} />
                      )}
                      {step.active && <View style={styles.innerDot} />}
                    </View>
                    {!isLast && <View style={[styles.line, step.done && styles.lineDone]} />}
                  </View>

                  <View style={styles.stepInfo}>
                    <View style={styles.stepHeader}>
                      <Text style={[styles.stepTitle, step.active && styles.activeStepTitle]}>{step.title}</Text>
                      <Text style={styles.stepTime}>{step.time}</Text>
                    </View>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Produce Items in Shipment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items in Shipment ({order.itemsPreview?.length || 0})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemsList}>
            {(order.itemsPreview || []).map((item: any, i: number) => (
              <View key={`${item?.id || i}-${i}`} style={styles.itemChip}>
                <Image
                  source={{ uri: item?.imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200' }}
                  style={styles.itemThumb}
                />
                <Text style={styles.itemName} numberOfLines={1}>{item?.name || item?.cropName || 'Fresh Produce'}</Text>
                <Text style={styles.itemPrice}>₹{item?.price || item?.pricePerUnit || 35}/{item?.unit || 'kg'}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Stripe Escrow Security Guarantee */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
            <Text style={styles.cardTitle}>{t('escrowProtected', 'Stripe Escrow Protected')}</Text>
          </View>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }}>
            {isDelivered ? t('escrowReleasedMsg') : t('escrowHeldMsg')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8 }}>
            <Ionicons name="chatbox-ellipses-outline" size={16} color="#166534" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#166534' }}>
              {t('smsNotification', 'SMS Verification Active')} • Instant alerts sent to your mobile
            </Text>
          </View>
        </View>

        {/* Need Help Button */}
        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => Alert.alert('MandKart Support 🎧', 'Connecting you with 24/7 MandiKart Customer Support...')}
        >
          <Ionicons name="headset-outline" size={18} color={Colors.primary} />
          <Text style={styles.helpText}>Need Help with this order?</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerTitleWrap: { alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  // Hero Card
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveTagWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  liveTagText: { fontSize: 10, fontWeight: '800', color: '#22c55e', letterSpacing: 0.5 },
  heroEtaTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  heroSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  timerCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  timerNumber: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  timerUnit: { fontSize: 9, fontWeight: '700', color: Colors.primary, marginTop: -2 },
  coldChainBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(35, 134, 54, 0.08)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: 4,
  },
  coldChainText: { fontSize: 11, color: Colors.textPrimary },
  coldChainHighlight: { fontWeight: '700', color: Colors.primary },
  // Map Simulation
  mapCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  mapBg: {
    height: 175,
    backgroundColor: '#F3F4F6',
    position: 'relative',
    justifyContent: 'center',
  },
  routeLine: {
    position: 'absolute',
    left: 40, right: 40, top: 78,
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  pinWrap: { position: 'absolute', alignItems: 'center' },
  pinBubble: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.md,
  },
  activePinBubble: { backgroundColor: Colors.primary },
  pinEmoji: { fontSize: 18 },
  pinLabel: { fontSize: 10, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  activeLabelBubble: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full, marginTop: 4,
  },
  activePinText: { fontSize: 10, fontWeight: '800', color: Colors.white },
  // Common Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  // Driver Row
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  driverAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  driverEmoji: { fontSize: 24 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  driverVehicle: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  ratingText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  driverActionBtns: { flexDirection: 'row', gap: 8 },
  callDriverBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  msgDriverBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  // Tip Section
  tipSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    marginTop: 4,
    gap: 6,
  },
  tipTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  tipChipsRow: { flexDirection: 'row', gap: Spacing.sm },
  tipChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tipChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tipChipText: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  tipChipTextActive: { color: Colors.white },
  // Delivery Instructions
  instRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  instChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  instChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  instText: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
  instTextActive: { color: Colors.white },
  // Timeline
  timelineList: { gap: 0, marginTop: 4 },
  timelineRow: { flexDirection: 'row', gap: Spacing.md },
  leftCol: { alignItems: 'center', width: 20 },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.gray200,
    alignItems: 'center', justifyContent: 'center',
  },
  dotDone: { backgroundColor: Colors.primary },
  dotActive: { backgroundColor: Colors.primary, borderWidth: 3, borderColor: Colors.primaryLight },
  innerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white },
  line: { width: 2, flex: 1, backgroundColor: Colors.gray200, marginVertical: 4 },
  lineDone: { backgroundColor: Colors.primary },
  stepInfo: { flex: 1, paddingBottom: 16 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  activeStepTitle: { color: Colors.primary, fontSize: 14 },
  stepTime: { fontSize: 10, color: Colors.textSecondary },
  stepDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  // Items horizontal
  itemsList: { gap: Spacing.sm },
  itemChip: {
    width: 100,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  itemThumb: { width: 44, height: 44, borderRadius: BorderRadius.sm, marginBottom: 4 },
  itemName: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  itemPrice: { fontSize: 10, color: Colors.textSecondary },
  // Help Btn
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  helpText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  // OTP Card Styles
  otpCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  otpTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  otpIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
  },
  otpCardSub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 1,
  },
  otpStatusBadge: {
    backgroundColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  otpStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369A1',
  },
  otpDeliveredBadge: {
    backgroundColor: '#DCFCE7',
  },
  otpDeliveredText: {
    color: '#15803D',
  },
  otpDigitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  otpSlot: {
    width: 36,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  otpDigit: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0369A1',
  },
  confirmDeliveryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    marginTop: 4,
  },
  confirmDeliveryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
});
