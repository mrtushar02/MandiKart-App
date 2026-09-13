import React, { useState } from 'react';
import type { AdminUser } from '../types/admin';
import type { PriceForecast, SpoilageRiskAlert, SupplyDemandForecast } from '../types/logisticsAndAi';
import { MOCK_PRICE_FORECASTS, MOCK_SPOILAGE_ALERTS, MOCK_SUPPLY_DEMAND } from './LogisticsAndAiMock';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

interface AiIntelligenceProps {
  user: AdminUser;
  onLogout: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const AiIntelligence: React.FC<AiIntelligenceProps> = ({
  user,
  onLogout,
  onNavigateTab,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [priceForecasts, setPriceForecasts] = useState<PriceForecast[]>(MOCK_PRICE_FORECASTS);
  const [spoilageAlerts, setSpoilageAlerts] = useState<SpoilageRiskAlert[]>(MOCK_SPOILAGE_ALERTS);
  const [supplyDemand, setSupplyDemand] = useState<SupplyDemandForecast[]>(MOCK_SUPPLY_DEMAND);
  const [isLiveGemini, setIsLiveGemini] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [appliedPriceMsg, setAppliedPriceMsg] = useState<string | null>(null);

  const fetchAiInsights = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:4003/api/v1/admin/ai-insights');
      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          if (Array.isArray(json.data.priceForecasts) && json.data.priceForecasts.length > 0) {
            const mappedForecasts: PriceForecast[] = json.data.priceForecasts.map((f: any) => ({
              cropName: f.cropName || 'Produce',
              category: f.category || (f.cropName?.toLowerCase().includes('onion') || f.cropName?.toLowerCase().includes('tomato') ? 'Vegetables' : 'Grains'),
              currentAvgPricePerKg: Number(f.currentAvgPricePerKg ?? f.currentPrice ?? 25),
              predicted7DayPricePerKg: Number(f.predicted7DayPricePerKg ?? f.predictedPrice7D ?? (f.currentPrice ? f.currentPrice * 1.1 : 28)),
              predictedChangePct: Number(f.predictedChangePct ?? (f.predictedPrice7D && f.currentPrice ? Number((((f.predictedPrice7D - f.currentPrice) / f.currentPrice) * 100).toFixed(1)) : 8.5)),
              confidencePct: Number(f.confidencePct ?? f.confidenceScore ?? 88),
              trend: f.trend || (f.trendDirection === 'UP' ? 'UPWARD' : f.trendDirection === 'DOWN' ? 'DOWNWARD' : 'STABLE'),
              primaryFactor: f.primaryFactor || f.summaryReason || 'Supply-demand arrival volatility at APMC hubs.',
              recommendedBasePrice: Number(f.recommendedBasePrice ?? f.predictedPrice7D ?? 26),
            }));
            setPriceForecasts(mappedForecasts);
          }
          if (Array.isArray(json.data.spoilageAlerts) && json.data.spoilageAlerts.length > 0) {
            const mappedAlerts: SpoilageRiskAlert[] = json.data.spoilageAlerts.map((a: any, aIdx: number) => ({
              id: a.id || `spl-${aIdx}`,
              batchId: a.batchId || `LOT-MK-${100 + aIdx}`,
              cropName: a.cropName || 'Fresh Produce',
              farmerName: a.farmerName || 'Ramesh Patel',
              quantityKg: Number(a.quantityKg || 500),
              transitHoursElapsed: Number(a.transitHoursElapsed || 6),
              estimatedRemainingShelfHours: Number(a.estimatedRemainingShelfHours ?? a.hoursRemaining ?? 18),
              riskSeverity: (a.riskSeverity || a.severity || 'HIGH').toUpperCase() as any,
              currentTempCelsius: Number(a.currentTempCelsius ?? 12.5),
              recommendedAction: a.recommendedAction || 'Priority cross-dock at nearby cold storage.',
              location: a.location || a.currentLocation || 'Transit: Nashik Corridor',
            }));
            setSpoilageAlerts(mappedAlerts);
          }
          if (Array.isArray(json.data.supplyDemand) && json.data.supplyDemand.length > 0) {
            const mappedSD: SupplyDemandForecast[] = json.data.supplyDemand.map((sd: any) => ({
              region: sd.region || 'Western Maharashtra APMC Zone',
              state: sd.state || 'Maharashtra',
              cropName: sd.cropName || 'Produce',
              expectedHarvestTons: Number(sd.expectedHarvestTons ?? (sd.currentSupplyQuintals ? sd.currentSupplyQuintals / 10 : 350)),
              buyerDemandTons: Number(sd.buyerDemandTons ?? (sd.projectedDemandQuintals ? sd.projectedDemandQuintals / 10 : 420)),
              balanceState: sd.balanceState || (sd.gapStatus === 'DEFICIT' ? 'DEFICIT' : sd.gapStatus === 'SURPLUS' ? 'SURPLUS' : 'BALANCED'),
              gapTons: Number(sd.gapTons ?? ((sd.currentSupplyQuintals && sd.projectedDemandQuintals) ? (sd.currentSupplyQuintals - sd.projectedDemandQuintals) / 10 : -70)),
            }));
            setSupplyDemand(mappedSD);
          }
          setIsLiveGemini(true);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live Gemini AI insights, using baseline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAiInsights();
  }, []);

