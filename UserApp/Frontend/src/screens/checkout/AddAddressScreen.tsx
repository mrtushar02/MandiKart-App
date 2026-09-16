import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Alert, Switch, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useLocation } from '../../context/LocationContext';
import AddressPickerMapView, { AddressPickerCoords } from '../../components/AddressPickerMapView';

type AddressType = 'HOME' | 'WORK' | 'OTHER';

export default function AddAddressScreen() {
  const navigation = useNavigation();
  const {
    fetchCurrentLocation,
    currentAddress,
    currentLocation,
    reverseGeocode,
    addSavedAddress,
    activeSavedAddress,
    isLoadingLocation,
  } = useLocation();

  // Selected Pin Coordinates on Map
  const [pinCoords, setPinCoords] = useState<AddressPickerCoords>(() => ({
    latitude: currentLocation?.latitude || 18.5204,
    longitude: currentLocation?.longitude || 73.8567,
  }));
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Form State with prefilled defaults from active profile
  const [fullName, setFullName] = useState(activeSavedAddress?.fullName || 'Ramesh Sharma');
  const [phone, setPhone] = useState(activeSavedAddress?.phone?.replace('+91', '').trim() || '9876543210');
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState(currentAddress?.city || 'Pune');
  const [state, setState] = useState(currentAddress?.state || 'Maharashtra');
  const [pincode, setPincode] = useState(currentAddress?.pincode || '411005');
  const [addressType, setAddressType] = useState<AddressType>('HOME');
  const [isDefault, setIsDefault] = useState(true);

  // Auto-detect realtime GPS location on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const loc = await fetchCurrentLocation(false);
        if (loc && active) {
          setPinCoords({ latitude: loc.latitude, longitude: loc.longitude });
          const resolved = await reverseGeocode(loc);
          if (resolved && active) {
            applyResolvedAddress(resolved);
          }
        }
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  const applyResolvedAddress = (resolved: any) => {
    if (resolved.street) setHouseNo(resolved.street);
    if (resolved.area) setStreet(resolved.area);
    if (resolved.city) setCity(resolved.city);
    if (resolved.state) setState(resolved.state);
    if (resolved.pincode) setPincode(resolved.pincode);
  };

  // Reverse geocode when pin moves or is tapped on the map
  const handlePinMoved = async (newCoords: AddressPickerCoords) => {
    setPinCoords(newCoords);
    setIsReverseGeocoding(true);
    try {
      const resolved = await reverseGeocode(newCoords);
      if (resolved) {
        applyResolvedAddress(resolved);
      }
    } catch {} finally {
      setIsReverseGeocoding(false);
    }
  };

  // Explicit GPS detection button
  const handleDetectLocation = async () => {
    setIsReverseGeocoding(true);
    const loc = await fetchCurrentLocation(true);
    if (loc) {
      setPinCoords({ latitude: loc.latitude, longitude: loc.longitude });
      const resolved = await reverseGeocode(loc);
      setIsReverseGeocoding(false);
      if (resolved) {
        applyResolvedAddress(resolved);
        const msg = `Address auto-filled from live device GPS:\n${resolved.formattedAddress}`;
        if (Platform.OS === 'web') {
          window.alert(`GPS Location Detected 📍\n${msg}`);
        } else {
          Alert.alert('GPS Location Detected 📍', msg);
        }
      }
    } else {
      setIsReverseGeocoding(false);
    }
  };

  const currentFormattedText = [
    houseNo,
    street,
    landmark,
    city,
    state,
    pincode,
  ].filter(Boolean).join(', ');

  const handleSave = () => {
    if (!fullName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter your Full Name.');
      } else {
        Alert.alert('Required Field', 'Please enter your Full Name.');
      }
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a valid 10-digit mobile number.');
      } else {
        Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      }
      return;
    }
    if (!houseNo.trim() || !street.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please fill in House No and Street/Area details.');
      } else {
        Alert.alert('Required Field', 'Please fill in House No and Street/Area details.');
      }
      return;
    }
    if (!pincode.trim() || pincode.length !== 6) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a valid 6-digit Pincode.');
      } else {
        Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit Pincode.');
      }
      return;
    }

    addSavedAddress({
      type: addressType,
      fullName,
      phone,
      formattedAddress: `${houseNo}, ${street}, ${landmark ? landmark + ', ' : ''}${city}, ${state} - ${pincode}`,
      street: houseNo,
      area: street,
      city,
      state,
      pincode,
      isDefault,
      latitude: pinCoords.latitude,
      longitude: pinCoords.longitude,
    });

    if (Platform.OS === 'web') {
      window.alert(`Address Saved! 🎉\nNew ${addressType} delivery address added successfully.`);
      (navigation as any).navigate('DeliveryAddress');
    } else {
      Alert.alert(
        'Address Saved! 🎉',
        `New ${addressType} delivery address added successfully.`,
        [
          {
            text: 'View Delivery Addresses',
            onPress: () => (navigation as any).navigate('DeliveryAddress'),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Delivery Address</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* GPS Auto-fill button */}
        <TouchableOpacity style={styles.gpsBtn} onPress={handleDetectLocation} activeOpacity={0.85}>
          <Ionicons name="navigate-circle" size={22} color={Colors.primary} />
          <View style={styles.gpsTextWrap}>
            <Text style={styles.gpsTitle}>Use Current Location (GPS)</Text>
            <Text style={styles.gpsSub}>Auto-fill area, city & pincode</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>

        {/* Live Interactive Address Picker Pinpoint Map View */}
        <View style={{ marginBottom: Spacing.md }}>
          <AddressPickerMapView
            initialCoords={pinCoords}
            onLocationSelected={handlePinMoved}
            selectedAddressText={currentFormattedText}
            isLoadingAddress={isReverseGeocoding || isLoadingLocation}
          />
        </View>

        {/* Address Type selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Save Address As</Text>
          <View style={styles.typeRow}>
            {(['HOME', 'WORK', 'OTHER'] as AddressType[]).map((type) => {
              const active = addressType === type;
              const iconName = type === 'HOME' ? 'home' : type === 'WORK' ? 'briefcase' : 'location';
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                  onPress={() => setAddressType(type)}
                >
                  <Ionicons name={iconName} size={16} color={active ? Colors.white : Colors.textSecondary} />
                  <Text style={[styles.typeText, active && styles.typeTextActive]}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.section}>
          <Text style={styles.label}>Contact Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            placeholderTextColor={Colors.textDisabled}
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Mobile Number (10 digits) *"
            placeholderTextColor={Colors.textDisabled}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Address Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Flat, House No, Building Name *"
            placeholderTextColor={Colors.textDisabled}
            value={houseNo}
            onChangeText={setHouseNo}
          />
          <TextInput
            style={styles.input}
            placeholder="Street, Area, Colony *"
            placeholderTextColor={Colors.textDisabled}
            value={street}
            onChangeText={setStreet}
          />
          <TextInput
            style={styles.input}
            placeholder="Landmark (Optional e.g. Near Bank)"
            placeholderTextColor={Colors.textDisabled}
            value={landmark}
            onChangeText={setLandmark}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="City *"
              placeholderTextColor={Colors.textDisabled}
              value={city}
              onChangeText={setCity}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Pincode (6 digits) *"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="State *"
            placeholderTextColor={Colors.textDisabled}
            value={state}
            onChangeText={setState}
          />
        </View>

        {/* Set as Default Toggle */}
        <View style={styles.defaultRow}>
          <View style={styles.defaultTextWrap}>
            <Text style={styles.defaultTitle}>Make this my default address</Text>
            <Text style={styles.defaultSub}>Orders will default to this delivery location</Text>
          </View>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
            thumbColor={isDefault ? Colors.primary : Colors.white}
          />
        </View>
      </ScrollView>

      {/* Footer Save Button */}
      <View style={styles.footer}>
        <PrimaryButton
          title="Save & Proceed"
          onPress={handleSave}
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  scroll: { padding: Spacing.md, gap: Spacing.lg },
  // GPS Button
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  gpsTextWrap: { flex: 1 },
  gpsTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  gpsSub: { fontSize: 11, color: Colors.textSecondary },
  // Section
  section: { gap: Spacing.sm },
  label: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  input: {
    backgroundColor: Colors.white,
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  row: { flexDirection: 'row', gap: Spacing.md },
  halfInput: { flex: 1 },
  // Type Chips
  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  typeTextActive: { color: Colors.white },
  // Default Switch
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  defaultTextWrap: { flex: 1, marginRight: Spacing.md },
  defaultTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  defaultSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  // Footer
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.lg,
  },
});
