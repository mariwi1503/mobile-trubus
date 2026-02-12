import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending_payment: { label: 'Menunggu Pembayaran', color: '#FF9800', bg: '#FFF3E0', icon: 'hourglass' },
  paid: { label: 'Dibayar', color: '#2196F3', bg: '#E3F2FD', icon: 'checkmark-circle' },
  processing: { label: 'Diproses', color: '#9C27B0', bg: '#F3E5F5', icon: 'cube' },
  shipped: { label: 'Dikirim', color: '#4CAF50', bg: '#E8F5E9', icon: 'car' },
  delivered: { label: 'Diterima', color: '#4CAF50', bg: '#E8F5E9', icon: 'checkmark-done' },
  completed: { label: 'Selesai', color: '#607D8B', bg: '#ECEFF1', icon: 'flag' },
  cancelled: { label: 'Dibatalkan', color: '#F44336', bg: '#FFEBEE', icon: 'close-circle' },
};

const TABS = ['Semua', 'Belum Bayar', 'Diproses', 'Dikirim', 'Selesai'];

export default function OrdersScreen() {
  const router = useRouter();
  const { orders } = useApp();
  const [activeTab, setActiveTab] = useState('Semua');

  const productOrders = orders.filter(o => o.type === 'product');

  const filteredOrders = productOrders.filter(o => {
    switch (activeTab) {
      case 'Belum Bayar': return o.status === 'pending_payment';
      case 'Diproses': return o.status === 'paid' || o.status === 'processing';
      case 'Dikirim': return o.status === 'shipped';
      case 'Selesai': return o.status === 'delivered' || o.status === 'completed';
      default: return true;
    }
  });

  return (
    <SafeAreaView style={styles.container}>
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
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const status = STATUS_MAP[item.status] || STATUS_MAP.pending_payment;
            const date = new Date(item.createdAt);

            return (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>ID: {item.id.toUpperCase()}</Text>
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

                <View style={styles.orderFooter}>
                  <View>
                    <Text style={styles.totalLabel}>Total Belanja</Text>
                    <Text style={styles.totalAmount}>Rp {item.totalAmount.toLocaleString('id-ID')}</Text>
                  </View>
                  {item.status === 'pending_payment' && (
                    <TouchableOpacity
                      style={styles.payNowBtn}
                      onPress={() => router.push({ pathname: '/payment', params: { orderId: item.id } })}
                    >
                      <Text style={styles.payNowText}>Bayar</Text>
                    </TouchableOpacity>
                  )}
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
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
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