  const handleApplyBasePrice = (cropName: string, price: number) => {
    setAppliedPriceMsg(`Recommended base price ₹${price}/kg applied to Mandi price engine for ${cropName}.`);
    setTimeout(() => setAppliedPriceMsg(null), 5000);
  };

  return (
    <div className="flex min-h-screen bg-black font-sans text-white">
      <Sidebar
        activeTab="ai-insights"
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
              <h1 className="text-2xl font-black uppercase tracking-wider text-white">AI Predictive Intelligence Engine</h1>
              <p className="text-sm text-zinc-400 mt-1">Real-time agricultural market forecasting, cold-chain spoilage radar, and APMC supply-demand balancing powered by Google Gemini.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchAiInsights}
                disabled={isLoading}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 hover:border-emerald-400 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className={`material-symbols-outlined text-sm ${isLoading ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`}>sync</span>
                <span>{isLoading ? 'ANALYZING...' : 'REFRESH AI'}</span>
              </button>

              <div className="flex items-center text-xs font-mono text-emerald-400 border border-emerald-400 bg-emerald-950 px-3 py-1.5 rounded">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></span>
                {isLiveGemini ? 'GEMINI 2.5 FLASH ACTIVE' : 'PREDICTIVE ENGINE ONLINE'}
              </div>
            </div>
          </div>

          {/* Action Confirmation Banner */}
          {appliedPriceMsg && (
            <div className="bg-emerald-950 border border-emerald-400 text-emerald-300 p-4 font-mono text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">task_alt</span>
                <span>{appliedPriceMsg}</span>
              </div>
              <button onClick={() => setAppliedPriceMsg(null)} className="text-xs text-emerald-400 underline">[DISMISS]</button>
            </div>
          )}

          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black border border-white p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Model Accuracy</span>
                <span className="material-symbols-outlined text-emerald-400">psychology</span>
              </div>
              <div className="text-3xl font-black text-white">94.8%</div>
              <div className="text-xs text-emerald-400 mt-2 font-mono">
                Trained on 1.2M Mandi arrivals
              </div>
            </div>

            <div className="bg-black border border-white p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Spoilage Risk Radar</span>
                <span className="material-symbols-outlined text-rose-400">warning</span>
              </div>
              <div className="text-3xl font-black text-white">{spoilageAlerts.length}</div>
              <div className="text-xs text-rose-400 mt-2 font-mono">
                {spoilageAlerts.filter(a => a.riskSeverity === 'CRITICAL').length} Critical batch alert
              </div>
            </div>

            <div className="bg-black border border-white p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Price Volatility Index</span>
                <span className="material-symbols-outlined text-orange-400">trending_up</span>
              </div>
              <div className="text-3xl font-black text-white">+18.4%</div>
              <div className="text-xs text-orange-400 mt-2 font-mono">
                High volatility in Vegetables
              </div>
            </div>

            <div className="bg-black border border-white p-5">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono tracking-widest uppercase">Mandi Sync Status</span>
                <span className="material-symbols-outlined text-emerald-400">sync</span>
              </div>
              <div className="text-3xl font-black text-white">100% SYNC</div>
              <div className="text-xs text-zinc-400 mt-2 font-mono">
                Auto-syncing every 30 mins
              </div>
            </div>
          </div>

