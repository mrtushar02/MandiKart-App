import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';

export default function OrderConfirmationScreen({ navigation, route }: any) {
  const orderId = route.params?.orderId || 'MK-ORD-2026-9041';
  const deliveryOtp = route.params?.deliveryOtp || '719284';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#15803D" />

      <View style={styles.content}>
        {/* Animated Check Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={56} color="#15803D" />
        </View>

        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.orderNumberText}>Order ID: {orderId}</Text>
        <Text style={styles.subtitle}>
          Your produce order has been dispatched directly to the farmer partner for harvesting and packing.
        </Text>

        {/* 6-Digit Delivery Confirmation OTP Card */}
        <View style={styles.otpCard}>
          <View style={styles.otpHeader}>
            <Ionicons name="key-outline" size={16} color="#0369A1" />
            <Text style={styles.otpHeaderTitle}>YOUR DELIVERY CONFIRMATION OTP</Text>
          </View>
          <View style={styles.otpDigitsBox}>
            {deliveryOtp.split('').map((digit: string, idx: number) => (
              <View key={idx} style={styles.digitSlot}>
                <Text style={styles.digitText}>{digit}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.otpWarning}>
            Share this 6-digit OTP with your MandiKart delivery partner only after inspecting and accepting produce.
          </Text>
        </View>
        {/* Confirmed Delivery Destination & Recipient Name */}
        <View style={styles.deliveryBadge}>
          <Ionicons name="location" size={16} color="#15803D" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.recipientNameText}>
              Deliver to: {route.params?.recipientName || route.params?.order?.recipientName || route.params?.order?.buyerName || 'Valued Customer'}
            </Text>
            <Text style={styles.addressSubText} numberOfLines={2}>
              {route.params?.deliveryAddress || route.params?.order?.deliveryAddress || 'Pune, Maharashtra'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title="Track Live Order"
          onPress={() =>
            navigation.navigate('OrderTracking', {
              orderId,
              deliveryOtp,
              order: {
                id: orderId,
                status: 'PLACED',
                deliveryOtp,
                recipientName: route.params?.recipientName || route.params?.order?.recipientName || route.params?.order?.buyerName || 'Valued Customer',
                deliveryAddress: route.params?.deliveryAddress || route.params?.order?.deliveryAddress || 'Pune, Maharashtra',
                total: route.params?.order?.totalAmount || route.params?.order?.total || 395,
              },
            })
          }
          style={styles.btn}
        />
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Orders' } }] })}
        >
          <Text style={styles.outlineBtnText}>View My Orders</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#15803D' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#BBF7D0',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  otpCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  otpHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  otpDigitsBox: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  digitSlot: {
    width: 38,
    height: 46,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0369A1',
  },
  otpWarning: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  deliveryBadge: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    ...Shadows.sm,
  },
  recipientNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  addressSubText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  footer: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  btn: { width: '100%' },
  outlineBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
