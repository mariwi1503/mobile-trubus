import React, { useState } from 'react';
import { BackHandler, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';

const TERMS_SECTIONS = [
  {
    title: '1. Persetujuan Penggunaan',
    content: 'Dengan menggunakan Halo Trubus, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku di dalam aplikasi ini.',
  },
  {
    title: '2. Akun Pengguna',
    content: 'Pengguna wajib memberikan data yang benar dan bertanggung jawab menjaga kerahasiaan akun, termasuk nomor telepon, email, dan aktivitas yang terjadi di akun tersebut.',
  },
  {
    title: '3. Layanan Konsultasi',
    content: 'Informasi dari ahli pertanian bersifat rekomendasi profesional berdasarkan data yang diberikan pengguna. Hasil implementasi di lapangan dapat berbeda tergantung kondisi tanaman, cuaca, dan faktor lainnya.',
  },
  {
    title: '4. Pemesanan dan Pembayaran',
    content: 'Semua pesanan, pembayaran, promo, dan coin mengikuti kebijakan yang berlaku di aplikasi. Halo Trubus berhak menyesuaikan program promosi, benefit, atau metode pembayaran sewaktu-waktu.',
  },
  {
    title: '5. Privasi dan Data',
    content: 'Kami dapat menyimpan data yang diperlukan untuk operasional layanan, pengalaman pengguna, dan peningkatan aplikasi. Data akan dikelola sesuai kebijakan internal platform.',
  },
  {
    title: '6. Batasan Penggunaan',
    content: 'Pengguna dilarang menyalahgunakan aplikasi, mengganggu sistem, melakukan penipuan, atau memakai layanan untuk tujuan yang melanggar hukum dan merugikan pihak lain.',
  },
];

export default function TermsScreen() {
  const router = useRouter();
  const { readonly } = useLocalSearchParams<{ readonly?: string }>();
  const { setHasAcceptedTerms, setIsOnboarded } = useApp();
  const [hasReadAndAgree, setHasReadAndAgree] = useState(false);
  const isReadOnly = readonly === '1';

  const handleContinue = () => {
    if (!hasReadAndAgree) return;
    setHasAcceptedTerms(true);
    router.replace('/(tabs)');
  };

  const handleDecline = () => {
    setHasAcceptedTerms(false);
    setIsOnboarded(false);

    if (Platform.OS === 'android') {
      BackHandler.exitApp();
      return;
    }

    router.replace('/onboarding');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isReadOnly ? (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerIcon} activeOpacity={1}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.text} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Syarat & Ketentuan</Text>
          <Text style={styles.headerSubtitle}>Harap dibaca sebelum menggunakan aplikasi</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.documentCard}>
          <View style={styles.documentTopRow}>
            <View>
              <Text style={styles.documentLabel}>DOCUMENT</Text>
              <Text style={styles.documentTitle}>Terms & Conditions Halo Trubus</Text>
            </View>
            <View style={styles.pageBadge}>
              <Text style={styles.pageBadgeText}>1 / 1</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Versi 1.0</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>Wajib disetujui</Text>
          </View>

          <View style={styles.documentDivider} />

          <Text style={styles.openingParagraph}>
            Dokumen ini berisi syarat dan ketentuan penggunaan Halo Trubus. Dengan melanjutkan,
            Anda menyatakan telah membaca, memahami, dan menyetujui isi dokumen ini.
          </Text>

          <View style={styles.sectionList}>
            {TERMS_SECTIONS.map((section) => (
              <View key={section.title} style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionText}>{section.content}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {!isReadOnly && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setHasReadAndAgree((prev) => !prev)}
            activeOpacity={0.85}
          >
            <View style={[styles.checkbox, hasReadAndAgree && styles.checkboxActive]}>
              {hasReadAndAgree && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
            </View>
            <Text style={styles.checkboxLabel}>
              Saya telah membaca dan menyetujui Terms & Conditions Halo Trubus
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, !hasReadAndAgree && styles.primaryButtonDisabled]}
            onPress={handleContinue}
            disabled={!hasReadAndAgree}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Setuju dan Lanjutkan</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleDecline} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Tidak Setuju</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f2' },
  header: {
    backgroundColor: '#f4f4f2',
    paddingTop: 56,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d6d3d1',
    backgroundColor: '#fcfcfb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d6d3d1',
    backgroundColor: '#fcfcfb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  content: { flex: 1 },
  contentContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl * 1.2,
  },
  documentCard: {
    backgroundColor: '#fffefc',
    borderRadius: 18,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    ...SHADOWS.medium,
  },
  documentTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  documentLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  documentTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1c1917',
    lineHeight: 28,
    maxWidth: '85%',
  },
  pageBadge: {
    borderWidth: 1,
    borderColor: '#e7e5e4',
    backgroundColor: '#fafaf9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pageBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#a8a29e',
    marginHorizontal: 8,
  },
  documentDivider: {
    height: 1,
    backgroundColor: '#ece7e1',
    marginVertical: SPACING.lg,
  },
  openingParagraph: {
    fontSize: 14,
    color: '#44403c',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  sectionList: {
    gap: SPACING.lg,
  },
  sectionBlock: {
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ebe5',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: '#57534e',
    lineHeight: 24,
  },
  footer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: '#ebe7e2',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#d6d3d1',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    ...SHADOWS.small,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
