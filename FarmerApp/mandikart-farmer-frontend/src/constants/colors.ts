/**
 * MandiKart Design System — Color Tokens
 *
 * Visual Identity (LOCKED):
 *   Primary palette: Orange + Soft White + Green
 *   Balance: 70-80% soft white, 10-15% green, 10-15% orange
 *
 * Green  → CTA, selected, success, verified, recommendation, positive
 * Orange → attention, demand, price highlight, reminder, secondary accent
 * Red    → destructive / error ONLY
 */

export const MKColors = {
  // ── Primary Brand ────────────────────────────────────────
  primary: '#2E7D32',
  primaryGreen: '#2E7D32',
  primaryGreenLight: '#4CAF50',
  primaryGreenDark: '#1B5E20',
  primaryGreenSurface: '#E8F5E9',   // light-green selected bg
  primaryGreenMuted: '#A5D6A7',

  accentOrange: '#F57C00',
  accentOrangeLight: '#FFB74D',
  accentOrangeDark: '#E65100',
  accentOrangeSurface: '#FFF3E0',
  accentOrangeMuted: '#FFCC80',

  // ── Backgrounds (organic brush-stroke feel) ──────────────
  backgroundPrimary: '#F6F1E9',     // richer warm earthy cream
  backgroundSecondary: '#EFE8DC',   // deeper warm earthy
  backgroundCard: '#FFFFFF',
  backgroundOverlay: 'rgba(0,0,0,0.45)',

  // Organic background brush blobs — enhanced opacity tints
  bgBlobOrange: 'rgba(245, 124, 0, 0.12)',
  bgBlobGreen: 'rgba(46, 125, 50, 0.12)',
  bgBlobOrangeStrong: 'rgba(245, 124, 0, 0.18)',
  bgBlobGreenStrong: 'rgba(46, 125, 50, 0.18)',

  // ── Text ─────────────────────────────────────────────────
  textPrimary: '#1A1C1E',
  textSecondary: '#5F6368',
  textMuted: '#9AA0A6',
  textOnGreen: '#FFFFFF',
  textOnOrange: '#FFFFFF',
  textPrice: '#1B5E20',             // strong green for price / net return
  textDemand: '#E65100',            // strong orange for demand highlight

  // ── Surfaces & Borders ───────────────────────────────────
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E3DCCF',
  borderLight: '#ECE6DC',
  divider: '#E5DFD4',

  // ── Semantic / Status ────────────────────────────────────
  success: '#2E7D32',
  successSurface: '#E8F5E9',
  warning: '#F57C00',
  warningSurface: '#FFF3E0',
  error: '#D32F2F',
  errorSurface: '#FFEBEE',
  info: '#1976D2',
  infoSurface: '#E3F2FD',

  // ── Navigation ───────────────────────────────────────────
  navSelected: '#2E7D32',
  navSelectedBg: '#E8F5E9',
  navUnselected: '#9AA0A6',
  navBackground: '#FFFFFF',

  // ── Misc ─────────────────────────────────────────────────
  skeleton: '#E8E8E8',
  skeletonHighlight: '#F5F5F5',
  disabled: '#BDBDBD',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type MKColorKey = keyof typeof MKColors;
