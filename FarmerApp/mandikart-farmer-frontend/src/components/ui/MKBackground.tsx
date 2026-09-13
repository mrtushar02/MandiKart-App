/**
 * MandiKart — MKBackground Component (High Intensity Ambient + Fast Performance)
 * 
 * Implements the approved organic background visual identity:
 * Soft warm base + vibrant, high-intensity orange and green ambient glows.
 * Optimized with React.memo to prevent unnecessary SVG re-renders.
 */

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

interface MKBackgroundProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disableSafeArea?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Memoized SVG background layer to guarantee 60fps and instant touch responses
const AmbientGlowSvg = React.memo(() => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg height="100%" width="100%" viewBox={`0 0 ${SCREEN_WIDTH} ${SCREEN_HEIGHT}`}>
      <Defs>
        {/* Top-Left Rich Vibrant Harvest Amber & Saffron Ambient Glow */}
        <RadialGradient
          id="orangeAura"
          cx="15%"
          cy="6%"
          rx="85%"
          ry="65%"
          fx="15%"
          fy="6%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.38" />
          <Stop offset="35%" stopColor="#EA580C" stopOpacity="0.22" />
          <Stop offset="70%" stopColor="#FB923C" stopOpacity="0.10" />
          <Stop offset="100%" stopColor="#FBF9F5" stopOpacity="0" />
        </RadialGradient>

        {/* Bottom-Right Rich Growth Emerald & Kisan Green Glow */}
        <RadialGradient
          id="greenAura"
          cx="85%"
          cy="90%"
          rx="90%"
          ry="70%"
          fx="85%"
          fy="90%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#10B981" stopOpacity="0.42" />
          <Stop offset="40%" stopColor="#059669" stopOpacity="0.25" />
          <Stop offset="75%" stopColor="#34D399" stopOpacity="0.12" />
          <Stop offset="100%" stopColor="#FBF9F5" stopOpacity="0" />
        </RadialGradient>

        {/* Center-Right Warm Sunlight Golden-Green Aura */}
        <RadialGradient
          id="sunlightAura"
          cx="65%"
          cy="38%"
          rx="65%"
          ry="50%"
          fx="65%"
          fy="38%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#F97316" stopOpacity="0.18" />
          <Stop offset="45%" stopColor="#10B981" stopOpacity="0.15" />
          <Stop offset="100%" stopColor="#FBF9F5" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Crisp Ultra-Modern Canvas Base */}
      <Rect x="0" y="0" width="100%" height="100%" fill="#FAF8F5" />

      {/* High-Intensity Modern Ambient Glows */}
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#orangeAura)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#greenAura)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#sunlightAura)" />
    </Svg>
  </View>
));

export const MKBackground: React.FC<MKBackgroundProps> = ({
  children,
  style,
  disableSafeArea = false,
}) => {
  const content = (
    <View style={[styles.container, style]}>
      <AmbientGlowSvg />
      {/* Main Content Layer */}
      <View style={styles.contentLayer}>{children}</View>
    </View>
  );

  if (disableSafeArea) {
    return content;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: '#FAF8F5',
  },
  contentLayer: {
    flex: 1,
    width: '100%',
    zIndex: 1,
  },
});
