import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { getOrderDisplayCode } from '../../lib/order-display';
import {
  PRODUCT_ORDER_STATUS_MAP,
  canRetryProductOrderPayment,
} from '../../lib/order-status';

function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export default function ProductOrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { orders, refreshOrders } = useApp();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const orderId = Array.isArray(id) ? id[0] : id;
  const order = orders.find((item) => item.type === 'product' && item.id === orderId);
  const status = PRODUCT_ORDER_STATUS_MAP[order?.status || 'pending_payment'] || PRODUCT_ORDER_STATUS_MAP.pending_payment;
  const canRetryPayment = order ? canRetryProductOrderPayment(order) : false;

  const itemSubtotal = useMemo(() => {
    if (!order?.items?.length) {
      return order?.totalAmount || 0;
    }

    return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [order]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await refreshOrders();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshOrders]);

  useFocusEffect(
    useCallback(() => {
      void handleRefresh();
    }, [handleRefresh]),
  );

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Pesanan</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.emptyState}>
          {isRefreshing ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Text style={styles.emptyTitle}>Pesanan tidak ditemukan</Text>
              <Text style={styles.emptyText}>
                Pesanan produk ini belum tersedia di perangkat. Tarik ulang atau kembali ke daftar pesanan.
              </Text>
            </>
          )}
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
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <TouchableOpacity onPress={() => { void handleRefresh(); }}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={(
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { void handleRefresh(); }}
            tintColor={COLORS.primary}
          />
        )}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Kode Pesanan</Text>
          <Text style={styles.heroCode}>{getOrderDisplayCode(order, orderId)}</Text>
          <Text style={styles.heroAmount}>{formatRupiah(order.totalAmount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon as never} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Item Pesanan</Text>
          {(order.items || []).map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {item.quantity} x {formatRupiah(item.price)}
                </Text>
                <Text style={styles.itemStore}>{item.store}</Text>
              </View>
              <Text style={styles.itemAmount}>{formatRupiah(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pengiriman</Text>
          <View style={styles.infoRow}>
            <Ionicons name="car-outline" size={16} color={COLORS.primary} />
            <Text style={styles.infoText}>{order.courier || 'Kurir belum tercatat'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.primary} />
            <Text style={styles.infoText}>
              {order.address
                ? `${order.address.label} - ${order.address.recipient}, ${order.address.address}, ${order.address.city}`
                : 'Alamat pengiriman belum tersedia'}
            </Text>
          </View>
          {order.store ? (
            <View style={styles.infoRow}>
              <Ionicons name="storefront-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>{order.store}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pembayaran</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal Item</Text>
            <Text style={styles.summaryValue}>{formatRupiah(itemSubtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ongkos Kirim</Text>
            <Text style={styles.summaryValue}>{formatRupiah(order.shippingCost || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Metode Pembayaran</Text>
            <Text style={styles.summaryValue}>{order.paymentMethod || order.paymentType || 'Midtrans'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Status Gateway</Text>
            <Text style={styles.summaryValue}>{order.paymentStatusDetail || '-'}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>{formatRupiah(order.totalAmount)}</Text>
          </View>
        </View>

        {order.status === 'expired' || order.status === 'cancelled' ? (
          <View style={styles.noticeCard}>
            <View style={styles.noticeHeader}>
              <Ionicons
                name={order.status === 'expired' ? 'time-outline' : 'close-circle-outline'}
                size={18}
                color={order.status === 'expired' ? '#A15C00' : COLORS.error}
              />
              <Text style={styles.noticeTitle}>
                {order.status === 'expired'
                  ? 'Sesi pembayaran sudah kedaluwarsa'
                  : 'Transaksi sebelumnya dibatalkan atau ditolak'}
              </Text>
            </View>
            <Text style={styles.noticeText}>
              Tekan tombol bayar ulang untuk membuat sesi Midtrans baru dengan detail pesanan yang sama.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomSummary}>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomAmount}>{formatRupiah(order.totalAmount)}</Text>
        </View>
        {canRetryPayment ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push({ pathname: '/payment', params: { orderId: order.id } })}
          >
            <Text style={styles.primaryButtonText}>
              {order.status === 'expired' || order.status === 'cancelled' ? 'Bayar Ulang' : 'Bayar Sekarang'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/orders')}
          >
            <Text style={styles.secondaryButtonText}>Kembali ke Pesanan</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: 48,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  heroCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: SPACING.xxl,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryDark,
  },
  heroLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.76)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroCode: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  heroAmount: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  card: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.small,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  itemMeta: { marginTop: 4, fontSize: 12, color: COLORS.textSecondary },
  itemStore: { marginTop: 2, fontSize: 12, color: COLORS.primaryDark },
  itemAmount: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
  },
  summaryLabel: { flex: 1, fontSize: 13, color: COLORS.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, textAlign: 'right' },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: 17, fontWeight: '800', color: COLORS.primaryDark },
  noticeCard: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F3D27A',
  },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text },
  noticeText: { marginTop: 8, fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomSummary: { flex: 1 },
  bottomLabel: { fontSize: 12, color: COLORS.textSecondary },
  bottomAmount: { marginTop: 2, fontSize: 18, fontWeight: '800', color: COLORS.primaryDark },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#F1F5F1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  secondaryButtonText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
});
