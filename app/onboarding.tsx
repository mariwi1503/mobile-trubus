import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: 'chatbubbles',
    title: 'Konsultasi Ahli',
    subtitle: 'Tanya langsung ke ahli pertanian berpengalaman untuk solusi masalah tanaman Anda',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    image: require('../assets/images/onboarding1.png'),
  },
  {
    icon: 'cart',
    title: 'Belanja Kebutuhan Tani',
    subtitle: 'Temukan bibit, pupuk, pestisida, dan alat pertanian berkualitas dengan harga terbaik',
    color: '#FF9800',
    bgColor: '#FFF3E0',
    image: require('../assets/images/onboarding2.png'),
  },
  {
    icon: 'newspaper',
    title: 'Artikel & Tips',
    subtitle: 'Baca artikel informatif dan tips berkebun dari para ahli untuk meningkatkan hasil panen',
    color: '#2196F3',
    bgColor: '#E3F2FD',
    image: require('../assets/images/onboarding3.png'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setIsOnboarded } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setIsOnboarded(true);
    router.replace('/terms');
  };

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={handleFinish}>
        <Text style={styles.skipText}>Lewati</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {slides.map((slide, index) => (
          <View key={index} style={[styles.slide, { width }]}>
            <Image
              source={slide.image}
              style={{ width: 300, height: 300, marginBottom: 20 }}
              resizeMode="contain"
            />
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {currentIndex === slides.length - 1 ? 'Mulai Sekarang' : 'Selanjutnya'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  skipBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  skipText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconCircle: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  iconInner: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  mascot: { width: 80, height: 80, marginBottom: 10, marginTop: -10 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  bottomSection: { paddingHorizontal: 24, paddingBottom: 50 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.border, marginHorizontal: 4,
  },
  dotActive: { backgroundColor: COLORS.primary, width: 24 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 16,
  },
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginRight: 8 },
});
