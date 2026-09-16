import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';
import { usePartner } from '../context/PartnerContext';
import PartnerHeader from '../components/PartnerHeader';
import DeliveryStepper from '../components/DeliveryStepper';

export default function PartnerDeliveriesScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('ACTIVE'); // 'ACTIVE' | 'AVAILABLE' | 'COMPLETED'
  const {
    activeDelivery,
    availableDeliveries,
    completedDeliveries,
    acceptDelivery,
  } = usePartner();

  return (
    <SafeAreaView style={styles.container}>
      <PartnerHeader title="Deliveries Manifest" subtitle="Farm Pickups & Mandi Drops" navigation={navigation} />

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { id: 'ACTIVE', label: `Active (${activeDelivery ? 1 : 0})` },
          { id: 'AVAILABLE', label: `Available (${availableDeliveries.length})` },
          { id: 'COMPLETED', label: `Completed (${completedDeliveries.length})` },
        ].map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, selectedTab === tab.id && styles.tabItemActive]}
            onPress={() => setSelectedTab(tab.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, selectedTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ACTIVE TAB */}
        {selectedTab === 'ACTIVE' && (
          <View style={styles.tabSection}>
            {activeDelivery ? (
              <View style={styles.deliveryCard}>
                <View style={styles.cardBadgeRow}>
                  <View style={styles.badgeInTransit}>
                    <Text style={styles.badgeInTransitText}>● {activeDelivery.status.replace('_', ' ')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase' }}>Payout</Text>
                    <Text style={styles.payoutText}>+₹{activeDelivery.payout}</Text>
                  </View>
                </View>

                <Text style={styles.orderTitle}>{activeDelivery.title}</Text>
                <Text style={styles.orderQty}>
                  {activeDelivery.quantity} • Value: ₹{Number(activeDelivery.totalPrice || activeDelivery.totalAmount || 0).toLocaleString('en-IN')} • Order #{activeDelivery.id}
                </Text>

                <View style={styles.routeBox}>
                  <View style={styles.routePoint}>
                    <Ionicons name="leaf" size={16} color={COLORS.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pointLabel}>Pickup from Farmer</Text>
                      <Text style={styles.pointName}>{activeDelivery.pickup.name}</Text>
                      <Text style={styles.pointAddress}>{activeDelivery.pickup.address}</Text>
                    </View>
                  </View>

                  <View style={styles.routeLine} />

                  <View style={styles.routePoint}>
                    <Ionicons name="location" size={16} color={COLORS.error} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pointLabel}>Drop to Mandi Hub</Text>
                      <Text style={styles.pointName}>{activeDelivery.drop.name}</Text>
                      <Text style={styles.pointAddress}>{activeDelivery.drop.address}</Text>
                    </View>
                  </View>
                </View>

                {/* Stepper */}
                <DeliveryStepper currentStep={activeDelivery.currentStepIndex} />

                {/* Primary actions */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() => navigation.navigate('DeliveryDetail')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.detailsBtnText}>Order Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('ActiveRoute')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="navigate" size={18} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>Start Route</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color={COLORS.outlineVariant} />
                <Text style={styles.emptyTitle}>No Active Deliveries</Text>
                <Text style={styles.emptySubtitle}>Switch to the "Available" tab to pick up new farm orders.</Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => setSelectedTab('AVAILABLE')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyBtnText}>Browse Available Pickups</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* AVAILABLE TAB */}
        {selectedTab === 'AVAILABLE' && (
          <View style={styles.tabSection}>
            {availableDeliveries.map(item => (
              <View key={item.id} style={styles.deliveryCard}>
                <View style={styles.cardBadgeRow}>
                  <View style={styles.badgePromo}>
                    <Text style={styles.badgePromoText}>{item.tag || 'PRODUCE DISPATCH'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.payoutText}>₹{item.payout}</Text>
                    <Text style={{ fontSize: 10, color: COLORS.onSurfaceVariant, fontWeight: '700' }}>
                      Payout • ₹{Number(item.totalPrice || item.totalAmount || (item.payout * 8)).toLocaleString('en-IN')} Value
                    </Text>
                  </View>
                </View>

                <Text style={styles.orderTitle}>{item.title}</Text>
                <Text style={styles.orderQty}>
                  {item.quantity} • {item.pricePerKg ? `₹${item.pricePerKg}/kg • ` : ''}{item.distanceKm} km
                </Text>

                <View style={styles.routeBox}>
                  <View style={styles.routePoint}>
                    <Ionicons name="business" size={16} color={COLORS.primary} />
                    <Text style={styles.pointName} numberOfLines={1}>{item.pickupName}</Text>
                  </View>
                  <View style={styles.routePoint}>
                    <Ionicons name="flag" size={16} color={COLORS.error} />
                    <Text style={styles.pointName} numberOfLines={1}>{item.dropName}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.acceptPickupCardBtn}
                  onPress={() => {
                    acceptDelivery(item.id);
                    setSelectedTab('ACTIVE');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.acceptPickupCardBtnText}>Accept Pickup (₹{item.payout})</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* COMPLETED TAB */}
        {selectedTab === 'COMPLETED' && (
          <View style={styles.tabSection}>
            {completedDeliveries.map(item => (
              <View key={item.id} style={styles.completedCard}>
                <View style={styles.cardBadgeRow}>
                  <View style={styles.badgeSuccess}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                    <Text style={styles.badgeSuccessText}>DELIVERED</Text>
                  </View>
                  <Text style={styles.completedPayout}>+₹{item.payout}</Text>
                </View>

                <Text style={styles.orderTitle}>{item.title}</Text>
                <Text style={styles.orderQty}>{item.quantity} • {item.deliveredAt}</Text>
                <Text style={styles.customerText}>Received by: {item.customer}</Text>

                <View style={styles.completedRatingRow}>
                  <Text style={styles.ratingText}>Partner Rating: ⭐⭐⭐⭐⭐ (5.0)</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('DeliveryPOD')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.podLink}>View POD Slip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  tabSection: {
    gap: SPACING.lg,
  },
  deliveryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.sm,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeInTransit: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  badgeInTransitText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentDark,
  },
  badgePromo: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  badgePromoText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.success,
  },
  payoutText: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.primary,
  },
  completedPayout: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.success,
  },
  orderTitle: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  orderQty: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
  },
  customerText: {
    fontSize: FONT.xs,
    color: COLORS.onSurface,
    fontWeight: '600',
    marginTop: 2,
  },
  routeBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.outlineVariant,
    marginLeft: 7,
  },
  pointLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  pointName: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  pointAddress: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  detailsBtn: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: 12,
    paddingHorizontal: SPACING.sm,
  },
  detailsBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  actionBtn: {
    flex: 1.5,
    minHeight: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: 12,
    paddingHorizontal: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
  },
  acceptPickupCardBtn: {
    width: '100%',
    minHeight: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  acceptPickupCardBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  completedCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 4,
  },
  completedRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerLow,
  },
  ratingText: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  podLink: {
    fontSize: FONT.xs,
    color: COLORS.primary,
    fontWeight: '800',
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxxl,
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyTitle: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  emptyBtnText: {
    color: COLORS.white,
    fontSize: FONT.base,
    fontWeight: '800',
  },
});
