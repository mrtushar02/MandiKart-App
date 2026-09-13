import React, { useState } from 'react';
import type { AdminUser } from '../types/admin';
import type { LogisticsShipment, ShipmentStatus } from '../types/logisticsAndAi';
import { MOCK_SHIPMENTS, MOCK_CARRIERS } from './LogisticsAndAiMock';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

interface LogisticsOverviewProps {
  user: AdminUser;
  onLogout: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const LogisticsOverview: React.FC<LogisticsOverviewProps> = ({
  user,
  onLogout,
  onNavigateTab,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [shipments, setShipments] = useState<LogisticsShipment[]>(() => {
    try {
      const saved = localStorage.getItem('mandikart_admin_shipments');
      if (saved) return JSON.parse(saved);
    } catch {}
    return MOCK_SHIPMENTS;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedShipment, setSelectedShipment] = useState<LogisticsShipment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Sync with live Admin backend (port 4003) for real-time shipment updates
  React.useEffect(() => {
    const fetchShipments = () => {
      fetch('http://localhost:4003/api/v1/admin/shipments')
        .then((res) => res.json())
        .then((result) => {
          if (Array.isArray(result?.data) && result.data.length > 0) {
            setShipments(result.data);
            try {
              localStorage.setItem('mandikart_admin_shipments', JSON.stringify(result.data));
            } catch {}
          }
        })
        .catch(() => {});
    };
    fetchShipments();
    const interval = setInterval(fetchShipments, 4000);
    return () => clearInterval(interval);
  }, []);

  const syncShipments = (updated: LogisticsShipment[]) => {
    setShipments(updated);
    try {
      localStorage.setItem('mandikart_admin_shipments', JSON.stringify(updated));
    } catch {}
  };

  const handlePingDriver = (shipment: LogisticsShipment) => {
    showToast(`SMS & GPS Ping transmitted to ${shipment.driverName} (${shipment.driverPhone}). Handset ACK received (Latency: 34ms).`);
  };

  const handleDispatchMaintenance = (shipmentId: string) => {
    const updated = shipments.map(s => {
      if (s.id === shipmentId) {
        return {
          ...s,
          status: 'IN_TRANSIT' as ShipmentStatus,
          currentTempCelsius: s.targetTempCelsius + 0.5,
        };
      }
      return s;
    });
    syncShipments(updated);
    if (selectedShipment?.id === shipmentId) {
      setSelectedShipment(prev => prev ? {
        ...prev,
        status: 'IN_TRANSIT' as ShipmentStatus,
        currentTempCelsius: prev.targetTempCelsius + 0.5,
      } : null);
    }
    showToast(`Emergency Maintenance Unit dispatched to reefer truck #${shipmentId}. Reefer chilling restored to normal.`);
  };

  const handleForceTelemetryRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const updated = shipments.map(s => ({
        ...s,
        batteryLevelPct: Math.max(20, s.batteryLevelPct - 1),
        gpsCoordinates: {
          lat: Number((s.gpsCoordinates.lat + (Math.random() - 0.5) * 0.01).toFixed(4)),
          lng: Number((s.gpsCoordinates.lng + (Math.random() - 0.5) * 0.01).toFixed(4)),
        }
      }));
      syncShipments(updated);
      if (selectedShipment) {
        const found = updated.find(s => s.id === selectedShipment.id);
        if (found) setSelectedShipment(found);
      }
      showToast('IoT Gateway Telemetry refreshed across all 6 active carrier corridors.');
    }, 700);
  };

