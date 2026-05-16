import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Modal, Linking, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS, SPACING, CARD_WIDTH } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useCartAnimation } from '../../context/CartAnimationContext';
import ProductCard from '../../components/ProductCard';
import ExpertCard from '../../components/ExpertCard';
import ArticleCard from '../../components/ArticleCard';
import { MOBILE_API_BASE_URL } from '../../lib/api-config';
import { getMobileArticles } from '../../lib/articles';
import { getMobileExperts } from '../../lib/experts';
import { Article } from '../../types/article';
import { getMobileProducts } from '../../lib/products';
import { Expert } from '../../types/expert';
import { Product } from '../../types/product';

const QUICK_MENU = [
  { id: '1', name: 'Bibit', icon: 'leaf', color: '#4CAF50', bg: '#E8F5E9', route: '/(tabs)/catalog', params: { category: 'bibit' } },
  { id: '2', name: 'Benih', icon: 'flower-outline', color: '#8BC34A', bg: '#F1F8E9', route: '/(tabs)/catalog', params: { category: 'benih' } },
  { id: '3', name: 'Pupuk', icon: 'flask', color: '#CDDC39', bg: '#F9FBE7', route: '/(tabs)/catalog', params: { category: 'pupuk' } },
  { id: '4', name: 'Media Tanam', icon: 'layers', color: '#795548', bg: '#EFEBE9', route: '/(tabs)/catalog', params: { category: 'media' } },
  { id: '5', name: 'Pestisida', icon: 'shield-checkmark', color: '#FF9800', bg: '#FFF3E0', route: '/(tabs)/catalog', params: { category: 'pestisida' } },
  { id: '6', name: 'Alat Tani', icon: 'construct', color: '#F44336', bg: '#FFEBEE', route: '/(tabs)/catalog', params: { category: 'alat' } },
  { id: '7', name: 'Konsultasi', icon: 'people', color: '#2196F3', bg: '#E3F2FD', route: '/(tabs)/experts' },
  { id: '8', name: 'Edukasi', icon: 'book-outline', color: '#9C27B0', bg: '#F3E5F5', route: '/(tabs)/catalog', params: { category: 'edukasi' } },
  { id: '9', name: 'Paket Tani', icon: 'cube', color: '#009688', bg: '#E0F2F1', route: '/(tabs)/catalog' },
  { id: '10', name: 'Semua', icon: 'pricetag', color: '#E91E63', bg: '#FCE4EC', route: '/(tabs)/catalog' },
];

type MobileInterstitialAdResponse = {
  id: string;
  campaignName: string;
  title: string;
  description: string | null;
  imageUrl: string;
  redirectUrl: string | null;
  altText: string | null;
  delayMs: number;
  isActive: boolean;
  isPortalEnabled: boolean;
  isMobileEnabled: boolean;
};

const MOBILE_INTERSTITIAL_API_URL = `${MOBILE_API_BASE_URL}/api/v1/mobile/interstitial-ad`;

const normalizeInterstitialAdPayload = (
  payload: unknown,
): MobileInterstitialAdResponse | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if ('data' in payload) {
    const nestedPayload = (payload as { data?: unknown }).data;
    return normalizeInterstitialAdPayload(nestedPayload ?? null);
  }

  const candidate = payload as Partial<MobileInterstitialAdResponse>;

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.imageUrl !== 'string' ||
    typeof candidate.title !== 'string'
  ) {
    return null;
  }

  return {
    id: candidate.id,
    campaignName: candidate.campaignName ?? candidate.title,
    title: candidate.title,
    description: candidate.description ?? null,
    imageUrl: candidate.imageUrl,
    redirectUrl: candidate.redirectUrl ?? null,
    altText: candidate.altText ?? null,
    delayMs: typeof candidate.delayMs === 'number' ? candidate.delayMs : 1000,
    isActive: candidate.isActive ?? true,
    isPortalEnabled: candidate.isPortalEnabled ?? true,
    isMobileEnabled: candidate.isMobileEnabled ?? true,
  };
};

async function loadHomeProductsData() {
  const response = await getMobileProducts({
    page: 1,
    perPage: 24,
  });

  const products = response.products;

  return {
    featuredProducts: products.slice(0, 6),
    popularProducts: [...products]
      .sort((left, right) => right.sold - left.sold)
      .slice(0, 6),
  };
}

