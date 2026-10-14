/**
 * MandiKart Farmer App — Match Details Screen (Screen 16)
 *
 * Route: /matching/details?id=...&supplierId=...
 *
 * Provides in-depth profile, transparent scoring breakdown, specification fit,
 * commercial terms, delivery feasibility, and actions to compare or initiate purchase.
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
  Sparkles,
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
  Phone,
  User,
  Building2,
  Calendar,
  Truck,
  Check,
  Scale,
  CreditCard,
  FileText,
  Percent,
  SlidersHorizontal,
  Send,
  X,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useRequirementsStore } from '@/store/requirementsStore';
import {
  useSupplierMatchingStore,
  SupplierMatchItem,
} from '@/store/supplierMatchingStore';

export default function MatchDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, supplierId } = useLocalSearchParams<{ id: string; supplierId: string }>();

  const { getRequirementById } = useRequirementsStore();
  const {
    matchesByRequirementId,
    fetchMatchesForRequirement,
    toggleSupplierComparison,
    selectedSupplierIdsForComparison,
    isLoading,
  } = useSupplierMatchingStore();

  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [orderRefId, setOrderRefId] = useState('');

  const requirement = useMemo(() => {
    if (!id) return undefined;
    return getRequirementById(id);
  }, [id, getRequirementById]);

  useEffect(() => {
    if (id && (!matchesByRequirementId[id] || matchesByRequirementId[id].length === 0)) {
      const p = requirement?.products[0];
      fetchMatchesForRequirement(id, {
        cropName: p?.productName || 'Red Onion',
        totalQuantity: p?.quantity || requirement?.totalQuantity || 100,
        targetPricePerUnit: p?.targetPricePerUnit || 2400,
        unit: p?.unit || requirement?.primaryUnit || 'quintal',
        grade: p?.grade || 'Grade A',
      });
    }
  }, [id, requirement, matchesByRequirementId, fetchMatchesForRequirement]);

  const matchItem: SupplierMatchItem | undefined = useMemo(() => {
    if (!id || !supplierId) return undefined;
    const list = matchesByRequirementId[id] || [];
    return list.find((m) => m.supplier.id === supplierId);
  }, [id, supplierId, matchesByRequirementId]);

  const isCompared = selectedSupplierIdsForComparison.includes(supplierId || '');

  const handleToggleCompare = () => {
    if (!supplierId) return;
    const added = toggleSupplierComparison(supplierId);
    if (!added && !isCompared) {
      Alert.alert(
        'Comparison Limit Reached',
        'You can compare a maximum of 3 suppliers simultaneously. Remove one before adding another.',
        [
          { text: 'Go to Comparison', onPress: () => router.push(`/matching/compare?id=${id}` as any) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleInitiatePurchase = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setOrderRefId(`PO-MK-${new Date().getFullYear()}-${randomNum}`);
    setPurchaseModalVisible(true);
  };

  const confirmPurchaseOrder = () => {
    setPurchaseSuccess(true);
  };

  if (isLoading && !matchItem) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={MKColors.primary} />
        <Text style={styles.loadingText}>Loading supplier profile and match verification...</Text>
      </View>
    );
  }

  if (!matchItem) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <AlertCircle size={48} color="#DC2626" />
        <Text style={styles.errorTitle}>Supplier Profile Not Found</Text>
        <Text style={styles.errorSubtitle}>
          The requested supplier match for requirement #{id} is unavailable or was unlisted.
        </Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color="#FFFFFF" />
          <Text style={styles.backBtnText}>Return to Matches</Text>
        </Pressable>
      </View>
    );
  }

  const { supplier, deliveredCost, commercialTerms } = matchItem;
  const isPriceBelow = matchItem.priceDiffPerUnit < 0;
  const isPriceEqual = matchItem.priceDiffPerUnit === 0;

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
            <Text style={styles.headerTitle} numberOfLines={1}>
              {supplier.name}
            </Text>
            <Text style={styles.headerSubtitle}>
              Match Details • Requirement #{id?.slice(0, 10)}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.headerCompareBtn, isCompared && styles.headerCompareBtnActive]}
          onPress={handleToggleCompare}
        >
          {isCompared ? (
            <Check size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
          ) : (
            <SlidersHorizontal size={16} color={MKColors.primary} style={{ marginRight: 4 }} />
          )}
          <Text style={[styles.headerCompareText, isCompared && { color: '#FFFFFF' }]}>
            {isCompared ? 'Compared' : '+ Compare'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Supplier Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.supplierIconWrap}>
              <Building2 size={26} color={MKColors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.badgeRow}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {supplier.type.replace('_', ' ')}
                  </Text>
                </View>
                {supplier.isVerified ? (
                  <View style={styles.verifiedBadge}>
                    <ShieldCheck size={12} color="#15803D" style={{ marginRight: 3 }} />
                    <Text style={styles.verifiedBadgeText}>Verified FPO</Text>
                  </View>
                ) : (
                  <View style={styles.unverifiedBadge}>
                    <Text style={styles.unverifiedBadgeText}>Unverified</Text>
                  </View>
                )}
              </View>

              <Text style={styles.supplierNameText}>{supplier.name}</Text>
              <Text style={styles.locationText}>
                <MapPin size={13} color="#64748B" /> {supplier.location} • {supplier.distanceKm} km away
              </Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsBar}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{supplier.reliabilityScorePct}%</Text>
              <Text style={styles.metricLabel}>Reliability</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{supplier.totalCompletedOrders}</Text>
              <Text style={styles.metricLabel}>Completed Tenders</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{supplier.ratingStars} ★</Text>
              <Text style={styles.metricLabel}>Buyer Rating</Text>
            </View>
          </View>

          {/* Registration & Legal Details */}
          <View style={styles.legalInfoBox}>
            <View style={styles.legalRow}>
              <Text style={styles.legalKey}>Govt / NABARD Reg No:</Text>
              <Text style={styles.legalVal}>{supplier.registrationNumber || 'Pending verification'}</Text>
            </View>
            {supplier.contactPerson && (
              <View style={styles.legalRow}>
                <Text style={styles.legalKey}>Authorized Representative:</Text>
                <Text style={styles.legalVal}>{supplier.contactPerson}</Text>
              </View>
            )}
            {supplier.phone && (
              <View style={styles.legalRow}>
                <Text style={styles.legalKey}>Official Phone:</Text>
                <Text style={styles.legalVal}>{supplier.phone}</Text>
              </View>
            )}
            <View style={styles.legalRow}>
              <Text style={styles.legalKey}>Storage Infrastructure:</Text>
              <Text style={styles.legalVal}>{supplier.storageFacility}</Text>
            </View>
          </View>
        </View>

        {/* Transparent Match Score Card */}
        <View style={styles.card}>
          <View style={styles.matchScoreHeader}>
            <View>
              <Text style={styles.cardTitle}>Compatibility Score</Text>
              <Text style={styles.cardSubtitle}>Computed across 5 weighted criteria</Text>
            </View>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>{matchItem.matchScore}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
          </View>

          {/* Recommendation reasons if high score */}
          {matchItem.isRecommended && (
            <View style={styles.recommendationBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Sparkles size={16} color="#15803D" style={{ marginRight: 6 }} />
                <Text style={styles.recommendationTitle}>Why This Supplier is Recommended</Text>
              </View>
              {matchItem.recommendationReasons.map((reason, idx) => (
                <View key={idx} style={styles.reasonBulletRow}>
                  <CheckCircle2 size={13} color="#15803D" style={{ marginTop: 2, marginRight: 6 }} />
                  <Text style={styles.reasonBulletText}>{reason}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Criteria Checklist */}
          <Text style={styles.sectionHeaderTitle}>Verification & Audit Checklist</Text>
          <View style={styles.checklistContainer}>
            <View style={styles.checklistItem}>
              {matchItem.transparencyChecklist.cropGradeMatch ? (
                <CheckCircle2 size={16} color="#15803D" />
              ) : (
                <AlertCircle size={16} color="#DC2626" />
              )}
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.checklistTitle}>Crop & Specification Match</Text>
                <Text style={styles.checklistSub}>
                  {matchItem.cropName} ({matchItem.grade}) matching tender specifications
                </Text>
              </View>
            </View>

            <View style={styles.checklistItem}>
              {matchItem.transparencyChecklist.capacitySufficient ? (
                <CheckCircle2 size={16} color="#15803D" />
              ) : (
                <AlertCircle size={16} color="#D97706" />
              )}
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.checklistTitle}>Fulfillment Capacity</Text>
                <Text style={styles.checklistSub}>
                  {matchItem.availableCapacity} {matchItem.capacityUnit} available ({matchItem.coveragePct}% coverage)
                </Text>
              </View>
            </View>

            <View style={styles.checklistItem}>
              {matchItem.transparencyChecklist.priceWithinCeiling ? (
                <CheckCircle2 size={16} color="#15803D" />
              ) : (
                <AlertCircle size={16} color="#D97706" />
              )}
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.checklistTitle}>Target Price Alignment</Text>
                <Text style={styles.checklistSub}>
                  Asking ₹{matchItem.askingPricePerUnit}/{matchItem.capacityUnit} vs target ceiling ₹{matchItem.targetPricePerUnit}
                </Text>
              </View>
            </View>

            <View style={styles.checklistItem}>
              {matchItem.transparencyChecklist.logisticsViable ? (
                <CheckCircle2 size={16} color="#15803D" />
              ) : (
                <AlertCircle size={16} color="#D97706" />
              )}
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.checklistTitle}>Logistics Feasibility</Text>
                <Text style={styles.checklistSub}>
                  {supplier.distanceKm} km from delivery depot ({matchItem.estimatedDispatchDays} day turnaround)
                </Text>
              </View>
            </View>

            <View style={styles.checklistItem}>
              {matchItem.transparencyChecklist.verifiedFPO ? (
                <CheckCircle2 size={16} color="#15803D" />
              ) : (
                <AlertCircle size={16} color="#64748B" />
              )}
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.checklistTitle}>Institutional FPO Credentials</Text>
                <Text style={styles.checklistSub}>
                  NABARD / APMC registered producer organization with audited records
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Commercial & Contract Terms */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Commercial & Payment Terms</Text>
          <Text style={styles.cardSubtitle}>Binding terms agreed for this procurement match</Text>

          <View style={styles.termsGrid}>
            <View style={styles.termBox}>
              <CreditCard size={18} color="#0D9488" style={{ marginBottom: 4 }} />
              <Text style={styles.termLabel}>Payment Mechanism</Text>
              <Text style={styles.termValue}>{commercialTerms.paymentTerms}</Text>
            </View>

            <View style={styles.termBox}>
              <Percent size={18} color="#2563EB" style={{ marginBottom: 4 }} />
              <Text style={styles.termLabel}>Advance Required</Text>
              <Text style={styles.termValue}>
                {commercialTerms.advanceRequiredPct === 0
                  ? '0% Advance (100% Escrow)'
                  : `${commercialTerms.advanceRequiredPct}% Advance on dispatch`}
              </Text>
            </View>

            <View style={styles.termBox}>
              <Scale size={18} color="#D97706" style={{ marginBottom: 4 }} />
              <Text style={styles.termLabel}>Quality Inspection</Text>
              <Text style={styles.termValue}>
                {commercialTerms.inspectionAt === 'DESTINATION_DEPOT'
                  ? 'At Destination Depot on Arrival'
                  : commercialTerms.inspectionAt === 'WEIGHBRIDGE'
                  ? 'At Authorized Weighbridge'
                  : 'At Seller Farmgate'}
              </Text>
            </View>

            <View style={styles.termBox}>
              <FileText size={18} color="#7C3AED" style={{ marginBottom: 4 }} />
              <Text style={styles.termLabel}>Weighbridge Slip</Text>
              <Text style={styles.termValue}>
                {commercialTerms.weighbridgeSlipProvided
                  ? 'Mandatory Computerized Slip Provided'
                  : 'Manual Receipt'}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivered Landed Cost Summary Card */}
        <View style={[styles.card, styles.deliveredCostCard]}>
          <View style={styles.deliveredHeader}>
            <View>
              <Text style={styles.deliveredTitle}>Delivered Landed Cost</Text>
              <Text style={styles.deliveredSubtitle}>
                Complete cost delivered to destination depot
              </Text>
            </View>
            <View style={styles.landedBadge}>
              <Text style={styles.landedBadgePrice}>
                ₹{deliveredCost.deliveredCostPerUnit}
              </Text>
              <Text style={styles.landedBadgeUnit}>per {deliveredCost.unit}</Text>
            </View>
          </View>

          {/* Quick Line Item Breakdown */}
          <View style={styles.costBreakdownList}>
            <View style={styles.costItemRow}>
              <Text style={styles.costItemName}>
                Produce Base ({matchItem.requirementQuantityRequested} {deliveredCost.unit} @ ₹{matchItem.askingPricePerUnit})
              </Text>
              <Text style={styles.costItemVal}>₹{deliveredCost.productBaseCost.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.costItemRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.costItemName}>Transport Freight ({supplier.distanceKm} km)</Text>
                {deliveredCost.isTransportQuoteConfirmed ? (
                  <View style={styles.confirmedTag}>
                    <Text style={styles.confirmedTagText}>Confirmed</Text>
                  </View>
                ) : (
                  <View style={styles.estimatedTag}>
                    <Text style={styles.estimatedTagText}>3PL Estimate</Text>
                  </View>
                )}
              </View>
              <Text style={styles.costItemVal}>₹{deliveredCost.transportFreightCost.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.costItemRow}>
              <Text style={styles.costItemName}>APMC Statutory Cess (1.0%)</Text>
              <Text style={styles.costItemVal}>₹{deliveredCost.mandiCessCost.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.costItemRow}>
              <Text style={styles.costItemName}>Handling & Weighment</Text>
              <Text style={styles.costItemVal}>₹{deliveredCost.handlingLoadingCost.toLocaleString('en-IN')}</Text>
            </View>

            {deliveredCost.volumeDiscountAmount > 0 && (
              <View style={styles.costItemRow}>
                <Text style={[styles.costItemName, { color: '#15803D' }]}>Volume Bulk Rebate</Text>
                <Text style={[styles.costItemVal, { color: '#15803D' }]}>
                  -₹{deliveredCost.volumeDiscountAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}

            <View style={styles.totalDivider} />

            <View style={styles.costItemRowTotal}>
              <Text style={styles.costTotalText}>Total Landed Investment</Text>
              <Text style={styles.costTotalAmount}>₹{deliveredCost.totalLandedCost.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Missing charges disclaimer banner */}
          {deliveredCost.missingChargesNote && (
            <View style={styles.missingChargesBanner}>
              <Info size={14} color="#B45309" style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.missingChargesText}>{deliveredCost.missingChargesNote}</Text>
            </View>
          )}

          <Pressable
            style={styles.fullCostSheetBtn}
            onPress={() => router.push(`/matching/delivered-cost?id=${id}` as any)}
          >
            <Text style={styles.fullCostSheetBtnText}>Open Full Delivered-Cost Comparison</Text>
            <ChevronRight size={16} color={MKColors.primary} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={[styles.btnSecondary, isCompared && styles.btnSecondaryActive]}
          onPress={handleToggleCompare}
        >
          {isCompared ? <Check size={18} color="#FFFFFF" /> : <SlidersHorizontal size={18} color={MKColors.textPrimary} />}
          <Text style={[styles.btnSecondaryText, isCompared && { color: '#FFFFFF' }]}>
            {isCompared ? 'In Comparison' : 'Add to Compare'}
          </Text>
        </Pressable>

        <Pressable style={styles.btnPrimary} onPress={handleInitiatePurchase}>
          <Send size={18} color="#FFFFFF" />
          <Text style={styles.btnPrimaryText}>Initiate Purchase Order</Text>
        </Pressable>
      </View>

      {/* Purchase Confirmation Modal */}
      <Modal
        visible={purchaseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPurchaseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!purchaseSuccess ? (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Initiate Purchase Order</Text>
                    <Text style={styles.modalSubtitle}>Requirement #{id?.slice(0, 10)}</Text>
                  </View>
                  <Pressable onPress={() => setPurchaseModalVisible(false)}>
                    <X size={20} color="#64748B" />
                  </Pressable>
                </View>

                <View style={styles.modalSupplierSummary}>
                  <Text style={styles.modalSupplierName}>{supplier.name}</Text>
                  <Text style={styles.modalSupplierMeta}>
                    {matchItem.cropName} • {matchItem.requirementQuantityRequested} {matchItem.capacityUnit} • ₹{matchItem.askingPricePerUnit}/{matchItem.capacityUnit}
                  </Text>
                </View>

                <View style={styles.modalDetailsBox}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalKey}>Total Landed Value:</Text>
                    <Text style={styles.modalValBold}>₹{deliveredCost.totalLandedCost.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalKey}>Estimated Dispatch:</Text>
                    <Text style={styles.modalVal}>{matchItem.estimatedDispatchDays} business day(s)</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalKey}>Settlement Escrow:</Text>
                    <Text style={styles.modalVal}>MandiKart Safe Escrow T+1</Text>
                  </View>
                </View>

                <Text style={styles.modalDisclaimer}>
                  Submitting this initiates a binding bilateral procurement contract under MandiKart fair trade protocols.
                </Text>

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.modalBtnCancel}
                    onPress={() => setPurchaseModalVisible(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.modalBtnConfirm} onPress={confirmPurchaseOrder}>
                    <Text style={styles.modalBtnConfirmText}>Confirm & Dispatch Request</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.successContent}>
                <View style={styles.successIconWrap}>
                  <CheckCircle2 size={42} color="#15803D" />
                </View>
                <Text style={styles.successTitle}>Purchase Request Initiated</Text>
                <Text style={styles.successSubtitle}>
                  Order Reference: <Text style={{ fontWeight: '700', color: MKColors.primary }}>{orderRefId}</Text>
                </Text>
                <Text style={styles.successDesc}>
                  {supplier.name} has been notified with your delivery depot address and weighbridge specifications.
                </Text>

                <Pressable
                  style={styles.successDoneBtn}
                  onPress={() => {
                    setPurchaseModalVisible(false);
                    setPurchaseSuccess(false);
                    router.push(`/matching/matches?id=${id}` as any);
                  }}
                >
                  <Text style={styles.successDoneBtnText}>Return to Matches</Text>
                </Pressable>
              </View>
            )}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MKColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
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
  headerCompareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  headerCompareBtnActive: {
    backgroundColor: MKColors.primary,
    borderColor: MKColors.primary,
  },
  headerCompareText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primary,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  supplierIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  unverifiedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unverifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  supplierNameText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 14,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  legalInfoBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legalKey: {
    fontSize: 12,
    color: '#64748B',
  },
  legalVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    maxWidth: '55%',
    textAlign: 'right',
  },
  matchScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15803D',
  },
  scoreMax: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  recommendationBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  recommendationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  reasonBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  reasonBulletText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
    marginBottom: 8,
  },
  checklistContainer: {
    gap: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  checklistSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  termsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  termBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  termLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  termValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  deliveredCostCard: {
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
  },
  deliveredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#581C87',
  },
  deliveredSubtitle: {
    fontSize: 12,
    color: '#7E22CE',
  },
  landedBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  landedBadgePrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#6B21A8',
  },
  landedBadgeUnit: {
    fontSize: 10,
    color: '#7E22CE',
  },
  costBreakdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 8,
  },
  costItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costItemName: {
    fontSize: 12,
    color: '#475569',
  },
  costItemVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  confirmedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  confirmedTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  estimatedTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  estimatedTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  costItemRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  costTotalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  costTotalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6B21A8',
  },
  missingChargesBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  missingChargesText: {
    fontSize: 11,
    color: '#B45309',
    flex: 1,
  },
  fullCostSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  fullCostSheetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.primary,
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
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  btnSecondaryActive: {
    backgroundColor: '#059669',
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
    gap: 8,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  modalSupplierSummary: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalSupplierName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalSupplierMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalDetailsBox: {
    gap: 8,
    marginBottom: 14,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalKey: {
    fontSize: 13,
    color: '#64748B',
  },
  modalVal: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  modalValBold: {
    fontSize: 15,
    color: MKColors.primary,
    fontWeight: '800',
  },
  modalDisclaimer: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalBtnCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalBtnConfirm: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: MKColors.primary,
    alignItems: 'center',
  },
  modalBtnConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
  successDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  successDoneBtn: {
    backgroundColor: MKColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  successDoneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
