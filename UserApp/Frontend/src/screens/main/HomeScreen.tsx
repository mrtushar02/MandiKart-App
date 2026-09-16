import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Pressable, FlatList, StatusBar, Image, Dimensions, Alert,
  Modal, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import SearchBar from '../../components/SearchBar';
import ProductCard from '../../components/ProductCard';
import MarqueeTicker from '../../components/MarqueeTicker';
import { SAMPLE_PRODUCTS, SAMPLE_CATEGORIES } from '../../services/mockData';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useLanguage, LANGUAGE_OPTIONS, SupportedLanguage } from '../../context/LanguageContext';
import { useCatalog } from '../../context/CatalogContext';
import { useCart } from '../../context/CartContext';
import FloatingCartBanner from '../../components/FloatingCartBanner';
import InteractiveMapView from '../../components/InteractiveMapView';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const POPULAR_MANDI_HUBS = [
  {
    id: 'pune',
    name: 'Pune APMC Hub',
    badge: 'Fast Dispatch',
    area: 'Shivajinagar',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411005',
    formattedAddress: 'Flat 402, Shivajinagar, FC Road, Pune, Maharashtra - 411005',
    coords: { latitude: 18.5204, longitude: 73.8567 },
  },
  {
    id: 'bbsr',
    name: 'Bhubaneswar Mandi Hub',
    badge: 'Odisha APMC',
    area: 'Aiginia Mandi',
    city: 'Bhubaneswar',
    state: 'Odisha',
    pincode: '751019',
    formattedAddress: 'Aiginia Mandi, Khandagiri, Bhubaneswar, Odisha - 751019',
    coords: { latitude: 20.2603, longitude: 85.7891 },
  },
  {
    id: 'mumbai',
    name: 'Navi Mumbai Vashi APMC',
    badge: 'Bulk Terminal',
    area: 'Vashi APMC',
    city: 'Navi Mumbai',
    state: 'Maharashtra',
    pincode: '400703',
    formattedAddress: 'Sector 19, Vashi APMC, Navi Mumbai, Maharashtra - 400703',
    coords: { latitude: 19.0760, longitude: 72.9995 },
  },
  {
    id: 'nashik',
    name: 'Nashik Onion & Tomato Belt',
    badge: 'Farm Direct',
    area: 'Panchavati Mandi',
    city: 'Nashik',
    state: 'Maharashtra',
    pincode: '422003',
    formattedAddress: 'Dindori Road, APMC Mandi, Nashik, Maharashtra - 422003',
    coords: { latitude: 19.9975, longitude: 73.7898 },
  },
  {
    id: 'delhi',
    name: 'Delhi Azadpur Mandi',
    badge: 'North Terminal',
    area: 'Azadpur Mandi',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110033',
    formattedAddress: 'Azadpur Mandi, GT Karnal Road, New Delhi, Delhi - 110033',
    coords: { latitude: 28.7041, longitude: 77.1725 },
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru Yeshwanthpur',
    badge: 'South Terminal',
    area: 'Yeshwanthpur APMC',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560022',
    formattedAddress: 'Yeshwanthpur APMC Yard, Tumkur Road, Bengaluru, Karnataka - 560022',
    coords: { latitude: 13.0238, longitude: 77.5529 },
  },
];