  // Filtering
  const filteredShipments = shipments.filter(s => {
    const matchesSearch = 
      s.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.carrierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.produceName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDest = (hub: any): string => {
    if (!hub) return 'Central Hub, Mumbai';
    if (typeof hub === 'string') return hub;
    if (typeof hub === 'object') {
      return [hub.line1, hub.city, hub.state, hub.pincode].filter(Boolean).join(', ') || hub.city || 'Central Distribution Hub';
    }
    return String(hub);
  };

  // Metrics
  const activeTransits = shipments.filter(s => s.status === 'IN_TRANSIT' || s.status === 'LOADING').length;
  const reeferActive = shipments.filter(s => s.isReefer).length;
  const tempAlertsCount = shipments.filter(s => s.status === 'TEMP_ALERT').length;
  const deliveredCount = shipments.filter(s => s.status === 'DELIVERED').length;

  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-400">
            <span className="material-symbols-outlined text-xs mr-1">check_circle</span> DELIVERED
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-bold bg-orange-950 text-orange-400 border border-orange-400">
            <span className="material-symbols-outlined text-xs mr-1">local_shipping</span> IN TRANSIT
          </span>
        );
      case 'LOADING':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-bold bg-zinc-900 text-zinc-300 border border-zinc-700">
            <span className="material-symbols-outlined text-xs mr-1">inventory</span> LOADING
          </span>
        );
      case 'TEMP_ALERT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-bold bg-rose-950 text-rose-400 border border-rose-400 animate-pulse">
            <span className="material-symbols-outlined text-xs mr-1">thermostat</span> TEMP ALERT
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-600">
            <span className="material-symbols-outlined text-xs mr-1">schedule</span> DELAYED
          </span>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-black font-sans text-white">
      <Sidebar
        activeTab="logistics"
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
              <h1 className="text-2xl font-black uppercase tracking-wider text-white">Cold-Chain Logistics & Telemetry</h1>
              <p className="text-sm text-zinc-400 mt-1">Real-time GPS tracking, Reefer cold-storage temperature sensors, and carrier fleet telemetry.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleForceTelemetryRefresh}
                disabled={isRefreshing}
                className="px-3 py-1.5 border border-white hover:bg-white hover:text-black font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1.5"
              >
                <span className={`material-symbols-outlined text-sm ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
                {isRefreshing ? 'Refreshing...' : 'Refresh Telemetry'}
              </button>
              <div className="flex items-center text-xs font-mono text-emerald-400 border border-emerald-400 bg-emerald-950 px-3 py-1.5 rounded">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
                IOT REEFER GATEWAY ACTIVE
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-3.5 bg-black border border-emerald-400 text-emerald-400 text-xs font-mono flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">satellite_alt</span>
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white font-bold">✕</button>
            </div>
          )}

          {/* Fleet Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black border border-white p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Active Transits</span>
                <span className="material-symbols-outlined text-orange-400">local_shipping</span>
              </div>
              <div className="text-3xl font-black text-white">{activeTransits}</div>
              <div className="text-xs text-orange-400 mt-2 font-mono">
                En route across Mandi corridors
              </div>
            </div>

            <div className="bg-black border border-white p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Reefer Cold-Chain</span>
                <span className="material-symbols-outlined text-emerald-400">ac_unit</span>
              </div>
              <div className="text-3xl font-black text-white">{reeferActive}</div>
              <div className="text-xs text-emerald-400 mt-2 font-mono">
                Temperature sensors operational
              </div>
            </div>

            <div className="bg-black border border-white p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Temp Spikes / Alerts</span>
                <span className="material-symbols-outlined text-rose-400">thermostat</span>
              </div>
              <div className="text-3xl font-black text-white">{tempAlertsCount}</div>
              <div className="text-xs text-rose-400 mt-2 font-mono">
                {tempAlertsCount > 0 ? 'Urgent reroute advised' : 'All reefers nominal'}
              </div>
            </div>

            <div className="bg-black border border-white p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Delivered Today</span>
                <span className="material-symbols-outlined text-emerald-400">task_alt</span>
              </div>
              <div className="text-3xl font-black text-white">{deliveredCount}</div>
              <div className="text-xs text-emerald-400 mt-2 font-mono">
                On-time compliance: 96.8%
              </div>
            </div>
          </div>

          {/* Control Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-black border border-white p-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
              <input 
                type="text"
                placeholder="Search Vehicle #, Tracking Code, Driver, Mandi, Carrier..."
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
                <option value="IN_TRANSIT">IN TRANSIT</option>
                <option value="LOADING">LOADING</option>
                <option value="TEMP_ALERT">TEMP ALERT</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </div>
          </div>

          {/* Shipments Table & Detail Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table */}
            <div className={`${selectedShipment ? 'lg:col-span-2' : 'lg:col-span-3'} bg-black border border-white overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-white text-zinc-400 font-mono text-xs uppercase">
                      <th className="p-3">Vehicle & Carrier</th>
                      <th className="p-3">Driver Info</th>
                      <th className="p-3">Route Corridor</th>
                      <th className="p-3">Cargo Produce</th>
                      <th className="p-3">Sensor Temp</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredShipments.map((shipment, sIdx) => {
                      const tempDiff = Math.abs(shipment.currentTempCelsius - shipment.targetTempCelsius);
                      const isTempWarning = tempDiff > 2.0;

                      return (
                        <tr 
                          key={`${shipment.id}-${sIdx}`}
                          className={`hover:bg-zinc-900/60 transition-colors ${selectedShipment?.id === shipment.id ? 'bg-zinc-900 border-l-4 border-l-white' : ''}`}
                        >
                          <td className="p-3 font-mono">
                            <div className="text-white font-bold">{shipment.vehicleNumber}</div>
                            <div className="text-xs text-zinc-400">{shipment.carrierName}</div>
                          </td>
                          <td className="p-3 text-xs">
                            <div className="text-white font-bold">{shipment.driverName}</div>
                            <div className="text-zinc-400 font-mono">{shipment.driverPhone}</div>
                          </td>
                          <td className="p-3 text-xs">
                            <div className="text-emerald-400 font-bold">{shipment.originMandi}</div>
                            <div className="text-zinc-400">→ {formatDest(shipment.destinationHub)}</div>
                          </td>
                          <td className="p-3 text-xs">
                            <div className="text-white font-medium">{shipment.produceName}</div>
                            <div className="text-zinc-400 font-mono">{shipment.quantityKg} kg</div>
                          </td>
                          <td className="p-3 font-mono text-xs">
                            <div className={`font-bold ${isTempWarning ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {shipment.currentTempCelsius}°C <span className="text-zinc-500 font-normal">(Target: {shipment.targetTempCelsius}°C)</span>
                            </div>
                            <div className="text-[10px] text-zinc-400">Battery: {shipment.batteryLevelPct}%</div>
                          </td>
                          <td className="p-3">
                            {getStatusBadge(shipment.status)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setSelectedShipment(shipment)}
                              className="px-2.5 py-1 text-xs border border-white hover:bg-white hover:text-black font-mono transition-colors inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">sensors</span> Telemetry
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredShipments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-zinc-500 font-mono">
                          No shipments found matching the criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shipment Telemetry Drawer */}
            {selectedShipment && (
              <div className="bg-black border border-white p-5 space-y-6 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-white pb-3">
                    <div>
                      <span className="text-xs font-mono text-zinc-400 uppercase">Reefer IoT Sensor Telemetry</span>
                      <h3 className="text-xl font-black text-white">{selectedShipment.vehicleNumber}</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedShipment(null)}
                      className="text-zinc-400 hover:text-white text-xs font-mono border border-zinc-700 px-2 py-1"
                    >
                      [CLOSE]
                    </button>
                  </div>

                  {/* Status Card */}
                  <div className="bg-zinc-950 border border-zinc-800 p-3 space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Tracking Code:</span>
                      <span className="text-white font-bold">{selectedShipment.trackingId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Status:</span>
                      <div>{getStatusBadge(selectedShipment.status)}</div>
                    </div>
                  </div>

                  {/* Temperature Sensor Telemetry */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-cyan-400">ac_unit</span> Cold-Storage Sensor Gauge
                    </h4>
                    <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-3 font-mono">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Current Temp:</span>
                        <span className={`font-bold text-base ${selectedShipment.currentTempCelsius > selectedShipment.targetTempCelsius + 2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {selectedShipment.currentTempCelsius}°C
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-700">
                        <div 
                          className={`h-full ${selectedShipment.currentTempCelsius > selectedShipment.targetTempCelsius + 2 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                          style={{ width: `${Math.min(100, (selectedShipment.currentTempCelsius / 30) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>Target: {selectedShipment.targetTempCelsius}°C</span>
                        <span>IoT Battery: {selectedShipment.batteryLevelPct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Route Details */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase text-zinc-400">Route & Driver Telemetry</h4>
                    <div className="bg-zinc-950 border border-zinc-800 p-3 text-xs space-y-2 font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Carrier:</span>
                        <span className="text-white font-bold">{selectedShipment.carrierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Driver:</span>
                        <span className="text-white">{selectedShipment.driverName} ({selectedShipment.driverPhone})</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-800 pt-2">
                        <span className="text-zinc-400">Origin:</span>
                        <span className="text-emerald-400">{selectedShipment.originMandi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Destination:</span>
                        <span className="text-white">{formatDest(selectedShipment.destinationHub)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Est Arrival:</span>
                        <span className="text-orange-400 font-bold">{selectedShipment.estimatedArrival}</span>
                      </div>
                    </div>
                  </div>

                  {/* Simulated GPS Coordinate Map Card */}
                  <div className="bg-zinc-950 border border-zinc-800 p-3 font-mono text-xs space-y-1">
                    <div className="text-zinc-400">GPS TELEMETRY LOCATOR:</div>
                    <div className="text-white font-bold">Lat: {selectedShipment.gpsCoordinates.lat}, Lng: {selectedShipment.gpsCoordinates.lng}</div>
                    <div className="text-[10px] text-emerald-400">Satellite lock active — updates every 15s</div>
                  </div>
                </div>

                {/* Emergency Carrier Overrides */}
                <div className="pt-4 border-t border-white space-y-2">
                  <span className="text-xs font-mono uppercase text-zinc-400 block">Fleet Admin Controls</span>
                  {selectedShipment.status === 'TEMP_ALERT' && (
                    <button 
                      onClick={() => handleDispatchMaintenance(selectedShipment.id)}
                      className="w-full py-2 bg-rose-950 border border-rose-400 text-rose-400 hover:bg-rose-400 hover:text-black font-mono text-xs font-bold uppercase transition-colors"
                    >
                      Dispatch Nearest Maintenance Team
                    </button>
                  )}
                  <button 
                    onClick={() => handlePingDriver(selectedShipment)}
                    className="w-full py-2 bg-zinc-900 border border-white text-white hover:bg-white hover:text-black font-mono text-xs font-bold uppercase transition-colors"
                  >
                    Ping Driver Handset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Carrier Partner Roster */}
          <div className="space-y-4 pt-6 border-t border-white">
            <h2 className="text-lg font-black uppercase text-white tracking-wider">Logistics Carrier Fleet Roster</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_CARRIERS.map(carrier => (
                <div key={carrier.id} className="bg-black border border-white p-4 space-y-3 font-mono">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm">{carrier.name}</h3>
                    <span className="text-xs bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-zinc-300">{carrier.code}</span>
                  </div>
                  <div className="text-xs text-zinc-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Active Fleet Size:</span>
                      <span className="text-white font-bold">{carrier.activeFleetSize} trucks</span>
                    </div>
                    <div className="flex justify-between">
                      <span>On-Time Rate:</span>
                      <span className="text-emerald-400 font-bold">{carrier.onTimeDeliveryPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <span className="text-orange-400 font-bold">★ {carrier.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
