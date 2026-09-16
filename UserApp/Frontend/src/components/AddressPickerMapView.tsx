/**
 * MandiKart — Interactive Address Picker Map View
 * 
 * Provides an OpenStreetMap (OSM) Leaflet map tailored for pinpointing customer delivery addresses.
 * Features:
 *  - Draggable & tap-to-place delivery pin (📍)
 *  - Real-time GPS location centering
 *  - Reverse-geocoding triggers for auto-filling address fields
 *  - 100% Cross-platform: Web (HTML5 iframe with postMessage) & Native (WebView)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Spacing } from '../theme';

export interface AddressPickerCoords {
  latitude: number;
  longitude: number;
}

interface AddressPickerMapViewProps {
  initialCoords?: AddressPickerCoords;
  onLocationSelected: (coords: AddressPickerCoords) => void;
  selectedAddressText?: string;
  isLoadingAddress?: boolean;
  style?: any;
}

export default function AddressPickerMapView({
  initialCoords = { latitude: 18.5204, longitude: 73.8567 },
  onLocationSelected,
  selectedAddressText,
  isLoadingAddress = false,
  style,
}: AddressPickerMapViewProps) {
  const [currentCoords, setCurrentCoords] = useState<AddressPickerCoords>(initialCoords);
  const [isLocating, setIsLocating] = useState(false);
  const iframeRef = useRef<any>(null);
  const webViewRef = useRef<any>(null);

  // Sync when initialCoords updates from parent GPS detection
  useEffect(() => {
    if (
      initialCoords &&
      (Math.abs(initialCoords.latitude - currentCoords.latitude) > 0.0001 ||
        Math.abs(initialCoords.longitude - currentCoords.longitude) > 0.0001)
    ) {
      setCurrentCoords(initialCoords);
      sendCoordsToMap(initialCoords.latitude, initialCoords.longitude);
    }
  }, [initialCoords.latitude, initialCoords.longitude]);

  const sendCoordsToMap = (lat: number, lng: number) => {
    const payload = JSON.stringify({ type: 'SET_LOCATION', lat, lng });
    if (Platform.OS === 'web') {
      try {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(payload, '*');
        }
      } catch {}
    } else {
      try {
        webViewRef.current?.postMessage(payload);
      } catch {}
    }
  };

  // Handle incoming message from Leaflet map
  const handleMapMessage = (data: any) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (parsed.type === 'PIN_MOVED' || parsed.type === 'MAP_CLICKED') {
        const newCoords = { latitude: Number(parsed.lat), longitude: Number(parsed.lng) };
        setCurrentCoords(newCoords);
        onLocationSelected(newCoords);
      }
    } catch {}
  };

  // Attach web postMessage listener
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onWindowMsg = (event: MessageEvent) => {
        if (!event.data) return;
        try {
          const d = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (d?.type === 'PIN_MOVED' || d?.type === 'MAP_CLICKED') {
            handleMapMessage(d);
          }
        } catch {}
      };
      window.addEventListener('message', onWindowMsg);
      return () => window.removeEventListener('message', onWindowMsg);
    }
  }, []);

  // Browser GPS trigger inside the map card
  const handleDetectGPS = () => {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) return;
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setCurrentCoords(coords);
          sendCoordsToMap(coords.latitude, coords.longitude);
          onLocationSelected(coords);
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  // Generate self-contained Leaflet HTML
  const leafletHtml = useMemo(() => {
    const lat = currentCoords.latitude || 18.5204;
    const lng = currentCoords.longitude || 73.8567;

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
    html, body, #map { width: 100%; height: 100%; background: #f8fafc; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    /* Custom Doorstep Pin */
    .pin-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
      cursor: grab;
      filter: drop-shadow(0 6px 12px rgba(0,0,0,0.35));
    }
    .pin-badge {
      background: #15803D;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 999px;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
    .pin-icon {
      width: 36px;
      height: 36px;
      background: #DC2626;
      border: 3px solid #FFFFFF;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: -6px;
    }
    .pin-inner-dot {
      width: 12px;
      height: 12px;
      background: #FFFFFF;
      border-radius: 50%;
      transform: rotate(45deg);
    }
    .pin-pulse {
      width: 22px;
      height: 8px;
      background: rgba(220, 38, 38, 0.4);
      border-radius: 50%;
      margin-top: -2px;
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 0.8; }
      70% { transform: scale(1.6); opacity: 0; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    /* Floating Hint Badge */
    .map-hint {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.88);
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      z-index: 1000;
      pointer-events: none;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  </style>
</head>
<body>
  <div class="map-hint">
    <span>📍</span> Tap anywhere on map or drag pin to adjust doorstep
  </div>
  <div id="map"></div>

  <script>
    var currentLat = ${lat};
    var currentLng = ${lng};

    var map = L.map('map', {
      center: [currentLat, currentLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Custom Draggable Doorstep Pin Icon
    var pinHtml = '<div class="pin-container">' +
      '<div class="pin-badge"><span>📍</span> Deliver Here</div>' +
      '<div class="pin-icon"><div class="pin-inner-dot"></div></div>' +
      '<div class="pin-pulse"></div>' +
      '</div>';

    var pinIcon = L.divIcon({
      className: '',
      html: pinHtml,
      iconSize: [40, 50],
      iconAnchor: [20, 50]
    });

    var marker = L.marker([currentLat, currentLng], {
      icon: pinIcon,
      draggable: true
    }).addTo(map);

    function notifyParent(lat, lng, eventType) {
      var msg = JSON.stringify({ type: eventType || 'PIN_MOVED', lat: lat, lng: lng });
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      }
      if (window.parent && window.parent.postMessage) {
        window.parent.postMessage(msg, '*');
      }
    }

    marker.on('dragend', function(e) {
      var pos = marker.getLatLng();
      notifyParent(pos.lat, pos.lng, 'PIN_MOVED');
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      notifyParent(e.latlng.lat, e.latlng.lng, 'MAP_CLICKED');
    });

    // Handle postMessage from React Native to pan smoothly
    window.addEventListener('message', function(event) {
      if (!event.data) return;
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'SET_LOCATION' && data.lat && data.lng) {
          marker.setLatLng([data.lat, data.lng]);
          map.panTo([data.lat, data.lng], { animate: true, duration: 0.8 });
        }
      } catch (err) {}
    });
  </script>
</body>
</html>
    `;
  }, []);

  return (
    <View style={[styles.container, style]}>
      {/* Map View Frame */}
      <View style={styles.mapFrame}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={leafletHtml}
            style={{ width: '100%', height: '100%', border: 'none' } as any}
            title="MandiKart Address Picker OSM Map"
          />
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: leafletHtml }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            onMessage={(e) => handleMapMessage(e.nativeEvent.data)}
          />
        )}

        {/* GPS Locate Me Button Overlay */}
        <TouchableOpacity
          style={styles.gpsFloatingBtn}
          onPress={handleDetectGPS}
          activeOpacity={0.8}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="locate" size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Realtime Address Strip Below Map */}
      <View style={styles.addressStrip}>
        <View style={styles.pinCircle}>
          <Ionicons name="location" size={16} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.labelRow}>
            <Text style={styles.stripTitle}>Pinned Delivery Location</Text>
            {isLoadingAddress && (
              <View style={styles.loadingPill}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Fetching address...</Text>
              </View>
            )}
          </View>
          <Text style={styles.stripAddress} numberOfLines={2}>
            {selectedAddressText || `${currentCoords.latitude.toFixed(5)}°N, ${currentCoords.longitude.toFixed(5)}°E`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  mapFrame: {
    height: 220,
    width: '100%',
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gpsFloatingBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: Colors.white,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 10,
  },
  addressStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  stripTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  stripAddress: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
