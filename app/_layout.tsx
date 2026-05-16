import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { AppProvider } from '../context/AppContext';
import { AlertProvider } from '../context/AlertContext';
import { CartAnimationProvider } from '../context/CartAnimationContext';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  useEffect(() => {
    async function configureNavigationBar() {
      // Pastikan navigation bar terlihat dan behavior normal
      await NavigationBar.setVisibilityAsync('visible');
      // Remove inset-touch to prevent content from flowing under the navigation bar
      // await NavigationBar.setBehaviorAsync('inset-touch');
      await NavigationBar.setPositionAsync('relative');
      await NavigationBar.setBackgroundColorAsync('#ffffff');
      await NavigationBar.setButtonStyleAsync('dark');
    }
    configureNavigationBar();
  }, []);

  return (
    <AppProvider>
      <AlertProvider>
        <CartAnimationProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="expert/[id]" />
            <Stack.Screen name="expert/schedule" />
            <Stack.Screen name="product/[id]" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="payment" />
            <Stack.Screen name="order/[id]" />
            <Stack.Screen name="order-success" />
            <Stack.Screen name="orders" />
            <Stack.Screen name="consultations" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="addresses" />
            <Stack.Screen name="address-form" />
            <Stack.Screen name="article/[id]" />
          </Stack>
        </CartAnimationProvider>
      </AlertProvider>
    </AppProvider>
  );
}
