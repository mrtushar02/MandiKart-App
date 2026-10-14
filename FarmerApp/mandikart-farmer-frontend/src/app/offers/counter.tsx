/**
 * MandiKart Farmer App — Counteroffer Screen (Screen 25)
 *
 * Route: /offers/counter?id=...
 *
 * Facilitates multi-round bilateral price and commercial terms negotiation:
 * - Loads original offer and displays side-by-side comparison (Original vs Counter)
 * - Restricts changes to negotiable commercial fields (price, qty, delivery, payment, notes)
 * - Guards against stale or already finalized offers (ACCEPTED / REJECTED / EXPIRED)
 * - Live recalculation of landed budget and farmer savings differential
 * - Preserves complete audit trail in the negotiation history thread
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
  IndianRupee,
  ChevronRight,
  TrendingDown,
  Info,
  Building2,
  Calendar,
  Truck,
  Repeat,
  SlidersHorizontal,
  X,
  FileText,
  Send,
  History,
  Lock,
  ArrowRight,
  Percent,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useOffersStore, ProcurementOffer } from '@/store/offersStore';

export default function CounterofferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { currentOffer, fetchOfferById, counterOffer, isLoading } = useOffersStore();

  useEffect(() => {
    if (id) {
      fetchOfferById(id);
    }
  }, [id, fetchOfferById]);

  const offer: ProcurementOffer | null = currentOffer;

  // Negotiable state variables initialized from current offer
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [counterQuantity, setCounterQuantity] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [deliveryTerms, setDeliveryTerms] = useState<
    'SELLER_DELIVERY' | 'FARM_GATE_PICKUP' | 'MANDIKART_3PL'
  >('SELLER_DELIVERY');
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [negotiationNote, setNegotiationNote] = useState<string>('');

  // Synchronize initial values once offer is loaded
  useEffect(() => {
    if (offer) {
      // Suggest target price if available and lower than unitPrice, otherwise unitPrice - 50
      const suggestedPrice =
        offer.targetPrice && offer.targetPrice < offer.unitPrice
          ? offer.targetPrice
          : Math.max(1, offer.unitPrice - 50);

      setCounterPrice(String(suggestedPrice));
      setCounterQuantity(String(offer.quantity));
      setDeliveryDate(offer.deliveryDate);
      setDeliveryTerms(offer.deliveryTerms);
      setPaymentTerms(offer.paymentTerms);
      setNegotiationNote('');
    }
  }, [offer]);

  // Form submission and validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [counterSuccess, setCounterSuccess] = useState<ProcurementOffer | null>(null);

  // Check finalized state
  const isFinalized = useMemo(() => {
    if (!offer) return false;
    return (
      offer.status === 'ACCEPTED' ||
      offer.status === 'REJECTED' ||
      offer.status === 'EXPIRED'
    );
  }, [offer]);

  // Live Cost Recalculation for Proposed Counteroffer
  const originalQty = offer?.quantity || 1;
  const originalUnitPrice = offer?.unitPrice || 0;
  const originalLanded = offer?.totalLandedAmount || 0;

  const numCounterQty = parseFloat(counterQuantity) || originalQty;
  const numCounterPrice = parseFloat(counterPrice) || 0;

  const counterProduceCost = Math.round(numCounterQty * numCounterPrice);
  const counterFreight = useMemo(() => {
    if (deliveryTerms === 'FARM_GATE_PICKUP') return 0;
    const rate = deliveryTerms === 'MANDIKART_3PL' ? 45 : 35;
    return Math.round(numCounterQty * rate);
  }, [numCounterQty, deliveryTerms]);

  const counterCess = Math.round(counterProduceCost * 0.01);
  const counterHandling = Math.round(numCounterQty * 15);
  const counterTotalLanded =
    counterProduceCost + counterFreight + counterCess + counterHandling;
  const counterUnitLanded =
    numCounterQty > 0
      ? Math.round((counterTotalLanded / numCounterQty) * 100) / 100
      : 0;

  // Differentials
  const unitPriceDelta = numCounterPrice - originalUnitPrice;
  const unitPricePctDelta =
    originalUnitPrice > 0
      ? Math.round(((numCounterPrice - originalUnitPrice) / originalUnitPrice) * 1000) / 10
      : 0;
  const totalSavings = originalLanded - counterTotalLanded;

  // Validation
  const validateCounter = (): boolean => {
    const errs: Record<string, string> = {};

    if (!numCounterPrice || numCounterPrice <= 0) {
      errs.counterPrice = 'Counter price must be greater than zero.';
    }
    if (!numCounterQty || numCounterQty <= 0) {
      errs.counterQuantity = 'Quantity must be greater than zero.';
    }
    if (!deliveryDate) {
      errs.deliveryDate = 'Delivery date is required.';
    } else {
      const selected = new Date(deliveryDate).getTime();
      const today = new Date().setHours(0, 0, 0, 0);
      if (selected < today) {
        errs.deliveryDate = 'Delivery date cannot be in the past.';
      }
    }

    // Check if at least one field changed
    const hasChanges =
      numCounterPrice !== originalUnitPrice ||
      numCounterQty !== originalQty ||
      deliveryDate !== offer?.deliveryDate ||
      deliveryTerms !== offer?.deliveryTerms ||
      negotiationNote.trim().length > 0;

    if (!hasChanges) {
      errs.general = 'Please modify at least one commercial term or provide a negotiation note.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenConfirmation = () => {
    if (isFinalized) {
      Alert.alert(
        'Offer Finalized',
        `This offer is already ${offer?.status}. No further negotiations can be submitted.`
      );
      return;
    }

    if (validateCounter()) {
      setConfirmModalVisible(true);
    } else {
      Alert.alert('Validation Error', errors.general || 'Please check highlighted fields.');
    }
  };

  const handleExecuteCounter = async () => {
    if (!id || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await counterOffer(id, {
        counterPricePerUnit: numCounterPrice,
        counterQuantity: numCounterQty,
        deliveryDate,
        deliveryTerms,
        paymentTerms,
        notes: negotiationNote,
      });

      setIsSubmitting(false);
      setConfirmModalVisible(false);

      if (res.success && res.data) {
        setCounterSuccess(res.data);
      } else {
        Alert.alert('Counteroffer Failed', res.error || 'Server rejected counteroffer.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Error', err.message || 'An error occurred while submitting counteroffer.');
    }
  };

  if (isLoading && !offer) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={MKColors.primary} />
        <Text style={styles.loadingText}>Loading commercial offer history...</Text>
      </View>
    );
  }

  if (!offer) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <AlertCircle size={42} color="#DC2626" />
        <Text style={styles.errorTitle}>Offer Not Found</Text>
        <Text style={styles.errorSubtitle}>The requested offer #{id} could not be retrieved.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Offers</Text>
        </Pressable>
      </View>
    );
  }

  // Post-Counter Success Screen
  if (counterSuccess) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.successScreenContent}>
          <View style={styles.successIconCircle}>
            <Repeat size={48} color={MKColors.primary} />
          </View>
          <Text style={styles.successHeading}>Counteroffer Transmitted</Text>
          <Text style={styles.successSubtext}>
            Your revised commercial proposal has been sent to {counterSuccess.supplierName}.
            The negotiation thread has been updated.
          </Text>

          <View style={styles.successRecapCard}>
            <View style={styles.successRow}>
              <Text style={styles.successKey}>Offer Reference</Text>
              <Text style={styles.successValBold}>#{counterSuccess.id}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successKey}>Counter Price</Text>
              <Text style={[styles.successValBold, { color: MKColors.primary }]}>
                ₹{counterSuccess.unitPrice} / {counterSuccess.unit}
              </Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successKey}>Revised Landed Total</Text>
              <Text style={styles.successValBold}>
                ₹{counterSuccess.totalLandedAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successKey}>Negotiation Status</Text>
              <View style={styles.negotiatingBadge}>
                <Clock size={12} color="#1D4ED8" style={{ marginRight: 4 }} />
                <Text style={styles.negotiatingBadgeText}>Awaiting Supplier Review</Text>
              </View>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successKey}>Total Rounds Recorded</Text>
              <Text style={styles.successVal}>{counterSuccess.history.length} round(s)</Text>
            </View>
          </View>

          <View style={styles.successActions}>
            <Pressable
              style={styles.btnSuccessPrimary}
              onPress={() => router.push(`/offers/details?id=${counterSuccess.id}` as any)}
            >
              <Text style={styles.btnSuccessPrimaryText}>View Negotiation Thread</Text>
            </Pressable>
            <Pressable
              style={styles.btnSuccessSecondary}
              onPress={() => router.push('/offers/incoming' as any)}
            >
              <Text style={styles.btnSuccessSecondaryText}>Back to Incoming Offers</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1E293B" />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Revise / Counteroffer</Text>
          <Text style={styles.headerSubtitle}>
            Tender: {offer.requirementTitle} • #{offer.id}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Guard Banner if Finalized */}
        {isFinalized && (
          <View style={styles.finalizedBanner}>
            <Lock size={20} color="#DC2626" style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.finalizedBannerTitle}>
                Negotiation Locked ({offer.status})
              </Text>
              <Text style={styles.finalizedBannerSub}>
                This offer was already {offer.status.toLowerCase()} on{' '}
                {new Date(offer.updatedAt).toLocaleDateString('en-IN')}. Modifying terms is no
                longer permitted.
              </Text>
            </View>
          </View>
        )}

        {/* Supplier & Commodity Context Banner */}
        <View style={styles.contextCard}>
          <View style={{ flex: 1 }}>
            <View style={styles.contextBadgeRow}>
              <Text style={styles.contextTypeTag}>{offer.supplierType.replace('_', ' ')}</Text>
              {offer.isVerified && (
                <View style={styles.verifiedTag}>
                  <ShieldCheck size={10} color="#15803D" style={{ marginRight: 2 }} />
                  <Text style={styles.verifiedTagText}>Verified</Text>
                </View>
              )}
            </View>
            <Text style={styles.contextSupplierName}>{offer.supplierName}</Text>
            <Text style={styles.contextCommodity}>
              {offer.cropName} • {offer.grade} ({offer.variety})
            </Text>
          </View>
        </View>

        {/* Side-by-Side Commercial Terms Comparison */}
        <View style={styles.comparisonSheet}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonTitle}>Side-by-Side Term Comparison</Text>
            <Text style={styles.comparisonSubtitle}>
              Compare supplier's current quote with your proposed counteroffer
            </Text>
          </View>

          {/* Column Headers */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colHeader, { flex: 1.1 }]}>Commercial Parameter</Text>
            <Text style={[styles.colHeader, { flex: 1, textAlign: 'center' }]}>
              Current Supplier
            </Text>
            <Text
              style={[
                styles.colHeader,
                { flex: 1.1, textAlign: 'right', color: MKColors.primary },
              ]}
            >
              Your Counter
            </Text>
          </View>

          {/* Row 1: Unit Price */}
          <View style={styles.tableRow}>
            <View style={{ flex: 1.1 }}>
              <Text style={styles.paramLabel}>Base Rate</Text>
              <Text style={styles.paramUnit}>per {offer.unit}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.originalValText}>₹{offer.unitPrice}</Text>
            </View>
            <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
              <Text style={styles.counterValBold}>₹{numCounterPrice}</Text>
              {unitPriceDelta !== 0 && (
                <Text
                  style={[
                    styles.deltaBadgeText,
                    unitPriceDelta < 0 ? styles.savingsText : styles.increaseText,
                  ]}
                >
                  {unitPriceDelta < 0
                    ? `-₹${Math.abs(unitPriceDelta)} (${unitPricePctDelta}%)`
                    : `+₹${unitPriceDelta} (+${unitPricePctDelta}%)`}
                </Text>
              )}
            </View>
          </View>

          {/* Row 2: Volume */}
          <View style={styles.tableRow}>
            <View style={{ flex: 1.1 }}>
              <Text style={styles.paramLabel}>Procurement Volume</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.originalValText}>
                {offer.quantity} {offer.unit}
              </Text>
            </View>
            <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
              <Text style={styles.counterValBold}>
                {numCounterQty} {offer.unit}
              </Text>
            </View>
          </View>

          {/* Row 3: Delivery Method */}
          <View style={styles.tableRow}>
            <View style={{ flex: 1.1 }}>
              <Text style={styles.paramLabel}>Delivery Terms</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.originalValTextSmall}>
                {offer.deliveryTerms.replace('_', ' ')}
              </Text>
            </View>
            <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
              <Text style={styles.counterValSmall}>
                {deliveryTerms.replace('_', ' ')}
              </Text>
            </View>
          </View>

          {/* Row 4: Delivery Target Date */}
          <View style={styles.tableRow}>
            <View style={{ flex: 1.1 }}>
              <Text style={styles.paramLabel}>Dispatch By</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.originalValTextSmall}>{offer.deliveryDate}</Text>
            </View>
            <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
              <Text style={styles.counterValSmall}>{deliveryDate}</Text>
            </View>
          </View>

          {/* Row 5: Total Landed Amount */}
          <View style={[styles.tableRow, styles.tableRowTotal]}>
            <View style={{ flex: 1.1 }}>
              <Text style={styles.totalRowLabel}>Total Landed Budget</Text>
              <Text style={styles.totalRowSub}>All-in delivered</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.originalTotalVal}>
                ₹{originalLanded.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={{ flex: 1.1, alignItems: 'flex-end' }}>
              <Text style={styles.counterTotalVal}>
                ₹{counterTotalLanded.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Differential Savings Summary */}
          {totalSavings !== 0 && (
            <View
              style={[
                styles.savingsBanner,
                totalSavings > 0 ? styles.savingsBannerPositive : styles.savingsBannerNegative,
              ]}
            >
              <TrendingDown
                size={16}
                color={totalSavings > 0 ? '#15803D' : '#B45309'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.savingsBannerText,
                  { color: totalSavings > 0 ? '#15803D' : '#B45309' },
                ]}
              >
                {totalSavings > 0
                  ? `Estimated Farmer Savings: ₹${totalSavings.toLocaleString('en-IN')}`
                  : `Total landed cost increases by ₹${Math.abs(totalSavings).toLocaleString('en-IN')}`}
              </Text>
            </View>
          )}
        </View>

        {/* Input Form for Negotiable Terms */}
        <View style={styles.editCard}>
          <View style={styles.cardHeader}>
            <SlidersHorizontal size={18} color={MKColors.primary} />
            <Text style={styles.cardTitle}>Adjust Supported Terms</Text>
          </View>

          {/* Counter Rate Input */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>
                Proposed Counter Rate (₹ / {offer.unit}) <Text style={styles.reqStar}>*</Text>
              </Text>
              <Text style={styles.supplierAskRef}>Supplier Quote: ₹{offer.unitPrice}</Text>
            </View>

            <View style={styles.currencyInputWrap}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={[
                  styles.currencyInputBox,
                  errors.counterPrice && styles.inputErrorBorder,
                ]}
                value={counterPrice}
                onChangeText={(val) => {
                  setCounterPrice(val);
                  if (errors.counterPrice) setErrors((e) => ({ ...e, counterPrice: '' }));
                }}
                keyboardType="numeric"
                editable={!isFinalized}
                placeholder="2300"
              />
            </View>
            {errors.counterPrice ? (
              <Text style={styles.errText}>{errors.counterPrice}</Text>
            ) : null}
          </View>

          {/* Counter Quantity Input */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>
              Required Quantity ({offer.unit}) <Text style={styles.reqStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.inputBox,
                errors.counterQuantity && styles.inputErrorBorder,
              ]}
              value={counterQuantity}
              onChangeText={(val) => {
                setCounterQuantity(val);
                if (errors.counterQuantity) setErrors((e) => ({ ...e, counterQuantity: '' }));
              }}
              keyboardType="numeric"
              editable={!isFinalized}
            />
            {errors.counterQuantity ? (
              <Text style={styles.errText}>{errors.counterQuantity}</Text>
            ) : null}
          </View>

          {/* Delivery Terms Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Fulfillment Delivery Method</Text>
            <View style={styles.deliverySelector}>
              {(['SELLER_DELIVERY', 'MANDIKART_3PL', 'FARM_GATE_PICKUP'] as const).map(
                (term) => (
                  <Pressable
                    key={term}
                    style={[
                      styles.deliveryPill,
                      deliveryTerms === term && styles.deliveryPillActive,
                      isFinalized && { opacity: 0.6 },
                    ]}
                    onPress={() => !isFinalized && setDeliveryTerms(term)}
                  >
                    <Text
                      style={[
                        styles.deliveryPillText,
                        deliveryTerms === term && styles.deliveryPillTextActive,
                      ]}
                    >
                      {term === 'SELLER_DELIVERY'
                        ? 'Seller Delivery'
                        : term === 'MANDIKART_3PL'
                        ? 'MandiKart 3PL'
                        : 'Farm Gate Pickup'}
                    </Text>
                  </Pressable>
                )
              )}
            </View>
          </View>

          {/* Delivery Target Date Input */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>
              Delivery Target Date (YYYY-MM-DD) <Text style={styles.reqStar}>*</Text>
            </Text>
            <View style={styles.dateInputWrap}>
              <Calendar size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={[
                  styles.dateInputBox,
                  errors.deliveryDate && styles.inputErrorBorder,
                ]}
                value={deliveryDate}
                onChangeText={(val) => {
                  setDeliveryDate(val);
                  if (errors.deliveryDate) setErrors((e) => ({ ...e, deliveryDate: '' }));
                }}
                editable={!isFinalized}
                placeholder="2026-10-20"
              />
            </View>
            {errors.deliveryDate ? (
              <Text style={styles.errText}>{errors.deliveryDate}</Text>
            ) : null}
          </View>

          {/* Negotiation Justification / Rationale */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>
              Commercial Justification Note for {offer.supplierName}
            </Text>
            <TextInput
              style={styles.notesInput}
              value={negotiationNote}
              onChangeText={setNegotiationNote}
              placeholder="e.g. Willing to close contract immediately if rate is ₹2,280/qtl due to competitive terminal mandi spot rates..."
              multiline
              numberOfLines={3}
              editable={!isFinalized}
            />
          </View>
        </View>

        {/* Multi-Round Negotiation History Thread */}
        <View style={styles.historyCard}>
          <View style={styles.cardHeader}>
            <History size={18} color={MKColors.primary} />
            <Text style={styles.cardTitle}>Negotiation History ({offer.history.length})</Text>
          </View>

          <View style={styles.historyTimeline}>
            {offer.history.map((step, idx) => {
              const isSupplier = step.actorRole === 'SUPPLIER';
              return (
                <View key={step.stepId} style={styles.historyStepRow}>
                  <View style={styles.timelineIndicator}>
                    <View
                      style={[
                        styles.timelineDot,
                        isSupplier ? styles.dotSupplier : styles.dotFarmer,
                      ]}
                    />
                    {idx < offer.history.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  <View style={styles.historyContentBox}>
                    <View style={styles.historyActorRow}>
                      <Text style={styles.historyActorName}>{step.actorName}</Text>
                      <Text style={styles.historyTimestamp}>
                        {new Date(step.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.historyActionTitle}>
                      {step.action.replace('_', ' ')} • ₹{step.unitPrice} / {step.unit} ({step.quantity} {step.unit})
                    </Text>
                    {step.notes ? (
                      <Text style={styles.historyNotesText}>"{step.notes}"</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable style={styles.btnCancel} onPress={() => router.back()}>
          <Text style={styles.btnCancelText}>Cancel</Text>
        </Pressable>

        <Pressable
          style={[styles.btnSubmitCounter, isFinalized && styles.btnDisabled]}
          onPress={handleOpenConfirmation}
          disabled={isFinalized || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Send size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnSubmitCounterText}>Submit Counteroffer</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Confirmation Modal */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTopRow}>
              <View style={styles.modalIconWrap}>
                <Repeat size={20} color={MKColors.primary} />
              </View>
              <Text style={styles.modalHeading}>Confirm Counteroffer</Text>
            </View>

            <Text style={styles.modalDescription}>
              Transmit your revised counter terms to{' '}
              <Text style={{ fontWeight: '700' }}>{offer.supplierName}</Text>:
            </Text>

            <View style={styles.modalSummaryBox}>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryKey}>Counter Rate:</Text>
                <Text style={[styles.modalSummaryVal, { color: MKColors.primary, fontWeight: '700' }]}>
                  ₹{numCounterPrice} / {offer.unit}
                </Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryKey}>Volume:</Text>
                <Text style={styles.modalSummaryVal}>
                  {numCounterQty} {offer.unit}
                </Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryKey}>Total Proposed Landed:</Text>
                <Text style={[styles.modalSummaryVal, { fontWeight: '700' }]}>
                  ₹{counterTotalLanded.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryKey}>Delivery Method:</Text>
                <Text style={styles.modalSummaryVal}>{deliveryTerms.replace('_', ' ')}</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryKey}>Target Delivery Date:</Text>
                <Text style={styles.modalSummaryVal}>{deliveryDate}</Text>
              </View>
            </View>

            <Text style={styles.modalLegalNote}>
              Note: Submitting a counteroffer updates the negotiation status to PENDING_SUPPLIER.
              The supplier may accept, reject, or submit a revised counteroffer.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setConfirmModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelBtnText}>Back to Edit</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmBtn}
                onPress={handleExecuteCounter}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Confirm & Transmit</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FAF8F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 16,
    backgroundColor: MKColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  finalizedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  finalizedBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  finalizedBannerSub: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 2,
    lineHeight: 16,
  },
  contextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  contextBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contextTypeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: MKColors.primary,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  contextSupplierName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  contextCommodity: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  comparisonSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  comparisonHeader: {
    marginBottom: 12,
  },
  comparisonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  comparisonSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowTotal: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 0,
    marginTop: 4,
    borderRadius: 8,
  },
  paramLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  paramUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  originalValText: {
    fontSize: 13,
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  originalValTextSmall: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  counterValBold: {
    fontSize: 14,
    fontWeight: '700',
    color: MKColors.primary,
  },
  counterValSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.primary,
    textAlign: 'right',
  },
  deltaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  savingsText: {
    color: '#15803D',
  },
  increaseText: {
    color: '#B45309',
  },
  totalRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalRowSub: {
    fontSize: 10,
    color: '#64748B',
  },
  originalTotalVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  counterTotalVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  savingsBannerPositive: {
    backgroundColor: '#DCFCE7',
  },
  savingsBannerNegative: {
    backgroundColor: '#FEF3C7',
  },
  savingsBannerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  editCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  formGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  reqStar: {
    color: '#DC2626',
  },
  supplierAskRef: {
    fontSize: 11,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currencyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginRight: 6,
  },
  currencyInputBox: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0F172A',
  },
  inputErrorBorder: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 4,
  },
  deliverySelector: {
    flexDirection: 'row',
    gap: 6,
  },
  deliveryPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliveryPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: MKColors.primary,
  },
  deliveryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  deliveryPillTextActive: {
    color: MKColors.primary,
    fontWeight: '700',
  },
  dateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
  },
  dateInputBox: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  historyTimeline: {
    marginTop: 6,
  },
  historyStepRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineIndicator: {
    width: 20,
    alignItems: 'center',
    marginRight: 10,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  dotSupplier: {
    backgroundColor: '#3B82F6',
  },
  dotFarmer: {
    backgroundColor: MKColors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  historyContentBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  historyActorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyActorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  historyTimestamp: {
    fontSize: 10,
    color: '#94A3B8',
  },
  historyActionTitle: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2,
  },
  historyNotesText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FAF8F5',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  btnSubmitCounter: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
  },
  btnSubmitCounterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    backgroundColor: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  modalSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 6,
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalSummaryKey: {
    fontSize: 13,
    color: '#64748B',
  },
  modalSummaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalLegalNote: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: MKColors.primary,
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successScreenContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  successRecapCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    gap: 10,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successKey: {
    fontSize: 13,
    color: '#64748B',
  },
  successVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  successValBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  negotiatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  negotiatingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  successActions: {
    width: '100%',
    gap: 10,
  },
  btnSuccessPrimary: {
    backgroundColor: MKColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSuccessPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnSuccessSecondary: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnSuccessSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});
