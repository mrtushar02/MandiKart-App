import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { StatusBar, View, Text, TouchableOpacity, StyleSheet, LogBox } from 'react-native';

if (typeof console !== 'undefined') {
  const origError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes("The action 'GO_BACK' was not handled")) {
      return;
    }
    origError.apply(console, args);
  };
  const origWarn = console.warn;
  console.warn = (...args) => {
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
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Context Providers
import { PartnerProvider } from './context/PartnerContext';
import { COLORS, FONT, RADIUS, SPACING } from './constants/theme';

// MandiKart Delivery Partner Screens (Stitch Project 18346905377238271210)
import AppIntroScreen from './screens/AppIntroScreen';
import PartnerSplashScreen from './screens/PartnerSplashScreen';
import PartnerLoginScreen from './screens/PartnerLoginScreen';
import PartnerRegisterScreen from './screens/PartnerRegisterScreen';
import PartnerTabNavigator from './navigation/PartnerTabNavigator';
import PartnerDeliveryDetailScreen from './screens/PartnerDeliveryDetailScreen';
import PartnerActiveRouteScreen from './screens/PartnerActiveRouteScreen';
import PartnerDeliveryPODScreen from './screens/PartnerDeliveryPODScreen';
import BadDeliveryScreen from './screens/BadDeliveryScreen';
import PartnerPayoutHistoryScreen from './screens/PartnerPayoutHistoryScreen';
import PartnerNotificationsScreen from './screens/PartnerNotificationsScreen';
import PartnerSupportScreen from './screens/PartnerSupportScreen';
import PartnerLegalPoliciesScreen from './screens/PartnerLegalPoliciesScreen';
import PartnerProfileScreen from './screens/PartnerProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PartnerProvider>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Intro"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
              animation: 'slide_from_right',
            }}
          >
            {/* App Intro Walkthrough */}
            <Stack.Screen name="Intro" component={AppIntroScreen} />

            {/* Auth & Onboarding Flow */}
            <Stack.Screen name="Splash" component={PartnerSplashScreen} />
            <Stack.Screen name="Login" component={PartnerLoginScreen} />
            <Stack.Screen name="Register" component={PartnerRegisterScreen} />

            {/* Core Delivery Partner Bottom Tabs */}
            <Stack.Screen name="MainTabs" component={PartnerTabNavigator} />

            {/* Delivery Operations Sub-Screens */}
            <Stack.Screen name="DeliveryDetail" component={PartnerDeliveryDetailScreen} />
            <Stack.Screen name="ActiveRoute" component={PartnerActiveRouteScreen} />
            <Stack.Screen name="DeliveryPOD" component={PartnerDeliveryPODScreen} />

            {/* 🚨 Bad Delivery & Exception Handling */}
            <Stack.Screen name="BadDelivery" component={BadDeliveryScreen} />

            {/* Finance & Payout Sub-Screens */}
            <Stack.Screen name="PayoutHistory" component={PartnerPayoutHistoryScreen} />

            {/* Profile, Alerts & Support Sub-Screens */}
            <Stack.Screen name="Profile" component={PartnerProfileScreen} />
            <Stack.Screen name="Notifications" component={PartnerNotificationsScreen} />
            <Stack.Screen name="HelpSupport" component={PartnerSupportScreen} />
            <Stack.Screen name="LegalPolicies" component={PartnerLegalPoliciesScreen} />

          </Stack.Navigator>
        </NavigationContainer>
      </PartnerProvider>
    </SafeAreaProvider>
  );
}
