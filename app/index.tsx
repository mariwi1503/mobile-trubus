import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/theme';
import { useApp } from '../context/AppContext';

export default function SplashScreen() {
  const router = useRouter();
  const { isOnboarded } = useApp();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      if (isOnboarded) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isOnboarded]);

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={require('../assets/images/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>Solusi Tani Modern</Text>
      </Animated.View>
      <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
        <View style={styles.loadingBar}>
          <Animated.View style={[styles.loadingFill]} />
        </View>
        <Text style={styles.version}>Versi 1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle1: {
    position: 'absolute', top: -100, right: -100,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  bgCircle2: {
    position: 'absolute', bottom: -80, left: -80,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  logoContainer: { alignItems: 'center' },
  logo: { width: 300, height: 300 },
  tagline: {
    fontSize: 16, color: COLORS.primaryDark,
    fontWeight: '500', marginTop: 8, letterSpacing: 1,
  },
  bottomSection: {
    position: 'absolute', bottom: 60,
    alignItems: 'center',
  },
  loadingBar: {
    width: 120, height: 3, backgroundColor: 'rgba(76,175,80,0.2)',
    borderRadius: 2, overflow: 'hidden',
  },
  loadingFill: {
    width: '60%', height: '100%',
    backgroundColor: COLORS.primary, borderRadius: 2,
  },
  version: { fontSize: 12, color: COLORS.textLight, marginTop: 12 },
});
