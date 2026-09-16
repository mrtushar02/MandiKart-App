import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Shadows } from '../theme';
import { useLocation, GeoCoordinates } from '../context/LocationContext';
import { apiClient } from '../services/apiClient';
import RealOsmMapView from './RealOsmMapView';
import {
  generateRoutePolyline,
  getVehicleTelemetryAlongPolyline,
} from '../services/dijkstraRouting';

interface InteractiveMapViewProps {
  orderId?: string;
  origin?: {
    title: string;
    coordinates: GeoCoordinates;
    subTitle?: string;
  };
  destination?: {
    title: string;
    coordinates?: GeoCoordinates;
    subTitle?: string;
  };
  driverName?: string;
  vehicleNumber?: string;
  onLocationDetected?: (coords: GeoCoordinates) => void;
  onTelemetryChange?: (telemetry: { remainingDistanceKm: number; remainingEtaMinutes: number }) => void;
  style?: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function InteractiveMapView({
  orderId,
  origin = {
    title: 'Nashik Organic Farm',
    coordinates: { latitude: 19.9975, longitude: 73.7898 },
    subTitle: 'Harvest Lot #2026-09',
  },
  destination = {
    title: 'Your Delivery Location',
    subTitle: 'FC Road, Shivajinagar, Pune',
  },
  driverName = 'Suresh Patil',
  vehicleNumber = 'MH 12 AB 4821',
  onLocationDetected,
  onTelemetryChange,
  style,
}: InteractiveMapViewProps) {
  const {
    currentLocation,
    currentAddress,
    isLoadingLocation,
    fetchCurrentLocation,
  } = useLocation();

  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('street');
  const [driverProgress, setDriverProgress] = useState<number>(0.65); // 65% completed along Dijkstra polyline
  const [driverSpeed, setDriverSpeed] = useState<number>(36);
  const [liveTelemetry, setLiveTelemetry] = useState<any>(null);

  // 1. Calculate optimal shortest path polyline using Dijkstra algorithm
  const fullPolyline = useMemo(() => {
    return generateRoutePolyline(
      origin.coordinates,
      destination.coordinates || { latitude: 18.5204, longitude: 73.8567 }
    );
  }, [
    origin.coordinates?.latitude,
    origin.coordinates?.longitude,
    destination.coordinates?.latitude,
    destination.coordinates?.longitude,
  ]);

  // 2. Compute dynamic vehicle position, heading, and distance along polyline
  const routeTelemetry = useMemo(() => {
    return getVehicleTelemetryAlongPolyline(fullPolyline, driverProgress, driverSpeed);
  }, [fullPolyline, driverProgress, driverSpeed]);

  React.useEffect(() => {
    if (onTelemetryChange) {
      onTelemetryChange({
        remainingDistanceKm: routeTelemetry.remainingDistanceKm,
        remainingEtaMinutes: routeTelemetry.remainingEtaMinutes,
      });
    }
  }, [routeTelemetry.remainingDistanceKm, routeTelemetry.remainingEtaMinutes]);

  // Periodic driver movement along polyline and polling backend telemetry if orderId present
  useEffect(() => {
    let isMounted = true;

    const timer = setInterval(async () => {
      if (orderId) {
        try {
          const telemetry = await apiClient.tracking.getOrderLocation(orderId);
          if (isMounted && telemetry) {
            setLiveTelemetry(telemetry);
            if (telemetry.speedKmh) setDriverSpeed(telemetry.speedKmh);
          }
        } catch {
          // fallback to Dijkstra route progression
        }
      }

      setDriverProgress((prev) => {
        if (prev >= 0.96) return 0.25; // loop smoothly for continuous demo
        return prev + 0.012;
      });
      setDriverSpeed(Math.round(34 + Math.sin(Date.now() / 2500) * 6));
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [orderId]);

  const handleLocateMe = async () => {
    const coords = await fetchCurrentLocation(true);
    if (coords && onLocationDetected) {
      onLocationDetected(coords);
    }
  };

  const isSatellite = mapMode === 'satellite';
  const remainingDistKm = routeTelemetry.remainingDistanceKm;
  const remainingEtaMin = routeTelemetry.remainingEtaMinutes;

  return (
    <View style={[styles.container, isSatellite && styles.containerSatellite, style]}>
      {/* Real OpenStreetMap View with Leaflet & Dijkstra Polyline */}
      <RealOsmMapView
        origin={{
          latitude: origin.coordinates.latitude,
          longitude: origin.coordinates.longitude,
          title: origin.title,
          subtitle: origin.subTitle,
        }}
        destination={{
          latitude: destination.coordinates?.latitude || 18.5204,
          longitude: destination.coordinates?.longitude || 73.8567,
          title: destination.title,
          subtitle: currentAddress?.street || destination.subTitle,
        }}
        vehiclePosition={{
          latitude: routeTelemetry.currentPosition.latitude,
          longitude: routeTelemetry.currentPosition.longitude,
          heading: routeTelemetry.heading,
          driverName: `${driverName} (${vehicleNumber})`,
          speedKmh: driverSpeed,
        }}
        completedPolyline={routeTelemetry.completedPolyline}
        remainingPolyline={routeTelemetry.remainingPolyline}
        mapMode={mapMode}
        style={styles.osmMapInner}
      />

      {/* Top Floating Control Bar */}
      <View style={styles.topControls}>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, !isSatellite && styles.modeBtnActive]}
            onPress={() => setMapMode('street')}
          >
            <Ionicons name="map-outline" size={13} color={!isSatellite ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.modeText, !isSatellite && styles.modeTextActive]}>Road</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, isSatellite && styles.modeBtnActive]}
            onPress={() => setMapMode('satellite')}
          >
            <Ionicons name="planet-outline" size={13} color={isSatellite ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.modeText, isSatellite && styles.modeTextActive]}>Satellite</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.locateMeBtn}
          onPress={handleLocateMe}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <Ionicons name="locate" size={15} color={Colors.primary} />
              <Text style={styles.locateMeText}>My GPS</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Floating GPS Live Indicator */}
      <View style={styles.gpsLivePill}>
        <View style={styles.gpsLiveDot} />
        <Text style={styles.gpsLiveText}>OSM LIVE ROUTING</Text>
      </View>

      {/* Bottom Floating Telemetry Card */}
      <View style={styles.bottomHud}>
        <View style={styles.hudMetric}>
          <Ionicons name="navigate-circle" size={19} color={Colors.primary} />
          <View>
            <Text style={styles.hudValue}>{remainingDistKm} km</Text>
            <Text style={styles.hudLabel}>Dijkstra Route</Text>
          </View>
        </View>

        <View style={styles.hudDivider} />

        <View style={styles.hudMetric}>
          <Ionicons name="time" size={19} color="#0284C7" />
          <View>
            <Text style={styles.hudValue}>{remainingEtaMin} mins</Text>
            <Text style={styles.hudLabel}>Live ETA</Text>
          </View>
        </View>

        <View style={styles.hudDivider} />

        <View style={styles.hudMetric}>
          <Ionicons name="speedometer" size={18} color="#EA580C" />
          <View>
            <Text style={styles.hudValue}>{driverSpeed} km/h</Text>
            <Text style={styles.hudLabel}>Telemetry</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 310,
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#C6E8D0',
    position: 'relative',
    ...Shadows.md,
  },
  containerSatellite: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  osmMapInner: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  topControls: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: BorderRadius.full,
    padding: 3,
    ...Shadows.sm,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: BorderRadius.full,
  },
  modeBtnActive: {
    backgroundColor: Colors.primaryLight,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modeTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  locateMeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  locateMeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  gpsLivePill: {
    position: 'absolute',
    top: 52,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.full,
    zIndex: 10,
  },
  gpsLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  gpsLiveText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  bottomHud: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
  },
  hudMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  hudValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  hudLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  hudDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.gray200,
  },
});
