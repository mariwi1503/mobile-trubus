import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { getMobileFaqs } from '../lib/faqs';
import { FaqItem } from '../types/faq';

export default function FaqScreen() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadFaqs = async () => {
      try {
        setLoading(true);
        const response = await getMobileFaqs();

        if (!isMounted) {
          return;
        }

        setFaqs(response);
        setError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setFaqs([]);
        setError('FAQ belum dapat dimuat dari backend.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadFaqs();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    setOpenId((currentOpenId) => {
      if (currentOpenId && faqs.some((item) => item.id === currentOpenId)) {
        return currentOpenId;
      }

      return faqs[0]?.id ?? null;
    });
  }, [faqs]);

  const groupedFaqs = useMemo(() => {
    const groups = new Map<string, FaqItem[]>();

    faqs.forEach((item) => {
      const categoryFaqs = groups.get(item.category) ?? [];
      categoryFaqs.push(item);
      groups.set(item.category, categoryFaqs);
    });

    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }, [faqs]);

  const isRefreshing = loading && faqs.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>FAQ</Text>
          <Text style={styles.headerSubtitle}>Pertanyaan yang sering ditanyakan pengguna</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => setReloadKey((current) => current + 1)}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="help-circle" size={24} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Butuh jawaban cepat?</Text>
            <Text style={styles.heroDescription}>
              Kami sudah rangkum pertanyaan paling umum seputar pesanan, konsultasi, akun, dan promo.
            </Text>
          </View>
        </View>

        {loading && faqs.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Memuat FAQ...</Text>
          </View>
        ) : null}

        {!loading && faqs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={error ? 'cloud-offline-outline' : 'help-buoy-outline'}
              size={48}
              color={COLORS.textLight}
            />
            <Text style={styles.emptyTitle}>
              {error ? 'FAQ belum tersedia' : 'Belum ada FAQ'}
            </Text>
            <Text style={styles.emptyDescription}>
              {error || 'Pertanyaan yang sering ditanyakan akan muncul di sini.'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setReloadKey((current) => current + 1)}
              activeOpacity={0.85}
            >
              <Text style={styles.retryButtonText}>Coba lagi</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {groupedFaqs.map(({ category, items }) => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>{category}</Text>
            <View style={styles.card}>
              {items.map((item, index) => {
                const isOpen = openId === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.faqItem, index < items.length - 1 && styles.faqItemBorder]}
                    onPress={() => setOpenId(isOpen ? null : item.id)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.questionRow}>
                      <Text style={styles.questionText}>{item.question}</Text>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={COLORS.textSecondary}
                      />
                    </View>

                    {isOpen && <Text style={styles.answerText}>{item.answer}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
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
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 4,
    lineHeight: 18,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryBg,
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  heroDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    ...SHADOWS.small,
  },
  faqItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    paddingRight: 12,
    lineHeight: 20,
  },
  answerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 10,
    paddingRight: 28,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
    ...SHADOWS.small,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  retryButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
});
