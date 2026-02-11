import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { Product } from '../data/products';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  fullWidth?: boolean;
}


export default function ProductCard({ product, compact, fullWidth }: ProductCardProps) {

  const router = useRouter();
  const { addToCart, wishlist, toggleWishlist } = useApp();
  const isWished = wishlist.includes(product.id);
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  const handleAddToCart = (e: any) => {
    e.stopPropagation?.();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      weight: product.weight,
      store: product.store,
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact, fullWidth && styles.cardFullWidth]}

      onPress={() => router.push(`/product/${product.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.image} />
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}%</Text>
          </View>
        )}
        <TouchableOpacity style={styles.wishlistBtn} onPress={() => toggleWishlist(product.id)}>
          <Ionicons name={isWished ? 'heart' : 'heart-outline'} size={18} color={isWished ? COLORS.accent : COLORS.textLight} />
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>Rp {product.price.toLocaleString('id-ID')}</Text>
        {product.originalPrice && (
          <Text style={styles.originalPrice}>Rp {product.originalPrice.toLocaleString('id-ID')}</Text>
        )}
        <View style={styles.meta}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={COLORS.warning} />
            <Text style={styles.rating}>{product.rating}</Text>
            <Text style={styles.sold}> | {product.sold > 1000 ? `${(product.sold/1000).toFixed(1)}rb` : product.sold} terjual</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={14} color={COLORS.white} />
          <Text style={styles.addBtnText}>Tambah</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    ...SHADOWS.small,
    width: 165,
    marginRight: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  cardCompact: { width: 150 },
  cardFullWidth: { width: '100%', marginRight: 0 },

  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 140, backgroundColor: '#f0f0f0' },
  discountBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: COLORS.accent, borderRadius: RADIUS.xs,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  discountText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  wishlistBtn: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: RADIUS.full,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  info: { padding: SPACING.sm },
  name: { fontSize: 12, fontWeight: '500', color: COLORS.text, marginBottom: 4, lineHeight: 16 },
  price: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark },
  originalPrice: { fontSize: 11, color: COLORS.textLight, textDecorationLine: 'line-through' },
  meta: { marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  rating: { fontSize: 11, color: COLORS.text, fontWeight: '600', marginLeft: 2 },
  sold: { fontSize: 10, color: COLORS.textLight },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingVertical: 6, marginTop: 8,
  },
  addBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600', marginLeft: 4 },
});
