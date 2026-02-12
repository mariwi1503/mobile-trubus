import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { EXPERTS, EXPERT_CATEGORIES } from '../../data/experts';
import ExpertCard from '../../components/ExpertCard';
import SearchBar from '../../components/SearchBar';

import { useApp } from '../../context/AppContext';
import ConsultationsScreen from '../consultations';

export default function ExpertsScreen() {
  const router = useRouter();
  const { user } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredExperts = useMemo(() => {
    let result = EXPERTS;
    if (selectedCategory !== 'all') {
      result = result.filter(e => e.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.specialization.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, selectedCategory]);

  // If expert, show their consultation history instead of expert list
  if (user.role === 'expert') {
    return <ConsultationsScreen isTab={true} />;
  }

  return (
    <View style={styles.container}>
      {/* 1. Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Konsultasi Ahli</Text>
        <Text style={styles.headerSubtitle}>Temukan ahli pertanian terbaik untuk Anda</Text>
        <View style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama atau spesialisasi ahli..."
          />
        </View>
      </View>

      {/* 2. Categories Section - Fixed Height 55px */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScrollContent}
        >
          {EXPERT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={selectedCategory === cat.id ? COLORS.white : COLORS.primary}
              />
              <Text style={[styles.catChipText, selectedCategory === cat.id && styles.catChipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 3. Stats Row */}
      <View style={styles.statsRow}>
        <Text style={styles.resultCount}>{filteredExperts.length} ahli ditemukan</Text>
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>{EXPERTS.filter(e => e.isOnline).length} online</Text>
        </View>
      </View>

      {/* 4. Expert List */}
      <FlatList
        data={filteredExperts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ExpertCard expert={item} horizontal />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>Tidak ada ahli ditemukan</Text>
            <Text style={styles.emptySubtext}>Coba ubah kata kunci atau kategori</Text>
          </View>
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
    height: 55, // Mengunci tinggi baris kategori
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  catScrollContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center', // Menjaga chip di tengah secara vertikal
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    height: 36, // Tinggi tombol chip dikunci
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
    fontWeight: '600',
    marginLeft: 6
  },
  catChipTextActive: {
    color: COLORS.white
  },

  // STATS & LIST
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
  },
  resultCount: {
    fontSize: 12,
    color: COLORS.textSecondary
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 4
  },
  onlineText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600'
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 20
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
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4
  },
});