import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function ExpertDashboard() {
  const router = useRouter();
  const { user, orders, updateStatus } = useApp();

  const myConsultations = orders.filter((order) => order.type === 'consultation');
  const pending = myConsultations.filter((order) => order.status === 'pending_payment');
  const scheduled = myConsultations.filter((order) => order.status === 'paid');
  const completed = myConsultations.filter(
    (order) => order.status === 'completed' || order.status === 'delivered'
  );
  const totalEarnings = myConsultations
    .filter((order) => order.status === 'paid' || order.status === 'completed')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const thisMonthEarnings = myConsultations
    .filter((order) => {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear() &&
        (order.status === 'paid' || order.status === 'completed')
      );
    })
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const today = new Date().toISOString().split('T')[0];
  const todaysSchedule = scheduled.filter((order) => order.consultationDate === today);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.name}</Text>
              <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
            </View>
            <Text style={styles.specialization}>{user.specialization || 'Ahli Pertanian'}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Ionicons name="school" size={10} color={COLORS.white} />
                <Text style={styles.roleBadgeText}>Ahli Pertanian</Text>
              </View>
              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      user.status === 'online'
                        ? '#4CAF50'
                        : user.status === 'busy'
                          ? '#FF9800'
                          : '#9E9E9E',
                  },
                ]}
              >
                <View style={styles.statusDot} />
                <Text style={styles.roleBadgeText}>
                  {user.status === 'online'
                    ? 'Tersedia'
                    : user.status === 'busy'
                      ? 'Sibuk'
                      : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statusToggleContainer}>
          <Text style={styles.statusToggleLabel}>Set Status:</Text>
          <View style={styles.statusButtons}>
            {[
              { id: 'online', label: 'Tersedia', color: '#4CAF50' },
              { id: 'busy', label: 'Sibuk', color: '#FF9800' },
              { id: 'offline', label: 'Offline', color: '#9E9E9E' },
            ].map((status) => (
              <TouchableOpacity
                key={status.id}
                style={[
                  styles.statusBtn,
                  user.status === status.id && {
                    backgroundColor: status.color,
                    borderColor: status.color,
                  },
                ]}
                onPress={() => updateStatus(status.id as typeof user.status)}
              >
                <Text
                  style={[
                    styles.statusBtnText,
                    user.status === status.id && styles.statusBtnTextActive,
                  ]}
                >
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.earningsCard}>
        <Text style={styles.earningsTitle}>Pendapatan</Text>
        <View style={styles.earningsRow}>
          <View style={styles.earningsItem}>
            <Text style={styles.earningsLabel}>Bulan Ini</Text>
            <Text style={styles.earningsAmount}>Rp {thisMonthEarnings.toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsItem}>
            <Text style={styles.earningsLabel}>Total</Text>
            <Text style={styles.earningsAmount}>Rp {totalEarnings.toLocaleString('id-ID')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="hourglass" size={24} color="#FF9800" />
          <Text style={styles.statNum}>{pending.length}</Text>
          <Text style={styles.statLabel}>Menunggu</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Ionicons name="calendar" size={24} color="#2196F3" />
          <Text style={styles.statNum}>{scheduled.length}</Text>
          <Text style={styles.statLabel}>Terjadwal</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="checkmark-done" size={24} color="#4CAF50" />
          <Text style={styles.statNum}>{completed.length}</Text>
          <Text style={styles.statLabel}>Selesai</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FCE4EC' }]}>
          <Ionicons name="people" size={24} color="#E91E63" />
          <Text style={styles.statNum}>{myConsultations.length}</Text>
          <Text style={styles.statLabel}>Total Klien</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Permintaan Konsultasi</Text>
          <TouchableOpacity onPress={() => router.push('/consultations')}>
            <Text style={styles.seeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {pending.length === 0 && scheduled.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="chatbubbles-outline" size={32} color={COLORS.textLight} />
            <Text style={styles.emptySectionText}>Belum ada permintaan konsultasi</Text>
          </View>
        ) : (
          [...pending, ...scheduled].slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.requestItem}
              onPress={() => router.push(`/chat/${item.id}`)}
            >
              <View style={styles.requestIcon}>
                <Image
                  source={{ uri: item.clientAvatar || 'https://ui-avatars.com/api/?name=User' }}
                  style={styles.requestAvatar}
                />
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{item.clientName || 'Klien'}</Text>
                <Text style={styles.requestDate}>
                  {item.consultationDate
                    ? new Date(item.consultationDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : '-'}
                  {item.consultationTime ? ` | ${item.consultationTime} WIB` : ''}
                </Text>
              </View>
              <View
                style={[
                  styles.requestStatus,
                  { backgroundColor: item.status === 'paid' ? '#E3F2FD' : '#FFF3E0' },
                ]}
              >
                <Text
                  style={[
                    styles.requestStatusText,
                    { color: item.status === 'paid' ? '#2196F3' : '#FF9800' },
                  ]}
                >
                  {item.status === 'paid' ? 'Terjadwal' : 'Pending'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Jadwal Hari Ini</Text>
        {todaysSchedule.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="calendar-outline" size={32} color={COLORS.textLight} />
            <Text style={styles.emptySectionText}>Tidak ada jadwal hari ini</Text>
          </View>
        ) : (
          todaysSchedule.map((item) => (
            <View key={item.id} style={styles.scheduleItem}>
              <View style={styles.scheduleTime}>
                <Text style={styles.scheduleTimeText}>{item.consultationTime}</Text>
              </View>
              <View style={styles.scheduleLine} />
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleClient}>{item.clientName || 'Klien'}</Text>
                <Text style={styles.scheduleFee}>Rp {item.totalAmount.toLocaleString('id-ID')}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 20 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileInfo: { flex: 1, marginLeft: SPACING.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  specialization: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 3,
  },
  roleBadgeText: { fontSize: 10, color: COLORS.white, fontWeight: '600' },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  statusToggleContainer: {
    marginTop: 16,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  statusToggleLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 8,
    fontWeight: '600',
  },
  statusButtons: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  statusBtnText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  statusBtnTextActive: { color: COLORS.white },
  earningsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginTop: -20,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  earningsTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  earningsRow: { flexDirection: 'row' },
  earningsItem: { flex: 1, alignItems: 'center' },
  earningsLabel: { fontSize: 12, color: COLORS.textSecondary },
  earningsAmount: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark, marginTop: 4 },
  earningsDivider: { width: 1, backgroundColor: COLORS.divider },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    gap: 10,
  },
  statCard: {
    width: '47%',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statNum: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginTop: 6 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  emptySection: { alignItems: 'center', paddingVertical: 20 },
  emptySectionText: { fontSize: 13, color: COLORS.textLight, marginTop: 8 },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  requestIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requestAvatar: { width: 40, height: 40, borderRadius: 20 },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  requestDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  requestStatus: { borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4 },
  requestStatusText: { fontSize: 11, fontWeight: '600' },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  scheduleTime: { width: 50 },
  scheduleTimeText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  scheduleLine: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
    marginHorizontal: 10,
  },
  scheduleInfo: { flex: 1 },
  scheduleClient: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  scheduleFee: { fontSize: 12, color: COLORS.textSecondary },
  bottomSpace: { height: 30 },
});
