/**
 * MandiKart Farmer App — Farmer Profile & Edit Screen
 * Full details display and inline editing with Zustand persistence and photo upload.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import {
  ChevronLeft,
  Camera,
  MapPin,
  LocateFixed,
  Phone,
  Mail,
  ShieldCheck,
  Building,
  Sprout,
  Layers,
  Edit3,
  Check,
  X,
  User,
  Plus,
} from 'lucide-react-native';
import { MKLayout } from '@/constants/layout';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/apiClient';
import { pickImageFromGallery, takePhotoWithCamera } from '@/services/imagePickerService';
import { getCurrentFarmerLocation } from '@/services/locationService';

export default function FarmerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser, farmer, updateFarmer, setPhoneNumber, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Editable fields
  const names = (user?.fullName || user?.name || farmer?.fullName || '').trim().split(' ');
  const defaultFirst = user?.firstName || names[0] || 'Farmer';
  const defaultLast = user?.lastName || (names.length > 1 ? names.slice(1).join(' ') : '');
  const defaultPhone = user?.phone && !user.phone.includes('9876543210') ? user.phone.replace('+91', '') : '';

  const [firstName, setFirstName] = useState(defaultFirst);
  const [middleName, setMiddleName] = useState(user?.middleName || '');
  const [lastName, setLastName] = useState(defaultLast);
  const [phone, setPhone] = useState(defaultPhone);
  const [countryCode, setCountryCode] = useState(user?.countryCode || '+91');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(user?.avatarUri || (farmer as any)?.avatarUrl);

  useEffect(() => {
    if (!isEditing && (user || farmer)) {
      const currentName = user?.fullName || user?.name || farmer?.fullName || '';
      const parts = currentName.trim().split(' ');
      if (parts[0]) setFirstName(user?.firstName || parts[0]);
      if (parts.length > 1) setLastName(user?.lastName || parts.slice(1).join(' '));
      if (user?.middleName) setMiddleName(user.middleName);
      if (user?.phone) setPhone(user.phone.replace('+91', ''));
      if (user?.email) setEmail(user.email);
      if (user?.avatarUri || (farmer as any)?.avatarUrl) setAvatarUri(user?.avatarUri || (farmer as any)?.avatarUrl);
      if (user?.village || farmer?.village) setVillage(user?.village || farmer?.village || '');
      if (user?.district || farmer?.district) setDistrict(user?.district || farmer?.district || 'Nashik');
      if (user?.state || farmer?.state) setStateName(user?.state || farmer?.state || 'Maharashtra');
    }
  }, [user, farmer, isEditing]);

  const [village, setVillage] = useState(user?.village || '');
  const [city, setCity] = useState(user?.city || '');
  const [district, setDistrict] = useState(user?.district || 'Nashik');
  const [stateName, setStateName] = useState(user?.state || 'Maharashtra');
  const [farmSize, setFarmSize] = useState(user?.farmSizeAcres?.toString() || '5');
  const [experienceYears, setExperienceYears] = useState(user?.experienceYears?.toString() || '10');
  const [crops, setCrops] = useState<string[]>(user?.crops || ['Onion', 'Wheat', 'Tomato']);
  const [newCropInput, setNewCropInput] = useState('');

  const topPadding = MKLayout.getTopHeaderPadding(insets);

  const handlePickAvatar = () => {
    Alert.alert('Update Photo', 'Choose profile photo source', [
      {
        text: 'Camera',
        onPress: async () => {
          const res = await takePhotoWithCamera();
          if (!res.cancelled && res.uri) setAvatarUri(res.uri);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const res = await pickImageFromGallery();
          if (!res.cancelled && res.uri) setAvatarUri(res.uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAutoDetectGPS = async () => {
    setIsLocating(true);
    const loc = await getCurrentFarmerLocation();
    setIsLocating(false);
    if (loc) {
      if (loc.village) setVillage(loc.village);
      if (loc.city) setCity(loc.city);
      if (loc.district) setDistrict(loc.district);
      if (loc.state) setStateName(loc.state);
      Alert.alert('GPS Updated', `Location set to ${loc.formattedAddress}`);
    }
  };

  const handleAddCrop = () => {
    const trimmed = newCropInput.trim();
    if (trimmed && !crops.includes(trimmed)) {
      setCrops([...crops, trimmed]);
      setNewCropInput('');
    }
  };

  const handleRemoveCrop = (cropName: string) => {
    setCrops(crops.filter((c) => c !== cropName));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const formattedPhone = cleanDigits ? `+91${cleanDigits}` : phone;
    const fullNameCombined =
      [firstName, middleName, lastName].filter(Boolean).join(' ').trim() ||
      firstName.trim() ||
      'Farmer';

    const updated: any = {
      ...user,
      firstName,
      middleName,
      lastName,
      fullName: fullNameCombined,
      name: fullNameCombined,
      phone: formattedPhone,
      countryCode,
      email,
      avatarUri,
      village,
      city,
      district,
      state: stateName,
      farmSizeAcres: parseFloat(farmSize) || 5,
      experienceYears: parseInt(experienceYears, 10) || 10,
      crops,
      ...(user?.fpoDetails
        ? {
            fpoDetails: {
              ...user.fpoDetails,
              representativeName: fullNameCombined,
            },
          }
        : {}),
    };

    setUser(updated);
    updateFarmer({
      fullName: fullNameCombined,
      phone: formattedPhone,
      village,
      district,
      state: stateName,
    });

    if (cleanDigits) {
      setPhoneNumber(formattedPhone);
    }

    try {
      await apiClient.put('/farmers/profile', {
        fullName: fullNameCombined,
        phone: formattedPhone,
        village,
        state: stateName,
        district,
        avatarUrl: avatarUri,
      });

      await apiClient.put('/farmers/farm-details', {
        farmSizeAcres: parseFloat(farmSize) || 5,
        primaryCrops: crops,
      });
    } catch (err: any) {
      console.warn('Profile save remote sync note:', err?.message);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
      Alert.alert('Profile Updated', `Farmer details for "${fullNameCombined}" successfully saved!`, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Top App Bar ── */}
      <View style={[styles.topBar, { paddingTop: topPadding }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={22} color="#1F2937" strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.topBarTitle}>Farmer Profile</Text>
        <Pressable
          style={[styles.editBtn, isEditing && styles.editBtnActive]}
          onPress={() => {
            if (isEditing) {
              handleSaveProfile();
            } else {
              setIsEditing(true);
            }
          }}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : isEditing ? (
            <>
              <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.editBtnTextActive}>Save</Text>
            </>
          ) : (
            <>
              <Edit3 size={15} color="#1E5A2A" />
              <Text style={styles.editBtnText}>Edit</Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Header ── */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarWrapper}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <User size={44} color="#1E5A2A" />
              </View>
            )}
            {isEditing && (
              <Pressable style={styles.avatarCameraBtn} onPress={handlePickAvatar}>
                <Camera size={16} color="#FFFFFF" />
              </Pressable>
            )}
          </View>

          <Text style={styles.farmerFullName}>
            {firstName} {middleName ? `${middleName} ` : ''}{lastName}
          </Text>
          <Text style={styles.farmerRolePill}>VERIFIED PRODUCER • MANDIKART MEMBER</Text>

          <View style={styles.verifiedTagRow}>
            <ShieldCheck size={14} color="#15803D" />
            <Text style={styles.verifiedTagText}>Kisan KYC Verified</Text>
          </View>
        </View>

        {/* ── Personal & Contact Details ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <View style={styles.fieldsGrid}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>First Name</Text>
              {isEditing ? (
                <TextInput style={styles.fieldInput} value={firstName} onChangeText={setFirstName} />
              ) : (
                <Text style={styles.fieldVal}>{firstName}</Text>
              )}
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Middle Name</Text>
              {isEditing ? (
                <TextInput style={styles.fieldInput} value={middleName} onChangeText={setMiddleName} />
              ) : (
                <Text style={styles.fieldVal}>{middleName || '—'}</Text>
              )}
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              {isEditing ? (
                <TextInput style={styles.fieldInput} value={lastName} onChangeText={setLastName} />
              ) : (
                <Text style={styles.fieldVal}>{lastName}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <View style={styles.fieldIconWrap}>
              <Phone size={16} color="#1E5A2A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <Text style={styles.fieldVal}>{countryCode} {phone}</Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldIconWrap}>
              <Mail size={16} color="#1E5A2A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              {isEditing ? (
                <TextInput style={styles.fieldInput} value={email} onChangeText={setEmail} autoCapitalize="none" />
              ) : (
                <Text style={styles.fieldVal}>{email || 'Not provided'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Farm & Geographical Location ── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Farm Location</Text>
            {isEditing && (
              <Pressable style={styles.gpsDetectBtn} onPress={handleAutoDetectGPS} disabled={isLocating}>
                {isLocating ? (
                  <ActivityIndicator size="small" color="#1E5A2A" />
                ) : (
                  <>
                    <LocateFixed size={14} color="#1E5A2A" />
                    <Text style={styles.gpsDetectText}>Auto GPS</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>

          <View style={styles.fieldsGrid}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Village</Text>
              {isEditing ? (
                <TextInput style={styles.fieldInput} value={village} onChangeText={setVillage} />
              ) : (
                <Text style={styles.fieldVal}>{village}</Text>
              )}
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Mandi City / Taluka</Text>
              {isEditing ? (
                <TextInput style={styles.fieldInput} value={city} onChangeText={setCity} />
              ) : (
                <Text style={styles.fieldVal}>{city}</Text>
              )}
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>District</Text>
              {isEditing ? (
                <TextInput style={styles.fieldInput} value={district} onChangeText={setDistrict} />
              ) : (
                <Text style={styles.fieldVal}>{district}</Text>
              )}
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>State</Text>
              {isEditing ? (
                <TextInput style={styles.fieldInput} value={stateName} onChangeText={setStateName} />
              ) : (
                <Text style={styles.fieldVal}>{stateName}</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Agricultural Capacity & Experience ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Farm Capacity & Experience</Text>

          <View style={styles.fieldsGrid}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Land Size (Acres)</Text>
              {isEditing ? (
                <TextInput style={styles.fieldInput} value={farmSize} onChangeText={setFarmSize} keyboardType="numeric" />
              ) : (
                <Text style={styles.fieldVal}>{farmSize} Acres</Text>
              )}
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Farming Experience</Text>
              {isEditing ? (
                <TextInput style={styles.fieldInput} value={experienceYears} onChangeText={setExperienceYears} keyboardType="numeric" />
              ) : (
                <Text style={styles.fieldVal}>{experienceYears} Years</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>Crops Cultivated</Text>
          <View style={styles.cropsTagWrap}>
            {crops.map((c) => (
              <View key={c} style={styles.cropTag}>
                <Sprout size={13} color="#1E5A2A" />
                <Text style={styles.cropTagText}>{c}</Text>
                {isEditing && (
                  <Pressable onPress={() => handleRemoveCrop(c)} hitSlop={6}>
                    <X size={12} color="#6B7280" />
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          {isEditing && (
            <View style={styles.addCropInputRow}>
              <TextInput
                style={styles.addCropInput}
                placeholder="Add another crop..."
                value={newCropInput}
                onChangeText={setNewCropInput}
              />
              <Pressable style={styles.addCropBtn} onPress={handleAddCrop}>
                <Plus size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Bank Account Verification ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Settlement Bank Account</Text>
          <View style={styles.fieldRow}>
            <View style={styles.fieldIconWrap}>
              <Building size={16} color="#1E5A2A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>State Bank of India</Text>
              <Text style={styles.fieldVal}>A/C: *******8912 • IFSC: SBIN0001420</Text>
            </View>
            <View style={styles.bankVerifiedBadge}>
              <ShieldCheck size={13} color="#15803D" />
              <Text style={styles.bankVerifiedText}>Linked</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F1E9',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3DCCF',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
  },
  editBtnActive: {
    backgroundColor: '#1E5A2A',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E5A2A',
  },
  editBtnTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E3DCCF',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E5A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  farmerFullName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  farmerRolePill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E5A2A',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 6,
    letterSpacing: 0.4,
  },
  verifiedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  verifiedTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E3DCCF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 14,
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  gpsDetectText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E5A2A',
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldCol: {
    width: '48%',
  },
  fieldLabel: {
    fontSize: 11.5,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  fieldInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  fieldIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropsTagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  cropTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cropTagText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#166534',
  },
  addCropInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  addCropInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
  },
  addCropBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1E5A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bankVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
});
