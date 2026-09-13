import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar, Alert, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../services/apiClient';

import { useLanguage, SupportedLanguage } from '../../context/LanguageContext';
import { useLocation } from '../../context/LocationContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, updateUser, logout } = useAuth();
  const { currentLanguageOption, setLanguage, t } = useLanguage();
  const { savedAddresses, currentAddress } = useLocation();

  const displayName = user?.fullName || (user?.phone ? `Buyer ${user.phone}` : (user?.email ? user.email.split('@')[0] : 'Valued Buyer'));
  const displayContact = user?.phone ? `${user.phone}${user.email ? ` • ${user.email}` : ''}` : (user?.email || 'MandiKart Member');
  const initialLetter = displayName.charAt(0).toUpperCase() || 'B';

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const displayAvatar = user?.avatarUrl;

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera roll access to update your profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const localUri = result.assets[0].uri;
        updateUser({ avatarUrl: localUri });
        setUploadingAvatar(true);

        const uploadRes = await apiClient.storage.uploadImage(localUri, 'avatars');
        setUploadingAvatar(false);
        if (uploadRes?.url) {
          updateUser({ avatarUrl: uploadRes.url });
          Alert.alert(
            'Photo Uploaded! 📸',
            `Your profile photo was compressed to WebP and saved securely.\nStorage saved: ${uploadRes.savingsPercent}%`
          );
        }
      }
    } catch (err: any) {
      setUploadingAvatar(false);
      Alert.alert('Upload Error', err?.message || 'Failed to upload profile photo');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to logout from MandiKart?')) {
        logout?.();
      }
    } else {
      Alert.alert(
        'Logout 🚪',
        'Are you sure you want to logout from MandiKart?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: () => logout?.() },
        ]
      );
    }
  };

  const handleLanguageChange = () => {
    if (Platform.OS === 'web') {
      const order: SupportedLanguage[] = ['en', 'or', 'hi', 'mr'];
      const nextIdx = (order.indexOf(currentLanguageOption.code as SupportedLanguage) + 1) % order.length;
      setLanguage(order[nextIdx]);
    } else {
      Alert.alert(
        t('selectLanguage', 'Select Language 🌐'),
        t('chooseLanguage', 'Choose your preferred app language:'),
        [
          { text: 'English (IN)', onPress: () => setLanguage('en') },
          { text: 'ଓଡ଼ିଆ (Odia)', onPress: () => setLanguage('or') },
          { text: 'हिंदी (Hindi)', onPress: () => setLanguage('hi') },
          { text: 'मराठी (Marathi)', onPress: () => setLanguage('mr') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Account</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* User Hero Card */}
        <View style={styles.userHeroCard}>
          <TouchableOpacity
            style={styles.userAvatarWrap}
            onPress={handlePickAvatar}
            activeOpacity={0.8}
          >
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initialLetter}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={11} color={Colors.white} />
            </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{displayName}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                <Text style={styles.verifiedText}>Verified Buyer</Text>
              </View>
            </View>
            <Text style={styles.userContact}>{displayContact}</Text>

            {/* Active Delivery Location Indicator */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}
              onPress={() => navigation.navigate('DeliveryAddress' as any)}
            >
              <Ionicons name="location" size={13} color={Colors.primary} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.primary }} numberOfLines={1}>
                Deliver to: {currentAddress ? (currentAddress.formattedAddress) : 'Pune, Maharashtra'}
              </Text>
            </TouchableOpacity>

            {/* Loyalty Badge */}
            <View style={styles.loyaltyTag}>
              <Ionicons name="sparkles" size={12} color="#D97706" />
              <Text style={styles.loyaltyText}>🌱 MandiKart Direct Farm Member</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editIconBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Cards */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Main', { screen: 'Orders' } as any)}
          >
            <Ionicons name="receipt" size={20} color={Colors.primary} />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Wishlist')}
          >
            <Ionicons name="heart" size={20} color="#EF4444" />
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('DeliveryAddress' as any)}
          >
            <Ionicons name="location" size={20} color="#3B82F6" />
            <Text style={styles.statNumber}>{savedAddresses.length}</Text>
            <Text style={styles.statLabel}>Addresses</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <Ionicons name="wallet" size={20} color="#10B981" />
            <Text style={styles.statNumber}>₹420</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>

        {/* Green Impact Banner */}
        <View style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <Text style={styles.impactEmoji}>🌾</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.impactTitle}>Direct Farm Impact</Text>
              <Text style={styles.impactSub}>You supported 5 local farmers in Nashik & Pune!</Text>
            </View>
          </View>
          <View style={styles.impactBarBg}>
            <View style={[styles.impactBarFill, { width: '70%' }]} />
          </View>
        </View>

        {/* Menu Section 1: Orders & Activity */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>My Activity</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('Main', { screen: 'Orders' } as any)}
          >
            <View style={styles.menuIconBg}>
              <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Orders & Refunds</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('Wishlist')}
          >
            <View style={styles.menuIconBg}>
              <Ionicons name="heart-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Wishlist & Favorite Produce</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('ChatStack', { screen: 'ChatList' })}
          >
            <View style={styles.menuIconBg}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Farmer Messages & Chats</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('Analytics')}
          >
            <View style={[styles.menuIconBg, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="stats-chart" size={18} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Market Analytics & GMV Graphs</Text>
              <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '500' }}>Mandi telemetry</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </TouchableOpacity>
        </View>

        {/* Menu Section 2: Account & Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Account & Addresses</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={styles.menuIconBg}>
              <Ionicons name="person-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Edit Personal Profile</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('DeliveryAddress' as any)}
          >
            <View style={styles.menuIconBg}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Saved Delivery Addresses</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={styles.menuIconBg}>
              <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
              thumbColor={notificationsEnabled ? Colors.primary : Colors.white}
            />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuRow} onPress={handleLanguageChange}>
            <View style={styles.menuIconBg}>
              <Ionicons name="language-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>{t('appLanguage', 'App Language')}</Text>
            <Text style={styles.menuValueText}>{currentLanguageOption.nativeName}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </TouchableOpacity>
        </View>

        {/* Menu Section 3: Support & App Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Help & Preferences</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('MandKart 24/7 Support 🎧', 'Our customer support team is available 24/7. Call us at 1800-MANDI-KART.')}
          >
            <View style={styles.menuIconBg}>
              <Ionicons name="headset-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>24x7 Customer Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Share App 📲', 'Share MandiKart with your friends and get ₹50 referral bonus!')}
          >
            <View style={styles.menuIconBg}>
              <Ionicons name="share-social-outline" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Refer & Earn Produce Credit</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textDisabled} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout of Account</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>MandiKart Direct Farm v1.2.0 • Made with ❤️ in India</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  settingsBtn: { padding: 4 },
  scroll: { padding: Spacing.md, paddingTop: 0, gap: Spacing.md, paddingBottom: 40 },
  // Hero User Card
  userHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  userAvatarWrap: { position: 'relative' },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.gray100,
  },
  avatarText: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  cameraBadge: {
    position: 'absolute',
    bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2, borderColor: Colors.white,
  },
  userInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  userContact: { fontSize: 11, color: Colors.textSecondary },
  loyaltyTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  loyaltyText: { fontSize: 10, fontWeight: '700', color: '#B45309' },
  editIconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  // Stats Row
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 2,
    ...Shadows.sm,
  },
  statNumber: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  statLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  // Impact Card
  impactCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  impactHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  impactEmoji: { fontSize: 24 },
  impactTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  impactSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  impactBarBg: { height: 6, backgroundColor: Colors.gray100, borderRadius: 3, overflow: 'hidden' },
  impactBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  // Menu Section
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 2,
    ...Shadows.sm,
  },
  sectionHeaderTitle: { fontSize: 13, fontWeight: '800', color: Colors.textSecondary, marginBottom: 8, letterSpacing: 0.5 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: Spacing.sm,
  },
  menuIconBg: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  menuValueText: { fontSize: 12, fontWeight: '600', color: Colors.primary, marginRight: 4 },
  menuDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 2 },
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 4,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: Colors.error },
  versionText: { textAlign: 'center', fontSize: 11, color: Colors.textDisabled, marginVertical: 12 },
});
