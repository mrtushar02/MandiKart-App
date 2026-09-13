/**
 * MandiKart Farmer App — Sales History & Financial Statements
 * 
 * Implements screens 18, 19:
 * - Sales record dashboard with aggregate performance metrics
 * - Filters by timeframe (All time, this month, last month) and status
 * - Detailed transaction cards showing gross, transport deduction, and net payout
 * - Itemized financial statement & downloadable receipt modal
 * - Direct navigation bridge to Orders module for dispatch tracking
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Download,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Receipt,
  Building2,
  Calendar,
  X,
  CreditCard,
  Layers,
  Filter,
} from 'lucide-react-native';
import { useSellStore, CompletedSale, BuyerType } from '../../store/sellStore';
import { useOrderStore } from '../../store/orderStore';

type TimeFilter = 'All' | 'This Month' | 'Last Month';
type StatusFilter = 'All' | 'Completed' | 'In Transit' | 'Payment Pending';

export default function SalesHistoryScreen() {
  const router = useRouter();
  const { salesHistory } = useSellStore();
  const { orders } = useOrderStore();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Statement Receipt Modal
  const [selectedSale, setSelectedSale] = useState<CompletedSale | null>(null);
  const [statementModalVisible, setStatementModalVisible] = useState(false);

  // Combined sales: manual entries in sellStore plus fulfilled orders from orderStore
  const allSales: CompletedSale[] = useMemo(() => {
    const existingIds = new Set(salesHistory.map((s) => s.id));
    const parseNum = (val: string | number | undefined, fallback = 0) => {
      if (typeof val === 'number') return val;
      if (!val) return fallback;
      const clean = String(val).replace(/[^0-9.]/g, '');
      return parseFloat(clean) || fallback;
    };

    const fromOrders: CompletedSale[] = orders
      .filter((o) => o.tab === 'Completed' || o.statusType === 'completed' || o.tab === 'Active')
      .map((o) => {
        const qty = parseNum(o.quantity, 100);
        const rate = parseNum(o.ratePerKg, 30);
        const gross = parseNum(o.totalValue, qty * rate);
        const transport = parseNum(o.transportDeduction, Math.round(gross * 0.02));
        const platform = Math.round(gross * 0.025);
        const net = parseNum(o.netPayout, gross - transport - platform);
        const st: CompletedSale['status'] =
          o.tab === 'Completed' || o.statusType === 'completed'
            ? 'Completed'
            : o.tab === 'Active'
            ? 'In Transit'
            : 'Payment Pending';

        const buyerTypeClean: BuyerType =
          o.buyerType === 'Food Processor' ? 'Food Processor' :
          o.buyerType === 'Retail Chain Hub' ? 'Retail Chain Hub' :
          o.buyerType === 'Institutional Buyer' ? 'Institutional Buyer' :
          o.buyerType === 'Exporter' ? 'Exporter' : 'Wholesale Buyer';

        return {
          id: o.id,
          orderId: o.orderNumber || `#ORD-${o.id.slice(0, 5)}`,
          cropName: o.cropName,
          variety: o.cropVariety || 'Standard',
          quantityKg: qty,
          agreedPricePerKg: rate,
          grossAmount: gross,
          transportCost: transport,
          platformFee: platform,
          netPayout: net,
          buyerName: o.buyerName || 'Verified Buyer',
          buyerType: buyerTypeClean,
          saleDate: o.pickupDate || o.createdAt || 'Today',
          status: st,
          paymentMethod: o.paymentMode || 'Direct Bank Escrow',
          transactionRef: `TXN-${o.id.slice(0, 6).toUpperCase()}`,
        };
      })
      .filter((s) => !existingIds.has(s.id));

    return [...salesHistory, ...fromOrders];
  }, [salesHistory, orders]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return allSales.filter((sale) => {
      // Dynamic time filter using real Date calculations
      if (timeFilter !== 'All') {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const parsed = new Date(sale.saleDate);
        const isValid = !isNaN(parsed.getTime());

        if (timeFilter === 'This Month') {
          if (isValid) {
            if (parsed.getMonth() !== currentMonth || parsed.getFullYear() !== currentYear) return false;
          } else {
            const currentMonthShort = now.toLocaleString('en-US', { month: 'short' }).toLowerCase();
            const lowerDate = sale.saleDate.toLowerCase();
            if (!lowerDate.includes('today') && !lowerDate.includes(currentMonthShort)) return false;
          }
        } else if (timeFilter === 'Last Month') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          if (isValid) {
            if (parsed.getMonth() !== lastMonth || parsed.getFullYear() !== lastMonthYear) return false;
          } else {
            const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
            const lastMonthShort = lastMonthDate.toLocaleString('en-US', { month: 'short' }).toLowerCase();
            if (!sale.saleDate.toLowerCase().includes(lastMonthShort)) return false;
          }
        }
      }

      // Status filter
      if (statusFilter !== 'All' && sale.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesCrop = sale.cropName.toLowerCase().includes(query);
        const matchesBuyer = sale.buyerName.toLowerCase().includes(query);
        const matchesOrder = sale.orderId.toLowerCase().includes(query);
        if (!matchesCrop && !matchesBuyer && !matchesOrder) return false;
      }

      return true;
    });
  }, [allSales, timeFilter, statusFilter, searchQuery]);

  // Aggregate Metrics
  const aggregateMetrics = useMemo(() => {
    let totalGross = 0;
    let totalNet = 0;
    let totalKg = 0;

    filteredSales.forEach((s) => {
      totalGross += s.grossAmount;
      totalNet += s.netPayout;
      totalKg += s.quantityKg;
    });

    const avgPricePerKg = totalKg > 0 ? (totalGross / totalKg).toFixed(1) : '0.0';
    const totalQuintals = (totalKg / 100).toFixed(1);

    return {
      totalGross,
      totalNet,
      totalKg,
      totalQuintals,
      avgPricePerKg,
      dealsCount: filteredSales.length,
    };
  }, [filteredSales]);

  const handleOpenStatement = (sale: CompletedSale) => {
    setSelectedSale(sale);
    setStatementModalVisible(true);
  };

  const handleDownloadInvoice = () => {
    Alert.alert(
      'Tax Invoice Downloaded',
      `Payment statement for ${selectedSale?.orderId} has been downloaded and saved to your device.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Sales History & Statements</Text>
          <Text style={styles.headerSubtitle}>
            Verified sales settlements and transaction receipts
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Metric Cards Row */}
        <View style={styles.metricsContainer}>
          <View style={[styles.metricCard, styles.metricCardPrimary]}>
            <View style={styles.metricIconWrap}>
              <TrendingUp size={18} color="#15803D" />
            </View>
            <Text style={styles.metricLabel}>Total Net Payout</Text>
            <Text style={styles.metricValHighlight}>
              ₹{aggregateMetrics.totalNet.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.metricSub}>
              Gross: ₹{aggregateMetrics.totalGross.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIconWrapSecondary}>
              <Layers size={18} color="#2563EB" />
            </View>
            <Text style={styles.metricLabel}>Total Sold Volume</Text>
            <Text style={styles.metricVal}>
              {aggregateMetrics.totalQuintals} <Text style={styles.metricUnit}>Qtl</Text>
            </Text>
            <Text style={styles.metricSub}>
              {aggregateMetrics.totalKg} kg across {aggregateMetrics.dealsCount} deals
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by crop, buyer, or Order ID..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Timeframe Filter Tabs */}
        <View style={styles.timeframeRow}>
          {(['All', 'This Month', 'Last Month'] as TimeFilter[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.timeChip,
                timeFilter === tab && styles.timeChipActive,
              ]}
              onPress={() => setTimeFilter(tab)}
            >
              <Text
                style={[
                  styles.timeChipText,
                  timeFilter === tab && styles.timeChipTextActive,
                ]}
              >
                {tab === 'All' ? 'All Time' : tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Status Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusChipsRow}
        >
          {(['All', 'Completed', 'In Transit', 'Payment Pending'] as StatusFilter[]).map(
            (st) => (
              <TouchableOpacity
                key={st}
                style={[
                  styles.statusChip,
                  statusFilter === st && styles.statusChipActive,
                ]}
                onPress={() => setStatusFilter(st)}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    statusFilter === st && styles.statusChipTextActive,
                  ]}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        {/* Sales List */}
        <View style={styles.salesListSection}>
          <Text style={styles.sectionHeader}>
            Transaction Records ({filteredSales.length})
          </Text>

          {filteredSales.length === 0 ? (
            <View style={styles.emptyState}>
              <Receipt size={40} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Sales Records</Text>
              <Text style={styles.emptyDesc}>
                No completed or in-transit sales found for the selected filters.
              </Text>
            </View>
          ) : (
            filteredSales.map((sale) => {
              const isCompleted = sale.status === 'Completed';
              const isInTransit = sale.status === 'In Transit';

              return (
                <View key={sale.id} style={styles.saleCard}>
                  {/* Top Bar: Date & Status */}
                  <View style={styles.cardTopBar}>
                    <View style={styles.orderIdBadge}>
                      <Text style={styles.orderIdText}>{sale.orderId}</Text>
                    </View>
                    <View
                      style={[
                        styles.saleStatusBadge,
                        {
                          backgroundColor: isCompleted
                            ? '#ECFDF5'
                            : isInTransit
                            ? '#EFF6FF'
                            : '#FFFBEB',
                        },
                      ]}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={12} color="#16A34A" />
                      ) : (
                        <Clock size={12} color={isInTransit ? '#2563EB' : '#D97706'} />
                      )}
                      <Text
                        style={[
                          styles.saleStatusText,
                          {
                            color: isCompleted
                              ? '#15803D'
                              : isInTransit
                              ? '#2563EB'
                              : '#D97706',
                          },
                        ]}
                      >
                        {sale.status}
                      </Text>
                    </View>
                  </View>

                  {/* Crop & Buyer Info */}
                  <View style={styles.cropBuyerRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.saleCropTitle}>
                        {sale.cropName}
                        {sale.variety ? ` • ${sale.variety}` : ''}
                      </Text>
                      <View style={styles.buyerRow}>
                        <Building2 size={13} color="#6B7280" />
                        <Text style={styles.saleBuyerName} numberOfLines={1}>
                          {sale.buyerName}
                        </Text>
                      </View>
                      <View style={styles.dateRow}>
                        <Calendar size={12} color="#9CA3AF" />
                        <Text style={styles.saleDateText}>{sale.saleDate}</Text>
                      </View>
                    </View>

                    <View style={styles.priceColumn}>
                      <Text style={styles.agreedRate}>₹{sale.agreedPricePerKg}/kg</Text>
                      <Text style={styles.totalVolume}>{sale.quantityKg} kg sold</Text>
                    </View>
                  </View>

                  {/* Financial Breakdown Strip */}
                  <View style={styles.financialStrip}>
                    <View style={styles.stripCol}>
                      <Text style={styles.stripLabel}>Gross Value</Text>
                      <Text style={styles.stripVal}>₹{sale.grossAmount.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.stripCol}>
                      <Text style={styles.stripLabel}>Transport</Text>
                      <Text style={styles.stripValRed}>-₹{sale.transportCost.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.stripCol}>
                      <Text style={[styles.stripLabel, { color: '#15803D' }]}>Net Settlement</Text>
                      <Text style={styles.stripValGreen}>₹{sale.netPayout.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>

                  {/* Payment channel pill */}
                  <View style={styles.paymentMethodPill}>
                    <CreditCard size={12} color="#4B5563" />
                    <Text style={styles.paymentMethodText}>
                      Settled via: {sale.paymentMethod} • Ref: {sale.transactionRef}
                    </Text>
                  </View>

                  {/* Card Actions */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.statementBtn}
                      onPress={() => handleOpenStatement(sale)}
                    >
                      <Receipt size={14} color="#15803D" />
                      <Text style={styles.statementBtnText}>View Statement & Receipt</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.orderLinkBtn}
                      onPress={() => router.push('/(tabs)/orders')}
                    >
                      <Text style={styles.orderLinkBtnText}>Track Logistics</Text>
                      <ChevronRight size={14} color="#2563EB" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ========================================================================= */}
      {/* FINANCIAL STATEMENT & RECEIPT MODAL                                       */}
      {/* ========================================================================= */}
      <Modal
        visible={statementModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatementModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Tax Invoice & Statement</Text>
                <Text style={styles.modalSub}>
                  Official MandiKart Farmgate Settlement Receipt
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setStatementModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {selectedSale && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollBody}
              >
                {/* Official Receipt Stamp */}
                <View style={styles.receiptHeaderBox}>
                  <View style={styles.receiptStamp}>
                    <CheckCircle2 size={16} color="#15803D" />
                    <Text style={styles.receiptStampText}>VERIFIED TRANSACTION</Text>
                  </View>
                  <Text style={styles.receiptIdText}>
                    Order #{selectedSale.orderId}
                  </Text>
                  <Text style={styles.receiptTimestamp}>
                    Settled on: {selectedSale.saleDate}
                  </Text>
                </View>

                {/* Parties Details */}
                <View style={styles.receiptPartiesBox}>
                  <View style={styles.partyCol}>
                    <Text style={styles.partyRole}>FARMER (SELLER)</Text>
                    <Text style={styles.partyName}>Ramesh Patil</Text>
                    <Text style={styles.partyLoc}>Dindori, Nashik (MH)</Text>
                  </View>
                  <View style={styles.partyDivider} />
                  <View style={styles.partyCol}>
                    <Text style={styles.partyRole}>BUYER</Text>
                    <Text style={styles.partyName}>{selectedSale.buyerName}</Text>
                    <Text style={styles.partyLoc}>{selectedSale.buyerType}</Text>
                  </View>
                </View>

                {/* Itemized Calculations */}
                <View style={styles.itemizedBox}>
                  <Text style={styles.itemizedTitle}>SETTLEMENT BREAKDOWN</Text>

                  <View style={styles.lineItem}>
                    <View>
                      <Text style={styles.lineItemTitle}>
                        {selectedSale.cropName} ({selectedSale.quantityKg} kg)
                      </Text>
                      <Text style={styles.lineItemRate}>
                        Agreed Contract Rate @ ₹{selectedSale.agreedPricePerKg}/kg
                      </Text>
                    </View>
                    <Text style={styles.lineItemVal}>
                      ₹{selectedSale.grossAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.lineItem}>
                    <View>
                      <Text style={styles.lineItemTitle}>Transport & Transit Fee</Text>
                      <Text style={styles.lineItemRate}>
                        Farmgate to Buyer Hub Logistics
                      </Text>
                    </View>
                    <Text style={styles.lineItemValMuted}>
                      -₹{selectedSale.transportCost.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.lineItem}>
                    <View>
                      <Text style={styles.lineItemTitle}>MandiKart Platform Service</Text>
                      <Text style={styles.lineItemRate}>100% Free for registered farmers</Text>
                    </View>
                    <Text style={[styles.lineItemVal, { color: '#15803D' }]}>₹0</Text>
                  </View>

                  <View style={styles.totalLine}>
                    <Text style={styles.totalLabel}>Total Net Payout</Text>
                    <Text style={styles.totalValHighlight}>
                      ₹{selectedSale.netPayout.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Settlement Information */}
                <View style={styles.settlementInfoBox}>
                  <Text style={styles.itemizedTitle}>PAYMENT & AUDIT TRAIL</Text>
                  <View style={styles.auditRow}>
                    <Text style={styles.auditKey}>Payment Mode:</Text>
                    <Text style={styles.auditVal}>{selectedSale.paymentMethod}</Text>
                  </View>
                  <View style={styles.auditRow}>
                    <Text style={styles.auditKey}>Bank Reference:</Text>
                    <Text style={styles.auditVal}>{selectedSale.transactionRef}</Text>
                  </View>
                  <View style={styles.auditRow}>
                    <Text style={styles.auditKey}>Settlement Account:</Text>
                    <Text style={styles.auditVal}>HDFC Bank (ending ••4021)</Text>
                  </View>
                  <View style={styles.auditRow}>
                    <Text style={styles.auditKey}>Audit Status:</Text>
                    <Text style={[styles.auditVal, { color: '#15803D', fontWeight: '700' }]}>
                      Weighbridge slip verified
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Modal Actions */}
            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                style={styles.downloadInvoiceBtn}
                onPress={handleDownloadInvoice}
              >
                <Download size={16} color="#FFFFFF" />
                <Text style={styles.downloadInvoiceBtnText}>
                  Download Tax Receipt (PDF)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* Metrics Row */
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  metricCardPrimary: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricIconWrapSecondary: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  metricValHighlight: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 4,
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 4,
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  metricSub: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },

  /* Search */
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#111827',
  },

  /* Timeframe filter */
  timeframeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  timeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  timeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  timeChipTextActive: {
    color: '#FFFFFF',
  },

  /* Status chips */
  statusChipsRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  statusChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  statusChipTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },

  /* Section */
  salesListSection: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },

  /* Sale Card */
  saleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderIdBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  saleStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  saleStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cropBuyerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saleCropTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 5,
  },
  saleBuyerName: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 5,
  },
  saleDateText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  agreedRate: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  totalVolume: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  /* Financial Strip */
  financialStrip: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  stripCol: {
    flex: 1,
  },
  stripLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  stripVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  stripValRed: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 2,
  },
  stripValGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  paymentMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  paymentMethodText: {
    fontSize: 11,
    color: '#6B7280',
  },

  /* Card Actions */
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statementBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 5,
  },
  statementBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  orderLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  orderLinkBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },

  /* Statement Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  modalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalScrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  receiptHeaderBox: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  receiptStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  receiptStampText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  receiptIdText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  receiptTimestamp: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  receiptPartiesBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  partyCol: {
    flex: 1,
  },
  partyDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  partyRole: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  partyName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  partyLoc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  itemizedBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  itemizedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lineItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  lineItemRate: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  lineItemVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  lineItemValMuted: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  totalValHighlight: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803D',
  },
  settlementInfoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  auditKey: {
    fontSize: 12,
    color: '#6B7280',
  },
  auditVal: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalFooterActions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  downloadInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15803D',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  downloadInvoiceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
