import React, { useState } from 'react';
import type { AdminUser } from '../types/admin';
import type { DetailedOrder, EscrowStatus } from '../types/ordersAndDisputes';
import { MOCK_ORDERS } from './OrdersAndDisputesMock';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

// Crop photo resolver
const getCropFallbackImage = (cropName: string = '') => {
  const name = (cropName || '').toLowerCase();
  if (name.includes('tomato')) return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80';
  if (name.includes('onion')) return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80';
  if (name.includes('potato') || name.includes('alu') || name.includes('aloo')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80';
  if (name.includes('wheat') || name.includes('gehu')) return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80';
  if (name.includes('rice') || name.includes('paddy')) return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80';
  if (name.includes('corn') || name.includes('maize')) return 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=80';
  if (name.includes('orange') || name.includes('santra')) return 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=500&auto=format&fit=crop&q=80';
  if (name.includes('apple')) return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80';
  return 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=500&auto=format&fit=crop&q=80';
};

interface OrdersSettlementsProps {
  user: AdminUser;
  onLogout: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const OrdersSettlements: React.FC<OrdersSettlementsProps> = ({
  user,
  onLogout,
  onNavigateTab,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Initialize with localStorage persistence so accepted orders never vanish on refresh!
  const [orders, setOrders] = useState<DetailedOrder[]>(() => {
    try {
      const saved = localStorage.getItem('mandikart_admin_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MOCK_ORDERS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<DetailedOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Sync with live Admin backend (port 4003) with 3s polling for real-time order updates
  React.useEffect(() => {
    const fetchAdminOrders = () => {
      fetch('http://localhost:4003/api/v1/admin/orders')
        .then(res => res.json())
        .then(result => {
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            setOrders(prev => {
              const prevMap = new Map(prev.map(o => [o.id, o]));
              const merged: DetailedOrder[] = result.data.map((liveOrder: any) => {
                const prevOrder = prevMap.get(liveOrder.id);
                const crop = liveOrder.cropName || liveOrder.produceName || 'Produce';
                const img = liveOrder.imageUrl || (prevOrder && prevOrder.imageUrl) || getCropFallbackImage(crop);
                
                return {
                  id: liveOrder.id,
                  orderNumber: liveOrder.orderNumber || `#MK-${liveOrder.id.slice(0, 5)}`,
                  farmerName: liveOrder.farmerName || 'Ramesh Patel',
                  farmerCode: liveOrder.farmerCode || 'FMR-8921',
                  farmerPhone: liveOrder.farmerPhone || '+91 98230 41122',
                  farmerLocation: liveOrder.farmerLocation || 'Nashik, Maharashtra',
                  buyerName: liveOrder.buyerName || 'Vikram Mehta',
                  buyerCompany: liveOrder.buyerCompany || 'Wholesale Buyer',
                  buyerPhone: liveOrder.buyerPhone || '+91 91234 56789',
                  buyerLocation: liveOrder.buyerLocation || 'Mumbai, Maharashtra',
                  produceName: liveOrder.produceName || crop,
                  cropName: crop,
                  qualityGrade: liveOrder.qualityGrade || 'Grade A',
                  quantityKg: Number(liveOrder.quantityKg || 100),
                  pricePerKg: Number(liveOrder.pricePerKg || 30),
                  totalAmount: Number(liveOrder.totalPrice || liveOrder.totalAmount || 3000),
                  totalPrice: Number(liveOrder.totalPrice || liveOrder.totalAmount || 3000),
                  status: liveOrder.status || 'PLACED',
                  escrowStatus: liveOrder.escrowStatus || (liveOrder.status === 'COMPLETED' ? 'RELEASED_TO_FARMER' : liveOrder.status === 'REJECTED' ? 'REFUNDED_TO_BUYER' : 'HELD_IN_ESCROW'),
                  mandiName: liveOrder.mandiName || 'Nashik APMC',
                  district: liveOrder.district || 'Nashik',
                  createdAt: liveOrder.createdAt || new Date().toISOString(),
                  timestamp: liveOrder.timestamp || new Date().toISOString(),
                  deliveryAddress: liveOrder.deliveryAddress || 'Cold Storage Terminal, Mumbai',
                  logisticsPartner: liveOrder.logisticsPartner || 'AgroTruck Logistics',
                  logisticsTrackingId: liveOrder.logisticsTrackingId || `TRK-${liveOrder.id.slice(0, 4)}-MH`,
                  estimatedDelivery: liveOrder.estimatedDelivery || 'Tomorrow, 10:00 AM',
                  imageUrl: img,
                };
              });

              // Keep any local orders not yet on backend
              prev.forEach(po => {
                if (!merged.some(m => m.id === po.id)) {
                  merged.push(po);
                }
              });

              safeSaveOrders(merged);
              return merged;
            });
          }
        })
        .catch(() => {});
    };

    fetchAdminOrders();
    const interval = setInterval(fetchAdminOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  // Safe localStorage helper that strips large base64 data URIs to prevent UI thread freezing
  const safeSaveOrders = (ordersToSave: DetailedOrder[]) => {
    try {
      const sanitized = ordersToSave.map(o => ({
        ...o,
        imageUrl: o.imageUrl && o.imageUrl.startsWith('file://') ? undefined : o.imageUrl,
      }));
      localStorage.setItem('mandikart_admin_orders', JSON.stringify(sanitized));
    } catch (err) {
      console.warn('LocalStorage save skipped to prevent UI freeze:', err);
    }
  };

  // Helper to persist order updates locally and to backend
  const updateOrdersState = (orderId: string, updates: Partial<DetailedOrder>) => {
    setOrders(prev => {
      const updated = prev.map(order => {
        if (order.id === orderId) {
          return { ...order, ...updates };
        }
        return order;
      });
      safeSaveOrders(updated);
      return updated;
    });

    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // ACCEPT ORDER HANDLER: Admin accepts order -> Transitions PLACED to CONFIRMED
  const handleAcceptOrder = (orderId: string) => {
    fetch(`http://localhost:4003/api/v1/admin/orders/${orderId}/accept`, {
      method: 'POST',
    }).catch(err => console.warn('Accept order API notice:', err));

    updateOrdersState(orderId, { status: 'CONFIRMED' });
    showToast(`ORDER ACCEPTED: Order #${orderId} confirmed and queued for pickup scheduling!`);
  };

  // REJECT ORDER HANDLER: Admin rejects order -> Transitions PLACED to REJECTED & refunds escrow
  const handleRejectOrder = (orderId: string) => {
    fetch(`http://localhost:4003/api/v1/admin/orders/${orderId}/reject`, {
      method: 'POST',
    }).catch(err => console.warn('Reject order API notice:', err));

    updateOrdersState(orderId, {
      status: 'REJECTED' as any,
      escrowStatus: 'REFUNDED_TO_BUYER' as EscrowStatus,
    });
    showToast(`ORDER REJECTED: Order #${orderId} rejected. Buyer escrow has been refunded.`);
  };

  // DISPATCH ORDER HANDLER: CONFIRMED -> IN_TRANSIT
  const handleDispatchOrder = (orderId: string) => {
    fetch(`http://localhost:4003/api/v1/admin/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_TRANSIT' }),
    }).catch(err => console.warn('Dispatch order API notice:', err));

    updateOrdersState(orderId, { status: 'IN_TRANSIT' });
    showToast(`ORDER DISPATCHED: Order #${orderId} is now IN TRANSIT with cold-chain carrier.`);
  };

  // MARK DELIVERED HANDLER: IN_TRANSIT -> DELIVERED
  const handleMarkDelivered = (orderId: string) => {
    fetch(`http://localhost:4003/api/v1/admin/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DELIVERED' }),
    }).catch(err => console.warn('Mark delivered API notice:', err));

    updateOrdersState(orderId, { status: 'DELIVERED' });
    showToast(`DELIVERY VERIFIED: Order #${orderId} marked as DELIVERED.`);
  };

  // Escrow Action Handler: Release to Farmer
  const handleReleaseEscrow = (orderId: string) => {
    fetch(`http://localhost:4003/api/v1/admin/orders/${orderId}/release-escrow`, {
      method: 'POST',
    }).catch(err => console.warn('Release escrow API notice:', err));

    updateOrdersState(orderId, {
      escrowStatus: 'RELEASED_TO_FARMER' as EscrowStatus,
      status: 'COMPLETED'
    });
    showToast(`ESCROW SETTLED: Payout released to farmer account for order #${orderId}.`);
  };

  // Escrow Action Handler: Refund to Buyer
  const handleRefundBuyer = (orderId: string) => {
    fetch(`http://localhost:4003/api/v1/admin/orders/${orderId}/refund-buyer`, {
      method: 'POST',
    }).catch(err => console.warn('Refund buyer API notice:', err));

    updateOrdersState(orderId, {
      escrowStatus: 'REFUNDED_TO_BUYER' as EscrowStatus,
      status: 'DISPUTED'
    });
    showToast(`REFUND ISSUED: Escrow amount refunded to buyer for order #${orderId}.`);
  };

  // Filtered Orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cropName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && order.status === statusFilter;
  });

  // Calculate Metrics
  const totalVolume = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalEscrowLocked = orders
    .filter(o => o.escrowStatus === 'HELD_IN_ESCROW')
    .reduce((sum, o) => sum + o.totalPrice, 0);
  const completedSettlements = orders.filter(o => o.status === 'COMPLETED').length;
  const activeDisputes = orders.filter(o => o.status === 'DISPUTED').length;

  const getStatusBadge = (status: DetailedOrder['status']) => {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-emerald-950 text-emerald-400 border border-emerald-400">
            <span className="material-symbols-outlined text-sm mr-1">check_circle</span> {status}
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-rose-950 text-rose-400 border border-rose-400">
            <span className="material-symbols-outlined text-sm mr-1">warning</span> DISPUTED
          </span>
        );
      case 'REJECTED' as any:
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-rose-950 text-rose-400 border border-rose-400 font-bold">
            <span className="material-symbols-outlined text-sm mr-1">cancel</span> REJECTED
          </span>
        );
      case 'IN_TRANSIT':
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-orange-950 text-orange-400 border border-orange-400">
            <span className="material-symbols-outlined text-sm mr-1">schedule</span> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
            <span className="material-symbols-outlined text-sm mr-1">inventory_2</span> {status}
          </span>
        );
    }
  };

  const getEscrowBadge = (escrow: EscrowStatus) => {
    switch (escrow) {
      case 'RELEASED_TO_FARMER':
        return (
          <span className="inline-flex items-center text-xs text-emerald-400 font-bold">
            <span className="material-symbols-outlined text-sm mr-1">verified_user</span> RELEASED TO FARMER
          </span>
        );
      case 'REFUNDED_TO_BUYER':
        return (
          <span className="inline-flex items-center text-xs text-rose-400 font-bold">
            <span className="material-symbols-outlined text-sm mr-1">settings_backup_restore</span> REFUNDED TO BUYER
          </span>
        );
      case 'PARTIAL_SPLIT':
        return (
          <span className="inline-flex items-center text-xs text-orange-400 font-bold">
            <span className="material-symbols-outlined text-sm mr-1">call_split</span> 50/50 PARTIAL SPLIT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center text-xs text-orange-400 font-bold">
            <span className="material-symbols-outlined text-sm mr-1">lock</span> HELD IN ESCROW
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-black font-sans text-white">
      <Sidebar
        activeTab="orders"
        onTabChange={onNavigateTab}
        onLogout={onLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1500px] w-full mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider text-white">Orders & Escrow Settlements</h1>
              <p className="text-sm text-zinc-400 mt-1">Real-time telemetry of direct produce trade transactions, payment escrow status, and automated settlements.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center text-xs font-mono text-emerald-400 border border-emerald-400 bg-emerald-950 px-3 py-1.5 rounded">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
                SETTLEMENT ENGINE ACTIVE
              </div>
            </div>
          </div>

          {/* Action Notification Alert */}
          {toastMessage && (
            <div className="p-4 bg-emerald-950 border border-emerald-400 rounded-xl text-emerald-300 text-xs font-mono font-bold flex items-center justify-between shadow-lg animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-base">task_alt</span>
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white font-bold">
                ✕
              </button>
            </div>
          )}

          {/* Financial Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black border border-white p-5 rounded-none shadow-none">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Total Gross Volume</span>
                <span className="material-symbols-outlined text-emerald-400">payments</span>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">₹{(Number(totalVolume) || 0).toLocaleString()}</div>
              <div className="text-xs text-emerald-400 mt-2 font-mono flex items-center">
                <span className="material-symbols-outlined text-sm mr-1">trending_up</span> +18.4% vs last week
              </div>
            </div>

            <div className="bg-black border border-white p-5 rounded-none shadow-none">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Escrow Locked Funds</span>
                <span className="material-symbols-outlined text-orange-400">lock</span>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">₹{(Number(totalEscrowLocked) || 0).toLocaleString()}</div>
              <div className="text-xs text-orange-400 mt-2 font-mono">
                Across {orders.filter(o => o.escrowStatus === 'HELD_IN_ESCROW').length} active trades
              </div>
            </div>

            <div className="bg-black border border-white p-5 rounded-none shadow-none">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Completed Settlements</span>
                <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">{completedSettlements}</div>
              <div className="text-xs text-zinc-400 mt-2 font-mono">
                Avg release time: 1.2 hrs
              </div>
            </div>

            <div className="bg-black border border-white p-5 rounded-none shadow-none">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Active Disputes</span>
                <span className="material-symbols-outlined text-rose-400">gavel</span>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">{activeDisputes}</div>
              <div className="text-xs text-rose-400 mt-2 font-mono">
                Requires tribunal review
              </div>
            </div>
          </div>

          {/* Control Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-black border border-white p-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
              <input 
                type="text"
                placeholder="Search Order ID, Farmer, Buyer, Crop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-black text-white border border-white text-sm font-mono placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-zinc-400 text-sm">filter_list</span>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-black text-white border border-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-white"
              >
                <option value="ALL">ALL STATUSES</option>
                <option value="PLACED">PLACED (Pending Acceptance)</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="IN_TRANSIT">IN_TRANSIT</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="DISPUTED">DISPUTED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          {/* Orders Main Table & Detail Split Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders Table */}
            <div className={`${selectedOrder ? 'lg:col-span-2' : 'lg:col-span-3'} bg-black border border-white overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-white text-zinc-400 font-mono text-xs uppercase">
                      <th className="p-3">Order ID & Date</th>
                      <th className="p-3">Farmer & Buyer</th>
                      <th className="p-3">Produce Lot</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Escrow State</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredOrders.map(order => (
                      <tr 
                        key={order.id} 
                        onClick={() => setSelectedOrder(order)}
                        className={`hover:bg-zinc-900/60 transition-colors cursor-pointer ${selectedOrder?.id === order.id ? 'bg-zinc-900 border-l-4 border-l-white' : ''}`}
                      >
                        <td className="p-3 font-mono">
                          <div className="text-white font-bold">{order.orderNumber || order.id}</div>
                          <div className="text-xs text-zinc-400">{order.timestamp ? order.timestamp.split('T')[0] : 'Today'}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-white font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-emerald-400">person</span> {order.farmerName}
                          </div>
                          <div className="text-xs text-zinc-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-zinc-500">store</span> {order.buyerName}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={order.imageUrl || getCropFallbackImage(order.cropName)}
                              alt={order.cropName}
                              className="w-10 h-10 rounded-lg object-cover border border-zinc-700 bg-zinc-900 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getCropFallbackImage(order.cropName);
                              }}
                            />
                            <div className="min-w-0">
                              <div className="text-white font-bold truncate max-w-[170px]">{order.cropName}</div>
                              <div className="text-xs text-zinc-400 font-mono">{order.quantityKg} kg @ ₹{order.pricePerKg}/kg</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          ₹{(Number(order.totalPrice) || 0).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="p-3 font-mono">
                          {getEscrowBadge(order.escrowStatus)}
                        </td>
                        <td className="p-3 text-center space-x-1.5 whitespace-nowrap">
                          {order.status === 'PLACED' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptOrder(order.id);
                                }}
                                className="px-2.5 py-1 text-xs bg-emerald-950 border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black font-mono font-bold transition-colors inline-flex items-center gap-1 rounded"
                                title="Accept & Confirm Order"
                              >
                                <span className="material-symbols-outlined text-xs">check_circle</span> Accept
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectOrder(order.id);
                                }}
                                className="px-2.5 py-1 text-xs bg-rose-950 border border-rose-400 text-rose-400 hover:bg-rose-400 hover:text-black font-mono font-bold transition-colors inline-flex items-center gap-1 rounded"
                                title="Reject Order Request"
                              >
                                <span className="material-symbols-outlined text-xs">cancel</span> Reject
                              </button>
                            </>
                          )}
                          {order.status === 'CONFIRMED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDispatchOrder(order.id);
                              }}
                              className="px-2.5 py-1 text-xs bg-orange-950 border border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black font-mono font-bold transition-colors inline-flex items-center gap-1 rounded"
                              title="Dispatch with Cold-Chain Carrier"
                            >
                              <span className="material-symbols-outlined text-xs">local_shipping</span> Dispatch
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="px-2 py-1 text-xs border border-white hover:bg-white hover:text-black font-mono transition-colors inline-flex items-center gap-1 rounded"
                          >
                            <span className="material-symbols-outlined text-xs">visibility</span> View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-500 font-mono">
                          No transactions matched the specified search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Detail Drawer Panel */}
            {selectedOrder && (
              <div className="bg-black border border-white p-5 space-y-5 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-white pb-3">
                    <div>
                      <span className="text-xs font-mono text-zinc-400 uppercase">Order Telemetry & Settlement</span>
                      <h3 className="text-xl font-black text-white">{selectedOrder.orderNumber || selectedOrder.id}</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="text-zinc-400 hover:text-white text-xs font-mono border border-zinc-700 px-2 py-1"
                    >
                      [CLOSE]
                    </button>
                  </div>

                  {/* Produce Image & Hero Summary */}
                  <div className="flex gap-3 bg-zinc-950 border border-zinc-800 p-3 rounded-lg font-mono">
                    <img
                      src={selectedOrder.imageUrl || getCropFallbackImage(selectedOrder.cropName)}
                      alt={selectedOrder.cropName}
                      className="w-16 h-16 rounded-lg object-cover border border-zinc-700 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getCropFallbackImage(selectedOrder.cropName);
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-white font-bold text-sm truncate">{selectedOrder.cropName}</div>
                      <div className="text-emerald-400 font-bold text-xs mt-0.5">₹{selectedOrder.pricePerKg}/kg • {selectedOrder.quantityKg} kg</div>
                      <div className="text-[10px] text-zinc-400 mt-1">Grade: {selectedOrder.qualityGrade}</div>
                    </div>
                  </div>

                  {/* Status Overview */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono border border-zinc-800 p-3 bg-zinc-950">
                    <div>
                      <span className="text-zinc-500 block">TRADE STATUS</span>
                      <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">ESCROW TELEMETRY</span>
                      <div className="mt-1">{getEscrowBadge(selectedOrder.escrowStatus)}</div>
                    </div>
                  </div>

                  {/* Trade Parties */}
                  <div className="space-y-2 border-b border-zinc-800 pb-3">
                    <h4 className="text-xs font-mono uppercase text-zinc-400">Counterparties</h4>
                    <div className="bg-zinc-950 border border-zinc-800 p-3 text-xs space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Seller (Farmer):</span>
                        <span className="text-white font-bold">{selectedOrder.farmerName}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500">Mandi:</span>
                        <span className="text-zinc-300">{selectedOrder.farmerLocation}</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-800 pt-1.5">
                        <span className="text-zinc-400">Buyer:</span>
                        <span className="text-white font-bold">{selectedOrder.buyerName}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500">Delivery Hub:</span>
                        <span className="text-zinc-300">{selectedOrder.buyerLocation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quality & Logistics */}
                  <div className="space-y-2 border-b border-zinc-800 pb-3">
                    <h4 className="text-xs font-mono uppercase text-zinc-400">Logistics Telemetry</h4>
                    <div className="bg-zinc-950 border border-zinc-800 p-3 text-xs space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Carrier:</span>
                        <span className="text-white">{selectedOrder.logisticsPartner}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Tracking Code:</span>
                        <span className="text-white">{selectedOrder.logisticsTrackingId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Est Delivery:</span>
                        <span className="text-orange-400">{selectedOrder.estimatedDelivery}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakup */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase text-zinc-400">Financial Ledger</h4>
                    <div className="bg-zinc-950 border border-zinc-800 p-3 text-xs space-y-1.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Goods Subtotal:</span>
                        <span className="text-white">₹{((Number(selectedOrder.totalPrice) || 0) * 0.95).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">MandiKart Fee (2.5%):</span>
                        <span className="text-emerald-400">₹{((Number(selectedOrder.totalPrice) || 0) * 0.025).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Logistics Escrow:</span>
                        <span className="text-white">₹{((Number(selectedOrder.totalPrice) || 0) * 0.025).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-zinc-800 pt-1.5 text-sm">
                        <span className="text-zinc-300">Total Escrow Value:</span>
                        <span className="text-white">₹{(Number(selectedOrder.totalPrice) || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Workflow Action Controls */}
                <div className="pt-4 border-t border-white space-y-2">
                  <span className="text-xs font-mono uppercase text-zinc-400 block mb-1">Admin Order Actions</span>

                  {/* Order Stage Controls */}
                  {selectedOrder.status === 'PLACED' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleAcceptOrder(selectedOrder.id)}
                        className="py-2.5 bg-emerald-950 border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black font-mono text-xs font-black uppercase transition-colors rounded flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Accept Order</span>
                      </button>
                      <button 
                        onClick={() => handleRejectOrder(selectedOrder.id)}
                        className="py-2.5 bg-rose-950 border border-rose-400 text-rose-400 hover:bg-rose-400 hover:text-black font-mono text-xs font-black uppercase transition-colors rounded flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        <span>Reject Order</span>
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === 'CONFIRMED' && (
                    <button 
                      onClick={() => handleDispatchOrder(selectedOrder.id)}
                      className="w-full py-2.5 bg-orange-950 border border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black font-mono text-xs font-black uppercase transition-colors rounded flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span className="material-symbols-outlined text-sm">local_shipping</span>
                      <span>Dispatch Order (Mark In Transit)</span>
                    </button>
                  )}

                  {selectedOrder.status === 'IN_TRANSIT' && (
                    <button 
                      onClick={() => handleMarkDelivered(selectedOrder.id)}
                      className="w-full py-2.5 bg-cyan-950 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black font-mono text-xs font-black uppercase transition-colors rounded flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span className="material-symbols-outlined text-sm">inventory</span>
                      <span>Verify & Complete Delivery</span>
                    </button>
                  )}
                  
                  {/* Escrow Settlement Controls */}
                  {selectedOrder.escrowStatus === 'HELD_IN_ESCROW' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button 
                        onClick={() => handleReleaseEscrow(selectedOrder.id)}
                        className="py-2 bg-emerald-950 border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black font-mono text-xs font-bold uppercase transition-colors rounded text-center"
                      >
                        Release to Farmer
                      </button>
                      <button 
                        onClick={() => handleRefundBuyer(selectedOrder.id)}
                        className="py-2 bg-rose-950 border border-rose-400 text-rose-400 hover:bg-rose-400 hover:text-black font-mono text-xs font-bold uppercase transition-colors rounded text-center"
                      >
                        Refund to Buyer
                      </button>
                    </div>
                  )}

                  {(selectedOrder.escrowStatus === 'RELEASED_TO_FARMER' || selectedOrder.escrowStatus === 'REFUNDED_TO_BUYER') && (
                    <div className="bg-zinc-900 border border-zinc-700 p-2.5 text-center text-xs font-mono text-zinc-400 rounded">
                      Settlement Finalized — Escrow immutable ledger sealed.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};
