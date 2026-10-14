/**
 * MandiKart Farmer App — Source Produce Entry Screen (Screen 1)
 *
 * Route: /source (or /source/index)
 *
 * Core Farmer Entry Point for Sourcing & Supplier Discovery:
 * - Interactive search bar with immediate search navigation
 * - Category shortcuts with direct category filtering
 * - Popular high-demand agricultural commodities with verified specifications
 * - Live APMC market price ticker and highlights from backend
 * - Quick navigation to Search, Categories, Supplier Discovery, and Market Rates
 * - Full loading, empty, and error retry states
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Tag,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  PackageCheck,
  MapPin,
  Compass,
  Sprout,
  Users,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useSourceProduceStore,
} from '@/store/sourceProduceStore';

export default function SourceProduceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    products,
    categories,
    liveMandiRates,
    fetchCatalog,
    fetchLiveRates,
    isLoading,
    ratesLoading,
    error,
    setSelectedCategory,
    setSearchQuery,
  } = useSourceProduceStore();

  const [localSearch, setLocalSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCatalog();
    fetchLiveRates('Nashik');
  }, [fetchCatalog, fetchLiveRates]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCatalog(), fetchLiveRates('Nashik')]);
    setRefreshing(false);
  };

  const handleSearchSubmit = () => {
    const q = localSearch.trim();
    if (q) {
      setSearchQuery(q);
      router.push({ pathname: '/source/search', params: { q } } as any);
    } else {
      router.push('/source/search' as any);
    }
  };

  const handleCategoryPress = (catId: string) => {
    setSelectedCategory(catId);
    router.push({ pathname: '/source/search', params: { category: catId } } as any);
  };

  // Popular Produce (Top 6 non-input commodities)
  const popularProduce = useMemo(() => {
    return products.filter((p) => !p.isInput).slice(0, 6);
  }, [products]);

  // Essential Farm Inputs (Fertilizers & Seeds)
  const farmInputs = useMemo(() => {
    return products.filter((p) => p.isInput).slice(0, 3);
  }, [products]);

  // Live Rates Array
  const ratesList = useMemo(() => {
    return Object.values(liveMandiRates).slice(0, 6);
  }, [liveMandiRates]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.brandBadge}>
            <Compass size={14} color={MKColors.primary} />
            <Text style={styles.brandBadgeText}>PRODUCE SOURCING</Text>
          </View>
          <Text style={styles.headerTitle}>Source Agricultural Produce</Text>
          <Text style={styles.headerSubtitle}>
            Discover verified farmgate harvests, bulk seed lots, and direct suppliers
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[MKColors.primary]}
            tintColor={MKColors.primary}
          />
        }
      >
        {/* ── Search Bar Input ─────────────────────────────────── */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Search size={18} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Red Onion, Wheat, Sharbati, DAP..."
              placeholderTextColor="#94A3B8"
              value={localSearch}
              onChangeText={setLocalSearch}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {localSearch.length > 0 && (
              <Pressable onPress={() => setLocalSearch('')} hitSlop={8} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.searchActionBtn}
              onPress={handleSearchSubmit}
              hitSlop={6}
            >
              <ArrowRight size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* ── Quick Discovery Navigation Tiles ──────────────────── */}
        <View style={styles.quickNavRow}>
          <Pressable
            style={[styles.quickNavTile, { backgroundColor: '#E8F5E9' }]}
            onPress={() => router.push('/source/search' as any)}
          >
            <View style={[styles.quickNavIconWrap, { backgroundColor: '#C8E6C9' }]}>
              <Search size={18} color="#15803D" />
            </View>
            <Text style={styles.quickNavTitle}>Search Catalog</Text>
            <Text style={styles.quickNavSub}>All commodities</Text>
          </Pressable>

          <Pressable
            style={[styles.quickNavTile, { backgroundColor: '#FFF3E0' }]}
            onPress={() => router.push('/source/categories' as any)}
          >
            <View style={[styles.quickNavIconWrap, { backgroundColor: '#FFE0B2' }]}>
              <Layers size={18} color="#E65100" />
            </View>
            <Text style={styles.quickNavTitle}>Categories</Text>
            <Text style={styles.quickNavSub}>6 Agricultural groups</Text>
          </Pressable>

          <Pressable
            style={[styles.quickNavTile, { backgroundColor: '#EBF2FF' }]}
            onPress={() => router.push('/source/suppliers' as any)}
          >
            <View style={[styles.quickNavIconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Users size={18} color="#1D4ED8" />
            </View>
            <Text style={styles.quickNavTitle}>Find Suppliers</Text>
            <Text style={styles.quickNavSub}>FPOs & Growers</Text>
          </Pressable>

          <Pressable
            style={[styles.quickNavTile, { backgroundColor: '#F3E8FF' }]}
            onPress={() => router.push('/market-prices' as any)}
          >
            <View style={[styles.quickNavIconWrap, { backgroundColor: '#E9D5FF' }]}>
              <Tag size={18} color="#7E22CE" />
            </View>
            <Text style={styles.quickNavTitle}>Market Rates</Text>
            <Text style={styles.quickNavSub}>APMC live feeds</Text>
          </Pressable>
        </View>

        {/* ── Product Categories Shortcuts ──────────────────────── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Product Categories</Text>
            <Text style={styles.sectionSub}>Structured agricultural commodity groups</Text>
          </View>
          <Pressable
            onPress={() => router.push('/source/categories' as any)}
            style={styles.seeAllBtn}
            hitSlop={8}
          >
            <Text style={styles.seeAllText}>View All</Text>
            <ChevronRight size={14} color={MKColors.primary} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(cat.id)}
            >
              <Image source={{ uri: cat.imageUri }} style={styles.categoryCardImage} />
              <View style={styles.categoryCardOverlay}>
                <Text style={styles.categoryCardName} numberOfLines={1}>
                  {cat.name}
                </Text>
                <Text style={styles.categoryCardCount}>
                  {cat.itemCount} items listed
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Verified Live Mandi Rate Highlights ───────────────── */}
        <View style={styles.sectionHeader}>
          <View>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.livePulseDot} />
              <Text style={styles.sectionTitle}>Live Mandi Highlights</Text>
            </View>
            <Text style={styles.sectionSub}>
              Real AGMARKNET benchmark rates from nearby trading yards
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/market-prices' as any)}
            style={styles.seeAllBtn}
            hitSlop={8}
          >
            <Text style={styles.seeAllText}>All Mandis</Text>
            <ChevronRight size={14} color={MKColors.primary} />
          </Pressable>
        </View>

        {ratesLoading ? (
          <View style={styles.ratesLoadingBox}>
            <ActivityIndicator size="small" color={MKColors.primary} />
            <Text style={styles.ratesLoadingText}>Fetching live APMC price feeds...</Text>
          </View>
        ) : ratesList.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ratesScroll}
          >
            {ratesList.map((rate) => {
              const isUp = rate.trendDirection === 'up';
              return (
                <Pressable
                  key={rate.id}
                  style={styles.rateCard}
                  onPress={() => router.push('/market-prices' as any)}
                >
                  <View style={styles.rateCardTop}>
                    <View style={styles.rateMandiPill}>
                      <MapPin size={10} color="#64748B" />
                      <Text style={styles.rateMandiText} numberOfLines={1}>
                        {rate.mandiName}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.trendTag,
                        isUp ? styles.trendTagUp : styles.trendTagDown,
                      ]}
                    >
                      {isUp ? (
                        <TrendingUp size={11} color="#15803D" />
                      ) : (
                        <TrendingDown size={11} color="#DC2626" />
                      )}
                      <Text
                        style={[
                          styles.trendTagText,
                          isUp ? { color: '#15803D' } : { color: '#DC2626' },
                        ]}
                      >
                        {rate.trendPct > 0 ? `+${rate.trendPct}%` : `${rate.trendPct}%`}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.rateCropName}>{rate.cropName}</Text>
                  <Text style={styles.rateVarietyText}>{rate.variety} • {rate.grade}</Text>

                  <View style={styles.ratePriceRow}>
                    <Text style={styles.ratePriceModal}>
                      ₹{rate.modalPriceQtl.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.ratePriceUnit}>/ quintal</Text>
                  </View>

                  <View style={styles.rateFooter}>
                    <Text style={styles.rateArrivals}>
                      Arrivals: {rate.arrivalQtl.toLocaleString('en-IN')} qtl
                    </Text>
                    <Text style={styles.rateTimestamp}>{rate.updatedTime}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyRatesBox}>
            <Text style={styles.emptyRatesText}>
              {"Live APMC prices updating for today's market session."}
            </Text>
          </View>
        )}

        {/* ── Popular Produce (High Demand Farmgate Commodities) ── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Popular Agricultural Produce</Text>
            <Text style={styles.sectionSub}>Available for procurement & supplier matching</Text>
          </View>
          <Pressable
            onPress={() => router.push('/source/search' as any)}
            style={styles.seeAllBtn}
            hitSlop={8}
          >
            <Text style={styles.seeAllText}>Explore All</Text>
            <ChevronRight size={14} color={MKColors.primary} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={MKColors.primary} />
            <Text style={styles.loadingText}>Loading verified agricultural catalog...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={32} color="#DC2626" />
            <Text style={styles.errorTitle}>Could not load catalog</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={onRefresh}>
              <RefreshCw size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Retry Connection</Text>
            </Pressable>
          </View>
        ) : popularProduce.length === 0 ? (
          <View style={styles.emptyBox}>
            <Sprout size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No commodities found</Text>
            <Text style={styles.emptySub}>Pull down to refresh catalog from database.</Text>
          </View>
        ) : (
          <View style={styles.produceGrid}>
            {popularProduce.map((item) => (
              <Pressable
                key={item.id}
                style={styles.produceCard}
                onPress={() => router.push(`/source/${item.id}` as any)}
              >
                <Image source={{ uri: item.imageUri }} style={styles.produceImage} />
                <View style={styles.produceCardBadge}>
                  <Text style={styles.produceCardBadgeText}>{item.category}</Text>
                </View>

                <View style={styles.produceCardBody}>
                  <Text style={styles.produceName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.produceVariety} numberOfLines={1}>
                    {item.defaultVariety} • {item.defaultGrade}
                  </Text>

                  <View style={styles.producePriceRow}>
                    <Text style={styles.producePriceLabel}>Benchmark Rate</Text>
                    <Text style={styles.producePriceValue}>
                      ₹{item.benchmarkPrice.toLocaleString('en-IN')}
                      <Text style={styles.producePriceUnit}>/{item.defaultUnit}</Text>
                    </Text>
                  </View>

                  <View style={styles.produceFooter}>
                    <View style={styles.supplierCountBadge}>
                      <ShieldCheck size={12} color="#15803D" />
                      <Text style={styles.supplierCountText}>
                        {item.activeSuppliersCount} suppliers
                      </Text>
                    </View>
                    <View style={styles.viewDetailLink}>
                      <Text style={styles.viewDetailText}>Details</Text>
                      <ArrowRight size={12} color={MKColors.primary} />
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Sourcing Seeds & Collective Inputs ───────────────── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Farm Inputs & Hybrid Seeds</Text>
            <Text style={styles.sectionSub}>Bulk cooperative orders & subsidized inputs</Text>
          </View>
          <Pressable
            onPress={() => handleCategoryPress('inputs')}
            style={styles.seeAllBtn}
            hitSlop={8}
          >
            <Text style={styles.seeAllText}>View All</Text>
            <ChevronRight size={14} color={MKColors.primary} />
          </Pressable>
        </View>

        <View style={styles.inputsList}>
          {farmInputs.map((input) => (
            <Pressable
              key={input.id}
              style={styles.inputCard}
              onPress={() => router.push(`/source/${input.id}` as any)}
            >
              <Image source={{ uri: input.imageUri }} style={styles.inputThumb} />
              <View style={styles.inputInfo}>
                <View style={styles.inputBadgeRow}>
                  <View style={styles.inputCategoryTag}>
                    <Text style={styles.inputCategoryText}>COOPERATIVE INTAKE</Text>
                  </View>
                </View>
                <Text style={styles.inputTitle}>{input.name}</Text>
                <Text style={styles.inputDesc} numberOfLines={1}>
                  {input.description}
                </Text>
                <View style={styles.inputPriceRow}>
                  <Text style={styles.inputPrice}>
                    ₹{input.benchmarkPrice.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.inputUnit}>/{input.defaultUnit}</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </Pressable>
          ))}
        </View>

        {/* ── Procurement Tender Callout ────────────────────────── */}
        <View style={styles.tenderCalloutCard}>
          <View style={styles.tenderCalloutHeader}>
            <View style={styles.tenderIconBadge}>
              <PackageCheck size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.tenderCalloutTitle}>Need Large Volumes?</Text>
              <Text style={styles.tenderCalloutSub}>
                Publish a Bulk Procurement tender to get competitive quotes from multiple verified suppliers.
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.tenderCalloutBtn}
            onPress={() => router.push('/requirements/create' as any)}
          >
            <Text style={styles.tenderCalloutBtnText}>Create Procurement Requirement</Text>
            <ArrowRight size={14} color="#FFFFFF" />
          </Pressable>
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    gap: 4,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: MKColors.primary,
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchSection: {
    marginBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearBtn: {
    paddingHorizontal: 8,
  },
  clearBtnText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  searchActionBtn: {
    backgroundColor: MKColors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  quickNavRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  quickNavTile: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  quickNavIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickNavTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickNavSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  seeAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: MKColors.primary,
  },
  categoryScroll: {
    gap: 10,
    paddingBottom: 16,
  },
  categoryCard: {
    width: 140,
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
    opacity: 0.72,
  },
  categoryCardOverlay: {
    ...StyleSheet.absoluteFill,
    padding: 10,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  categoryCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  categoryCardCount: {
    fontSize: 10.5,
    color: '#E2E8F0',
    marginTop: 2,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#15803D',
  },
  ratesLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  ratesLoadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  ratesScroll: {
    gap: 10,
    paddingBottom: 16,
  },
  rateCard: {
    width: 195,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  rateCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rateMandiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 110,
  },
  rateMandiText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  trendTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendTagUp: {
    backgroundColor: '#DCFCE7',
  },
  trendTagDown: {
    backgroundColor: '#FEE2E2',
  },
  trendTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rateCropName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  rateVarietyText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    marginBottom: 6,
  },
  ratePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 6,
  },
  ratePriceModal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  ratePriceUnit: {
    fontSize: 11,
    color: '#64748B',
  },
  rateFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateArrivals: {
    fontSize: 10,
    color: '#64748B',
  },
  rateTimestamp: {
    fontSize: 9,
    color: '#94A3B8',
  },
  emptyRatesBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  emptyRatesText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  produceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  produceCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  produceImage: {
    width: '100%',
    height: 115,
  },
  produceCardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  produceCardBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  produceCardBody: {
    padding: 10,
  },
  produceName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  produceVariety: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 6,
  },
  producePriceRow: {
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  producePriceLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },
  producePriceValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 1,
  },
  producePriceUnit: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '400',
  },
  produceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  supplierCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  supplierCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
  },
  viewDetailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: MKColors.primary,
  },
  inputsList: {
    gap: 10,
    marginBottom: 20,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputThumb: {
    width: 54,
    height: 54,
    borderRadius: 8,
    marginRight: 12,
  },
  inputInfo: {
    flex: 1,
  },
  inputBadgeRow: {
    marginBottom: 2,
  },
  inputCategoryTag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  inputCategoryText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E65100',
  },
  inputTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  inputDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  inputPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 3,
  },
  inputPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  inputUnit: {
    fontSize: 10.5,
    color: '#64748B',
  },
  tenderCalloutCard: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    padding: 16,
    marginTop: 6,
    marginBottom: 10,
  },
  tenderCalloutHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  tenderIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenderCalloutTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tenderCalloutSub: {
    fontSize: 12,
    color: '#BFDBFE',
    lineHeight: 16,
    marginTop: 2,
  },
  tenderCalloutBtn: {
    backgroundColor: MKColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tenderCalloutBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  errorBox: {
    padding: 24,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
    marginTop: 8,
  },
  errorSub: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});
