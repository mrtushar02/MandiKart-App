import React, { useState } from 'react';
import type { AdminUser } from '../types/admin';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { PushNotificationModal, type PushNotificationPayload } from '../components/PushNotificationModal';

interface PushNotificationsProps {
  user: AdminUser;
  onLogout: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const PushNotifications: React.FC<PushNotificationsProps> = ({
  user,
  onLogout,
  onNavigateTab,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial push history with LocalStorage Hydration
  const [history, setHistory] = useState<PushNotificationPayload[]>(() => {
    try {
      const saved = localStorage.getItem('mandikart_admin_push_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const handlePushSuccess = (newPush: PushNotificationPayload) => {
    const updated = [newPush, ...history];
    setHistory(updated);
    try {
      localStorage.setItem('mandikart_admin_push_history', JSON.stringify(updated));
    } catch {}
    setToastMessage(`Broadcast "${newPush.title}" sent successfully to ${newPush.recipientCount} active devices!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleResend = (item: PushNotificationPayload) => {
    const resentItem: PushNotificationPayload = {
      ...item,
      id: `PUSH-${Date.now().toString().slice(-6)}`,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Just Now',
    };
    const updated = [resentItem, ...history];
    setHistory(updated);
    try {
      localStorage.setItem('mandikart_admin_push_history', JSON.stringify(updated));
    } catch {}
    setToastMessage(`Re-broadcasted "${item.title}" to ${item.recipientCount} active devices.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="flex min-h-screen bg-black font-sans text-white">
      <Sidebar
        activeTab="push-notifications"
        onTabChange={onNavigateTab}
        onLogout={onLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1500px] w-full mx-auto font-mono">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-400 text-3xl">campaign</span>
                App Push Notifications Control Center
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Dispatch live FCM & APNs push notifications across Consumer, Farmer, and Reefer Logistics mobile applications.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 bg-emerald-400 text-black font-black uppercase text-xs hover:bg-emerald-300 flex items-center gap-2 border border-emerald-400 shadow-lg"
              >
                <span className="material-symbols-outlined text-lg">add_alert</span>
                Broadcast Push Notification
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="bg-emerald-950 border border-emerald-400 text-emerald-300 p-4 text-xs font-mono flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-lg">verified</span>
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-xs text-emerald-400 underline">
                [DISMISS]
              </button>
            </div>
          )}

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black border border-white p-5 space-y-1">
              <span className="text-xs text-zinc-400 uppercase font-bold">Total Broadcasts Sent</span>
              <div className="text-2xl font-black text-white">1</div>
              <span className="text-[11px] text-emerald-400">100% FCM Gateway Uptime</span>
            </div>

            <div className="bg-black border border-white p-5 space-y-1">
              <span className="text-xs text-zinc-400 uppercase font-bold">Active Device Reach</span>
              <div className="text-2xl font-black text-emerald-400">1</div>
              <span className="text-[11px] text-zinc-400">Across iOS & Android Apps</span>
            </div>

            <div className="bg-black border border-white p-5 space-y-1">
              <span className="text-xs text-zinc-400 uppercase font-bold">Avg. Delivery Rate</span>
              <div className="text-2xl font-black text-white">100%</div>
              <span className="text-[11px] text-emerald-400">⚡ Sub-second Latency</span>
            </div>

            <div className="bg-black border border-white p-5 space-y-1">
              <span className="text-xs text-zinc-400 uppercase font-bold">In-App Open CTR</span>
              <div className="text-2xl font-black text-sky-400">1%</div>
              <span className="text-[11px] text-zinc-400">High engagement on price alerts</span>
            </div>
          </div>

          {/* App Channels Reach Overview */}
          <div className="bg-black border border-white p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-lg">cell_tower</span>
              Registered Application Reach Channels
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-400">shopping_bag</span>
                    Consumer / Buyer App
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-950 border border-emerald-400 text-[10px] px-1.5 py-0.5">
                    ONLINE
                  </span>
                </div>
                <div className="text-zinc-400 text-[11px]">
                  Registered FCM Tokens: <strong className="text-white">1</strong>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[100%]" />
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-orange-400">agriculture</span>
                    Farmer Merchant App
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-950 border border-emerald-400 text-[10px] px-1.5 py-0.5">
                    ONLINE
                  </span>
                </div>
                <div className="text-zinc-400 text-[11px]">
                  Registered FCM Tokens: <strong className="text-white">1</strong>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded overflow-hidden">
                  <div className="bg-orange-400 h-full w-[100%]" />
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sky-400">local_shipping</span>
                    Driver & Cold Fleet App
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-950 border border-emerald-400 text-[10px] px-1.5 py-0.5">
                    ONLINE
                  </span>
                </div>
                <div className="text-zinc-400 text-[11px]">
                  Registered FCM Tokens: <strong className="text-white">1,010</strong>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded overflow-hidden">
                  <div className="bg-sky-400 h-full w-[10%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Broadcast History Table */}
          <div className="bg-black border border-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-lg">history</span>
                  Push Notification Broadcast Logs
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Audit log of all admin push notifications sent across mobile apps.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 border border-white text-white hover:bg-white hover:text-black text-xs font-bold uppercase transition-colors"
              >
                + New Push
              </button>
            </div>

            <div className="border border-zinc-800 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase text-[11px]">
                    <th className="p-3">Broadcast ID & Target</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Notification Content</th>
                    <th className="p-3">Sent Time</th>
                    <th className="p-3">Recipients</th>
                    <th className="p-3">Delivery</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="p-3">
                        <div className="text-white font-bold">{item.id}</div>
                        <div className="text-[10px] text-emerald-400">App: {item.targetApp}</div>
                      </td>

                      <td className="p-3 font-bold">
                        {item.category === 'MARKET_SURGE' && (
                          <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-400">
                            MARKET SURGE
                          </span>
                        )}
                        {item.category === 'WEATHER_ADVISORY' && (
                          <span className="px-2 py-0.5 text-[10px] bg-sky-950 text-sky-400 border border-sky-400">
                            WEATHER
                          </span>
                        )}
                        {item.category === 'PROMOTIONAL' && (
                          <span className="px-2 py-0.5 text-[10px] bg-orange-950 text-orange-400 border border-orange-400">
                            OFFER
                          </span>
                        )}
                        {item.category === 'SYSTEM_UPDATE' && (
                          <span className="px-2 py-0.5 text-[10px] bg-purple-950 text-purple-400 border border-purple-400">
                            SYSTEM
                          </span>
                        )}
                      </td>

                      <td className="p-3 max-w-xs">
                        <div className="text-white font-bold truncate">{item.title}</div>
                        <div className="text-zinc-400 text-[11px] truncate">{item.body}</div>
                        {item.deepLink && (
                          <div className="text-[10px] text-zinc-500 font-mono">URI: {item.deepLink}</div>
                        )}
                      </td>

                      <td className="p-3 text-zinc-300">{item.sentAt}</td>

                      <td className="p-3 text-white font-bold">
                        {(Number(item.recipientCount) || 0).toLocaleString()} devices
                      </td>

                      <td className="p-3">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {item.deliveryRate}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleResend(item)}
                          className="px-2.5 py-1 bg-black border border-zinc-700 hover:border-white text-zinc-200 hover:text-white text-[11px] font-bold uppercase transition-colors"
                        >
                          Resend
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Push Dispatch Modal */}
      <PushNotificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSendSuccess={handlePushSuccess}
      />
    </div>
  );
};
