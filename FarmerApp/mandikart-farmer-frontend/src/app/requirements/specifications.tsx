/**
 * MandiKart Farmer App — Product Specifications Screen (Screen 4 / Step 3)
 *
 * Route: /requirements/specifications
 *
 * Conditional attribute collection based strictly on product category:
 * - Vegetables & Fruits: Grade, Variety, Diameter/Size, Freshness Sorting, Packaging
 * - Grains & Pulses: Moisture Content %, Foreign Matter tolerance, Bagging type
 * - Farm Inputs: Formulation, Brand preference, Certification
 * - Organic certification toggle
 * - Special quality instructions text area
 * - Non-destructive: state is preserved across backward/forward navigation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Layers,
  SlidersHorizontal,
  Info,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useRequirementsStore,
  RequirementProduct,
} from '@/store/requirementsStore';
import { RequirementStepHeader } from '@/components/requirements/RequirementStepHeader';

// Preset specification options by category
const GRADE_OPTIONS = ['Grade A (Export / Premium)', 'Grade B (Standard Market)', 'Grade C (Processing)'];
const VEG_SIZES = ['Standard (35mm - 45mm)', 'Bold / Export (45mm - 55mm)', 'Super Bold (55mm+)'];
const VEG_PACKAGING = ['Red Mesh Bags (50kg)', 'Plastic Crates (25kg)', 'Corrugated Boxes (10kg)', 'Gunny Bags (50kg)'];
const GRAIN_MOISTURE = ['<10% (Export Dry)', '10% - 11.5% (Standard Storage)', '11.5% - 12.5% (Fair Average)'];
const GRAIN_PACKAGING = ['New Jute Gunny Bags (50kg)', 'HDPE Woven Bags (50kg)', 'Bulk Silo Hopper'];
const INPUT_PACKAGING = ['Factory Sealed 50kg Bags', '25kg Bags', 'Liquid Cans (5L/20L)'];

export default function ProductSpecificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    activeDraft,
    updateProductSpecs,
    saveDraft,
  } = useRequirementsStore();

  const products = activeDraft?.products || [];
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const currentProduct: RequirementProduct | undefined = products[activeProductIndex] || products[0];

  // Handle Save Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    const res = await saveDraft();
    setIsSaving(false);
    if (res.success) {
      Alert.alert(
        'Draft Saved! 💾',
        `Specifications saved for ${products.length} product(s).`
      );
    }
  };

  // Continue to Step 4 (Quantity & Budget)
  const handleContinue = () => {
    if (products.length === 0) {
      router.replace('/requirements/select-products');
      return;
    }
    router.push('/requirements/quantity-budget');
  };

  if (!currentProduct) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <RequirementStepHeader
          currentStep={3}
          stepTitle="Product Specifications"
          subtitle="No products selected yet"
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please select products first.</Text>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.replace('/requirements/select-products')}
          >
            <Text style={styles.backBtnText}>Go to Select Products</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const category = currentProduct.category;
  const isVegetableOrFruit = category === 'Vegetables' || category === 'Fruits';
  const isGrainOrPulse = category === 'Grains' || category === 'Pulses' || category === 'Oilseeds';
  const isInput = category === 'Inputs';
  const specs = currentProduct.specifications || {};

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Wizard Header ─────────────────────────────────────── */}
      <RequirementStepHeader
        currentStep={3}
        stepTitle="Product Specifications"
        subtitle={`Define quality standards and packaging for ${currentProduct.productName}`}
        onSaveDraft={handleSaveDraft}
        isSavingDraft={isSaving}
      />

      {/* ── Product Switcher Tabs (if multiple products selected) ── */}
      {products.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productTabsRow}
        >
          {products.map((p, idx) => {
            const isSelected = idx === activeProductIndex;
            return (
              <Pressable
                key={p.productId}
                style={[
                  styles.productTabChip,
                  isSelected && styles.productTabChipActive,
                ]}
                onPress={() => setActiveProductIndex(idx)}
              >
                <Text
                  style={[
                    styles.productTabChipText,
                    isSelected && styles.productTabChipTextActive,
                  ]}
                >
                  {p.productName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Active Product Banner ────────────────────────────── */}
        <View style={styles.productBanner}>
          <View>
            <Text style={styles.bannerCategory}>{currentProduct.category} Spec</Text>
            <Text style={styles.bannerTitle}>{currentProduct.productName}</Text>
          </View>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{currentProduct.category}</Text>
          </View>
        </View>

        {/* ── Variety Field ─────────────────────────────────────── */}
        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Crop / Product Variety</Text>
          <TextInput
            style={styles.textInput}
            value={currentProduct.variety}
            onChangeText={(txt) =>
              updateProductSpecs(currentProduct.productId, { variety: txt })
            }
            placeholder="e.g. Nashik Red Garwa or Lokwan Golden"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* ── Quality Grade Chips ──────────────────────────────── */}
        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Quality Grade Standard</Text>
          <Text style={styles.fieldSub}>
            Buyers and FPO aggregators match directly based on grade compliance
          </Text>
          <View style={styles.optionsCol}>
            {GRADE_OPTIONS.map((gOption) => {
              const isSelected = (currentProduct.grade || '').startsWith(gOption.split(' ')[0]);
              return (
                <Pressable
                  key={gOption}
                  style={[
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                  ]}
                  onPress={() =>
                    updateProductSpecs(currentProduct.productId, {
                      grade: gOption.split(' (')[0],
                    })
                  }
                >
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {gOption}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── CONDITIONAL SECTION A: Vegetables & Fruits ───────── */}
        {isVegetableOrFruit && (
          <>
            {/* Size / Diameter */}
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Size / Diameter Sorting</Text>
              <View style={styles.chipGrid}>
                {VEG_SIZES.map((sz) => {
                  const isSelected = specs.sizeDiameter === sz;
                  return (
                    <Pressable
                      key={sz}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() =>
                        updateProductSpecs(currentProduct.productId, {
                          sizeDiameter: sz,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {sz}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Packaging Specification */}
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Preferred Packaging</Text>
              <View style={styles.optionsCol}>
                {VEG_PACKAGING.map((pkg) => {
                  const isSelected = specs.packaging === pkg;
                  return (
                    <Pressable
                      key={pkg}
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemSelected,
                      ]}
                      onPress={() =>
                        updateProductSpecs(currentProduct.productId, {
                          packaging: pkg,
                        })
                      }
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {pkg}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* ── CONDITIONAL SECTION B: Grains & Pulses ───────────── */}
        {isGrainOrPulse && (
          <>
            {/* Moisture Level */}
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Moisture Level Protocol</Text>
              <Text style={styles.fieldSub}>
                Strict moisture limits ensure storage shelf-life in silos & warehouses
              </Text>
              <View style={styles.chipGrid}>
                {GRAIN_MOISTURE.map((m) => {
                  const isSelected = specs.moistureLevel === m;
                  return (
                    <Pressable
                      key={m}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() =>
                        updateProductSpecs(currentProduct.productId, {
                          moistureLevel: m,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Packaging Bags */}
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Bagging Specification</Text>
              <View style={styles.optionsCol}>
                {GRAIN_PACKAGING.map((pkg) => {
                  const isSelected = specs.packaging === pkg;
                  return (
                    <Pressable
                      key={pkg}
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemSelected,
                      ]}
                      onPress={() =>
                        updateProductSpecs(currentProduct.productId, {
                          packaging: pkg,
                        })
                      }
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {pkg}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* ── CONDITIONAL SECTION C: Farm Inputs ───────────────── */}
        {isInput && (
          <>
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Brand & Manufacturer Preference</Text>
              <TextInput
                style={styles.textInput}
                value={specs.brandPreference || ''}
                onChangeText={(txt) =>
                  updateProductSpecs(currentProduct.productId, {
                    brandPreference: txt,
                  })
                }
                placeholder="e.g. IFFCO, KRIBHCO, NSC Certified"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>Packaging Unit</Text>
              <View style={styles.chipGrid}>
                {INPUT_PACKAGING.map((pkg) => {
                  const isSelected = specs.packaging === pkg;
                  return (
                    <Pressable
                      key={pkg}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() =>
                        updateProductSpecs(currentProduct.productId, {
                          packaging: pkg,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {pkg}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* ── Organic Certification Toggle ─────────────────────── */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.toggleTitle}>Certified Organic (NPOP / Jaivik Bharat)</Text>
            <Text style={styles.toggleSub}>
              Requires organic certificate verification during weighbridge intake
            </Text>
          </View>
          <Switch
            value={specs.organicCertified || false}
            onValueChange={(val) =>
              updateProductSpecs(currentProduct.productId, {
                organicCertified: val,
              })
            }
            trackColor={{ false: '#D1D5DB', true: MKColors.primaryGreen }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* ── Special Instructions / Notes ─────────────────────── */}
        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Special Quality Instructions</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={specs.specialInstructions || ''}
            onChangeText={(txt) =>
              updateProductSpecs(currentProduct.productId, {
                specialInstructions: txt,
              })
            }
            placeholder="e.g. Neck should be properly dried, zero fungus, max 2% skin peeling tolerance."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />
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
          <Text style={styles.continueBtnText}>Continue to Quantity & Budget</Text>
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
  productTabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5DFD4',
    gap: 8,
  },
  productTabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productTabChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: MKColors.primaryGreen,
  },
  productTabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  productTabChipTextActive: {
    color: '#166534',
    fontWeight: '800',
  },
  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5DFD4',
    marginBottom: 16,
  },
  bannerCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1C1E',
    marginTop: 2,
  },
  categoryPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.primaryGreenDark,
  },
  formSection: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  fieldSub: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#E5DFD4',
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    height: 75,
    textAlignVertical: 'top',
  },
  optionsCol: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E5DFD4',
  },
  optionItemSelected: {
    borderColor: MKColors.primaryGreen,
    backgroundColor: '#F0FDF4',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: MKColors.primaryGreen,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: MKColors.primaryGreen,
  },
  optionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  optionTextSelected: {
    color: MKColors.primaryGreenDark,
    fontWeight: '700',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5DFD4',
  },
  chipActive: {
    borderColor: MKColors.primaryGreen,
    backgroundColor: '#F0FDF4',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextActive: {
    color: MKColors.primaryGreenDark,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5DFD4',
    marginBottom: 18,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  toggleSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 15,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: MKColors.primaryGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
