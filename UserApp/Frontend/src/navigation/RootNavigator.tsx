import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList, ProductStackParamList, CheckoutStackParamList, ChatStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { useAuth } from '../context/AuthContext';

// Stacks
import ProductListingScreen from '../screens/product/ProductListingScreen';
import ProductDetailsScreen from '../screens/product/ProductDetailsScreen';
import FarmerProfileScreen from '../screens/product/FarmerProfileScreen';
import SearchScreen from '../screens/product/SearchScreen';
import AllCategoriesScreen from '../screens/main/CategoriesScreen';
import ReviewListScreen from '../screens/product/ReviewListScreen';

import DeliveryAddressScreen from '../screens/checkout/DeliveryAddressScreen';
import CheckoutReviewScreen from '../screens/checkout/CheckoutReviewScreen';
import PaymentScreen from '../screens/checkout/PaymentScreen';
import OrderConfirmationScreen from '../screens/checkout/OrderConfirmationScreen';

import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';
import OrderTrackingScreen from '../screens/orders/OrderTrackingScreen';

import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatScreen from '../screens/chat/ChatScreen';

import WishlistScreen from '../screens/main/WishlistScreen';
import NotificationsScreen from '../screens/profile/NotificationScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import AddAddressScreen from '../screens/checkout/AddAddressScreen';
import BulkRequirementScreen from '../screens/main/BulkRequirementScreen';
import BulkMatchDiscoveryScreen from '../screens/main/BulkMatchDiscoveryScreen';
import AnalyticsDashboardScreen from '../screens/analytics/AnalyticsDashboardScreen';

const RootStack = createNativeStackNavigator<any>();
const ProductStack = createNativeStackNavigator<any>();
const CheckoutStack = createNativeStackNavigator<any>();
const ChatStack = createNativeStackNavigator<any>();

export default function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <RootStack.Navigator id="root" screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <RootStack.Screen name="Main" component={MainTabNavigator} />
          {/* These screens are accessible once authenticated */}
          <RootStack.Screen name="ProductStack" options={{ presentation: 'card' }}>
            {() => (
              <ProductStack.Navigator id="product" screenOptions={{ headerShown: false }}>
                <ProductStack.Screen name="Search" component={SearchScreen as any} />
                <ProductStack.Screen name="ProductListing" component={ProductListingScreen as any} />
                <ProductStack.Screen name="ProductDetails" component={ProductDetailsScreen as any} />
                <ProductStack.Screen name="FarmerProfile" component={FarmerProfileScreen as any} />
                <ProductStack.Screen name="AllCategories" component={AllCategoriesScreen as any} />
              </ProductStack.Navigator>
            )}
          </RootStack.Screen>
          <RootStack.Screen name="CheckoutStack" options={{ presentation: 'card' }}>
            {() => (
              <CheckoutStack.Navigator id="checkout" screenOptions={{ headerShown: false }}>
                <CheckoutStack.Screen name="DeliveryAddress" component={DeliveryAddressScreen as any} />
                <CheckoutStack.Screen name="CheckoutReview" component={CheckoutReviewScreen as any} />
                <CheckoutStack.Screen name="Payment" component={PaymentScreen as any} />
                <CheckoutStack.Screen name="OrderConfirmation" component={OrderConfirmationScreen as any} />
              </CheckoutStack.Navigator>
            )}
          </RootStack.Screen>
          <RootStack.Screen name="ChatStack" options={{ presentation: 'card' }}>
            {() => (
              <ChatStack.Navigator id="chat" screenOptions={{ headerShown: false }}>
                <ChatStack.Screen name="ChatList" component={ChatListScreen as any} />
                <ChatStack.Screen name="Chat" component={ChatScreen as any} />
              </ChatStack.Navigator>
            )}
          </RootStack.Screen>
          <RootStack.Screen name="Wishlist" component={WishlistScreen} />
          <RootStack.Screen name="Notifications" component={NotificationsScreen} />
          <RootStack.Screen name="EditProfile" component={EditProfileScreen} />
          <RootStack.Screen name="Settings" component={SettingsScreen} />
          <RootStack.Screen name="AddAddress" component={AddAddressScreen as any} />
          <RootStack.Screen name="DeliveryAddress" component={DeliveryAddressScreen as any} />
          <RootStack.Screen name="CheckoutReview" component={CheckoutReviewScreen as any} />
          <RootStack.Screen name="Payment" component={PaymentScreen as any} />
          <RootStack.Screen name="OrderDetails" component={OrderDetailsScreen as any} />
          <RootStack.Screen name="OrderTracking" component={OrderTrackingScreen as any} />
          <RootStack.Screen name="OrderConfirmation" component={OrderConfirmationScreen as any} />
          <RootStack.Screen name="Chat" component={ChatScreen as any} />
          <RootStack.Screen name="ChatList" component={ChatListScreen as any} />
          <RootStack.Screen name="BulkRequirement" component={BulkRequirementScreen as any} />
          <RootStack.Screen name="BulkMatchDiscovery" component={BulkMatchDiscoveryScreen as any} />
          <RootStack.Screen name="Analytics" component={AnalyticsDashboardScreen as any} />
        </>
      )}
    </RootStack.Navigator>
  );
}
