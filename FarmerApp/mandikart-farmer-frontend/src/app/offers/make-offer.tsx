/**
 * MandiKart Farmer App — Make an Offer Screen (Screen 24)
 *
 * Route: /offers/make-offer?id=...&supplierId=...
 *
 * Allows a farmer to structure and submit a binding purchase offer to an eligible
 * supplier for a specific requirement. Features live landed cost calculation,
 * comprehensive validation, confirmation modal, and duplicate prevention.
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
  Package,
  IndianRupee,
  Building2,
  Calendar,
  Truck,
  CreditCard,
  Percent,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Send,
  Save,
  Check,
  Scale,
  Clock,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useOffersStore } from '@/store/offersStore';
import { useRequirementsStore } from '@/store/requirementsStore';
import { useSupplierMatchingStore } from '@/store/supplierMatchingStore';

export default function MakeAnOfferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    requirementId?: string;
    supplierId?: string;
  }>();

  const reqIdParam = params.id || params.requirementId || '';
  const supplierIdParam = params.supplierId || '';

  const { createOffer } = useOffersStore();
  const { requirements } = useRequirementsStore();
  const { matchesByRequirementId } = useSupplierMatchingStore();

  // State: Selected Requirement & Supplier
  const [selectedReqId, setSelectedReqId] = useState<string>(reqIdParam);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(supplierIdParam);

  interface NormalizedReq {
    id: string;
    title: string;
    commodity: string;
    variety: string;
    grade: string;
    targetQuantity: number;
    unit: string;
    targetPricePerUnit: number;
    deliveryLocation: string;
  }

  // Available Requirements (filter to open/published ones, or fallback to all)
  const availableReqs: NormalizedReq[] = useMemo(() => {
    if (requirements && requirements.length > 0) {
      return requirements.map((r) => {
        const p = r.products?.[0];
        const targetPrice =
          r.totalQuantity > 0 ? Math.round(r.totalBudget / r.totalQuantity) : 2400;
        return {
          id: r.id,
          title: r.title,
          commodity: p?.productName || 'Produce',
          variety: p?.variety || 'Standard',
          grade: p?.grade || 'Grade A',
          targetQuantity: r.totalQuantity || 25,
          unit: r.primaryUnit || 'quintal',
          targetPricePerUnit: targetPrice,
          deliveryLocation:
            r.delivery?.address ||
            `${r.delivery?.city || 'Pune'}, ${r.delivery?.state || 'Maharashtra'}`,
        };
      });
    }
    return [
      {
        id: 'breq_rel_onion_101',
        title: 'Red Onion Grade A Bulk Sourcing',
        commodity: 'Red Onion',
        variety: 'Nasik Garwa',
        grade: 'Grade A',
        targetQuantity: 25,
        unit: 'quintal',
        targetPricePerUnit: 2400,
        deliveryLocation: 'Pune Wholesale Mandi, Market Yard Depot',
      },
      {
        id: 'breq_itc_wheat_102',
        title: 'Sharbati Wheat Processing Demand',
        commodity: 'Sharbati Wheat',
        variety: 'Sharbati Premium',
        grade: 'Grade A',
        targetQuantity: 50,
        unit: 'quintal',
        targetPricePerUnit: 2850,
        deliveryLocation: 'Indore Central Silo, Bypass Terminal',
      },
      {
        id: 'breq_agro_tomato_103',
        title: 'Tomato Processing Procurement',
        commodity: 'Tomato',
        variety: 'Hybrid Firm Ripe',
        grade: 'Grade A',
        targetQuantity: 30,
        unit: 'quintal',
        targetPricePerUnit: 1850,
        deliveryLocation: 'Nashik Processing Plant, Dindori Road',
      },
    ];
  }, [requirements]);

  // Selected requirement object
  const currentReq: NormalizedReq = useMemo(() => {
    return availableReqs.find((r) => r.id === selectedReqId) || availableReqs[0];
  }, [availableReqs, selectedReqId]);

  interface NormalizedSupplier {
    id: string;
    name: string;
    type: string;
    isVerified: boolean;
    ratingStars: number;
    askingPrice: number;
    location: string;
    distanceKm: number;
  }

  // Available Suppliers
  const availableSuppliers: NormalizedSupplier[] = useMemo(() => {
    const reqMatches = selectedReqId ? matchesByRequirementId[selectedReqId] : [];
    if (reqMatches && reqMatches.length > 0) {
      return reqMatches.map((m: any) => ({
        id: m.supplier.id,
        name: m.supplier.name,
        type: m.supplier.type,
        isVerified: m.supplier.isVerified,
        ratingStars: m.supplier.ratingStars,
        askingPrice: m.askingPricePerUnit,
        location: `${m.supplier.district}, ${m.supplier.state}`,
        distanceKm: m.supplier.distanceKm,
      }));
    }
    return [
      {
        id: 'sup_fpo_pimpalgaon_01',
        name: 'Pimpalgaon Farmer Producer Co. Ltd.',
        type: 'FPO_CLUSTER',
        isVerified: true,
        ratingStars: 4.8,
        askingPrice: 2320,
        location: 'Nashik, Maharashtra',
        distanceKm: 42,
      },
      {
        id: 'sup_fpo_sahyadri_02',
        name: 'Sahyadri Agro Farmers Cluster Hub',
        type: 'COOPERATIVE',
        isVerified: true,
        ratingStars: 4.7,
        askingPrice: 2360,
        location: 'Mohadi, Maharashtra',
        distanceKm: 58,
      },
      {
        id: 'sup_grain_niphad_03',
        name: 'Niphad Taluka Kisan Sangh (Grain Hub)',
        type: 'WHOLESALE_AGGREGATOR',
        isVerified: true,
        ratingStars: 4.5,
        askingPrice: 2800,
        location: 'Niphad, Maharashtra',
        distanceKm: 75,
      },
    ];
  }, [matchesByRequirementId, selectedReqId]);

  // Selected supplier object
  const currentSupplier: NormalizedSupplier = useMemo(() => {
    return (
      availableSuppliers.find((s) => s.id === selectedSupplierId) ||
      availableSuppliers[0]
    );
  }, [availableSuppliers, selectedSupplierId]);

  // Form inputs initialized with requirement & supplier defaults
  const [quantity, setQuantity] = useState<string>(
    currentReq?.targetQuantity ? String(currentReq.targetQuantity) : '25'
  );
  const [unit, setUnit] = useState<'quintal' | 'tonne' | 'kg'>(
    (currentReq?.unit as any) || 'quintal'
  );
  const [unitPrice, setUnitPrice] = useState<string>(
    currentSupplier?.askingPrice
      ? String(currentSupplier.askingPrice)
      : currentReq?.targetPricePerUnit
      ? String(currentReq.targetPricePerUnit)
      : '2350'
  );
  const [deliveryTerms, setDeliveryTerms] = useState<
    'SELLER_DELIVERY' | 'FARM_GATE_PICKUP' | 'MANDIKART_3PL'
  >('SELLER_DELIVERY');
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [deliveryLocation, setDeliveryLocation] = useState<string>(
    currentReq?.deliveryLocation || 'Pune Wholesale Mandi, Market Yard Depot'
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    'Direct Escrow (T+1 on weighbridge slip)'
  );
  const [validityDays, setValidityDays] = useState<number>(2); // 48 hrs default
  const [notes, setNotes] = useState<string>('');

  // Dropdown toggles
  const [showReqDropdown, setShowReqDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Submission & Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any>(null);

  // Sync defaults when requirement changes
  useEffect(() => {
    if (currentReq) {
      if (currentReq.targetQuantity) setQuantity(String(currentReq.targetQuantity));
      if (currentReq.unit) setUnit(currentReq.unit as any);
      if (currentReq.targetPricePerUnit && !selectedSupplierId) {
        setUnitPrice(String(currentReq.targetPricePerUnit));
      }
      if (currentReq.deliveryLocation) setDeliveryLocation(currentReq.deliveryLocation);
    }
  }, [currentReq, selectedSupplierId]);

  // Sync defaults when supplier changes
  useEffect(() => {
    if (currentSupplier && currentSupplier.askingPrice) {
      setUnitPrice(String(currentSupplier.askingPrice));
    }
  }, [currentSupplier]);

  // Derived Cost Breakdown Calculations
  const numericQty = parseFloat(quantity) || 0;
  const numericPrice = parseFloat(unitPrice) || 0;
  const produceCost = Math.round(numericQty * numericPrice);

  const freightCost = useMemo(() => {
    if (deliveryTerms === 'FARM_GATE_PICKUP') return 0;
    const ratePerUnit = deliveryTerms === 'MANDIKART_3PL' ? 45 : 35;
    return Math.round(numericQty * ratePerUnit);
  }, [numericQty, deliveryTerms]);

  const mandiCess = Math.round(produceCost * 0.01); // 1.0% statutory market fee
  const handlingCost = Math.round(numericQty * 15); // ₹15 weighbridge & loading
  const totalLandedAmount = produceCost + freightCost + mandiCess + handlingCost;
  const costPerUnitLanded =
    numericQty > 0 ? Math.round((totalLandedAmount / numericQty) * 100) / 100 : 0;

  const targetPrice = currentReq?.targetPricePerUnit || numericPrice;
  const priceDifference = numericPrice - targetPrice;

  // Validation function
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!numericQty || numericQty <= 0) {
      errs.quantity = 'Quantity must be greater than zero.';
    }
    if (!numericPrice || numericPrice <= 0) {
      errs.unitPrice = 'Proposed price must be greater than zero.';
    }
    if (!deliveryDate) {
      errs.deliveryDate = 'Delivery date is mandatory.';
    } else {
      const selected = new Date(deliveryDate).getTime();
      const today = new Date().setHours(0, 0, 0, 0);
      if (selected < today) {
        errs.deliveryDate = 'Delivery date cannot be in the past.';
      }
    }
    if (!deliveryLocation.trim()) {
      errs.deliveryLocation = 'Delivery destination address is required.';
    }
    if (!selectedReqId) {
      errs.requirement = 'Please select a procurement requirement.';
    }
    if (!selectedSupplierId) {
      errs.supplier = 'Please select a supplier.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Trigger Confirmation Modal
  const handleProceedToConfirm = () => {
    if (validateForm()) {
      setConfirmModalVisible(true);
    } else {
      Alert.alert('Incomplete Form', 'Please rectify highlighted issues before proceeding.');
    }
  };

  // Submit Offer (Binding)
  const handleExecuteSubmit = async () => {
    if (isSubmitting) return; // Prevent duplicate submission
    setIsSubmitting(true);

    const payload = {
      requirementId: selectedReqId,
      requirementTitle: currentReq?.title || 'Produce Sourcing',
      supplierId: selectedSupplierId,
      supplierName: currentSupplier?.name || 'Verified Supplier',
      supplierType: currentSupplier?.type || 'FPO_CLUSTER',
      cropName: (currentReq as any)?.commodity || currentReq?.title || 'Produce',
      grade: (currentReq as any)?.grade || 'Grade A',
      variety: (currentReq as any)?.variety || 'Standard Grade',
      quantity: numericQty,
      unit,
      unitPrice: numericPrice,
      targetPrice,
      deliveryCost: freightCost,
      deliveryDate,
      deliveryLocation,
      deliveryTerms,
      paymentTerms,
      validityHours: validityDays * 24,
      notes,
      isDraft: false,
    };

    try {
      const res = await createOffer(payload);
      setIsSubmitting(false);
      setConfirmModalVisible(false);

      if (res.success && res.data) {
        setSubmissionSuccess(res.data);
      } else {
        Alert.alert('Submission Error', res.error || 'Failed to submit offer to supplier.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Error', err.message || 'An unexpected error occurred during submission.');
    }
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (isSavingDraft) return;
    setIsSavingDraft(true);

    const payload = {
      requirementId: selectedReqId,
      requirementTitle: currentReq?.title || 'Draft Sourcing Request',
      supplierId: selectedSupplierId,
      supplierName: currentSupplier?.name || 'Verified Supplier',
      supplierType: currentSupplier?.type || 'FPO_CLUSTER',
      cropName: (currentReq as any)?.commodity || 'Produce',
      grade: 'Grade A',
      variety: 'Standard Grade',
      quantity: numericQty || 1,
      unit,
      unitPrice: numericPrice || 1,
      targetPrice,
      deliveryCost: freightCost,
      deliveryDate,
      deliveryLocation,
      deliveryTerms,
      paymentTerms,
      notes,
      isDraft: true,
    };

    try {
      const res = await createOffer(payload);
      setIsSavingDraft(false);
      if (res.success) {
        Alert.alert('Draft Saved', 'Purchase offer draft has been saved to your Sent Requests.', [
          { text: 'Go to Sent Requests', onPress: () => router.push('/offers/sent' as any) },
          { text: 'Stay Here', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Draft Error', res.error || 'Could not save draft.');
      }
    } catch (err: any) {
      setIsSavingDraft(false);
      Alert.alert('Error', err.message || 'Failed to save draft.');
    }
  };

  // Post-submission Success View
  if (submissionSuccess) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.successScreenContent}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={54} color="#15803D" />
          </View>
          <Text style={styles.successHeading}>Offer Submitted Successfully</Text>
          <Text style={styles.successSubtext}>
            Your binding purchase offer has been transmitted to {submissionSuccess.supplierName}.
          </Text>

          <View style={styles.successCard}>
            <View style={styles.successRow}>
              <Text style={styles.successKey}>Offer Reference</Text>
              <Text style={styles.successValBold}>#{submissionSuccess.id}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successKey}>Commodity</Text>
              <Text style={styles.successVal}>{submissionSuccess.cropName} ({submissionSuccess.grade})</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successKey}>Offered Volume</Text>
              <Text style={styles.successVal}>{submissionSuccess.quantity} {submissionSuccess.unit}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successKey}>Proposed Rate</Text>
              <Text style={styles.successVal}>₹{submissionSuccess.unitPrice} / {submissionSuccess.unit}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successKey}>Total Landed Budget</Text>
              <Text style={[styles.successValBold, { color: MKColors.primary }]}>
                ₹{submissionSuccess.totalLandedAmount.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successKey}>Delivery Method</Text>
              <Text style={styles.successVal}>{submissionSuccess.deliveryTerms.replace('_', ' ')}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successKey}>Status</Text>
              <View style={styles.pendingBadge}>
                <Clock size={12} color="#B45309" style={{ marginRight: 4 }} />
                <Text style={styles.pendingBadgeText}>Awaiting Supplier</Text>
              </View>
            </View>
          </View>

          <View style={styles.successBtnGroup}>
            <Pressable
              style={styles.btnSuccessPrimary}
              onPress={() => router.push(`/offers/details?id=${submissionSuccess.id}` as any)}
            >
              <Text style={styles.btnSuccessPrimaryText}>View Complete Offer</Text>
            </Pressable>
            <Pressable
              style={styles.btnSuccessSecondary}
              onPress={() => router.push('/offers/sent' as any)}
            >
              <Text style={styles.btnSuccessSecondaryText}>Go to Sent Purchase Requests</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Navigation Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerBackBtn}
          onPress={() => router.back()}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color="#1E293B" />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Make a Purchase Offer</Text>
          <Text style={styles.headerSubtitle}>Tender Commercial Proposal</Text>
        </View>
        <Pressable
          style={styles.draftIconBtn}
          onPress={handleSaveDraft}
          disabled={isSavingDraft}
        >
          {isSavingDraft ? (
            <ActivityIndicator size="small" color={MKColors.primary} />
          ) : (
            <Save size={20} color={MKColors.primary} />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Linked Requirement Selector */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Package size={18} color={MKColors.primary} />
            <Text style={styles.cardTitle}>1. Target Requirement</Text>
          </View>

          <Pressable
            style={[styles.dropdownTrigger, errors.requirement && styles.inputErrorBorder]}
            onPress={() => setShowReqDropdown(!showReqDropdown)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.dropdownLabel}>Selected Procurement Tender</Text>
              <Text style={styles.dropdownValueText} numberOfLines={1}>
                {currentReq?.title || 'Select a Requirement'}
              </Text>
              <Text style={styles.dropdownSubtext}>
                Tender Target: ₹{currentReq?.targetPricePerUnit} / {currentReq?.unit} • Qty: {currentReq?.targetQuantity} {currentReq?.unit}
              </Text>
            </View>
            <ChevronDown size={20} color="#64748B" />
          </Pressable>

          {showReqDropdown && (
            <View style={styles.dropdownMenu}>
              {availableReqs.map((req) => (
                <Pressable
                  key={req.id}
                  style={[
                    styles.dropdownMenuItem,
                    req.id === selectedReqId && styles.dropdownMenuItemActive,
                  ]}
                  onPress={() => {
                    setSelectedReqId(req.id);
                    setShowReqDropdown(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.menuItemTitle,
                        req.id === selectedReqId && styles.menuItemTitleActive,
                      ]}
                    >
                      {req.title}
                    </Text>
                    <Text style={styles.menuItemSub}>
                      Target: ₹{req.targetPricePerUnit}/{req.unit} • Volume: {req.targetQuantity} {req.unit}
                    </Text>
                  </View>
                  {req.id === selectedReqId && <Check size={18} color={MKColors.primary} />}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Section 2: Selected Supplier */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Building2 size={18} color={MKColors.primary} />
            <Text style={styles.cardTitle}>2. Target Supplier</Text>
          </View>

          <Pressable
            style={[styles.dropdownTrigger, errors.supplier && styles.inputErrorBorder]}
            onPress={() => setShowSupplierDropdown(!showSupplierDropdown)}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={styles.supplierBadgeTag}>
                  {currentSupplier?.type.replace('_', ' ')}
                </Text>
                {currentSupplier?.isVerified && (
                  <View style={styles.verifiedMiniTag}>
                    <ShieldCheck size={10} color="#15803D" style={{ marginRight: 2 }} />
                    <Text style={styles.verifiedMiniText}>Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.dropdownValueText}>{currentSupplier?.name}</Text>
              <Text style={styles.dropdownSubtext}>
                {currentSupplier?.location} • Dist: {currentSupplier?.distanceKm} km • Ask: ₹{currentSupplier?.askingPrice}/quintal
              </Text>
            </View>
            <ChevronDown size={20} color="#64748B" />
          </Pressable>

          {showSupplierDropdown && (
            <View style={styles.dropdownMenu}>
              {availableSuppliers.map((sup) => (
                <Pressable
                  key={sup.id}
                  style={[
                    styles.dropdownMenuItem,
                    sup.id === selectedSupplierId && styles.dropdownMenuItemActive,
                  ]}
                  onPress={() => {
                    setSelectedSupplierId(sup.id);
                    setShowSupplierDropdown(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.menuItemTitle,
                        sup.id === selectedSupplierId && styles.menuItemTitleActive,
                      ]}
                    >
                      {sup.name}
                    </Text>
                    <Text style={styles.menuItemSub}>
                      {sup.location} • Ask: ₹{sup.askingPrice}/quintal • ★ {sup.ratingStars}
                    </Text>
                  </View>
                  {sup.id === selectedSupplierId && <Check size={18} color={MKColors.primary} />}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Section 3: Commercial Terms (Quantity & Offer Price) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IndianRupee size={18} color={MKColors.primary} />
            <Text style={styles.cardTitle}>3. Volume & Proposed Price</Text>
          </View>

          {/* Quantity & Unit Row */}
          <View style={styles.formRow}>
            <View style={{ flex: 1.2, marginRight: 10 }}>
              <Text style={styles.inputLabel}>
                Quantity <Text style={styles.reqStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.inputBox, errors.quantity && styles.inputErrorBorder]}
                value={quantity}
                onChangeText={(val) => {
                  setQuantity(val);
                  if (errors.quantity) setErrors((e) => ({ ...e, quantity: '' }));
                }}
                keyboardType="numeric"
                placeholder="25"
              />
              {errors.quantity ? <Text style={styles.errText}>{errors.quantity}</Text> : null}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Unit</Text>
              <View style={styles.unitSelector}>
                {(['quintal', 'tonne', 'kg'] as const).map((u) => (
                  <Pressable
                    key={u}
                    style={[styles.unitPill, unit === u && styles.unitPillActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[styles.unitPillText, unit === u && styles.unitPillTextActive]}>
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Proposed Offer Price */}
          <View style={styles.formGroup}>
            <View style={styles.labelWithBadgeRow}>
              <Text style={styles.inputLabel}>
                Proposed Unit Price (₹ / {unit}) <Text style={styles.reqStar}>*</Text>
              </Text>
              <Text style={styles.targetRefBadge}>Tender Target: ₹{targetPrice}</Text>
            </View>

            <View style={styles.currencyInputWrap}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={[
                  styles.currencyInputBox,
                  errors.unitPrice && styles.inputErrorBorder,
                ]}
                value={unitPrice}
                onChangeText={(val) => {
                  setUnitPrice(val);
                  if (errors.unitPrice) setErrors((e) => ({ ...e, unitPrice: '' }));
                }}
                keyboardType="numeric"
                placeholder="2300"
              />
            </View>
            {errors.unitPrice ? <Text style={styles.errText}>{errors.unitPrice}</Text> : null}

            {/* Price Difference Indicator */}
            {numericPrice > 0 && (
              <View
                style={[
                  styles.priceDiffBadge,
                  priceDifference <= 0 ? styles.diffFavorable : styles.diffHigher,
                ]}
              >
                <Info size={12} color={priceDifference <= 0 ? '#15803D' : '#B45309'} />
                <Text
                  style={[
                    styles.priceDiffText,
                    { color: priceDifference <= 0 ? '#15803D' : '#B45309' },
                  ]}
                >
                  {priceDifference === 0
                    ? 'Matches your tender target price exactly'
                    : priceDifference < 0
                    ? `₹${Math.abs(priceDifference)} / ${unit} lower than tender target price`
                    : `₹${priceDifference} / ${unit} higher than tender target price`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Section 4: Delivery & Logistics Configuration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Truck size={18} color={MKColors.primary} />
            <Text style={styles.cardTitle}>4. Delivery & Logistics Terms</Text>
          </View>

          {/* Delivery Method Option Cards */}
          <Text style={styles.inputLabel}>
            Fulfillment Method <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.deliveryOptionsWrap}>
            {[
              {
                id: 'SELLER_DELIVERY',
                title: 'Seller Delivery',
                desc: 'Supplier handles trucking to your depot (Freight billed)',
                rate: '₹35/qtl',
              },
              {
                id: 'MANDIKART_3PL',
                title: 'MandiKart 3PL Logistics',
                desc: 'MandiKart verified fleet pickup with GPS telematics',
                rate: '₹45/qtl',
              },
              {
                id: 'FARM_GATE_PICKUP',
                title: 'Farm Gate Pickup',
                desc: 'Farmer arranges own vehicle to supplier farm gate',
                rate: '₹0 freight',
              },
            ].map((opt) => (
              <Pressable
                key={opt.id}
                style={[
                  styles.deliveryOptionCard,
                  deliveryTerms === opt.id && styles.deliveryOptionActive,
                ]}
                onPress={() => setDeliveryTerms(opt.id as any)}
              >
                <View style={styles.deliveryRadioCircle}>
                  {deliveryTerms === opt.id && <View style={styles.deliveryRadioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.deliveryOptTitle,
                      deliveryTerms === opt.id && styles.deliveryOptTitleActive,
                    ]}
                  >
                    {opt.title}
                  </Text>
                  <Text style={styles.deliveryOptDesc}>{opt.desc}</Text>
                </View>
                <Text style={styles.deliveryOptRate}>{opt.rate}</Text>
              </Pressable>
            ))}
          </View>

          {/* Delivery Date */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>
              Target Delivery Date (YYYY-MM-DD) <Text style={styles.reqStar}>*</Text>
            </Text>
            <View style={styles.dateInputWrap}>
              <Calendar size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.dateInputBox, errors.deliveryDate && styles.inputErrorBorder]}
                value={deliveryDate}
                onChangeText={(val) => {
                  setDeliveryDate(val);
                  if (errors.deliveryDate) setErrors((e) => ({ ...e, deliveryDate: '' }));
                }}
                placeholder="2026-10-20"
              />
            </View>
            {errors.deliveryDate ? <Text style={styles.errText}>{errors.deliveryDate}</Text> : null}

            {/* Quick date chips */}
            <View style={styles.quickDateChipsRow}>
              {[
                { label: '+3 Days', days: 3 },
                { label: '+5 Days', days: 5 },
                { label: '+7 Days', days: 7 },
                { label: '+10 Days', days: 10 },
              ].map((chip) => {
                const targetD = new Date(Date.now() + chip.days * 86400000)
                  .toISOString()
                  .split('T')[0];
                return (
                  <Pressable
                    key={chip.label}
                    style={[
                      styles.dateChip,
                      deliveryDate === targetD && styles.dateChipActive,
                    ]}
                    onPress={() => setDeliveryDate(targetD)}
                  >
                    <Text
                      style={[
                        styles.dateChipText,
                        deliveryDate === targetD && styles.dateChipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Destination Depot Address */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>
              Delivery Destination Depot <Text style={styles.reqStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.inputBox,
                errors.deliveryLocation && styles.inputErrorBorder,
              ]}
              value={deliveryLocation}
              onChangeText={setDeliveryLocation}
              placeholder="e.g. Pune Wholesale Mandi, Market Yard Depot"
            />
            {errors.deliveryLocation ? (
              <Text style={styles.errText}>{errors.deliveryLocation}</Text>
            ) : null}
          </View>
        </View>

        {/* Section 5: Payment & Validity Protocol */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CreditCard size={18} color={MKColors.primary} />
            <Text style={styles.cardTitle}>5. Settlement & Offer Validity</Text>
          </View>

          <Text style={styles.inputLabel}>Settlement Guarantee</Text>
          <View style={styles.paymentTermsCard}>
            <ShieldCheck size={20} color="#15803D" style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTermsTitle}>{paymentTerms}</Text>
              <Text style={styles.paymentTermsSub}>
                Funds are held in MandiKart Safe Escrow and released only after weighbridge gross slip verification and moisture inspection approval.
              </Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Offer Validity Period</Text>
            <View style={styles.validityPillRow}>
              {[
                { label: '24 Hours', days: 1 },
                { label: '48 Hours (Standard)', days: 2 },
                { label: '72 Hours', days: 3 },
                { label: '7 Days', days: 7 },
              ].map((v) => (
                <Pressable
                  key={v.label}
                  style={[
                    styles.validityPill,
                    validityDays === v.days && styles.validityPillActive,
                  ]}
                  onPress={() => setValidityDays(v.days)}
                >
                  <Text
                    style={[
                      styles.validityPillText,
                      validityDays === v.days && styles.validityPillTextActive,
                    ]}
                  >
                    {v.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Special Instructions / Notes for Supplier</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Moisture must be <12%, double-mesh packing required, dispatch inspection on loading..."
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Section 6: Real-Time Landed Cost Breakdown Sheet */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardHeader}>
            <Text style={styles.summaryCardTitle}>Landed Cost Breakdown Sheet</Text>
            <View style={styles.bindingTag}>
              <Text style={styles.bindingTagText}>Unit-Aware Formula</Text>
            </View>
          </View>

          <View style={styles.breakdownList}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>
                Produce Base ({numericQty} {unit} @ ₹{numericPrice})
              </Text>
              <Text style={styles.breakdownVal}>₹{produceCost.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>
                Freight & Transport ({deliveryTerms.replace('_', ' ')})
              </Text>
              <Text style={styles.breakdownVal}>₹{freightCost.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>APMC Statutory Market Fee (1.0%)</Text>
              <Text style={styles.breakdownVal}>₹{mandiCess.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownKey}>Weighbridge & Handling Fee (₹15/{unit})</Text>
              <Text style={styles.breakdownVal}>₹{handlingCost.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownTotalRow}>
              <View>
                <Text style={styles.breakdownTotalLabel}>Total Proposed Landed Budget</Text>
                <Text style={styles.breakdownUnitRate}>
                  Effective: ₹{costPerUnitLanded.toLocaleString('en-IN')} / {unit}
                </Text>
              </View>
              <Text style={styles.breakdownTotalAmount}>
                ₹{totalLandedAmount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          style={styles.btnDraft}
          onPress={handleSaveDraft}
          disabled={isSavingDraft || isSubmitting}
        >
          {isSavingDraft ? (
            <ActivityIndicator size="small" color="#475569" />
          ) : (
            <>
              <Save size={16} color="#475569" style={{ marginRight: 6 }} />
              <Text style={styles.btnDraftText}>Save Draft</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={styles.btnSubmit}
          onPress={handleProceedToConfirm}
          disabled={isSubmitting || isSavingDraft}
        >
          <Send size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.btnSubmitText}>Submit Purchase Offer</Text>
        </Pressable>
      </View>

      {/* Confirmation Modal */}
      <Modal visible={confirmModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalTopRow}>
              <View style={styles.modalIconWrap}>
                <Send size={20} color={MKColors.primary} />
              </View>
              <Text style={styles.modalHeading}>Confirm Purchase Offer</Text>
            </View>

            <Text style={styles.modalDescription}>
              You are about to transmit a binding purchase offer to{' '}
              <Text style={{ fontWeight: '700' }}>{currentSupplier?.name}</Text>.
            </Text>

            <View style={styles.modalSummaryBox}>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryKey}>Commodity:</Text>
                <Text style={styles.modalSummaryVal}>
                  {(currentReq as any)?.commodity || currentReq?.title}
                </Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryKey}>Volume:</Text>
                <Text style={styles.modalSummaryVal}>
                  {numericQty} {unit}
                </Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryKey}>Offered Rate:</Text>
                <Text style={styles.modalSummaryVal}>
                  ₹{numericPrice} / {unit}
                </Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryKey}>Delivery By:</Text>
                <Text style={styles.modalSummaryVal}>{deliveryDate}</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryKey}>Total Landed Budget:</Text>
                <Text style={[styles.modalSummaryVal, { color: MKColors.primary, fontWeight: '700' }]}>
                  ₹{totalLandedAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <Text style={styles.modalLegalNote}>
              Note: If {currentSupplier?.name} accepts this offer within the validity window, a bilateral procurement contract is immediately executed in Safe Escrow.
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
                onPress={handleExecuteSubmit}
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
  draftIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scroll: {
    flex: 1,
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
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dropdownValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  dropdownSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
  supplierBadgeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: MKColors.primary,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  verifiedMiniTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownMenuItemActive: {
    backgroundColor: '#F0FDF4',
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuItemTitleActive: {
    color: MKColors.primary,
  },
  menuItemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 12,
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
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  unitPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  unitPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  unitPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  unitPillTextActive: {
    color: MKColors.primary,
    fontWeight: '700',
  },
  labelWithBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  targetRefBadge: {
    fontSize: 11,
    fontWeight: '600',
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
  priceDiffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  diffFavorable: {
    backgroundColor: '#F0FDF4',
  },
  diffHigher: {
    backgroundColor: '#FEF3C7',
  },
  priceDiffText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  deliveryOptionsWrap: {
    gap: 8,
    marginBottom: 12,
  },
  deliveryOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  deliveryOptionActive: {
    borderColor: MKColors.primary,
    backgroundColor: '#F0FDF4',
  },
  deliveryRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  deliveryRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: MKColors.primary,
  },
  deliveryOptTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  deliveryOptTitleActive: {
    color: MKColors.primary,
  },
  deliveryOptDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  deliveryOptRate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
  quickDateChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  dateChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  dateChipTextActive: {
    color: '#15803D',
  },
  paymentTermsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  paymentTermsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  paymentTermsSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
    lineHeight: 16,
  },
  validityPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  validityPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  validityPillActive: {
    backgroundColor: MKColors.primary,
    borderColor: MKColors.primary,
  },
  validityPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  validityPillTextActive: {
    color: '#FFFFFF',
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
  summaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  bindingTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bindingTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
  },
  breakdownList: {
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownKey: {
    fontSize: 13,
    color: '#94A3B8',
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  breakdownTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  breakdownUnitRate: {
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 2,
  },
  breakdownTotalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4ADE80',
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
  btnDraft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnDraftText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  btnSubmit: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
  },
  btnSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: '#DCFCE7',
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
  successCard: {
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
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  successBtnGroup: {
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
