import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { apiClient } from '../services/apiClient';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface GeoAddress {
  formattedAddress: string;
  street?: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  fullName?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export interface SavedAddress {
  id: string;
  type: 'HOME' | 'WORK' | 'OTHER';
  fullName: string;
  phone: string;
  formattedAddress: string;
  street?: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

export interface TrackingPoint {
  coordinates: GeoCoordinates;
  remainingDistanceKm: number;
  etaMinutes: number;
  progressPercent: number;
  speedKmH: number;
}

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface LocationContextType {
  currentLocation: GeoCoordinates | null;
  currentAddress: GeoAddress | null;
  savedAddresses: SavedAddress[];
  selectedAddressId: string;
  activeSavedAddress: SavedAddress | null;
  isLoadingLocation: boolean;
  locationError: string | null;
  permissionStatus: PermissionStatus;
  fetchCurrentLocation: (highAccuracy?: boolean) => Promise<GeoCoordinates | null>;
  reverseGeocode: (coords: { latitude: number; longitude: number }) => Promise<GeoAddress>;
  calculateDistance: (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ) => { distanceKm: number; etaMinutes: number };
  setManualLocation: (coords: GeoCoordinates, address: GeoAddress) => void;
  addSavedAddress: (addr: Omit<SavedAddress, 'id'>) => SavedAddress;
  selectSavedAddress: (id: string) => void;
  deleteSavedAddress: (id: string) => void;
  startDriverSimulation: (
    origin: GeoCoordinates,
    destination: GeoCoordinates,
    onStep: (point: TrackingPoint) => void
  ) => () => void;
}

const DEFAULT_PUNE_COORDS: GeoCoordinates = {
  latitude: 18.5204,
  longitude: 73.8567,
  accuracy: 10,
};

const DEFAULT_PUNE_ADDRESS: GeoAddress = {
  formattedAddress: 'Flat 402, Shivajinagar, FC Road, Pune, Maharashtra - 411005',
  street: 'FC Road',
  area: 'Shivajinagar',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411005',
  country: 'India',
};

const DEFAULT_SAVED_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-1',
    type: 'HOME',
    fullName: 'Ramesh Sharma',
    phone: '+91 98765 43210',
    formattedAddress: '123, Model Town, near SBI Bank, Pune, Maharashtra - 411016',
    street: '123, Model Town',
    area: 'Shivajinagar',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411016',
    isDefault: true,
  },
];

// Haversine formula
function computeHaversineDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const R = 6371; // km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Local Indian Mandi geocoder with regional hub coverage
function resolveLocalAddress(lat: number, lon: number): GeoAddress {
  // Odisha (Bhubaneswar, Cuttack, Puri, Khordha)
  if (lat >= 19.5 && lat <= 21.5 && lon >= 84.0 && lon <= 87.5) {
    return {
      formattedAddress: 'Aiginia Mandi, Khandagiri, Bhubaneswar, Odisha - 751019',
      street: 'NH-16 Khandagiri Road',
      area: 'Aiginia Mandi',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751019',
      country: 'India',
    };
  }
  // Pune corridor
  if (lat >= 18.3 && lat <= 18.7 && lon >= 73.6 && lon <= 74.1) {
    return {
      formattedAddress: 'FC Road, Shivajinagar, Pune, Maharashtra - 411005',
      street: 'FC Road',
      area: 'Shivajinagar',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411005',
      country: 'India',
    };
  }
  // Nashik Farm belt
  if (lat >= 19.8 && lat <= 20.2 && lon >= 73.6 && lon <= 74.0) {
    return {
      formattedAddress: 'Dindori Road, APMC Mandi, Nashik, Maharashtra - 422003',
      street: 'Dindori Road',
      area: 'Panchavati Mandi',
      city: 'Nashik',
      state: 'Maharashtra',
      pincode: '422003',
      country: 'India',
    };
  }
  // Mumbai / Navi Mumbai
  if (lat >= 18.9 && lat <= 19.3 && lon >= 72.7 && lon <= 73.1) {
    return {
      formattedAddress: 'Sector 19, Vashi APMC, Navi Mumbai, Maharashtra - 400703',
      street: 'APMC Market Rd',
      area: 'Vashi',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      pincode: '400703',
      country: 'India',
    };
  }
  // Delhi NCR
  if (lat >= 28.3 && lat <= 28.9 && lon >= 76.8 && lon <= 77.5) {
    return {
      formattedAddress: 'Azadpur Mandi, GT Karnal Road, New Delhi, Delhi - 110033',
      street: 'GT Karnal Road',
      area: 'Azadpur Mandi',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110033',
      country: 'India',
    };
  }
  // Bengaluru
  if (lat >= 12.8 && lat <= 13.2 && lon >= 77.4 && lon <= 77.8) {
    return {
      formattedAddress: 'Yeshwanthpur APMC Yard, Tumkur Road, Bengaluru, Karnataka - 560022',
      street: 'Tumkur Main Road',
      area: 'Yeshwanthpur APMC',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560022',
      country: 'India',
    };
  }
  // Generic fallback
  return {
    formattedAddress: `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E, Central Mandi Hub, India`,
    street: 'Main Mandi Road',
    area: 'Central District',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    country: 'India',
  };
}

