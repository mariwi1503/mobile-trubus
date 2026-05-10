import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import ArticleCard from '../../components/ArticleCard';
import SearchBar from '../../components/SearchBar';
import { getMobileArticleCategories, getMobileArticles } from '../../lib/articles';
import { Article, ArticleCategory } from '../../types/article';

export default function ArticlesScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const response = await getMobileArticleCategories();

        if (!isMounted) {
          return;
        }

        setCategories(response);
      } catch {
        if (!isMounted) {
          return;
        }

        setCategories([]);
      }
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadArticles = async () => {
      try {
        setLoading(true);

        const response = await getMobileArticles({
          page: 1,
          perPage: 25,
          search: debouncedSearch || undefined,
          articleCategoryId:
            selectedCategory !== 'all' ? selectedCategory : undefined,
        });

        if (!isMounted) {
          return;
        }

        setArticles(response.articles);
        setError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setArticles([]);
        setError('Artikel belum dapat dimuat dari backend.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadArticles();

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, selectedCategory, reloadKey]);

  const articleCategories = [
    { id: 'all', name: 'Semua', slug: 'all' },
    ...categories,
  ];
  const featuredArticle = articles[0];
  const restArticles = articles.slice(1);
  const isRefreshing = loading && articles.length > 0;

  return (
    <View style={styles.container}>
      {/* 1. Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Artikel & Tips</Text>
        <Text style={styles.headerSubtitle}>Informasi terbaru seputar pertanian</Text>
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Cari artikel..." />
        </View>
      </View>

      {/* 2. Categories Section - Fixed Height 55px */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScrollContent}
        >
          {articleCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.catChipText, selectedCategory === cat.id && styles.catChipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. Articles List */}
      <FlatList
        data={restArticles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => setReloadKey((current) => current + 1)}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          loading && articles.length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Memuat artikel...</Text>
            </View>
          ) : featuredArticle ? (
            <View style={styles.featuredWrap}>
              <ArticleCard article={featuredArticle} featured />
              {restArticles.length > 0 && <Text style={styles.sectionTitle}>Artikel Terbaru</Text>}
            </View>
          ) : null
        }
        renderItem={({ item }) => <ArticleCard article={item} />}
        ListEmptyComponent={
          !loading && !featuredArticle ? (
            <View style={styles.empty}>
              <Ionicons
                name={error ? 'cloud-offline-outline' : 'newspaper-outline'}
                size={48}
                color={COLORS.textLight}
              />
              <Text style={styles.emptyText}>
                {error || 'Tidak ada artikel ditemukan'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 25,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4
  },
  searchWrap: {
    marginTop: SPACING.md
  },
  categoriesContainer: {
    height: 55,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  catScrollContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  catChip: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    height: 34,
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    ...SHADOWS.small,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  catChipText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600'
  },
  catChipTextActive: {
    color: COLORS.white
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 30
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18,
    paddingBottom: 10,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  featuredWrap: {
    paddingTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
});
