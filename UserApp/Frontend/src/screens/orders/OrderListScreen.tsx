import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Image, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import StatusBadge from '../../components/StatusBadge';
import { SAMPLE_PRODUCTS } from '../../services/mockData';
import { apiClient } from '../../services/apiClient';
import { getStatusConfig } from '../../constants/orderStatusLabels';

type FilterTab = 'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED';

export default function OrderListScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiClient.orders.listOrders();
      const mapped = data.map((o: any) => {
        // Handle both backend format (createdAt, items.cropName) and legacy frontend format (placedAt, items.product)
        const rawDate = o.placedAt || o.createdAt || o.timestamp || new Date().toISOString();
        const dateStr = (() => {
          try {
            return new Date(rawDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          } catch {
            return rawDate;
          }
        })();

        // Normalize items — backend returns {cropName, quantity, pricePerUnit}, frontend returns {product: {...}, quantity}
        const rawItems: any[] = o.items || [];
        const itemsPreview = rawItems.map((it: any) => {
          const realImg = it.imageUrl || it.image || (it.images && it.images[0]) || (it.product && (it.product.imageUrl || (it.product.images && it.product.images[0]))) || '';
          if (it.product) {
            return {
              ...it.product,
              name: it.product.name || it.cropName || 'Fresh Produce',
              imageUrl: realImg || 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400',
              price: it.product.price || it.pricePerUnit || 30,
              unit: it.product.unit || it.unit || 'kg',
            };
          }
          return {
            id: it.productId || `item_${Math.random()}`,
            name: it.cropName || it.produceName || 'Fresh Produce',
            imageUrl: realImg || 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400',
            price: it.pricePerUnit || 30,
            unit: it.unit || 'kg',
          };
        });

        return {
          id: o.orderNumber || o.id,
          date: dateStr,
          status: o.status || 'PLACED',
          total: o.total || o.totalAmount || (rawItems.reduce((sum: number, it: any) => sum + ((it.quantity || 1) * (it.pricePerUnit || 30)), 0) + 25),
          itemsCount: rawItems.length || 1,
          itemsPreview,
          deliveryAddress: typeof o.deliveryAddress === 'object' ? (o.deliveryAddress?.line1 || 'Pune, Maharashtra') : (o.deliveryAddress || 'Pune, Maharashtra'),
          farmerName: o.farmer?.name || o.farmerName || 'Rajan Kumar',
          estimatedDelivery: o.estimatedDelivery || 'Today by 5:30 PM',
          deliveryOtp: o.deliveryOtp || '719284',
        };
      });
      setOrders(mapped);
    } catch (err) {
      console.warn('Orders fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
      const interval = setInterval(loadOrders, 3000);
      return () => clearInterval(interval);
    }, [loadOrders])
  );

  const cancelOrderById = (orderId: string) => {
    Alert.alert(
      'Cancel Order 🚫',
      `Are you sure you want to cancel order #${orderId}? Full refund will be initiated to your original payment method.`,
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel Order',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.orders.cancelOrder(orderId);
              setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
              );
              Alert.alert('Order Cancelled', `Order #${orderId} has been cancelled and escrow refund initiated.`);
              loadOrders();
            } catch (err: any) {
              Alert.alert('Cancel Failed', err?.message || 'Unable to cancel order at this time.');
            }
          },
        },
      ]
    );
  };

  const filteredOrders = orders.filter((order) => {
    const status = (order.status || '').toUpperCase();
    const activeStatuses = ['PLACED', 'CONFIRMED', 'PICKUP_SCHEDULED', 'PICKUP_IN_PROGRESS', 'COLLECTED', 'IN_TRANSIT', 'DISPATCHED', 'PROCESSING'];
    const deliveredStatuses = ['DELIVERED', 'COMPLETED'];
    const cancelledStatuses = ['CANCELLED', 'FAILED', 'DISPUTED'];

    // Tab filter
    if (activeTab === 'ACTIVE' && !activeStatuses.includes(status)) return false;
    if (activeTab === 'DELIVERED' && !deliveredStatuses.includes(status)) return false;
    if (activeTab === 'CANCELLED' && !cancelledStatuses.includes(status)) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (order.id || '').toLowerCase().includes(q);
      const matchFarmer = (order.farmerName || '').toLowerCase().includes(q);
      const matchItem = (order.itemsPreview || []).some((p: any) => (p.name || '').toLowerCase().includes(q));
      return matchId || matchFarmer || matchItem;
    }

    return true;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>{orders.length} total orders placed</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order ID, farmer, or item..."
            placeholderTextColor={Colors.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          {(['ALL', 'ACTIVE', 'DELIVERED', 'CANCELLED'] as FilterTab[]).map((tab) => {
            const active = activeTab === tab;
            const count = orders.filter((o) => {
              if (tab === 'ALL') return true;
              if (tab === 'ACTIVE') return o.status === 'DISPATCHED' || o.status === 'PROCESSING' || o.status === 'CONFIRMED';
              return o.status === tab;
            }).length;

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, active && styles.activeTabChip]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, active && styles.activeTabText]}>
                  {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textDisabled} />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySub}>You don't have any orders under this filter.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = ['PLACED', 'CONFIRMED', 'PICKUP_SCHEDULED', 'PICKUP_IN_PROGRESS', 'COLLECTED', 'IN_TRANSIT', 'DISPATCHED', 'PROCESSING'].includes(item.status);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate('OrderDetails', {
                  orderId: item.id,
                  order: item,
                })
              }
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderId}>{item.id}</Text>
                  <Text style={styles.orderDate}>{item.date}</Text>
                </View>
                <StatusBadge status={item.status as any} size="sm" />
              </View>

              {/* Product Images Preview */}
              <View style={styles.previewRow}>
                <View style={styles.imagesWrap}>
                  {item.itemsPreview.map((p, i) => (
                    <Image key={`${p.id}-${i}`} source={{ uri: p.imageUrl }} style={styles.previewThumb} />
                  ))}
                </View>

                <View style={styles.previewInfo}>
                  <Text style={styles.farmerName}>🌾 {item.farmerName}</Text>
                  <Text style={styles.itemsSummary}>
                    {item.itemsPreview.map((p) => p.name).join(', ')}
                  </Text>
                </View>
              </View>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.totalLabel}>Total ({item.itemsCount} items)</Text>
                  <Text style={styles.totalPrice}>₹{item.total}</Text>
                </View>

                <View style={styles.actionBtns}>
                  {isActive && (
                    <>
                      <TouchableOpacity
                        style={styles.cancelCardBtn}
                        onPress={() => cancelOrderById(item.id)}
                      >
                        <Text style={styles.cancelCardText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.trackBtn}
                        onPress={() => navigation.navigate('OrderTracking', { orderId: item.id, order: item })}
                      >
                        <Ionicons name="location" size={13} color={Colors.white} />
                        <Text style={styles.trackBtnText}>Track</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() =>
                      navigation.navigate('OrderDetails', {
                        orderId: item.id,
                        order: item,
                      })
                    }
                  >
                    <Text style={styles.detailsBtnText}>Details</Text>
                    <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: -4 },
  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  searchInput: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  // Filter Tabs
  tabRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  activeTabChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  activeTabText: { color: Colors.white },
  // List
  list: { padding: Spacing.md, paddingTop: 0, gap: Spacing.md },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  orderId: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  orderDate: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  // Preview
  previewRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  imagesWrap: { flexDirection: 'row', gap: 4 },
  previewThumb: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
  },
  previewInfo: { flex: 1, gap: 2 },
  farmerName: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  itemsSummary: { fontSize: 12, color: Colors.textSecondary },
  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  totalLabel: { fontSize: 10, color: Colors.textSecondary },
  totalPrice: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  actionBtns: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  cancelCardBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  cancelCardText: { fontSize: 11, fontWeight: '700', color: Colors.error },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  trackBtnText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  detailsBtnText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  // Empty
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 12, color: Colors.textSecondary },
});
