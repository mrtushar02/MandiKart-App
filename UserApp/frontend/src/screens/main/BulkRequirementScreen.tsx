import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import { apiClient } from '../../services/apiClient';
import { useLocation } from '../../context/LocationContext';

import { useAuth } from '../../context/AuthContext';

interface CommodityOption {
  name: string;
  category: string;
  variety: string;
  imageUrl: string;
  refPricePerKg: number;
  tag?: string;
  isCustom?: boolean;
}

const PREMIUM_COMMODITIES: CommodityOption[] = [
  {
    name: 'Avocado (Butter fruit)',
    category: 'Fruits',
    variety: 'Hass & Fuerte Butter Fruit',
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400',
    refPricePerKg: 270,
    tag: '🥑 Healthy Fats & Potassium',
  },
  {
    name: 'Dragon fruit (Kamalam)',
    category: 'Fruits',
    variety: 'Red Flesh Pitahaya (C-Variety)',
    imageUrl: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=400',
    refPricePerKg: 320,
    tag: '🌺 Betacyanin & Fibre',
  },
  {
    name: 'Blueberry',
    category: 'Fruits',
    variety: 'Fresh Biloxi & Jewel',
    imageUrl: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400',
    refPricePerKg: 1832,
    tag: '🫐 Anthocyanin Superfood',
  },
  {
    name: 'Kiwi Fruit',
    category: 'Fruits',
    variety: 'Hayward Green & Golden Kiwi',
    imageUrl: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=400',
    refPricePerKg: 320,
    tag: '🥝 Vitamin C & Fibre',
  },
  {
    name: 'Thai guava',
    category: 'Fruits',
    variety: 'Jumbo Crisp Seedless',
    imageUrl: 'https://images.unsplash.com/photo-1536511135773-421f1c7d2c3e?w=400',
    refPricePerKg: 155,
    tag: '🍐 Collagen & Immunity',
  },
  {
    name: 'Passion fruit',
    category: 'Fruits',
    variety: 'Purple Granadilla & Golden Honey',
    imageUrl: 'https://images.unsplash.com/photo-1589533610925-1cffc309ebaa?w=400',
    refPricePerKg: 440,
    tag: '🌟 Carotenoids & Fibre',
  },
  {
    name: 'Rambutan',
    category: 'Fruits',
    variety: 'Rongrien Hybrid Red',
    imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400',
    refPricePerKg: 220,
    tag: '🍒 Tropical Hydration',
  },
  {
    name: 'Mangosteen',
    category: 'Fruits',
    variety: 'Queen of Fruits Selection',
    imageUrl: 'https://images.unsplash.com/photo-1596483785566-51922c222629?w=400',
    refPricePerKg: 480,
    tag: '👑 Xanthone Antioxidants',
  },
  {
    name: 'Broccoli',
    category: 'Vegetables',
    variety: 'Fresh Whole Green Crowns',
    imageUrl: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400',
    refPricePerKg: 115,
    tag: '🥦 Folate & Vitamin K',
  },
  {
    name: 'Colored bell peppers (Capsicum)',
    category: 'Vegetables',
    variety: 'Red, Yellow & Orange Bell Peppers',
    imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400',
    refPricePerKg: 320,
    tag: '🫑 Carotenoid Immunity',
  },
  {
    name: 'Zucchini',
    category: 'Vegetables',
    variety: 'F1 Keesha Italian Squash',
    imageUrl: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400',
    refPricePerKg: 240,
    tag: '🥒 Hydration & Fibre',
  },
  {
    name: 'Asparagus',
    category: 'Vegetables',
    variety: 'Tender Raw Green Spears',
    imageUrl: 'https://images.unsplash.com/photo-1515471204690-fe15b1b7cb39?w=400',
    refPricePerKg: 275,
    tag: '🌱 Folate & Vitamin K',
  },
  {
    name: 'Lettuce (Iceberg & Romaine)',
    category: 'Vegetables',
    variety: 'Hydroponic Iceberg & Romaine',
    imageUrl: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400',
    refPricePerKg: 165,
    tag: '🥗 Hydroponic Crisp',
  },
  {
    name: 'Cherry tomato',
    category: 'Vegetables',
    variety: 'Truss Vine Sweet Sun Gold',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
    refPricePerKg: 185,
    tag: '🍅 Lycopene & Vitamin C',
  },
  {
    name: 'Pak choi (Bok choy)',
    category: 'Vegetables',
    variety: 'Baby Asian Bok Choy',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
    refPricePerKg: 160,
    tag: '🥬 Vitamins C & K',
  },
  {
    name: 'Baby corn',
    category: 'Vegetables',
    variety: 'Golden Hybrid Tender Ears',
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400',
    refPricePerKg: 185,
    tag: '🌽 Fibre & B-Vitamins',
  },
  {
    name: 'Kale',
    category: 'Vegetables',
    variety: 'Dark Green Curly Kale',
    imageUrl: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6fa57?w=400',
    refPricePerKg: 300,
    tag: '🌿 Bone & Immune Support',
  },
  {
    name: 'Shiitake mushroom',
    category: 'Exotic Vegetables',
    variety: 'Whole Fresh & Dried Umami Shiitake',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    refPricePerKg: 650,
    tag: '🍄 B-Vitamins & Vitamin D',
  },
  {
    name: 'Kashmiri Mongra Saffron',
    category: 'Spices',
    variety: 'Mongra / Lachha GI',
    imageUrl: 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?w=400',
    refPricePerKg: 280000,
    tag: '👑 Ultra Rare GI',
  },
  {
    name: 'Himalayan Gucchi Mushrooms',
    category: 'Exotic Vegetables',
    variety: 'Wild Morel (Morchella)',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400',
    refPricePerKg: 18500,
    tag: '🍄 Wild Rare Delicacy',
  },
  {
    name: 'Single Clove Black Garlic',
    category: 'Exotic Vegetables',
    variety: 'Aged Fermented Himalayan',
    imageUrl: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400',
    refPricePerKg: 950,
    tag: '🧄 Gourmet Aged',
  },
  {
    name: 'Chak-Hao Black Rice',
    category: 'Grains',
    variety: 'Manipur GI Scented Black Rice',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
    refPricePerKg: 240,
    tag: '🌾 Heirloom GI Rice',
  },
  {
    name: 'Ratnagiri Alphonso Mango',
    category: 'Fruits',
    variety: 'Devgad Hapus Export Grade',
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400',
    refPricePerKg: 450,
    tag: '🥭 King of Mangoes',
  },
  {
    name: 'Alleppey Green Cardamom',
    category: 'Spices',
    variety: '8mm Bold Green Extra Super',
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
    refPricePerKg: 2400,
    tag: '🌿 Queen of Spices',
  },
  {
    name: 'Natural Bourbon Vanilla Beans',
    category: 'Spices',
    variety: 'Cured Gourmet Pods',
    imageUrl: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400',
    refPricePerKg: 4500,
    tag: '✨ Rare Aromatic',
  },
  {
    name: 'Hydroponic Romanesco Broccoli',
    category: 'Vegetables',
    variety: 'Precision Fractal Romanesco',
    imageUrl: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400',
    refPricePerKg: 175,
    tag: '🥦 Precision Hydroponic',
  },
  {
    name: 'Iranian Mamra Badam',
    category: 'Dry Fruits',
    variety: '100% Pure Mamra Almonds',
    imageUrl: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400',
    refPricePerKg: 1950,
    tag: '🌰 Luxury Dry Fruit',
  },
];

