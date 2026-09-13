// ─────────────────────────────────────────────
// MandiKart — Sample/Mock Data for UI Development
// NOTE: This file is UI DEV ONLY. Replace with real API calls.
// ─────────────────────────────────────────────
import {
  Category,
  Farmer,
  Product,
  Order,
  Notification,
  ChatMessage,
} from '../types';

export const SAMPLE_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Vegetables', icon: '🥦', imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400', productCount: 12 },
  { id: 'cat-2', name: 'Fruits', icon: '🍎', imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400', productCount: 10 },
  { id: 'cat-3', name: 'Grains', icon: '🌾', imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', productCount: 6 },
  { id: 'cat-5', name: 'Spices', icon: '🌶️', imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', productCount: 75 },
  { id: 'cat-6', name: 'Pulses', icon: '🫘', imageUrl: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400', productCount: 8 },
  { id: 'cat-7', name: 'Oils', icon: '🫙', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', productCount: 30 },
  { id: 'cat-8', name: 'Herbs', icon: '🌿', imageUrl: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400', productCount: 6 },
  { id: 'cat-9', name: 'Poultry', icon: '🐔', imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400', productCount: 4 },
];

export const SAMPLE_PRODUCTS: Product[] = [];

export const SAMPLE_FARMER: Farmer = {
  id: 'f-1',
  name: 'Ramesh Patel',
  location: 'Nashik, Maharashtra',
  state: 'Maharashtra',
  rating: 4.8,
  reviewCount: 120,
  isVerified: true,
  totalProducts: 5,
  memberSince: '2023',
};

export const SAMPLE_FARMER_2: Farmer = {
  id: 'f-2',
  name: 'Sanjay Deshmukh',
  location: 'Ratnagiri, Maharashtra',
  state: 'Maharashtra',
  rating: 4.9,
  reviewCount: 85,
  isVerified: true,
  totalProducts: 3,
  memberSince: '2023',
};

export const SAMPLE_ORDER: Order = {
  id: 'ord-1',
  orderNumber: 'MK-2024-001234',
  status: 'DISPATCHED',
  items: [],
  deliveryAddress: {
    id: 'addr-1',
    label: 'Home',
    fullName: 'Ramesh Sharma',
    phone: '+91 98765 43210',
    line1: '12, Green Valley Society',
    line2: 'Near City Mall',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    isDefault: true,
  },
  paymentMethod: 'UPI',
  subtotal: 259,
  deliveryCharge: 30,
  total: 289,
  placedAt: '2024-06-15T10:30:00Z',
  estimatedDelivery: '2024-06-17',
  farmer: SAMPLE_FARMER,
  trackingSteps: [
    {
      id: 'ts-1',
      title: 'Order Placed',
      description: 'Your order has been received',
      timestamp: '2024-06-15T10:30:00Z',
      isCompleted: true,
      isCurrent: false,
    },
    {
      id: 'ts-2',
      title: 'Order Confirmed',
      description: 'Farmer confirmed your order',
      timestamp: '2024-06-15T11:00:00Z',
      isCompleted: true,
      isCurrent: false,
    },
    {
      id: 'ts-3',
      title: 'Processing',
      description: 'Items are being packed',
      timestamp: '2024-06-16T08:00:00Z',
      isCompleted: true,
      isCurrent: false,
    },
    {
      id: 'ts-4',
      title: 'Dispatched',
      description: 'Package picked up by delivery partner',
      timestamp: '2024-06-16T14:00:00Z',
      isCompleted: true,
      isCurrent: true,
    },
    {
      id: 'ts-5',
      title: 'Out for Delivery',
      description: 'Arriving today',
      isCompleted: false,
      isCurrent: false,
    },
    {
      id: 'ts-6',
      title: 'Delivered',
      description: 'Package delivered',
      isCompleted: false,
      isCurrent: false,
    },
  ],
};

export const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    type: 'ORDER',
    title: 'Order Dispatched! 🚚',
    body: 'Your order MK-2024-001234 is on its way.',
    timestamp: '2024-06-16T14:00:00Z',
    isRead: false,
    actionId: 'ord-1',
  },
  {
    id: 'n-2',
    type: 'PROMOTION',
    title: 'Fresh Deal: 15% off Onions 🧅',
    body: 'Limited time offer on fresh Nashik onions.',
    timestamp: '2024-06-16T09:00:00Z',
    isRead: false,
  },
  {
    id: 'n-3',
    type: 'CHAT',
    title: 'Rajan Kumar sent a message',
    body: 'Your tomatoes will be picked at 6 AM tomorrow.',
    timestamp: '2024-06-15T18:30:00Z',
    isRead: true,
    actionId: 'farmer-1',
  },
  {
    id: 'n-4',
    type: 'ORDER',
    title: 'Order Confirmed ✅',
    body: 'Rajan Kumar accepted your order.',
    timestamp: '2024-06-15T11:00:00Z',
    isRead: true,
    actionId: 'ord-1',
  },
];

export const SAMPLE_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'cm-1',
    senderId: 'farmer-1',
    text: 'Hello! Thanks for ordering from our farm.',
    timestamp: '2024-06-15T10:35:00Z',
    isRead: true,
    type: 'text',
  },
  {
    id: 'cm-2',
    senderId: 'user-1',
    text: 'Hi Rajan ji! When will the tomatoes be ready?',
    timestamp: '2024-06-15T10:37:00Z',
    isRead: true,
    type: 'text',
  },
  {
    id: 'cm-3',
    senderId: 'farmer-1',
    text: 'We pick fresh every morning at 6 AM. Your order will be dispatched by tomorrow morning.',
    timestamp: '2024-06-15T10:40:00Z',
    isRead: true,
    type: 'text',
  },
  {
    id: 'cm-4',
    senderId: 'user-1',
    text: 'Perfect, thank you! Are they organic?',
    timestamp: '2024-06-15T10:42:00Z',
    isRead: true,
    type: 'text',
  },
  {
    id: 'cm-5',
    senderId: 'farmer-1',
    text: 'Yes, we use minimal pesticides and follow integrated pest management.',
    timestamp: '2024-06-15T18:30:00Z',
    isRead: false,
    type: 'text',
  },
];
