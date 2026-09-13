/**
 * MandiKart Farmer App — Bottom Tabs Navigation Layout
 *
 * Branches on user.role:
 *   INDIVIDUAL → Farmer tabs (Home / Produce / Sell / Orders / More) — green
 *   FPO        → FPO tabs (Dashboard / Inventory / Buyers / Analytics / More) — blue
 */

import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  Sprout,
  Tag,
  ShoppingCart,
  Menu,
  LayoutDashboard,
  Package,
  Handshake,
  BarChart3,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';

// ── Color tokens ──────────────────────────────────────────────────────────────
const FARMER_ACTIVE    = '#15803D'; // Crisp emerald
const FARMER_ACTIVE_BG = '#DCFCE7'; // Soft mint capsule
const FPO_ACTIVE       = '#1D4ED8'; // Vibrant royal blue
const FPO_ACTIVE_BG    = '#DBEAFE'; // Soft blue capsule
const INACTIVE         = '#64748B'; // Clean modern slate

export default function TabLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 8);

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  const isFPO      = user?.role === 'FPO';
  const activeColor = isFPO ? FPO_ACTIVE : FARMER_ACTIVE;
  const activeBg    = isFPO ? FPO_ACTIVE_BG : FARMER_ACTIVE_BG;

  const iconWrapperStyle = (focused: boolean) => [
    styles.iconWrapper,
    focused && { backgroundColor: activeBg },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: [styles.tabBar, { height: 62 + bottomInset, paddingBottom: bottomInset }],
        tabBarItemStyle: styles.tabItem,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {/* ── Tab 1: Home (Farmer) / Dashboard (FPO) ── */}
      <Tabs.Screen
        name="home"
        options={{
          title: isFPO ? 'Dashboard' : 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={iconWrapperStyle(focused)}>
              {isFPO
                ? <LayoutDashboard size={20} color={focused ? activeColor : color} strokeWidth={focused ? 2.5 : 2} />
                : <Home            size={20} color={focused ? activeColor : color} strokeWidth={focused ? 2.5 : 2} />}
            </View>
          ),
        }}
      />

      {/* ── Tab 2: Produce (Farmer) / Inventory (FPO) ── */}
      <Tabs.Screen
        name="produce"
        options={{
          title: isFPO ? 'Inventory' : 'Produce',
          tabBarIcon: ({ color, focused }) => (
            <View style={iconWrapperStyle(focused)}>
              {isFPO
                ? <Package size={20} color={focused ? activeColor : color} strokeWidth={focused ? 2.5 : 2} />
                : <Sprout  size={20} color={focused ? activeColor : color} strokeWidth={focused ? 2.5 : 2} />}
            </View>
          ),
        }}
      />

      {/* ── Tab 3: Sell (Farmer) / Buyers (FPO) ── */}
      <Tabs.Screen
        name="sell"
        options={{
          title: isFPO ? 'Buyers' : 'Sell',
          tabBarIcon: ({ color, focused }) => (
            <View style={iconWrapperStyle(focused)}>
              {isFPO
                ? <Handshake size={20} color={focused ? activeColor : color} strokeWidth={focused ? 2.5 : 2} />
                : <Tag       size={20} color={focused ? activeColor : color} strokeWidth={focused ? 2.5 : 2} />}
            </View>
          ),
        }}
      />

      {/* ── Tab 4: Orders (Farmer) / Analytics (FPO) ── */}
      <Tabs.Screen
        name="orders"
        options={{
          title: isFPO ? 'Analytics' : 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <View style={iconWrapperStyle(focused)}>
              {isFPO
                ? <BarChart3    size={20} color={focused ? activeColor : color} strokeWidth={focused ? 2.5 : 2} />
                : <ShoppingCart size={20} color={focused ? activeColor : color} strokeWidth={focused ? 2.5 : 2} />}
            </View>
          ),
        }}
      />

      {/* ── Tab 5: More (shared for both modes) ── */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <View style={iconWrapperStyle(focused)}>
              <Menu size={20} color={focused ? activeColor : color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    elevation: 12,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  tabItem: {
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 30,
    borderRadius: 15,
  },
});
