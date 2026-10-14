import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import { apiClient } from '../../services/apiClient';
import { BulkSupplierMatch, BulkRequirement } from '../../types';

const CROP_PHOTOS: Record<string, string> = {
  'Red Onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400',
  'Tomato': 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400',
  'Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
  'Wheat': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
  'Basmati Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
};

export default function BulkMatchDiscoveryScreen({ navigation, route }: any) {
  const requirementId = route.params?.requirementId || 'breq_101';
  const passedReq = route.params?.requirement as BulkRequirement | undefined;

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<BulkSupplierMatch[]>([]);

  useEffect(() => {
    async function loadMatches() {
      try {
        const data = await apiClient.bulk.getMatches(requirementId);
        setMatches(data);
      } catch (err) {
        console.warn('Error loading matches:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [requirementId]);

  const handleReserveLot = (supplier: BulkSupplierMatch) => {
    Alert.alert(
      'Reserve Commercial Lot 🌾',
      `Reserve ${supplier.availableCapacity} ${supplier.capacityUnit} of ${supplier.cropName} from ${supplier.supplierName} at ₹${supplier.askingPricePerUnit}/${supplier.capacityUnit}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Checkout',
          onPress: () => {
            navigation.navigate('CheckoutStack', {
              screen: 'CheckoutReview',
              params: {
                isBulk: true,
                bulkSupplier: supplier,
              },
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>AI Supplier Matches</Text>
          <Text style={styles.headerSub}>MandiKart Smart Matching Engine</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Main')}>
          <Ionicons name="home-outline" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Requirement snapshot */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Image
                source={{ uri: CROP_PHOTOS[passedReq?.cropName || 'Red Onion'] || 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400' }}
                style={{ width: 36, height: 36, borderRadius: 8 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryCrop}>{passedReq?.cropName || 'Red Onion'} (Grade {passedReq?.grade || 'A'})</Text>
                <Text style={styles.summaryDemand}>
                  Target: {passedReq?.requiredQuantity || 25} {passedReq?.quantityUnit || 'quintal'} • Max ₹{passedReq?.maxTargetPricePerUnit || 2400}/{passedReq?.quantityUnit || 'quintal'}
                </Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>MATCHED</Text>
            </View>
          </View>

          <View style={styles.summaryFooter}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.summaryLoc}>Destination: {passedReq?.deliveryLocation || 'Pune Central Depot'}</Text>
          </View>
        </View>

        {/* AI Match Overview Banner */}
        <View style={styles.aiBanner}>
          <Ionicons name="sparkles" size={20} color="#059669" />
          <Text style={styles.aiBannerText}>
            Our AI analyzed 18 regional farm clusters. Found {matches.length} high-confidence suppliers ready to fulfill this order.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.matchList}>
            {matches.map((supplier) => (
              <View key={supplier.supplierId} style={styles.supplierCard}>
                {/* Score & Type badges */}
                <View style={styles.cardHeader}>
                  <View style={styles.scoreBadge}>
                    <Ionicons name="flash" size={12} color="#15803D" />
                    <Text style={styles.scoreText}>{supplier.aiMatchScore}% AI Match</Text>
                  </View>
                  <View style={[styles.typeBadge, supplier.type === 'FPO_CLUSTER' && styles.fpoBadge]}>
                    <Text style={[styles.typeText, supplier.type === 'FPO_CLUSTER' && styles.fpoText]}>
                      {supplier.type === 'FPO_CLUSTER' ? 'FPO Farmer Cluster' : 'Direct Producer'}
                    </Text>
                  </View>
                </View>

                {/* Supplier Name, Product Photo & Location */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <Image
                    source={{ uri: CROP_PHOTOS[supplier.cropName] || 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400' }}
                    style={{ width: 32, height: 32, borderRadius: 6 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.supplierName}>{supplier.supplierName} • {supplier.cropName}</Text>
                    <View style={styles.locRow}>
                      <Ionicons name="navigate-outline" size={13} color={Colors.textSecondary} />
                      <Text style={styles.supplierLoc}>
                        {supplier.location} • {supplier.distanceKm} km away
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Metrics Grid */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricLabel}>Available Capacity</Text>
                    <Text style={styles.metricVal}>
                      {supplier.availableCapacity} {supplier.capacityUnit}
                    </Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricLabel}>Asking Price</Text>
                    <Text style={styles.priceVal}>
                      ₹{supplier.askingPricePerUnit.toLocaleString('en-IN')}/{supplier.capacityUnit}
                    </Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricLabel}>Fulfillment Purity</Text>
                    <Text style={styles.purityVal}>{supplier.fulfillmentPurity}</Text>
                  </View>
                </View>

                {/* Card Action CTAs */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() =>
                      navigation.navigate('ChatStack', {
                        screen: 'Chat',
                        params: {
                          negotiationId: requirementId,
                          id: requirementId,
                          farmerName: supplier.supplierName,
                          cropName: passedReq?.cropName,
                          items: (passedReq as any)?.items,
                        },
                      })
                    }
                  >
                    <Ionicons name="chatbubbles-outline" size={16} color={Colors.primary} />
                    <Text style={styles.chatBtnText}>Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.counterBidBtn}
                    onPress={() => {
                      Alert.prompt
                        ? Alert.prompt(
                            'Submit Counter-Bid 🏷️',
                            `Current asking: ₹${supplier.askingPricePerUnit}/${supplier.capacityUnit}. Enter your counter offer:`,
                            (val) => {
                              if (val) {
                                Alert.alert('Bid Dispatched 🎉', `Counter offer of ₹${val}/${supplier.capacityUnit} transmitted to ${supplier.supplierName}.`);
                              }
                            }
                          )
                        : Alert.alert(
                            'Counter-Bid Sent 🏷️',
                            `Negotiation proposal of ₹${Math.round(supplier.askingPricePerUnit * 0.95)}/${supplier.capacityUnit} dispatched to ${supplier.supplierName}.`
                          );
                    }}
                  >
                    <Ionicons name="pricetag-outline" size={16} color="#B45309" />
                    <Text style={styles.counterBidBtnText}>Counter-Bid</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.reserveBtn}
                    onPress={() => handleReserveLot(supplier)}
                  >
                    <Ionicons name="lock-closed" size={15} color={Colors.white} />
                    <Text style={styles.reserveBtnText}>Reserve Lot</Text>
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
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 11, color: Colors.textSecondary },
  content: { padding: Spacing.md, gap: Spacing.md },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryCrop: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  summaryDemand: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  summaryLoc: { fontSize: 12, color: Colors.textSecondary },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  aiBannerText: { fontSize: 12, color: '#047857', flex: 1, lineHeight: 17 },
  matchList: { gap: Spacing.md },
  supplierCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  scoreText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
  },
  fpoBadge: { backgroundColor: '#EFF6FF' },
  typeText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  fpoText: { color: '#1E40AF' },
  supplierName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  supplierLoc: { fontSize: 12, color: Colors.textSecondary },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricCol: { flex: 1, alignItems: 'center' },
  metricLabel: { fontSize: 10, color: Colors.textSecondary, marginBottom: 2 },
  metricVal: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  priceVal: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  purityVal: { fontSize: 13, fontWeight: '700', color: '#059669' },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  chatBtn: {
    flex: 1,
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chatBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  counterBidBtn: {
    flex: 1.2,
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#D97706',
    backgroundColor: '#FFFBEB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  counterBidBtnText: { fontSize: 12, fontWeight: '700', color: '#B45309' },
  reserveBtn: {
    flex: 1.5,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reserveBtnText: { fontSize: 13, fontWeight: '600', color: Colors.white },
});