const BANNERS = [
  { id: '1', bg: '#E8F5E9', title: 'Fresh Vegetables', subtitle: 'Up to 20% off today', imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', categoryId: 'cat-1', categoryName: 'Vegetables' },
  { id: '2', bg: '#FFF3E0', title: 'Summer Fruits', subtitle: 'Mangoes & more in season', imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400', categoryId: 'cat-2', categoryName: 'Fruits' },
  { id: '3', bg: '#E3F2FD', title: 'Organic Range', subtitle: 'Certified pesticide-free', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', categoryId: 'cat-1', categoryName: 'Organic Produce' },
];

const BANNER_WIDTH = Dimensions.get('window').width - 32;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { buyerMode, toggleBuyerMode, user } = useAuth();
  const {
    currentAddress,
    currentLocation,
    fetchCurrentLocation,
    isLoadingLocation,
    setManualLocation,
    savedAddresses,
    selectedAddressId,
    selectSavedAddress,
  } = useLocation();
  const { t, currentLanguageOption, setLanguage } = useLanguage();
  const { products, refresh: refreshCatalog } = useCatalog();
  const { addToCart } = useCart();
  const [searchText, setSearchText] = useState('');
  const [wishlisted, setWishlisted] = useState<string[]>([]);
  const [isRefreshingProducts, setIsRefreshingProducts] = useState<boolean>(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState<boolean>(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState<boolean>(false);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const bannerScrollRef = useRef<FlatList>(null);
  const bannerIndex = useRef(0);

  const fetchLiveProducts = async () => {
    try {
      setIsRefreshingProducts(true);
      await refreshCatalog();
    } catch (err) {
      console.log('[HomeScreen] Live catalog fetch notice, keeping cached:', err);
    } finally {
      setIsRefreshingProducts(false);
    }
  };

  useEffect(() => {
    fetchLiveProducts();
  }, []);

  const handleLocationPress = () => {
    setLocationNotice(null);
    setIsLocationModalVisible(true);
  };

  const handleSelectSavedAddress = (id: string) => {
    selectSavedAddress(id);
    setIsLocationModalVisible(false);
  };

  const handleAutoDetectGPS = async () => {
    setIsDetectingGps(true);
    setLocationNotice(null);
    try {
      const loc = await fetchCurrentLocation(true);
      if (loc) {
        setLocationNotice('Live GPS coordinates locked and delivery hub updated!');
        setTimeout(() => {
          setIsLocationModalVisible(false);
          setLocationNotice(null);
        }, 1200);
      } else {
        setLocationNotice('Location set to default Mandi hub.');
      }
    } catch {
      setLocationNotice('Unable to acquire satellite GPS. Default hub selected.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleSelectHub = (hub: typeof POPULAR_MANDI_HUBS[0]) => {
    setManualLocation(hub.coords, {
      formattedAddress: hub.formattedAddress,
      street: hub.area,
      area: hub.area,
      city: hub.city,
      state: hub.state,
      pincode: hub.pincode,
      country: 'India',
    });
    setIsLocationModalVisible(false);
  };

  const handleBannerPress = (catId: string, catName: string) => {
    navigation.navigate('ProductStack', {
      screen: 'ProductListing',
      params: { categoryId: catId, categoryName: catName },
    });
  };

  // Auto-scroll banners every 3s
  useEffect(() => {
    const timer = setInterval(() => {
      bannerIndex.current = (bannerIndex.current + 1) % BANNERS.length;
      bannerScrollRef.current?.scrollToOffset({
        offset: bannerIndex.current * (BANNER_WIDTH + 12),
        animated: true,
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const toggleWishlist = (id: string) => {
    setWishlisted((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingProducts}
            onRefresh={fetchLiveProducts}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {/* Profile Avatar - left */}
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => navigation.navigate('Main', { screen: 'Profile' } as any)}
            >
              <View style={styles.avatar}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'A'}</Text>
                )}
              </View>
              <View style={styles.onlineDot} />
            </TouchableOpacity>

            {/* Location */}
            <View style={styles.locationWrap}>
              <Text style={styles.locationLabel}>{t('deliveryLocation', 'Deliver to')}</Text>
              <TouchableOpacity
                style={styles.locationRow}
                onPress={handleLocationPress}
              >
                <Ionicons name="location" size={14} color={Colors.primary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {currentAddress?.area ? `${currentAddress.area}, ${currentAddress.city}` : 'Pune, Maharashtra'}
                </Text>
                <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Right icons */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
                <View style={styles.notifDot} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('ChatStack', { screen: 'ChatList' })}
              >
                <Ionicons name="chatbubble-outline" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Mode Switcher Pill (Retail vs Bulk) */}
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[styles.modeTab, buyerMode === 'RETAIL' && styles.modeTabActive]}
              onPress={() => buyerMode !== 'RETAIL' && toggleBuyerMode()}
            >
              <Ionicons
                name="basket-outline"
                size={15}
                color={buyerMode === 'RETAIL' ? Colors.white : Colors.textSecondary}
              />
              <Text style={[styles.modeTabText, buyerMode === 'RETAIL' && styles.modeTabTextActive]}>
                {t('consumerMode', 'Household / Retail')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, buyerMode === 'BULK' && styles.modeTabActive]}
              onPress={() => buyerMode !== 'BULK' && toggleBuyerMode()}
            >
              <Ionicons
                name="business-outline"
                size={15}
                color={buyerMode === 'BULK' ? Colors.white : Colors.textSecondary}
              />
              <Text style={[styles.modeTabText, buyerMode === 'BULK' && styles.modeTabTextActive]}>
                {t('bulkMode', 'Hotel & Bulk Buyer')}
              </Text>
            </TouchableOpacity>
          </View>

          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t('searchPlaceholder', 'Search fresh vegetables, fruits & grains...')}
            onFocus={() => navigation.navigate('ProductStack', { screen: 'Search' })}
            style={styles.searchBar}
          />
        </View>

        {/* Bulk Procurement Hero Card (Only in Bulk Mode) */}
        {buyerMode === 'BULK' && (
          <View style={styles.bulkHeroBox}>
            <View style={styles.bulkHeroTop}>
              <View style={styles.bulkTag}>
                <Ionicons name="sparkles" size={13} color="#15803D" />
                <Text style={styles.bulkTagText}>WHOLESALE MANDI DESK</Text>
              </View>
              <Text style={styles.bulkHeroTitle}>Direct FPO Procurement</Text>
              <Text style={styles.bulkHeroSub}>
                Procure commercial truckloads with volume price discounts, multi-farmer aggregation, and AI matching.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.postRequirementBtn}
              onPress={() => navigation.navigate('BulkRequirement' as any)}
            >
              <Ionicons name="add-circle" size={18} color={Colors.white} />
              <Text style={styles.postRequirementBtnText}>Post Commercial Requirement</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Marquee ticker */}
        <MarqueeTicker
          items={(products && products.length > 0 ? products : SAMPLE_PRODUCTS).map((p) => ({
            name: p.name,
            price: `₹${p.price}/${p.unit}`,
            imageUrl: p.imageUrl,
          }))}
          speed={50}
        />

        {/* Banner Carousel — FlatList handles horizontal scroll + tap correctly */}
        <FlatList
          ref={bannerScrollRef}
          data={BANNERS}
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.bannerList}
          snapToInterval={BANNER_WIDTH + 12}
          snapToAlignment="start"
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            bannerIndex.current = Math.round(
              e.nativeEvent.contentOffset.x / (BANNER_WIDTH + 12)
            );
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.banner, { backgroundColor: item.bg }]}
              activeOpacity={0.85}
              onPress={() => handleBannerPress(item.categoryId, item.categoryName)}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>{item.title}</Text>
                <Text style={styles.bannerSub}>{item.subtitle}</Text>
                <View style={styles.bannerBtn}>
                  <Text style={styles.bannerBtnText}>Shop Now →</Text>
                </View>
              </View>
              <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} />
            </TouchableOpacity>
          )}
        />

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('categories', 'Categories')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProductStack', { screen: 'AllCategories' })}>
              <Text style={styles.seeAll}>{t('viewAll', 'See All')}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={SAMPLE_CATEGORIES.slice(0, 6)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(c) => c.id}
            contentContainerStyle={styles.catList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.catItem}
                onPress={() => navigation.navigate('ProductStack', {
                  screen: 'ProductListing',
                  params: { categoryId: item.id, categoryName: item.name },
                })}
              >
                <View style={styles.catIcon}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.categoryImage} />
                  ) : (
                    <Text style={styles.catEmoji}>{item.icon}</Text>
                  )}
                </View>
                <Text style={styles.catName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>



        {/* Fresh Deals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Fresh Deals</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ProductStack', {
                screen: 'ProductListing',
                params: { categoryId: 'fresh-deals', categoryName: '🔥 Fresh Deals' },
              })}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={products.filter((p) => p.isFreshDeal || true)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.productList}
            renderItem={({ item }) => (
              <View style={styles.productCardWrapper}>
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductStack', {
                    screen: 'ProductDetails',
                    params: { productId: item.id },
                  })}
                  onAddToCart={() => addToCart(item, 1)}
                  onWishlistToggle={() => toggleWishlist(item.id)}
                  isWishlisted={wishlisted.includes(item.id)}
                />
              </View>
            )}
          />
        </View>

        {/* All Products */}
        <View style={[styles.section, { paddingBottom: Spacing.lg }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Products</Text>
          </View>
          <View style={styles.productGrid}>
            {products.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductStack', {
                    screen: 'ProductDetails',
                    params: { productId: item.id },
                  })}
                  onAddToCart={() => addToCart(item, 1)}
                  onWishlistToggle={() => toggleWishlist(item.id)}
                  isWishlisted={wishlisted.includes(item.id)}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ─────────────────────────────────────────────
          LOCATION SELECTOR MODAL (Universal Web & Native)
         ───────────────────────────────────────────── */}
      <Modal
        visible={isLocationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.modalIconBadge}>
                  <Ionicons name="location" size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Delivery Location</Text>
                  <Text style={styles.modalSubtitle}>Choose mandi dispatch hub or detect GPS</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsLocationModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Current Active Location Banner */}
            <View style={styles.activeLocationBanner}>
              <View style={styles.activeLocationTop}>
                <View style={styles.activePill}>
                  <View style={styles.greenPulseDot} />
                  <Text style={styles.activePillText}>ACTIVE HUB</Text>
                </View>
                {currentLocation && (
                  <Text style={styles.coordsText}>
                    {currentLocation.latitude.toFixed(4)}°N, {currentLocation.longitude.toFixed(4)}°E
                  </Text>
                )}
              </View>
              <Text style={styles.activeLocationAddress}>
                {currentAddress?.formattedAddress || 'Shivajinagar, FC Road, Pune, Maharashtra - 411005'}
              </Text>
            </View>

            {/* Feedback Alert if detecting */}
            {locationNotice && (
              <View style={styles.noticeBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                <Text style={styles.noticeText}>{locationNotice}</Text>
              </View>
            )}

            {/* Action 1: Auto-Detect GPS Button */}
            <TouchableOpacity
              style={[styles.detectGpsBtn, (isDetectingGps || isLoadingLocation) && { opacity: 0.8 }]}
              onPress={handleAutoDetectGPS}
              disabled={isDetectingGps || isLoadingLocation}
              activeOpacity={0.85}
            >
              {isDetectingGps || isLoadingLocation ? (
                <>
                  <ActivityIndicator size="small" color={Colors.white} />
                  <Text style={styles.detectGpsBtnText}>Locking Satellite Coordinates...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="locate" size={18} color={Colors.white} />
                  <Text style={styles.detectGpsBtnText}>Auto-Detect My Live Device GPS 🎯</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Section 2: My Saved Delivery Addresses */}
            <Text style={styles.hubsSectionTitle}>My Saved Delivery Addresses ({savedAddresses.length})</Text>
            <ScrollView style={styles.hubsScroll} showsVerticalScrollIndicator={false}>
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id || currentAddress?.formattedAddress === addr.formattedAddress;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[styles.hubItem, isSelected && styles.hubItemActive]}
                    onPress={() => handleSelectSavedAddress(addr.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.hubName, isSelected && styles.hubNameActive]}>{addr.fullName}</Text>
                        <View style={styles.hubBadge}>
                          <Text style={styles.hubBadgeText}>{addr.type || 'HOME'}</Text>
                        </View>
                        {addr.isDefault && (
                          <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#B45309' }}>DEFAULT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.hubAddress} numberOfLines={1}>{addr.formattedAddress}</Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* APMC Mandi Hubs */}
              <Text style={[styles.hubsSectionTitle, { marginTop: 14 }]}>Popular APMC Mandi Hubs</Text>
              {POPULAR_MANDI_HUBS.map((hub) => {
                const isSelected = currentAddress?.city?.toLowerCase() === hub.city.toLowerCase() ||
                  currentAddress?.area?.toLowerCase() === hub.area.toLowerCase();
                return (
                  <TouchableOpacity
                    key={hub.id}
                    style={[styles.hubItem, isSelected && styles.hubItemActive]}
                    onPress={() => handleSelectHub(hub)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.hubName, isSelected && styles.hubNameActive]}>{hub.name}</Text>
                        <View style={styles.hubBadge}>
                          <Text style={styles.hubBadgeText}>{hub.badge}</Text>
                        </View>
                      </View>
                      <Text style={styles.hubAddress} numberOfLines={1}>{hub.formattedAddress}</Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Action 3: Add Custom Address Button */}
            <TouchableOpacity
              style={styles.addCustomAddressBtn}
              onPress={() => {
                setIsLocationModalVisible(false);
                navigation.navigate('AddAddress', {});
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.addCustomAddressText}>Add New Delivery Address 📝</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────
          LANGUAGE SELECTOR MODAL (Universal Web & Native)
         ───────────────────────────────────────────── */}
      <Modal
        visible={isLanguageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 400 }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 24 }}>🌐</Text>
                <View>
                  <Text style={styles.modalTitle}>{t('selectLanguage', 'Select Language')}</Text>
                  <Text style={styles.modalSubtitle}>{t('chooseLanguage', 'Choose your preferred app language')}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsLanguageModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, marginTop: 12 }}>
              {LANGUAGE_OPTIONS.map((lang) => {
                const isSelected = currentLanguageOption.code === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langOptionCard, isSelected && styles.langOptionCardActive]}
                    onPress={() => {
                      setLanguage(lang.code);
                      setIsLanguageModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 26 }}>{lang.flag}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.langNativeName, isSelected && styles.langNativeNameActive]}>
                        {lang.nativeName}
                      </Text>
                      <Text style={styles.langEnglishName}>{lang.name}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      <FloatingCartBanner bottomOffset={Platform.OS === 'web' ? 70 : 80} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: 'transparent', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.sm, marginBottom: Spacing.sm, gap: Spacing.sm },
  avatarBtn: { position: 'relative' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primaryLight,
    overflow: 'hidden',
  },
  avatarImage: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { fontSize: 16, fontWeight: '800', color: Colors.white },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 1.5, borderColor: Colors.white,
  },
  locationWrap: { flex: 1 },
  locationLabel: { fontSize: 11, color: Colors.textSecondary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flexShrink: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray100 },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error, borderWidth: 1.5, borderColor: Colors.white },
  searchBar: { marginBottom: Spacing.sm },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    padding: 3,
    marginBottom: Spacing.sm,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  bulkHeroBox: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: Spacing.md,
    gap: Spacing.sm,
    elevation: 5,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  bulkHeroTop: {
    gap: 4,
  },
  bulkTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  bulkTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  bulkHeroTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  bulkHeroSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  postRequirementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 11,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  postRequirementBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
  bannerList: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  banner: {
    width: BANNER_WIDTH,
    borderRadius: 22,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 5,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  bannerContent: { flex: 1, gap: 4 },
  bannerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.2 },
  bannerSub: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  bannerBtn: { marginTop: 8, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 7, borderRadius: BorderRadius.full, alignSelf: 'flex-start' },
  bannerBtnText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  bannerImage: { width: 96, height: 96, borderRadius: 18 },
  section: { paddingTop: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.2 },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  catList: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  catItem: { alignItems: 'center', gap: 6, width: 72 },
  catIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  categoryImage: { width: '100%', height: '100%' },
  catEmoji: { fontSize: 24 },
  catName: { fontSize: 11, fontWeight: '500', color: Colors.textPrimary, textAlign: 'center' },
  productList: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  productCardWrapper: { width: 170 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.sm },
  gridItem: { width: '48%' },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  langPillFlag: { fontSize: 13 },
  langPillText: { fontSize: 11, fontWeight: '800', color: '#166534' },

  // Modal Styles (Location & Language)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLocationBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  activeLocationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  coordsText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
  },
  activeLocationAddress: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    flex: 1,
  },
  detectGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.xs,
    ...Shadows.sm,
  },
  detectGpsBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  hubsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  hubsScroll: {
    maxHeight: 220,
    marginVertical: 4,
  },
  hubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    backgroundColor: '#FAFAFA',
  },
  hubItemActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  hubName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  hubNameActive: {
    color: Colors.primary,
  },
  hubBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  hubBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0369A1',
  },
  hubAddress: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addCustomAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xs,
  },
  addCustomAddressText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  // Language Modal Options
  langOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  langOptionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
  },
  langNativeName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  langNativeNameActive: {
    color: Colors.primary,
  },
  langEnglishName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});

