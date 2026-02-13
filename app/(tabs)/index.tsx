import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { EXPERTS } from '../../data/experts';
import { PRODUCTS } from '../../data/products';
import { ARTICLES } from '../../data/articles';
import ProductCard from '../../components/ProductCard';
import ExpertCard from '../../components/ExpertCard';
import ArticleCard from '../../components/ArticleCard';

const { width } = Dimensions.get('window');

const BANNERS = [
  {
    id: '1',
    type: 'featured',
    title: 'Solusi Tani\nLebih Presisi',
    subtitle: 'Konsultasi langsung di lahan Anda melalui bantuan ahli.',
    tag: 'Smart Farming',
    image: 'https://images.unsplash.com/photo-1707944745899-104a4b12d945?q=80&w=1047&auto=format&fit=crop',
    detailImage: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=200',
    color: ['#022c22', '#064e3b', 'transparent'], // emerald-950 to emerald-900/80 to transparent
    btnText: 'Konsultasi Sekarang',
    route: '/(tabs)/experts'
  },
  {
    id: '2',
    type: 'promo',
    title: 'Diskon 30%',
    subtitle: 'Untuk semua pupuk organik',
    image: 'https://media.istockphoto.com/id/532270528/id/foto/hasil-bumi-yang-ditanam-secara-organik-tanpa-pestisida.jpg?s=612x612&w=0&k=20&c=uWpS-8IzhGscFHpnDFlLIFDH8QCVQXnSKPRvPRaQguM=',
    color: ['#F57C00', 'rgba(245, 124, 0, 0.8)', 'transparent'],
    icon: 'pricetag',
    route: '/(tabs)/catalog'
  },
  {
    id: '3',
    type: 'promo',
    title: 'Flash Sale',
    subtitle: 'Bibit tanaman premium mulai 15rb',
    image: 'https://media.istockphoto.com/id/1398965606/id/foto/ayah-dan-anak-perempuan-berbelanja-di-toko-kelontong.jpg?s=612x612&w=0&k=20&c=cIP-RCCA0BHjmhYZ6aolm_T7ygXeFr2tb7QNrjBl7sA=',
    color: ['#C2185B', 'rgba(194, 24, 91, 0.8)', 'transparent'],
    icon: 'flash',
    route: '/(tabs)/catalog'
  },
];

