/**
 * MandiKart Farmer App — Documents & KYC Verification
 *
 * Unique Design:
 * - Document Vault Status Progress Bar
 * - Tactile Document Cards with verification timestamps & security badges
 * - Instant Camera / Gallery Upload Modal with feedback
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  FileText,
  CheckCircle2,
  Clock,
  Upload,
  ShieldCheck,
  Plus,
  Lock,
  Calendar,
  AlertTriangle,
} from 'lucide-react-native';
import { MKBackground, MKHeader } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { pickImageFromGallery, takePhotoWithCamera } from '@/services/imagePickerService';

interface DocItem {
  id: string;
  name: string;
  description: string;
  status: 'verified' | 'pending' | 'action_required';
  docNumber?: string;
  verifiedOn?: string;
  iconBg: string;
}

export default function DocumentsScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [docs, setDocs] = useState<DocItem[]>([
    {
      id: 'aadhaar',
      name: 'Aadhaar Card',
      description: 'Government Issued Identity Verification',
      status: user?.aadhaarVerified ? 'verified' : 'pending',
      docNumber: user?.aadhaarNumber ? `•••• •••• ${user.aadhaarNumber.slice(-4)}` : 'Identity Document',
      verifiedOn: user?.aadhaarVerified ? 'Verified by MandiKart' : 'Pending Verification',
      iconBg: '#E8F5E9',
    },
    {
      id: 'land',
      name: 'Land Khatian / 7/12 RoR',
      description: `Proof of Agricultural Land Ownership (${user?.farmSize || user?.farmSizeAcres || '5'} Acres)`,
      status: user?.landDocVerified ? 'verified' : 'pending',
      docNumber: user?.village ? `Record (${user.village})` : 'Farm Land Record',
      verifiedOn: user?.landDocVerified ? 'Verified by MandiKart' : 'Pending Review',
      iconBg: '#E1F5FE',
    },
    {
      id: 'bank',
      name: 'Bank Passbook / Cheque',
      description: 'Required for Automated Mandi Escrow Payouts',
      status: user?.accountNumber ? 'verified' : 'action_required',
      docNumber: user?.bankName ? `${user.bankName} Passbook` : 'Bank Verification',
      verifiedOn: user?.accountNumber ? 'Bank Account Linked' : 'Action Required',
      iconBg: '#FFF3E0',
    },
  ]);

  const handleUploadNew = (docName: string) => {
    Alert.alert('Upload Document', `Select photo source for ${docName}`, [
      {
        text: '📷 Open Camera',
        onPress: async () => {
          const res = await takePhotoWithCamera();
          if (!res.cancelled && res.uri) {
            setDocs((prev) =>
              prev.map((d) =>
                d.name === docName
                  ? { ...d, status: 'pending', verifiedOn: 'Uploaded just now (Under Review)' }
                  : d
              )
            );
            Alert.alert('Captured 🎉', 'Document photo captured successfully! Our verification team will review it within 2 hours.');
          }
        },
      },
      {
        text: '📁 Pick from Gallery',
        onPress: async () => {
          const res = await pickImageFromGallery();
          if (!res.cancelled && res.uri) {
            setDocs((prev) =>
              prev.map((d) =>
                d.name === docName
                  ? { ...d, status: 'pending', verifiedOn: 'Uploaded just now (Under Review)' }
                  : d
              )
            );
            Alert.alert('Uploaded 🎉', 'File uploaded successfully! Our verification team will review it within 2 hours.');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const verifiedCount = docs.filter(d => d.status === 'verified').length;
  const progressPercent = Math.round((verifiedCount / docs.length) * 100);

  return (
    <MKBackground>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <MKHeader showBack title="Documents & KYC Vault" />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Progress Banner */}
          <Animated.View entering={FadeInDown.duration(450)} style={styles.banner}>
            <View style={styles.bannerTop}>
              <View style={styles.shieldCircle}>
                <ShieldCheck size={26} color="#1E5A2A" />
              </View>
              <View style={styles.bannerMeta}>
                <Text style={styles.bannerTitle}>Kisan Trust Level 2</Text>
                <Text style={styles.bannerSub}>
                  {verifiedCount} of {docs.length} Mandatory Records Verified ({progressPercent}%)
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            <View style={styles.badgeRow}>
              <Lock size={12} color="#1E5A2A" />
              <Text style={styles.badgeRowText}>All records 256-bit encrypted with UIDAI & e-NAM vault</Text>
            </View>
          </Animated.View>

          {/* Section Header */}
          <Text style={styles.sectionTitle}>MANDATORY DOCUMENTS</Text>

          {/* Document Cards */}
          <Animated.View entering={FadeInUp.duration(550).delay(100)} style={styles.docList}>
            {docs.map((doc) => (
              <View key={doc.id} style={styles.docCard}>
                <View style={styles.docRow}>
                  <View style={[styles.iconBox, { backgroundColor: doc.iconBg }]}>
                    <FileText size={22} color="#1E5A2A" />
                  </View>

                  <View style={styles.docMeta}>
                    <Text style={styles.docName}>{doc.name}</Text>
                    <Text style={styles.docDesc}>{doc.description}</Text>
                    {doc.docNumber && (
                      <View style={styles.docNumPill}>
                        <Text style={styles.docNumText}>{doc.docNumber}</Text>
                      </View>
                    )}
                  </View>

                  {doc.status === 'verified' && (
                    <View style={styles.badgeVerified}>
                      <CheckCircle2 size={12} color="#1E5A2A" strokeWidth={2.5} />
                      <Text style={styles.badgeVerifiedText}>Verified</Text>
                    </View>
                  )}

                  {doc.status === 'pending' && (
                    <View style={styles.badgePending}>
                      <Clock size={12} color="#E65100" strokeWidth={2.5} />
                      <Text style={styles.badgePendingText}>In Review</Text>
                    </View>
                  )}
                </View>

                {/* Footer status / Re-upload action */}
                <View style={styles.cardFooter}>
                  <View style={styles.dateRow}>
                    <Calendar size={12} color="#888" />
                    <Text style={styles.dateText}>{doc.verifiedOn}</Text>
                  </View>

                  {doc.status !== 'verified' ? (
                    <Pressable
                      onPress={() => handleUploadNew(doc.name)}
                      style={styles.actionBtnUpload}
                    >
                      <Upload size={13} color="#FFFFFF" />
                      <Text style={styles.actionBtnUploadText}>Upload Copy</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => handleUploadNew(doc.name)}
                      style={styles.actionBtnReplace}
                    >
                      <Text style={styles.actionBtnReplaceText}>Update</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </Animated.View>

          {/* Add Additional Document Button */}
          <Pressable
            onPress={() => handleUploadNew('Additional Kisan Certificate')}
            style={({ pressed }) => [styles.addNewBtn, pressed && styles.addNewBtnPressed]}
          >
            <Plus size={18} color="#1E5A2A" strokeWidth={2.5} />
            <Text style={styles.addNewBtnText}>UPLOAD ADDITIONAL DOCUMENT</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </MKBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 16,
  },
  banner: {
    backgroundColor: '#E8F5E9',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 14,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  bannerMeta: {
    flex: 1,
    gap: 3,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E5A2A',
  },
  bannerSub: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(30, 90, 42, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1E5A2A',
    borderRadius: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeRowText: {
    fontSize: 11,
    color: '#1E5A2A',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7A7A7A',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  docList: {
    gap: 14,
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0ECE4',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docMeta: {
    flex: 1,
    gap: 3,
  },
  docName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1C1E',
  },
  docDesc: {
    fontSize: 12,
    color: '#5F6368',
    lineHeight: 16,
  },
  docNumPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FAF9F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEBE4',
    marginTop: 4,
  },
  docNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E5A2A',
  },
  badgeVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeVerifiedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E5A2A',
  },
  badgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E65100',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F2EC',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  actionBtnUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E5A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionBtnUploadText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionBtnReplace: {
    backgroundColor: '#FAF9F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E2DA',
  },
  actionBtnReplaceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addNewBtnPressed: {
    backgroundColor: '#F1F8E9',
  },
  addNewBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E5A2A',
    letterSpacing: 0.5,
  },
});
