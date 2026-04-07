import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, Dimensions, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SHADOWS, SPACING, CARD_WIDTH } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { EXPERTS } from '../../data/experts';
import { PRODUCTS } from '../../data/products';
import { ARTICLES } from '../../data/articles';
import ProductCard from '../../components/ProductCard';
import ExpertCard from '../../components/ExpertCard';
import ArticleCard from '../../components/ArticleCard';
import CSChatWidget from '../../components/CSChatWidget';

const { width, height } = Dimensions.get('window');
const BANNER_WIDTH = width * 0.85;

const BANNERS = [
  { id: '1', route: '/(tabs)/catalog', image: require('../../assets/banner/banner1.png') },
  { id: '2', route: '/(tabs)/catalog', image: require('../../assets/banner/banner2.png') },
  { id: '3', route: '/(tabs)/catalog', image: require('../../assets/banner/banner3.png') },
  { id: '4', route: '/(tabs)/catalog', image: require('../../assets/banner/banner4.png') },
];

const LOOP_COUNT = 1000;
const INFINITE_BANNERS = Array(LOOP_COUNT).fill(BANNERS).flat().map((item, index) => ({
  ...item,
  uniqueId: `${item.id}-${index}`
}));
const INITIAL_INDEX = BANNERS.length * Math.floor(LOOP_COUNT / 2);


const BannerCard = ({ banner }: { banner: any }) => {
  return (
    <View style={styles.featuredBannerContainer}>
      <Image
        source={banner.image}
        style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
      />
    </View>
  );
};

