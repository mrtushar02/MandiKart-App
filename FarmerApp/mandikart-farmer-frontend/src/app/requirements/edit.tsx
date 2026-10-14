/**
 * MandiKart Farmer App — Edit Requirement Screen (Screen 10)
 *
 * Route: /requirements/edit?id=...
 *
 * Loads existing requirement data, preserves unchanged fields, validates edits,
 * and enforces business rules for active tenders (version increment v2+ and
 * amendment notices to bidding suppliers).
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  Info,
  Calendar,
  MapPin,
  IndianRupee,
  Layers,
  CheckCircle2,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useRequirementsStore,
  calculateProductTotal,
  calculateRequirementTotalBudget,
  RequirementProduct,
  ProcurementUrgency,
} from '@/store/requirementsStore';

export default function EditRequirementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getRequirementById, updateRequirement } = useRequirementsStore();

  const originalRequirement = useMemo(() => {
    if (!id) return undefined;
    return getRequirementById(id);
  }, [id, getRequirementById]);

  // Form State
  const [title, setTitle] = useState('');
  const [urgency, setUrgency] = useState<ProcurementUrgency>('STANDARD');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  // Editable Product items
  const [productEdits, setProductEdits] = useState<
    { productId: string; quantity: string; targetPrice: string; maxPrice: string }[]
  >([]);

  const [isSaving, setIsSaving] = useState(false);

  // Initialize form
  useEffect(() => {
    if (originalRequirement) {
      setTitle(originalRequirement.title || '');
      setUrgency(originalRequirement.urgency || 'STANDARD');
      setDeliveryDate(originalRequirement.delivery?.deliveryDate || '');
      setDestinationName(originalRequirement.delivery?.destinationName || '');
      setAddress(originalRequirement.delivery?.address || '');
      setCity(originalRequirement.delivery?.city || '');
      setNotes(originalRequirement.notes || '');

      setProductEdits(
        originalRequirement.products.map((p) => ({
          productId: p.productId,
          quantity: String(p.quantity || ''),
          targetPrice: String(p.targetPricePerUnit || ''),
          maxPrice: String(p.maxCeilingPricePerUnit || ''),
        }))
      );
    }
  }, [originalRequirement]);

  const topInset = Math.max(insets.top, 16);

  if (!originalRequirement) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={MKColors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Requirement</Text>
        </View>
        <View style={styles.emptyCenter}>
          <AlertTriangle size={44} color="#D97706" />
          <Text style={styles.emptyTitle}>Requirement Not Found</Text>
          <Text style={styles.emptySubtitle}>
            The requirement requested could not be found to edit.
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

  const isPublished =
    originalRequirement.status === 'OPEN' || originalRequirement.status === 'MATCHED';
  const isCancelled = originalRequirement.status === 'CANCELLED';
  const isFulfilled = originalRequirement.status === 'FULFILLED';

  if (isCancelled || isFulfilled) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={MKColors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Cannot Edit Requirement</Text>
        </View>
        <View style={styles.emptyCenter}>
          <AlertTriangle size={44} color="#DC2626" />
          <Text style={styles.emptyTitle}>
            {isCancelled ? 'Tender is Cancelled' : 'Contract is Fulfilled'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isCancelled
              ? 'This requirement has been cancelled and cannot be revised directly. You can duplicate it to start a new tender.'
              : 'This contract has already been fulfilled and is archived.'}
          </Text>
          <Pressable
            style={styles.actionBtnPrimary}
            onPress={() => router.back()}
          >
            <Text style={styles.actionBtnText}>Return to Details</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Live Budget Preview
  const updatedProducts: RequirementProduct[] = originalRequirement.products.map((p, idx) => {
    const edit = productEdits[idx];
    const qty = parseFloat(edit?.quantity || '0') || 0;
    const price = parseFloat(edit?.targetPrice || '0') || 0;
    const maxP = edit?.maxPrice ? parseFloat(edit.maxPrice) : undefined;
    return {
      ...p,
      quantity: qty,
      targetPricePerUnit: price,
      maxCeilingPricePerUnit: maxP,
      totalBudget: calculateProductTotal(qty, price),
    };
  });

  const previewTotalBudget = calculateRequirementTotalBudget(updatedProducts);

  // Check if any material change was made compared to original
  const isMaterialChange = useMemo(() => {
    if (!originalRequirement) return false;
    // Check if products changed
    for (let i = 0; i < originalRequirement.products.length; i++) {
      const orig = originalRequirement.products[i];
      const edit = updatedProducts[i];
      if (orig.quantity !== edit.quantity) return true;
      if (orig.targetPricePerUnit !== edit.targetPricePerUnit) return true;
      if (orig.maxCeilingPricePerUnit !== edit.maxCeilingPricePerUnit) return true;
    }
    // Check if delivery date or destination changed
    if (originalRequirement.delivery?.deliveryDate !== deliveryDate) return true;
    if (originalRequirement.delivery?.destinationName !== destinationName) return true;
    return false;
  }, [originalRequirement, updatedProducts, deliveryDate, destinationName]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Tender title cannot be empty.');
      return;
    }
    if (!deliveryDate.trim()) {
      Alert.alert('Validation Error', 'Required delivery date is mandatory.');
      return;
    }
    for (const p of updatedProducts) {
      if (p.quantity <= 0) {
        Alert.alert('Validation Error', `Quantity for ${p.productName} must be greater than 0.`);
        return;
      }
      if (p.targetPricePerUnit <= 0) {
        Alert.alert('Validation Error', `Price for ${p.productName} must be greater than 0.`);
        return;
      }
    }

    const executeUpdate = async () => {
      setIsSaving(true);
      try {
        const res = await updateRequirement(
          originalRequirement.id,
          {
            title: title.trim(),
            urgency,
            notes: notes.trim(),
            products: updatedProducts,
            delivery: {
              ...originalRequirement.delivery,
              deliveryDate,
              destinationName,
              address,
              city,
            },
          },
          isPublished && isMaterialChange
        );

        setIsSaving(false);
        if (res.success) {
          Alert.alert(
            isPublished && isMaterialChange ? 'Tender Revised (v' + (res.version || 2) + ') 📝' : 'Requirement Saved ✅',
            isPublished && isMaterialChange
              ? 'Your specification amendments have been published. Matching suppliers have been notified of the revised version.'
              : 'Your requirement updates have been saved successfully.',
            [
              {
                text: 'View Requirement',
                onPress: () => router.replace(`/requirements/${originalRequirement.id}` as any),
              },
            ]
          );
        } else {
          Alert.alert('Save Failed', res.error || 'Failed to update requirement. Please try again.');
        }
      } catch (err: any) {
        setIsSaving(false);
        Alert.alert('Error', err?.message || 'Could not update requirement.');
      }
    };

    if (isPublished && isMaterialChange) {
      Alert.alert(
        'Confirm Material Amendments',
        `This tender is currently LIVE with active supplier bidding. Modifying quantities, target prices, or delivery details will increment the tender to version v${(originalRequirement.version || 1) + 1} and re-notify bidding suppliers.\n\nDo you wish to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Publish Amendments', style: 'default', onPress: executeUpdate },
        ]
      );
    } else {
      executeUpdate();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: topInset }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} disabled={isSaving}>
            <ArrowLeft size={22} color={MKColors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Edit Requirement</Text>
            <Text style={styles.headerSubtitle}>
              {originalRequirement.id} {originalRequirement.version ? `(v${originalRequirement.version})` : ''}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Active Tender Warning Banner */}
          {isPublished && (
            <View style={styles.liveNoticeCard}>
              <Info size={18} color="#D97706" style={{ marginTop: 2, marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.liveNoticeTitle}>Active Bidding Tender</Text>
                <Text style={styles.liveNoticeText}>
                  Any material changes to price or quantities will create a new version revision (v{(originalRequirement.version || 1) + 1}) and inform participating suppliers.
                </Text>
              </View>
            </View>
          )}

          {/* Section 1: General Info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>General Information</Text>

            <Text style={styles.label}>Tender Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Nashik Onion Aggregation"
            />

            <Text style={styles.label}>Urgency Level</Text>
            <View style={styles.urgencyRow}>
              {(['STANDARD', 'URGENT', 'FLEXIBLE'] as ProcurementUrgency[]).map((u) => {
                const active = urgency === u;
                return (
                  <Pressable
                    key={u}
                    style={[styles.urgencyBtn, active && styles.urgencyBtnActive]}
                    onPress={() => setUrgency(u)}
                  >
                    <Text style={[styles.urgencyText, active && styles.urgencyTextActive]}>
                      {u}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Section 2: Products & Target Budgets */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Products & Target Pricing</Text>

            {originalRequirement.products.map((p, idx) => {
              const edit = productEdits[idx] || {
                quantity: '',
                targetPrice: '',
                maxPrice: '',
              };
              return (
                <View key={p.productId || idx} style={styles.productEditBox}>
                  <Text style={styles.productName}>{p.productName}</Text>
                  <Text style={styles.productCategory}>{p.category} • {p.variety}</Text>

                  <View style={styles.formRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.label}>Quantity ({p.unit})</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={edit.quantity}
                        onChangeText={(val) => {
                          const updated = [...productEdits];
                          updated[idx] = { ...updated[idx], quantity: val };
                          setProductEdits(updated);
                        }}
                      />
                    </View>

                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.label}>Target ₹/{p.unit}</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={edit.targetPrice}
                        onChangeText={(val) => {
                          const updated = [...productEdits];
                          updated[idx] = { ...updated[idx], targetPrice: val };
                          setProductEdits(updated);
                        }}
                      />
                    </View>
                  </View>

                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.label}>Max Ceiling Price ₹/{p.unit} (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="e.g. 2600"
                      value={edit.maxPrice}
                      onChangeText={(val) => {
                        const updated = [...productEdits];
                        updated[idx] = { ...updated[idx], maxPrice: val };
                        setProductEdits(updated);
                      }}
                    />
                  </View>
                </View>
              );
            })}

            {/* Revised Budget Total Bar */}
            <View style={styles.budgetPreviewBar}>
              <Text style={styles.budgetPreviewLabel}>Updated Total Budget</Text>
              <Text style={styles.budgetPreviewAmount}>
                ₹{previewTotalBudget.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Section 3: Delivery Details */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery Requirements</Text>

            <Text style={styles.label}>Required Delivery Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>Depot / Destination Name</Text>
            <TextInput
              style={styles.input}
              value={destinationName}
              onChangeText={setDestinationName}
              placeholder="e.g. APMC Market Yard Central Depot"
            />

            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Street or survey number"
            />

            <Text style={styles.label}>City / District</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Nashik"
            />
          </View>

          {/* Section 4: Notes */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Procurement Notes</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              multiline
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any specific delivery timing or payment terms..."
            />
          </View>
        </ScrollView>

        {/* Bottom Save Bar */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={[styles.saveBtn, isSaving && styles.disabledBtn]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>
                  {isPublished && isMaterialChange ? 'Publish Revised Tender' : 'Save Changes'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  liveNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
  },
  liveNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  liveNoticeText: {
    fontSize: 12,
    color: '#78350F',
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginTop: 8,
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
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  urgencyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  urgencyBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  urgencyTextActive: {
    color: '#15803D',
  },
  productEditBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  productCategory: {
    fontSize: 11,
    color: MKColors.textSecondary,
    marginBottom: 6,
  },
  formRow: {
    flexDirection: 'row',
  },
  budgetPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 6,
  },
  budgetPreviewLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  budgetPreviewAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
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
    backgroundColor: '#15803D',
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
