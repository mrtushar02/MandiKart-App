/**
 * MandiKart Farmer App — Screen 11: My Orders (UI UX Pro Max Redesign)
 *
 * Full-fidelity orders management:
 * - Live Transit Radar Banner: Real-time driver ETA with 1-tap "Track Live Vehicle"
 * - Segmented Order Tabs: Active (2), Pending (1), Completed (2), All (5)
 * - Rich Order Cards: Thumbnail, buyer verification, rate/KG, net payout, logistics stepper
 * - Actionable CTAs on EVERY Card:
 *     1. "🚚 Track Vehicle" (Directly launches /orders/track-vehicle)
 *     2. "👁️ See Order Details" (Full-screen interactive invoice & weighbridge modal)
 * - Pending Buyer Negotiation CTAs: "Accept Offer", "Counter-Offer"
 * - Ultra-clean responsive layout with zero text collisions and premium earthy styling
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Truck,
  CheckCircle2,
  Clock,
  Calendar,
  Check,
  Building2,
  SlidersHorizontal,
  Bell,
  Sprout,
  ArrowRight,
  ChevronRight,
  PhoneCall,
  Eye,
  FileText,
  Download,
  X,
  MapPin,
  ShieldCheck,
  Flame,
  CreditCard,
  Navigation,
  Search,
} from 'lucide-react-native';
import { MKScreen, MKCard } from '@/components/ui';
import { MKColors } from '@/constants/colors';
import { MKSpacing } from '@/constants/spacing';
import { useOrderStore, OrderItem, OrderTab } from '@/store/orderStore';
import { useProduceStore } from '@/store/produceStore';
import { useAuthStore } from '@/store/authStore';
import FPOAnalyticsScreen from '@/components/fpo/FPOAnalyticsScreen';

export default function OrdersScreen() {
  const user = useAuthStore((state) => state.user);

  // ── FPO BRANCH: Return performance & financial analytics screen ──
  if (user?.role === 'FPO') {
    return <FPOAnalyticsScreen />;
  }

  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<OrderTab>('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const orders = useOrderStore((state) => state.orders);
  const acceptOrderOffer = useOrderStore((state) => state.acceptOrderOffer);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderItem | null>(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<OrderItem | null>(null);
  const [acceptedOrderSuccess, setAcceptedOrderSuccess] = useState<OrderItem | null>(null);

  const handleExportFarmerReceipt = (orderNum: string) => {
    Alert.alert(
      'Mandi Slip Exported 📄',
      `Mandi Gate Pass & Weighbridge Payout Settlement Slip for ${orderNum} has been exported to PDF and saved to your device Downloads.`
    );
  };

  const handleShareFarmerReceipt = (orderNum: string) => {
    Alert.alert(
      'Receipt Shared 📤',
      `Verified APMC Payout link for ${orderNum} shared with your registered FPO cooperative.`
    );
  };

  React.useEffect(() => {
    useOrderStore.getState().syncWithBackend().catch(() => {});
    useProduceStore.getState().syncWithBackend().catch(() => {});
    const interval = setInterval(() => {
      useOrderStore.getState().syncWithBackend().catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = orders.filter((o) => o.tab === 'Active').length;
  const pendingCount = orders.filter((o) => o.tab === 'Pending').length;
  const completedCount = orders.filter((o) => o.tab === 'Completed').length;

  const filteredOrders = orders.filter((o) => {
    if (selectedTab !== 'All' && o.tab !== selectedTab) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      return (
        o.cropName.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.buyerName.toLowerCase().includes(q) ||
        o.statusLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function handleAcceptOffer(orderId: string) {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const targetCropName = (targetOrder.cropName || '').toLowerCase().trim();
    const crops = useProduceStore.getState().crops || [];
    const matchedCrop = crops.find((c) => {
      const cn = (c.cropName || '').toLowerCase().trim();
      return cn.includes(targetCropName) || targetCropName.includes(cn);
    });

    const executeAccept = (allocatedCrop?: any) => {
      if (allocatedCrop) {
        const reqQty = parseInt(String(targetOrder.quantity).replace(/[^0-9]/g, '')) || 50;
        const newAvailable = Math.max(0, (allocatedCrop.availableKg || 0) - reqQty);
        const newReserved = (allocatedCrop.reservedKg || 0) + reqQty;
        useProduceStore.getState().updateCropQuantity(allocatedCrop.id, newAvailable, newReserved);
      }
      acceptOrderOffer(orderId);
      setSelectedTab('Active');
      setAcceptedOrderSuccess({
        ...targetOrder,
        tab: 'Active',
        statusType: 'scheduled',
        statusLabel: 'Offer Accepted • Vehicle Scheduled',
        driverName: targetOrder.driverName || 'Sunil Jadhav',
        driverPhone: targetOrder.driverPhone || '+91 94222 18904',
        vehicleNumber: targetOrder.vehicleNumber || 'MH 15 CT 8812',
        vehicleModel: targetOrder.vehicleModel || 'Mahindra Bolero Maxi Truck',
        pickupDate: 'Tomorrow Morning',
        pickupTime: '09:00 AM - 11:00 AM',
      });
    };

    if (matchedCrop && (matchedCrop.availableKg > 0 || matchedCrop.totalKg > 0)) {
      // Farmer has this crop in inventory
      executeAccept(matchedCrop);
    } else {
      // Farmer does not have this crop listed or 0 stock
      Alert.alert(
        'Crop Stock Verification 🌾',
        `"${targetOrder.cropName}" is not currently in your active farm inventory.\n\nDo you have ready harvested stock available to confirm and dispatch this order?`,
        [
          { text: 'Decline / Back', style: 'cancel' },
          {
            text: 'I Have Stock — Accept Order',
            onPress: () => executeAccept(),
          },
        ]
      );
    }
  }

  function handleCounterOffer(order: OrderItem) {
    const currentRate = parseFloat(order.ratePerKg.replace(/[^0-9.]/g, '')) || 20;
    const plusOne = currentRate + 1.5;
    const plusTwo = currentRate + 3.0;

    Alert.alert(
      `Counter-Offer for ${order.cropName}`,
      `Current Buyer Rate: ${order.ratePerKg}\nChoose a proposed rate or open live negotiation chat:`,
      [
        {
          text: `Propose ₹${plusOne.toFixed(1)}/kg`,
          onPress: () => {
            updateOrderStatus(order.id, {
              statusLabel: `Counter-Offered ₹${plusOne.toFixed(1)}/kg`,
              ratePerKg: `₹${plusOne.toFixed(1)}/kg`,
            });
            Alert.alert('Counter-Offer Submitted', `Buyer ${order.buyerName} has been notified of your ₹${plusOne.toFixed(1)}/kg proposal.`);
          },
        },
        {
          text: `Propose ₹${plusTwo.toFixed(1)}/kg`,
          onPress: () => {
            updateOrderStatus(order.id, {
              statusLabel: `Counter-Offered ₹${plusTwo.toFixed(1)}/kg`,
              ratePerKg: `₹${plusTwo.toFixed(1)}/kg`,
            });
            Alert.alert('Counter-Offer Submitted', `Buyer ${order.buyerName} has been notified of your ₹${plusTwo.toFixed(1)}/kg proposal.`);
          },
        },
        {
          text: 'Open Chat 💬',
          onPress: () => {
            router.push({
              pathname: '/sell/chat',
              params: {
                id: order.id,
                negotiationId: order.id,
                crop: order.cropName,
                cropName: order.cropName,
                buyer: order.buyerName,
                buyerName: order.buyerName,
              },
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  return (
    <MKScreen scrollable contentContainerStyle={styles.screenScrollContent}>
      {/* ── 1. Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>My Orders</Text>
          <Text style={styles.headerSubtitle}>
            Track active dispatches, buyer bids & verified payouts
          </Text>
        </View>

        <View style={styles.headerRightButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.circleBtn,
              pressed && { transform: [{ scale: 0.9 }], opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/more/notifications')}
          >
            <Bell size={18} color="#1A1C1E" strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>

      {/* ── 2. Order Quick Search Bar ── */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBarInner}>
          <Search size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by crop, order ID or buyer..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
              <X size={16} color="#64748B" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── 3. Summary Stat Strip (Clickable Filters) ── */}
      <View style={styles.summaryStrip}>
        <Pressable
          onPress={() => setSelectedTab('Active')}
          style={[
            styles.summaryBox,
            selectedTab === 'Active' && styles.summaryBoxActive,
          ]}
        >
          <Text style={[styles.summaryCount, { color: '#15803D' }]}>{activeCount}</Text>
          <Text style={styles.summaryLabel}>ACTIVE</Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedTab('Pending')}
          style={[
            styles.summaryBox,
            selectedTab === 'Pending' && styles.summaryBoxActive,
          ]}
        >
          <Text style={[styles.summaryCount, { color: '#EA580C' }]}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>PENDING</Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedTab('Completed')}
          style={[
            styles.summaryBox,
            selectedTab === 'Completed' && styles.summaryBoxActive,
          ]}
        >
          <Text style={[styles.summaryCount, { color: '#4B5563' }]}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>COMPLETED</Text>
        </Pressable>
      </View>

      {/* ── 4. Segmented Filter Tabs ── */}
      <View style={styles.filterTabsRow}>
        {(['All', 'Active', 'Pending', 'Completed'] as OrderTab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={[
              styles.filterPill,
              selectedTab === tab && styles.filterPillActive,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.filterPillText,
                selectedTab === tab && styles.filterPillTextActive,
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── 5. Orders List ── */}
      <View style={styles.ordersList}>
        {selectedTab === 'Active' && pendingCount > 0 && (
          <Pressable
            style={styles.pendingOrderAlertBanner}
            onPress={() => setSelectedTab('Pending')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Bell size={16} color="#C2410C" />
              <Text style={styles.pendingOrderAlertText}>
                {pendingCount} new buyer order(s) placed & awaiting action!
              </Text>
            </View>
            <Text style={styles.pendingOrderAlertLink}>View Pending →</Text>
          </Pressable>
        )}
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Sprout size={36} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No {selectedTab} Orders</Text>
            <Text style={styles.emptyStateSub}>
              Sell your harvest today to receive corporate buyer bids and farmgate pickup.
            </Text>
            <Pressable
              style={styles.emptySellBtn}
              onPress={() => router.push('/(tabs)/sell')}
            >
              <Text style={styles.emptySellBtnText}>Sell Produce Now</Text>
            </Pressable>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <MKCard key={order.id} style={styles.orderCard}>
              {/* Order Card Header */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.orderBadgeRow}>
                  {order.tab === 'Active' && (
                    <View style={styles.badgeActive}>
                      <Truck size={12} color="#15803D" strokeWidth={2.4} />
                      <Text style={styles.badgeActiveText}>ACTIVE ORDER</Text>
                    </View>
                  )}
                  {order.tab === 'Pending' && (
                    <View style={styles.badgePending}>
                      <Clock size={12} color="#C2410C" strokeWidth={2.4} />
                      <Text style={styles.badgePendingText}>NEW BUYER OFFER</Text>
                    </View>
                  )}
                  {order.tab === 'Completed' && (
                    <View style={styles.badgeCompleted}>
                      <CheckCircle2 size={12} color="#4B5563" strokeWidth={2.4} />
                      <Text style={styles.badgeCompletedText}>DELIVERED</Text>
                    </View>
                  )}
                  <Text numberOfLines={1} ellipsizeMode="tail" style={styles.orderNumberText}>{order.orderNumber}</Text>
                </View>

                <View style={styles.orderValueWrap}>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={styles.orderValueAmount}>{order.totalValue}</Text>
                  <Text numberOfLines={1} style={styles.orderValueSub}>Total Value</Text>
                </View>
              </View>

              {/* Inline Live Transit Badge for Active Dispatch */}
              {order.statusType === 'en_route' && (
                <View style={styles.inlineLiveTransitBanner}>
                  <View style={styles.inlineTransitTopRow}>
                    <View style={styles.inlineTransitLeft}>
                      <View style={styles.inlineRadarDot} />
                      <Truck size={13} color="#15803D" strokeWidth={2.4} />
                      <Text numberOfLines={1} style={styles.inlineTransitText}>
                        Live Transit • Driver ETA {order.etaMins} mins
                      </Text>
                    </View>
                    <View style={styles.onRoadPill}>
                      <Text style={styles.onRoadPillText}>ON ROAD</Text>
                    </View>
                  </View>
                  <View style={styles.inlineTransitVehicleRow}>
                    <Navigation size={11} color="#64748B" />
                    <Text numberOfLines={1} style={styles.inlineTransitSub}>
                      {order.vehicleModel} • {order.vehicleNumber}
                    </Text>
                  </View>
                </View>
              )}

              {/* Crop & Buyer Info */}
              <View style={styles.cropInfoRow}>
                <Image source={{ uri: order.cropImage || 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400' }} style={styles.cropThumb} />
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={styles.cropNameTitle}>
                    {order.cropName} • {order.grade}
                  </Text>
                  <Text numberOfLines={1} ellipsizeMode="tail" style={styles.cropVarietySub}>
                    {order.quantity} • {order.ratePerKg}
                  </Text>
                  <View style={styles.buyerInlineRow}>
                    <Building2 size={12} color="#64748B" />
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.buyerInlineName}>
                      {order.buyerName}
                    </Text>
                    <CheckCircle2 size={12} color="#15803D" fill="#DCFCE7" />
                  </View>
                </View>
              </View>

              {/* Timeline Status Stepper (For Active & Completed) */}
              {order.tab !== 'Pending' && (
                <View style={styles.stepperBox}>
                  <View style={styles.stepperHeader}>
                    <View
                      style={[
                        styles.stepperDot,
                        order.statusType === 'en_route'
                          ? styles.stepperDotOrange
                          : styles.stepperDotGreen,
                      ]}
                    />
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.stepperHeaderText}>
                      {order.statusLabel}
                    </Text>
                  </View>

                  {/* 4 Step Horizontal Progress Bar */}
                  <View style={styles.progressBarWrap}>
                    <View style={[styles.progressTrack, { width: `${(order.stepIndex / 4) * 100}%` }]} />
                  </View>
                  <View style={styles.progressLabelsRow}>
                    <Text numberOfLines={1} style={[styles.progressStepLabel, order.stepIndex >= 1 && styles.progressStepLabelActive]}>
                      Confirmed
                    </Text>
                    <Text numberOfLines={1} style={[styles.progressStepLabel, order.stepIndex >= 2 && styles.progressStepLabelActive]}>
                      Pickup Set
                    </Text>
                    <Text numberOfLines={1} style={[styles.progressStepLabel, order.stepIndex >= 3 && styles.progressStepLabelActive]}>
                      In Transit
                    </Text>
                    <Text numberOfLines={1} style={[styles.progressStepLabel, order.stepIndex >= 4 && styles.progressStepLabelActive]}>
                      Delivered
                    </Text>
                  </View>

                  {/* Pickup Slot Brief */}
                  <View style={styles.pickupBriefRow}>
                    <Calendar size={13} color="#64748B" />
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.pickupBriefText}>
                      {order.pickupDate} ({order.pickupTime})
                    </Text>
                  </View>
                </View>
              )}

              {/* Pending Request Details Banner */}
              {order.tab === 'Pending' && (
                <View style={styles.pendingNoticeBanner}>
                  <Flame size={14} color="#EA580C" />
                  <Text style={styles.pendingNoticeText}>
                    Buyer offered {order.ratePerKg} for immediate pickup. Estimated net payout: {order.netPayout}.
                  </Text>
                </View>
              )}

              {/* ── Action Buttons ── */}
              <View style={styles.cardActionsRow}>
                {order.tab === 'Active' && (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.seeDetailsBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={() => setSelectedOrderDetails(order)}
                    >
                      <Eye size={14} color="#374151" />
                      <Text numberOfLines={1} style={styles.seeDetailsBtnText}>See Orders</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.trackVehicleActionBtn,
                        pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                      ]}
                      onPress={() =>
                        router.push({
                          pathname: '/orders/track-vehicle',
                          params: {
                            orderId: order.orderNumber,
                            crop: `${order.cropName} (${order.quantity})`,
                            buyer: order.buyerName,
                          },
                        })
                      }
                    >
                      <Truck size={14} color="#FFFFFF" strokeWidth={2.4} />
                      <Text numberOfLines={1} style={styles.trackVehicleActionText}>Track Vehicle</Text>
                      <ArrowRight size={13} color="#FFFFFF" strokeWidth={2.4} />
                    </Pressable>
                  </>
                )}

                {order.tab === 'Pending' && (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.seeDetailsBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={() => setSelectedOrderDetails(order)}
                    >
                      <Eye size={14} color="#374151" />
                      <Text numberOfLines={1} style={styles.seeDetailsBtnText}>Details</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.counterBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={() => handleCounterOffer(order)}
                    >
                      <Text numberOfLines={1} style={styles.counterBtnText}>Counter</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.acceptBtn,
                        pressed && { opacity: 0.9 },
                      ]}
                      onPress={() => handleAcceptOffer(order.id)}
                    >
                      <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                      <Text numberOfLines={1} style={styles.acceptBtnText}>Accept Offer</Text>
                    </Pressable>
                  </>
                )}

                {order.tab === 'Completed' && (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.seeDetailsBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={() => setSelectedOrderDetails(order)}
                    >
                      <Eye size={14} color="#374151" />
                      <Text numberOfLines={1} style={styles.seeDetailsBtnText}>See Orders</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.invoiceBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                      onPress={() => setInvoiceModalOrder(order)}
                    >
                      <Download size={14} color="#15803D" />
                      <Text numberOfLines={1} style={styles.invoiceBtnText}>Invoice & Receipt</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </MKCard>
          ))
        )}
      </View>

      {/* ════ Interactive "See Order Details" Full Modal ════ */}
      {selectedOrderDetails && (
        <Modal
          visible={Boolean(selectedOrderDetails)}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedOrderDetails(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              {/* Modal Top Bar */}
              <View style={styles.modalTopBar}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text numberOfLines={1} style={styles.modalOrderTitle}>
                    Order {selectedOrderDetails.orderNumber}
                  </Text>
                  <Text numberOfLines={1} style={styles.modalOrderSub}>{selectedOrderDetails.statusLabel}</Text>
                </View>
                <Pressable
                  onPress={() => setSelectedOrderDetails(null)}
                  style={styles.modalCloseCircle}
                >
                  <X size={20} color="#4B5563" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Crop & Quantity Header Card */}
                <View style={styles.modalCropCard}>
                  <Image
                    source={{ uri: selectedOrderDetails.cropImage || 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400' }}
                    style={styles.modalCropImg}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={styles.modalCropName}>{selectedOrderDetails.cropName}</Text>
                    <Text numberOfLines={1} style={styles.modalCropSub}>{selectedOrderDetails.cropVariety}</Text>
                    <View style={styles.modalQtyBadge}>
                      <Text numberOfLines={1} style={styles.modalQtyText}>
                        {selectedOrderDetails.quantity} • {selectedOrderDetails.grade}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Financial Payout Breakdown */}
                <View style={styles.modalSectionCard}>
                  <Text style={styles.modalSectionHeading}>Financial Settlement Breakdown</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalRowLabel}>Agreed Rate</Text>
                    <Text style={styles.modalRowVal}>{selectedOrderDetails.ratePerKg}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalRowLabel}>Gross Value</Text>
                    <Text style={styles.modalRowVal}>{selectedOrderDetails.totalValue}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalRowLabel}>Transit & Loading Fee</Text>
                    <Text style={[styles.modalRowVal, { color: '#DC2626' }]}>
                      - {selectedOrderDetails.transportDeduction}
                    </Text>
                  </View>
                  <View style={[styles.modalRow, styles.modalRowHighlight]}>
                    <Text style={styles.modalTotalLabel}>Net Farmer Payout</Text>
                    <Text style={styles.modalTotalVal}>{selectedOrderDetails.netPayout}</Text>
                  </View>
                  <View style={styles.paymentModeBox}>
                    <CreditCard size={14} color="#15803D" />
                    <Text numberOfLines={1} style={styles.paymentModeText}>{selectedOrderDetails.paymentMode}</Text>
                  </View>
                </View>

                {/* Buyer & Verification Card */}
                <View style={styles.modalSectionCard}>
                  <Text style={styles.modalSectionHeading}>Buyer Information</Text>
                  <View style={styles.modalBuyerRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text numberOfLines={1} style={styles.modalBuyerName}>{selectedOrderDetails.buyerName}</Text>
                        <CheckCircle2 size={15} color="#15803D" fill="#DCFCE7" />
                      </View>
                      <Text numberOfLines={1} style={styles.modalBuyerType}>{selectedOrderDetails.buyerType}</Text>
                    </View>
                    <Pressable
                      style={styles.modalCallBtn}
                      onPress={() =>
                        Alert.alert('Connecting Buyer', `Calling ${selectedOrderDetails.buyerName} representative...`)
                      }
                    >
                      <PhoneCall size={16} color="#15803D" />
                    </Pressable>
                  </View>
                </View>

                {/* Logistics & Driver Details (If Active) */}
                {selectedOrderDetails.driverName && (
                  <View style={styles.modalSectionCard}>
                    <Text style={styles.modalSectionHeading}>Assigned Vehicle & Driver</Text>
                    <View style={styles.driverBox}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={styles.driverNameText}>{selectedOrderDetails.driverName}</Text>
                        <Text numberOfLines={1} style={styles.driverVehicleText}>
                          {selectedOrderDetails.vehicleModel} • {selectedOrderDetails.vehicleNumber}
                        </Text>
                        <View style={styles.driverLocationRow}>
                          <MapPin size={13} color="#64748B" />
                          <Text numberOfLines={1} style={styles.driverLocationText}>
                            {selectedOrderDetails.statusLabel}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        style={styles.driverCallBtn}
                        onPress={() =>
                          Alert.alert('Calling Driver', `Calling ${selectedOrderDetails.driverName} (${selectedOrderDetails.driverPhone})`)
                        }
                      >
                        <PhoneCall size={16} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Direct Track Button inside Modal */}
                {selectedOrderDetails.tab === 'Active' && (
                  <Pressable
                    style={styles.modalTrackActionBtn}
                    onPress={() => {
                      setSelectedOrderDetails(null);
                      router.push('/orders/track-vehicle');
                    }}
                  >
                    <Truck size={18} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.modalTrackActionBtnText}>Track Live Vehicle on Map</Text>
                    <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} />
                  </Pressable>
                )}

                {/* View Official Mandi Payout Slip Button */}
                <Pressable
                  style={styles.modalInvoiceActionBtn}
                  onPress={() => {
                    const current = selectedOrderDetails;
                    setSelectedOrderDetails(null);
                    setInvoiceModalOrder(current);
                  }}
                >
                  <FileText size={18} color="#15803D" strokeWidth={2.4} />
                  <Text style={styles.modalInvoiceActionBtnText}>Download Mandi Payout Slip & Receipt</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ════ Official Mandi Gate Pass & Bank Settlement Receipt Modal ════ */}
      {invoiceModalOrder && (
        <Modal
          visible={Boolean(invoiceModalOrder)}
          transparent
          animationType="slide"
          onRequestClose={() => setInvoiceModalOrder(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.farmerReceiptCard}>
              <View style={styles.receiptTopBar}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Sprout size={20} color="#15803D" />
                  <Text style={styles.receiptHeaderTitle}>APMC Mandi Gate Pass & Settlement</Text>
                </View>
                <Pressable onPress={() => setInvoiceModalOrder(null)} style={{ padding: 4 }}>
                  <X size={22} color="#6B7280" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
                <View style={styles.receiptRefRow}>
                  <View>
                    <Text style={styles.receiptGPNumber}>GP-OD-{invoiceModalOrder.orderNumber}</Text>
                    <Text style={styles.receiptSubtext}>MandiKart Direct Farmgate Procurement</Text>
                  </View>
                  <View style={styles.receiptVerifiedBadge}>
                    <CheckCircle2 size={13} color="#15803D" />
                    <Text style={styles.receiptVerifiedText}>MSP GUARANTEED</Text>
                  </View>
                </View>

                {/* Transacting Parties */}
                <View style={styles.receiptPartiesBox}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.partySmallLabel}>PRODUCER (FARMER)</Text>
                    <Text style={styles.partyMainVal}>Verified Mandi Producer</Text>
                    <Text style={styles.partySmallSub}>Aadhaar & Bank Linked ✓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.partySmallLabel}>BUYER / MANDI YARD</Text>
                    <Text style={styles.partyMainVal}>{invoiceModalOrder.buyerName}</Text>
                    <Text style={styles.partySmallSub}>Bhubaneswar Yard Hub</Text>
                  </View>
                </View>

                {/* Settlement Table */}
                <View style={styles.weighbridgeBox}>
                  <Text style={styles.wbHeaderTitle}>Weighbridge & Quality Grade Slip</Text>
                  <View style={styles.wbStatRow}>
                    <Text style={styles.wbK}>Commodity</Text>
                    <Text style={styles.wbV}>{invoiceModalOrder.cropName}</Text>
                  </View>
                  <View style={styles.wbStatRow}>
                    <Text style={styles.wbK}>Gross Weight Recorded</Text>
                    <Text style={styles.wbV}>{invoiceModalOrder.quantity}</Text>
                  </View>
                  <View style={styles.wbStatRow}>
                    <Text style={styles.wbK}>Assayed Quality</Text>
                    <Text style={styles.wbV}>Grade A (Moisture 11.8%)</Text>
                  </View>
                  <View style={styles.wbStatRow}>
                    <Text style={styles.wbK}>Agreed Farmgate Rate</Text>
                    <Text style={[styles.wbV, { color: '#15803D', fontWeight: '800' }]}>{invoiceModalOrder.ratePerKg}</Text>
                  </View>
                  <View style={styles.wbStatRow}>
                    <Text style={styles.wbK}>Mandi Cess / Deduction</Text>
                    <Text style={styles.wbV}>₹0.00 (Zero Fee for Farmers)</Text>
                  </View>

                  <View style={styles.receiptDivider} />

                  <View style={styles.wbTotalRow}>
                    <Text style={styles.wbTotalLabel}>Net Farmer Payout</Text>
                    <Text style={styles.wbTotalVal}>{invoiceModalOrder.netPayout}</Text>
                  </View>
                  <Text style={styles.escrowNotice}>
                    🛡️ Escrow Transfer Reference: MK-ESCROW-PAID. Credited to farmer HDFC Bank (A/C ****1289).
                  </Text>
                </View>

                {/* Export & Download Actions */}
                <View style={styles.receiptActionsRow}>
                  <Pressable
                    style={styles.farmerDownloadBtn}
                    onPress={() => handleExportFarmerReceipt(invoiceModalOrder.orderNumber)}
                  >
                    <Download size={16} color="#FFFFFF" strokeWidth={2.4} />
                    <Text style={styles.farmerDownloadBtnText}>Download PDF Slip</Text>
                  </Pressable>

                  <Pressable
                    style={styles.farmerShareBtn}
                    onPress={() => handleShareFarmerReceipt(invoiceModalOrder.orderNumber)}
                  >
                    <Building2 size={16} color="#15803D" strokeWidth={2.4} />
                    <Text style={styles.farmerShareBtnText}>Share with FPO</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ════ Order Accepted Confirmation Modal ════ */}
      {acceptedOrderSuccess && (
        <Modal
          visible={Boolean(acceptedOrderSuccess)}
          transparent
          animationType="fade"
          onRequestClose={() => setAcceptedOrderSuccess(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.acceptedModalCard}>
              <View style={styles.acceptedIconCircle}>
                <Truck size={38} color="#15803D" strokeWidth={2.4} />
              </View>

              <Text style={styles.acceptedModalTitle}>Offer Accepted! 🚛</Text>
              <Text style={styles.acceptedModalSubTitle}>
                Order has been moved to your Active pipeline. A transit vehicle has been reserved for your harvest.
              </Text>

              <View style={styles.acceptedOrderSummaryCard}>
                <View style={styles.acceptedOrderRow}>
                  <Text style={styles.acceptedOrderLabel}>Produce</Text>
                  <Text style={styles.acceptedOrderVal}>{acceptedOrderSuccess.cropName} ({acceptedOrderSuccess.quantity})</Text>
                </View>
                <View style={styles.acceptedOrderRow}>
                  <Text style={styles.acceptedOrderLabel}>Agreed Rate</Text>
                  <Text style={[styles.acceptedOrderVal, { color: '#15803D', fontWeight: '800' }]}>{acceptedOrderSuccess.ratePerKg}</Text>
                </View>
                <View style={styles.acceptedOrderRow}>
                  <Text style={styles.acceptedOrderLabel}>Buyer</Text>
                  <Text style={styles.acceptedOrderVal}>{acceptedOrderSuccess.buyerName}</Text>
                </View>
                <View style={styles.acceptedOrderRow}>
                  <Text style={styles.acceptedOrderLabel}>Assigned Driver</Text>
                  <Text style={[styles.acceptedOrderVal, { fontWeight: '700' }]}>{acceptedOrderSuccess.driverName || 'Sunil Jadhav'}</Text>
                </View>
                <View style={[styles.acceptedOrderRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.acceptedOrderLabel}>Vehicle Number</Text>
                  <Text style={[styles.acceptedOrderVal, { color: '#0F172A', fontWeight: '800' }]}>{acceptedOrderSuccess.vehicleNumber || 'MH 15 CT 8812'}</Text>
                </View>
              </View>

              <Pressable
                style={styles.acceptedTrackBtn}
                onPress={() => {
                  const current = acceptedOrderSuccess;
                  setAcceptedOrderSuccess(null);
                  router.push({
                    pathname: '/orders/track-vehicle',
                    params: {
                      orderId: current.id,
                      crop: `${current.cropName} (${current.quantity})`,
                      buyer: current.buyerName,
                    },
                  });
                }}
              >
                <Navigation size={18} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.acceptedTrackBtnText}>Track Live Vehicle on Map</Text>
              </Pressable>

              <Pressable
                style={styles.acceptedCloseBtn}
                onPress={() => setAcceptedOrderSuccess(null)}
              >
                <Text style={styles.acceptedCloseBtnText}>View in Active Orders</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </MKScreen>
  );
}

const styles = StyleSheet.create({
  /* ── Order Accepted Modal Styles ── */
  acceptedModalCard: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  acceptedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  acceptedModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  acceptedModalSubTitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  acceptedOrderSummaryCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  acceptedOrderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  acceptedOrderLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  acceptedOrderVal: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  acceptedTrackBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    elevation: 3,
  },
  acceptedTrackBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  acceptedCloseBtn: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  acceptedCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  headerTextCol: {
    flex: 1,
    marginRight: MKSpacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1C1E',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E3DCCF',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  screenScrollContent: {
    paddingHorizontal: 10,
    width: '100%',
  },

  /* ── Search Bar ── */
  searchBarWrapper: {
    marginBottom: 12,
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E3DCCF',
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#1A1C1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
    marginRight: 4,
  },

  /* ── Inline Live Transit Banner inside Order Card ── */
  inlineLiveTransitBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 10,
    gap: 4,
  },
  inlineTransitTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  inlineTransitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  inlineRadarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  inlineTransitText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#15803D',
    flex: 1,
  },
  onRoadPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  onRoadPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.4,
  },
  inlineTransitVehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 2,
  },
  inlineTransitSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },

  /* ── Summary Strip ── */
  summaryStrip: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 14,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 0,
  },
  summaryBoxActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    shadowColor: '#10B981',
    shadowOpacity: 0.15,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },

  /* ── Filter Pills ── */
  filterTabsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    fontWeight: '800',
    color: '#0F172A',
  },

  /* ── Orders List & Cards ── */
  ordersList: {
    gap: 14,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  orderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  badgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeActiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgePendingText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C2410C',
  },
  badgeCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeCompletedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4B5563',
  },
  orderNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  orderValueWrap: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  orderValueAmount: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#15803D',
  },
  orderValueSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },

  /* Crop & Buyer Info */
  cropInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  cropThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cropNameTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  cropVarietySub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  buyerInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  buyerInlineName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    flexShrink: 1,
  },

  /* Stepper Box */
  stepperBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  stepperDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepperDotOrange: {
    backgroundColor: '#EA580C',
  },
  stepperDotGreen: {
    backgroundColor: '#15803D',
  },
  stepperHeaderText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressBarWrap: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressTrack: {
    height: '100%',
    backgroundColor: '#15803D',
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressStepLabel: {
    fontSize: 9.5,
    color: '#9CA3AF',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  progressStepLabelActive: {
    color: '#15803D',
    fontWeight: '800',
  },
  pickupBriefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  pickupBriefText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
    flexShrink: 1,
  },

  /* Pending Banner */
  pendingNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: 10,
  },
  pendingNoticeText: {
    fontSize: 11.5,
    color: '#C2410C',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },

  /* Card Actions Row */
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  seeDetailsBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  seeDetailsBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#374151',
  },
  trackVehicleActionBtn: {
    flex: 1.3,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 38,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#15803D',
    elevation: 2,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  trackVehicleActionText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  counterBtn: {
    flex: 0.9,
    minWidth: 0,
    height: 38,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  counterBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#D97706',
  },
  acceptBtn: {
    flex: 1.3,
    minWidth: 0,
    height: 38,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  acceptBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  invoiceBtn: {
    flex: 1.3,
    minWidth: 0,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  invoiceBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },

  /* Empty State */
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E3DCCF',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  emptySellBtn: {
    marginTop: 8,
    backgroundColor: '#15803D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptySellBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
  },

  /* ════ Modal Styles ════ */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: '85%',
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  modalOrderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  modalOrderSub: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
    marginTop: 1,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    marginBottom: 10,
  },
  modalCropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  modalCropImg: {
    width: 54,
    height: 54,
    borderRadius: 12,
  },
  modalCropName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  modalCropSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  modalQtyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  modalQtyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  modalSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  modalSectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  modalRowLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalRowVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalRowHighlight: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 4,
  },
  modalTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  modalTotalVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#15803D',
  },
  paymentModeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  paymentModeText: {
    fontSize: 11.5,
    color: '#15803D',
    fontWeight: '700',
  },
  modalBuyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalBuyerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  modalBuyerType: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
  },
  driverNameText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1F2937',
  },
  driverVehicleText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  driverLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  driverLocationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EA580C',
  },
  driverCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTrackActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803D',
    height: 46,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  modalTrackActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pendingOrderAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FFEDD5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  pendingOrderAlertText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
    flex: 1,
  },
  pendingOrderAlertLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
  },
  modalInvoiceActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    height: 46,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  modalInvoiceActionBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#15803D',
  },
  // Farmer Receipt & Mandi Gate Pass Modal
  farmerReceiptCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '88%',
    gap: 12,
  },
  receiptTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  receiptHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
  },
  receiptRefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  receiptGPNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1A1C1E',
  },
  receiptSubtext: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  receiptVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  receiptVerifiedText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803D',
  },
  receiptPartiesBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  partySmallLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  partyMainVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 2,
  },
  partySmallSub: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
    marginTop: 1,
  },
  weighbridgeBox: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  wbHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1A1C1E',
    marginBottom: 4,
  },
  wbStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  wbK: {
    fontSize: 12,
    color: '#6B7280',
  },
  wbV: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  wbTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  wbTotalLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  wbTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  escrowNotice: {
    fontSize: 10.5,
    color: '#6B7280',
    lineHeight: 14,
    marginTop: 4,
  },
  receiptActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  farmerDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#15803D',
    height: 44,
    borderRadius: 12,
  },
  farmerDownloadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  farmerShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#15803D',
    height: 44,
    borderRadius: 12,
  },
  farmerShareBtnText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '800',
  },
});
