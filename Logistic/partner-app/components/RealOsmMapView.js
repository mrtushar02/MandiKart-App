/**
 * MandiKart Logistics Partner - Real OpenStreetMap (OSM) Interactive Map Component
 * 
 * Renders real OpenStreetMap tiles, Leaflet vector polylines, and real-time vehicle GPS
 * position calculated via Dijkstra shortest-path pathfinding.
 * Fully cross-platform: Web (HTML5 iframe) & Native (WebView).
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, RADIUS } from '../constants/theme';

export default function RealOsmMapView({
  origin = {
    latitude: 20.3582,
    longitude: 85.8185,
    title: 'Ramesh Farm (Patia)',
    subtitle: 'Farmgate Pickup Point',
  },
  destination = {
    latitude: 20.2520,
    longitude: 85.7815,
    title: 'Bhubaneswar Central Mandi Hub',
    subtitle: 'Gate 3 Unloading Bay',
  },
  vehiclePosition,
  completedPolyline = [],
  remainingPolyline = [],
  mapMode = 'street',
  style,
}) {
  const leafletHtml = useMemo(() => {
    const originLat = origin.latitude || 20.3582;
    const originLon = origin.longitude || 85.8185;
    const destLat = destination.latitude || 20.2520;
    const destLon = destination.longitude || 85.7815;

    const vehLat = vehiclePosition?.latitude || (originLat + destLat) / 2;
    const vehLon = vehiclePosition?.longitude || (originLon + destLon) / 2;
    const vehHeading = vehiclePosition?.heading || 45;
    const vehDriver = vehiclePosition?.driverName || 'Partner Vehicle';
    const vehSpeed = vehiclePosition?.speedKmh || 38;

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
    html, body, #map { width: 100%; height: 100%; background: #0f172a; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    /* Custom Pulsing Markers */
    .farm-pin {
      background: #005129;
      color: white;
      border-radius: 50%;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 14px rgba(0, 81, 41, 0.45);
      border: 2.5px solid #ffffff;
    }
    .dest-pin {
      background: #dc2626;
      color: white;
      border-radius: 50%;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45);
      border: 2.5px solid #ffffff;
    }
    .vehicle-pin {
      position: relative;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .vehicle-pulse {
      position: absolute;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0, 81, 41, 0.28);
      animation: pulseAnim 1.8s infinite ease-out;
    }
    .vehicle-core {
      position: relative;
      background: #005129;
      color: white;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 14px rgba(0, 81, 41, 0.6);
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
    }).setView([${vehLat}, ${vehLon}], 12);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      attribution: '${tileAttr}'
    }).addTo(map);

    // 1. Origin Farm Marker
    var farmIcon = L.divIcon({
      className: '',
      html: '<div class="farm-pin">🌾</div>',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });
    L.marker([${originLat}, ${originLon}], { icon: farmIcon }).addTo(map)
      .bindPopup('<div class="popup-title">${origin.title}</div><div class="popup-sub">${origin.subtitle || "Farmgate Origin"}</div>');

    // 2. Destination Mandi Marker
    var destIcon = L.divIcon({
      className: '',
      html: '<div class="dest-pin">🏪</div>',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });
    L.marker([${destLat}, ${destLon}], { icon: destIcon }).addTo(map)
      .bindPopup('<div class="popup-title">${destination.title}</div><div class="popup-sub">${destination.subtitle || "Mandi Hub"}</div>');

    // 3. Dijkstra Polyline Segments
    var completedCoords = ${completedJson};
    var remainingCoords = ${remainingJson};

    if (completedCoords && completedCoords.length > 1) {
      L.polyline(completedCoords, {
        color: '#16A34A',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }

    if (remainingCoords && remainingCoords.length > 1) {
      L.polyline(remainingCoords, {
        color: '#005129',
        weight: 6,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }

    // 4. Moving Vehicle Delivery Marker
    var vehIcon = L.divIcon({
      className: '',
      html: '<div class="vehicle-pin"><div class="vehicle-pulse"></div><div class="vehicle-core" style="transform: rotate(${vehHeading}deg);">🚚</div></div>',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });
    L.marker([${vehLat}, ${vehLon}], { icon: vehIcon }).addTo(map)
      .bindPopup('<div class="popup-title">${vehDriver}</div><div class="popup-sub">Speed: ${vehSpeed} km/h • Realtime GPS</div>');

    // Fit map bounds to encompass complete route
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
          title="MandiKart Logistics OpenStreetMap"
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
            <ActivityIndicator size="large" color={COLORS.primary} />
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
    height: '100%',
    backgroundColor: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
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
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
