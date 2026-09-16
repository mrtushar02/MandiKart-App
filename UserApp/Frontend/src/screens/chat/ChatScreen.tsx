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
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';

interface ChatItem {
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

export default function ChatScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const currentUserId = user?.id || 'buyer_default_01';
  const currentUserName = user?.fullName || 'You';
  const params = route?.params ?? {};
  const [activeNegId, setActiveNegId] = useState<string>(params.negotiationId || params.id || '');
  const [farmerName, setFarmerName] = useState<string>(params.farmerName || params.farmer || 'Ramesh Patel');
  const [cropName, setCropName] = useState<string>(params.cropName || params.crop || 'Produce');
  const [productImage, setProductImage] = useState<string>(params.productImage || params.cropImage || '');

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
      status: 'PENDING_FARMER',
    };
  }, [params, activeNegId, cropName, farmerName, productImage]);

  const defaultInitialOfferMsg: ChatItem = React.useMemo(() => ({
    id: `msg_init_${activeNegId || Date.now()}`,
    negotiationId: activeNegId || defaultNeg.id,
    senderId: currentUserId,
    senderRole: 'BUYER',
    senderName: currentUserName,
    messageType: 'OFFER',
    text: `Price Proposal: ₹${defaultNeg.offeredPrice}/${defaultNeg.unit} for ${defaultNeg.quantity} ${defaultNeg.unit}`,
    price: defaultNeg.offeredPrice,
    quantity: defaultNeg.quantity,
    unit: defaultNeg.unit,
    totalAmount: Math.round(defaultNeg.offeredPrice * defaultNeg.quantity),
    offerStatus: 'PENDING',
    timestamp: new Date().toISOString(),
  }), [activeNegId, defaultNeg, currentUserId, currentUserName]);

  const { activeSavedAddress } = useLocation();
  const [negotiation, setNegotiation] = useState<any>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Counter offer modal state
  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterNote, setCounterNote] = useState('');

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

  // Accept Deal & Order
  const handleAcceptNegotiation = async () => {
    if (!activeNegId || !negotiation) return;
    const currentPrice = negotiation.counterPrice || negotiation.offeredPrice;
    const total = Math.round(currentPrice * negotiation.quantity);

    Alert.alert(
      'Accept & Place Order?',
      `Confirm acceptance of ₹${currentPrice}/${negotiation.unit} for ${negotiation.quantity} ${negotiation.unit}?\n\nTotal: ₹${total.toLocaleString('en-IN')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Order',
          onPress: async () => {
            try {
              setSubmitting(true);
              const res = await apiClient.negotiations.confirmOrder(
                activeNegId,
                activeSavedAddress?.formattedAddress || 'Selected Delivery Address'
              );

              // Update local state
              loadNegotiation(false);

              Alert.alert(
                'Order Confirmed! 🎉',
                `Your order #${res?.order?.orderNumber || res?.orderNumber || 'CONFIRMED'} has been placed.`,
                [
                  {
                    text: 'View Checkout Review',
                    onPress: () => {
                      navigation.navigate('CheckoutStack', {
                        screen: 'CheckoutReview',
                        params: {
                          isNegotiated: true,
                          negotiation: res?.negotiation || negotiation,
                          order: res?.order,
                        },
                      });
                    },
                  },
                  { text: 'Stay Here' },
                ]
              );
            } catch (err: any) {
              Alert.alert('Acceptance Error', err.message || 'Failed to accept offer.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
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

  const handleConfirmOrderFromChat = async () => {
    if (!activeNegId && !effectiveNeg) return;
    const targetId = activeNegId || effectiveNeg?.id;
    if (!targetId) return;

    try {
      setSubmitting(true);
      const destAddr = activeSavedAddress?.formattedAddress || 'Selected Delivery Address';
      const res = await apiClient.negotiations.confirmOrder(targetId, destAddr);

      // Reload negotiation to reflect updated order event
      await loadNegotiation(false);

      const placedOrder = res?.order;
      const ordNum = placedOrder?.orderNumber || res?.orderNumber || 'CONFIRMED';

      if (Platform.OS === 'web') {
        window.alert(`Order Confirmed! 🎉\nYour order #${ordNum} has been placed.\n\nIt is now active in your Orders screen.`);
      } else {
        Alert.alert(
          'Order Confirmed! 🎉',
          `Your order #${ordNum} has been placed successfully!\n\nIt is now visible in your Orders screen.`,
          [
            {
              text: 'View My Orders',
              onPress: () => (navigation as any).navigate('MainTabs', { screen: 'Orders' }),
            },
            { text: 'Stay in Chat' },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Confirmation Error', err.message || 'Failed to confirm order.');
    } finally {
      setSubmitting(false);
    }
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
  const currentTotal = effectiveNeg ? Math.round(currentPrice * effectiveNeg.quantity) : 0;

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

            {/* Action buttons if pending counter from farmer */}
            {offerPending && isFromFarmer && (
              <View style={styles.negActions}>
                <TouchableOpacity style={styles.declineBtn} onPress={openCounterModal}>
                  <Text style={styles.declineBtnText}>Counter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptNegotiation}>
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

    // 3. Standard Text Message Bubble
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
});
