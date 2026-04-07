import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';

// Data Mock untuk Tingkat Membership
const MEMBERSHIP_TIERS = [
  {
    id: '1',
    name: 'Bronze',
    icon: 'medal-outline',
    color: '#cd7f32',
    gradient: ['#fff3e0', '#ffe0b2'] as const,
    criteria: 'Mendaftar akun di aplikasi',
    benefits: [
      'Mendapatkan Trubus Coin pada setiap transaksi',
      'Akses ke artikel pertanian gratis',
    ],
  },
  {
    id: '2',
    name: 'Silver',
    icon: 'medal',
    color: '#94a3b8',
    gradient: ['#f8fafc', '#e2e8f0'] as const,
    criteria: 'Total akumulasi belanja Rp 500.000',
    benefits: [
      'Bonus 5% Trubus Coin tambahan',
      'Gratis ongkir hingga Rp 10.000 / bulan',
      'Promo khusus member Silver',
    ],
  },
  {
    id: '3',
    name: 'Gold',
    icon: 'ribbon',
    color: '#d97706',
    gradient: ['#fef3c7', '#fde68a'] as const,
    criteria: 'Total akumulasi belanja Rp 2.500.000',
    benefits: [
      'Bonus 10% Trubus Coin tambahan',
      'Gratis ongkir hingga Rp 25.000 / bulan',
      'Akses eksklusif produk baru lebih awal',
      'Konsultasi ahli prioritas',
    ],
  },
  {
    id: '4',
    name: 'Platinum',
    icon: 'diamond',
    color: '#0f172a',
    gradient: ['#e2e8f0', '#94a3b8'] as const,
    criteria: 'Total akumulasi belanja Rp 10.000.000',
    benefits: [
      'Bonus 20% Trubus Coin tambahan',
      'Gratis ongkir tanpa batas',
      'Undangan acara edukasi VIP',
      'Bonus ulang tahun kejutan',
    ],
  },
];

export default function MembershipScreen() {
  const router = useRouter();
  useApp();
  
  // Asumsi user saat ini berada di tier 'Gold' sesuai hardcode di widget home.
  const currentTier = 'Gold'; 

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Info Membership</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Current Membership Card */}
        <View style={styles.currentTierContainer}>
          <LinearGradient
            colors={['#ffffff', '#fef9c3']} // Shiny gold look
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.currentTierCard}
          >
            <View style={styles.currentTierHeader}>
              <View>
                <Text style={styles.currentTierLabel}>Status Anda Saat Ini</Text>
                <Text style={styles.currentTierValue}>{currentTier}</Text>
              </View>
              <View style={styles.currentTierIcon}>
                <Ionicons name="ribbon" size={28} color="#d97706" />
              </View>
            </View>
            <View style={styles.currentTierProgress}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '40%' }]} />
              </View>
              <Text style={styles.progressText}>
                Belanja Rp 7.500.000 lagi untuk mencapai <Text style={{ fontWeight: '700' }}>Platinum</Text>
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Tiers List */}
        <Text style={styles.sectionTitle}>Tingkatan & Keuntungan</Text>
        <Text style={styles.sectionSubtitle}>
          Semakin sering Anda berbelanja, semakin banyak keuntungan yang bisa Anda nikmati.
        </Text>

        <View style={styles.tiersList}>
          {MEMBERSHIP_TIERS.map((tier) => (
            <View key={tier.id} style={styles.tierCard}>
              <LinearGradient
                colors={tier.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tierHeaderRow}
              >
                <View style={styles.tierTitleRow}>
                  <Ionicons name={tier.icon as any} size={20} color={tier.color} style={{ marginRight: 8 }} />
                  <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                  {tier.name === currentTier && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>SAAT INI</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
              
              <View style={styles.tierBody}>
                <View style={styles.criteriaRow}>
                  <Ionicons name="flag" size={16} color={COLORS.primary} style={{ marginRight: 8, marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.criteriaLabel}>Syarat Pencapaian:</Text>
                    <Text style={styles.criteriaValue}>{tier.criteria}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.benefitsLabel}>Keuntungan:</Text>
                {tier.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
  currentTierContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  currentTierCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#fef08a', // shiny gold border
    ...SHADOWS.medium,
  },
  currentTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  currentTierLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  currentTierValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#d97706', // gold
  },
  currentTierIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentTierProgress: {
    marginTop: 4,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#fef08a', // pale gold
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#d97706',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    marginTop: 4,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  tiersList: {
    paddingHorizontal: SPACING.lg,
  },
  tierCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  tierHeaderRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tierTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierName: {
    fontSize: 16,
    fontWeight: '800',
  },
  activeBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text,
  },
  tierBody: {
    padding: SPACING.md,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  criteriaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  criteriaValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  benefitsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
  },
});
