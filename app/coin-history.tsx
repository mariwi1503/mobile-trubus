import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { COIN_REWARDS } from '../data/coinRewards';

// Data Mock untuk Riwayat Coin
const COIN_HISTORY = [
  {
    id: '1',
    type: 'earn',
    title: 'Pembelian Produk Pertanian',
    description: 'Trubus Official Jakarta',
    amount: 50,
    date: 'Hari ini, 10:30',
  },
  {
    id: '2',
    type: 'spend',
    title: 'Penukaran Voucher Diskon',
    description: 'Potongan Rp 10.000',
    amount: -1000,
    date: 'Kemarin, 14:15',
  },
  {
    id: '3',
    type: 'earn',
    title: 'Pembelian Bibit Unggul',
    description: 'Trubus Depok',
    amount: 20,
    date: '28 Mar 2026, 09:00',
  },
  {
    id: '4',
    type: 'earn',
    title: 'Bonus Review Produk',
    description: 'Pupuk Organik Cair 1L',
    amount: 10,
    date: '25 Mar 2026, 16:45',
  },
  {
    id: '5',
    type: 'spend',
    title: 'Penukaran Item Gratis',
    description: 'Benih Kangkung Super',
    amount: -500,
    date: '20 Mar 2026, 11:20',
  },
];

export default function CoinHistoryScreen() {
  const router = useRouter();
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'history' | 'redeem'>('history');

  const renderHistoryItem = ({ item }: { item: any }) => {
    const isEarn = item.type === 'earn';
    const amountColor = isEarn ? COLORS.success : COLORS.error;
    const amountPrefix = isEarn ? '+' : '';

    return (
      <View style={styles.historyCard}>
        <View style={[styles.iconContainer, { backgroundColor: isEarn ? '#dcfce7' : '#fee2e2' }]}>
          <Ionicons 
            name={isEarn ? 'arrow-down' : 'arrow-up'} 
            size={20} 
            color={amountColor} 
          />
        </View>
        <View style={styles.historyDetails}>
          <Text style={styles.historyTitle}>{item.title}</Text>
          <Text style={styles.historyDesc}>{item.description}</Text>
          <Text style={styles.historyDate}>{item.date}</Text>
        </View>
        <View style={styles.historyAmountContainer}>
          <Text style={[styles.historyAmount, { color: amountColor }]}>
            {amountPrefix}{item.amount}
          </Text>
        </View>
      </View>
    );
  };

  const renderRedeemItem = ({ item }: { item: any }) => {
    const canRedeem = (user.trubusCoins || 0) >= item.coinCost;

    return (
      <View style={styles.redeemCard}>
        <View style={styles.redeemTopRow}>
          <View style={styles.redeemBadge}>
            <Text style={styles.redeemBadgeText}>{item.badge}</Text>
          </View>
          <Text style={styles.redeemStore}>{item.store}</Text>
        </View>

        <Text style={styles.redeemTitle}>{item.name}</Text>
        <Text style={styles.redeemMeta}>
          Berat {item.weight >= 1000 ? `${(item.weight / 1000).toFixed(1)} kg` : `${item.weight} g`}
        </Text>

        <View style={styles.redeemBottomRow}>
          <View>
            <Text style={styles.redeemCoinLabel}>Tukar dengan</Text>
            <Text style={styles.redeemCoinValue}>{item.coinCost.toLocaleString('id-ID')} coin</Text>
          </View>
          <TouchableOpacity
            style={[styles.redeemButton, !canRedeem && styles.redeemButtonDisabled]}
            onPress={() => router.push({
              pathname: '/checkout',
              params: { rewardProductId: item.id, coinCost: String(item.coinCost) },
            })}
            disabled={!canRedeem}
          >
            <Text style={styles.redeemButtonText}>{canRedeem ? 'Tukar' : 'Coin Kurang'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trubus Coin</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={activeTab === 'redeem' ? COIN_REWARDS : COIN_HISTORY}
        keyExtractor={(item: any) => activeTab === 'redeem' ? item.id : item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <>
            <View style={styles.balanceContainer}>
              <LinearGradient
                colors={['#ffffff', '#fef9c3']} // Shiny gold look
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceCard}
              >
                <View style={styles.balanceHeader}>
                  <View>
                    <Text style={styles.balanceLabel}>Total Trubus Coin Anda</Text>
                    <Text style={styles.balanceValue}>
                      {user.trubusCoins ? user.trubusCoins.toLocaleString('id-ID') : 0}
                    </Text>
                  </View>
                  <View style={styles.balanceIcon}>
                    <Ionicons name="gift" size={32} color="#d97706" />
                  </View>
                </View>

                {/* Info Container */}
                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Ionicons name="information-circle" size={16} color={COLORS.primary} style={styles.infoIcon} />
                    <Text style={styles.infoText}>
                      <Text style={{ fontWeight: '700' }}>Cara Mendapatkan Coin:</Text> Trubus Coin akan bertambah secara otomatis dari setiap transaksi belanja Anda dengan nominal tertentu.
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.tabWrapper}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
                onPress={() => setActiveTab('history')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}>
                  Riwayat Coin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'redeem' && styles.tabButtonActive]}
                onPress={() => setActiveTab('redeem')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'redeem' && styles.tabButtonTextActive]}>
                  Tukar Coin
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeTab === 'redeem' ? 'Tukar Coin' : 'Riwayat Coin'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {activeTab === 'redeem'
                  ? 'Pilih hadiah lalu lanjut ke alamat dan jasa kirim seperti checkout.'
                  : 'Lihat coin yang masuk dan coin yang sudah digunakan.'}
              </Text>
            </View>
          </>
        }
        renderItem={activeTab === 'redeem' ? renderRedeemItem : renderHistoryItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Soft background
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.small,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  balanceContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  balanceCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#fef08a',
    ...SHADOWS.medium,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  balanceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#d97706',
  },
  balanceIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: 12,
    borderRadius: RADIUS.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tabWrapper: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    backgroundColor: '#EEF2E8',
    borderRadius: RADIUS.full,
    padding: 4,
    marginBottom: SPACING.sm,
  },
  tabButton: {
    flex: 1,
    borderRadius: RADIUS.full,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabButtonTextActive: {
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  redeemList: {
    paddingBottom: SPACING.md,
  },
  redeemCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#F3E3B3',
    ...SHADOWS.small,
  },
  redeemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  redeemBadge: {
    backgroundColor: '#FFF4CC',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  redeemBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B26A00',
  },
  redeemStore: {
    fontSize: 11,
    color: COLORS.textLight,
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  redeemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    minHeight: 42,
  },
  redeemMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  redeemBottomRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  redeemCoinLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  redeemCoinValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#C77900',
    marginTop: 2,
  },
  redeemButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  redeemButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  redeemButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyDetails: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  historyDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  historyAmountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
});