const QUICK_MENU = [
  { id: '1', name: 'Bibit', icon: 'leaf', color: '#4CAF50', bg: '#E8F5E9', route: '/(tabs)/catalog' },
  { id: '2', name: 'Benih', icon: 'flower-outline', color: '#8BC34A', bg: '#F1F8E9', route: '/(tabs)/catalog' },
  { id: '3', name: 'Pupuk', icon: 'flask', color: '#CDDC39', bg: '#F9FBE7', route: '/(tabs)/catalog' },
  { id: '4', name: 'Media Tanam', icon: 'layers', color: '#795548', bg: '#EFEBE9', route: '/(tabs)/catalog' },
  { id: '5', name: 'Pestisida', icon: 'shield-checkmark', color: '#FF9800', bg: '#FFF3E0', route: '/(tabs)/catalog' },
  { id: '6', name: 'Alat Tani', icon: 'construct', color: '#F44336', bg: '#FFEBEE', route: '/(tabs)/catalog' },
  { id: '7', name: 'Konsultasi', icon: 'people', color: '#2196F3', bg: '#E3F2FD', route: '/(tabs)/experts' },
  { id: '8', name: 'Artikel', icon: 'newspaper', color: '#9C27B0', bg: '#F3E5F5', route: '/(tabs)/articles' },
  { id: '9', name: 'Paket Tani', icon: 'cube', color: '#009688', bg: '#E0F2F1', route: '/(tabs)/catalog' },
  { id: '10', name: 'Promo', icon: 'pricetag', color: '#E91E63', bg: '#FCE4EC', route: '/(tabs)/catalog' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, getCartCount, getUnreadCount, addresses } = useApp();
  const defaultAddress = addresses?.find((a: any) => a.isDefault) || addresses?.[0];

  const currentIndexRef = React.useRef(INITIAL_INDEX);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const flatListRef = React.useRef<FlatList>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [interstitialVisible, setInterstitialVisible] = useState(false);
  const chatAnim = React.useRef(new Animated.Value(0)).current;

  // Flash Sale Timer & Animation
  const [timeLeft, setTimeLeft] = useState(2 * 3600 + 45 * 60 + 10); // 2h 45m 10s
  const flashAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    setInterstitialVisible(true);
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 800, useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
      ])
    ).start();

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')} : ${m.toString().padStart(2, '0')} : ${s.toString().padStart(2, '0')}`;
  };

  const openCSChat = () => {
    setChatVisible(true);
    Animated.spring(chatAnim, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 6,
    }).start();
  };

  const closeCSChat = () => {
    Animated.timing(chatAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setChatVisible(false));
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = currentIndexRef.current + 1;
      if (nextIndex < INFINITE_BANNERS.length) {
        currentIndexRef.current = nextIndex;
        setActiveDotIndex(nextIndex % BANNERS.length);
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true, viewPosition: 0.5 });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const onScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / BANNER_WIDTH);
    if (slide !== currentIndexRef.current && slide >= 0 && slide < INFINITE_BANNERS.length) {
      currentIndexRef.current = slide;
      setActiveDotIndex(slide % BANNERS.length);
    }
  };

  const onlineExperts = EXPERTS.filter(e => e.isOnline).slice(0, 6);
  const featuredRealProducts = PRODUCTS.filter((p) => p.id.startsWith('rp'));
  const promoProducts = featuredRealProducts.filter(p => p.originalPrice).slice(0, 6);
  const flashSaleProducts = [...featuredRealProducts].filter(p => p.originalPrice).sort((a, b) => (b.originalPrice! - b.price) - (a.originalPrice! - a.price)).slice(0, 6);
  const popularProducts = [...PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, 6);
  const newProducts = [...PRODUCTS].reverse().slice(0, 6);
  const latestArticles = ARTICLES.slice(0, 3);

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/catalog')} activeOpacity={0.9}>
          <Ionicons name="search-outline" size={20} color={COLORS.textLight} />
          <Text style={styles.searchPlaceholder}>Cari produk, kategori...</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
            {getUnreadCount() > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{getUnreadCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/cart')}>
            <Ionicons name="cart-outline" size={24} color={COLORS.white} />
            {getCartCount() > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{getCartCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={openCSChat}>
            <Ionicons name="headset-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Delivery & Store Info */}
        <View style={styles.deliveryContainer}>
          <TouchableOpacity style={styles.deliveryItem} activeOpacity={0.7} onPress={() => router.push('/addresses')}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.deliveryLabel} numberOfLines={1}>
              Kirim ke: <Text style={styles.deliveryValue}>{defaultAddress ? defaultAddress.label : 'Pilih Alamat'}</Text>
            </Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Loyalty Widget */}
        <View style={styles.loyaltyContainer}>
          <LinearGradient
            colors={['#ffffff', '#fef9c3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loyaltyInner}
          >
            {/* Coins Section (Left) */}
            <TouchableOpacity activeOpacity={0.7} style={styles.loyaltyCoin} onPress={() => router.push('/coin-history')}>
              <View style={styles.loyaltyCoinIcon}>
                <Ionicons name="gift" size={16} color="#d97706" />
              </View>
              <View style={styles.loyaltyCoinContext}>
                <Text style={styles.loyaltyCoinValue}>{user.trubusCoins ? user.trubusCoins.toLocaleString('id-ID') : 0}</Text>
                <Text style={styles.loyaltyCoinLabel}>Trubus Coin</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.loyaltyDivider} />

            {/* Membership Section (Right) */}
            <TouchableOpacity activeOpacity={0.7} style={styles.loyaltyMember} onPress={() => router.push('/membership')}>
              <View style={styles.loyaltyMemberIconWrap}>
                <Ionicons name="ribbon" size={16} color="#d97706" />
              </View>
              <View style={styles.loyaltyMemberContext}>
                <Text style={styles.loyaltyMemberText}>Gold</Text>
                <Text style={styles.loyaltyMemberLabel}>Membership</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Banner Carousel */}
        <View>
          <FlatList
            ref={flatListRef}
            data={INFINITE_BANNERS}
            keyExtractor={(item) => item.uniqueId}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            snapToInterval={BANNER_WIDTH}
            snapToAlignment="center"
            decelerationRate="fast"
            initialScrollIndex={INITIAL_INDEX}
            getItemLayout={(data, index) => ({
              length: BANNER_WIDTH,
              offset: BANNER_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={{ width: BANNER_WIDTH, paddingHorizontal: SPACING.xs }}>
                <BannerCard banner={item} />
              </View>
            )}
          />

          {/* Pagination/Dots */}
          <View style={styles.pagination}>
            {BANNERS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeDotIndex === index ? styles.dotActive : styles.dotInactive,
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

        {/* Flash Sale */}
        <View style={[styles.section, { backgroundColor: '#fff5f5', paddingTop: SPACING.md }]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/catalog')}
            style={styles.flashHeaderContainer}
          >
            <LinearGradient
              colors={['#ef4444', '#f97316', '#eab308']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Background Image of lightning/fire texture */}
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=500&auto=format&fit=crop' }}
              style={[StyleSheet.absoluteFill, { opacity: 0.2, resizeMode: 'cover' }]}
            />

            {/* Animated lightning overlay */}
            <Animated.View style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                opacity: flashAnim
              }
            ]} />

            <View style={styles.flashHeaderContent}>
              <View style={styles.flashTitleRow}>
                <Ionicons name="flash" size={20} color="#fef08a" />
                <Text style={styles.flashTitleText}>FLASH SALE</Text>
              </View>

              <View style={styles.countdownContainer}>
                <Ionicons name="time-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.countdownText}>{formatTime(timeLeft)}</Text>
              </View>

              <View style={styles.flashSeeAll}>
                <Text style={styles.flashSeeAllText}>Lihat Semua</Text>
                <Ionicons name="chevron-forward" size={14} color="#FFF" />
              </View>
            </View>
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={CARD_WIDTH + SPACING.md} decelerationRate="fast" snapToAlignment="start" contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md }}>
            {flashSaleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
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

        {/* New Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produk Terbaru</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/catalog')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={CARD_WIDTH + SPACING.md} decelerationRate="fast" snapToAlignment="start" contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
            {newProducts.map((product) => (
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
          <View style={[styles.ctaContainer, { position: 'relative' }]}>
            <LinearGradient
              colors={['#065f46', '#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Background Texture */}
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1592982537447-6f296c026b7a?q=80&w=600&auto=format&fit=crop' }}
              style={[StyleSheet.absoluteFill, { opacity: 0.15, resizeMode: 'cover' }]}
            />

            <View style={styles.ctaContent}>
              <View style={styles.ctaHeaderRow}>
                <View style={styles.ctaTextContainer}>
                  <View style={styles.liveBadgeWrapper}>
                    <Animated.View style={[styles.liveIndicator, { opacity: flashAnim }]} />
                    <Text style={styles.liveBadgeText}>ON CALL</Text>
                  </View>
                  <Text style={styles.ctaTitle}>Butuh Solusi Cepat?</Text>
                  <Text style={styles.ctaSubtitle}>Tanya pakar kami secara langsung seputar pertanian.</Text>
                </View>

                {/* Overlapping Avatars */}
                <View style={styles.avatarRow}>
                  {onlineExperts.slice(0, 3).map((expert, i) => (
                    <Image
                      key={expert.id}
                      source={{ uri: expert.image }}
                      style={[
                        styles.ctaAvatar,
                        { zIndex: 3 - i, marginLeft: i === 0 ? 0 : -12 }
                      ]}
                    />
                  ))}
                  <View style={styles.ctaMoreAvatar}>
                    <Text style={styles.ctaMoreAvatarText}>+8</Text>
                  </View>
                </View>
              </View>

              <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
                <TouchableOpacity
                  style={[styles.ctaButton, SHADOWS.medium]}
                  onPress={() => router.push('/(tabs)/experts')}
                  activeOpacity={0.9}
                >
                  <Ionicons name="chatbubbles-outline" size={18} color="#059669" style={{ marginRight: 8 }} />
                  <Text style={styles.ctaButtonText}>Mulai Konsultasi Gratis</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Customer Service Widget Overlay */}
      {chatVisible && (
        <Animated.View style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(0,0,0,0.4)',
            opacity: chatAnim,
            zIndex: 99,
          }
        ]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeCSChat} />
        </Animated.View>
      )}

      {chatVisible && (
        <Animated.View style={[
          styles.chatWidgetContainer,
          {
            opacity: chatAnim,
            transform: [
              { scale: chatAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
              { translateY: chatAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }) }
            ],
            transformOrigin: 'bottom right',
          }
        ]}>
          <CSChatWidget onClose={closeCSChat} isOverlay />
        </Animated.View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  interstitialOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
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
    paddingTop: 54,
    paddingHorizontal: SPACING.lg,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.small,
    zIndex: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { position: 'relative', padding: 2 },
  notifBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: COLORS.accent, borderRadius: 10, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  notifBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
  searchBar: {
    flex: 1,
    marginRight: 16,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
  },
  searchPlaceholder: { fontSize: 13, color: COLORS.textLight, marginLeft: 8 },
  scrollView: { flex: 1 },
  bannerScroll: { marginTop: SPACING.lg },
  loyaltyContainer: { marginHorizontal: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.lg, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, ...SHADOWS.small, borderWidth: 1, borderColor: '#fef08a', overflow: 'hidden' },
  loyaltyInner: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  // Coin Left
  loyaltyCoin: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  loyaltyCoinIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  loyaltyCoinContext: { flex: 1, justifyContent: 'center' },
  loyaltyCoinValue: { fontSize: 16, fontWeight: '500', color: COLORS.text, marginBottom: 2 },
  loyaltyCoinLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '400' },

  loyaltyDivider: { width: 1, height: 36, backgroundColor: '#fde68a', marginHorizontal: 16 },

  // Member Right
  loyaltyMember: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 8 },
  loyaltyMemberIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  loyaltyMemberContext: { flex: 1, justifyContent: 'center' },
  loyaltyMemberText: { fontSize: 16, color: '#d97706', fontWeight: '500', marginBottom: 2 },
  loyaltyMemberLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '400' },

  featuredBannerContainer: {
    width: '100%',
    aspectRatio: 3392 / 1248,
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.xs,
    overflow: 'hidden',
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
    height: 170,
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
  section: { marginTop: SPACING.md },
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
  },
  ctaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  ctaTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  liveBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444', // red
    marginRight: 6,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  ctaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#059669',
  },
  ctaMoreAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    marginLeft: -12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#059669',
  },
  ctaMoreAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    width: '100%',
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  fabCSContainer: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
    zIndex: 98,
  },
  fabCS: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
    elevation: 6,
    shadowColor: COLORS.primary,
  },
  fabMicBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  chatWidgetContainer: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: width * 0.05,
    right: width * 0.05,
    width: width * 0.9,
    height: height * 0.7,
    zIndex: 100,
  },
  flashHeaderContainer: {
    marginHorizontal: SPACING.lg,
    height: 56,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  flashHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  flashTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flashTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
    marginLeft: 6,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  flashSeeAll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flashSeeAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    marginRight: 2,
  },
  deliveryContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  deliveryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
});
