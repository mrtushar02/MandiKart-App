/**
 * MandiKart UserApp — Rare & Premium Produce Section
 *
 * Dedicated tab for verified GI-tagged, exotic, hydroponic, and luxury commodities.
 * Users can:
 * 1. Browse and directly order rare & premium produce.
 * 2. In-screen Specific Product Demand: Demand specific exotic fruits & vegetables directly from regional farmers.
 * 3. View real-time retail price estimates, health benefits, and main nutrient profiles.
 * 4. Queue multiple specialty crops in a multi-product demand basket.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/apiClient';

export interface PremiumProduceItem {
  id: string;
  name: string;
  category: 'Exotic Fruits' | 'Gourmet Vegetables' | 'Medicinal & Fungi' | 'Spices & Condiments' | 'GI Heritage Grains' | 'Dry Fruits & Nuts';
  variety: string;
  origin: string;
  imageUrl: string;
  pricePerKg: number;
  priceRange: string;
  packSizeNote?: string;
  minOrderKg: number;
  grade: string;
  tag: string;
  description: string;
  benefits: string;
  nutrients: string;
  growingConditions?: string;
  stockAvailableKg: number;
}

export const RARE_PREMIUM_CATALOG: PremiumProduceItem[] = [
  // ==========================================
  // 1. EXOTIC FRUITS
  // ==========================================
  {
    id: 'prem_fruit_1',
    name: 'Avocado (Butter fruit)',
    category: 'Exotic Fruits',
    variety: 'Hass & Fuerte Butter Fruit Selection',
    origin: 'Coorg (Karnataka) & Kodaikanal (TN)',
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 270,
    priceRange: '₹240–₹300/kg',
    packSizeNote: 'Typical retail estimate (Blinkit & BigBasket)',
    minOrderKg: 5,
    grade: 'Export Grade A',
    tag: '🥑 Monounsaturated Fats',
    description: 'Creamy, rich tree-ripened avocados with thick pebbled skin and high natural heart-healthy oil content.',
    benefits: 'Monounsaturated fats, fibre and potassium support heart health and normal digestion.',
    nutrients: 'Healthy fats, folate, potassium.',
    growingConditions: 'Sub-tropical hill slopes (1000m+ elevation); well-drained aerated red loam soil.',
    stockAvailableKg: 1800,
  },
  {
    id: 'prem_fruit_2',
    name: 'Dragon fruit (Kamalam)',
    category: 'Exotic Fruits',
    variety: 'Red Flesh Pitahaya (C-Variety)',
    origin: 'Kutch (Gujarat) & Sangli (Maharashtra)',
    imageUrl: 'https://images.unsplash.com/photo-1527325678964-54921661f888?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 320,
    priceRange: '₹250–₹500/kg',
    packSizeNote: 'Size and quality affect price; sweet red pulp',
    minOrderKg: 10,
    grade: 'Grade A Export',
    tag: '🌺 Betacyanin & Fibre',
    description: 'Vibrant magenta pulp packed with natural betacyanin antioxidant pigments, tiny crunchy seeds, Brix 14.5%.',
    benefits: 'Fibre supports digestion; vitamin C and antioxidants contribute to normal immune function.',
    nutrients: 'Fibre, vitamin C, plant pigments.',
    growingConditions: 'Semi-arid tropical sunlight with trellis support; drought-hardy cactus family.',
    stockAvailableKg: 3200,
  },
  {
    id: 'prem_fruit_3',
    name: 'Blueberry',
    category: 'Exotic Fruits',
    variety: 'Fresh Biloxi & Jewel Blueberries',
    origin: 'Mahabaleshwar (Maharashtra) & Nilgiris',
    imageUrl: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 1832,
    priceRange: '₹229–₹263 per 125 g (~₹1,832/kg)',
    packSizeNote: 'Recent online retail listing range; cold-chain dispatched',
    minOrderKg: 2,
    grade: 'Gourmet Selection',
    tag: '🫐 Anthocyanin Superfood',
    description: 'Plump chilled berries with pristine silvery bloom, sweet-tart profile and high antioxidant density.',
    benefits: 'Anthocyanin antioxidants support overall cellular health; vitamin C contributes to normal immune function.',
    nutrients: 'Anthocyanins, vitamin C, fibre.',
    growingConditions: 'High chill hours in acidic sandy peat soil (pH 4.5-5.5) under protected poly-tunnels.',
    stockAvailableKg: 650,
  },
  {
    id: 'prem_fruit_4',
    name: 'Kiwi Fruit',
    category: 'Exotic Fruits',
    variety: 'Hayward Green & Golden Kiwi',
    origin: 'Lower Subansiri (Arunachal Pradesh) & Solan (HP)',
    imageUrl: 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 320,
    priceRange: '₹130–₹213 per pack of 2–3 (~₹320/kg)',
    packSizeNote: 'Pack of 2–3 or wholesale 10kg crates',
    minOrderKg: 5,
    grade: 'Grade A',
    tag: '🥝 Immunity & Digestion',
    description: 'Sun-ripened fuzzy kiwi with emerald-green flesh, sweet tang, and natural actinidin enzyme for digestion.',
    benefits: 'Vitamin C supports immune function; fibre helps maintain regular bowel movements.',
    nutrients: 'Vitamin C, fibre, potassium.',
    growingConditions: 'Temperate montane climate with winter dormancy; trellis pergola training systems.',
    stockAvailableKg: 2400,
  },
  {
    id: 'prem_fruit_5',
    name: 'Thai guava',
    category: 'Exotic Fruits',
    variety: 'Crisp Jumbo Seedless Hybrid Guava',
    origin: 'Raipur (Chhattisgarh) & Coastal Andhra Pradesh',
    imageUrl: 'https://images.unsplash.com/photo-1536511135773-421f1c7d2c3e?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 155,
    priceRange: '₹125–₹185/kg equivalent',
    packSizeNote: 'Based on listed 400 g packs & wholesale farm crates',
    minOrderKg: 10,
    grade: 'Export Crisp',
    tag: '🍐 Collagen & Immunity',
    description: 'Extra-large crunchy white-fleshed fruit with very few soft seeds, high pectin, and crisp apple-like bite.',
    benefits: 'Vitamin C supports immunity and collagen formation; fibre supports digestive health.',
    nutrients: 'Vitamin C, fibre, potassium.',
    growingConditions: 'Tropical to sub-tropical sun; bag-protected fruit cultivation to avoid fruit flies.',
    stockAvailableKg: 4200,
  },
  {
    id: 'prem_fruit_6',
    name: 'Passion fruit',
    category: 'Exotic Fruits',
    variety: 'Purple Granadilla & Golden Honey',
    origin: 'Wayanad (Kerala) & East Khasi Hills (Meghalaya)',
    imageUrl: 'https://images.unsplash.com/photo-1589533610925-1cffc309ebaa?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 440,
    priceRange: '₹368–₹510/kg equivalent',
    packSizeNote: 'Based on listed 250 g packs and farm-fresh baskets',
    minOrderKg: 5,
    grade: 'Grade A',
    tag: '🌟 Carotenoids & Fibre',
    description: 'Aromatic wrinkled shell loaded with golden gelatinous pulp, tropical musky scent, and deep tartness.',
    benefits: 'Fibre supports digestion; vitamin C and carotenoids contribute to a balanced diet.',
    nutrients: 'Fibre, vitamin C, carotenoids.',
    growingConditions: 'Humid sub-tropical slopes with high rainfall; vigorous perennial vine climber.',
    stockAvailableKg: 850,
  },
  {
    id: 'prem_fruit_7',
    name: 'Rambutan',
    category: 'Exotic Fruits',
    variety: 'Rongrien Hybrid Red Fruit',
    origin: 'Thrissur & Pathanamthitta (Kerala)',
    imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 220,
    priceRange: '₹150–₹300/kg',
    packSizeNote: 'Indicative specialty-market harvest estimate',
    minOrderKg: 5,
    grade: 'Grade A Fresh',
    tag: '🍒 Hydration & Vitamin C',
    description: 'Hairy crimson rind peeling easily to reveal translucent, juicy, sweet aril resembling tropical lychee.',
    benefits: 'Provides vitamin C and water; contributes to hydration and everyday nutrient intake.',
    nutrients: 'Vitamin C, water, carbohydrates.',
    growingConditions: 'Equatorial humid conditions with 22-30°C temperature and well-distributed irrigation.',
    stockAvailableKg: 1400,
  },
  {
    id: 'prem_fruit_8',
    name: 'Mangosteen',
    category: 'Exotic Fruits',
    variety: 'Queen of Fruits Selection (Mangostan)',
    origin: 'Pollachi & Courtallam (Tamil Nadu)',
    imageUrl: 'https://images.unsplash.com/photo-1596483785566-51922c222629?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 480,
    priceRange: '₹300–₹700/kg',
    packSizeNote: 'Specialty fruit market premium quote',
    minOrderKg: 5,
    grade: 'Royal Selection',
    tag: '👑 Xanthone Antioxidants',
    description: 'Thick violet-purple rind enclosing snow-white citrusy segments with delicate melt-in-mouth sweetness.',
    benefits: 'Supplies fibre and plant compounds; can contribute to a varied fruit intake.',
    nutrients: 'Fibre, vitamin C and xanthones in the fruit rind.',
    growingConditions: 'Slow-growing humid tropical tree needing shade in early years and high soil moisture.',
    stockAvailableKg: 900,
  },
  {
    id: 'prem_fruit_9',
    name: 'Ratnagiri Alphonso Mango',
    category: 'Exotic Fruits',
    variety: 'Devgad Hapus GI Tagged',
    origin: 'Devgad & Ratnagiri (Maharashtra)',
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 450,
    priceRange: '₹400–₹650/kg',
    packSizeNote: 'GI certified naturally grass-ripened crates',
    minOrderKg: 10,
    grade: 'GI Export Grade',
    tag: '🥭 King of Mangoes',
    description: 'Naturally grass-hay ripened Devgad Hapus with saffron pulp, zero fiber, and royal aroma.',
    benefits: 'High beta-carotene, vitamin A and prebiotic fibre supporting eye and gut wellness.',
    nutrients: 'Vitamin A, Vitamin C, potassium, polyphenols.',
    stockAvailableKg: 2800,
  },

  // ==========================================
  // 2. EXOTIC VEGETABLES
  // ==========================================
  {
    id: 'prem_veg_1',
    name: 'Broccoli',
    category: 'Gourmet Vegetables',
    variety: 'Fresh Whole Green Crowns',
    origin: 'Ooty (Tamil Nadu) & Pune Polyhouses',
    imageUrl: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 115,
    priceRange: '₹80–₹150/kg',
    packSizeNote: 'Indicative retail estimate based on fresh farm supplies',
    minOrderKg: 10,
    grade: 'Residue-Free Grade A',
    tag: '🥦 Folate & Vitamin K',
    description: 'Tight, dark blue-green florets with crisp succulent stalks, harvested at daybreak for peak crunch.',
    benefits: 'Fibre supports digestion; vitamin C supports immune function.',
    nutrients: 'Vitamin C, folate, vitamin K.',
    growingConditions: 'Cool weather; commonly grown in winter in suitable Indian regions.',
    stockAvailableKg: 3500,
  },
  {
    id: 'prem_veg_2',
    name: 'Colored bell peppers (Capsicum)',
    category: 'Gourmet Vegetables',
    variety: 'Red, Yellow & Orange Sweet Bell Peppers',
    origin: 'Protected Polyhouses, Nashik & Bengaluru',
    imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 320,
    priceRange: '₹250–₹450/kg',
    packSizeNote: 'Protected cultivation quality-graded crates',
    minOrderKg: 10,
    grade: 'Polyhouse Grade A',
    tag: '🫑 Carotenoid Immunity',
    description: 'Thick-walled, glossy bell capsicums with sweet juicy flesh, high vitamin C and vibrant culinary presentation.',
    benefits: 'Vitamin C supports immunity; carotenoids contribute antioxidant activity.',
    nutrients: 'Vitamin C, carotenoids, fibre.',
    growingConditions: 'Mild temperatures (18-28°C); open-field or protected climate-controlled cultivation.',
    stockAvailableKg: 4200,
  },
  {
    id: 'prem_veg_3',
    name: 'Zucchini (Keesha Green & Gold)',
    category: 'Gourmet Vegetables',
    variety: 'F1 Keesha Italian Summer Squash',
    origin: 'Solan (Himachal) & Pune Outskirts',
    imageUrl: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 240,
    priceRange: '₹180–₹300/kg',
    packSizeNote: 'Tender 6-8 inch handpicked fruits',
    minOrderKg: 10,
    grade: 'Grade A Tender',
    tag: '🥒 Hydration & Fibre',
    description: 'Glossy dark green and golden yellow Italian zucchini with firm white seedless interior and mild nutty flavor.',
    benefits: 'High water content supports hydration; fibre contributes to digestive health.',
    nutrients: 'Water, vitamin C, potassium.',
    growingConditions: 'Mild to warm conditions (20-25°C); fertile loamy soil, avoid waterlogging.',
    stockAvailableKg: 2100,
  },
  {
    id: 'prem_veg_4',
    name: 'Asparagus',
    category: 'Gourmet Vegetables',
    variety: 'Real Raw Tied Tender Green Spears',
    origin: 'Nilgiris (TN) & Bengaluru Highlands',
    imageUrl: 'https://images.unsplash.com/photo-1515471204690-fe15b1b7cb39?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 275,
    priceRange: '₹200–₹350/kg',
    packSizeNote: 'Tied bundles of uniform tender shoots',
    minOrderKg: 5,
    grade: 'Premium Tender Shoot',
    tag: '🌱 Folate & Vitamin K',
    description: 'Straight tender green stalks with tightly closed compact tips, harvested before morning sun to preserve tenderness.',
    benefits: 'Folate supports normal cell function; fibre supports digestion.',
    nutrients: 'Folate, vitamin K, fibre.',
    growingConditions: 'Requires suitable soil and careful management; established beds take 2-3 years to become productive.',
    stockAvailableKg: 750,
  },
  {
    id: 'prem_veg_5',
    name: 'Lettuce (Iceberg & Romaine)',
    category: 'Gourmet Vegetables',
    variety: 'Crisp Iceberg, Romaine & Lollo Rosso',
    origin: 'Hydroponic Greenhouses, Pune & Ooty',
    imageUrl: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 165,
    priceRange: '₹80–₹250/kg',
    packSizeNote: 'Cooler weather field & hydroponic heads',
    minOrderKg: 10,
    grade: 'Hydroponic Clean',
    tag: '🥗 Hydroponic Crisp',
    description: 'Residue-free crisp heads grown in nutrient film technique (NFT) systems with zero pesticides and spotless leaves.',
    benefits: 'Provides water and some folate and vitamin K; useful in salads and light cooking.',
    nutrients: 'Water, folate, vitamin K.',
    growingConditions: 'Generally prefers cooler weather (15-20°C); hydroponic NFT production is highly viable.',
    stockAvailableKg: 2800,
  },
  {
    id: 'prem_veg_6',
    name: 'Cherry tomato',
    category: 'Gourmet Vegetables',
    variety: 'Truss Vine Sweet Sun Gold',
    origin: 'Polyhouses, Sangli & Kolar',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 185,
    priceRange: '₹120–₹250/kg',
    packSizeNote: 'Vine-ripened clusters and 500g punnets',
    minOrderKg: 10,
    grade: 'Polyhouse Vine-Ripened',
    tag: '🍅 Lycopene & Vitamin C',
    description: 'Bite-sized bright red and golden cherry tomatoes bursting with sweet concentrated juice and thin skin, Brix 9+.',
    benefits: 'Lycopene and vitamin C contribute antioxidant activity and normal immune function.',
    nutrients: 'Lycopene, vitamin C, potassium.',
    growingConditions: 'Warm conditions with ample sunlight, precision drip irrigation and good disease management.',
    stockAvailableKg: 3100,
  },
  {
    id: 'prem_veg_7',
    name: 'Pak choi (Bok choy)',
    category: 'Gourmet Vegetables',
    variety: 'Baby Green Asian Bok Choy',
    origin: 'Indoor Precision Farms, Pune & Bengaluru',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 160,
    priceRange: '₹120–₹200/kg',
    packSizeNote: 'Short-cycle crisp baby bunches',
    minOrderKg: 5,
    grade: 'Exotic Hydroponic',
    tag: '🥬 Vitamins C & K',
    description: 'Tender spoon-shaped emerald leaves with crunchy porcelain-white stems, ideal for Asian stir-fries and broth.',
    benefits: 'Provides vitamins C and K, folate and dietary fibre for balanced nutrition.',
    nutrients: 'Vitamin C, vitamin K, folate.',
    growingConditions: 'Cool-season leafy crop; suitable for short 35-45 day production cycles in shaded polyhouses.',
    stockAvailableKg: 1400,
  },
  {
    id: 'prem_veg_8',
    name: 'Baby corn',
    category: 'Gourmet Vegetables',
    variety: 'Golden Sweet Hybrid Tender Ears',
    origin: 'Pune & Belgaum Irrigated Farms',
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 185,
    priceRange: '₹150–₹220/kg',
    packSizeNote: 'Freshly de-husked golden spears',
    minOrderKg: 10,
    grade: 'Tender Grade A',
    tag: '🌽 Fibre & B-Vitamins',
    description: 'Hand-harvested unfertilized tender ears with crunchy sweet texture, high fiber, and uniform sizing.',
    benefits: 'Provides fibre and carbohydrates; useful in stir-fries and mixed vegetable dishes.',
    nutrients: 'Fibre, carbohydrates, some B vitamins.',
    growingConditions: 'Warm weather with good soil fertility; provides relatively quick harvests (50-60 days).',
    stockAvailableKg: 4800,
  },
  {
    id: 'prem_veg_9',
    name: 'Kale (Curly & Tuscan)',
    category: 'Gourmet Vegetables',
    variety: 'Dark Green Curly Superfood Kale',
    origin: 'Ooty Highlands & Kullu Valley (HP)',
    imageUrl: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6fa57?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 300,
    priceRange: '₹200–₹400/kg',
    packSizeNote: 'Cooler mountain climate leafy harvest',
    minOrderKg: 5,
    grade: 'Organic Superfood',
    tag: '🌿 Bone & Immune Support',
    description: 'Ruffled crinkly dark blue-green leaves packed with cellular antioxidants, lutein, and bone-fortifying vitamin K.',
    benefits: 'Vitamins K and C contribute to normal bone and immune function.',
    nutrients: 'Vitamin K, vitamin C, carotenoids.',
    growingConditions: 'Cooler conditions generally favour leafy growth and enhance sweet flavor after mild frost.',
    stockAvailableKg: 1100,
  },
  {
    id: 'prem_veg_10',
    name: 'Hydroponic Romanesco Broccoli',
    category: 'Gourmet Vegetables',
    variety: 'Precision Fractal Romanesco',
    origin: 'Pune & Ooty Greenhouses',
    imageUrl: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 175,
    priceRange: '₹140–₹220/kg',
    packSizeNote: 'Logarithmic fractal floret heads',
    minOrderKg: 10,
    grade: 'Residue-Free',
    tag: '🥦 Precision Hydroponic',
    description: 'Striking logarithmic spiral florets, nutty crunch, residue-free pesticide clean.',
    benefits: 'Rich in sulforaphane, carotenoids, and zinc supporting metabolic resilience.',
    nutrients: 'Sulforaphane, vitamin C, fiber, zinc.',
    stockAvailableKg: 1500,
  },
  {
    id: 'prem_veg_11',
    name: 'Single Clove Black Garlic',
    category: 'Gourmet Vegetables',
    variety: 'Fermented Aged Superfood',
    origin: 'Mandsaur (Madhya Pradesh)',
    imageUrl: 'https://images.unsplash.com/photo-1615477550926-25ccbf3a9ec1?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 950,
    priceRange: '₹850–₹1200/kg',
    packSizeNote: '90-days thermal enzymatic fermentation',
    minOrderKg: 5,
    grade: 'Grade A Gourmet',
    tag: '🧄 S-Allyl-Cysteine',
    description: 'Aged through controlled temperature fermentation; jet-black jelly cloves with sweet balsamic fig notes.',
    benefits: 'S-allyl-cysteine provides high antioxidant bioavailability and cardiovascular support.',
    nutrients: 'S-allyl-cysteine, polyphenols, amino acids.',
    stockAvailableKg: 650,
  },

  // ==========================================
  // 3. MEDICINAL & FUNGI
  // ==========================================
  {
    id: 'prem_fungi_1',
    name: 'Shiitake mushroom',
    category: 'Medicinal & Fungi',
    variety: 'Whole Fresh & Sun-Dried Shiitake',
    origin: 'Solan & Dehradun Indoor Climate Chambers',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 650,
    priceRange: '₹400–₹900/kg',
    packSizeNote: 'Controlled humidity & specialist hygiene substrate',
    minOrderKg: 2,
    grade: 'Gourmet Umami Grade A',
    tag: '🍄 B-Vitamins & Vitamin D',
    description: 'Umami-packed meaty brown caps with cracked white patterns, rich in beta-glucans, lentinan, and ergosterol.',
    benefits: 'Provides fibre, B vitamins and other nutrients; provides vitamin D when appropriately grown or treated.',
    nutrients: 'B vitamins, fibre, minerals.',
    growingConditions: 'Controlled humidity (85-90%) and temperature (16-22°C); hardwood sawdust substrate.',
    stockAvailableKg: 450,
  },
  {
    id: 'prem_fungi_2',
    name: 'Himalayan Gucchi Mushrooms',
    category: 'Medicinal & Fungi',
    variety: 'Wild Morel (Morchella Conica)',
    origin: 'Shimla & Kullu Valleys (Himachal Pradesh)',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 18500,
    priceRange: '₹16,000–₹22,000/kg',
    packSizeNote: 'Sun-dried wild harvested mountain morels',
    minOrderKg: 1,
    grade: 'Wild Forest Grade A',
    tag: '🍄 Wild Mountain Morel',
    description: 'Sun-dried wild harvested honeycomb morels with earthy woodsy umami aroma and high mineral density.',
    benefits: 'Wild antioxidants, copper, iron and immune-modulating polysaccharides.',
    nutrients: 'Polysaccharides, copper, iron, vitamin D.',
    stockAvailableKg: 85,
  },

  // ==========================================
  // 4. SPICES & HERITAGE
  // ==========================================
  {
    id: 'prem_spice_1',
    name: 'Kashmiri Mongra Saffron',
    category: 'Spices & Condiments',
    variety: 'Kashmir Grade A++ Extra Bold',
    origin: 'Pampore, Kashmir (GI Tagged)',
    imageUrl: 'https://images.unsplash.com/photo-1599818816934-2e94828114c0?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 280000,
    priceRange: '₹2,60,000–₹3,10,000/kg',
    packSizeNote: 'Pure stigma sealed glass vials (1g to 1kg)',
    minOrderKg: 0.1,
    grade: 'Grade A++ (GI Tagged)',
    tag: '👑 World Renowned GI',
    description: '100% pure certified Kashmiri Mongra stigmas with high crocin content, safranal and intense royal aroma.',
    benefits: 'Potent mood enhancer, powerful antioxidant, supports memory and cellular rejuvenation.',
    nutrients: 'Crocin, picrocrocin, safranal, riboflavin.',
    stockAvailableKg: 25,
  },
  {
    id: 'prem_spice_2',
    name: 'Natural Bourbon Vanilla Beans',
    category: 'Spices & Condiments',
    variety: 'Cured Gourmet Pods (16cm+)',
    origin: 'Wayanad (Kerala)',
    imageUrl: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 4500,
    priceRange: '₹4,000–₹5,500/kg',
    packSizeNote: 'Oily supple pods vacuum sealed',
    minOrderKg: 1,
    grade: 'Gourmet Grade A',
    tag: '✨ Natural Vanillin',
    description: 'Supple oily black vanilla pods with pure crystalline vanillin fragrance, cured for 6 months.',
    benefits: 'Natural aromatic calmant, antioxidant and premium baking super-extract.',
    nutrients: 'Natural vanillin, vanillic acid, mineral traces.',
    stockAvailableKg: 120,
  },
  {
    id: 'prem_grain_1',
    name: 'Chak-Hao Black Rice',
    category: 'GI Heritage Grains',
    variety: 'Manipur GI Scented Black Rice',
    origin: 'Imphal Valley (Manipur)',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 240,
    priceRange: '₹220–₹280/kg',
    packSizeNote: 'Heirloom whole grain packaging',
    minOrderKg: 10,
    grade: 'GI Tagged Heritage',
    tag: '🌾 Anthocyanin Heirloom',
    description: 'Deep purple-black kernel loaded with anthocyanin, pleasant nutty floral scent, and low glycemic index.',
    benefits: 'Anti-inflammatory anthocyanins, dietary fibre, and sustained low-GI energy.',
    nutrients: 'Anthocyanins, iron, dietary fibre, amino acids.',
    stockAvailableKg: 4200,
  },
];

export default function RarePremiumScreen({ navigation }: any) {
  const { addToCart } = useCart();
  const { activeSavedAddress, currentAddress } = useLocation();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [realtimeClock, setRealtimeClock] = useState<string>('');
  const [realtimeDate, setRealtimeDate] = useState<string>('');

  // Specific Product Demand Modal State
  const [demandModalVisible, setDemandModalVisible] = useState<boolean>(false);
  const [demandingItem, setDemandingItem] = useState<PremiumProduceItem | null>(null);
  const [demandQuantity, setDemandQuantity] = useState<string>('10');
  const [demandUnit, setDemandUnit] = useState<'kg' | 'quintal'>('kg');
  const [demandTargetPrice, setDemandTargetPrice] = useState<string>('250');
  const [demandDeliveryLocation, setDemandDeliveryLocation] = useState<string>('');
  const [demandRequiredDate, setDemandRequiredDate] = useState<string>('');
  const [demandNotes, setDemandNotes] = useState<string>('');
  const [submittingDemand, setSubmittingDemand] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setRealtimeClock(
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
      setRealtimeDate(
        now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const categories = [
    'All',
    'Exotic Fruits',
    'Gourmet Vegetables',
    'Medicinal & Fungi',
    'Spices & Condiments',
    'GI Heritage Grains',
  ];

  const filteredItems = selectedCategory === 'All'
    ? RARE_PREMIUM_CATALOG
    : RARE_PREMIUM_CATALOG.filter((i) => i.category === selectedCategory);

  const handleAddToCart = (item: PremiumProduceItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      variety: item.variety,
      grade: item.grade,
      category: item.category,
      price: item.pricePerKg,
      unit: 'kg',
      image: item.imageUrl,
      farmerId: 'fpo_rare_premium_01',
      farmerName: `${item.origin.split('(')[0].split(',')[0]} Grower Collective`,
      availableQuantity: item.stockAvailableKg,
      minOrderQuantity: item.minOrderKg,
    } as any, item.minOrderKg);

    Alert.alert(
      'Added to Cart! 💎',
      `${item.minOrderKg} kg of ${item.name} added to your procurement cart.`,
      [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ]
    );
  };

  // Open focused Specific Product Demand Modal (No redirection!)
  const handleOpenDemandModal = (item?: PremiumProduceItem) => {
    const targetItem = item || RARE_PREMIUM_CATALOG[0];
    setDemandingItem(targetItem);
    setDemandQuantity(String(targetItem.minOrderKg || 10));
    setDemandUnit('kg');
    setDemandTargetPrice(String(targetItem.pricePerKg));
    setDemandDeliveryLocation(
      activeSavedAddress?.formattedAddress ||
      currentAddress?.formattedAddress ||
      'Pune APMC Terminal Hub, Maharashtra'
    );
    const dateObj = new Date(Date.now() + 3 * 86400000);
    setDemandRequiredDate(dateObj.toISOString().split('T')[0]);
    setDemandNotes(`Looking for fresh ${targetItem.grade || 'Grade A'} quality. Verified benchmark target price.`);
    setDemandModalVisible(true);
  };

  // Submit Specific Product Demand directly to Regional Farmers
  const handleSubmitSpecificDemand = async () => {
    if (!demandingItem) return;

    const qtyNum = parseFloat(demandQuantity);
    const priceNum = parseFloat(demandTargetPrice);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid required quantity.');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter your target proposed price.');
      return;
    }

    try {
      setSubmittingDemand(true);
      const totalBudget = Math.round(qtyNum * priceNum);

      const created = await apiClient.bulk.createRequirement({
        cropName: demandingItem.name,
        variety: demandingItem.variety,
        grade: 'A',
        requiredQuantity: qtyNum,
        quantityUnit: demandUnit,
        maxTargetPricePerUnit: priceNum,
        deliveryLocation: demandDeliveryLocation || 'Pune APMC Terminal Hub',
        requiredByDate: demandRequiredDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        buyerName: user?.fullName || 'Verified Buyer',
        buyerPhone: user?.phone || '+91 98765 43210',
      });

      setDemandModalVisible(false);

      const msg = `Demand Dispatched to Farmers! 🌾\n\nProduct: ${demandingItem.name}\nQuantity: ${qtyNum} ${demandUnit}\nYour Target Price: ₹${priceNum}/${demandUnit}\nTotal Deal Value: ₹${totalBudget.toLocaleString('en-IN')}\n\nRegional growers and FPOs in ${demandingItem.origin} have received your demand broadcast.`;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Demand Broadcast Active 🌾', msg, [
          { text: 'Great, Stay Here', style: 'cancel' },
          {
            text: 'Track in Orders',
            onPress: () => (navigation as any).navigate('MainTabs', { screen: 'Orders' }),
          },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Submission Error', err?.message || 'Could not post demand. Please retry.');
    } finally {
      setSubmittingDemand(false);
    }
  };

  // Quick quantity increment/decrement
  const adjustQuantity = (delta: number) => {
    const cur = parseFloat(demandQuantity) || 10;
    const next = Math.max(1, cur + delta);
    setDemandQuantity(String(next));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.diamondWrap}>
            <Ionicons name="diamond" size={20} color="#D97706" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>Rare & Premium</Text>
              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTagText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.headerSub}>Exotic Fruits, Gourmet Greens & GI Heritage</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.demandHeaderBtn}
          onPress={() => handleOpenDemandModal()}
        >
          <Ionicons name="git-pull-request" size={15} color="#FFFFFF" />
          <Text style={styles.demandHeaderBtnText}>Demand</Text>
        </TouchableOpacity>
      </View>

      {/* Realtime Live Date & Time Ticker Banner */}
      <View style={styles.realtimeTicker}>
        <Ionicons name="time-outline" size={14} color="#047857" />
        <Text style={styles.realtimeDateText}>{realtimeDate || 'Live APMC Feed'}</Text>
        <Text style={styles.realtimeClockText}>• {realtimeClock}</Text>
        <View style={styles.apmcSyncedPill}>
          <Text style={styles.apmcSyncedText}>✓ Retail Verified</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Demand Feature Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={13} color="#D97706" />
              <Text style={styles.heroBadgeText}>Direct Farmer & FPO Procurement</Text>
            </View>
            <Text style={styles.heroTitle}>Demand Rare & Exotic Produce Directly from Growers</Text>
            <Text style={styles.heroDesc}>
              Tap "Demand" on any fruit or vegetable below to propose your custom price and volume. Farmers supply directly from the farmgate.
            </Text>

            <TouchableOpacity
              style={styles.heroCtaBtn}
              onPress={() => handleOpenDemandModal()}
            >
              <Ionicons name="add-circle" size={16} color="#FFFFFF" />
              <Text style={styles.heroCtaBtnText}>Post a Specific Produce Demand</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Products Grid */}
        <View style={styles.produceGrid}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.produceCard}>
              <View style={styles.cardImageContainer}>
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                <View style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>{item.tag}</Text>
                </View>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeBadgeText}>{item.grade}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardOrigin}>📍 {item.origin}</Text>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardVariety} numberOfLines={1}>{item.variety}</Text>

                {/* Price Range Pill */}
                <View style={styles.priceRangePill}>
                  <Text style={styles.priceRangeLabel}>INDICATIVE RETAIL:</Text>
                  <Text style={styles.priceRangeVal}>{item.priceRange}</Text>
                </View>

                {/* Health Benefits & Nutrients Card */}
                <View style={styles.healthCard}>
                  <View style={styles.healthRow}>
                    <Text style={styles.healthEmoji}>🩺</Text>
                    <Text style={styles.healthBenefitsText} numberOfLines={2}>
                      <Text style={styles.healthHeading}>Benefits: </Text>
                      {item.benefits}
                    </Text>
                  </View>
                  <View style={[styles.healthRow, { marginTop: 4 }]}>
                    <Text style={styles.healthEmoji}>🧪</Text>
                    <Text style={styles.healthNutrientsText} numberOfLines={1}>
                      <Text style={styles.healthHeading}>Nutrients: </Text>
                      {item.nutrients}
                    </Text>
                  </View>
                  {item.growingConditions ? (
                    <View style={[styles.healthRow, { marginTop: 4 }]}>
                      <Text style={styles.healthEmoji}>🌱</Text>
                      <Text style={styles.healthGrowingText} numberOfLines={1}>
                        <Text style={styles.healthHeading}>Season: </Text>
                        {item.growingConditions}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Price and Stock */}
                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.priceLabel}>Verified Benchmark Rate</Text>
                    <Text style={styles.priceVal}>
                      ₹{item.pricePerKg.toLocaleString('en-IN')}<Text style={styles.priceUnit}>/kg</Text>
                    </Text>
                  </View>
                  <View style={styles.stockBox}>
                    <Text style={styles.stockLabel}>Stock Ready</Text>
                    <Text style={styles.stockVal}>{item.stockAvailableKg} kg</Text>
                  </View>
                </View>

                {/* Action Buttons: Order & Specific Product Demand */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.cardOrderBtn}
                    onPress={() => handleAddToCart(item)}
                  >
                    <Ionicons name="cart" size={15} color="#FFFFFF" />
                    <Text style={styles.cardOrderBtnText}>Order ({item.minOrderKg}kg+)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cardDemandBtn}
                    onPress={() => handleOpenDemandModal(item)}
                  >
                    <Ionicons name="git-pull-request" size={15} color="#D97706" />
                    <Text style={styles.cardDemandBtnText}>Demand</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Need an Unlisted Crop Footer Card */}
        <View style={styles.customDemandCard}>
          <Ionicons name="leaf" size={28} color="#059669" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.customDemandTitle}>Need an Unlisted Rare Crop or Exotic Variety?</Text>
            <Text style={styles.customDemandDesc}>
              Broadcast custom specifications for heirloom seeds, organic micro-batches, or rare mountain botanicals. Regional farmer collectives will respond.
            </Text>
            <TouchableOpacity
              style={styles.customDemandBtn}
              onPress={() => handleOpenDemandModal()}
            >
              <Text style={styles.customDemandBtnText}>+ Demand Specific Crop</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ========================================================================= */}
      {/* IN-SCREEN SPECIFIC PRODUCT DEMAND MODAL                                    */}
      {/* ========================================================================= */}
      <Modal
        visible={demandModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDemandModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.modalBadgeRow}>
                  <Ionicons name="git-pull-request" size={14} color="#D97706" />
                  <Text style={styles.modalBadgeText}>DIRECT FARMER DEMAND</Text>
                </View>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  Demand {demandingItem?.name}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Propose your target price & volume directly to verified growers
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setDemandModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {demandingItem && (
                <>
                  {/* Product Mini Preview Card */}
                  <View style={styles.previewProduceCard}>
                    <Image source={{ uri: demandingItem.imageUrl }} style={styles.previewImage} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.previewTitle}>{demandingItem.name}</Text>
                      <Text style={styles.previewVariety}>{demandingItem.variety}</Text>
                      <Text style={styles.previewOrigin}>📍 {demandingItem.origin}</Text>
                      <View style={styles.previewRateBadge}>
                        <Text style={styles.previewRateText}>
                          Benchmark: ₹{demandingItem.pricePerKg}/kg • Range: {demandingItem.priceRange}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Health Benefits & Nutrients Accordion Card */}
                  <View style={styles.modalHealthCard}>
                    <Text style={styles.modalHealthTitle}>🩺 Nutritional & Health Benefits</Text>
                    <Text style={styles.modalHealthBody}>{demandingItem.benefits}</Text>

                    <View style={styles.modalNutrientRow}>
                      <Text style={styles.modalNutrientLabel}>🧪 Key Nutrients:</Text>
                      <Text style={styles.modalNutrientValue}>{demandingItem.nutrients}</Text>
                    </View>

                    {demandingItem.growingConditions ? (
                      <View style={styles.modalNutrientRow}>
                        <Text style={styles.modalNutrientLabel}>🌱 Growing Season:</Text>
                        <Text style={styles.modalNutrientValue}>{demandingItem.growingConditions}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Demand Input Fields */}
                  <View style={styles.formSection}>
                    <Text style={styles.formSectionTitle}>1. Required Volume</Text>
                    <View style={styles.qtyControlRow}>
                      <TouchableOpacity style={styles.qtyStepBtn} onPress={() => adjustQuantity(-5)}>
                        <Text style={styles.qtyStepBtnText}>-5</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.qtyInput}
                        keyboardType="numeric"
                        value={demandQuantity}
                        onChangeText={setDemandQuantity}
                        placeholder="Quantity"
                      />
                      <TouchableOpacity style={styles.qtyStepBtn} onPress={() => adjustQuantity(5)}>
                        <Text style={styles.qtyStepBtnText}>+5</Text>
                      </TouchableOpacity>

                      {/* Unit Picker */}
                      <View style={styles.unitToggleGroup}>
                        <TouchableOpacity
                          style={[styles.unitBtn, demandUnit === 'kg' && styles.unitBtnActive]}
                          onPress={() => setDemandUnit('kg')}
                        >
                          <Text style={[styles.unitBtnText, demandUnit === 'kg' && styles.unitBtnTextActive]}>
                            kg
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.unitBtn, demandUnit === 'quintal' && styles.unitBtnActive]}
                          onPress={() => setDemandUnit('quintal')}
                        >
                          <Text style={[styles.unitBtnText, demandUnit === 'quintal' && styles.unitBtnTextActive]}>
                            qtl
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Quick Quantity Chips */}
                    <View style={styles.chipsRow}>
                      {['10', '25', '50', '100', '250', '500'].map((q) => (
                        <TouchableOpacity
                          key={q}
                          style={[styles.quickChip, demandQuantity === q && styles.quickChipActive]}
                          onPress={() => setDemandQuantity(q)}
                        >
                          <Text style={[styles.quickChipText, demandQuantity === q && styles.quickChipTextActive]}>
                            {q} {demandUnit}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Target Proposed Price */}
                    <Text style={[styles.formSectionTitle, { marginTop: 16 }]}>
                      2. Your Target Proposed Price (₹ per {demandUnit})
                    </Text>
                    <View style={styles.priceInputWrap}>
                      <Text style={styles.rupeePrefix}>₹</Text>
                      <TextInput
                        style={styles.priceInput}
                        keyboardType="numeric"
                        value={demandTargetPrice}
                        onChangeText={setDemandTargetPrice}
                        placeholder={`e.g. ${demandingItem.pricePerKg}`}
                      />
                      <Text style={styles.unitSuffix}>/ {demandUnit}</Text>
                    </View>
                    <Text style={styles.benchmarkHint}>
                      Retail Benchmark: ₹{demandingItem.pricePerKg}/{demandUnit} ({demandingItem.priceRange})
                    </Text>

                    {/* Total Budget Banner */}
                    <View style={styles.totalBudgetBanner}>
                      <View>
                        <Text style={styles.totalBudgetLabel}>Estimated Total Demand Value</Text>
                        <Text style={styles.totalBudgetValue}>
                          ₹{(
                            (parseFloat(demandQuantity) || 0) * (parseFloat(demandTargetPrice) || 0)
                          ).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.escrowSafePill}>
                        <Ionicons name="shield-checkmark" size={14} color="#047857" />
                        <Text style={styles.escrowSafeText}>Direct Farmgate</Text>
                      </View>
                    </View>

                    {/* Delivery Location */}
                    <Text style={[styles.formSectionTitle, { marginTop: 16 }]}>
                      3. Delivery Destination APMC / Warehouse
                    </Text>
                    <View style={styles.locationInputRow}>
                      <Ionicons name="location-sharp" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                      <TextInput
                        style={styles.locationInput}
                        value={demandDeliveryLocation}
                        onChangeText={setDemandDeliveryLocation}
                        placeholder="Enter delivery hub or warehouse address"
                      />
                    </View>

                    {/* Required Date */}
                    <Text style={[styles.formSectionTitle, { marginTop: 14 }]}>
                      4. Required By Date
                    </Text>
                    <TextInput
                      style={styles.dateInput}
                      value={demandRequiredDate}
                      onChangeText={setDemandRequiredDate}
                      placeholder="YYYY-MM-DD"
                    />

                    {/* Special Notes */}
                    <Text style={[styles.formSectionTitle, { marginTop: 14 }]}>
                      5. Quality Specifications / Notes to Grower
                    </Text>
                    <TextInput
                      style={styles.notesInput}
                      multiline
                      numberOfLines={2}
                      value={demandNotes}
                      onChangeText={setDemandNotes}
                      placeholder="e.g. Export grade A, uniform sizing, cold-chain temperature preservation"
                    />
                  </View>
                </>
              )}
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.submitDemandBtn}
                onPress={handleSubmitSpecificDemand}
                disabled={submittingDemand}
              >
                {submittingDemand ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.submitDemandBtnText}>
                      Post Demand for {demandingItem?.name.split(' ')[0]} (₹
                      {(
                        (parseFloat(demandQuantity) || 0) * (parseFloat(demandTargetPrice) || 0)
                      ).toLocaleString('en-IN')}
                      )
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  diamondWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  demandHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  demandHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Realtime Live Ticker
  realtimeTicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: Spacing.base,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
    gap: 6,
  },
  realtimeDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  realtimeClockText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
  },
  apmcSyncedPill: {
    marginLeft: 'auto',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  apmcSyncedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // Hero Banner
  heroBanner: {
    margin: Spacing.base,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  heroContent: {
    padding: 16,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FDE68A',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 17,
    marginBottom: 14,
  },
  heroCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
  },
  heroCtaBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Categories
  categoryScroll: {
    paddingHorizontal: Spacing.base,
    gap: 8,
    paddingBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Products Grid
  produceGrid: {
    paddingHorizontal: Spacing.base,
    gap: 16,
  },
  produceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImageContainer: {
    height: 180,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tagBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gradeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 14,
  },
  cardOrigin: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardVariety: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 6,
  },

  // Price Range Pill
  priceRangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  priceRangeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.4,
  },
  priceRangeVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },

  // Health Card
  healthCard: {
    backgroundColor: '#F0FDF4',
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 10,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  healthEmoji: {
    fontSize: 12,
    marginTop: 1,
  },
  healthHeading: {
    fontWeight: '700',
    color: '#166534',
  },
  healthBenefitsText: {
    flex: 1,
    fontSize: 11,
    color: '#1E293B',
    lineHeight: 15,
  },
  healthNutrientsText: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    lineHeight: 15,
  },
  healthGrowingText: {
    flex: 1,
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  priceVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  stockBox: {
    alignItems: 'flex-end',
  },
  stockLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  stockVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },

  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardOrderBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  cardOrderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardDemandBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  cardDemandBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },

  // Custom Demand Footer
  customDemandCard: {
    flexDirection: 'row',
    margin: Spacing.base,
    padding: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    alignItems: 'center',
  },
  customDemandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  customDemandDesc: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    marginTop: 3,
    marginBottom: 10,
  },
  customDemandBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#15803D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  customDemandBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ==========================================
  // MODAL STYLES
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.base,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  modalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
  },

  previewProduceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#E2E8F0',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  previewVariety: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  previewOrigin: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  previewRateBadge: {
    marginTop: 4,
  },
  previewRateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },

  modalHealthCard: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  modalHealthTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 4,
  },
  modalHealthBody: {
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 17,
    marginBottom: 8,
  },
  modalNutrientRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  modalNutrientLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  modalNutrientValue: {
    fontSize: 11,
    color: '#334155',
  },

  formSection: {
    marginBottom: 20,
  },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  qtyStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  qtyStepBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  qtyInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  unitToggleGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#F8FAFC',
  },
  unitBtnActive: {
    backgroundColor: '#059669',
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  unitBtnTextActive: {
    color: '#FFFFFF',
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickChipActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  quickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  rupeePrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  unitSuffix: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  benchmarkHint: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
  },

  totalBudgetBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: BorderRadius.md,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  totalBudgetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  totalBudgetValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#92400E',
    marginTop: 1,
  },
  escrowSafePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  escrowSafeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },

  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
  },
  locationInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
  },
  dateInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0F172A',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
    textAlignVertical: 'top',
  },

  modalActionsRow: {
    paddingHorizontal: Spacing.base,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitDemandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  submitDemandBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
