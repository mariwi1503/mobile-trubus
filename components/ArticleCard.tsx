import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { Article } from '../data/articles';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export default function ArticleCard({ article, featured }: ArticleCardProps) {
  const router = useRouter();

  if (featured) {
    return (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => router.push(`/article/${article.id}`)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: article.image }} style={styles.featuredImage} />
        <View style={styles.featuredOverlay}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{article.category.charAt(0).toUpperCase() + article.category.slice(1)}</Text>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>{article.title}</Text>
          <View style={styles.featuredMeta}>
            <Text style={styles.featuredAuthor}>{article.author}</Text>
            <View style={styles.dot} />
            <Text style={styles.featuredDate}>{article.readTime} min baca</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/article/${article.id}`)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: article.image }} style={styles.image} />
      <View style={styles.info}>
        <View style={styles.smallBadge}>
          <Text style={styles.smallBadgeText}>{article.category.charAt(0).toUpperCase() + article.category.slice(1)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.excerpt} numberOfLines={2}>{article.excerpt}</Text>
        <View style={styles.meta}>
          <Ionicons name="time-outline" size={12} color={COLORS.textLight} />
          <Text style={styles.metaText}>{article.readTime} min</Text>
          <View style={styles.dot} />
          <Ionicons name="eye-outline" size={12} color={COLORS.textLight} />
          <Text style={styles.metaText}>{article.views > 1000 ? `${(article.views/1000).toFixed(1)}rb` : article.views}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Featured card
  featuredCard: {
    borderRadius: RADIUS.md, overflow: 'hidden',
    ...SHADOWS.medium, marginBottom: SPACING.lg, height: 200,
  },
  featuredImage: { width: '100%', height: '100%', backgroundColor: '#f0f0f0' },
  featuredOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  categoryBadge: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xs,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 6,
  },
  categoryText: { color: COLORS.white, fontSize: 10, fontWeight: '600' },
  featuredTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white, lineHeight: 22 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  featuredAuthor: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  featuredDate: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },

  // Regular card
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    ...SHADOWS.small, flexDirection: 'row', marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  image: { width: 110, height: 110, backgroundColor: '#f0f0f0' },
  info: { flex: 1, padding: SPACING.sm },
  smallBadge: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.xs,
    paddingHorizontal: 6, paddingVertical: 1, alignSelf: 'flex-start', marginBottom: 4,
  },
  smallBadgeText: { color: COLORS.primaryDark, fontSize: 9, fontWeight: '600' },
  title: { fontSize: 13, fontWeight: '600', color: COLORS.text, lineHeight: 18 },
  excerpt: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, lineHeight: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { fontSize: 10, color: COLORS.textLight, marginLeft: 2 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.textLight, marginHorizontal: 6 },
});
