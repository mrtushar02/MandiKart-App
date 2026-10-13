/**
 * MandiKart Farmer App — Real Interactive OpenStreetMap (OSM) Farm Map Component
 * 
 * Features:
 *  - Real OpenStreetMap (OSM) tile rendering with Leaflet.js
 *  - High-resolution Satellite Imagery toggle (ArcGIS World Imagery)
 *  - Real-time Pin Point for Farmgate & Land Tracking
 *  - Interactive tap-to-pin & draggable marker
 *  - Real GPS current location tracking with accuracy beacon
 *  - Automatic reverse geocoding via OpenStreetMap Nominatim
 *  - Cross-platform: Web (HTML5 iframe) & Native (WebView)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  MapPin,
  Crosshair,
  Layers,
  Navigation,
  CheckCircle2,
} from 'lucide-react-native';

export interface FarmMapViewProps {
  locationName: string;
  latitude?: number;
  longitude?: number;
  acres?: number;
  onLocationChange?: (coords: {
    latitude: number;
    longitude: number;
    address?: string;
    village?: string;
    district?: string;
    state?: string;
  }) => void;
  onDetectGps?: () => void;
  isLocating?: boolean;
}

export function FarmMapView({
  locationName = 'Nashik, Maharashtra',
  latitude = 20.0063,
  longitude = 73.7901,
  acres = 5.5,
  onLocationChange,
  onDetectGps,
  isLocating = false,
}: FarmMapViewProps) {
  const [currentLat, setCurrentLat] = useState<number>(latitude || 20.0063);
  const [currentLng, setCurrentLng] = useState<number>(longitude || 73.7901);
  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('street');
  const [geocodingAddress, setGeocodingAddress] = useState<string>('');
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);

  const iframeRef = useRef<any>(null);
  const webViewRef = useRef<any>(null);

  // Sync props when parent updates coordinates
  useEffect(() => {
    if (latitude && longitude) {
      if (Math.abs(latitude - currentLat) > 0.0001 || Math.abs(longitude - currentLng) > 0.0001) {
        setCurrentLat(latitude);
        setCurrentLng(longitude);
      }
    }
  }, [latitude, longitude]);

  // Reverse geocode coordinates via OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lon: number) => {
    setIsReverseGeocoding(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'MandiKart-FarmerApp/1.0',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const village = addr.village || addr.suburb || addr.town || addr.hamlet || addr.county || '';
        const district = addr.state_district || addr.district || addr.county || '';
        const state = addr.state || 'Maharashtra';
        const formatted = [village, district, state].filter(Boolean).join(', ');
        
        const finalAddress = formatted || data.display_name?.split(',').slice(0, 3).join(',') || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        setGeocodingAddress(finalAddress);

        if (onLocationChange) {
          onLocationChange({
            latitude: lat,
            longitude: lon,
            address: finalAddress,
            village,
            district,
            state,
          });
        }
      }
    } catch (e) {
      console.warn('[FarmMap] Reverse geocode error:', e);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Handle incoming pin position message from Leaflet map
  const handleMapPinChange = (lat: number, lon: number) => {
    setCurrentLat(lat);
    setCurrentLng(lon);
    reverseGeocode(lat, lon);
  };

  // Web event listener for postMessage from Leaflet iframe
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleWindowMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type === 'MANDIKART_PIN_MOVED') {
          handleMapPinChange(Number(data.latitude), Number(data.longitude));
        }
      } catch {}
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  // HTML content rendering real OpenStreetMap with Leaflet
  const leafletHtml = useMemo(() => {
    const tileUrl =
      mapMode === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileAttr =
      mapMode === 'satellite'
        ? '&copy; Esri World Imagery'
        : '&copy; OpenStreetMap contributors';

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
    html, body, #map { width: 100%; height: 100%; background: #164223; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    /* Custom Pulsing Farm Marker */
    .farm-pin-container {
      position: relative;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
    }
    .farm-pulse {
      position: absolute;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(30, 90, 42, 0.35);
      animation: pulseMarker 2s infinite ease-out;
    }
    .farm-pin-core {
      position: relative;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #1E5A2A;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
      font-weight: bold;
    }
    @keyframes pulseMarker {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      padding: 2px 4px;
      font-size: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }
    .popup-title { font-weight: 800; color: #1E5A2A; font-size: 13px; }
    .popup-sub { color: #64748B; font-size: 11px; margin-top: 2px; }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView([${currentLat}, ${currentLng}], 15);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      attribution: '${tileAttr}'
    }).addTo(map);

    // Draggable Farmgate Pin
    var farmIcon = L.divIcon({
      className: '',
      html: '<div class="farm-pin-container"><div class="farm-pulse"></div><div class="farm-pin-core">🌾</div></div>',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    var marker = L.marker([${currentLat}, ${currentLng}], {
      icon: farmIcon,
      draggable: true,
      autoPan: true
    }).addTo(map);

    marker.bindPopup('<div class="popup-title">🌾 Your Farmgate Pin</div><div class="popup-sub">Drag marker or tap map to adjust location</div>').openPopup();

    function notifyPosition(lat, lng) {
      var payload = JSON.stringify({
        type: 'MANDIKART_PIN_MOVED',
        latitude: lat,
        longitude: lng
      });

      // Web iframe postMessage
      if (window.parent) {
        window.parent.postMessage(payload, '*');
      }
      // React Native WebView postMessage
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(payload);
      }
    }

    // Drag end listener
    marker.on('dragend', function(e) {
      var coord = e.target.getLatLng();
      notifyPosition(coord.lat, coord.lng);
    });

    // Tap map to reposition pin
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      notifyPosition(e.latlng.lat, e.latlng.lng);
    });
  </script>
