/**
 * MandiKart Farmer App — Screen 6: Tell Us About You (Farmer Profile Setup)
 * 
 * Implements the approved Stitch visual design:
 * Hero with smiling farmer artwork, role selection (Individual Farmer vs FPO),
 * profile photo picker, full name inputs, trust & security info card,
 * 3D CONTINUE CTA, and progress step indicators.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Users,
  Building2,
  Camera,
  ShieldCheck,
  ArrowRight,
  Check,
  Briefcase,
  MapPin,
  LocateFixed,
  Upload,
  X,
  Phone,
} from 'lucide-react-native';
import { MKBackground, MKButton, MKInput, MKHeader } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/apiClient';
import { pickImageFromGallery, takePhotoWithCamera } from '@/services/imagePickerService';
import {
  getCurrentFarmerLocation,
  searchVillageCitySuggestions,
  VillageCitySuggestion,
} from '@/services/locationService';

const HERO_FARMER_SRC = require('@/assets/images/farmer_phone_hero.png');

const AVATAR_PLACEHOLDER_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCt_2-uyTSWqni0gL3Ex7_Rtw8iBT7iAzP0jwrSLSYb7w-kRyA7dtkDrIWjibN6Cky_2P32YV2e4V3d2qw803N-_D5l3_AYMFTh8OMxHzlWbF5VTcdgCVUup9BBHTHb-ZOYLRYkkzOb5ZDGQvM5-fcLOsHUaBdmRJkI7r4PD3lunURNeGTMR3Q1y9o4wFl3iMd0gP2iVEASAPtpyWkGI8yJ1nzDTb98yUhM8XWo40qJtL7d74M073HltQ';

export default function FarmerProfileScreen() {
  const router = useRouter();
  const { user, setUser, setPhoneNumber } = useAuthStore();

  const [role, setRole] = useState<'INDIVIDUAL' | 'FPO'>('INDIVIDUAL');
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [phone, setPhone] = useState(
    user?.phone && !user.phone.includes('9876543210')
      ? user.phone.replace('+91', '').trim()
      : ''
  );
  const [village, setVillage] = useState(user?.village || '');
  const [experienceYears, setExperienceYears] = useState('10');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(user?.avatarUri);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (user?.fullName || user?.name) {
      setFullName(user.fullName || user.name || '');
    }
    if (user?.phone && !user.phone.includes('9876543210')) {
      setPhone(user.phone.replace('+91', '').trim());
    }
    if (user?.avatarUri) {
      setAvatarUri(user.avatarUri);
    }
    if (user?.village) {
      setVillage(user.village);
    }
  }, [user]);

  // Realtime location states
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<VillageCitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  async function handlePickFromGallery() {
    setPhotoModalVisible(false);
    const res = await pickImageFromGallery();
    if (!res.cancelled && res.uri) {
      setAvatarUri(res.uri);
      if (user) {
        setUser({ ...user, avatarUri: res.uri });
      }
    }
  }

  async function handleTakePhoto() {
    setPhotoModalVisible(false);
    const res = await takePhotoWithCamera();
    if (!res.cancelled && res.uri) {
      setAvatarUri(res.uri);
      if (user) {
        setUser({ ...user, avatarUri: res.uri });
      }
    }
  }

  async function handleAutoDetectLocation() {
    setIsLocating(true);
    const loc = await getCurrentFarmerLocation();
    setIsLocating(false);
    if (loc) {
      const locDisplay = loc.village
        ? `${loc.village}, ${loc.city || loc.district}`
        : `${loc.city || loc.district}, ${loc.state}`;
      setVillage(locDisplay);
      setShowSuggestions(false);
      if (user) {
        setUser({
          ...user,
          village: loc.village,
          city: loc.city,
          district: loc.district,
          state: loc.state,
        });
      }
      Alert.alert('GPS Location Fetched', `Detected: ${loc.formattedAddress}`);
    }
  }

  function handleVillageTextChange(text: string) {
    setVillage(text);
    if (text.trim().length >= 2) {
      const matches = searchVillageCitySuggestions(text);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function handleSelectSuggestion(s: VillageCitySuggestion) {
    setVillage(`${s.name}, ${s.district}`);
    setShowSuggestions(false);
    if (user) {
      setUser({
        ...user,
        city: s.name,
        district: s.district,
        state: s.state,
      });
    }
  }

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!fullName.trim()) errs.fullName = 'Please enter your full name';
    
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = 'Indian mobile numbers must start with 6, 7, 8, or 9';
    }

    if (!village.trim()) errs.village = 'Please enter your village or city name';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;

    setSaving(true);
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const formattedPhone = `+91${cleanPhone}`;

    const updatedUser = {
      ...user,
      id: user?.id || 'farmer_ramesh_01',
      name: fullName.trim(),
      fullName: fullName.trim(),
      phone: formattedPhone,
      village: village.trim(),
      experience: experienceYears,
      avatarUri: avatarUri || user?.avatarUri,
      role: (role === 'INDIVIDUAL' ? 'FARMER' : 'FPO_MANAGER') as any,
    };

    setUser(updatedUser);
    setPhoneNumber(formattedPhone);

    // Persist to backend API and Supabase database
    try {
      await apiClient.put('/farmers/profile', {
        fullName: fullName.trim(),
        phone: formattedPhone,
        village: village.trim(),
        avatarUrl: avatarUri || user?.avatarUri,
        state: user?.state || 'Maharashtra',
        district: user?.district || 'Nashik',
        role,
      });
    } catch (err: any) {
      console.warn('Profile save note:', err?.message);
    } finally {
      setSaving(false);
    }

    // Branch: FPO representatives go to FPO onboarding; individual farmers go to farm details
    if (role === 'FPO') {
      router.push('/onboarding/fpo-profile');
    } else {
      router.push('/onboarding/farm-details');
    }
  };


  return (
    <MKBackground disableSafeArea>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Hero Section */}
          <View style={styles.heroContainer}>
            <Image
              source={HERO_FARMER_SRC}
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
                    router.replace('/onboarding/permissions');
                  }
                }}
                step={{ current: 2, total: 3, label: 'Profile' }}
                style={styles.headerRow}
              />

              <View style={styles.heroTitles}>
                <Text style={styles.heroMainTitle}>
                  Tell Us <Text style={styles.heroTitleGreen}>About You</Text>
                </Text>
                <Text style={styles.heroSubtitle}>
                  This helps us personalize your MandiKart experience
                </Text>
              </View>
            </View>
          </View>

          {/* Cards Content */}
          <View style={styles.cardsContainer}>
            
            {/* Section 1: Role Selection */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBadge}>
                  <Users size={18} color="#1E5A2A" strokeWidth={2.2} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>How will you use MandiKart?</Text>
                  <Text style={styles.cardSubtitle}>Select your account type</Text>
                </View>
              </View>

              <View style={styles.rolesGrid}>
                {/* Individual Farmer Option */}
                <Pressable
                  onPress={() => setRole('INDIVIDUAL')}
                  style={[
                    styles.roleCard,
                    role === 'INDIVIDUAL' ? styles.roleCardActive : styles.roleCardInactive,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: role === 'INDIVIDUAL' }}
                >
                  {role === 'INDIVIDUAL' && (
                    <View style={styles.roleCheckBadge}>
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                  <View style={styles.roleIconCircle}>
                    <User size={24} color="#1E5A2A" strokeWidth={2} />
                  </View>
                  <Text style={styles.roleTitleActive}>Individual{'\n'}Farmer</Text>
                  <Text style={styles.roleSubtext}>Sell your own farm produce</Text>
                </Pressable>

                {/* FPO Option */}
                <Pressable
                  onPress={() => setRole('FPO')}
                  style={[
                    styles.roleCard,
                    role === 'FPO' ? styles.roleCardActive : styles.roleCardInactive,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: role === 'FPO' }}
                >
                  {role === 'FPO' && (
                    <View style={styles.roleCheckBadge}>
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                  <View style={[styles.roleIconCircle, { backgroundColor: '#FFF3E0' }]}>
                    <Building2 size={24} color="#EF7D1A" strokeWidth={2} />
                  </View>
                  <Text style={styles.roleTitleInactive}>FPO / Group</Text>
                  <Text style={styles.roleSubtext}>Manage for your farmer group</Text>
                </Pressable>
              </View>
            </View>

            {/* Section 2: Personal Profile */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBadge, { backgroundColor: '#FFF3E0' }]}>
                  <User size={18} color="#EF7D1A" strokeWidth={2.2} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Your Profile</Text>
                  <Text style={styles.cardSubtitle}>Personal identity details</Text>
                </View>
              </View>

              {/* Photo Uploader */}
              <Pressable
                style={styles.photoContainer}
                onPress={() => setPhotoModalVisible(true)}
              >
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{ uri: avatarUri || AVATAR_PLACEHOLDER_URI }}
                    style={styles.avatarImage}
                  />
                  <View style={styles.cameraBadge}>
                    <Camera size={14} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                </View>
                <Text style={styles.addPhotoText}>
                  {avatarUri ? 'Change Photo' : 'Upload Photo'}
                </Text>
              </Pressable>

              <View style={styles.inputsContainer}>
                <MKInput
                  label="FULL NAME *"
                  placeholder="E.g. Ramesh Patil"
                  value={fullName}
                  onChangeText={setFullName}
                  error={errors.fullName}
                  leftIcon={<User size={18} color="#9AA0A6" />}
                />

                <MKInput
                  label="MOBILE NUMBER *"
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChangeText={(val) => {
                    const digits = val.replace(/\D/g, '').slice(0, 10);
                    setPhone(digits);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  keyboardType="phone-pad"
                  maxLength={10}
                  error={errors.phone}
                  leftIcon={
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 4 }}>
                      <Text style={{ fontSize: 16, marginRight: 4 }}>🇮🇳</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1B6D24', marginRight: 4 }}>+91</Text>
                      <Phone size={15} color="#9AA0A6" />
                    </View>
                  }
                />

                <View style={styles.locationInputHeaderRow}>
                  <Text style={styles.inputCustomLabel}>VILLAGE / CITY *</Text>
                  <Pressable
                    style={styles.detectLocationBtn}
                    onPress={handleAutoDetectLocation}
                    disabled={isLocating}
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color="#1B6D24" />
                    ) : (
                      <>
                        <LocateFixed size={14} color="#1B6D24" />
                        <Text style={styles.detectLocationBtnText}>Auto-Detect GPS</Text>
                      </>
                    )}
                  </Pressable>
                </View>

                <MKInput
                  placeholder="Type Village or City name..."
                  value={village}
                  onChangeText={handleVillageTextChange}
                  error={errors.village}
                  leftIcon={<MapPin size={18} color="#9AA0A6" />}
                />

                {/* Realtime Village & City Autocomplete Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <View style={styles.suggestionsCard}>
                    {suggestions.map((s) => (
                      <Pressable
                        key={s.id}
                        style={styles.suggestionItem}
                        onPress={() => handleSelectSuggestion(s)}
                      >
                        <MapPin size={14} color="#1B6D24" style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.suggestionName}>
                            {s.name} <Text style={styles.suggestionType}>({s.type})</Text>
                          </Text>
                          <Text style={styles.suggestionLocation}>
                            {s.district}, {s.state}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Section 3: Experience */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardIconBadge, { backgroundColor: '#E3F2FD' }]}>
                  <Briefcase size={18} color="#1976D2" strokeWidth={2.2} />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Farming Experience</Text>
                  <Text style={styles.cardSubtitle}>Helps build trust with buyers</Text>
                </View>
              </View>

              <View style={styles.experiencePresets}>
                <Pressable
                  onPress={() => setExperienceYears('2')}
                  style={[styles.presetPill, experienceYears === '2' && styles.presetPillActive]}
                >
                  <Text style={[styles.presetText, experienceYears === '2' && styles.presetTextActive]}>2-5 Yrs</Text>
                </Pressable>
                <Pressable
                  onPress={() => setExperienceYears('5')}
                  style={[styles.presetPill, experienceYears === '5' && styles.presetPillActive]}
                >
                  <Text style={[styles.presetText, experienceYears === '5' && styles.presetTextActive]}>5-10 Yrs</Text>
                </Pressable>
                <Pressable
                  onPress={() => setExperienceYears('10')}
                  style={[styles.presetPill, experienceYears === '10' && styles.presetPillActive]}
                >
                  <Text style={[styles.presetText, experienceYears === '10' && styles.presetTextActive]}>10+ Yrs</Text>
                </Pressable>
              </View>

              <MKInput
                placeholder="Or enter years manually"
                value={experienceYears}
                onChangeText={setExperienceYears}
                keyboardType="numeric"
              />
            </View>

            {/* Trust Info Box */}
            <View style={styles.trustBox}>
              <ShieldCheck size={24} color="#1E5A2A" strokeWidth={2} />
              <View style={styles.trustTextContainer}>
                <Text style={styles.trustTitle}>Why do we ask for this?</Text>
                <Text style={styles.trustDescription}>
                  Verified farmer identities ensure instant payment escrow and reliable direct buyer connections.
                </Text>
              </View>
            </View>

            {/* Action CTA & Progress */}
            <View style={styles.actionArea}>
              <MKButton
                title={saving ? 'SAVING...' : 'CONTINUE'}
                onPress={handleContinue}
                variant="primary"
                size="lg"
                disabled={saving}
                rightIcon={<ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />}
              />

              {/* Step dots (Step 2 of 3) */}
              <View style={styles.progressDotsRow}>
                <View style={[styles.dot, styles.dotDone]} />
                <View style={[styles.dot, styles.dotActive]} />
                <View style={styles.dot} />
              </View>

              <Text style={styles.securityNote}>
                🔒 Your information is safe and secure with MandiKart
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Photo Picker Modal */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <Pressable
          style={styles.photoModalOverlay}
          onPress={() => setPhotoModalVisible(false)}
        >
          <View style={styles.photoModalCard}>
            <View style={styles.photoModalHeader}>
              <Text style={styles.photoModalTitle}>Profile Photo</Text>
              <Pressable onPress={() => setPhotoModalVisible(false)}>
                <X size={20} color="#666" />
              </Pressable>
            </View>
            <Text style={styles.photoModalSubtitle}>
              Upload a clear photo of yourself to build trust with buyers.
            </Text>

            <Pressable style={styles.photoOptionBtn} onPress={handleTakePhoto}>
              <Camera size={20} color="#1B6D24" strokeWidth={2.2} />
              <Text style={styles.photoOptionText}>Take Photo with Camera</Text>
            </Pressable>

            <Pressable style={styles.photoOptionBtn} onPress={handlePickFromGallery}>
              <Upload size={20} color="#EF7D1A" strokeWidth={2.2} />
              <Text style={styles.photoOptionText}>Choose from Gallery</Text>
            </Pressable>

            <Pressable
              style={styles.photoCancelBtn}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Text style={styles.photoCancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </MKBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
  rolesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  roleCardActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#1E5A2A',
  },
  roleCardInactive: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1.5,
    borderColor: '#E8E4DA',
  },
  roleCheckBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E5A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  roleIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  roleTitleActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E5A2A',
    textAlign: 'center',
    marginBottom: 4,
  },
  roleTitleInactive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B2B2B',
    textAlign: 'center',
    marginBottom: 4,
  },
  roleSubtext: {
    fontSize: 11,
    color: '#5F6368',
    textAlign: 'center',
    lineHeight: 15,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#E8F5E9',
    position: 'relative',
    overflow: 'visible',
    marginBottom: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 41,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E5A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E5A2A',
  },
  inputsContainer: {
    gap: 12,
  },
  experiencePresets: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#FAF9F6',
    borderWidth: 1.5,
    borderColor: '#E8E4DA',
    borderRadius: 12,
    alignItems: 'center',
  },
  presetPillActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#1E5A2A',
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6368',
  },
  presetTextActive: {
    color: '#1E5A2A',
    fontWeight: '700',
  },
  trustBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  trustTextContainer: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E5A2A',
    marginBottom: 2,
  },
  trustDescription: {
    fontSize: 12,
    color: '#2B2B2B',
    lineHeight: 17,
  },
  actionArea: {
    paddingTop: 12,
    alignItems: 'center',
  },
  progressDotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    marginBottom: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5D5C5',
  },
  dotDone: {
    backgroundColor: '#1E5A2A',
    width: 8,
  },
  dotActive: {
    backgroundColor: '#1E5A2A',
    width: 18,
  },
  securityNote: {
    fontSize: 12,
    color: '#7A7A7A',
  },

  // Location Autocomplete & GPS
  locationInputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 10,
  },
  inputCustomLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  detectLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    gap: 4,
  },
  detectLocationBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B6D24',
  },
  suggestionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECEAE3',
    marginTop: -8,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F1EA',
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#241913',
  },
  suggestionType: {
    fontSize: 12,
    color: '#EF7D1A',
    fontWeight: '600',
  },
  suggestionLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Photo Modal Styles
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  photoModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  photoModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#241913',
  },
  photoModalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 18,
  },
  photoOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#ECEAE3',
    gap: 12,
    marginBottom: 12,
  },
  photoOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#241913',
  },
  photoCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  photoCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
});
