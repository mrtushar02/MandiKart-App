/**
 * MandiKart — Produce Screen ("My Crop Intelligence Center")
 *
 * Core Farmer Workflow:
 * WHAT DO I HAVE? -> HOW MUCH? -> CROP CONDITION -> HOW MANY DAYS REMAINING?
 * -> MARKET DEMAND & PRICE -> WHICH CROP NEEDS ATTENTION? -> READY TO SELL
 *
 * Designed with UI UX Pro Max standards:
 * - Proper simple English throughout
 * - Fully interactive top summary metric cards that filter crops dynamically
 * - Visual active state feedback
 * - Strict AGMARKNET/e-NAM data integrity
 * - Freshness estimation with clear disclaimers
 * - Direct routing to /produce/add, /produce/[id], and /sell/best-options
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Search,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Building2,
  Info,
  X,
  ChevronRight,
  Sparkles,
  PackageCheck,
  Scale,
  Warehouse,
  Globe,
  Bell,
  HelpCircle,
  Layers,
  Lock,
  Edit3,
  Trash2,
  Check,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useProduceStore, CropItem, CropCondition } from '@/store/produceStore';
import { useAuthStore } from '@/store/authStore';
import FPOInventoryScreen from '@/components/fpo/FPOInventoryScreen';
import { resolveCropThumbnail } from '@/utils/cropThumbnail';

export default function ProduceScreen() {
  const user = useAuthStore((state) => state.user);

  // ── FPO BRANCH: Return dedicated bulk lot aggregation & grading screen ──
  if (user?.role === 'FPO') {
    return <FPOInventoryScreen />;
  }

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const crops = useProduceStore((state) => state.crops);
  const [refreshing, setRefreshing] = useState(false);

  // Stable ref guard: prevent duplicate sync calls during tab switches
  const isSyncing = useRef(false);

  // Use getState() directly — avoids subscribing to syncWithBackend reference
  // which changes on every store update and causes focus-loop crashes
  useFocusEffect(
    useCallback(() => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      useProduceStore.getState().syncWithBackend().finally(() => {
        isSyncing.current = false;
      });
    }, []) // empty deps — intentional, getState() is always stable
  );

  // Continuous 4-second real-time auto-refresh on Produce screen
  React.useEffect(() => {
    useProduceStore.getState().syncWithBackend().catch(() => {});
    const timer = setInterval(() => {
      useProduceStore.getState().syncWithBackend().catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await useProduceStore.getState().syncWithBackend();
    setRefreshing(false);
  }, []);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'available' | 'reserved' | 'attention' | 'high_demand'>('all');
  const [freshnessModalVisible, setFreshnessModalVisible] = useState(false);
  const [selectedCropForInfo, setSelectedCropForInfo] = useState<CropItem | null>(null);

  // Derived Metrics for Summary Strip
  const totalCropsCount = crops.length;
  const totalAvailableKg = crops.reduce((sum, c) => sum + c.availableKg, 0);
  const totalReservedKg = crops.reduce((sum, c) => sum + c.reservedKg, 0);
  const attentionCropsCount = crops.filter(
    (c) => c.condition !== 'Good' || c.shelfLifeDaysEstMax <= 5
  ).length;
  const pendingCropsCount = crops.filter((c) => c.status === 'PENDING_APPROVAL').length;

  // Quick-Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCrop, setEditingCrop] = useState<CropItem | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editVariety, setEditVariety] = useState('');
  const [editCondition, setEditCondition] = useState<CropCondition>('Good');

  const handleOpenEditModal = (crop: CropItem) => {
    setEditingCrop(crop);
    setEditQuantity((crop.availableKg || 0).toString());
    setEditPrice((crop.expectedPricePerKg || crop.referencePricePerKg || 30).toString());
    setEditVariety(crop.variety || '');
    setEditCondition(crop.condition || 'Good');
    setEditModalVisible(true);
  };

  const handleSaveQuickEdit = () => {
    if (!editingCrop) return;
    const qty = parseFloat(editQuantity);
    const prc = parseFloat(editPrice);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid stock quantity in kg.');
      return;
    }
    if (isNaN(prc) || prc < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid expected price per kg.');
      return;
    }

    useProduceStore.getState().updateCropDetails(editingCrop.id, {
      availableKg: qty,
      expectedPricePerKg: prc,
      variety: editVariety.trim() || editingCrop.variety,
      condition: editCondition,
      conditionUpdatedAt: 'Today',
    });

    setEditModalVisible(false);
    Alert.alert('Produce Updated 🌾', `${editingCrop.cropName} details have been saved.`);
  };

  const handleDeleteCrop = (crop: CropItem) => {
    Alert.alert(
      'Delete Produce Listing',
      `Are you sure you want to remove ${crop.cropName} from your inventory? This action is permanent.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            useProduceStore.getState().deleteCrop(crop.id);
            Alert.alert('Produce Deleted', `${crop.cropName} has been removed from your inventory.`);
          },
        },
      ]
    );
  };

  // Filtered crops based on active search and activeFilter (Always sorted newest first)
  const filteredCrops = useMemo(() => {
    const list = crops.filter((crop) => {
      const matchesSearch =
        crop.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (crop.variety && crop.variety.toLowerCase().includes(searchQuery.toLowerCase())) ||
        crop.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === 'pending') {
        return crop.status === 'PENDING_APPROVAL';
      }
      if (activeFilter === 'attention') {
        return crop.condition !== 'Good' || crop.shelfLifeDaysEstMax <= 5;
      }
      if (activeFilter === 'available') {
        return crop.availableKg > 0;
      }
      if (activeFilter === 'reserved') {
        return crop.reservedKg > 0;
      }
      if (activeFilter === 'high_demand') {
        return crop.marketDemand === 'High';
      }
      return true;
    });

    return list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [crops, searchQuery, activeFilter]);

  // Urgent attention crops
  const urgentCrops = useMemo(() => {
    return crops.filter((c) => c.condition !== 'Good' || c.shelfLifeDaysEstMax <= 5);
  }, [crops]);

  const formatQuantity = (kg: number) => {
    if (kg >= 1000) {
      const quintals = kg / 100;
      return `${quintals % 1 === 0 ? quintals : quintals.toFixed(1)} Qtl (${kg.toLocaleString()} kg)`;
    }
    return `${kg.toLocaleString()} kg`;
  };

  const getConditionConfig = (condition: CropCondition) => {
    switch (condition) {
      case 'Good':
        return {
          label: 'Good Condition',
          color: MKColors.primaryGreen,
          bg: MKColors.primaryGreenSurface,
          icon: CheckCircle2,
        };
      case 'Needs Attention':
        return {
          label: 'Needs Attention',
          color: MKColors.accentOrange,
          bg: MKColors.accentOrangeSurface,
          icon: AlertTriangle,
        };
      case 'Deteriorating':
        return {
          label: 'Deteriorating',
          color: '#DC2626',
          bg: '#FEE2E2',
          icon: AlertCircle,
        };
      default:
        return {
          label: 'Check Pending',
          color: '#6B7280',
          bg: '#F3F4F6',
          icon: HelpCircle,
        };
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header ────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerSubtitle}>MandiKart Inventory & Intel</Text>
          <Text style={styles.headerTitle}>My Produce</Text>
        </View>

        <View style={styles.headerActionsGroup}>
          <Pressable
            style={styles.headerIconButton}
            onPress={() => router.push('/more/notifications')}
            accessibilityLabel="Notifications"
            hitSlop={8}
          >
            <Bell size={20} color={MKColors.textPrimary} />
            {attentionCropsCount > 0 && <View style={styles.notificationDot} />}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.screenScrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[MKColors.primaryGreen]}
            tintColor={MKColors.primaryGreen}
          />
        }
      >
        {/* ── Interactive Summary Strip: 4 Key Metric Cards ────────── */}
        <View style={styles.summaryStrip}>
          {/* Card 1: Total Crops */}
          <Pressable
            style={({ pressed }) => [
              styles.metricCard,
              activeFilter === 'all' && styles.metricCardActive,
              pressed && styles.pressedMetric,
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#E8F5E9' }]}>
              <PackageCheck size={18} color={MKColors.primaryGreen} />
            </View>
            <Text style={styles.metricValue}>{totalCropsCount}</Text>
            <Text style={styles.metricLabel}>Total Crops</Text>
            {activeFilter === 'all' && <View style={styles.activeBar} />}
          </Pressable>

          {/* Card 2: Available Stock */}
          <Pressable
            style={({ pressed }) => [
              styles.metricCard,
              activeFilter === 'available' && styles.metricCardActive,
              pressed && styles.pressedMetric,
            ]}
            onPress={() => setActiveFilter('available')}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#FFF3E0' }]}>
              <Scale size={18} color={MKColors.accentOrange} />
            </View>
            <Text style={styles.metricValue}>{(totalAvailableKg / 100).toFixed(0)} Qtl</Text>
            <Text style={styles.metricLabel}>Available</Text>
            {activeFilter === 'available' && <View style={styles.activeBar} />}
          </Pressable>

          {/* Card 3: Reserved Stock */}
          <Pressable
            style={({ pressed }) => [
              styles.metricCard,
              activeFilter === 'reserved' && styles.metricCardActive,
              pressed && styles.pressedMetric,
            ]}
            onPress={() => setActiveFilter('reserved')}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: '#F0F9FF' }]}>
              <Warehouse size={18} color="#0284C7" />
            </View>
            <Text style={styles.metricValue}>{(totalReservedKg / 100).toFixed(0)} Qtl</Text>
            <Text style={styles.metricLabel}>Reserved</Text>
            {activeFilter === 'reserved' && <View style={styles.activeBar} />}
          </Pressable>

          {/* Card 4: Needs Attention */}
          <Pressable
            style={({ pressed }) => [
              styles.metricCard,
              attentionCropsCount > 0 && styles.metricCardAlert,
              activeFilter === 'attention' && styles.metricCardActiveAlert,
              pressed && styles.pressedMetric,
            ]}
            onPress={() => setActiveFilter('attention')}
          >
            <View
              style={[
                styles.metricIconWrap,
                { backgroundColor: attentionCropsCount > 0 ? '#FEE2E2' : '#F3F4F6' },
              ]}
            >
              <AlertTriangle
                size={18}
                color={attentionCropsCount > 0 ? '#DC2626' : '#6B7280'}
              />
            </View>
            <Text
              style={[
                styles.metricValue,
                attentionCropsCount > 0 && { color: '#DC2626' },
              ]}
            >
              {attentionCropsCount}
            </Text>
            <Text style={styles.metricLabel}>Attention</Text>
            {activeFilter === 'attention' && (
              <View
                style={[
                  styles.activeBar,
                  { backgroundColor: attentionCropsCount > 0 ? '#DC2626' : MKColors.primaryGreen },
                ]}
              />
            )}
          </Pressable>
        </View>

        {/* ── Primary CTA: "+ Add New Crop" ──────────────────────── */}
        <Pressable
          style={({ pressed }) => [styles.addProduceCta, pressed && styles.pressedCard]}
          onPress={() => router.push('/produce/add')}
        >
          <View style={styles.addCtaContent}>
            <View style={styles.addCtaPlusCircle}>
              <Plus size={24} color="#FFFFFF" strokeWidth={2.8} />
            </View>
            <View style={styles.addCtaTextGroup}>
              <View style={styles.addCtaBadgeRow}>
                <Text style={styles.addCtaTitle}>+ Add New Crop</Text>
                <View style={styles.quickAddBadge}>
                  <Sparkles size={11} color="#FFFFFF" />
                  <Text style={styles.quickAddBadgeText}>Quick Intake</Text>
                </View>
              </View>
              <Text style={styles.addCtaSubtitle}>
                Add your harvest to monitor freshness, track market price, and find verified buyers
              </Text>
            </View>
            <ChevronRight size={22} color={MKColors.primaryGreen} />
          </View>
        </Pressable>

        {/* ── Search & Filter Chips ──────────────────────────────── */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={18} color={MKColors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search crop, variety, or category..."
              placeholderTextColor={MKColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                <X size={16} color={MKColors.textSecondary} />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
          >
            <Pressable
              style={[
                styles.filterChip,
                activeFilter === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'all' && styles.filterChipTextActive,
                ]}
              >
                All Crops ({crops.length})
              </Text>
            </Pressable>

            {pendingCropsCount > 0 && (
              <Pressable
                style={[
                  styles.filterChip,
                  {
                    borderColor: '#F59E0B',
                    backgroundColor: activeFilter === 'pending' ? '#F59E0B' : '#FEF3C7',
                  },
                ]}
                onPress={() => setActiveFilter(activeFilter === 'pending' ? 'all' : 'pending')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: activeFilter === 'pending' ? '#FFFFFF' : '#92400E',
                      fontWeight: '800',
                    },
                  ]}
                >
                  🟡 Pending Approval ({pendingCropsCount})
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[
                styles.filterChip,
                activeFilter === 'attention' && styles.filterChipActiveAlert,
              ]}
              onPress={() => setActiveFilter('attention')}
            >
              <AlertTriangle
                size={13}
                color={activeFilter === 'attention' ? '#DC2626' : MKColors.accentOrange}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'attention' && styles.filterChipTextActiveAlert,
                ]}
              >
                Needs Attention ({attentionCropsCount})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                activeFilter === 'available' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('available')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'available' && styles.filterChipTextActive,
                ]}
              >
                Available Stock
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                activeFilter === 'reserved' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('reserved')}
            >
              <Lock
                size={12}
                color={activeFilter === 'reserved' ? '#FFFFFF' : MKColors.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'reserved' && styles.filterChipTextActive,
                ]}
              >
                Reserved Stock ({totalReservedKg > 0 ? `${(totalReservedKg / 100).toFixed(0)} Qtl` : '0'})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                activeFilter === 'high_demand' && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter('high_demand')}
            >
              <TrendingUp
                size={13}
                color={activeFilter === 'high_demand' ? '#FFFFFF' : MKColors.primaryGreen}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'high_demand' && styles.filterChipTextActive,
                ]}
              >
                High Market Demand
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* ── Section Level 1: "My Crops" ────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Inventory</Text>
          <Text style={styles.sectionCountText}>{filteredCrops.length} crop{filteredCrops.length !== 1 ? 's' : ''}</Text>
        </View>

        {filteredCrops.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIcon}>
              <PackageCheck size={40} color={MKColors.textSecondary} />
            </View>
            <Text style={styles.emptyStateTitle}>No crops found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery
                ? `No crops matched your search for "${searchQuery}".`
                : activeFilter === 'reserved'
                ? 'No crops currently have reserved stock.'
                : activeFilter === 'attention'
                ? 'All your crops are in good condition!'
                : 'You have not added any crops yet. Tap below to add your first harvest.'}
            </Text>
            <Pressable
              style={styles.emptyStateButton}
              onPress={() => {
                setSearchQuery('');
                setActiveFilter('all');
                router.push('/produce/add' as any);
              }}
            >
              <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyStateButtonText}>Add New Harvest</Text>
            </Pressable>
          </View>
        ) : (
          (filteredCrops || []).filter(Boolean).map((crop, idx) => {
            const cond = getConditionConfig(crop.condition);
            const CondIcon = cond.icon;
            const stockPct =
              crop.totalKg > 0 ? Math.min(100, Math.round((crop.availableKg / crop.totalKg) * 100)) : 0;

            return (
              <View key={`${crop.id || 'crop'}_${idx}`} style={styles.cropCard}>
                {/* Crop Top Info */}
                <View style={styles.cropCardTopRow}>
                  <Image source={{ uri: resolveCropThumbnail(crop.cropName, crop.category, crop.imageUri) }} style={styles.cropThumbnail} />
                  <View style={styles.cropMetaInfo}>
                    <View style={styles.cropTitleBadgeRow}>
                      <Text style={styles.cropCardTitle} numberOfLines={1} ellipsizeMode="tail">
                        {crop.cropName || 'Fresh Produce'}
                      </Text>
                      <View style={styles.gradeBadge}>
                        <Text style={styles.gradeBadgeText}>{crop.grade || 'Grade A'}</Text>
                      </View>
                    </View>
                    <Text style={styles.cropVarietyText} numberOfLines={1} ellipsizeMode="tail">
                      {crop.variety ? crop.variety : (crop.category || 'Vegetables')} • {crop.storageType || 'Warehouse'}
                    </Text>

                    {/* Status & Condition Badges */}
                    <View style={styles.cropBadgeRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          crop.status === 'PENDING_APPROVAL'
                            ? styles.statusBadgePending
                            : crop.status === 'APPROVED'
                            ? { backgroundColor: '#E0F2FE', borderColor: '#38BDF8' }
                            : crop.status === 'REJECTED'
                            ? styles.statusBadgeRejected
                            : styles.statusBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            crop.status === 'PENDING_APPROVAL'
                              ? styles.statusBadgeTextPending
                              : crop.status === 'APPROVED'
                              ? { color: '#0369A1' }
                              : crop.status === 'REJECTED'
                              ? styles.statusBadgeTextRejected
                              : styles.statusBadgeTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {crop.status === 'PENDING_APPROVAL'
                            ? '🟡 Pending Approval'
                            : crop.status === 'APPROVED'
                            ? '🟢 Approved — Ready to List'
                            : crop.status === 'REJECTED'
                            ? '🔴 Rejected'
                            : '🟢 Live Marketplace'}
                        </Text>
                      </View>

                      {/* Condition Chip */}
                      <View style={[styles.conditionChip, { backgroundColor: cond.bg }]}>
                        <CondIcon size={12} color={cond.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.conditionChipText, { color: cond.color }]} numberOfLines={1}>
                          {cond.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Stock Level Bar */}
                <View style={styles.stockProgressContainer}>
                  <View style={styles.stockLabelRow}>
                    <Text style={styles.stockStatusLabel} numberOfLines={1}>
                      Available: <Text style={styles.stockHighlight}>{formatQuantity(crop.availableKg || 0)}</Text>
                    </Text>
                    <Text style={styles.stockTotalLabel} numberOfLines={1}>Total: {formatQuantity(crop.totalKg || 0)}</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${stockPct}%`,
                          backgroundColor:
                            crop.condition === 'Good' ? MKColors.primaryGreen : MKColors.accentOrange,
                        },
                      ]}
                    />
                  </View>
                  {(crop.reservedKg || 0) > 0 && (
                    <Text style={styles.reservedSubtext} numberOfLines={1} ellipsizeMode="tail">
                      🔒 {crop.reservedKg.toLocaleString()} kg reserved for confirmed buyer orders
                    </Text>
                  )}
                </View>

                {/* Intelligence Insights Strip */}
                <View style={styles.cropIntelligenceStrip}>
                  {/* Freshness Window */}
                  <Pressable
                    style={styles.intelligencePill}
                    onPress={() => {
                      setSelectedCropForInfo(crop);
                      setFreshnessModalVisible(true);
                    }}
                  >
                    <Clock
                      size={13}
                      color={(crop.shelfLifeDaysEstMax || 7) <= 5 ? '#DC2626' : MKColors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.intelligenceText,
                        (crop.shelfLifeDaysEstMax || 7) <= 5 && { color: '#DC2626', fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Approx. {crop.shelfLifeDaysEstMin || 3}–{crop.shelfLifeDaysEstMax || 7} days
                    </Text>
                    <Info size={11} color={MKColors.textMuted} style={{ marginLeft: 2 }} />
                  </Pressable>

                  {/* Mandi Reference Price & Movement */}
                  <View style={styles.intelligencePill}>
                    <Building2 size={12} color={MKColors.textSecondary} />
                    <Text style={styles.intelligenceText} numberOfLines={1} ellipsizeMode="tail">
                      ₹{crop.referencePricePerKg || 25}/kg
                    </Text>
                    {(crop.priceMovementPct || 0) !== 0 && (
                      <View
                        style={[
                          styles.trendBadge,
                          crop.priceMovementTrend === 'up'
                            ? styles.trendBadgeUp
                            : styles.trendBadgeDown,
                        ]}
                      >
                        {crop.priceMovementTrend === 'up' ? (
                          <TrendingUp size={10} color={MKColors.primaryGreen} />
                        ) : (
                          <TrendingDown size={10} color="#DC2626" />
                        )}
                        <Text
                          style={[
                            styles.trendBadgeText,
                            crop.priceMovementTrend === 'up'
                              ? { color: MKColors.primaryGreen }
                              : { color: '#DC2626' },
                          ]}
                          numberOfLines={1}
                        >
                          {crop.priceMovementPct > 0 ? `+${crop.priceMovementPct}%` : `${crop.priceMovementPct}%`}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Source Verified Badge */}
                <View style={styles.sourceVerifiedRow}>
                  <ShieldCheck size={12} color={MKColors.primaryGreen} />
                  <Text style={styles.sourceVerifiedText} numberOfLines={1} ellipsizeMode="tail">
                    Benchmark: {crop.marketName || 'APMC Mandi'} ({crop.marketSource || 'Official Feed'}) • {crop.marketLastUpdated || 'Today'}
                  </Text>
                </View>

                {/* Card Action Buttons */}
                <View style={styles.cropCardActionRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.cardEditBtn,
                      pressed && styles.pressedButton,
                    ]}
                    onPress={() => handleOpenEditModal(crop)}
                    hitSlop={6}
                    accessibilityLabel="Edit Crop"
                  >
                    <Edit3 size={13} color={MKColors.primaryGreen} />
                    <Text style={styles.cardEditBtnText} numberOfLines={1}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.cardDeleteBtn,
                      pressed && styles.pressedButton,
                    ]}
                    onPress={() => handleDeleteCrop(crop)}
                    hitSlop={6}
                    accessibilityLabel="Delete Crop"
                  >
                    <Trash2 size={13} color="#DC2626" />
                    <Text style={styles.cardDeleteBtnText} numberOfLines={1}>Delete</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.detailsButton,
                      pressed && styles.pressedButton,
                    ]}
                    onPress={() => router.push(`/produce/${crop.id}` as any)}
                  >
                    <Text style={styles.detailsButtonText} numberOfLines={1}>Intel</Text>
                  </Pressable>

                  {crop.status === 'REJECTED' ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.sellCropButton,
                        styles.sellCropButtonRejected,
                        pressed && styles.pressedButton,
                      ]}
                      onPress={() =>
                        Alert.alert(
                          'Produce Verification Notice',
                          'This produce listing was rejected by MandiKart Admin during quality moderation and cannot be sold. Please review quality standards or add a compliant harvest batch.',
                          [{ text: 'Understood', style: 'default' }]
                        )
                      }
                    >
                      <AlertCircle size={13} color="#DC2626" style={{ marginRight: 4 }} />
                      <Text style={styles.sellCropButtonTextRejected} numberOfLines={1}>Rejected</Text>
                    </Pressable>
                  ) : crop.status === 'APPROVED' ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.sellCropButton,
                        { backgroundColor: '#166534' },
                        pressed && styles.pressedButton,
                      ]}
                      onPress={() => router.push('/(tabs)/sell')}
                    >
                      <Globe size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={[styles.sellCropButtonText, { color: '#FFFFFF' }]} numberOfLines={1}>List Globally</Text>
                    </Pressable>
                  ) : crop.status === 'PENDING_APPROVAL' ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.sellCropButton,
                        styles.sellCropButtonLocked,
                        pressed && styles.pressedButton,
                      ]}
                      onPress={() =>
                        Alert.alert(
                          'Produce Verification Protocol',
                          'This harvest is currently awaiting MandiKart Admin quality verification. Selling is locked until approved by Mandi administrators to ensure market compliance and food standards.',
                          [{ text: 'Understood', style: 'default' }]
                        )
                      }
                    >
                      <Lock size={13} color="#6B7280" style={{ marginRight: 4 }} />
                      <Text style={styles.sellCropButtonTextLocked} numberOfLines={1}>Locked</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [
                        styles.sellCropButton,
                        pressed && styles.pressedButton,
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: '/sell/best-options',
                          params: {
                            crop: crop.cropName,
                            qty: (crop.availableKg || 0).toString(),
                            grade: crop.grade,
                          },
                        })
                      }
                    >
                      <Text style={styles.sellCropButtonText} numberOfLines={1}>Sell Crop</Text>
                      <ArrowRight size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* ── Section Level 2: "Action Alerts" ───────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Action Alerts & Quality Reminders</Text>
        </View>

        {urgentCrops.length > 0 ? (
          urgentCrops.map((crop, idx) => (
            <View key={`alert_${crop.id || 'crop'}_${idx}`} style={styles.alertCard}>
              <View style={styles.alertCardHeader}>
                <AlertTriangle size={18} color={MKColors.accentOrange} />
                <Text style={styles.alertCardTitle}>
                  {crop.cropName}: {crop.attentionMessage || 'Attention Required'}
                </Text>
              </View>
              <Text style={styles.alertCardDesc}>
                Storage location: {crop.storageDetails || crop.storageType}. Estimated shelf-life window is {crop.shelfLifeDaysEstMin}–{crop.shelfLifeDaysEstMax} days remaining.
              </Text>
              <View style={styles.alertActionRow}>
                <Pressable
                  style={[
                    styles.alertActionButton,
                    crop.status === 'PENDING_APPROVAL' && { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' },
                  ]}
                  onPress={() => {
                    if (crop.status === 'PENDING_APPROVAL') {
                      Alert.alert(
                        'Produce Verification Protocol',
                        'This harvest is currently awaiting MandiKart Admin quality verification. Selling is locked until approved by Mandi administrators.',
                        [{ text: 'Understood', style: 'default' }]
                      );
                      return;
                    }
                    router.push({
                      pathname: '/sell/best-options',
                      params: {
                        crop: crop.cropName,
                        qty: crop.availableKg.toString(),
                        grade: crop.grade,
                      },
                    });
                  }}
                >
                  {crop.status === 'PENDING_APPROVAL' ? (
                    <>
                      <Lock size={13} color="#6B7280" style={{ marginRight: 4 }} />
                      <Text style={[styles.alertActionText, { color: '#6B7280' }]}>Verification Pending</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.alertActionText}>Sell Now</Text>
                      <ArrowRight size={14} color={MKColors.primaryGreen} />
                    </>
                  )}
                </Pressable>
                <Pressable
                  style={styles.alertSecondaryButton}
                  onPress={() => router.push(`/produce/${crop.id}` as any)}
                >
                  <Text style={styles.alertSecondaryText}>Update Condition</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.allSafeBanner}>
            <CheckCircle2 size={20} color={MKColors.primaryGreen} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.allSafeTitle}>All crops are in good condition!</Text>
              <Text style={styles.allSafeSubtitle}>
                Your inventory is safely stored and regular quality checks are up to date.
              </Text>
            </View>
          </View>
        )}

        {/* ── Section Level 2: "Crop Market Watch" ───────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Crop Market Watch</Text>
        </View>

        <View style={styles.watchContainer}>
          {crops.map((crop, idx) => (
            <Pressable
              key={`watch_${crop.id || 'crop'}_${idx}`}
              style={({ pressed }) => [styles.watchRow, pressed && { backgroundColor: '#F8FAFC' }]}
              onPress={() => router.push(`/produce/${crop.id}` as any)}
            >
              <View style={styles.watchCropBadge}>
                <Text style={styles.watchCropName}>{crop.cropName}</Text>
              </View>
              <View style={styles.watchContent}>
                <Text style={styles.watchTagText}>{crop.watchTag}</Text>
                <Text style={styles.watchSourceText}>
                  {crop.marketName} • {crop.marketSource}
                </Text>
              </View>
              <ChevronRight size={16} color={MKColors.textSecondary} />
            </Pressable>
          ))}
        </View>

        {/* ── Section Level 2: Market Pulse Disclaimer ─────────────── */}
        <View style={styles.disclaimerContainer}>
          <Info size={15} color={MKColors.textSecondary} style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={styles.disclaimerText}>
            Mandi rates and freshness estimates are benchmarked against official AGMARKNET feeds and agricultural standards. Realized selling prices depend on actual crop quality, grading, and buyer negotiation.
          </Text>
        </View>

        {/* Bottom spacing for smooth tab navigation */}
        <View style={{ height: 60 }} />
      </ScrollView>


      {/* ── Freshness Information Disclaimer Modal ─────────────────── */}
      <Modal
        visible={freshnessModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFreshnessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Clock size={22} color={MKColors.primaryGreen} />
              <Text style={styles.modalTitle}>Estimated Freshness Window</Text>
              <Pressable
                onPress={() => setFreshnessModalVisible(false)}
                hitSlop={12}
              >
                <X size={20} color={MKColors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalCropTitle}>
              {selectedCropForInfo?.cropName} ({selectedCropForInfo?.variety})
            </Text>

            <View style={styles.modalEstimatePill}>
              <Text style={styles.modalEstimateValue}>
                Approx. {selectedCropForInfo?.shelfLifeDaysEstMin} to {selectedCropForInfo?.shelfLifeDaysEstMax} days
              </Text>
              <Text style={styles.modalEstimateSubtitle}>
                Safe under proper storage conditions
              </Text>
            </View>

            <Text style={styles.modalSectionHeading}>How is this calculated?</Text>
            <Text style={styles.modalBodyText}>
              • This is an approximate guidance based on your harvest date and storage type ({selectedCropForInfo?.storageType}).
            </Text>
            <Text style={styles.modalBodyText}>
              • Storage basis: {selectedCropForInfo?.shelfLifeBasis || 'Standard ambient warehouse storage'}.
            </Text>
            <Text style={styles.modalBodyText}>
              • If you observe changes in humidity, color, or texture, update the crop's condition on the Crop Details screen.
            </Text>

            <Pressable
              style={styles.modalDismissBtn}
              onPress={() => setFreshnessModalVisible(false)}
            >
              <Text style={styles.modalDismissBtnText}>Understood</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Quick-Edit Produce Modal ────────────────────────────── */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color={MKColors.primaryGreen} />
                <Text style={styles.modalTitle}>Quick Edit Produce</Text>
              </View>
              <Pressable onPress={() => setEditModalVisible(false)} hitSlop={8}>
                <X size={20} color={MKColors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalCropTitle}>
              {editingCrop?.cropName} {editingCrop?.grade ? `• ${editingCrop.grade}` : ''}
            </Text>

            {/* Variety */}
            <View style={styles.editInputGroup}>
              <Text style={styles.editInputLabel}>Variety / Batch Name</Text>
              <TextInput
                style={styles.editTextInput}
                placeholder="e.g. Hybrid Garva, Grade A Fresh"
                placeholderTextColor={MKColors.textMuted}
                value={editVariety}
                onChangeText={setEditVariety}
              />
            </View>

            {/* Available Quantity */}
            <View style={styles.editInputGroup}>
              <Text style={styles.editInputLabel}>Available Stock (kg)</Text>
              <TextInput
                style={styles.editTextInput}
                keyboardType="numeric"
                placeholder="e.g. 500"
                placeholderTextColor={MKColors.textMuted}
                value={editQuantity}
                onChangeText={setEditQuantity}
              />
            </View>

            {/* Expected Price per kg */}
            <View style={styles.editInputGroup}>
              <Text style={styles.editInputLabel}>Expected Price (₹ / kg)</Text>
              <TextInput
                style={styles.editTextInput}
                keyboardType="numeric"
                placeholder="e.g. 28"
                placeholderTextColor={MKColors.textMuted}
                value={editPrice}
                onChangeText={setEditPrice}
              />
            </View>

            {/* Condition Chips */}
            <Text style={[styles.editInputLabel, { marginTop: 6, marginBottom: 6 }]}>Produce Quality Condition</Text>
            <View style={styles.editConditionRow}>
              {(['Good', 'Needs Attention', 'Deteriorating'] as CropCondition[]).map((cond) => {
                const isSelected = editCondition === cond;
                return (
                  <Pressable
                    key={cond}
                    style={[
                      styles.editConditionChip,
                      isSelected && styles.editConditionChipSelected,
                    ]}
                    onPress={() => setEditCondition(cond)}
                  >
                    <Text
                      style={[
                        styles.editConditionText,
                        isSelected && styles.editConditionTextSelected,
                      ]}
                    >
                      {cond === 'Good' ? '🟢 Good' : cond === 'Needs Attention' ? '🟡 Attention' : '🔴 Deteriorating'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Actions */}
            <View style={styles.editActionRow}>
              <Pressable
                style={styles.editCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.editCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.editSaveBtn}
                onPress={handleSaveQuickEdit}
              >
                <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.editSaveBtnText}>Save Changes</Text>
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
  scrollContainer: {
    flex: 1,
  },
  screenScrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
    width: '100%',
  },

  // ── Header ────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: MKColors.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: MKColors.borderLight,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: MKColors.primaryGreen,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginTop: 1,
  },
  headerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAddCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#15803D',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    elevation: 1,
  },
  headerAddCropBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: MKColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },

  // ── Interactive Summary Strip ─────────────────────────────────────
  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0F2C56',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  metricCardActive: {
    borderColor: MKColors.primaryGreen,
    backgroundColor: '#F0FDF4',
    transform: [{ scale: 1.02 }],
  },
  metricCardAlert: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  metricCardActiveAlert: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
    transform: [{ scale: 1.02 }],
  },
  pressedMetric: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  activeBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: MKColors.primaryGreen,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: MKColors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── Add Produce CTA ───────────────────────────────────────────────
  addProduceCta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    elevation: 4,
    shadowColor: '#15803D',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  pressedCard: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  addCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addCtaPlusCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    elevation: 3,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addCtaTextGroup: {
    flex: 1,
  },
  addCtaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  addCtaTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0F172A',
    marginRight: 8,
    letterSpacing: -0.2,
  },
  quickAddBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    gap: 3,
  },
  quickAddBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addCtaSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },

  // ── Search & Filter ───────────────────────────────────────────────
  searchSection: {
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  filterChipRow: {
    flexDirection: 'row',
    paddingVertical: 2,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  filterChipActive: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  filterChipActiveAlert: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterChipTextActiveAlert: {
    color: '#DC2626',
    fontWeight: '800',
  },

  // ── Section Titles ────────────────────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },

  // ── Crop Card ─────────────────────────────────────────────────────
  cropCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 5,
    shadowColor: '#0F2C56',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  cropCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cropMetaInfo: {
    flex: 1,
  },
  cropTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cropCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: MKColors.textPrimary,
    flex: 1,
    marginRight: 6,
  },
  gradeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gradeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.primaryGreen,
  },
  cropVarietyText: {
    fontSize: 12,
    color: MKColors.textSecondary,
    marginVertical: 3,
  },
  cropBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  statusBadgeRejected: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusBadgeTextPending: {
    color: '#B45309',
  },
  statusBadgeTextActive: {
    color: '#15803D',
  },
  statusBadgeTextRejected: {
    color: '#B91C1C',
  },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  conditionChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Stock Progress
  stockProgressContainer: {
    backgroundColor: '#FAFAF8',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: MKColors.borderLight,
  },
  stockLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stockStatusLabel: {
    fontSize: 13,
    color: MKColors.textSecondary,
  },
  stockHighlight: {
    fontWeight: '800',
    color: MKColors.primaryGreenDark,
  },
  stockTotalLabel: {
    fontSize: 12,
    color: MKColors.textSecondary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  reservedSubtext: {
    fontSize: 11,
    color: MKColors.accentOrange,
    fontWeight: '600',
    marginTop: 5,
  },

  // Intelligence Strip
  cropIntelligenceStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  intelligencePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  intelligenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textPrimary,
    marginHorizontal: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  trendBadgeUp: {
    backgroundColor: '#E8F5E9',
  },
  trendBadgeDown: {
    backgroundColor: '#FEE2E2',
  },
  trendBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },

  // Source Verified
  sourceVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sourceVerifiedText: {
    fontSize: 10,
    color: MKColors.textSecondary,
    marginLeft: 5,
  },

  // Action Buttons
  cropCardActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  detailsButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: MKColors.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.primaryGreen,
  },
  cardEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    gap: 4,
  },
  cardEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.primaryGreen,
  },
  cardDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    gap: 4,
  },
  cardDeleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  editInputGroup: {
    marginBottom: 12,
  },
  editInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  editTextInput: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: MKColors.border,
    paddingHorizontal: 14,
    fontSize: 15,
    color: MKColors.textPrimary,
    backgroundColor: '#F9FAFB',
  },
  editConditionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  editConditionChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MKColors.border,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editConditionChipSelected: {
    borderColor: MKColors.primaryGreen,
    backgroundColor: '#E8F5E9',
  },
  editConditionText: {
    fontSize: 12,
    fontWeight: '600',
    color: MKColors.textSecondary,
  },
  editConditionTextSelected: {
    fontWeight: '800',
    color: MKColors.primaryGreenDark,
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  editCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: MKColors.border,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: MKColors.textSecondary,
  },
  editSaveBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 10,
    backgroundColor: MKColors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  editSaveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sellCropButton: {
    flex: 1.2,
    height: 44,
    borderRadius: 10,
    backgroundColor: MKColors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  sellCropButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sellCropButtonLocked: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    elevation: 0,
  },
  sellCropButtonTextLocked: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  sellCropButtonRejected: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    elevation: 0,
  },
  sellCropButtonTextRejected: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  pressedButton: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  // ── Alert Card ────────────────────────────────────────────────────
  alertCard: {
    backgroundColor: '#FFF8F1',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: MKColors.accentOrange,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9A3412',
    marginLeft: 6,
    flex: 1,
  },
  alertCardDesc: {
    fontSize: 12,
    color: MKColors.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  alertActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  alertActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MKColors.primaryGreen,
    gap: 4,
  },
  alertActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primaryGreen,
  },
  alertSecondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
  },
  alertSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350F',
  },

  // All Safe Banner
  allSafeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginBottom: 12,
  },
  allSafeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.primaryGreenDark,
  },
  allSafeSubtitle: {
    fontSize: 11,
    color: MKColors.primaryGreen,
    marginTop: 2,
  },

  // ── Watch Rows ────────────────────────────────────────────────────
  watchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
    borderColor: MKColors.border,
    marginBottom: 14,
  },
  watchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: MKColors.borderLight,
    borderRadius: 8,
  },
  watchCropBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  watchCropName: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  watchContent: {
    flex: 1,
  },
  watchTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  watchSourceText: {
    fontSize: 10,
    color: MKColors.textSecondary,
    marginTop: 2,
  },

  // ── Disclaimer ────────────────────────────────────────────────────
  disclaimerContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: MKColors.textSecondary,
    lineHeight: 16,
  },

  // ── Empty State ───────────────────────────────────────────────────
  emptyStateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MKColors.border,
    marginVertical: 10,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: MKColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MKColors.primaryGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Modal ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: MKColors.textPrimary,
    flex: 1,
    marginLeft: 8,
  },
  modalCropTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: MKColors.textSecondary,
    marginBottom: 10,
  },
  modalEstimatePill: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  modalEstimateValue: {
    fontSize: 17,
    fontWeight: '800',
    color: MKColors.primaryGreenDark,
  },
  modalEstimateSubtitle: {
    fontSize: 11,
    color: MKColors.primaryGreen,
    marginTop: 2,
  },
  modalSectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginBottom: 8,
  },
  modalBodyText: {
    fontSize: 12,
    color: MKColors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  modalDismissBtn: {
    backgroundColor: MKColors.primaryGreen,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  modalDismissBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
