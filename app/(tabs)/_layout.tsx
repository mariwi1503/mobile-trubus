import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import CSChatWidget from '../../components/CSChatWidget';

const { width, height } = Dimensions.get('window');

function TabBarIcon({ name, color, badge, size = 28 }: { name: any; color: string; badge?: number; size?: number }) {
  return (
    <View style={{ position: 'relative' }}>
      <Ionicons name={name} size={size} color={color} />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

function DraftOrderBanner() {
  const { getDraftOrder } = useApp();
  const router = useRouter();
  const draftOrder = getDraftOrder();
  const tabBarHeight = Platform.OS === 'ios' ? 90 : 70;

  if (!draftOrder) return null;

  return (
    <TouchableOpacity
      style={[styles.draftBanner, { bottom: tabBarHeight + SPACING.md }]}
      onPress={() => router.push({ pathname: '/payment', params: { orderId: draftOrder.id } })}
      activeOpacity={0.9}
    >
      <View style={styles.draftBannerLeft}>
        <Ionicons name="alert-circle" size={18} color={COLORS.white} />
        <View style={{ flex: 1 }}>
          <Text style={styles.draftBannerTitle}>Selesaikan pesananmu!</Text>
          <Text style={styles.draftBannerSub} numberOfLines={1}>
            Rp {draftOrder.totalAmount.toLocaleString('id-ID')} · Menunggu pembayaran
          </Text>
        </View>
      </View>
      <View style={styles.draftBannerBtn}>
        <Text style={styles.draftBannerBtnText}>Bayar</Text>
        <Ionicons name="arrow-forward" size={13} color={COLORS.accentOrange} />
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const { user, getDraftOrder } = useApp();
  const insets = useSafeAreaInsets();
  const [chatVisible, setChatVisible] = useState(false);
  const chatAnim = React.useRef(new Animated.Value(0)).current;
  const tabBarHeight = Platform.OS === 'ios' ? 90 : 70;
  const hasDraftOrder = Boolean(getDraftOrder());
  const floatingBottom = hasDraftOrder ? tabBarHeight + 84 : tabBarHeight + SPACING.lg;

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

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textLight,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopColor: COLORS.divider,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 90 : 70,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Beranda',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
            href: user?.role === 'expert' ? null : '/(tabs)',
          }}
        />
        <Tabs.Screen
          name="catalog"
          options={{
            title: 'Katalog',
            tabBarIcon: ({ color }) => <TabBarIcon name="grid" color={color} />,
            href: user?.role === 'expert' ? null : '/(tabs)/catalog',
          }}
        />
        <Tabs.Screen
          name="experts"
          options={{
            title: 'Konsultasi',
            tabBarIcon: ({ color }) => <TabBarIcon name="chatbubbles" color={color} />,
          }}
        />
        <Tabs.Screen
          name="consultation-history"
          options={{
            title: 'Riwayat',
            tabBarIcon: ({ color }) => <TabBarIcon name="time" color={color} />,
            href: user?.role === 'expert' ? '/(tabs)/consultation-history' : null,
          }}
        />
        <Tabs.Screen
          name="articles"
          options={{
            title: 'Artikel',
            tabBarIcon: ({ color }) => <TabBarIcon name="newspaper" color={color} />,
            href: user?.role === 'expert' ? null : '/(tabs)/articles',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
          }}
        />
      </Tabs>

      {/* Global Draft Order Banner — muncul di semua tab, di bawah ikon CS */}
      <DraftOrderBanner />

      {user?.role !== 'expert' && (
        <View style={[styles.fabCSContainer, { bottom: floatingBottom }]}>
          <TouchableOpacity style={styles.fabCS} onPress={openCSChat} activeOpacity={0.9}>
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      {chatVisible && (
        <Animated.View style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(0,0,0,0.4)',
            opacity: chatAnim,
            zIndex: 119,
          }
        ]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeCSChat} />
        </Animated.View>
      )}

      {chatVisible && (
        <Animated.View style={[
          styles.chatWidgetContainer,
          { bottom: floatingBottom },
          {
            opacity: chatAnim,
            transform: [
              { scale: chatAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
              { translateY: chatAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }) }
            ],
          }
        ]}>
          <CSChatWidget onClose={closeCSChat} isOverlay />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },
  draftBanner: {
    position: 'absolute',
    right: SPACING.lg,
    left: SPACING.lg,
    backgroundColor: '#E65100',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 90,
    ...SHADOWS.large,
  },
  draftBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  draftBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  draftBannerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  draftBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginLeft: 8,
  },
  draftBannerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentOrange,
  },
  fabCSContainer: {
    position: 'absolute',
    right: SPACING.lg,
    zIndex: 120,
    elevation: 12,
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
  chatWidgetContainer: {
    position: 'absolute',
    left: width * 0.05,
    right: width * 0.05,
    width: width * 0.9,
    height: height * 0.7,
    zIndex: 120,
  },
});
