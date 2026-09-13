/**
 * MandiKart — Google Authentication Button (MKGoogleButton)
 *
 * Implements the official Google Identity Brand Guidelines with UI UX Pro Max polish:
 * - Precise 4-color Google 'G' vector logo
 * - Tactile, accessible elevated button layout
 * - Support for sign-in, sign-up, and continue modes
 * - Loading indicator feedback and press animations
 */

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface MKGoogleButtonProps {
  onPress: () => void;
  title?: string;
  mode?: 'signin' | 'signup' | 'continue';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export function MKGoogleButton({
  onPress,
  title,
  mode = 'continue',
  loading = false,
  disabled = false,
  style,
}: MKGoogleButtonProps) {
  const getButtonText = () => {
    if (title) return title;
    switch (mode) {
      case 'signin':
        return 'Sign in with Google';
      case 'signup':
        return 'Sign up with Google';
      case 'continue':
      default:
        return 'Continue with Google';
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={getButtonText()}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color="#4285F4"
          style={styles.loader}
          aria-label="Loading Google authentication"
          accessibilityLabel="Loading Google authentication"
        />
      ) : (
        <GoogleLogo size={20} />
      )}
      <Text style={styles.text}>{getButtonText()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2D9CC',
    paddingHorizontal: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#1A1C1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    width: '100%',
  },
  buttonPressed: {
    backgroundColor: '#F9FAFB',
    borderColor: '#CBD5E1',
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loader: {
    marginRight: 4,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
});
