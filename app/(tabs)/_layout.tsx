import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';

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

export default function TabLayout() {
  const { getCartCount, user } = useApp();
  const cartCount = getCartCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.divider,
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 30,
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
          title: user?.role === 'expert' ? 'Dashboard' : 'Konsultasi',
          tabBarIcon: ({ color }) => <TabBarIcon name={user?.role === 'expert' ? 'grid' : 'chatbubbles'} color={color} />,
          href: user?.role === 'expert' ? null : '/(tabs)/experts', // Experts use profile/articles/consultations list (which we need)
        }}
      />
      <Tabs.Screen
        name="articles"
        options={{
          title: 'Artikel',
          tabBarIcon: ({ color }) => <TabBarIcon name="newspaper" color={color} />,
        }}
      />
      <Tabs.Screen
        name="consultations" // This file mimics "experts" but for the expert's own list? No, "experts" is the list of experts. 
        // We need a way for experts to see their chat list. 
        // Actually, the user asked for "menu artikel dan list konsultasi atau chat untuk dirinya saja"
        // Existing "consultations.tsx" seems to be the history/list.
        options={{
          title: 'Konsultasi',
          tabBarIcon: ({ color }) => <TabBarIcon name="chatbubbles" color={color} />,
          href: user?.role === 'expert' ? '/(tabs)/consultations' : null, // Only for experts? Or both? Consumers access via profile.
        }}
        redirect={user?.role !== 'expert'} // Redirect if not expert? No, consumers might need it but via profile
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabBarIcon name="person" color={color} />,
        }}
      />
    </Tabs>
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
});