const GRADES: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];
const UNITS: Array<'quintal' | 'tonne' | 'kg'> = ['quintal', 'tonne', 'kg'];

export interface DemandedBasketItem {
  id: string;
  cropName: string;
  variety?: string;
  category?: string;
  grade: 'A' | 'B' | 'C';
  quantity: number;
  unit: 'quintal' | 'tonne' | 'kg';
  targetPrice: number;
  imageUrl?: string;
  isCustom?: boolean;
}

export default function BulkRequirementScreen({ route, navigation }: any) {
  const { fetchCurrentLocation, currentAddress } = useLocation();
  const { user } = useAuth();

  const preselectedCrop = route?.params?.preselectedCrop;
  const preselectedPrice = route?.params?.preselectedPrice;

  // Real-time dynamic dates
  const now = new Date();
  const todayFormatted = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const defaultDeliveryDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

  const [selectedCrop, setSelectedCrop] = useState<string>(preselectedCrop || 'Kashmiri Mongra Saffron');
  const [isCustomCrop, setIsCustomCrop] = useState<boolean>(false);
  const [customCropName, setCustomCropName] = useState<string>('');
  const [customVariety, setCustomVariety] = useState<string>('');
  const [grade, setGrade] = useState<'A' | 'B' | 'C'>('A');
  const [quantity, setQuantity] = useState('10');
  const [unit, setUnit] = useState<'quintal' | 'tonne' | 'kg'>('kg');
  const [maxPrice, setMaxPrice] = useState(preselectedPrice || '280000');
  const [deliveryLocation, setDeliveryLocation] = useState('Mumbai Vashi APMC Terminal Hub');
  const [requiredDate, setRequiredDate] = useState(defaultDeliveryDate);
  const [loading, setLoading] = useState(false);

  // Multi-Product Demanding Basket
  const [basket, setBasket] = useState<DemandedBasketItem[]>([]);

  // Synchronize route params if arriving with a specific selected product
  useEffect(() => {
    if (preselectedCrop) {
      setSelectedCrop(preselectedCrop);
      setIsCustomCrop(false);
      if (preselectedPrice) {
        setMaxPrice(String(preselectedPrice));
      }
    }
  }, [preselectedCrop, preselectedPrice]);

  const activeCommodity = PREMIUM_COMMODITIES.find((c) => c.name === selectedCrop);

  const handleSelectCommodity = (item: CommodityOption) => {
    setIsCustomCrop(false);
    setSelectedCrop(item.name);
    if (item.refPricePerKg >= 5000) {
      setUnit('kg');
      setMaxPrice(item.refPricePerKg.toString());
      setQuantity('10');
    } else {
      setUnit('kg');
      setMaxPrice(item.refPricePerKg.toString());
    }
  };

  const handleSelectCustom = () => {
    setIsCustomCrop(true);
    setSelectedCrop('Custom Commodity');
    setMaxPrice('500');
  };

  const effectiveCropName = isCustomCrop
    ? customCropName.trim() || 'Custom Specialty Crop'
    : selectedCrop;

  const parsedQty = Number(quantity) || 1;
  const parsedPrice = Number(maxPrice) || 1;
  const currentItemBudget = parsedQty * parsedPrice;

  // Add currently configured item to the multi-product demand basket
  const handleAddToBasket = () => {
    if (isCustomCrop && !customCropName.trim()) {
      Alert.alert('Crop Name Required', 'Please enter your custom commodity name first.');
      return;
    }
    if (!quantity || parsedQty <= 0) {
      Alert.alert('Quantity Required', 'Please enter a valid requested quantity.');
      return;
    }
    if (!maxPrice || parsedPrice <= 0) {
      Alert.alert('Target Price Required', 'Please enter your maximum target price.');
      return;
    }

    const newItem: DemandedBasketItem = {
      id: `basket_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cropName: effectiveCropName,
      variety: isCustomCrop ? customVariety.trim() || 'Custom Heritage' : activeCommodity?.variety,
      category: activeCommodity?.category || (isCustomCrop ? 'Custom Specialty' : 'Exotic Produce'),
      grade,
      quantity: parsedQty,
      unit,
      targetPrice: parsedPrice,
      imageUrl: activeCommodity?.imageUrl,
      isCustom: isCustomCrop,
    };

    setBasket((prev) => [...prev, newItem]);

    Alert.alert(
      'Added to Demand Basket! 🧺',
      `"${effectiveCropName}" (${parsedQty} ${unit}) added. You can add more products or submit your multi-product demand now.`
    );

    // Reset to default next choice
    if (isCustomCrop) {
      setCustomCropName('');
      setCustomVariety('');
      setIsCustomCrop(false);
    }
  };

  const handleRemoveFromBasket = (id: string) => {
    setBasket((prev) => prev.filter((item) => item.id !== id));
  };

  // Compute total basket metrics
  const totalBasketItemsCount = basket.length;
  const totalBasketBudget = basket.reduce((acc, item) => acc + item.quantity * item.targetPrice, 0);

  const handleSubmit = async () => {
    // If basket is empty and user hasn't added current item, use current item
    const finalItems = basket.length > 0 ? basket : [
      {
        id: `basket_${Date.now()}`,
        cropName: effectiveCropName,
        variety: isCustomCrop ? customVariety.trim() || 'Custom Farm Special' : activeCommodity?.variety,
        category: activeCommodity?.category || 'Specialty Produce',
        grade,
        quantity: parsedQty,
        unit,
        targetPrice: parsedPrice,
        imageUrl: activeCommodity?.imageUrl,
        isCustom: isCustomCrop,
      },
    ];

    if (finalItems.length === 1 && finalItems[0].isCustom && !finalItems[0].cropName.trim()) {
      Alert.alert('Crop Name Required', 'Please type the name of your custom product/commodity.');
      return;
    }

    setLoading(true);
    try {
      const primaryItem = finalItems[0];
      const res = await apiClient.bulk.createRequirement({
        cropName: finalItems.length === 1 ? primaryItem.cropName : `${primaryItem.cropName} + ${finalItems.length - 1} more items`,
        variety: primaryItem.variety,
        items: finalItems,
        grade: primaryItem.grade,
        requiredQuantity: finalItems.reduce((acc, i) => acc + i.quantity, 0),
        quantityUnit: primaryItem.unit,
        maxTargetPricePerUnit: Math.round(finalItems.reduce((acc, i) => acc + (i.quantity * i.targetPrice), 0) / (finalItems.reduce((acc, i) => acc + i.quantity, 0) || 1)),
        deliveryLocation,
        requiredByDate: requiredDate,
        buyerName: user?.fullName || 'Verified Premium Procurement Buyer',
        buyerPhone: user?.phone || '+91 98765 43210',
      });

      setLoading(false);
      navigation.navigate('BulkMatchDiscovery', {
        requirementId: res.id,
        requirement: res,
      });
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Could not post bulk requirement.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Post Bulk Requirement</Text>
          <Text style={styles.headerSub}>Rare & Premium Commercial Sourcing</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro banner */}
        <View style={styles.heroBanner}>
          <Ionicons name="diamond" size={26} color="#B45309" />
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Rare & Premium Commodity Sourcing</Text>
            <Text style={styles.heroDesc}>
              Procure certified high-value crops (Kashmiri Saffron, Black Garlic, Gucchi Mushrooms, Hass Avocados) direct from authenticated growers & FPOs.
            </Text>
          </View>
        </View>

        {/* 1. Crop Selection */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle}>1. Select Commodity</Text>
            <View style={styles.premiumPill}>
              <Text style={styles.premiumPillText}>💎 Rare & Premium</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cropList}>
            {/* Custom Product Add Button */}
            <TouchableOpacity
              style={[styles.cropChip, isCustomCrop && styles.cropChipActive, { borderColor: isCustomCrop ? Colors.primary : '#F59E0B', backgroundColor: isCustomCrop ? '#ECFDF5' : '#FFFBEB' }]}
              onPress={handleSelectCustom}
            >
              <View style={[styles.cropChipImage, { backgroundColor: '#FDE68A', alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="add-circle" size={22} color="#B45309" />
              </View>
              <View>
                <Text style={[styles.cropChipText, isCustomCrop && styles.cropChipTextActive, { color: isCustomCrop ? Colors.primary : '#B45309', fontWeight: '800' }]}>
                  + Add Your Product
                </Text>
                <Text style={{ fontSize: 9, color: '#D97706', fontWeight: '600' }}>Custom Commodity</Text>
              </View>
            </TouchableOpacity>

            {PREMIUM_COMMODITIES.map((c) => {
              const isSelected = !isCustomCrop && selectedCrop === c.name;
              return (
                <TouchableOpacity
                  key={c.name}
                  style={[styles.cropChip, isSelected && styles.cropChipActive]}
                  onPress={() => handleSelectCommodity(c)}
                >
                  <Image source={{ uri: c.imageUrl }} style={styles.cropChipImage} />
                  <View style={{ flex: 1, paddingRight: 4 }}>
                    <Text style={[styles.cropChipText, isSelected && styles.cropChipTextActive]} numberOfLines={1}>{c.name}</Text>
                    {c.tag && (
                      <Text style={{ fontSize: 9, color: isSelected ? Colors.primary : Colors.textSecondary, fontWeight: '700' }} numberOfLines={1}>
                        {c.tag}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Custom Product Input Card (if custom chosen) */}
          {isCustomCrop && (
            <View style={styles.customCropBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="create" size={16} color={Colors.primary} />
                <Text style={styles.customCropTitle}>Custom Commodity Specification</Text>
              </View>
              <Text style={styles.label}>Commodity Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: Colors.white, marginBottom: 10 }]}
                value={customCropName}
                onChangeText={setCustomCropName}
                placeholder="e.g. Macadamia Nuts, Wild Morel Mushrooms, Saffron Honey..."
                placeholderTextColor={Colors.textDisabled}
              />
              <Text style={styles.label}>Variety / Origin / Grade Note (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: Colors.white }]}
                value={customVariety}
                onChangeText={setCustomVariety}
                placeholder="e.g. GI Certified, Cold-Pressed, Organic Single Origin..."
                placeholderTextColor={Colors.textDisabled}
              />
            </View>
          )}

          {/* Quality Grade */}
          <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>Quality Grade</Text>
          <View style={styles.gradeRow}>
            {GRADES.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.gradeBtn, grade === g && styles.gradeBtnActive]}
                onPress={() => setGrade(g)}
              >
                <Text style={[styles.gradeTitle, grade === g && styles.gradeTitleActive]}>Grade {g}</Text>
                <Text style={styles.gradeSub}>
                  {g === 'A' ? 'Export / A-Grade Premium' : g === 'B' ? 'Commercial Gourmet' : 'Processing / Extraction'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Volume & Target Price */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Quantity & Budget</Text>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Total Quantity</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="25"
              />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.unitToggleRow}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, unit === u && styles.unitChipActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={{ marginTop: Spacing.sm }}>
            <Text style={styles.label}>Max Target Price per {unit} (₹)</Text>
            <View style={styles.priceInputWrap}>
              <Text style={styles.rupeeSign}>₹</Text>
              <TextInput
                style={styles.priceInput}
                keyboardType="numeric"
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="2400"
              />
              <Text style={styles.unitSuffix}>/{unit}</Text>
            </View>
          </View>

          {/* APMC Benchmark Note */}
          <View style={styles.benchmarkBox}>
            <Ionicons name="trending-up" size={16} color="#0369A1" />
            <Text style={styles.benchmarkText}>
              Today's APMC Mandi benchmark for {effectiveCropName}: ₹2,320 – ₹2,550 / {unit}
            </Text>
          </View>

          {/* Current Item Total */}
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>This Product's Budget:</Text>
            <Text style={styles.budgetValue}>₹{currentItemBudget.toLocaleString('en-IN')}</Text>
          </View>

          {/* Add to Basket Action */}
          <TouchableOpacity style={styles.addToBasketBtn} onPress={handleAddToBasket}>
            <Ionicons name="add-circle" size={18} color="#065F46" />
            <Text style={styles.addToBasketBtnText}>
              + Add "{effectiveCropName}" to Demanded Products Basket
            </Text>
          </TouchableOpacity>
        </View>

        {/* Multi-Product Demanded Basket Overview */}
        {basket.length > 0 && (
          <View style={[styles.card, styles.basketCard]}>
            <View style={styles.basketHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="basket" size={20} color="#047857" />
                <Text style={styles.basketTitle}>Demanded Products Basket ({basket.length})</Text>
              </View>
              <View style={styles.multiTag}>
                <Text style={styles.multiTagText}>Multi-Product</Text>
              </View>
            </View>
            <Text style={styles.basketSub}>
              Farmers will receive this list, check off the commodities they have available, and quote counter-prices.
            </Text>

            <View style={styles.basketList}>
              {basket.map((item, index) => (
                <View key={item.id} style={styles.basketItemRow}>
                  <View style={styles.basketItemBadge}>
                    <Text style={styles.basketItemIndex}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.basketItemName}>{item.cropName}</Text>
                    <Text style={styles.basketItemMeta}>
                      {item.variety || 'Standard'} • Grade {item.grade} • {item.quantity} {item.unit} @ ₹{item.targetPrice}/{item.unit}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                    <Text style={styles.basketItemTotal}>₹{(item.quantity * item.targetPrice).toLocaleString('en-IN')}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.basketItemRemove}
                    onPress={() => handleRemoveFromBasket(item.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.basketFooter}>
              <Text style={styles.basketFooterLabel}>Total Combined Demand Budget:</Text>
              <Text style={styles.basketFooterTotal}>₹{totalBasketBudget.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        )}

        {/* 3. Delivery Logistics & Realtime Dates */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Delivery Logistics & Realtime Schedule</Text>

          {/* Realtime clock banner */}
          <View style={styles.realtimeDateBanner}>
            <Ionicons name="calendar-outline" size={15} color="#059669" />
            <Text style={styles.realtimeDateBannerText}>
              Today: <Text style={{ fontWeight: '700' }}>{todayFormatted}</Text> (Realtime Active)
            </Text>
          </View>

          <View style={styles.labelRow}>
            <Text style={styles.label}>Destination Depot / Mandi Terminal Hub</Text>
            <TouchableOpacity
              style={styles.autoLocateBtn}
              onPress={async () => {
                const loc = await fetchCurrentLocation(true);
                if (loc && currentAddress) {
                  setDeliveryLocation(currentAddress.formattedAddress);
                  Alert.alert('Depot Location Updated 📍', `Set to: ${currentAddress.formattedAddress}`);
                }
              }}
            >
              <Ionicons name="locate" size={13} color={Colors.primary} />
              <Text style={styles.autoLocateText}>My GPS</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={deliveryLocation}
            onChangeText={setDeliveryLocation}
            placeholder="e.g. Mumbai Vashi APMC Terminal Hub"
          />

          <Text style={[styles.label, { marginTop: Spacing.sm }]}>Expected Delivery By Date (Select Quick Date or Edit)</Text>
          <View style={styles.dateChipsRow}>
            {[
              { label: 'Today', days: 0 },
              { label: 'In 2 Days', days: 2 },
              { label: 'In 5 Days', days: 5 },
              { label: 'In 1 Week', days: 7 },
            ].map((d) => {
              const target = new Date(Date.now() + d.days * 86400000).toISOString().split('T')[0];
              const isSelected = requiredDate === target;
              return (
                <TouchableOpacity
                  key={d.label}
                  style={[styles.dateChip, isSelected && styles.dateChipActive]}
                  onPress={() => setRequiredDate(target)}
                >
                  <Text style={[styles.dateChipText, isSelected && styles.dateChipTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            style={[styles.input, { marginTop: 6 }]}
            value={requiredDate}
            onChangeText={setRequiredDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </ScrollView>

      {/* Footer Submit CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <View style={styles.btnContent}>
              <Ionicons name="sparkles" size={18} color={Colors.white} />
              <Text style={styles.submitBtnText}>
                {basket.length > 0
                  ? `Post Multi-Demand (${basket.length} Items • ₹${totalBasketBudget.toLocaleString('en-IN')})`
                  : `Post Demand for ${effectiveCropName} • ₹${currentItemBudget.toLocaleString('en-IN')}`}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 11, color: Colors.textSecondary },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 100 },
  heroBanner: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: Spacing.md,
    alignItems: 'center',
  },
  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 14, fontWeight: '700', color: '#1E40AF' },
  heroDesc: { fontSize: 12, color: '#3B82F6', marginTop: 2, lineHeight: 17 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  cropList: { gap: Spacing.xs, paddingVertical: 4 },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  cropChipImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.gray200,
  },
  cropChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  cropChipText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  cropChipTextActive: { color: Colors.primary, fontWeight: '700' },
  gradeRow: { flexDirection: 'row', gap: Spacing.sm },
  gradeBtn: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.gray50,
  },
  gradeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  gradeTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  gradeTitleActive: { color: Colors.primary },
  gradeSub: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  row: { flexDirection: 'row', gap: Spacing.md },
  halfCol: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  autoLocateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  autoLocateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray50,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  unitToggleRow: { flexDirection: 'row', height: 44, gap: 4 },
  unitChip: {
    flex: 1,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unitChipText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  unitChipTextActive: { color: Colors.white },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray50,
    paddingHorizontal: 12,
  },
  rupeeSign: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginRight: 4 },
  priceInput: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  unitSuffix: { fontSize: 12, color: Colors.textDisabled },
  benchmarkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  benchmarkText: { fontSize: 11, color: '#0369A1', flex: 1 },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    marginTop: Spacing.md,
  },
  budgetLabel: { fontSize: 13, color: Colors.textSecondary },
  budgetValue: { fontSize: 16, fontWeight: '800', color: '#15803D' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.md,
  },
  submitBtn: {
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  premiumPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  premiumPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  customCropBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customCropTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addToBasketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  addToBasketBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  basketCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
  },
  basketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  basketTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },
  multiTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  multiTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  basketSub: {
    fontSize: 11,
    color: '#15803D',
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  basketList: {
    gap: 8,
    marginVertical: 4,
  },
  basketItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  basketItemBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  basketItemIndex: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
  },
  basketItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  basketItemMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  basketItemTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  basketItemRemove: {
    padding: 4,
  },
  basketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    paddingTop: 10,
    marginTop: 10,
  },
  basketFooterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  basketFooterTotal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#15803D',
  },
  realtimeDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: Spacing.sm,
  },
  realtimeDateBannerText: {
    fontSize: 11,
    color: '#065F46',
  },
  dateChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 6,
  },
  dateChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dateChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