async function loadHomeArticlesData() {
  const response = await getMobileArticles({ page: 1, perPage: 3 });
  return response.articles;
}

async function loadHomeExpertsData() {
  const response = await getMobileExperts({
    page: 1,
    perPage: 6,
    isActive: true,
  });

  return response.experts.slice(0, 6);
}

function ConsumerHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, getCartCount, getUnreadCount } = useApp();
  const { setCartTarget } = useCartAnimation();

  const [interstitialVisible, setInterstitialVisible] = useState(false);
  const [interstitialAd, setInterstitialAd] =
    useState<MobileInterstitialAdResponse | null>(null);
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [onlineExperts, setOnlineExperts] = useState<Expert[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [expertsLoading, setExpertsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const [expertsError, setExpertsError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const cartImpactAnim = React.useRef(new Animated.Value(0)).current;
  const triggerCartImpact = useCallback(() => {
    cartImpactAnim.stopAnimation();
    cartImpactAnim.setValue(0);
    Animated.sequence([
      Animated.timing(cartImpactAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cartImpactAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cartImpactAnim]);
  const setCartTargetNode = useCallback((node: View | null) => {
    setCartTarget('default', node, triggerCartImpact);
  }, [setCartTarget, triggerCartImpact]);

  useEffect(() => {
    let isMounted = true;
    let showInterstitialTimer: ReturnType<typeof setTimeout> | null = null;

    const loadInterstitialAd = async () => {
      try {
        const response = await fetch(MOBILE_INTERSTITIAL_API_URL, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          return;
        }

        const payload = normalizeInterstitialAdPayload(await response.json());

        if (
          !isMounted ||
          !payload?.isActive ||
          !payload.isMobileEnabled ||
          !payload.imageUrl
        ) {
          return;
        }

        setInterstitialAd(payload);
        showInterstitialTimer = setTimeout(() => {
          if (isMounted) {
            setInterstitialVisible(true);
          }
        }, payload.delayMs ?? 1000);
      } catch {
        return;
      }
    };

    void loadInterstitialAd();

    return () => {
      isMounted = false;
      if (showInterstitialTimer) {
        clearTimeout(showInterstitialTimer);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const nextData = await loadHomeProductsData();

        if (!isMounted) {
          return;
        }

        setFeaturedProducts(nextData.featuredProducts);
        setPopularProducts(nextData.popularProducts);
        setProductsError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setFeaturedProducts([]);
        setPopularProducts([]);
        setProductsError('Produk belum dapat dimuat dari backend.');
      } finally {
        if (isMounted) {
          setProductsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadExperts = async () => {
      try {
        const nextExperts = await loadHomeExpertsData();

        if (!isMounted) {
          return;
        }

        setOnlineExperts(nextExperts);
        setExpertsError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setOnlineExperts([]);
        setExpertsError('Ahli belum dapat dimuat dari backend.');
      } finally {
        if (isMounted) {
          setExpertsLoading(false);
        }
      }
    };

    void loadExperts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
      ])
    ).start();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadLatestArticles = async () => {
      try {
        const nextArticles = await loadHomeArticlesData();

        if (!isMounted) {
          return;
        }

        setLatestArticles(nextArticles);
        setArticlesError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setArticlesError('Artikel terbaru belum dapat dimuat.');
      } finally {
        if (isMounted) {
          setArticlesLoading(false);
        }
      }
    };

    void loadLatestArticles();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInterstitialPress = async () => {
    setInterstitialVisible(false);

    const redirectUrl = interstitialAd?.redirectUrl?.trim();

    if (!redirectUrl) {
      return;
    }

    if (redirectUrl.startsWith('/')) {
      router.push(redirectUrl as any);
      return;
    }

    await Linking.openURL(redirectUrl);
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      const [productsResult, articlesResult, expertsResult] = await Promise.allSettled([
        loadHomeProductsData(),
        loadHomeArticlesData(),
        loadHomeExpertsData(),
      ]);

      if (productsResult.status === 'fulfilled') {
        setFeaturedProducts(productsResult.value.featuredProducts);
        setPopularProducts(productsResult.value.popularProducts);
        setProductsError(null);
      } else {
        setProductsError('Produk belum dapat dimuat dari backend.');
      }

      if (articlesResult.status === 'fulfilled') {
        setLatestArticles(articlesResult.value);
        setArticlesError(null);
      } else {
        setArticlesError('Artikel terbaru belum dapat dimuat.');
      }

      if (expertsResult.status === 'fulfilled') {
        setOnlineExperts(expertsResult.value);
        setExpertsError(null);
      } else {
        setExpertsError('Ahli belum dapat dimuat dari backend.');
      }
    } finally {
      setRefreshing(false);
    }
  };
  const firstName = user.name?.trim()?.split(' ')[0] || 'Sahabat';

  return (
    <View style={styles.container}>
      <Modal
        visible={interstitialVisible && Boolean(interstitialAd?.imageUrl)}
        transparent
        animationType="fade"
        onRequestClose={() => setInterstitialVisible(false)}
      >
        <View style={styles.interstitialOverlay}>
          <View style={styles.interstitialCard}>
            <TouchableOpacity
              style={styles.interstitialCloseButton}
              onPress={() => setInterstitialVisible(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={20} color={COLORS.text} />
            </TouchableOpacity>

            {interstitialAd?.imageUrl ? (
              <TouchableOpacity
                activeOpacity={interstitialAd.redirectUrl ? 0.96 : 1}
                disabled={!interstitialAd.redirectUrl}
                onPress={() => {
                  void handleInterstitialPress();
                }}
              >
                <Image
                  source={{ uri: interstitialAd.imageUrl }}
                  accessibilityLabel={interstitialAd.altText || interstitialAd.title}
                  style={styles.interstitialImage}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerIdentity}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.headerAvatar} />
            ) : (
              <Image source={require('../../assets/images/profile.png')} style={styles.headerAvatar} />
            )}

            <View style={styles.headerIntro}>
              <Text style={styles.headerEyebrow}>Selamat datang</Text>
              <Text style={styles.headerGreeting}>Halo, {firstName}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
              {getUnreadCount() > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{getUnreadCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
            <Animated.View
              style={{
                transform: [
                  {
                    scale: cartImpactAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.16],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity ref={setCartTargetNode} style={styles.iconBtn} onPress={() => router.push('/cart')}>
                <Ionicons name="cart-outline" size={22} color={COLORS.white} />
                {getCartCount() > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{getCartCount()}</Text>
                  </View>
                )}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.iconImpactGlow,
                    {
                      opacity: cartImpactAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.28],
                      }),
                      transform: [
                        {
                          scale: cartImpactAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.72, 1.22],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
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
        {/* Consult Expert CTA */}
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg, marginBottom: SPACING.sm }}>
          <View style={[styles.ctaContainer, { position: 'relative' }]}>
            <LinearGradient
              colors={['#065f46', '#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.ctaVisualWrap}>
              <Image
                source={require('../../assets/images/ahli.jpg')}
                style={styles.ctaBackgroundImage}
                resizeMode="cover"
              />
            </View>
            <LinearGradient
              colors={['rgba(6,95,70,0.99)', 'rgba(6,95,70,0.92)', 'rgba(6,95,70,0.52)', 'rgba(6,95,70,0.10)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBackgroundFade}
            />

            <View style={styles.ctaContent}>
              <View style={styles.ctaHeaderRow}>
                <View style={styles.ctaTextContainer}>
                  <Text style={styles.ctaTitle}>Butuh Solusi Cepat?</Text>
                  <Text style={styles.ctaSubtitle}>Tanya pakar kami secara langsung seputar pertanian.</Text>
                </View>
              </View>

              <Animated.View style={{ transform: [{ scale: pulseAnim }], alignSelf: 'flex-start' }}>
                <TouchableOpacity
                  style={[styles.ctaButton, SHADOWS.medium]}
                  onPress={() => router.push('/(tabs)/experts')}
                  activeOpacity={0.9}
                >
                  <Ionicons name="chatbubbles-outline" size={16} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={styles.ctaButtonText}>Konsultasi Sekarang</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Quick Menu */}
        <View style={styles.section}>
          <View style={styles.quickMenu}>
            {QUICK_MENU.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.quickMenuItem}
                onPress={() => router.push(item.params ? { pathname: item.route as any, params: item.params } : item.route as any)}
              >
                <View style={[styles.quickMenuIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={28} color={item.color} />
                </View>
                <Text style={styles.quickMenuText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>



        {/* Online Experts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ahli Online</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/experts')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={CARD_WIDTH + SPACING.md} decelerationRate="fast" snapToAlignment="start" contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
            {expertsLoading && onlineExperts.length === 0 ? (
              <View style={styles.productStatusCard}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.productStatusText}>Memuat ahli...</Text>
              </View>
            ) : onlineExperts.length > 0 ? (
              onlineExperts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))
            ) : (
              <View style={styles.productStatusCard}>
                <Text style={styles.productStatusText}>
                  {expertsError || 'Belum ada ahli yang tersedia.'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Latest Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="pricetag" size={18} color={COLORS.primary} />
              <Text style={[styles.sectionTitle, { marginLeft: 4 }]}>Produk Terbaru</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={CARD_WIDTH + SPACING.md} decelerationRate="fast" snapToAlignment="start" contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
            {productsLoading && featuredProducts.length === 0 ? (
              <View style={styles.productStatusCard}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.productStatusText}>Memuat produk...</Text>
              </View>
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <View style={styles.productStatusCard}>
                <Text style={styles.productStatusText}>
                  {productsError || 'Belum ada produk yang tersedia.'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Popular Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produk Terlaris</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={CARD_WIDTH + SPACING.md} decelerationRate="fast" snapToAlignment="start" contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
            {productsLoading && popularProducts.length === 0 ? (
              <View style={styles.productStatusCard}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.productStatusText}>Memuat produk terlaris...</Text>
              </View>
            ) : popularProducts.length > 0 ? (
              popularProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <View style={styles.productStatusCard}>
                <Text style={styles.productStatusText}>
                  {productsError || 'Belum ada produk yang tersedia.'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Articles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Artikel Terbaru</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/articles')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: SPACING.lg }}>
            {articlesLoading && latestArticles.length === 0 ? (
              <View style={styles.articleStatus}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.articleStatusText}>Memuat artikel terbaru...</Text>
              </View>
            ) : latestArticles.length > 0 ? (
              latestArticles.map((article, index) => (
                <ArticleCard key={article.id} article={article} featured={index === 0} />
              ))
            ) : (
              <View style={styles.articleStatus}>
                <Text style={styles.articleStatusText}>
                  {articlesError || 'Belum ada artikel yang tersedia.'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useApp();

  if (user.role === 'expert') {
    return <Redirect href="/(tabs)/experts" />;
  }

  return <ConsumerHomeScreen />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  interstitialOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  interstitialCard: {
    width: '100%',
    maxWidth: 460,
    position: 'relative',
  },
  interstitialCloseButton: {
    position: 'absolute',
    top: 28,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...SHADOWS.small,
  },
  interstitialImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1080 / 1350,
    resizeMode: 'contain',
    transform: [{ scale: 1.14 }],
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 14,
    ...SHADOWS.small,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  headerIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  headerIntro: {
    flex: 1,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.2,
  },
  headerGreeting: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  iconImpactGlow: {
    position: 'absolute',
    top: -8,
    right: -8,
    bottom: -8,
    left: -8,
    borderRadius: 999,
    backgroundColor: COLORS.white,
  },
  notifBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: COLORS.accent, borderRadius: 10, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  notifBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
  scrollView: { flex: 1 },
  articleStatus: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  articleStatusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  productStatusCard: {
    width: CARD_WIDTH * 2.2,
    minHeight: 124,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.small,
  },
  productStatusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: { marginVertical: SPACING.md },
  sectionPadded: { marginTop: SPACING.lg, paddingHorizontal: SPACING.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  quickMenu: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg, justifyContent: 'space-between',
    backgroundColor: COLORS.white, borderRadius: RADIUS.md, marginHorizontal: SPACING.lg, paddingVertical: SPACING.md
  },
  quickMenuItem: { width: '20%', alignItems: 'center', marginBottom: SPACING.md },
  quickMenuIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  quickMenuText: { fontSize: 11, color: COLORS.text, fontWeight: '600', textAlign: 'center' },

  // CTA Component
  ctaContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  ctaContent: {
    padding: 24,
    paddingTop: 28,
    minHeight: 220,
    justifyContent: 'space-between',
  },
  ctaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ctaTextContainer: {
    width: '58%',
  },
  ctaVisualWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  ctaBackgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.76,
  },
  ctaBackgroundFade: {
    ...StyleSheet.absoluteFillObject,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 6,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: 'rgba(240, 253, 244, 0.9)',
    lineHeight: 18,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
});
