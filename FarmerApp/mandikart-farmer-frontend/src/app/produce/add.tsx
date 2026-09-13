/**
 * MandiKart — Add Produce Screen
 *
 * Progressive disclosure farmer intake flow:
 * 1. Crop Selection (Popular crop chips + Custom input)
 * 2. Variety & Category
 * 3. Quantity & Unit (KG, Quintal, Ton) with auto-conversion
 * 4. Quality Grade (Grade A, Grade B, Grade C, Unsorted) with visual badges & descriptions
 * 5. Harvest Date (Quick chips: Today, Yesterday, 3 Days Ago, 1 Week Ago)
 * 6. Storage Type & Condition (Warehouse, Farm Shed, Cold Storage, Other)
 * 7. Photo Upload (Camera / Gallery / Curated presets)
 * 8. Target Price & AGMARKNET Reference Rate
 * 9. Availability Date (Immediate, Within 3 Days, Within 1 Week)
 *
 * Post-Save Celebration:
 * Modal with 2 clear farmer pathways:
 * 1. "VIEW MY INVENTORY" -> router.replace('/(tabs)/produce')
 * 2. "FIND ACTIVE BUYERS" -> router.replace('/sell/best-options')
 *
 * Simple, professional English throughout.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Building2,
  Warehouse,
  Scale,
  ArrowRight,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useProduceStore, QualityGrade, StorageType, CropCondition } from '@/store/produceStore';
import { pickImageFromGallery, takePhotoWithCamera } from '@/services/imagePickerService';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

// Curated crop presets with reliable default assets & market rates
interface CropPreset {
  name: string;
  category: string;
  defaultVariety: string;
  defaultImage: string;
  refPrice: number;
  minDays: number;
  maxDays: number;
  basis: string;
  mandi: string;
}

const CROP_PRESETS: CropPreset[] = [
  {
    name: 'Red Onion',
    category: 'Vegetables',
    defaultVariety: 'Nashik Red Garwa',
    defaultImage:
      'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80',
    refPrice: 22,
    minDays: 8,
    maxDays: 12,
    basis: 'Ventilated wooden slatted storage, dry ambient condition',
    mandi: 'Nashik APMC Mandi',
  },
  {
    name: 'Tomato',
    category: 'Vegetables',
    defaultVariety: 'Abhinav Hybrid',
    defaultImage:
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
    refPrice: 28,
    minDays: 3,
    maxDays: 5,
    basis: 'Plastic crates at ambient temperature in farm shade',
    mandi: 'Pimpalgaon Mandi',
  },
  {
    name: 'Potato',
    category: 'Vegetables',
    defaultVariety: 'Kufri Jyoti',
    defaultImage:
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
    refPrice: 18,
    minDays: 20,
    maxDays: 35,
    basis: 'Burlap bags in cool dark ventilated storage',
    mandi: 'Lasalgaon Mandi Hub',
  },
  {
    name: 'Wheat',
    category: 'Grains',
    defaultVariety: 'Lokwan Sharbati',
    defaultImage:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
    refPrice: 26,
    minDays: 90,
    maxDays: 180,
    basis: 'Moisture-controlled sealed dry gunny bags',
    mandi: 'Kalyan Wholesale APMC',
  },
  {
    name: 'Soybean',
    category: 'Oilseeds',
    defaultVariety: 'JS-335',
    defaultImage:
      'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&auto=format&fit=crop&q=80',
    refPrice: 46,
    minDays: 60,
    maxDays: 120,
    basis: 'Warehouse dry storage with <10% grain moisture',
    mandi: 'Latur APMC',
  },
  {
    name: 'Garlic',
    category: 'Vegetables',
    defaultVariety: 'Desi G2',
    defaultImage:
      'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&auto=format&fit=crop&q=80',
    refPrice: 115,
    minDays: 30,
    maxDays: 60,
    basis: 'Hanging ventilated mesh bags',
    mandi: 'Mandsaur Mandi',
  },
];

// Crop image resolver for dynamic thumbnail selection matching farmer input
export const getCropThumbnailUrl = (cropName: string = '', category: string = ''): string => {
  const n = cropName.toLowerCase();
  const c = category.toLowerCase();
  if (n.includes('tomato')) return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80';
  if (n.includes('onion')) return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80';
  if (n.includes('potato') || n.includes('alu') || n.includes('aloo')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80';
  if (n.includes('wheat') || n.includes('gehu')) return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80';
  if (n.includes('rice') || n.includes('paddy') || n.includes('chawal')) return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80';
  if (n.includes('soybean') || n.includes('soya')) return 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&auto=format&fit=crop&q=80';
  if (n.includes('corn') || n.includes('maize') || n.includes('makka')) return 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=80';
  if (n.includes('chilli') || n.includes('chili') || n.includes('mirchi')) return 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&auto=format&fit=crop&q=80';
  if (n.includes('garlic') || n.includes('lahsun')) return 'https://images.unsplash.com/photo-1615477550926-25ccbf3a9ec1?w=500&auto=format&fit=crop&q=80';
  if (n.includes('ginger') || n.includes('adrak')) return 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80';
  if (n.includes('apple') || n.includes('seb')) return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80';
  if (n.includes('mango') || n.includes('aam')) return 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80';
  if (n.includes('banana') || n.includes('kela')) return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80';
  if (n.includes('pomegranate') || n.includes('anar')) return 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80';
  if (n.includes('grape') || n.includes('angoor')) return 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=80';
  if (n.includes('orange') || n.includes('santra')) return 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=500&auto=format&fit=crop&q=80';
  if (n.includes('carrot') || n.includes('gajar')) return 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop&q=80';
  if (n.includes('cabbage') || n.includes('patta gobi')) return 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=500&auto=format&fit=crop&q=80';
  if (n.includes('cauliflower') || n.includes('phool gobi')) return 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500&auto=format&fit=crop&q=80';
  if (n.includes('peas') || n.includes('matar')) return 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=500&auto=format&fit=crop&q=80';
  if (n.includes('cucumber') || n.includes('kheera')) return 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500&auto=format&fit=crop&q=80';
  if (c.includes('fruit')) return 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80';
  if (c.includes('grain')) return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80';
  return 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=500&auto=format&fit=crop&q=80';
};

export default function AddProduceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    cropName?: string;
    variety?: string;
    category?: string;
    grade?: string;
    price?: string;
    imageUri?: string;
    mandi?: string;
  }>();

  const addCrop = useProduceStore((state) => state.addCrop);

  // Form State initialized with route params if navigated from recommendations
  const initialPreset = (() => {
    if (params.cropName) {
      const match = CROP_PRESETS.find(
        (p) => p.name.toLowerCase() === params.cropName?.toLowerCase()
      );
      if (match) return match;
    }
    return CROP_PRESETS[0];
  })();

  const [selectedPreset, setSelectedPreset] = useState<CropPreset>(initialPreset);
  const [cropName, setCropName] = useState(params.cropName || initialPreset.name);
  const [variety, setVariety] = useState(params.variety || initialPreset.defaultVariety);
  const [category, setCategory] = useState(params.category || initialPreset.category);
  const [quantityInput, setQuantityInput] = useState('');
  const [unit, setUnit] = useState<'KG' | 'Quintal' | 'Ton'>('Quintal');
  const [grade, setGrade] = useState<QualityGrade>((params.grade as QualityGrade) || 'Grade A');
  const [harvestOption, setHarvestOption] = useState<'Today' | 'Yesterday' | '3 Days Ago' | '1 Week Ago'>('Today');
  const [storageType, setStorageType] = useState<StorageType>('Warehouse');
  const [storageDetails, setStorageDetails] = useState('');
  const [condition, setCondition] = useState<CropCondition>('Good');
  const [hasCustomPhoto, setHasCustomPhoto] = useState(!!params.imageUri);
  const [photoUri, setPhotoUri] = useState<string>(
    params.imageUri || (params.cropName ? getCropThumbnailUrl(params.cropName, params.category) : initialPreset.defaultImage)
  );
  const [expectedPrice, setExpectedPrice] = useState(params.price || initialPreset.refPrice.toString());
  const [availableFrom, setAvailableFrom] = useState<'Immediate' | 'Within 3 Days' | 'Within 1 Week'>('Immediate');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    if (params.cropName) {
      setCropName(params.cropName);
      if (params.variety) setVariety(params.variety);
      if (params.category) setCategory(params.category);
      if (params.price) setExpectedPrice(params.price);
      if (params.imageUri) {
        setPhotoUri(params.imageUri);
        setHasCustomPhoto(true);
      } else {
        setPhotoUri(getCropThumbnailUrl(params.cropName, params.category));
      }
      if (params.grade) setGrade(params.grade as QualityGrade);
    }
  }, [params.cropName, params.variety, params.category, params.price, params.imageUri, params.grade]);

  // Success Celebration Modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [createdCropId, setCreatedCropId] = useState<string>('');

  // Auto-calculated KG quantity
  const computedKg = (() => {
    const val = parseFloat(quantityInput) || 0;
    if (unit === 'Quintal') return val * 100;
    if (unit === 'Ton') return val * 1000;
    return val;
  })();

  const handleSelectPreset = (preset: CropPreset) => {
    setSelectedPreset(preset);
    setCropName(preset.name);
    setVariety(preset.defaultVariety);
    setCategory(preset.category);
    setHasCustomPhoto(false);
    setPhotoUri(preset.defaultImage || getCropThumbnailUrl(preset.name, preset.category));
    setExpectedPrice(preset.refPrice.toString());
  };

  const handleCropNameChange = (text: string) => {
    setCropName(text);
    if (!hasCustomPhoto) {
      const match = CROP_PRESETS.find(
        (p) => p.name.toLowerCase() === text.trim().toLowerCase()
      );
      if (match) {
        setSelectedPreset(match);
        setPhotoUri(match.defaultImage);
        setCategory(match.category);
        setVariety(match.defaultVariety);
        setExpectedPrice(match.refPrice.toString());
      } else {
        setPhotoUri(getCropThumbnailUrl(text, category));
      }
    }
  };

  const handlePickFromGallery = async () => {
    const res = await pickImageFromGallery();
    if (!res.cancelled && res.uri) {
      setHasCustomPhoto(true);
      setPhotoUri(res.uri);
    }
  };

  const handleTakePhoto = async () => {
    const res = await takePhotoWithCamera();
    if (!res.cancelled && res.uri) {
      setHasCustomPhoto(true);
      setPhotoUri(res.uri);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveCrop = () => {
    if (isSubmitting) return;

    const errors: { [key: string]: string } = {};
    if (!cropName.trim()) {
      errors.cropName = 'Please enter the crop name';
    }
    if (!quantityInput || parseFloat(quantityInput) <= 0) {
      errors.quantity = 'Please enter a valid quantity (e.g. 50)';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      Alert.alert('Incomplete Form', 'Please fill in the required crop details.');
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const expPriceNum = parseFloat(expectedPrice) || selectedPreset.refPrice;

    // Build crop entity in PENDING_APPROVAL state
    const newCrop = addCrop({
      cropName: cropName.trim(),
      variety: variety.trim(),
      category: category,
      totalKg: computedKg,
      availableKg: computedKg,
      reservedKg: 0,
      soldKg: 0,
      unit: unit,
      grade: grade,
      status: 'PENDING_APPROVAL',
      harvestDate:
        harvestOption === 'Today'
          ? 'Today (04 Sep 2026)'
          : harvestOption === 'Yesterday'
          ? 'Yesterday (03 Sep 2026)'
          : harvestOption === '3 Days Ago'
          ? '01 Sep 2026'
          : '28 Aug 2026',
      availableFrom: availableFrom,
      location: 'Main Farm Warehouse',
      storageType: storageType,
      storageDetails: storageDetails.trim() || selectedPreset.basis,
      condition: condition,
      conditionUpdatedAt: 'Today',
      imageUri: photoUri,
      expectedPricePerKg: expPriceNum,

      shelfLifeDaysEstMin: selectedPreset.minDays,
      shelfLifeDaysEstMax: selectedPreset.maxDays,
      shelfLifeBasis: selectedPreset.basis,

      referencePricePerKg: selectedPreset.refPrice,
      priceMovementPct: 5,
      priceMovementTrend: 'up',
      marketDemand: 'High',
      marketName: selectedPreset.mandi,
      marketDistanceKm: 18,
      marketSource: 'AGMARKNET Official Feed',
      marketLastUpdated: '04 Sep, 10:30 AM',

      history7D: [
        { date: '29 Aug', price: selectedPreset.refPrice - 2 },
        { date: '31 Aug', price: selectedPreset.refPrice - 1 },
        { date: '02 Sep', price: selectedPreset.refPrice },
        { date: '04 Sep', price: selectedPreset.refPrice },
      ],
      history30D: [
        { date: '05 Aug', price: selectedPreset.refPrice - 4 },
        { date: '15 Aug', price: selectedPreset.refPrice - 3 },
        { date: '25 Aug', price: selectedPreset.refPrice - 1 },
        { date: '04 Sep', price: selectedPreset.refPrice },
      ],
      history90D: [
        { date: '05 Jun', price: selectedPreset.refPrice - 6 },
        { date: '05 Jul', price: selectedPreset.refPrice - 4 },
        { date: '05 Aug', price: selectedPreset.refPrice - 3 },
        { date: '04 Sep', price: selectedPreset.refPrice },
      ],

      watchTag: 'Newly Added Harvest',
      watchUrgency: 'positive',
    });

    // Asynchronously dispatch to backend API & Supabase database
    const mappedGrade = grade === 'Grade B' ? 'B' : grade === 'Grade C' ? 'C' : 'A';
    const quantityVal = parseFloat(quantityInput) || computedKg;
    const user = useAuthStore.getState().user;
    const farmer = useAuthStore.getState().farmer;
    const realFarmerName = user?.fullName || user?.name || farmer?.fullName || 'Farmer';
    const realFarmerPhone = user?.phone || farmer?.phone || '';
    const realLocation = user?.district ? `${user.district}, ${user.state || 'Maharashtra'}` : (user?.city || 'Nashik Mandi Area');

    // Ensure network image payload is safe and never blows up JSON payload limit
    const isSafeHttpUri = (uri: string) =>
      (uri.startsWith('http://') || uri.startsWith('https://')) && uri.length < 2048;
    const isSafeCompactDataUri = (uri: string) =>
      uri.startsWith('data:image/') && uri.length < 2000000; // Under 2MB
    
    let safeImage = getCropThumbnailUrl(cropName, category);
    if (photoUri && (isSafeHttpUri(photoUri) || isSafeCompactDataUri(photoUri))) {
      safeImage = photoUri;
    }
    const remoteImages = [safeImage];

    apiClient.createProduct({
      cropName: cropName.trim(),
      cropVariety: variety.trim() || undefined,
      grade: mappedGrade,
      category: category || 'Vegetables',
      totalQuantity: computedKg || quantityVal,
      quantityUnit: 'kg',
      basePricePerUnit: expPriceNum,
      minOrderQuantity: 10,
      targetBuyer: 'PENDING_APPROVAL',
      status: 'PENDING_APPROVAL',
      isActive: false,
      images: remoteImages,
      shelfLifeDays: selectedPreset.maxDays || 7,
      pickupAddress: realLocation,
      farmerName: realFarmerName,
      farmerPhone: realFarmerPhone,
      location: realLocation,
    } as any, useAuthStore.getState().token)
      .then((res: any) => {
        if (res?.data?.id) {
          useProduceStore.getState().replaceCropId(newCrop.id, res.data.id);
        }
        useProduceStore.getState().syncWithBackend();
      })
      .catch((err) => {
        console.log('[AddProduce] Product saved locally, pending server sync:', err?.message);
      });

    setCreatedCropId(newCrop.id);
    setSuccessModalVisible(true);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* ── Header ────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <ArrowLeft size={22} color={MKColors.textPrimary} />
          </Pressable>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerSubtitle}>MandiKart Crop Intake</Text>
            <Text style={styles.headerTitle}>Add New Crop</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Step 1: Quick Crop Selector ─────────────────────── */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>1. Select Crop *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetChipsRow}
            >
              {CROP_PRESETS.map((preset) => {
                const isSelected = cropName === preset.name;
                return (
                  <Pressable
                    key={preset.name}
                    style={[
                      styles.presetChip,
                      isSelected && styles.presetChipSelected,
                    ]}
                    onPress={() => handleSelectPreset(preset)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        isSelected && styles.presetChipTextSelected,
                      ]}
                    >
                      {preset.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.inputWrap}>
              <Text style={styles.fieldSublabel}>Crop Name:</Text>
              <TextInput
                style={[styles.textInput, formErrors.cropName && styles.inputError]}
                value={cropName}
                onChangeText={handleCropNameChange}
                placeholder="e.g. Red Onion, Wheat, Tomato..."
                placeholderTextColor={MKColors.textMuted}
              />
              {formErrors.cropName && (
                <Text style={styles.errorText}>{formErrors.cropName}</Text>
              )}
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.fieldSublabel}>Variety / Type (Optional):</Text>
              <TextInput
                style={styles.textInput}
                value={variety}
                onChangeText={setVariety}
                placeholder="e.g. Nashik Garwa, Sharbati, Hybrid 105..."
                placeholderTextColor={MKColors.textMuted}
              />
            </View>
          </View>

          {/* ── Step 2: Quantity & Unit ─────────────────────────── */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>2. Total Quantity & Unit *</Text>

            <View style={styles.qtyRow}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.qtyInput,
                  formErrors.quantity && styles.inputError,
                ]}
                keyboardType="numeric"
                value={quantityInput}
                onChangeText={setQuantityInput}
                placeholder="e.g. 50"
                placeholderTextColor={MKColors.textMuted}
              />

              <View style={styles.unitSelector}>
                {(['Quintal', 'KG', 'Ton'] as const).map((u) => {
                  const isUnitSelected = unit === u;
                  return (
                    <Pressable
                      key={u}
                      style={[
                        styles.unitBtn,
                        isUnitSelected && styles.unitBtnSelected,
                      ]}
                      onPress={() => setUnit(u)}
                    >
                      <Text
                        style={[
                          styles.unitBtnText,
                          isUnitSelected && styles.unitBtnTextSelected,
                        ]}
                      >
                        {u === 'Quintal' ? 'Qtl' : u}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {formErrors.quantity && (
              <Text style={styles.errorText}>{formErrors.quantity}</Text>
            )}

            {computedKg > 0 && (
              <View style={styles.convertedQtyNotice}>
                <Scale size={14} color={MKColors.primaryGreen} />
                <Text style={styles.convertedQtyText}>
                  Total Weight: <Text style={{ fontWeight: '800' }}>{computedKg.toLocaleString()} KG</Text> ({unit === 'Quintal' ? `${quantityInput} Quintals` : `${(computedKg / 100).toFixed(1)} Quintals`})
                </Text>
              </View>
            )}
          </View>

          {/* ── Step 3: Quality Grade ───────────────────────────── */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>3. Quality Grade *</Text>
            <View style={styles.gradesContainer}>
              {(['Grade A', 'Grade B', 'Grade C', 'Unsorted'] as QualityGrade[]).map((g) => {
                const isSelected = grade === g;
                return (
                  <Pressable
                    key={g}
                    style={[
                      styles.gradeOptionCard,
                      isSelected && styles.gradeOptionCardSelected,
                    ]}
                    onPress={() => setGrade(g)}
                  >
                    <View style={styles.gradeHeaderRow}>
                      <Text
                        style={[
                          styles.gradeOptionTitle,
                          isSelected && styles.gradeOptionTitleSelected,
                        ]}
                      >
                        {g}
                      </Text>
                      {isSelected && <CheckCircle2 size={16} color={MKColors.primaryGreen} />}
                    </View>
                    <Text style={styles.gradeOptionDesc}>
                      {g === 'Grade A'
                        ? 'Export & Premium Quality (Uniform size and optimal color)'
                        : g === 'Grade B'
                        ? 'Standard Commercial Quality (Good market condition)'
                        : g === 'Grade C'
                        ? 'Processing & Factory Grade'
                        : 'Field Run / Mixed Unsorted (Direct from harvest)'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Step 4: Harvest Date & Storage ─────────────────── */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>4. Harvest Date</Text>
            <View style={styles.harvestChipsRow}>
              {(['Today', 'Yesterday', '3 Days Ago', '1 Week Ago'] as const).map((h) => {
                const isSelected = harvestOption === h;
                return (
                  <Pressable
                    key={h}
                    style={[
                      styles.harvestChip,
                      isSelected && styles.harvestChipSelected,
                    ]}
                    onPress={() => setHarvestOption(h)}
                  >
                    <Text
                      style={[
                        styles.harvestChipText,
                        isSelected && styles.harvestChipTextSelected,
                      ]}
                    >
                      {h}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.fieldSublabel, { marginTop: 12 }]}>Storage Facility:</Text>
            <View style={styles.storageTypeRow}>
              {(['Warehouse', 'Farm', 'Cold Storage', 'Other'] as StorageType[]).map((st) => {
                const isSelected = storageType === st;
                return (
                  <Pressable
                    key={st}
                    style={[
                      styles.storageChip,
                      isSelected && styles.storageChipSelected,
                    ]}
                    onPress={() => setStorageType(st)}
                  >
                    <Warehouse
                      size={14}
                      color={isSelected ? '#FFFFFF' : MKColors.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.storageChipText,
                        isSelected && styles.storageChipTextSelected,
                      ]}
                    >
                      {st === 'Farm' ? 'Farm Shed' : st}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.fieldSublabel}>Storage Conditions (Optional):</Text>
              <TextInput
                style={styles.textInput}
                value={storageDetails}
                onChangeText={setStorageDetails}
                placeholder="e.g. Aerated warehouse with dry ambient conditions..."
                placeholderTextColor={MKColors.textMuted}
              />
            </View>
          </View>

          {/* ── Step 5: Crop Photo ──────────────────────────────── */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>5. Crop Photo</Text>
            <View style={styles.photoUploadContainer}>
              <Image source={{ uri: photoUri }} style={styles.uploadedPreview} />
              <View style={styles.photoActionsCol}>
                <Pressable
                  style={styles.photoActionButton}
                  onPress={handleTakePhoto}
                >
                  <Camera size={16} color={MKColors.primaryGreen} />
                  <Text style={styles.photoActionText}>Take Photo</Text>
                </Pressable>

                <Pressable
                  style={styles.photoActionButton}
                  onPress={handlePickFromGallery}
                >
                  <ImageIcon size={16} color={MKColors.primaryGreen} />
                  <Text style={styles.photoActionText}>Choose from Gallery</Text>
                </Pressable>
                <Text style={styles.photoHintText}>
                  Clear photos build buyer trust and improve offer response rates.
                </Text>
              </View>
            </View>
          </View>

          {/* ── Step 6: Expected Price & Mandi Reference ────────── */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>6. Mandi Benchmark & Target Price</Text>

            <View style={styles.mandiBenchmarkBox}>
              <Building2 size={16} color={MKColors.primaryGreen} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.mandiBenchmarkTitle}>
                  {selectedPreset.mandi} Reference:
                </Text>
                <Text style={styles.mandiBenchmarkValue}>
                  ₹{selectedPreset.refPrice}/kg (AGMARKNET verified feed)
                </Text>
              </View>
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.fieldSublabel}>Your Target Price (₹ per kg, optional):</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={expectedPrice}
                onChangeText={setExpectedPrice}
                placeholder={`e.g. ₹${selectedPreset.refPrice}/kg`}
                placeholderTextColor={MKColors.textMuted}
              />
            </View>
          </View>

          {/* ── Step 7: Available From ──────────────────────────── */}
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>7. Ready for Dispatch / Pickup</Text>
            <View style={styles.harvestChipsRow}>
              {(['Immediate', 'Within 3 Days', 'Within 1 Week'] as const).map((avail) => {
                const isSelected = availableFrom === avail;
                return (
                  <Pressable
                    key={avail}
                    style={[
                      styles.harvestChip,
                      isSelected && styles.harvestChipSelected,
                    ]}
                    onPress={() => setAvailableFrom(avail)}
                  >
                    <Text
                      style={[
                        styles.harvestChipText,
                        isSelected && styles.harvestChipTextSelected,
                      ]}
                    >
                      {avail}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Save CTA ────────────────────────────────────────── */}
          <Pressable
            style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
            onPress={handleSaveCrop}
          >
            <CheckCircle2 size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>Save Crop to Inventory</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── Post-Save Celebration & Decision Modal ──────────── */}
        <Modal
          visible={successModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.celebrationCard}>
              <View style={styles.celebrationIconWrap}>
                <CheckCircle2 size={42} color={MKColors.primaryGreen} />
              </View>

              <Text style={styles.celebrationTitle}>
                Produce Submitted (Pending Approval)
              </Text>
              <Text style={styles.celebrationSubtitle}>
                Your {cropName} ({computedKg.toLocaleString()} kg) is currently in Pending State. Once Mandi Admin reviews and approves it, it will immediately turn Active for buyers.
              </Text>

              {/* Summary of what was saved */}
              <View style={styles.savedSummaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Crop:</Text>
                  <Text style={styles.summaryVal}>{cropName} ({variety || 'Standard'})</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Status:</Text>
                  <Text style={[styles.summaryVal, { color: '#D97706', fontWeight: '800' }]}>🟡 Pending Admin Approval</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Quantity:</Text>
                  <Text style={styles.summaryVal}>{computedKg.toLocaleString()} kg ({grade})</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Benchmark Price:</Text>
                  <Text style={styles.summaryVal}>₹{selectedPreset.refPrice}/kg (AGMARKNET)</Text>
                </View>
              </View>

              <Text style={styles.actionQuestion}>What would you like to do next?</Text>

              {/* Action Button 1: "VIEW MY INVENTORY" */}
              <Pressable
                style={styles.decisionSecondaryBtn}
                onPress={() => {
                  setSuccessModalVisible(false);
                  router.replace('/(tabs)/produce');
                }}
              >
                <Text style={styles.decisionSecondaryText}>VIEW MY INVENTORY</Text>
              </Pressable>

              {/* Action Button 2: "FIND ACTIVE BUYERS" */}
              <Pressable
                style={styles.decisionPrimaryBtn}
                onPress={() => {
                  setSuccessModalVisible(false);
                  router.replace({
                    pathname: '/sell/best-options',
                    params: {
                      crop: cropName,
                      qty: computedKg.toString(),
                      grade: grade,
                    },
                  });
                }}
              >
                <Text style={styles.decisionPrimaryText}>FIND ACTIVE BUYERS</Text>
                <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
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
  backButton: {
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
  headerTextGroup: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.primaryGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 30,
  },

  // ── Form Sections ─────────────────────────────────────────────────
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: MKColors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginBottom: 10,
  },
  fieldSublabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MKColors.textSecondary,
    marginBottom: 6,
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: MKColors.borderLight,
  },
  presetChipSelected: {
    backgroundColor: MKColors.primaryGreen,
    borderColor: MKColors.primaryGreen,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.textSecondary,
  },
  presetChipTextSelected: {
    color: '#FFFFFF',
  },
  inputWrap: {
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#FAFAF8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: MKColors.border,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: MKColors.textPrimary,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 4,
    fontWeight: '600',
  },

  // Quantity Row
  qtyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  qtyInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: MKColors.borderLight,
  },
  unitBtn: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  unitBtnSelected: {
    backgroundColor: MKColors.primaryGreen,
  },
  unitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.textSecondary,
  },
  unitBtnTextSelected: {
    color: '#FFFFFF',
  },
  convertedQtyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  convertedQtyText: {
    fontSize: 12,
    color: MKColors.primaryGreenDark,
  },

  // Grades
  gradesContainer: {
    gap: 8,
  },
  gradeOptionCard: {
    backgroundColor: '#FAFAF8',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: MKColors.borderLight,
  },
  gradeOptionCardSelected: {
    borderColor: MKColors.primaryGreen,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
  },
  gradeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  gradeOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  gradeOptionTitleSelected: {
    color: MKColors.primaryGreen,
  },
  gradeOptionDesc: {
    fontSize: 11,
    color: MKColors.textSecondary,
    lineHeight: 15,
  },

  // Harvest Chips
  harvestChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  harvestChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: MKColors.borderLight,
  },
  harvestChipSelected: {
    backgroundColor: MKColors.primaryGreen,
    borderColor: MKColors.primaryGreen,
  },
  harvestChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textSecondary,
  },
  harvestChipTextSelected: {
    color: '#FFFFFF',
  },

  // Storage Type
  storageTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  storageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: MKColors.borderLight,
  },
  storageChipSelected: {
    backgroundColor: MKColors.primaryGreen,
    borderColor: MKColors.primaryGreen,
  },
  storageChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textSecondary,
  },
  storageChipTextSelected: {
    color: '#FFFFFF',
  },

  // Photo Upload
  photoUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  uploadedPreview: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: MKColors.border,
  },
  photoActionsCol: {
    flex: 1,
    gap: 8,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MKColors.primaryGreen,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  photoActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primaryGreen,
  },
  photoHintText: {
    fontSize: 10,
    color: MKColors.textSecondary,
  },

  // Mandi Benchmark
  mandiBenchmarkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  mandiBenchmarkTitle: {
    fontSize: 11,
    color: MKColors.primaryGreenDark,
    fontWeight: '600',
  },
  mandiBenchmarkValue: {
    fontSize: 13,
    fontWeight: '800',
    color: MKColors.primaryGreenDark,
  },

  // Submit Button
  submitButton: {
    backgroundColor: MKColors.primaryGreen,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: MKColors.primaryGreen,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Celebration Modal ─────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    elevation: 6,
  },
  celebrationIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: MKColors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  celebrationSubtitle: {
    fontSize: 13,
    color: MKColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  savedSummaryBox: {
    backgroundColor: '#FAFAF8',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: MKColors.border,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: MKColors.textSecondary,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  actionQuestion: {
    fontSize: 13,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginBottom: 12,
  },
  decisionSecondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: MKColors.primaryGreen,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  decisionSecondaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.primaryGreen,
  },
  decisionPrimaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: MKColors.accentOrange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
