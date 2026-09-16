import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';
import { usePartner } from '../context/PartnerContext';
import PartnerHeader from '../components/PartnerHeader';
import DeliveryStepper from '../components/DeliveryStepper';

export default function PartnerDeliveryDetailScreen({ navigation }) {
  const { activeDelivery } = usePartner();

  if (!activeDelivery) {
    return (
      <SafeAreaView style={styles.container}>
        <PartnerHeader title="Delivery Details" navigation={navigation} showBack />
        <View style={styles.centerBox}>
          <Text style={styles.noOrderText}>No active order selected.</Text>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <Text style={styles.backHomeText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PartnerHeader
        title={`Order #${activeDelivery.id}`}
        subtitle="Farm-to-Mandi Manifest"
        navigation={navigation}
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Summary Banner */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.produceTitle}>{activeDelivery.title}</Text>
              <Text style={styles.produceSubtitle}>
                {activeDelivery.quantity} • {activeDelivery.pricePerKg ? `₹${activeDelivery.pricePerKg}/kg` : 'Standard Crates'}
              </Text>
            </View>
            <View style={styles.payoutBadge}>
              <Text style={styles.payoutLabel}>Partner Payout</Text>
              <Text style={styles.payoutAmount}>₹{activeDelivery.payout}</Text>
            </View>
          </View>

          {/* Real Price & Consignment Value Breakdown */}
          <View style={styles.priceBreakdownRow}>
            <View style={styles.priceTagCol}>
              <Text style={styles.priceTagLabel}>Consignment Value</Text>
              <Text style={styles.priceTagValue}>
                ₹{Number(activeDelivery.totalPrice || activeDelivery.totalAmount || (activeDelivery.payout * 8)).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceTagCol}>
              <Text style={styles.priceTagLabel}>Produce Rate</Text>
              <Text style={styles.priceTagValue}>
                ₹{activeDelivery.pricePerKg || 32}/kg
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceTagCol}>
              <Text style={styles.priceTagLabel}>Escrow Status</Text>
              <Text style={[styles.priceTagValue, { color: COLORS.primary }]}>
                Verified
              </Text>
            </View>
          </View>

          {/* Stepper */}
          <DeliveryStepper currentStep={activeDelivery.currentStepIndex} />
        </View>

        {/* 1. Pickup Details */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleGreen}>
              <Ionicons name="leaf" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleTag}>STEP 1 • FARM PICKUP</Text>
              <Text style={styles.partyName}>{activeDelivery.pickup.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Alert.alert('Calling Farmer', `Dialing ${activeDelivery.pickup.phone}...`)}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={16} color={COLORS.primary} />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRows}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color={COLORS.onSurfaceVariant} />
              <Text style={styles.infoText}>{activeDelivery.pickup.contactPerson}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.onSurfaceVariant} />
              <Text style={styles.infoText}>{activeDelivery.pickup.address} (PIN {activeDelivery.pickup.pin})</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.onSurfaceVariant} />
              <Text style={styles.infoText}>Scheduled Slot: {activeDelivery.pickup.time}</Text>
            </View>
          </View>
        </View>

        {/* 2. Destination Details */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircleRed}>
              <Ionicons name="location" size={18} color={COLORS.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleTag}>STEP 2 • MANDI DROP</Text>
              <Text style={styles.partyName}>{activeDelivery.drop.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Alert.alert('Calling Hub', `Dialing ${activeDelivery.drop.phone}...`)}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={16} color={COLORS.primary} />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRows}>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={16} color={COLORS.onSurfaceVariant} />
              <Text style={styles.infoText}>{activeDelivery.drop.contactPerson}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="map-outline" size={16} color={COLORS.onSurfaceVariant} />
              <Text style={styles.infoText}>{activeDelivery.drop.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="speedometer-outline" size={16} color={COLORS.onSurfaceVariant} />
              <Text style={styles.infoText}>{activeDelivery.distanceKm} km transit distance • Est. 18 mins</Text>
            </View>
          </View>
        </View>

        {/* 3. Itemized Produce Manifest with Real Values */}
        <View style={styles.sectionCard}>
          <Text style={styles.manifestTitle}>Crate & Item Manifest</Text>
          <View style={styles.manifestList}>
            {activeDelivery.manifest.map((m, idx) => (
              <View key={idx} style={styles.manifestRow}>
                <View style={styles.manifestLeft}>
                  <Text style={styles.manifestItemName}>{m.item}</Text>
                  <Text style={styles.manifestItemMeta}>
                    {m.crates} Crates • {m.grade || 'Grade A'}
                    {m.pricePerKg ? ` • ₹${m.pricePerKg}/kg` : ''}
                  </Text>
                </View>
                <View style={styles.manifestRight}>
                  <Text style={styles.manifestWeight}>{m.weightKg} kg</Text>
                  {m.totalPrice ? (
                    <Text style={styles.manifestItemPrice}>₹{Number(m.totalPrice).toLocaleString('en-IN')}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.totalManifestRow}>
            <Text style={styles.totalManifestText}>Total Consignment Weight</Text>
            <Text style={styles.totalManifestValue}>
              {activeDelivery.manifest.reduce((acc, it) => acc + (Number(it.weightKg) || 0), 0) || activeDelivery.quantityKg || 120} kg
            </Text>
          </View>
        </View>

        {/* 4. OTP Verification Alert */}
        <View style={styles.otpNoticeBox}>
          <Ionicons name="key-outline" size={20} color={COLORS.accentDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.otpNoticeTitle}>Destination Hub OTP Required</Text>
            <Text style={styles.otpNoticeDesc}>
              Hub receiving manager must enter OTP ({activeDelivery.otpCode}) on delivery confirmation.
            </Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionBlock}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.navigate('ActiveRoute')}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate" size={20} color={COLORS.white} />
            <Text style={styles.navBtnText}>Launch Live GPS Navigation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.podBtn}
            onPress={() => navigation.navigate('DeliveryPOD')}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={20} color={COLORS.primary} />
            <Text style={styles.podBtnText}>Proceed to Proof of Delivery (POD)</Text>
          </TouchableOpacity>
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
    padding: SPACING.lg,
    paddingBottom: 40,
    gap: SPACING.lg,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noOrderText: {
    fontSize: FONT.lg,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.md,
  },
  backHomeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  backHomeText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  summaryCard: {
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
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  produceTitle: {
    fontSize: FONT.xxl,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  produceSubtitle: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  payoutBadge: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  payoutAmount: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.primary,
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginTop: 4,
  },
  priceTagCol: {
    flex: 1,
    alignItems: 'center',
  },
  priceTagLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  priceTagValue: {
    fontSize: FONT.sm,
    fontWeight: '900',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  priceDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  manifestItemPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconCircleGreen: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleRed: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  partyName: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: 1,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  callBtnText: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: COLORS.primary,
  },
  detailRows: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoText: {
    fontSize: FONT.xs,
    color: COLORS.onSurface,
    flex: 1,
  },
  manifestTitle: {
    fontSize: FONT.md,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  manifestList: {
    gap: SPACING.sm,
  },
  manifestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainerLow,
  },
  manifestLeft: {
    gap: 2,
  },
  manifestItemName: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  manifestItemMeta: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
  },
  manifestRight: {
    alignItems: 'flex-end',
  },
  manifestWeight: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.primary,
  },
  totalManifestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.xs,
  },
  totalManifestText: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  totalManifestValue: {
    fontSize: FONT.base,
    fontWeight: '900',
    color: COLORS.primary,
  },
  otpNoticeBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentLight,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.md,
    alignItems: 'center',
  },
  otpNoticeTitle: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: COLORS.accentDark,
  },
  otpNoticeDesc: {
    fontSize: 11,
    color: COLORS.accentDark,
    marginTop: 2,
  },
  actionBlock: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  navBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  navBtnText: {
    color: COLORS.white,
    fontSize: FONT.md,
    fontWeight: '800',
  },
  podBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  podBtnText: {
    color: COLORS.primary,
    fontSize: FONT.md,
    fontWeight: '800',
  },
});
