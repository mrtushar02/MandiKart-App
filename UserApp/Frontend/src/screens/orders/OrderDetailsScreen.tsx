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
  const [disputeId, setDisputeId] = useState<string | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDisputeCategory, setSelectedDisputeCategory] = useState('DAMAGED_PRODUCE');
  const [disputeNotes, setDisputeNotes] = useState('');

  const handleDownloadInvoice = () => {
    Alert.alert('Download Invoice 📄', `Invoice for order ${orderId} has been downloaded to your device.`);
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
});
