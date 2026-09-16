import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors, Spacing } from '../../theme';
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';
import { useCatalog } from '../../context/CatalogContext';
import { useCart } from '../../context/CartContext';
import FloatingCartBanner from '../../components/FloatingCartBanner';
import { Product } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductStack'>;

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const { products } = useCatalog();
  const { addToCart } = useCart();

  const results = query.length > 1
    ? products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.farmer?.name?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search products, farmers..." autoFocus style={{ flex: 1 }} />
      </View>

      {query.length === 0 && (
        <View style={styles.hintSection}>
          <Text style={styles.hintTitle}>Popular Searches</Text>
          {['Tomatoes', 'Mangoes', 'Basmati Rice', 'Organic Vegetables'].map((t) => (
            <TouchableOpacity key={t} style={styles.tag} onPress={() => setQuery(t)}>
              <Ionicons name="trending-up-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.tagText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {query.length > 1 && (
        <FlatList
          data={results}
          numColumns={2}
          keyExtractor={(p) => p.id}
          contentContainerStyle={[styles.grid, { paddingBottom: 90 }]}
          columnWrapperStyle={{ gap: Spacing.sm }}
          ListEmptyComponent={<Text style={styles.noResults}>No results for "{query}"</Text>}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ProductCard
                product={item}
                onPress={() => navigation.navigate('ProductDetails', { productId: item.id, product: item })}
                onAddToCart={() => addToCart(item, 1)}
              />
            </View>
          )}
        />
      )}

      <FloatingCartBanner bottomOffset={12} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  hintSection: { padding: Spacing.md, gap: Spacing.sm },
  hintTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  tagText: { fontSize: 15, color: Colors.textPrimary },
  grid: { padding: Spacing.md, gap: Spacing.sm },
  noResults: { textAlign: 'center', padding: Spacing['2xl'], color: Colors.textSecondary, fontSize: 14 },
});

