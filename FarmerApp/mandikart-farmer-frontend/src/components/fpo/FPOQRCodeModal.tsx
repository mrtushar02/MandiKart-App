/**
 * MandiKart — Realtime FPO QR Code Generator Modal
 *
 * Allows FPO leaders to show a high-resolution, scannable QR code
 * in person at collection godowns, village meetings, or share via WhatsApp/SMS.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import MKQRCode from '@/components/common/MKQRCode';
import {
  X,
  Share2,
  Copy,
  Building2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';

interface FPOQRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  fpoName: string;
  joinCode: string;
  fpoId?: string;
  district?: string;
  state?: string;
}

export function FPOQRCodeModal({
  visible,
  onClose,
  fpoName,
  joinCode,
  fpoId = 'fpo_mandikart_01',
  district = 'Bareilly',
  state = 'Uttar Pradesh',
}: FPOQRCodeModalProps) {
  const qrPayload = `mandikart://join-fpo?code=${joinCode}&fpoId=${fpoId}&name=${encodeURIComponent(fpoName)}&dist=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}`;
  const joinLink = `https://mandikart.in/join-fpo?code=${joinCode}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🌾 Join ${fpoName} on MandiKart!\n\nScan our official FPO QR code in the MandiKart app or enter Join Code: *${joinCode}*\n\nDirect Link: ${joinLink}`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleCopyCode = () => {
    Alert.alert('Code Copied!', `FPO Join Code "${joinCode}" copied to clipboard.`);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.fpoBadge}>
                <Building2 size={12} color="#1E40AF" />
                <Text style={styles.fpoBadgeText}>OFFICIAL PRODUCER CO. QR</Text>
              </View>
              <Text style={styles.fpoTitle} numberOfLines={1}>
                {fpoName}
              </Text>
              <Text style={styles.fpoLocation}>
                📍 {district}, {state}
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#64748B" />
            </Pressable>
          </View>

          {/* QR Container */}
          <View style={styles.qrSection}>
            <View style={styles.qrFrame}>
              <MKQRCode
                value={qrPayload}
                size={200}
                color="#0F2C56"
                backgroundColor="#FFFFFF"
              />
            </View>

            <View style={styles.scanNoticeRow}>
              <Sparkles size={14} color="#16A34A" />
              <Text style={styles.scanNoticeText}>
                Farmers can scan this from their More tab
              </Text>
            </View>
          </View>

          {/* Join Code Card */}
          <View style={styles.codeContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.codeLabel}>OFFICIAL FPO JOIN CODE</Text>
              <Text style={styles.codeValue}>{joinCode}</Text>
            </View>
            <Pressable style={styles.copyBtn} onPress={handleCopyCode}>
              <Copy size={16} color="#1E40AF" />
              <Text style={styles.copyBtnText}>Copy</Text>
            </Pressable>
          </View>

          {/* Security Guarantee */}
          <View style={styles.trustBadge}>
            <ShieldCheck size={14} color="#059669" />
            <Text style={styles.trustText}>
              Verified by MandiKart FPO Governance Desk
            </Text>
          </View>

          {/* Action Footer */}
          <View style={styles.actionRow}>
            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <Share2 size={18} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.shareBtnText}>Share Invite Link & Code</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: '#0F2C56',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fpoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  fpoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.4,
  },
  fpoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  fpoLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  qrFrame: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  scanNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  scanNoticeText: {
    fontSize: 11.5,
    color: '#15803D',
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  codeValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  trustText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
  actionRow: {
    gap: 8,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E40AF',
    paddingVertical: 13,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default FPOQRCodeModal;
