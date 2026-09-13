import React from 'react';
import type { OrderSummary } from '../types/admin';

interface RecentOrdersTableProps {
  orders: OrderSummary[];
  onViewAllOrders?: () => void;
  onSelectOrder?: (order: OrderSummary) => void;
}

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({ orders, onViewAllOrders, onSelectOrder }) => {
  const getStatusBadge = (status: OrderSummary['status']) => {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED':
        // Green
        return 'bg-black text-emerald-400 border border-emerald-400';
      case 'IN_TRANSIT':
      case 'PICKUP_SCHEDULED':
      case 'CONFIRMED':
      case 'PLACED':
        // Orange
        return 'bg-black text-orange-400 border border-orange-400';
      case 'DISPUTED':
        // Red
        return 'bg-black text-rose-400 border border-rose-400';
      default:
        return 'bg-black text-white border border-white';
    }
  };

  return (
    <div className="bg-black rounded-xl border border-white shadow-md overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-white tracking-tight">Recent Orders & Settlements</h3>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Cross-entity order transactions synced via Fastify Order Engine
          </p>
        </div>
        <button
          onClick={onViewAllOrders}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-black hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors self-start sm:self-auto border border-white"
        >
          <span>View All Orders</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-white">
          <thead className="bg-black text-[11px] font-black text-white uppercase tracking-wider border-b border-white">
            <tr>
              <th scope="col" className="px-5 py-3">Order ID</th>
              <th scope="col" className="px-5 py-3">Farmer</th>
              <th scope="col" className="px-5 py-3">Buyer</th>
              <th scope="col" className="px-5 py-3">Produce & Qty</th>
              <th scope="col" className="px-5 py-3">Amount</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/30">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-900 transition-colors">
                <td className="px-5 py-3.5 font-mono font-black text-white">
                  {order.orderNumber}
                </td>
                <td className="px-5 py-3.5">
                  <div className="font-extrabold text-white">{order.farmerName}</div>
                  <div className="text-[11px] text-emerald-400 font-bold">Verified Seller</div>
                </td>
                <td className="px-5 py-3.5 font-bold text-slate-200">
                  {order.buyerName}
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-extrabold text-white block">{order.produceName}</span>
                  <span className="text-[11px] text-slate-300 font-mono block">{(Number(order.quantityKg) || 0).toLocaleString()} kg</span>
                </td>
                <td className="px-5 py-3.5 font-black text-white font-mono text-sm">
                  ₹{(Number(order.totalAmount) || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-extrabold ${getStatusBadge(
                      order.status
                    )}`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => onSelectOrder?.(order)}
                    className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};



