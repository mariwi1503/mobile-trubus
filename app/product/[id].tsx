import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { PRODUCTS } from '../../data/products';
import { useApp } from '../../context/AppContext';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { addToCart, wishlist, toggleWishlist, getCartCount } = useApp();
  const product = PRODUCTS.find(p => p.id === id);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return <View style={styles.container}><Text>Produk tidak ditemukan</Text></View>;
  }

  const isWished = wishlist.includes(product.id);
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const relatedProducts = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      weight: product.weight,
      store: product.store,
    });
    Alert.alert('Berhasil', `${product.name} ditambahkan ke keranjang`, [
      { text: 'Lanjut Belanja', style: 'cancel' },
      { text: 'Lihat Keranjang', onPress: () => router.push('/cart') },
    ]);
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
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/cart')}>
            <Ionicons name="cart-outline" size={22} color={COLORS.text} />
            {getCartCount() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getCartCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <Image source={{ uri: product.image }} style={styles.productImage} />

        {/* Product Info */}
        <View style={styles.infoSection}>
          {discount > 0 && (
            <View style={styles.discountRow}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discount}% OFF</Text>
              </View>
              <Text style={styles.originalPrice}>Rp {product.originalPrice?.toLocaleString('id-ID')}</Text>
            </View>
          )}
          <Text style={styles.price}>Rp {product.price.toLocaleString('id-ID')}</Text>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color={COLORS.warning} />
              <Text style={styles.metaText}>{product.rating} ({product.sold} terjual)</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="cube-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>Stok: {product.stock}</Text>
            </View>
          </View>
        </View>

        {/* Store Info */}
        <View style={styles.storeCard}>
          <View style={styles.storeIcon}>
            <Ionicons name="storefront" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{product.store}</Text>
            <Text style={styles.storeLocation}>Berat: {product.weight >= 1000 ? `${product.weight/1000} kg` : `${product.weight} g`}</Text>
          </View>
          <TouchableOpacity style={styles.visitStoreBtn}>
            <Text style={styles.visitStoreText}>Kunjungi</Text>
          </TouchableOpacity>
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
      <View style={styles.bottomBar}>
        <View style={styles.quantityControl}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Ionicons name="remove" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}>
            <Ionicons name="add" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Ionicons name="cart" size={18} color={COLORS.white} />
          <Text style={styles.addToCartText}>Tambah ke Keranjang</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, marginTop: -20,
  },
  discountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  discountBadge: { backgroundColor: '#FFEBEE', borderRadius: RADIUS.xs, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 },
  discountText: { color: COLORS.accent, fontSize: 11, fontWeight: '700' },
  originalPrice: { fontSize: 13, color: COLORS.textLight, textDecorationLine: 'line-through' },
  price: { fontSize: 24, fontWeight: '700', color: COLORS.primaryDark },
  productName: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginTop: 8, lineHeight: 22 },
  metaRow: { flexDirection: 'row', marginTop: 10, gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  storeCard: {
    backgroundColor: COLORS.white, marginTop: 2, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    flexDirection: 'row', alignItems: 'center',
  },
  storeIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  storeInfo: { flex: 1, marginLeft: SPACING.md },
  storeName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  storeLocation: { fontSize: 12, color: COLORS.textSecondary },
  visitStoreBtn: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: 12, paddingVertical: 6 },
  visitStoreText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
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
