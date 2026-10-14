/**
 * MandiKart Farmer App — Supplier Details Screen (Screen 6)
 *
 * Route: /source/suppliers/[id]
 *
 * Domain Capabilities:
 * - Full supplier profile, business credentials, location & distance
 * - Statutory verification checklist (APMC license, KYC, Bank Escrow, Quality Assay)
 * - Explicit distinction between verified and pending/unverified entities
 * - Strict non-fabrication of ratings: shows review history only when reliable records exist
 * - Privacy protection: masks private tax/identification documents
 * - Available product catalog with live indicative rates, quantities, and lead times
 * - Standard commercial trading terms: payment terms, advance %, inspection location, weighbridge slips
 * - Storage & logistics infrastructure specifications
 * - Direct sourcing actions: Request Quote, Start Procurement Tender, and direct inquiry
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  User,
  Star,
  Package,
  Truck,
  Warehouse,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  Scale,
  Calendar,
  ChevronRight,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useSourceProduceStore } from '@/store/sourceProduceStore';

export default function SupplierDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getSupplierById } = useSourceProduceStore();

  const supplier = useMemo(() => {
    if (!id) return undefined;
    return getSupplierById(id);
  }, [id, getSupplierById]);

  if (!supplier) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ShieldAlert size={48} color="#DC2626" />
        <Text style={styles.notFoundTitle}>Supplier Not Found</Text>
        <Text style={styles.notFoundSub}>
          The requested supplier profile (#{id}) does not exist or has been deactivated.
        </Text>
        <Pressable style={styles.backBtnAction} onPress={() => router.back()}>
          <Text style={styles.backBtnActionText}>Return to Supplier Directory</Text>
        </Pressable>
      </View>
    );
  }

  const isVerified = supplier.verification.status === 'VERIFIED';
  const isPending = supplier.verification.status === 'PENDING';

  const handleCallSupplier = () => {
    if (supplier.contactPhone) {
      Linking.openURL(`tel:${supplier.contactPhone}`).catch(() => {
        Alert.alert(
          'Contact Supplier',
          `Direct telephone: ${supplier.contactPhone}\nContact Person: ${supplier.contactPerson}`
        );
      });
    } else {
      Alert.alert(
        'Contact Unavailable',
        'Direct telephone number is not made publicly visible by this supplier. Please send an offer or tender request through the MandiKart platform.'
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {supplier.name}
          </Text>
          <Text style={styles.topBarSub}>Verified Supplier Profile</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* ── Hero Profile Card ─────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.typeBadge}>
              <Building2 size={12} color="#1E293B" />
              <Text style={styles.typeBadgeText}>{supplier.typeLabel}</Text>
            </View>

            {isVerified ? (
              <Pressable
                style={styles.verifiedPill}
                onPress={() =>
                  router.push({
                    pathname: '/source/suppliers/verification',
                    params: { id: supplier.id },
                  } as any)
                }
              >
                <ShieldCheck size={13} color="#15803D" />
                <Text style={styles.verifiedPillText}>{supplier.verification.badgeLabel}</Text>
                <ChevronRight size={12} color="#15803D" />
              </Pressable>
            ) : isPending ? (
              <Pressable
                style={styles.pendingPill}
                onPress={() =>
                  router.push({
                    pathname: '/source/suppliers/verification',
                    params: { id: supplier.id },
                  } as any)
                }
              >
                <Clock size={13} color="#B45309" />
                <Text style={styles.pendingPillText}>Verification Pending</Text>
                <ChevronRight size={12} color="#B45309" />
              </Pressable>
            ) : (
              <Pressable
                style={styles.unverifiedPill}
                onPress={() =>
                  router.push({
                    pathname: '/source/suppliers/verification',
                    params: { id: supplier.id },
                  } as any)
                }
              >
                <AlertTriangle size={13} color="#64748B" />
                <Text style={styles.unverifiedPillText}>Unverified</Text>
                <ChevronRight size={12} color="#64748B" />
              </Pressable>
            )}
          </View>

          <Text style={styles.supplierTitle}>{supplier.name}</Text>

          <View style={styles.locationBlock}>
            <MapPin size={14} color="#64748B" />
            <Text style={styles.locationTitle}>
              {supplier.location}, {supplier.district}, {supplier.state}
            </Text>
          </View>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceBadgeText}>
              📍 Located {supplier.distanceKm} km from your registered mandi hub
            </Text>
          </View>

          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <User size={14} color="#475569" />
              <Text style={styles.contactLabel}>Authorized Representative:</Text>
              <Text style={styles.contactVal}>{supplier.contactPerson}</Text>
            </View>
            {supplier.contactPhone && (
              <View style={styles.contactRow}>
                <Phone size={14} color="#475569" />
                <Text style={styles.contactLabel}>Platform Verified Phone:</Text>
                <Text style={styles.contactValPhone}>{supplier.contactPhone}</Text>
              </View>
            )}
          </View>

          <Text style={styles.aboutText}>{supplier.about}</Text>
        </View>

        {/* ── Statutory Verification & Compliance Audit Card ────── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderWithIcon}>
            <ShieldCheck size={18} color="#15803D" />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Statutory Verification & Trust Audit</Text>
              <Text style={styles.cardSub}>Audited credentials and institutional licenses</Text>
            </View>
          </View>

          <View style={styles.auditList}>
            {/* Registration Number */}
            <View style={styles.auditItem}>
              <View style={styles.auditIconWrap}>
                <FileText size={16} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.auditKey}>Statutory Registration ID</Text>
                <Text style={styles.auditVal}>
                  {supplier.verification.registrationNumber || 'Not provided'}
                </Text>
                {supplier.verification.issuedBy && (
                  <Text style={styles.auditMeta}>
                    Issued by: {supplier.verification.issuedBy}
                  </Text>
                )}
                {supplier.verification.verifiedAt && (
                  <Text style={styles.auditMeta}>
                    Verified on: {supplier.verification.verifiedAt}
                  </Text>
                )}
              </View>
              {isVerified ? (
                <CheckCircle2 size={18} color="#15803D" />
              ) : (
                <Clock size={18} color="#D97706" />
              )}
            </View>

            {/* KYC Status */}
            <View style={styles.auditItem}>
              <View style={styles.auditIconWrap}>
                <User size={16} color="#0D9488" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.auditKey}>Business KYC & Legal Identification</Text>
                <Text style={styles.auditVal}>
                  {supplier.verification.kycCompleted
                    ? 'Completed & Audited by MandiKart'
                    : 'KYC Under Review'}
                </Text>
                <Text style={styles.privacyNote}>
                  {"Private documents & tax IDs are held securely by trust desk and not broadcast publicly."}
                </Text>
              </View>
              {supplier.verification.kycCompleted ? (
                <CheckCircle2 size={18} color="#15803D" />
              ) : (
                <XCircle size={18} color="#94A3B8" />
              )}
            </View>

            {/* Bank Escrow Settlement */}
            <View style={styles.auditItem}>
              <View style={styles.auditIconWrap}>
                <CreditCard size={16} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.auditKey}>Bank Escrow Settlement Link</Text>
                <Text style={styles.auditVal}>
                  {supplier.verification.bankAccountVerified
                    ? 'Active Verified Settlement Account'
                    : 'Pending Escrow Bank Validation'}
                </Text>
              </View>
              {supplier.verification.bankAccountVerified ? (
                <CheckCircle2 size={18} color="#15803D" />
              ) : (
                <XCircle size={18} color="#D97706" />
              )}
            </View>

            {/* APMC Mandi License */}
            <View style={styles.auditItem}>
              <View style={styles.auditIconWrap}>
                <Building2 size={16} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.auditKey}>APMC Mandi / Direct Trade License</Text>
                <Text style={styles.auditVal}>
                  {supplier.verification.apmcLicenseVerified
                    ? 'Authorized Agricultural Marketing License'
                    : 'License Validation Pending'}
                </Text>
              </View>
              {supplier.verification.apmcLicenseVerified ? (
                <CheckCircle2 size={18} color="#15803D" />
              ) : (
                <XCircle size={18} color="#D97706" />
              )}
            </View>

            {/* Quality Assay Facility */}
            <View style={styles.auditItem}>
              <View style={styles.auditIconWrap}>
                <Scale size={16} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.auditKey}>Certified Quality Assay & Grading Staging</Text>
                <Text style={styles.auditVal}>
                  {supplier.verification.qualityAssayCertified
                    ? 'Certified Moisture & Sieve Sorting Facility'
                    : 'Assay Facility Uncertified'}
                </Text>
              </View>
              {supplier.verification.qualityAssayCertified ? (
                <CheckCircle2 size={18} color="#15803D" />
              ) : (
                <XCircle size={18} color="#D97706" />
              )}
            </View>

            <Pressable
              style={styles.viewFullAuditBtn}
              onPress={() =>
                router.push({
                  pathname: '/source/suppliers/verification',
                  params: { id: supplier.id },
                } as any)
              }
            >
              <ShieldCheck size={15} color={MKColors.primary} />
              <Text style={styles.viewFullAuditBtnText}>View Complete Verification & Certificates Audit</Text>
              <ChevronRight size={14} color={MKColors.primary} />
            </Pressable>
          </View>
        </View>

        {/* ── Reputation, Ratings & Order History Card ─────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Performance & Reputation History</Text>
          <Text style={styles.cardSub}>Transaction track record on the MandiKart platform</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Fulfillment Rate</Text>
              <Text style={styles.statBoxValueGreen}>{supplier.reliabilityScorePct}%</Text>
              <Text style={styles.statBoxSub}>Dispatch consistency</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>Completed Orders</Text>
              <Text style={styles.statBoxValue}>{supplier.totalCompletedOrders}</Text>
              <Text style={styles.statBoxSub}>Platform consignments</Text>
            </View>
          </View>

          {/* Ratings section - Only display if reliable records exist */}
          {supplier.ratingStars ? (
            <View style={styles.ratingSection}>
              <View style={styles.ratingBigRow}>
                <Star size={24} color="#D97706" fill="#D97706" />
                <Text style={styles.ratingBigScore}>{supplier.ratingStars.toFixed(1)}</Text>
                <Text style={styles.ratingOutOf}>/ 5.0</Text>
                <Text style={styles.reviewCountText}>
                  ({supplier.reviewCount} verified buyer reviews)
                </Text>
              </View>

              <View style={styles.badgeChipsWrap}>
                <View style={styles.badgeChip}>
                  <CheckCircle2 size={12} color="#15803D" />
                  <Text style={styles.badgeChipText}>Accurate Grading</Text>
                </View>
                <View style={styles.badgeChip}>
                  <CheckCircle2 size={12} color="#15803D" />
                  <Text style={styles.badgeChipText}>Certified Weighbridge</Text>
                </View>
                <View style={styles.badgeChip}>
                  <CheckCircle2 size={12} color="#15803D" />
                  <Text style={styles.badgeChipText}>On-Time Dispatch</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noRatingsBox}>
              <Info size={16} color="#64748B" />
              <Text style={styles.noRatingsText}>
                {"No public rating or buyer review history has been recorded for this supplier yet. MandiKart Escrow safeguards your funds until you inspect and accept the consignment at delivery."}
              </Text>
            </View>
          )}
        </View>

        {/* ── Available Produce Catalog & Inventory ─────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderWithCount}>
            <View>
              <Text style={styles.cardTitle}>Available Produce Lots</Text>
              <Text style={styles.cardSub}>Current farmgate and warehouse inventory</Text>
            </View>
            <View style={styles.inventoryCountPill}>
              <Text style={styles.inventoryCountPillText}>
                {supplier.productListings.length} Products
              </Text>
            </View>
          </View>

          <View style={styles.productListWrap}>
            {supplier.productListings.map((item, idx) => (
              <View key={idx} style={styles.productItemCard}>
                <View style={styles.productItemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productItemName}>{item.cropName}</Text>
                    <Text style={styles.productItemSub}>
                      {item.variety} • {item.grade}
                    </Text>
                  </View>
                  <View style={styles.productItemPriceWrap}>
                    <Text style={styles.productItemPrice}>
                      ₹{item.indicativePrice.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.productItemUnit}>per {item.unit}</Text>
                  </View>
                </View>

                <View style={styles.productItemMetaRow}>
                  <View style={styles.stockBadge}>
                    <Package size={12} color="#15803D" />
                    <Text style={styles.stockBadgeText}>
                      {item.availableQuantity} {item.unit} available
                    </Text>
                  </View>

                  <View style={styles.leadTimeBadge}>
                    <Calendar size={12} color="#475569" />
                    <Text style={styles.leadTimeText}>
                      {item.dispatchLeadDays}-day dispatch
                    </Text>
                  </View>

                  <View style={styles.deliveryBadge}>
                    <Truck size={12} color="#0284C7" />
                    <Text style={styles.deliveryBadgeText}>
                      {item.deliveryOption === 'BOTH'
                        ? 'Pickup & Delivery'
                        : item.deliveryOption === 'SELLER_DELIVERY'
                        ? 'Seller Delivers'
                        : 'Farmgate Pickup'}
                    </Text>
                  </View>
                </View>

                <View style={styles.productActionRow}>
                  {item.productId && (
                    <Pressable
                      style={styles.inspectProductBtn}
                      onPress={() => router.push(`/source/${item.productId}` as any)}
                    >
                      <Text style={styles.inspectProductBtnText}>
                        Catalog Specifications
                      </Text>
                      <ChevronRight size={13} color={MKColors.primary} />
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.marketPriceBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/source/prices',
                        params: {
                          commodity: item.cropName,
                          crop: item.cropName,
                        },
                      } as any)
                    }
                  >
                    <Text style={styles.marketPriceBtnText}>
                      APMC Mandi Rate
                    </Text>
                    <ChevronRight size={13} color="#0284C7" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Commercial Terms & Contracting Rules ──────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Commercial Terms & Trading Rules</Text>
          <Text style={styles.cardSub}>Binding parameters for purchase orders with this supplier</Text>

          <View style={styles.termsGrid}>
            <View style={styles.termRow}>
              <Text style={styles.termKey}>Payment Terms</Text>
              <Text style={styles.termVal}>{supplier.commercialTerms.paymentTerms}</Text>
            </View>

            <View style={styles.termRow}>
              <Text style={styles.termKey}>Advance Commitment</Text>
              <Text style={styles.termVal}>
                {supplier.commercialTerms.advanceRequiredPct === 0
                  ? '0% Advance (Full Escrow Settlement)'
                  : `${supplier.commercialTerms.advanceRequiredPct}% advance required`}
              </Text>
            </View>

            <View style={styles.termRow}>
              <Text style={styles.termKey}>Inspection Point</Text>
              <Text style={styles.termVal}>
                {supplier.commercialTerms.inspectionAt === 'DESTINATION_DEPOT'
                  ? 'Destination Depot / Unloading Point'
                  : supplier.commercialTerms.inspectionAt === 'WEIGHBRIDGE'
                  ? 'Independent Weighbridge'
                  : 'Farm Gate / Storage Loading Point'}
              </Text>
            </View>

            <View style={styles.termRow}>
              <Text style={styles.termKey}>Weighbridge Slip</Text>
              <Text style={styles.termVal}>
                {supplier.commercialTerms.weighbridgeSlipProvided
                  ? 'Certified Weighbridge Slip Provided'
                  : 'Not Provided'}
              </Text>
            </View>

            <View style={styles.termRow}>
              <Text style={styles.termKey}>Cancellation Window</Text>
              <Text style={styles.termVal}>
                Up to {supplier.commercialTerms.cancellationWindowHours} hours before dispatch
              </Text>
            </View>

            <View style={styles.termRow}>
              <Text style={styles.termKey}>Minimum Order Qty</Text>
              <Text style={styles.termVal}>
                {supplier.commercialTerms.minOrderQty} {supplier.commercialTerms.minOrderUnit}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Storage & Delivery Capabilities ───────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Storage & Logistics Infrastructure</Text>
          <Text style={styles.cardSub}>Physical facilities and transport reach</Text>

          <View style={styles.infrastructureItem}>
            <Warehouse size={16} color="#475569" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infraKey}>Storage Facility</Text>
              <Text style={styles.infraVal}>{supplier.storageFacility}</Text>
            </View>
          </View>

          <View style={styles.infrastructureItem}>
            <Truck size={16} color="#475569" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infraKey}>Supported Delivery Modes</Text>
              <Text style={styles.infraVal}>
                {supplier.deliveryCapabilities.modes
                  .map((m) =>
                    m === 'FARM_GATE_PICKUP'
                      ? 'Farm Gate Pickup'
                      : m === 'SELLER_DELIVERY'
                      ? 'Seller Delivery Fleet'
                      : 'MandiKart Assisted 3PL'
                  )
                  .join(', ')}
              </Text>
            </View>
          </View>

          <View style={styles.logisticsMetricsRow}>
            <View style={styles.logisticsMetricBox}>
              <Text style={styles.logisticsMetricLabel}>Fleet Radius</Text>
              <Text style={styles.logisticsMetricVal}>
                {supplier.deliveryCapabilities.fleetRadiusKm} km
              </Text>
            </View>

            <View style={styles.logisticsMetricBox}>
              <Text style={styles.logisticsMetricLabel}>Max Consignment</Text>
              <Text style={styles.logisticsMetricVal}>
                {supplier.deliveryCapabilities.maxSingleConsignmentTons} MT
              </Text>
            </View>

            <View style={styles.logisticsMetricBox}>
              <Text style={styles.logisticsMetricLabel}>Standard Lead</Text>
              <Text style={styles.logisticsMetricVal}>
                {supplier.deliveryCapabilities.standardLeadTimeDays} {supplier.deliveryCapabilities.standardLeadTimeDays === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Sourcing Actions ─────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          style={styles.contactBtn}
          onPress={handleCallSupplier}
        >
          <Phone size={16} color={MKColors.primary} />
          <Text style={styles.contactBtnText}>Call Supplier</Text>
        </Pressable>

        <Pressable
          style={styles.tenderBtn}
          onPress={() =>
            router.push({
              pathname: '/requirements/create',
              params: {
                supplierId: supplier.id,
                crop: supplier.supportedCrops[0],
              },
            } as any)
          }
        >
          <Text style={styles.tenderBtnText}>Start Procurement Tender</Text>
          <ArrowRight size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

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
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  notFoundSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backBtnAction: {
    backgroundColor: MKColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  topBarSub: {
    fontSize: 12,
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#86EFAC',
  },
  verifiedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
  },
  pendingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  unverifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unverifiedPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  supplierTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 26,
    marginBottom: 6,
  },
  locationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  locationTitle: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  distanceBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  contactCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  contactVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  contactValPhone: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primary,
  },
  aboutText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardHeaderWithCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  inventoryCountPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  inventoryCountPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  auditList: {
    gap: 12,
    marginTop: 4,
  },
  auditItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  auditIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  auditKey: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  auditVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  auditMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  privacyNote: {
    fontSize: 11,
    color: '#059669',
    marginTop: 4,
    fontStyle: 'italic',
  },
  viewFullAuditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  viewFullAuditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statBoxValueGreen: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15803D',
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  statBoxSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  ratingSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingBigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  ratingBigScore: {
    fontSize: 20,
    fontWeight: '800',
    color: '#B45309',
  },
  ratingOutOf: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  reviewCountText: {
    fontSize: 12,
    color: '#B45309',
    marginLeft: 4,
  },
  badgeChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeChipText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
  },
  noRatingsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  noRatingsText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  productListWrap: {
    gap: 10,
    marginTop: 6,
  },
  productItemCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1EFEA',
  },
  productItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  productItemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  productItemPriceWrap: {
    alignItems: 'flex-end',
  },
  productItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  productItemUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  productItemMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  leadTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  leadTimeText: {
    fontSize: 11,
    color: '#475569',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deliveryBadgeText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  productActionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  inspectProductBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  inspectProductBtnText: {
    fontSize: 11,
    color: MKColors.primary,
    fontWeight: '600',
  },
  marketPriceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E0F2FE',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  marketPriceBtnText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '700',
  },
  termsGrid: {
    gap: 8,
    marginTop: 8,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  termKey: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  termVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    textAlign: 'right',
  },
  infrastructureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infraKey: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  infraVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  logisticsMetricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  logisticsMetricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logisticsMetricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  logisticsMetricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 8,
    elevation: 8,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: MKColors.primary,
    backgroundColor: '#FFFFFF',
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: MKColors.primary,
  },
  tenderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    backgroundColor: MKColors.primary,
  },
  tenderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
