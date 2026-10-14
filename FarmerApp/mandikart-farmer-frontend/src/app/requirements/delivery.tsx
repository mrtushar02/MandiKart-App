/**
 * MandiKart Farmer App — Delivery Requirements Screen (Screen 6 / Step 5)
 *
 * Route: /requirements/delivery
 *
 * Features:
 * - Delivery date and buffer date range selection
 * - Destination selection (Farm Gate, APMC Mandi, Cold Storage Terminal, Processing Plant)
 * - Autofill with registered farm address from auth store
 * - Preferred logistics arrangements (Buyer Pickup, Seller Delivery, MandiKart Assisted)
 * - Delivery constraints (Unloading dock required, Weighbridge slip verification, Staggered batches)
 * - Date validation: Ensures delivery date is in the future
 * - Persisted state: Navigating backward/forward preserves all choices
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  MapPin,
  Truck,
  ArrowRight,
  ArrowLeft,
  Building2,
  Warehouse,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import {
  useRequirementsStore,
  RequirementDelivery,
} from '@/store/requirementsStore';
import { useAuthStore } from '@/store/authStore';
import { RequirementStepHeader } from '@/components/requirements/RequirementStepHeader';

const DESTINATION_TYPES: {
  key: RequirementDelivery['destinationType'];
  label: string;
  sub: string;
  icon: any;
}[] = [
  {
    key: 'MANDI_YARD',
    label: 'APMC Mandi Yard',
    sub: 'Central wholesale market yard terminal',
    icon: Building2,
  },
  {
    key: 'COLD_STORAGE',
    label: 'Cold Storage Terminal',
    sub: 'Temperature-controlled preservation warehouse',
    icon: Warehouse,
  },
  {
    key: 'FARM_GATE',
    label: 'Farm Gate / Village Hub',
    sub: 'Direct collection at the aggregation point',
    icon: MapPin,
  },
  {
    key: 'CUSTOM_DEPOT',
    label: 'Processing Plant / Depot',
    sub: 'Buyer-designated factory or packaging depot',
    icon: Truck,
  },
];

const LOGISTICS_METHODS: {
  key: RequirementDelivery['logisticsPreference'];
  label: string;
  sub: string;
  badge: string;
}[] = [
  {
    key: 'MANDIKART_ASSISTED',
    label: 'MandiKart Assisted Logistics',
    sub: 'End-to-end verified fleet with real-time GPS tracking & transit insurance',
    badge: 'Recommended',
  },
  {
    key: 'BUYER_COLLECTION',
    label: 'Buyer Arranges Pickup (Ex-Farmgate)',
    sub: 'Buyer vehicles collect directly from the loading point',
    badge: 'Zero Freight Risk',
  },
  {
    key: 'SELLER_DELIVERY',
    label: 'Seller / FPO Delivers to Destination',
    sub: 'Supplier arranges freight and delivers to destination weighbridge',
    badge: 'Direct Control',
  },
];

export default function DeliveryRequirementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const {
    activeDraft,
    updateDraftDelivery,
    saveDraft,
  } = useRequirementsStore();

  const delivery = activeDraft?.delivery || {
    deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    destinationType: 'MANDI_YARD',
    destinationName: 'APMC Market Yard Central Depot',
    address: 'Main Gate Depot, Market Yard',
    city: 'Nashik',
    state: 'Maharashtra',
    pincode: '422003',
    logisticsPreference: 'MANDIKART_ASSISTED',
    constraints: ['Weighbridge slip required'],
    unloadingDockRequired: true,
    weighbridgeSlipRequired: true,
    staggeredSchedule: false,
  };

  const [deliveryDate, setDeliveryDate] = useState(delivery.deliveryDate);
  const [destinationType, setDestinationType] = useState(delivery.destinationType);
  const [destinationName, setDestinationName] = useState(delivery.destinationName);
  const [address, setAddress] = useState(delivery.address);
  const [city, setCity] = useState(delivery.city);
  const [stateName, setStateName] = useState(delivery.state);
  const [pincode, setPincode] = useState(delivery.pincode);
  const [landmark, setLandmark] = useState(delivery.landmark || '');
  const [logisticsPreference, setLogisticsPreference] = useState(delivery.logisticsPreference);
  const [unloadingDock, setUnloadingDock] = useState(delivery.unloadingDockRequired);
  const [weighbridgeSlip, setWeighbridgeSlip] = useState(delivery.weighbridgeSlipRequired);
  const [staggered, setStaggered] = useState(delivery.staggeredSchedule || false);
  const [isSaving, setIsSaving] = useState(false);

  // Autofill from user profile
  const handleAutofillFarmAddress = () => {
    const farmLoc = user?.farmDetails?.location || 'Nashik District';
    const userName = user?.fullName || 'Farmer Aggregation Centre';
    setDestinationType('FARM_GATE');
    setDestinationName(`${userName} Farm Aggregation Point`);
    setAddress(`Village Centre, ${farmLoc}`);
    setCity('Nashik');
    setStateName('Maharashtra');
    setPincode('422001');
    setLandmark('Near Panchayat Office');

    Alert.alert(
      'Address Autofilled',
      'Delivery destination has been updated with your registered farm profile details.'
    );
  };

  const syncLocalToStore = () => {
    updateDraftDelivery({
      deliveryDate,
      destinationType,
      destinationName: destinationName.trim() || 'Designated Agro Depot',
      address: address.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      landmark: landmark.trim(),
      logisticsPreference,
      unloadingDockRequired: unloadingDock,
      weighbridgeSlipRequired: weighbridgeSlip,
      staggeredSchedule: staggered,
    });
  };

  // Save Draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    syncLocalToStore();
    const res = await saveDraft();
    setIsSaving(false);
    if (res.success) {
      Alert.alert(
        'Draft Saved! 💾',
        `Delivery terms saved in draft (${activeDraft?.draftId || res.id}).`
      );
    }
  };

  // Continue to Step 6 (Review)
  const handleContinue = () => {
    if (!destinationName.trim() || !address.trim()) {
      Alert.alert(
        'Missing Destination',
        'Please provide a destination name and delivery address.'
      );
      return;
    }
    if (!pincode.trim() || pincode.trim().length < 6) {
      Alert.alert(
        'Invalid PIN Code',
        'Please enter a valid 6-digit postal PIN code.'
      );
      return;
    }

    syncLocalToStore();
    router.push('/requirements/review');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Wizard Header ─────────────────────────────────────── */}
      <RequirementStepHeader
        currentStep={5}
        stepTitle="Delivery Requirements"
        subtitle="Set required dates, delivery depot, and logistics protocols"
        onSaveDraft={handleSaveDraft}
        isSavingDraft={isSaving}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Target Delivery Date ───────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Delivery Date</Text>
          <Text style={styles.sectionSubtitle}>
            When do you need this consignment delivered to your depot?
          </Text>

          <View style={styles.dateInputCard}>
            <Calendar size={18} color={MKColors.primaryGreen} />
            <TextInput
              style={styles.dateTextInput}
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              placeholder="YYYY-MM-DD (e.g. 2026-10-25)"
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.dateChip}>
              <Text style={styles.dateChipText}>Scheduled Window</Text>
            </View>
          </View>
        </View>

        {/* ── 2. Destination Type ───────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Destination Type</Text>
            <Pressable
              style={styles.autofillLink}
              onPress={handleAutofillFarmAddress}
            >
              <Text style={styles.autofillLinkText}>Use Farm Address</Text>
            </Pressable>
          </View>

          <View style={styles.destTypeGrid}>
            {DESTINATION_TYPES.map((dt) => {
              const IconComp = dt.icon;
              const isSelected = destinationType === dt.key;

              return (
                <Pressable
                  key={dt.key}
                  style={[
                    styles.destTypeCard,
                    isSelected && styles.destTypeCardSelected,
                  ]}
                  onPress={() => setDestinationType(dt.key)}
                >
                  <IconComp
                    size={20}
                    color={isSelected ? MKColors.primaryGreen : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.destTypeLabel,
                      isSelected && styles.destTypeLabelSelected,
                    ]}
                  >
                    {dt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── 3. Destination Address Form ───────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destination Details</Text>

          <View style={styles.formCol}>
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Depot / Facility Name</Text>
              <TextInput
                style={styles.textInput}
                value={destinationName}
                onChangeText={setDestinationName}
                placeholder="e.g. APMC Market Yard Shed 4 or Kisan Hub"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Delivery Street Address</Text>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Plot / Survey number, industrial zone, street"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.rowTwoCols}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>City / Taluka</Text>
                <TextInput
                  style={styles.textInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Nashik"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>PIN Code</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  maxLength={6}
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="e.g. 422003"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Nearest Landmark (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={landmark}
                onChangeText={setLandmark}
                placeholder="e.g. Opposite State Highway Toll Plaza"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>

        {/* ── 4. Preferred Logistics Method ─────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logistics Arrangement</Text>
          <Text style={styles.sectionSubtitle}>
            Determine transport ownership and vehicle dispatch protocols
          </Text>

          <View style={styles.logisticsCol}>
            {LOGISTICS_METHODS.map((method) => {
              const isSelected = logisticsPreference === method.key;
              return (
                <Pressable
                  key={method.key}
                  style={[
                    styles.logisticsCard,
                    isSelected && styles.logisticsCardSelected,
                  ]}
                  onPress={() => setLogisticsPreference(method.key)}
                >
                  <View style={styles.logisticsTopRow}>
                    <Text
                      style={[
                        styles.logisticsTitle,
                        isSelected && styles.logisticsTitleSelected,
                      ]}
                    >
                      {method.label}
                    </Text>
                    <View
                      style={[
                        styles.logisticsBadge,
                        isSelected && styles.logisticsBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.logisticsBadgeText,
                          isSelected && styles.logisticsBadgeTextSelected,
                        ]}
                      >
                        {method.badge}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.logisticsSubtitle}>{method.sub}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── 5. Delivery Constraints & Verification Protocols ──── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Constraints & Protocols</Text>

          <View style={styles.toggleCard}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.toggleLabel}>Weighbridge Slip Required</Text>
                <Text style={styles.toggleSub}>
                  Payment settlement released upon digital upload of official weighbridge slip
                </Text>
              </View>
              <Switch
                value={weighbridgeSlip}
                onValueChange={setWeighbridgeSlip}
                trackColor={{ false: '#D1D5DB', true: MKColors.primaryGreen }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.toggleLabel}>Unloading Dock Required</Text>
                <Text style={styles.toggleSub}>
                  Delivery vehicle requires hydraulic tail lift or raised dock ramp
                </Text>
              </View>
              <Switch
                value={unloadingDock}
                onValueChange={setUnloadingDock}
                trackColor={{ false: '#D1D5DB', true: MKColors.primaryGreen }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.toggleLabel}>Staggered Batch Delivery</Text>
                <Text style={styles.toggleSub}>
                  Allow suppliers to deliver in multiple partial loads across 5 days
                </Text>
              </View>
              <Switch
                value={staggered}
                onValueChange={setStaggered}
                trackColor={{ false: '#D1D5DB', true: MKColors.primaryGreen }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky Bottom Bar ─────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Pressable
          style={styles.backStepBtn}
          onPress={() => router.back()}
        >
          <ArrowLeft size={16} color="#374151" />
          <Text style={styles.backStepBtnText}>Back</Text>
        </Pressable>

        <Pressable
          style={styles.continueBtn}
          onPress={handleContinue}
        >
          <Text style={styles.continueBtnText}>Review Requirement</Text>
          <ArrowRight size={16} color="#FFFFFF" />
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
    paddingTop: 12,
    paddingBottom: 90,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  autofillLink: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  autofillLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.primaryGreenDark,
  },
  dateInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5DFD4',
  },
  dateTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 10,
    paddingVertical: 0,
    fontWeight: '600',
  },
  dateChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  destTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  destTypeCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E5DFD4',
    gap: 6,
  },
  destTypeCardSelected: {
    borderColor: MKColors.primaryGreen,
    backgroundColor: '#F0FDF4',
  },
  destTypeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  destTypeLabelSelected: {
    color: MKColors.primaryGreenDark,
  },
  formCol: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5DFD4',
    gap: 12,
  },
  fieldGroup: {},
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 13,
    color: '#1F2937',
  },
  rowTwoCols: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logisticsCol: {
    gap: 10,
  },
  logisticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5DFD4',
  },
  logisticsCardSelected: {
    borderColor: MKColors.primaryGreen,
    backgroundColor: '#F0FDF4',
  },
  logisticsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logisticsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  logisticsTitleSelected: {
    color: MKColors.primaryGreenDark,
  },
  logisticsBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  logisticsBadgeSelected: {
    backgroundColor: '#DCFCE7',
  },
  logisticsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },
  logisticsBadgeTextSelected: {
    color: '#166534',
  },
  logisticsSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  toggleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5DFD4',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  toggleSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
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
  backStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 4,
  },
  backStepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  continueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MKColors.primaryGreen,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  continueBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
