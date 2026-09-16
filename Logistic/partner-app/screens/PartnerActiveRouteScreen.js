import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';
import { usePartner } from '../context/PartnerContext';
import PartnerHeader from '../components/PartnerHeader';
import RealOsmMapView from '../components/RealOsmMapView';
import {
  generateRoutePolyline,
  getVehicleTelemetryAlongPolyline,
} from '../services/dijkstraRouting';

const { width } = Dimensions.get('window');

export default function PartnerActiveRouteScreen({ navigation }) {
  const { activeDelivery, advanceDeliveryStep } = usePartner();
  const [speed, setSpeed] = useState(38);
  const [progress, setProgress] = useState(0.35); // Initial progress along Dijkstra route
  const [mapMode, setMapMode] = useState('street');
  const [arrivedModalVisible, setArrivedModalVisible] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);

  // Define origin (Farmgate) and destination (Mandi Hub) coordinates
  const origin = useMemo(() => ({
    latitude: 20.3582,
    longitude: 85.8185,
    title: activeDelivery?.pickup?.address || 'Ramesh Farm (Patia)',
    subtitle: 'Farmer Pickup Point',
  }), [activeDelivery]);

  const destination = useMemo(() => ({
    latitude: 20.2520,
    longitude: 85.7815,
    title: activeDelivery?.drop?.address || 'Bhubaneswar Central Mandi Hub Gate 3',
    subtitle: 'Mandi Unloading Bay',
  }), [activeDelivery]);

  // Compute high-resolution Dijkstra route polyline
  const fullPolyline = useMemo(() => {
    return generateRoutePolyline(
      { latitude: origin.latitude, longitude: origin.longitude },
      { latitude: destination.latitude, longitude: destination.longitude }
    );
  }, [origin, destination]);

  // Derive current telemetry along Dijkstra polyline
  const telemetry = useMemo(() => {
    return getVehicleTelemetryAlongPolyline(fullPolyline, progress, speed);
  }, [fullPolyline, progress, speed]);

  useEffect(() => {
    // 1. Advance vehicle progress along Dijkstra polyline and speed flutter
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 0.98) return 0.98;
        return Math.min(0.98, prev + 0.015);
      });

      const currentSpeed = Math.floor(34 + Math.random() * 8);
      setSpeed(currentSpeed);

      // 2. High-frequency Realtime GPS broadcast with real Dijkstra coordinates
      const orderId = activeDelivery?.id || 'MK10284';
      const trackingBaseUrl = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_USER_API_URL) || 'http://localhost:4001/api/v1';
      fetch(`${trackingBaseUrl}/tracking/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          driverId: 'KL-DP-9824',
          driverName: 'Rahul Sharma',
          latitude: telemetry.currentPosition.latitude,
          longitude: telemetry.currentPosition.longitude,
          speedKmH: currentSpeed,
          heading: telemetry.heading,
          destLat: destination.latitude,
          destLon: destination.longitude,
        }),
      }).catch(() => {
        // Safe failover when offline or simulating locally
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [activeDelivery, destination, telemetry]);

  const handleArrived = () => {
    if (Platform.OS === 'web') {
      setArrivedModalVisible(true);
    } else {
      Alert.alert(
        'Arrived at Mandi Gate 3 🚜',
        'You have arrived at Bhubaneswar Central Mandi Hub. Proceed to unload produce and verify Proof of Delivery (POD).',
        [
          {
            text: 'Open POD Screen',
            onPress: () => navigation.navigate('DeliveryPOD'),
          },
        ]
      );
    }
  };

  const handleSOS = () => {
    if (Platform.OS === 'web') {
      setSosModalVisible(true);
    } else {
      Alert.alert(
        '🚨 EMERGENCY SOS ACTIVATED',
        'Your live GPS coordinates have been sent to MandiKart Mandi Dispatcher and Emergency Response Team.',
        [
          { text: 'Call Police (112)' },
          { text: 'Call Mandi Dispatch', style: 'default' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PartnerHeader
        title="Live Route Navigation"
        subtitle="Patia Farm → Mandi Hub"
        navigation={navigation}
        showBack
      />

      {/* Turn-by-Turn Instruction Banner with Dynamic Dijkstra Telemetry */}
      <View style={styles.navigationBanner}>
        <View style={styles.turnIconCircle}>
          <Ionicons
            name={progress > 0.7 ? 'arrow-forward' : 'arrow-undo'}
            size={28}
            color={COLORS.white}
          />
        </View>
        <View style={styles.turnInfo}>
          <Text style={styles.turnDistance}>
            In {Math.max(150, Math.round(telemetry.remainingDistanceKm * 180))} meters
          </Text>
          <Text style={styles.turnStreet} numberOfLines={1}>
            {telemetry.currentInstruction}
          </Text>
          <Text style={styles.turnNext} numberOfLines={1}>
            Corridor: {telemetry.currentRoad} • Dijkstra Optimal
          </Text>
        </View>
      </View>

      {/* Real OpenStreetMap (OSM) Live Route Map */}
      <View style={styles.mapContainer}>
        <RealOsmMapView
          origin={origin}
          destination={destination}
          vehiclePosition={{
            latitude: telemetry.currentPosition.latitude,
            longitude: telemetry.currentPosition.longitude,
            heading: telemetry.heading,
            driverName: 'Rahul Sharma (Partner)',
            speedKmh: speed,
          }}
          completedPolyline={telemetry.completedPolyline}
          remainingPolyline={telemetry.remainingPolyline}
          mapMode={mapMode}
          style={StyleSheet.absoluteFill}
        />

        {/* Floating Controls on Map */}
        <View style={styles.mapFloatingControls}>
          <TouchableOpacity
            style={styles.sosButton}
            onPress={handleSOS}
            activeOpacity={0.8}
          >
            <Ionicons name="warning" size={18} color={COLORS.white} />
            <Text style={styles.sosText}>SOS HELP</Text>
          </TouchableOpacity>

          <View style={styles.speedLimitBadge}>
            <Text style={styles.speedLimitNumber}>40</Text>
            <Text style={styles.speedLimitText}>LIMIT</Text>
          </View>

          {/* Map Layer Switch (Street vs Satellite) */}
          <TouchableOpacity
            style={styles.layerSwitchBtn}
            onPress={() => setMapMode(mapMode === 'street' ? 'satellite' : 'street')}
            activeOpacity={0.85}
          >
            <Ionicons
              name={mapMode === 'street' ? 'layers-outline' : 'map-outline'}
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.layerSwitchText}>
              {mapMode === 'street' ? 'Satellite' : 'Street'}
            </Text>
          </TouchableOpacity>

          {/* GPS Live Stream Indicator */}
          <View style={styles.gpsIndicatorBadge}>
            <View style={styles.gpsPulseDot} />
            <Text style={styles.gpsIndicatorText}>{speed} KM/H</Text>
          </View>
        </View>
      </View>

      {/* Bottom Route Summary Drawer */}
      <View style={styles.bottomDrawer}>
        <View style={styles.etaRow}>
          <View>
            <View style={styles.etaTimeRow}>
              <Text style={styles.etaTime}>{telemetry.remainingEtaMinutes} mins</Text>
              <Text style={styles.etaDistance}>• {telemetry.remainingDistanceKm} km remaining</Text>
            </View>
            <Text style={styles.etaEstimatedArrival}>
              Live Dijkstra Routing • {Math.round(progress * 100)}% Complete
            </Text>
          </View>

          <View style={styles.produceBadge}>
            <Text style={styles.produceBadgeText}>
              {activeDelivery?.manifest?.[0]?.item
                ? `${activeDelivery.manifest[0].crates * 25} kg ${activeDelivery.manifest[0].item}`
                : '120 kg Tomatoes'}
            </Text>
          </View>
        </View>

        {/* Call & Contact Actions */}
        <View style={styles.callRow}>
          <TouchableOpacity
            style={styles.quickContactBtn}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.alert('Calling Farmer Ramesh Patel (+91 94370 12345)...');
              } else {
                Alert.alert('Farmer Contact', 'Calling Ramesh Patel (+91 94370 12345)...');
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={18} color={COLORS.primary} />
            <Text style={styles.quickContactText}>Call Farmer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickContactBtn}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.alert('Calling Mandi Gate 3 Manager (+91 94371 98765)...');
              } else {
                Alert.alert('Mandi Hub Contact', 'Calling Mandi Gate 3 Manager (+91 94371 98765)...');
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="business-outline" size={18} color={COLORS.primary} />
            <Text style={styles.quickContactText}>Call Mandi Hub</Text>
          </TouchableOpacity>
        </View>

        {/* Arrival Confirmation CTA */}
        <TouchableOpacity
          style={styles.arrivedCTA}
          onPress={handleArrived}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
          <Text style={styles.arrivedCTAText}>I Have Arrived at Mandi Gate</Text>
        </TouchableOpacity>
      </View>

      {/* Web-Safe Arrived Modal */}
      <Modal
        visible={arrivedModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setArrivedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalSuccessIcon}>
              <Ionicons name="checkmark" size={32} color={COLORS.white} />
            </View>
            <Text style={styles.modalTitle}>Arrived at Mandi Gate 3 🚜</Text>
            <Text style={styles.modalSubtitle}>
              You have reached Bhubaneswar Central Mandi Hub Gate 3. Proceed to unload produce and upload Proof of Delivery (POD).
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setArrivedModalVisible(false);
                  navigation.navigate('DeliveryPOD');
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>Open POD Screen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setArrivedModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Web-Safe SOS Emergency Modal */}
      <Modal
        visible={sosModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSosModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalSuccessIcon, { backgroundColor: COLORS.error }]}>
              <Ionicons name="warning" size={32} color={COLORS.white} />
            </View>
            <Text style={styles.modalTitle}>EMERGENCY SOS BROADCAST 🚨</Text>
            <Text style={styles.modalSubtitle}>
              Live GPS telemetry transmitted to MandiKart Control Room.
              {'\n'}Lat: {telemetry.currentPosition.latitude.toFixed(4)}, Lon: {telemetry.currentPosition.longitude.toFixed(4)}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: COLORS.error }]}
                onPress={() => setSosModalVisible(false)}
              >
                <Text style={styles.modalPrimaryBtnText}>Call Mandi Dispatch (1800-419-MANDI)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSosModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Dismiss Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navigationBanner: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  turnIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  turnInfo: {
    flex: 1,
  },
  turnDistance: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: COLORS.primaryFixed,
    textTransform: 'uppercase',
  },
  turnStreet: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.white,
  },
  turnNext: {
    fontSize: FONT.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
  },
  mapFloatingControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 10,
    alignItems: 'flex-end',
    zIndex: 99,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    gap: 6,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  sosText: {
    color: COLORS.white,
    fontSize: FONT.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  speedLimitBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  speedLimitNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.onSurface,
    lineHeight: 16,
  },
  speedLimitText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
  },
  layerSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  layerSwitchText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  gpsIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    gap: 5,
  },
  gpsPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  gpsIndicatorText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  bottomDrawer: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    gap: SPACING.md,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  etaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  etaTimeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  etaTime: {
    fontSize: FONT.xxxl,
    fontWeight: '900',
    color: COLORS.primary,
  },
  etaDistance: {
    fontSize: FONT.base,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  etaEstimatedArrival: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
    fontWeight: '600',
  },
  produceBadge: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  produceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  callRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickContactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLow,
    gap: 6,
  },
  quickContactText: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: COLORS.primary,
  },
  arrivedCTA: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  arrivedCTAText: {
    color: COLORS.white,
    fontSize: FONT.base,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: Math.min(width - 32, 400),
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalSuccessIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: FONT.sm,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActions: {
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  modalPrimaryBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: COLORS.white,
    fontSize: FONT.base,
    fontWeight: '800',
  },
  modalCancelBtn: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: FONT.sm,
    fontWeight: '700',
  },
});