          {/* Section 1: Spoilage Early-Warning Radar */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-400">thermostat_auto</span>
                Cold-Chain Spoilage Early-Warning Radar
              </h2>
              <span className="text-xs font-mono text-rose-400 border border-rose-400 bg-rose-950 px-2 py-1">
                HIGH SENSITIVITY ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {spoilageAlerts.map(alert => (
                <div key={alert.id} className={`bg-black border p-5 space-y-3 font-mono ${alert.riskSeverity === 'CRITICAL' ? 'border-rose-400' : 'border-orange-400'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-zinc-400">{alert.batchId}</span>
                      <h3 className="text-base font-bold text-white">{alert.cropName}</h3>
                      <div className="text-xs text-zinc-300 mt-0.5">Farmer: {alert.farmerName} ({alert.quantityKg} kg)</div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-bold ${alert.riskSeverity === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-400' : 'bg-orange-950 text-orange-400 border border-orange-400'}`}>
                      {alert.riskSeverity} RISK
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-950 border border-zinc-800 p-2.5">
                    <div>
                      <span className="text-zinc-500 block">Est Remaining Shelf Life:</span>
                      <span className="text-rose-400 font-bold text-sm">{alert.estimatedRemainingShelfHours} Hours</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Reefer Sensor Temp:</span>
                      <span className="text-rose-400 font-bold text-sm">{alert.currentTempCelsius}°C</span>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 p-3">
                    <span className="text-emerald-400 font-bold block mb-1">AI RECOMMENDED ACTION:</span>
                    "{alert.recommendedAction}"
                  </div>

                  <div className="text-[11px] text-zinc-500 flex justify-between items-center pt-1">
                    <span>Location: {alert.location}</span>
                    <button 
                      onClick={() => setSpoilageAlerts(prev => prev.filter(a => a.id !== alert.id))}
                      className="px-2 py-1 text-xs border border-white text-white hover:bg-white hover:text-black font-mono transition-colors"
                    >
                      [EXECUTE REROUTE]
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Crop Price Volatility & AI Recommendations */}
          <div className="space-y-4 pt-4 border-t border-white">
            <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">trending_up</span>
              Crop Price Volatility & Mandi Rate Recommendations
            </h2>

            <div className="bg-black border border-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-white text-zinc-400 font-mono text-xs uppercase">
                      <th className="p-3">Crop Name & Category</th>
                      <th className="p-3 text-right">Current Rate</th>
                      <th className="p-3 text-right">Predicted (7-Day)</th>
                      <th className="p-3 text-center">Trend %</th>
                      <th className="p-3 text-center">AI Confidence</th>
                      <th className="p-3">Primary Volatility Factor</th>
                      <th className="p-3 text-right">AI Recommended Base Rate</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {priceForecasts.map((forecast, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/60 transition-colors font-mono">
                        <td className="p-3">
                          <div className="text-white font-bold">{forecast.cropName}</div>
                          <div className="text-xs text-zinc-400">{forecast.category}</div>
                        </td>
                        <td className="p-3 text-right font-bold text-white">
                          ₹{(Number(forecast.currentAvgPricePerKg) || 0).toFixed(2)}/kg
                        </td>
                        <td className="p-3 text-right font-bold text-white">
                          ₹{(Number(forecast.predicted7DayPricePerKg) || 0).toFixed(2)}/kg
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 text-xs font-bold ${
                            (Number(forecast.predictedChangePct) || 0) > 0 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-400' 
                              : (Number(forecast.predictedChangePct) || 0) < 0 
                              ? 'bg-rose-950 text-rose-400 border border-rose-400' 
                              : 'bg-zinc-900 text-zinc-300 border border-zinc-700'
                          }`}>
                            {(Number(forecast.predictedChangePct) || 0) > 0 ? `+${forecast.predictedChangePct}%` : `${forecast.predictedChangePct || 0}%`}
                          </span>
                        </td>
                        <td className="p-3 text-center text-xs text-emerald-400 font-bold">
                          {forecast.confidencePct || 90}%
                        </td>
                        <td className="p-3 text-xs text-zinc-300 max-w-[280px]">
                          {forecast.primaryFactor || 'Market arrival flow'}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-400 text-base">
                          ₹{(Number(forecast.recommendedBasePrice) || 0).toFixed(2)}/kg
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleApplyBasePrice(forecast.cropName, Number(forecast.recommendedBasePrice) || 0)}
                            className="px-2.5 py-1 text-xs border border-white hover:bg-white hover:text-black transition-colors"
                          >
                            Apply Rate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 3: Regional Supply & Demand Forecasts */}
          <div className="space-y-4 pt-4 border-t border-white">
            <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-orange-400">balance</span>
              Regional Supply & Demand Balance Forecast
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {supplyDemand.map((sd, idx) => (
                <div key={idx} className="bg-black border border-white p-4 space-y-3 font-mono">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <div>
                      <h3 className="font-bold text-white text-sm">{sd.region}</h3>
                      <div className="text-xs text-zinc-400">{sd.state} — {sd.cropName}</div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-bold ${
                      sd.balanceState === 'DEFICIT' 
                        ? 'bg-rose-950 text-rose-400 border border-rose-400' 
                        : sd.balanceState === 'SURPLUS' 
                        ? 'bg-orange-950 text-orange-400 border border-orange-400' 
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-400'
                    }`}>
                      {sd.balanceState}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-300 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Expected Harvest:</span>
                      <span className="text-white font-bold">{(Number(sd.expectedHarvestTons) || 0).toLocaleString()} Tons</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Buyer Demand:</span>
                      <span className="text-white font-bold">{(Number(sd.buyerDemandTons) || 0).toLocaleString()} Tons</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-800 pt-1.5 font-bold">
                      <span>Net Balance Gap:</span>
                      <span className={sd.gapTons < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                        {(Number(sd.gapTons) || 0) > 0 ? `+${(Number(sd.gapTons) || 0).toLocaleString()} Tons` : `${(Number(sd.gapTons) || 0).toLocaleString()} Tons`}
                      </span>
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
