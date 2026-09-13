// Global definitions for React Native & Expo in Node.js
global.__DEV__ = true;
globalThis.expo = {
  EventEmitter: class {
    addListener() { return { remove: () => {} }; }
    emit() {}
  },
};

const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  if (id === 'react-native') {
    return {
      Platform: { OS: 'web', select: (obj) => obj.web || obj.default },
      Alert: { alert: () => {} },
      StyleSheet: { create: (styles) => styles },
    };
  }
  if (id === 'expo-location') {
    return {
      requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
      getCurrentPositionAsync: async () => ({
        coords: { latitude: 21.332, longitude: 83.618 },
      }),
      reverseGeocodeAsync: async () => [
        { city: 'Bargarh', region: 'Odisha', district: 'Bargarh' },
      ],
    };
  }
  if (id === 'expo-modules-core') {
    return {
      EventEmitter: class {
        addListener() { return { remove: () => {} }; }
        emit() {}
      },
      Platform: { OS: 'web' },
      requireNativeModule: () => ({}),
      requireOptionalNativeModule: () => ({}),
    };
  }
  if (id === 'expo-constants') {
    return {
      default: {
        expoConfig: { extra: {} },
      },
    };
  }
  if (id === '@react-native-async-storage/async-storage') {
    const storage = {};
    return {
      getItem: async (k) => storage[k] || null,
      setItem: async (k, v) => { storage[k] = v; },
      removeItem: async (k) => { delete storage[k]; },
      clear: async () => {},
    };
  }
  return originalRequire.apply(this, arguments);
};
