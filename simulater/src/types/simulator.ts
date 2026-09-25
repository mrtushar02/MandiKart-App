export type DeviceId = 'pixel-9-pro' | 'galaxy-s24-ultra' | 'oneplus-12' | 'compact-phone' | 'pixel-tablet';

export interface DevicePreset {
  id: DeviceId;
  name: string;
  brand: 'Google' | 'Samsung' | 'OnePlus' | 'Android';
  width: number;
  height: number;
  aspectRatio: string;
  borderRadius: number;
  punchType: 'center-dot' | 'corner-dot' | 'pill' | 'none';
  bezelWidth: number;
}

export type AppId = 'user-app' | 'farmer-app' | 'logistic-app' | string;

export interface AppConfig {
  id: AppId;
  name: string;
  subtitle: string;
  role: string;
  url: string;
  defaultPort: number;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  glowClass: string;
  status: 'online' | 'offline' | 'checking';
  deviceId: DeviceId;
  orientation: 'portrait' | 'landscape';
  isMuted?: boolean;
}

export type LayoutMode = 'trio' | 'duo' | 'solo';
export type ChassisColor = 'obsidian' | 'titanium' | 'slate';
