import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Alert, Image, Switch, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageCompressor';

type Gender = 'Male' | 'Female' | 'Other';

const AVATAR_OPTIONS = [
  { id: 'avatar-1', label: 'Initial R', bg: Colors.primaryLight, text: 'R' },
  { id: 'avatar-2', label: 'Farm Green', bg: '#DCFCE7', text: '🌱' },
  { id: 'avatar-3', label: 'Farmer Smile', bg: '#FEF3C7', text: '🧑‍🌾' },
  { id: 'avatar-4', label: 'Fresh Harvest', bg: '#E0E7FF', text: '🧺' },
];

export default function EditProfileScreen({ navigation }: any) {
  const { user, updateUser } = useAuth();

  // Form State
  const [fullName, setFullName] = useState(user?.fullName || 'Ramesh Sharma');
  const [email, setEmail] = useState(user?.email || 'ramesh.sharma@example.com');
  const [phone, setPhone] = useState(user?.phone ? user.phone.replace(/^\+91\s?/, '') : '9876543210');
  const [gender, setGender] = useState<Gender>('Male');
  const [dob, setDob] = useState('14 Aug 1994');
  const [preferredCity, setPreferredCity] = useState(user?.city ? `${user.city}, ${user.state || ''}` : 'Pune, Maharashtra');

  // Avatar & Image State
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [userImageUri, setUserImageUri] = useState<string | null>(user?.avatarUrl || null);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // Preference toggles
  const [harvestAlerts, setHarvestAlerts] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);

  // Pick Image from Gallery with Compression
  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required 📷',
          'Permission to access your photo gallery is required to choose a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsCompressing(true);
        const asset = result.assets[0];
        let rawUri = asset.uri;
        if (asset.base64) {
          rawUri = `data:image/jpeg;base64,${asset.base64}`;
        }
        const compressedUri = await compressImage(rawUri, { maxWidth: 400, maxHeight: 400, quality: 0.7 });
        setIsCompressing(false);

        setUserImageUri(compressedUri);
        updateUser({ avatarUrl: compressedUri });
        setAvatarModalVisible(false);
        Alert.alert('Photo Compressed & Updated! 📸', 'Your new profile photo was compressed (<50KB) and saved.');
      }
    } catch (error) {
      setIsCompressing(false);
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };

  // Take Photo with Camera with Compression
  const takePhotoFromCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required 📷',
          'Permission to access your camera is required to take a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsCompressing(true);
        const asset = result.assets[0];
        let rawUri = asset.uri;
        if (asset.base64) {
          rawUri = `data:image/jpeg;base64,${asset.base64}`;
        }
        const compressedUri = await compressImage(rawUri, { maxWidth: 400, maxHeight: 400, quality: 0.7 });
        setIsCompressing(false);

        setUserImageUri(compressedUri);
        updateUser({ avatarUrl: compressedUri });
        setAvatarModalVisible(false);
        Alert.alert('Photo Captured & Compressed! 📸', 'Your new profile photo was captured and saved securely.');
      }
    } catch (error) {
      setIsCompressing(false);
      Alert.alert('Error', 'Failed to take photo with camera.');
    }
  };

  const handleSave = () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your Full Name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a 10-digit mobile number.');
      return;
    }

    updateUser({
      fullName,
      email,
      phone: `+91 ${phone}`,
      avatarUrl: userImageUri || user?.avatarUrl,
    });

    Alert.alert(
      'Profile Updated! 🎉',
      'Your profile details and picture have been saved successfully.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveHeaderBtn}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar / Photo Card */}
        <View style={styles.avatarCard}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => setAvatarModalVisible(true)}
            activeOpacity={0.85}
          >
            {userImageUri ? (
              <Image source={{ uri: userImageUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: selectedAvatar.bg }]}>
                <Text style={styles.avatarText}>{selectedAvatar.text}</Text>
              </View>
            )}

            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color={Colors.white} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickImageFromGallery} style={styles.galleryPickBtn}>
            <Ionicons name="image-outline" size={16} color={Colors.primary} />
            <Text style={styles.galleryPickText}>Choose Photo from Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Info Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={Colors.textSecondary} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={Colors.textDisabled}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter your email address"
                placeholderTextColor={Colors.textDisabled}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mobile Number *</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit mobile number"
                placeholderTextColor={Colors.textDisabled}
              />
              <View style={styles.verifiedTag}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Additional Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Demographics & Location</Text>

          {/* Gender Chip Selector */}
          <View style={styles.field}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {(['Male', 'Female', 'Other'] as Gender[]).map((g) => {
                const active = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, active && styles.genderChipActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderText, active && styles.genderTextActive]}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date of Birth</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={dob}
                onChangeText={setDob}
                placeholder="DD MMM YYYY"
                placeholderTextColor={Colors.textDisabled}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Preferred City</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="location-outline" size={18} color={Colors.textSecondary} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={preferredCity}
                onChangeText={setPreferredCity}
                placeholder="Enter city"
                placeholderTextColor={Colors.textDisabled}
              />
            </View>
          </View>
        </View>

        {/* Notification Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchTitle}>Fresh Harvest & Crop Alerts</Text>
              <Text style={styles.switchSub}>Get notified when fresh produce is harvested in Nashik</Text>
            </View>
            <Switch
              value={harvestAlerts}
              onValueChange={setHarvestAlerts}
              trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
              thumbColor={harvestAlerts ? Colors.primary : Colors.white}
            />
          </View>

          <View style={styles.switchDivider} />

          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchTitle}>Live Order & Tracking Updates</Text>
              <Text style={styles.switchSub}>SMS & push alerts for delivery status</Text>
            </View>
            <Switch
              value={orderUpdates}
              onValueChange={setOrderUpdates}
              trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
              thumbColor={orderUpdates ? Colors.primary : Colors.white}
            />
          </View>
        </View>

        {/* Save Button */}
        <PrimaryButton
          title="Save Changes"
          onPress={handleSave}
          style={styles.saveMainBtn}
        />
      </ScrollView>

      {/* Avatar / Gallery Options Modal */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAvatarModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Profile Photo</Text>
            <Text style={styles.modalSub}>Select an option to update your picture</Text>

            {/* Upload & Camera Actions */}
            <View style={{ gap: 8, width: '100%' }}>
              <TouchableOpacity style={styles.galleryModalBtn} onPress={pickImageFromGallery} disabled={isCompressing}>
                <Ionicons name="images" size={20} color={Colors.white} />
                <Text style={styles.galleryModalBtnText}>
                  {isCompressing ? 'Compressing Photo...' : 'Choose from Device Gallery 🖼️'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.galleryModalBtn, { backgroundColor: Colors.textPrimary }]}
                onPress={takePhotoFromCamera}
                disabled={isCompressing}
              >
                <Ionicons name="camera" size={20} color={Colors.white} />
                <Text style={styles.galleryModalBtnText}>
                  {isCompressing ? 'Compressing Photo...' : 'Take Photo with Camera 📸'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.orDividerRow}>
              <View style={styles.modalLine} />
              <Text style={styles.orText}>OR CHOOSE PRESET AVATAR</Text>
              <View style={styles.modalLine} />
            </View>

            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((opt) => {
                const isSelected = !userImageUri && selectedAvatar.id === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                    onPress={() => {
                      setUserImageUri(null);
                      setSelectedAvatar(opt);
                      setAvatarModalVisible(false);
                    }}
                  >
                    <View style={[styles.avatarChoice, { backgroundColor: opt.bg }]}>
                      <Text style={styles.avatarChoiceText}>{opt.text}</Text>
                    </View>
                    <Text style={styles.avatarOptionLabel}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  saveHeaderBtn: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  // Avatar Card
  avatarCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: Colors.primary },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  galleryPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  galleryPickText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  // Section Card
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  fieldIcon: { marginRight: 8 },
  countryCode: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginRight: 8 },
  input: { flex: 1, height: '100%', fontSize: 14, color: Colors.textPrimary },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  verifiedText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  // Gender Chips
  genderRow: { flexDirection: 'row', gap: Spacing.sm },
  genderChip: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  genderChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  genderTextActive: { color: Colors.white },
  // Notification Switches
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchTextWrap: { flex: 1, marginRight: Spacing.md },
  switchTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  switchSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  switchDivider: { height: 1, backgroundColor: Colors.borderLight },
  // Save Button
  saveMainBtn: { width: '100%', marginTop: 8 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 12,
    ...Shadows.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  modalSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  galleryModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    width: '100%',
  },
  galleryModalBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  orDividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  modalLine: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  orText: { fontSize: 10, fontWeight: '700', color: Colors.textDisabled },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: Spacing.sm, width: '100%' },
  avatarOption: {
    alignItems: 'center',
    padding: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  avatarChoice: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  avatarChoiceText: { fontSize: 24 },
  avatarOptionLabel: { fontSize: 10, fontWeight: '700', color: Colors.textPrimary },
});
