import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TopBar } from './components/TopBar';
import { DeviceFrame } from './components/DeviceFrame';
import { ConfigModal } from './components/ConfigModal';
import { AddDeviceModal } from './components/AddDeviceModal';
import { AppConfig, ChassisColor, LayoutMode } from './types/simulator';
import { INITIAL_APPS, BACKEND_SERVICES } from './constants/devices';
import { ArrowRightLeft, Plus, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'mandikart_simulator_apps_v2';

export const App: React.FC = () => {
  // Persisted or default apps state
  const [apps, setApps] = useState<AppConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load apps from localStorage:', e);
    }
    return INITIAL_APPS;
  });

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('trio');
  const [scale, setScale] = useState<number>(0.52);
  const [chassisColor, setChassisColor] = useState<ChassisColor>('obsidian');
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState<boolean>(false);
  const [isScrollLocked, setIsScrollLocked] = useState<boolean>(true);
  const [activeFocusedId, setActiveFocusedId] = useState<string>('farmer-app');
  const [soloAppId, setSoloAppId] = useState<string>('farmer-app');
  const [duoAppIds, setDuoAppIds] = useState<[string, string]>(['farmer-app', 'logistic-app']);
  const [globalReloadKey, setGlobalReloadKey] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mainCanvasRef = useRef<HTMLElement>(null);

  // Sync apps with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    } catch (e) {
      console.warn('Failed to persist apps:', e);
    }
  }, [apps]);

  // Toast auto-clear
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Live Backend Health State
  const [backendHealth, setBackendHealth] = useState<
    { port: number; name: string; status: 'healthy' | 'unhealthy' | 'checking' }[]
  >(
    BACKEND_SERVICES.map((b) => ({
      port: b.port,
      name: b.name,
      status: 'checking',
    }))
  );

  // Poll backend health status
  useEffect(() => {
    const checkHealth = async () => {
      const results = await Promise.all(
        BACKEND_SERVICES.map(async (service) => {
          try {
            const res = await fetch(service.healthUrl, { signal: AbortSignal.timeout(2500) });
            return {
              port: service.port,
              name: service.name,
              status: res.ok ? ('healthy' as const) : ('unhealthy' as const),
            };
          } catch {
            return {
              port: service.port,
              name: service.name,
              status: 'unhealthy' as const,
            };
          }
        })
      );
      setBackendHealth(results);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Calculate intelligent scale to fit screen
  const handleFitScreen = useCallback(() => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 130;

    if (layoutMode === 'trio') {
      const count = apps.length || 3;
      const targetWidth = count * 440 + (count - 1) * 32;
      const targetHeight = 1000;
      const fitScaleWidth = (screenWidth - 80) / targetWidth;
      const fitScaleHeight = (screenHeight - 60) / targetHeight;
      const calculated = Math.min(fitScaleWidth, fitScaleHeight);
      const clamped = Math.max(0.35, Math.min(0.70, Number(calculated.toFixed(2))));
      setScale(clamped);
    } else if (layoutMode === 'duo') {
      const targetWidth = 960;
      const targetHeight = 1000;
      const fitScaleWidth = (screenWidth - 80) / targetWidth;
      const fitScaleHeight = (screenHeight - 60) / targetHeight;
      const calculated = Math.min(fitScaleWidth, fitScaleHeight);
      const clamped = Math.max(0.45, Math.min(0.85, Number(calculated.toFixed(2))));
      setScale(clamped);
    } else {
      // Solo Mode
      const targetHeight = 1000;
      const fitScaleHeight = (screenHeight - 40) / targetHeight;
      const clamped = Math.max(0.55, Math.min(0.95, Number(fitScaleHeight.toFixed(2))));
      setScale(clamped);
    }
  }, [layoutMode, apps.length]);

  // Initial responsive fit
  useEffect(() => {
    handleFitScreen();
  }, [layoutMode, handleFitScreen]);

  // Handle Wheel Events with Scroll Lock System
  const handleCanvasWheel = (e: React.WheelEvent<HTMLElement>) => {
    if (isScrollLocked) {
      // Prevent vertical page scroll; translate vertical wheel movement into smooth horizontal scroll if canvas has overflow
      if (mainCanvasRef.current && mainCanvasRef.current.scrollWidth > mainCanvasRef.current.clientWidth) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          mainCanvasRef.current.scrollLeft += e.deltaY;
          e.preventDefault();
        }
      } else {
        // If content fits or scrolling vertically, lock page strictly
        e.preventDefault();
      }
    }
  };

  const handleUpdateApp = (appId: string, updated: Partial<AppConfig>) => {
    setApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, ...updated } : app))
    );
  };

  const handleUpdateAppUrl = (appId: string, newUrl: string) => {
    setApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, url: newUrl } : app))
    );
    showToast('App URL updated successfully');
  };

  const handleAddDevice = (newDevice: AppConfig) => {
    setApps((prev) => [...prev, newDevice]);
    showToast(`Added ${newDevice.name} simulator`);
    // Adjust scale so the new device fits nicely
    setTimeout(handleFitScreen, 100);
  };

  const handleDeleteDevice = (appId: string) => {
    if (apps.length <= 1) {
      showToast('Cannot delete the last remaining simulator');
      return;
    }
    const target = apps.find((a) => a.id === appId);
    setApps((prev) => prev.filter((a) => a.id !== appId));
    showToast(`Removed ${target?.name || 'simulator'}`);
  };

  const handleResetDefaults = () => {
    setApps(INITIAL_APPS);
    localStorage.removeItem(STORAGE_KEY);
    setGlobalReloadKey((k) => k + 1);
    showToast('Reset to default simulators');
    setTimeout(handleFitScreen, 100);
  };

  const handleReloadAll = () => {
    setGlobalReloadKey((k) => k + 1);
    showToast('Reloaded all simulators');
  };

  const toggleScrollLock = () => {
    setIsScrollLocked((prev) => {
      const next = !prev;
      showToast(next ? 'Scroll Lock ON: Page locked to prevent full-screen scrolling' : 'Scroll Lock OFF: Canvas free scroll');
      return next;
    });
  };

  // Determine which apps are visible
  const visibleApps = (() => {
    if (layoutMode === 'solo') {
      const found = apps.find((a) => a.id === soloAppId) || apps[0];
      return found ? [found] : [];
    }
    if (layoutMode === 'duo') {
      const first = apps.find((a) => a.id === duoAppIds[0]) || apps[0];
      const second = apps.find((a) => a.id === duoAppIds[1]) || apps[1] || apps[0];
      return [first, second];
    }
    return apps; // Multi-device / Trio grid
  })();

  return (
    <div className={`h-screen max-h-screen ${isScrollLocked ? 'overflow-hidden' : 'overflow-auto'} bg-studio-950 text-slate-100 flex flex-col font-sans select-none`}>
      {/* Top Studio Control Bar */}
      <TopBar
        layoutMode={layoutMode}
        onSelectLayoutMode={setLayoutMode}
        scale={scale}
        onChangeScale={setScale}
        onFitScreen={handleFitScreen}
        chassisColor={chassisColor}
        onChangeChassis={setChassisColor}
        onReloadAll={handleReloadAll}
        onOpenSettings={() => setIsConfigOpen(true)}
        onOpenAddDevice={() => setIsAddDeviceOpen(true)}
        isScrollLocked={isScrollLocked}
        onToggleScrollLock={toggleScrollLock}
        deviceCount={apps.length}
        backendHealth={backendHealth}
      />

      {/* Subheader Toolbar for Solo/Duo Mode Selection */}
      {layoutMode === 'solo' && (
        <div className="w-full px-4 py-1.5 bg-slate-900/70 border-b border-white/5 flex items-center justify-center gap-2 animate-in fade-in duration-200 flex-wrap">
          <span className="text-xs text-slate-400 mr-1 font-medium">Focused Simulator:</span>
          {apps.map((a) => (
            <button
              key={a.id}
              onClick={() => setSoloAppId(a.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                soloAppId === a.id
                  ? 'bg-slate-800 text-white border border-white/20 shadow-md ring-1 ring-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.accentColor }} />
              <span>{a.name}</span>
            </button>
          ))}
        </div>
      )}

      {layoutMode === 'duo' && (
        <div className="w-full px-4 py-1.5 bg-slate-900/70 border-b border-white/5 flex items-center justify-center gap-3 flex-wrap animate-in fade-in duration-200">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <ArrowRightLeft size={12} className="text-emerald-400" /> Compare Dual Workflow:
          </span>
          <div className="flex items-center gap-2">
            <select
              value={duoAppIds[0]}
              onChange={(e) => setDuoAppIds([e.target.value, duoAppIds[1]])}
              className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none font-medium cursor-pointer"
            >
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role})
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500 font-bold">vs</span>
            <select
              value={duoAppIds[1]}
              onChange={(e) => setDuoAppIds([duoAppIds[0], e.target.value])}
              className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none font-medium cursor-pointer"
            >
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Studio Viewport Canvas with Scroll Isolation */}
      <main 
        ref={mainCanvasRef}
        onWheel={handleCanvasWheel}
        className={`flex-1 w-full p-4 lg:p-6 flex items-start ${
          layoutMode === 'solo' 
            ? 'justify-center' 
            : apps.length <= 3 
            ? 'justify-start md:justify-center' 
            : 'justify-start'
        } overflow-x-auto ${isScrollLocked ? 'overflow-y-hidden scroll-locked-canvas' : 'overflow-y-auto scroll-unlocked-canvas'}`}
        style={{
          overscrollBehavior: 'contain',
        }}
      >
        <div 
          key={globalReloadKey}
          className="flex items-start gap-6 lg:gap-8 transition-all duration-300 flex-nowrap min-w-max mx-auto px-4"
        >
          {visibleApps.map((app) => (
            <DeviceFrame
              key={`${app.id}-${globalReloadKey}`}
              app={app}
              scale={scale}
              chassisColor={chassisColor}
              onUpdateApp={(updated) => handleUpdateApp(app.id, updated)}
              onOpenConfig={() => setIsConfigOpen(true)}
              onSelectSolo={(id) => {
                setSoloAppId(id);
                setLayoutMode('solo');
              }}
              onDeleteApp={apps.length > 1 ? handleDeleteDevice : undefined}
              isSolo={layoutMode === 'solo'}
              isActive={activeFocusedId === app.id}
              onFocusDevice={setActiveFocusedId}
            />
          ))}

          {/* "+ Add Device" Canvas Card in Grid Mode */}
          {layoutMode === 'trio' && (
            <button
              onClick={() => setIsAddDeviceOpen(true)}
              className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/15 hover:border-emerald-500/50 bg-slate-900/20 hover:bg-emerald-500/5 p-6 text-slate-400 hover:text-emerald-300 transition-all group flex-shrink-0 self-center hover:scale-105"
              style={{
                width: Math.max(160, Math.round(280 * scale)),
                height: Math.round(750 * scale),
              }}
              title="Add another Android Simulator to this workspace"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mb-3 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 transition-colors shadow-lg">
                <Plus size={22} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
              </div>
              <span className="text-xs font-bold text-slate-300 group-hover:text-white">Add Device</span>
              <span className="text-[10px] text-slate-500 text-center mt-1">Custom Port or URL</span>
            </button>
          )}
        </div>
      </main>

      {/* Footer Info Strip */}
      <footer className="w-full px-4 py-1.5 bg-slate-950/90 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2 select-none z-30">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>MandiKart Android Studio</span>
          <span className="text-slate-600">•</span>
          <span className={isScrollLocked ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
            {isScrollLocked ? '🔒 Viewport Locked (No Fullscreen Page Scroll)' : '🔓 Free Canvas'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px]">
          {apps.slice(0, 4).map((a) => (
            <span key={a.id} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.accentColor }} />
              {a.name} (:{a.defaultPort})
            </span>
          ))}
          {apps.length > 4 && <span>+{apps.length - 4} more</span>}
        </div>
      </footer>

      {/* Endpoint Configuration Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        apps={apps}
        onUpdateAppUrl={handleUpdateAppUrl}
        onResetDefaults={handleResetDefaults}
      />

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => setIsAddDeviceOpen(false)}
        onAddDevice={handleAddDevice}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
