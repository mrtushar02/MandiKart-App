/**
 * MandiKart Farmer App — Product Details Screen (Screen 4)
 *
 * Route: /source/[id]
 *
 * Comprehensive Commercial Product View:
 * - Product hero imagery and gallery
 * - Full commercial terms: category, description, available varieties, quality grades, allowed units
 * - Complete physical specifications: size/diameter, moisture tolerance, packaging, storage condition
 * - Verified live APMC market price intelligence from backend when available (explicit placeholder when absent)
 * - Direct navigation to verified suppliers, market price history, and procurement tender creation
 * - Clear back navigation preserving prior search and filter state
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  TrendingUp,
  TrendingDown,
  MapPin,
  Info,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  Users,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useSourceProduceStore,
} from '@/store/sourceProduceStore';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getProductById, getLiveRateForCrop } = useSourceProduceStore();

  const product = useMemo(() => {
    if (!id) return undefined;
    return getProductById(id);
  }, [id, getProductById]);

  // Live APMC rate for this crop
  const liveRate = useMemo(() => {
    if (!product) return undefined;
    return getLiveRateForCrop(product.name);
  }, [product, getLiveRateForCrop]);

  if (!product) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <AlertCircle size={44} color="#DC2626" />
        <Text style={styles.notFoundTitle}>Product Not Found</Text>
        <Text style={styles.notFoundSub}>
          The requested commodity or seed catalog record (#{id}) could not be located.
        </Text>
        <Pressable style={styles.backBtnAction} onPress={() => router.back()}>
          <Text style={styles.backBtnActionText}>Return to Sourcing</Text>
        </Pressable>
      </View>
    );
  }

  const isRateUp = liveRate?.trendDirection === 'up';

  return (
    <View style={styles.container}>
      {/* ── Scrollable Detail Body ───────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* Hero Image Container with Floating Back Button */}
        <View style={styles.heroWrapper}>
          <Image source={{ uri: product.imageUri }} style={styles.heroImage} />
          <View style={styles.heroGradientOverlay} />

          <Pressable
            style={[styles.floatingBackBtn, { top: insets.top + 10 }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#0F172A" />
          </Pressable>

          <View style={[styles.floatingBadgeRow, { top: insets.top + 12 }]}>
            <View style={styles.catalogBadge}>
              <Text style={styles.catalogBadgeText}>CATALOG SPECIFICATION</Text>
            </View>
          </View>

          {/* Bottom Title Bar on Hero */}
          <View style={styles.heroBottomBar}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{product.category}</Text>
            </View>
            <Text style={styles.heroTitle}>{product.name}</Text>
            <View style={styles.originRow}>
              <MapPin size={12} color="#E2E8F0" />
              <Text style={styles.originText}>{product.originRegion}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentBody}>
          {/* ── Notice: Catalog Specification vs Binding Offer ──── */}
          <View style={styles.noticeCard}>
            <Info size={16} color="#1D4ED8" style={{ marginTop: 2 }} />
            <Text style={styles.noticeText}>
              This is a standard agricultural catalog specification. Verified suppliers will quote
              binding prices upon tender request.
            </Text>
          </View>

          {/* ── Real APMC Mandi Benchmark Rates ─────────────────── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Mandi Market Intelligence</Text>
                <Text style={styles.cardSub}>
                  {liveRate ? `Verified from ${liveRate.mandiName}` : 'Local APMC Reference'}
                </Text>
              </View>
              {liveRate && (
                <View
                  style={[
                    styles.trendBadge,
                    isRateUp ? styles.trendBadgeUp : styles.trendBadgeDown,
                  ]}
                >
                  {isRateUp ? (
                    <TrendingUp size={12} color="#15803D" />
                  ) : (
                    <TrendingDown size={12} color="#DC2626" />
                  )}
                  <Text
                    style={[
                      styles.trendBadgeText,
                      isRateUp ? { color: '#15803D' } : { color: '#DC2626' },
                    ]}
                  >
                    {liveRate.trendPct > 0 ? `+${liveRate.trendPct}%` : `${liveRate.trendPct}%`}
                  </Text>
                </View>
              )}
            </View>

            {liveRate ? (
              <View style={styles.rateGrid}>
                <View style={styles.rateStatBox}>
                  <Text style={styles.rateStatLabel}>Modal Benchmark Rate</Text>
                  <Text style={styles.rateStatValue}>
                    ₹{liveRate.modalPriceQtl.toLocaleString('en-IN')}
                    <Text style={styles.rateStatUnit}>/qtl</Text>
                  </Text>
                  <Text style={styles.rateStatKg}>
                    (approx. ₹{liveRate.modalPriceKg}/kg)
                  </Text>
                </View>

                <View style={styles.rateStatBox}>
                  <Text style={styles.rateStatLabel}>Daily APMC Range</Text>
                  <Text style={styles.rateStatValueRange}>
                    ₹{liveRate.minPriceQtl.toLocaleString('en-IN')} - ₹
                    {liveRate.maxPriceQtl.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.rateStatSub}>
                    Arrivals: {liveRate.arrivalQtl.toLocaleString('en-IN')} qtl
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.rateFallbackBox}>
                <View>
                  <Text style={styles.rateStatLabel}>Indicative Catalog Benchmark</Text>
                  <Text style={styles.rateStatValue}>
                    ₹{product.benchmarkPrice.toLocaleString('en-IN')}
                    <Text style={styles.rateStatUnit}>/{product.defaultUnit}</Text>
                  </Text>
                </View>
                <Text style={styles.rateFallbackNote}>
                  {"Real-time APMC feed pending today's trading session report."}
                </Text>
              </View>
            )}

            <Pressable
              style={styles.viewHistoryBtn}
              onPress={() =>
                router.push({
                  pathname: '/source/prices',
                  params: {
                    commodity: product.name,
                    crop: product.name,
                    productId: product.id,
                  },
                } as any)
              }
            >
              <Text style={styles.viewHistoryText}>View APMC Mandi Price Details & History</Text>
              <ChevronRight size={14} color={MKColors.primary} />
            </Pressable>
          </View>

          {/* ── Commercial Varieties & Grades ───────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Varieties & Quality Grades</Text>
            <Text style={styles.cardSub}>Supported agricultural trade classifications</Text>

            <View style={styles.termSection}>
              <Text style={styles.termLabel}>Supported Crop Varieties:</Text>
              <View style={styles.chipsWrap}>
                {product.availableVarieties.map((v, i) => (
                  <View key={i} style={styles.varietyChip}>
                    <Text style={styles.varietyChipText}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termLabel}>Available Quality Grades:</Text>
              <View style={styles.chipsWrap}>
                {product.availableGrades.map((g, i) => (
                  <View key={i} style={styles.gradeChip}>
                    <ShieldCheck size={12} color="#15803D" />
                    <Text style={styles.gradeChipText}>{g}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.termSection}>
              <Text style={styles.termLabel}>Permitted Trading Units:</Text>
              <View style={styles.chipsWrap}>
                {product.allowedUnits.map((u, i) => (
                  <View key={i} style={styles.unitChip}>
                    <Text style={styles.unitChipText}>{u}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── Detailed Technical Specifications ───────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Physical & Packaging Specifications</Text>
            <Text style={styles.cardSub}>Standard trading criteria for incoming consignments</Text>

            <View style={styles.specList}>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Size / Calibration</Text>
                <Text style={styles.specVal}>
                  {product.specifications.sizeDiameter || 'Specification not provided'}
                </Text>
              </View>

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Moisture Tolerance</Text>
                <Text style={styles.specVal}>
                  {product.specifications.moistureMax || 'Standard harvest moisture'}
                </Text>
              </View>

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Packaging Standard</Text>
                <Text style={styles.specVal}>
                  {product.specifications.packaging || 'Seller to specify in quote'}
                </Text>
              </View>

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Shelf Life / Freshness</Text>
                <Text style={styles.specVal}>
                  {product.specifications.shelfLifeDays
                    ? `${product.specifications.shelfLifeDays} days from dispatch`
                    : 'Variable based on storage temperature'}
                </Text>
              </View>

              <View style={styles.specRow}>
                <Text style={styles.specKey}>Storage Recommendations</Text>
                <Text style={styles.specVal}>
                  {product.specifications.storageCondition || 'Cool dry ambient ventilation'}
                </Text>
              </View>

              <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.specKey}>Minimum Purity</Text>
                <Text style={styles.specVal}>
                  {product.specifications.purityPct
                    ? `${product.specifications.purityPct}% machine cleaned`
                    : 'Standard fair-average quality'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Description ─────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Commodity Overview</Text>
            <Text style={styles.descText}>{product.description}</Text>
          </View>

          {/* ── Verified Supplier Pool Summary ──────────────────── */}
          <View style={styles.supplierCard}>
            <View style={styles.supplierCardTop}>
              <View style={styles.supplierIconWrap}>
                <Users size={22} color="#15803D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supplierCardTitle}>
                  {product.activeSuppliersCount} Verified Suppliers Available
                </Text>
                <Text style={styles.supplierCardSub}>
                  FPOs, aggregator hubs, and registered farmers actively listing this produce.
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.findSuppliersBtn}
              onPress={() =>
                router.push({
                  pathname: '/source/suppliers',
                  params: { crop: product.name, productId: product.id },
                } as any)
              }
            >
              <Text style={styles.findSuppliersBtnText}>Explore Available Suppliers</Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom CTA Bar ─────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          style={styles.btnSecondary}
          onPress={() =>
            router.push({
              pathname: '/source/suppliers',
              params: { crop: product.name, productId: product.id },
            } as any)
          }
        >
          <Building2 size={16} color={MKColors.primary} />
          <Text style={styles.btnSecondaryText}>Suppliers</Text>
        </Pressable>

        <Pressable
          style={styles.btnPrimary}
          onPress={() =>
            router.push({
              pathname: '/requirements/create',
              params: { productId: product.id },
            } as any)
          }
        >
          <Text style={styles.btnPrimaryText}>Start Procurement Tender</Text>
          <ArrowRight size={16} color="#FFFFFF" />
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
    padding: 24,
    backgroundColor: '#FAF8F5',
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  notFoundSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  backBtnAction: {
    backgroundColor: MKColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroWrapper: {
    height: 250,
    width: '100%',
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  floatingBackBtn: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 4,
  },
  floatingBadgeRow: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  catalogBadge: {
    backgroundColor: 'rgba(29, 78, 216, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catalogBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroBottomBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    gap: 4,
  },
  categoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  categoryPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  originText: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  contentBody: {
    padding: 16,
    gap: 14,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendBadgeUp: {
    backgroundColor: '#DCFCE7',
  },
  trendBadgeDown: {
    backgroundColor: '#FEE2E2',
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rateGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  rateStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rateStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  rateStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  rateStatValueRange: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  rateStatUnit: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
  },
  rateStatKg: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
    marginTop: 2,
  },
  rateStatSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  rateFallbackBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rateFallbackNote: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 6,
  },
  viewHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  viewHistoryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: MKColors.primary,
  },
  termSection: {
    marginTop: 12,
  },
  termLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  varietyChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  varietyChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  gradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  gradeChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
  },
  unitChip: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  unitChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E65100',
  },
  specList: {
    marginTop: 10,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specKey: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  specVal: {
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  descText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    marginTop: 6,
  },
  supplierCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  supplierCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  supplierIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supplierCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
  },
  supplierCardSub: {
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 16,
    marginTop: 2,
  },
  findSuppliersBtn: {
    backgroundColor: MKColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  findSuppliersBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.primary,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: MKColors.primary,
    height: 46,
    borderRadius: 10,
  },
  btnPrimaryText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
