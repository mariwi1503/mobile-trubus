import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

const APP_FEATURES = [
  'Belanja kebutuhan pertanian lebih mudah',
  'Konsultasi langsung dengan ahli pertanian',
  'Pantau pesanan dan aktivitas dalam satu aplikasi',
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Tentang Aplikasi</Text>
          <Text style={styles.headerSubtitle}>Mengenal Halo Trubus lebih dekat</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>Halo Trubus</Text>
          <Text style={styles.tagline}>Solusi Tepat, Tanaman Sehat</Text>
          <Text style={styles.version}>Versi 1.0.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tentang Kami</Text>
          <Text style={styles.paragraph}>
            Halo Trubus adalah aplikasi yang membantu pengguna menemukan kebutuhan pertanian, berkonsultasi
            dengan ahli, dan mengelola aktivitas belanja maupun layanan pendampingan dalam satu tempat.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fitur Utama</Text>
          {APP_FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name="checkmark" size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informasi Aplikasi</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Developer</Text>
            <Text style={styles.infoValue}>Trubus Digital Team</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kategori</Text>
            <Text style={styles.infoValue}>Agriculture & Consultation</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kontak</Text>
            <Text style={styles.infoValue}>support@halotrubus.id</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 22,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.82)', marginTop: 4 },
  content: { flex: 1 },
  contentContainer: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  logo: { width: 84, height: 84, marginBottom: 12 },
  appName: { fontSize: 22, fontWeight: '800', color: COLORS.primaryDark },
  tagline: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  version: { fontSize: 12, color: COLORS.textLight, marginTop: 8 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  paragraph: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  featureText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, maxWidth: '60%', textAlign: 'right' },
  infoDivider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 12 },
});
