import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import ExpertCard from '../../components/ExpertCard';
import SearchBar from '../../components/SearchBar';
import { useApp } from '../../context/AppContext';
import ConsultationsScreen from '../consultations';
import { EXPERT_CATEGORIES, getMobileExperts } from '../../lib/experts';
import { Expert } from '../../types/expert';

export default function ExpertsScreen() {
  const { user } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExperts = useCallback(async () => {
    try {
      const response = await getMobileExperts({
        page: 1,
        perPage: 100,
        isActive: true,
      });

      setExperts(response.experts);
      setError(null);
    } catch {
      setExperts([]);
      setError('Data ahli belum dapat dimuat dari backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadExperts();
  }, [loadExperts]);

  const filteredExperts = useMemo(() => {
    let result = experts;

    if (selectedCategory !== 'all') {
      result = result.filter((expert) => expert.category === selectedCategory);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (expert) =>
          expert.name.toLowerCase().includes(query) ||
          expert.specialization.toLowerCase().includes(query),
      );
    }

    return result;
  }, [experts, search, selectedCategory]);

  if (user.role === 'expert') {
    return <ConsultationsScreen isTab={true} mode="active" title="Konsultasi" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Konsultasi Ahli</Text>
        <Text style={styles.headerSubtitle}>
          Temukan ahli pertanian terbaik untuk Anda
        </Text>
        <View style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama atau spesialisasi ahli..."
          />
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScrollContent}
        >
          {EXPERT_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catChip,
                selectedCategory === cat.id && styles.catChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as never}
                size={14}
                color={
                  selectedCategory === cat.id ? COLORS.white : COLORS.primary
                }
              />
              <Text
                style={[
                  styles.catChipText,
                  selectedCategory === cat.id && styles.catChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.resultCount}>{filteredExperts.length} ahli ditemukan</Text>
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>
            {experts.filter((expert) => expert.isOnline).length} online
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#B45309" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={filteredExperts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          void loadExperts();
        }}
        renderItem={({ item }) => <ExpertCard expert={item} horizontal />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.emptyText}>Memuat data ahli...</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Tidak ada ahli ditemukan</Text>
              <Text style={styles.emptySubtext}>
                Coba ubah kata kunci atau kategori
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  searchWrap: {
    marginTop: SPACING.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    height: 36,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    ...SHADOWS.small,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  catChipTextActive: {
    color: COLORS.white,
  },
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
    color: COLORS.textSecondary,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: SPACING.lg,
    marginBottom: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 20,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
  },
});
