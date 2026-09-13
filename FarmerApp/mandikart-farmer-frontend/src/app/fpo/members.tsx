/**
 * MandiKart — FPO Members Registry Screen
 *
 * Route: /fpo/members
 *
 * Full member farmer lifecycle management:
 * - Member roster with landholding & crop profile
 * - Pending member approval / onboarding pipeline
 * - Direct farmer call & communication
 * - Add new member farmer to FPO
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Search,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Sprout,
  CreditCard,
  Building2,
  X,
  Plus,
  Check,
  Share2,
  QrCode,
} from 'lucide-react-native';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { FPOQRCodeModal } from '@/components/fpo/FPOQRCodeModal';
import type { FPOMember } from '@/types';

const NAVY_DEEP = '#08162B';
const NAVY_MID  = '#0F2C56';
const NAVY_FPO  = '#1A4D8E';
const FPO_BLUE = '#1B4D8E';
const FPO_BLUE_BG = '#EBF2FF';
const FPO_DARK = '#0F2D54';
const ACCENT_GREEN = '#15803D';

export default function FPOMembersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [members, setMembers] = useState<FPOMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Add Member Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [landAcres, setLandAcres] = useState('');
  const [crops, setCrops] = useState('');
  const [kccBank, setKccBank] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      const res: any = await apiClient.getFPOMembers(user?.fpoDetails?.fpoId);
      if (res?.data && Array.isArray(res.data)) {
        setMembers(res.data as FPOMember[]);
      }
    } catch (err) {
      console.warn('Failed to load members:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Calling Unavailable', `Phone: ${phoneNumber}`);
    });
  };

  const handleUpdateStatus = async (memberId: string, status: 'ACTIVE' | 'REJECTED') => {
    try {
      await apiClient.updateFPOMemberStatus(memberId, status);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, status } : m))
      );
      Alert.alert(
        status === 'ACTIVE' ? 'Member Approved' : 'Application Rejected',
        `Farmer has been updated to ${status}.`
      );
    } catch {
      Alert.alert('Error', 'Could not update member status.');
    }
  };

  const handleAddMember = async () => {
    if (!name.trim() || !phone.trim() || !village.trim()) {
      Alert.alert('Required Fields', 'Please enter Name, Phone Number, and Village.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newMem = {
        fullName: name.trim(),
        phone: phone.trim(),
        village: village.trim(),
        district: user?.fpoDetails?.district || 'Bareilly',
        landAcres: parseFloat(landAcres) || 2.5,
        crops: crops.split(',').map((c) => c.trim()).filter(Boolean),
        kccBank: kccBank.trim() || 'State Bank of India',
        status: 'ACTIVE' as const,
      };

      const res: any = await apiClient.addFPOMember(newMem);
      if (res?.data) {
        setMembers((prev) => [res.data as FPOMember, ...prev]);
        setIsAddModalOpen(false);
        setName('');
        setPhone('');
        setVillage('');
        setLandAcres('');
        setCrops('');
        setKccBank('');
        Alert.alert('Farmer Enrolled', `${newMem.fullName} has been registered to ${user?.fpoDetails?.fpoName || 'your FPO'}.`);
      }
    } catch {
      Alert.alert('Error', 'Could not add member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.crops.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (filterTab === 'ALL') return true;
      return m.status === filterTab;
    });
  }, [members, searchQuery, filterTab]);

  const activeCount = useMemo(() => members.filter((m) => m.status === 'ACTIVE').length, [members]);
  const pendingCount = useMemo(() => members.filter((m) => m.status === 'PENDING').length, [members]);

  const topInset = Math.max(insets.top, 16);

  return (
    <View style={styles.container}>
      {/* ── Top Header ─────────────────────────────────────────── */}
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
            <Text style={styles.fpoOrgLabel}>{user?.fpoDetails?.fpoName || 'FPO Portal'}</Text>
            <Text style={styles.screenTitle}>Member Farmers Registry</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable style={styles.qrBtn} onPress={() => setIsQRModalOpen(true)}>
              <QrCode size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>QR</Text>
            </Pressable>
            <Pressable style={styles.addBtn} onPress={() => setIsAddModalOpen(true)}>
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Stats Strip ─────────────────────────────────────── */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{members.length}</Text>
            <Text style={styles.statLabel}>Total Enrolled</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#86EFAC' }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active Shareholders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#FDE68A' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending Verification</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Search & Filter ────────────────────────────────────── */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search farmer name, village, or crop..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={16} color="#6B7280" />
            </Pressable>
          )}
        </View>

        <View style={styles.tabRow}>
          {[
            { id: 'ALL', label: `All (${members.length})` },
            { id: 'ACTIVE', label: `Active (${activeCount})` },
            { id: 'PENDING', label: `Pending Approval (${pendingCount})` },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilterTab(tab.id as any)}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Member List ────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={FPO_BLUE} />
          <Text style={styles.loadingText}>Loading Member Registry...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={FPO_BLUE} />}
        >
          {filteredMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={44} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Members Found</Text>
              <Text style={styles.emptySubtitle}>
                Add farmers to issue digital share certificates and aggregate their harvest.
              </Text>
            </View>
          ) : (
            filteredMembers.map((mem) => {
              const isPending = mem.status === 'PENDING';

              return (
                <View key={mem.id} style={styles.memberCard}>
                  <View style={styles.memberTop}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarInitial}>
                        {mem.fullName.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.memberName}>{mem.fullName}</Text>
                        <View style={[styles.statusTag, isPending ? styles.tagPending : styles.tagActive]}>
                          <Text style={[styles.statusTagText, isPending ? styles.textPending : styles.textActive]}>
                            {mem.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.metaRow}>
                        <MapPin size={12} color="#64748B" />
                        <Text style={styles.metaText}>{mem.village}, {mem.district}</Text>
                      </View>
                    </View>

                    <Pressable
                      style={styles.callIconBtn}
                      onPress={() => handleCall(mem.phone)}
                      accessibilityLabel="Call Farmer"
                    >
                      <Phone size={16} color={FPO_BLUE} />
                    </Pressable>
                  </View>

                  {/* Badges & Crops */}
                  <View style={styles.cropsBadgeRow}>
                    <View style={styles.landBadge}>
                      <Text style={styles.landBadgeText}>{mem.landAcres} Acres</Text>
                    </View>
                    {mem.crops.map((c, i) => (
                      <View key={i} style={styles.cropTag}>
                        <Text style={styles.cropTagText}>{c}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Financial & Delivery Track */}
                  <View style={styles.perfRow}>
                    <View style={styles.perfCol}>
                      <Text style={styles.perfLabel}>FPO Deliveries</Text>
                      <Text style={styles.perfVal}>{mem.totalDeliveredMT ? `${mem.totalDeliveredMT} MT` : 'First Season'}</Text>
                    </View>
                    <View style={styles.perfDivider} />
                    <View style={styles.perfCol}>
                      <Text style={styles.perfLabel}>Total Realized</Text>
                      <Text style={[styles.perfVal, { color: ACCENT_GREEN }]}>
                        {mem.totalEarningsViaFPO ? `₹${mem.totalEarningsViaFPO.toLocaleString('en-IN')}` : '—'}
                      </Text>
                    </View>
                    {mem.kccBank && (
                      <>
                        <View style={styles.perfDivider} />
                        <View style={styles.perfCol}>
                          <Text style={styles.perfLabel}>KCC Tied Bank</Text>
                          <Text style={styles.perfVal} numberOfLines={1}>{mem.kccBank.replace('Bank of ', 'BO').replace('State Bank of ', 'SB')}</Text>
                        </View>
                      </>
                    )}
                  </View>

                  {/* Pending Decision Row */}
                  {isPending && (
                    <View style={styles.decisionRow}>
                      <Pressable
                        style={[styles.decideBtn, styles.approveBtn]}
                        onPress={() => handleUpdateStatus(mem.id, 'ACTIVE')}
                      >
                        <CheckCircle2 size={15} color="#FFFFFF" />
                        <Text style={styles.decideBtnText}>Approve Member</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.decideBtn, styles.rejectBtn]}
                        onPress={() => handleUpdateStatus(mem.id, 'REJECTED')}
                      >
                        <XCircle size={15} color="#DC2626" />
                        <Text style={[styles.decideBtnText, { color: '#DC2626' }]}>Decline</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── ADD MEMBER MODAL ─────────────────────────────────── */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Enroll Member Farmer</Text>
                <Text style={styles.modalSubtitle}>Issue digital FPO shareholding</Text>
              </View>
              <Pressable onPress={() => setIsAddModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color="#374151" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.inputLabel}>Farmer Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ramesh Chandra Sharma"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>Mobile Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Village / Gram *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rampur Kalan"
                    value={village}
                    onChangeText={setVillage}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Landholding (Acres)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 4.0"
                    keyboardType="numeric"
                    value={landAcres}
                    onChangeText={setLandAcres}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Primary Harvest Crops (Comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Wheat, Mustard, Potato"
                value={crops}
                onChangeText={setCrops}
              />

              <Text style={styles.inputLabel}>Kisan Credit Card (KCC) Bank</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. State Bank of India, Baroda UP Bank"
                value={kccBank}
                onChangeText={setKccBank}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleAddMember}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={18} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.submitBtnText}>Register & Activate Shareholder</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── FPO QR CODE MODAL ── */}
      <FPOQRCodeModal
        visible={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        fpoName={user?.fpoDetails?.fpoName || user?.fullName || 'Kisan Producer Company'}
        joinCode={user?.fpoDetails?.fpoJoinCode || user?.fpoDetails?.registrationNumber || 'MK-FPO-01'}
        fpoId={user?.fpoDetails?.fpoId || 'fpo_mandikart_01'}
        district={user?.fpoDetails?.district || user?.district || 'Local District'}
        state={user?.fpoDetails?.state || user?.state || 'Maharashtra'}
      />
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
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#E2E8F0',
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: FPO_BLUE_BG,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: FPO_BLUE,
    fontWeight: '800',
  },
  listContent: {
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
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  memberCard: {
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
  memberTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: FPO_BLUE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: FPO_BLUE,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagActive: { backgroundColor: '#DEF7EC' },
  tagPending: { backgroundColor: '#FEF3C7' },
  statusTagText: { fontSize: 10, fontWeight: '800' },
  textActive: { color: '#046C4E' },
  textPending: { color: '#B45309' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  callIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: FPO_BLUE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  cropsBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  landBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  landBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  cropTag: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  cropTagText: {
    fontSize: 11,
    color: '#475569',
  },
  perfRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  perfCol: {
    flex: 1,
    alignItems: 'center',
  },
  perfLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  perfVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 1,
  },
  perfDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  decideBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  approveBtn: {
    backgroundColor: ACCENT_GREEN,
  },
  rejectBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  decideBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
