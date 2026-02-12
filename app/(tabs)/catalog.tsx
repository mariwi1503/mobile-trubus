import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { PRODUCTS, PRODUCT_CATEGORIES } from '../../data/products';
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

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
    // Sorting logic (menggunakan casting + untuk menghindari TS error aritmatika)
    switch (sortBy) {
      case 'popular': result.sort((a, b) => b.sold - a.sold); break;
      case 'price_low': result.sort((a, b) => +a.price - +b.price); break;
      case 'price_high': result.sort((a, b) => +b.price - +a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
    }
    return result;
  }, [search, selectedCategory, sortBy]);

  return (
    <View style={styles.container}>
      {/* 1. HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Katalog Produk</Text>
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/cart')}>
            <Ionicons name="cart-outline" size={24} color={COLORS.white} />
            {getCartCount() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getCartCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Cari produk favorit..." />
        </View>
      </View>

      {/* 2. CATEGORIES SECTION (Fixed Height: 60) */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScrollContent}
        >
          {PRODUCT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.id ? COLORS.white : COLORS.primary}
              />
              <Text style={[styles.catChipText, selectedCategory === cat.id && styles.catChipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. FILTER & SORT BAR */}
      <View style={styles.filterBar}>
        <Text style={styles.resultCount}>{filteredProducts.length} Produk ditemukan</Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(!showSort)}>
          <Ionicons name="funnel-outline" size={14} color={COLORS.primary} />
          <Text style={styles.sortBtnText}>{SORT_OPTIONS.find(s => s.id === sortBy)?.name}</Text>
          <Ionicons name={showSort ? "chevron-up" : "chevron-down"} size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 4. PRODUCT LIST */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard product={item} fullWidth />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Produk tidak ditemukan</Text>
            </View>
          }
        />

        {/* 5. SORT DROPDOWN (Overlay) */}
        {showSort && (
          <>
            <TouchableOpacity
              style={styles.overlay}
              activeOpacity={1}
              onPress={() => setShowSort(false)}
            />
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
                  {sortBy === option.id && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white
  },
  cartBtn: { position: 'relative' },
  cartBadge: {
    position: 'absolute', top: -5, right: -8,
    backgroundColor: COLORS.accent, borderRadius: 10, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: COLORS.primary
  },
  cartBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  searchWrap: {
    marginTop: 5
  },

  // FIXED CATEGORIES LAYOUT
  categoriesContainer: {
    height: 65, // Tinggi baris kategori dikunci
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  catScrollContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center', // Agar chip berada di tengah vertikal
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40, // Tinggi tombol chip dikunci
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    ...SHADOWS.small,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: 6
  },
  catChipTextActive: {
    color: COLORS.white
  },

  // FILTER BAR
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  resultCount: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500'
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  sortBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700'
  },

  // LIST & CARD LAYOUT
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 5,
    paddingBottom: 40
  },
  columnWrapper: {
    justifyContent: 'space-between'
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 5
  },

  // DROPDOWN OVERLAY
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 90,
  },
  sortDropdown: {
    position: 'absolute',
    top: 0,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    zIndex: 100,
    ...SHADOWS.medium,
    overflow: 'hidden'
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  sortOptionActive: { backgroundColor: '#F8F9FA' },
  sortOptionText: { fontSize: 14, color: COLORS.text },
  sortOptionTextActive: { color: COLORS.primary, fontWeight: '700' },

  empty: {
    alignItems: 'center',
    marginTop: 100
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 10,
    fontWeight: '500'
  },
});