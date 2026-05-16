import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getOrderDisplayCode } from '../lib/order-display';
import {
  PRODUCT_ORDER_STATUS_MAP,
  canRetryProductOrderPayment,
} from '../lib/order-status';

const TABS = ['Semua', 'Belum Bayar', 'Diproses', 'Dikirim', 'Selesai'];

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, refreshOrders } = useApp();
  const [activeTab, setActiveTab] = useState('Semua');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const productOrders = orders.filter(o => o.type === 'product');

  const filteredOrders = productOrders.filter(o => {
    switch (activeTab) {
      case 'Belum Bayar': return o.status === 'draft' || o.status === 'pending_payment' || o.status === 'expired' || o.status === 'cancelled';
      case 'Diproses': return o.status === 'paid' || o.status === 'processing';
      case 'Dikirim': return o.status === 'shipped';
      case 'Selesai': return o.status === 'delivered' || o.status === 'completed';
      default: return true;
    }
  });

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

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pesanan Saya</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* TAB CATEGORY - Sekarang tingginya menyesuaikan konten */}
      <View style={styles.tabWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* LIST ORDERS */}
      {filteredOrders.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyText}>Belum ada pesanan</Text>
          <TouchableOpacity style={styles.emptyRefreshBtn} onPress={() => { void handleRefresh(); }}>
            <Text style={styles.emptyRefreshText}>Muat Ulang</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { void handleRefresh(); }}
              tintColor={COLORS.primary}
            />
          )}
          renderItem={({ item }) => {
            const status = PRODUCT_ORDER_STATUS_MAP[item.status] || PRODUCT_ORDER_STATUS_MAP.pending_payment;
            const date = new Date(item.createdAt);
            const displayOrderCode = getOrderDisplayCode(item);
            const canRetryPayment = canRetryProductOrderPayment(item);
            const paymentButtonLabel = item.status === 'expired' || item.status === 'cancelled'
              ? 'Bayar Ulang'
              : 'Bayar';

            return (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>Kode: {displayOrderCode}</Text>
                    <Text style={styles.orderDate}>
                      {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Ionicons name={status.icon as any} size={12} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                {item.items && item.items.length > 0 && (
                  <View style={styles.itemsSection}>
                    {item.items.slice(0, 2).map((cartItem, idx) => (
                      <Text key={idx} style={styles.itemText} numberOfLines={1}>
                        {cartItem.quantity}x {cartItem.name}
                      </Text>
                    ))}
                    {item.items.length > 2 && (
                      <Text style={styles.moreItems}>+{item.items.length - 2} item lainnya</Text>
                    )}
                  </View>
                )}

                <View style={styles.metaSection}>
                  <View style={styles.metaRow}>
                    <Ionicons
                      name={item.fulfillmentMethod === 'pickup' ? 'storefront-outline' : 'car-outline'}
                      size={14}
                      color={COLORS.primary}
                    />
                    <Text style={styles.metaText}>
                      {item.fulfillmentMethod === 'pickup' ? 'Jemput ke Toko' : 'Diantar'}
                    </Text>
                  </View>
                  {item.fulfillmentMethod === 'pickup' ? (
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.metaText} numberOfLines={1}>{item.store || 'Toko belum dipilih'}</Text>
                    </View>
                  ) : (
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {item.address ? `${item.address.label} - ${item.address.city}` : 'Alamat belum dipilih'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.orderFooter}>
                  <View>
                    <Text style={styles.totalLabel}>Total Belanja</Text>
                    <Text style={styles.totalAmount}>Rp {item.totalAmount.toLocaleString('id-ID')}</Text>
                  </View>
                  <View style={styles.footerActions}>
                    <TouchableOpacity
                      style={styles.detailBtn}
                      onPress={() => router.push({ pathname: '/order/[id]', params: { id: item.id } })}
                    >
                      <Text style={styles.detailBtnText}>Detail</Text>
                    </TouchableOpacity>
                    {canRetryPayment && (
                      <TouchableOpacity
                        style={styles.payNowBtn}
                        onPress={() => router.push({ pathname: '/payment', params: { orderId: item.id } })}
                      >
                        <Text style={styles.payNowText}>{paymentButtonLabel}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  header: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text
  },
  tabWrapper: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabScrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm, // Memberikan padding atas-bawah yang seimbang
    gap: 8, // Jarak antar tab (jika React Native versi baru) atau gunakan margin
  },
  tab: {
    paddingHorizontal: 16,
    height: 36, // Mengunci tinggi tab agar seragam
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    marginRight: 8,
    backgroundColor: '#F1F3F5',
  },
  tabActive: {
    backgroundColor: COLORS.primary
  },
  tabText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500'
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '600'
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 30,
    paddingTop: SPACING.sm
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16
  },
  emptyRefreshBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  emptyRefreshText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOWS.small,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase'
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700'
  },
  itemsSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider
  },
  itemText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4
  },
  moreItems: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2
  },
  metaSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  totalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryDark
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailBtn: {
    backgroundColor: '#F1F5F1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  detailBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  payNowBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  payNowText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700'
  },
});
