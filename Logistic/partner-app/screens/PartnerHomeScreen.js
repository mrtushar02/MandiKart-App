import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';
import { usePartner } from '../context/PartnerContext';
import PartnerHeader from '../components/PartnerHeader';
import DeliveryStepper from '../components/DeliveryStepper';

export default function PartnerHomeScreen({ navigation }) {
  const {
    isOnline,
    todayStats,
    activeDelivery,
    availableDeliveries,
    acceptDelivery,
    declineDelivery,
  } = usePartner();

  return (
    <SafeAreaView style={styles.container}>
      {/* Universal Partner Header with Online Toggle */}
      <PartnerHeader navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Offline Warning Banner if partner toggles offline */}
        {!isOnline && (
          <View style={styles.offlineNotice}>
            <Ionicons name="moon" size={18} color={COLORS.onSurfaceVariant} />
            <Text style={styles.offlineNoticeText}>
              You are currently OFFLINE. Turn online to receive nearby farm delivery requests.
            </Text>
          </View>
        )}

        {/* 1. Today's Earnings Hero Card (Exact Stitch port) */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => navigation.navigate('Earnings')}
          activeOpacity={0.9}
        >
          {/* Watermark icon */}
          <View style={styles.heroWatermark}>
            <MaterialCommunityIcons name="cash-multiple" size={100} color="rgba(255,255,255,0.08)" />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>TODAY'S EARNINGS</Text>
            <View style={styles.heroAmountRow}>
              <Text style={styles.heroAmount}>₹{todayStats.earnings}</Text>
              <View style={styles.growthBadge}>
                <Ionicons name="arrow-up" size={12} color={COLORS.accentDark} />
                <Text style={styles.growthText}>+{todayStats.earningsGrowthPercent}% vs yesterday</Text>
              </View>
            </View>
            <View style={styles.heroFooter}>
              <Text style={styles.heroTrips}>{todayStats.deliveriesCompleted} deliveries completed</Text>
              <View style={styles.viewEarningsPill}>
                <Text style={styles.viewEarningsText}>View Payout Details →</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* 2. Quick Stats Row (Exact Stitch port) */}
        <View style={styles.quickStatsRow}>
          <View style={styles.statBox}>
            <View style={[styles.statIconBg, { backgroundColor: COLORS.primaryBg }]}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>{todayStats.deliveriesCompleted}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconBg, { backgroundColor: COLORS.surfaceContainerLow }]}>
              <Ionicons name="map" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>{todayStats.distanceKm} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconBg, { backgroundColor: COLORS.surfaceContainerLow }]}>
              <Ionicons name="time" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>{todayStats.onlineHours}</Text>
            <Text style={styles.statLabel}>Online Time</Text>
          </View>
        </View>

        {/* 3. Active Delivery Card (Exact Stitch port) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Delivery</Text>
          {activeDelivery && (
            <TouchableOpacity
              onPress={() => navigation.navigate('DeliveryDetail')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionAction}>View Order Details →</Text>
            </TouchableOpacity>
          )}
        </View>

        {activeDelivery ? (
          <View style={styles.activeDeliveryCard}>
            <View style={styles.activeTopStripe} />

            <View style={styles.activeCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderId}>Order #{activeDelivery.id}</Text>
                <Text style={styles.orderTitle}>{activeDelivery.title}</Text>
                <Text style={styles.orderQuantity}>
                  {activeDelivery.quantity} • Value: ₹{Number(activeDelivery.totalPrice || activeDelivery.totalAmount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.payoutBadge}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase' }}>Payout</Text>
                <Text style={styles.payoutBadgeText}>+₹{activeDelivery.payout}</Text>
              </View>
            </View>

            {/* Pickup -> Drop location box */}
            <View style={styles.routeBox}>
              <View style={styles.locationRow}>
                <Ionicons name="leaf" size={18} color={COLORS.primary} />
                <View style={styles.locInfo}>
                  <Text style={styles.locRole}>Pickup Farm</Text>
                  <Text style={styles.locName}>{activeDelivery.pickup?.name || activeDelivery.pickupName || 'Farmgate Pickup'}</Text>
                </View>
              </View>

              <View style={styles.verticalTrack} />

              <View style={styles.locationRow}>
                <Ionicons name="location" size={18} color={COLORS.error} />
                <View style={styles.locInfo}>
                  <Text style={styles.locRole}>Destination Mandi / Customer</Text>
                  <Text style={styles.locName}>{activeDelivery.drop?.name || activeDelivery.dropName || 'Destination Hub'}</Text>
                  <Text style={styles.locDistance}>{activeDelivery.distanceKm} km away • Est. {activeDelivery.estimatedTimeMins} mins</Text>
                </View>
              </View>
            </View>

            {/* Visual Delivery Stepper */}
            <DeliveryStepper currentStep={activeDelivery.currentStepIndex} />

            {/* Action buttons */}
            <View style={styles.activeActionRow}>
              <TouchableOpacity
                style={styles.navigateBtn}
                onPress={() => navigation.navigate('ActiveRoute')}
                activeOpacity={0.85}
              >
                <Ionicons name="navigate" size={18} color={COLORS.white} />
                <Text style={styles.navigateBtnText}>Live GPS Navigation</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.podBtn}
                onPress={() => navigation.navigate('DeliveryPOD')}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-done" size={18} color={COLORS.primary} />
                <Text style={styles.podBtnText}>Complete POD</Text>
              </TouchableOpacity>
            </View>

            {/* Bad Delivery & Issue Resolution Button */}
            <TouchableOpacity
              style={styles.badDeliveryBtn}
              onPress={() => navigation.navigate('BadDelivery')}
              activeOpacity={0.8}
            >
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.badDeliveryBtnText}>Produce Damaged or Rejected? Report Bad Delivery →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noActiveCard}>
            <MaterialCommunityIcons name="truck-check-outline" size={40} color={COLORS.primaryLight} />
            <Text style={styles.noActiveTitle}>No active delivery right now</Text>
            <Text style={styles.noActiveSubtitle}>Accept one of the available farm orders below to start earning!</Text>
          </View>
        )}

        {/* 4. Available Deliveries Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Farm Pickups</Text>
          <Text style={styles.countBadge}>{availableDeliveries.length} available</Text>
        </View>

        <View style={styles.availableList}>
          {availableDeliveries.map(item => (
            <View key={item.id} style={styles.availableCard}>
              <View style={styles.availHeader}>
                <View style={styles.availBadge}>
                  <Text style={styles.availBadgeText}>{item.tag || 'FRESH HARVEST'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.availPayout}>₹{item.payout}</Text>
                  <Text style={{ fontSize: 10, color: COLORS.onSurfaceVariant, fontWeight: '700' }}>
                    Payout • ₹{Number(item.totalPrice || item.totalAmount || (item.payout * 8)).toLocaleString('en-IN')} Value
                  </Text>
                </View>
              </View>

              <Text style={styles.availTitle}>{item.title}</Text>
              <Text style={styles.availQuantity}>
                {item.quantity} • {item.pricePerKg ? `₹${item.pricePerKg}/kg • ` : ''}{item.distanceKm} km
              </Text>

              <View style={styles.availRouteRow}>
                <Ionicons name="business-outline" size={16} color={COLORS.onSurfaceVariant} />
                <Text style={styles.availRouteText} numberOfLines={1}>
                  From: {item.pickupName}
                </Text>
              </View>

              <View style={styles.availRouteRow}>
                <Ionicons name="flag-outline" size={16} color={COLORS.onSurfaceVariant} />
                <Text style={styles.availRouteText} numberOfLines={1}>
                  To: {item.dropName}
                </Text>
              </View>

              <View style={styles.availActionRow}>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={() => declineDelivery(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.declineBtnText}>Pass</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => acceptDelivery(item.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.acceptBtnText}>Accept Pickup</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 40,
    gap: SPACING.lg,
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  offlineNoticeText: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    flex: 1,
    lineHeight: 16,
  },
  heroCard: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  heroWatermark: {
    position: 'absolute',
    right: -10,
    top: -10,
  },
  heroContent: {
    zIndex: 2,
    gap: SPACING.xs,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.8,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.md,
  },
  heroAmount: {
    fontSize: FONT.hero,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    gap: 3,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentDark,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  heroTrips: {
    fontSize: FONT.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  viewEarningsPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  viewEarningsText: {
    fontSize: FONT.xs,
    color: COLORS.white,
    fontWeight: '700',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: 2,
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  statLabel: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  sectionAction: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  countBadge: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  activeDeliveryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: SPACING.md,
  },
  activeTopStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.primary,
  },
  activeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  orderTitle: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  orderQuantity: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },
  payoutBadge: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  payoutBadgeText: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.primary,
  },
  routeBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  verticalTrack: {
    width: 2,
    height: 14,
    backgroundColor: COLORS.outlineVariant,
    marginLeft: 8,
  },
  locInfo: {
    flex: 1,
  },
  locRole: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  locName: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  locDistance: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  activeActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  navigateBtn: {
    flex: 1.2,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  navigateBtnText: {
    color: COLORS.white,
    fontSize: FONT.base,
    fontWeight: '800',
  },
  podBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  podBtnText: {
    color: COLORS.primary,
    fontSize: FONT.base,
    fontWeight: '800',
  },
  badDeliveryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 6,
    marginTop: 2,
  },
  badDeliveryBtnText: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: COLORS.error,
  },
  noActiveCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.xs,
  },
  noActiveTitle: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  noActiveSubtitle: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  availableList: {
    gap: SPACING.md,
  },
  availableCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.xs,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  availHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availBadge: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  availBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentDark,
  },
  availPayout: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.primary,
  },
  availTitle: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  availQuantity: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
  },
  availRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  availRouteText: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    flex: 1,
  },
  availActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerLow,
  },
  declineBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingVertical: 12,
  },
  declineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  acceptBtn: {
    flex: 2,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  acceptBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
});
