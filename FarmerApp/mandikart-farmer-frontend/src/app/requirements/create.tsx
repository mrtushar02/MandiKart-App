/**
 * MandiKart Farmer App — Create Requirement Screen (Screen 2 / Step 1)
 *
 * Route: /requirements/create
 *
 * Starts a new requirement session or resumes draft:
 * - Generates unique draft identifier (REQ-DRAFT-XXXXXX)
 * - Procurement Type selection with clear descriptions
 * - Urgency level selector (Urgent, Standard, Flexible)
 * - Title and procurement purpose notes
 * - Supports saving draft and resuming it
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Layers,
  ShoppingBag,
  Building2,
  Globe2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useRequirementsStore,
  ProcurementType,
  ProcurementUrgency,
} from '@/store/requirementsStore';
import { RequirementStepHeader } from '@/components/requirements/RequirementStepHeader';

const PROCUREMENT_TYPES: {
  key: ProcurementType;
  title: string;
  subtitle: string;
  icon: any;
  tag: string;
}[] = [
  {
    key: 'COMMERCIAL_AGGREGATION',
    title: 'Commercial Crop Aggregation',
    subtitle: 'Pool harvests across farmers for wholesale buyer pickup and better mandi rates',
    icon: Layers,
    tag: 'Recommended for Farmers',
  },
  {
    key: 'FARM_INPUTS',
    title: 'Farm Input Bulk Supply',
    subtitle: 'Source collective fertilizers, seeds, and agrochemicals at 10-25% wholesale discount',
    icon: ShoppingBag,
    tag: 'Input Cost Savings',
  },
  {
    key: 'WHOLESALE_CONTRACT',
    title: 'Wholesale Processing Contract',
    subtitle: 'Supply directly to food processing plants, supermarkets, and institutional depots',
    icon: Building2,
    tag: 'Fixed Price Contract',
  },
  {
    key: 'EXPORT_POOL',
    title: 'Export Consignment Pool',
    subtitle: 'Aggregate certified Grade A produce for overseas shipping containers',
    icon: Globe2,
    tag: 'Premium Export',
  },
];

const URGENCIES: { key: ProcurementUrgency; label: string; sub: string }[] = [
  { key: 'URGENT', label: 'Urgent', sub: 'Needed in <7 Days' },
  { key: 'STANDARD', label: 'Standard', sub: 'Target 14 Days' },
  { key: 'FLEXIBLE', label: 'Flexible', sub: 'Within 30 Days' },
];

export default function CreateRequirementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    activeDraft,
    startNewDraft,
    updateActiveDraft,
    saveDraft,
  } = useRequirementsStore();

  const [title, setTitle] = useState('');
  const [procurementType, setProcurementType] = useState<ProcurementType>('COMMERCIAL_AGGREGATION');
  const [urgency, setUrgency] = useState<ProcurementUrgency>('STANDARD');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize draft if none exists
  useEffect(() => {
    if (!activeDraft) {
      startNewDraft();
    } else {
      setTitle(activeDraft.title || '');
      setProcurementType(activeDraft.procurementType || 'COMMERCIAL_AGGREGATION');
      setUrgency(activeDraft.urgency || 'STANDARD');
      setNotes(activeDraft.notes || '');
    }
  }, [activeDraft, startNewDraft]);

  // Handle Save Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    updateActiveDraft({
      title: title.trim() || 'Untitled Requirement',
      procurementType,
      urgency,
      notes: notes.trim(),
      lastSavedStep: 1,
    });
    const res = await saveDraft();
    setIsSaving(false);
    if (res.success) {
      Alert.alert(
        'Draft Saved! 💾',
        `Your procurement requirement draft (${activeDraft?.draftId || res.id}) has been saved. You can resume anytime from the dashboard.`
      );
    }
  };

  // Handle Continue to Step 2 (Select Products)
  const handleContinue = () => {
    const finalTitle = title.trim() || `${procurementType.replace('_', ' ')} Requirement`;
    updateActiveDraft({
      title: finalTitle,
      procurementType,
      urgency,
      notes: notes.trim(),
      lastSavedStep: 2,
    });
    router.push('/requirements/select-products');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Wizard Header ─────────────────────────────────────── */}
      <RequirementStepHeader
        currentStep={1}
        stepTitle="Create Requirement"
        subtitle="Specify requirement type, draft identifier, and timeline"
        onSaveDraft={handleSaveDraft}
        isSavingDraft={isSaving}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Draft Identifier Pill ──────────────────────────── */}
          <View style={styles.draftIdCard}>
            <View style={styles.draftIdLeft}>
              <Text style={styles.draftIdLabel}>DRAFT IDENTIFIER</Text>
              <Text style={styles.draftIdCode}>
                {activeDraft?.draftId || 'REQ-DRAFT-INIT'}
              </Text>
            </View>
            <View style={styles.draftPill}>
              <Text style={styles.draftPillText}>Auto-Saved</Text>
            </View>
          </View>

          {/* ── Procurement Type Selection ─────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Procurement Type</Text>
            <Text style={styles.sectionSubtitle}>
              Select the purpose of this procurement requirement
            </Text>

            <View style={styles.typeCardsCol}>
              {PROCUREMENT_TYPES.map((typeItem) => {
                const IconComponent = typeItem.icon;
                const isSelected = procurementType === typeItem.key;

                return (
                  <Pressable
                    key={typeItem.key}
                    style={[
                      styles.typeCard,
                      isSelected && styles.typeCardSelected,
                    ]}
                    onPress={() => {
                      setProcurementType(typeItem.key);
                      if (!title || title.includes('Requirement')) {
                        setTitle(`${typeItem.title} Order`);
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.typeIconWrap,
                        isSelected && styles.typeIconWrapSelected,
                      ]}
                    >
                      <IconComponent
                        size={22}
                        color={isSelected ? '#FFFFFF' : MKColors.primaryGreen}
                      />
                    </View>

                    <View style={styles.typeInfo}>
                      <View style={styles.typeTitleRow}>
                        <Text
                          style={[
                            styles.typeTitle,
                            isSelected && styles.typeTitleSelected,
                          ]}
                        >
                          {typeItem.title}
                        </Text>
                        <View
                          style={[
                            styles.tagBadge,
                            isSelected && styles.tagBadgeSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.tagBadgeText,
                              isSelected && styles.tagBadgeTextSelected,
                            ]}
                          >
                            {typeItem.tag}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.typeSubtitle}>{typeItem.subtitle}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Requirement Title ─────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirement Title</Text>
            <Text style={styles.sectionSubtitle}>
              Give this procurement demand a recognizable name
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="e.g. Nashik Red Onion Export Pool or Kharif DAP Order"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* ── Urgency Level ─────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Procurement Urgency</Text>
            <Text style={styles.sectionSubtitle}>
              Helps match suppliers with ready stock vs upcoming harvest
            </Text>

            <View style={styles.urgencyRow}>
              {URGENCIES.map((u) => {
                const isSelected = urgency === u.key;
                return (
                  <Pressable
                    key={u.key}
                    style={[
                      styles.urgencyCard,
                      isSelected && styles.urgencyCardSelected,
                    ]}
                    onPress={() => setUrgency(u.key)}
                  >
                    <Text
                      style={[
                        styles.urgencyLabel,
                        isSelected && styles.urgencyLabelSelected,
                      ]}
                    >
                      {u.label}
                    </Text>
                    <Text
                      style={[
                        styles.urgencySub,
                        isSelected && styles.urgencySubSelected,
                      ]}
                    >
                      {u.sub}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Additional Notes / Purpose ─────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objective & Notes (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Special context, farmer group backing, or quality instructions
            </Text>

            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="e.g. Sourcing on behalf of 24 member farmers in Dindori Taluka. Escrow guaranteed payment."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* ── Security / Process Notice ──────────────────────── */}
          <View style={styles.infoBox}>
            <ShieldCheck size={18} color="#15803D" />
            <Text style={styles.infoBoxText}>
              All procurement contracts created in MandiKart are backed by institutional buyer escrow and verified weighbridge collection protocols.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sticky Bottom Bar ─────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Pressable
          style={styles.continueBtn}
          onPress={handleContinue}
        >
          <Text style={styles.continueBtnText}>Continue to Select Products</Text>
          <ArrowRight size={18} color="#FFFFFF" />
        </Pressable>
      </View>
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
    paddingTop: 14,
    paddingBottom: 90,
  },
  draftIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5DFD4',
    marginBottom: 16,
  },
  draftIdLeft: {},
  draftIdLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  draftIdCode: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.primaryGreenDark,
    marginTop: 2,
  },
  draftPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  draftPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 10,
  },
  typeCardsCol: {
    gap: 10,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5DFD4',
  },
  typeCardSelected: {
    borderColor: MKColors.primaryGreen,
    backgroundColor: '#F0FDF4',
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeIconWrapSelected: {
    backgroundColor: MKColors.primaryGreen,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  typeTitleSelected: {
    color: MKColors.primaryGreenDark,
  },
  tagBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagBadgeSelected: {
    backgroundColor: '#DCFCE7',
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },
  tagBadgeTextSelected: {
    color: '#166534',
  },
  typeSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5DFD4',
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  urgencyCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5DFD4',
  },
  urgencyCardSelected: {
    borderColor: MKColors.accentOrange,
    backgroundColor: '#FFF7ED',
  },
  urgencyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  urgencyLabelSelected: {
    color: MKColors.accentOrangeDark,
  },
  urgencySub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 3,
    textAlign: 'center',
  },
  urgencySubSelected: {
    color: '#C2410C',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginTop: 6,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
    fontWeight: '500',
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
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primaryGreen,
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
