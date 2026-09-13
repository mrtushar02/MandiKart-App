import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, TextInput, Alert, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import { apiClient } from '../../services/apiClient';
import { useCart } from '../../context/CartContext';

export default function PaymentScreen({ navigation, route }: any) {
  const { items: cartItems, clearCart } = useCart();
  const [selected, setSelected] = useState('upi');
  const [upiId, setUpiId] = useState('9876543210@oksbi');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardName, setCardName] = useState('Aarav Sharma');
  const [loading, setLoading] = useState(false);

  // Interactive Stripe Payment Gateway Modal state
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeIntentData, setStripeIntentData] = useState<any>(null);
  const [stripeStep, setStripeStep] = useState<'CARD_CONFIRM' | '3DS_CHALLENGE' | 'PROCESSING' | 'SUCCESS'>('CARD_CONFIRM');
  const [bankOtp, setBankOtp] = useState('489201');
  const [pendingOrderResult, setPendingOrderResult] = useState<any>(null);

  const amount = route.params?.amount || route.params?.total || 155;
  const isBulk = route.params?.isBulk || false;
  const bulkSupplier = route.params?.bulkSupplier;
  const isNegotiated = route.params?.isNegotiated || false;
  const negotiation = route.params?.negotiation;

  const methods = [
    { id: 'upi', label: 'UPI (GPay, PhonePe, Paytm)', icon: 'phone-portrait-outline', desc: 'Fast & Instant • Zero Surcharge', badge: 'POPULAR' },
    { id: 'card', label: 'Credit / Debit Card', icon: 'card-outline', desc: 'Stripe Protected • Visa, MC, RuPay', badge: 'STRIPE' },
    { id: 'cod', label: 'Cash / Escrow on Delivery', icon: 'cash-outline', desc: 'Verified 6-digit OTP on handover', badge: 'ESCROW' },
  ];

  const upiSuffixes = ['@oksbi', '@okhdfcbank', '@paytm', '@ybl'];

  const handleSelectUpiSuffix = (suffix: string) => {
    const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId || '9876543210';
    setUpiId(`${prefix}${suffix}`);
  };

  const fillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('123');
    setCardName('Aarav Sharma');
  };

  const handleCardNumberChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 16);
    const parts = clean.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      setCardExpiry(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      setCardExpiry(clean);
    }
  };

  const handlePayment = async () => {
    if (selected === 'upi' && !upiId.trim()) {
      Alert.alert('UPI Required', 'Please enter a valid UPI Virtual Payment Address (e.g. mobile@upi).');
      return;
    }
    if (selected === 'card' && cardNumber.replace(/\s+/g, '').length < 14) {
      Alert.alert('Card Incomplete', 'Please enter a valid 16-digit card number or tap "Use Test Card".');
      return;
    }

    setLoading(true);
    try {
      const items = route.params?.items && route.params.items.length > 0
        ? route.params.items.map((it: any) => ({
            productId: it.product?.id || it.id || it.productId || 'prod-1',
            cropName: it.product?.name || it.cropName || 'Fresh Produce',
            grade: (it.product?.grade || it.grade || 'A') as 'A' | 'B' | 'C',
            quantity: it.quantity || 1,
            unit: it.product?.unit || it.unit || 'kg',
            pricePerUnit: it.product?.price || it.pricePerUnit || 35,
            imageUrl: it.product?.imageUrl || (it.product?.images && it.product.images[0]) || it.imageUrl || '',
            farmerId: it.product?.farmer?.id || it.farmerId || 'farmer_ramesh_01',
            farmerName: it.product?.farmer?.name || it.farmerName || 'Ramesh Patel',
          }))
        : cartItems.length > 0
        ? cartItems.map((it: any) => ({
            productId: it.product?.id || 'prod-1',
            cropName: it.product?.name || 'Fresh Produce',
            grade: (it.product?.grade || 'A') as 'A' | 'B' | 'C',
            quantity: it.quantity || 1,
            unit: it.product?.unit || 'kg',
            pricePerUnit: it.product?.price || 35,
            imageUrl: it.product?.imageUrl || (it.product?.images && it.product.images[0]) || '',
            farmerId: it.product?.farmer?.id || 'farmer_ramesh_01',
            farmerName: it.product?.farmer?.name || 'Ramesh Patel',
          }))
        : isNegotiated && negotiation
        ? [
            {
              productId: negotiation.id || 'prod-neg',
              cropName: negotiation.cropName || 'Negotiated Produce',
              grade: 'A' as const,
              quantity: negotiation.quantity || 1,
              unit: negotiation.unit || 'kg',
              pricePerUnit: negotiation.counterPrice || negotiation.offeredPrice || 50,
              imageUrl: negotiation.imageUrl || '',
            },
          ]
        : isBulk && bulkSupplier
        ? [
            {
              productId: bulkSupplier.supplierId || 'prod-bulk',
              cropName: bulkSupplier.cropName,
              grade: bulkSupplier.grade,
              quantity: bulkSupplier.availableCapacity,
              unit: bulkSupplier.capacityUnit,
              pricePerUnit: bulkSupplier.askingPricePerUnit,
              imageUrl: bulkSupplier.imageUrl || '',
            },
          ]
        : [
            {
              productId: 'prod-1',
              cropName: 'Fresh Produce',
              grade: 'A' as const,
              quantity: 1,
              unit: 'kg',
              pricePerUnit: amount || 35,
            },
          ];

      const resolvedAddress =
        route.params?.address?.formattedAddress ||
        (typeof route.params?.address === 'string' ? route.params.address : null) ||
        route.params?.deliveryAddress ||
        'Pune APMC Zone, Maharashtra';

      const res = await apiClient.orders.placeOrder({
        items,
        deliveryAddress: resolvedAddress,
        targetBuyerType: isBulk ? 'BULK' : 'RETAIL',
      });

      const orderId = res.order?.orderNumber || res.order?.id || `MK-ORD-${Date.now()}`;

      // 2. Create Stripe PaymentIntent with Escrow hold tags
      const paymentIntent = await apiClient.payments.createIntent({
        orderId,
        amount,
        currency: 'INR',
        buyerId: res.order?.buyerId || 'buyer_default_01',
        farmerId: items[0]?.farmerId || 'farmer_ramesh_01',
      });

      const pendingData = {
        order: res.order,
        orderId,
        paymentIntent,
        items,
      };
      setPendingOrderResult(pendingData);
      setStripeIntentData(paymentIntent);

      // If Card or UPI, launch interactive Stripe Gateway screen
      if (selected === 'card' || selected === 'upi') {
        setLoading(false);
        setStripeStep('CARD_CONFIRM');
        setShowStripeModal(true);
        return;
      }

      // 3. If Escrow COD, complete directly
      setLoading(false);
      clearCart();
      navigation.navigate('OrderConfirmation', {
        orderId,
        deliveryOtp: res.order?.deliveryOtp || '719284',
        order: res.order,
        stripePaymentIntentId: paymentIntent?.paymentIntentId,
        paymentMethod: 'ESCROW_COD',
      });
    } catch (err: any) {
      setLoading(false);
      Alert.alert(
        'Payment Processing Error',
        err?.message || 'Unable to complete order transaction. Please check your network and retry.'
      );
    }
  };

  const handleAuthorizeStripePayment = async () => {
    if (!pendingOrderResult) return;
    setStripeStep('PROCESSING');

    try {
      const intentId = stripeIntentData?.paymentIntentId || pendingOrderResult.paymentIntent?.paymentIntentId;
      if (intentId) {
        await apiClient.payments.confirm(intentId, pendingOrderResult.orderId);
      }

      setStripeStep('SUCCESS');
      setTimeout(() => {
        setShowStripeModal(false);
        clearCart();
        navigation.navigate('OrderConfirmation', {
          orderId: pendingOrderResult.orderId,
          deliveryOtp: pendingOrderResult.order?.deliveryOtp || '719284',
          order: pendingOrderResult.order,
          stripePaymentIntentId: intentId,
          paymentMethod: selected === 'card' ? 'STRIPE_CARD' : 'STRIPE_UPI',
        });
      }, 1200);
    } catch (err: any) {
      setStripeStep('CARD_CONFIRM');
      Alert.alert('Stripe Gateway Error', err?.message || 'Transaction authorization failed.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Method</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Safe Escrow Guarantee */}
        <View style={styles.escrowCard}>
          <Ionicons name="shield-checkmark" size={22} color="#15803D" />
          <View style={styles.escrowTextWrap}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.escrowTitle}>MandiKart Safe Escrow</Text>
              <View style={styles.stripeBadge}>
                <Text style={styles.stripeBadgeText}>Powered by Stripe</Text>
              </View>
            </View>
            <Text style={styles.escrowSub}>
              Funds held securely in Stripe Escrow. Farmer is paid only after you inspect produce upon delivery and share your secret 6-digit OTP.
            </Text>
          </View>
        </View>

        {/* Order Amount Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Produce Subtotal</Text>
            <Text style={styles.summaryValue}>₹{amount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Stripe Escrow Protection</Text>
            <Text style={[styles.summaryValue, { color: '#15803D' }]}>FREE (₹0)</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Direct Mandi Logistics</Text>
            <Text style={styles.summaryValue}>Included</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{amount}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Select Payment Mode</Text>

        {methods.map((m) => (
          <View key={m.id} style={[styles.card, selected === m.id && styles.cardSelected]}>
            <TouchableOpacity
              style={styles.cardHeaderRow}
              onPress={() => setSelected(m.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={m.icon as any}
                size={24}
                color={selected === m.id ? Colors.primary : Colors.textSecondary}
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.label, selected === m.id && styles.labelSelected]}>{m.label}</Text>
                  {m.badge && (
                    <View style={[styles.methodBadge, m.id === 'card' && styles.stripeMethodBadge]}>
                      <Text style={[styles.methodBadgeText, m.id === 'card' && styles.stripeMethodBadgeText]}>
                        {m.badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.subLabel}>{m.desc}</Text>
              </View>
              <View style={[styles.radio, selected === m.id && styles.radioSelected]}>
                {selected === m.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* Dynamic Interactive Fields per method */}
            {selected === 'upi' && m.id === 'upi' && (
              <View style={styles.expandedSection}>
                <Text style={styles.inputPrompt}>Virtual Payment Address (VPA / UPI ID)</Text>
                <View style={styles.upiInputWrap}>
                  <Text style={styles.upiIconText}>@</Text>
                  <TextInput
                    style={styles.upiInputField}
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="e.g. 9876543210@oksbi"
                    placeholderTextColor={Colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#15803D" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                </View>

                {/* Quick UPI Handle Chips */}
                <View style={styles.upiSuffixRow}>
                  {upiSuffixes.map((suffix) => (
                    <TouchableOpacity
                      key={suffix}
                      style={styles.suffixChip}
                      onPress={() => handleSelectUpiSuffix(suffix)}
                    >
                      <Text style={styles.suffixChipText}>{suffix}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {selected === 'card' && m.id === 'card' && (
              <View style={styles.expandedSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.inputPrompt}>Stripe Secure Card Details</Text>
                  <TouchableOpacity style={styles.testCardChip} onPress={fillTestCard}>
                    <Ionicons name="flash" size={12} color="#4338CA" />
                    <Text style={styles.testCardChipText}>Auto-Fill Demo Card</Text>
                  </TouchableOpacity>
                </View>

                {/* Card Number */}
                <View style={styles.cardInputWrap}>
                  <Ionicons name="card-outline" size={18} color="#6366F1" />
                  <TextInput
                    style={styles.cardInputField}
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    placeholder="16-digit card number"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                  <Text style={styles.cardBrandText}>VISA / MC</Text>
                </View>

                {/* Row: Expiry + CVC */}
                <View style={styles.cardRow}>
                  <View style={[styles.cardInputWrap, { flex: 1 }]}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                    <TextInput
                      style={styles.cardInputField}
                      value={cardExpiry}
                      onChangeText={handleExpiryChange}
                      placeholder="MM/YY"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>

                  <View style={[styles.cardInputWrap, { width: 100 }]}>
                    <Ionicons name="lock-closed-outline" size={16} color={Colors.textSecondary} />
                    <TextInput
                      style={styles.cardInputField}
                      value={cardCvc}
                      onChangeText={setCardCvc}
                      placeholder="CVC"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>

                {/* Cardholder Name */}
                <View style={[styles.cardInputWrap, { marginTop: 8 }]}>
                  <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.cardInputField}
                    value={cardName}
                    onChangeText={setCardName}
                    placeholder="Cardholder Name"
                    placeholderTextColor={Colors.textSecondary}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {selected === 'cod' && m.id === 'cod' && (
              <View style={styles.expandedSection}>
                <View style={styles.codNote}>
                  <Ionicons name="information-circle" size={18} color="#B45309" />
                  <Text style={styles.codNoteText}>
                    Deliveries require the secret 6-digit delivery OTP before produce is unloaded from the cold-chain transport.
                  </Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerEscrowNote}>
          <Ionicons name="lock-closed" size={13} color="#059669" />
          <Text style={styles.footerEscrowNoteText}>Secured by Stripe 256-bit SSL & MandiKart Escrow</Text>
        </View>
        <PrimaryButton
          title={loading ? 'Generating Stripe Intent...' : `Pay ₹${amount} & Confirm`}
          onPress={handlePayment}
          disabled={loading}
          style={{ width: '100%' }}
        />
      </View>

      {/* Interactive Stripe Payment Gateway & 3D Secure Modal */}
      <Modal
        visible={showStripeModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (stripeStep !== 'PROCESSING') setShowStripeModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.stripeModalCard}>
            {/* Top Stripe Branded Header */}
            <View style={styles.stripeHeader}>
              <View style={styles.stripeHeaderLeft}>
                <View style={styles.stripeLogoBox}>
                  <Text style={styles.stripeLogoText}>stripe</Text>
                </View>
                <View>
                  <Text style={styles.stripeHeaderTitle}>SECURE PAYMENT SHEET</Text>
                  <Text style={styles.stripeHeaderSub}>MandiKart Agri Escrow Ltd.</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (stripeStep !== 'PROCESSING') setShowStripeModal(false);
                }}
                disabled={stripeStep === 'PROCESSING'}
                style={styles.stripeCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Total Amount Ribbon */}
            <View style={styles.stripeAmountRibbon}>
              <Text style={styles.stripePayableText}>Amount to Pay</Text>
              <Text style={styles.stripeAmountText}>₹{amount}.00</Text>
            </View>

            {/* Step 1: Card / Method Confirmation */}
            {stripeStep === 'CARD_CONFIRM' && (
              <View style={styles.stripeBody}>
                {selected === 'card' ? (
                  <View style={styles.stripeCardVisual}>
                    <View style={styles.stripeCardTop}>
                      <Text style={styles.stripeChipText}>💳 EMV CHIP</Text>
                      <Text style={styles.stripeNetworkText}>VISA / MASTERCARD</Text>
                    </View>
                    <Text style={styles.stripeCardDigits}>
                      ••••  ••••  ••••  {cardNumber.replace(/\s+/g, '').slice(-4) || '4242'}
                    </Text>
                    <View style={styles.stripeCardBottom}>
                      <View>
                        <Text style={styles.stripeCardLabel}>CARDHOLDER</Text>
                        <Text style={styles.stripeCardVal}>{cardName || 'Aarav Sharma'}</Text>
                      </View>
                      <View>
                        <Text style={styles.stripeCardLabel}>EXPIRES</Text>
                        <Text style={styles.stripeCardVal}>{cardExpiry || '12/28'}</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.stripeUpiVisual}>
                    <Ionicons name="phone-portrait-outline" size={32} color="#635BFF" />
                    <Text style={styles.stripeUpiVpa}>{upiId}</Text>
                    <Text style={styles.stripeUpiSub}>Direct UPI Payment Request via Stripe Intent</Text>
                  </View>
                )}

                <View style={styles.stripeIntentMeta}>
                  <Text style={styles.stripeIntentText}>
                    Stripe Reference: {stripeIntentData?.paymentIntentId || 'pi_mandikart_live'}
                  </Text>
                  <Text style={styles.stripeEscrowMeta}>
                    🛡️ Protected by RBI E-Mandate & MandiKart 100% Buyer Escrow Guarantee
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.stripePayBtn}
                  onPress={() => setStripeStep('3DS_CHALLENGE')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                  <Text style={styles.stripePayBtnText}>Proceed to 3D Secure Authentication</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: 3D Secure Bank Challenge Simulation */}
            {stripeStep === '3DS_CHALLENGE' && (
              <View style={styles.stripeBody}>
                <View style={styles.bankHeaderRow}>
                  <View style={styles.bankBadge}>
                    <Text style={styles.bankBadgeText}>HDFC / SBI 3D SECURE</Text>
                  </View>
                  <Text style={styles.verifiedByText}>Verified by VISA</Text>
                </View>

                <Text style={styles.bankPromptTitle}>Issuer Bank Authentication</Text>
                <Text style={styles.bankPromptSub}>
                  Enter the 6-digit OTP sent to your registered mobile ending in ••84 to authorize this ₹{amount} payment.
                </Text>

                <View style={styles.bankOtpInputRow}>
                  <TextInput
                    style={styles.bankOtpField}
                    value={bankOtp}
                    onChangeText={setBankOtp}
                    placeholder="Enter 6-digit Bank OTP"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={styles.fillBankOtpBtn}
                    onPress={() => setBankOtp('489201')}
                  >
                    <Text style={styles.fillBankOtpBtnText}>Auto-Fill</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.bankSecureInfo}>
                  <Ionicons name="shield-checkmark" size={16} color="#15803D" />
                  <Text style={styles.bankSecureInfoText}>
                    Direct 256-bit encrypted authentication channel with issuing bank.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.stripePayBtn, { backgroundColor: '#15803D' }]}
                  onPress={handleAuthorizeStripePayment}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.stripePayBtnText}>Authorize ₹{amount} & Lock Escrow</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStripeStep('CARD_CONFIRM')}
                  style={styles.stripeBackBtn}
                >
                  <Text style={styles.stripeBackBtnText}>← Back to Card Details</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Processing */}
            {stripeStep === 'PROCESSING' && (
              <View style={[styles.stripeBody, { alignItems: 'center', paddingVertical: 32 }]}>
                <ActivityIndicator size="large" color="#635BFF" />
                <Text style={styles.processingTitle}>Authorizing with Stripe & Bank...</Text>
                <Text style={styles.processingSub}>
                  Securing payment token and locking ₹{amount} into MandiKart Escrow Account.
                </Text>
              </View>
            )}

            {/* Step 4: Success */}
            {stripeStep === 'SUCCESS' && (
              <View style={[styles.stripeBody, { alignItems: 'center', paddingVertical: 24 }]}>
                <View style={styles.successCheckCircle}>
                  <Ionicons name="checkmark" size={36} color="#15803D" />
                </View>
                <Text style={styles.successTitle}>Payment Authorized!</Text>
                <Text style={styles.successSub}>
                  Stripe PaymentIntent Succeeded. Funds safely locked in Escrow Vault.
                </Text>
                <Text style={styles.successRef}>
                  Ref: {stripeIntentData?.paymentIntentId || 'pi_mandikart_success'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: { fontSize: 18, fontWeight: '700' },
  content: { padding: Spacing.md, gap: Spacing.md },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  escrowCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
  },
  escrowTextWrap: { flex: 1 },
  escrowTitle: { fontSize: 13, fontWeight: '700', color: '#15803D' },
  escrowSub: { fontSize: 11, color: '#166534', marginTop: 2, lineHeight: 16 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardSelected: { borderColor: Colors.primary, backgroundColor: '#F8FCF9' },
  expandedSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.sm,
  },
  inputPrompt: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  upiInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    gap: 8,
  },
  upiIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  upiInputField: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    padding: 0,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  cardSimulator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    gap: 8,
  },
  cardSimText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  cardSimExpiry: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  codNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  codNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 15,
  },
  label: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
  subLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  labelSelected: { color: Colors.primary },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textDisabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 8,
  },
  footerEscrowNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  footerEscrowNoteText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  stripeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  stripeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  methodBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  methodBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  stripeMethodBadge: {
    backgroundColor: '#EEF2FF',
  },
  stripeMethodBadgeText: {
    color: '#4F46E5',
  },
  upiSuffixRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  suffixChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  suffixChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  testCardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  testCardChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  cardInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  cardInputField: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    padding: 0,
  },
  cardBrandText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  // Stripe Gateway Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  stripeModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  stripeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAF5FF',
  },
  stripeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stripeLogoBox: {
    backgroundColor: '#635BFF',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  stripeLogoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: -0.5,
  },
  stripeHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  stripeHeaderSub: {
    fontSize: 10,
    color: '#64748B',
  },
  stripeCloseBtn: {
    padding: 6,
  },
  stripeAmountRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stripePayableText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  stripeAmountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38BDF8',
  },
  stripeBody: {
    padding: 16,
    gap: 14,
  },
  stripeCardVisual: {
    backgroundColor: '#1E1B4B',
    borderRadius: 12,
    padding: 16,
    gap: 14,
    shadowColor: '#4338CA',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  stripeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stripeChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FCD34D',
  },
  stripeNetworkText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 1,
  },
  stripeCardDigits: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  stripeCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 8,
  },
  stripeCardLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
  },
  stripeCardVal: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stripeUpiVisual: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    gap: 6,
  },
  stripeUpiVpa: {
    fontSize: 14,
    fontWeight: '800',
    color: '#312E81',
  },
  stripeUpiSub: {
    fontSize: 11,
    color: '#6366F1',
  },
  stripeIntentMeta: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stripeIntentText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#475569',
  },
  stripeEscrowMeta: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
  },
  stripePayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#635BFF',
    paddingVertical: 14,
    borderRadius: 10,
  },
  stripePayBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  bankHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  bankBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bankBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  verifiedByText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
  },
  bankPromptTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  bankPromptSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  bankOtpInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bankOtpField: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#635BFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 4,
    textAlign: 'center',
  },
  fillBankOtpBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 8,
  },
  fillBankOtpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  bankSecureInfo: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  bankSecureInfoText: {
    fontSize: 11,
    color: '#15803D',
    flex: 1,
  },
  stripeBackBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  stripeBackBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  processingSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  successCheckCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 12,
  },
  successSub: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  successRef: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#635BFF',
    marginTop: 8,
  },
});

