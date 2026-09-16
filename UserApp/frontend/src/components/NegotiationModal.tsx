import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme';
import { Product } from '../types';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

interface NegotiationModalProps {
  visible: boolean;
  product: Product;
  initialQuantity?: number;
  onClose: () => void;
  onOfferSubmitted: (offer: any) => void;
}

export default function NegotiationModal({
  visible,
  product,
  initialQuantity = 20,
  onClose,
  onOfferSubmitted,
}: NegotiationModalProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState<string>(String(Math.max(product.minOrder || 1, initialQuantity)));
  const [offeredPrice, setOfferedPrice] = useState<string>(String(Math.round(product.price * 0.9)));
  const [remarks, setRemarks] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsedQty = Math.max(1, Number(quantity) || 1);
  const parsedOffer = Math.max(1, Number(offeredPrice) || 1);
  const originalTotal = parsedQty * product.price;
  const offeredTotal = parsedQty * parsedOffer;
  const discountPercent = Math.round(((product.price - parsedOffer) / product.price) * 100);

  const handleModalClose = () => {
    setSubmittedSuccess(null);
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    if (parsedOffer >= product.price) {
      setErrorMessage(`Your offer (₹${parsedOffer}) is at or above the listed price (₹${product.price}). You can directly add to cart.`);
      return;
    }

    if (parsedOffer < product.price * 0.5) {
      setErrorMessage('Offers below 50% of the farm base price are automatically declined by the fair-trade policy.');
      return;
    }

    setLoading(true);
    try {
      const buyerName = user?.fullName || 'Verified Buyer';
      const buyerPhone = user?.phone || '+91 98765 43210';
      const buyerId = user?.id || 'buyer_default_01';
      const farmerId = product.farmer?.id || (product as any).farmerId || 'd1111111-1111-1111-1111-111111111111';
      const farmerName = product.farmer?.name || (product as any).farmerName || 'Ramesh Patel';

      const offer = await apiClient.negotiations.submitOffer({
        productId: product.id,
        cropName: product.name,
        cropImage: product.images?.[0] || product.imageUrl,
        grade: (product as any).grade || 'A',
        farmerId,
        farmerName,
        buyerId,
        buyerName,
        buyerPhone,
        originalPrice: product.price,
        offeredPrice: parsedOffer,
        quantity: parsedQty,
        unit: product.unit,
        remarks: remarks || `Looking for ${parsedQty} ${product.unit} at ₹${parsedOffer}/${product.unit}`,
      });

      setLoading(false);
      setSubmittedSuccess(offer);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to submit offer. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleModalClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          {submittedSuccess ? (
            /* ── Submission Confirmation Popup ── */
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={54} color={Colors.primary} />
              </View>
              <Text style={styles.successTitle}>Offer Dispatched! 🤝</Text>
              <Text style={styles.successSubTitle}>
                Your price proposal has been delivered directly to {product.farmer?.name || 'the farmer'}.
              </Text>

              <View style={styles.successSummaryCard}>
                <View style={styles.successSummaryRow}>
                  <Text style={styles.successSummaryLabel}>Produce</Text>
                  <Text style={styles.successSummaryVal}>{product.name}</Text>
                </View>
                <View style={styles.successSummaryRow}>
                  <Text style={styles.successSummaryLabel}>Offered Rate</Text>
                  <Text style={[styles.successSummaryVal, { color: Colors.primary, fontWeight: '800' }]}>
                    ₹{parsedOffer}/{product.unit} ({discountPercent}% off listed)
                  </Text>
                </View>
                <View style={styles.successSummaryRow}>
                  <Text style={styles.successSummaryLabel}>Quantity</Text>
                  <Text style={styles.successSummaryVal}>{parsedQty} {product.unit}</Text>
                </View>
                <View style={[styles.successSummaryRow, { borderBottomWidth: 0, paddingTop: 8 }]}>
                  <Text style={[styles.successSummaryLabel, { fontWeight: '800', color: Colors.textPrimary }]}>Total Offer Value</Text>
                  <Text style={[styles.successSummaryVal, { fontSize: 17, fontWeight: '900', color: Colors.textPrimary }]}>₹{offeredTotal}</Text>
                </View>
              </View>

              <View style={styles.successNoticeBox}>
                <Ionicons name="information-circle" size={16} color={Colors.primary} />
                <Text style={styles.successNoticeText}>
                  The farmer has been notified via SMS & App. You can discuss or adjust terms in real-time chat.
                </Text>
              </View>

              <View style={styles.successActionsCol}>
                <TouchableOpacity
                  style={styles.chatActionBtn}
                  onPress={() => {
                    const offer = submittedSuccess;
                    handleModalClose();
                    onOfferSubmitted(offer);
                  }}
                >
                  <Ionicons name="chatbubbles" size={18} color={Colors.white} />
                  <Text style={styles.chatActionBtnText}>Open Live Negotiation Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.doneActionBtn}
                  onPress={() => {
                    const offer = submittedSuccess;
                    handleModalClose();
                    onOfferSubmitted(offer);
                  }}
                >
                  <Text style={styles.doneActionBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ── Offer Input Form ── */
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.badge}>
                    <Ionicons name="pricetag-outline" size={14} color={Colors.primary} />
                    <Text style={styles.badgeText}>DIRECT PRICE NEGOTIATION</Text>
                  </View>
                  <Text style={styles.title}>Make an Offer to Farmer</Text>
                  <Text style={styles.subTitle}>
                    {product.name} • Listed at ₹{product.price}/{product.unit}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={handleModalClose}>
                  <Ionicons name="close" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={Colors.error} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Quantity & Offer Inputs */}
              <View style={styles.inputSection}>
                <View style={styles.row}>
                  <View style={styles.halfCol}>
                    <Text style={styles.inputLabel}>Required Quantity ({product.unit})</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={quantity}
                        onChangeText={setQuantity}
                        placeholder="e.g. 50"
                      />
                      <Text style={styles.unitSuffix}>{product.unit}</Text>
                    </View>
                  </View>

                  <View style={styles.halfCol}>
                    <Text style={styles.inputLabel}>Your Target Price (₹)</Text>
                    <View style={styles.inputWrap}>
                      <Text style={styles.rupeePrefix}>₹</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={offeredPrice}
                        onChangeText={setOfferedPrice}
                        placeholder="e.g. 24"
                      />
                      <Text style={styles.unitSuffix}>/{product.unit}</Text>
                    </View>
                  </View>
                </View>

                {/* Price comparison card */}
                <View style={styles.calcCard}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Listed Farm Total:</Text>
                    <Text style={styles.calcOriginal}>₹{originalTotal}</Text>
                  </View>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Your Proposed Total:</Text>
                    <Text style={styles.calcOffered}>₹{offeredTotal}</Text>
                  </View>
                  <View style={styles.savingRow}>
                    <Text style={styles.savingText}>
                      {discountPercent > 0 ? `Target Discount: ${discountPercent}% lower than listed price` : 'Standard Listed Rate'}
                    </Text>
                  </View>
                </View>

                {/* Remarks note */}
                <Text style={styles.inputLabel}>Note for Farmer (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g. Require regular delivery for restaurant kitchen..."
                  placeholderTextColor={Colors.textDisabled}
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Action buttons */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleModalClose}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <View style={styles.btnContent}>
                      <Ionicons name="paper-plane-outline" size={16} color={Colors.white} />
                      <Text style={styles.submitBtnText}>Submit Offer (₹{offeredTotal})</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputSection: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray50,
    paddingHorizontal: 10,
    height: 44,
  },
  rupeePrefix: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingVertical: 4,
  },
  unitSuffix: {
    fontSize: 12,
    color: Colors.textDisabled,
    marginLeft: 2,
  },
  calcCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginVertical: 4,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calcLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  calcOriginal: {
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  calcOffered: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  savingRow: {
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
    paddingTop: 4,
    marginTop: 2,
  },
  savingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray50,
    padding: 10,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 50,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    height: 46,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.md,
    padding: 10,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 12.5,
    color: Colors.error,
    fontWeight: '600',
    flex: 1,
  },

  /* ── Submission Confirmation Popup Styles ── */
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  successSubTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  successSummaryCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    marginBottom: 14,
  },
  successSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  successSummaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  successSummaryVal: {
    fontSize: 13.5,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  successNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.md,
    padding: 10,
    marginBottom: 20,
    width: '100%',
  },
  successNoticeText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  successActionsCol: {
    width: '100%',
    gap: 10,
  },
  chatActionBtn: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatActionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
  },
  doneActionBtn: {
    width: '100%',
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  doneActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
