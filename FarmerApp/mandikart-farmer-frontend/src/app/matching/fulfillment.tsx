/**
 * MandiKart Farmer App — Fulfilment Summary Screen (Screen 20)
 *
 * Route: /matching/fulfillment?id=...
 *
 * Displays the complete procurement fulfillment status: original tender
 * requirements, confirmed or proposed supplier allocations, landed cost
 * financial engineering, outstanding volume, and binding submission to suppliers.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
  HelpCircle,
  MapPin,
  Clock,
  Package,
  IndianRupee,
  Layers,
  ChevronRight,
  TrendingDown,
  Info,
  Truck,
  Scale,
  Sparkles,
  SlidersHorizontal,
  MessageSquare,
  FileCheck,
  Send,
  Building2,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useRequirementsStore } from '@/store/requirementsStore';
import {
  useSupplierMatchingStore,
  FulfillmentPlan,
  SupplierAllocationItem,
} from '@/store/supplierMatchingStore';

export default function FulfilmentSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getRequirementById } = useRequirementsStore();
  const {
    matchesByRequirementId,
    getComputedPlan,
    fetchFulfillmentPlan,
    saveFulfillmentPlan,
    isLoading,
  } = useSupplierMatchingStore();

  const [confirming, setConfirming] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const requirement = useMemo(() => {
    if (!id) return undefined;
    return getRequirementById(id);
  }, [id, getRequirementById]);

  const primaryProduct = requirement?.products[0];
  const targetQuantity = primaryProduct?.quantity || requirement?.totalQuantity || 100;
  const unit = primaryProduct?.unit || requirement?.primaryUnit || 'quintal';
  const targetPrice = primaryProduct?.targetPricePerUnit || 2400;

  useEffect(() => {
    if (id) {
      fetchFulfillmentPlan(id);
    }
  }, [id, fetchFulfillmentPlan]);

  // Computed / Stored Plan
  const plan: FulfillmentPlan = useMemo(() => {
    if (!id) {
      return {
        requirementId: '',
        targetQuantity,
        totalAllocatedQuantity: 0,
        outstandingQuantity: targetQuantity,
        unit,
        fulfillmentStatus: 'PROPOSED_PLAN',
        allocations: [],
        totalProduceCost: 0,
        totalFreightCost: 0,
        totalMandiCessCost: 0,
        totalHandlingCost: 0,
        grandTotalLandedCost: 0,
        blendedPricePerUnit: 0,
        isConfirmed: false,
        updatedAt: new Date().toISOString(),
      };
    }
    return getComputedPlan(id, targetQuantity, unit, targetPrice);
  }, [id, targetQuantity, unit, targetPrice, getComputedPlan]);

  const isFullyFulfilled = plan.outstandingQuantity === 0;
  const isPartiallyFulfilled = plan.outstandingQuantity > 0 && plan.totalAllocatedQuantity > 0;
  const isAwaitingConfirmation = plan.isConfirmed && plan.outstandingQuantity > 0;
  const isConfirmed = plan.isConfirmed;

  const handleConfirmSubmission = async () => {
    if (!id) return;
    setConfirming(true);
    try {
      const res = await saveFulfillmentPlan(id, true);
      setConfirming(false);
      if (res.success) {
        setConfirmationMessage(res.message || 'Supply allocation successfully submitted to suppliers.');
        setSuccessModalVisible(true);
      } else {
        Alert.alert('Submission Failed', 'Could not record fulfillment confirmation on backend.');
      }
    } catch (e: any) {
      setConfirming(false);
      Alert.alert('Submission Error', e?.message || 'Network error while confirming allocation.');
    }
  };

  const getStatusBadge = () => {
    if (isConfirmed && isFullyFulfilled) {
      return {
        bg: '#DCFCE7',
        color: '#15803D',
        text: 'Fulfilment Confirmed (100%)',
        icon: CheckCircle2,
      };
    }
    if (isConfirmed && isPartiallyFulfilled) {
      return {
        bg: '#FEF3C7',
        color: '#B45309',
        text: 'Awaiting Supplier Confirmation',
        icon: Clock,
      };
    }
    if (isPartiallyFulfilled) {
      return {
        bg: '#FEF3C7',
        color: '#B45309',
        text: 'Partially Fulfilled Plan',
        icon: AlertCircle,
      };
    }
    if (isFullyFulfilled) {
      return {
        bg: '#DCFCE7',
        color: '#15803D',
        text: 'Fully Allocated (100%)',
        icon: Sparkles,
      };
    }
    return {
      bg: '#F1F5F9',
      color: '#475569',
      text: 'Draft Proposed Plan',
      icon: Info,
    };
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.backIconButton}
            onPress={() => router.back()}
            accessibilityLabel="Back"
          >
            <ArrowLeft size={22} color={MKColors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Fulfilment Summary</Text>
            <Text style={styles.headerSubtitle}>
              Requirement #{id?.slice(0, 10)} • Procurement Schedule
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.adjustAllocationBtn}
          onPress={() => router.push(`/matching/aggregation?id=${id}` as any)}
        >
          <SlidersHorizontal size={14} color={MKColors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.adjustAllocationBtnText}>Adjust</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
              <StatusIcon size={14} color={statusBadge.color} style={{ marginRight: 4 }} />
              <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                {statusBadge.text}
              </Text>
            </View>
            <Text style={styles.timestampText}>
              Updated {new Date(plan.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <Text style={styles.statusCardTitle}>
            {isConfirmed
              ? 'Active Bilateral Procurement Agreement'
              : 'Proposed Supplier Allocation Schedule'}
          </Text>
          <Text style={styles.statusCardSub}>
            {isConfirmed
              ? 'Binding allocation orders have been submitted to suppliers through MandiKart safe escrow.'
              : 'Review your multi-supplier volume distribution and landed financials before confirming.'}
          </Text>

          {/* Quick Metrics Strip */}
          <View style={styles.metricsStrip}>
            <View style={styles.metricCol}>
              <Text style={styles.metricVal}>
                {plan.totalAllocatedQuantity}/{plan.targetQuantity} {unit}
              </Text>
              <Text style={styles.metricLbl}>Allocated Volume</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricVal}>₹{plan.blendedPricePerUnit}</Text>
              <Text style={styles.metricLbl}>Blended Farmgate / {unit}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricVal}>
                {plan.allocations.length}
              </Text>
              <Text style={styles.metricLbl}>Suppliers Pooled</Text>
            </View>
          </View>
        </View>

        {/* Partial Fulfillment Alert (if outstanding exists) */}
        {isPartiallyFulfilled && (
          <View style={styles.outstandingCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <AlertTriangle size={16} color="#B45309" style={{ marginRight: 6 }} />
              <Text style={styles.outstandingTitle}>Partial Fulfilment Notice</Text>
            </View>
            <Text style={styles.outstandingDesc}>
              <Text style={{ fontWeight: '700' }}>{plan.outstandingQuantity} {unit}</Text> remains unallocated.
              Estimated remaining budget required is ₹{plan.estimatedRemainingCost?.toLocaleString('en-IN')}.
            </Text>
            <Pressable
              style={styles.fillRemainingBtn}
              onPress={() => router.push(`/matching/aggregation?id=${id}` as any)}
            >
              <Text style={styles.fillRemainingBtnText}>Allocate Remaining Volume</Text>
              <ChevronRight size={14} color="#B45309" />
            </Pressable>
          </View>
        )}

        {/* Original Requirement Summary */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Procurement Baseline</Text>

          <View style={styles.baselineRow}>
            <View style={styles.baselineCol}>
              <Text style={styles.baselineLabel}>Produce & Grade</Text>
              <Text style={styles.baselineValue}>
                {primaryProduct?.productName || 'Red Onion'} • {primaryProduct?.grade || 'Grade A'}
              </Text>
            </View>
            <View style={styles.baselineCol}>
              <Text style={styles.baselineLabel}>Target Volume</Text>
              <Text style={styles.baselineValue}>
                {targetQuantity} {unit}
              </Text>
            </View>
          </View>

          <View style={[styles.baselineRow, { marginTop: 10 }]}>
            <View style={styles.baselineCol}>
              <Text style={styles.baselineLabel}>Target Price Ceiling</Text>
              <Text style={styles.baselineValue}>₹{targetPrice}/{unit}</Text>
            </View>
            <View style={styles.baselineCol}>
              <Text style={styles.baselineLabel}>Required Delivery Date</Text>
              <Text style={styles.baselineValue}>
                {requirement?.delivery?.deliveryDate || 'Within 5 days'}
              </Text>
            </View>
          </View>

          <View style={styles.depotStrip}>
            <MapPin size={13} color="#0D9488" style={{ marginRight: 4 }} />
            <Text style={styles.depotText}>
              Destination: {requirement?.delivery?.destinationName || 'Nashik Central Depot'} (
              {requirement?.delivery?.address || 'Market Yard Terminal'})
            </Text>
          </View>
        </View>

        {/* Allocated Suppliers Breakdown */}
        <Text style={styles.sectionHeaderTitle}>
          Allocated Suppliers ({plan.allocations.length})
        </Text>

        <View style={styles.allocationsContainer}>
          {plan.allocations.length === 0 ? (
            <View style={styles.emptyAllocCard}>
              <Info size={32} color="#94A3B8" />
              <Text style={styles.emptyAllocTitle}>No Suppliers Allocated Yet</Text>
              <Text style={styles.emptyAllocSub}>
                Visit the Supply Aggregation screen to allocate volume among matched suppliers.
              </Text>
              <Pressable
                style={styles.allocateNowBtn}
                onPress={() => router.push(`/matching/aggregation?id=${id}` as any)}
              >
                <Text style={styles.allocateNowBtnText}>Configure Allocations</Text>
              </Pressable>
            </View>
          ) : (
            plan.allocations.map((item, idx) => (
              <View key={item.supplierId} style={styles.allocItemCard}>
                <View style={styles.allocHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.allocBadgeRow}>
                      <Text style={styles.allocTypeTag}>{item.supplierType.replace('_', ' ')}</Text>
                      {item.isVerified && (
                        <View style={styles.allocVerifiedTag}>
                          <ShieldCheck size={10} color="#15803D" style={{ marginRight: 2 }} />
                          <Text style={styles.allocVerifiedText}>Verified</Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.statusSmallTag,
                          item.status === 'CONFIRMED'
                            ? styles.statusSmallTagConfirmed
                            : styles.statusSmallTagProposed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusSmallText,
                            item.status === 'CONFIRMED' && { color: '#15803D' },
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.allocSupName}>{item.supplierName}</Text>
                    <Text style={styles.allocSupMeta}>
                      <MapPin size={11} color="#64748B" /> {item.distanceKm} km transit • Dispatch turnaround: {item.dispatchLeadDays} day(s)
                    </Text>
                  </View>

                  <View style={styles.allocVolumePill}>
                    <Text style={styles.allocVolumeVal}>
                      {item.allocatedQuantity} {item.unit}
                    </Text>
                    <Text style={styles.allocVolumeSub}>Allocated</Text>
                  </View>
                </View>

                {/* Subtotal Financial Strip */}
                <View style={styles.allocFinancialStrip}>
                  <View style={styles.finCol}>
                    <Text style={styles.finLbl}>Asking Rate</Text>
                    <Text style={styles.finVal}>₹{item.askingPricePerUnit}/{item.unit}</Text>
                  </View>
                  <View style={styles.finDivider} />
                  <View style={styles.finCol}>
                    <Text style={styles.finLbl}>Produce Cost</Text>
                    <Text style={styles.finVal}>₹{item.totalProduceCost.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.finDivider} />
                  <View style={styles.finCol}>
                    <Text style={styles.finLbl}>Landed Subtotal</Text>
                    <Text style={[styles.finVal, { color: '#6B21A8' }]}>
                      ₹{item.totalLandedCost.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {item.confirmationRef && (
                  <View style={styles.confRefRow}>
                    <FileCheck size={13} color="#15803D" style={{ marginRight: 4 }} />
                    <Text style={styles.confRefText}>
                      PO Ref: <Text style={{ fontWeight: '700' }}>{item.confirmationRef}</Text>
                    </Text>
                  </View>
                )}

                {/* Action Buttons for this Supplier */}
                <View style={styles.allocCardActions}>
                  <Pressable
                    style={styles.allocSubActionBtn}
                    onPress={() =>
                      router.push(
                        `/matching/details?id=${id}&supplierId=${item.supplierId}` as any
                      )
                    }
                  >
                    <Text style={styles.allocSubActionText}>Profile & Specs</Text>
                    <ExternalLink size={12} color="#0284C7" />
                  </Pressable>

                  <Pressable
                    style={styles.allocSubActionBtn}
                    onPress={() => router.push('/sell/chat' as any)}
                  >
                    <MessageSquare size={12} color="#15803D" style={{ marginRight: 4 }} />
                    <Text style={[styles.allocSubActionText, { color: '#15803D' }]}>
                      Message / Negotiate
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Consolidated Financial Breakdown Card */}
        <View style={styles.financialCard}>
          <Text style={styles.finCardTitle}>Consolidated Landed Financials</Text>
          <Text style={styles.finCardSubtitle}>
            Aggregated cost for {plan.totalAllocatedQuantity} {unit} delivered
          </Text>

          <View style={styles.costRowsList}>
            <View style={styles.costRow}>
              <Text style={styles.costKey}>Produce Subtotal</Text>
              <Text style={styles.costVal}>₹{plan.totalProduceCost.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costKey}>Consolidated Transport Freight</Text>
              <Text style={styles.costVal}>₹{plan.totalFreightCost.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costKey}>APMC Statutory Market Cess (1%)</Text>
              <Text style={styles.costVal}>₹{plan.totalMandiCessCost.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costKey}>Loading, Weighment & Handling</Text>
              <Text style={styles.costVal}>₹{plan.totalHandlingCost.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.costDivider} />

            <View style={styles.costTotalRow}>
              <View>
                <Text style={styles.costTotalLabel}>Grand Total Landed Cost</Text>
                <Text style={styles.costTotalSub}>
                  Effective landed: ₹
                  {plan.totalAllocatedQuantity > 0
                    ? Math.round(plan.grandTotalLandedCost / plan.totalAllocatedQuantity)
                    : 0}
                  /{unit}
                </Text>
              </View>
              <Text style={styles.costTotalAmount}>
                ₹{plan.grandTotalLandedCost.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={styles.btnSecondary}
          onPress={() => router.push(`/matching/aggregation?id=${id}` as any)}
        >
          <SlidersHorizontal size={16} color="#1E293B" />
          <Text style={styles.btnSecondaryText}>Adjust Allocation</Text>
        </Pressable>

        {!isConfirmed ? (
          <Pressable
            style={[
              styles.btnPrimary,
              (plan.totalAllocatedQuantity === 0 || confirming) && styles.btnPrimaryDisabled,
            ]}
            onPress={handleConfirmSubmission}
            disabled={plan.totalAllocatedQuantity === 0 || confirming}
          >
            {confirming ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.btnPrimaryText}>Confirm & Commit Allocation</Text>
              </>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={[styles.btnPrimary, { backgroundColor: '#15803D' }]}
            onPress={() => router.push('/requirements' as any)}
          >
            <CheckCircle2 size={16} color="#FFFFFF" />
            <Text style={styles.btnPrimaryText}>View In Requirements Hub</Text>
          </Pressable>
        )}
      </View>

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <CheckCircle2 size={42} color="#15803D" />
            </View>
            <Text style={styles.modalTitle}>Fulfilment Plan Confirmed</Text>
            <Text style={styles.modalDesc}>{confirmationMessage}</Text>
            <Text style={styles.modalMeta}>
              Total Volume: <Text style={{ fontWeight: '700' }}>{plan.totalAllocatedQuantity} {unit}</Text> across {plan.allocations.length} supplier(s).
            </Text>

            <Pressable
              style={styles.modalDoneBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                router.push('/requirements' as any);
              }}
            >
              <Text style={styles.modalDoneBtnText}>Go to Requirements Hub</Text>
            </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  adjustAllocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  adjustAllocationBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primary,
  },
  scrollContent: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  timestampText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },
  metricsStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 12,
    justifyContent: 'space-around',
  },
  metricCol: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLbl: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  outstandingCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  outstandingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  outstandingDesc: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  fillRemainingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  fillRemainingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginRight: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  baselineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  baselineCol: {
    flex: 1,
  },
  baselineLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  baselineValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  depotStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    padding: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  depotText: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
    flex: 1,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  allocationsContainer: {
    gap: 12,
    marginBottom: 14,
  },
  allocItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  allocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  allocBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  allocTypeTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  allocVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  allocVerifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  statusSmallTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  statusSmallTagConfirmed: {
    backgroundColor: '#DCFCE7',
  },
  statusSmallTagProposed: {
    backgroundColor: '#FEF3C7',
  },
  statusSmallText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  allocSupName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  allocSupMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  allocVolumePill: {
    alignItems: 'flex-end',
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  allocVolumeVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B21A8',
  },
  allocVolumeSub: {
    fontSize: 9,
    color: '#7E22CE',
  },
  allocFinancialStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  finCol: {
    alignItems: 'center',
  },
  finLbl: {
    fontSize: 9,
    color: '#64748B',
  },
  finVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  finDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  confRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 6,
    borderRadius: 6,
    marginBottom: 10,
  },
  confRefText: {
    fontSize: 11,
    color: '#15803D',
  },
  allocCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  allocSubActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  allocSubActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  emptyAllocCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyAllocTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
  },
  emptyAllocSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  allocateNowBtn: {
    backgroundColor: MKColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  allocateNowBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  financialCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  finCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#581C87',
  },
  finCardSubtitle: {
    fontSize: 11,
    color: '#7E22CE',
    marginBottom: 12,
  },
  costRowsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costKey: {
    fontSize: 12,
    color: '#475569',
  },
  costVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  costDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  costTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  costTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  costTotalSub: {
    fontSize: 10,
    color: '#64748B',
  },
  costTotalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6B21A8',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  btnPrimaryDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
  },
  modalDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 10,
    marginBottom: 20,
  },
  modalDoneBtn: {
    backgroundColor: MKColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
