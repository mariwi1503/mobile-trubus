import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { useAlert } from '../context/AlertContext';

const REVIEW_TAGS = ['Aplikasi Mudah Dipakai', 'Desain Menarik', 'Konsultasi Membantu', 'Pengiriman Cepat'];

export default function RateAppScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [selectedTag, setSelectedTag] = useState('Aplikasi Mudah Dipakai');

  const submitReview = () => {
    showAlert('Terima kasih!', 'Rating dan masukan Anda berhasil dikirim.');
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Beri Rating</Text>
          <Text style={styles.headerSubtitle}>Bagikan pengalaman Anda menggunakan Halo Trubus</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <Ionicons name="star" size={36} color="#f59e0b" />
          <Text style={styles.heroTitle}>Bagaimana pengalaman Anda?</Text>
          <Text style={styles.heroDescription}>
            Masukan Anda membantu kami membuat aplikasi ini semakin nyaman dipakai.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pilih Rating</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((item) => (
              <TouchableOpacity key={item} onPress={() => setRating(item)} activeOpacity={0.85}>
                <Ionicons
                  name={item <= rating ? 'star' : 'star-outline'}
                  size={38}
                  color={item <= rating ? '#f59e0b' : '#cbd5e1'}
                  style={styles.starIcon}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingCaption}>
            {rating >= 5 ? 'Luar biasa' : rating >= 4 ? 'Bagus' : rating >= 3 ? 'Cukup baik' : 'Masih perlu ditingkatkan'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Apa yang paling Anda sukai?</Text>
          <View style={styles.tagWrap}>
            {REVIEW_TAGS.map((tag) => {
              const active = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagButton, active && styles.tagButtonActive]}
                  onPress={() => setSelectedTag(tag)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tulis Ulasan</Text>
          <TextInput
            style={styles.input}
            value={review}
            onChangeText={setReview}
            placeholder="Ceritakan pengalaman Anda memakai aplikasi ini..."
            placeholderTextColor={COLORS.textLight}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={submitReview} activeOpacity={0.9}>
          <Ionicons name="send" size={18} color={COLORS.white} />
          <Text style={styles.submitText}>Kirim Rating</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.82)', marginTop: 4, lineHeight: 18 },
  content: { flex: 1 },
  contentContainer: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  heroCard: {
    backgroundColor: '#fff7ed',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 10 },
  heroDescription: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  starRow: { flexDirection: 'row', justifyContent: 'center' },
  starIcon: { marginHorizontal: 4 },
  ratingCaption: { textAlign: 'center', marginTop: 10, fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    marginRight: 8,
    marginBottom: 8,
  },
  tagButtonActive: { backgroundColor: COLORS.primary },
  tagText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  tagTextActive: { color: COLORS.white },
  input: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: RADIUS.md,
    padding: 14,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...SHADOWS.small,
  },
  submitText: { color: COLORS.white, fontSize: 15, fontWeight: '700', marginLeft: 8 },
});
