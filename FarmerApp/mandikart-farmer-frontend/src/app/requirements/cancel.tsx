/**
 * MandiKart Farmer App — Cancel Requirement Screen (Screen 11)
 *
 * Route: /requirements/cancel?id=...
 *
 * Confirms tender cancellation, collects audit reason, explains consequences,
 * calls cancellation API, and preserves full history (without deleting).
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Check,
  Calendar,
  MapPin,
  ChevronRight,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useRequirementsStore } from '@/store/requirementsStore';

const CANCELLATION_REASONS = [
  'Crop harvest delayed or yield impacted by weather',
  'Alternate local supplier or mandi source secured',
  'Budget constraints or market spot price unviable',
  'Procurement specifications or quality requirements changed',
  'Logistics / destination depot storage unavailable',
  'Other operational reason',
];

export default function CancelRequirementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getRequirementById, cancelRequirement } = useRequirementsStore();

  const requirement = useMemo(() => {
    if (!id) return undefined;
    return getRequirementById(id);
  }, [id, getRequirementById]);

  const [selectedReason, setSelectedReason] = useState<string>(CANCELLATION_REASONS[0]);
  const [customNotes, setCustomNotes] = useState('');
  const [acknowledgedConsequences, setAcknowledgedConsequences] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const topInset = Math.max(insets.top, 16);

  if (!requirement) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={MKColors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Cancel Requirement</Text>
        </View>
        <View style={styles.emptyCenter}>
          <AlertTriangle size={44} color="#D97706" />
          <Text style={styles.emptyTitle}>Requirement Not Found</Text>
          <Text style={styles.emptySubtitle}>
            The requirement to cancel could not be found.
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

  const isAlreadyCancelled = requirement.status === 'CANCELLED';
  const isFulfilled = requirement.status === 'FULFILLED';

  if (isAlreadyCancelled || isFulfilled) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={MKColors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Cancel Requirement</Text>
        </View>
        <View style={styles.emptyCenter}>
          <XCircle size={48} color="#DC2626" />
          <Text style={styles.emptyTitle}>
            {isAlreadyCancelled ? 'Tender Already Cancelled' : 'Cannot Cancel Completed Contract'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isAlreadyCancelled
              ? `This requirement was already cancelled on ${requirement.cancelledAt ? new Date(requirement.cancelledAt).toLocaleDateString() : 'earlier'}.`
              : 'This contract has already been fulfilled and delivered. Fulfilled contracts cannot be cancelled.'}
          </Text>
          <Pressable
            style={styles.actionBtnPrimary}
            onPress={() => router.replace(`/requirements/${requirement.id}` as any)}
          >
            <Text style={styles.actionBtnText}>View Requirement Details</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleConfirmCancel = async () => {
    if (!acknowledgedConsequences) {
      Alert.alert(
        'Acknowledgment Required',
        'Please confirm that you understand the consequences of cancelling this tender.'
      );
      return;
    }

    Alert.alert(
      'Final Confirmation: Cancel Tender?',
      `Are you sure you want to cancel tender "${requirement.title}" (${requirement.id})?\n\nReason: ${selectedReason}\n\nThis will immediately notify bidding suppliers and close all open quotes.`,
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Yes, Cancel Tender',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              const res = await cancelRequirement(
                requirement.id,
                selectedReason,
                customNotes.trim()
              );

              setIsCancelling(false);
              if (res.success) {
                Alert.alert(
                  'Tender Cancelled 🛑',
                  'The tender has been cancelled. Record is preserved in your history.',
                  [
                    {
                      text: 'View Cancelled Details',
                      onPress: () =>
                        router.replace(`/requirements/${requirement.id}` as any),
                    },
                    {
                      text: 'Requirements Hub',
                      onPress: () => router.replace('/requirements' as any),
                    },
                  ]
                );
              } else {
                Alert.alert(
                  'Cancellation Failed',
                  res.error || 'Could not cancel requirement. Please try again.'
                );
              }
            } catch (err: any) {
              setIsCancelling(false);
              Alert.alert('Error', err?.message || 'Failed to cancel tender.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} disabled={isCancelling}>
          <ArrowLeft size={22} color={MKColors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Cancel Tender</Text>
          <Text style={styles.headerSubtitle}>Tender ID: {requirement.id}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning Banner */}
        <View style={styles.consequencesCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <ShieldAlert size={20} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.consequencesTitle}>Important Consequences of Cancellation</Text>
          </View>
          <Text style={styles.consequencesBullet}>
            • <Text style={{ fontWeight: '700' }}>Active Bids Closed:</Text> All supplier quotes currently under review will be marked void and closed.
          </Text>
          <Text style={styles.consequencesBullet}>
            • <Text style={{ fontWeight: '700' }}>Suppliers Notified:</Text> Participating suppliers and FPOs will receive automated cancellation notifications.
          </Text>
          <Text style={styles.consequencesBullet}>
            • <Text style={{ fontWeight: '700' }}>Irreversible Status:</Text> Once cancelled, a tender cannot be reopened. You can duplicate it to launch a fresh tender.
          </Text>
          <Text style={styles.consequencesBullet}>
            • <Text style={{ fontWeight: '700' }}>Audit Preservation:</Text> This record will not be deleted; its full specifications and cancellation timestamp remain archived.
          </Text>
        </View>

        {/* Tender Summary Mini Card */}
        <View style={styles.summaryMiniCard}>
          <Text style={styles.summaryMiniTitle}>{requirement.title}</Text>
          <Text style={styles.summaryMiniSub}>
            {requirement.totalQuantity} {requirement.primaryUnit} • Target Budget: ₹
            {requirement.totalBudget?.toLocaleString('en-IN')}
          </Text>
          <View style={styles.miniDetailRow}>
            <Calendar size={13} color={MKColors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.miniDetailText}>Due: {requirement.delivery?.deliveryDate}</Text>
            <MapPin size={13} color={MKColors.textSecondary} style={{ marginLeft: 12, marginRight: 4 }} />
            <Text style={styles.miniDetailText} numberOfLines={1}>{requirement.delivery?.destinationName}</Text>
          </View>
        </View>

        {/* Reason Selector */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Select Cancellation Reason</Text>
          <Text style={styles.cardSub}>
            Please select the primary reason for cancelling this procurement tender:
          </Text>

          {CANCELLATION_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <Pressable
                key={reason}
                style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                onPress={() => setSelectedReason(reason)}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                  {reason}
                </Text>
              </Pressable>
            );
          })}

          <Text style={styles.notesLabel}>Additional Audit Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            placeholder="Add any internal details or remarks for your records..."
            value={customNotes}
            onChangeText={setCustomNotes}
          />
        </View>

        {/* Acknowledgment Checkbox */}
        <Pressable
          style={styles.ackBox}
          onPress={() => setAcknowledgedConsequences(!acknowledgedConsequences)}
        >
          <View style={[styles.checkbox, acknowledgedConsequences && styles.checkboxActive]}>
            {acknowledgedConsequences && <Check size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.ackText}>
            I understand that cancelling this tender will close active supplier quotes and cannot be undone.
          </Text>
        </Pressable>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={[
            styles.cancelBtn,
            (!acknowledgedConsequences || isCancelling) && styles.disabledBtn,
          ]}
          onPress={handleConfirmCancel}
          disabled={!acknowledgedConsequences || isCancelling}
        >
          {isCancelling ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <XCircle size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.cancelBtnText}>Confirm Cancellation</Text>
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
  consequencesCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  consequencesTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  consequencesBullet: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  summaryMiniCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  summaryMiniTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  summaryMiniSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    marginTop: 2,
  },
  miniDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  miniDetailText: {
    fontSize: 11,
    color: MKColors.textSecondary,
    fontWeight: '500',
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
  },
  cardSub: {
    fontSize: 12,
    color: MKColors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  reasonOptionSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: '#DC2626',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  reasonText: {
    fontSize: 13,
    color: MKColors.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  reasonTextSelected: {
    color: '#991B1B',
    fontWeight: '700',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 10,
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    height: 70,
    textAlignVertical: 'top',
    fontSize: 13,
    color: MKColors.textPrimary,
  },
  ackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  ackText: {
    fontSize: 12,
    color: MKColors.textPrimary,
    flex: 1,
    lineHeight: 16,
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
  cancelBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
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
});
