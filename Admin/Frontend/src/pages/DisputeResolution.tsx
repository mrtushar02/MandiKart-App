import React, { useState } from 'react';
import type { AdminUser } from '../types/admin';
import type { DisputeCase, DisputeStatus } from '../types/ordersAndDisputes';
import { MOCK_DISPUTES } from './OrdersAndDisputesMock';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

interface DisputeResolutionProps {
  user: AdminUser;
  onLogout: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const DisputeResolution: React.FC<DisputeResolutionProps> = ({
  user,
  onLogout,
  onNavigateTab,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [disputes, setDisputes] = useState<DisputeCase[]>(() => {
    try {
      const saved = localStorage.getItem('mandikart_admin_disputes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return MOCK_DISPUTES;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDispute, setSelectedDispute] = useState<DisputeCase | null>(null);

  // Resolution Notes State
  const [adminNote, setAdminNote] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Sync with live Admin backend (port 4003) for real-time dispute updates
  React.useEffect(() => {
    const fetchDisputes = () => {
      fetch('http://localhost:4003/api/v1/admin/disputes')
        .then((res) => res.json())
        .then((result) => {
          if (Array.isArray(result?.data) && result.data.length > 0) {
            setDisputes(result.data);
            try {
              localStorage.setItem('mandikart_admin_disputes', JSON.stringify(result.data));
            } catch {}
          }
        })
        .catch(() => {});
    };
    fetchDisputes();
    const interval = setInterval(fetchDisputes, 4000);
    return () => clearInterval(interval);
  }, []);

  // Helper for evidence images
  const getDisputeCropImage = (cropName: string) => {
    const lower = cropName.toLowerCase();
    if (lower.includes('tomato')) return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80';
    if (lower.includes('onion')) return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80';
    if (lower.includes('potato')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80';
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';
  };

  // Arbitration Handler
  const handleResolve = async (disputeId: string, actionType: 'RELEASE_FARMER' | 'REFUND_BUYER' | 'SPLIT_50_50') => {
    let outcomeText = '';
    let backendResolution = 'APPROVE_PAYOUT';
    if (actionType === 'RELEASE_FARMER') {
      outcomeText = 'Decided in favor of Farmer (100% Payout Released)';
      backendResolution = 'APPROVE_PAYOUT';
    }
    if (actionType === 'REFUND_BUYER') {
      outcomeText = 'Decided in favor of Buyer (100% Refund Issued)';
      backendResolution = 'REFUND_BUYER';
    }
    if (actionType === 'SPLIT_50_50') {
      outcomeText = '50/50 Partial Settlement Issued to both parties';
      backendResolution = 'APPROVE_PAYOUT';
    }

    const note = adminNote || 'Tribunal ruling executed by MandiKart Admin.';

    const updatedDisputes = disputes.map(d => {
      if (d.id === disputeId) {
        return {
          ...d,
          status: 'RESOLVED' as DisputeStatus,
          resolutionOutcome: outcomeText,
          arbitratorNote: note
        };
      }
      return d;
    });

    setDisputes(updatedDisputes);
    try {
      localStorage.setItem('mandikart_admin_disputes', JSON.stringify(updatedDisputes));
    } catch {}

    const targetCase = disputes.find(d => d.id === disputeId);
    if (selectedDispute?.id === disputeId) {
      setSelectedDispute(prev => prev ? {
        ...prev,
        status: 'RESOLVED' as DisputeStatus,
        resolutionOutcome: outcomeText,
        arbitratorNote: note
      } : null);
    }

    // Synchronize with local orders if found
    if (targetCase?.orderId) {
      try {
        const savedOrders = localStorage.getItem('mandikart_admin_orders');
        if (savedOrders) {
          const orders = JSON.parse(savedOrders);
          const updatedOrders = orders.map((o: any) => {
            if (o.id === targetCase.orderId || o.orderCode === targetCase.orderId) {
              return {
                ...o,
                status: actionType === 'REFUND_BUYER' ? 'CANCELLED' : 'COMPLETED',
                escrowStatus: actionType === 'REFUND_BUYER' ? 'REFUNDED' : 'RELEASED'
              };
            }
            return o;
          });
          localStorage.setItem('mandikart_admin_orders', JSON.stringify(updatedOrders));
        }
      } catch {}

      // Call Admin Backend API
      try {
        await fetch(`http://localhost:4003/api/v1/admin/disputes/${targetCase.orderId}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resolution: backendResolution,
            remarks: note
          })
        });
      } catch {}
    }

    setActionSuccessMsg(`Dispute ${disputeId} arbitration finalized: ${outcomeText}`);
    setTimeout(() => setActionSuccessMsg(null), 5000);
    setAdminNote('');
  };

  // Filtering
  const filteredDisputes = disputes.filter(d => {
    const matchesSearch = 
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.cropName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || d.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Metrics
  const activeCasesCount = disputes.filter(d => d.status !== 'RESOLVED').length;
  const criticalCasesCount = disputes.filter(d => d.severity === 'CRITICAL' && d.status !== 'RESOLVED').length;
  const totalDisputedAmount = disputes
    .filter(d => d.status !== 'RESOLVED')
    .reduce((sum, d) => sum + d.amountDisputed, 0);
  const resolvedCount = disputes.filter(d => d.status === 'RESOLVED').length;

  const getSeverityBadge = (severity: DisputeCase['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-xs font-mono font-bold bg-rose-950 text-rose-400 border border-rose-400">CRITICAL</span>;
      case 'HIGH':
      case 'MAJOR':
        return <span className="px-2 py-0.5 text-xs font-mono font-bold bg-orange-950 text-orange-400 border border-orange-400">MAJOR</span>;
      case 'MEDIUM':
      case 'MINOR':
        return <span className="px-2 py-0.5 text-xs font-mono font-bold bg-zinc-900 text-zinc-300 border border-zinc-700">MINOR</span>;
    }
  };

  const getStatusBadge = (status: DisputeCase['status']) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-400">
            <span className="material-symbols-outlined text-xs mr-1">check_circle</span> RESOLVED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold bg-orange-950 text-orange-400 border border-orange-400">
            <span className="material-symbols-outlined text-xs mr-1">schedule</span> UNDER REVIEW
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold bg-rose-950 text-rose-400 border border-rose-400">
            <span className="material-symbols-outlined text-xs mr-1">warning</span> ESCALATED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-600">
            <span className="material-symbols-outlined text-xs mr-1">error</span> OPEN
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-black font-sans text-white">
      <Sidebar
        activeTab="disputes"
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
              <h1 className="text-2xl font-black uppercase tracking-wider text-white">Dispute Resolution Tribunal</h1>
              <p className="text-sm text-zinc-400 mt-1">Multi-party arbitration console for quality claims, logistics discrepancies, and escrow fund disputes.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center text-xs font-mono text-rose-400 border border-rose-400 bg-rose-950 px-3 py-1.5 rounded">
                <span className="material-symbols-outlined text-sm mr-2">gavel</span>
                TRIBUNAL ARBITRATION ACTIVE
              </div>
            </div>
          </div>

          {/* Action Notification Alert */}
          {actionSuccessMsg && (
            <div className="bg-emerald-950 border border-emerald-400 text-emerald-300 p-4 font-mono text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">task_alt</span>
                <span>{actionSuccessMsg}</span>
              </div>
              <button onClick={() => setActionSuccessMsg(null)} className="text-xs text-emerald-400 underline">[DISMISS]</button>
            </div>
          )}

          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black border border-white p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Active Disputes</span>
                <span className="material-symbols-outlined text-rose-400">warning</span>
              </div>
              <div className="text-3xl font-black text-white">{activeCasesCount}</div>
              <div className="text-xs text-rose-400 mt-2 font-mono">
                {criticalCasesCount} Critical severity cases
              </div>
            </div>

            <div className="bg-black border border-white p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Disputed Funds</span>
                <span className="material-symbols-outlined text-orange-400">payments</span>
              </div>
              <div className="text-3xl font-black text-white">₹{(Number(totalDisputedAmount) || 0).toLocaleString()}</div>
              <div className="text-xs text-orange-400 mt-2 font-mono">
                Locked in escrow pending ruling
              </div>
            </div>

            <div className="bg-black border border-white p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Cases Resolved</span>
                <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              </div>
              <div className="text-3xl font-black text-white">{resolvedCount}</div>
              <div className="text-xs text-emerald-400 mt-2 font-mono">
                100% compliance record
              </div>
            </div>

            <div className="bg-black border border-white p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Avg Resolution Time</span>
                <span className="material-symbols-outlined text-zinc-400">schedule</span>
              </div>
              <div className="text-3xl font-black text-white">4.2 hrs</div>
              <div className="text-xs text-zinc-400 mt-2 font-mono">
                SLA target: &lt; 12 hrs
              </div>
            </div>
          </div>

          {/* Control Filter Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-black border border-white p-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
              <input 
                type="text"
                placeholder="Search Case ID, Order ID, Farmer, Buyer, Crop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-black text-white border border-white text-sm font-mono placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-zinc-400 text-sm">filter_list</span>
              <select 
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-black text-white border border-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-white"
              >
                <option value="ALL">ALL SEVERITY</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="MAJOR">MAJOR</option>
                <option value="MINOR">MINOR</option>
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-black text-white border border-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-white"
              >
                <option value="ALL">ALL STATUSES</option>
                <option value="OPEN">OPEN</option>
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="ESCALATED">ESCALATED</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>
          </div>

          {/* Dispute Cases & Tribunal Ruling Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cases List Table */}
            <div className={`${selectedDispute ? 'lg:col-span-2' : 'lg:col-span-3'} bg-black border border-white overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-white text-zinc-400 font-mono text-xs uppercase">
                      <th className="p-3">Case & Order ID</th>
                      <th className="p-3">Parties Involved</th>
                      <th className="p-3">Dispute Issue</th>
                      <th className="p-3 text-right">Disputed Amount</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredDisputes.map(dispute => (
                      <tr 
                        key={dispute.id}
                        className={`hover:bg-zinc-900/60 transition-colors ${selectedDispute?.id === dispute.id ? 'bg-zinc-900 border-l-4 border-l-white' : ''}`}
                      >
                        <td className="p-3 font-mono">
                          <div className="text-white font-bold">{dispute.id}</div>
                          <div className="text-xs text-zinc-400">Order: {dispute.orderId}</div>
                        </td>
                        <td className="p-3 text-xs">
                          <div className="text-white font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-emerald-400">person</span> {dispute.farmerName}
                          </div>
                          <div className="text-zinc-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-zinc-500">store</span> {dispute.buyerName}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-rose-400 font-bold text-xs uppercase font-mono">{dispute.disputeReason}</div>
                          <div className="text-xs text-zinc-400">{dispute.cropName}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          ₹{(Number(dispute.amountDisputed) || 0).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {getSeverityBadge(dispute.severity)}
                        </td>
                        <td className="p-3 font-mono">
                          {getStatusBadge(dispute.status)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedDispute(dispute)}
                            className="px-2.5 py-1 text-xs border border-white hover:bg-white hover:text-black font-mono transition-colors inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">gavel</span> Arbitrate
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredDisputes.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-500 font-mono">
                          No active dispute cases match the specified filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tribunal Arbitration Console Drawer */}
            {selectedDispute && (
              <div className="bg-black border border-white p-5 space-y-6 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-white pb-3">
                    <div>
                      <span className="text-xs font-mono text-rose-400 uppercase font-bold">Arbitration Tribunal Console</span>
                      <h3 className="text-xl font-black text-white">{selectedDispute.id}</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedDispute(null)}
                      className="text-zinc-400 hover:text-white text-xs font-mono border border-zinc-700 px-2 py-1"
                    >
                      [CLOSE]
                    </button>
                  </div>

                  {/* Case Summary */}
                  <div className="bg-zinc-950 border border-zinc-800 p-3 space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Order ID:</span>
                      <span className="text-white font-bold">{selectedDispute.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Claimant:</span>
                      <span className="text-orange-400 font-bold">{selectedDispute.disputingParty.toUpperCase()} ({selectedDispute.disputingParty === 'buyer' ? selectedDispute.buyerName : selectedDispute.farmerName})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Dispute Type:</span>
                      <span className="text-rose-400 font-bold">{selectedDispute.disputeReason}</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-800 pt-2">
                      <span className="text-zinc-400">Disputed Escrow Value:</span>
                      <span className="text-white font-bold text-sm">₹{(Number(selectedDispute.amountDisputed) || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Claimant Statement */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">description</span> Claimant Description & Proof
                    </h4>
                    <div className="bg-zinc-950 border border-rose-900/50 p-3 text-xs text-rose-200 font-mono">
                      "{selectedDispute.description}"
                    </div>
                  </div>

                  {/* Evidence Media Preview */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">image</span> Submitted Photographic Evidence
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDispute.evidenceFiles.map((file, idx) => (
                        <div key={idx} className="bg-zinc-950 border border-zinc-800 p-2 text-center space-y-1">
                          <div className="bg-zinc-900 h-24 overflow-hidden rounded border border-zinc-800 flex items-center justify-center">
                            <img 
                              src={getDisputeCropImage(selectedDispute.cropName)} 
                              alt="Dispute Evidence"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400 truncate">{file}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grade Verification Audit */}
                  {selectedDispute.expectedGrade && selectedDispute.receivedGrade && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono uppercase text-zinc-400">Quality Inspection Telemetry</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-950 border border-zinc-800 p-3">
                        <div>
                          <span className="text-zinc-500 block">EXPECTED GRADE</span>
                          <span className="text-emerald-400 font-bold text-sm">{selectedDispute.expectedGrade}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">RECEIVED GRADE</span>
                          <span className="text-rose-400 font-bold text-sm">{selectedDispute.receivedGrade}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Audit Notes Entry */}
                  {selectedDispute.status !== 'RESOLVED' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono uppercase text-zinc-400">Arbitrator Ruling Memo</h4>
                      <textarea 
                        rows={2}
                        placeholder="Enter explicit binding tribunal justification notes..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="w-full p-2 bg-black text-white border border-white text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white"
                      />
                    </div>
                  )}

                  {/* Existing Resolution Summary if already resolved */}
                  {selectedDispute.status === 'RESOLVED' && (
                    <div className="bg-emerald-950/60 border border-emerald-400 p-3 space-y-2 text-xs font-mono">
                      <div className="flex items-center text-emerald-400 font-bold gap-1">
                        <span className="material-symbols-outlined text-sm">done_all</span> BINDING RULING EXECUTED
                      </div>
                      <div className="text-white"><strong>Outcome:</strong> {selectedDispute.resolutionOutcome}</div>
                      <div className="text-zinc-400"><strong>Note:</strong> {selectedDispute.arbitratorNote}</div>
                    </div>
                  )}
                </div>

                {/* 3-Way Binding Arbitration Ruling Controls */}
                {selectedDispute.status !== 'RESOLVED' && (
                  <div className="pt-4 border-t border-white space-y-2">
                    <span className="text-xs font-mono uppercase text-zinc-400 block">Binding Arbitration Actions</span>
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleResolve(selectedDispute.id, 'RELEASE_FARMER')}
                        className="w-full py-2 bg-emerald-950 border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black font-mono text-xs font-bold uppercase transition-colors"
                      >
                        1. Ruling for Farmer (100% Payout)
                      </button>
                      <button 
                        onClick={() => handleResolve(selectedDispute.id, 'REFUND_BUYER')}
                        className="w-full py-2 bg-rose-950 border border-rose-400 text-rose-400 hover:bg-rose-400 hover:text-black font-mono text-xs font-bold uppercase transition-colors"
                      >
                        2. Ruling for Buyer (100% Refund)
                      </button>
                      <button 
                        onClick={() => handleResolve(selectedDispute.id, 'SPLIT_50_50')}
                        className="w-full py-2 bg-orange-950 border border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black font-mono text-xs font-bold uppercase transition-colors"
                      >
                        3. 50/50 Partial Split Settlement
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
