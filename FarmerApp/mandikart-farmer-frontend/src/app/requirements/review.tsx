/**
 * MandiKart Farmer App — Review Requirement Screen (Screen 7 / Step 6)
 *
 * Route: /requirements/review
 *
 * Features:
 * - Comprehensive structured summary of all entered information
 * - Editable sections (in-place 'Edit' buttons return directly to that step)
 * - Non-destructive: form state is preserved completely
 * - Validation engine highlights any missing or incomplete parameters
 * - Save Draft & Publish Requirement actions
 * - Post-Publish Celebration Modal with new Requirement ID & direct dashboard handoff
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  Truck,
  IndianRupee,
  Layers,
  Edit3,
  Bookmark,
  Send,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Package,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useRequirementsStore,
  calculateRequirementTotalBudget,
  ProcurementRequirement,
} from '@/store/requirementsStore';
import { RequirementStepHeader } from '@/components/requirements/RequirementStepHeader';

export default function ReviewRequirementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    activeDraft,
    saveDraft,
    publishRequirement,
    clearActiveDraft,
  } = useRequirementsStore();

  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [publishedSuccessModal, setPublishedSuccessModal] = useState(false);
  const [publishedItem, setPublishedItem] = useState<ProcurementRequirement | null>(null);

  if (!activeDraft) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <RequirementStepHeader
          currentStep={6}
          stepTitle="Review Requirement"
          subtitle="No active draft found"
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No requirement draft currently loaded.</Text>
          <Pressable
            style={styles.backDashboardBtn}
            onPress={() => router.replace('/requirements' as any)}
          >
            <Text style={styles.backDashboardBtnText}>Go to Requirements Dashboard</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const products = activeDraft.products || [];
  const delivery = activeDraft.delivery;
  const totalBudget = calculateRequirementTotalBudget(products);
  const totalQuantity = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const primaryUnit = products[0]?.unit || 'quintal';

  // Validation Checks
  const hasProducts = products.length > 0;
  const hasValidDestination = !!delivery.destinationName?.trim() && !!delivery.address?.trim();
  const hasValidDate = !!delivery.deliveryDate?.trim();
  const isFormComplete = hasProducts && hasValidDestination && hasValidDate;

  // Save Draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    const res = await saveDraft();
    setIsSavingDraft(false);
    if (res.success) {
      Alert.alert(
        'Draft Saved! 💾',
        `Your requirement draft has been safely saved in the store (${activeDraft.draftId}). You can resume anytime.`,
        [
          { text: 'Stay Here', style: 'cancel' },
          { text: 'Go to Dashboard', onPress: () => router.replace('/requirements' as any) },
        ]
      );
    }
  };

  // Publish Requirement
  const handlePublish = () => {
    if (!isFormComplete) {
      Alert.alert(
        'Incomplete Requirement',
        'Please complete all required sections before publishing.'
      );
      return;
    }
    router.push('/requirements/publish' as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Wizard Header ─────────────────────────────────────── */}
      <RequirementStepHeader
        currentStep={6}
        stepTitle="Review & Publish"
        subtitle="Verify all specifications before publishing to suppliers & FPOs"
        onSaveDraft={handleSaveDraft}
        isSavingDraft={isSavingDraft}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Validation Status Banner ──────────────────────────── */}
        {isFormComplete ? (
          <View style={styles.validBanner}>
            <CheckCircle2 size={18} color="#15803D" />
            <Text style={styles.validBannerText}>
              All sections verified. Ready to publish to verified suppliers.
            </Text>
          </View>
        ) : (
          <View style={styles.invalidBanner}>
            <AlertTriangle size={18} color="#B45309" />
            <Text style={styles.invalidBannerText}>
              Incomplete details: {!hasProducts ? 'Add products. ' : ''}
              {!hasValidDestination ? 'Add delivery address. ' : ''}
            </Text>
          </View>
        )}

        {/* ── Overview Header Card ──────────────────────────────── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardHeader}>
            <View>
              <Text style={styles.summaryDraftId}>
                {activeDraft.draftId} • {activeDraft.procurementType.replace('_', ' ')}
              </Text>
              <Text style={styles.summaryTitle}>{activeDraft.title}</Text>
            </View>
            <View style={styles.urgencyPill}>
              <Text style={styles.urgencyPillText}>{activeDraft.urgency}</Text>
            </View>
          </View>

          {activeDraft.notes ? (
            <Text style={styles.summaryNotes}>"{activeDraft.notes}"</Text>
          ) : null}
        </View>

        {/* ── SECTION 1: Products & Specifications ──────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Package size={18} color={MKColors.primaryGreen} />
              <Text style={styles.sectionHeading}>
                Products & Specifications ({products.length})
              </Text>
            </View>
            <Pressable
              style={styles.editBtn}
              onPress={() => router.push('/requirements/select-products')}
            >
              <Edit3 size={13} color={MKColors.primaryGreenDark} />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>

          {products.map((p, idx) => (
            <View key={p.productId} style={styles.productReviewItem}>
              <View style={styles.prodReviewTitleRow}>
                <Text style={styles.prodReviewName}>
                  {idx + 1}. {p.productName} ({p.grade})
                </Text>
                <Text style={styles.prodReviewCat}>{p.category}</Text>
              </View>

              <View style={styles.specsList}>
                <Text style={styles.specLine}>
                  • Variety:{' '}
                  <Text style={styles.specLineBold}>{p.variety || 'Standard'}</Text>
                </Text>

                {p.specifications.sizeDiameter && (
                  <Text style={styles.specLine}>
                    • Size / Diameter:{' '}
                    <Text style={styles.specLineBold}>{p.specifications.sizeDiameter}</Text>
                  </Text>
                )}

                {p.specifications.moistureLevel && (
                  <Text style={styles.specLine}>
                    • Moisture Limit:{' '}
                    <Text style={styles.specLineBold}>{p.specifications.moistureLevel}</Text>
                  </Text>
                )}

                {p.specifications.packaging && (
                  <Text style={styles.specLine}>
                    • Packaging:{' '}
                    <Text style={styles.specLineBold}>{p.specifications.packaging}</Text>
                  </Text>
                )}

                {p.specifications.organicCertified && (
                  <Text style={[styles.specLine, { color: '#15803D' }]}>
                    • Certification: <Text style={styles.specLineBold}>NPOP Certified Organic</Text>
                  </Text>
                )}

                {p.specifications.specialInstructions && (
                  <Text style={styles.specLine}>
                    • Quality Note:{' '}
                    <Text style={styles.specLineBold}>{p.specifications.specialInstructions}</Text>
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* ── SECTION 2: Quantities, Prices & Budget ────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <IndianRupee size={18} color={MKColors.primaryGreen} />
              <Text style={styles.sectionHeading}>Quantity & Total Budget</Text>
            </View>
            <Pressable
              style={styles.editBtn}
              onPress={() => router.push('/requirements/quantity-budget')}
            >
              <Edit3 size={13} color={MKColors.primaryGreenDark} />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>

          {products.map((p) => (
            <View key={p.productId} style={styles.budgetRow}>
              <View>
                <Text style={styles.budgetProdName}>{p.productName}</Text>
                <Text style={styles.budgetQty}>
                  {p.quantity.toLocaleString()} {p.unit} @ ₹{p.targetPricePerUnit.toLocaleString('en-IN')}/{p.unit}
                </Text>
              </View>
              <Text style={styles.budgetSubtotal}>
                ₹{p.totalBudget.toLocaleString('en-IN')}
              </Text>
            </View>
          ))}

          <View style={styles.grandTotalDivider} />

          <View style={styles.grandTotalRow}>
            <View>
              <Text style={styles.grandTotalLabel}>TOTAL ESTIMATED BUDGET</Text>
              <Text style={styles.grandTotalQuantity}>
                {totalQuantity.toLocaleString()} {primaryUnit} combined
              </Text>
            </View>
            <Text style={styles.grandTotalAmount}>
              ₹{totalBudget.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* ── SECTION 3: Delivery & Logistics ───────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Truck size={18} color={MKColors.primaryGreen} />
              <Text style={styles.sectionHeading}>Delivery & Logistics Terms</Text>
            </View>
            <Pressable
              style={styles.editBtn}
              onPress={() => router.push('/requirements/delivery')}
            >
              <Edit3 size={13} color={MKColors.primaryGreenDark} />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.deliveryReviewItem}>
            <Calendar size={15} color="#4B5563" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.deliveryReviewLabel}>Target Delivery Date</Text>
              <Text style={styles.deliveryReviewVal}>{delivery.deliveryDate}</Text>
            </View>
          </View>

          <View style={styles.deliveryReviewItem}>
            <MapPin size={15} color="#4B5563" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.deliveryReviewLabel}>Destination Depot</Text>
              <Text style={styles.deliveryReviewVal}>
                {delivery.destinationName} ({delivery.destinationType.replace('_', ' ')})
              </Text>
              <Text style={styles.deliveryReviewSub}>
                {delivery.address}, {delivery.city}, {delivery.state} - {delivery.pincode}
              </Text>
            </View>
          </View>

          <View style={styles.deliveryReviewItem}>
            <Truck size={15} color="#4B5563" />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.deliveryReviewLabel}>Logistics Arrangement</Text>
              <Text style={styles.deliveryReviewVal}>
                {delivery.logisticsPreference === 'MANDIKART_ASSISTED'
                  ? 'MandiKart Assisted Logistics Fleet'
                  : delivery.logisticsPreference === 'BUYER_COLLECTION'
                  ? 'Buyer Arranges Pickup (Ex-Farmgate)'
                  : 'Seller / FPO Delivers to Depot'}
              </Text>
            </View>
          </View>

          <View style={styles.constraintsRow}>
            {delivery.weighbridgeSlipRequired && (
              <View style={styles.constraintBadge}>
                <ShieldCheck size={12} color="#166534" />
                <Text style={styles.constraintBadgeText}>Weighbridge Slip</Text>
              </View>
            )}
            {delivery.unloadingDockRequired && (
              <View style={styles.constraintBadge}>
                <CheckCircle2 size={12} color="#166534" />
                <Text style={styles.constraintBadgeText}>Unloading Dock</Text>
              </View>
            )}
            {delivery.staggeredSchedule && (
              <View style={styles.constraintBadge}>
                <Layers size={12} color="#166534" />
                <Text style={styles.constraintBadgeText}>Staggered Batches</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Bar ─────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Pressable
          style={styles.draftActionBtn}
          onPress={handleSaveDraft}
          disabled={isSavingDraft || isPublishing}
        >
          <Bookmark size={16} color="#374151" />
          <Text style={styles.draftActionBtnText}>
            {isSavingDraft ? 'Saving...' : 'Save Draft'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.publishActionBtn, isPublishing && { opacity: 0.6 }]}
          onPress={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Send size={16} color="#FFFFFF" />
              <Text style={styles.publishActionBtnText}>Publish Requirement</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* ── Post-Publish Celebration Modal ────────────────────── */}
      <Modal
        visible={publishedSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPublishedSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconCircle}>
              <Sparkles size={32} color="#FFFFFF" />
            </View>

            <Text style={styles.modalCelebrationTitle}>Requirement Published! 🌾</Text>
            <Text style={styles.modalCelebrationSub}>
              Your bulk procurement requirement is now live. Suppliers, FPOs, and collective aggregators in your region are being alerted.
            </Text>

            <View style={styles.assignedIdCard}>
              <Text style={styles.assignedIdLabel}>ASSIGNED REQUIREMENT ID</Text>
              <Text style={styles.assignedIdValue}>
                {publishedItem?.id || 'REQ-2026-CONFIRMED'}
              </Text>
              <Text style={styles.assignedIdMeta}>
                Status: Open Tender • {publishedItem?.products.length || 1} Product(s)
              </Text>
            </View>

            <View style={styles.modalActionButtons}>
              <Pressable
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setPublishedSuccessModal(false);
                  clearActiveDraft();
                  router.replace('/requirements' as any);
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>Go to Requirements Dashboard</Text>
                <ArrowRight size={16} color="#FFFFFF" />
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
  validBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  validBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  invalidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  invalidBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5DFD4',
    marginBottom: 12,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  summaryDraftId: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.primaryGreen,
    letterSpacing: 0.5,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1C1E',
    marginTop: 2,
  },
  urgencyPill: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  urgencyPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: MKColors.accentOrangeDark,
  },
  summaryNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5DFD4',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.primaryGreenDark,
  },
  productReviewItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  prodReviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  prodReviewName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  prodReviewCat: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  specsList: {
    gap: 2,
  },
  specLine: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
  },
  specLineBold: {
    fontWeight: '700',
    color: '#1F2937',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  budgetProdName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  budgetQty: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  budgetSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  grandTotalDivider: {
    height: 1,
    backgroundColor: '#E5DFD4',
    marginVertical: 8,
  },
  grandTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  grandTotalQuantity: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  grandTotalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: MKColors.primaryGreenDark,
  },
  deliveryReviewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deliveryReviewLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  deliveryReviewVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 1,
  },
  deliveryReviewSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  constraintsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  constraintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  constraintBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
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
  backDashboardBtn: {
    backgroundColor: MKColors.primaryGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backDashboardBtnText: {
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
  draftActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  draftActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  publishActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primaryGreen,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  publishActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: MKColors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalCelebrationTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1C1E',
    textAlign: 'center',
  },
  modalCelebrationSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  assignedIdCard: {
    backgroundColor: '#F6F1E9',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5DFD4',
  },
  assignedIdLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  assignedIdValue: {
    fontSize: 18,
    fontWeight: '900',
    color: MKColors.primaryGreenDark,
    marginTop: 2,
  },
  assignedIdMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  modalActionButtons: {
    width: '100%',
    marginTop: 20,
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primaryGreen,
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
