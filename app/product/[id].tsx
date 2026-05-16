import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useCartAnimation } from '../../context/CartAnimationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMobileProductById, getMobileProducts } from '../../lib/products';
import { Product } from '../../types/product';
import AddToCartButton from '../../components/AddToCartButton';

async function loadProductDetailData(productId: string) {
  const currentProduct = await getMobileProductById(productId);
  let relatedProducts: Product[] = [];

  try {
    const relatedResponse = await getMobileProducts({
      page: 1,
      perPage: 8,
      productCategoryId: currentProduct.categoryId,
    });

    relatedProducts = relatedResponse.products
      .filter((candidate) => candidate.id !== currentProduct.id)
      .slice(0, 4);
  } catch {
    relatedProducts = [];
  }

  return {
    product: currentProduct,
    relatedProducts,
  };
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addToCart, isLoggedIn, wishlist, toggleWishlist, getCartCount } = useApp();
  const { setCartTarget, animateToCart } = useCartAnimation();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const productId = Array.isArray(id) ? id[0] : id;
  const cartCount = getCartCount();
  const productImageRef = useRef<View | null>(null);
  const cartImpactAnim = useRef(new Animated.Value(0)).current;
  const triggerCartImpact = useCallback(() => {
    cartImpactAnim.stopAnimation();
    cartImpactAnim.setValue(0);
    Animated.sequence([
      Animated.timing(cartImpactAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cartImpactAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cartImpactAnim]);
  const setCartTargetNode = useCallback((node: View | null) => {
    setCartTarget('default', node, triggerCartImpact);
  }, [setCartTarget, triggerCartImpact]);

  useEffect(() => {
    let isMounted = true;

    const loadProduct = async () => {
      if (!productId) {
        if (isMounted) {
          setError('Produk tidak ditemukan');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const nextData = await loadProductDetailData(productId);

        if (!isMounted) {
          return;
        }

        setProduct(nextData.product);
        setRelatedProducts(nextData.relatedProducts);
        setError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setProduct(null);
        setRelatedProducts([]);
        setError('Produk tidak ditemukan');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>Memuat produk...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{error || 'Produk tidak ditemukan'}</Text>
      </View>
    );
  }

  const isWished = wishlist.includes(product.id);
  const imageSource = typeof product.originalImage === 'string'
    ? { uri: product.originalImage }
    : product.originalImage;

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      router.push({ pathname: '/(tabs)/profile', params: { login: '1' } });
      return false;
    }

    return addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      weight: product.weight,
      store: product.store,
    });
  };

  const handleRefresh = async () => {
    if (!productId) {
      return;
    }

    setRefreshing(true);

    try {
      const nextData = await loadProductDetailData(productId);
      setProduct(nextData.product);
      setRelatedProducts(nextData.relatedProducts);
      setError(null);
    } catch {
      setError('Produk tidak dapat diperbarui saat ini');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => toggleWishlist(product.id)}>
            <Ionicons name={isWished ? 'heart' : 'heart-outline'} size={22} color={isWished ? COLORS.accent : COLORS.text} />
          </TouchableOpacity>
          <Animated.View
            style={{
              transform: [
                {
                  scale: cartImpactAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.16],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity ref={setCartTargetNode} style={styles.headerBtn} onPress={() => router.push('/cart')}>
              <Ionicons name="cart-outline" size={22} color={COLORS.text} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.cartImpactGlow,
                  {
                    opacity: cartImpactAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.22],
                    }),
                    transform: [
                      {
                        scale: cartImpactAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.72, 1.2],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Product Image */}
        <View ref={productImageRef}>
          <Image source={imageSource} style={styles.productImage} />
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.price}>Rp {product.price.toLocaleString('id-ID')}</Text>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color={COLORS.warning} />
              <Text style={styles.metaText}>{product.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="bag-check-outline" size={14} color={COLORS.primary} />
              <Text style={styles.metaText}>{product.sold.toLocaleString('id-ID')} terjual</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="grid-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{product.category}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="scale-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>
                {product.weight >= 1000
                  ? `${product.weight / 1000} kg`
                  : `${product.weight} g`} • UOM {product.uom}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descSection}>
          <Text style={styles.descTitle}>Deskripsi Produk</Text>
          <Text style={styles.descText}>{product.description}</Text>
        </View>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Produk Serupa</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {relatedProducts.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.relatedCard}
                  onPress={() => router.push(`/product/${p.id}`)}
                >
                  <Image source={{ uri: p.image }} style={styles.relatedImage} />
                  <Text style={styles.relatedName} numberOfLines={2}>{p.name}</Text>
                  <Text style={styles.relatedPrice}>Rp {p.price.toLocaleString('id-ID')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <View style={styles.quantityControl}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Ionicons name="remove" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
            <Ionicons name="add" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <AddToCartButton
          label="Tambah ke Keranjang"
          loadingLabel="Menambahkan..."
          idleIcon="cart"
          iconSize={18}
          containerStyle={styles.addToCartBtn}
          textStyle={styles.addToCartText}
          disableSuccessFeedback
          onAdd={handleAddToCart}
          onSuccess={async () => {
            await animateToCart({
              sourceNode: productImageRef.current,
              imageSource,
            });
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 48, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.small, position: 'relative',
  },
  cartImpactGlow: {
    position: 'absolute',
    top: -8,
    right: -8,
    bottom: -8,
    left: -8,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  cartBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: COLORS.accent, borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  cartBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  productImage: { width: '100%', height: 320, backgroundColor: '#f0f0f0' },
  infoSection: {
    backgroundColor: COLORS.white, padding: SPACING.lg,
    borderTopLeftRadius: RADIUS.md, borderTopRightRadius: RADIUS.md, marginTop: -20,
  },
  price: { fontSize: 24, fontWeight: '700', color: COLORS.primaryDark },
  productName: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 8, lineHeight: 22 },
  metaRow: { flexDirection: 'row', marginTop: 10, gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  descSection: { backgroundColor: COLORS.white, marginTop: 8, padding: SPACING.lg },
  descTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  descText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  relatedSection: { padding: SPACING.lg },
  relatedTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  relatedCard: {
    width: 130, backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    marginRight: SPACING.md, ...SHADOWS.small, overflow: 'hidden',
  },
  relatedImage: { width: '100%', height: 100, backgroundColor: '#f0f0f0' },
  relatedName: { fontSize: 11, fontWeight: '500', color: COLORS.text, padding: 8, paddingBottom: 2 },
  relatedPrice: { fontSize: 12, fontWeight: '700', color: COLORS.primaryDark, paddingHorizontal: 8, paddingBottom: 8 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.divider, paddingBottom: 24,
  },
  quantityControl: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm,
    marginRight: SPACING.md,
  },
  qtyBtn: { padding: 10 },
  qtyText: { fontSize: 16, fontWeight: '700', color: COLORS.text, paddingHorizontal: 12 },
  addToCartBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14,
  },
  addToCartText: { color: COLORS.white, fontSize: 15, fontWeight: '700', marginLeft: 8 },
});
