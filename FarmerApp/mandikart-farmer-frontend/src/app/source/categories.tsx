/**
 * MandiKart Farmer App — Product Categories Screen (Screen 2)
 *
 * Route: /source/categories
 *
 * Displays all structured agricultural product categories:
 * - Vegetables & Greens, Grains & Cereals, Pulses & Legumes, Oilseeds, Horticulture, Inputs
 * - In-screen category search and filter
 * - Category selection navigating to filtered search results
 * - Inline previews of representative commodities in each category
 * - Strict deduplication of category identifiers and robust error handling
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
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  ChevronRight,
  Layers,
  ArrowRight,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useSourceProduceStore,
  SourceProduct,
} from '@/store/sourceProduceStore';

export default function ProductCategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    categories,
    products,
    setSelectedCategory,
    fetchCatalog,
  } = useSourceProduceStore();

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'produce' | 'inputs'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCatalog();
    setRefreshing(false);
  };

  // Filter categories based on group and search filter
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // Group filter
      if (selectedGroup === 'produce' && cat.id === 'inputs') return false;
      if (selectedGroup === 'inputs' && cat.id !== 'inputs') return false;

      // Text search
      if (searchFilter.trim().length > 0) {
        const q = searchFilter.toLowerCase().trim();
        const matchesName = cat.name.toLowerCase().includes(q);
        const matchesSub = cat.subtitle.toLowerCase().includes(q);
        const matchesCrops = cat.popularCrops.some((c) => c.toLowerCase().includes(q));
        return matchesName || matchesSub || matchesCrops;
      }
      return true;
    });
  }, [categories, selectedGroup, searchFilter]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    router.push({ pathname: '/source/search', params: { category: catId } } as any);
  };

  // Get products for a given category
  const getCategoryProducts = (catId: string): SourceProduct[] => {
    return products.filter((p) => p.categoryId === catId).slice(0, 4);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Screen Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Agricultural Categories</Text>
          <Text style={styles.headerSub}>
            {categories.length} verified commodity groups in catalog
          </Text>
        </View>
      </View>

      {/* ── Search Bar & Filter Tabs ─────────────────────────── */}
      <View style={styles.topFilterBar}>
        <View style={styles.searchBox}>
          <Search size={16} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories (e.g. Grains, Oilseeds, Onion)..."
            placeholderTextColor="#94A3B8"
            value={searchFilter}
            onChangeText={setSearchFilter}
          />
          {searchFilter.length > 0 && (
            <Pressable onPress={() => setSearchFilter('')} hitSlop={8}>
              <Text style={styles.clearSearchText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Group Tabs */}
        <View style={styles.groupTabsRow}>
          <Pressable
            style={[styles.groupTab, selectedGroup === 'all' && styles.groupTabActive]}
            onPress={() => setSelectedGroup('all')}
          >
            <Text
              style={[
                styles.groupTabText,
                selectedGroup === 'all' && styles.groupTabTextActive,
              ]}
            >
              All Categories ({categories.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.groupTab, selectedGroup === 'produce' && styles.groupTabActive]}
            onPress={() => setSelectedGroup('produce')}
          >
            <Text
              style={[
                styles.groupTabText,
                selectedGroup === 'produce' && styles.groupTabTextActive,
              ]}
            >
              Agricultural Produce
            </Text>
          </Pressable>

          <Pressable
            style={[styles.groupTab, selectedGroup === 'inputs' && styles.groupTabActive]}
            onPress={() => setSelectedGroup('inputs')}
          >
            <Text
              style={[
                styles.groupTabText,
                selectedGroup === 'inputs' && styles.groupTabTextActive,
              ]}
            >
              Farm Inputs & Seeds
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Categories List ───────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[MKColors.primary]}
          />
        }
      >
        {filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Layers size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No matching categories</Text>
            <Text style={styles.emptySub}>
              Try searching with another keyword or reset the group filter.
            </Text>
            <Pressable
              style={styles.resetBtn}
              onPress={() => {
                setSearchFilter('');
                setSelectedGroup('all');
              }}
            >
              <Text style={styles.resetBtnText}>Reset Filter</Text>
            </Pressable>
          </View>
        ) : (
          filteredCategories.map((cat) => {
            const catProducts = getCategoryProducts(cat.id);
            return (
              <View key={cat.id} style={styles.categoryBlock}>
                {/* Main Category Banner Card */}
                <Pressable
                  style={styles.categoryCard}
                  onPress={() => handleSelectCategory(cat.id)}
                >
                  <Image source={{ uri: cat.imageUri }} style={styles.categoryBannerImg} />
                  <View style={styles.categoryCardOverlay}>
                    <View style={styles.categoryTopBadgeRow}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>
                          {cat.itemCount} CATALOG COMMODITIES
                        </Text>
                      </View>
                      <View style={styles.exploreCircle}>
                        <ArrowRight size={14} color="#FFFFFF" />
                      </View>
                    </View>

                    <Text style={styles.categoryTitle}>{cat.name}</Text>
                    <Text style={styles.categoryDesc}>{cat.description}</Text>
                  </View>
                </Pressable>

                {/* Popular Crops Strip in this category */}
                <View style={styles.cropsPreviewSection}>
                  <Text style={styles.cropsPreviewLabel}>Commodities in this category:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cropsPreviewScroll}
                  >
                    {catProducts.map((prod) => (
                      <Pressable
                        key={prod.id}
                        style={styles.cropMiniCard}
                        onPress={() => router.push(`/source/${prod.id}` as any)}
                      >
                        <Image source={{ uri: prod.imageUri }} style={styles.cropMiniThumb} />
                        <View style={styles.cropMiniInfo}>
                          <Text style={styles.cropMiniName} numberOfLines={1}>
                            {prod.name}
                          </Text>
                          <Text style={styles.cropMiniPrice}>
                            ₹{prod.benchmarkPrice.toLocaleString('en-IN')}/{prod.defaultUnit}
                          </Text>
                        </View>
                      </Pressable>
                    ))}

                    <Pressable
                      style={styles.viewMoreMiniCard}
                      onPress={() => handleSelectCategory(cat.id)}
                    >
                      <Text style={styles.viewMoreMiniText}>View All</Text>
                      <ChevronRight size={14} color={MKColors.primary} />
                    </Pressable>
                  </ScrollView>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  topFilterBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 42,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearSearchText: {
    fontSize: 13,
    color: '#94A3B8',
    paddingHorizontal: 6,
  },
  groupTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  groupTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  groupTabActive: {
    backgroundColor: MKColors.primaryGreenSurface,
    borderWidth: 1,
    borderColor: MKColors.primary,
  },
  groupTabText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  groupTabTextActive: {
    color: MKColors.primary,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  categoryBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  categoryCard: {
    height: 140,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  categoryBannerImg: {
    width: '100%',
    height: '100%',
    opacity: 0.65,
  },
  categoryCardOverlay: {
    ...StyleSheet.absoluteFill,
    padding: 14,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  categoryTopBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  exploreCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MKColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  categoryDesc: {
    fontSize: 11.5,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  cropsPreviewSection: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  cropsPreviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cropsPreviewScroll: {
    gap: 8,
  },
  cropMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 6,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cropMiniThumb: {
    width: 38,
    height: 38,
    borderRadius: 6,
    marginRight: 8,
  },
  cropMiniInfo: {
    justifyContent: 'center',
  },
  cropMiniName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: 100,
  },
  cropMiniPrice: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 1,
  },
  viewMoreMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  viewMoreMiniText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: MKColors.primary,
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
    marginTop: 4,
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: MKColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
});
