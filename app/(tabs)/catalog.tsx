import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import ProductCard from '../../components/ProductCard';
import SearchBar from '../../components/SearchBar';
import { useApp } from '../../context/AppContext';
import { useCartAnimation } from '../../context/CartAnimationContext';
import {
  getMobileProductCategories,
  getMobileProducts,
  resolveProductCategorySlug,
} from '../../lib/products';
import { Product, ProductCategory } from '../../types/product';

const SORT_OPTIONS = [
  { id: 'popular', name: 'Terlaris' },
  { id: 'newest', name: 'Terbaru' },
  { id: 'price_low', name: 'Harga Terendah' },
  { id: 'price_high', name: 'Harga Tertinggi' },
];

const STATIC_CATEGORY_OPTIONS: ProductCategory[] = [
  {
    id: 'all',
    name: 'Semua',
    slug: 'all',
    icon: 'apps',
    color: '#607D8B',
    bg: '#ECEFF1',
  },
];

function resolveCatalogCategory(
  category: string | undefined,
  categories: ProductCategory[],
) {
  if (!category) {
    return 'all';
  }

  const normalizedSlug = resolveProductCategorySlug(category);

  return categories.some((item) => item.slug === normalizedSlug)
    ? normalizedSlug
    : 'all';
}

export default function CatalogScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const { getCartCount } = useApp();
  const { setCartTarget } = useCartAnimation();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showSort, setShowSort] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const cartPulse = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const response = await getMobileProductCategories();

        if (!isMounted) {
          return;
        }

        setCategories(response);
      } catch {
        if (isMounted) {
          setCategories([]);
        }
      }
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSelectedCategory(resolveCatalogCategory(category, categories));
  }, [category, categories]);

  useEffect(() => {
    let isMounted = true;

    const selectedBackendCategory =
      selectedCategory !== 'all'
        ? categories.find((item) => item.slug === selectedCategory)
        : undefined;

    const loadProducts = async () => {
      try {
        setLoading(true);

        const response = await getMobileProducts({
          page: 1,
          perPage: 60,
          search: debouncedSearch || undefined,
          productCategoryId: selectedBackendCategory?.id,
        });

        if (!isMounted) {
          return;
        }

        setProducts(response.products);
        setError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setProducts([]);
        setError('Produk belum dapat dimuat dari backend.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [categories, debouncedSearch, reloadKey, selectedCategory]);

  const visibleProducts = useMemo(() => {
    let result = [...products];

    switch (sortBy) {
      case 'popular': result.sort((a, b) => b.sold - a.sold); break;
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );
        break;
      case 'price_low': result.sort((a, b) => a.price - b.price); break;
      case 'price_high': result.sort((a, b) => b.price - a.price); break;
    }

    return result;
  }, [products, selectedCategory, sortBy]);

  const categoryOptions = [...STATIC_CATEGORY_OPTIONS, ...categories];
  const isRefreshing = loading && products.length > 0;
  const triggerCartImpact = useCallback(() => {
    cartPulse.stopAnimation();
    cartPulse.setValue(0);
    Animated.sequence([
      Animated.timing(cartPulse, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cartPulse, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cartPulse]);
  const setCartTargetNode = useCallback((node: View | null) => {
    setCartTarget('default', node, triggerCartImpact);
  }, [setCartTarget, triggerCartImpact]);

  return (
    <View style={styles.container}>
      {/* 1. HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Katalog Produk</Text>
          <Animated.View
            style={[
              styles.cartBtnWrap,
              {
                transform: [
                  {
                    scale: cartPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.16],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity ref={setCartTargetNode} style={styles.cartBtn} onPress={() => router.push('/cart')}>
              <Ionicons name="cart-outline" size={24} color={COLORS.white} />
              {getCartCount() > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{getCartCount()}</Text>
                </View>
              )}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.cartImpactGlow,
                  {
                    opacity: cartPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.3],
                    }),
                    transform: [
                      {
                        scale: cartPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.7, 1.22],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </TouchableOpacity>
          </Animated.View>
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
          {categoryOptions.map((cat) => (
            <TouchableOpacity
              key={cat.slug}
              style={[
                styles.catChip,
                { backgroundColor: cat.bg, borderColor: cat.color },
                selectedCategory === cat.slug && { backgroundColor: cat.color }
              ]}
              onPress={() => setSelectedCategory(cat.slug)}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.slug ? COLORS.white : cat.color}
              />
              <Text style={[
                styles.catChipText,
                { color: cat.color },
                selectedCategory === cat.slug && { color: '#FFFFFF' }
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. FILTER & SORT BAR */}
      <View style={styles.filterBar}>
        <Text style={styles.resultCount}>{visibleProducts.length} Produk ditemukan</Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(!showSort)}>
          <Ionicons name="funnel-outline" size={14} color={COLORS.primary} />
          <Text style={styles.sortBtnText}>{SORT_OPTIONS.find(s => s.id === sortBy)?.name}</Text>
          <Ionicons name={showSort ? "chevron-up" : "chevron-down"} size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 4. PRODUCT LIST */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={visibleProducts}
          keyExtractor={(item) => item.id}
          key={'3cols'}
          numColumns={3}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => setReloadKey((current) => current + 1)}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard product={item} fullWidth />
            </View>
          )}
          ListHeaderComponent={
            loading && products.length === 0 ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Memuat produk...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Ionicons
                  name={error ? 'cloud-offline-outline' : 'search-outline'}
                  size={48}
                  color={COLORS.textLight}
                />
                <Text style={styles.emptyText}>
                  {error || 'Produk tidak ditemukan'}
                </Text>
              </View>
            ) : null
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
  cartBtnWrap: { borderRadius: 999 },
  cartBtn: { position: 'relative' },
  cartImpactGlow: {
    position: 'absolute',
    top: -8,
    right: -8,
    bottom: -8,
    left: -8,
    borderRadius: 999,
    backgroundColor: COLORS.white,
  },
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
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 10,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  columnWrapper: {
    gap: SPACING.sm,
  },
  cardWrapper: {
    flex: 1,
    maxWidth: '31.5%',
    marginBottom: SPACING.sm
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
