/**
 * MandiKart Farmer App — Sell Home (Screen 01)
 *
 * The farmer's complete selling marketplace, market intelligence,
 * buyer discovery, and sales management center.
 *
 * Section Priority (per specification):
 * 1. Header + Quick Actions
 * 2. Sell My Produce ("Sell Your Fasal")
 * 3. New Buyer Requests Spotlight
 * 4. Best Selling Opportunity Spotlight
 * 5. Market Today (AGMARKNET verified low/high/ref rates)
 * 6. Buyer Demand ("Buyers Looking For")
 * 7. My Active Sales
 * 8. Recent Sales
 *
 * Simple, professional English throughout.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  Pressable,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Tag,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Truck,
  IndianRupee,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  ArrowRight,
  BarChart3,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Plus,
  Scale,
  Building2,
  Lock,
  PackageCheck,
  Percent,
  X,
  SlidersHorizontal,
  Globe,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useProduceStore, CropItem } from '@/store/produceStore';
import { useSellStore, BuyerRequest, CompletedSale } from '@/store/sellStore';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { apiClient, resolveFarmerApiBaseUrl } from '@/services/apiClient';
import FPOBuyersScreen from '@/components/fpo/FPOBuyersScreen';

export default function SellHomeScreen() {
  const user = useAuthStore((state) => state.user);

  // ── FPO BRANCH: Return institutional B2B buyers & tender marketplace ──
  if (user?.role === 'FPO') {
    return <FPOBuyersScreen />;
  }

  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Stores
  const crops = useProduceStore((state) => state.crops);
  const requests = useSellStore((state) => state.requests);
  const salesHistory = useSellStore((state) => state.salesHistory);
  const buyers = useSellStore((state) => state.buyers);
  const createListing = useSellStore((state) => state.createListing);
  const acceptRequest = useSellStore((state) => state.acceptRequest);
  const rejectRequest = useSellStore((state) => state.rejectRequest);
  const counterOffer = useSellStore((state) => state.counterOffer);
  const executeSale = useSellStore((state) => state.executeSale);

  // Stable sync guard — call getState() directly to avoid reactive loop crash
  // (subscribing to syncWithBackend reference causes it to change on every store
  //  update, which re-fires useFocusEffect and creates an infinite re-render loop)
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNegotiations = async () => {
    try {
      const apiBase = resolveFarmerApiBaseUrl();
      const token = useAuthStore.getState().token || '';
      const res = await fetch(`${apiBase}/negotiations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data)) {
        useSellStore.getState().mergeBackendNegotiations(json.data);
      }
    } catch (e) {}
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        useProduceStore.getState().syncWithBackend(),
        useOrderStore.getState().syncWithBackend(),
        fetchNegotiations(),
      ]);
    } catch {}
    finally {
      setIsRefreshing(false);
    }
  };

  // Continuous 2.5-second real-time auto-refresh across Farmer Sell screen
  useEffect(() => {
    // Initial fetch on mount
    useProduceStore.getState().syncWithBackend().catch(() => {});
    useOrderStore.getState().syncWithBackend().catch(() => {});
    fetchNegotiations();

    const timer = setInterval(() => {
      useProduceStore.getState().syncWithBackend().catch(() => {});
      useOrderStore.getState().syncWithBackend().catch(() => {});
      fetchNegotiations();
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Active new / pending requests
  const newRequests = useMemo(() => {
    return requests.filter((r) => r.status === 'New' || r.status === 'Pending');
  }, [requests]);

  const activeSales = useMemo(() => {
    return salesHistory.filter((s) => s.status === 'In Transit' || s.status === 'Payment Pending');
  }, [salesHistory]);

  // Sorted crops for Sell section (Always newest recent crop first)
  const sortedCrops = useMemo(() => {
    return [...crops].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [crops]);

  // Modals state
  const [selectedCropForSell, setSelectedCropForSell] = useState<CropItem | null>(null);
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [sellQuantityInput, setSellQuantityInput] = useState('');
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);

  // Listing modal
  const [listingModalVisible, setListingModalVisible] = useState(false);
  const [listingCrop, setListingCrop] = useState<CropItem | null>(null);
  const [listingTargetPrice, setListingTargetPrice] = useState('');
  const [listingNotes, setListingNotes] = useState('');

  // Counter offer modal
  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [selectedRequestForCounter, setSelectedRequestForCounter] = useState<BuyerRequest | null>(null);
  const [counterPriceInput, setCounterPriceInput] = useState('');
  const [counterMessageInput, setCounterMessageInput] = useState('');

  // Open quantity modal
  const handleOpenSellModal = (crop: CropItem) => {
    if (crop.status === 'PENDING_APPROVAL') {
      Alert.alert(
        'Produce Verification Protocol',
        `Selling ${crop.cropName} is restricted. This produce is currently awaiting MandiKart Admin quality verification. Once verified, trading will unlock automatically.`,
        [{ text: 'Understood', style: 'default' }]
      );
      return;
    }
    setSelectedCropForSell(crop);
    setSellQuantityInput(crop.availableKg.toString());
    setSelectedPercentage(100);
    setSellModalVisible(true);
  };

  const handleSetPercentage = (pct: number) => {
    if (!selectedCropForSell) return;
    setSelectedPercentage(pct);
    const calculatedQty = Math.round((selectedCropForSell.availableKg * pct) / 100);
    setSellQuantityInput(calculatedQty.toString());
  };

  const handleDirectSell = () => {
    if (!selectedCropForSell) return;
    const qty = parseFloat(sellQuantityInput);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity to sell.');
      return;
    }
    if (qty > selectedCropForSell.availableKg) {
      Alert.alert(
        'Exceeds Available Stock',
        `You have ${selectedCropForSell.availableKg.toLocaleString()} kg available. Please enter an amount equal to or less than your available stock.`
      );
      return;
    }

    const topBuyer = buyers[0] || {
      name: 'ABC Foods & Agro Procurements',
      businessType: 'Food Processor',
    };

    const targetPrice = selectedCropForSell.referencePricePerKg || 24;

    Alert.alert(
      'Confirm Instant Sale 🤝',
      `Sell ${qty.toLocaleString()} kg of ${selectedCropForSell.cropName} directly to ${topBuyer.name} at ₹${targetPrice}/kg?\n\nGross Value: ₹${(qty * targetPrice).toLocaleString()}\nPickup: Farmgate Collection Scheduled`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Sell Now',
          style: 'default',
          onPress: () => {
            setSellModalVisible(false);
            const res = executeSale({
              cropId: selectedCropForSell.id,
              cropName: selectedCropForSell.cropName,
              variety: selectedCropForSell.variety,
              quantityKg: qty,
              grade: selectedCropForSell.grade,
              pricePerKg: targetPrice,
              buyerName: topBuyer.name,
              buyerType: topBuyer.businessType,
              transportPerKg: 0.8,
              cropImage: selectedCropForSell.imageUri,
            });

            if (res.success) {
              Alert.alert(
                'Produce Sold & Order Created! 🚛',
                `Your order (${res.orderId}) is now live. Vehicle dispatch is underway and tracked in real-time in the Orders screen.`,
                [
                  {
                    text: 'View in Orders',
                    onPress: () => router.push('/(tabs)/orders'),
                  },
                  { text: 'Stay in Sell', style: 'cancel' },
                ]
              );
            } else {
              Alert.alert('Unable to Complete Sale', res.error || 'Please check stock.');
            }
          },
        },
      ]
    );
  };

  const handleProceedToBestOptions = () => {
    if (!selectedCropForSell) return;
    const qty = parseFloat(sellQuantityInput);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity to sell.');
      return;
    }
    if (qty > selectedCropForSell.availableKg) {
      Alert.alert(
        'Exceeds Available Stock',
        `You have ${selectedCropForSell.availableKg.toLocaleString()} kg available. Please enter an amount equal to or less than your available stock.`
      );
      return;
    }

    setSellModalVisible(false);
    router.push({
      pathname: '/sell/best-options',
      params: {
        crop: selectedCropForSell.cropName,
        qty: qty.toString(),
        grade: selectedCropForSell.grade,
      },
    });
  };

  // Listing Handler
  const handleOpenListingModal = (crop: CropItem) => {
    setListingCrop(crop);
    setListingTargetPrice(crop.referencePricePerKg ? (crop.referencePricePerKg + 2).toString() : '25');
    setListingNotes('');
    setListingModalVisible(true);
  };

  const handleCreateListing = async () => {
    if (!listingCrop) return;
    const targetPrice = parseFloat(listingTargetPrice) || listingCrop.referencePricePerKg;

    // Image URLs — filter out local file:// paths, accept http(s) and base64 data URIs
    const validRemote = [listingCrop.imageUri].filter(
      (uri) => uri && (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:image/'))
    );
    const safeImages = validRemote.length > 0 
      ? validRemote 
      : ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600'];

    const user = useAuthStore.getState().user;
    const farmer = useAuthStore.getState().farmer;
    const realFarmerName = user?.fullName || user?.name || farmer?.fullName || 'Ramesh Patel';
    const realFarmerPhone = user?.phone || farmer?.phone || '';

    try {
      // Publish to global market — send full crop data so the backend can
      // create a complete registry entry even if this crop hasn't synced before
      await apiClient.updateProduct(listingCrop.id, {
        targetBuyer: 'BOTH',
        basePricePerUnit: targetPrice,
        status: 'ACTIVE',
        isActive: true,
        farmerName: realFarmerName,
        farmerPhone: realFarmerPhone,
        // Full crop data for registry creation
        cropName: listingCrop.cropName,
        cropVariety: listingCrop.variety || '',
        grade: listingCrop.grade?.replace('Grade ', '') || 'A',
        category: listingCrop.category,
        totalQuantity: listingCrop.totalKg,
        availableQuantity: listingCrop.availableKg,
        quantityUnit: listingCrop.unit || 'kg',
        pickupAddress: listingCrop.location || 'Farm',
        shelfLifeDays: listingCrop.shelfLifeDaysEstMax || 14,
        images: safeImages,
        notes: listingNotes || '',
      } as any);

      // Update local store to reflect that this crop is now active/listed
      useProduceStore.getState().updateCropStatus(listingCrop.id, 'ACTIVE');

      createListing({
        cropId: listingCrop.id,
        cropName: listingCrop.cropName,
        variety: listingCrop.variety,
        totalKg: listingCrop.availableKg,
        availableKg: listingCrop.availableKg,
        grade: listingCrop.grade,
        targetPricePerKg: targetPrice,
        availableFrom: 'Immediate',
        pickupLocation: listingCrop.location || 'Main Farm Warehouse',
        notes: listingNotes || 'Clean harvested crop ready for buyer inspection.',
        status: 'Available',
      });

      // Synchronize with backend so listing status is instantly reflected
      useProduceStore.getState().syncWithBackend().catch(() => {});

      setListingModalVisible(false);
      Alert.alert(
        '✅ Published to All Buyers',
        `${listingCrop.cropName} (${listingCrop.availableKg.toLocaleString()} kg @ ₹${targetPrice}/kg) is now live in the global MandiKart marketplace. All buyers and FPOs can see and order it.`
      );
    } catch (error) {
      console.warn('Failed to publish crop:', error);
      Alert.alert('Listing Error', 'Failed to publish to the global marketplace. Please check your connection and try again.');
    }
  };

  const handleUnlistCrop = async (crop: CropItem) => {
    Alert.alert(
      'Remove from Global Market?',
      `Are you sure you want to stop selling ${crop.cropName} to all buyers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlist',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.updateProduct(crop.id, {
                status: 'DRAFT',
                isActive: false,
              } as any);
              useProduceStore.getState().updateCropStatus(crop.id, 'DRAFT');
              Alert.alert('Crop Unlisted', 'This crop has been removed from the global market.');
            } catch (error) {
              console.warn('Failed to unlist crop:', error);
              Alert.alert('Error', 'Failed to remove crop. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Quick Accept Request
  const handleAcceptRequest = (req: BuyerRequest) => {
    Alert.alert(
      'Accept Buyer Offer?',
      `Confirm acceptance of ${req.buyerName}'s offer for ${req.quantityKg.toLocaleString()} kg of ${req.cropName} at ₹${req.offerPricePerKg}/kg?\n\nEstimated Net Return: ₹${req.estimatedNetReturnPerKg}/kg\nGross Value: ₹${(req.quantityKg * req.offerPricePerKg).toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Offer',
          style: 'default',
          onPress: async () => {
            const res = acceptRequest(req.id);
            if (res.success) {
              try {
                const apiBase = resolveFarmerApiBaseUrl();
                const token = useAuthStore.getState().token || '';
                await fetch(`${apiBase}/negotiations/${req.id}/accept`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'Idempotency-Key': `idemp-acc-${Date.now()}`,
                  },
                  body: JSON.stringify({ action: 'ACCEPT' }),
                });
              } catch (e) {}

              Alert.alert(
                'Sale Confirmed!',
                `Your order (${res.orderId}) has been created. The vehicle pickup and logistics tracking are now active in the Orders module.`,
                [
                  {
                    text: 'View in Orders',
                    onPress: () => router.push('/(tabs)/orders'),
                  },
                  { text: 'Stay in Sell', style: 'cancel' },
                ]
              );
            } else {
              Alert.alert('Unable to Accept', res.error || 'Please check available stock.');
            }
          },
        },
      ]
    );
  };

  // Open Counter Modal
  const handleOpenCounterModal = (req: BuyerRequest) => {
    setSelectedRequestForCounter(req);
    setCounterPriceInput((req.offerPricePerKg + 1.5).toString());
    setCounterMessageInput('');
    setCounterModalVisible(true);
  };

  const handleSendCounter = async () => {
    if (!selectedRequestForCounter) return;
    const price = parseFloat(counterPriceInput);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid counter price per kg.');
      return;
    }

    counterOffer(
      selectedRequestForCounter.id,
      price,
      selectedRequestForCounter.quantityKg,
      counterMessageInput.trim() || undefined
    );

    try {
      const apiBase = resolveFarmerApiBaseUrl();
      const token = useAuthStore.getState().token || '';
      await fetch(`${apiBase}/negotiations/${selectedRequestForCounter.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': `idemp-cnt-${Date.now()}`,
        },
        body: JSON.stringify({
          action: 'COUNTER',
          counterPrice: price,
          counterQty: selectedRequestForCounter.quantityKg,
          message: counterMessageInput.trim() || undefined,
        }),
      });
    } catch (e) {}

    setCounterModalVisible(false);
    Alert.alert('Counter Offer Sent', `Your counter offer of ₹${price}/kg has been submitted to ${selectedRequestForCounter.buyerName}.`);
  };

  // Quick Reject Request
  const handleRejectRequest = (req: BuyerRequest) => {
    Alert.alert(
      'Decline Request',
      `Are you sure you want to decline this offer from ${req.buyerName}?`,
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            rejectRequest(req.id, 'Price not aligned with farmer target');
            try {
              const apiBase = resolveFarmerApiBaseUrl();
              const token = useAuthStore.getState().token || '';
              await fetch(`${apiBase}/negotiations/${req.id}/respond`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                  'Idempotency-Key': `idemp-dec-${Date.now()}`,
                },
                body: JSON.stringify({
                  action: 'REJECT',
                  rejectionReason: 'Price not aligned with farmer target',
                }),
              });
            } catch (e) {}
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header ────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerSubtitle}>MandiKart Marketplace</Text>
          <Text style={styles.headerTitle}>Sell</Text>
          <Text style={styles.headerCaption}>
            Find buyers, check prices and sell your crop
          </Text>
        </View>
        <Pressable
          style={styles.headerIconBtn}
          onPress={() => router.push('/sell/requests')}
          accessibilityLabel="Buyer Requests"
        >
          <ShoppingBag size={20} color={MKColors.textPrimary} />
          {newRequests.length > 0 && (
            <View style={styles.requestBadgeDot}>
              <Text style={styles.requestBadgeText}>{newRequests.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={MKColors.primaryGreen}
            colors={[MKColors.primaryGreen]}
          />
        }
      >
        {/* ── Quick Action Bar (4 Key Actions) ──────────────────────── */}
        <View style={styles.quickActionsBar}>
          <Pressable
            style={styles.quickActionItem}
            onPress={() => {
              if (crops.length > 0) handleOpenSellModal(crops[0]);
              else router.push('/produce/add');
            }}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#E8F5E9' }]}>
              <Tag size={18} color={MKColors.primaryGreen} />
            </View>
            <Text style={styles.quickActionText}>Sell My Crop</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionItem}
            onPress={() => router.push('/sell/requests')}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#FFF3E0' }]}>
              <Users size={18} color={MKColors.accentOrange} />
              {newRequests.length > 0 && <View style={styles.miniDot} />}
            </View>
            <Text style={styles.quickActionText}>Buyer Requests</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionItem}
            onPress={() => router.push('/market-prices')}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#F0FDF4' }]}>
              <TrendingUp size={18} color={MKColors.primaryGreenDark} />
            </View>
            <Text style={styles.quickActionText}>Market Prices</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionItem}
            onPress={() => router.push('/sell/global-listings')}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Globe size={18} color="#15803D" />
            </View>
            <Text style={styles.quickActionText}>Listed Globally</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionItem}
            onPress={() => router.push('/sell/history')}
          >
            <View style={[styles.quickActionIconWrap, { backgroundColor: '#F1F5F9' }]}>
              <BarChart3 size={18} color="#0284C7" />
            </View>
            <Text style={styles.quickActionText}>My Sales</Text>
          </Pressable>
        </View>

        {/* ── Priority 1: Sell Your Fasal ──────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Sell Your Fasal</Text>
            <Text style={styles.sectionSubtitle}>Choose a crop you have available</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/produce')}>
            <Text style={styles.sectionActionLink}>My Inventory →</Text>
          </Pressable>
        </View>

        {crops.length === 0 ? (
          <View style={styles.emptyCard}>
            <PackageCheck size={36} color={MKColors.textSecondary} />
            <Text style={styles.emptyTitle}>No crops found in your inventory</Text>
            <Text style={styles.emptySubtitle}>
              Add your harvest to start receiving buyer offers and checking mandi benchmarks.
            </Text>
            <Pressable
              style={styles.emptyAddBtn}
              onPress={() => router.push('/produce/add')}
            >
              <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyAddBtnText}>Add Crop to Inventory</Text>
            </Pressable>
          </View>
        ) : (
          sortedCrops.map((crop) => {
            const isAvailable = crop.availableKg > 0;
            return (
              <View key={crop.id} style={styles.produceSellCard}>
                <View style={styles.produceTopRow}>
                  <Image source={{ uri: crop.imageUri || 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400' }} style={styles.produceThumb} />
                  <View style={styles.produceMetaCol}>
                    <View style={styles.produceTitleBadgeRow}>
                      <Text style={styles.produceName} numberOfLines={1}>
                        {crop.cropName}
                      </Text>
                      <View style={styles.gradePill}>
                        <Text style={styles.gradePillText}>{crop.grade}</Text>
                      </View>
                    </View>
                    {crop.status === 'PENDING_APPROVAL' && (
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: '#FEF3C7',
                          borderColor: '#FCD34D',
                          borderWidth: 1,
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          marginTop: 2,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#92400E' }}>
                          🟡 Pending Admin Approval
                        </Text>
                      </View>
                    )}
                    {crop.status === 'APPROVED' && (
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: '#E0F2FE',
                          borderColor: '#38BDF8',
                          borderWidth: 1,
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          marginTop: 2,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#0369A1' }}>
                          🟢 Quality Approved — Ready to List Globally
                        </Text>
                      </View>
                    )}
                    {crop.status === 'ACTIVE' && (
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: '#DCFCE7',
                          borderColor: '#86EFAC',
                          borderWidth: 1,
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          marginTop: 2,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#166534' }}>
                          🟢 Live on Global Market
                        </Text>
                      </View>
                    )}
                    <Text style={styles.produceSubtext}>
                      {crop.variety || crop.category} • Harvested: {crop.harvestDate}
                    </Text>

                    <View style={styles.stockQuantityPill}>
                      <Scale size={13} color={MKColors.primaryGreenDark} />
                      <Text style={styles.stockQuantityText}>
                        <Text style={{ fontWeight: '800' }}>{crop.availableKg.toLocaleString()} kg</Text> available
                        {crop.reservedKg > 0 ? ` (${crop.reservedKg} kg reserved)` : ''}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Market Benchmark row */}
                <View style={styles.marketPriceStrip}>
                  <View style={styles.mandiRefPill}>
                    <Building2 size={13} color={MKColors.textSecondary} />
                    <Text style={styles.mandiRefText}>
                      Ref Price: <Text style={styles.mandiRefBold}>₹{crop.referencePricePerKg}/kg</Text>
                    </Text>
                  </View>

                  <View style={styles.demandTrendRow}>
                    <Text style={styles.demandLabel}>
                      Demand: <Text style={{ fontWeight: '700', color: MKColors.primaryGreenDark }}>{crop.marketDemand}</Text>
                    </Text>
                    {crop.priceMovementPct !== 0 && (
                      <View
                        style={[
                          styles.trendChip,
                          crop.priceMovementTrend === 'up' ? styles.trendChipUp : styles.trendChipDown,
                        ]}
                      >
                        {crop.priceMovementTrend === 'up' ? (
                          <TrendingUp size={11} color={MKColors.primaryGreen} />
                        ) : (
                          <TrendingDown size={11} color="#DC2626" />
                        )}
                        <Text
                          style={[
                            styles.trendChipText,
                            crop.priceMovementTrend === 'up'
                              ? { color: MKColors.primaryGreen }
                              : { color: '#DC2626' },
                          ]}
                        >
                          {crop.priceMovementPct > 0 ? `+${crop.priceMovementPct}%` : `${crop.priceMovementPct}%`}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Action Row */}
                <View style={styles.cardActionsRow}>
                  {/* Sell to All Buyers / List Globally — primary global market publish action */}
                  {crop.status === 'ACTIVE' ? (
                    <Pressable 
                      style={[styles.listForSaleBtn, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', flex: 1 }]}
                      onPress={() => router.push('/sell/global-listings')}
                    >
                      <Globe size={14} color="#166534" style={{ marginRight: 6 }} />
                      <Text style={[styles.listForSaleBtnText, { color: '#166534', fontWeight: '700' }]}>
                        Listed Globally
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[
                        styles.listForSaleBtn, 
                        { flex: 1, backgroundColor: crop.status === 'APPROVED' ? '#166534' : '#1B6D24', borderColor: '#1B6D24' }
                      ]}
                      onPress={() => {
                        if (crop.status === 'PENDING_APPROVAL') {
                          Alert.alert(
                            'Verification Required',
                            'This produce is currently awaiting Admin quality verification. Once verified, you can confirm and list it globally for all buyers.',
                            [{ text: 'OK', style: 'default' }]
                          );
                          return;
                        }
                        handleOpenListingModal(crop);
                      }}
                    >
                      <PackageCheck size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={[styles.listForSaleBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                        {crop.status === 'APPROVED' ? 'List Globally 🌐' : 'Sell to All Buyers'}
                      </Text>
                    </Pressable>
                  )}

                  {/* Quick-sell to specific buyer (existing flow) */}
                  {crop.status !== 'PENDING_APPROVAL' && (
                    <Pressable
                      style={[styles.sellThisCropBtn, !isAvailable && styles.btnDisabled, { marginLeft: 8 }]}
                      disabled={!isAvailable}
                      onPress={() => handleOpenSellModal(crop)}
                    >
                      <Text style={styles.sellThisCropBtnText}>Quick Sell</Text>
                      <ArrowRight size={15} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* ── Priority 2: New Buyer Requests Spotlight ─────────────── */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>New Buyer Requests</Text>
            {newRequests.length > 0 && (
              <View style={styles.sectionCountPill}>
                <Text style={styles.sectionCountPillText}>{newRequests.length} new</Text>
              </View>
            )}
          </View>
          <Pressable onPress={() => router.push('/sell/requests')}>
            <Text style={styles.sectionActionLink}>View All ({requests.length}) →</Text>
          </Pressable>
        </View>

        {newRequests.length === 0 ? (
          <View style={styles.simpleNoticeBox}>
            <CheckCircle2 size={18} color={MKColors.primaryGreen} style={{ marginRight: 8 }} />
            <Text style={styles.simpleNoticeText}>
              No pending buyer requests. New requests from active buyers will appear here.
            </Text>
          </View>
        ) : (
          newRequests.slice(0, 2).map((req) => (
            <View key={req.id} style={styles.requestSpotlightCard}>
              <View style={styles.requestCardHeader}>
                <Image source={{ uri: req.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }} style={styles.buyerAvatar} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.buyerNameText} numberOfLines={1}>
                      {req.buyerName}
                    </Text>
                    {req.verified && (
                      <ShieldCheck size={14} color={MKColors.primaryGreen} style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={styles.requestSubtitle}>
                    Wants your {req.cropName} • {req.buyerType}
                  </Text>
                </View>
                <View style={styles.expiryBadge}>
                  <Clock size={11} color="#B45309" />
                  <Text style={styles.expiryText}>{req.expiresInHours}h left</Text>
                </View>
              </View>

              {/* Requirement Strip */}
              <View style={styles.requestStatsGrid}>
                <View style={styles.requestStatCol}>
                  <Text style={styles.statSublabel}>Quantity</Text>
                  <Text style={styles.statBoldValue}>{req.quantityKg.toLocaleString()} kg</Text>
                  <Text style={styles.statSmallMeta}>({req.qualityGrade})</Text>
                </View>

                <View style={styles.requestStatCol}>
                  <Text style={styles.statSublabel}>Offer Rate</Text>
                  <Text style={[styles.statBoldValue, { color: MKColors.primaryGreenDark }]}>
                    ₹{req.offerPricePerKg}/kg
                  </Text>
                  <Text style={styles.statSmallMeta}>Ref: ₹{req.marketReferencePricePerKg}/kg</Text>
                </View>

                <View style={styles.requestStatCol}>
                  <Text style={styles.statSublabel}>Est. Net Return</Text>
                  <Text style={[styles.statBoldValue, { color: MKColors.accentOrangeDark }]}>
                    ₹{req.estimatedNetReturnPerKg}/kg
                  </Text>
                  <Text style={styles.statSmallMeta}>Transit: ~₹{req.estimatedTransportPerKg}/kg</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.requestActionRow}>
                <Pressable
                  style={styles.requestRejectBtn}
                  onPress={() => handleRejectRequest(req)}
                >
                  <Text style={styles.requestRejectText}>Decline</Text>
                </Pressable>

                <Pressable
                  style={styles.requestCounterBtn}
                  onPress={() => handleOpenCounterModal(req)}
                >
                  <Text style={styles.requestCounterText}>Counter</Text>
                </Pressable>

                <Pressable
                  style={styles.requestAcceptBtn}
                  onPress={() => handleAcceptRequest(req)}
                >
                  <Text style={styles.requestAcceptText}>Accept Offer</Text>
                  <ArrowRight size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </Pressable>
              </View>
            </View>
          ))
        )}

        {/* ── Priority 3: Best Selling Opportunity Spotlight ───────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Best Selling Opportunity</Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/sell/best-options',
                params: { crop: crops[0]?.cropName || 'Onion', qty: '1000', grade: 'Grade A' },
              })
            }
          >
            <Text style={styles.sectionActionLink}>Compare All →</Text>
          </Pressable>
        </View>

        <View style={styles.bestOpportunityCard}>
          <View style={styles.recommendedBadgeRow}>
            <View style={styles.starPill}>
              <Sparkles size={13} color="#FFFFFF" />
              <Text style={styles.starPillText}>⭐ Recommended Option</Text>
            </View>
            <View style={styles.matchScoreBadge}>
              <Text style={styles.matchScoreText}>94% Match</Text>
            </View>
          </View>

          <View style={styles.oppBuyerRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&auto=format&fit=crop&q=80',
              }}
              style={styles.oppBuyerAvatar}
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.oppBuyerName}>ABC Foods & Agro Procurements</Text>
                <ShieldCheck size={14} color={MKColors.primaryGreen} style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.oppBuyerMeta}>
                📍 40 km away • 1,240+ verified deals • Prompt farmgate pickup
              </Text>
            </View>
          </View>

          {/* Pricing spotlight: Gross vs Transport vs Estimated Net */}
          <View style={styles.netReturnBanner}>
            <View style={styles.netReturnCol}>
              <Text style={styles.netReturnBannerLabel}>Buyer Offer:</Text>
              <Text style={styles.netReturnBannerValue}>₹25.00 / kg</Text>
              <Text style={styles.netReturnBannerSub}>Market Ref: ₹22.00/kg</Text>
            </View>

            <View style={styles.netReturnDivider} />

            <View style={styles.netReturnCol}>
              <Text style={styles.netReturnBannerLabel}>Est. Transport:</Text>
              <Text style={styles.netReturnBannerValue}>− ₹1.50 / kg</Text>
              <Text style={styles.netReturnBannerSub}>Distance: 40 km</Text>
            </View>

            <View style={styles.netReturnDivider} />

            <View style={styles.netReturnCol}>
              <Text style={[styles.netReturnBannerLabel, { color: MKColors.primaryGreenDark }]}>
                Est. Net Return:
              </Text>
              <Text style={[styles.netReturnBannerValue, { color: MKColors.primaryGreenDark, fontSize: 18 }]}>
                ₹23.50 / kg
              </Text>
              <Text style={styles.netReturnBannerSub}>Direct to Bank</Text>
            </View>
          </View>

          <Text style={styles.oppReasonText}>
            💡 <Text style={{ fontWeight: '700' }}>Why this option:</Text> Your quantity and Grade A quality match this buyer's requirement, and the estimated transport cost is relatively low.
          </Text>

          <Pressable
            style={styles.viewBestOptionsBtn}
            onPress={() =>
              router.push({
                pathname: '/sell/best-options',
                params: {
                  crop: crops[0]?.cropName || 'Red Onion',
                  qty: '1000',
                  grade: 'Grade A',
                },
              })
            }
          >
            <Text style={styles.viewBestOptionsBtnText}>View Best Options & Compare</Text>
            <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </Pressable>
        </View>

        {/* ── Priority 4: Market Today ─────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Market Today</Text>
            <Text style={styles.sectionSubtitle}>AGMARKNET official mandi benchmark prices</Text>
          </View>
          <Pressable onPress={() => router.push('/market-prices')}>
            <Text style={styles.sectionActionLink}>Full Market →</Text>
          </Pressable>
        </View>

        <View style={styles.marketCardsGrid}>
          {/* Onion */}
          <View style={styles.marketPriceCard}>
            <View style={styles.marketCardTop}>
              <Text style={styles.marketCropName}>Red Onion</Text>
              <View style={[styles.trendChip, styles.trendChipUp]}>
                <TrendingUp size={11} color={MKColors.primaryGreen} />
                <Text style={[styles.trendChipText, { color: MKColors.primaryGreen }]}>+8%</Text>
              </View>
            </View>

            <View style={styles.marketMainRateRow}>
              <Text style={styles.marketCurrentRate}>₹22.00</Text>
              <Text style={styles.marketPerKg}> / kg</Text>
            </View>

            <View style={styles.rangeRow}>
              <Text style={styles.rangeText}>Low: ₹19.00</Text>
              <Text style={styles.rangeDot}>•</Text>
              <Text style={styles.rangeText}>High: ₹25.00</Text>
            </View>

            <View style={styles.marketFooterRow}>
              <Text style={styles.marketMandiName}>Nashik APMC (AGMARKNET)</Text>
              <Text style={styles.marketTimeText}>10:30 AM</Text>
            </View>
          </View>

          {/* Tomato */}
          <View style={styles.marketPriceCard}>
            <View style={styles.marketCardTop}>
              <Text style={styles.marketCropName}>Tomato</Text>
              <View style={[styles.trendChip, styles.trendChipDown]}>
                <TrendingDown size={11} color="#DC2626" />
                <Text style={[styles.trendChipText, { color: '#DC2626' }]}>-5%</Text>
              </View>
            </View>

            <View style={styles.marketMainRateRow}>
              <Text style={styles.marketCurrentRate}>₹18.00</Text>
              <Text style={styles.marketPerKg}> / kg</Text>
            </View>

            <View style={styles.rangeRow}>
              <Text style={styles.rangeText}>Low: ₹15.00</Text>
              <Text style={styles.rangeDot}>•</Text>
              <Text style={styles.rangeText}>High: ₹22.00</Text>
            </View>

            <View style={styles.marketFooterRow}>
              <Text style={styles.marketMandiName}>Pimpalgaon (AGMARKNET)</Text>
              <Text style={styles.marketTimeText}>10:30 AM</Text>
            </View>
          </View>
        </View>

        {/* ── Priority 5: Buyer Demand ("Buyers Looking For") ──────── */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Buyers Looking For</Text>
            <Text style={styles.sectionSubtitle}>Verified aggregate buyer procurement demand</Text>
          </View>
          <Pressable onPress={() => router.push('/sell/best-options')}>
            <Text style={styles.sectionActionLink}>View Matches →</Text>
          </Pressable>
        </View>

        <View style={styles.demandCardsContainer}>
          <View style={styles.demandRowCard}>
            <View style={styles.demandCropBadge}>
              <Text style={styles.demandCropText}>Red Onion</Text>
            </View>
            <View style={styles.demandDetailsCol}>
              <Text style={styles.demandVolumeText}>
                <Text style={{ fontWeight: '800' }}>8 buyers</Text> looking • 12,500 kg total needed
              </Text>
              <Text style={styles.demandCriteriaText}>
                Grade A / B • Pickup: This week • Average offer: ₹24–25.50/kg
              </Text>
            </View>
            <ChevronRight size={18} color={MKColors.textSecondary} />
          </View>

          <View style={styles.demandRowCard}>
            <View style={styles.demandCropBadge}>
              <Text style={styles.demandCropText}>Tomato</Text>
            </View>
            <View style={styles.demandDetailsCol}>
              <Text style={styles.demandVolumeText}>
                <Text style={{ fontWeight: '800' }}>5 buyers</Text> looking • 4,200 kg total needed
              </Text>
              <Text style={styles.demandCriteriaText}>
                Semi-ripe • Immediate collection • Average offer: ₹19–21/kg
              </Text>
            </View>
            <ChevronRight size={18} color={MKColors.textSecondary} />
          </View>
        </View>

        {/* ── Priority 6: My Active Sales ──────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Active Sales</Text>
          <Pressable onPress={() => router.push('/sell/history')}>
            <Text style={styles.sectionActionLink}>View All →</Text>
          </Pressable>
        </View>

        {activeSales.length === 0 ? (
          <View style={styles.simpleNoticeBox}>
            <Clock size={16} color={MKColors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={styles.simpleNoticeText}>
              No orders currently in transit. Accepted deals will show live progress here.
            </Text>
          </View>
        ) : (
          activeSales.map((sale) => (
            <View key={sale.id} style={styles.activeSaleCard}>
              <View style={styles.activeSaleHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeSaleCrop}>
                    {sale.cropName} ({sale.quantityKg.toLocaleString()} kg)
                  </Text>
                  <Text style={styles.activeSaleBuyer}>
                    Buyer: {sale.buyerName}
                  </Text>
                </View>
                <View style={styles.activeStatusPill}>
                  <Text style={styles.activeStatusText}>{sale.status}</Text>
                </View>
              </View>

              <View style={styles.activeSaleBottom}>
                <Text style={styles.activeSalePayout}>
                  Est. Net Payout: <Text style={{ fontWeight: '800' }}>₹{sale.netPayout.toLocaleString()}</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Pressable
                    style={[
                      styles.viewOrderLink,
                      {
                        backgroundColor: '#E8F5E9',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 6,
                        flexDirection: 'row',
                        alignItems: 'center',
                      },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: '/orders/track-vehicle',
                        params: {
                          orderId: sale.orderId,
                          crop: `${sale.cropName} (${sale.quantityKg} KG)`,
                          buyer: sale.buyerName,
                        },
                      })
                    }
                  >
                    <Truck size={13} color="#168A45" style={{ marginRight: 4 }} />
                    <Text style={[styles.viewOrderLinkText, { color: '#168A45' }]}>Live Track</Text>
                  </Pressable>

                  <Pressable
                    style={styles.viewOrderLink}
                    onPress={() => router.push('/(tabs)/orders')}
                  >
                    <Text style={styles.viewOrderLinkText}>Orders →</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}

        {/* ── Priority 7: Recent Sales History Strip ───────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Sales</Text>
          <Pressable onPress={() => router.push('/sell/history')}>
            <Text style={styles.sectionActionLink}>Full History →</Text>
          </Pressable>
        </View>

        <View style={styles.recentSalesStrip}>
          {salesHistory.slice(0, 2).map((sale) => (
            <Pressable
              key={sale.id}
              style={styles.recentSaleRow}
              onPress={() => router.push('/sell/history')}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.recentSaleCrop}>{sale.cropName} • {sale.quantityKg.toLocaleString()} kg</Text>
                <Text style={styles.recentSaleMeta}>Sold to {sale.buyerName} on {sale.saleDate}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.recentSaleAmount}>₹{sale.netPayout.toLocaleString()}</Text>
                <Text style={styles.recentSaleStatus}>{sale.status}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal: Select Quantity to Sell ───────────────────────── */}
      <Modal
        visible={sellModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSellModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>How much do you want to sell?</Text>
              <Pressable onPress={() => setSellModalVisible(false)} hitSlop={10}>
                <X size={20} color={MKColors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalCropSub}>
              {selectedCropForSell?.cropName} ({selectedCropForSell?.grade})
            </Text>

            <View style={styles.availableNotice}>
              <Scale size={14} color={MKColors.primaryGreenDark} />
              <Text style={styles.availableNoticeText}>
                Available to sell: <Text style={{ fontWeight: '800' }}>{selectedCropForSell?.availableKg.toLocaleString()} kg</Text>
              </Text>
            </View>

            {/* Quick % chips */}
            <View style={styles.percentageChipsRow}>
              {[25, 50, 75, 100].map((pct) => {
                const isSelected = selectedPercentage === pct;
                return (
                  <Pressable
                    key={pct}
                    style={[styles.percentChip, isSelected && styles.percentChipActive]}
                    onPress={() => handleSetPercentage(pct)}
                  >
                    <Text style={[styles.percentChipText, isSelected && styles.percentChipTextActive]}>
                      {pct}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.quantityInputBox}>
              <TextInput
                style={styles.quantityInputText}
                keyboardType="numeric"
                value={sellQuantityInput}
                onChangeText={(val) => {
                  setSellQuantityInput(val);
                  setSelectedPercentage(null);
                }}
                placeholder="Enter kg"
                placeholderTextColor={MKColors.textMuted}
              />
              <Text style={styles.quantityUnitLabel}>KG</Text>
            </View>

            {selectedCropForSell && (
              <View style={styles.estReturnBox}>
                <Text style={styles.estReturnLabel}>Estimated Benchmark Value:</Text>
                <Text style={styles.estReturnValue}>
                  ₹{(
                    (parseFloat(sellQuantityInput) || 0) *
                    (selectedCropForSell.referencePricePerKg || 22)
                  ).toLocaleString()}{' '}
                  <Text style={styles.estReturnSub}>
                    (@ ₹{selectedCropForSell.referencePricePerKg}/kg AGMARKNET ref)
                  </Text>
                </Text>
                <Text style={styles.estReturnDisclaimer}>
                  Actual net payout will depend on buyer match and transport quote.
                </Text>
              </View>
            )}

            <View style={{ gap: 10, marginTop: 6 }}>
              <Pressable
                style={[styles.modalPrimaryBtn, { backgroundColor: '#168A45' }]}
                onPress={handleDirectSell}
              >
                <Sparkles size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>⚡ Sell Now to Verified Buyer</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalPrimaryBtn,
                  { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#168A45' },
                ]}
                onPress={handleProceedToBestOptions}
              >
                <Text style={[styles.modalPrimaryBtnText, { color: '#168A45' }]}>
                  Compare All Buyer Offers
                </Text>
                <ArrowRight size={18} color="#168A45" style={{ marginLeft: 6 }} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Create Selling Listing ────────────────────────── */}
      <Modal
        visible={listingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setListingModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Sell to All Buyers 🌐</Text>
              <Pressable onPress={() => setListingModalVisible(false)} hitSlop={10}>
                <X size={20} color={MKColors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalCropSub}>
              Your {listingCrop?.cropName} will be published to the global MandiKart marketplace — visible to all verified buyers, FPOs, and traders.
            </Text>

            <View style={styles.listingSummaryRow}>
              <Text style={styles.listingFieldLabel}>Quantity available:</Text>
              <Text style={styles.listingFieldBold}>{listingCrop?.availableKg.toLocaleString()} kg ({listingCrop?.grade})</Text>
            </View>

            <View style={styles.listingInputWrap}>
              <Text style={styles.listingFieldLabel}>Your Target Price (₹ per kg):</Text>
              <TextInput
                style={styles.listingTextInput}
                keyboardType="numeric"
                value={listingTargetPrice}
                onChangeText={setListingTargetPrice}
                placeholder="e.g. 24"
                placeholderTextColor={MKColors.textMuted}
              />
            </View>

            <View style={styles.listingInputWrap}>
              <Text style={styles.listingFieldLabel}>Pickup Preference / Notes:</Text>
              <TextInput
                style={[styles.listingTextInput, { height: 60, textAlignVertical: 'top' }]}
                value={listingNotes}
                onChangeText={setListingNotes}
                placeholder="e.g. Farmgate collection preferred, dry warehouse stored."
                placeholderTextColor={MKColors.textMuted}
                multiline
              />
            </View>

            <Pressable
              style={styles.modalPrimaryBtn}
              onPress={handleCreateListing}
            >
              <Text style={styles.modalPrimaryBtnText}>SELL TO ALL BUYERS</Text>
              <CheckCircle2 size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Counter Offer ─────────────────────────────────── */}
      <Modal
        visible={counterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCounterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Send Counter Offer</Text>
              <Pressable onPress={() => setCounterModalVisible(false)} hitSlop={10}>
                <X size={20} color={MKColors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalCropSub}>
              Negotiating with {selectedRequestForCounter?.buyerName}
            </Text>

            <View style={styles.counterCompareStrip}>
              <View style={styles.counterCompareCol}>
                <Text style={styles.counterCompareLabel}>Current Offer</Text>
                <Text style={styles.counterCompareVal}>
                  ₹{selectedRequestForCounter?.offerPricePerKg}/kg
                </Text>
              </View>
              <View style={styles.counterDivider} />
              <View style={styles.counterCompareCol}>
                <Text style={styles.counterCompareLabel}>Quantity</Text>
                <Text style={styles.counterCompareVal}>
                  {selectedRequestForCounter?.quantityKg} kg
                </Text>
              </View>
            </View>

            <View style={styles.listingInputWrap}>
              <Text style={styles.listingFieldLabel}>Your Proposed Price (₹ per kg):</Text>
              <TextInput
                style={styles.listingTextInput}
                keyboardType="numeric"
                value={counterPriceInput}
                onChangeText={setCounterPriceInput}
                placeholder="e.g. 25.5"
                placeholderTextColor={MKColors.textMuted}
              />
            </View>

            <View style={styles.listingInputWrap}>
              <Text style={styles.listingFieldLabel}>Message to Buyer (Optional):</Text>
              <TextInput
                style={[styles.listingTextInput, { height: 50 }]}
                value={counterMessageInput}
                onChangeText={setCounterMessageInput}
                placeholder="e.g. Premium Grade A sorted produce, ready for immediate loading."
                placeholderTextColor={MKColors.textMuted}
              />
            </View>

            <Pressable
              style={styles.modalPrimaryBtn}
              onPress={handleSendCounter}
            >
              <Text style={styles.modalPrimaryBtnText}>SEND COUNTER OFFER</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MKColors.backgroundPrimary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // ── Header ────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: MKColors.backgroundPrimary,
    borderBottomWidth: 1,
    borderBottomColor: MKColors.borderLight,
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
    fontSize: 24,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  headerCaption: {
    fontSize: 12,
    color: MKColors.textSecondary,
    marginTop: 1,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: MKColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  requestBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  requestBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Quick Actions Bar ─────────────────────────────────────────────
  quickActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 5,
    shadowColor: '#0F2C56',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  quickActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },

  // ── Section Headers ───────────────────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  sectionActionLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#15803D',
  },
  sectionCountPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    marginLeft: 6,
  },
  sectionCountPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },

  // ── Produce Sell Card ─────────────────────────────────────────────
  produceSellCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 5,
    shadowColor: '#0F2C56',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  produceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  produceThumb: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  produceMetaCol: {
    flex: 1,
  },
  produceTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  produceName: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
    letterSpacing: -0.2,
  },
  gradePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  gradePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  produceSubtext: {
    fontSize: 11.5,
    color: '#64748B',
    marginVertical: 2,
    fontWeight: '500',
  },
  stockQuantityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stockQuantityText: {
    fontSize: 11.5,
    color: '#334155',
  },

  marketPriceStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mandiRefPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mandiRefText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  mandiRefBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  demandTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demandLabel: {
    fontSize: 11.5,
    color: '#64748B',
  },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  trendChipUp: {
    backgroundColor: '#DCFCE7',
  },
  trendChipDown: {
    backgroundColor: '#FEE2E2',
  },
  trendChipText: {
    fontSize: 10.5,
    fontWeight: '800',
    marginLeft: 2,
  },

  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  listForSaleBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#15803D',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listForSaleBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#15803D',
  },
  sellThisCropBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sellThisCropBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDisabled: {
    backgroundColor: '#94A3B8',
  },

  // ── Request Spotlight Card ────────────────────────────────────────
  requestSpotlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    elevation: 5,
    shadowColor: '#EA580C',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  requestCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  buyerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
  },
  buyerNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  requestSubtitle: {
    fontSize: 11,
    color: MKColors.textSecondary,
    marginTop: 1,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  expiryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },

  requestStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FAFAF8',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: MKColors.borderLight,
  },
  requestStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  statSublabel: {
    fontSize: 10,
    color: MKColors.textSecondary,
    marginBottom: 2,
  },
  statBoldValue: {
    fontSize: 13,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  statSmallMeta: {
    fontSize: 9,
    color: MKColors.textMuted,
    marginTop: 1,
  },

  requestActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  requestRejectBtn: {
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestRejectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  requestCounterBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: MKColors.accentOrange,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestCounterText: {
    fontSize: 12,
    fontWeight: '800',
    color: MKColors.accentOrange,
  },
  requestAcceptBtn: {
    flex: 1.3,
    height: 38,
    borderRadius: 8,
    backgroundColor: MKColors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAcceptText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Best Opportunity Card ─────────────────────────────────────────
  bestOpportunityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: MKColors.primaryGreen,
    elevation: 2,
    shadowColor: MKColors.primaryGreen,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  recommendedBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  starPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MKColors.primaryGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  starPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  matchScoreBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  matchScoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: MKColors.primaryGreen,
  },

  oppBuyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  oppBuyerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
  },
  oppBuyerName: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  oppBuyerMeta: {
    fontSize: 11,
    color: MKColors.textSecondary,
    marginTop: 2,
  },

  netReturnBanner: {
    flexDirection: 'row',
    backgroundColor: '#FAFAF8',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: MKColors.border,
    marginBottom: 10,
  },
  netReturnCol: {
    flex: 1,
    alignItems: 'center',
  },
  netReturnDivider: {
    width: 1,
    backgroundColor: MKColors.borderLight,
  },
  netReturnBannerLabel: {
    fontSize: 10,
    color: MKColors.textSecondary,
  },
  netReturnBannerValue: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginVertical: 2,
  },
  netReturnBannerSub: {
    fontSize: 9,
    color: MKColors.textMuted,
  },
  oppReasonText: {
    fontSize: 11,
    color: MKColors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  viewBestOptionsBtn: {
    backgroundColor: MKColors.primaryGreen,
    borderRadius: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBestOptionsBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ── Market Cards Grid ─────────────────────────────────────────────
  marketCardsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  marketPriceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: MKColors.border,
  },
  marketCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  marketCropName: {
    fontSize: 13,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  marketMainRateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  marketCurrentRate: {
    fontSize: 18,
    fontWeight: '800',
    color: MKColors.primaryGreenDark,
  },
  marketPerKg: {
    fontSize: 11,
    color: MKColors.textSecondary,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rangeText: {
    fontSize: 10,
    color: MKColors.textSecondary,
  },
  rangeDot: {
    marginHorizontal: 3,
    color: MKColors.textMuted,
  },
  marketFooterRow: {
    borderTopWidth: 1,
    borderTopColor: MKColors.borderLight,
    paddingTop: 6,
  },
  marketMandiName: {
    fontSize: 9,
    color: MKColors.textSecondary,
    fontWeight: '600',
  },
  marketTimeText: {
    fontSize: 8,
    color: MKColors.textMuted,
    marginTop: 1,
  },

  // ── Buyer Demand Cards ────────────────────────────────────────────
  demandCardsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MKColors.border,
    padding: 4,
    marginBottom: 12,
  },
  demandRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: MKColors.borderLight,
  },
  demandCropBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
    marginRight: 10,
  },
  demandCropText: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  demandDetailsCol: {
    flex: 1,
  },
  demandVolumeText: {
    fontSize: 12,
    color: MKColors.textPrimary,
  },
  demandCriteriaText: {
    fontSize: 10,
    color: MKColors.textSecondary,
    marginTop: 2,
  },

  // ── Active Sales ──────────────────────────────────────────────────
  activeSaleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: MKColors.border,
  },
  activeSaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activeSaleCrop: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  activeSaleBuyer: {
    fontSize: 11,
    color: MKColors.textSecondary,
    marginTop: 2,
  },
  activeStatusPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  activeSaleBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: MKColors.borderLight,
    paddingTop: 8,
  },
  activeSalePayout: {
    fontSize: 12,
    color: MKColors.textPrimary,
  },
  viewOrderLink: {
    paddingVertical: 2,
  },
  viewOrderLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: MKColors.primaryGreen,
  },

  // ── Recent Sales Strip ────────────────────────────────────────────
  recentSalesStrip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MKColors.border,
    padding: 6,
    marginBottom: 14,
  },
  recentSaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: MKColors.borderLight,
  },
  recentSaleCrop: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  recentSaleMeta: {
    fontSize: 10,
    color: MKColors.textSecondary,
    marginTop: 2,
  },
  recentSaleAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.primaryGreenDark,
  },
  recentSaleStatus: {
    fontSize: 10,
    color: MKColors.textMuted,
    marginTop: 2,
  },

  // ── Notice Box & Empty States ─────────────────────────────────────
  simpleNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  simpleNoticeText: {
    flex: 1,
    fontSize: 11,
    color: MKColors.textSecondary,
    lineHeight: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MKColors.border,
    marginVertical: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: MKColors.textSecondary,
    textAlign: 'center',
    marginVertical: 6,
    lineHeight: 17,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MKColors.primaryGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Modals ────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  modalCropSub: {
    fontSize: 13,
    color: MKColors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  availableNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 12,
  },
  availableNoticeText: {
    fontSize: 12,
    color: MKColors.primaryGreenDark,
  },
  percentageChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  percentChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MKColors.borderLight,
  },
  percentChipActive: {
    backgroundColor: MKColors.primaryGreen,
    borderColor: MKColors.primaryGreen,
  },
  percentChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.textSecondary,
  },
  percentChipTextActive: {
    color: '#FFFFFF',
  },
  quantityInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAF8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MKColors.border,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 12,
  },
  quantityInputText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: MKColors.textPrimary,
  },
  quantityUnitLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.textSecondary,
  },
  estReturnBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  estReturnLabel: {
    fontSize: 11,
    color: '#9A3412',
  },
  estReturnValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#9A3412',
    marginVertical: 2,
  },
  estReturnSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#C2410C',
  },
  estReturnDisclaimer: {
    fontSize: 10,
    color: '#C2410C',
    marginTop: 2,
  },
  modalPrimaryBtn: {
    backgroundColor: MKColors.primaryGreen,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Listing fields
  listingSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: MKColors.borderLight,
    marginBottom: 12,
  },
  listingFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MKColors.textSecondary,
    marginBottom: 4,
  },
  listingFieldBold: {
    fontSize: 13,
    fontWeight: '700',
    color: MKColors.textPrimary,
  },
  listingInputWrap: {
    marginBottom: 12,
  },
  listingTextInput: {
    backgroundColor: '#FAFAF8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: MKColors.border,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: MKColors.textPrimary,
  },

  // Counter
  counterCompareStrip: {
    flexDirection: 'row',
    backgroundColor: '#FAFAF8',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: MKColors.borderLight,
    marginBottom: 12,
  },
  counterCompareCol: {
    flex: 1,
    alignItems: 'center',
  },
  counterDivider: {
    width: 1,
    backgroundColor: MKColors.borderLight,
  },
  counterCompareLabel: {
    fontSize: 10,
    color: MKColors.textSecondary,
  },
  counterCompareVal: {
    fontSize: 15,
    fontWeight: '800',
    color: MKColors.textPrimary,
    marginTop: 2,
  },
});
