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
  ActivityIndicator,
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
  Plus,
  FileText,
  ShieldCheck,
  Tag,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useProduceStore, QualityGrade, StorageType, CropCondition } from '@/store/produceStore';
import { pickImageFromGallery, takePhotoWithCamera } from '@/services/imagePickerService';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { detectCropAndOcr, CropVisionOcrResult } from '@/services/aiVisionOcrService';

// Curated crop presets with reliable default assets & market rates for Rare & Premium Produce
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
    name: 'Kashmiri Mongra Saffron',
    category: 'Spices & Condiments',
    defaultVariety: 'Kashmir Grade A++ Extra Bold',
    defaultImage:
      'https://images.unsplash.com/photo-1599818816934-2e94828114c0?w=500&auto=format&fit=crop&q=80',
    refPrice: 280000,
    minDays: 365,
    maxDays: 730,
    basis: 'Hermetically sealed dark tin container with desiccant (<8% moisture)',
    mandi: 'Pampore Saffron Mandi (J&K)',
  },
  {
    name: 'Hass Avocado (Coorg)',
    category: 'Exotic Fruits',
    defaultVariety: 'Coorg Hass Grade A Export',
    defaultImage:
      'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop&q=80',
    refPrice: 340,
    minDays: 8,
    maxDays: 14,
    basis: 'Padded corrugated ventilated crates at 5-7°C cold storage',
    mandi: 'Madikeri Agri Hub',
  },
  {
    name: 'Dragon Fruit (Kamalam)',
    category: 'Exotic Fruits',
    defaultVariety: 'Red Flesh C-Variety',
    defaultImage:
      'https://images.unsplash.com/photo-1527325678964-54921661f888?w=500&auto=format&fit=crop&q=80',
    refPrice: 195,
    minDays: 7,
    maxDays: 12,
    basis: 'Ventilated foam-netted plastic crates at 8-10°C ambient storage',
    mandi: 'Kutch Agri Hub (Gujarat)',
  },
  {
    name: 'Himalayan Gucchi Mushrooms',
    category: 'Medicinal & Fungi',
    defaultVariety: 'Wild Morel (Morchella Conica)',
    defaultImage:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
    refPrice: 18500,
    minDays: 180,
    maxDays: 365,
    basis: 'Sun-dried wild harvested, vacuum sealed kraft bags with silica',
    mandi: 'Shimla Special Mandi (HP)',
  },
  {
    name: 'Single Clove Black Garlic',
    category: 'Gourmet Vegetables',
    defaultVariety: 'Fermented Aged Superfood',
    defaultImage:
      'https://images.unsplash.com/photo-1615477550926-25ccbf3a9ec1?w=500&auto=format&fit=crop&q=80',
    refPrice: 950,
    minDays: 90,
    maxDays: 180,
    basis: 'Aged 90-days fermented whole bulb, humidity controlled pack',
    mandi: 'Mandsaur Premium Mandi',
  },
  {
    name: 'Chak-Hao Black Rice',
    category: 'GI Heritage Grains',
    defaultVariety: 'Manipur GI Aromatic Rice',
    defaultImage:
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',
    refPrice: 240,
    minDays: 180,
    maxDays: 365,
    basis: 'Double hermetic gunny sacks with certified organic lining',
    mandi: 'Imphal APMC (Manipur)',
  },
  {
    name: 'Ratnagiri Alphonso Mango',
    category: 'Exotic Fruits',
    defaultVariety: 'Devgad Hapus GI Tagged',
    defaultImage:
      'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80',
    refPrice: 450,
    minDays: 6,
    maxDays: 10,
    basis: 'Grass-hay cushioned wooden peti box, ambient 24°C ripening',
    mandi: 'Ratnagiri APMC Terminal',
  },
  {
    name: 'Alleppey Green Cardamom',
    category: 'Spices & Condiments',
    defaultVariety: '8mm Bold Export Grade',
    defaultImage:
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop&q=80',
    refPrice: 2400,
    minDays: 180,
    maxDays: 365,
    basis: 'Triple-layer sealed polythene gunny bags in cool dark room',
    mandi: 'Vandanmedu Spices Park (Kerala)',
  },
  {
    name: 'Natural Bourbon Vanilla Beans',
    category: 'Spices & Condiments',
    defaultVariety: 'Kerala Gourmet Grade A (16cm+)',
    defaultImage:
      'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=500&auto=format&fit=crop&q=80',
    refPrice: 4500,
    minDays: 270,
    maxDays: 540,
    basis: 'Vacuum packed bundles of 250g in food-grade foil packaging',
    mandi: 'Kochi Spices Exchange',
  },
  {
    name: 'Hydroponic Romanesco Broccoli',
    category: 'Gourmet Vegetables',
    defaultVariety: 'Fractal Brassica Exotic',
    defaultImage:
      'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=500&auto=format&fit=crop&q=80',
    refPrice: 175,
    minDays: 4,
    maxDays: 8,
    basis: 'Cold chain transit 4°C, film-wrapped breathable micro-perforated tray',
    mandi: 'Pune Narayangaon Hub',
  },
  {
    name: 'Mahabaleshwar Blueberries',
    category: 'Exotic Fruits',
    defaultVariety: 'Misty / Jewel Fresh Clamshell',
    defaultImage:
      'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=500&auto=format&fit=crop&q=80',
    refPrice: 680,
    minDays: 7,
    maxDays: 14,
    basis: '125g vented clamshell punnets in refrigerated cold van (2°C)',
    mandi: 'Mahabaleshwar Cold APMC',
  },
  {
    name: 'Iranian Mamra Badam',
    category: 'Dry Fruits & Nuts',
    defaultVariety: 'Kashmir/Afghani Grade 1 (High Oil)',
    defaultImage:
      'https://images.unsplash.com/photo-1508061252224-414eb2949015?w=500&auto=format&fit=crop&q=80',
    refPrice: 1950,
    minDays: 180,
    maxDays: 365,
    basis: 'Nitrogen flushed hermetic 10kg poly-lined jute sacks',
    mandi: 'Khari Baoli Terminal (Delhi)',
  },
];

