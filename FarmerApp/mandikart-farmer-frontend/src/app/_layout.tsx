/**
 * MandiKart Farmer App — Root Navigation Layout (Per-Screen Custom Animations)
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Platform, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => {});

if (typeof console !== 'undefined') {
  const origError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes("The action 'GO_BACK' was not handled")) {
      return;
    }
    origError.apply(console, args);
  };
  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes("The action 'GO_BACK' was not handled")) {
      return;
    }
    origWarn.apply(console, args);
  };
}

LogBox.ignoreLogs([
  "The action 'GO_BACK' was not handled by any navigator",
  "The action 'GO_BACK' was not handled",
  "Is there any screen to go back to?",
]);


export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FAF8F5' },
          animation: 'slide_from_right',
          animationDuration: 320,
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="language-select" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding/permissions" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/signup" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="auth/login" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="auth/verify-otp" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/callback" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding/farmer-profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding/farm-details" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="more/documents" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="more/bank-details" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="more/notifications" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="more/help-support" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="more/terms-privacy" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="more/settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="more/profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="earnings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="orders/track-vehicle" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="sell/best-options" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="sell/market" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="sell/requests" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="sell/chat" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="sell/history" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="produce/add" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="produce/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="market-prices" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="market-trends" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="search" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="requirements/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="requirements/create" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="requirements/select-products" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="requirements/specifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="requirements/quantity-budget" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="requirements/delivery" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="requirements/review" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="requirements/publish" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="requirements/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="requirements/edit" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="requirements/cancel" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="requirements/recurring" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="matching/matches" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="matching/recommended" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="matching/details" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="matching/compare" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="matching/delivered-cost" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="matching/aggregation" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="matching/fulfillment" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="offers/incoming" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="offers/sent" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="offers/details" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="offers/make-offer" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="offers/counter" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="offers/chat" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="offers/history" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="offers/summary" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="offers/accept" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="offers/reject" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="source/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="source/categories" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="source/search" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="source/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="source/suppliers/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="source/suppliers/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="source/suppliers/verification" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="source/prices/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="source/prices/history" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="ai-assistant" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
