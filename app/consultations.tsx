import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { EXPERTS } from '../data/experts';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: 'Menunggu Pembayaran', color: '#FF9800', bg: '#FFF3E0' },
  paid: { label: 'Terjadwal', color: '#2196F3', bg: '#E3F2FD' },
  completed: { label: 'Selesai', color: '#4CAF50', bg: '#E8F5E9' },
  cancelled: { label: 'Dibatalkan', color: '#F44336', bg: '#FFEBEE' },
};

export default function ConsultationsScreen() {
  const router = useRouter();
  const { orders } = useApp();

  const consultations = orders.filter(o => o.type === 'consultation');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Konsultasi</Text>
        <View style={{ width: 22 }} />
      </View>

      {consultations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Belum Ada Konsultasi</Text>
          <Text style={styles.emptySubtext}>Mulai konsultasi dengan ahli pertanian sekarang!</Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => router.push('/(tabs)/experts')}>
            <Text style={styles.startBtnText}>Cari Ahli</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={consultations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 20 }}
          renderItem={({ item }) => {
            const status = STATUS_MAP[item.status] || STATUS_MAP.pending_payment;
            const expert = EXPERTS.find(e => e.id === item.expertId);
            const date = item.consultationDate ? new Date(item.consultationDate) : new Date(item.createdAt);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.expertRow}>
                    <View style={styles.expertIcon}>
                      <Ionicons name="person" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.expertInfo}>
                      <Text style={styles.expertName}>{item.expertName || 'Ahli'}</Text>
                      <Text style={styles.expertSpec}>{expert?.specialization || 'Konsultasi Pertanian'}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={styles.scheduleRow}>
                  <View style={styles.scheduleItem}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.scheduleText}>
                      {date.getDate()} {months[date.getMonth()]} {date.getFullYear()}
                    </Text>
                  </View>
                  {item.consultationTime && (
                    <View style={styles.scheduleItem}>
                      <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.scheduleText}>{item.consultationTime} WIB</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.feeAmount}>Rp {item.totalAmount.toLocaleString('id-ID')}</Text>
                  {item.status === 'pending_payment' && (
                    <TouchableOpacity
                      style={styles.payBtn}
                      onPress={() => router.push({ pathname: '/payment', params: { orderId: item.id } })}
                    >
                      <Text style={styles.payBtnText}>Bayar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
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
  startBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 20,
  },
  startBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginTop: SPACING.md, ...SHADOWS.small,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  expertRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  expertIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  expertInfo: { marginLeft: SPACING.md, flex: 1 },
  expertName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  expertSpec: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  statusBadge: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  scheduleRow: {
    flexDirection: 'row', gap: 16, marginTop: SPACING.md,
    paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scheduleText: { fontSize: 12, color: COLORS.textSecondary },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  feeAmount: { fontSize: 16, fontWeight: '700', color: COLORS.primaryDark },
  payBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  payBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
});
