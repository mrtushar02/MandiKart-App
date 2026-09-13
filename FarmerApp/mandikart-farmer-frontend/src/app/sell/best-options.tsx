/**
 * MandiKart Farmer App — Best Selling Options & Compare (Screens 05, 06, 07)
 *
 * Core Recommendation & Comparison Hub:
 * - ⭐ Recommended Option with 5-point explainable checklist
 * - Transparent Estimated Net Return calculation (Gross - Transport = Net)
 * - Ranked Alternative Buyer Options
 * - Side-by-side card comparison (no cramped horizontal tables)
 * - Opportunity Details modal
 * - Atomic order creation and handoff to Orders module
 *
 * Simple, professional English throughout.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2,
  Scale,
  Building2,
  ArrowRight,
  Info,
  Truck,
  Check,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useSellStore, SellingOpportunity } from '@/store/sellStore';
import { useProduceStore } from '@/store/produceStore';

export default function BestSellingOptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ crop?: string; qty?: string; grade?: string }>();

  const cropName = params.crop || 'Red Onion';
  const quantityKg = parseFloat(params.qty || '1000') || 1000;
  const grade = params.grade || 'Grade A';

  const getOpportunitiesForCrop = useSellStore((state) => state.getOpportunitiesForCrop);
  const executeSale = useSellStore((state) => state.executeSale);
  const crops = useProduceStore((state) => state.crops);
  const syncWithBackend = useProduceStore((state) => state.syncWithBackend);

  // Poll backend every 3 seconds for instant automatic admin acceptance sync
  useEffect(() => {
    syncWithBackend();
    const interval = setInterval(() => {
      syncWithBackend();
    }, 3000);
    return () => clearInterval(interval);
  }, [syncWithBackend]);

  const matchingCrop = useMemo(() => {
    return crops.find(
      (c) => c.cropName.toLowerCase() === cropName.toLowerCase()
    );
  }, [crops, cropName]);

  const isPending = matchingCrop?.status === 'PENDING_APPROVAL';

  // Get ranked opportunities
  const opportunities = useMemo(() => {
    return getOpportunitiesForCrop(cropName, quantityKg, grade);
  }, [cropName, quantityKg, grade, getOpportunitiesForCrop]);

  const recommendedOpportunity = opportunities.find((o) => o.isRecommended) || opportunities[0];
  const otherOpportunities = opportunities.filter((o) => !o.isRecommended);

  // View mode: 'ranked' | 'compare'
  const [activeTab, setActiveTab] = useState<'ranked' | 'compare'>('ranked');

  // Selected opportunity for detail modal
  const [selectedOppForDetail, setSelectedOppForDetail] = useState<SellingOpportunity | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Accept confirmation modal
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [oppToAccept, setOppToAccept] = useState<SellingOpportunity | null>(null);

  const handleOpenAccept = (opp: SellingOpportunity) => {
    if (isPending) {
      Alert.alert(
        'Produce Verification Protocol',
        `Selling ${cropName} is restricted. This produce is currently awaiting quality verification and approval from MandiKart Admin. Once verified, trading will be enabled automatically.`,
        [{ text: 'Understood', style: 'default' }]
      );
      return;
    }
    setOppToAccept(opp);
    setAcceptModalVisible(true);
  };

  const handleConfirmAccept = () => {
    if (!oppToAccept) return;

    if (isPending) {
      Alert.alert(
        'Produce Verification Protocol',
        `Cannot accept contract for ${cropName}. This harvest is pending quality verification by MandiKart Admin.`,
        [{ text: 'Understood', style: 'default' }]
      );
      return;
    }

    setAcceptModalVisible(false);

    const matchingCrop = crops.find(
      (c) => c.cropName.toLowerCase() === cropName.toLowerCase()
    );

    // Atomic order creation via sellStore + produceStore inventory allocation
    const res = executeSale({
      cropId: matchingCrop?.id,
      cropName: cropName,
      variety: matchingCrop?.variety || 'Quality Harvest Batch',
      quantityKg: quantityKg,
      grade: grade,
      pricePerKg: oppToAccept.offerPricePerKg,
      buyerName: oppToAccept.buyer.name,
      buyerType: oppToAccept.buyer.businessType,
      transportPerKg: oppToAccept.estimatedTransportPerKg,
      cropImage: matchingCrop?.imageUri || oppToAccept.buyer.avatar,
    });

    if (res.success) {
      Alert.alert(
        'Deal Accepted & Order Created! 🚛',
        `Your selling contract with ${oppToAccept.buyer.name} for ${quantityKg.toLocaleString()} kg of ${cropName} has been confirmed. Order ID: ${res.orderId}.\n\nVehicle dispatch and weighbridge tracking are now live in the Orders module.`,
        [
          {
            text: 'View in Orders',
            onPress: () => router.push('/(tabs)/orders'),
          },
          {
            text: 'Back to Sell',
            onPress: () => router.replace('/(tabs)/sell'),
          },
        ]
      );
    } else {
      Alert.alert('Notice', res.error || 'Inventory updated.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header ────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <ArrowLeft size={22} color={MKColors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerSubtitle}>Marketplace Matchmaking</Text>
          <Text style={styles.headerTitle}>Best Selling Options</Text>
        </View>
      </View>

      {/* ── Produce Context Bar ───────────────────────────────────── */}
      <View style={styles.contextBar}>
        <View style={styles.contextCropCol}>
          <Text style={styles.contextCropName}>{cropName}</Text>
          <Text style={styles.contextSub}>{grade} Quality</Text>
        </View>
        <View style={styles.contextDivider} />
        <View style={styles.contextQtyCol}>
          <Text style={styles.contextQtyNum}>{quantityKg.toLocaleString()} kg</Text>
          <Text style={styles.contextSub}>{(quantityKg / 100).toFixed(1)} Quintals</Text>
        </View>
        <View style={styles.contextDivider} />
        <View style={styles.contextRefCol}>
          <Text style={styles.contextRefNum}>₹{recommendedOpportunity?.marketReferencePricePerKg || 22}/kg</Text>
          <Text style={styles.contextSub}>AGMARKNET Ref</Text>
        </View>
      </View>

      {/* Verification Protocol Warning Banner */}
      {isPending && (
        <View
          style={{
            backgroundColor: '#FEF3C7',
            borderColor: '#F59E0B',
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            marginHorizontal: 16,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Lock size={20} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#92400E' }}>
              Selling Protocol: Pending Admin Approval
            </Text>
            <Text style={{ fontSize: 11, color: '#B45309', marginTop: 2, lineHeight: 15 }}>
              This harvest is currently awaiting MandiKart Admin quality verification. Buyer matching is in preview mode — deal acceptance will unlock automatically once approved.
            </Text>
          </View>
        </View>
      )}

      {/* ── Tab Switcher: Ranked vs Compare ───────────────────────── */}
      <View style={styles.tabSwitcher}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'ranked' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ranked')}
        >
          <Sparkles
            size={14}
            color={activeTab === 'ranked' ? MKColors.primaryGreen : MKColors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabBtnText, activeTab === 'ranked' && styles.tabBtnTextActive]}>
            Ranked Recommendations
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'compare' && styles.tabBtnActive]}
          onPress={() => setActiveTab('compare')}
        >
          <SlidersHorizontal
            size={14}
            color={activeTab === 'compare' ? MKColors.primaryGreen : MKColors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabBtnText, activeTab === 'compare' && styles.tabBtnTextActive]}>
            Compare Options ({opportunities.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'ranked' ? (
          <>
            {/* ── Recommended Option Spotlight Card ────────────────────── */}
            {recommendedOpportunity && (
              <View style={styles.recommendedCard}>
                <View style={styles.recBadgeRow}>
                  <View style={styles.starBadge}>
                    <Sparkles size={12} color="#FFFFFF" />
                    <Text style={styles.starBadgeText}>⭐ Recommended Option</Text>
                  </View>
                  <View style={styles.matchScoreBadge}>
                    <Text style={styles.matchScoreText}>
                      {recommendedOpportunity.matchScorePct}% Match
                    </Text>
                  </View>
                </View>

                {/* Buyer identity */}
                <View style={styles.buyerIdentityRow}>
                  <Image
                    source={{ uri: recommendedOpportunity.buyer.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
                    style={styles.buyerAvatar}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.buyerName} numberOfLines={1}>
                        {recommendedOpportunity.buyer.name}
                      </Text>
                      {recommendedOpportunity.buyer.verified && (
                        <ShieldCheck size={14} color={MKColors.primaryGreen} style={{ marginLeft: 4 }} />
                      )}
                    </View>
                    <Text style={styles.buyerType}>
                      {recommendedOpportunity.buyer.businessType} • 📍 {recommendedOpportunity.buyer.distanceKm} km away
                    </Text>
                  </View>
                </View>

                {/* Net Return Breakdown Bar */}
                <View style={styles.financialBanner}>
                  <View style={styles.finCol}>
                    <Text style={styles.finLabel}>Buyer Offer:</Text>
                    <Text style={styles.finValue}>₹{recommendedOpportunity.offerPricePerKg.toFixed(2)}/kg</Text>
                    <Text style={styles.finSub}>
                      Gross: ₹{(quantityKg * recommendedOpportunity.offerPricePerKg).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.finDivider} />

                  <View style={styles.finCol}>
                    <Text style={styles.finLabel}>Est. Transport:</Text>
                    <Text style={styles.finValue}>− ₹{recommendedOpportunity.estimatedTransportPerKg.toFixed(2)}/kg</Text>
                    <Text style={styles.finSub}>
                      Total: ₹{Math.round(quantityKg * recommendedOpportunity.estimatedTransportPerKg).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.finDivider} />

                  <View style={styles.finCol}>
                    <Text style={[styles.finLabel, { color: MKColors.primaryGreenDark }]}>
                      Est. Net Return:
                    </Text>
                    <Text style={[styles.finValue, { color: MKColors.primaryGreenDark, fontSize: 17 }]}>
                      ₹{recommendedOpportunity.estimatedNetReturnPerKg.toFixed(2)}/kg
                    </Text>
                    <Text style={[styles.finSub, { color: MKColors.primaryGreen, fontWeight: '700' }]}>
                      ₹{Math.round(quantityKg * recommendedOpportunity.estimatedNetReturnPerKg).toLocaleString()} Net
                    </Text>
                  </View>
                </View>

                {/* 5-Point Explainable Checklist */}
                <View style={styles.checklistCard}>
                  <Text style={styles.checklistHeading}>Match Assessment:</Text>
                  <View style={styles.checklistGrid}>
                    <View style={styles.checklistItem}>
                      <Check size={13} color={MKColors.primaryGreen} />
                      <Text style={styles.checklistText}>Crop type matches</Text>
                    </View>
                    <View style={styles.checklistItem}>
                      <Check size={13} color={MKColors.primaryGreen} />
                      <Text style={styles.checklistText}>Quantity requirement matches</Text>
                    </View>
                    <View style={styles.checklistItem}>
                      <Check size={13} color={MKColors.primaryGreen} />
                      <Text style={styles.checklistText}>Quality grade aligns ({grade})</Text>
                    </View>
                    <View style={styles.checklistItem}>
                      <Check size={13} color={MKColors.primaryGreen} />
                      <Text style={styles.checklistText}>Nearby location (≤ {recommendedOpportunity.buyer.distanceKm} km)</Text>
                    </View>
                    <View style={styles.checklistItem}>
                      <Check size={13} color={MKColors.primaryGreen} />
                      <Text style={styles.checklistText}>Prompt collection available</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.recommendationRationale}>
                  💡 <Text style={{ fontWeight: '700' }}>Why this option:</Text> {recommendedOpportunity.recommendationReason}
                </Text>

                {/* Primary Action Buttons */}
                <View style={styles.cardBtnRow}>
                  <Pressable
                    style={styles.detailsOutlineBtn}
                    onPress={() => {
                      setSelectedOppForDetail(recommendedOpportunity);
                      setDetailModalVisible(true);
                    }}
                  >
                    <Text style={styles.detailsOutlineBtnText}>View Details</Text>
                  </Pressable>

                  <Pressable
                    style={styles.acceptPrimaryBtn}
                    onPress={() => handleOpenAccept(recommendedOpportunity)}
                  >
                    <Text style={styles.acceptPrimaryBtnText}>Accept Offer</Text>
                    <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* ── Other Ranked Buyer Options ─────────────────────────── */}
            <Text style={styles.subSectionTitle}>Other Buyer Matches ({otherOpportunities.length})</Text>

            {otherOpportunities.map((opp) => (
              <View key={opp.id} style={styles.standardMatchCard}>
                <View style={styles.matchCardTop}>
                  <Image source={{ uri: opp.buyer.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }} style={styles.smallAvatar} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.standardBuyerName} numberOfLines={1}>
                        {opp.buyer.name}
                      </Text>
                      {opp.buyer.verified && (
                        <ShieldCheck size={13} color={MKColors.primaryGreen} style={{ marginLeft: 3 }} />
                      )}
                    </View>
                    <Text style={styles.standardMeta}>
                      {opp.buyer.businessType} • {opp.buyer.distanceKm} km away
                    </Text>
                  </View>
                  <View style={styles.standardScoreBadge}>
                    <Text style={styles.standardScoreText}>{opp.matchScorePct}%</Text>
                  </View>
                </View>

                <View style={styles.standardFinancialStrip}>
                  <View style={styles.standardFinItem}>
                    <Text style={styles.standardFinLabel}>Offer</Text>
                    <Text style={styles.standardFinVal}>₹{opp.offerPricePerKg}/kg</Text>
                  </View>
                  <View style={styles.standardFinItem}>
                    <Text style={styles.standardFinLabel}>Transport</Text>
                    <Text style={styles.standardFinVal}>− ₹{opp.estimatedTransportPerKg}/kg</Text>
                  </View>
                  <View style={styles.standardFinItem}>
                    <Text style={[styles.standardFinLabel, { color: MKColors.primaryGreenDark }]}>Est. Net</Text>
                    <Text style={[styles.standardFinVal, { color: MKColors.primaryGreenDark, fontWeight: '800' }]}>
                      ₹{opp.estimatedNetReturnPerKg}/kg
                    </Text>
                  </View>
                </View>

                <View style={styles.standardActionRow}>
                  <Pressable
                    style={styles.standardViewBtn}
                    onPress={() => {
                      setSelectedOppForDetail(opp);
                      setDetailModalVisible(true);
                    }}
                  >
                    <Text style={styles.standardViewBtnText}>Details</Text>
                  </Pressable>

                  <Pressable
                    style={styles.standardAcceptBtn}
                    onPress={() => handleOpenAccept(opp)}
                  >
                    <Text style={styles.standardAcceptBtnText}>Accept</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        ) : (
          /* ── Compare Selling Options Mode (Screen 07) ─────────────── */
          <View style={styles.compareContainer}>
            <Text style={styles.compareIntroText}>
              Compare net payout, distance, and verified match score side-by-side:
            </Text>

            {opportunities.map((opp, idx) => (
              <View
                key={`comp_${opp.id}`}
                style={[
                  styles.compareCard,
                  opp.isRecommended && styles.compareCardRecommended,
                ]}
              >
                <View style={styles.compareCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.compareBuyerName}>{opp.buyer.name}</Text>
                      {opp.isRecommended && (
                        <View style={styles.miniRecPill}>
                          <Text style={styles.miniRecText}>Recommended</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.compareBuyerType}>{opp.buyer.businessType}</Text>
                  </View>
                  <Text style={styles.compareMatchPct}>{opp.matchScorePct}% Match</Text>
                </View>

                {/* Comparison metric rows */}
                <View style={styles.compareMetricRow}>
                  <Text style={styles.compareMetricLabel}>Offer Rate:</Text>
                  <Text style={styles.compareMetricValue}>₹{opp.offerPricePerKg.toFixed(2)} / kg</Text>
                </View>

                <View style={styles.compareMetricRow}>
                  <Text style={styles.compareMetricLabel}>Estimated Transport:</Text>
                  <Text style={styles.compareMetricValue}>− ₹{opp.estimatedTransportPerKg.toFixed(2)} / kg ({opp.buyer.distanceKm} km)</Text>
                </View>

                <View style={[styles.compareMetricRow, styles.compareNetRow]}>
                  <Text style={styles.compareNetLabel}>Estimated Net Return:</Text>
                  <Text style={styles.compareNetValue}>₹{opp.estimatedNetReturnPerKg.toFixed(2)} / kg</Text>
                </View>

                <View style={styles.compareMetricRow}>
                  <Text style={styles.compareMetricLabel}>Total Estimated Payout:</Text>
                  <Text style={styles.comparePayoutValue}>
                    ₹{Math.round(quantityKg * opp.estimatedNetReturnPerKg).toLocaleString()}
                  </Text>
                </View>

                <Pressable
                  style={styles.compareSelectBtn}
                  onPress={() => handleOpenAccept(opp)}
                >
                  <Text style={styles.compareSelectBtnText}>Select This Buyer</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* ── Disclaimer ────────────────────────────────────────────── */}
        <View style={styles.disclaimerBox}>
          <Info size={14} color={MKColors.textSecondary} style={{ marginRight: 6, marginTop: 2 }} />
          <Text style={styles.disclaimerText}>
            Estimated net returns are calculated based on buyer offer and approximate transport costs. Final realization depends on weighbridge reading, quality grading at inspection, and unloading terms.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal: Opportunity Details (Screen 06) ────────────────── */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Buyer Opportunity Details</Text>
              <Pressable onPress={() => setDetailModalVisible(false)} hitSlop={10}>
                <X size={20} color={MKColors.textSecondary} />
              </Pressable>
            </View>

            {selectedOppForDetail && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <View style={styles.detailBuyerHeader}>
                  <Image
                    source={{ uri: selectedOppForDetail.buyer.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
                    style={styles.detailAvatar}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.detailBuyerName}>{selectedOppForDetail.buyer.name}</Text>
                    <Text style={styles.detailLocation}>📍 {selectedOppForDetail.buyer.location}</Text>
                    <Text style={styles.detailDeals}>
                      ⭐ {selectedOppForDetail.buyer.rating} rating • {selectedOppForDetail.buyer.totalDeals}+ completed deals
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Requirement Specification</Text>
                  <Text style={styles.detailBody}>
                    • Crop: {cropName} ({selectedOppForDetail.requiredGrade})
                  </Text>
                  <Text style={styles.detailBody}>
                    • Target Volume: Up to {selectedOppForDetail.requiredKg.toLocaleString()} kg
                  </Text>
                  <Text style={styles.detailBody}>
                    • Pickup Preference: {selectedOppForDetail.buyer.pickupPreference}
                  </Text>
                  <Text style={styles.detailBody}>
                    • Payment Terms: {selectedOppForDetail.buyer.paymentTerms}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Financial Estimate</Text>
                  <Text style={styles.detailBody}>
                    • Gross Offer: ₹{selectedOppForDetail.offerPricePerKg}/kg (₹{(quantityKg * selectedOppForDetail.offerPricePerKg).toLocaleString()})
                  </Text>
                  <Text style={styles.detailBody}>
                    • Est. Transport: − ₹{selectedOppForDetail.estimatedTransportPerKg}/kg (₹{Math.round(quantityKg * selectedOppForDetail.estimatedTransportPerKg).toLocaleString()})
                  </Text>
                  <Text style={[styles.detailBody, { fontWeight: '800', color: MKColors.primaryGreenDark }]}>
                    • Est. Net Payout: ₹{selectedOppForDetail.estimatedNetReturnPerKg}/kg (₹{Math.round(quantityKg * selectedOppForDetail.estimatedNetReturnPerKg).toLocaleString()})
                  </Text>
                </View>

                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    setDetailModalVisible(false);
                    handleOpenAccept(selectedOppForDetail);
                  }}
                >
                  <Text style={styles.modalPrimaryBtnText}>Proceed with This Buyer</Text>
                  <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Modal: Accept Confirmation (Screen 22) ────────────────── */}
      <Modal
        visible={acceptModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAcceptModalVisible(false)}
      >
        <View style={styles.modalBackdropCenter}>
          <View style={styles.acceptConfirmCard}>
            <View style={styles.acceptIconWrap}>
              <CheckCircle2 size={38} color={MKColors.primaryGreen} />
            </View>

            <Text style={styles.confirmTitle}>Confirm Sale Contract</Text>
            <Text style={styles.confirmSubtitle}>
              Accepting this offer will create a formal order and schedule pickup.
            </Text>

            <View style={styles.confirmSummaryBox}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Crop & Grade:</Text>
                <Text style={styles.confirmVal}>{cropName} ({grade})</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Quantity:</Text>
                <Text style={styles.confirmVal}>{quantityKg.toLocaleString()} kg</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Agreed Rate:</Text>
                <Text style={styles.confirmVal}>₹{oppToAccept?.offerPricePerKg}/kg</Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Est. Transport:</Text>
                <Text style={styles.confirmVal}>− ₹{oppToAccept?.estimatedTransportPerKg}/kg</Text>
              </View>
              <View style={[styles.confirmRow, { borderTopWidth: 1, borderTopColor: MKColors.borderLight, paddingTop: 6 }]}>
                <Text style={[styles.confirmLabel, { fontWeight: '800' }]}>Est. Net Payout:</Text>
                <Text style={[styles.confirmVal, { fontWeight: '800', color: MKColors.primaryGreenDark }]}>
                  ₹{oppToAccept ? Math.round(quantityKg * oppToAccept.estimatedNetReturnPerKg).toLocaleString() : 0}
                </Text>
              </View>
            </View>

            <View style={styles.confirmBtnRow}>
              <Pressable
                style={styles.confirmCancelBtn}
                onPress={() => setAcceptModalVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Go Back</Text>
              </Pressable>

              <Pressable
                style={styles.confirmAcceptBtn}
                onPress={handleConfirmAccept}
              >
                <Text style={styles.confirmAcceptText}>ACCEPT OFFER</Text>
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
    backgroundColor: MKColors.backgroundPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: MKColors.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: MKColors.borderLight,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: MKColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.primaryGreen,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },

  // Context bar
  contextBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: MKColors.border,
  },
  contextCropCol: {
    flex: 1.2,
  },
  contextCropName: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  contextQtyCol: {
    flex: 1,
    alignItems: 'center',
  },
  contextQtyNum: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  contextRefCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  contextRefNum: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.primaryGreenDark,
  },
  contextSub: {
    fontSize: 10,
    color: MKColors.textSecondary,
    marginTop: 1,
  },
  contextDivider: {
    width: 1,
    backgroundColor: MKColors.borderLight,
    marginHorizontal: 8,
  },

  // Tab Switcher
  tabSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: MKColors.backgroundPrimary,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: MKColors.border,
  },
  tabBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: MKColors.primaryGreen,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textSecondary,
  },
  tabBtnTextActive: {
    color: MKColors.primaryGreen,
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Recommended Card
  recommendedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: MKColors.primaryGreen,
    elevation: 3,
    shadowColor: MKColors.primaryGreen,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  recBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MKColors.primaryGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  starBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  matchScoreBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  matchScoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: MKColors.primaryGreen,
  },

  buyerIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  buyerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F3F4F6',
  },
  buyerName: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  buyerType: {
    fontSize: 11,
    color: MKColors.textSecondary,
    marginTop: 2,
  },

  financialBanner: {
    flexDirection: 'row',
    backgroundColor: '#FAFAF8',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: MKColors.border,
    marginBottom: 12,
  },
  finCol: {
    flex: 1,
    alignItems: 'center',
  },
  finDivider: {
    width: 1,
    backgroundColor: MKColors.borderLight,
  },
  finLabel: {
    fontSize: 10,
    color: MKColors.textSecondary,
  },
  finValue: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginVertical: 2,
  },
  finSub: {
    fontSize: 9,
    color: MKColors.textMuted,
  },

  checklistCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checklistHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginBottom: 6,
  },
  checklistGrid: {
    gap: 4,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checklistText: {
    fontSize: 11,
    color: MKColors.textSecondary,
  },
  recommendationRationale: {
    fontSize: 11,
    color: MKColors.textSecondary,
    lineHeight: 16,
    marginBottom: 14,
  },
  cardBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsOutlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: MKColors.primaryGreen,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsOutlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.primaryGreen,
  },
  acceptPrimaryBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 10,
    backgroundColor: MKColors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Other Options
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginTop: 4,
    marginBottom: 10,
  },
  standardMatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: MKColors.border,
  },
  matchCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  smallAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
  },
  standardBuyerName: {
    fontSize: 13,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  standardMeta: {
    fontSize: 10,
    color: MKColors.textSecondary,
    marginTop: 1,
  },
  standardScoreBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  standardScoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  standardFinancialStrip: {
    flexDirection: 'row',
    backgroundColor: '#FAFAF8',
    borderRadius: 8,
    padding: 6,
    marginBottom: 8,
  },
  standardFinItem: {
    flex: 1,
    alignItems: 'center',
  },
  standardFinLabel: {
    fontSize: 9,
    color: MKColors.textSecondary,
  },
  standardFinVal: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textPrimary,
    marginTop: 1,
  },
  standardActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  standardViewBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MKColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  standardViewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textSecondary,
  },
  standardAcceptBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: MKColors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  standardAcceptBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Compare Mode ──────────────────────────────────────────────────
  compareContainer: {
    gap: 10,
  },
  compareIntroText: {
    fontSize: 12,
    color: MKColors.textSecondary,
    marginBottom: 4,
  },
  compareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: MKColors.border,
  },
  compareCardRecommended: {
    borderColor: MKColors.primaryGreen,
    borderWidth: 2,
  },
  compareCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: MKColors.borderLight,
  },
  compareBuyerName: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  miniRecPill: {
    backgroundColor: MKColors.primaryGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  miniRecText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  compareBuyerType: {
    fontSize: 11,
    color: MKColors.textSecondary,
    marginTop: 1,
  },
  compareMatchPct: {
    fontSize: 12,
    fontWeight: '800',
    color: MKColors.primaryGreen,
  },
  compareMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  compareMetricLabel: {
    fontSize: 11,
    color: MKColors.textSecondary,
  },
  compareMetricValue: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  compareNetRow: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    marginVertical: 2,
  },
  compareNetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primaryGreenDark,
  },
  compareNetValue: {
    fontSize: 13,
    fontWeight: '800',
    color: MKColors.primaryGreenDark,
  },
  comparePayoutValue: {
    fontSize: 13,
    fontWeight: '800',
    color: MKColors.accentOrangeDark,
  },
  compareSelectBtn: {
    backgroundColor: MKColors.primaryGreen,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  compareSelectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Disclaimer
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    color: MKColors.textSecondary,
    lineHeight: 14,
  },

  // Modal Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  detailBuyerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: '#FAFAF8',
    padding: 10,
    borderRadius: 12,
  },
  detailAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  detailBuyerName: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  detailLocation: {
    fontSize: 11,
    color: MKColors.textSecondary,
    marginTop: 2,
  },
  detailDeals: {
    fontSize: 10,
    color: MKColors.primaryGreen,
    fontWeight: '700',
    marginTop: 2,
  },
  detailSection: {
    marginBottom: 12,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginBottom: 4,
  },
  detailBody: {
    fontSize: 12,
    color: MKColors.textSecondary,
    lineHeight: 18,
  },
  modalPrimaryBtn: {
    backgroundColor: MKColors.primaryGreen,
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Confirm Modal
  modalBackdropCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  acceptConfirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  acceptIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginBottom: 4,
  },
  confirmSubtitle: {
    fontSize: 12,
    color: MKColors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  confirmSummaryBox: {
    backgroundColor: '#FAFAF8',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: MKColors.border,
    marginBottom: 16,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  confirmLabel: {
    fontSize: 12,
    color: MKColors.textSecondary,
  },
  confirmVal: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: MKColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.textSecondary,
  },
  confirmAcceptBtn: {
    flex: 1.4,
    height: 46,
    borderRadius: 10,
    backgroundColor: MKColors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmAcceptText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
