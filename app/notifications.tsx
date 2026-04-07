import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useApp, Notification } from '../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NOTIF_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  order: { icon: 'receipt', color: '#4CAF50', bg: '#E8F5E9' },
  consultation: { icon: 'chatbubbles', color: '#2196F3', bg: '#E3F2FD' },
  promo: { icon: 'pricetag', color: '#E91E63', bg: '#FCE4EC' },
  info: { icon: 'information-circle', color: '#FF9800', bg: '#FFF3E0' },
  article: { icon: 'newspaper', color: '#9C27B0', bg: '#F3E5F5' },
};

const TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'transaction', label: 'Transaksi' },
  { id: 'promo', label: 'Promo Menarik' },
  { id: 'article', label: 'Artikel' },
  { id: 'info', label: 'Sistem / Info' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } = useApp();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState('all');

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) {
      const mins = Math.floor(diff / (1000 * 60));
      return mins < 1 ? 'Baru saja' : `${mins} menit lalu`;
    }
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'all') return true;
    if (activeTab === 'transaction') return notif.type === 'order' || notif.type === 'consultation';
    if (activeTab === 'promo') return notif.type === 'promo';
    if (activeTab === 'article') return notif.type === 'article';
    if (activeTab === 'info') return notif.type === 'info';
    return true;
  });

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifikasi</Text>
          {getUnreadCount() > 0 ? (
            <TouchableOpacity onPress={markAllNotificationsRead}>
              <Text style={styles.markAllText}>Baca Semua</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 70 }} />}
        </View>

        {/* Categories Tab Bar */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabContainer}
          contentContainerStyle={styles.tabContentContainer}
        >
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {filteredNotifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>Belum ada notifikasi</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const notifStyle = NOTIF_ICONS[item.type] || NOTIF_ICONS.info;
            return (
              <TouchableOpacity
                style={[styles.notifItem, !item.read && styles.notifUnread]}
                onPress={() => markNotificationRead(item.id)}
              >
                <View style={[styles.notifIcon, { backgroundColor: notifStyle.bg }]}>
                  <Ionicons name={notifStyle.icon as any} size={20} color={notifStyle.color} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>{item.title}</Text>
                    <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
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
    backgroundColor: COLORS.white, 
    paddingTop: 48, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.divider,
  },
  headerTop: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  markAllText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  
  // Tabs
  tabContainer: {
    paddingBottom: SPACING.md,
  },
  tabContentContainer: {
    paddingHorizontal: SPACING.lg,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, marginTop: 12 },
  notifItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.white, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  notifUnread: { backgroundColor: '#F1F8E9' },
  notifIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 14, fontWeight: '500', color: COLORS.text, flex: 1 },
  notifTitleUnread: { fontWeight: '700' },
  notifTime: { fontSize: 11, color: COLORS.textLight, marginLeft: 8 },
  notifMessage: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary, marginLeft: 8, marginTop: 4,
  },
});
