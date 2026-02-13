import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COURIERS = [
  { id: 'jne', name: 'JNE Regular', est: '3-4 hari', cost: 15000 },
  { id: 'jne_yes', name: 'JNE YES', est: '1-2 hari', cost: 25000 },
  { id: 'jnt', name: 'J&T Express', est: '2-3 hari', cost: 13000 },
  { id: 'sicepat', name: 'SiCepat REG', est: '2-3 hari', cost: 14000 },
  { id: 'sicepat_best', name: 'SiCepat BEST', est: '1 hari', cost: 22000 },
  { id: 'anteraja', name: 'AnterAja Regular', est: '3-5 hari', cost: 12000 },
];

const STORES = [
  { id: 's1', name: 'Trubus Store Jakarta', city: 'Jakarta Pusat' },
  { id: 's2', name: 'Trubus Store Bandung', city: 'Bandung' },
  { id: 's3', name: 'Trubus Store Surabaya', city: 'Surabaya' },
  { id: 's4', name: 'Trubus Store Yogyakarta', city: 'Yogyakarta' },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, addresses, getCartTotal, addOrder, clearCart } = useApp();
  const [selectedAddressId, setSelectedAddressId] = useState(addresses.find(a => a.isDefault)?.id || addresses[0]?.id || '');
  const [selectedCourier, setSelectedCourier] = useState('');
  const [selectedStore, setSelectedStore] = useState(STORES[0].id);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showCouriers, setShowCouriers] = useState(false);
  const [showStores, setShowStores] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const courier = COURIERS.find(c => c.id === selectedCourier);
  const store = STORES.find(s => s.id === selectedStore);
  const subtotal = getCartTotal();
  const shippingCost = courier?.cost || 0;
  const total = subtotal + shippingCost;

  const totalWeight = useMemo(() => cart.reduce((sum, i) => sum + i.weight * i.quantity, 0), [cart]);

  const handleOrder = () => {
    if (!selectedAddress) {
      Alert.alert('Peringatan', 'Pilih alamat pengiriman');
      return;
    }
    if (!selectedCourier) {
      Alert.alert('Peringatan', 'Pilih jasa kurir');
      return;
    }

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const order = {
      id: orderId,
      type: 'product' as const,
      items: [...cart],
      totalAmount: total,
      shippingCost,
      courier: courier?.name || '',
      address: selectedAddress,
      store: store?.name || '',
      status: 'pending_payment' as const,
      createdAt: new Date().toISOString(),
    };

    addOrder(order);
    clearCart();
    router.push({ pathname: '/order-success', params: { orderId, type: 'product' } });
  };

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Keranjang kosong</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Address */}
        <TouchableOpacity style={styles.card} onPress={() => setShowAddresses(!showAddresses)}>
          <View style={styles.cardHeader}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Alamat Pengiriman</Text>
            <Ionicons name={showAddresses ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textLight} />
          </View>
          {selectedAddress && (
            <View style={styles.addressPreview}>
              <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
              <Text style={styles.addressName}>{selectedAddress.recipient} - {selectedAddress.phone}</Text>
              <Text style={styles.addressText}>{selectedAddress.address}, {selectedAddress.city}</Text>
            </View>
          )}
        </TouchableOpacity>

        {showAddresses && (
          <View style={styles.optionList}>
            {addresses.map((addr) => (
              <TouchableOpacity
                key={addr.id}
                style={[styles.optionItem, selectedAddressId === addr.id && styles.optionItemActive]}
                onPress={() => { setSelectedAddressId(addr.id); setShowAddresses(false); }}
              >
                <View style={styles.optionRadio}>
                  {selectedAddressId === addr.id && <View style={styles.optionRadioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{addr.label}</Text>
                  <Text style={styles.optionText}>{addr.address}, {addr.city}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addAddressBtn} onPress={() => router.push('/addresses')}>
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.addAddressText}>Tambah Alamat Baru</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Store Selection */}
        <TouchableOpacity style={styles.card} onPress={() => setShowStores(!showStores)}>
          <View style={styles.cardHeader}>
            <Ionicons name="storefront" size={20} color={COLORS.accentOrange} />
            <Text style={styles.cardTitle}>Toko Pengirim</Text>
            <Ionicons name={showStores ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textLight} />
          </View>
          {store && (
            <View style={styles.addressPreview}>
              <Text style={styles.addressName}>{store.name}</Text>
              <Text style={styles.addressText}>{store.city}</Text>
            </View>
          )}
        </TouchableOpacity>

        {showStores && (
          <View style={styles.optionList}>
            {STORES.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.optionItem, selectedStore === s.id && styles.optionItemActive]}
                onPress={() => { setSelectedStore(s.id); setShowStores(false); }}
              >
                <View style={styles.optionRadio}>
                  {selectedStore === s.id && <View style={styles.optionRadioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{s.name}</Text>
                  <Text style={styles.optionText}>{s.city}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Courier */}
        <TouchableOpacity style={styles.card} onPress={() => setShowCouriers(!showCouriers)}>
          <View style={styles.cardHeader}>
            <Ionicons name="car" size={20} color={COLORS.info} />
            <Text style={styles.cardTitle}>Jasa Pengiriman</Text>
            <Ionicons name={showCouriers ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textLight} />
          </View>
          {courier ? (
            <View style={styles.addressPreview}>
              <Text style={styles.addressName}>{courier.name}</Text>
              <Text style={styles.addressText}>Estimasi: {courier.est} | Rp {courier.cost.toLocaleString('id-ID')}</Text>
            </View>
          ) : (
            <Text style={styles.selectText}>Pilih jasa pengiriman</Text>
          )}
        </TouchableOpacity>

        {showCouriers && (
          <View style={styles.optionList}>
            {COURIERS.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.optionItem, selectedCourier === c.id && styles.optionItemActive]}
                onPress={() => { setSelectedCourier(c.id); setShowCouriers(false); }}
              >
                <View style={styles.optionRadio}>
                  {selectedCourier === c.id && <View style={styles.optionRadioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{c.name}</Text>
                  <Text style={styles.optionText}>Estimasi: {c.est}</Text>
                </View>
                <Text style={styles.courierCost}>Rp {c.cost.toLocaleString('id-ID')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Order Items */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bag" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Ringkasan Pesanan</Text>
          </View>
          {cart.map((item) => (
            <View key={item.productId} style={styles.orderItem}>
              <Text style={styles.orderItemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.orderItemQty}>{item.quantity}x</Text>
              <Text style={styles.orderItemPrice}>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} item)</Text>
            <Text style={styles.summaryValue}>Rp {subtotal.toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ongkos Kirim</Text>
            <Text style={styles.summaryValue}>{shippingCost > 0 ? `Rp ${shippingCost.toLocaleString('id-ID')}` : '-'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Berat</Text>
            <Text style={styles.summaryValue}>{totalWeight >= 1000 ? `${(totalWeight / 1000).toFixed(1)} kg` : `${totalWeight} g`}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>Rp {total.toLocaleString('id-ID')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomPrice}>Rp {total.toLocaleString('id-ID')}</Text>
        </View>
        <TouchableOpacity style={styles.orderBtn} onPress={handleOrder}>
          <Text style={styles.orderBtnText}>Buat Pesanan</Text>
        </TouchableOpacity>
      </View>
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOWS.small,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text },
  addressPreview: { marginTop: 8, marginLeft: 28 },
  addressLabel: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginBottom: 2 },
  addressName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  addressText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  selectText: { fontSize: 13, color: COLORS.textLight, marginTop: 8, marginLeft: 28 },
  optionList: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: 2,
    borderRadius: RADIUS.lg, ...SHADOWS.small, overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  optionItemActive: { backgroundColor: COLORS.primaryBg },
  optionRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  optionRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  optionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  optionText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  courierCost: { fontSize: 13, fontWeight: '700', color: COLORS.primaryDark },
  addAddressBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: SPACING.md, gap: 6,
  },
  addAddressText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  orderItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6, marginTop: 4,
  },
  orderItemName: { flex: 1, fontSize: 12, color: COLORS.text },
  orderItemQty: { fontSize: 12, color: COLORS.textSecondary, marginHorizontal: 8 },
  orderItemPrice: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.divider, marginTop: 8, paddingTop: 10 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: 17, fontWeight: '700', color: COLORS.primaryDark },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.divider, paddingBottom: 24,
  },
  bottomInfo: { flex: 1 },
  bottomLabel: { fontSize: 12, color: COLORS.textSecondary },
  bottomPrice: { fontSize: 20, fontWeight: '700', color: COLORS.primaryDark },
  orderBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 28, paddingVertical: 14,
  },
  orderBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
