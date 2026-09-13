import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Shadows } from '../theme';
import { Product } from '../types';
import { getFallbackProductImage } from '../utils/imageUtils';

interface Props {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
  onWishlistToggle?: () => void;
  isWishlisted?: boolean;
}

export default function ProductCard({
  product,
  onPress,
  onAddToCart,
  onWishlistToggle,
  isWishlisted,
}: Props) {
  const [hasImgError, setHasImgError] = useState(false);

  React.useEffect(() => {
    setHasImgError(false);
  }, [product.imageUrl]);

  const displayImage = hasImgError
    ? getFallbackProductImage(product.category, product.name)
    : (product.imageUrl || getFallbackProductImage(product.category, product.name));

  const discountedPrice = product.discount
    ? Math.round(product.price * (1 - product.discount / 100))
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: displayImage }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setHasImgError(true)}
        />
        {/* Badges */}
        <View style={styles.badgeRow}>
          {product.isOrganic && (
            <View style={[styles.badge, styles.organicBadge]}>
              <Text style={styles.badgeText}>Organic</Text>
            </View>
          )}
          {product.isFreshDeal && (
            <View style={[styles.badge, styles.freshBadge]}>
              <Text style={styles.badgeText}>Fresh Deal</Text>
            </View>
          )}
        </View>
        {/* Wishlist button */}
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={onWishlistToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={isWishlisted ? Colors.error : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.farmerName} numberOfLines={1}>
          {product.farmer?.name || 'Verified Farmer'}
        </Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={11} color={Colors.accent} />
          <Text style={styles.rating}>{product.rating}</Text>
          <Text style={styles.reviewCount}>({product.reviewCount})</Text>
        </View>

        <View style={styles.priceRow}>
          <View style={{ flex: 1, minWidth: 0, marginRight: 6 }}>
            <Text style={styles.price} numberOfLines={1}>
              ₹{discountedPrice ?? product.price}
              <Text style={styles.unit}>/{product.unit}</Text>
            </Text>
            {discountedPrice && (
              <Text style={styles.originalPrice} numberOfLines={1}>₹{product.price}</Text>
            )}
          </View>
          {onAddToCart && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={onAddToCart}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 130,
    backgroundColor: Colors.gray100,
  },
  badgeRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  organicBadge: {
    backgroundColor: Colors.primary,
  },
  freshBadge: {
    backgroundColor: Colors.accent,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.white,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    padding: 5,
    ...Shadows.sm,
  },
  info: {
    padding: Spacing.sm,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
    minHeight: 36,
  },
  farmerName: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  rating: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  reviewCount: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accent,
  },
  unit: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  originalPrice: {
    fontSize: 11,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