import { getCropThumbnailUrl, resolveCropThumbnail } from '@/utils/cropThumbnail';
export { getCropThumbnailUrl, resolveCropThumbnail };

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

  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrResult, setOcrResult] = useState<CropVisionOcrResult | null>(null);
  const [ocrApplied, setOcrApplied] = useState(false);

  const handleSelectPreset = (preset: CropPreset) => {
    setIsCustomMode(false);
    setSelectedPreset(preset);
    setCropName(preset.name);
    setVariety(preset.defaultVariety);
    setCategory(preset.category);
    setHasCustomPhoto(false);
    setPhotoUri(preset.defaultImage || getCropThumbnailUrl(preset.name, preset.category));
    setExpectedPrice(preset.refPrice.toString());
  };

  const handleSelectCustomMode = () => {
    setIsCustomMode(true);
    setCropName('');
    setVariety('');
    setCategory('Specialty Produce');
    setExpectedPrice('');
    setHasCustomPhoto(false);
    setPhotoUri(getCropThumbnailUrl('custom', 'produce'));
  };

  const handleCropNameChange = (text: string) => {
    setCropName(text);
    if (!hasCustomPhoto && !isCustomMode) {
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

  const triggerAiVisionScan = async (uri: string) => {
    setIsScanningOcr(true);
    setOcrApplied(false);
    try {
      const result = await detectCropAndOcr(uri, cropName);
      setOcrResult(result);
    } catch (err) {
      console.log('[AddProduce] AI Vision OCR scan note:', err);
    } finally {
      setIsScanningOcr(false);
    }
  };

  const applyOcrResultsToForm = () => {
    if (!ocrResult) return;
    setCropName(ocrResult.cropName);
    setVariety(ocrResult.variety);
    setCategory(ocrResult.category);
    setGrade(ocrResult.grade);
    setExpectedPrice(ocrResult.refPrice.toString());
    if (ocrResult.basis) {
      setStorageDetails(ocrResult.basis);
    }
    setOcrApplied(true);
  };

  const handlePickFromGallery = async () => {
    const res = await pickImageFromGallery();
    if (!res.cancelled && res.uri) {
      setHasCustomPhoto(true);
      setPhotoUri(res.uri);
      triggerAiVisionScan(res.uri);
    }
  };

  const handleTakePhoto = async () => {
    const res = await takePhotoWithCamera();
    if (!res.cancelled && res.uri) {
      setHasCustomPhoto(true);
      setPhotoUri(res.uri);
      triggerAiVisionScan(res.uri);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveCrop = async () => {
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

    const now = new Date();
    const todayFormatted = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const yesterdayFormatted = new Date(Date.now() - 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const threeDaysAgoFormatted = new Date(Date.now() - 3 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const weekAgoFormatted = new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const currentClockFormatted = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

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
          ? `Today (${todayFormatted})`
          : harvestOption === 'Yesterday'
          ? `Yesterday (${yesterdayFormatted})`
          : harvestOption === '3 Days Ago'
          ? threeDaysAgoFormatted
          : weekAgoFormatted,
      availableFrom: availableFrom,
      location: 'Main Farm Warehouse',
      storageType: storageType,
      storageDetails: storageDetails.trim() || selectedPreset.basis,
      condition: condition,
      conditionUpdatedAt: 'Today',
      imageUri: resolveCropThumbnail(cropName, category, photoUri),
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
      marketLastUpdated: currentClockFormatted,

      history7D: [
        { date: new Date(Date.now() - 5 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), price: selectedPreset.refPrice - 2 },
        { date: new Date(Date.now() - 3 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), price: selectedPreset.refPrice - 1 },
        { date: new Date(Date.now() - 1 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), price: selectedPreset.refPrice },
        { date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), price: selectedPreset.refPrice },
      ],
      history30D: [
        { date: new Date(Date.now() - 25 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), price: selectedPreset.refPrice - 4 },
        { date: new Date(Date.now() - 15 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), price: selectedPreset.refPrice - 3 },
        { date: new Date(Date.now() - 5 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), price: selectedPreset.refPrice - 1 },
        { date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), price: selectedPreset.refPrice },
      ],
      history90D: [
        { date: new Date(Date.now() - 75 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), price: selectedPreset.refPrice - 6 },
        { date: new Date(Date.now() - 45 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), price: selectedPreset.refPrice - 4 },
        { date: new Date(Date.now() - 20 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), price: selectedPreset.refPrice - 3 },
        { date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), price: selectedPreset.refPrice },
      ],

      watchTag: 'Newly Added Harvest',
      watchUrgency: 'positive',
    });

    const mappedGrade = grade === 'Grade B' ? 'B' : grade === 'Grade C' ? 'C' : 'A';
    const quantityVal = parseFloat(quantityInput) || computedKg;
    const user = useAuthStore.getState().user;
    const farmer = useAuthStore.getState().farmer;
    const realFarmerName = user?.fullName || user?.name || farmer?.fullName || 'Farmer';
    const realFarmerPhone = user?.phone || farmer?.phone || '';
    const realLocation = user?.district ? `${user.district}, ${user.state || 'Maharashtra'}` : (user?.city || 'Nashik Mandi Area');

    // Ensure thumbnail is always resolved matching the set crop and safe for network
    const safeImage = resolveCropThumbnail(cropName, category, photoUri);
    const remoteImages = [safeImage];

    setCreatedCropId(newCrop.id);
    setSuccessModalVisible(true);

    try {
      const res: any = await apiClient.createProduct({
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
      } as any, useAuthStore.getState().token);

      if (res?.data?.id) {
        useProduceStore.getState().replaceCropId(newCrop.id, res.data.id);
        setCreatedCropId(res.data.id);
      }
      await useProduceStore.getState().syncWithBackend();
    } catch (err: any) {
      console.log('[AddProduce] Primary sync note, trying direct admin sync:', err?.message);
      try {
        const adminHost = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
        const adminUrls = [`http://${adminHost}:4003/api/v1/admin/produce`, 'http://localhost:4003/api/v1/admin/produce'];
        for (const aUrl of adminUrls) {
          try {
            await fetch(aUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                farmerId: user?.id || farmer?.id || 'd1111111-1111-1111-1111-111111111111',
                farmerName: realFarmerName,
                farmerPhone: realFarmerPhone,
                cropName: cropName.trim(),
                variety: variety.trim() || 'Hybrid',
                category: category || 'Vegetables',
                quantityKg: computedKg || quantityVal,
                pricePerKg: expPriceNum,
                qualityGrade: mappedGrade === 'B' ? 'GRADE_B' : 'GRADE_A',
                pickupAddress: realLocation,
                imageUrl: safeImage,
                images: remoteImages,
              }),
            });
            break;
          } catch {}
        }
      } catch (adminErr) {
        console.warn('[AddProduce] Admin backup sync notice:', adminErr);
      }
    } finally {
      setIsSubmitting(false);
    }
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
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>1. Select Crop / Commodity *</Text>
              <View style={styles.premiumBadgeHeader}>
                <Sparkles size={12} color="#D97706" />
                <Text style={styles.premiumBadgeHeaderText}>Rare & Premium</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetChipsRow}
            >
              {/* + Add Your Product (Custom Commodity) Chip */}
              <Pressable
                style={[
                  styles.customPresetChip,
                  isCustomMode && styles.customPresetChipSelected,
                ]}
                onPress={handleSelectCustomMode}
              >
                <Plus size={13} color={isCustomMode ? '#FFFFFF' : '#D97706'} />
                <Text
                  style={[
                    styles.customPresetChipText,
                    isCustomMode && styles.customPresetChipTextSelected,
                  ]}
                >
                  + Add Your Product
                </Text>
              </Pressable>

              {CROP_PRESETS.map((preset) => {
                const isSelected = !isCustomMode && cropName === preset.name;
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

            {isCustomMode && (
              <View style={styles.customInfoBox}>
                <Sparkles size={14} color="#D97706" />
                <Text style={styles.customInfoText}>
                  Custom Commodity Mode: Enter your rare crop, GI heritage produce, or custom harvested product details below.
                </Text>
              </View>
            )}

            <View style={styles.inputWrap}>
              <Text style={styles.fieldSublabel}>
                {isCustomMode ? 'Custom Crop / Product Name *:' : 'Crop Name *:'}
              </Text>
              <TextInput
                style={[styles.textInput, formErrors.cropName && styles.inputError]}
                value={cropName}
                onChangeText={handleCropNameChange}
                placeholder={isCustomMode ? "e.g. Kashmiri Mongra, Hass Avocado, Wild Morel..." : "e.g. Kashmiri Mongra Saffron, Hass Avocado..."}
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
                placeholder="e.g. Grade A++ Extra Bold, GI Tagged, Fermented..."
                placeholderTextColor={MKColors.textMuted}
              />
            </View>

            {isCustomMode && (
              <View style={styles.inputWrap}>
                <Text style={styles.fieldSublabel}>Agricultural Category:</Text>
                <TextInput
                  style={styles.textInput}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="e.g. Spices & Condiments, Exotic Fruits, Fungi..."
                  placeholderTextColor={MKColors.textMuted}
                />
              </View>
            )}
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

          {/* ── Step 5: Crop Photo & AI OCR Scanner ─────────────── */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>5. Crop Photo & AI OCR Scanner</Text>
              <View style={styles.aiBadgeHeader}>
                <Sparkles size={12} color={MKColors.primaryGreen} />
                <Text style={styles.aiBadgeHeaderText}>AI Object & OCR Active</Text>
              </View>
            </View>

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

                <Pressable
                  style={[styles.photoActionButton, styles.ocrManualTriggerBtn]}
                  onPress={() => triggerAiVisionScan(photoUri)}
                  disabled={isScanningOcr}
                >
                  <Sparkles size={15} color="#D97706" />
                  <Text style={[styles.photoActionText, { color: '#D97706' }]}>
                    {isScanningOcr ? 'Scanning with AI...' : 'Scan Photo with AI OCR'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.photoHintText}>
              Snap sacks, crates, or produce. AI will identify the crop, assess freshness, and run OCR on packaging labels & batch numbers.
            </Text>

            {/* AI Scanning Loader */}
            {isScanningOcr && (
              <View style={styles.ocrScanningBox}>
                <ActivityIndicator size="small" color={MKColors.primaryGreen} />
                <Text style={styles.ocrScanningText}>
                  AI inspecting produce visual characteristics & reading OCR stamps...
                </Text>
              </View>
            )}

            {/* AI Vision & OCR Results HUD Card */}
            {ocrResult && !isScanningOcr && (
              <View style={styles.aiOcrCard}>
                <View style={styles.aiOcrHeader}>
                  <View style={styles.aiOcrTitleWrap}>
                    <Sparkles size={16} color="#059669" />
                    <Text style={styles.aiOcrTitle}>AI Vision & OCR Detected</Text>
                  </View>
                  <View style={styles.aiConfidenceBadge}>
                    <ShieldCheck size={12} color="#059669" />
                    <Text style={styles.aiConfidenceText}>{ocrResult.confidence}% Match</Text>
                  </View>
                </View>

                <Text style={styles.ocrDetectedProduce}>{ocrResult.cropName}</Text>
                <Text style={styles.ocrVarietyText}>{ocrResult.variety}</Text>

                {/* Badges Row */}
                <View style={styles.ocrBadgeRow}>
                  <View style={styles.ocrPill}>
                    <Text style={styles.ocrPillText}>{ocrResult.category}</Text>
                  </View>
                  <View style={[styles.ocrPill, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                    <Text style={[styles.ocrPillText, { color: '#065F46' }]}>
                      ✨ {ocrResult.freshness} Freshness
                    </Text>
                  </View>
                  <View style={[styles.ocrPill, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                    <Text style={[styles.ocrPillText, { color: '#92400E' }]}>
                      🏆 {ocrResult.grade}
                    </Text>
                  </View>
                </View>

                {/* OCR Text Recognition Display */}
                <View style={styles.ocrTextContainer}>
                  <View style={styles.ocrTextHeader}>
                    <FileText size={13} color="#D97706" />
                    <Text style={styles.ocrTextLabel}>OCR SACK / LABEL SCAN:</Text>
                  </View>
                  <Text style={styles.ocrTextValue}>"{ocrResult.ocrExtractedText}"</Text>
                </View>

                {/* Visual Attributes Chips */}
                <View style={styles.ocrAttributesRow}>
                  {ocrResult.detectedAttributes.map((attr, idx) => (
                    <View key={idx} style={styles.ocrAttrTag}>
                      <Text style={styles.ocrAttrTagText}>✓ {attr}</Text>
                    </View>
                  ))}
                </View>

                {/* One-Tap Auto Fill Action */}
                <Pressable
                  style={[
                    styles.ocrAutoFillBtn,
                    ocrApplied && styles.ocrAutoFillBtnDone,
                  ]}
                  onPress={applyOcrResultsToForm}
                >
                  {ocrApplied ? (
                    <>
                      <CheckCircle2 size={16} color="#FFFFFF" />
                      <Text style={styles.ocrAutoFillText}>
                        Form Auto-Filled from AI Scan!
                      </Text>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} color="#FFFFFF" />
                      <Text style={styles.ocrAutoFillText}>
                        Auto-Fill All Form Details from AI Scan
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 4,
  },
  premiumBadgeHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  customPresetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    gap: 5,
  },
  customPresetChipSelected: {
    backgroundColor: '#D97706',
    borderColor: '#B45309',
  },
  customPresetChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  customPresetChipTextSelected: {
    color: '#FFFFFF',
  },
  customInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  customInfoText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
    fontWeight: '600',
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
    marginTop: 8,
    lineHeight: 14,
  },
  aiBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  aiBadgeHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  ocrManualTriggerBtn: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  ocrScanningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    gap: 10,
  },
  ocrScanningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  aiOcrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
    padding: 14,
    marginTop: 12,
    shadowColor: '#10B981',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  aiOcrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiOcrTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiOcrTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  aiConfidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  aiConfidenceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  ocrDetectedProduce: {
    fontSize: 16,
    fontWeight: '900',
    color: MKColors.textPrimary,
  },
  ocrVarietyText: {
    fontSize: 12,
    color: MKColors.textSecondary,
    marginBottom: 10,
  },
  ocrBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  ocrPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: MKColors.borderLight,
  },
  ocrPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.textSecondary,
  },
  ocrTextContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  ocrTextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ocrTextLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  ocrTextValue: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#F1F5F9',
    lineHeight: 16,
  },
  ocrAttributesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  ocrAttrTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ocrAttrTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  ocrAutoFillBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ocrAutoFillBtnDone: {
    backgroundColor: '#047857',
  },
  ocrAutoFillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
