import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CartScreen() {
  const router = useRouter();
  const { cart, updateCartQuantity, removeFromCart, getCartTotal, clearCart } = useApp();
  const insets = useSafeAreaInsets();

  const handleRemove = (productId: string, name: string) => {
    Alert.alert('Hapus Item', `Hapus ${name} dari keranjang?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => removeFromCart(productId) },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Keranjang ({cart.length})</Text>
        {cart.length > 0 ? (
          <TouchableOpacity onPress={() => Alert.alert('Kosongkan', 'Kosongkan keranjang?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Ya', onPress: clearCart },
          ])}>
            <Ionicons name="trash-outline" size={20} color={COLORS.accent} />
          </TouchableOpacity>
        ) : <View style={{ width: 20 }} />}
      </View>

      {cart.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Keranjang Kosong</Text>
          <Text style={styles.emptySubtext}>Yuk mulai belanja kebutuhan pertanian Anda!</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={styles.shopBtnText}>Mulai Belanja</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
            <View style={styles.storeGroup}>
              {cart.map((item) => (
                <View key={item.productId} style={styles.cartItem}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.itemPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
                    <View style={styles.itemActions}>
                      <View style={styles.qtyControl}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => {
                          if (item.quantity <= 1) handleRemove(item.productId, item.name);
                          else updateCartQuantity(item.productId, item.quantity - 1);
                        }}>
                          <Ionicons name="remove" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartQuantity(item.productId, item.quantity + 1)}>
                          <Ionicons name="add" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => handleRemove(item.productId, item.name)}>
                        <Ionicons name="trash-outline" size={18} color={COLORS.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Bar */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>Rp {getCartTotal().toLocaleString('id-ID')}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
              <Text style={styles.checkoutText}>Checkout ({cart.reduce((s, i) => s + i.quantity, 0)})</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.white, paddingTop: 48, paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
  shopBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 20,
  },
  shopBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  storeGroup: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: RADIUS.lg, ...SHADOWS.small, overflow: 'hidden',
  },
  storeHeader: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  storeName: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginLeft: 6 },
  cartItem: {
    flexDirection: 'row', padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  itemImage: { width: 80, height: 80, borderRadius: RADIUS.sm, backgroundColor: '#f0f0f0' },
  itemInfo: { flex: 1, marginLeft: SPACING.md },
  itemName: { fontSize: 13, fontWeight: '500', color: COLORS.text, lineHeight: 18 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: COLORS.primaryDark, marginTop: 4 },
  itemActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm,
  },
  qtyBtn: { padding: 6 },
  qtyText: { fontSize: 14, fontWeight: '700', color: COLORS.text, paddingHorizontal: 12 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.divider, paddingBottom: 24,
  },
  totalSection: { flex: 1 },
  totalLabel: { fontSize: 12, color: COLORS.textSecondary },
  totalAmount: { fontSize: 20, fontWeight: '700', color: COLORS.primaryDark },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  checkoutText: { color: COLORS.white, fontSize: 15, fontWeight: '700', marginRight: 6 },
});
