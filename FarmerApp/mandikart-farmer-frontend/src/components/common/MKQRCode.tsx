/**
 * MandiKart — Vector QR Code Generator (MKQRCode)
 *
 * Uses robust 'qrcode-generator' engine with automated version sizing (1-40)
 * and Level M error correction. Renders an ultra-sharp single-path vector SVG.
 * Works flawlessly across Android, iOS, and Web.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import qrcode from 'qrcode-generator';

export interface MKQRCodeProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  quietZone?: number;
}

export function MKQRCode({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
  quietZone = 2,
}: MKQRCodeProps) {
  const { pathData, totalSize } = useMemo(() => {
    try {
      const qrValue = value && value.trim() ? value.trim() : 'mandikart';
      // 0 means auto version detection (supports up to version 40), 'M' is medium error correction (~15%)
      const qr = qrcode(0, 'M');
      qr.addData(qrValue);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const total = moduleCount + quietZone * 2;
      let d = '';

      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.isDark(r, c)) {
            const x = c + quietZone;
            const y = r + quietZone;
            d += `M${x},${y}h1v1h-1z `;
          }
        }
      }

      return { pathData: d, totalSize: total };
    } catch (e) {
      console.warn('MKQRCode generation error:', e);
      // Fallback to simple mandikart URL
      try {
        const qr = qrcode(0, 'L');
        qr.addData('https://mandikart.in');
        qr.make();
        const moduleCount = qr.getModuleCount();
        const total = moduleCount + quietZone * 2;
        let d = '';
        for (let r = 0; r < moduleCount; r++) {
          for (let c = 0; c < moduleCount; c++) {
            if (qr.isDark(r, c)) {
              d += `M${c + quietZone},${r + quietZone}h1v1h-1z `;
            }
          }
        }
        return { pathData: d, totalSize: total };
      } catch {
        return { pathData: '', totalSize: 25 };
      }
    }
  }, [value, quietZone]);

  if (!pathData) {
    return (
      <View
        style={[
          styles.wrapper,
          { width: size, height: size, backgroundColor, borderColor: '#E2E8F0', borderWidth: 1 },
        ]}
      />
    );
  }

  return (
    <View style={[styles.wrapper, { width: size, height: size, backgroundColor }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${totalSize} ${totalSize}`}>
        <Rect x={0} y={0} width={totalSize} height={totalSize} fill={backgroundColor} />
        <Path d={pathData} fill={color} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default MKQRCode;