const LocationContext = createContext<LocationContextType>({
  currentLocation: DEFAULT_PUNE_COORDS,
  currentAddress: { ...DEFAULT_PUNE_ADDRESS, fullName: 'Ramesh Sharma', phone: '+91 98765 43210' },
  savedAddresses: DEFAULT_SAVED_ADDRESSES,
  selectedAddressId: 'addr-1',
  activeSavedAddress: DEFAULT_SAVED_ADDRESSES[0],
  isLoadingLocation: false,
  locationError: null,
  permissionStatus: 'undetermined',
  fetchCurrentLocation: async () => DEFAULT_PUNE_COORDS,
  reverseGeocode: async () => DEFAULT_PUNE_ADDRESS,
  calculateDistance: () => ({ distanceKm: 2.5, etaMinutes: 15 }),
  setManualLocation: () => {},
  addSavedAddress: () => DEFAULT_SAVED_ADDRESSES[0],
  selectSavedAddress: () => {},
  deleteSavedAddress: () => {},
  startDriverSimulation: () => () => {},
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<GeoCoordinates | null>(DEFAULT_PUNE_COORDS);
  const [currentAddress, setCurrentAddress] = useState<GeoAddress | null>({
    ...DEFAULT_PUNE_ADDRESS,
    fullName: DEFAULT_SAVED_ADDRESSES[0].fullName,
    phone: DEFAULT_SAVED_ADDRESSES[0].phone,
  });
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(DEFAULT_SAVED_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('addr-1');
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');

  const activeSavedAddress = useMemo(() => {
    return savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0] || null;
  }, [savedAddresses, selectedAddressId]);

  const addSavedAddress = (addr: Omit<SavedAddress, 'id'>): SavedAddress => {
    const newAddr: SavedAddress = {
      ...addr,
      id: `addr-${Date.now()}`,
    };
    setSavedAddresses((prev) => {
      if (newAddr.isDefault) {
        return [newAddr, ...prev.map((a) => ({ ...a, isDefault: false }))];
      }
      return [newAddr, ...prev];
    });
    setSelectedAddressId(newAddr.id);
    setCurrentAddress({
      formattedAddress: newAddr.formattedAddress,
      street: newAddr.street,
      area: newAddr.area,
      city: newAddr.city,
      state: newAddr.state,
      pincode: newAddr.pincode,
      country: 'India',
      fullName: newAddr.fullName,
      phone: newAddr.phone,
    });
    return newAddr;
  };

  const selectSavedAddress = (id: string) => {
    setSelectedAddressId(id);
    const target = savedAddresses.find((a) => a.id === id);
    if (target) {
      setCurrentAddress({
        formattedAddress: target.formattedAddress,
        street: target.street,
        area: target.area,
        city: target.city,
        state: target.state,
        pincode: target.pincode,
        country: 'India',
        fullName: target.fullName,
        phone: target.phone,
      });
    }
  };

  const deleteSavedAddress = (id: string) => {
    setSavedAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  // Reverse geocode wrapper: queries backend API first (zero CORS), then direct Nominatim, then local dictionary
  const reverseGeocode = async (coords: { latitude: number; longitude: number }): Promise<GeoAddress> => {
    try {
      const res = await apiClient.tracking.reverseGeocode(coords.latitude, coords.longitude);
      const serverAddr = (res as any)?.data || res;
      if (serverAddr && (serverAddr.city || serverAddr.formattedAddress)) {
        return {
          formattedAddress: serverAddr.formattedAddress || `${serverAddr.area || ''}, ${serverAddr.city}, ${serverAddr.state}`,
          street: serverAddr.street || '',
          area: serverAddr.area || '',
          city: serverAddr.city || 'Pune',
          state: serverAddr.state || 'Maharashtra',
          pincode: serverAddr.pincode || '411005',
          country: serverAddr.country || 'India',
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
      }
    } catch {
      // Backend unavailable, fallback to direct OSM Nominatim
    }

    try {
      const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 4000);
      const osmRes = await fetch(osmUrl, {
        headers: { 'Accept': 'application/json' },
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      if (osmRes.ok) {
        const osmData = await osmRes.json();
        const addr = osmData.address || {};
        const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || 'Pune';
        const state = addr.state || 'Maharashtra';
        const pincode = addr.postcode || '411005';
        const street = addr.road || addr.suburb || addr.neighbourhood || '';
        const area = addr.suburb || addr.neighbourhood || addr.residential || city;
        const formatted = osmData.display_name || `${street ? street + ', ' : ''}${area}, ${city}, ${state} - ${pincode}`;

        return {
          formattedAddress: formatted,
          street: street || area,
          area,
          city,
          state,
          pincode,
          country: addr.country || 'India',
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
      }
    } catch {
      // Fall through to regional dictionary
    }

    const local = resolveLocalAddress(coords.latitude, coords.longitude);
    return {
      ...local,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  };

  const fetchCurrentLocation = async (highAccuracy: boolean = false): Promise<GeoCoordinates | null> => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      if (Platform.OS === 'web') {
        const coords = await new Promise<GeoCoordinates>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser.'));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              });
            },
            (err) => reject(err),
            { timeout: 10000, enableHighAccuracy: highAccuracy }
          );
        });

        setCurrentLocation(coords);
        setPermissionStatus('granted');
        const resolvedAddr = await reverseGeocode(coords);
        setCurrentAddress(resolvedAddr);
        setIsLoadingLocation(false);
        return coords;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status === 'granted' ? 'granted' : 'denied');

      if (status !== 'granted') {
        setLocationError('Location permission was denied.');
        setIsLoadingLocation(false);
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });

      const coords: GeoCoordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
      };

      setCurrentLocation(coords);
      const resolvedAddr = await reverseGeocode(coords);
      setCurrentAddress(resolvedAddr);
      setIsLoadingLocation(false);
      return coords;
    } catch (err: any) {
      setLocationError(err?.message || 'Failed to obtain live location.');
      setIsLoadingLocation(false);
      return null;
    }
  };

  const setManualLocation = (coords: GeoCoordinates, address: GeoAddress) => {
    setCurrentLocation(coords);
    setCurrentAddress(address);
  };

  const calculateDistance = (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ) => {
    const distanceKm = computeHaversineDistance(from, to);
    const etaMinutes = Math.max(5, Math.round((distanceKm / 30) * 60));
    return { distanceKm, etaMinutes };
  };

  const startDriverSimulation = (
    origin: GeoCoordinates,
    destination: GeoCoordinates,
    onStep: (point: TrackingPoint) => void
  ) => {
    let step = 0;
    const totalSteps = 20;

    const interval = setInterval(() => {
      step++;
      const progress = Math.min(1, step / totalSteps);
      const currentLat = origin.latitude + (destination.latitude - origin.latitude) * progress;
      const currentLon = origin.longitude + (destination.longitude - origin.longitude) * progress;

      const remainingDist = computeHaversineDistance(
        { latitude: currentLat, longitude: currentLon },
        destination
      );

      const etaMin = Math.max(2, Math.round((remainingDist / 28) * 60));
      const speed = Math.round(24 + Math.sin(step) * 6);

      onStep({
        coordinates: {
          latitude: currentLat,
          longitude: currentLon,
          speed,
        },
        remainingDistanceKm: remainingDist,
        etaMinutes: etaMin,
        progressPercent: Math.round(progress * 100),
        speedKmH: speed,
      });

      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 2500);

    return () => clearInterval(interval);
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        currentAddress,
        savedAddresses,
        selectedAddressId,
        activeSavedAddress,
        isLoadingLocation,
        locationError,
        permissionStatus,
        fetchCurrentLocation,
        reverseGeocode,
        calculateDistance,
        setManualLocation,
        addSavedAddress,
        selectSavedAddress,
        deleteSavedAddress,
        startDriverSimulation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
