import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING, CARD_WIDTH } from '../constants/theme';
import { Product } from '../types/product';
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
  const imageSource = typeof product.image === 'string' ? { uri: product.image } : product.image;

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
        <Image source={imageSource} style={styles.image} />
        <TouchableOpacity style={styles.wishlistBtn} onPress={() => toggleWishlist(product.id)}>
          <Ionicons name={isWished ? 'heart' : 'heart-outline'} size={18} color={isWished ? COLORS.accent : COLORS.textLight} />
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>Rp {product.price.toLocaleString('id-ID')}</Text>
        <View style={styles.meta}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={COLORS.warning} />
            <Text style={styles.metaCaption}>{product.rating.toFixed(1)}</Text>
            <View style={styles.metaDot} />
            <Ionicons name="cube-outline" size={12} color={COLORS.textLight} />
            <Text style={styles.metaCaption}>{product.uom}</Text>
            <View style={styles.metaDot} />
            <Ionicons name="bag-check-outline" size={12} color={COLORS.textLight} />
            <Text style={styles.sold}>
              {product.sold > 1000
                ? `${(product.sold / 1000).toFixed(1)}rb`
                : product.sold}{' '}
              terjual
            </Text>
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
    width: CARD_WIDTH,
    marginRight: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  cardCompact: { width: CARD_WIDTH - 20 },
  cardFullWidth: { width: '100%', marginRight: 0 },

  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 110, backgroundColor: '#f0f0f0' },
  wishlistBtn: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: RADIUS.full,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  info: { padding: SPACING.sm },
  name: { fontSize: 12, fontWeight: '500', color: COLORS.text, marginBottom: 4, lineHeight: 16 },
  price: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark },
  meta: { marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  metaCaption: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', marginLeft: 2 },
  sold: { fontSize: 10, color: COLORS.textLight },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.textLight, marginHorizontal: 6 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingVertical: 6, marginTop: 8,
  },
  addBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600', marginLeft: 4 },
});
