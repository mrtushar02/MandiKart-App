import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';

export default function CheckoutReviewScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { items: cartItems, subtotal: cartSubtotal, deliveryFee: cartDeliveryFee, handlingFee: cartHandlingFee, couponSavings: cartCouponSavings, total: cartTotal } = useCart();
  const { currentAddress } = useLocation();

  const isNegotiated = route.params?.isNegotiated;
  const negotiation = route.params?.negotiation;

  const displayItems = isNegotiated && negotiation
    ? [
        {
          id: negotiation.id || 'neg_item',
          product: {
            name: negotiation.cropName || 'Negotiated Produce',
            price: negotiation.counterPrice || negotiation.offeredPrice,
            unit: negotiation.unit || 'kg',
          },
          quantity: negotiation.quantity || 1,
        },
      ]
    : cartItems;

  const subtotal = isNegotiated && negotiation
    ? (negotiation.counterPrice || negotiation.offeredPrice) * negotiation.quantity
    : cartSubtotal;

  const deliveryFee = isNegotiated ? 0 : cartDeliveryFee;
  const handlingFee = isNegotiated ? 5 : cartHandlingFee;
  const couponSavings = isNegotiated ? 0 : cartCouponSavings;
  const total = isNegotiated ? subtotal + handlingFee : cartTotal;

  const formattedAddress = currentAddress
    ? (currentAddress.formattedAddress || `${currentAddress.area || currentAddress.street || ''}, ${currentAddress.city}, ${currentAddress.state} - ${currentAddress.pincode}`)
    : '123, Model Town, Pune, MH - 411016';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Order Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Negotiated Badge Banner */}
        {isNegotiated && (
          <View style={styles.negotiatedBanner}>
            <Ionicons name="hand-left" size={18} color="#15803D" />
            <Text style={styles.negotiatedBannerText}>
              Negotiated Deal Agreed: ₹{negotiation?.counterPrice || negotiation?.offeredPrice}/{negotiation?.unit}
            </Text>
          </View>
        )}

        {/* Delivery Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Delivery To</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DeliveryAddress')}>
              <Text style={styles.changeBtnText}>Change Address</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.textBold}>{user?.fullName || 'Valued Buyer'}</Text>
          <Text style={styles.textSub}>{formattedAddress}</Text>
          <Text style={styles.phoneText}>📞 {user?.phone || '+91 98765 43210'}</Text>
        </View>

        {/* Order Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({displayItems.length})</Text>
          {displayItems.map((item, index) => (
            <View key={item.id || index} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.text}>{item.product.name}</Text>
                <Text style={styles.textSub}>{item.quantity} x ₹{item.product.price} / {item.product.unit}</Text>
              </View>
              <Text style={styles.priceText}>₹{item.product.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Price Breakup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.itemRow}>
            <Text style={styles.textSub}>Item Subtotal</Text>
            <Text style={styles.text}>₹{subtotal}</Text>
          </View>

          {couponSavings > 0 && (
            <View style={styles.itemRow}>
              <Text style={{ ...styles.textSub, color: Colors.primary }}>Coupon Discount</Text>
              <Text style={{ ...styles.text, color: Colors.primary }}>-₹{couponSavings}</Text>
            </View>
          )}

          <View style={styles.itemRow}>
            <Text style={styles.textSub}>Delivery Charge</Text>
            <Text style={styles.text}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</Text>
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.textSub}>Handling Fee</Text>
            <Text style={styles.text}>₹{handlingFee}</Text>
          </View>

          <View style={[styles.itemRow, styles.totalRow]}>
            <Text style={styles.totalText}>Total Amount</Text>
            <Text style={styles.totalText}>₹{total}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.footerLabel}>Total Payable</Text>
          <Text style={styles.footerTotal}>₹{total}</Text>
        </View>
        <PrimaryButton
          title="Proceed to Pay"
          onPress={() => navigation.navigate('Payment', { total, amount: total, isNegotiated, negotiation, items: displayItems })}
          style={{ flex: 1, marginLeft: Spacing.md }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: Spacing.md, gap: Spacing.md },
  negotiatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  negotiatedBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    flex: 1,
  },
  section: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  changeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  textBold: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  text: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  textSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  phoneText: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  priceText: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 10, marginTop: 6, marginBottom: 0 },
  totalText: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  footerLabel: { fontSize: 12, color: Colors.textSecondary },
  footerTotal: { fontSize: 20, fontWeight: '800', color: Colors.primary },
});
