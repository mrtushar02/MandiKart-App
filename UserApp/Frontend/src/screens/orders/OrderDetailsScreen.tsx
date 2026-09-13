import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar, Alert, Modal, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import StatusBadge from '../../components/StatusBadge';
import PrimaryButton from '../../components/PrimaryButton';
import { SAMPLE_PRODUCTS } from '../../services/mockData';
import { apiClient } from '../../services/apiClient';

export default function OrderDetailsScreen({ navigation, route }: any) {
  const orderId = route.params?.orderId || 'MK-2024-001234';
  const initialOrder = route.params?.order || {
    id: orderId,
    date: '3 Sep 2026, 02:30 PM',
    status: 'DISPATCHED',
    total: 395,
    itemsCount: 3,
    itemsPreview: [SAMPLE_PRODUCTS[0], SAMPLE_PRODUCTS[2], SAMPLE_PRODUCTS[7]].filter(Boolean),
    deliveryAddress: 'Flat 402, Shivajinagar, Pune - 411005',
    farmerName: 'Rajan Kumar',
    estimatedDelivery: 'Today by 5:30 PM',
  };

  const [orderStatus, setOrderStatus] = useState<string>(initialOrder.status);
  const deliveryOtp = initialOrder.deliveryOtp || route.params?.deliveryOtp || '719284';
  const [otpCopied, setOtpCopied] = useState(false);
  const [disputeId, setDisputeId] = useState<string | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDisputeCategory, setSelectedDisputeCategory] = useState('DAMAGED_PRODUCE');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const handleDownloadInvoice = () => {
    setShowReceiptModal(true);
  };

  const handleCopyOtp = () => {
    setOtpCopied(true);
    Alert.alert(
      'Delivery OTP Copied 📋',
      `Verification Code: ${deliveryOtp}\n\nShare this 6-digit code with your MandiKart delivery partner ONLY when you have inspected your produce at the doorstep.`
    );
    setTimeout(() => setOtpCopied(false), 3000);
  };

  const handleExportPdf = () => {
    Alert.alert(
      'Receipt Exported 📄',
      `Tax Invoice INV-${orderId}.pdf has been generated and saved to your device Downloads folder.`
    );
  };

  const handleShareReceipt = () => {
    Alert.alert(
      'Receipt Shared 📤',
      `Link to verified tax invoice for Order #${orderId} generated: https://mandikart.in/invoices/${orderId}`
    );
  };

  const handleRaiseDispute = () => {
    setIsDisputeModalOpen(true);
  };

  const submitDispute = async (reason: string, category: string) => {
    setIsDisputeModalOpen(false);
    try {
      const res = await apiClient.orders.raiseDispute(orderId, reason, category);
      setOrderStatus('DISPUTED');
      setDisputeId(res.disputeId);
      Alert.alert(
        'Dispute Lodged 🛡️',
        `Dispute ${res.disputeId} registered successfully.\n\nEscrow funds have been frozen. MandiKart Quality Inspector will review and contact you within 2 hours.`
      );
    } catch (e: any) {
      setOrderStatus('DISPUTED');
      Alert.alert('Dispute Registered', 'Your dispute has been logged and escrow payout frozen.');
    }
  };

  const handleCancelOrder = () => {
    const doCancel = async () => {
      try {
        await apiClient.orders.cancelOrder(orderId);
        setOrderStatus('CANCELLED');
        if (route.params?.onCancel) route.params.onCancel();
        Alert.alert('Order Cancelled', 'Your order has been cancelled successfully and escrow refund initiated.');
      } catch (err: any) {
        Alert.alert('Cancel Failed', err?.message || 'Unable to cancel order at this time.');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm(
          `Are you sure you want to cancel Order #${orderId}?\n\nA full refund of ₹${initialOrder.total} will be processed immediately.`
        );
        if (confirmed) {
          doCancel();
        }
      } else {
        doCancel();
      }
    } else {
      Alert.alert(
        'Cancel Order 🚫',
        `Are you sure you want to cancel Order #${orderId}?\n\nA full refund of ₹${initialOrder.total} will be processed immediately to your original payment method.`,
        [
          { text: 'Keep Order', style: 'cancel' },
          {
            text: 'Yes, Cancel Order',
            style: 'destructive',
            onPress: doCancel,
          },
        ]
      );
    }
  };

  const isCancelable = orderStatus === 'DISPATCHED' || orderStatus === 'PROCESSING' || orderStatus === 'CONFIRMED' || orderStatus === 'PENDING';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Order Details</Text>
        <TouchableOpacity onPress={handleDownloadInvoice}>
          <Ionicons name="download-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusTopRow}>
            <View>
              <Text style={styles.orderIdText}>{orderId}</Text>
              <Text style={styles.dateText}>Placed on {initialOrder.date}</Text>
            </View>
            <StatusBadge status={orderStatus as any} size="md" />
          </View>

          {orderStatus === 'CANCELLED' ? (
            <View style={styles.cancelledBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cancelledTitle}>Order Cancelled</Text>
                <Text style={styles.cancelledSub}>Refund of ₹{initialOrder.total} initiated to your original payment mode.</Text>
              </View>
            </View>
          ) : orderStatus === 'DISPUTED' ? (
            <View style={styles.disputeBanner}>
              <Ionicons name="shield-outline" size={20} color="#B45309" />
              <View style={{ flex: 1 }}>
                <Text style={styles.disputeTitle}>Dispute Under Investigation</Text>
                <Text style={styles.disputeSub}>
                  Farmer escrow payout is frozen. MandiKart Resolution Desk will contact you within 2 hours.
                </Text>
              </View>
            </View>
          ) : (
            initialOrder.estimatedDelivery && (
              <View style={styles.etaRow}>
                <Ionicons name="time" size={16} color={Colors.primary} />
                <Text style={styles.etaText}>Estimated Delivery: <Text style={styles.etaHighlight}>{initialOrder.estimatedDelivery}</Text></Text>
              </View>
            )
          )}
        </View>

        {/* Delivery Confirmation OTP Card */}
        {orderStatus !== 'CANCELLED' && (
          <View style={styles.otpCard}>
            <View style={styles.otpTopRow}>
              <View style={styles.otpIconCircle}>
                <Ionicons name="key" size={18} color="#15803D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.otpCardTitle}>Delivery Confirmation OTP</Text>
                <Text style={styles.otpCardSub}>
                  {orderStatus === 'DELIVERED'
                    ? 'Handover completed & verified by partner'
                    : 'Share with delivery driver upon doorstep inspection'}
                </Text>
              </View>
              <View style={[styles.otpBadge, orderStatus === 'DELIVERED' ? styles.otpBadgeDelivered : styles.otpBadgeActive]}>
                <Text style={[styles.otpBadgeText, orderStatus === 'DELIVERED' ? styles.otpBadgeTextDelivered : styles.otpBadgeTextActive]}>
                  {orderStatus === 'DELIVERED' ? 'VERIFIED ✓' : 'AWAITING HANDOVER'}
                </Text>
              </View>
            </View>

            {/* 6 Digit Display */}
            <View style={styles.otpDigitsRow}>
              {deliveryOtp.split('').map((d: string, i: number) => (
                <View key={i} style={[styles.otpDigitBox, orderStatus === 'DELIVERED' && styles.otpDigitBoxDelivered]}>
                  <Text style={[styles.otpDigitText, orderStatus === 'DELIVERED' && styles.otpDigitTextDelivered]}>
                    {d}
                  </Text>
                </View>
              ))}
            </View>

            {/* Security Handover Notice */}
            <View style={styles.otpWarningBox}>
              <Ionicons name="shield-checkmark" size={15} color="#15803D" />
              <Text style={styles.otpWarningText}>
                Never share this OTP over call. Give it to the delivery agent only after opening and verifying your crates.
              </Text>
            </View>

            {/* Action Row */}
            <View style={styles.otpActionRow}>
              <TouchableOpacity style={styles.copyOtpBtn} onPress={handleCopyOtp} activeOpacity={0.8}>
                <Ionicons name={otpCopied ? 'checkmark' : 'copy-outline'} size={15} color="#15803D" />
                <Text style={styles.copyOtpBtnText}>{otpCopied ? 'Copied' : 'Copy Code'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.trackDeliveryBtn}
                onPress={() => navigation.navigate('OrderTracking', { orderId, order: { ...initialOrder, deliveryOtp } })}
                activeOpacity={0.85}
              >
                <Ionicons name="navigate-outline" size={15} color="#FFFFFF" />
                <Text style={styles.trackDeliveryBtnText}>Track Delivery Vehicle</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Farmer Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Source Farm</Text>
          <View style={styles.farmerRow}>
            <View style={styles.farmerAvatar}>
              <Text style={styles.avatarText}>🧑‍🌾</Text>
            </View>
            <View style={styles.farmerInfo}>
              <Text style={styles.farmerName}>{initialOrder.farmerName}</Text>
              <Text style={styles.farmerSub}>Verified Direct Farmer • Nashik, MH</Text>
            </View>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => navigation.navigate('ChatStack', { screen: 'Chat', params: { name: initialOrder.farmerName } })}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Ordered Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ordered Items ({initialOrder.itemsPreview.length})</Text>
          <View style={styles.itemsList}>
            {initialOrder.itemsPreview.map((item: any, i: number) => (
              <View key={`${item.id}-${i}`} style={styles.itemRow}>
                <Image source={{ uri: item.imageUrl }} style={styles.itemThumb} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemUnit}>Qty: {item.quantity || 1} {item.unit || 'kg'} • ₹{item.price}/{item.unit || 'kg'}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{(item.price || 0) * (item.quantity || 1)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.addressName}>Ramesh Sharma (Home)</Text>
              <Text style={styles.addressText}>{initialOrder.deliveryAddress}</Text>
              <Text style={styles.phoneText}>Phone: +91 98765 43210</Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Breakdown</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item Subtotal</Text>
            <Text style={styles.summaryValue}>₹{initialOrder.total - 5}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={[styles.summaryValue, { color: Colors.success, fontWeight: '700' }]}>FREE</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Handling Fee</Text>
            <Text style={styles.summaryValue}>₹5</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total {orderStatus === 'CANCELLED' ? 'Refunded' : 'Paid (UPI)'}</Text>
            <Text style={[styles.totalValue, orderStatus === 'CANCELLED' && { color: Colors.error }]}>₹{initialOrder.total}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      {isCancelable && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelOrder} activeOpacity={0.85}>
            <Ionicons name="close-circle-outline" size={18} color={Colors.error} />
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.trackBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('OrderTracking', { orderId: orderId, order: initialOrder })}
          >
            <Ionicons name="location" size={18} color={Colors.white} />
            <Text style={styles.trackBtnText}>Track Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {(orderStatus === 'DELIVERED' || orderStatus === 'COMPLETED') && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.disputeBtn} onPress={handleRaiseDispute} activeOpacity={0.85}>
            <Ionicons name="alert-circle-outline" size={18} color="#B45309" />
            <Text style={styles.disputeBtnText}>Report Quality Issue / Dispute</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={isDisputeModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDisputeModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="shield-half" size={22} color="#D97706" />
                <Text style={styles.modalTitle}>Raise Escrow Dispute</Text>
              </View>
              <TouchableOpacity onPress={() => setIsDisputeModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Select the issue experienced. MandiKart escrow protection will freeze farmer payout pending resolution.
            </Text>

            <View style={styles.categoryList}>
              {[
                { key: 'DAMAGED_PRODUCE', label: 'Damaged or Spoiled Produce 🥬' },
                { key: 'WEIGHT_MISMATCH', label: 'Incorrect Weight / Missing Items ⚖️' },
                { key: 'WRONG_ITEM', label: 'Wrong Item Delivered 📦' },
                { key: 'QUALITY_POOR', label: 'Substandard / Low Quality 👎' },
              ].map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.catOption,
                    selectedDisputeCategory === cat.key && styles.catOptionSelected,
                  ]}
                  onPress={() => setSelectedDisputeCategory(cat.key)}
                >
                  <Ionicons
                    name={selectedDisputeCategory === cat.key ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={selectedDisputeCategory === cat.key ? Colors.primary : Colors.textDisabled}
                  />
                  <Text
                    style={[
                      styles.catOptionText,
                      selectedDisputeCategory === cat.key && styles.catOptionTextSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.disputeInput}
              placeholder="Describe the issue in detail (optional)..."
              placeholderTextColor={Colors.textDisabled}
              multiline
              numberOfLines={3}
              value={disputeNotes}
              onChangeText={setDisputeNotes}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsDisputeModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={() => submitDispute(disputeNotes || selectedDisputeCategory, selectedDisputeCategory)}
              >
                <Text style={styles.modalSubmitText}>Submit Dispute</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Official Tax Invoice & Escrow Receipt Modal */}
      <Modal
        visible={showReceiptModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReceiptModal(false)}
      >
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptTopRow}>
              <View style={styles.receiptBrandRow}>
                <Ionicons name="leaf" size={20} color={Colors.primary} />
                <Text style={styles.receiptBrandTitle}>MandiKart Tax Invoice</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReceiptModal(false)} style={styles.receiptCloseBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.receiptScrollContent}>
              {/* Receipt Header Data */}
              <View style={styles.receiptHeaderBox}>
                <View>
                  <Text style={styles.receiptInvoiceNo}>INV-{orderId}</Text>
                  <Text style={styles.receiptDate}>{initialOrder.date}</Text>
                </View>
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                  <Text style={styles.paidBadgeText}>PAID & ESCROW SECURED</Text>
                </View>
              </View>

              {/* Parties */}
              <View style={styles.partiesGrid}>
                <View style={styles.partyCol}>
                  <Text style={styles.partyLabel}>BILLED TO:</Text>
                  <Text style={styles.partyVal}>Buyer (MandiKart Registered)</Text>
                  <Text style={styles.partySub}>{initialOrder.deliveryAddress}</Text>
                </View>
                <View style={styles.partyCol}>
                  <Text style={styles.partyLabel}>SUPPLIER / APMC HUB:</Text>
                  <Text style={styles.partyVal}>{initialOrder.farmerName || 'Mandi Central Hub'}</Text>
                  <Text style={styles.partySub}>GSTIN: 21AAACM4928P1Z8</Text>
                </View>
              </View>

              {/* Stripe Payment & Escrow Guarantee Box */}
              <View style={styles.stripeReceiptBox}>
                <View style={styles.stripeReceiptHeader}>
                  <Ionicons name="card-outline" size={16} color={Colors.primary} />
                  <Text style={styles.stripeReceiptTitle}>Stripe Payment Guarantee</Text>
                </View>
                <Text style={styles.stripeReceiptRef}>
                  Payment Reference: pi_mandikart_{orderId.replace(/[^a-zA-Z0-9]/g, '')}
                </Text>
                <Text style={styles.stripeReceiptSub}>
                  🛡️ Payment is locked in MandiKart Smart Escrow. Funds will be released to the farmer upon verified doorstep delivery OTP.
                </Text>
              </View>

              {/* Itemized Table */}
              <View style={styles.itemsTable}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.th, { flex: 2 }]}>Item</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                  <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Amount</Text>
                </View>

                {initialOrder.itemsPreview?.map((item: any, idx: number) => (
                  <View key={idx} style={styles.tableDataRow}>
                    <Text style={[styles.td, { flex: 2, fontWeight: '700' }]}>{item?.name || `Item #${idx + 1}`}</Text>
                    <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>1</Text>
                    <Text style={[styles.td, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>
                      ₹{item?.price || 120}
                    </Text>
                  </View>
                ))}

                <View style={styles.receiptSummaryDivider} />

                <View style={styles.receiptSumRow}>
                  <Text style={styles.receiptSumLabel}>Subtotal</Text>
                  <Text style={styles.receiptSumVal}>₹{initialOrder.total - 15}</Text>
                </View>
                <View style={styles.receiptSumRow}>
                  <Text style={styles.receiptSumLabel}>GST (5% Agricultural Mandi Cess)</Text>
                  <Text style={styles.receiptSumVal}>₹0.00 (Exempt)</Text>
                </View>
                <View style={styles.receiptSumRow}>
                  <Text style={styles.receiptSumLabel}>Cold-Chain Logistics</Text>
                  <Text style={styles.receiptSumVal}>₹30.00</Text>
                </View>
                <View style={styles.receiptSumRow}>
                  <Text style={styles.receiptSumLabel}>Platform Discount</Text>
                  <Text style={[styles.receiptSumVal, { color: Colors.primary }]}>-₹15.00</Text>
                </View>

                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptTotalLabel}>Grand Total Paid</Text>
                  <Text style={styles.receiptTotalVal}>₹{initialOrder.total}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.receiptActionsRow}>
                <TouchableOpacity
                  style={styles.downloadPdfBtn}
                  onPress={handleExportPdf}
                  activeOpacity={0.85}
                >
                  <Ionicons name="download-outline" size={18} color={Colors.white} />
                  <Text style={styles.downloadPdfBtnText}>Download PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareReceiptBtn}
                  onPress={handleShareReceipt}
                  activeOpacity={0.85}
                >
                  <Ionicons name="share-social-outline" size={18} color={Colors.primary} />
                  <Text style={styles.shareReceiptBtnText}>Export & Share</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  // Status Card
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  statusTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderIdText: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  dateText: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  etaText: { fontSize: 12, color: Colors.textPrimary },
  etaHighlight: { fontWeight: '700', color: Colors.primary },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  cancelledTitle: { fontSize: 13, fontWeight: '800', color: Colors.error },
  cancelledSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
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
  // Farmer
  farmerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  farmerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20 },
  farmerInfo: { flex: 1 },
  farmerName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  farmerSub: { fontSize: 11, color: Colors.textSecondary },
  chatBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  // Items
  itemsList: { gap: Spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemThumb: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.gray100 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  itemUnit: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  // Address
  addressRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  addressName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  addressText: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  phoneText: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  // Payment
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },
  totalLabel: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  totalValue: { fontSize: 17, fontWeight: '800', color: Colors.primary },
  // Footer
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.lg,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.error,
    backgroundColor: Colors.white,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: Colors.error },
  trackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  trackBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  // Dispute Styles
  disputeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disputeTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  disputeSub: { fontSize: 11, color: '#78350F', marginTop: 1, lineHeight: 15 },
  disputeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: '#D97706',
    backgroundColor: '#FFFBEB',
  },
  disputeBtnText: { fontSize: 14, fontWeight: '700', color: '#B45309' },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  categoryList: {
    gap: 8,
  },
  catOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.gray50,
  },
  catOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  catOptionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  catOptionTextSelected: {
    fontWeight: '700',
    color: Colors.primary,
  },
  disputeInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalSubmitBtn: {
    flex: 2,
    height: 46,
    borderRadius: BorderRadius.full,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  // Tax Invoice & Escrow Receipt Styles
  receiptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  receiptCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.lg,
  },
  receiptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  receiptBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  receiptBrandTitle: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  receiptCloseBtn: { padding: 4 },
  receiptScrollContent: { gap: Spacing.md, paddingBottom: 24 },
  receiptHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  receiptInvoiceNo: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  receiptDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  paidBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.primary },
  partiesGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.background,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  partyCol: { flex: 1 },
  partyLabel: { fontSize: 10, fontWeight: '800', color: Colors.textDisabled, marginBottom: 2 },
  partyVal: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  partySub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  stripeReceiptBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    gap: 4,
  },
  stripeReceiptHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stripeReceiptTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  stripeReceiptRef: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: Colors.primary },
  stripeReceiptSub: { fontSize: 11, color: Colors.textSecondary, lineHeight: 15 },
  itemsTable: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 6,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  th: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase' },
  tableDataRow: { flexDirection: 'row', paddingVertical: 4, alignItems: 'center' },
  td: { fontSize: 12, color: Colors.textPrimary },
  receiptSummaryDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },
  receiptSumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  receiptSumLabel: { fontSize: 12, color: Colors.textSecondary },
  receiptSumVal: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 2,
  },
  receiptTotalLabel: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  receiptTotalVal: { fontSize: 16, fontWeight: '900', color: Colors.primary },
  receiptActionsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  downloadPdfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: BorderRadius.md,
  },
  downloadPdfBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  shareReceiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    height: 44,
    borderRadius: BorderRadius.md,
  },
  shareReceiptBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },

  /* Delivery Confirmation OTP Card Styles */
  otpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginBottom: Spacing.md,
    ...Shadows.sm,
    gap: 10,
  },
  otpTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  otpIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  otpCardSub: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  otpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  otpBadgeActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  otpBadgeDelivered: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  otpBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  otpBadgeTextActive: {
    color: '#B45309',
  },
  otpBadgeTextDelivered: {
    color: '#15803D',
  },
  otpDigitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  otpDigitBox: {
    width: 42,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigitBoxDelivered: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  otpDigitText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 1,
  },
  otpDigitTextDelivered: {
    color: '#64748B',
  },
  otpWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  otpWarningText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
    fontWeight: '500',
  },
  otpActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  copyOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
  },
  copyOtpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  trackDeliveryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#15803D',
    height: 38,
    borderRadius: 8,
  },
  trackDeliveryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