const BannerCard = ({ banner, onPress }: { banner: any, onPress: () => void }) => {
  if (banner.type === 'featured') {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.featuredBannerContainer}>
        <View style={styles.featuredBanner}>
          <Image
            source={{ uri: banner.image }}
            style={styles.featuredBannerBg}
          />
          <LinearGradient
            colors={['#022c22', 'rgba(6, 78, 59, 0.8)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Decoration */}
          <View style={styles.decorationCircle} />

          <View style={styles.featuredBannerContent}>
            <View style={{ flex: 1, paddingVertical: 4 }}>
              <View style={styles.tagContainer}>
                <BlurView intensity={20} style={styles.tagBlur}>
                  <Ionicons name="leaf" size={10} color="#86efac" style={{ marginRight: 6 }} />
                  <Text style={styles.tagText}>{banner.tag}</Text>
                </BlurView>
              </View>

              <Text style={styles.featuredTitle}>{banner.title}</Text>
              <Text style={styles.featuredSubtitle}>{banner.subtitle}</Text>

              <View style={styles.featuredBtn}>
                <Text style={styles.featuredBtnText}>{banner.btnText}</Text>
                <Ionicons name="arrow-forward" size={12} color={COLORS.white} />
              </View>
            </View>

            {/* Visual Detail Circle */}
            <View style={styles.detailImageContainer}>
              <View style={styles.detailImageWrap}>
                <Image source={{ uri: banner.detailImage }} style={styles.detailImage} />
              </View>
              <View style={styles.detailIconBadge}>
                <Ionicons name="leaf" size={14} color="#16a34a" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.promoBannerContainer}>
      <View style={styles.featuredBanner}>
        {banner.image && (
          <Image
            source={{ uri: banner.image }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {/* Gradient only at the bottom for text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={[StyleSheet.absoluteFill, { top: '50%' }]}
        />

        {/* Gradient only at the bottom for text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={[StyleSheet.absoluteFill, { top: '50%' }]}
        />

        <View style={styles.promoContent}>
          <Text style={styles.promoTitle}>{banner.title}</Text>
          <Text style={styles.promoSubtitle}>{banner.subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const QUICK_MENU = [
  { id: '1', name: 'Bibit', icon: 'leaf', color: '#4CAF50', route: '/(tabs)/catalog' },
  { id: '2', name: 'Pupuk', icon: 'flask', color: '#8BC34A', route: '/(tabs)/catalog' },
  { id: '3', name: 'Pestisida', icon: 'shield-checkmark', color: '#FF9800', route: '/(tabs)/catalog' },
  { id: '4', name: 'Alat Tani', icon: 'construct', color: '#F44336', route: '/(tabs)/catalog' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, getCartCount, getUnreadCount } = useApp();
  const [activeBanner, setActiveBanner] = useState(0);
  const flatListRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeBanner + 1) % BANNERS.length;
      setActiveBanner(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBanner]);

  const onScroll = (event: any) => {
    const slide = Math.ceil(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
    if (slide !== activeBanner && slide >= 0 && slide < BANNERS.length) {
      setActiveBanner(slide);
    }
  };

  const onlineExperts = EXPERTS.filter(e => e.isOnline).slice(0, 6);
  const promoProducts = PRODUCTS.filter(p => p.originalPrice).slice(0, 6);
  const popularProducts = PRODUCTS.sort((a, b) => b.sold - a.sold).slice(0, 6);
  const latestArticles = ARTICLES.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: 'https://d64gsuwffb70l.cloudfront.net/698c32f324d41fa898aee39d_1770799657846_84477df5.png' }}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.greeting}>Halo, {user.name.split(' ')[0]}!</Text>
              <Text style={styles.subGreeting}>Mau berkebun apa hari ini?</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
              {getUnreadCount() > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{getUnreadCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cart')}>
              <Ionicons name="cart-outline" size={22} color={COLORS.text} />
              {getCartCount() > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{getCartCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Search */}
        {/* <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/catalog')}>
          <Ionicons name="search-outline" size={18} color={COLORS.textLight} />
          <Text style={styles.searchPlaceholder}>Cari bibit, pupuk, ahli pertanian...</Text>
        </TouchableOpacity> */}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Banner Carousel */}
        {/* Banner Carousel */}
        <View>
          <FlatList
            ref={flatListRef}
            data={BANNERS}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 0 }} // Managed by item width
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <View style={{ width: width - SPACING.lg * 2, marginHorizontal: SPACING.lg }}>
                <BannerCard
                  banner={item}
                  onPress={() => router.push(item.route as any)}
                />
              </View>
            )}
            snapToAlignment="center"
            decelerationRate="fast"
          />

          {/* Pagination/Dots */}
          <View style={styles.pagination}>
            {BANNERS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeBanner === index ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Quick Menu */}
        <View style={styles.section}>
          <View style={styles.quickMenu}>
            {QUICK_MENU.map((item) => (
              <TouchableOpacity key={item.id} style={styles.quickMenuItem} onPress={() => router.push(item.route as any)}>
                <View style={[styles.quickMenuIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={32} color={item.color} />
                </View>
                <Text style={styles.quickMenuText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trubus Coins */}
        <View style={styles.sectionPadded}>
          <TouchableOpacity style={styles.coinCard} onPress={() => router.push('/top-up')}>
            <View style={styles.coinLeft}>
              <View style={styles.coinIconWrap}>
                <Ionicons name="wallet" size={24} color={COLORS.coinColor} />
              </View>
              <View>
                <Text style={styles.coinLabel}>Trubus Pay</Text>
                <Text style={styles.coinAmount}>Rp {user.trubusCoins.toLocaleString('id-ID')}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.topUpBtn} onPress={() => router.push('/top-up')}>
              <Ionicons name="add-circle" size={16} color={COLORS.primary} />
              <Text style={styles.topUpText}>Top Up</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Online Experts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ahli Online</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/experts')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
            {onlineExperts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </ScrollView>
        </View>

        {/* Promo Products */}
        {/* <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flash" size={18} color={COLORS.accent} />
              <Text style={[styles.sectionTitle, { marginLeft: 4 }]}>Promo Spesial</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
            {promoProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ScrollView>
        </View> */}

        {/* Popular Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produk Terlaris</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
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

        {/* Consult Expert CTA */}
        <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xl, marginBottom: SPACING.lg }}>
          <View style={styles.ctaContainer}>
            <LinearGradient
              colors={['#15803d', '#059669']} // green-700 to emerald-600
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.ctaContent}>
              {/* Overlapping Avatars */}
              <View style={styles.avatarRow}>
                {onlineExperts.slice(0, 4).map((expert, i) => (
                  <Image
                    key={expert.id}
                    source={{ uri: expert.image }}
                    style={[
                      styles.ctaAvatar,
                      { zIndex: 4 - i, marginLeft: i === 0 ? 0 : -16 }
                    ]}
                  />
                ))}
              </View>

              <Text style={styles.ctaTitle}>Butuh Solusi Cepat?</Text>
              <Text style={styles.ctaSubtitle}>Tanya apa saja seputar pertanian kepada tim ahli kami.</Text>

              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => router.push('/(tabs)/experts')}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.ctaButtonText}>Hubungi Ahli</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.white, paddingTop: 48, paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs, ...SHADOWS.small,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 40, height: 40, marginRight: SPACING.sm },
  greeting: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  subGreeting: { fontSize: 14, color: COLORS.textSecondary },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { position: 'relative', padding: 6 },
  notifBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: COLORS.accent, borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  notifBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchPlaceholder: { fontSize: 13, color: COLORS.textLight, marginLeft: 8 },
  scrollView: { flex: 1 },
  bannerScroll: { marginTop: SPACING.lg },

  featuredBannerContainer: {
    width: '100%',
    height: 220,
    borderRadius: 30, // rounded-[2.5rem] approx
    overflow: 'hidden',
    backgroundColor: '#022c22', // fallback
    ...SHADOWS.medium,
    shadowColor: '#14532d', // shadow-green-900/10
  },
  featuredBanner: { flex: 1, position: 'relative' },
  featuredBannerBg: { ...StyleSheet.absoluteFillObject, opacity: 0.5 },
  decorationCircle: {
    position: 'absolute', top: -40, right: -40, width: 128, height: 128,
    borderRadius: 64, backgroundColor: 'rgba(74, 222, 128, 0.1)', // green-400/10
  },
  featuredBannerContent: { flex: 1, padding: 24, paddingLeft: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagContainer: { flexDirection: 'row', marginBottom: 12 },
  tagBlur: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  tagText: { fontSize: 9, fontWeight: '800', color: COLORS.white, textTransform: 'uppercase', letterSpacing: 1.5 },
  featuredTitle: { fontSize: 24, fontWeight: '900', color: COLORS.white, marginBottom: 8, lineHeight: 28 },
  featuredSubtitle: { fontSize: 11, fontWeight: '700', color: 'rgba(240, 253, 244, 0.7)', marginBottom: 20, maxWidth: 180, lineHeight: 16 },
  featuredBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#22c55e', // green-500
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start',
    shadowColor: '#14532d', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  featuredBtnText: { color: COLORS.white, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2, marginRight: 8 },
  detailImageContainer: { position: 'relative', display: 'flex' }, // Hidden on small screens? we'll keep it
  detailImageWrap: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)',
    padding: 4, overflow: 'hidden',
  },
  detailImage: { width: '100%', height: '100%', borderRadius: 999 },
  detailIconBadge: {
    position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium,
  },

  // Promo Banners
  promoBannerContainer: {
    width: '100%',
    flex: 1,
    height: 220,
    borderRadius: 30,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  promoBanner: { flex: 1, padding: 24, flexDirection: 'row', alignItems: 'center' },
  promoContent: { flex: 1, zIndex: 1, justifyContent: 'flex-end', padding: 24, paddingBottom: 32 },
  promoTitle: {
    fontSize: 28, fontWeight: '800', color: COLORS.white, marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.9)', maxWidth: 240, fontWeight: '600'
  },
  promoBtn: {
    // Removed
  },
  promoBtnText: {
    // Removed
  },

  // Pagination
  pagination: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, marginTop: SPACING.md,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: COLORS.primary, width: 20 },
  dotInactive: { backgroundColor: COLORS.textLight, opacity: 0.3 },
  promoIconWrap: { position: 'absolute', right: -20, bottom: -20, transform: [{ rotate: '-15deg' }] },
  section: { marginTop: SPACING.xl },
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
  },
  quickMenuItem: { width: '25%', alignItems: 'center', marginBottom: SPACING.md },
  quickMenuIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  quickMenuText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  coinCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.lg, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', ...SHADOWS.small,
    borderWidth: 1, borderColor: '#FFF3E0',
  },
  coinLeft: { flexDirection: 'row', alignItems: 'center' },
  coinIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  coinLabel: { fontSize: 12, color: COLORS.textSecondary },
  coinAmount: { fontSize: 18, fontWeight: '700', color: COLORS.coinColor },
  topUpBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  topUpText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  // CTA Component
  ctaContainer: {
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  ctaContent: {
    padding: 32,
    alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ctaAvatar: {
    width: 56, height: 56,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#16a34a', // green-600 matching gradient start roughly
  },
  ctaTitle: {
    fontSize: 20, fontWeight: '900', color: COLORS.white,
    marginBottom: 8, letterSpacing: 0.5,
  },
  ctaSubtitle: {
    fontSize: 14, fontWeight: '500', color: 'rgba(236, 253, 245, 0.8)',
    textAlign: 'center', marginBottom: 32, maxWidth: 240,
  },
  ctaButton: {
    width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    borderRadius: 28,
    ...SHADOWS.medium,
  },
  ctaButtonText: {
    fontSize: 12, fontWeight: '900', color: '#16a34a',
    textTransform: 'uppercase', letterSpacing: 2.4,
  },
});
// });
