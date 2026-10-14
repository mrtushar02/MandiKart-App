import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import { SAMPLE_PRODUCTS } from '../../services/mockData';
import { Farmer, Product } from '../../types';
import PrimaryButton from '../../components/PrimaryButton';

export default function FarmerProfileScreen({ navigation, route }: any) {
  const farmerParam: Farmer | undefined = route?.params?.farmer;
  const farmer: Farmer = farmerParam || (SAMPLE_PRODUCTS[0]?.farmer) || {
    id: 'farmer-default',
    name: 'Verified Local Farmer',
    location: 'Agri Hub Depot',
    state: 'India',
    rating: 4.8,
    reviewCount: 0,
    isVerified: true,
    totalProducts: 0,
    memberSince: '2024',
  };

  // Filter products grown by this farmer or sample set
  const farmerProducts: Product[] = SAMPLE_PRODUCTS.filter(
    (p) => p.farmer?.id === farmer.id || p.farmer?.name === farmer.name
  );
  const displayProducts = farmerProducts;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmer Profile</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ChatStack', { screen: 'Chat', params: { farmerName: farmer.name } })}
          style={styles.chatHeaderBtn}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Banner & Hero Info */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            {farmer.avatar ? (
              <Image source={{ uri: farmer.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{farmer.name.charAt(0)}</Text>
              </View>
            )}
            {farmer.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
              </View>
            )}
          </View>

          <Text style={styles.farmerName}>{farmer.name}</Text>
          <Text style={styles.locationText}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            {' '}{farmer.location}, {farmer.state || 'India'}
          </Text>

          {/* Stats Bar */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <View style={styles.statRow}>
                <Ionicons name="star" size={16} color={Colors.accent} />
                <Text style={styles.statValue}>{farmer.rating || 4.8}</Text>
              </View>
              <Text style={styles.statLabel}>Rating ({farmer.reviewCount || 42})</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{farmer.totalProducts || displayProducts.length}</Text>
              <Text style={styles.statLabel}>Crops Listed</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{farmer.memberSince || '2021'}</Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
          </View>
        </View>

        {/* Quality Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification & Badges</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badgeChip}>
              <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
              <Text style={styles.badgeChipText}>Organic Certified</Text>
            </View>
            <View style={styles.badgeChip}>
              <Ionicons name="leaf" size={16} color="#0284C7" />
              <Text style={styles.badgeChipText}>Direct Producer</Text>
            </View>
            <View style={styles.badgeChip}>
              <Ionicons name="ribbon" size={16} color="#D97706" />
              <Text style={styles.badgeChipText}>Top Quality Grade</Text>
            </View>
          </View>
        </View>

        {/* About Farmer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Farm</Text>
          <Text style={styles.aboutText}>
            {farmer.about ||
              `${farmer.name} produces high-quality, naturally harvested crops using eco-friendly farming practices in ${farmer.location}. Dedicated to providing direct farm-to-table freshness with guaranteed zero chemical residue.`}
          </Text>
        </View>

        {/* Farmer's Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Crops Harvested ({displayProducts.length})</Text>
          </View>

          {displayProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => navigation.navigate('ProductDetails', { productId: product.id, product })}
              activeOpacity={0.9}
            >
              <Image source={{ uri: product.imageUrl }} style={styles.productImg} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDesc} numberOfLines={1}>{product.description}</Text>
                <View style={styles.productPriceRow}>
                  <Text style={styles.productPrice}>₹{product.price}<Text style={styles.unit}> / {product.unit}</Text></Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={Colors.accent} />
                    <Text style={styles.ratingVal}>{product.rating}</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title={`💬 Message ${farmer.name.split(' ')[0]}`}
          onPress={() => navigation.navigate('ChatStack', { screen: 'Chat', params: { farmerName: farmer.name } })}
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  chatHeaderBtn: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },
  heroCard: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: Colors.primaryLight },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 32, fontWeight: '700', color: Colors.primary },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 2,
    ...Shadows.sm,
  },
  farmerName: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  locationText: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  statBox: { alignItems: 'center' },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  divider: { width: 1, height: 28, backgroundColor: Colors.gray200 },
  section: { marginTop: Spacing.md, paddingHorizontal: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  badgeChipText: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  aboutText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  productImg: { width: 64, height: 64, borderRadius: BorderRadius.md, backgroundColor: Colors.gray100 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  productDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  productPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  productPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  unit: { fontSize: 11, fontWeight: '400', color: Colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingVal: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.md,
  },
});
