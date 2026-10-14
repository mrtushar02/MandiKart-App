/**
 * MandiKart Farmer App — Select Products Screen (Screen 3 / Step 2)
 *
 * Route: /requirements/select-products
 *
 * Features:
 * - Searchable catalog data across agricultural categories
 * - Category filter pills (All, Vegetables, Grains, Pulses, Oilseeds, Inputs)
 * - Single and multi-product selection with duplicate prevention
 * - Top selected products chip strip with 1-tap removal
 * - Visual checkmarks, reference benchmark mandi rates, allowed unit badges
 * - Persisted state: navigating backward/forward preserves all selections
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  X,
  Check,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Tag,
  Scale,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useRequirementsStore,
  CATALOG_PRODUCTS,
  CatalogProductPreset,
} from '@/store/requirementsStore';
import { RequirementStepHeader } from '@/components/requirements/RequirementStepHeader';

const CATEGORIES = ['All', 'Vegetables', 'Grains', 'Pulses', 'Oilseeds', 'Inputs'];

export default function SelectProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    activeDraft,
    toggleProductInDraft,
    removeProductFromDraft,
    saveDraft,
  } = useRequirementsStore();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedProducts = activeDraft?.products || [];

  // Filter catalog
  const filteredCatalog = useMemo(() => {
    return CATALOG_PRODUCTS.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.defaultVariety.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Handle Save Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    const res = await saveDraft();
    setIsSaving(false);
    if (res.success) {
      Alert.alert(
        'Draft Saved! 💾',
        `Your selected products have been saved in draft (${activeDraft?.draftId || res.id}).`
      );
    }
  };

  // Continue to Specifications (Step 3)
  const handleContinue = () => {
    if (selectedProducts.length === 0) {
      Alert.alert(
        'Selection Required',
        'Please select at least one produce or input item before proceeding to specifications.'
      );
      return;
    }
    router.push('/requirements/specifications');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Wizard Header ─────────────────────────────────────── */}
      <RequirementStepHeader
        currentStep={2}
        stepTitle="Select Products"
        subtitle="Choose the crops or farm supplies to include in this bulk requirement"
        onSaveDraft={handleSaveDraft}
        isSavingDraft={isSaving}
      />

      {/* ── Search Bar ────────────────────────────────────────── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search produce by name, variety, or type..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={16} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Category Filter Tabs ──────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <Pressable
              key={cat}
              style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  isSelected && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Selected Products Summary Bar ─────────────────────── */}
      {selectedProducts.length > 0 && (
        <View style={styles.selectedStrip}>
          <View style={styles.selectedCountRow}>
            <Text style={styles.selectedCountText}>
              {selectedProducts.length} Product{selectedProducts.length > 1 ? 's' : ''} Selected
            </Text>
            <Text style={styles.selectedTapHint}>Tap chip to remove</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedChipsScroll}
          >
            {selectedProducts.map((p) => (
              <Pressable
                key={p.productId}
                style={styles.selectedChip}
                onPress={() => removeProductFromDraft(p.productId)}
              >
                <Text style={styles.selectedChipText}>{p.productName}</Text>
                <X size={14} color="#15803D" style={{ marginLeft: 4 }} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Catalog Product List ──────────────────────────────── */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredCatalog.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={36} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No matching products</Text>
            <Text style={styles.emptySubtitle}>
              Try searching a different name or clearing category filters.
            </Text>
          </View>
        ) : (
          filteredCatalog.map((item) => {
            const isSelected = selectedProducts.some((p) => p.productId === item.id);

            return (
              <Pressable
                key={item.id}
                style={[styles.productCard, isSelected && styles.productCardSelected]}
                onPress={() => toggleProductInDraft(item)}
              >
                <Image source={{ uri: item.imageUri }} style={styles.productThumb} />

                <View style={styles.productInfo}>
                  <View style={styles.productTitleRow}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View
                      style={[
                        styles.checkCircle,
                        isSelected && styles.checkCircleSelected,
                      ]}
                    >
                      {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </View>

                  <Text style={styles.productVariety}>
                    {item.defaultVariety} • {item.category}
                  </Text>
                  <Text style={styles.productDesc} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.productMetaRow}>
                    <View style={styles.priceTag}>
                      <Text style={styles.priceTagLabel}>APMC Ref Rate:</Text>
                      <Text style={styles.priceTagVal}>
                        ₹{item.benchmarkPrice.toLocaleString('en-IN')}/{item.defaultUnit}
                      </Text>
                    </View>

                    <View style={styles.unitPillsRow}>
                      {item.allowedUnits.map((u) => (
                        <View key={u} style={styles.unitPill}>
                          <Text style={styles.unitPillText}>{u}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* ── Sticky Bottom Bar ─────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomBarCount}>
            {selectedProducts.length} Selected
          </Text>
          <Text style={styles.bottomBarSub}>
            {selectedProducts.length > 0
              ? 'Ready to define specifications'
              : 'Tap cards above to select'}
          </Text>
        </View>

        <Pressable
          style={[
            styles.continueBtn,
            selectedProducts.length === 0 && styles.continueBtnDisabled,
          ]}
          disabled={selectedProducts.length === 0}
          onPress={handleContinue}
        >
          <Text style={styles.continueBtnText}>
            Continue to Specs ({selectedProducts.length})
          </Text>
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
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    paddingVertical: 0,
  },
  categoryRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5DFD4',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: MKColors.primaryGreen,
    borderColor: MKColors.primaryGreen,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  selectedStrip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  selectedCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  selectedTapHint: {
    fontSize: 11,
    color: '#15803D',
  },
  selectedChipsScroll: {
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  selectedChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E5DFD4',
  },
  productCardSelected: {
    borderColor: MKColors.primaryGreen,
    backgroundColor: '#F0FDF4',
  },
  productThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#ECE6DC',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1C1E',
    flex: 1,
    marginRight: 6,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: MKColors.primaryGreen,
    borderColor: MKColors.primaryGreen,
  },
  productVariety: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  productDesc: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
    lineHeight: 15,
  },
  productMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceTagLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  priceTagVal: {
    fontSize: 12,
    fontWeight: '800',
    color: MKColors.primaryGreenDark,
  },
  unitPillsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  unitPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unitPillText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
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
    justifyContent: 'space-between',
  },
  bottomBarInfo: {
    flex: 1,
    marginRight: 12,
  },
  bottomBarCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  bottomBarSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MKColors.primaryGreen,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  continueBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
