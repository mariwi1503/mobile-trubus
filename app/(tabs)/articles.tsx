import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Artikel & Tips</Text>
        <Text style={styles.headerSubtitle}>Informasi terbaru seputar pertanian</Text>
        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Cari artikel..." />
        </View>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
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

      <FlatList
        data={restArticles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 20 }}
        ListHeaderComponent={
          featuredArticle ? <ArticleCard article={featuredArticle} featured /> : null
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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary, paddingTop: 48, paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  searchWrap: { marginTop: SPACING.md },
  catScroll: { marginTop: SPACING.md, marginBottom: SPACING.sm },
  catChip: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.full,
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  catChipActive: { backgroundColor: COLORS.primary },
  catChipText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  catChipTextActive: { color: COLORS.white },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, marginTop: 12 },
});
