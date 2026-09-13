/**
 * MandiKart Farmer App — Screen 2: Language Selection (Full Multi-language & Animated)
 * 
 * Supports: English, Hindi, Odia, Marathi, Punjabi, Tamil, Telugu, Bengali, Gujarati, Kannada.
 * All languages are fully functional across the app.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Globe, Check, ArrowRight, ArrowLeft, ShoppingBasket, Leaf } from 'lucide-react-native';
import { MKBackground, MKButton } from '@/components/ui';
import { useAppStore, LanguageCode } from '@/store/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { FrontendConsentService } from '@/services/consentService';

interface LanguageOption {
  code: LanguageCode;
  name: string;
  englishName: string;
  character?: string;
  isGlobe?: boolean;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    englishName: 'English',
    isGlobe: true,
  },
  {
    code: 'hi',
    name: 'हिन्दी',
    englishName: 'Hindi',
    character: 'अ',
  },
  {
    code: 'or',
    name: 'ଓଡ଼ିଆ',
    englishName: 'Odia / Oriya',
    character: 'ଓ',
  },
  {
    code: 'mr',
    name: 'मराठी',
    englishName: 'Marathi',
    character: 'म',
  },
  {
    code: 'pa',
    name: 'ਪੰਜਾਬੀ',
    englishName: 'Punjabi',
    character: 'ੳ',
  },
  {
    code: 'ta',
    name: 'தமிழ்',
    englishName: 'Tamil',
    character: 'அ',
  },
  {
    code: 'te',
    name: 'తెలుగు',
    englishName: 'Telugu',
    character: 'అ',
  },
  {
    code: 'bn',
    name: 'বাংলা',
    englishName: 'Bengali',
    character: 'অ',
  },
  {
    code: 'gu',
    name: 'ગુજરાતી',
    englishName: 'Gujarati',
    character: 'અ',
  },
  {
    code: 'kn',
    name: 'ಕನ್ನಡ',
    englishName: 'Kannada',
    character: 'ಅ',
  },
];

export default function LanguageSelectScreen() {
  const router = useRouter();
  const { language, setLanguage } = useAppStore();
  const { t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(language || 'en');

  const handleSelectLanguage = (code: LanguageCode) => {
    setSelectedLang(code);
    setLanguage(code); // Update global store instantly so UI reacts in real-time
  };

  const handleContinue = async () => {
    setLanguage(selectedLang);
    router.push('/auth/signup');
  };

  return (
    <MKBackground>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.container}>
            {/* Top Bar Row with Back Button */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.topBarRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back to Welcome Screen"
                hitSlop={12}
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/');
                  }
                }}
                style={styles.backBtn}
              >
                <ArrowLeft size={22} color="#1E5A2A" strokeWidth={2.4} />
              </Pressable>
            </Animated.View>

            {/* Animated Header Section */}
            <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
              <View style={styles.logoBadge}>
                <ShoppingBasket size={30} color="#8A4A1C" strokeWidth={2.2} />
                <View style={styles.logoLeafWrapper}>
                  <Leaf size={10} color="#1E5A2A" strokeWidth={2.5} fill="#1E5A2A" />
                </View>
              </View>

              <Text style={styles.logoText}>
                <Text style={styles.logoTextDark}>Mandi</Text>
                <Text style={styles.logoTextBrown}>Kart</Text>
              </Text>

              <Text style={styles.screenTitle}>
                {t.chooseLanguage}
              </Text>
              <Text style={styles.screenSubtitle}>
                {t.selectComfortableLang}
              </Text>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerLeafWrapper}>
                  <Leaf size={12} color="#1E5A2A" strokeWidth={2} />
                </View>
                <View style={styles.dividerLine} />
              </View>
            </Animated.View>

            {/* Language Selection Grid */}
            <Animated.View entering={FadeInUp.duration(600).delay(150)} style={styles.languagesList}>
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLang === lang.code;

                return (
                  <Pressable
                    key={lang.code}
                    onPress={() => handleSelectLanguage(lang.code)}
                    style={[
                      styles.languageCard,
                      isSelected ? styles.languageCardSelected : styles.languageCardUnselected,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    {/* Language Badge */}
                    <View
                      style={[
                        styles.langIconBadge,
                        isSelected ? styles.langIconBadgeSelected : styles.langIconBadgeUnselected,
                      ]}
                    >
                      {lang.isGlobe ? (
                        <Globe size={22} color="#1E5A2A" strokeWidth={2} />
                      ) : (
                        <Text
                          style={[
                            styles.langCharacter,
                            isSelected ? styles.langCharacterSelected : styles.langCharacterNormal,
                          ]}
                        >
                          {lang.character}
                        </Text>
                      )}
                      <View style={styles.tinyLeafWrapper}>
                        <Leaf size={7} color="#1E5A2A" strokeWidth={2.5} />
                      </View>
                    </View>

                    {/* Language Labels */}
                    <View style={styles.langTextContainer}>
                      <Text style={[styles.langNativeName, isSelected && styles.langNativeNameSelected]}>
                        {lang.name}
                      </Text>
                      <Text style={styles.langEnglishName}>{lang.englishName}</Text>
                    </View>

                    {/* Selection Indicator */}
                    {isSelected ? (
                      <View style={styles.checkCircle}>
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    ) : (
                      <View style={styles.radioCircle} />
                    )}
                  </Pressable>
                );
              })}
            </Animated.View>

            {/* Footer Actions & Dots */}
            <View style={styles.footer}>
              <MKButton
                title={t.continueBtn}
                onPress={handleContinue}
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />}
              />

              <Text style={styles.footerNote}>
                {t.languageNote}
              </Text>

              <Pressable onPress={() => router.push('/more/terms-privacy')}>
                <Text style={{ fontSize: 12, color: '#16a34a', textAlign: 'center', marginTop: 10, textDecorationLine: 'underline', fontWeight: '600' }}>
                  MandiKart Terms & Privacy Charter ↗
                </Text>
              </Pressable>

              {/* Step indicator */}
              <View style={styles.paginationDots}>
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </MKBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8F5E9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    position: 'relative',
    marginBottom: 10,
  },
  logoLeafWrapper: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  logoTextDark: {
    color: '#2B2B2B',
  },
  logoTextBrown: {
    color: '#8A4A1C',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E5A2A',
    marginBottom: 4,
    textAlign: 'center',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#5F6368',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    marginTop: 14,
    opacity: 0.5,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#9AA0A6',
  },
  dividerLeafWrapper: {
    paddingHorizontal: 8,
  },
  languagesList: {
    gap: 10,
    marginBottom: 20,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  languageCardSelected: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#1E5A2A',
    shadowOpacity: 0.08,
  },
  languageCardUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0ECE4',
    shadowOpacity: 0.03,
  },
  langIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  langIconBadgeSelected: {
    backgroundColor: 'rgba(30, 90, 42, 0.15)',
  },
  langIconBadgeUnselected: {
    backgroundColor: '#FFF0E6',
  },
  langCharacter: {
    fontSize: 18,
    fontWeight: '700',
  },
  langCharacterSelected: {
    color: '#1E5A2A',
  },
  langCharacterNormal: {
    color: '#8A4A1C',
  },
  tinyLeafWrapper: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  langTextContainer: {
    flex: 1,
  },
  langNativeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 2,
  },
  langNativeNameSelected: {
    color: '#1E5A2A',
  },
  langEnglishName: {
    fontSize: 12,
    color: '#5F6368',
    fontWeight: '400',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E5A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D8D4CA',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  footerNote: {
    fontSize: 12,
    color: '#7A7A7A',
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 14,
    textAlign: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5D5C5',
  },
  dotActive: {
    backgroundColor: '#1E5A2A',
    width: 10,
    height: 10,
  },
});
