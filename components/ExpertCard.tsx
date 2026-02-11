import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { Expert } from '../data/experts';

interface ExpertCardProps {
  expert: Expert;
  horizontal?: boolean;
}

export default function ExpertCard({ expert, horizontal }: ExpertCardProps) {
  const router = useRouter();

  if (horizontal) {
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={() => router.push(`/expert/${expert.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.hImageContainer}>
          <Image source={{ uri: expert.image }} style={styles.hImage} />
          {expert.isOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.hInfo}>
          <Text style={styles.hName} numberOfLines={1}>{expert.name}</Text>
          <Text style={styles.hSpec} numberOfLines={1}>{expert.specialization}</Text>
          <View style={styles.hMeta}>
            <Ionicons name="star" size={12} color={COLORS.warning} />
            <Text style={styles.hRating}>{expert.rating}</Text>
            <Text style={styles.hReviews}>({expert.reviews})</Text>
            <View style={styles.dot} />
            <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.hExp}>{expert.experience} thn</Text>
          </View>
          <View style={styles.hBottom}>
            <Text style={styles.hFee}>Rp {expert.fee.toLocaleString('id-ID')}</Text>
            <TouchableOpacity
              style={styles.consultBtn}
              onPress={() => router.push(`/expert/${expert.id}`)}
            >
              <Ionicons name="chatbubbles-outline" size={14} color={COLORS.white} />
              <Text style={styles.consultBtnText}>Konsultasi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/expert/${expert.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: expert.image }} style={styles.image} />
        {expert.isOnline && <View style={styles.onlineDotSmall} />}
      </View>
      <Text style={styles.name} numberOfLines={1}>{expert.name.split(',')[0]}</Text>
      <Text style={styles.spec} numberOfLines={1}>{expert.specialization.replace('Ahli ', '')}</Text>
      <View style={styles.ratingRow}>
        <Ionicons name="star" size={10} color={COLORS.warning} />
        <Text style={styles.ratingText}>{expert.rating}</Text>
      </View>
      <Text style={styles.fee}>Rp {(expert.fee / 1000).toFixed(0)}rb</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    ...SHADOWS.small, padding: SPACING.md,
    alignItems: 'center', width: 120, marginRight: SPACING.md, marginBottom: SPACING.md,
  },
  imageContainer: { position: 'relative', marginBottom: 8 },
  image: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f0f0f0' },
  onlineDotSmall: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.white,
  },
  name: { fontSize: 11, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  spec: { fontSize: 9, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 10, fontWeight: '600', color: COLORS.text, marginLeft: 2 },
  fee: { fontSize: 11, fontWeight: '700', color: COLORS.primaryDark, marginTop: 4 },

  // Horizontal card
  horizontalCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    ...SHADOWS.small, flexDirection: 'row', padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  hImageContainer: { position: 'relative', marginRight: SPACING.md },
  hImage: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f0f0f0' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.white,
  },
  hInfo: { flex: 1 },
  hName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  hSpec: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  hMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  hRating: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginLeft: 2 },
  hReviews: { fontSize: 11, color: COLORS.textLight, marginLeft: 2 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.textLight, marginHorizontal: 6 },
  hExp: { fontSize: 11, color: COLORS.textSecondary, marginLeft: 2 },
  hBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  hFee: { fontSize: 14, fontWeight: '700', color: COLORS.primaryDark },
  consultBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  consultBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600', marginLeft: 4 },
});
