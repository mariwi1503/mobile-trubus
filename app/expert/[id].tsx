import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { EXPERTS } from '../../data/experts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExpertDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const expert = EXPERTS.find(e => e.id === id);
  const insets = useSafeAreaInsets();

  if (!expert) {
    return (
      <View style={styles.container}>
        <Text>Ahli tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Ahli</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-social-outline" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: expert.image }} style={styles.avatar} />
              {expert.isOnline && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{expert.name}</Text>
              <Text style={styles.spec}>{expert.specialization}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: expert.isOnline ? '#E8F5E9' : '#FFF3E0' }]}>
                  <View style={[styles.statusDot, { backgroundColor: expert.isOnline ? COLORS.success : COLORS.accentOrange }]} />
                  <Text style={[styles.statusText, { color: expert.isOnline ? COLORS.success : COLORS.accentOrange }]}>
                    {expert.isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={18} color={COLORS.warning} />
              <Text style={styles.statValue}>{expert.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="people" size={18} color={COLORS.info} />
              <Text style={styles.statValue}>{expert.reviews}</Text>
              <Text style={styles.statLabel}>Ulasan</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="briefcase" size={18} color={COLORS.primary} />
              <Text style={styles.statValue}>{expert.experience} thn</Text>
              <Text style={styles.statLabel}>Pengalaman</Text>
            </View>
          </View>
        </View>

        {/* Fee Card */}
        <View style={styles.feeCard}>
          <View style={styles.feeLeft}>
            <Text style={styles.feeLabel}>Biaya Konsultasi</Text>
            <Text style={styles.feeAmount}>Rp {expert.fee.toLocaleString('id-ID')}</Text>
          </View>
          <Text style={styles.feePerSession}>/ sesi (30 menit)</Text>
        </View>

        {/* About */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tentang</Text>
          <Text style={styles.bio}>{expert.bio}</Text>
        </View>

        {/* Education */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pendidikan</Text>
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoText}>{expert.education}</Text>
          </View>
        </View>

        {/* Certifications */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sertifikasi</Text>
          {expert.certifications.map((cert, i) => (
            <View key={i} style={styles.infoRow}>
              <Ionicons name="ribbon-outline" size={18} color={COLORS.accentOrange} />
              <Text style={styles.infoText}>{cert}</Text>
            </View>
          ))}
        </View>

        {/* Languages */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Bahasa</Text>
          <View style={styles.langRow}>
            {expert.languages.map((lang, i) => (
              <View key={i} style={styles.langChip}>
                <Text style={styles.langText}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.chatBtn}>
          <Ionicons name="chatbubble-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push({ pathname: '/expert/schedule', params: { expertId: expert.id } })}
        >
          <Ionicons name="calendar-outline" size={18} color={COLORS.white} />
          <Text style={styles.bookBtnText}>Buat Jadwal Konsultasi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, paddingTop: 48, paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  shareBtn: { padding: 4 },
  profileCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.lg,
    borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOWS.medium,
  },
  profileTop: { flexDirection: 'row', marginBottom: SPACING.lg },
  avatarWrap: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.success, borderWidth: 3, borderColor: COLORS.white,
  },
  profileInfo: { flex: 1, marginLeft: SPACING.md },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  spec: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  statusRow: { marginTop: 6 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.divider,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  statLabel: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.divider },
  feeCard: {
    backgroundColor: '#E8F5E9', marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  feeLeft: {},
  feeLabel: { fontSize: 12, color: COLORS.textSecondary },
  feeAmount: { fontSize: 22, fontWeight: '700', color: COLORS.primaryDark },
  feePerSession: { fontSize: 12, color: COLORS.textSecondary },
  sectionCard: {
    backgroundColor: COLORS.white, marginHorizontal: SPACING.lg, marginTop: SPACING.md,
    borderRadius: RADIUS.lg, padding: SPACING.lg, ...SHADOWS.small,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  bio: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { fontSize: 13, color: COLORS.text, marginLeft: 8, flex: 1 },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: { backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4 },
  langText: { fontSize: 12, color: COLORS.primaryDark, fontWeight: '500' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.divider, ...SHADOWS.medium,
    paddingBottom: 24,
  },
  chatBtn: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  bookBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 14,
  },
  bookBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700', marginLeft: 8 },
});
