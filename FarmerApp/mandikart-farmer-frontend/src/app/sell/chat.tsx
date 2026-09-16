/**
 * MandiKart Farmer App — WhatsApp-Style Negotiation Chat Screen
 * 
 * Enables real-time, interactive price & volume negotiations between Farmer and Buyer.
 * Features:
 * - Product mini-context card
 * - Sticky Current Offer banner with fast accept/counter actions
 * - WhatsApp-style chat bubbles (Farmer: right/green, Buyer: left/white)
 * - Structured Offer Cards with total ₹ value and accept/counter buttons
 * - Chat composer with text input, send, and "Offer" modal
 * - Continuous 2-second background polling for real-time sync
 * - Atomic order handoff on acceptance
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
  ArrowLeft,
  Send,
  Check,
  CheckCheck,
  Repeat,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Package,
  X,
  Phone,
  AlertCircle,
} from 'lucide-react-native';
import { useSellStore } from '../../store/sellStore';
import { useProduceStore } from '../../store/produceStore';
import { useAuthStore } from '../../store/authStore';
import { resolveFarmerApiBaseUrl } from '../../services/apiClient';


interface ChatMessage {
  id: string;
  negotiationId: string;
  senderId: string;
  senderRole: 'BUYER' | 'FARMER' | 'SYSTEM';
  senderName: string;
  messageType: 'TEXT' | 'OFFER' | 'SYSTEM' | 'ORDER_EVENT';
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
}

interface NegotiationDetail {
  id: string;
  productId: string;
  cropName: string;
  cropImage?: string;
  grade?: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  buyerCompany?: string;
  originalPrice: number;
  offeredPrice: number;
  counterPrice?: number | null;
  quantity: number;
  unit: string;
  status: 'PENDING_FARMER' | 'COUNTER_OFFERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  remarks?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  messages: ChatMessage[];
  updatedAt: string;
}

export default function FarmerNegotiationChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    negotiationId?: string;
    buyerName?: string;
    buyer?: string;
    cropName?: string;
    crop?: string;
    price?: string;
    ratePerKg?: string;
    quantity?: string;
    qty?: string;
    unit?: string;
  }>();
  const negotiationId = params.id || params.negotiationId || 'neg_101';
  const effectiveBuyerName = params.buyerName || params.buyer || 'Verified Buyer';
  const effectiveCropName = params.cropName || params.crop || 'Fresh Produce';
  const effectivePrice = Number(params.price || params.ratePerKg || 30);
  const effectiveQty = Number(params.quantity || params.qty || 100);
  const effectiveUnit = params.unit || 'kg';

  const defaultNeg: NegotiationDetail = useMemo(() => ({
    id: negotiationId,
    productId: 'prod_default',
    cropName: effectiveCropName,
    farmerId: useAuthStore.getState().user?.id || 'd1111111-1111-1111-1111-111111111111',
    farmerName: 'Ramesh Patel',
    buyerId: 'buyer_default_01',
    buyerName: effectiveBuyerName,
    originalPrice: effectivePrice,
    offeredPrice: effectivePrice,
    counterPrice: null,
    quantity: effectiveQty,
    unit: effectiveUnit,
    status: 'PENDING_FARMER',
    messages: [],
    updatedAt: new Date().toISOString(),
  }), [negotiationId, effectiveCropName, effectiveBuyerName, effectivePrice, effectiveQty, effectiveUnit]);

  const defaultInitialOfferMsg: ChatMessage = useMemo(() => ({
    id: `msg_init_${negotiationId}`,
    negotiationId,
    senderId: 'buyer_default_01',
    senderRole: 'BUYER',
    senderName: effectiveBuyerName,
    messageType: 'OFFER',
    text: `Buyer Offer: ₹${effectivePrice}/${effectiveUnit} for ${effectiveQty} ${effectiveUnit}`,
    price: effectivePrice,
    quantity: effectiveQty,
    unit: effectiveUnit,
    totalAmount: Math.round(effectivePrice * effectiveQty),
    offerStatus: 'PENDING',
    timestamp: new Date().toISOString(),
  }), [negotiationId, effectiveBuyerName, effectivePrice, effectiveQty, effectiveUnit]);

  const [negotiation, setNegotiation] = useState<NegotiationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Counter offer modal state
  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQty, setCounterQty] = useState('');
  const [counterNote, setCounterNote] = useState('');

  const flatListRef = useRef<FlatList>(null);
  const isFetchingRef = useRef(false);

  // Fetch negotiation details & messages
  const fetchNegotiation = async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const apiBase = resolveFarmerApiBaseUrl();
      const token = useAuthStore.getState().token || '';
      const res = await fetch(`${apiBase}/negotiations/${negotiationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.data) {
        setNegotiation(json.data);
        if (Array.isArray(json.data.messages)) {
          setMessages(json.data.messages);
        }
      }
    } catch (err) {
      if (!silent) console.warn('Failed to fetch negotiation:', err);
    } finally {
      isFetchingRef.current = false;
      if (!silent) setLoading(false);
    }
  };

  // On mount and polling interval (every 2s) for real-time WhatsApp-style updates
  useEffect(() => {
    fetchNegotiation(false);
    const timer = setInterval(() => {
      fetchNegotiation(true);
    }, 2000);
    return () => clearInterval(timer);
  }, [negotiationId]);

  // Send Text Message
  const handleSendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || submitting) return;

    const tempMsgId = `msg_f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const currentFarmerId = useAuthStore.getState().user?.id || useAuthStore.getState().farmer?.id || 'farmer_primary';
    const optimisticMsg: ChatMessage = {
      id: tempMsgId,
      negotiationId,
      senderId: currentFarmerId,
      senderRole: 'FARMER',
      senderName: 'Farmer (You)',
      messageType: 'TEXT',
      text: trimmed,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      setSubmitting(true);
      const apiBase = resolveFarmerApiBaseUrl();
      const token = useAuthStore.getState().token || '';
      const res = await fetch(`${apiBase}/negotiations/${negotiationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': `idemp-msg-${Date.now()}`,
        },
        body: JSON.stringify({
          text: trimmed,
          messageId: tempMsgId,
        }),
      });
      const json = await res.json();
      if (json.data) {
        // Reconcile
        fetchNegotiation(true);
      }
    } catch (e) {
      Alert.alert('Message Error', 'Failed to send message. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  // Send Counter Offer
  const handleSendCounterOffer = async () => {
    const priceNum = parseFloat(counterPrice);
    const qtyNum = parseInt(counterQty, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price per kg.');
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
      return;
    }

    try {
      setSubmitting(true);
      const apiBase = resolveFarmerApiBaseUrl();
      const token = useAuthStore.getState().token || '';
      const res = await fetch(`${apiBase}/negotiations/${negotiationId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': `idemp-cnt-${Date.now()}`,
        },
        body: JSON.stringify({
          action: 'COUNTER',
          counterPrice: priceNum,
          counterQty: qtyNum,
          message: counterNote,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setNegotiation(json.data);
        if (Array.isArray(json.data.messages)) {
          setMessages(json.data.messages);
        }
        setCounterModalVisible(false);
        setCounterNote('');
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not send counter offer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Accept Offer
  const executeAcceptOffer = async () => {
    if (!effectiveNegotiation) return;
    const currentPrice = effectiveNegotiation.counterPrice || effectiveNegotiation.offeredPrice;
    const total = Math.round(currentPrice * effectiveNegotiation.quantity);

    try {
      setSubmitting(true);
      const apiBase = resolveFarmerApiBaseUrl();
      const token = useAuthStore.getState().token || '';
      const res = await fetch(`${apiBase}/negotiations/${negotiationId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': `idemp-acc-${Date.now()}`,
        },
        body: JSON.stringify({
          action: 'ACCEPT',
          deliveryAddress: 'Farmgate Direct Collection Point',
        }),
      });
      const json = await res.json();
      if (json.data) {
        setNegotiation(json.data);
        await fetchNegotiation(false);

        const noticeMsg = `Offer Accepted! 🌾\n\nYou accepted the deal (₹${currentPrice}/${effectiveNegotiation.unit} for ${effectiveNegotiation.quantity} ${effectiveNegotiation.unit} • Total ₹${total.toLocaleString('en-IN')}).\n\nThe buyer has been notified in their chat to confirm and submit their delivery address.\n\nOnce the buyer confirms, this order will appear in your Orders > Pending section for dispatch!`;

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert(noticeMsg);
        } else {
          Alert.alert(
            'Offer Accepted! 🌾',
            `You have accepted the offer (₹${currentPrice}/${effectiveNegotiation.unit} for ${effectiveNegotiation.quantity} ${effectiveNegotiation.unit}).\n\nThe buyer has been notified in their chat to confirm and submit their delivery address. Once confirmed, it will appear in your Orders Pending section.`,
            [
              {
                text: 'View Orders',
                onPress: () => router.push('/(tabs)/orders'),
              },
              { text: 'Stay Here' },
            ]
          );
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to accept deal.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Acceptance Error: ${errMsg}`);
      } else {
        Alert.alert('Acceptance Error', errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Accept Offer Trigger
  const handleAcceptOffer = () => {
    if (!effectiveNegotiation || submitting) return;
    const currentPrice = effectiveNegotiation.counterPrice || effectiveNegotiation.offeredPrice;
    const total = Math.round(currentPrice * effectiveNegotiation.quantity);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Accept Offer & Notify Buyer?\n\nRate: ₹${currentPrice}/${effectiveNegotiation.unit}\nVolume: ${effectiveNegotiation.quantity} ${effectiveNegotiation.unit}\nTotal Deal Value: ₹${total.toLocaleString('en-IN')}\n\nClick OK to accept. The buyer will receive a confirmation card in their chat to confirm and place the order.`
      );
      if (confirmed) {
        executeAcceptOffer();
      }
    } else {
      Alert.alert(
        'Accept Offer & Notify Buyer?',
        `Are you sure you want to accept ₹${currentPrice}/${effectiveNegotiation.unit} for ${effectiveNegotiation.quantity} ${effectiveNegotiation.unit}?\n\nTotal Deal Value: ₹${total.toLocaleString('en-IN')}\n\nThe buyer will confirm in chat to finalize the order.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Accept Deal',
            style: 'default',
            onPress: executeAcceptOffer,
          },
        ]
      );
    }
  };

  // Open Counter Modal with prefilled values
  const openCounterModal = () => {
    if (!effectiveNegotiation) return;
    setCounterPrice(String(effectiveNegotiation.counterPrice || effectiveNegotiation.offeredPrice));
    setCounterQty(String(effectiveNegotiation.quantity));
    setCounterNote('');
    setCounterModalVisible(true);
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const effectiveNegotiation = negotiation || defaultNeg;
  const isAccepted = effectiveNegotiation?.status === 'ACCEPTED';
  const currentPrice = effectiveNegotiation ? effectiveNegotiation.counterPrice || effectiveNegotiation.offeredPrice : 0;
  const currentTotal = effectiveNegotiation ? Math.round(currentPrice * effectiveNegotiation.quantity) : 0;
  const displayMessages = messages.length > 0 ? messages : [defaultInitialOfferMsg];

  // Render chat item
  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isFarmer = item.senderRole === 'FARMER';
    const isBuyer = item.senderRole === 'BUYER';
    const isSystem = item.messageType === 'SYSTEM' || item.messageType === 'ORDER_EVENT';

    // 1. System / Order Event Banner
    if (isSystem) {
      const isOrderCreated = item.messageType === 'ORDER_EVENT';
      return (
        <View style={styles.systemBubbleWrap}>
          <View style={[styles.systemBubble, isOrderCreated && styles.orderEventBubble]}>
            {isOrderCreated ? (
              <Package size={14} color="#15803D" style={{ marginRight: 5 }} />
            ) : (
              <Sparkles size={13} color="#4B5563" style={{ marginRight: 5 }} />
            )}
            <Text style={[styles.systemText, isOrderCreated && styles.orderEventText]}>
              {item.text}
            </Text>
          </View>
          {isOrderCreated && (
            <TouchableOpacity
              style={styles.viewOrderLink}
              onPress={() => router.push('/(tabs)/orders')}
            >
              <Text style={styles.viewOrderLinkText}>View Order Details</Text>
              <ChevronRight size={13} color="#15803D" />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // 2. Structured Offer Card
    if (item.messageType === 'OFFER') {
      const offerAccepted = item.offerStatus === 'ACCEPTED' || isAccepted;
      const offerCountered = item.offerStatus === 'COUNTERED';
      const offerPending = item.offerStatus === 'PENDING' && !isAccepted;

      return (
        <View style={[styles.msgRow, isFarmer ? styles.msgRowRight : styles.msgRowLeft]}>
          <View style={[styles.offerCardWrap, isFarmer ? styles.offerCardFarmer : styles.offerCardBuyer]}>
            {/* Header */}
            <View style={styles.offerCardHeader}>
              <View style={styles.offerBadge}>
                <Repeat size={12} color="#15803D" />
                <Text style={styles.offerBadgeText}>
                  {isFarmer ? 'YOUR COUNTER OFFER' : 'BUYER OFFER'}
                </Text>
              </View>
              <Text style={styles.offerTimestamp}>{formatTime(item.timestamp)}</Text>
            </View>

            {/* Price & Quantity Details */}
            <View style={styles.offerMainSection}>
              <View>
                <Text style={styles.offerPriceMain}>₹{item.price}/{item.unit || 'kg'}</Text>
                <Text style={styles.offerQtySub}>Volume: {item.quantity} {item.unit || 'kg'}</Text>
              </View>
              <View style={styles.offerTotalCol}>
                <Text style={styles.offerTotalLabel}>Total Deal Value</Text>
                <Text style={styles.offerTotalValue}>₹{(item.totalAmount || 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Offer Status & Action CTAs */}
            {offerPending && isBuyer && (
              <View style={styles.offerActionRow}>
                <TouchableOpacity style={styles.counterActionBtn} onPress={openCounterModal}>
                  <Text style={styles.counterActionBtnText}>Counter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptActionBtn} onPress={handleAcceptOffer}>
                  <CheckCircle2 size={14} color="#FFFFFF" />
                  <Text style={styles.acceptActionBtnText}>Accept Offer</Text>
                </TouchableOpacity>
              </View>
            )}

            {offerAccepted && (
              <View style={styles.offerAcceptedPill}>
                <CheckCircle2 size={13} color="#15803D" />
                <Text style={styles.offerAcceptedPillText}>Offer Accepted • Order Created</Text>
              </View>
            )}

            {offerCountered && (
              <View style={styles.offerSupersededPill}>
                <Clock size={12} color="#6B7280" />
                <Text style={styles.offerSupersededPillText}>Countered by revised offer</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    // 3. Normal Text Message Bubble
    return (
      <View style={[styles.msgRow, isFarmer ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isFarmer && (
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>
              {negotiation?.buyerName?.charAt(0) || 'B'}
            </Text>
          </View>
        )}
        <View style={[styles.bubble, isFarmer ? styles.bubbleFarmer : styles.bubbleBuyer]}>
          <Text style={[styles.bubbleText, isFarmer ? styles.bubbleTextFarmer : styles.bubbleTextBuyer]}>
            {item.text}
          </Text>
          <View style={styles.bubbleMeta}>
            <Text style={[styles.bubbleTime, isFarmer ? styles.bubbleTimeFarmer : styles.bubbleTimeBuyer]}>
              {formatTime(item.timestamp)}
            </Text>
            {isFarmer && (
              <CheckCheck size={13} color={item.isRead ? '#15803D' : '#9CA3AF'} style={{ marginLeft: 3 }} />
            )}
          </View>
        </View>
      </View>
    );
  };

  const buyerDisplayName = negotiation?.buyerName || params.buyerName || 'Buyer';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: `Chat with ${buyerDisplayName} | Sell`,
          headerShown: false,
        }}
      />
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {negotiation?.buyerName?.charAt(0) || params.buyerName?.charAt(0) || 'B'}
          </Text>
        </View>

        <View style={styles.headerTitleWrap}>
          <View style={styles.nameRow}>
            <Text style={styles.buyerName} numberOfLines={1}>
              {negotiation?.buyerName || params.buyerName || 'Buyer'}
            </Text>
            <ShieldCheck size={15} color="#16A34A" style={{ marginLeft: 4 }} />
          </View>
          <Text style={styles.onlineStatus}>🟢 Verified Buyer • Live Negotiation</Text>
        </View>

        {negotiation?.buyerPhone && (
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Alert.alert('Buyer Contact', `Phone: ${negotiation.buyerPhone}`)}
          >
            <Phone size={18} color="#15803D" />
          </TouchableOpacity>
        )}
      </View>

      {/* Product Mini Context Card */}
      {effectiveNegotiation && (
        <View style={styles.productMiniCard}>
          {effectiveNegotiation.cropImage ? (
            <Image source={{ uri: effectiveNegotiation.cropImage }} style={styles.productThumb} />
          ) : (
            <View style={styles.productPlaceholder}>
              <Package size={20} color="#15803D" />
            </View>
          )}

          <View style={styles.productDetails}>
            <Text style={styles.cropTitle} numberOfLines={1}>
              {effectiveNegotiation.cropName} {effectiveNegotiation.grade ? `(Grade ${effectiveNegotiation.grade})` : ''}
            </Text>
            <Text style={styles.cropSubInfo}>
              Req: <Text style={{ fontWeight: '700', color: '#1F2937' }}>{effectiveNegotiation.quantity} {effectiveNegotiation.unit}</Text> • Listed: ₹{effectiveNegotiation.originalPrice}/{effectiveNegotiation.unit}
            </Text>
          </View>

          <View style={styles.pricePill}>
            <Text style={styles.pricePillLabel}>CURRENT DEAL</Text>
            <Text style={styles.pricePillValue}>₹{currentPrice}/{effectiveNegotiation.unit}</Text>
          </View>
        </View>
      )}

      {/* Current Offer Banner with Quick Action CTAs */}
      {effectiveNegotiation && (
        <View style={[styles.currentOfferBanner, isAccepted && styles.currentOfferBannerAccepted]}>
          <View style={styles.bannerInfoCol}>
            <Text style={styles.bannerLabel}>
              {isAccepted ? 'DEAL ACCEPTED' : 'ACTIVE PROPOSED OFFER'}
            </Text>
            <Text style={styles.bannerValue}>
              ₹{currentPrice}/{effectiveNegotiation.unit} • {effectiveNegotiation.quantity} {effectiveNegotiation.unit} = ₹{currentTotal.toLocaleString('en-IN')}
            </Text>
          </View>

          {!isAccepted && (
            <View style={styles.bannerActions}>
              <TouchableOpacity style={styles.bannerCounterBtn} onPress={openCounterModal}>
                <Text style={styles.bannerCounterBtnText}>Counter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bannerAcceptBtn} onPress={handleAcceptOffer}>
                <Check size={14} color="#FFFFFF" />
                <Text style={styles.bannerAcceptBtnText}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}

          {isAccepted && (
            <TouchableOpacity
              style={styles.bannerViewOrderBtn}
              onPress={() => router.push('/(tabs)/orders')}
            >
              <Text style={styles.bannerViewOrderBtnText}>View Order</Text>
              <ChevronRight size={14} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Messages Thread */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading && !effectiveNegotiation ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#15803D"
              aria-label="Loading chat history"
              accessibilityLabel="Loading chat history"
            />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={displayMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Bottom Composer Bar */}
        <View style={styles.composerBar}>
          <TouchableOpacity
            style={styles.makeOfferBtn}
            onPress={openCounterModal}
            disabled={isAccepted}
          >
            <Repeat size={18} color={isAccepted ? '#9CA3AF' : '#15803D'} />
            <Text style={[styles.makeOfferBtnText, isAccepted && { color: '#9CA3AF' }]}>
              Offer
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={isAccepted ? 'Deal concluded • Order created' : 'Write a message...'}
            placeholderTextColor="#9CA3AF"
            multiline
            editable={!isAccepted}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isAccepted) && styles.sendBtnDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isAccepted || submitting}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ========================================================================= */}
      {/* COUNTER OFFER MODAL (Interactive Farmer Stepper & Price Proposer)          */}
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
                <Text style={styles.modalTitle}>Make Counter Offer</Text>
                <Text style={styles.modalSubtitle}>
                  Propose price & volume to {negotiation?.buyerName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCounterModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Stepper & Inputs */}
            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Counter Price (₹ / {negotiation?.unit || 'kg'})</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    const val = parseFloat(counterPrice) || currentPrice;
                    setCounterPrice(Math.max(1, val - 0.5).toFixed(1));
                  }}
                >
                  <Text style={styles.stepBtnText}>-₹0.5</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.stepperInput}
                  keyboardType="numeric"
                  value={counterPrice}
                  onChangeText={setCounterPrice}
                  placeholder="e.g. 24"
                />

                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    const val = parseFloat(counterPrice) || currentPrice;
                    setCounterPrice((val + 0.5).toFixed(1));
                  }}
                >
                  <Text style={styles.stepBtnText}>+₹0.5</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                Quantity ({negotiation?.unit || 'kg'})
              </Text>
              <TextInput
                style={styles.regularInput}
                keyboardType="numeric"
                value={counterQty}
                onChangeText={setCounterQty}
                placeholder="Quantity in kg"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                Note to Buyer (Optional)
              </Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={2}
                value={counterNote}
                onChangeText={setCounterNote}
                placeholder="e.g. Clean Grade A batch ready for pickup at farm gate."
              />

              {/* Real-time calculated projected deal total */}
              {(() => {
                const p = parseFloat(counterPrice) || 0;
                const q = parseInt(counterQty, 10) || 0;
                const tot = Math.round(p * q);
                return (
                  <View style={styles.totalPreviewBox}>
                    <Text style={styles.previewLabel}>Projected Total Deal Value:</Text>
                    <Text style={styles.previewValue}>₹{tot.toLocaleString('en-IN')}</Text>
                  </View>
                );
              })()}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setCounterModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleSendCounterOffer}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Send size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.modalSubmitText}>Send Counter Offer</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
  },
  headerTitleWrap: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buyerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  onlineStatus: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  productPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productDetails: {
    flex: 1,
    marginLeft: 10,
  },
  cropTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  cropSubInfo: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  pricePill: {
    alignItems: 'flex-end',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  pricePillLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  pricePillValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  currentOfferBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 12,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  currentOfferBannerAccepted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  bannerInfoCol: {
    flex: 1,
  },
  bannerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  bannerValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    marginTop: 1,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  bannerCounterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  bannerCounterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  bannerAcceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#15803D',
    gap: 4,
  },
  bannerAcceptBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerViewOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#15803D',
    gap: 4,
  },
  bannerViewOrderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginVertical: 2,
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  avatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  avatarMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleFarmer: {
    backgroundColor: '#DCFCE7',
    borderBottomRightRadius: 2,
  },
  bubbleBuyer: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextFarmer: {
    color: '#064E3B',
  },
  bubbleTextBuyer: {
    color: '#1F2937',
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  bubbleTime: {
    fontSize: 10,
  },
  bubbleTimeFarmer: {
    color: '#059669',
  },
  bubbleTimeBuyer: {
    color: '#9CA3AF',
  },
  offerCardWrap: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  offerCardFarmer: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  offerCardBuyer: {
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  offerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  offerTimestamp: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  offerMainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  offerPriceMain: {
    fontSize: 17,
    fontWeight: '800',
    color: '#15803D',
  },
  offerQtySub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  offerTotalCol: {
    alignItems: 'flex-end',
  },
  offerTotalLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  offerTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 1,
  },
  offerActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  counterActionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  counterActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  acceptActionBtn: {
    flex: 1.5,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  acceptActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  offerAcceptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  offerAcceptedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  offerSupersededPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  offerSupersededPillText: {
    fontSize: 10,
    color: '#6B7280',
  },
  systemBubbleWrap: {
    alignItems: 'center',
    marginVertical: 6,
  },
  systemBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    maxWidth: '90%',
  },
  orderEventBubble: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  systemText: {
    fontSize: 11,
    color: '#4B5563',
  },
  orderEventText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#14532D',
  },
  viewOrderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  viewOrderLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  makeOfferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 4,
    marginBottom: 2,
  },
  makeOfferBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    backgroundColor: '#F9FAFB',
    borderRadius: 21,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: 8,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  modalForm: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  stepperInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#15803D',
  },
  regularInput: {
    height: 44,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 10,
    fontSize: 13,
    color: '#1F2937',
    minHeight: 50,
  },
  totalPreviewBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  modalSubmitBtn: {
    flex: 2,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
