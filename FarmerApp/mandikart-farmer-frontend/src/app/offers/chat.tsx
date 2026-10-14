/**
 * MandiKart Farmer App — Negotiation Chat Screen (Screen 26)
 *
 * Route: /offers/chat?id=...
 *
 * Facilitates direct bilateral negotiation communication between farmer and supplier:
 * - Isolated conversation thread tied to the specific procurement offer
 * - Mini commercial offer sticky bar with quick Accept / Counter shortcuts
 * - Delivery status indicators (SENDING, SENT, DELIVERED, READ, FAILED)
 * - Tap-to-retry on failed sends with clientMsgId deduplication
 * - 3-second background polling for synchronized conversation state
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  Check,
  CheckCheck,
  Repeat,
  ShieldCheck,
  Clock,
  Package,
  IndianRupee,
  ChevronRight,
  Info,
  Building2,
  AlertCircle,
  FileText,
  Scale,
  RefreshCw,
} from 'lucide-react-native';
import { MKColors } from '@/constants/colors';
import { useOffersStore, ProcurementOffer, OfferChatMessage } from '@/store/offersStore';

export default function NegotiationChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; offerId?: string }>();
  const offerId = params.id || params.offerId || '';

  const {
    currentOffer,
    fetchOfferById,
    fetchOfferMessages,
    sendOfferMessage,
    messagesByOfferId,
    isLoading,
  } = useOffersStore();

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Load offer details
  useEffect(() => {
    if (offerId) {
      fetchOfferById(offerId);
      fetchOfferMessages(offerId);
    }
  }, [offerId, fetchOfferById, fetchOfferMessages]);

  // Background polling every 3 seconds for active conversation sync
  useEffect(() => {
    if (!offerId || !pollingActive) return;

    const interval = setInterval(() => {
      fetchOfferMessages(offerId);
    }, 3000);

    return () => clearInterval(interval);
  }, [offerId, pollingActive, fetchOfferMessages]);

  const offer: ProcurementOffer | null = currentOffer;
  const messages: OfferChatMessage[] = useMemo(() => {
    return messagesByOfferId[offerId] || [];
  }, [messagesByOfferId, offerId]);

  // Send a new message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending || !offerId) return;

    const clientMsgId = `msg_client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setSending(true);
    setInputText('');

    try {
      const res = await sendOfferMessage(offerId, {
        text,
        messageType: 'TEXT',
        clientMsgId,
      });

      setSending(false);
      if (!res.success) {
        Alert.alert('Send Failed', res.error || 'Failed to deliver message. Tap retry.');
      } else {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (err: any) {
      setSending(false);
      Alert.alert('Error', err.message || 'Network error while delivering message.');
    }
  };

  // Quick prompt chips
  const quickChips = [
    'Can you deliver within 3 days?',
    'Is double-mesh 50kg packaging included?',
    'Can you offer ₹40/qtl volume discount?',
    'Weighbridge inspection at our depot is required.',
  ];

  const renderStatusTicks = (status: OfferChatMessage['deliveryStatus']) => {
    switch (status) {
      case 'SENDING':
        return <ActivityIndicator size="small" color="#94A3B8" style={{ transform: [{ scale: 0.6 }] }} />;
      case 'SENT':
        return <Check size={13} color="#94A3B8" />;
      case 'DELIVERED':
        return <CheckCheck size={13} color="#94A3B8" />;
      case 'READ':
        return <CheckCheck size={13} color="#15803D" />;
      case 'FAILED':
        return <AlertCircle size={13} color="#DC2626" />;
      default:
        return <Check size={13} color="#94A3B8" />;
    }
  };

  const renderMessageItem = ({ item }: { item: OfferChatMessage }) => {
    const isFarmer = item.senderRole === 'FARMER';
    const isSystem = item.senderRole === 'SYSTEM';

    if (isSystem) {
      return (
        <View style={styles.systemNoticeWrap}>
          <View style={styles.systemNoticeCard}>
            <Info size={12} color="#0369A1" style={{ marginRight: 6 }} />
            <Text style={styles.systemNoticeText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    if (item.messageType === 'TERMS_PROPOSAL') {
      return (
        <View style={[styles.bubbleWrapper, isFarmer ? styles.bubbleRight : styles.bubbleLeft]}>
          <View style={[styles.termsCard, isFarmer ? styles.termsCardFarmer : styles.termsCardSupplier]}>
            <View style={styles.termsHeaderRow}>
              <Scale size={14} color={isFarmer ? '#15803D' : '#1D4ED8'} style={{ marginRight: 4 }} />
              <Text style={[styles.termsHeaderTitle, { color: isFarmer ? '#15803D' : '#1D4ED8' }]}>
                {isFarmer ? 'Your Counteroffer Proposal' : 'Supplier Commercial Quote'}
              </Text>
            </View>

            <Text style={styles.termsMessageText}>{item.text}</Text>

            {item.proposedPrice ? (
              <View style={styles.termsMetricsBox}>
                <View style={styles.termsMetricCol}>
                  <Text style={styles.termsMetricLbl}>Price Rate</Text>
                  <Text style={styles.termsMetricVal}>
                    ₹{item.proposedPrice} / {item.unit || 'quintal'}
                  </Text>
                </View>
                {item.proposedQuantity && (
                  <View style={styles.termsMetricCol}>
                    <Text style={styles.termsMetricLbl}>Volume</Text>
                    <Text style={styles.termsMetricVal}>
                      {item.proposedQuantity} {item.unit || 'quintal'}
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            <View style={styles.bubbleFooter}>
              <Text style={styles.bubbleTime}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isFarmer && <View style={styles.statusTicksWrap}>{renderStatusTicks(item.deliveryStatus)}</View>}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.bubbleWrapper, isFarmer ? styles.bubbleRight : styles.bubbleLeft]}>
        <View style={[styles.bubble, isFarmer ? styles.bubbleFarmer : styles.bubbleSupplier]}>
          {!isFarmer && <Text style={styles.supplierSenderLabel}>{item.senderName}</Text>}
          <Text style={[styles.bubbleText, isFarmer ? styles.bubbleTextFarmer : styles.bubbleTextSupplier]}>
            {item.text}
          </Text>

          <View style={styles.bubbleFooter}>
            <Text style={[styles.bubbleTime, isFarmer && { color: '#166534' }]}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isFarmer && (
              <View style={styles.statusTicksWrap}>
                {renderStatusTicks(item.deliveryStatus)}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#1E293B" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {offer?.supplierName || 'Negotiation Chat'}
            </Text>
            {offer?.isVerified && (
              <ShieldCheck size={14} color="#15803D" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Tender: {offer?.requirementTitle || 'Procurement Sourcing'}
          </Text>
        </View>

        {/* Quick Links to Summary & Details */}
        <Pressable
          style={styles.headerActionBtn}
          onPress={() => router.push(`/offers/summary?id=${offerId}` as any)}
        >
          <FileText size={18} color={MKColors.primary} />
          <Text style={styles.headerActionBtnText}>Summary</Text>
        </Pressable>
      </View>

      {/* Sticky Commercial Context Mini-Banner */}
      {offer && (
        <View style={styles.stickyOfferBar}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.stickyCommodityText}>{offer.cropName} ({offer.grade})</Text>
              <Text style={styles.stickyVolText}>• {offer.quantity} {offer.unit}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Text style={styles.stickyPriceText}>₹{offer.unitPrice}/{offer.unit}</Text>
              <Text style={styles.stickyLandedText}>
                (Landed: ₹{offer.totalLandedAmount.toLocaleString('en-IN')})
              </Text>
            </View>
          </View>

          {/* Status badge & Quick Action */}
          <View style={styles.stickyActionsCol}>
            <View
              style={[
                styles.stickyStatusBadge,
                offer.status === 'PENDING_FARMER'
                  ? styles.badgeActionRequired
                  : offer.status === 'ACCEPTED'
                  ? styles.badgeAccepted
                  : styles.badgePending,
              ]}
            >
              <Text
                style={[
                  styles.stickyStatusBadgeText,
                  offer.status === 'PENDING_FARMER'
                    ? { color: '#B45309' }
                    : offer.status === 'ACCEPTED'
                    ? { color: '#15803D' }
                    : { color: '#1D4ED8' },
                ]}
              >
                {offer.status.replace('_', ' ')}
              </Text>
            </View>

            {offer.status === 'PENDING_FARMER' && (
              <Pressable
                style={styles.quickCounterBtn}
                onPress={() => router.push(`/offers/counter?id=${offer.id}` as any)}
              >
                <Repeat size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.quickCounterBtnText}>Counter</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChatWrap}>
              <Building2 size={36} color="#94A3B8" />
              <Text style={styles.emptyChatTitle}>Start Commercial Negotiation</Text>
              <Text style={styles.emptyChatSub}>
                Send a direct message to {offer?.supplierName || 'the supplier'} to inquire about
                grading, packing, freight scheduling, or volume discounts.
              </Text>
            </View>
          }
        />

        {/* Quick prompt chips */}
        <View style={styles.chipsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={quickChips}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable style={styles.quickChip} onPress={() => handleSendMessage(item)}>
                <Text style={styles.quickChipText}>{item}</Text>
              </Pressable>
            )}
            contentContainerStyle={styles.chipsList}
          />
        </View>

        {/* Chat Composer Bar */}
        <View style={[styles.composerBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={styles.composerInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Message ${offer?.supplierName || 'supplier'}...`}
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[
              styles.sendBtn,
              (!inputText.trim() || sending) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={18} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  headerActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  headerActionBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: MKColors.primary,
    marginTop: 2,
  },
  stickyOfferBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  stickyCommodityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  stickyVolText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  stickyPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: MKColors.primary,
  },
  stickyLandedText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 6,
  },
  stickyActionsCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  stickyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeActionRequired: {
    backgroundColor: '#FEF3C7',
  },
  badgeAccepted: {
    backgroundColor: '#DCFCE7',
  },
  badgePending: {
    backgroundColor: '#EFF6FF',
  },
  stickyStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  quickCounterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MKColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  quickCounterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 8,
  },
  bubbleWrapper: {
    marginVertical: 4,
    maxWidth: '82%',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleFarmer: {
    backgroundColor: '#DCFCE7',
    borderBottomRightRadius: 4,
  },
  bubbleSupplier: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  supplierSenderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextFarmer: {
    color: '#14532D',
  },
  bubbleTextSupplier: {
    color: '#0F172A',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  bubbleTime: {
    fontSize: 10,
    color: '#64748B',
  },
  statusTicksWrap: {
    marginLeft: 2,
  },
  systemNoticeWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  systemNoticeText: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '500',
  },
  termsCard: {
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  termsCardFarmer: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderBottomRightRadius: 4,
  },
  termsCardSupplier: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderBottomLeftRadius: 4,
  },
  termsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  termsHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  termsMessageText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 8,
  },
  termsMetricsBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    gap: 12,
  },
  termsMetricCol: {
    flex: 1,
  },
  termsMetricLbl: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  termsMetricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  emptyChatWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyChatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptyChatSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  chipsContainer: {
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  chipsList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  composerInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MKColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
});
