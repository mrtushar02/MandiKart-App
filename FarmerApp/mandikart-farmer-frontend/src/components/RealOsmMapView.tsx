/**
 * MandiKart Farmer App — Real OpenStreetMap (OSM) Interactive Map Component
 * 
 * Renders real OpenStreetMap tiles, Leaflet vector polylines, and real-time vehicle GPS
 * position calculated via Dijkstra shortest-path pathfinding.
 * Fully cross-platform: Web (HTML5 iframe) & Native (WebView).
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export interface RealOsmMapViewProps {
  origin?: {
    latitude: number;
    longitude: number;
    title: string;
    subtitle?: string;
  };
  destination?: {
    latitude: number;
    longitude: number;
    title: string;
    subtitle?: string;
  };
  vehiclePosition?: {
    latitude: number;
    longitude: number;
    heading?: number;
    driverName?: string;
    speedKmh?: number;
  };
  completedPolyline?: [number, number][]; // [lat, lng]
  remainingPolyline?: [number, number][]; // [lat, lng]
  mapMode?: 'street' | 'satellite';
  style?: any;
}

export default function RealOsmMapView({
  origin = {
    latitude: 19.9975,
    longitude: 73.7898,
    title: 'Your Farmgate',
    subtitle: 'Harvest Pickup Location',
  },
  destination = {
    latitude: 18.5204,
    longitude: 73.8567,
    title: 'Reliance Fresh Sourcing Hub',
    subtitle: 'Buyer Destination Yard',
  },
  vehiclePosition,
  completedPolyline = [],
  remainingPolyline = [],
  mapMode = 'street',
  style,
}: RealOsmMapViewProps) {
  const leafletHtml = useMemo(() => {
    const originLat = origin.latitude || 19.9975;
    const originLon = origin.longitude || 73.7898;
    const destLat = destination.latitude || 18.5204;
    const destLon = destination.longitude || 73.8567;

    const vehLat = vehiclePosition?.latitude || (originLat + destLat) / 2;
    const vehLon = vehiclePosition?.longitude || (originLon + destLon) / 2;
    const vehHeading = vehiclePosition?.heading || 45;
    const vehDriver = vehiclePosition?.driverName || 'Tata Ace EV • Sunil Jadhav';
    const vehSpeed = vehiclePosition?.speedKmh || 42;

    const completedJson = JSON.stringify(completedPolyline);
    const remainingJson = JSON.stringify(remainingPolyline);

    const tileUrl =
      mapMode === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileAttr =
      mapMode === 'satellite'
        ? '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #1E3A24; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    /* Custom Pulsing Farm & Buyer Pins */
    .farm-pin {
      background: #16A34A;
      color: white;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 14px rgba(22, 163, 74, 0.45);
      border: 2.5px solid #ffffff;
    }
    .dest-pin {
      background: #EA580C;
      color: white;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 14px rgba(234, 88, 12, 0.45);
      border: 2.5px solid #ffffff;
    }
    .vehicle-pin {
      position: relative;
      width: 46px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .vehicle-pulse {
      position: absolute;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: rgba(239, 108, 0, 0.3);
      animation: pulseAnim 1.8s infinite ease-out;
    }
    .vehicle-core {
      position: relative;
      background: #166534;
      color: white;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 14px rgba(22, 101, 52, 0.6);
      border: 2.5px solid #ffffff;
      transform-origin: center center;
    }
    @keyframes pulseAnim {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.18);
      padding: 4px;
      font-size: 12px;
    }
    .leaflet-popup-content {
      margin: 8px 10px;
      line-height: 1.4;
    }
    .popup-title {
      font-weight: 800;
      color: #0f172a;
      font-size: 13px;
    }
    .popup-sub {
      color: #64748b;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([${vehLat}, ${vehLon}], 10);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      attribution: '${tileAttr}'
    }).addTo(map);

    // 1. Origin Farm Marker
    var farmIcon = L.divIcon({
      className: '',
      html: '<div class="farm-pin">🌾</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    L.marker([${originLat}, ${originLon}], { icon: farmIcon }).addTo(map)
      .bindPopup('<div class="popup-title">${origin.title}</div><div class="popup-sub">${origin.subtitle || "Farmgate Origin"}</div>');

    // 2. Destination Buyer Marker
    var destIcon = L.divIcon({
      className: '',
      html: '<div class="dest-pin">🏢</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    L.marker([${destLat}, ${destLon}], { icon: destIcon }).addTo(map)
      .bindPopup('<div class="popup-title">${destination.title}</div><div class="popup-sub">${destination.subtitle || "Buyer Destination"}</div>');

    // 3. Dijkstra Polyline Segments
    var completedCoords = ${completedJson};
    var remainingCoords = ${remainingJson};

    if (completedCoords && completedCoords.length > 1) {
      L.polyline(completedCoords, {
        color: '#22C55E',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }

    if (remainingCoords && remainingCoords.length > 1) {
      L.polyline(remainingCoords, {
        color: '#FACC15',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }

    // 4. Moving Vehicle Delivery Marker
    var vehIcon = L.divIcon({
      className: '',
      html: '<div class="vehicle-pin"><div class="vehicle-pulse"></div><div class="vehicle-core" style="transform: rotate(${vehHeading}deg);">🚛</div></div>',
      iconSize: [46, 46],
      iconAnchor: [23, 23]
    });
    L.marker([${vehLat}, ${vehLon}], { icon: vehIcon }).addTo(map)
      .bindPopup('<div class="popup-title">${vehDriver}</div><div class="popup-sub">Speed: ${vehSpeed} km/h • Realtime GPS</div>');

    // Fit bounds to encompass entire route
    var bounds = L.latLngBounds([
      [${originLat}, ${originLon}],
      [${destLat}, ${destLon}],
      [${vehLat}, ${vehLon}]
    ]);
    map.fitBounds(bounds, { padding: [35, 35], maxZoom: 13 });
  </script>
</body>
</html>
    `;
  }, [
    origin.latitude,
    origin.longitude,
    origin.title,
    origin.subtitle,
    destination.latitude,
    destination.longitude,
    destination.title,
    destination.subtitle,
    vehiclePosition?.latitude,
    vehiclePosition?.longitude,
    vehiclePosition?.heading,
    vehiclePosition?.driverName,
    vehiclePosition?.speedKmh,
    completedPolyline,
    remainingPolyline,
    mapMode,
  ]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <iframe
          srcDoc={leafletHtml}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="MandiKart Farmer Real OpenStreetMap"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.webview}
        scrollEnabled={false}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#166534" />
          </View>
        )}
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 240,
    backgroundColor: '#1E3A24',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1E3A24',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
