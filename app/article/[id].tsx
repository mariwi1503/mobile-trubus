import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Share, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  formatArticleDateLong,
  getArticleContentParagraphs,
  getMobileArticleById,
  getMobileArticles,
} from '../../lib/articles';
import { Article } from '../../types/article';

async function loadArticleDetailData(articleId: string) {
  const currentArticle = await getMobileArticleById(articleId);
  let relatedArticles: Article[] = [];

  try {
    const relatedResponse = await getMobileArticles({
      page: 1,
      perPage: 4,
      articleCategoryId: currentArticle.categoryId,
    });

    relatedArticles = relatedResponse.articles
      .filter((candidate) => candidate.id !== currentArticle.id)
      .slice(0, 3);
  } catch {
    relatedArticles = [];
  }

  return {
    article: currentArticle,
    relatedArticles,
  };
}

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const articleId = Array.isArray(id) ? id[0] : id;
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadArticle = async () => {
      if (!articleId) {
        if (isMounted) {
          setError('Artikel tidak ditemukan');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const nextData = await loadArticleDetailData(articleId);

        if (!isMounted) {
          return;
        }

        setArticle(nextData.article);
        setRelatedArticles(nextData.relatedArticles);
        setError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setArticle(null);
        setRelatedArticles([]);
        setError('Artikel tidak ditemukan');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadArticle();

    return () => {
      isMounted = false;
    };
  }, [articleId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>Memuat artikel...</Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{error || 'Artikel tidak ditemukan'}</Text>
        </View>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${article.title}\n\nBaca selengkapnya di Halo Trubus`,
      });
    } catch { }
  };
  const contentParagraphs = getArticleContentParagraphs(article.content);

  const handleRefresh = async () => {
    if (!articleId) {
      return;
    }

    setRefreshing(true);

    try {
      const nextData = await loadArticleDetailData(articleId);
      setArticle(nextData.article);
      setRelatedArticles(nextData.relatedArticles);
      setError(null);
    } catch {
      setError('Artikel tidak dapat diperbarui saat ini');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: article.originalImage || article.image }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroHeader}>
            <TouchableOpacity style={styles.heroBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroBtn} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{article.category}</Text>
          </View>

          <Text style={styles.title}>{article.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{article.author}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{formatArticleDateLong(article.publishedAt)}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
              <Text style={styles.statText}>{article.readTime} min baca</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={14} color={COLORS.textLight} />
              <Text style={styles.statText}>{article.views.toLocaleString('id-ID')} views</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Article Content */}
          <View style={styles.articleContent}>
            {contentParagraphs.map((paragraph, index) => (
              <Text key={`${article.id}-${index}`} style={styles.contentText}>
                {paragraph}
              </Text>
            ))}
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            <Ionicons name="pricetags-outline" size={14} color={COLORS.textSecondary} />
            <View style={styles.tag}><Text style={styles.tagText}>Pertanian</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{article.category}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Trubus</Text></View>
          </View>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>Artikel Terkait</Text>
              {relatedArticles.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={styles.relatedCard}
                  onPress={() => router.push(`/article/${a.id}`)}
                >
                  <Image source={{ uri: a.thumbnailImage || a.image }} style={styles.relatedImage} />
                  <View style={styles.relatedInfo}>
                    <Text style={styles.relatedName} numberOfLines={2}>{a.title}</Text>
                    <Text style={styles.relatedMeta}>{a.readTime} min baca</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  heroContainer: { position: 'relative', height: 260 },
  heroImage: { width: '100%', height: '100%', backgroundColor: '#f0f0f0' },
  heroOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroHeader: {
    position: 'absolute', top: 48, left: SPACING.lg, right: SPACING.lg,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  heroBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  heroActions: { flexDirection: 'row', gap: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, color: COLORS.textSecondary },
  header: {
    position: 'absolute', top: 48, left: SPACING.lg, zIndex: 10,
  },
  contentContainer: {
    padding: SPACING.xl, marginTop: -20,
    backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.md, borderTopRightRadius: RADIUS.md,
  },
  categoryBadge: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start',
  },
  categoryText: { fontSize: 12, color: COLORS.primaryDark, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginTop: 12, lineHeight: 30 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: COLORS.textLight },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 16 },
  articleContent: {},
  contentText: { fontSize: 15, color: COLORS.text, lineHeight: 24, marginBottom: 12 },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, flexWrap: 'wrap' },
  tag: { backgroundColor: COLORS.background, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, color: COLORS.textSecondary },
  relatedSection: { marginTop: 24 },
  relatedTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  relatedCard: {
    flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    marginBottom: 10, overflow: 'hidden',
  },
  relatedImage: { width: 80, height: 80, backgroundColor: '#f0f0f0' },
  relatedInfo: { flex: 1, padding: SPACING.sm, justifyContent: 'center' },
  relatedName: { fontSize: 13, fontWeight: '600', color: COLORS.text, lineHeight: 18 },
  relatedMeta: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
});
