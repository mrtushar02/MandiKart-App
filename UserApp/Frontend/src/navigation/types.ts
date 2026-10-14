import { NavigatorScreenParams } from '@react-navigation/native';
import { Product } from '../types';

// Auth Stack
export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  OTP: { phone: string; mode: 'register' | 'login' | 'forgot' };
  ForgotPassword: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  RarePremium: undefined;
  Categories: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

// Product Stack
export type ProductStackParamList = {
  ProductListing: { categoryId: string; categoryName: string };
  ProductDetails: { productId: string; product?: Product };
  FarmerProfile: { farmerId: string };
  Search: undefined;
  AllCategories: undefined;
};

// Checkout Stack
export type CheckoutStackParamList = {
  DeliveryAddress: undefined;
  CheckoutReview: undefined;
  Payment: undefined;
  OrderConfirmation: { orderId: string };
};

// Orders Stack
export type OrdersStackParamList = {
  MyOrders: undefined;
  OrderDetails: { orderId: string };
  OrderTracking: { orderId: string };
};

// Chat Stack
export type ChatStackParamList = {
  ChatList: undefined;
  Chat: { farmerId: string; farmerName: string; farmerAvatar?: string };
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ProductStack: NavigatorScreenParams<ProductStackParamList>;
  CheckoutStack: NavigatorScreenParams<CheckoutStackParamList>;
  ChatStack: NavigatorScreenParams<ChatStackParamList>;
  Wishlist: undefined;
  Notifications: undefined;
  EditProfile: undefined;
  Settings: undefined;
  AddAddress: { addressId?: string };
  OrderDetails: { orderId: string };
  OrderTracking: { orderId: string; order?: any };
  OrderConfirmation: { orderId: string; deliveryOtp?: string };
  BulkRequirement: undefined;
  BulkMatchDiscovery: { requirementId: string; requirement?: any };
  Analytics: undefined;
};
