/**
 * MandiKart — FPO Collective Input Procurement Screen
 *
 * Route: /fpo/procurement
 *
 * Enables FPOs to aggregate input demand across hundreds of member farmers:
 * - Wholesale price negotiation with IFFCO, KRIBHCO, NSC, chemical & machinery brands
 * - 10-25% collective savings directly delivered to member farmgates
 * - Demand collection campaigns, bidding suppliers & delivery progress
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Clock,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Building2,
  Users,
  X,
  Sparkles,
  Check,
  Calendar,
  Percent,
} from 'lucide-react-native';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import type { FPOProcurement, FPOProcurementStatus } from '@/types';

const NAVY_DEEP = '#08162B';
const NAVY_MID  = '#0F2C56';
const NAVY_FPO  = '#1A4D8E';
const FPO_BLUE = '#1B4D8E';
const FPO_BLUE_BG = '#EBF2FF';
const FPO_DARK = '#0F2D54';
const ACCENT_GREEN = '#15803D';

export default function FPOProcurementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [procurements, setProcurements] = useState<FPOProcurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Order Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<'SEED' | 'FERTILIZER' | 'PESTICIDE' | 'EQUIPMENT'>('FERTILIZER');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Bags (50kg)');
  const [closingDays, setClosingDays] = useState('14');
  const [targetRate, setTargetRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProcurements = async () => {
    try {
      const res: any = await apiClient.getFPOProcurements(user?.fpoDetails?.fpoId);
      if (res?.data && Array.isArray(res.data)) {
        setProcurements(res.data as FPOProcurement[]);
      }
    } catch (err) {
      console.warn('Failed to load procurements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProcurements();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProcurements();
  };

  const handleCreateOrder = async () => {
    if (!itemName.trim() || !quantity) {
      Alert.alert('Required Fields', 'Please enter item name and quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      const closingDate = new Date(Date.now() + (parseInt(closingDays, 10) || 14) * 86400000)
        .toISOString()
        .split('T')[0];

      const newOrder = {
        itemName: itemName.trim(),
        itemType,
        totalQuantity: parseFloat(quantity) || 100,
        unit: unit.trim() || 'Units',
        demandClosingDate: closingDate,
        bestQuotePrice: parseFloat(targetRate) || 1200,
        bestQuoteSupplier: 'IFFCO State Cooperative Depot',
        savingVsMarket: 12,
        memberCount: 28,
        status: 'COLLECTING_DEMAND' as FPOProcurementStatus,
      };

      const res: any = await apiClient.createFPOProcurement(newOrder);
      if (res?.data) {
        setProcurements((prev) => [res.data as FPOProcurement, ...prev]);
        setIsModalOpen(false);
        setItemName('');
        setQuantity('');
        setTargetRate('');
        Alert.alert('Campaign Launched', `Collective demand pool opened for ${newOrder.itemName}. Member farmers can now register requirements.`);
      }
    } catch {
      Alert.alert('Error', 'Could not create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const topInset = Math.max(insets.top, 16);

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <LinearGradient
        colors={[NAVY_DEEP, NAVY_MID, NAVY_FPO]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topInset }]}
      >
        <View style={styles.headerTop}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.fpoOrgLabel}>{user?.fpoDetails?.fpoName || 'FPO Input Hub'}</Text>
            <Text style={styles.screenTitle}>Collective Input Procurement</Text>
          </View>
          <Pressable style={styles.addBtn} onPress={() => setIsModalOpen(true)}>
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>New Order</Text>
          </Pressable>
        </View>

        {/* ── Wholesale Savings Banner ────────────────────────── */}
        <View style={styles.savingsBanner}>
          <View style={styles.savingsIconBox}>
            <Percent size={18} color="#15803D" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.savingsTitle}>Direct Manufacturer Discount</Text>
            <Text style={styles.savingsSub}>
              By consolidating 150+ farmer orders, our FPO eliminates retail distributor markups of 12% to 22%.
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Content List ───────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={FPO_BLUE} />
          <Text style={styles.loadingText}>Fetching Bulk Orders...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={FPO_BLUE} />}
        >
          {procurements.map((proc) => {
            const isCollecting = proc.status === 'COLLECTING_DEMAND';
            const isQuotes = proc.status === 'SEEKING_QUOTES';
            const isOrdered = proc.status === 'ORDER_PLACED';

            return (
              <View key={proc.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.tagRow}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{proc.itemType}</Text>
                      </View>
                      <View style={[styles.statusBadge, isCollecting ? styles.statusCollecting : isOrdered ? styles.statusOrdered : styles.statusQuotes]}>
                        <Text style={[styles.statusBadgeText, isCollecting ? styles.textCollecting : isOrdered ? styles.textOrdered : styles.textQuotes]}>
                          {proc.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.orderTitle}>{proc.itemName}</Text>
                  </View>

                  <View style={styles.savingsBadge}>
                    <TrendingDown size={14} color="#15803D" />
                    <Text style={styles.savingsVal}>{proc.savingVsMarket || 12}% Saved</Text>
                  </View>
                </View>

                {/* Progress Strip */}
                <View style={styles.specStrip}>
                  <View style={styles.specCol}>
                    <Text style={styles.specLabel}>Aggregated Qty</Text>
                    <Text style={styles.specVal}>{proc.totalQuantity} {proc.unit}</Text>
                  </View>
                  <View style={styles.specDivider} />
                  <View style={styles.specCol}>
                    <Text style={styles.specLabel}>Farmers Joined</Text>
                    <Text style={styles.specVal}>{proc.memberCount || 34} Farmers</Text>
                  </View>
                  <View style={styles.specDivider} />
                  <View style={styles.specCol}>
                    <Text style={styles.specLabel}>Target Rate</Text>
                    <Text style={[styles.specVal, { color: ACCENT_GREEN }]}>
                      {proc.bestQuotePrice ? `₹${proc.bestQuotePrice.toLocaleString('en-IN')}` : 'Awaiting'}
                    </Text>
                  </View>
                </View>

                {/* Supplier Quote */}
                {proc.bestQuoteSupplier && (
                  <View style={styles.supplierBox}>
                    <Building2 size={14} color="#64748B" />
                    <Text style={styles.supplierText}>
                      Supplier: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{proc.bestQuoteSupplier}</Text>
                    </Text>
                  </View>
                )}

                {/* Deadline & Actions */}
                <View style={styles.orderFooter}>
                  <View style={styles.deadlineRow}>
                    <Clock size={13} color="#94A3B8" />
                    <Text style={styles.deadlineText}>Closes: {proc.demandClosingDate}</Text>
                  </View>
                  <Pressable
                    style={styles.manageBtn}
                    onPress={() => {
                      Alert.alert(
                        'Campaign Demand Ledger',
                        `Item: ${proc.itemName}\nTotal: ${proc.totalQuantity} ${proc.unit}\nContributing Farmers: ${proc.memberCount || 42}\nSupplier: ${proc.bestQuoteSupplier || 'IFFCO Depot'}\nEstimated Collective Savings: ₹${(((proc.bestQuotePrice || 1000) * (proc.totalQuantity || 100) * 0.12)).toLocaleString('en-IN')}`,
                        [{ text: 'Close', style: 'cancel' }]
                      );
                    }}
                  >
                    <Text style={styles.manageBtnText}>View Demand Roster</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── NEW ORDER MODAL ──────────────────────────────────── */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Launch Bulk Input Campaign</Text>
                <Text style={styles.modalSubtitle}>Consolidate input orders across member farmers</Text>
              </View>
              <Pressable onPress={() => setIsModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#374151" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.inputLabel}>Input Category *</Text>
              <View style={styles.typeSelectRow}>
                {(['FERTILIZER', 'SEED', 'PESTICIDE', 'EQUIPMENT'] as const).map((t) => (
                  <Pressable
                    key={t}
                    style={[styles.typeOption, itemType === t && styles.typeOptionActive]}
                    onPress={() => setItemType(t)}
                  >
                    <Text style={[styles.typeOptionText, itemType === t && styles.typeOptionTextActive]}>
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Product Name & Brand *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Certified DAP (IFFCO), Pioneer Mustard Seeds"
                value={itemName}
                onChangeText={setItemName}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Initial Target Qty *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 500"
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Bags (50kg), Packs, Litres"
                    value={unit}
                    onChangeText={setUnit}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Target Wholesale Price (₹ / unit)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1350"
                keyboardType="numeric"
                value={targetRate}
                onChangeText={setTargetRate}
              />

              <Text style={styles.inputLabel}>Campaign Open Duration (Days)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 14"
                keyboardType="numeric"
                value={closingDays}
                onChangeText={setClosingDays}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleCreateOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={18} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.submitBtnText}>Open Demand Campaign</Text>
                  </>
                )}
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
    backgroundColor: '#F7F9FC',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#0F294D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 7,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fpoOrgLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  savingsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  savingsSub: {
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 16,
    marginTop: 2,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F294D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    gap: 12,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusCollecting: { backgroundColor: '#DEF7EC' },
  statusQuotes: { backgroundColor: '#FEF3C7' },
  statusOrdered: { backgroundColor: '#E0F2FE' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  textCollecting: { color: '#046C4E' },
  textQuotes: { color: '#B45309' },
  textOrdered: { color: '#0369A1' },
  orderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savingsVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  specStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specCol: {
    flex: 1,
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 1,
  },
  specDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  supplierBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  supplierText: {
    fontSize: 11,
    color: '#64748B',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  manageBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  manageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: FPO_BLUE,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 16,
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#111827',
  },
  typeSelectRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeOption: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeOptionActive: {
    backgroundColor: FPO_BLUE_BG,
    borderColor: FPO_BLUE,
  },
  typeOptionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  typeOptionTextActive: {
    color: FPO_BLUE,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: FPO_BLUE,
    paddingVertical: 13,
    borderRadius: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
