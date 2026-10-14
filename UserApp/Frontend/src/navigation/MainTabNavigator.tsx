import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../theme';
import { MainTabParamList } from './types';

import HomeScreen from '../screens/main/HomeScreen';
import RarePremiumScreen from '../screens/main/RarePremiumScreen';
import CategoriesScreen from '../screens/main/CategoriesScreen';
import CartScreen from '../screens/main/CartScreen';
import OrdersNavigator from './OrdersNavigator';
import ProfileScreen from '../screens/main/ProfileScreen';
import { useLanguage } from '../context/LanguageContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconName = 'home' | 'sparkles' | 'grid' | 'cart' | 'receipt' | 'person';

interface TabConfig {
  name: keyof MainTabParamList;
  translationKey: string;
  defaultLabel: string;
  icon: TabIconName;
}

const TABS: TabConfig[] = [
  { name: 'Home', translationKey: 'home', defaultLabel: 'Home', icon: 'home' },
  { name: 'RarePremium', translationKey: 'rare_premium', defaultLabel: 'Rare & Premium', icon: 'sparkles' },
  { name: 'Categories', translationKey: 'categories', defaultLabel: 'Categories', icon: 'grid' },
  { name: 'Cart', translationKey: 'cart', defaultLabel: 'Cart', icon: 'cart' },
  { name: 'Orders', translationKey: 'orders', defaultLabel: 'Orders', icon: 'receipt' },
  { name: 'Profile', translationKey: 'profile', defaultLabel: 'Profile', icon: 'person' },
];

export default function MainTabNavigator() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      id="main-tabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: route.name === 'RarePremium' ? '#D97706' : Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ focused, color, size }) => {
          const tab = TABS.find((t) => t.name === route.name);
          const iconColor = focused && route.name === 'RarePremium' ? '#D97706' : color;
          const iconName = `${tab?.icon}${focused ? '' : '-outline'}` as any;
          return <Ionicons name={iconName} size={22} color={iconColor} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t('home', 'Home') }}
      />
      <Tab.Screen
        name="RarePremium"
        component={RarePremiumScreen}
        options={{ tabBarLabel: 'Rare & Premium' }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ tabBarLabel: t('categories', 'Categories') }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ tabBarLabel: t('cart', 'Cart') }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersNavigator}
        options={{ tabBarLabel: t('orders', 'Orders') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: t('profile', 'Profile') }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabItem: {
    paddingTop: 2,
  },
});
