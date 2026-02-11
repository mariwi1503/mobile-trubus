import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { PRODUCTS, PRODUCT_CATEGORIES } from '../../data/products';
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';
import { useApp } from '../../context/AppContext';

const SORT_OPTIONS = [
  { id: 'popular', name: 'Terlaris' },
  { id: 'newest', name: 'Terbaru' },
  { id: 'price_low', name: 'Harga Terendah' },
  { id: 'price_high', name: 'Harga Tertinggi' },
  { id: 'rating', name: 'Rating Tertinggi' },
];

export default function CatalogScreen() {
  const router = useRouter();
  const { getCartCount } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showSort, setShowSort] = useState(false);

  const filteredProducts = useMemo(() => {
    let result = [...PRODUCTS];
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case 'popular': result.sort((a, b) => b.sold - a.sold); break;
      case 'price_low': result.sort((a, b) => a.price - b.price); break;
      case 'price_high': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
    }
    return result;
  }, [search, selectedCategory, sortBy]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Katalog Produk</Text>
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/cart')}>
            <Ionicons name="cart-outline" size={22} color={COLORS.white} />
            {getCartCount() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getCartCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Cari produk..." />
        </View>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
        {PRODUCT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons name={cat.icon as any} size={14} color={selectedCategory === cat.id ? COLORS.white : COLORS.primary} />
            <Text style={[styles.catChipText, selectedCategory === cat.id && styles.catChipTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort & Filter Bar */}
      <View style={styles.filterBar}>
        <Text style={styles.resultCount}>{filteredProducts.length} produk</Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(!showSort)}>
          <Ionicons name="swap-vertical" size={16} color={COLORS.primary} />
          <Text style={styles.sortBtnText}>{SORT_OPTIONS.find(s => s.id === sortBy)?.name}</Text>
          <Ionicons name={showSort ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown */}
      {showSort && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.sortOption, sortBy === option.id && styles.sortOptionActive]}
              onPress={() => { setSortBy(option.id); setShowSort(false); }}
            >
              <Text style={[styles.sortOptionText, sortBy === option.id && styles.sortOptionTextActive]}>
                {option.name}
              </Text>
              {sortBy === option.id && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 20 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <View style={{ width: '48%' }}>
            <ProductCard product={item} fullWidth />
          </View>
        )}

        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Produk tidak ditemukan</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, paddingTop: 48, paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  cartBtn: { position: 'relative', padding: 4 },
  cartBadge: {
    position: 'absolute', top: -2, right: -4,
    backgroundColor: COLORS.accent, borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  cartBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  searchWrap: {},
  catScroll: { marginTop: SPACING.md },
  catChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.full,
    paddingHorizontal: 14, paddingVertical: 8, marginRight: 8,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  catChipActive: { backgroundColor: COLORS.primary },
  catChipText: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginLeft: 4 },
  catChipTextActive: { color: COLORS.white },
  filterBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
  },
  resultCount: { fontSize: 13, color: COLORS.textSecondary },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  sortDropdown: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.md, ...SHADOWS.medium, marginBottom: SPACING.sm,
  },
  sortOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  sortOptionActive: { backgroundColor: COLORS.primaryBg },
  sortOptionText: { fontSize: 14, color: COLORS.text },
  sortOptionTextActive: { color: COLORS.primary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, marginTop: 12 },
});
