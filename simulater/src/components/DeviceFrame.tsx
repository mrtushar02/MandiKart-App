import React, { useState, useRef, useEffect } from 'react';
import { 
  RotateCw, 
  ExternalLink, 
  Settings2, 
  Smartphone, 
  Wifi, 
  BatteryMedium, 
  Circle, 
  Square, 
  Triangle,
  RefreshCw,
  Maximize2,
  Trash2
} from 'lucide-react';
import { AppConfig, ChassisColor, DevicePreset } from '../types/simulator';
import { DEVICE_PRESETS } from '../constants/devices';

interface DeviceFrameProps {
  app: AppConfig;
  scale: number;
  chassisColor: ChassisColor;
  onUpdateApp: (updated: Partial<AppConfig>) => void;
  onOpenConfig: (appId: string) => void;
  onSelectSolo?: (appId: string) => void;
  onDeleteApp?: (appId: string) => void;
  isSolo?: boolean;
  isActive?: boolean;
  onFocusDevice?: (appId: string) => void;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  app,
  scale,
  chassisColor,
  onUpdateApp,
  onOpenConfig,
  onSelectSolo,
  onDeleteApp,
  isSolo = false,
  isActive = false,
  onFocusDevice,
}) => {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('09:41');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentPreset: DevicePreset = 
    DEVICE_PRESETS.find((p) => p.id === app.deviceId) || DEVICE_PRESETS[0];

  const isLandscape = app.orientation === 'landscape';
  const viewportWidth = isLandscape ? currentPreset.height : currentPreset.width;
  const viewportHeight = isLandscape ? currentPreset.width : currentPreset.height;

  // Real clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleAndroidBack = () => {
    try {
      if (iframeRef.current?.contentWindow && iframeRef.current.contentWindow.history.length > 1) {
        iframeRef.current.contentWindow.history.back();
      } else {
        handleReload();
      }
    } catch {
      handleReload();
    }
  };

  const handleToggleOrientation = () => {
    onUpdateApp({
      orientation: isLandscape ? 'portrait' : 'landscape',
    });
  };

  const handleDeviceChange = (deviceId: string) => {
    onUpdateApp({ deviceId: deviceId as any });
  };

  // Chassis styling classes
  const chassisClass = {
    obsidian: 'chassis-obsidian',
    titanium: 'chassis-titanium',
    slate: 'chassis-slate',
  }[chassisColor];

  // Outer frame dimensions unscaled
  const totalFrameWidth = viewportWidth + currentPreset.bezelWidth * 2;
  const totalFrameHeight = viewportHeight + currentPreset.bezelWidth * 2 + 36;

  // Scaled dimensions
  const scaledWidth = Math.round(totalFrameWidth * scale);
  const scaledHeight = Math.round(totalFrameHeight * scale);

  return (
    <div 
      className={`flex flex-col items-center transition-all duration-300 flex-shrink-0 relative group ${
        isActive ? 'ring-2 ring-emerald-500/50 rounded-2xl p-1' : ''
      }`}
      style={{ width: Math.max(260, scaledWidth) }}
      onClick={() => onFocusDevice && onFocusDevice(app.id)}
    >
      {/* Device Header Bar */}
      <div 
        className="w-full mb-2.5 px-3 py-2 rounded-xl glass-panel flex items-center justify-between shadow-md border border-white/10"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span 
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
            style={{ backgroundColor: app.accentColor }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate max-w-[110px]">{app.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold border ${app.badgeBg}`}>
                :{app.defaultPort}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1">
          {!isSolo && onSelectSolo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectSolo(app.id);
              }}
              title="Focus this device"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Maximize2 size={13} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleOrientation();
            }}
            title="Rotate Orientation"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCw size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReload();
            }}
            title="Reload App"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open in new browser tab"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ExternalLink size={13} />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenConfig(app.id);
            }}
            title="Configure Port / URL"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Settings2 size={13} />
          </button>
          {onDeleteApp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteApp(app.id);
              }}
              title="Remove this simulator"
              className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Frame Container Sized Exactly to Scaled Dimensions */}
      <div 
        className="relative flex items-center justify-center"
        style={{
          width: scaledWidth,
          height: scaledHeight,
        }}
      >
        {/* Hardware Shell Scaled from Top Center */}
        <div
          className="absolute top-0 left-1/2 select-none"
          style={{
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: 'top center',
            width: totalFrameWidth,
            height: totalFrameHeight,
          }}
        >
          {/* Outer Hardware Bezel */}
          <div
            className={`relative flex flex-col items-center ${chassisClass} transition-shadow duration-300 shadow-2xl`}
            style={{
              padding: currentPreset.bezelWidth,
              borderRadius: currentPreset.borderRadius + currentPreset.bezelWidth,
            }}
          >
            {/* Hardware Side Buttons */}
            <div 
              className="absolute -left-[3px] top-28 w-[3px] h-12 bg-slate-700/90 rounded-l-sm border-l border-white/20"
              title="Volume Up"
            />
            <div 
              className="absolute -left-[3px] top-44 w-[3px] h-12 bg-slate-700/90 rounded-l-sm border-l border-white/20"
              title="Volume Down"
            />
            <div 
              className="absolute -right-[3px] top-32 w-[3px] h-16 bg-slate-700/90 rounded-r-sm border-r border-white/20"
              title="Power Button"
            />

            {/* Screen Glass Area - Scroll isolated with overscroll contain */}
            <div
              className="relative overflow-hidden bg-black flex flex-col shadow-inner select-auto"
              style={{
                width: viewportWidth,
                height: viewportHeight,
                borderRadius: currentPreset.borderRadius,
                overscrollBehavior: 'contain',
              }}
              onWheel={(e) => e.stopPropagation()}
            >
              {/* Android Status Bar */}
              <div className="w-full h-7 bg-black/95 px-5 flex items-center justify-between text-slate-300 text-[11px] font-medium tracking-tight z-30 select-none">
                <span className="font-semibold text-slate-200">{currentTime}</span>
                <div className="w-12 h-1 bg-slate-800 rounded-full border border-slate-700/50" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-tighter opacity-80">5G</span>
                  <Wifi size={12} className="opacity-90" />
                  <div className="flex items-center gap-0.5">
                    <span className="text-[9px] font-mono opacity-80">98%</span>
                    <BatteryMedium size={14} className="opacity-90" />
                  </div>
                </div>
              </div>

              {/* Punch Hole Camera */}
              {currentPreset.punchType === 'center-dot' && (
                <div 
                  className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-40 border border-slate-800 flex items-center justify-center pointer-events-none shadow-md"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-blue-900/60 opacity-80" />
                </div>
              )}

              {/* Live Iframe Viewport with isolated scrolling */}
              <div 
                className="relative flex-1 w-full bg-slate-950 overflow-hidden"
                style={{ overscrollBehavior: 'contain' }}
              >
                {isLoading && (
                  <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                    <div 
                      className="w-10 h-10 border-2 border-slate-700 border-t-current rounded-full animate-spin mb-3"
                      style={{ color: app.accentColor }}
                    />
                    <p className="text-sm font-medium text-white">{app.name}</p>
                    <p className="text-xs text-slate-400 mt-1">Connecting to {app.url}...</p>
                  </div>
                )}

                <iframe
                  ref={iframeRef}
                  key={iframeKey}
                  src={app.url}
                  title={app.name}
                  onLoad={() => setIsLoading(false)}
                  onError={() => setIsLoading(false)}
                  className="w-full h-full border-0 bg-white"
                  style={{ overscrollBehavior: 'contain' }}
                  allow="geolocation; camera; microphone; payment; clipboard-read; clipboard-write;"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads allow-top-navigation"
                />
              </div>

              {/* Android Bottom Navigation Bar */}
              <div className="w-full h-8 bg-black/95 flex items-center justify-around text-slate-500 z-30 border-t border-white/5 select-none">
                <button 
                  onClick={handleAndroidBack}
                  className="p-1 hover:text-slate-200 transition-colors" 
                  title="Back"
                >
                  <Triangle size={11} className="-rotate-90 fill-current opacity-75" />
                </button>
                <button 
                  onClick={() => {
                    if (iframeRef.current) {
                      iframeRef.current.src = app.url;
                    }
                  }}
                  className="p-1 hover:text-slate-200 transition-colors" 
                  title="Home"
                >
                  <Circle size={11} className="stroke-[2.5]" />
                </button>
                <button 
                  onClick={handleReload}
                  className="p-1 hover:text-slate-200 transition-colors" 
                  title="Recents"
                >
                  <Square size={11} className="stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Specification Selector Footer */}
      <div 
        className="w-full mt-2.5 px-3 py-1.5 rounded-lg glass-panel flex items-center justify-between text-xs text-slate-400 border border-white/10 shadow-sm"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Smartphone size={13} className="text-slate-400 flex-shrink-0" />
          <select
            value={app.deviceId}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="bg-transparent text-slate-200 hover:text-white border-0 focus:ring-0 cursor-pointer font-medium text-xs outline-none py-0.5 truncate max-w-[140px]"
          >
            {DEVICE_PRESETS.map((dp) => (
              <option key={dp.id} value={dp.id} className="bg-slate-900 text-slate-200">
                {dp.name} ({dp.aspectRatio})
              </option>
            ))}
          </select>
        </div>

        <span className="font-mono text-[10px] text-slate-400 flex-shrink-0">
          {viewportWidth}×{viewportHeight}
        </span>
      </div>
    </div>
  );
};
