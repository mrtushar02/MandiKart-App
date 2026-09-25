import React from 'react';
import { 
  Columns, 
  LayoutGrid, 
  Smartphone, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  SlidersHorizontal,
  Palette,
  Activity,
  Lock,
  Unlock,
  Plus
} from 'lucide-react';
import { ChassisColor, LayoutMode } from '../types/simulator';

interface TopBarProps {
  layoutMode: LayoutMode;
  onSelectLayoutMode: (mode: LayoutMode) => void;
  scale: number;
  onChangeScale: (scale: number) => void;
  onFitScreen: () => void;
  chassisColor: ChassisColor;
  onChangeChassis: (color: ChassisColor) => void;
  onReloadAll: () => void;
  onOpenSettings: () => void;
  onOpenAddDevice: () => void;
  isScrollLocked: boolean;
  onToggleScrollLock: () => void;
  deviceCount: number;
  backendHealth: { port: number; name: string; status: 'healthy' | 'unhealthy' | 'checking' }[];
}

export const TopBar: React.FC<TopBarProps> = ({
  layoutMode,
  onSelectLayoutMode,
  scale,
  onChangeScale,
  onFitScreen,
  chassisColor,
  onChangeChassis,
  onReloadAll,
  onOpenSettings,
  onOpenAddDevice,
  isScrollLocked,
  onToggleScrollLock,
  deviceCount,
  backendHealth,
}) => {
  const zoomPercent = Math.round(scale * 100);

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-2 glass-panel border-b border-white/10 flex items-center justify-between gap-2.5 select-none shadow-xl flex-nowrap">
      {/* Brand & Left Section */}
      <div className="flex items-center gap-2.5 min-w-max">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-950/40 flex-shrink-0">
          <Smartphone size={17} className="text-white drop-shadow" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">MandiKart</h1>
            <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Studio
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {deviceCount} Devices
            </span>
          </div>
        </div>
      </div>

      {/* Center Controls: View Switcher, Zoom, Scroll Lock */}
      <div className="flex items-center gap-2">
        {/* Layout Modes */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-900/90 border border-white/10 shadow-inner">
          <button
            onClick={() => onSelectLayoutMode('trio')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              layoutMode === 'trio'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Multi-Grid View: Display All Active Devices"
          >
            <Columns size={12} />
            <span>Grid ({deviceCount})</span>
          </button>
          <button
            onClick={() => onSelectLayoutMode('duo')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              layoutMode === 'duo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Duo Mode: Compare 2 Devices"
          >
            <LayoutGrid size={12} />
            <span>Duo</span>
          </button>
          <button
            onClick={() => onSelectLayoutMode('solo')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              layoutMode === 'solo'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Solo Focus: Focus Single Device"
          >
            <Smartphone size={12} />
            <span>Focus</span>
          </button>
        </div>

        {/* Scroll Lock Toggle */}
        <button
          onClick={onToggleScrollLock}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            isScrollLocked
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
              : 'bg-slate-900/80 border-white/10 text-amber-400 hover:text-amber-300 hover:bg-slate-800'
          }`}
          title={isScrollLocked ? 'Scroll Lock ON: Outer screen is locked, wheel events remain inside phone' : 'Scroll Lock OFF: Outer canvas scrolls freely'}
        >
          {isScrollLocked ? <Lock size={12} className="text-emerald-400" /> : <Unlock size={12} className="text-amber-400" />}
          <span className="hidden sm:inline">
            {isScrollLocked ? 'Scroll Lock: ON' : 'Scroll Lock: OFF'}
          </span>
        </button>

        {/* Viewport Zoom */}
        <div className="flex items-center gap-1.5 p-1 px-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs">
          <button
            onClick={() => onChangeScale(Math.max(0.35, Number((scale - 0.05).toFixed(2))))}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>

          <input
            type="range"
            min="0.35"
            max="1.0"
            step="0.05"
            value={scale}
            onChange={(e) => onChangeScale(parseFloat(e.target.value))}
            className="w-14 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            title="Adjust Device Scale"
          />

          <button
            onClick={() => onChangeScale(Math.min(1.0, Number((scale + 0.05).toFixed(2))))}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>

          <span className="font-mono text-slate-300 w-8 text-center font-semibold text-[10px]">
            {zoomPercent}%
          </span>

          <button
            onClick={onFitScreen}
            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1 text-[10px] font-semibold"
            title="Auto-Fit All Devices"
          >
            <Maximize size={9} />
            <span>Fit</span>
          </button>
        </div>

        {/* Chassis Color */}
        <div className="hidden lg:flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs">
          <Palette size={11} className="text-slate-400 ml-1.5 mr-0.5" />
          <button
            onClick={() => onChangeChassis('obsidian')}
            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
              chassisColor === 'obsidian' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Obsidian
          </button>
          <button
            onClick={() => onChangeChassis('titanium')}
            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
              chassisColor === 'titanium' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Titanium
          </button>
          <button
            onClick={() => onChangeChassis('slate')}
            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
              chassisColor === 'slate' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Slate
          </button>
        </div>
      </div>

      {/* Right Side: + Add Device, Reload All, Config */}
      <div className="flex items-center gap-1.5 min-w-max">
        {/* Backend Pings */}
        <div className="hidden xl:flex items-center gap-1 p-1 px-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-[10px]">
          <Activity size={10} className="text-slate-400" />
          {backendHealth.map((b) => (
            <div 
              key={b.port}
              className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-slate-800/80 font-mono text-[9px]"
              title={`${b.name} (: ${b.port}) - ${b.status}`}
            >
              <span 
                className={`w-1 h-1 rounded-full ${
                  b.status === 'healthy' 
                    ? 'bg-emerald-400' 
                    : b.status === 'checking'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-red-400'
                }`} 
              />
              <span className="text-slate-300">:{b.port}</span>
            </div>
          ))}
        </div>

        {/* Add Simulator Button */}
        <button
          onClick={onOpenAddDevice}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40 hover:scale-105 active:scale-95"
          title="Add a new simulator with custom URL"
        >
          <Plus size={13} className="stroke-[2.5]" />
          <span>Add Device</span>
        </button>

        {/* Global Reload All */}
        <button
          onClick={onReloadAll}
          className="flex items-center gap-1 p-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-300 transition-colors shadow-sm"
          title="Reload All Apps Simultaneously"
        >
          <RotateCcw size={12} />
        </button>

        {/* Config Modal Button */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1 p-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-300 transition-colors shadow-sm"
          title="Configure Ports & Endpoints"
        >
          <SlidersHorizontal size={12} />
        </button>
      </div>
    </header>
  );
};
