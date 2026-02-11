import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { EXPERTS } from '../../data/experts';
import { PRODUCTS } from '../../data/products';
import { ARTICLES } from '../../data/articles';
import ProductCard from '../../components/ProductCard';
import ExpertCard from '../../components/ExpertCard';
import ArticleCard from '../../components/ArticleCard';

const BANNERS = [
  { id: '1', title: 'Konsultasi Gratis!', subtitle: 'Konsultasi pertama dengan ahli pertanian', color: '#4CAF50', icon: 'chatbubbles' },
  { id: '2', title: 'Diskon 30%', subtitle: 'Untuk semua pupuk organik', color: '#FF9800', icon: 'pricetag' },
  { id: '3', title: 'Flash Sale', subtitle: 'Bibit tanaman premium mulai 15rb', color: '#E91E63', icon: 'flash' },
];

const QUICK_MENU = [
  { id: '1', name: 'Konsultasi', icon: 'chatbubbles', color: '#4CAF50', route: '/(tabs)/experts' },
  { id: '2', name: 'Bibit', icon: 'leaf', color: '#8BC34A', route: '/(tabs)/catalog' },
  { id: '3', name: 'Pupuk', icon: 'flask', color: '#FF9800', route: '/(tabs)/catalog' },
  { id: '4', name: 'Pestisida', icon: 'shield-checkmark', color: '#F44336', route: '/(tabs)/catalog' },
  { id: '5', name: 'Alat Tani', icon: 'construct', color: '#9C27B0', route: '/(tabs)/catalog' },
  { id: '6', name: 'Artikel', icon: 'newspaper', color: '#2196F3', route: '/(tabs)/articles' },
  { id: '7', name: 'Pesanan', icon: 'receipt', color: '#607D8B', route: '/orders' },
  { id: '8', name: 'Promo', icon: 'pricetags', color: '#E91E63', route: '/(tabs)/catalog' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, getCartCount, getUnreadCount } = useApp();
  const [searchText, setSearchText] = useState('');

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
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/catalog')}>
          <Ionicons name="search-outline" size={18} color={COLORS.textLight} />
          <Text style={styles.searchPlaceholder}>Cari bibit, pupuk, ahli pertanian...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Banner Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bannerScroll} contentContainerStyle={{ paddingHorizontal: SPACING.lg }}>
          {BANNERS.map((banner) => (
            <TouchableOpacity key={banner.id} style={[styles.banner, { backgroundColor: banner.color }]} activeOpacity={0.8}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>{banner.title}</Text>
                <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                <View style={styles.bannerBtn}>
                  <Text style={styles.bannerBtnText}>Lihat</Text>
                </View>
              </View>
              <View style={styles.bannerIconWrap}>
                <Ionicons name={banner.icon as any} size={50} color="rgba(255,255,255,0.3)" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Menu */}
        <View style={styles.section}>
          <View style={styles.quickMenu}>
            {QUICK_MENU.map((item) => (
              <TouchableOpacity key={item.id} style={styles.quickMenuItem} onPress={() => router.push(item.route as any)}>
                <View style={[styles.quickMenuIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={styles.quickMenuText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trubus Coins */}
        <View style={styles.sectionPadded}>
          <TouchableOpacity style={styles.coinCard} onPress={() => router.push('/(tabs)/profile')}>
            <View style={styles.coinLeft}>
              <View style={styles.coinIconWrap}>
                <Ionicons name="wallet" size={24} color={COLORS.coinColor} />
              </View>
              <View>
                <Text style={styles.coinLabel}>Trubus Coin</Text>
                <Text style={styles.coinAmount}>Rp {user.trubusCoins.toLocaleString('id-ID')}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.topUpBtn}>
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
        <View style={styles.section}>
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
        </View>

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

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.white, paddingTop: 48, paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl,
    ...SHADOWS.small,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogo: { width: 40, height: 40, marginRight: SPACING.sm },
  greeting: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  subGreeting: { fontSize: 12, color: COLORS.textSecondary },
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
  banner: {
    width: 280, borderRadius: RADIUS.lg, padding: SPACING.lg,
    marginRight: SPACING.md, flexDirection: 'row', overflow: 'hidden', height: 120,
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  bannerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  bannerBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.sm,
    paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 10,
  },
  bannerBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  bannerIconWrap: { position: 'absolute', right: 10, bottom: 10, opacity: 0.5 },
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
  quickMenuItem: { width: '25%', alignItems: 'center', marginBottom: SPACING.lg },
  quickMenuIcon: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  quickMenuText: { fontSize: 11, color: COLORS.text, fontWeight: '500' },
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
});
