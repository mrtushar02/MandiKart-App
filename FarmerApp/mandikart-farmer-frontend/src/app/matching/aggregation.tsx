/**
 * MandiKart Farmer App — Supply Aggregation Screen (Screen 19)
 *
 * Route: /matching/aggregation?id=...
 *
 * Enables farmers to pool supply from single or multiple suppliers to satisfy
 * large bulk procurement orders. Features real-time capacity and ceiling
 * validation, unit consistency, blended landed cost calculation, preset auto-fillers,
 * and clear distinction of proposed allocations vs confirmed commitments.
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  MapPin,
  Clock,
  Package,
  IndianRupee,
  ChevronRight,
  TrendingDown,
  Info,
  Truck,
  Scale,
  Sparkles,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Building2,
  Calculator,
  SlidersHorizontal,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useRequirementsStore } from '@/store/requirementsStore';
import {
  useSupplierMatchingStore,
  SupplierMatchItem,
  SupplierAllocationItem,
} from '@/store/supplierMatchingStore';

export default function SupplyAggregationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getRequirementById } = useRequirementsStore();
  const {
    matchesByRequirementId,
    userAllocationsByReqId,
    setSupplierAllocation,
    autoAllocateGreedyBestValue,
    autoAllocateSingleSupplier,
    resetAllocations,
    getComputedPlan,
    fetchMatchesForRequirement,
    isLoading,
  } = useSupplierMatchingStore();

  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const requirement = useMemo(() => {
    if (!id) return undefined;
    return getRequirementById(id);
  }, [id, getRequirementById]);

  // Load matches if needed
  useEffect(() => {
    if (id) {
      const p = requirement?.products[0];
      fetchMatchesForRequirement(id, {
        cropName: p?.productName || 'Red Onion',
        totalQuantity: p?.quantity || requirement?.totalQuantity || 100,
        targetPricePerUnit: p?.targetPricePerUnit || 2400,
        unit: p?.unit || requirement?.primaryUnit || 'quintal',
        grade: p?.grade || 'Grade A',
      });
    }
  }, [id, requirement, fetchMatchesForRequirement]);

  const primaryProduct = requirement?.products[0];
  const targetQuantity = primaryProduct?.quantity || requirement?.totalQuantity || 100;
  const unit = primaryProduct?.unit || requirement?.primaryUnit || 'quintal';
  const targetPrice = primaryProduct?.targetPricePerUnit || 2400;

  const matches: SupplierMatchItem[] = useMemo(() => {
    if (!id) return [];
    return matchesByRequirementId[id] || [];
  }, [id, matchesByRequirementId]);

  // Current allocations mapping
  const currentAllocations = useMemo(() => {
    if (!id) return {};
    return userAllocationsByReqId[id] || {};
  }, [id, userAllocationsByReqId]);

  // Initialize with auto-fill if empty
  useEffect(() => {
    if (id && matches.length > 0 && Object.keys(currentAllocations).length === 0) {
      autoAllocateGreedyBestValue(id, targetQuantity, unit);
    }
  }, [id, matches, currentAllocations, targetQuantity, unit, autoAllocateGreedyBestValue]);

  // Computed plan
  const plan = useMemo(() => {
    if (!id) return undefined;
    return getComputedPlan(id, targetQuantity, unit, targetPrice);
  }, [id, targetQuantity, unit, targetPrice, currentAllocations, getComputedPlan]);

  const totalAllocated = plan?.totalAllocatedQuantity || 0;
  const outstandingQty = plan?.outstandingQuantity || 0;
  const coveragePct = Math.min(100, Math.round((totalAllocated / targetQuantity) * 100));

  const handleAdjustQuantity = (supplierId: string, delta: number) => {
    if (!id) return;
    const currentQty = currentAllocations[supplierId] || 0;
    const newQty = Math.max(0, currentQty + delta);
    const res = setSupplierAllocation(id, supplierId, newQty, targetQuantity);
    if (!res.success && res.error) {
      setValidationWarning(res.error);
      setTimeout(() => setValidationWarning(null), 4000);
    } else {
      setValidationWarning(null);
    }
  };

  const handleManualInput = (supplierId: string, text: string) => {
    if (!id) return;
    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
    const res = setSupplierAllocation(id, supplierId, parsed, targetQuantity);
    if (!res.success && res.error) {
      setValidationWarning(res.error);
      setTimeout(() => setValidationWarning(null), 4000);
    } else {
      setValidationWarning(null);
    }
  };

  if (isLoading && matches.length === 0) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={MKColors.primary} />
        <Text style={styles.loadingText}>Evaluating multi-supplier aggregate capacity...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
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
            <Text style={styles.headerTitle}>Supply Aggregation</Text>
            <Text style={styles.headerSubtitle}>
              Requirement #{id?.slice(0, 10)} • Multi-Supplier Allocation
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.resetBtn}
          onPress={() => {
            if (id) resetAllocations(id);
          }}
        >
          <RotateCcw size={14} color="#64748B" style={{ marginRight: 4 }} />
          <Text style={styles.resetBtnText}>Reset</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Requirement Baseline Strip */}
        <View style={styles.requirementStrip}>
          <View style={styles.reqCol}>
            <Text style={styles.reqLabel}>TARGET DEMAND</Text>
            <Text style={styles.reqVal}>
              {targetQuantity} {unit}
            </Text>
            <Text style={styles.reqSub}>
              {primaryProduct?.productName || 'Red Onion'} ({primaryProduct?.grade || 'Grade A'})
            </Text>
          </View>
          <View style={styles.reqDivider} />
          <View style={styles.reqCol}>
            <Text style={styles.reqLabel}>TARGET CEILING</Text>
            <Text style={styles.reqVal}>
              ₹{targetPrice}/{unit}
            </Text>
            <Text style={styles.reqSub}>Max unit budget</Text>
          </View>
          <View style={styles.reqDivider} />
          <View style={styles.reqCol}>
            <Text style={styles.reqLabel}>DEPOT DESTINATION</Text>
            <Text style={styles.reqVal} numberOfLines={1}>
              {requirement?.delivery?.destinationName || 'Nashik Depot'}
            </Text>
            <Text style={styles.reqSub}>{requirement?.delivery?.city || 'Nashik'}</Text>
          </View>
        </View>

        {/* Dynamic Aggregation Progress Bar Card */}
        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.cardTitle}>Fulfillment Progress</Text>
              <Text style={styles.cardSubtitle}>
                {totalAllocated} of {targetQuantity} {unit} allocated across{' '}
                {plan?.allocations.length || 0} supplier(s)
              </Text>
            </View>
            <View
              style={[
                styles.fulfillmentPill,
                coveragePct >= 100 ? styles.pillFull : styles.pillPartial,
              ]}
            >
              <Text
                style={[
                  styles.fulfillmentPillText,
                  coveragePct >= 100 && { color: '#15803D' },
                ]}
              >
                {coveragePct}% {coveragePct >= 100 ? 'Fulfilled' : 'Partial'}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${coveragePct}%` },
                coveragePct >= 100 && { backgroundColor: '#15803D' },
              ]}
            />
          </View>

          {/* Allocation Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>
                {totalAllocated} {unit}
              </Text>
              <Text style={styles.metricLbl}>Total Allocated</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text
                style={[
                  styles.metricVal,
                  outstandingQty > 0 ? { color: '#D97706' } : { color: '#15803D' },
                ]}
              >
                {outstandingQty} {unit}
              </Text>
              <Text style={styles.metricLbl}>Outstanding</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>₹{plan?.blendedPricePerUnit || 0}</Text>
              <Text style={styles.metricLbl}>Blended Avg / {unit}</Text>
            </View>
          </View>

          {/* Preset Strategy Buttons */}
          <View style={styles.presetsRow}>
            <Pressable
              style={styles.presetBtn}
              onPress={() => {
                if (id) autoAllocateGreedyBestValue(id, targetQuantity, unit);
              }}
            >
              <Sparkles size={14} color="#15803D" style={{ marginRight: 4 }} />
              <Text style={styles.presetBtnText}>Best Value Auto-Fill</Text>
            </Pressable>

            <Pressable
              style={styles.presetBtn}
              onPress={() => {
                if (id) autoAllocateSingleSupplier(id, targetQuantity, unit);
              }}
            >
              <Building2 size={14} color="#0284C7" style={{ marginRight: 4 }} />
              <Text style={[styles.presetBtnText, { color: '#0284C7' }]}>
                Single Supplier Full-Fill
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Validation Warning Alert (if any) */}
        {validationWarning && (
          <View style={styles.warningBox}>
            <AlertTriangle size={16} color="#DC2626" style={{ marginRight: 6, marginTop: 2 }} />
            <Text style={styles.warningText}>{validationWarning}</Text>
          </View>
        )}

        {/* Notice of Proposal vs Purchase Commitment */}
        <View style={styles.noticeBanner}>
          <Info size={14} color="#0D9488" style={{ marginRight: 6, marginTop: 2 }} />
          <Text style={styles.noticeText}>
            <Text style={{ fontWeight: '700' }}>Proposed Allocation:</Text> Adjusting quantities here simulates
            your procurement distribution. No payment, contract, or binding delivery commitment is created
            until you confirm on the Fulfilment Summary screen.
          </Text>
        </View>

        {/* Eligible Suppliers Allocation List */}
        <Text style={styles.sectionHeaderTitle}>Eligible Supplier Pools</Text>

        <View style={styles.suppliersList}>
          {matches.map((item) => {
            const sup = item.supplier;
            const allocated = currentAllocations[sup.id] || 0;
            const maxCapacity = item.availableCapacity;
            const isFullyAllocated = allocated >= maxCapacity;
            const isZero = allocated === 0;

            const produceCost = Math.round(allocated * item.askingPricePerUnit);
            const landedCostPerUnit = item.deliveredCost.deliveredCostPerUnit;

            return (
              <View
                key={sup.id}
                style={[
                  styles.supplierCard,
                  allocated > 0 && styles.supplierCardActive,
                ]}
              >
                {/* Supplier Header */}
                <View style={styles.supCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.supBadgeRow}>
                      <Text style={styles.supTypeTag}>{sup.type.replace('_', ' ')}</Text>
                      {sup.isVerified && (
                        <View style={styles.supVerifiedTag}>
                          <ShieldCheck size={10} color="#15803D" style={{ marginRight: 2 }} />
                          <Text style={styles.supVerifiedText}>Verified</Text>
                        </View>
                      )}
                      <Text style={styles.matchScoreTag}>{item.matchScore}% Fit</Text>
                    </View>
                    <Text style={styles.supNameText}>{sup.name}</Text>
                    <Text style={styles.supLocationText}>
                      <MapPin size={11} color="#64748B" /> {sup.location} • {sup.distanceKm} km away
                    </Text>
                  </View>

                  <View style={styles.pricePill}>
                    <Text style={styles.pricePillPrice}>₹{item.askingPricePerUnit}</Text>
                    <Text style={styles.pricePillUnit}>per {item.capacityUnit}</Text>
                  </View>
                </View>

                {/* Capacity & Constraints Strip */}
                <View style={styles.constraintsStrip}>
                  <View style={styles.constraintCol}>
                    <Text style={styles.constraintLbl}>Available Capacity</Text>
                    <Text style={styles.constraintVal}>
                      {maxCapacity} {item.capacityUnit}
                    </Text>
                  </View>
                  <View style={styles.constraintDivider} />
                  <View style={styles.constraintCol}>
                    <Text style={styles.constraintLbl}>MOQ</Text>
                    <Text style={styles.constraintVal}>10 {item.capacityUnit}</Text>
                  </View>
                  <View style={styles.constraintDivider} />
                  <View style={styles.constraintCol}>
                    <Text style={styles.constraintLbl}>Turnaround</Text>
                    <Text style={styles.constraintVal}>
                      {item.estimatedDispatchDays} day(s) dispatch
                    </Text>
                  </View>
                </View>

                {/* Allocation Adjuster Bar */}
                <View style={styles.allocationRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.allocRowLabel}>Allocated Quantity</Text>
                    <Text style={styles.allocRowSub}>
                      {allocated > 0
                        ? `Est Produce: ₹${produceCost.toLocaleString('en-IN')}`
                        : 'No volume allocated'}
                    </Text>
                  </View>

                  <View style={styles.stepperContainer}>
                    <Pressable
                      style={[styles.stepperBtn, isZero && styles.stepperBtnDisabled]}
                      onPress={() => handleAdjustQuantity(sup.id, -10)}
                      disabled={isZero}
                    >
                      <Minus size={16} color={isZero ? '#CBD5E1' : '#1E293B'} />
                    </Pressable>

                    <TextInput
                      style={styles.stepperInput}
                      keyboardType="numeric"
                      value={String(allocated)}
                      onChangeText={(text) => handleManualInput(sup.id, text)}
                    />

                    <Pressable
                      style={[
                        styles.stepperBtn,
                        (isFullyAllocated || totalAllocated >= targetQuantity) &&
                          styles.stepperBtnDisabled,
                      ]}
                      onPress={() => handleAdjustQuantity(sup.id, 10)}
                      disabled={isFullyAllocated || totalAllocated >= targetQuantity}
                    >
                      <Plus
                        size={16}
                        color={
                          isFullyAllocated || totalAllocated >= targetQuantity
                            ? '#CBD5E1'
                            : '#1E293B'
                        }
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomInfoCol}>
          <Text style={styles.bottomLandedTotal}>
            ₹{plan?.grandTotalLandedCost.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.bottomLandedSub}>
            Landed total • {totalAllocated}/{targetQuantity} {unit}
          </Text>
        </View>

        <Pressable
          style={[
            styles.btnPrimary,
            totalAllocated === 0 && styles.btnPrimaryDisabled,
          ]}
          onPress={() => {
            if (totalAllocated === 0) {
              Alert.alert(
                'Allocation Required',
                'Please allocate at least one supplier volume before proceeding to the Fulfilment Summary.'
              );
              return;
            }
            router.push(`/matching/fulfillment?id=${id}` as any);
          }}
        >
          <Text style={styles.btnPrimaryText}>Review Fulfilment Plan</Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </Pressable>
      </View>
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
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
  },
  requirementStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  reqCol: {
    flex: 1,
  },
  reqLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  reqVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  reqSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  reqDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  fulfillmentPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillFull: {
    backgroundColor: '#DCFCE7',
  },
  pillPartial: {
    backgroundColor: '#FEF3C7',
  },
  fulfillmentPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: MKColors.primary,
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 15,
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
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  warningText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
    lineHeight: 16,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 11,
    color: '#0F766E',
    flex: 1,
    lineHeight: 16,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  suppliersList: {
    gap: 12,
  },
  supplierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  supplierCardActive: {
    borderColor: MKColors.primary,
    borderWidth: 1.5,
  },
  supCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  supBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  supTypeTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  supVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  supVerifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  matchScoreTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  supNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  supLocationText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pricePill: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pricePillPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  pricePillUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  constraintsStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  constraintCol: {
    flex: 1,
    alignItems: 'center',
  },
  constraintLbl: {
    fontSize: 9,
    color: '#64748B',
  },
  constraintVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  constraintDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  allocRowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  allocRowSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: '#F8FAFC',
  },
  stepperInput: {
    width: 50,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 2,
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
    alignItems: 'center',
    gap: 12,
  },
  bottomInfoCol: {
    flex: 1,
  },
  bottomLandedTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6B21A8',
  },
  bottomLandedSub: {
    fontSize: 11,
    color: '#64748B',
  },
  btnPrimary: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
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
});
