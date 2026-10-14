/**
 * MandiKart Farmer App — Recurring Procurement Setup Screen (Screen 12)
 *
 * Route: /requirements/recurring?id=...
 *
 * Configures automated recurring procurement schedules (Weekly, Bi-Weekly,
 * Monthly, Quarterly) with cycle count, buffer days, and auto-tender issuance.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Repeat,
  Calendar,
  Clock,
  Package,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useRequirementsStore,
  calculateProductTotal,
  ProductUnit,
} from '@/store/requirementsStore';

const FREQUENCIES: { key: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY'; label: string; desc: string }[] = [
  { key: 'WEEKLY', label: 'Weekly', desc: 'Every 7 days on selected delivery day' },
  { key: 'BI_WEEKLY', label: 'Bi-Weekly', desc: 'Every 14 days for steady harvest aggregation' },
  { key: 'MONTHLY', label: 'Monthly', desc: 'Once a month on first week' },
  { key: 'QUARTERLY', label: 'Quarterly', desc: 'Seasonal cycle (every 3 months)' },
];

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function RecurringProcurementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getRequirementById, createRecurringSchedule, getRecurringScheduleByReqId } =
    useRequirementsStore();

  const baseRequirement = useMemo(() => {
    if (!id) return undefined;
    return getRequirementById(id);
  }, [id, getRequirementById]);

  const existingSchedule = useMemo(() => {
    if (!id) return undefined;
    return getRecurringScheduleByReqId(id);
  }, [id, getRecurringScheduleByReqId]);

  // Form State
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [frequency, setFrequency] = useState<'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY'>('WEEKLY');
  const [preferredDay, setPreferredDay] = useState('Monday');
  const [quantityPerCycle, setQuantityPerCycle] = useState('');
  const [unit, setUnit] = useState<ProductUnit>('quintal');
  const [targetPrice, setTargetPrice] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalCycles, setTotalCycles] = useState('8');
  const [bufferDays, setBufferDays] = useState('2');
  const [autoPublishTender, setAutoPublishTender] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize from requirement or existing schedule
  useEffect(() => {
    const today = new Date();
    const defaultStart = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0];

    if (existingSchedule) {
      setScheduleTitle(existingSchedule.title);
      setFrequency(existingSchedule.frequency);
      setPreferredDay(existingSchedule.preferredDeliveryDay || 'Monday');
      setQuantityPerCycle(String(existingSchedule.quantityPerCycle));
      setUnit(existingSchedule.unit);
      setTargetPrice(String(existingSchedule.targetPricePerUnit));
      setStartDate(existingSchedule.startDate);
      setEndDate(existingSchedule.endDate || '');
      setTotalCycles(existingSchedule.totalCycles ? String(existingSchedule.totalCycles) : '8');
      setBufferDays(String(existingSchedule.bufferDays || 2));
      setAutoPublishTender(existingSchedule.autoPublishTender);
    } else if (baseRequirement) {
      const primaryProduct = baseRequirement.products[0];
      setScheduleTitle(`Recurring: ${baseRequirement.title}`);
      setQuantityPerCycle(String(primaryProduct?.quantity || baseRequirement.totalQuantity || 50));
      setUnit(primaryProduct?.unit || baseRequirement.primaryUnit || 'quintal');
      setTargetPrice(String(primaryProduct?.targetPricePerUnit || 2400));
      setStartDate(baseRequirement.delivery?.deliveryDate || defaultStart);
    } else {
      setScheduleTitle('Weekly Aggregation Batch');
      setStartDate(defaultStart);
      setQuantityPerCycle('50');
      setTargetPrice('2400');
    }
  }, [baseRequirement, existingSchedule]);

  const topInset = Math.max(insets.top, 16);

  const parsedQty = parseFloat(quantityPerCycle) || 0;
  const parsedPrice = parseFloat(targetPrice) || 0;
  const cycleBudget = calculateProductTotal(parsedQty, parsedPrice);
  const parsedCycles = parseInt(totalCycles, 10) || 8;
  const estimatedContractTotal = cycleBudget * parsedCycles;

  const handleSaveSchedule = async () => {
    if (!scheduleTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a schedule title.');
      return;
    }
    if (parsedQty <= 0) {
      Alert.alert('Validation Error', 'Quantity per cycle must be greater than 0.');
      return;
    }
    if (parsedPrice <= 0) {
      Alert.alert('Validation Error', 'Target price per unit must be greater than 0.');
      return;
    }
    if (!startDate.trim()) {
      Alert.alert('Validation Error', 'First cycle dispatch start date is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createRecurringSchedule({
        requirementId: baseRequirement ? baseRequirement.id : `REQ-AUTO-${Date.now()}`,
        title: scheduleTitle.trim(),
        cropName: baseRequirement?.products[0]?.productName || 'Agricultural Produce',
        frequency,
        quantityPerCycle: parsedQty,
        unit,
        targetPricePerUnit: parsedPrice,
        startDate: startDate.trim(),
        endDate: endDate.trim() || undefined,
        totalCycles: parsedCycles,
        nextDispatchDate: startDate.trim(),
        preferredDeliveryDay: preferredDay,
        bufferDays: parseInt(bufferDays, 10) || 2,
        autoPublishTender,
      });

      setIsSubmitting(false);
      if (res.success) {
        Alert.alert(
          'Recurring Schedule Activated! 🔁',
          `Your ${frequency.toLowerCase()} procurement schedule (${res.scheduleId}) is now active. Bids will automatically aggregate before each ${preferredDay} dispatch.`,
          [
            {
              text: 'View Requirement',
              onPress: () => {
                if (baseRequirement) {
                  router.replace(`/requirements/${baseRequirement.id}` as any);
                } else {
                  router.replace('/requirements' as any);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Save Failed', res.error || 'Failed to activate schedule.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Error', err?.message || 'Could not save recurring schedule.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} disabled={isSubmitting}>
          <ArrowLeft size={22} color={MKColors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Recurring Procurement</Text>
          <Text style={styles.headerSubtitle}>Automated Supply Contract Engine</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner: Difference between One-off vs Recurring */}
        <View style={styles.infoBanner}>
          <View style={styles.iconCircle}>
            <Repeat size={20} color="#2563EB" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoBannerTitle}>Recurring vs One-Off Tender</Text>
            <Text style={styles.infoBannerText}>
              A recurring schedule automatically opens repeat procurement batches at fixed intervals. Suppliers lock in guaranteed weekly or monthly allocations.
            </Text>
          </View>
        </View>

        {/* Section 1: Schedule Title & Frequency */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>1. Frequency & Schedule Name</Text>

          <Text style={styles.label}>Schedule Title</Text>
          <TextInput
            style={styles.input}
            value={scheduleTitle}
            onChangeText={setScheduleTitle}
            placeholder="e.g. Weekly Onion Export Batch"
          />

          <Text style={styles.label}>Repeat Frequency</Text>
          <View style={styles.frequencyGrid}>
            {FREQUENCIES.map((f) => {
              const active = frequency === f.key;
              return (
                <Pressable
                  key={f.key}
                  style={[styles.freqCard, active && styles.freqCardActive]}
                  onPress={() => setFrequency(f.key)}
                >
                  <Text style={[styles.freqTitle, active && styles.freqTitleActive]}>
                    {f.label}
                  </Text>
                  <Text style={[styles.freqDesc, active && styles.freqDescActive]}>
                    {f.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Preferred Delivery Day of the Week</Text>
          <View style={styles.daySelectorRow}>
            {WEEK_DAYS.map((day) => {
              const active = preferredDay === day;
              return (
                <Pressable
                  key={day}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => setPreferredDay(day)}
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                    {day.slice(0, 3)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 2: Volume & Price per Cycle */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>2. Batch Volume & Pricing</Text>

          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Quantity Per Cycle</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={quantityPerCycle}
                onChangeText={setQuantityPerCycle}
                placeholder="e.g. 50"
              />
            </View>

            <View style={{ width: 110, marginLeft: 8 }}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.unitRow}>
                {(['quintal', 'tonne'] as ProductUnit[]).map((u) => {
                  const active = unit === u;
                  return (
                    <Pressable
                      key={u}
                      style={[styles.unitBtn, active && styles.unitBtnActive]}
                      onPress={() => setUnit(u)}
                    >
                      <Text style={[styles.unitText, active && styles.unitTextActive]}>
                        {u === 'quintal' ? 'Qtl' : 'Ton'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <Text style={styles.label}>Target Price Per Unit (₹)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={targetPrice}
            onChangeText={setTargetPrice}
            placeholder="e.g. 2400"
          />

          {/* Budget Projections Card */}
          <View style={styles.budgetProjectionBox}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Per-Batch Value:</Text>
              <Text style={styles.budgetValue}>₹{cycleBudget.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Total {parsedCycles} Cycles Est.:</Text>
              <Text style={[styles.budgetValue, { color: '#15803D', fontWeight: '900' }]}>
                ₹{estimatedContractTotal.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Timeline & Automation Rules */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>3. Schedule Timeline & Automation</Text>

          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>First Cycle Start Date</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Total Planned Cycles</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={totalCycles}
                onChangeText={setTotalCycles}
                placeholder="e.g. 8"
              />
            </View>
          </View>

          <Text style={styles.label}>Supplier Preparation Buffer (Days)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={bufferDays}
            onChangeText={setBufferDays}
            placeholder="e.g. 2"
          />

          {/* Auto Publish Switch */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.switchTitle}>Auto-Publish Bidding Tender</Text>
              <Text style={styles.switchSub}>
                Automatically issue the next cycle tender to suppliers 48 hours prior to each delivery window.
              </Text>
            </View>
            <Switch
              value={autoPublishTender}
              onValueChange={setAutoPublishTender}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={autoPublishTender ? '#15803D' : '#F1F5F9'}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Save Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={[styles.saveBtn, isSubmitting && styles.disabledBtn]}
          onPress={handleSaveSchedule}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Repeat size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Activate Recurring Schedule</Text>
            </>
          )}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  infoBannerText: {
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 16,
    marginTop: 2,
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
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: MKColors.textPrimary,
  },
  frequencyGrid: {
    gap: 8,
    marginTop: 4,
  },
  freqCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
  },
  freqCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  freqTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  freqTitleActive: {
    color: '#1D4ED8',
  },
  freqDesc: {
    fontSize: 11,
    color: MKColors.textSecondary,
    marginTop: 2,
  },
  freqDescActive: {
    color: '#2563EB',
  },
  daySelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  dayChipTextActive: {
    color: '#15803D',
  },
  formRow: {
    flexDirection: 'row',
  },
  unitRow: {
    flexDirection: 'row',
    gap: 4,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unitBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  unitTextActive: {
    color: '#15803D',
  },
  budgetProjectionBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 6,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  switchSub: {
    fontSize: 11,
    color: MKColors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
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
  saveBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledBtn: {
    backgroundColor: '#94A3B8',
  },
});
