/**
 * MandiKart Farmer App — Kisan AI Saathi Screen
 *
 * Comprehensive Conversational AI Agronomist & Business Advisor:
 * - Real-time access to farmer's profile, crops, orders, earnings, and GPS location
 * - Predictive next crop advisory, disaster & weather alerts, profit maximization, govt schemes
 * - Multi-language support: English, हिन्दी, ଓଡ଼ିଆ, తెలుగు, বাংলা
 * - Cross-platform Text-to-Speech (TTS) voice narration
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Send,
  Volume2,
  Square,
  Sparkles,
  MapPin,
  Globe,
  Sprout,
  Compass,
  AlertTriangle,
  TrendingUp,
  Landmark,
  ArrowRight,
  User,
  CheckCircle2,
  Mic,
  Bot,
} from 'lucide-react-native';
import {
  askFarmerAi,
  getFarmerLiveContext,
  FarmerContextData,
  AiMessage,
  AI_LANG_LABELS,
} from '@/services/farmerAiService';
import { ttsService, SupportedLanguage } from '@/services/ttsService';
import { getCurrentFarmerLocation } from '@/services/locationService';

export default function KisanAiAssistantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('hi');
  const [farmerContext, setFarmerContext] = useState<FarmerContextData>(getFarmerLiveContext());
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string>('Bargarh Mandi Hub, Odisha');

  const scrollViewRef = useRef<ScrollView>(null);

  // Subscribe to TTS state
  useEffect(() => {
    const unsub = ttsService.subscribe((speaking) => {
      setIsSpeaking(speaking);
      if (!speaking) {
        setSpeakingMessageId(null);
      }
    });
    return () => {
      ttsService.stop();
      unsub();
    };
  }, []);

  // Fetch live GPS location
  useEffect(() => {
    (async () => {
      try {
        const loc = await getCurrentFarmerLocation();
        if (loc) {
          const locStr = loc.district
            ? `${loc.district} Mandi Hub, ${loc.state || ''}`
            : loc.formattedAddress || 'Bargarh APMC, Odisha';
          setDetectedLocation(locStr);
        }
      } catch {
        // Fallback already set
      }
    })();
  }, []);

  // Update context & initialize welcome message on language change
  useEffect(() => {
    const ctx = getFarmerLiveContext();
    setFarmerContext(ctx);

    const langConfig = AI_LANG_LABELS[selectedLang];
    const initialGreeting: AiMessage = {
      id: `welcome_${selectedLang}`,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'general',
      text: `${langConfig.greeting}\n\n` +
        `👤 **किसान साथी:** ${ctx.farmerName} (${ctx.farmSize})\n` +
        `📍 **सक्रिय मंडी:** ${detectedLocation}\n` +
        `🌾 **इन्वेंटरी स्थिति:** ${ctx.cropsCount} फसलें (${ctx.totalInventoryKg.toLocaleString()} kg उपलब्ध)\n` +
        `💰 **कुल आय (ऑर्डर):** ₹${ctx.totalEarnedRevenue.toLocaleString()}\n\n` +
        `${langConfig.subtitle}\n` +
        `आप अपनी फसलों के स्वास्थ्य, आगामी बुवाई, बारिश/आपदा अलर्ट, मुनाफा बढ़ाने या सरकारी योजनाओं (PM-KISAN, PMFBY, KALIA) के बारे में कोई भी प्रश्न पूछ सकते हैं।`,
      suggestedPrompts: langConfig.quickPrompts.map((p) => p.query),
    };

    setMessages([initialGreeting]);
  }, [selectedLang]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isThinking) return;

    ttsService.stop();

    const userMsg: AiMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const aiReply = await askFarmerAi(query, selectedLang);
      setMessages((prev) => [...prev, aiReply]);

      // Automatically speak the response if farmer requested via quick prompt
      ttsService.speak(aiReply.text, {
        language: selectedLang,
        onStart: () => setSpeakingMessageId(aiReply.id),
        onDone: () => setSpeakingMessageId(null),
        onError: () => setSpeakingMessageId(null),
      });
    } catch (err) {
      console.warn('[Kisan AI] Assistant query error:', err);
    } finally {
      setIsThinking(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  const handleToggleAudio = (msg: AiMessage) => {
    if (speakingMessageId === msg.id && isSpeaking) {
      ttsService.stop();
      setSpeakingMessageId(null);
    } else {
      ttsService.stop();
      setSpeakingMessageId(msg.id);
      ttsService.speak(msg.text, {
        language: selectedLang,
        onStart: () => setSpeakingMessageId(msg.id),
        onDone: () => setSpeakingMessageId(null),
        onError: () => setSpeakingMessageId(null),
      });
    }
  };

  const currentLangConfig = AI_LANG_LABELS[selectedLang];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* ── 1. Header Bar ─────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
          onPress={() => {
            ttsService.stop();
            router.back();
          }}
          hitSlop={8}
        >
          <ArrowLeft size={22} color="#0F172A" strokeWidth={2.4} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.headerTitle}>Kisan AI Saathi</Text>
            <View style={styles.aiBadge}>
              <Sparkles size={11} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.aiBadgeText}>Agronomist</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Realtime Farm & Market Intelligence</Text>
        </View>

        {/* Language Selector Pill */}
        <Pressable
          style={styles.langPill}
          onPress={() => setShowLangMenu(!showLangMenu)}
          hitSlop={6}
        >
          <Globe size={13} color="#15803D" />
          <Text style={styles.langPillText}>{currentLangConfig.name}</Text>
        </Pressable>
      </View>

      {/* ── Language Switcher Modal/Bar ───────────────────────────── */}
      {showLangMenu && (
        <View style={styles.langDropdown}>
          {(
            [
              { code: 'hi', label: 'हिन्दी' },
              { code: 'or', label: 'ଓଡ଼ିଆ' },
              { code: 'te', label: 'తెలుగు' },
              { code: 'bn', label: 'বাংলা' },
              { code: 'en', label: 'English' },
            ] as const
          ).map((l) => (
            <Pressable
              key={l.code}
              style={[styles.langOption, selectedLang === l.code && styles.langOptionActive]}
              onPress={() => {
                setSelectedLang(l.code);
                setShowLangMenu(false);
              }}
            >
              <Text
                style={[
                  styles.langOptionText,
                  selectedLang === l.code && styles.langOptionTextActive,
                ]}
              >
                {l.label}
              </Text>
              {selectedLang === l.code && <CheckCircle2 size={13} color="#15803D" />}
            </Pressable>
          ))}
        </View>
      )}

      {/* ── 2. Live Farmer & Location Telemetry Banner ─────────────── */}
      <View style={styles.telemetryBar}>
        <View style={styles.telemetryItem}>
          <User size={12} color="#15803D" />
          <Text numberOfLines={1} style={styles.telemetryText}>
            {farmerContext.farmerName} • {farmerContext.cropsCount} Crops Listed
          </Text>
        </View>
        <View style={styles.telemetryDivider} />
        <View style={styles.telemetryItem}>
          <MapPin size={12} color="#0284C7" />
          <Text numberOfLines={1} style={styles.telemetryText}>
            {detectedLocation}
          </Text>
        </View>
      </View>

      {/* ── 3. Quick Action Suggestion Chips ──────────────────────── */}
      <View style={styles.quickChipsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsScroll}>
          {currentLangConfig.quickPrompts.map((p, idx) => (
            <Pressable
              key={idx}
              style={({ pressed }) => [styles.quickChip, pressed && { opacity: 0.8 }]}
              onPress={() => handleSendMessage(p.query)}
            >
              <Text style={styles.quickChipLabel}>{p.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── 4. Main Chat Scroll Area ──────────────────────────────── */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={[styles.chatContent, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          const isThisSpeaking = speakingMessageId === msg.id && isSpeaking;

          return (
            <View
              key={msg.id}
              style={[
                styles.messageContainer,
                isAi ? styles.messageContainerAi : styles.messageContainerUser,
              ]}
            >
              {/* Message Bubble */}
              <View
                style={[
                  styles.bubble,
                  isAi ? styles.bubbleAi : styles.bubbleUser,
                ]}
              >
                {/* AI Header with Voice Playback Icon */}
                {isAi && (
                  <View style={styles.aiMessageTopBar}>
                    <View style={styles.aiAvatarBadge}>
                      <Bot size={13} color="#FFFFFF" />
                      <Text style={styles.aiAvatarText}>Kisan AI</Text>
                    </View>

                    {msg.mandiBadge && (
                      <View style={styles.mandiPill}>
                        <Text style={styles.mandiPillText}>{msg.mandiBadge}</Text>
                      </View>
                    )}

                    <Pressable
                      style={[styles.ttsBtn, isThisSpeaking && styles.ttsBtnActive]}
                      onPress={() => handleToggleAudio(msg)}
                      hitSlop={8}
                    >
                      {isThisSpeaking ? (
                        <>
                          <Square size={12} color="#DC2626" fill="#DC2626" />
                          <Text style={styles.ttsBtnTextActive}>
                            {currentLangConfig.audioStopText}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Volume2 size={13} color="#15803D" />
                          <Text style={styles.ttsBtnText}>
                            {currentLangConfig.audioListenText}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                )}

                {/* Message Body Text */}
                <Text
                  style={[
                    styles.messageText,
                    isAi ? styles.messageTextAi : styles.messageTextUser,
                  ]}
                >
                  {msg.text}
                </Text>

                {/* Optional Action Route Button */}
                {msg.actionButton && (
                  <Pressable
                    style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.88 }]}
                    onPress={() => router.push(msg.actionButton!.route as any)}
                  >
                    <Text style={styles.actionButtonText}>{msg.actionButton.label}</Text>
                    <ArrowRight size={13} color="#FFFFFF" strokeWidth={2.4} />
                  </Pressable>
                )}

                <Text style={styles.timestampText}>{msg.timestamp}</Text>
              </View>

              {/* Follow-up Prompts for AI Messages */}
              {isAi && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                <View style={styles.followUpsWrap}>
                  {msg.suggestedPrompts.map((prompt, pIdx) => (
                    <Pressable
                      key={pIdx}
                      style={styles.followUpChip}
                      onPress={() => handleSendMessage(prompt)}
                    >
                      <Text style={styles.followUpChipText}>• {prompt}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Thinking Indicator */}
        {isThinking && (
          <View style={styles.thinkingContainer}>
            <ActivityIndicator size="small" color="#16A34A" />
            <Text style={styles.thinkingText}>
              Kisan AI Saathi is analyzing crops, mandi prices & agronomical data...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── 5. Bottom Input Dock ─────────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={[styles.inputDock, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={styles.dockTextInput}
            placeholder={currentLangConfig.inputPlaceholder}
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSendMessage()}
            returnKeyType="send"
            multiline={false}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voice Prompt"
            style={({ pressed }) => [styles.dockMicBtn, pressed && { transform: [{ scale: 0.94 }] }]}
            onPress={() => handleSendMessage('मेरी फसलों और आय का विश्लेषण करें')}
            hitSlop={6}
          >
            <Mic size={18} color="#15803D" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send Message"
            style={({ pressed }) => [
              styles.sendBtn,
              (!inputText.trim() || isThinking) && styles.sendBtnDisabled,
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isThinking}
          >
            {isThinking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={16} color="#FFFFFF" strokeWidth={2.4} />
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  langDropdown: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langOptionActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  langOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  langOptionTextActive: {
    color: '#15803D',
    fontWeight: '800',
  },
  telemetryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  telemetryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  telemetryDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  telemetryText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  quickChipsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  quickChipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 14,
  },
  messageContainer: {
    maxWidth: '92%',
  },
  messageContainerAi: {
    alignSelf: 'flex-start',
  },
  messageContainerUser: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  bubbleUser: {
    backgroundColor: '#15803D',
  },
  aiMessageTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    gap: 8,
  },
  aiAvatarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16A34A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiAvatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mandiPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mandiPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  ttsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ttsBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  ttsBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  ttsBtnTextActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
  },
  messageTextAi: {
    color: '#1E293B',
  },
  messageTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#15803D',
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timestampText: {
    fontSize: 10,
    color: '#94A3B8',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  followUpsWrap: {
    marginTop: 8,
    gap: 5,
  },
  followUpChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  followUpChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignSelf: 'flex-start',
  },
  thinkingText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  inputDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  dockTextInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dockMicBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
});
