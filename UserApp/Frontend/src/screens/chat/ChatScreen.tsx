/**
 * MandiKart User App — WhatsApp-Style Negotiation Chat Screen
 * 
 * Enables real-time, interactive price & volume negotiations between Buyer and Farmer.
 * Connected to live backend & shared negotiation registry.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { calculateHaversineDistance } from '../../services/aStarRouting';

interface ChatItem {
  id: string;
  negotiationId: string;
  senderId: string;
  senderRole: 'BUYER' | 'FARMER' | 'SYSTEM';
  senderName: string;
  messageType: 'TEXT' | 'OFFER' | 'SYSTEM' | 'ORDER_EVENT' | 'LOCATION';
  text: string;
  price?: number;
  quantity?: number;
  unit?: string;
  totalAmount?: number;
  offerStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'COUNTERED';
  orderId?: string;
  orderNumber?: string;
  timestamp: string;
  isRead?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    name?: string;
    placeType?: 'USER_LOCATION' | 'FARMER_LOCATION';
    distanceKm?: number;
  };
}

export default function ChatScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const currentUserId = user?.id || 'buyer_default_01';
  const currentUserName = user?.fullName || 'You';
  const params = route?.params ?? {};
  const [activeNegId, setActiveNegId] = useState<string>(params.negotiationId || params.id || '');
  const [farmerName, setFarmerName] = useState<string>(params.farmerName || params.farmer || 'Ramesh Patel');
  const [cropName, setCropName] = useState<string>(params.cropName || params.crop || 'Produce');
  const [productImage, setProductImage] = useState<string>(params.productImage || params.cropImage || '');

  const parsedRouteItems = React.useMemo(() => {
    if (!params.items) return [];
    try {
      const parsed = typeof params.items === 'string' ? JSON.parse(params.items) : params.items;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.items]);

  const defaultNeg = React.useMemo(() => {
    const p = Number(params.offeredPrice || params.price || params.ratePerKg || 30);
    const q = Number(params.quantity || params.qty || 100);
    const u = params.unit || 'kg';
    return {
      id: activeNegId || `neg_${Date.now()}`,
      cropName: cropName,
      farmerName: farmerName,
      cropImage: productImage,
      originalPrice: Number(params.originalPrice || p * 1.1),
      offeredPrice: p,
      counterPrice: null,
      quantity: q,
      unit: u,
      items: parsedRouteItems,
      status: 'PENDING_FARMER',
    };
  }, [params, activeNegId, cropName, farmerName, productImage, parsedRouteItems]);

  const defaultInitialOfferMsg: ChatItem = React.useMemo(() => {
    const hasItems = parsedRouteItems && parsedRouteItems.length > 0;
    const computedTotal = hasItems
      ? parsedRouteItems.reduce((s: number, it: any) => s + (it.quantity * (it.targetPrice || defaultNeg.offeredPrice)), 0)
      : Math.round(defaultNeg.offeredPrice * defaultNeg.quantity);

    const offerSummaryText = hasItems && parsedRouteItems.length > 1
      ? `Buyer Demanded Products (${parsedRouteItems.length} Items):\n${parsedRouteItems.map((i: any, idx: number) => `• ${i.cropName} (${i.quantity} ${i.unit || 'kg'}): Target ₹${i.targetPrice}/${i.unit || 'kg'}`).join('\n')}\nTotal Budget: ₹${computedTotal.toLocaleString('en-IN')}`
      : `Price Proposal: ₹${defaultNeg.offeredPrice}/${defaultNeg.unit} for ${defaultNeg.quantity} ${defaultNeg.unit}`;

    return {
      id: `msg_init_${activeNegId || Date.now()}`,
      negotiationId: activeNegId || defaultNeg.id,
      senderId: currentUserId,
      senderRole: 'BUYER',
      senderName: currentUserName,
      messageType: 'OFFER',
      text: offerSummaryText,
      price: defaultNeg.offeredPrice,
      quantity: defaultNeg.quantity,
      unit: defaultNeg.unit,
      totalAmount: computedTotal,
      offerStatus: 'PENDING',
      timestamp: new Date().toISOString(),
    };
  }, [activeNegId, defaultNeg, currentUserId, currentUserName, parsedRouteItems]);

  const { activeSavedAddress, currentLocation, currentAddress, fetchCurrentLocation } = useLocation();
  const [negotiation, setNegotiation] = useState<any>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Counter offer modal state
  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterNote, setCounterNote] = useState('');

  // Stripe Advance Payment & OTP Modal State
  const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
  const [advanceStep, setAdvanceStep] = useState<'STRIPE_PAYMENT' | 'OTP_VERIFICATION' | 'CONFIRMED'>('STRIPE_PAYMENT');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardName, setCardName] = useState('Aarav Sharma');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('582914');
  const [stripePaymentId, setStripePaymentId] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [confirmedOrderInfo, setConfirmedOrderInfo] = useState<any>(null);

  const flatRef = useRef<FlatList>(null);
  const isFetchingRef = useRef(false);

  // Load negotiation data
  const loadNegotiation = async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      let targetId = activeNegId;
      if (!targetId) {
        const list = await apiClient.negotiations.listNegotiations();
        if (list && list.length > 0) {
          targetId = list[0].id;
          setActiveNegId(targetId);
        }
      }

      if (targetId) {
        const data = await apiClient.negotiations.getById(targetId);
        if (data) {
          setNegotiation(data);
          if (data.farmerName) setFarmerName(data.farmerName);
          if (data.cropName) setCropName(data.cropName);
          if (data.cropImage) setProductImage(data.cropImage);
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(data.messages);
          }
        }
      }
    } catch (err) {
      if (!silent) console.warn('Failed to load negotiation:', err);
    } finally {
      isFetchingRef.current = false;
      if (!silent) setLoading(false);
    }
  };

  // Mount and real-time polling (every 2s)
  useEffect(() => {
    loadNegotiation(false);
    const interval = setInterval(() => {
      loadNegotiation(true);
    }, 2000);
    return () => clearInterval(interval);
  }, [activeNegId]);

  // Send Text Message
  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;

    const tempId = `msg_b_${Date.now()}`;
    const optimisticMsg: ChatItem = {
      id: tempId,
      negotiationId: activeNegId,
      senderId: currentUserId,
      senderRole: 'BUYER',
      senderName: currentUserName,
      messageType: 'TEXT',
      text: trimmed,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setText('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);

    if (activeNegId) {
      try {
        setSubmitting(true);
        await apiClient.negotiations.sendMessage(activeNegId, trimmed);
        loadNegotiation(true);
      } catch (err) {
        console.warn('Failed to send message:', err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Share Real-time GPS Location with Farmer
  const handleShareLocation = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      let coords = currentLocation;
      if (!coords && fetchCurrentLocation) {
        coords = await fetchCurrentLocation(false);
      }
      const lat = coords?.latitude || activeSavedAddress?.latitude || 18.5204;
      const lon = coords?.longitude || activeSavedAddress?.longitude || 73.8567;
      const addrStr = activeSavedAddress?.formattedAddress || currentAddress?.formattedAddress || 'FC Road, Shivajinagar, Pune, Maharashtra';

      // Distance from Farmer harvest gate (Nashik Farm default: 19.9975, 73.7898)
      const farmerLat = 19.9975;
      const farmerLon = 73.7898;
      const distKm = Math.round(calculateHaversineDistance(
        { latitude: lat, longitude: lon },
        { latitude: farmerLat, longitude: farmerLon }
      ) * 10) / 10;

      const locationPayload = {
        latitude: lat,
        longitude: lon,
        address: addrStr,
        name: currentUserName ? `${currentUserName}'s Delivery Location` : 'Buyer Delivery Location',
        placeType: 'USER_LOCATION' as const,
        distanceKm: distKm,
      };

      const tempId = `msg_loc_${Date.now()}`;
      const optimisticMsg: ChatItem = {
        id: tempId,
        negotiationId: activeNegId,
        senderId: currentUserId,
        senderRole: 'BUYER',
        senderName: currentUserName,
        messageType: 'LOCATION',
        text: `📍 Shared Delivery Location: ${addrStr}`,
        location: locationPayload,
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);

      if (activeNegId) {
        await apiClient.negotiations.sendMessage(
          activeNegId,
          `📍 Shared Delivery Location: ${addrStr}`,
          'LOCATION',
          locationPayload
        );
        loadNegotiation(true);
      }
    } catch (err) {
      console.warn('Failed to share location:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Send Counter Offer
  const handleSendCounter = async () => {
    const priceNum = parseFloat(counterPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid offer price.');
      return;
    }

    try {
      setSubmitting(true);
      const updated = await apiClient.negotiations.respond(
        activeNegId,
        'COUNTER',
        priceNum,
        counterNote
      );
      if (updated) {
        setNegotiation(updated);
        loadNegotiation(true);
      }
      setCounterModalVisible(false);
      setCounterNote('');
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 120);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit counter offer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: Autofill Stripe Test Card
  const fillStripeTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('123');
    setCardName(currentUserName || 'Aarav Sharma');
  };

  const handleCardNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    const parts = clean.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      setCardExpiry(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      setCardExpiry(clean);
    }
  };

  // Step 1: Open Advance Payment Modal (No direct confirmation!)
  const openAdvancePaymentModal = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setEnteredOtp(newOtp);
    setStripePaymentId('');
    setOtpTimer(60);
    setAdvanceStep('STRIPE_PAYMENT');
    setAdvanceModalVisible(true);
  };

  // Step 2: Simulate Stripe Payment authorization then prompt for OTP
  const handleProcessStripeAdvance = () => {
    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 14) {
      Alert.alert('Incomplete Card Number', 'Please enter a valid 16-digit card number or tap "Use Stripe Test Card".');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      Alert.alert('Invalid Expiry', 'Please enter card expiry in MM/YY format (e.g. 12/28).');
      return;
    }
    if (!cardCvc || cardCvc.length < 3) {
      Alert.alert('Invalid CVC', 'Please enter your 3-digit CVV/CVC code.');
      return;
    }

    setIsProcessingStripe(true);
    setTimeout(() => {
      setIsProcessingStripe(false);
      const paymentId = `pi_stripe_deal_${Date.now()}`;
      setStripePaymentId(paymentId);
      setAdvanceStep('OTP_VERIFICATION');
      setOtpTimer(60);
    }, 1000);
  };

  // Step 3: Verify OTP and finalize order creation in shared registry
  const handleVerifyOtpAndConfirmOrder = async () => {
    const targetNeg = negotiation || defaultNeg;
    const targetId = activeNegId || targetNeg?.id;
    if (!targetId || submitting) return;

    const trimmedOtp = enteredOtp.trim();
    if (!trimmedOtp || trimmedOtp.length < 4) {
      Alert.alert('OTP Required', 'Please enter the 6-digit delivery authorization code.');
      return;
    }

    const hasItems = targetNeg.items && targetNeg.items.length > 0;
    const currentPrice = targetNeg.counterPrice || targetNeg.offeredPrice || 30;
    const total = hasItems
      ? targetNeg.items.reduce((s: number, it: any) => s + (it.quantity * (it.farmerPrice || it.targetPrice || currentPrice)), 0)
      : Math.round(currentPrice * (targetNeg.quantity || 1));
    const advance = Math.round(total * 0.3);
    const remaining = total - advance;

    try {
      setSubmitting(true);
      const destAddr =
        activeSavedAddress?.formattedAddress ||
        currentAddress?.formattedAddress ||
        'Selected Delivery Location, Pune';

      const res = await apiClient.negotiations.confirmOrder(targetId, destAddr, {
        advancePaid: advance,
        remainingAmount: remaining,
        paymentMethod: 'STRIPE',
        stripePaymentId: stripePaymentId || `pi_stripe_deal_${Date.now()}`,
        deliveryOtp: trimmedOtp,
        paymentStatus: 'ADVANCE_PAID',
      });

      const ord = res?.order || {
        id: `ord_${Date.now()}`,
        orderNumber: `MK-ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        cropName: targetNeg.cropName || cropName,
        totalAmount: total,
        advancePaid: advance,
        remainingAmount: remaining,
        deliveryOtp: trimmedOtp,
        farmerName: farmerName || 'Ramesh Patel',
      };

      setConfirmedOrderInfo(ord);
      await loadNegotiation(false);
      setAdvanceStep('CONFIRMED');
    } catch (err: any) {
      Alert.alert('Confirmation Error', err?.message || 'Failed to place order. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any = null;
    if (advanceModalVisible && advanceStep === 'OTP_VERIFICATION' && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [advanceModalVisible, advanceStep, otpTimer]);

  // Accept Deal Trigger opens Advance Payment Flow
  const handleAcceptNegotiation = () => {
    openAdvancePaymentModal();
  };

  const effectiveNeg = negotiation || defaultNeg;
  const displayMessages = messages.length > 0 ? messages : [defaultInitialOfferMsg];

  const isAccepted = effectiveNeg?.status === 'ACCEPTED';
  const isPendingBuyerConfirm =
    effectiveNeg?.status === 'PENDING_BUYER_CONFIRMATION' ||
    (!isAccepted &&
      displayMessages.some(
        (m) =>
          m.senderRole === 'FARMER' &&
          (m.offerStatus === 'ACCEPTED' ||
            (m.offerStatus as any) === 'ACCEPTED_BY_FARMER' ||
            m.text?.toLowerCase().includes('accepted the offer') ||
            m.text?.toLowerCase().includes('accepted your offer'))
      ));

  const handleConfirmOrderFromChat = () => {
    openAdvancePaymentModal();
  };

  const openCounterModal = () => {
    if (!effectiveNeg) return;
    setCounterPrice(String(effectiveNeg.counterPrice || effectiveNeg.offeredPrice));
    setCounterNote('');
    setCounterModalVisible(true);
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const currentPrice = effectiveNeg ? effectiveNeg.counterPrice || effectiveNeg.offeredPrice : 0;
  const currentTotal = effectiveNeg
    ? (effectiveNeg.items && effectiveNeg.items.length > 0
        ? effectiveNeg.items.reduce((s: number, it: any) => s + (it.quantity * (it.farmerPrice || it.targetPrice || currentPrice)), 0)
        : Math.round(currentPrice * effectiveNeg.quantity))
    : 0;

  const renderMessage = ({ item }: { item: ChatItem }) => {
    const isMine = item.senderRole === 'BUYER';
    const isSystem = item.messageType === 'SYSTEM' || item.messageType === 'ORDER_EVENT';

    // 1. System / Order Event Message
    if (isSystem) {
      const isOrderEvent = item.messageType === 'ORDER_EVENT';
      return (
        <View style={styles.systemWrap}>
          <View style={[styles.systemPill, isOrderEvent && styles.orderEventPill]}>
            <Ionicons
              name={isOrderEvent ? 'shield-checkmark' : 'information-circle-outline'}
              size={14}
              color={isOrderEvent ? '#15803D' : Colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.systemText, isOrderEvent && styles.orderEventText]}>
              {item.text}
            </Text>
          </View>
        </View>
      );
    }

    // 2. Structured Offer Card
    if (item.messageType === 'OFFER') {
      const isFromFarmer = item.senderRole === 'FARMER';
      const offerAccepted = item.offerStatus === 'ACCEPTED' || isAccepted;
      const offerCountered = item.offerStatus === 'COUNTERED';
      const offerPending = item.offerStatus === 'PENDING' && !isAccepted;

      return (
        <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
          <View style={[styles.negCardWrap, isMine ? styles.negCardMine : styles.negCardTheirs]}>
            <View style={styles.negHeader}>
              <Ionicons name="pricetags" size={16} color={Colors.primary} />
              <Text style={styles.negTitle}>
                {isFromFarmer ? 'FARMER COUNTER OFFER' : 'YOUR PROPOSED OFFER'}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.offerPriceText}>₹{item.price}/{item.unit || 'kg'}</Text>
                <Text style={styles.volumeText}>Volume: {item.quantity} {item.unit || 'kg'}</Text>
              </View>
              <View style={styles.totalCol}>
                <Text style={styles.totalLabel}>Total Value</Text>
                <Text style={styles.totalValue}>₹{(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Action buttons if offer is active and deal not yet finalized */}
            {!isAccepted && (
              <View style={styles.negActions}>
                <TouchableOpacity style={styles.declineBtn} onPress={openCounterModal}>
                  <Text style={styles.declineBtnText}>Counter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptNegotiation} disabled={submitting}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                  <Text style={styles.acceptBtnText}>Accept Deal</Text>
                </TouchableOpacity>
              </View>
            )}

            {offerAccepted && (
              <View style={styles.acceptedBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#15803D" />
                <Text style={styles.acceptedBadgeText}>Deal Accepted • Order Created</Text>
              </View>
            )}

            {offerCountered && (
              <View style={styles.counteredBadge}>
                <Ionicons name="time-outline" size={13} color={Colors.textDisabled} />
                <Text style={styles.counteredBadgeText}>Countered by newer offer</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    // 3. Interactive Location Card (User <-> Farmer Location Sharing)
    if (item.messageType === 'LOCATION' || item.location) {
      const loc = item.location || {
        latitude: item.senderRole === 'FARMER' ? 19.9975 : 18.5204,
        longitude: item.senderRole === 'FARMER' ? 73.7898 : 73.8567,
        name: item.senderRole === 'FARMER' ? `${farmerName}'s Farm Location` : 'Buyer Delivery Point',
        address: item.text.replace(/^📍\s*/, ''),
        placeType: (item.senderRole === 'FARMER' ? 'FARMER_LOCATION' : 'USER_LOCATION') as any,
        distanceKm: 158.4,
      };
      const isFarmerPlace = loc.placeType === 'FARMER_LOCATION' || item.senderRole === 'FARMER';

      const openLocationMap = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.open(url, '_blank');
        } else {
          Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open map'));
        }
      };

      return (
        <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
          <View style={[styles.locCardWrap, isMine ? styles.locCardMine : styles.locCardTheirs]}>
            <View style={styles.locCardHeader}>
              <View style={[styles.locIconBadge, isFarmerPlace ? styles.locIconFarmer : styles.locIconBuyer]}>
                <Ionicons name={isFarmerPlace ? 'leaf' : 'location'} size={15} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locCardTitle}>
                  {isFarmerPlace ? '🌾 FARM PLACE / HARVEST GATE' : '📍 REALTIME DELIVERY GPS'}
                </Text>
                <Text style={styles.locCardSubtitle}>
                  {loc.name || (isFarmerPlace ? `${farmerName}'s Farm` : 'Buyer Location')}
                </Text>
              </View>
              <Text style={styles.locTimestamp}>{formatTime(item.timestamp)}</Text>
            </View>

            <View style={styles.locBody}>
              <Text style={styles.locAddressText} numberOfLines={2}>
                {loc.address || 'Live GPS Coordinates Pin'}
              </Text>
              <View style={styles.locMetaRow}>
                <View style={styles.locCoordBadge}>
                  <Ionicons name="compass-outline" size={12} color="#047857" />
                  <Text style={styles.locCoordText}>
                    {Number(loc.latitude).toFixed(4)}° N, {Number(loc.longitude).toFixed(4)}° E
                  </Text>
                </View>
                {typeof loc.distanceKm === 'number' && (
                  <View style={styles.locDistanceBadge}>
                    <Ionicons name="navigate-outline" size={12} color="#B45309" />
                    <Text style={styles.locDistanceText}>{loc.distanceKm} km away</Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.locMapBtn}
              onPress={openLocationMap}
              activeOpacity={0.85}
            >
              <Ionicons name="map" size={14} color="#FFFFFF" />
              <Text style={styles.locMapBtnText}>Open in GPS Map</Text>
              <Ionicons name="open-outline" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // 4. Standard Text Message Bubble
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMine && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{farmerName?.charAt(0) ?? 'F'}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
            {item.text}
          </Text>
          <View style={styles.bubbleMeta}>
            <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
              {formatTime(item.timestamp)}
            </Text>
            {isMine && (
              <Ionicons
                name={item.isRead ? 'checkmark-done' : 'checkmark'}
                size={12}
                color={item.isRead ? Colors.primary : 'rgba(255,255,255,0.75)'}
                style={{ marginLeft: 3 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{farmerName?.charAt(0) ?? 'F'}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{farmerName}</Text>
            <Text style={styles.headerStatus}>🟢 Verified Farmer • Live Chat</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => Alert.alert('Farmer Contact', `Direct farmgate connect available via MandiKart Escrow.`)}
        >
          <Ionicons name="call-outline" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Product Context Mini Card */}
      {effectiveNeg && (
        <View style={styles.productMiniCard}>
          {productImage ? (
            <Image source={{ uri: productImage }} style={styles.productThumb} />
          ) : (
            <View style={styles.placeholderThumb}>
              <Ionicons name="leaf-outline" size={20} color={Colors.primary} />
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={1}>
              {effectiveNeg.cropName || cropName} {effectiveNeg.grade ? `(Grade ${effectiveNeg.grade})` : ''}
            </Text>
            <Text style={styles.productSubInfo}>
              Qty: <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>{effectiveNeg.quantity} {effectiveNeg.unit}</Text> • Listed: ₹{effectiveNeg.originalPrice}/{effectiveNeg.unit}
            </Text>
          </View>
          <View style={styles.dealPill}>
            <Text style={styles.dealPillLabel}>CURRENT</Text>
            <Text style={styles.dealPillValue}>₹{currentPrice}/{effectiveNeg.unit}</Text>
          </View>
        </View>
      )}

      {/* Multi-Product Demanded Commodities Breakdown Card */}
      {effectiveNeg && effectiveNeg.items && effectiveNeg.items.length > 0 && (
        <View style={styles.buyerMultiDemandCard}>
          <View style={styles.buyerMultiDemandHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="basket" size={16} color="#047857" />
              <Text style={styles.buyerMultiDemandTitle}>
                Demanded Products in this Order ({effectiveNeg.items.length} Items)
              </Text>
            </View>
            <View style={styles.buyerMultiDemandPill}>
              <Text style={styles.buyerMultiDemandPillText}>Multi-Product</Text>
            </View>
          </View>

          <View style={styles.buyerMultiDemandList}>
            {effectiveNeg.items.map((item: any, idx: number) => {
              const itemRate = Number(item.farmerPrice || item.targetPrice || effectiveNeg.offeredPrice || 0);
              const itemTotal = Math.round(Number(item.quantity || 0) * itemRate);
              return (
                <View key={item.id || idx} style={styles.buyerMultiDemandRow}>
                  <View style={styles.buyerMultiDemandBadge}>
                    <Text style={styles.buyerMultiDemandIndex}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.buyerMultiDemandItemName} numberOfLines={1}>
                      {item.cropName} {item.variety ? `• ${item.variety}` : ''}
                    </Text>
                    <Text style={styles.buyerMultiDemandItemMeta}>
                      {item.quantity} {item.unit || 'kg'} • Grade {item.grade || 'A'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                    <Text style={styles.buyerMultiDemandRate}>₹{itemRate}/{item.unit || 'kg'}</Text>
                    <Text style={styles.buyerMultiDemandTotal}>₹{itemTotal.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Sticky Active Deal Banner with Fast Accept/Counter Actions */}
      {effectiveNeg && (
        <View style={[styles.activeDealBanner, isAccepted && styles.activeDealBannerAccepted]}>
          <View style={styles.dealBannerInfoCol}>
            <Text style={styles.dealBannerLabel}>
              {isAccepted ? 'DEAL ACCEPTED • ORDER CONFIRMED' : 'ACTIVE NEGOTIATION OFFER'}
            </Text>
            <Text style={styles.dealBannerValue}>
              ₹{currentPrice}/{effectiveNeg.unit} • {effectiveNeg.quantity} {effectiveNeg.unit} = ₹{currentTotal.toLocaleString('en-IN')}
            </Text>
          </View>

          {!isAccepted && (
            <View style={styles.dealBannerActions}>
              <TouchableOpacity style={styles.dealBannerCounterBtn} onPress={openCounterModal}>
                <Text style={styles.dealBannerCounterText}>Counter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dealBannerAcceptBtn}
                onPress={handleAcceptNegotiation}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    <Text style={styles.dealBannerAcceptText}>Accept Deal</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {isAccepted && (
            <TouchableOpacity
              style={styles.dealBannerOrdersBtn}
              onPress={() => (navigation as any).navigate('Main', { screen: 'Orders' })}
            >
              <Text style={styles.dealBannerOrdersText}>View in Orders</Text>
              <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {loading && !effectiveNeg ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              aria-label="Loading chat history"
              accessibilityLabel="Loading chat history"
            />
            <Text style={styles.loadingText}>Connecting to negotiation thread...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={displayMessages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.msgList}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Farmer Acceptance & Pending Buyer Confirmation Card */}
        {isPendingBuyerConfirm && !isAccepted && (
          <View style={styles.pendingConfirmCard}>
            <View style={styles.pendingConfirmHeader}>
              <View style={styles.sparkleBadge}>
                <Ionicons name="sparkles" size={16} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingConfirmTitle}>Farmer Accepted Your Deal! 🌾</Text>
                <Text style={styles.pendingConfirmSub}>
                  ₹{currentPrice}/{effectiveNeg?.unit || 'kg'} • {effectiveNeg?.quantity || 100} {effectiveNeg?.unit || 'kg'}
                </Text>
              </View>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeLabel}>DEAL TOTAL</Text>
                <Text style={styles.totalBadgeVal}>₹{currentTotal.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <View style={styles.addressPillRow}>
              <Ionicons name="location-sharp" size={14} color={Colors.primary} />
              <Text style={styles.addressPillText} numberOfLines={1}>
                Deliver to: {activeSavedAddress?.formattedAddress || 'Your Saved Delivery Address'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.confirmOrderBtn}
              onPress={handleConfirmOrderFromChat}
              disabled={submitting}
              activeOpacity={0.88}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={19} color={Colors.white} />
                  <Text style={styles.confirmOrderBtnText}>
                    Confirm & Place Order (₹{currentTotal.toLocaleString('en-IN')})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Deal Finalized & Placed Order Card */}
        {isAccepted && (
          <View style={[styles.pendingConfirmCard, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
            <View style={styles.pendingConfirmHeader}>
              <View style={[styles.sparkleBadge, { backgroundColor: '#16A34A' }]}>
                <Ionicons name="checkmark-done-circle" size={18} color={Colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pendingConfirmTitle, { color: '#15803D' }]}>
                  Deal Finalized & Order Placed! 🎉
                </Text>
                <Text style={styles.pendingConfirmSub}>
                  ₹{currentPrice}/{effectiveNeg?.unit || 'kg'} • {effectiveNeg?.quantity || 1} {effectiveNeg?.unit || 'kg'} = ₹{currentTotal.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.confirmOrderBtn, { flex: 1, backgroundColor: '#15803D' }]}
                onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Orders' })}
                activeOpacity={0.88}
              >
                <Ionicons name="receipt-outline" size={17} color={Colors.white} />
                <Text style={styles.confirmOrderBtnText}>View My Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmOrderBtn, { flex: 1, backgroundColor: '#059669' }]}
                onPress={() => {
                  (navigation as any).navigate('CheckoutStack', {
                    screen: 'Payment',
                    params: {
                      amount: currentTotal,
                      total: currentTotal,
                      isNegotiated: true,
                      negotiation: effectiveNeg,
                      items: [
                        {
                          id: effectiveNeg?.productId || 'prod_neg',
                          productId: effectiveNeg?.productId || 'prod_neg',
                          cropName: effectiveNeg?.cropName || cropName,
                          grade: effectiveNeg?.grade || 'A',
                          quantity: effectiveNeg?.quantity || 1,
                          unit: effectiveNeg?.unit || 'kg',
                          pricePerUnit: currentPrice,
                          subtotal: currentTotal,
                          imageUrl: productImage || effectiveNeg?.cropImage || '',
                        },
                      ],
                      recipientName: currentUserName,
                      deliveryAddress: activeSavedAddress?.formattedAddress || 'Selected Delivery Location',
                    },
                  });
                }}
                activeOpacity={0.88}
              >
                <Ionicons name="card-outline" size={17} color={Colors.white} />
                <Text style={styles.confirmOrderBtnText}>Pay / Checkout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.offerButton}
            onPress={openCounterModal}
            disabled={isAccepted}
          >
            <Ionicons
              name="repeat"
              size={18}
              color={isAccepted ? Colors.textDisabled : Colors.primary}
            />
            <Text style={[styles.offerButtonText, isAccepted && { color: Colors.textDisabled }]}>
              Counter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.locShareBtn}
            onPress={handleShareLocation}
            disabled={submitting}
            accessibilityLabel="Share Realtime Location with Farmer"
          >
            <Ionicons name="location" size={19} color="#059669" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={isAccepted ? 'Deal accepted • Order created' : 'Type a message...'}
            placeholderTextColor={Colors.textDisabled}
            multiline
            editable={!isAccepted}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || isAccepted) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!text.trim() || isAccepted || submitting}
          >
            <Ionicons name="send" size={17} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ========================================================================= */}
      {/* BUYER COUNTER OFFER MODAL                                                 */}
      {/* ========================================================================= */}
      <Modal
        visible={counterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCounterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Counter Offer to Farmer</Text>
                <Text style={styles.modalSub}>
                  Propose your revised target price to {farmerName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCounterModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>Target Price (₹ / {negotiation?.unit || 'kg'})</Text>
            <TextInput
              style={styles.modalTextInput}
              keyboardType="numeric"
              value={counterPrice}
              onChangeText={setCounterPrice}
              placeholder="e.g. 23.5"
            />

            <Text style={[styles.modalInputLabel, { marginTop: 12 }]}>Note for Farmer (Optional)</Text>
            <TextInput
              style={styles.modalTextArea}
              multiline
              numberOfLines={2}
              value={counterNote}
              onChangeText={setCounterNote}
              placeholder="e.g. Can do immediate farmgate pickup if price is agreed."
            />

            {(() => {
              const p = parseFloat(counterPrice) || 0;
              const q = negotiation?.quantity || 1;
              const tot = Math.round(p * q);
              return (
                <View style={styles.projectedBox}>
                  <Text style={styles.projectedLabel}>Projected Deal Total:</Text>
                  <Text style={styles.projectedVal}>₹{tot.toLocaleString('en-IN')}</Text>
                </View>
              );
            })()}

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCounterModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSendCounter}
                disabled={submitting}
              >
                <Text style={styles.modalSubmitBtnText}>Send Counter Offer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* ========================================================================= */}
      {/* ADVANCE PAYMENT WITH STRIPE & DELIVERY OTP MODAL                           */}
      {/* ========================================================================= */}
      <Modal
        visible={advanceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (advanceStep !== 'CONFIRMED') setAdvanceModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.advanceModalSheet}>
            {/* Modal Header */}
            <View style={styles.advanceModalHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.advanceBadgeRow}>
                  <Ionicons name="shield-checkmark" size={14} color="#047857" />
                  <Text style={styles.advanceBadgeText}>
                    {advanceStep === 'STRIPE_PAYMENT'
                      ? 'STRIPE ESCROW ADVANCE PAYMENT'
                      : advanceStep === 'OTP_VERIFICATION'
                      ? 'SECURE DELIVERY AUTHORIZATION'
                      : 'ORDER CONFIRMED & TRACKING READY'}
                  </Text>
                </View>
                <Text style={styles.advanceModalTitle}>
                  {advanceStep === 'STRIPE_PAYMENT'
                    ? 'Advance Payment via Stripe'
                    : advanceStep === 'OTP_VERIFICATION'
                    ? 'Verify Delivery Authorization OTP'
                    : 'Order Confirmed! 🎉'}
                </Text>
              </View>

              {advanceStep !== 'CONFIRMED' && (
                <TouchableOpacity
                  onPress={() => setAdvanceModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {/* PHASE 1: STRIPE ADVANCE PAYMENT */}
              {advanceStep === 'STRIPE_PAYMENT' && (
                <>
                  {/* Deal Summary Box */}
                  {(() => {
                    const targetNeg = negotiation || defaultNeg;
                    const curPrice = targetNeg.counterPrice || targetNeg.offeredPrice || 30;
                    const qty = targetNeg.quantity || 1;
                    const tot = Math.round(curPrice * qty);
                    const adv = Math.round(tot * 0.3);
                    const rem = tot - adv;

                    return (
                      <View style={styles.dealSummaryCard}>
                        <View style={styles.dealCropHeader}>
                          <Image
                            source={{ uri: productImage || targetNeg.cropImage || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200' }}
                            style={styles.dealCropImage}
                          />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.dealCropTitle}>{targetNeg.cropName || cropName}</Text>
                            <Text style={styles.dealCropSub}>
                              Agreed: ₹{curPrice}/{targetNeg.unit || 'kg'} • {qty} {targetNeg.unit || 'kg'}
                            </Text>
                            <Text style={styles.dealFarmerTag}>Farmer: {farmerName}</Text>
                          </View>
                        </View>

                        <View style={styles.dealDivider} />

                        <View style={styles.dealSummaryRow}>
                          <Text style={styles.dealSummaryLabel}>Total Produce Deal Value</Text>
                          <Text style={styles.dealSummaryVal}>₹{tot.toLocaleString('en-IN')}</Text>
                        </View>

                        <View style={[styles.dealSummaryRow, { marginTop: 6 }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="checkmark-circle" size={14} color="#059669" />
                            <Text style={[styles.dealSummaryLabel, { fontWeight: '700', color: '#065F46' }]}>
                              30% Advance Token (Pay Now)
                            </Text>
                          </View>
                          <Text style={[styles.dealSummaryVal, { color: '#059669', fontWeight: '800' }]}>
                            ₹{adv.toLocaleString('en-IN')}
                          </Text>
                        </View>

                        <View style={[styles.dealSummaryRow, { marginTop: 6 }]}>
                          <Text style={styles.dealSummaryLabel}>70% Balance on Delivery</Text>
                          <Text style={[styles.dealSummaryVal, { color: '#D97706', fontWeight: '700' }]}>
                            ₹{rem.toLocaleString('en-IN')}
                          </Text>
                        </View>

                        <View style={styles.dealPolicyBox}>
                          <Ionicons name="information-circle-outline" size={14} color="#1E40AF" />
                          <Text style={styles.dealPolicyText}>
                            Advance payment is held in MandiKart safe escrow. It is released to the farmer only after you verify the produce at delivery.
                          </Text>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Stripe Card Input Form */}
                  <View style={styles.stripeBox}>
                    <View style={styles.stripeHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="card" size={18} color="#6366F1" />
                        <Text style={styles.stripeFormTitle}>Credit / Debit Card</Text>
                      </View>
                      <TouchableOpacity onPress={fillStripeTestCard} style={styles.testCardPill}>
                        <Ionicons name="flash" size={12} color="#4338CA" />
                        <Text style={styles.testCardPillText}>Use Stripe Test Card</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.stripeInputLabel}>Card Number</Text>
                    <TextInput
                      style={styles.stripeTextInput}
                      value={cardNumber}
                      onChangeText={handleCardNumberChange}
                      keyboardType="numeric"
                      placeholder="4242 4242 4242 4242"
                      placeholderTextColor="#94A3B8"
                    />

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stripeInputLabel}>Expires (MM/YY)</Text>
                        <TextInput
                          style={styles.stripeTextInput}
                          value={cardExpiry}
                          onChangeText={handleExpiryChange}
                          keyboardType="numeric"
                          placeholder="12/28"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.stripeInputLabel}>CVC / CVV</Text>
                        <TextInput
                          style={styles.stripeTextInput}
                          value={cardCvc}
                          onChangeText={(v) => setCardCvc(v.slice(0, 4))}
                          keyboardType="numeric"
                          placeholder="123"
                          placeholderTextColor="#94A3B8"
                          secureTextEntry
                        />
                      </View>
                    </View>

                    <Text style={[styles.stripeInputLabel, { marginTop: 10 }]}>Cardholder Name</Text>
                    <TextInput
                      style={styles.stripeTextInput}
                      value={cardName}
                      onChangeText={setCardName}
                      placeholder="Aarav Sharma"
                      placeholderTextColor="#94A3B8"
                    />

                    <View style={styles.stripeTrustRow}>
                      <Ionicons name="lock-closed" size={13} color="#64748B" />
                      <Text style={styles.stripeTrustText}>Secured by Stripe 256-bit AES encryption</Text>
                    </View>
                  </View>

                  {/* Submit Stripe Payment CTA */}
                  {(() => {
                    const targetNeg = negotiation || defaultNeg;
                    const hasItems = targetNeg.items && targetNeg.items.length > 0;
                    const curPrice = targetNeg.counterPrice || targetNeg.offeredPrice || 30;
                    const tot = hasItems
                      ? targetNeg.items.reduce((s: number, it: any) => s + (it.quantity * (it.farmerPrice || it.targetPrice || curPrice)), 0)
                      : Math.round(curPrice * (targetNeg.quantity || 1));
                    const adv = Math.round(tot * 0.3);

                    return (
                      <TouchableOpacity
                        style={styles.stripePayBtn}
                        onPress={handleProcessStripeAdvance}
                        disabled={isProcessingStripe}
                        activeOpacity={0.88}
                      >
                        {isProcessingStripe ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="logo-usd" size={17} color="#FFFFFF" />
                            <Text style={styles.stripePayBtnText}>
                              Pay ₹{adv.toLocaleString('en-IN')} Advance via Stripe
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    );
                  })()}
                </>
              )}

              {/* PHASE 2: OTP VERIFICATION */}
              {advanceStep === 'OTP_VERIFICATION' && (
                <>
                  <View style={styles.advanceSuccessStrip}>
                    <Ionicons name="checkmark-circle" size={18} color="#059669" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.advanceSuccessTitle}>
                        Advance Payment Authorized via Stripe!
                      </Text>
                      <Text style={styles.advanceSuccessSub}>
                        Ref ID: {stripePaymentId || `pi_stripe_${Date.now()}`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.otpCardBox}>
                    <Text style={styles.otpCardHeaderTitle}>Delivery Authorization Code</Text>
                    <Text style={styles.otpCardHeaderSub}>
                      We sent a 6-digit verification code to your registered mobile number (+91 98765 43210).
                    </Text>

                    {/* 6 Digit Display */}
                    <View style={styles.otpDigitRow}>
                      {(enteredOtp || generatedOtp).slice(0, 6).split('').map((digit, idx) => (
                        <View key={idx} style={styles.otpSingleBox}>
                          <Text style={styles.otpSingleText}>{digit}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Editable input / auto-fill */}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <TextInput
                        style={styles.otpInputField}
                        value={enteredOtp}
                        onChangeText={setEnteredOtp}
                        keyboardType="numeric"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        placeholderTextColor="#94A3B8"
                      />
                      <TouchableOpacity
                        style={styles.autofillOtpBtn}
                        onPress={() => setEnteredOtp(generatedOtp)}
                      >
                        <Ionicons name="flash" size={13} color="#15803D" />
                        <Text style={styles.autofillOtpBtnText}>Autofill</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.otpTimerRow}>
                      <Text style={styles.otpTimerText}>
                        {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Code expired'}
                      </Text>
                      {otpTimer === 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                            setGeneratedOtp(newOtp);
                            setEnteredOtp(newOtp);
                            setOtpTimer(60);
                          }}
                        >
                          <Text style={styles.resendLinkText}>Resend OTP</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.otpWarningNotice}>
                      <Ionicons name="alert-circle" size={16} color="#B45309" />
                      <Text style={styles.otpWarningNoticeText}>
                        Keep this OTP secure! You must share this 6-digit code with the delivery executive only after physical inspection of produce freshness.
                      </Text>
                    </View>
                  </View>

                  {/* Verify & Confirm Order CTA */}
                  <TouchableOpacity
                    style={styles.verifyOtpBtn}
                    onPress={handleVerifyOtpAndConfirmOrder}
                    disabled={submitting}
                    activeOpacity={0.88}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                        <Text style={styles.verifyOtpBtnText}>Verify OTP & Confirm Order</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* PHASE 3: ORDER CONFIRMED & TRACKING READY */}
              {advanceStep === 'CONFIRMED' && (
                <View style={styles.confirmedContainer}>
                  <View style={styles.confirmedIconCircle}>
                    <Ionicons name="checkmark-done" size={38} color="#FFFFFF" />
                  </View>
                  <Text style={styles.confirmedMainTitle}>Order Confirmed & Placed!</Text>
                  <Text style={styles.confirmedOrderNum}>
                    {confirmedOrderInfo?.orderNumber || '#MK-ORD-CONFIRMED'}
                  </Text>
                  <Text style={styles.confirmedSubText}>
                    Your advance payment was successfully escrowed via Stripe. The farmer has been notified to harvest and pack your lot.
                  </Text>

                  {/* Summary Sheet */}
                  <View style={styles.confirmedDetailsBox}>
                    <View style={styles.confirmedRow}>
                      <Text style={styles.confirmedLabel}>Produce</Text>
                      <Text style={styles.confirmedVal}>{confirmedOrderInfo?.cropName || cropName}</Text>
                    </View>
                    <View style={styles.confirmedRow}>
                      <Text style={styles.confirmedLabel}>Advance Paid via Stripe</Text>
                      <Text style={[styles.confirmedVal, { color: '#059669', fontWeight: '800' }]}>
                        ₹{confirmedOrderInfo?.advancePaid?.toLocaleString('en-IN') || 'Paid'} ✓
                      </Text>
                    </View>
                    <View style={styles.confirmedRow}>
                      <Text style={styles.confirmedLabel}>Remaining Due on Delivery</Text>
                      <Text style={[styles.confirmedVal, { color: '#D97706', fontWeight: '700' }]}>
                        ₹{confirmedOrderInfo?.remainingAmount?.toLocaleString('en-IN') || 'Payable on Delivery'}
                      </Text>
                    </View>
                    <View style={styles.confirmedRow}>
                      <Text style={styles.confirmedLabel}>Delivery Handover OTP</Text>
                      <Text style={[styles.confirmedVal, { color: '#B45309', fontWeight: '800', letterSpacing: 1 }]}>
                        {confirmedOrderInfo?.deliveryOtp || enteredOtp || generatedOtp}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <TouchableOpacity
                    style={styles.trackOrderDirectBtn}
                    onPress={() => {
                      setAdvanceModalVisible(false);
                      const ord = confirmedOrderInfo;
                      navigation.navigate('OrderTracking', {
                        orderId: ord?.orderNumber || ord?.id,
                        order: ord,
                        deliveryOtp: ord?.deliveryOtp || enteredOtp,
                      });
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="location" size={18} color="#FFFFFF" />
                    <Text style={styles.trackOrderDirectBtnText}>Track Order Live</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.viewOrdersSecondaryBtn}
                    onPress={() => {
                      setAdvanceModalVisible(false);
                      (navigation as any).navigate('Main', { screen: 'Orders' });
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="receipt-outline" size={17} color="#059669" />
                    <Text style={styles.viewOrdersSecondaryBtnText}>View in My Orders</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.stayInChatBtn}
                    onPress={() => setAdvanceModalVisible(false)}
                  >
                    <Text style={styles.stayInChatBtnText}>Done / Back to Chat</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: '#FFFFFF',
  },
  backBtn: { marginRight: Spacing.sm },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  headerName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  headerStatus: { fontSize: 11, color: '#047857', marginTop: 1 },
  callBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  productMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  productThumb: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: Colors.gray100,
  },
  placeholderThumb: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  productSubInfo: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dealPill: {
    alignItems: 'flex-end',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dealPillLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.primary,
  },
  dealPillValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  msgList: { padding: Spacing.md, gap: Spacing.sm },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  avatarText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 3,
  },
  bubbleTheirs: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 3,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: Colors.white },
  bubbleTextTheirs: { color: Colors.textPrimary },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  bubbleTime: { fontSize: 10 },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.75)' },
  bubbleTimeTheirs: { color: Colors.textDisabled },
  systemWrap: {
    alignItems: 'center',
    marginVertical: 4,
  },
  systemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    maxWidth: '90%',
  },
  orderEventPill: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  systemText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  orderEventText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  negCardWrap: {
    width: '85%',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    gap: 8,
    ...Shadows.sm,
  },
  negCardMine: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  negCardTheirs: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  negHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  negTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  offerPriceText: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
  },
  volumeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  totalCol: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 1,
  },
  negActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 4,
  },
  declineBtn: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  acceptBtn: {
    flex: 1.6,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    marginTop: 4,
  },
  acceptedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  counteredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.gray100,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  counteredBadgeText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: '#FFFFFF',
    gap: Spacing.sm,
  },
  offerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    height: 42,
    borderRadius: 21,
    gap: 4,
    marginBottom: 2,
  },
  offerButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: Colors.gray50,
    borderRadius: 21,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: 8,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: Colors.gray200 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
    backgroundColor: Colors.gray100,
    borderRadius: 16,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  modalTextInput: {
    height: 44,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalTextArea: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 50,
  },
  projectedBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: BorderRadius.md,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  projectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  projectedVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalSubmitBtn: {
    flex: 2,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  pendingConfirmCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: '#F0FDF4',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    ...Shadows.md,
  },
  pendingConfirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sparkleBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingConfirmTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14532D',
  },
  pendingConfirmSub: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
  },
  totalBadge: {
    alignItems: 'flex-end',
  },
  totalBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#166534',
  },
  totalBadgeVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#15803D',
  },
  addressPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    marginVertical: Spacing.xs,
  },
  addressPillText: {
    fontSize: 11,
    color: '#14532D',
    fontWeight: '500',
    flex: 1,
  },
  confirmOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 11,
    borderRadius: BorderRadius.md,
    marginTop: 4,
    ...Shadows.sm,
  },
  confirmOrderBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  activeDealBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  activeDealBannerAccepted: {
    backgroundColor: '#ECFDF5',
    borderBottomColor: '#A7F3D0',
  },
  dealBannerInfoCol: {
    flex: 1,
  },
  dealBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dealBannerValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 1,
  },
  dealBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dealBannerCounterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  dealBannerCounterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  dealBannerAcceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  dealBannerAcceptText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  dealBannerOrdersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#15803D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  dealBannerOrdersText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  locShareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginRight: 6,
  },
  locCardWrap: {
    width: 280,
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1.5,
  },
  locCardMine: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  locCardTheirs: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FDE047',
  },
  locCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locIconFarmer: {
    backgroundColor: '#16A34A',
  },
  locIconBuyer: {
    backgroundColor: '#0284C7',
  },
  locCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 0.5,
  },
  locCardSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  locTimestamp: {
    fontSize: 10,
    color: Colors.textDisabled,
  },
  locBody: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: BorderRadius.md,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  locAddressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 16,
  },
  locMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  locCoordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  locCoordText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
  },
  locDistanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  locDistanceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  locMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  locMapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },

  // Advance Payment & OTP Modal Styles
  advanceModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    maxHeight: '92%',
    ...Shadows.lg,
  },
  advanceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  advanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  advanceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.6,
  },
  advanceModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Deal Summary Box
  dealSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  dealCropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dealCropImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  dealCropTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  dealCropSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    marginTop: 1,
  },
  dealFarmerTag: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  dealDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  dealSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dealSummaryLabel: {
    fontSize: 12,
    color: '#475569',
  },
  dealSummaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  dealPolicyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  dealPolicyText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 15,
  },

  // Stripe Card Form
  stripeBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
  },
  stripeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stripeFormTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  testCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  testCardPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  stripeInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  stripeTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  stripeTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
  },
  stripeTrustText: {
    fontSize: 10,
    color: '#64748B',
  },
  stripePayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4338CA',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    ...Shadows.md,
  },
  stripePayBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Phase 2: OTP Verification
  advanceSuccessStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
  },
  advanceSuccessTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  advanceSuccessSub: {
    fontSize: 10,
    color: '#047857',
    marginTop: 1,
  },
  otpCardBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  otpCardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  otpCardHeaderSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  otpDigitRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 14,
  },
  otpSingleBox: {
    width: 40,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  otpSingleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#047857',
  },
  otpInputField: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  autofillOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  autofillOtpBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  otpTimerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  otpTimerText: {
    fontSize: 11,
    color: '#64748B',
  },
  resendLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  otpWarningNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 9,
    marginTop: 12,
  },
  otpWarningNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 15,
  },
  verifyOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    ...Shadows.md,
  },
  verifyOtpBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Phase 3: Confirmed & Tracking Ready
  confirmedContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  confirmedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...Shadows.md,
  },
  confirmedMainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  confirmedOrderNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  confirmedSubText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 17,
  },
  confirmedDetailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 14,
    gap: 8,
  },
  confirmedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmedLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  confirmedVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  trackOrderDirectBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 13,
    marginBottom: 8,
    ...Shadows.md,
  },
  trackOrderDirectBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewOrdersSecondaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: BorderRadius.lg,
    paddingVertical: 11,
    marginBottom: 8,
  },
  viewOrdersSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  stayInChatBtn: {
    paddingVertical: 6,
  },
  stayInChatBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  buyerMultiDemandCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginTop: 6,
    marginBottom: 4,
  },
  buyerMultiDemandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  buyerMultiDemandTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#065F46',
  },
  buyerMultiDemandPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  buyerMultiDemandPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  buyerMultiDemandList: {
    gap: 6,
  },
  buyerMultiDemandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  buyerMultiDemandBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  buyerMultiDemandIndex: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  buyerMultiDemandItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  buyerMultiDemandItemMeta: {
    fontSize: 10.5,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  buyerMultiDemandRate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  buyerMultiDemandTotal: {
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

