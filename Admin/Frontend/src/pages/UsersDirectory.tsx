import React, { useState, useEffect } from 'react';
import type { AdminUser } from '../types/admin';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export interface BuyerUserData {
  id: string;
  userCode: string;
  fullName: string;
  phone: string;
  email: string;
  buyerType: 'RETAIL' | 'BULK';
  companyName: string | null;
  gstin: string | null;
  city: string;
  state: string;
  location: string;
  isVerified: boolean;
  verificationStatus: 'VERIFIED' | 'PENDING';
  totalOrders: number;
  totalSpend: number;
  joinedDate: string;
  createdAt: string;
}

interface UsersDirectoryProps {
  user: AdminUser;
  onLogout: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const UsersDirectory: React.FC<UsersDirectoryProps> = ({
  user,
  onLogout,
  onNavigateTab,
}) => {
  const [users, setUsers] = useState<BuyerUserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RETAIL' | 'BULK' | 'VERIFIED'>('ALL');
  const [selectedUser, setSelectedUser] = useState<BuyerUserData | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fetchUsers = (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    fetch('http://localhost:4003/api/v1/admin/users')
      .then((res) => res.json())
      .then((resData) => {
        if (Array.isArray(resData?.data)) {
          setUsers(resData.data);
        }
      })
      .catch((err) => console.error('Failed to fetch users:', err))
      .finally(() => {
        if (showSpinner) {
          setTimeout(() => setIsLoading(false), 400);
        }
      });
  };

  useEffect(() => {
    fetchUsers(true);
    const interval = setInterval(() => {
      fetchUsers(false);
    }, 4000); // 4-second auto-refresh

    return () => clearInterval(interval);
  }, []);

  // Filter and search
  const filteredUsers = users.filter((u) => {
    if (filterType === 'RETAIL' && u.buyerType !== 'RETAIL') return false;
    if (filterType === 'BULK' && u.buyerType !== 'BULK') return false;
    if (filterType === 'VERIFIED' && !u.isVerified) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.userCode || '').toLowerCase().includes(q) ||
      (u.companyName || '').toLowerCase().includes(q) ||
      (u.city || '').toLowerCase().includes(q) ||
      (u.state || '').toLowerCase().includes(q)
    );
  });

  const totalBuyers = users.length;
  const retailBuyersCount = users.filter((u) => u.buyerType === 'RETAIL').length;
  const bulkBuyersCount = users.filter((u) => u.buyerType === 'BULK').length;
  const verifiedCount = users.filter((u) => u.isVerified).length;
  const totalPlatformSpend = users.reduce((sum, u) => sum + (u.totalSpend || 0), 0);

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      <Sidebar
        activeTab="users"
        onTabChange={(tabId) => onNavigateTab(tabId)}
        onLogout={onLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onLogout={onLogout}
          onNavigateTab={onNavigateTab}
          onRefresh={() => fetchUsers(true)}
          isRefreshing={isLoading}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1500px] w-full mx-auto overflow-y-auto">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Users & Buyers Directory
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-400">
                  Real Database ({users.length})
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Authentic buyer registry, trade history, verification records, and volume procurement details.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => fetchUsers(true)}
                disabled={isLoading}
                className="px-3.5 py-1.5 bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-400 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh real-time buyer data"
              >
                <span className={`material-symbols-outlined text-sm ${isLoading ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`}>
                  sync
                </span>
                <span>Refresh Live</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-black border border-white rounded-xl p-3.5 space-y-1">
              <p className="text-[11px] font-mono text-zinc-400">Total Registered</p>
              <p className="text-xl font-black text-white">{totalBuyers}</p>
              <p className="text-[10px] text-zinc-500 font-mono">Live in Supabase</p>
            </div>

            <div className="bg-black border border-white rounded-xl p-3.5 space-y-1">
              <p className="text-[11px] font-mono text-zinc-400">Retail Consumers</p>
              <p className="text-xl font-black text-emerald-400">{retailBuyersCount}</p>
              <p className="text-[10px] text-zinc-500 font-mono">Direct mandi delivery</p>
            </div>

            <div className="bg-black border border-white rounded-xl p-3.5 space-y-1">
              <p className="text-[11px] font-mono text-zinc-400">Bulk & Institutional</p>
              <p className="text-xl font-black text-blue-400">{bulkBuyersCount}</p>
              <p className="text-[10px] text-zinc-500 font-mono">Processors & Retailers</p>
            </div>

            <div className="bg-black border border-white rounded-xl p-3.5 space-y-1">
              <p className="text-[11px] font-mono text-zinc-400">Verified Buyers</p>
              <p className="text-xl font-black text-amber-400">{verifiedCount}</p>
              <p className="text-[10px] text-zinc-500 font-mono">Phone / KYC verified</p>
            </div>

            <div className="bg-black border border-white rounded-xl p-3.5 space-y-1">
              <p className="text-[11px] font-mono text-zinc-400">Buyer Order Value</p>
              <p className="text-xl font-black text-white">₹{(Number(totalPlatformSpend) || 0).toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-emerald-400 font-mono">Settled trades</p>
            </div>
          </div>

          {/* Controls: Search & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-500 text-sm">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone, email, city, company, or ID..."
                className="w-full bg-black border border-zinc-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-zinc-500 hover:text-white"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  filterType === 'ALL'
                    ? 'bg-white text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                All ({users.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterType('RETAIL')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  filterType === 'RETAIL'
                    ? 'bg-emerald-500 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Retail ({retailBuyersCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterType('BULK')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  filterType === 'BULK'
                    ? 'bg-blue-500 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Bulk / B2B ({bulkBuyersCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterType('VERIFIED')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                  filterType === 'VERIFIED'
                    ? 'bg-amber-400 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Verified ({verifiedCount})
              </button>
            </div>
          </div>

          {/* Buyers Directory List */}
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl space-y-2">
              <span className="material-symbols-outlined text-zinc-600 text-4xl">group_off</span>
              <p className="text-sm font-bold text-zinc-400">No users found matching your criteria</p>
              <p className="text-xs text-zinc-600">Try clearing your search query or switching tabs.</p>
            </div>
          ) : (
            <div className="bg-black border border-white rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Business / GSTIN</th>
                      <th className="py-3 px-4">Orders</th>
                      <th className="py-3 px-4">Total Spend</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {filteredUsers.map((u) => {
                      const isBulk = u.buyerType === 'BULK';
                      return (
                        <tr key={u.id} className="hover:bg-zinc-950/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-200 shrink-0">
                                {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <span className="font-bold text-white block text-sm font-sans">
                                  {u.fullName || 'Registered User'}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono">{u.userCode}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isBulk
                                  ? 'bg-blue-950 text-blue-400 border border-blue-500/50'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                              }`}
                            >
                              {isBulk ? 'BULK / B2B' : 'RETAIL'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div>
                              <span className="text-zinc-200 block">{u.phone || '—'}</span>
                              <span className="text-[10px] text-zinc-500">{u.email}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-zinc-300">
                            {u.city ? `${u.city}, ${u.state}` : 'Pune, Maharashtra'}
                          </td>

                          <td className="py-3 px-4">
                            {u.companyName ? (
                              <div>
                                <span className="font-bold text-white block truncate max-w-[140px]">
                                  {u.companyName}
                                </span>
                                {u.gstin && (
                                  <span className="text-[10px] text-zinc-400 block font-mono">
                                    GSTIN: {u.gstin}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-600 font-sans italic">Direct Household</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-white">{u.totalOrders || 0}</span> orders
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-emerald-400">
                              ₹{Number(u.totalSpend || 0).toLocaleString('en-IN')}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                u.isVerified
                                  ? 'bg-emerald-950 text-emerald-400 border-emerald-500'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              {u.isVerified ? 'VERIFIED' : 'PENDING'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 border border-zinc-700 rounded text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-black border border-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-bold text-emerald-400 text-base">
                  {selectedUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{selectedUser.fullName}</h3>
                  <p className="text-xs text-zinc-400 font-mono">{selectedUser.userCode} • {selectedUser.buyerType}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-1">
                <p className="text-zinc-500 text-[10px]">PHONE NUMBER</p>
                <p className="text-white font-bold">{selectedUser.phone || 'Not provided'}</p>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-1">
                <p className="text-zinc-500 text-[10px]">EMAIL ADDRESS</p>
                <p className="text-white font-bold truncate">{selectedUser.email || 'buyer@mandikart.in'}</p>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-1">
                <p className="text-zinc-500 text-[10px]">LOCATION</p>
                <p className="text-white font-bold">{selectedUser.city}, {selectedUser.state}</p>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-1">
                <p className="text-zinc-500 text-[10px]">JOINED DATE</p>
                <p className="text-white font-bold">{selectedUser.joinedDate}</p>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-1">
                <p className="text-zinc-500 text-[10px]">TOTAL ORDERS</p>
                <p className="text-emerald-400 font-black text-base">{selectedUser.totalOrders}</p>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-1">
                <p className="text-zinc-500 text-[10px]">TOTAL EXPENDITURE</p>
                <p className="text-emerald-400 font-black text-base">₹{(Number(selectedUser.totalSpend) || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {selectedUser.companyName && (
              <div className="bg-blue-950/20 border border-blue-500/40 p-3 rounded-lg text-xs space-y-1 font-mono">
                <p className="text-blue-400 font-bold">🏢 Institutional Business Profile</p>
                <p className="text-white">Entity: <strong>{selectedUser.companyName}</strong></p>
                {selectedUser.gstin && <p className="text-zinc-300">GSTIN: <strong>{selectedUser.gstin}</strong></p>}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-white text-black font-bold text-xs rounded-lg hover:bg-zinc-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
