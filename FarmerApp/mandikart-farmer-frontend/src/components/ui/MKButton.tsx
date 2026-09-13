/**
 * MandiKart — MKButton Component
 * 
 * Production-quality 3D tactile button with smooth press feedback,
 * high-contrast typography, and consistent touch targets (minimum 48px).
 */

import React, { useRef } from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
type ButtonSize = 'md' | 'lg' | 'sm';

interface MKButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const MKButton: React.FC<MKButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      opacity: disabled ? 0.6 : 1,
      width: fullWidth ? '100%' : 'auto',
    };

    // Size - Use minHeight + paddingVertical so multiline text/font scaling never clips
    if (size === 'lg') {
      base.minHeight = 56;
      base.paddingVertical = 14;
      base.paddingHorizontal = 24;
    } else if (size === 'md') {
      base.minHeight = 48;
      base.paddingVertical = 12;
      base.paddingHorizontal = 20;
    } else {
      base.minHeight = 38;
      base.paddingVertical = 8;
      base.paddingHorizontal = 14;
      base.borderRadius = 10;
    }

    // Variant
    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: '#1E5A2A',
          shadowColor: '#16481A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 5,
        };
      case 'accent':
        return {
          ...base,
          backgroundColor: '#EF7D1A',
          shadowColor: '#EF7D1A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 5,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: '#FFFFFF',
          borderWidth: 1.5,
          borderColor: '#1E5A2A',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 2,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: '#D8D4CA',
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: '700',
      letterSpacing: 0.5,
      textAlign: 'center',
    };

    if (size === 'lg') {
      base.fontSize = 15;
    } else if (size === 'md') {
      base.fontSize = 14;
    } else {
      base.fontSize = 13;
    }

    switch (variant) {
      case 'primary':
      case 'accent':
        return { ...base, color: '#FFFFFF' };
      case 'secondary':
        return { ...base, color: '#1E5A2A' };
      case 'outline':
      case 'ghost':
        return { ...base, color: '#2B2B2B' };
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { width: '100%' }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[getContainerStyle(), style]}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' || variant === 'accent' ? '#FFFFFF' : '#1E5A2A'}
            aria-label="Loading"
            accessibilityLabel="Loading"
          />
        ) : (
          <View style={styles.innerContent}>
            {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}
            <Text style={[getTextStyle(), styles.buttonText, textStyle]}>{title}</Text>
            {rightIcon && <View style={styles.rightIconWrapper}>{rightIcon}</View>}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  innerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  buttonText: {
    flexShrink: 1,
  },
  leftIconWrapper: {
    marginRight: 8,
    flexShrink: 0,
  },
  rightIconWrapper: {
    marginLeft: 8,
    flexShrink: 0,
  },
});
