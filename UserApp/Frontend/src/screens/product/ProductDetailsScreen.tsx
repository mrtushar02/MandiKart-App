import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import QuantitySelector from '../../components/QuantitySelector';
import FarmerCard from '../../components/FarmerCard';

import NegotiationModal from '../../components/NegotiationModal';
import { Product } from '../../types';
import { useLocation } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCatalog } from '../../context/CatalogContext';
import FloatingCartBanner from '../../components/FloatingCartBanner';

import { getFallbackProductImage } from '../../utils/imageUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductStack'>;

export default function ProductDetailsScreen({ navigation, route }: any) {
  const productParam = route.params?.product;
  const productId = route.params?.productId || productParam?.id;
  const { getProductById } = useCatalog();
  const product = productParam || (productId ? getProductById(productId) : null) || null;
  const { currentAddress } = useLocation();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [imgUri, setImgUri] = useState<string>(product?.imageUrl || '');

  if (!product) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textSecondary} />
        <Text style={{ fontSize: 16, color: Colors.textSecondary, marginTop: Spacing.md }}>
          Product details unavailable.
        </Text>
        <TouchableOpacity style={{ marginTop: Spacing.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, backgroundColor: Colors.primary, borderRadius: BorderRadius.md }} onPress={() => navigation.goBack()}>
          <Text style={{ color: Colors.white, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const favorited = isWishlisted(product.id);
  const activeImage = imgUri || product.imageUrl || getFallbackProductImage(product.category, product.name);

  const handleAddToCart = () => {
    addToCart(product, qty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Image & Header */}
        <View style={styles.imageHeader}>
          <Image
            source={{ uri: activeImage }}
            style={styles.image}
            onError={() => {
              const fallback = getFallbackProductImage(product.category, product.name);
              if (activeImage !== fallback) {
                setImgUri(fallback);
              }
            }}
          />
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleWishlist(product)} style={styles.iconBtn}>
              <Ionicons name={favorited ? "heart" : "heart-outline"} size={24} color={favorited ? Colors.error : Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{product.name}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={Colors.white} />
              <Text style={styles.ratingText}>{product.rating}</Text>
            </View>
          </View>
          <Text style={styles.priceRow}>
            <Text style={styles.price}>₹{product.price}</Text>
            <Text style={styles.unit}> / {product.unit}</Text>
          </Text>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.desc}>{product.description}</Text>

          {/* User Proximity & Delivery Speed Badge */}
          <View style={styles.proximityCard}>
            <View style={styles.proximityIconCircle}>
              <Ionicons name="location" size={16} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.proximityTitle}>
                Deliver to {currentAddress?.city ? `${currentAddress.area || currentAddress.city}` : 'Your Location'}
              </Text>
              <Text style={styles.proximitySub}>
                ~38 km from {product.farmer?.name || 'Farm'} • Express cold-chain slot available
              </Text>
            </View>
          </View>
        </View>

        {/* Farmer Info */}
        <View style={styles.farmerSection}>
          <Text style={styles.sectionTitle}>Grown by</Text>
          <FarmerCard
            farmer={product.farmer}
            onPress={() => navigation.navigate('FarmerProfile', { farmer: product.farmer })}
            onChat={() => navigation.navigate('ChatStack', { screen: 'Chat', params: { farmerName: product.farmer?.name } })}
          />
        </View>

        {/* Reviews (Preview) */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>Reviews ({product.reviewCount})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ReviewList', { productId: product.id })}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {/* Mock review */}
          <View style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <Text style={styles.reviewUser}>Anil Kumar</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={12} color={Colors.accent} />
                ))}
              </View>
            </View>
            <Text style={styles.reviewText}>Very fresh and good quality. Delivered on time.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.qtyWrap}>
          <QuantitySelector quantity={qty} onIncrease={() => setQty(qty + 1)} onDecrease={() => setQty(qty - 1)} />
        </View>
        <TouchableOpacity
          style={styles.negotiateBtn}
          onPress={() => setIsNegotiating(true)}
        >
          <Ionicons name="pricetags-outline" size={18} color={Colors.primary} />
          <Text style={styles.negotiateBtnText}>Negotiate</Text>
        </TouchableOpacity>
        <PrimaryButton
          title={justAdded ? `✓ Added ${qty} to Cart!` : `Add to Cart • ₹${(product.price * qty).toLocaleString('en-IN')}`}
          onPress={handleAddToCart}
          style={{ ...styles.addBtn, ...(justAdded ? { backgroundColor: '#15803D' } : {}) }}
        />
      </View>

      <FloatingCartBanner bottomOffset={82} />

      <NegotiationModal
        visible={isNegotiating}
        product={product}
        initialQuantity={qty}
        onClose={() => setIsNegotiating(false)}
        onOfferSubmitted={(offer: any) => {
          const navParams = {
            id: offer?.id,
            negotiationId: offer?.id,
            farmerName: product.farmer?.name || (product as any).farmerName || 'Ramesh Patel',
            cropName: product.name,
            productImage: product.images?.[0] || product.imageUrl,
            offeredPrice: offer?.offeredPrice,
            originalPrice: offer?.originalPrice || product.price,
            quantity: offer?.quantity || qty,
            unit: offer?.unit || product.unit || 'kg',
            offer,
          };
          navigation.navigate('Chat', navParams);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  imageHeader: { height: 320, width: '100%', position: 'relative' },
  image: { width: '100%', height: '100%', backgroundColor: Colors.gray100 },
  headerActions: { position: 'absolute', top: 50, left: Spacing.md, right: Spacing.md, flexDirection: 'row', justifyContent: 'space-between' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  infoSection: { backgroundColor: 'transparent', padding: Spacing.lg, borderBottomLeftRadius: BorderRadius.xl, borderBottomRightRadius: BorderRadius.xl, ...Shadows.sm },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { flex: 1, fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.full, gap: 4 },
  ratingText: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  priceRow: { marginTop: 8, marginBottom: Spacing.lg },
  price: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  unit: { fontSize: 16, color: Colors.textSecondary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  desc: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  farmerSection: { marginTop: Spacing.sm, backgroundColor: 'transparent', padding: Spacing.lg },
  reviewSection: { marginTop: Spacing.sm, backgroundColor: 'transparent', padding: Spacing.lg },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  seeAll: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
  reviewCard: { backgroundColor: Colors.gray50, padding: Spacing.md, borderRadius: BorderRadius.md },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewUser: { fontWeight: '600', color: Colors.textPrimary, fontSize: 14 },
  stars: { flexDirection: 'row', gap: 2 },
  reviewText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent', padding: Spacing.md, paddingBottom: 30, flexDirection: 'row', gap: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight, ...Shadows.md },
  qtyWrap: { justifyContent: 'center' },
  negotiateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  negotiateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  addBtn: { flex: 1 },
  proximityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: Spacing.md,
  },
  proximityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proximityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  proximitySub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});

