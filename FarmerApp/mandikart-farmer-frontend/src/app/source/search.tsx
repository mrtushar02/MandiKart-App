/**
 * MandiKart Farmer App — Product Search Results Screen (Screen 3)
 *
 * Route: /source/search?q=...&category=...
 *
 * Displays full agricultural product catalog search results:
 * - Keyword search bar (preserves state across detail views)
 * - Category filter chips (All, Vegetables, Grains, Pulses, Oilseeds, Fruits, Inputs)
 * - Sort options: Relevance, Price (Low to High), Price (High to Low), Name (A-Z)
 * - Incremental loading / pagination
 * - Clearly distinguishes catalog product specifications from binding supplier offers
 * - Full loading, empty, and retry error states
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  MapPin,
  Check,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useSourceProduceStore,
} from '@/store/sourceProduceStore';

const CATEGORY_PILLS = [
  { id: 'all', label: 'All Products' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'grains', label: 'Grains & Cereals' },
  { id: 'pulses', label: 'Pulses' },
  { id: 'oilseeds', label: 'Oilseeds' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'inputs', label: 'Inputs & Seeds' },
];

type SortType = 'relevance' | 'price_low' | 'price_high' | 'name_asc';

export default function ProductSearchResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();

  const {
    products,
    selectedCategory,
    searchQuery,
    sortBy,
    currentPage,
    pageSize,
    isLoading,
    error,
    fetchCatalog,
    setSearchQuery,
    setSelectedCategory,
    setSortBy,
    loadMore,
    resetFilters,
  } = useSourceProduceStore();

  const [localQuery, setLocalQuery] = useState(params.q || searchQuery || '');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Sync params on initial mount
  useEffect(() => {
    if (params.q && params.q !== searchQuery) {
      setSearchQuery(params.q);
    }
    if (params.category && params.category !== selectedCategory) {
      setSelectedCategory(params.category);
    }
  }, [params.q, params.category, searchQuery, selectedCategory, setSearchQuery, setSelectedCategory]);

  const handleSearchSubmit = () => {
    setSearchQuery(localQuery.trim());
  };

  const handleClearQuery = () => {
    setLocalQuery('');
    setSearchQuery('');
  };

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }

    // Filter by query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const inName = p.name.toLowerCase().includes(q);
        const inCategory = p.category.toLowerCase().includes(q);
        const inVariety = p.defaultVariety.toLowerCase().includes(q);
        const inDesc = p.description.toLowerCase().includes(q);
        const inRegion = p.originRegion.toLowerCase().includes(q);
        return inName || inCategory || inVariety || inDesc || inRegion;
      });
    }

    // Sort
    if (sortBy === 'price_low') {
      list.sort((a, b) => a.benchmarkPrice - b.benchmarkPrice);
    } else if (sortBy === 'price_high') {
      list.sort((a, b) => b.benchmarkPrice - a.benchmarkPrice);
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Paginated visible slice
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, currentPage * pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const hasMore = visibleProducts.length < filteredProducts.length;

  const sortLabels: Record<SortType, string> = {
    relevance: 'Most Relevant',
    price_low: 'Price: Low to High',
    price_high: 'Price: High to Low',
    name_asc: 'Alphabetical (A - Z)',
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header with Integrated Search ─────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerSearchRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#0F172A" />
          </Pressable>

          <View style={styles.searchBarBox}>
            <Search size={16} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchTextInput}
              placeholder="Search produce, grains, seeds..."
              placeholderTextColor="#94A3B8"
              value={localQuery}
              onChangeText={setLocalQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {localQuery.length > 0 && (
              <Pressable onPress={handleClearQuery} hitSlop={8} style={styles.clearBtn}>
                <X size={15} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          <Pressable
            style={styles.sortBtn}
            onPress={() => setSortModalVisible(true)}
            hitSlop={8}
          >
            <SlidersHorizontal size={17} color="#334155" />
          </Pressable>
        </View>

        {/* ── Category Filter Pills Strip ───────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsScroll}
        >
          {CATEGORY_PILLS.map((pill) => {
            const isSelected = selectedCategory === pill.id;
            return (
              <Pressable
                key={pill.id}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(pill.id)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {pill.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Meta & Active Filter Bar ──────────────────────────── */}
      <View style={styles.metaBar}>
        <Text style={styles.metaCountText}>
          Showing <Text style={styles.metaCountBold}>{visibleProducts.length}</Text> of{' '}
          {filteredProducts.length} items
        </Text>

        <Pressable
          style={styles.activeSortTag}
          onPress={() => setSortModalVisible(true)}
        >
          <Text style={styles.activeSortText}>{sortLabels[sortBy]}</Text>
          <ChevronDown size={12} color="#475569" />
        </Pressable>
      </View>

      {/* ── Search Results List ───────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={MKColors.primary} />
            <Text style={styles.loadingText}>Searching agricultural catalog...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={36} color="#DC2626" />
            <Text style={styles.errorTitle}>Search request failed</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={fetchCatalog}>
              <RotateCcw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Retry Search</Text>
            </Pressable>
          </View>
        ) : visibleProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Search size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No products matched your search</Text>
            <Text style={styles.emptySub}>
              {`We couldn't find any commodities for "${searchQuery || selectedCategory}". Check your spelling or browse other agricultural categories.`}
            </Text>
            <Pressable style={styles.clearFiltersBtn} onPress={resetFilters}>
              <Text style={styles.clearFiltersBtnText}>Clear All Filters</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.productsList}>
              {visibleProducts.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.productCard}
                  onPress={() => router.push(`/source/${item.id}` as any)}
                >
                  <Image source={{ uri: item.imageUri }} style={styles.productThumb} />

                  <View style={styles.productDetails}>
                    {/* Catalog Spec Badge vs Supplier Offer Badge */}
                    <View style={styles.productBadgeRow}>
                      <View style={styles.catalogSpecBadge}>
                        <Text style={styles.catalogSpecBadgeText}>CATALOG SPECIFICATION</Text>
                      </View>
                      <View style={styles.categoryNameBadge}>
                        <Text style={styles.categoryNameBadgeText}>{item.category}</Text>
                      </View>
                    </View>

                    <Text style={styles.productTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.productVariety} numberOfLines={1}>
                      {item.defaultVariety} • {item.defaultGrade}
                    </Text>

                    <View style={styles.locationRow}>
                      <MapPin size={11} color="#64748B" />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {item.originRegion}
                      </Text>
                    </View>

                    <View style={styles.priceAndActionRow}>
                      <View>
                        <Text style={styles.priceLabel}>Benchmark Mandi Rate</Text>
                        <Text style={styles.priceValue}>
                          ₹{item.benchmarkPrice.toLocaleString('en-IN')}
                          <Text style={styles.priceUnit}>/{item.defaultUnit}</Text>
                        </Text>
                      </View>

                      <View style={styles.cardCTA}>
                        <Text style={styles.cardCTAText}>Details</Text>
                        <ArrowRight size={13} color="#FFFFFF" />
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Incremental Loading / Pagination */}
            {hasMore ? (
              <Pressable style={styles.loadMoreBtn} onPress={loadMore}>
                <Text style={styles.loadMoreText}>
                  Load More Products ({filteredProducts.length - visibleProducts.length} remaining)
                </Text>
              </Pressable>
            ) : filteredProducts.length > pageSize ? (
              <View style={styles.endOfResultsBox}>
                <Text style={styles.endOfResultsText}>
                  ✓ All {filteredProducts.length} verified commodities loaded
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* ── Sort Options Modal ─────────────────────────────────── */}
      <Modal visible={sortModalVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.sortModalSheet}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>Sort Products By</Text>
              <Pressable
                onPress={() => setSortModalVisible(false)}
                hitSlop={8}
              >
                <X size={18} color="#64748B" />
              </Pressable>
            </View>

            {(Object.keys(sortLabels) as SortType[]).map((key) => {
              const isSelected = sortBy === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.sortOptionRow, isSelected && styles.sortOptionRowActive]}
                  onPress={() => {
                    setSortBy(key);
                    setSortModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      isSelected && styles.sortOptionTextActive,
                    ]}
                  >
                    {sortLabels[key]}
                  </Text>
                  {isSelected && <Check size={18} color={MKColors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  sortBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPillsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: MKColors.primaryGreenSurface,
    borderColor: MKColors.primary,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: MKColors.primary,
    fontWeight: '800',
  },
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  metaCountText: {
    fontSize: 12,
    color: '#64748B',
  },
  metaCountBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  activeSortTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  activeSortText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  scrollContent: {
    padding: 16,
  },
  productsList: {
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  productThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  catalogSpecBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#BFDBFE',
  },
  catalogSpecBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.4,
  },
  categoryNameBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  categoryNameBadgeText: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#64748B',
  },
  productTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  productVariety: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  priceAndActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  priceLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  priceUnit: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
  },
  cardCTA: {
    backgroundColor: MKColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  cardCTAText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadMoreBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: MKColors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  loadMoreText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: MKColors.primary,
  },
  endOfResultsBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  endOfResultsText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991B1B',
    marginTop: 8,
  },
  errorSub: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
    marginBottom: 14,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  clearFiltersBtn: {
    backgroundColor: MKColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  clearFiltersBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sortModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sortModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sortOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sortOptionRowActive: {
    backgroundColor: MKColors.primaryGreenSurface,
  },
  sortOptionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: MKColors.primary,
    fontWeight: '800',
  },
});
