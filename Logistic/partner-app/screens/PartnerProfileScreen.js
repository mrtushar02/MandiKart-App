import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';
import { usePartner } from '../context/PartnerContext';
import PartnerHeader from '../components/PartnerHeader';

export default function PartnerProfileScreen({ navigation }) {
  const { partnerProfile, logout } = usePartner();
  const [selectedLang, setSelectedLang] = useState('English');

  const initials = (partnerProfile.name || 'D P')
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DP';

  const handleLogout = () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to end your session? You will need to login again to access your delivery dashboard.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // End authenticated session
            logout();
            // Reset navigation stack to Login screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <PartnerHeader
        title="Partner Profile"
        subtitle="ID & Account Settings"
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              {partnerProfile.avatarUrl || (partnerProfile.avatar && partnerProfile.avatar.startsWith('http')) ? (
                <Image
                  source={{ uri: partnerProfile.avatarUrl || partnerProfile.avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
              <View style={styles.onlineBadge} />
            </View>

            <View style={styles.profileMeta}>
              <Text style={styles.partnerName}>{partnerProfile.name}</Text>
              <Text style={styles.partnerId}>
                {partnerProfile.email || partnerProfile.phone || partnerProfile.id} • {partnerProfile.role}
              </Text>
              <View style={styles.tierPill}>
                <Ionicons name="ribbon" size={14} color={COLORS.accentDark} />
                <Text style={styles.tierPillText}>{partnerProfile.badge || 'Verified Driver'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsSummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>⭐ {partnerProfile.rating}</Text>
              <Text style={styles.summaryLabel}>Rating</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{partnerProfile.totalDeliveries}</Text>
              <Text style={styles.summaryLabel}>Trips</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{(partnerProfile.city || 'Bhubaneswar, Odisha').split(',')[0]}</Text>
              <Text style={styles.summaryLabel}>Hub Base</Text>
            </View>
          </View>
        </View>

        {/* Assigned Vehicle */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Assigned Logistics Vehicle</Text>
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleIconBg}>
              <MaterialCommunityIcons name="moped" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleModel}>{partnerProfile.vehicle?.model || 'Hero Electric Nyx ER'}</Text>
              <Text style={styles.vehiclePlate}>{partnerProfile.vehicle?.plateNumber || 'OD-02-MK-9912'}</Text>
              <Text style={styles.vehicleCapacity}>Max Produce Capacity: {partnerProfile.vehicle?.maxLoadKg || 120} kg</Text>
            </View>
            <View style={styles.evBadge}>
              <Text style={styles.evBadgeText}>100% EV</Text>
            </View>
          </View>
        </View>

        {/* KYC Verification Badges */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Verification & Compliance</Text>
          <View style={styles.kycGrid}>
            <View style={styles.kycItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.kycLabel}>Aadhaar Card</Text>
            </View>
            <View style={styles.kycItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.kycLabel}>Driving License</Text>
            </View>
            <View style={styles.kycItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.kycLabel}>Vehicle RC</Text>
            </View>
            <View style={styles.kycItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.kycLabel}>PAN Card</Text>
            </View>
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>App Language / ଭାଷା</Text>
          <View style={styles.langRow}>
            {['English', 'हिन्दी', 'ଓଡ଼ିଆ'].map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.langChip, selectedLang === lang && styles.langChipActive]}
                onPress={() => setSelectedLang(lang)}
                activeOpacity={0.8}
              >
                <Text style={[styles.langText, selectedLang === lang && styles.langTextActive]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Menu Options */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
            <Text style={styles.menuItemText}>Notifications & Announcements</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.outlineVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('HelpSupport')}
            activeOpacity={0.7}
          >
            <Ionicons name="help-buoy-outline" size={20} color={COLORS.primary} />
            <Text style={styles.menuItemText}>Help & SOS Support Center</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.outlineVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('LegalPolicies')}
            activeOpacity={0.7}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
            <Text style={styles.menuItemText}>Terms, Insurance & Legal Policies</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.outlineVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Intro')}
            activeOpacity={0.7}
          >
            <Ionicons name="videocam-outline" size={20} color={COLORS.primary} />
            <Text style={styles.menuItemText}>Re-play Video Intro (3.8s)</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.outlineVariant} />
          </TouchableOpacity>
        </View>

        {/* ——— Bad Delivery & Dispute Section ——— */}
        <View style={styles.sectionLabel}>
          <Ionicons name="alert-circle-outline" size={15} color={COLORS.error} />
          <Text style={styles.sectionLabelText}>DELIVERY ISSUES & DISPUTES</Text>
        </View>

        <View style={styles.badDeliveryCard}>
          {/* Header row */}
          <View style={styles.bdCardHeader}>
            <View style={styles.bdIconBg}>
              <Ionicons name="shield-checkmark" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bdCardTitle}>MandiKart Partner Protection</Text>
              <Text style={styles.bdCardSubtitle}>Zero penalty on produce rejection or road damage</Text>
            </View>
          </View>

          {/* Quick reason pills */}
          <View style={styles.reasonPillsRow}>
            {['Damaged Produce', 'Buyer Rejected', 'Weight Mismatch', 'Farmer Unavailable', 'Vehicle Breakdown'].map((r) => (
              <TouchableOpacity
                key={r}
                style={styles.reasonPill}
                onPress={() => navigation.navigate('BadDelivery')}
                activeOpacity={0.8}
              >
                <Text style={styles.reasonPillText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CTA button */}
          <TouchableOpacity
            style={styles.bdReportBtn}
            onPress={() => navigation.navigate('BadDelivery')}
            activeOpacity={0.85}
          >
            <Ionicons name="warning-outline" size={18} color={COLORS.white} />
            <Text style={styles.bdReportBtnText}>Report a Bad Delivery / Dispute</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>

          {/* Helpline row */}
          <TouchableOpacity
            style={styles.bdHelplineRow}
            onPress={() => Alert.alert('Dispute Manager', 'Connecting to MandiKart Dispute Resolution Officer (+91 94371 99001)...')}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={14} color={COLORS.primary} />
            <Text style={styles.bdHelplineText}>Speak to Dispute Manager · 24/7 Helpline</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
    gap: SPACING.lg,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    gap: SPACING.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  avatarInitials: {
    fontSize: FONT.xxl,
    fontWeight: '900',
    color: COLORS.primary,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileMeta: {
    flex: 1,
  },
  partnerName: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.onSurface,
  },
  partnerId: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    marginTop: 4,
    gap: 4,
  },
  tierPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentDark,
  },
  statsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerLow,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  summaryLabel: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.outlineVariant,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT.md,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  vehicleIconBg: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleModel: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  vehiclePlate: {
    fontSize: FONT.xs,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 1,
  },
  vehicleCapacity: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  evBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  evBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
  },
  kycGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  kycItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 6,
    width: '48%',
  },
  kycLabel: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  langRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  langChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  langChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langText: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  langTextActive: {
    color: COLORS.white,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainerLow,
    gap: SPACING.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: FONT.base,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.errorLight,
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  logoutBtnText: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.error,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginTop: -4,
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.error,
    letterSpacing: 0.8,
  },
  badDeliveryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  bdCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bdIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bdCardTitle: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.primary,
  },
  bdCardSubtitle: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  reasonPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonPill: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  reasonPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.error,
  },
  bdReportBtn: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  bdReportBtnText: {
    color: COLORS.white,
    fontSize: FONT.base,
    fontWeight: '800',
  },
  bdHelplineRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  bdHelplineText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
