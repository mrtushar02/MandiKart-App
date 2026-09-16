import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, BorderRadius, Spacing, Shadows } from '../theme';
import { useCart } from '../context/CartContext';

interface Props {
  bottomOffset?: number;
}

export default function FloatingCartBanner({ bottomOffset = 65 }: Props) {
  const navigation = useNavigation<any>();
  const { totalItemsCount, total, subtotal, couponSavings } = useCart();

  if (totalItemsCount === 0) return null;

  const handlePress = () => {
    navigation.navigate('Main', { screen: 'Cart' });
  };

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <TouchableOpacity
        style={styles.banner}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.leftRow}>
          <View style={styles.cartIconCircle}>
            <Ionicons name="cart" size={18} color={Colors.white} />
            <View style={styles.itemBadge}>
              <Text style={styles.itemBadgeText}>{totalItemsCount}</Text>
            </View>
          </View>
          <View style={styles.textCol}>
            <Text style={styles.itemCountText}>
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} • ₹{total.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.subtext}>
              {couponSavings > 0 ? `Saved ₹${couponSavings} with coupon` : 'Fresh from nearby Mandis'}
            </Text>
          </View>
        </View>

        <View style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>View Cart</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 999,
  },
  banner: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  itemBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  itemBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  textCol: {
    justifyContent: 'center',
  },
  itemCountText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  subtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  actionBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
