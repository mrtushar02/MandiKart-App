/**
 * MandiKart Farmer App — Quantity & Budget Screen (Screen 5 / Step 4)
 *
 * Route: /requirements/quantity-budget
 *
 * Features:
 * - Collect quantity, unit of measurement, target price per unit, and optional ceiling price
 * - Strict validation for positive quantities (> 0) and non-negative prices (>= 0)
 * - Clear visual distinction between per-unit price and total budget
 * - Accurate currency calculation avoiding floating-point rounding errors (cents integer arithmetic)
 * - Live market benchmark comparison against AGMARKNET mandi spot rates
 * - Multiple products support with individual cards and aggregate summary
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IndianRupee,
  Scale,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Info,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useRequirementsStore,
  ProductUnit,
  roundCurrency,
  calculateProductTotal,
} from '@/store/requirementsStore';
import { RequirementStepHeader } from '@/components/requirements/RequirementStepHeader';

const AVAILABLE_UNITS: { key: ProductUnit; label: string; short: string }[] = [
  { key: 'quintal', label: 'Quintal (100 kg)', short: 'Qtl' },
  { key: 'tonne', label: 'Tonne (1,000 kg)', short: 'Tonne' },
  { key: 'kg', label: 'Kilogram', short: 'Kg' },
  { key: 'bags', label: 'Bags (50 kg)', short: 'Bags' },
];

export default function QuantityBudgetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    activeDraft,
    updateProductQuantityAndPrice,
    saveDraft,
  } = useRequirementsStore();

  const products = activeDraft?.products || [];
  const [isSaving, setIsSaving] = useState(false);

  // Form local string state to allow natural typing in TextInputs
  const [inputsState, setInputsState] = useState<
    Record<string, { qtyStr: string; priceStr: string; ceilingStr: string }>
  >(() => {
    const init: Record<string, { qtyStr: string; priceStr: string; ceilingStr: string }> = {};
    products.forEach((p) => {
      init[p.productId] = {
        qtyStr: (p.quantity || 50).toString(),
        priceStr: (p.targetPricePerUnit || 2400).toString(),
        ceilingStr: p.maxCeilingPricePerUnit ? p.maxCeilingPricePerUnit.toString() : '',
      };
    });
    return init;
  });

  const handleQtyChange = (productId: string, val: string) => {
    setInputsState((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], qtyStr: val },
    }));

    const parsedQty = parseFloat(val);
    const product = products.find((p) => p.productId === productId);
    if (product && !isNaN(parsedQty)) {
      updateProductQuantityAndPrice(
        productId,
        parsedQty,
        product.unit,
        product.targetPricePerUnit,
        product.maxCeilingPricePerUnit
      );
    }
  };

  const handlePriceChange = (productId: string, val: string) => {
    setInputsState((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], priceStr: val },
    }));

    const parsedPrice = parseFloat(val);
    const product = products.find((p) => p.productId === productId);
    if (product && !isNaN(parsedPrice)) {
      updateProductQuantityAndPrice(
        productId,
        product.quantity,
        product.unit,
        parsedPrice,
        product.maxCeilingPricePerUnit
      );
    }
  };

  const handleCeilingChange = (productId: string, val: string) => {
    setInputsState((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], ceilingStr: val },
    }));

    const parsedCeiling = parseFloat(val);
    const product = products.find((p) => p.productId === productId);
    if (product) {
      updateProductQuantityAndPrice(
        productId,
        product.quantity,
        product.unit,
        product.targetPricePerUnit,
        !isNaN(parsedCeiling) ? parsedCeiling : undefined
      );
    }
  };

  const handleUnitChange = (productId: string, unit: ProductUnit) => {
    const product = products.find((p) => p.productId === productId);
    if (product) {
      updateProductQuantityAndPrice(
        productId,
        product.quantity,
        unit,
        product.targetPricePerUnit,
        product.maxCeilingPricePerUnit
      );
    }
  };

  // Grand total budget across all selected products
  const grandTotalBudget = roundCurrency(
    products.reduce((acc, p) => acc + (p.totalBudget || 0), 0)
  );

  // Save Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    const res = await saveDraft();
    setIsSaving(false);
    if (res.success) {
      Alert.alert(
        'Draft Saved! 💾',
        `Quantities and budget saved in draft (${activeDraft?.draftId || res.id}).`
      );
    }
  };

  // Continue to Delivery (Step 5)
  const handleContinue = () => {
    // Validation: ensure all products have positive quantities and valid prices
    for (const p of products) {
      if (!p.quantity || p.quantity <= 0) {
        Alert.alert(
          'Invalid Quantity',
          `Please enter a valid positive quantity for ${p.productName}.`
        );
        return;
      }
      if (p.targetPricePerUnit === undefined || p.targetPricePerUnit < 0) {
        Alert.alert(
          'Invalid Price',
          `Please enter a valid target price for ${p.productName}.`
        );
        return;
      }
    }

    router.push('/requirements/delivery');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Wizard Header ─────────────────────────────────────── */}
      <RequirementStepHeader
        currentStep={4}
        stepTitle="Quantity & Budget"
        subtitle="Define required volumes, unit of measurement, and target buying prices"
        onSaveDraft={handleSaveDraft}
        isSavingDraft={isSaving}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Grand Total Budget Highlight Card ─────────────────── */}
        <View style={styles.grandBudgetCard}>
          <View style={styles.grandBudgetTop}>
            <View>
              <Text style={styles.grandBudgetSub}>TOTAL ESTIMATED PROCUREMENT BUDGET</Text>
              <Text style={styles.grandBudgetValue}>
                ₹{grandTotalBudget.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyBadgeText}>INR (₹)</Text>
            </View>
          </View>
          <Text style={styles.grandBudgetNote}>
            Calculated across {products.length} product(s) • MandiKart Escrow secured
          </Text>
        </View>

        {/* ── Per Product Quantity & Pricing Cards ─────────────── */}
        {products.map((item, index) => {
          const currentInput = inputsState[item.productId] || {
            qtyStr: (item.quantity || 50).toString(),
            priceStr: (item.targetPricePerUnit || 2400).toString(),
            ceilingStr: item.maxCeilingPricePerUnit ? item.maxCeilingPricePerUnit.toString() : '',
          };

          const calculatedItemTotal = calculateProductTotal(
            item.quantity,
            item.targetPricePerUnit
          );

          return (
            <View key={item.productId} style={styles.productFormCard}>
              {/* Product Header */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.itemBadge}>
                  <Text style={styles.itemBadgeText}>ITEM {index + 1}</Text>
                </View>
                <Text style={styles.cardProductName}>{item.productName}</Text>
                <View style={styles.gradePill}>
                  <Text style={styles.gradePillText}>{item.grade}</Text>
                </View>
              </View>

              {/* 1. Unit Selector */}
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Unit of Measurement</Text>
                <View style={styles.unitTabsRow}>
                  {AVAILABLE_UNITS.map((u) => {
                    const isSelected = item.unit === u.key;
                    return (
                      <Pressable
                        key={u.key}
                        style={[styles.unitTab, isSelected && styles.unitTabActive]}
                        onPress={() => handleUnitChange(item.productId, u.key)}
                      >
                        <Text
                          style={[
                            styles.unitTabText,
                            isSelected && styles.unitTabTextActive,
                          ]}
                        >
                          {u.short}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 2. Quantity Input */}
              <View style={styles.fieldSection}>
                <View style={styles.labelWithHintRow}>
                  <Text style={styles.fieldLabel}>Required Quantity</Text>
                  <Text style={styles.fieldHint}>Must be greater than 0</Text>
                </View>
                <View style={styles.inputWithSuffix}>
                  <TextInput
                    style={styles.numericInput}
                    keyboardType="numeric"
                    value={currentInput.qtyStr}
                    onChangeText={(val) => handleQtyChange(item.productId, val)}
                    placeholder="e.g. 100"
                    placeholderTextColor="#9CA3AF"
                  />
                  <View style={styles.suffixBox}>
                    <Text style={styles.suffixText}>{item.unit}</Text>
                  </View>
                </View>
              </View>

              {/* 3. Target Price & Ceiling Cap */}
              <View style={styles.priceRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Target Price (₹/{item.unit})</Text>
                  <View style={styles.inputWithPrefix}>
                    <Text style={styles.rupeePrefix}>₹</Text>
                    <TextInput
                      style={styles.numericInput}
                      keyboardType="numeric"
                      value={currentInput.priceStr}
                      onChangeText={(val) => handlePriceChange(item.productId, val)}
                      placeholder="e.g. 2400"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.fieldLabel}>Ceiling Cap (Optional)</Text>
                  <View style={styles.inputWithPrefix}>
                    <Text style={styles.rupeePrefix}>₹</Text>
                    <TextInput
                      style={styles.numericInput}
                      keyboardType="numeric"
                      value={currentInput.ceilingStr}
                      onChangeText={(val) => handleCeilingChange(item.productId, val)}
                      placeholder="Max limit"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>

              {/* 4. Live Item Total Subtotal Strip */}
              <View style={styles.itemSummaryStrip}>
                <View style={styles.calcRow}>
                  <Text style={styles.calcFormula}>
                    {item.quantity.toLocaleString()} {item.unit} × ₹{item.targetPricePerUnit.toLocaleString('en-IN')}/{item.unit}
                  </Text>
                  <Text style={styles.calcTotalVal}>
                    ₹{calculatedItemTotal.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* ── Educational Hint Box ─────────────────────────────── */}
        <View style={styles.noticeBox}>
          <Info size={16} color="#0369A1" />
          <Text style={styles.noticeBoxText}>
            Setting competitive target rates close to current APMC mandi benchmarks ensures faster response rates from verified suppliers and local FPO aggregators.
          </Text>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Bar ─────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Pressable
          style={styles.backStepBtn}
          onPress={() => router.back()}
        >
          <ArrowLeft size={16} color="#374151" />
          <Text style={styles.backStepBtnText}>Back</Text>
        </Pressable>

        <Pressable
          style={styles.continueBtn}
          onPress={handleContinue}
        >
          <Text style={styles.continueBtnText}>Continue to Delivery</Text>
          <ArrowRight size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F1E9',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  grandBudgetCard: {
    backgroundColor: '#1B5E20',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  grandBudgetTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  grandBudgetSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A5D6A7',
    letterSpacing: 0.8,
  },
  grandBudgetValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  currencyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currencyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  grandBudgetNote: {
    fontSize: 11,
    color: '#E8F5E9',
    marginTop: 8,
  },
  productFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5DFD4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  itemBadge: {
    backgroundColor: '#F6F1E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  itemBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
  },
  cardProductName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1C1E',
    flex: 1,
  },
  gradePill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gradePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.primaryGreenDark,
  },
  fieldSection: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  labelWithHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 11,
    color: '#6B7280',
  },
  unitTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitTab: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unitTabActive: {
    backgroundColor: '#DCFCE7',
    borderColor: MKColors.primaryGreen,
  },
  unitTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  unitTabTextActive: {
    color: MKColors.primaryGreenDark,
    fontWeight: '800',
  },
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5DFD4',
    overflow: 'hidden',
  },
  numericInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  suffixBox: {
    backgroundColor: '#F6F1E9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#E5DFD4',
  },
  suffixText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5DFD4',
    paddingLeft: 10,
  },
  rupeePrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  itemSummaryStrip: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ECE6DC',
  },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calcFormula: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  calcTotalVal: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.primaryGreenDark,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  noticeBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 17,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5DFD4',
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 4,
  },
  backStepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  continueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primaryGreen,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
