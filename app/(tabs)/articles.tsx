import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { ARTICLES, ARTICLE_CATEGORIES } from '../../data/articles';
import ArticleCard from '../../components/ArticleCard';
import SearchBar from '../../components/SearchBar';

export default function ArticlesScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredArticles = useMemo(() => {
    let result = ARTICLES;
    if (selectedCategory !== 'all') {
      result = result.filter(a => a.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, selectedCategory]);

  const featuredArticle = filteredArticles[0];
  const restArticles = filteredArticles.slice(1);

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
          {ARTICLE_CATEGORIES.map((cat) => (
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
        ListHeaderComponent={
          featuredArticle ? (
            <View style={styles.featuredWrap}>
              <ArticleCard article={featuredArticle} featured />
              {restArticles.length > 0 && <Text style={styles.sectionTitle}>Artikel Terbaru</Text>}
            </View>
          ) : null
        }
        renderItem={({ item }) => <ArticleCard article={item} />}
        ListEmptyComponent={
          !featuredArticle ? (
            <View style={styles.empty}>
              <Ionicons name="newspaper-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Tidak ada artikel ditemukan</Text>
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

  // FIXED CATEGORIES LAYOUT
  categoriesContainer: {
    height: 55, // Mengunci tinggi area kategori
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  catScrollContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center', // Sejajar vertikal
  },
  catChip: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    height: 34, // Tinggi chip konsisten
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

  // LIST STYLING
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 30
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
    marginTop: 12
  },
});