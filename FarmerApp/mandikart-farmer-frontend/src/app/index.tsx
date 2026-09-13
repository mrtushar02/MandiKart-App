import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Image,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TypingText } from '@/components/ui/TypingText';
import { useTranslation } from '@/hooks/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';

const GIF_SOURCE = require('../../assets/images/tabIcons/InShot_Crystal_Clear_Enhanced.gif');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isAuthenticated, isOnboarded, user, farmer, hydrateAuth } = useAuthStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hydrateAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const isComplete = Boolean(
        isOnboarded ||
        user?.isOnboarded ||
        user?.isProfileCompleted ||
        (user?.role === 'FPO' && (user?.fpoDetails?.fpoName || user?.village)) ||
        ((farmer?.village || user?.village) && (farmer?.farmSizeAcres || user?.farmSizeAcres || (farmer as any)?.farm_size_acres))
      );
      if (isComplete) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding/permissions');
      }
    }
  }, [isAuthenticated, isOnboarded, user, farmer, router]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleGetStarted = () => {
    router.push('/language-select');
  };

  const handleSkipToDashboard = () => {
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    } else {
      router.push('/auth/login');
    }
  };

  const phrases = [
    t.typingText1,
    t.typingText2,
    t.typingText3,
    t.typingText4,
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── 100% Full-Screen Animated GIF Background ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={GIF_SOURCE}
          style={styles.fullScreenGif}
          resizeMode="cover"
        />
        
        {/* Subtle Overlay Gradient for perfect readability */}
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0.40)',
            'rgba(0, 0, 0, 0.15)',
            'rgba(0, 0, 0, 0.50)',
            'rgba(4, 18, 8, 0.92)',
          ]}
          locations={[0, 0.35, 0.70, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* ── Screen Content Layout ── */}
      <View
        style={[
          styles.layout,
          {
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom + 20, 36),
          },
        ]}
      >
        {/* ── Spacer pushing title & button to bottom ── */}
        <View style={styles.flexSpacer} />

        {/* ── Bottom Section: Title, Typing Animation & 3D CTA Button ── */}
        <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
          <View style={styles.centerBlock}>
            <Text style={styles.heroTitle}>{t.welcomeTitle}</Text>

            <View style={styles.typingRow}>
              <TypingText
                phrases={phrases}
                typingSpeed={50}
                deleteSpeed={25}
                delayBetweenPhrases={2000}
                style={styles.typingStyle}
                cursorStyle={styles.typingCursor}
              />
            </View>
          </View>

          {/* ── 3D Cylinder Green GET STARTED Button ── */}
          <View style={styles.bottomArea}>
            <View style={styles.getStartedBtnWrapper}>
              <Pressable
                onPress={handleGetStarted}
                style={({ pressed }) => [
                  styles.getStartedPressable,
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
              >
                {/* Dark 3D Extrusion Shadow Base */}
                <View style={styles.getStarted3DBase} pointerEvents="none">
                  {/* Vibrant Cylinder Gradient Surface */}
                  <LinearGradient
                    colors={['#4ADE80', '#22C55E', '#16A34A', '#15803D', '#0F5426']}
                    locations={[0, 0.22, 0.65, 0.9, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.getStartedCylinderSurface}
                  >
                    {/* 3D Glass Curved Gloss Highlight */}
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0.05)']}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.cylinderGlossSheen}
                    />

                    {/* Content Row: Text & Arrow Badge */}
                    <View style={styles.btnContentRow}>
                      <Text style={styles.getStartedText}>
                        {t.getStarted || 'GET STARTED'}
                      </Text>
                      <View style={styles.iconCircleBadge}>
                        <ArrowRight size={18} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </Pressable>
            </View>

            {/* Direct Dashboard Access Button */}
            <Pressable
              onPress={handleSkipToDashboard}
              style={({ pressed }) => [styles.skipButton, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.skipButtonText}>
                Open App Dashboard (Home, Produce, Orders) →
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenGif: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  layout: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.45)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  brandBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#86EFAC',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  flexSpacer: {
    flex: 1,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 24,
  },
  centerBlock: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
    marginBottom: 12,
  },
  typingRow: {
    alignItems: 'center',
    minHeight: 32,
  },
  typingStyle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FDE047',
    textAlign: 'center',
    letterSpacing: 0.4,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  typingCursor: {
    color: '#FEF08A',
    fontWeight: '800',
    fontStyle: 'normal',
  },

  /* ── 3D Cylinder Style Green GET STARTED Button ── */
  bottomArea: {
    alignItems: 'center',
    width: '100%',
  },
  getStartedBtnWrapper: {
    width: '100%',
    height: 64,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  getStartedPressable: {
    width: '100%',
    height: '100%',
  },
  getStartedBtnPressed: {
    transform: [{ translateY: 4 }],
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  getStarted3DBase: {
    width: '100%',
    height: 64,
    backgroundColor: '#092E15',
    borderRadius: 32,
    paddingBottom: 6,
  },
  getStartedCylinderSurface: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderBottomWidth: 3.5,
    borderBottomColor: '#0A3A16',
  },
  cylinderGlossSheen: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: '44%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  btnContentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  getStartedText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.6,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  iconCircleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  skipButton: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#86EFAC',
    letterSpacing: 0.3,
  },
});


