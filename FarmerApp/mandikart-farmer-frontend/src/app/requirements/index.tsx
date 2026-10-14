/**
 * MandiKart Farmer App — Requirements Dashboard Screen (Screen 13 Integrated)
 *
 * Route: /requirements
 *
 * Full integration connecting all 13 Bulk Procurement screens:
 * - Real-time tender statuses (OPEN, MATCHED, DRAFT, FULFILLED, CANCELLED)
 * - Tapping any tender navigates to /requirements/[id]
 * - Direct quick actions: Edit, Cancel, Make Recurring, Publish, Resume Draft, Duplicate
 * - Recurring schedules management tab with pause/activate controls
 * - Fast multi-field search and status tab filtering
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  Filter,
  Package,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Bookmark,
  Copy,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Repeat,
  Edit3,
  Send,
  Layers,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useRequirementsStore,
  ProcurementRequirement,
  RequirementStatus,
  RecurringSchedule,
} from '@/store/requirementsStore';

type FilterTab = 'ALL' | 'OPEN' | 'DRAFT' | 'RECURRING' | 'MATCHED' | 'CANCELLED';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Active Tenders' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'RECURRING', label: 'Recurring Schedules' },
  { key: 'MATCHED', label: 'Matched' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function RequirementsDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    requirements,
    recurringSchedules,
    isLoading,
    error,
    startNewDraft,
    loadDraft,
    deleteRequirement,
    duplicateRequirement,
    toggleRecurringScheduleStatus,
    syncWithBackend,
  } = useRequirementsStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Sync on mount
  useEffect(() => {
    syncWithBackend().catch(() => {});
  }, [syncWithBackend]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncWithBackend();
    setRefreshing(false);
  }, [syncWithBackend]);

  // Filtered requirements
  const filteredRequirements = useMemo(() => {
    return requirements.filter((item) => {
      // Status filter
      if (activeTab === 'OPEN' && item.status !== 'OPEN') return false;
      if (activeTab === 'DRAFT' && item.status !== 'DRAFT') return false;
      if (activeTab === 'MATCHED' && item.status !== 'MATCHED') return false;
      if (activeTab === 'CANCELLED' && item.status !== 'CANCELLED') return false;

      // Search filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesProducts = item.products.some((p) =>
          p.productName.toLowerCase().includes(q)
        );
        const matchesDest = item.delivery.destinationName.toLowerCase().includes(q);
        return matchesTitle || matchesId || matchesProducts || matchesDest;
      }

      return true;
    });
  }, [requirements, activeTab, searchQuery]);

  // Filtered Recurring Schedules
  const filteredRecurringSchedules = useMemo(() => {
    if (searchQuery.trim().length === 0) return recurringSchedules;
    const q = searchQuery.toLowerCase();
    return recurringSchedules.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.cropName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [recurringSchedules, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: requirements.length,
      open: requirements.filter((r) => r.status === 'OPEN').length,
      recurring: recurringSchedules.length,
      drafts: requirements.filter((r) => r.status === 'DRAFT').length,
    };
  }, [requirements, recurringSchedules]);

  // Handler: Start New Requirement
  const handleCreateRequirement = () => {
    startNewDraft();
    router.push('/requirements/create' as any);
  };

  // Handler: Resume Draft
  const handleResumeDraft = (id: string) => {
    const loaded = loadDraft(id);
    if (loaded) {
      router.push('/requirements/create' as any);
    }
  };

  // Handler: Duplicate
  const handleDuplicate = (id: string) => {
    const newDraftId = duplicateRequirement(id);
    if (newDraftId) {
      Alert.alert(
        'Requirement Duplicated',
        'A copy has been created as a new draft. Would you like to review it now?',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Open Draft',
            onPress: () => router.push('/requirements/create' as any),
          },
        ]
      );
    }
  };

  // Handler: Delete Draft
  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Requirement?',
      `Are you sure you want to remove "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRequirement(id);
          },
        },
      ]
    );
  };

  // Status Badge UI
  const renderStatusBadge = (status: RequirementStatus, version?: number) => {
    switch (status) {
      case 'OPEN':
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
              <View style={[styles.statusDot, { backgroundColor: '#15803D' }]} />
              <Text style={[styles.statusText, { color: '#166534' }]}>Open Tender</Text>
            </View>
            {version && version > 1 ? (
              <View style={styles.miniVersionPill}>
                <Text style={styles.miniVersionPillText}>v{version}</Text>
              </View>
            ) : null}
          </View>
        );
      case 'MATCHED':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#E0F2FE' }]}>
            <Sparkles size={11} color="#0284C7" />
            <Text style={[styles.statusText, { color: '#0369A1' }]}>Matched</Text>
          </View>
        );
      case 'DRAFT':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
            <Bookmark size={11} color="#B45309" />
            <Text style={[styles.statusText, { color: '#B45309' }]}>Draft</Text>
          </View>
        );
      case 'FULFILLED':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#F3E8FF' }]}>
            <CheckCircle2 size={11} color="#7E22CE" />
            <Text style={[styles.statusText, { color: '#6B21A8' }]}>Fulfilled</Text>
          </View>
        );
      case 'IN_NEGOTIATION':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FFF7ED' }]}>
            <Clock size={11} color="#C2410C" />
            <Text style={[styles.statusText, { color: '#C2410C' }]}>In Negotiation</Text>
          </View>
        );
      case 'CANCELLED':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
            <XCircle size={11} color="#DC2626" />
            <Text style={[styles.statusText, { color: '#B91C1C' }]}>Cancelled</Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <ArrowLeft size={22} color={MKColors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerSubtitle}>MandiKart Procurement Hub</Text>
          <Text style={styles.headerTitle}>Bulk Requirements</Text>
        </View>
        <Pressable
          style={styles.headerCreateBtn}
          onPress={handleCreateRequirement}
          accessibilityLabel="Create Requirement"
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.headerCreateBtnText}>New Tender</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={MKColors.primaryGreen}
            colors={[MKColors.primaryGreen]}
          />
        }
      >
        {/* ── Stats Strip ─────────────────────────────────────── */}
        <View style={styles.statsStrip}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{stats.total}</Text>
            <Text style={styles.statLbl}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: MKColors.primaryGreen }]}>
              {stats.open}
            </Text>
            <Text style={styles.statLbl}>Active Bids</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#2563EB' }]}>
              {stats.recurring}
            </Text>
            <Text style={styles.statLbl}>Recurring</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: MKColors.accentOrange }]}>
              {stats.drafts}
            </Text>
            <Text style={styles.statLbl}>Drafts</Text>
          </View>
        </View>

        {/* ── Search Bar ───────────────────────────────────────── */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search crop, tender ID, depot..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <X size={16} color="#6B7280" />
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Filter Tabs ──────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            let count = 0;
            if (tab.key === 'ALL') count = requirements.length;
            else if (tab.key === 'OPEN')
              count = requirements.filter((r) => r.status === 'OPEN').length;
            else if (tab.key === 'DRAFT')
              count = requirements.filter((r) => r.status === 'DRAFT').length;
            else if (tab.key === 'RECURRING')
              count = recurringSchedules.length;
            else if (tab.key === 'MATCHED')
              count = requirements.filter((r) => r.status === 'MATCHED').length;
            else if (tab.key === 'CANCELLED')
              count = requirements.filter((r) => r.status === 'CANCELLED').length;

            return (
              <Pressable
                key={tab.key}
                style={[styles.tabChip, isSelected && styles.tabChipActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.tabCountBadge,
                      isSelected && styles.tabCountBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabCountText,
                        isSelected && styles.tabCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Error Banner if any ──────────────────────────────── */}
        {error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color="#DC2626" />
            <Text style={styles.errorBannerText}>{error}</Text>
            <Pressable onPress={() => syncWithBackend()} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* ── Recurring Schedules View (when RECURRING tab selected) ── */}
        {activeTab === 'RECURRING' ? (
          <View style={{ gap: 12 }}>
            <View style={styles.recurringTabHeader}>
              <View>
                <Text style={styles.recurringTabTitle}>Automated Supply Schedules</Text>
                <Text style={styles.recurringTabSub}>Repeat weekly and monthly orders</Text>
              </View>
              <Pressable
                style={styles.newRecurringBtn}
                onPress={() => router.push('/requirements/recurring' as any)}
              >
                <Plus size={14} color="#FFFFFF" />
                <Text style={styles.newRecurringBtnText}>New Schedule</Text>
              </Pressable>
            </View>

            {filteredRecurringSchedules.length === 0 ? (
              <View style={styles.emptyState}>
                <Repeat size={36} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No Recurring Schedules Active</Text>
                <Text style={styles.emptySubtitle}>
                  Set up automated repeat batches for stable institutional supply and forward contract bookings.
                </Text>
                <Pressable
                  style={styles.emptyCreateBtn}
                  onPress={() => router.push('/requirements/recurring' as any)}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.emptyCreateBtnText}>Create Recurring Schedule</Text>
                </Pressable>
              </View>
            ) : (
              filteredRecurringSchedules.map((schedule) => {
                const isActive = schedule.status === 'ACTIVE';
                return (
                  <View key={schedule.id} style={styles.scheduleCard}>
                    <View style={styles.scheduleHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                        <Text style={styles.scheduleSub}>
                          {schedule.cropName} • {schedule.frequency} ({schedule.preferredDeliveryDay}s)
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: isActive ? '#DCFCE7' : '#F1F5F9' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: isActive ? '#15803D' : '#64748B' },
                          ]}
                        >
                          {schedule.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.scheduleMetricRow}>
                      <View style={styles.scheduleMetricCol}>
                        <Text style={styles.schedMetricLbl}>Batch Volume</Text>
                        <Text style={styles.schedMetricVal}>
                          {schedule.quantityPerCycle} {schedule.unit}
                        </Text>
                      </View>
                      <View style={styles.schedDivider} />
                      <View style={styles.scheduleMetricCol}>
                        <Text style={styles.schedMetricLbl}>Target Price</Text>
                        <Text style={styles.schedMetricVal}>
                          ₹{schedule.targetPricePerUnit}/{schedule.unit}
                        </Text>
                      </View>
                      <View style={styles.schedDivider} />
                      <View style={styles.scheduleMetricCol}>
                        <Text style={styles.schedMetricLbl}>Next Dispatch</Text>
                        <Text style={[styles.schedMetricVal, { color: '#2563EB' }]}>
                          {schedule.nextDispatchDate}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.scheduleActionRow}>
                      <Pressable
                        style={styles.toggleScheduleBtn}
                        onPress={() => toggleRecurringScheduleStatus(schedule.id)}
                      >
                        {isActive ? (
                          <>
                            <PauseCircle size={15} color="#D97706" />
                            <Text style={[styles.toggleText, { color: '#D97706' }]}>
                              Pause Schedule
                            </Text>
                          </>
                        ) : (
                          <>
                            <PlayCircle size={15} color="#15803D" />
                            <Text style={[styles.toggleText, { color: '#15803D' }]}>
                              Resume Schedule
                            </Text>
                          </>
                        )}
                      </Pressable>

                      <Pressable
                        style={styles.viewScheduleLinkedBtn}
                        onPress={() =>
                          router.push(`/requirements/${schedule.requirementId}` as any)
                        }
                      >
                        <Text style={styles.viewScheduleLinkedText}>View Tender</Text>
                        <ChevronRight size={14} color="#0284C7" />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          /* ── Requirements Tender Cards List ────────────────────── */
          isLoading && requirements.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={MKColors.primaryGreen} />
              <Text style={styles.loadingText}>Loading procurement tenders...</Text>
            </View>
          ) : filteredRequirements.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Layers size={36} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No Tenders Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery.length > 0
                  ? 'No requirements matching your search query. Try another keyword.'
                  : activeTab === 'DRAFT'
                  ? 'You have no saved drafts right now.'
                  : activeTab === 'CANCELLED'
                  ? 'No cancelled tenders in your archive.'
                  : 'Publish procurement demands to match with verified suppliers and secure wholesale pricing.'}
              </Text>
              <Pressable
                style={styles.emptyCreateBtn}
                onPress={handleCreateRequirement}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.emptyCreateBtnText}>Create New Requirement</Text>
              </Pressable>
            </View>
          ) : (
            filteredRequirements.map((item) => {
              const isDraft = item.status === 'DRAFT';
              const isOpen = item.status === 'OPEN' || item.status === 'MATCHED';
              const isCancelled = item.status === 'CANCELLED';
              const firstProduct = item.products[0];

              return (
                <Pressable
                  key={item.id}
                  style={styles.card}
                  onPress={() => router.push(`/requirements/${item.id}` as any)}
                >
                  {/* Header: ID + Title + Status */}
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.cardId}>{item.id}</Text>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                    {renderStatusBadge(item.status, item.version)}
                  </View>

                  {/* Recurring schedule pill if applicable */}
                  {item.isRecurring && (
                    <View style={styles.recurringBadgeStrip}>
                      <Repeat size={12} color="#1E40AF" />
                      <Text style={styles.recurringBadgeText}>
                        Recurring Schedule Active ({item.recurringFrequency || 'Weekly'})
                      </Text>
                    </View>
                  )}

                  {/* Cancellation Reason alert on card if cancelled */}
                  {isCancelled && item.cancellationReason ? (
                    <View style={styles.cancelCardReasonBox}>
                      <Text style={styles.cancelCardReasonText} numberOfLines={1}>
                        Reason: {item.cancellationReason}
                      </Text>
                    </View>
                  ) : null}

                  {/* Products Badge Row */}
                  <View style={styles.productsChipRow}>
                    {item.products.map((p) => (
                      <View key={p.productId} style={styles.productPill}>
                        <Text style={styles.productPillText}>
                          {p.productName} ({p.grade})
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Key Metrics: Quantity & Total Budget */}
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Total Volume</Text>
                      <Text style={styles.metricValue}>
                        {item.totalQuantity.toLocaleString()} {item.primaryUnit}
                      </Text>
                      {firstProduct && (
                        <Text style={styles.metricSub}>
                          Target: ₹{firstProduct.targetPricePerUnit}/{firstProduct.unit}
                        </Text>
                      )}
                    </View>

                    <View style={styles.metricDivider} />

                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Estimated Budget</Text>
                      <Text
                        style={[
                          styles.metricValue,
                          { color: MKColors.primaryGreenDark },
                        ]}
                      >
                        ₹{item.totalBudget.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.metricSub}>Direct Escrow</Text>
                    </View>
                  </View>

                  {/* Delivery Information Strip */}
                  <View style={styles.deliveryStrip}>
                    <View style={styles.deliveryStripItem}>
                      <Calendar size={13} color="#4B5563" />
                      <Text style={styles.deliveryStripText}>
                        By {item.delivery.deliveryDate}
                      </Text>
                    </View>
                    <View style={styles.deliveryStripItem}>
                      <MapPin size={13} color="#4B5563" />
                      <Text style={styles.deliveryStripText} numberOfLines={1}>
                        {item.delivery.destinationName}
                      </Text>
                    </View>
                  </View>

                  {/* Matched Suppliers Indicator if matched */}
                  {item.matchedSuppliersCount > 0 && isOpen && (
                    <Pressable
                      style={styles.matchBanner}
                      onPress={() => router.push(`/matching/matches?id=${item.id}` as any)}
                    >
                      <Sparkles size={14} color="#0284C7" />
                      <Text style={styles.matchBannerText}>
                        <Text style={{ fontWeight: '700' }}>
                          {item.matchedSuppliersCount} Suppliers Matched
                        </Text>{' '}
                        • Tap to view quotes & recommendations
                      </Text>
                      <ChevronRight size={14} color="#0284C7" />
                    </Pressable>
                  )}

                  {/* Action Buttons Row */}
                  <View style={styles.cardActionsRow}>
                    {isDraft ? (
                      <>
                        <Pressable
                          style={styles.resumeDraftBtn}
                          onPress={() => handleResumeDraft(item.id)}
                        >
                          <Edit3 size={14} color="#FFFFFF" />
                          <Text style={styles.resumeDraftBtnText}>Resume Draft</Text>
                        </Pressable>
                        <Pressable
                          style={styles.publishTenderBtn}
                          onPress={() =>
                            router.push(`/requirements/publish?id=${item.id}` as any)
                          }
                        >
                          <Send size={14} color="#FFFFFF" />
                          <Text style={styles.publishTenderBtnText}>Publish</Text>
                        </Pressable>
                        <Pressable
                          style={styles.iconActionBtn}
                          onPress={() => handleDelete(item.id, item.title)}
                        >
                          <Trash2 size={16} color="#DC2626" />
                        </Pressable>
                      </>
                    ) : isOpen ? (
                      <>
                        <Pressable
                          style={styles.viewMatchesBtn}
                          onPress={() => router.push(`/matching/matches?id=${item.id}` as any)}
                        >
                          <Text style={styles.viewMatchesBtnText}>
                            View Matches ({item.matchedSuppliersCount || 3})
                          </Text>
                          <ChevronRight size={14} color="#15803D" />
                        </Pressable>

                        <Pressable
                          style={styles.editActionBtn}
                          onPress={() =>
                            router.push(`/requirements/edit?id=${item.id}` as any)
                          }
                        >
                          <Edit3 size={14} color="#475569" />
                          <Text style={styles.editActionBtnText}>Edit</Text>
                        </Pressable>

                        <Pressable
                          style={styles.iconActionBtn}
                          onPress={() =>
                            router.push(`/requirements/cancel?id=${item.id}` as any)
                          }
                        >
                          <XCircle size={16} color="#DC2626" />
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <Pressable
                          style={styles.viewMatchesBtn}
                          onPress={() => router.push(`/requirements/${item.id}` as any)}
                        >
                          <Text style={styles.viewMatchesBtnText}>View Record</Text>
                          <ChevronRight size={14} color="#15803D" />
                        </Pressable>
                        <Pressable
                          style={styles.duplicateBtn}
                          onPress={() => handleDuplicate(item.id)}
                        >
                          <Copy size={14} color="#475569" />
                          <Text style={styles.duplicateBtnText}>Duplicate</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </Pressable>
              );
            })
          )
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: MKColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  headerCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MKColors.primaryGreen,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  headerCreateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: MKColors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  searchSection: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: MKColors.textPrimary,
    paddingVertical: 0,
  },
  tabsContainer: {
    paddingBottom: 14,
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  tabChipActive: {
    backgroundColor: MKColors.primaryGreen,
    borderColor: MKColors.primaryGreen,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabCountBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabCountTextActive: {
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DC2626',
    borderRadius: 6,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: MKColors.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: MKColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MKColors.primaryGreen,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  emptyCreateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardId: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.textSecondary,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  miniVersionPill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniVersionPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  recurringBadgeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  recurringBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  cancelCardReasonBox: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  cancelCardReasonText: {
    fontSize: 11,
    color: '#991B1B',
    fontWeight: '600',
  },
  productsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  productPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  productPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: MKColors.textSecondary,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginTop: 2,
  },
  metricSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  deliveryStrip: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  deliveryStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  deliveryStripText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  matchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 10,
  },
  matchBannerText: {
    fontSize: 12,
    color: '#1E40AF',
    flex: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  resumeDraftBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  resumeDraftBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  publishTenderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803D',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  publishTenderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewMatchesBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  viewMatchesBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  editActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  editActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  duplicateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  duplicateBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  iconActionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recurringTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recurringTabTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  recurringTabSub: {
    fontSize: 11,
    color: MKColors.textSecondary,
  },
  newRecurringBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  newRecurringBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  scheduleSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  scheduleMetricRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  scheduleMetricCol: {
    flex: 1,
  },
  schedMetricLbl: {
    fontSize: 10,
    color: MKColors.textSecondary,
  },
  schedMetricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.textPrimary,
    marginTop: 2,
  },
  schedDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 6,
  },
  scheduleActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  toggleScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  viewScheduleLinkedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewScheduleLinkedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
});
