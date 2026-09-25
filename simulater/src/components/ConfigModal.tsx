import React, { useState } from 'react';
import { X, Check, Globe, RefreshCw, Smartphone, Layers, AlertCircle } from 'lucide-react';
import { AppConfig } from '../types/simulator';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppConfig[];
  onUpdateAppUrl: (appId: string, newUrl: string) => void;
  onResetDefaults: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  apps,
  onUpdateAppUrl,
  onResetDefaults,
}) => {
  const [urls, setUrls] = useState<{ [key: string]: string }>(() => {
    const initial: { [key: string]: string } = {};
    apps.forEach((a) => {
      initial[a.id] = a.url;
    });
    return initial;
  });

  const [testResults, setTestResults] = useState<{ [key: string]: 'idle' | 'testing' | 'online' | 'error' }>({});

  if (!isOpen) return null;

  const handleUrlChange = (appId: string, val: string) => {
    setUrls((prev) => ({ ...prev, [appId]: val }));
  };

  const handleSave = () => {
    Object.entries(urls).forEach(([id, url]) => {
      onUpdateAppUrl(id, url);
    });
    onClose();
  };

  const testConnectivity = async (appId: string, url: string) => {
    setTestResults((prev) => ({ ...prev, [appId]: 'testing' }));
    try {
      // Direct fetch attempt (or image ping fallback for CORS-isolated ports)
      await fetch(url, { mode: 'no-cors' });
      setTestResults((prev) => ({ ...prev, [appId]: 'online' }));
    } catch {
      setTestResults((prev) => ({ ...prev, [appId]: 'error' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-dropdown rounded-2xl p-6 shadow-2xl border border-white/10 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">App Endpoints & Ports</h2>
              <p className="text-xs text-slate-400">Configure local ports or tunnel URLs for each simulator</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Inputs */}
        <div className="py-4 space-y-4">
          {apps.map((app) => (
            <div key={app.id} className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: app.accentColor }} />
                  <span className="text-sm font-semibold text-white">{app.name}</span>
                  <span className="text-xs text-slate-400">({app.role})</span>
                </div>
                <button
                  type="button"
                  onClick={() => testConnectivity(app.id, urls[app.id] || app.url)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <RefreshCw size={11} className={testResults[app.id] === 'testing' ? 'animate-spin' : ''} />
                  <span>Test Ping</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={urls[app.id] ?? app.url}
                  onChange={(e) => handleUrlChange(app.id, e.target.value)}
                  placeholder="e.g. http://localhost:8081 or https://abc.ngrok-free.app"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {testResults[app.id] === 'online' && (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <Check size={12} /> Reachable & Active
                </p>
              )}
              {testResults[app.id] === 'error' && (
                <p className="text-[11px] text-amber-400 flex items-center gap-1">
                  <AlertCircle size={12} /> Server may be offline or port is closed
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Quick Tunnels / Defaults note */}
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-300/80 mb-5">
          <p className="font-medium">Pro-Tip for Mobile Testing:</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            You can enter Expo web URLs (<code className="text-emerald-300 font-mono">http://localhost:8081</code>, <code className="text-emerald-300 font-mono">8082</code>, <code className="text-emerald-300 font-mono">8083</code>) or tunnel URLs (<code className="text-emerald-300 font-mono">https://*.ngrok-free.app</code>).
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onResetDefaults}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Reset to Default Ports
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-colors"
            >
              Apply Endpoints
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
