/**
 * MandiKart Farmer App — 3D Tactile Quick Actions Row
 *
 * Implements the exact design from user specification:
 * - Clean header: "Quick Actions" with "See All →"
 * - 4 distinct pastel-themed 3D cards:
 *   1. My Crops (Soft Mint, Sprout icon, "View & Manage")
 *   2. Market Prices (Soft Peach, Tag icon, "Check Rates")
 *   3. Buyer Requests (Soft Ice Blue, Users icon with Red '3' Badge, "New Requests")
 *   4. Market Trends (Soft Lavender, BarChart3 icon, "See What's Rising")
 * - 2D Canvas layered depth with 3D bottom bevel extrusion and shadow hover/press effect
 * - Elevated white circular chevron disc at bottom of each card
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sprout,
  Tag,
  Users,
  BarChart3,
  ChevronRight,
  ArrowRight,
} from 'lucide-react-native';

interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: number | string;
  route: string;
  bgColor: string;
  borderColor: string;
  bottomBevelColor: string;
  shadowColor: string;
  iconColor: string;
  titleColor: string;
  subColor: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'crops',
    title: 'My Crops',
    subtitle: 'View & Manage',
    route: '/(tabs)/produce',
    bgColor: '#EDFAF1',
    borderColor: '#C6EFD2',
    bottomBevelColor: '#9AE6B4',
    shadowColor: '#15803D',
    iconColor: '#15803D',
    titleColor: '#133920',
    subColor: '#2D6A42',
    Icon: Sprout,
  },
  {
    id: 'prices',
    title: 'Market Prices',
    subtitle: 'Check Rates',
    route: '/market-prices',
    bgColor: '#FFF5EB',
    borderColor: '#FED7AA',
    bottomBevelColor: '#FDBA74',
    shadowColor: '#EA580C',
    iconColor: '#EA580C',
    titleColor: '#431407',
    subColor: '#8C3512',
    Icon: Tag,
  },
  {
    id: 'buyers',
    title: 'Buyer Requests',
    subtitle: 'New Requests',
    badge: 3,
    route: '/sell/requests',
    bgColor: '#EFF8FE',
    borderColor: '#BAE6FD',
    bottomBevelColor: '#7DD3FC',
    shadowColor: '#0284C7',
    iconColor: '#0284C7',
    titleColor: '#082F49',
    subColor: '#075985',
    Icon: Users,
  },
  {
    id: 'trends',
    title: 'Market Trends',
    subtitle: "See What's Rising",
    route: '/market-trends',
    bgColor: '#F8F4FF',
    borderColor: '#DDD6FE',
    bottomBevelColor: '#C4B5FD',
    shadowColor: '#7C3AED',
    iconColor: '#7C3AED',
    titleColor: '#2E1065',
    subColor: '#6B21A8',
    Icon: BarChart3,
  },
];

export function QuickActionsRow() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="See All Quick Actions"
          onPress={() => router.push('/(tabs)/produce')}
          style={({ pressed }) => [styles.seeAllBtn, pressed && { opacity: 0.7 }]}
          hitSlop={8}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <ArrowRight size={16} color="#166534" strokeWidth={2.4} />
        </Pressable>
      </View>

      {/* ── 3D Cards Horizontal Canvas Row ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {QUICK_ACTIONS.map((item) => {
          const { Icon } = item;
          const isHovered = hoveredCard === item.id;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.subtitle}`}
              onPress={() => router.push(item.route as any)}
              // @ts-ignore for web hover
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: item.bgColor,
                  borderColor: item.borderColor,
                  borderBottomColor: item.bottomBevelColor,
                  shadowColor: item.shadowColor,
                },
                (pressed || isHovered) && styles.cardPressed,
              ]}
            >
              {/* Top Icon with optional Notification Badge */}
              <View style={styles.iconArea}>
                <View style={styles.iconWrap}>
                  <Icon size={32} color={item.iconColor} strokeWidth={2.4} />
                </View>
                {item.badge !== undefined && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>

              {/* Title & Subtitle */}
              <View style={styles.textArea}>
                <Text numberOfLines={1} style={[styles.title, { color: item.titleColor }]}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} style={[styles.subtitle, { color: item.subColor }]}>
                  {item.subtitle}
                </Text>
              </View>

              {/* 3D Elevated Circular Bottom Action Button */}
              <View style={styles.circleBtn}>
                <ChevronRight size={16} color="#0F172A" strokeWidth={2.6} />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D2916',
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },

  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 8, // room for 3D bottom drop shadow
  },

  /* 3D Tactile Card */
  card: {
    width: 136,
    height: 168,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderBottomWidth: 4, // 3D Extrusion bevel
    position: 'relative',

    // Multi-layer ambient 3D shadow
    elevation: 5,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.12,
    shadowRadius: 10,

    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },

  /* 3D Physical Push/Hover State */
  cardPressed: {
    transform: [{ translateY: 3 }, { scale: 0.98 }],
    borderBottomWidth: 1.5,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.08,
  },

  /* Icon Area with Badge */
  iconArea: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    width: 44,
    marginTop: 2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#DC2626',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    lineHeight: 12,
  },

  /* Text Area */
  textArea: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* 3D Elevated Circular Bottom Button */
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
});

export default QuickActionsRow;