</body>
</html>
    `;
  }, [currentLat, currentLng, mapMode]);

  return (
    <View style={styles.container}>
      {/* ── OSM Leaflet Map Canvas ── */}
      <View style={styles.canvasWrapper}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={leafletHtml}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title="MandiKart Real OpenStreetMap Farm View"
          />
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: leafletHtml }}
            style={styles.webview}
            scrollEnabled={false}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data?.type === 'MANDIKART_PIN_MOVED') {
                  handleMapPinChange(Number(data.latitude), Number(data.longitude));
                }
              } catch {}
            }}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1E5A2A" />
              </View>
            )}
            startInLoadingState
          />
        )}

        {/* ── Top Coordinates & Accuracy Pill ── */}
        <View style={styles.coordsBadge}>
          <Navigation size={12} color="#1E5A2A" />
          <Text style={styles.coordsText}>
            {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E • {acres} Acres
          </Text>
        </View>

        {/* ── Top Right Street / Satellite Toggle ── */}
        <Pressable
          style={styles.layerBtn}
          onPress={() => setMapMode(mapMode === 'satellite' ? 'street' : 'satellite')}
        >
          <Layers size={13} color="#1F2937" />
          <Text style={styles.layerBtnText}>
            {mapMode === 'satellite' ? 'Street' : 'Satellite'}
          </Text>
        </Pressable>

        {/* ── Bottom Left Location Name Card ── */}
        <View style={styles.bottomLocationCard}>
          <MapPin size={15} color="#1E5A2A" />
          <Text numberOfLines={1} style={styles.bottomLocationText}>
            {geocodingAddress || locationName}
          </Text>
          {isReverseGeocoding ? (
            <ActivityIndicator size="small" color="#1E5A2A" style={{ marginLeft: 4 }} />
          ) : (
            <CheckCircle2 size={13} color="#10B981" />
          )}
        </View>

        {/* ── GPS Recenter Trigger ── */}
        {onDetectGps && (
          <Pressable
            style={[styles.recenterBtn, isLocating && styles.recenterBtnActive]}
            onPress={onDetectGps}
            accessibilityRole="button"
            accessibilityLabel="Track Current GPS Location"
          >
            {isLocating ? (
              <ActivityIndicator size="small" color="#1E5A2A" />
            ) : (
              <Crosshair size={18} color="#1E5A2A" strokeWidth={2.4} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#ECEAE3',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  canvasWrapper: {
    width: '100%',
    height: 240,
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordsBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  coordsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E5A2A',
  },
  layerBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  layerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  bottomLocationCard: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 65,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  bottomLocationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recenterBtnActive: {
    backgroundColor: '#E8F5E9',
  },
});
