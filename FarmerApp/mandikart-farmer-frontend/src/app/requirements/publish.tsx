/**
 * MandiKart Farmer App — Publish Requirement Screen (Screen 08)
 *
 * Route: /requirements/publish
 *
 * Confirms tender publication, explains supplier visibility, validates mandatory
 * fields, prevents duplicate submissions, and confirms publication status.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  Eye,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Package,
  IndianRupee,
  Users,
  Lock,
  ChevronRight,
  RefreshCw,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useRequirementsStore,
  calculateRequirementTotalBudget,
  ProcurementRequirement,
} from '@/store/requirementsStore';

export default function PublishRequirementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();

  const {
    activeDraft,
    getRequirementById,
    publishRequirement,
    publishRequirementById,
    clearActiveDraft,
  } = useRequirementsStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [publishedId, setPublishedId] = useState<string>('');

  // Target requirement: either from id query or current active draft
  const targetRequirement: Partial<ProcurementRequirement> | null = useMemo(() => {
    if (params.id) {
      const found = getRequirementById(params.id);
      if (found) return found;
    }
    if (activeDraft) {
      const products = activeDraft.products || [];
      const totalBudget = calculateRequirementTotalBudget(products);
      const totalQuantity = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
      return {
        id: activeDraft.draftId,
        draftId: activeDraft.draftId,
        title: activeDraft.title,
        procurementType: activeDraft.procurementType,
        urgency: activeDraft.urgency,
        status: 'DRAFT',
        products: activeDraft.products,
        totalQuantity,
        primaryUnit: activeDraft.products[0]?.unit || 'quintal',
        totalBudget,
        currency: 'INR',
        delivery: activeDraft.delivery,
        matchedSuppliersCount: 3,
        notes: activeDraft.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  }, [params.id, activeDraft, getRequirementById]);

  // Validation
  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (!targetRequirement) {
      issues.push('No requirement draft loaded to publish.');
      return issues;
    }

    if (!targetRequirement.products || targetRequirement.products.length === 0) {
      issues.push('At least one product must be selected.');
    } else {
      targetRequirement.products.forEach((p, idx) => {
        if (!p.quantity || p.quantity <= 0) {
          issues.push(`Product #${idx + 1} (${p.productName}) has invalid quantity.`);
        }
        if (!p.targetPricePerUnit || p.targetPricePerUnit <= 0) {
          issues.push(`Product #${idx + 1} (${p.productName}) must have a valid target price.`);
        }
      });
    }

    if (!targetRequirement.delivery?.destinationName?.trim()) {
      issues.push('Delivery destination name is required.');
    }
    if (!targetRequirement.delivery?.address?.trim()) {
      issues.push('Delivery address is required.');
    }
    if (!targetRequirement.delivery?.deliveryDate) {
      issues.push('Required delivery date is missing.');
    } else {
      const delDate = new Date(targetRequirement.delivery.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (delDate < today) {
        issues.push('Delivery date cannot be in the past.');
      }
    }

    return issues;
  }, [targetRequirement]);

  const isValid = validationIssues.length === 0;

  const handlePublish = async () => {
    if (!isValid) {
      Alert.alert('Cannot Publish Tender', validationIssues.join('\n'));
      return;
    }

    if (isSubmitting) return; // Prevent double submit
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      if (params.id) {
        const res = await publishRequirementById(params.id);
        if (res.success) {
          setPublishedId(params.id);
          setSuccessModalVisible(true);
        } else {
          setSubmissionError(res.error || 'Failed to publish requirement. Please try again.');
        }
      } else {
        const res = await publishRequirement();
        if (res.success && res.requirement) {
          setPublishedId(res.requirement.id);
          setSuccessModalVisible(true);
        } else {
          setSubmissionError(res.error || 'Failed to publish requirement. Please check connection.');
        }
      }
    } catch (err: any) {
      setSubmissionError(err?.message || 'Network error occurred. Your draft is safely preserved.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const topInset = Math.max(insets.top, 16);

  if (!targetRequirement) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={MKColors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Publish Requirement</Text>
        </View>
        <View style={styles.emptyCenter}>
          <AlertCircle size={44} color="#D97706" />
          <Text style={styles.emptyTitle}>No Draft Available to Publish</Text>
          <Text style={styles.emptySubtitle}>
            Please create a requirement draft first or select an existing draft from your dashboard.
          </Text>
          <Pressable
            style={styles.actionBtnPrimary}
            onPress={() => router.replace('/requirements' as any)}
          >
            <Text style={styles.actionBtnText}>Go to Requirements Hub</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const products = targetRequirement.products || [];
  const delivery = targetRequirement.delivery;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft size={22} color={MKColors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Publish Requirement</Text>
          <Text style={styles.headerSubtitle}>Tender ID: {targetRequirement.id || targetRequirement.draftId}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Supplier Visibility Explanation Card */}
        <View style={styles.visibilityCard}>
          <View style={styles.visibilityHeader}>
            <View style={styles.iconCircle}>
              <Eye size={20} color="#0284C7" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.visibilityTitle}>What Happens When You Publish?</Text>
              <Text style={styles.visibilitySubtitle}>
                Your requirement becomes a live tender across the verified MandiKart supplier network.
              </Text>
            </View>
          </View>

          <View style={styles.visibilityBulletRow}>
            <Users size={16} color={MKColors.primaryGreen} style={{ marginTop: 2, marginRight: 8 }} />
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>Eligible Suppliers Notified: </Text>
              Verified FPOs, aggregators, and commercial growers matching your crop and location will immediately receive notifications.
            </Text>
          </View>

          <View style={styles.visibilityBulletRow}>
            <ShieldCheck size={16} color={MKColors.primaryGreen} style={{ marginTop: 2, marginRight: 8 }} />
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>Escrow & Quality Safeguard: </Text>
              All incoming quotes must respect your specification grades and delivery constraints.
            </Text>
          </View>

          <View style={styles.visibilityBulletRow}>
            <Lock size={16} color={MKColors.primaryGreen} style={{ marginTop: 2, marginRight: 8 }} />
            <Text style={styles.bulletText}>
              <Text style={styles.bulletBold}>Farmer Contact Privacy: </Text>
              Your phone and exact farm details are only released to suppliers whose binding bids you choose to accept.
            </Text>
          </View>
        </View>

        {/* Validation Errors Box if any */}
        {!isValid && (
          <View style={styles.errorBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <AlertCircle size={18} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorBoxTitle}>Missing Mandatory Information</Text>
            </View>
            {validationIssues.map((issue, idx) => (
              <Text key={idx} style={styles.errorBoxItem}>• {issue}</Text>
            ))}
          </View>
        )}

        {/* Error Notification if publish API failed */}
        {submissionError && (
          <View style={styles.errorBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <AlertCircle size={18} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorBoxTitle}>Publishing Failed</Text>
            </View>
            <Text style={styles.errorBoxItem}>{submissionError}</Text>
            <Text style={[styles.errorBoxItem, { marginTop: 4, color: '#475569' }]}>
              Your data is saved safely in your local store. You can retry immediately.
            </Text>
          </View>
        )}

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionHeading}>Tender Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Title</Text>
            <Text style={styles.summaryValue}>{targetRequirement.title}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Category</Text>
            <Text style={styles.summaryValue}>{targetRequirement.procurementType?.replace('_', ' ')}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Urgency</Text>
            <View style={[styles.pill, targetRequirement.urgency === 'URGENT' ? styles.pillUrgent : styles.pillStandard]}>
              <Text style={[styles.pillText, targetRequirement.urgency === 'URGENT' ? styles.pillUrgentText : styles.pillStandardText]}>
                {targetRequirement.urgency}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Products List */}
          <Text style={styles.subHeading}>Products ({products.length})</Text>
          {products.map((p, idx) => (
            <View key={p.productId || idx} style={styles.productItemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName}>{p.productName}</Text>
                <Text style={styles.productSpecDetail}>
                  Variety: {p.variety || 'Standard'} • Grade: {p.grade || 'A'}
                </Text>
                <Text style={styles.productPricing}>
                  {p.quantity} {p.unit} @ ₹{p.targetPricePerUnit?.toLocaleString()}/{p.unit}
                </Text>
              </View>
              <Text style={styles.productTotalBudget}>
                ₹{p.totalBudget?.toLocaleString('en-IN')}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          {/* Grand Budget */}
          <View style={styles.grandBudgetRow}>
            <Text style={styles.grandBudgetLabel}>Total Target Budget</Text>
            <Text style={styles.grandBudgetValue}>
              ₹{(targetRequirement.totalBudget || 0).toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Delivery Snapshot */}
          <Text style={styles.subHeading}>Delivery Details</Text>
          <View style={styles.infoRow}>
            <Calendar size={15} color={MKColors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.infoText}>Required By: {delivery?.deliveryDate || 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={15} color={MKColors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.infoText} numberOfLines={2}>
              {delivery?.destinationName} — {delivery?.address}, {delivery?.city}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={[styles.publishBtn, (!isValid || isSubmitting) && styles.disabledBtn]}
          onPress={handlePublish}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.publishBtnText}>Confirm & Publish Live Tender</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <CheckCircle2 size={36} color="#15803D" />
            </View>
            <Text style={styles.modalTitle}>Tender Published Live! 🎉</Text>
            <Text style={styles.modalSubtitle}>
              Your requirement has been verified and registered on the supplier network under ID:
            </Text>
            <View style={styles.idChip}>
              <Text style={styles.idChipText}>{publishedId}</Text>
            </View>
            <Text style={styles.modalNote}>
              Eligible suppliers can now view specifications and submit binding quotes. You will be alerted when new quotes arrive.
            </Text>

            <View style={styles.modalBtnGroup}>
              <Pressable
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setSuccessModalVisible(false);
                  clearActiveDraft();
                  router.replace(`/requirements/${publishedId}` as any);
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>View Requirement Details</Text>
                <ChevronRight size={16} color="#FFFFFF" />
              </Pressable>

              <Pressable
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setSuccessModalVisible(false);
                  clearActiveDraft();
                  router.replace('/requirements' as any);
                }}
              >
                <Text style={styles.modalSecondaryBtnText}>Go to Dashboard</Text>
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
    fontSize: 18,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: MKColors.textSecondary,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  visibilityCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 16,
    gap: 12,
  },
  visibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  visibilitySubtitle: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
    lineHeight: 16,
  },
  visibilityBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 18,
  },
  bulletBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
  },
  errorBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  errorBoxItem: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 18,
  },
  summaryCard: {
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
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginBottom: 12,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: MKColors.textPrimary,
    marginTop: 6,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: MKColors.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    color: MKColors.textPrimary,
    fontWeight: '700',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillStandard: {
    backgroundColor: '#E2E8F0',
  },
  pillStandardText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  pillUrgent: {
    backgroundColor: '#FEE2E2',
  },
  pillUrgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  productItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  productSpecDetail: {
    fontSize: 11,
    color: MKColors.textSecondary,
    marginTop: 2,
  },
  productPricing: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    marginTop: 4,
  },
  productTotalBudget: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  grandBudgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  grandBudgetLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  grandBudgetValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803D',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoText: {
    fontSize: 12,
    color: MKColors.textPrimary,
    flex: 1,
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
  publishBtn: {
    backgroundColor: '#15803D',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledBtn: {
    backgroundColor: '#94A3B8',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: MKColors.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: MKColors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  idChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
  },
  idChipText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalNote: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  modalBtnGroup: {
    width: '100%',
    gap: 10,
  },
  modalPrimaryBtn: {
    backgroundColor: '#15803D',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSecondaryBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});
