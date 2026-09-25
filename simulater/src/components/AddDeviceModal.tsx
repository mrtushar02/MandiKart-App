import React, { useState } from 'react';
import { X, Smartphone, Globe, Plus, Sparkles, Check, Tablet } from 'lucide-react';
import { AppConfig, DeviceId } from '../types/simulator';
import { DEVICE_PRESETS } from '../constants/devices';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDevice: (device: AppConfig) => void;
}

const COLOR_PRESETS = [
  { name: 'Emerald', hex: '#10b981', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', glow: 'shadow-device-glow-farmer' },
  { name: 'Amber', hex: '#f59e0b', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', glow: 'shadow-device-glow-user' },
  { name: 'Azure', hex: '#3b82f6', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30', glow: 'shadow-device-glow' },
  { name: 'Purple', hex: '#a855f7', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30', glow: 'shadow-device-glow' },
  { name: 'Rose', hex: '#f43f5e', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30', glow: 'shadow-device-glow' },
  { name: 'Cyan', hex: '#06b6d4', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', glow: 'shadow-device-glow' },
];

const URL_QUICK_PRESETS = [
  { label: 'Admin Panel (5173)', url: 'http://localhost:5173', role: 'Admin Dashboard', colorIdx: 3 },
  { label: 'User App (8083)', url: 'http://localhost:8083', role: 'Buyer App', colorIdx: 1 },
  { label: 'Farmer App (8082)', url: 'http://localhost:8082', role: 'Producer App', colorIdx: 0 },
  { label: 'Logistics (8081)', url: 'http://localhost:8081', role: 'Delivery Partner', colorIdx: 2 },
];

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  onAddDevice,
}) => {
  const [name, setName] = useState<string>('Admin Panel');
  const [role, setRole] = useState<string>('Super Admin / Manager');
  const [url, setUrl] = useState<string>('http://localhost:5173');
  const [deviceId, setDeviceId] = useState<DeviceId>('pixel-9-pro');
  const [selectedColorIdx, setSelectedColorIdx] = useState<number>(3);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this simulator.');
      return;
    }
    if (!url.trim()) {
      setError('Please enter a target URL or port.');
      return;
    }

    // Extract port or fallback
    let portNumber = 80;
    try {
      const parsed = new URL(url);
      portNumber = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === 'https:' ? 443 : 80;
    } catch {
      portNumber = 8080;
    }

    const color = COLOR_PRESETS[selectedColorIdx];
    const newDevice: AppConfig = {
      id: `custom-app-${Date.now()}`,
      name: name.trim(),
      subtitle: role.trim() || 'Custom Android Environment',
      role: role.trim() as any,
      url: url.trim(),
      defaultPort: portNumber,
      accentColor: color.hex,
      badgeBg: color.badge,
      badgeBorder: `border-${color.name.toLowerCase()}-500/40`,
      glowClass: color.glow,
      status: 'online',
      deviceId: deviceId,
      orientation: orientation,
    };

    onAddDevice(newDevice);
    onClose();
    // Reset defaults
    setName('Custom App');
    setUrl('http://localhost:');
    setError('');
  };

  const applyPreset = (preset: typeof URL_QUICK_PRESETS[0]) => {
    setUrl(preset.url);
    setName(preset.label.split(' (')[0]);
    setRole(preset.role);
    setSelectedColorIdx(preset.colorIdx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-dropdown rounded-2xl p-6 shadow-2xl border border-white/10 text-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Add Android Simulator
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Custom
                </span>
              </h2>
              <p className="text-xs text-slate-400">Launch a new real-time Android device frame with any URL</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Quick One-Click Templates
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {URL_QUICK_PRESETS.map((p) => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-[11px] text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Sparkles size={11} className="text-emerald-400" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* App Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                App / Screen Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Admin Dashboard"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Role / Tag Label
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Operations Manager"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Target URL */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Custom Target URL / Port <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <Globe size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:5173 or https://abc.ngrok-free.app"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Enter any localhost port, tunnel URL (ngrok/localtunnel), or deployed web URL.
            </p>
          </div>

          {/* Device Model Preset */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Device Model & Aspect Ratio
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEVICE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDeviceId(preset.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    deviceId === preset.id
                      ? 'bg-emerald-500/10 border-emerald-500/60 text-white shadow-sm'
                      : 'bg-slate-950 border-white/5 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {preset.id === 'pixel-tablet' ? <Tablet size={13} /> : <Smartphone size={13} />}
                    <span className="text-xs font-semibold truncate">{preset.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    {preset.width}×{preset.height} ({preset.aspectRatio})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Color & Orientation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Accent Theme Badge
              </label>
              <div className="flex items-center gap-2">
                {COLOR_PRESETS.map((c, idx) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColorIdx(idx)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      selectedColorIdx === idx 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110' 
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {selectedColorIdx === idx && <Check size={13} className="text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Orientation
              </label>
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-white/10">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                    orientation === 'portrait' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Portrait ↕
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                    orientation === 'landscape' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Landscape ↔
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-colors flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Launch Simulator</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
