/**
 * MandiKart Farmer App — Screen 7: Tell Us About Your Farm (Farm Details)
 * 
 * Implements the approved Stitch visual design:
 * Hero farm landscape, location picker with stylized map thumbnail, farm size
 * with unit selector (Acres/Hectares), crop multiselect grid (Onion, Wheat, Tomato, etc.),
 * farm ownership toggle, success banner, and 3D FINISH SETUP CTA.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MapPin,
  LocateFixed,
  Layers,
  Sprout,
  Plus,
  Warehouse,
  Check,
  ArrowRight,
  ShieldCheck,
  Camera,
  FileText,
  UploadCloud,
  CheckCircle2,
  X,
  Image as ImageIcon,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { MKBackground, MKButton, MKHeader } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/apiClient';
import { CelebrationModal } from '@/components/CelebrationModal';
import { FarmMapView } from '@/components/FarmMapView';
import { pickImageFromGallery, takePhotoWithCamera } from '@/services/imagePickerService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HERO_LANDSCAPE_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAyitG1xHjUeo25NCa6DDi94QFNt27vCURHeh9yKp9spBBGWmv17NeA8sqx9TjvMCAjisWRTFpQocVVqSK2q2MSooODZPmu3IvMHisHI07SfQjdcIyr9EPOLOaQb_5XicVXzEfhZTJLZtQn25nuHaoN6WGQvX46cyJGa0MGHb_c9xrbYpkTUxlUKucGs4ULOkjxijPWQbuIr_OCKQOxlZmNb2OyVJjzmQbSqPIygzfOZeUtD7TdSPo0xBOhiyqbMtWNa9mUmzk7X-B0MIE';

const MAP_PREVIEW_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBLvnl7gsUW_MCoB86sEZRv_OEYp0rdF1t6TW0PNIqVjBm_aP2CUGx9Qp9gdG1ximKx0cq2En63MF5nuGoqUrOraX0FgsUIYtUj7HxvjeXR2w6IQyBHdBlllpG14KDFOxMEjw_ANF_ZoBWdf5LwN2uPDEg4vvQirwWNFbCLcNGkBAO7DAdGdRHREzDQo6eL2HDx03d55yYKw0SypjlNYfbKOzTpCx7KgMQFF22Lw6j2oWrtMbxrXm5lqA';

const VEGGIE_BASKET_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAEsoOdmex3qtM0FjWgMDqCkVgzuRtFPoR_fKQ5HxW1Poj6zald8zwgJrtyR76k7D7tquV6ZfHLUpr0qHuP_TEMvlaESWEO8V3CY-LWBDAfR7192ruOhrkYLVk8iMruBK_nsicsfK8_KvrL7C6-At1J39Nq4pksJxKgwKH-MZS5KCq1Eas50IEcfIaAcn_mv-k3t8gJKNNW1UsjtV_wH26sHx6pYGy0rAvoAMz4xHCHE_Nxt7EdK3n0NA';

interface CropOption {
  id: string;
  name: string;
  emoji?: string;
  image?: string;
}

const CROPS_LIST: CropOption[] = [
  { id: 'onion', name: 'Onion', emoji: '🧅' },
  { id: 'wheat', name: 'Wheat', emoji: '🌾' },
  { id: 'tomato', name: 'Tomato', emoji: '🍅' },
  { id: 'potato', name: 'Potato', emoji: '🥔' },
  { id: 'rice', name: 'Rice', emoji: '🍚' },
  { id: 'maize', name: 'Maize', emoji: '🌽' },
  { id: 'cotton', name: 'Cotton', emoji: '☁️' },
  { id: 'soybean', name: 'Soybean', emoji: '🌱' },
];

export default function FarmDetailsScreen() {
  const router = useRouter();
  const { user, setUser, setIsAuthenticated, setOnboarded, completeOnboarding } = useAuthStore();

  const defaultLocation = user?.village
    ? `${user.village}${user.district ? `, ${user.district}` : ''}`
    : user?.district
    ? `${user.district}, ${user.state || 'Maharashtra'}`
    : 'Nashik, Maharashtra';
  const [farmLocation, setFarmLocation] = useState(defaultLocation);
  const [farmSize, setFarmSize] = useState('5.5');
  const [farmUnit, setFarmUnit] = useState<'Acres' | 'Hectares'>('Acres');
  const [cropsList, setCropsList] = useState<CropOption[]>(CROPS_LIST);
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['onion', 'wheat', 'tomato']);
  const [ownershipType, setOwnershipType] = useState<'Owned' | 'Leased'>('Owned');
  const [surveyNumber, setSurveyNumber] = useState('Gat No. 142/B');
  const [soilType, setSoilType] = useState('Black Cotton Soil');
  const [plotImageUri, setPlotImageUri] = useState<string | null>(null);
  const [doc712Uri, setDoc712Uri] = useState<string | null>(null);
  const [uploadingPlot, setUploadingPlot] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Dynamic Crop Modal states
  const [addCropModalOpen, setAddCropModalOpen] = useState(false);
  const [customCropName, setCustomCropName] = useState('');
  const [customCropPhotoUri, setCustomCropPhotoUri] = useState<string | null>(null);

  // Celebration Modal state
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  const handlePickPlotPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll access is needed to upload your farm plot photo.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        const localUri = res.assets[0].uri;
        setPlotImageUri(localUri);
        setUploadingPlot(true);
        const upload = await apiClient.uploadImage(localUri, 'land_records');
        setUploadingPlot(false);
        if (upload?.url) {
          setPlotImageUri(upload.url);
          Alert.alert('Farm Plot Photo Uploaded! 🌾', `Compressed to WebP and securely registered.\nStorage saved: ${upload.savingsPercent}%`);
        }
      }
    } catch (err: any) {
      setUploadingPlot(false);
      Alert.alert('Upload Error', err?.message || 'Failed to upload photo');
    }
  };

  const handlePickDoc712 = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll access is needed to upload your 7/12 document.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        const localUri = res.assets[0].uri;
        setDoc712Uri(localUri);
        setUploadingDoc(true);
        const upload = await apiClient.uploadImage(localUri, 'land_records');
        setUploadingDoc(false);
        if (upload?.url) {
          setDoc712Uri(upload.url);
          Alert.alert('7/12 Document Uploaded! 📄', `Compressed to WebP and stored for government verification.\nStorage saved: ${upload.savingsPercent}%`);
        }
      }
    } catch (err: any) {
      setUploadingDoc(false);
      Alert.alert('Upload Error', err?.message || 'Failed to upload document');
    }
  };

  const handlePickCropPhoto = () => {
    Alert.alert('Crop Photo', 'Choose photo source for your crop', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const res = await takePhotoWithCamera();
          if (!res.cancelled && res.uri) setCustomCropPhotoUri(res.uri);
        },
      },
      {
        text: 'From Gallery',
        onPress: async () => {
          const res = await pickImageFromGallery();
          if (!res.cancelled && res.uri) setCustomCropPhotoUri(res.uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAddCustomCrop = () => {
    if (!customCropName.trim()) {
      Alert.alert('Crop Name Required', 'Please enter a name for your crop.');
      return;
    }
    const newId = `custom_${Date.now()}`;
    const newCrop: CropOption = {
      id: newId,
      name: customCropName.trim(),
      emoji: '🌱',
      image: customCropPhotoUri || undefined,
    };
    setCropsList((prev) => [...prev, newCrop]);
    setSelectedCrops((prev) => [...prev, newId]);
    setCustomCropName('');
    setCustomCropPhotoUri(null);
    setAddCropModalOpen(false);
    Alert.alert('Crop Added! 🌱', `${newCrop.name} has been added to your crops.`);
  };

  const toggleCrop = (id: string) => {
    if (selectedCrops.includes(id)) {
      setSelectedCrops(selectedCrops.filter((c) => c !== id));
    } else {
      setSelectedCrops([...selectedCrops, id]);
    }
  };

  const [saving, setSaving] = useState(false);

  const handleFinishSetup = async () => {
    setSaving(true);
    const numSize = parseFloat(farmSize) || 5;
    const mappedCrops = selectedCrops.map(
      (cId) => cropsList.find((c) => c.id === cId)?.name || cId
    );

    setUser({
      ...user,
      farmSizeAcres: numSize,
      farmLocation,
      isVerified: true,
      crops: mappedCrops,
    });

    // Persist farm details directly to MandiKart Backend -> Supabase Database
    try {
      await apiClient.put('/farmers/farm-details', {
        farmSizeAcres: numSize,
        ownershipType: ownershipType,
        primaryCrops: mappedCrops.length > 0 ? mappedCrops : ['Onion', 'Tomato'],
      });
    } catch (err: any) {
      console.warn('Farm details save note:', err?.message);
    } finally {
      setSaving(false);
    }

    await completeOnboarding(
      {
        farmSizeAcres: numSize,
        farmLocation,
        isVerified: true,
        crops: mappedCrops,
        isOnboarded: true,
        isProfileCompleted: true,
      },
      {
        farmSizeAcres: numSize,
        village: farmLocation.split(',')[0]?.trim() || user?.village || 'Bareilly',
        primaryCrops: mappedCrops,
        isProfileCompleted: true,
      } as any
    );

    setIsAuthenticated(true);
    setOnboarded(true);
    setCelebrationVisible(true);
  };

  return (
    <MKBackground disableSafeArea>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Hero Section */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: HERO_LANDSCAPE_URI }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            <MKHeader
              showBack={true}
              onBack={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/onboarding/farmer-profile');
                }
              }}
              step={{ current: 3, total: 3, label: 'Farm Details' }}
              style={styles.headerRow}
            />

            <View style={styles.heroTitles}>
              <Text style={styles.heroMainTitle}>
                Tell Us About{'\n'}
                <Text style={styles.heroTitleGreen}>Your Farm</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                This helps us show you more relevant market opportunities.
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content Form Cards */}
        <View style={styles.cardsContainer}>
          {/* Section 1: Farm Location */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBadge}>
                <MapPin size={18} color="#1E5A2A" strokeWidth={2.2} />
              </View>
              <View>
                <Text style={styles.cardTitle}>1. Farm Location</Text>
                <Text style={styles.cardSubtitle}>Where is your farm located?</Text>
              </View>
            </View>

            <View style={styles.mapViewContainer}>
              <FarmMapView
                locationName={farmLocation}
                acres={parseFloat(farmSize) || 5.5}
                onDetectGps={() => setFarmLocation('Dindori, Nashik (GPS Verified)')}
              />
            </View>

            <View style={styles.locationActionsRow}>
              <Pressable
                onPress={() => setFarmLocation('Dindori, Nashik (Current)')}
                style={styles.locationBtn}
              >
                <LocateFixed size={16} color="#1E5A2A" />
                <Text style={styles.locationBtnText}>Use Current Location</Text>
              </Pressable>
            </View>
          </View>

          {/* Section 2: Farm Size */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBadge}>
                <Layers size={18} color="#1E5A2A" strokeWidth={2.2} />
              </View>
              <View>
                <Text style={styles.cardTitle}>2. Farm Size</Text>
                <Text style={styles.cardSubtitle}>How large is your agricultural land?</Text>
              </View>
            </View>

            <View style={styles.farmSizeInputRow}>
              <TextInput
                style={styles.farmSizeInput}
                value={farmSize}
                onChangeText={setFarmSize}
                keyboardType="decimal-pad"
              />
              <View style={styles.unitToggleContainer}>
                <Pressable
                  onPress={() => setFarmUnit('Acres')}
                  style={[styles.unitBtn, farmUnit === 'Acres' && styles.unitBtnActive]}
                >
                  <Text
                    style={[styles.unitText, farmUnit === 'Acres' && styles.unitTextActive]}
                  >
                    Acres
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFarmUnit('Hectares')}
                  style={[styles.unitBtn, farmUnit === 'Hectares' && styles.unitBtnActive]}
                >
                  <Text
                    style={[styles.unitText, farmUnit === 'Hectares' && styles.unitTextActive]}
                  >
                    Hectares
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Section 3: Crops Grown */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBadge}>
                <Sprout size={18} color="#1E5A2A" strokeWidth={2.2} />
              </View>
              <View>
                <Text style={styles.cardTitle}>3. What do you grow?</Text>
                <Text style={styles.cardSubtitle}>Select crops you produce and harvest.</Text>
              </View>
            </View>

            <View style={styles.cropsGrid}>
              {cropsList.map((crop) => {
                const isSelected = selectedCrops.includes(crop.id);
                return (
                  <Pressable
                    key={crop.id}
                    onPress={() => toggleCrop(crop.id)}
                    style={[
                      styles.cropChip,
                      isSelected ? styles.cropChipActive : styles.cropChipInactive,
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                  >
                    {crop.image ? (
                      <Image source={{ uri: crop.image }} style={styles.cropCustomThumb} />
                    ) : (
                      <Text style={styles.cropEmoji}>{crop.emoji || '🌱'}</Text>
                    )}
                    <Text
                      style={[
                        styles.cropName,
                        isSelected ? styles.cropNameActive : styles.cropNameInactive,
                      ]}
                    >
                      {crop.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.cropCheckBadge}>
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={styles.addCropBtn}
              onPress={() => setAddCropModalOpen(true)}
            >
              <Plus size={16} color="#1E5A2A" />
              <Text style={styles.addCropText}>Add Another Crop</Text>
            </Pressable>
          </View>

          {/* Section 4: Farm Ownership */}
          <View style={styles.cardRowBetween}>
            <View style={styles.farmTypeLeft}>
              <View style={styles.cardIconBadge}>
                <Warehouse size={18} color="#1E5A2A" strokeWidth={2.2} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Farm Type</Text>
                <Text style={styles.cardSubtitle}>Ownership status</Text>
              </View>
            </View>

            <View style={styles.segmentedControl}>
              <Pressable
                onPress={() => setOwnershipType('Owned')}
                style={[
                  styles.segmentBtn,
                  ownershipType === 'Owned' && styles.segmentBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    ownershipType === 'Owned' && styles.segmentTextActive,
                  ]}
                >
                  Owned
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setOwnershipType('Leased')}
                style={[
                  styles.segmentBtn,
                  ownershipType === 'Leased' && styles.segmentBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    ownershipType === 'Leased' && styles.segmentTextActive,
                  ]}
                >
                  Leased
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Section 5: Land Records & Photos (7/12 & Farm Plot) */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBadge}>
                <FileText size={18} color="#1E5A2A" strokeWidth={2.2} />
              </View>
              <View>
                <Text style={styles.cardTitle}>5. Land Records & Verification</Text>
                <Text style={styles.cardSubtitle}>Upload farm plot photo & 7/12 land extract</Text>
              </View>
            </View>

            {/* Survey / Gat Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Survey / Gat Number</Text>
              <TextInput
                style={styles.textInput}
                value={surveyNumber}
                onChangeText={setSurveyNumber}
                placeholder="e.g. Gat No. 142/B"
                placeholderTextColor="#9E9E9E"
              />
            </View>

            {/* Soil Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Soil Type</Text>
              <TextInput
                style={styles.textInput}
                value={soilType}
                onChangeText={setSoilType}
                placeholder="e.g. Black Cotton, Loamy, Red"
                placeholderTextColor="#9E9E9E"
              />
            </View>

            {/* Upload Buttons Row */}
            <View style={styles.uploadRow}>
              {/* Farm Plot Photo */}
              <Pressable
                onPress={handlePickPlotPhoto}
                style={[styles.uploadBox, plotImageUri ? styles.uploadBoxDone : null]}
              >
                {uploadingPlot ? (
                  <ActivityIndicator size="small" color="#1E5A2A" />
                ) : plotImageUri ? (
                  <>
                    <Image source={{ uri: plotImageUri }} style={styles.uploadThumb} />
                    <View style={styles.uploadDoneBadge}>
                      <CheckCircle2 size={14} color="#FFFFFF" />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.uploadIconCircle}>
                      <Camera size={20} color="#1E5A2A" />
                    </View>
                    <Text style={styles.uploadBoxTitle}>Farm Plot Photo</Text>
                    <Text style={styles.uploadBoxSub}>Take or choose photo</Text>
                  </>
                )}
              </Pressable>

              {/* 7/12 Land Record Document */}
              <Pressable
                onPress={handlePickDoc712}
                style={[styles.uploadBox, doc712Uri ? styles.uploadBoxDone : null]}
              >
                {uploadingDoc ? (
                  <ActivityIndicator size="small" color="#1E5A2A" />
                ) : doc712Uri ? (
                  <>
                    <Image source={{ uri: doc712Uri }} style={styles.uploadThumb} />
                    <View style={styles.uploadDoneBadge}>
                      <CheckCircle2 size={14} color="#FFFFFF" />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.uploadIconCircle}>
                      <FileText size={20} color="#1E5A2A" />
                    </View>
                    <Text style={styles.uploadBoxTitle}>7/12 Land Extract</Text>
                    <Text style={styles.uploadBoxSub}>Satbara certificate</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.compressionNote}>
              <ShieldCheck size={14} color="#16A34A" />
              <Text style={styles.compressionNoteText}>
                Photos are automatically compressed to WebP for zero storage wastage.
              </Text>
            </View>
          </View>

          {/* Success Banner */}
          <View style={styles.successBanner}>
            <View style={styles.successTextContainer}>
              <Text style={styles.successTitle}>You're all set!</Text>
              <Text style={styles.successSubtitle}>
                Let's find better market opportunities for your produce.
              </Text>
            </View>
            <Image source={{ uri: VEGGIE_BASKET_URI }} style={styles.successImage} />
          </View>

          {/* Action CTA */}
          <View style={styles.footerAction}>
            <MKButton
              title={saving ? 'SAVING...' : 'NEXT: PERMISSIONS'}
              onPress={handleFinishSetup}
              variant="primary"
              size="lg"
              disabled={saving}
              rightIcon={<ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />}
            />

            {/* Step Dots (Step 2 of 3 Complete) */}
            <View style={styles.progressDotsRow}>
              <View style={[styles.dot, styles.dotDone]} />
              <View style={[styles.dot, styles.dotDone]} />
              <View style={styles.dot} />
            </View>

            <View style={styles.trustFooterRow}>
              <ShieldCheck size={14} color="#1E5A2A" />
              <Text style={styles.trustFooterText}>100% Secure • No Spam • Verified Network</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Dynamic Add Crop Modal (Item 5) ── */}
      <Modal
        visible={addCropModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAddCropModalOpen(false)}
      >
        <View style={styles.cropModalOverlay}>
          <View style={styles.cropModalCard}>
            <View style={styles.cropModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sprout size={20} color="#1E5A2A" />
                <Text style={styles.cropModalTitle}>Add Another Crop</Text>
              </View>
              <Pressable onPress={() => setAddCropModalOpen(false)} hitSlop={8}>
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>

            <Text style={styles.cropModalSubtitle}>
              Upload a photo and name your harvest crop:
            </Text>

            {/* Photo Upload Box */}
            <View style={styles.cropPhotoContainer}>
              {customCropPhotoUri ? (
                <View style={styles.cropPhotoPreviewWrap}>
                  <Image source={{ uri: customCropPhotoUri }} style={styles.cropPhotoPreviewImg} />
                  <Pressable
                    style={styles.cropPhotoRemoveBtn}
                    onPress={() => setCustomCropPhotoUri(null)}
                  >
                    <X size={14} color="#FFFFFF" strokeWidth={2.5} />
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.cropPhotoUploadBox} onPress={handlePickCropPhoto}>
                  <Camera size={26} color="#1E5A2A" strokeWidth={2} />
                  <Text style={styles.cropPhotoUploadText}>Take Photo or Select from Gallery</Text>
                  <Text style={styles.cropPhotoUploadSub}>Show your actual produce quality</Text>
                </Pressable>
              )}
            </View>

            {/* Crop Name Input */}
            <View style={styles.cropNameInputWrap}>
              <Text style={styles.cropNameInputLabel}>Crop / Variety Name</Text>
              <TextInput
                style={styles.cropNameInput}
                placeholder="e.g. Alphonso Mango, Soybean, Green Chilli"
                placeholderTextColor="#9CA3AF"
                value={customCropName}
                onChangeText={setCustomCropName}
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.cropModalActionRow}>
              <Pressable
                style={styles.cropModalCancelBtn}
                onPress={() => setAddCropModalOpen(false)}
              >
                <Text style={styles.cropModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.cropModalSaveBtn}
                onPress={handleAddCustomCrop}
              >
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
                <Text style={styles.cropModalSaveText}>Add to My Crops</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Celebration Modal (Item 6) ── */}
      <CelebrationModal
        visible={celebrationVisible}
        onContinue={() => {
          setCelebrationVisible(false);
          router.replace('/(tabs)/home');
        }}
        farmerName={user?.firstName || user?.fullName || 'Farmer'}
        farmLocation={farmLocation}
      />
    </MKBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 36,
  },
  heroContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 249, 246, 0.75)',
  },
  heroContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 48,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  headerRow: {
    paddingHorizontal: 0,
  },
  heroTitles: {
    maxWidth: '75%',
  },
  heroMainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1C1E',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroTitleGreen: {
    color: '#1E5A2A',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#5F6368',
    marginTop: 6,
    lineHeight: 18,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    marginTop: -16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0ECE4',
  },
  cardRowBetween: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  farmTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#5F6368',
    marginTop: 1,
  },
  locationContentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  locationInfoBox: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E4DA',
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  locationCountry: {
    fontSize: 12,
    color: '#5F6368',
    marginBottom: 4,
  },
  locationNote: {
    fontSize: 10,
    color: '#7A7A7A',
    lineHeight: 14,
  },
  mapThumbWrapper: {
    width: 100,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E4DA',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  locationActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  locationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  locationBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E5A2A',
  },
  farmSizeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  farmSizeInput: {
    flex: 1,
    height: 52,
    backgroundColor: '#FAF9F6',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E4DA',
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1C1E',
    textAlign: 'center',
  },
  unitToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0ECE4',
    borderRadius: 12,
    padding: 3,
  },
  unitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  unitBtnActive: {
    backgroundColor: '#1E5A2A',
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6368',
  },
  unitTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cropsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
    position: 'relative',
  },
  cropChipActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: '#1E5A2A',
  },
  cropChipInactive: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E8E4DA',
  },
  cropEmoji: {
    fontSize: 16,
  },
  cropName: {
    fontSize: 13,
    fontWeight: '600',
  },
  cropNameActive: {
    color: '#1E5A2A',
  },
  cropNameInactive: {
    color: '#5F6368',
  },
  cropCheckBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1E5A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  addCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#1E5A2A',
    gap: 6,
  },
  addCropText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E5A2A',
  },
  mapViewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E8E4DA',
  },
  cropCustomThumb: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  cropModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  cropModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  cropModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cropModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  cropModalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  cropPhotoContainer: {
    marginBottom: 16,
  },
  cropPhotoUploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#1E5A2A',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    gap: 4,
  },
  cropPhotoUploadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E5A2A',
  },
  cropPhotoUploadSub: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  cropPhotoPreviewWrap: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cropPhotoPreviewImg: {
    width: '100%',
    height: '100%',
  },
  cropPhotoRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropNameInputWrap: {
    marginBottom: 20,
  },
  cropNameInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  cropNameInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  cropModalActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cropModalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropModalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  cropModalSaveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1E5A2A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropModalSaveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FAF9F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E4DA',
    padding: 3,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#1E5A2A',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5F6368',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    position: 'relative',
    overflow: 'hidden',
  },
  successTextContainer: {
    maxWidth: '70%',
    zIndex: 1,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E5A2A',
    marginBottom: 2,
  },
  successSubtitle: {
    fontSize: 12,
    color: '#217128',
    lineHeight: 16,
  },
  successImage: {
    width: 70,
    height: 60,
    position: 'absolute',
    right: 6,
    bottom: 0,
  },
  footerAction: {
    alignItems: 'center',
    paddingTop: 8,
  },
  progressDotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5D5C5',
  },
  dotDone: {
    backgroundColor: '#1E5A2A',
    width: 14,
  },
  trustFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustFooterText: {
    fontSize: 11,
    color: '#7A7A7A',
    fontWeight: '500',
  },
  inputGroup: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#212121',
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  uploadBox: {
    flex: 1,
    height: 120,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A5D6A7',
    borderRadius: 14,
    backgroundColor: '#F1F8E9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  uploadBoxDone: {
    borderStyle: 'solid',
    borderColor: '#2E7D32',
    backgroundColor: '#FFFFFF',
  },
  uploadIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  uploadBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E5A2A',
    textAlign: 'center',
  },
  uploadBoxSub: {
    fontSize: 10,
    color: '#757575',
    textAlign: 'center',
    marginTop: 2,
  },
  uploadThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  uploadDoneBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compressionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 8,
  },
  compressionNoteText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '500',
    flex: 1,
  },
});
