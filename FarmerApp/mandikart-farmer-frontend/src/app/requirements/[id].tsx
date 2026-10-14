/**
 * MandiKart Farmer App — Requirement Details Screen (Screen 09)
 *
 * Route: /requirements/[id]
 *
 * Displays full specification breakdown, status tracking, version history,
 * supplier response indicators, and status-aware actions (Edit, Cancel,
 * Publish, Recurring Schedule, Duplicate).
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Package,
  IndianRupee,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Edit3,
  Repeat,
  Send,
  Trash2,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useRequirementsStore,
  ProcurementRequirement,
  RequirementProduct,
} from '@/store/requirementsStore';

export default function RequirementDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    getRequirementById,
    duplicateRequirement,
    deleteRequirement,
    loadDraft,
    getRecurringScheduleByReqId,
  } = useRequirementsStore();

  const requirement = useMemo(() => {
    if (!id) return undefined;
    return getRequirementById(id);
  }, [id, getRequirementById]);

  const recurringSchedule = useMemo(() => {
    if (!id) return undefined;
    return getRecurringScheduleByReqId(id);
  }, [id, getRecurringScheduleByReqId]);

  const topInset = Math.max(insets.top, 16);

  if (!requirement) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={MKColors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Requirement Details</Text>
        </View>
        <View style={styles.emptyCenter}>
          <AlertTriangle size={48} color="#D97706" />
          <Text style={styles.emptyTitle}>Requirement Not Found</Text>
          <Text style={styles.emptySubtitle}>
            The requirement ID ({id}) could not be located in your local store or synchronized tenders.
          </Text>
          <Pressable
            style={styles.actionBtnPrimary}
            onPress={() => router.replace('/requirements' as any)}
          >
            <Text style={styles.actionBtnText}>Back to Dashboard</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const products = requirement.products || [];
  const delivery = requirement.delivery;
  const isDraft = requirement.status === 'DRAFT';
  const isOpen = requirement.status === 'OPEN' || requirement.status === 'MATCHED';
  const isCancelled = requirement.status === 'CANCELLED';
  const isFulfilled = requirement.status === 'FULFILLED';

  const handleDuplicate = () => {
    const newDraftId = duplicateRequirement(requirement.id);
    if (newDraftId) {
      Alert.alert(
        'Requirement Duplicated',
        `A copy has been initialized as draft ${newDraftId}. Would you like to edit it now?`,
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Edit New Draft',
            onPress: () => router.push('/requirements/create' as any),
          },
        ]
      );
    }
  };

  const handleDeleteDraft = () => {
    Alert.alert(
      'Delete Draft Tender?',
      'Are you sure you want to permanently delete this draft? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRequirement(requirement.id);
            router.replace('/requirements' as any);
          },
        },
      ]
    );
  };

  const handleResumeDraft = () => {
    loadDraft(requirement.draftId || requirement.id);
    router.push('/requirements/create' as any);
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={MKColors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {requirement.title}
          </Text>
          <Text style={styles.headerSubtitle}>Tender ID: {requirement.id}</Text>
        </View>
        <Pressable style={styles.headerActionBtn} onPress={handleDuplicate}>
          <Copy size={18} color={MKColors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View
          style={[
            styles.statusBanner,
            isDraft && styles.statusBannerDraft,
            isOpen && styles.statusBannerOpen,
            isCancelled && styles.statusBannerCancelled,
            isFulfilled && styles.statusBannerFulfilled,
          ]}
        >
          <View style={styles.statusBannerLeft}>
            {isDraft && <Clock size={20} color="#64748B" />}
            {isOpen && <CheckCircle2 size={20} color="#15803D" />}
            {isCancelled && <XCircle size={20} color="#DC2626" />}
            {isFulfilled && <ShieldCheck size={20} color="#0369A1" />}

            <View style={{ marginLeft: 10 }}>
              <Text
                style={[
                  styles.statusBannerTitle,
                  isDraft && { color: '#334155' },
                  isOpen && { color: '#14532D' },
                  isCancelled && { color: '#7F1D1D' },
                  isFulfilled && { color: '#0C4A6E' },
                ]}
              >
                {requirement.status === 'OPEN'
                  ? 'Live Tender — Open for Bids'
                  : requirement.status === 'MATCHED'
                  ? 'Active Matching & Supplier Bids'
                  : requirement.status === 'DRAFT'
                  ? 'Draft Tender (Unpublished)'
                  : requirement.status === 'CANCELLED'
                  ? 'Tender Cancelled'
                  : 'Contract Fulfilled'}
              </Text>
              <Text style={styles.statusBannerSubtitle}>
                Created: {new Date(requirement.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {requirement.version && requirement.version > 1 ? ` • Version v${requirement.version}` : ''}
              </Text>
            </View>
          </View>

          {requirement.version && requirement.version > 1 && (
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>v{requirement.version}</Text>
            </View>
          )}
        </View>

        {/* Cancellation Notice if Cancelled */}
        {isCancelled && (
          <View style={styles.cancellationNoticeCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <AlertTriangle size={16} color="#B91C1C" style={{ marginRight: 6 }} />
              <Text style={styles.cancellationNoticeTitle}>Cancellation Record</Text>
            </View>
            <Text style={styles.cancellationNoticeText}>
              <Text style={{ fontWeight: '700' }}>Reason: </Text>
              {requirement.cancellationReason || 'Cancelled by creator'}
            </Text>
            {requirement.cancellationNotes ? (
              <Text style={[styles.cancellationNoticeText, { marginTop: 2 }]}>
                <Text style={{ fontWeight: '700' }}>Notes: </Text>
                {requirement.cancellationNotes}
              </Text>
            ) : null}
            {requirement.cancelledAt ? (
              <Text style={[styles.cancellationNoticeText, { marginTop: 4, color: '#991B1B', fontSize: 11 }]}>
                Recorded on: {new Date(requirement.cancelledAt).toLocaleString('en-IN')}
              </Text>
            ) : null}
          </View>
        )}

        {/* Material Revision Notice if updated */}
        {requirement.materialChangeNotice ? (
          <View style={styles.revisionNoticeCard}>
            <Info size={16} color="#0369A1" style={{ marginRight: 6 }} />
            <Text style={styles.revisionNoticeText}>{requirement.materialChangeNotice}</Text>
          </View>
        ) : null}

        {/* Supplier Response & Matching Card (When active/open) */}
        {isOpen && (
          <View style={styles.supplierBidsCard}>
            <View style={styles.supplierBidsHeader}>
              <View style={styles.supplierIconCircle}>
                <Users size={20} color="#15803D" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.supplierBidsTitle}>
                  {requirement.matchedSuppliersCount || 3} Verified Suppliers Matching
                </Text>
                <Text style={styles.supplierBidsSubtitle}>
                  Suppliers in Nashik & Pune clusters have been matched with this tender.
                </Text>
              </View>
            </View>
            <View style={styles.supplierMetricsRow}>
              <View style={styles.supplierMetricCol}>
                <Text style={styles.supplierMetricVal}>3</Text>
                <Text style={styles.supplierMetricLbl}>Quotes Available</Text>
              </View>
              <View style={styles.supplierMetricDivider} />
              <View style={styles.supplierMetricCol}>
                <Text style={[styles.supplierMetricVal, { color: '#15803D' }]}>
                  ₹{(requirement.products[0]?.targetPricePerUnit || 2400) - 96}
                </Text>
                <Text style={styles.supplierMetricLbl}>Lowest Bid / Unit</Text>
              </View>
              <View style={styles.supplierMetricDivider} />
              <View style={styles.supplierMetricCol}>
                <Text style={styles.supplierMetricVal}>99%</Text>
                <Text style={styles.supplierMetricLbl}>Top Match Fit</Text>
              </View>
            </View>

            <Pressable
              style={styles.viewMatchesBtn}
              onPress={() => router.push(`/matching/matches?id=${requirement.id}` as any)}
            >
              <Text style={styles.viewMatchesBtnText}>View Matched Suppliers & Recommendations</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </Pressable>

            <Pressable
              style={[styles.viewMatchesBtn, { marginTop: 8, backgroundColor: '#0F172A' }]}
              onPress={() => router.push(`/offers/incoming?requirementId=${requirement.id}` as any)}
            >
              <Text style={styles.viewMatchesBtnText}>Review Supplier Offers & Negotiate</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {/* Recurring Schedule Link if attached */}
        {recurringSchedule && (
          <View style={styles.recurringActiveCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Repeat size={18} color="#2563EB" style={{ marginRight: 8 }} />
                <Text style={styles.recurringActiveTitle}>
                  Recurring Schedule: {recurringSchedule.frequency}
                </Text>
              </View>
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>{recurringSchedule.status}</Text>
              </View>
            </View>
            <Text style={styles.recurringActiveText}>
              Dispatches {recurringSchedule.quantityPerCycle} {recurringSchedule.unit} every {recurringSchedule.preferredDeliveryDay}.
              Next cycle: {recurringSchedule.nextDispatchDate}.
            </Text>
          </View>
        )}

        {/* Main Products Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Procurement Products ({products.length})</Text>

          {products.map((p, idx) => (
            <View key={p.productId || idx} style={styles.productBlock}>
              <View style={styles.productTop}>
                {p.imageUri ? (
                  <Image source={{ uri: p.imageUri }} style={styles.productThumb} />
                ) : (
                  <View style={styles.productThumbPlaceholder}>
                    <Package size={22} color={MKColors.textSecondary} />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.productTitle}>{p.productName}</Text>
                  <Text style={styles.productCategory}>{p.category} • {p.variety || 'Standard Variety'}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.specBadge}>
                      <Text style={styles.specBadgeText}>Grade: {p.grade || 'Grade A'}</Text>
                    </View>
                    {p.specifications?.organicCertified && (
                      <View style={[styles.specBadge, { backgroundColor: '#DCFCE7' }]}>
                        <Text style={[styles.specBadgeText, { color: '#166534' }]}>Organic Certified</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Volume & Budget Box */}
              <View style={styles.volumePriceBox}>
                <View style={styles.volCol}>
                  <Text style={styles.volLabel}>Required Volume</Text>
                  <Text style={styles.volVal}>{p.quantity} {p.unit}</Text>
                </View>
                <View style={styles.volCol}>
                  <Text style={styles.volLabel}>Target Price</Text>
                  <Text style={styles.volVal}>₹{p.targetPricePerUnit?.toLocaleString()}/{p.unit}</Text>
                </View>
                <View style={styles.volCol}>
                  <Text style={styles.volLabel}>Ceiling Cap</Text>
                  <Text style={styles.volVal}>
                    {p.maxCeilingPricePerUnit ? `₹${p.maxCeilingPricePerUnit}/${p.unit}` : 'None'}
                  </Text>
                </View>
                <View style={styles.volCol}>
                  <Text style={styles.volLabel}>Subtotal</Text>
                  <Text style={[styles.volVal, { color: '#15803D', fontWeight: '800' }]}>
                    ₹{p.totalBudget?.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Detailed Specs Grid */}
              <View style={styles.specsGrid}>
                {p.specifications?.sizeDiameter && (
                  <View style={styles.specGridItem}>
                    <Text style={styles.specItemKey}>Size / Caliber</Text>
                    <Text style={styles.specItemVal}>{p.specifications.sizeDiameter}</Text>
                  </View>
                )}
                {p.specifications?.moistureLevel && (
                  <View style={styles.specGridItem}>
                    <Text style={styles.specItemKey}>Moisture Level</Text>
                    <Text style={styles.specItemVal}>{p.specifications.moistureLevel}</Text>
                  </View>
                )}
                {p.specifications?.packaging && (
                  <View style={styles.specGridItem}>
                    <Text style={styles.specItemKey}>Packaging</Text>
                    <Text style={styles.specItemVal}>{p.specifications.packaging}</Text>
                  </View>
                )}
                {p.specifications?.sortingQuality && (
                  <View style={styles.specGridItem}>
                    <Text style={styles.specItemKey}>Quality Standard</Text>
                    <Text style={styles.specItemVal}>{p.specifications.sortingQuality}</Text>
                  </View>
                )}
                {p.specifications?.specialInstructions && (
                  <View style={[styles.specGridItem, { width: '100%' }]}>
                    <Text style={styles.specItemKey}>Special Handling Instructions</Text>
                    <Text style={styles.specItemVal}>{p.specifications.specialInstructions}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Grand Total Bar */}
          <View style={styles.grandTotalBar}>
            <View>
              <Text style={styles.grandTotalLabel}>Total Requirement Budget</Text>
              <Text style={styles.grandTotalSub}>
                {requirement.totalQuantity} {requirement.primaryUnit} total volume across {products.length} product(s)
              </Text>
            </View>
            <Text style={styles.grandTotalAmount}>
              ₹{requirement.totalBudget?.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Delivery Requirements Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Delivery & Fulfillment Logistics</Text>

          <View style={styles.detailRow}>
            <Calendar size={18} color={MKColors.textSecondary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Required Delivery Date</Text>
              <Text style={styles.detailValue}>
                {delivery?.deliveryDate}
                {delivery?.deliveryDateEnd ? ` to ${delivery.deliveryDateEnd}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={18} color={MKColors.textSecondary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Destination Depot</Text>
              <Text style={styles.detailValue}>{delivery?.destinationName}</Text>
              <Text style={styles.detailSub}>{delivery?.address}, {delivery?.city}, {delivery?.state} - {delivery?.pincode}</Text>
              {delivery?.landmark ? <Text style={styles.detailSub}>Landmark: {delivery.landmark}</Text> : null}
            </View>
          </View>

          <View style={styles.detailRow}>
            <Layers size={18} color={MKColors.textSecondary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Logistics Method</Text>
              <Text style={styles.detailValue}>
                {delivery?.logisticsPreference === 'BUYER_COLLECTION'
                  ? 'Buyer Arranges Pickup (Farmgate collection)'
                  : delivery?.logisticsPreference === 'MANDIKART_ASSISTED'
                  ? 'MandiKart 3PL Logistics Assisted'
                  : 'Seller Delivers to Depot'}
              </Text>
            </View>
          </View>

          {/* Site Constraints Tags */}
          <View style={{ marginTop: 8 }}>
            <Text style={styles.detailLabel}>Site Operational Constraints</Text>
            <View style={styles.constraintsRow}>
              {delivery?.weighbridgeSlipRequired && (
                <View style={styles.constraintChip}>
                  <Text style={styles.constraintChipText}>✓ Weighbridge Slip Mandatory</Text>
                </View>
              )}
              {delivery?.unloadingDockRequired && (
                <View style={styles.constraintChip}>
                  <Text style={styles.constraintChipText}>✓ Unloading Dock Access</Text>
                </View>
              )}
              {delivery?.constraints?.map((c, idx) => (
                <View key={idx} style={styles.constraintChip}>
                  <Text style={styles.constraintChipText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* General Contract Notes if provided */}
        {requirement.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Procurement Notes & Terms</Text>
            <Text style={styles.notesText}>{requirement.notes}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Dynamic Bottom Actions based on Status */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isDraft ? (
          <View style={styles.actionRow}>
            <Pressable style={styles.btnSecondary} onPress={handleDeleteDraft}>
              <Trash2 size={16} color="#DC2626" />
              <Text style={[styles.btnSecondaryText, { color: '#DC2626' }]}>Delete</Text>
            </Pressable>
            <Pressable style={styles.btnSecondary} onPress={handleResumeDraft}>
              <Edit3 size={16} color={MKColors.textPrimary} />
              <Text style={styles.btnSecondaryText}>Edit Draft</Text>
            </Pressable>
            <Pressable
              style={styles.btnPrimary}
              onPress={() => router.push(`/requirements/publish?id=${requirement.id}` as any)}
            >
              <Send size={16} color="#FFFFFF" />
              <Text style={styles.btnPrimaryText}>Publish Tender</Text>
            </Pressable>
          </View>
        ) : isOpen ? (
          <View style={styles.actionRow}>
            <Pressable
              style={styles.btnSecondary}
              onPress={() => router.push(`/requirements/cancel?id=${requirement.id}` as any)}
            >
              <XCircle size={16} color="#DC2626" />
              <Text style={[styles.btnSecondaryText, { color: '#DC2626' }]}>Cancel Tender</Text>
            </Pressable>
            <Pressable
              style={styles.btnSecondary}
              onPress={() => router.push(`/requirements/recurring?id=${requirement.id}` as any)}
            >
              <Repeat size={16} color="#2563EB" />
              <Text style={[styles.btnSecondaryText, { color: '#2563EB' }]}>Make Recurring</Text>
            </Pressable>
            <Pressable
              style={styles.btnPrimary}
              onPress={() => router.push(`/requirements/edit?id=${requirement.id}` as any)}
            >
              <Edit3 size={16} color="#FFFFFF" />
              <Text style={styles.btnPrimaryText}>Revise Tender</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <Pressable style={[styles.btnSecondary, { flex: 1 }]} onPress={handleDuplicate}>
              <Copy size={16} color={MKColors.textPrimary} />
              <Text style={styles.btnSecondaryText}>Duplicate into New Tender</Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, { flex: 1 }]}
              onPress={() => router.replace('/requirements' as any)}
            >
              <Text style={styles.btnPrimaryText}>Requirements Hub</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: MKColors.textSecondary,
    fontWeight: '600',
  },
  headerActionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusBannerOpen: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusBannerDraft: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  statusBannerCancelled: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusBannerFulfilled: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  statusBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusBannerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  versionBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  cancellationNoticeCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
  },
  cancellationNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B91C1C',
  },
  cancellationNoticeText: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 16,
  },
  revisionNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
  },
  revisionNoticeText: {
    fontSize: 12,
    color: '#0369A1',
    flex: 1,
    lineHeight: 16,
  },
  supplierBidsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supplierBidsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  supplierIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierBidsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  supplierBidsSubtitle: {
    fontSize: 11,
    color: MKColors.textSecondary,
    marginTop: 2,
  },
  supplierMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  supplierMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  supplierMetricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  supplierMetricLbl: {
    fontSize: 10,
    color: MKColors.textSecondary,
    marginTop: 2,
  },
  supplierMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  viewMatchesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
    gap: 6,
  },
  viewMatchesBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  recurringActiveCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  recurringActiveTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  activeTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
  },
  recurringActiveText: {
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginBottom: 12,
  },
  productBlock: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    marginBottom: 14,
  },
  productTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  productThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  productCategory: {
    fontSize: 11,
    color: MKColors.textSecondary,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  specBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  specBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  volumePriceBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  volCol: {
    flex: 1,
  },
  volLabel: {
    fontSize: 10,
    color: MKColors.textSecondary,
    fontWeight: '500',
  },
  volVal: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textPrimary,
    marginTop: 2,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  specGridItem: {
    width: '48%',
    backgroundColor: '#FAFAF9',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F5F5F4',
  },
  specItemKey: {
    fontSize: 10,
    color: '#78716C',
  },
  specItemVal: {
    fontSize: 12,
    fontWeight: '600',
    color: MKColors.textPrimary,
    marginTop: 2,
  },
  grandTotalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  grandTotalSub: {
    fontSize: 10,
    color: '#166534',
    marginTop: 1,
  },
  grandTotalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803D',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 11,
    color: MKColors.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.textPrimary,
    marginTop: 1,
  },
  detailSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    lineHeight: 15,
  },
  constraintsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  constraintChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  constraintChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  notesText: {
    fontSize: 13,
    color: MKColors.textPrimary,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimary: {
    flex: 2,
    backgroundColor: '#15803D',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: MKColors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  actionBtnPrimary: {
    backgroundColor: MKColors.primaryGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
