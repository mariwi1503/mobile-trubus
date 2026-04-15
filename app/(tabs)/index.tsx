import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOWS, SPACING, CARD_WIDTH } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { EXPERTS } from '../../data/experts';
import { PRODUCTS } from '../../data/products';
import { ARTICLES } from '../../data/articles';
import ProductCard from '../../components/ProductCard';
import ExpertCard from '../../components/ExpertCard';
import ArticleCard from '../../components/ArticleCard';

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
  { id: '10', name: 'Promo', icon: 'pricetag', color: '#E91E63', bg: '#FCE4EC', route: '/(tabs)/catalog', params: { category: 'promo' } },
];

function ConsumerHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, getCartCount, getUnreadCount } = useApp();

  const [interstitialVisible, setInterstitialVisible] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    setInterstitialVisible(true);
  }, []);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const onlineExperts = EXPERTS.filter(e => e.isOnline).slice(0, 6);
  const featuredRealProducts = PRODUCTS.filter((p) => p.id.startsWith('rp'));
  const promoProducts = featuredRealProducts.filter(p => p.originalPrice).slice(0, 6);
  const popularProducts = [...PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, 6);
  const latestArticles = ARTICLES.slice(0, 3);
  const firstName = user.name?.trim()?.split(' ')[0] || 'Sahabat';

  return (
    <View style={styles.container}>
      <Modal
        visible={interstitialVisible}
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

            <Image
              source={require('../../assets/images/interstitial.png')}
              style={styles.interstitialImage}
            />
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
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cart')}>
              <Ionicons name="cart-outline" size={22} color={COLORS.white} />
              {getCartCount() > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{getCartCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
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
            {onlineExperts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </ScrollView>
        </View>

        {/* Promo Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="pricetag" size={18} color={COLORS.primary} />
              <Text style={[styles.sectionTitle, { marginLeft: 4 }]}>Promo Spesial</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={CARD_WIDTH + SPACING.md} decelerationRate="fast" snapToAlignment="start" contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
            {promoProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
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
            {latestArticles.map((article, index) => (
              <ArticleCard key={article.id} article={article} featured={index === 0} />
            ))}
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
  notifBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: COLORS.accent, borderRadius: 10, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  notifBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
  scrollView: { flex: 1 },
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
