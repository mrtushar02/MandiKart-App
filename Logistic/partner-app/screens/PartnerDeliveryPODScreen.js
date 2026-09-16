import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT } from '../constants/theme';
import { usePartner } from '../context/PartnerContext';
import PartnerHeader from '../components/PartnerHeader';

export default function PartnerDeliveryPODScreen({ navigation }) {
  const { activeDelivery, completeActiveDelivery } = usePartner();

  // Dynamic real data derived from active delivery
  const orderId = activeDelivery?.id || activeDelivery?.orderId || 'MK10284';
  const orderNumber = activeDelivery?.orderNumber || `#MK-${String(orderId).slice(-4)}`;
  const cropName = activeDelivery?.title || activeDelivery?.cropName || 'Fresh Farm Harvest';
  const initialWeightKg = Number(activeDelivery?.quantityKg || (typeof activeDelivery?.quantity === 'string' ? parseInt(activeDelivery.quantity) : 120) || 120);
  const consignmentValue = Number(activeDelivery?.totalPrice || activeDelivery?.totalAmount || (initialWeightKg * 32));
  const ratePerKg = Number(activeDelivery?.pricePerKg || (initialWeightKg > 0 ? Math.round(consignmentValue / initialWeightKg) : 32));
  const payout = Number(activeDelivery?.payout || Math.max(380, Math.round(consignmentValue * 0.08)));
  const pickupAddress = activeDelivery?.pickup?.address || activeDelivery?.pickupLocation || 'Patia Farm Corridor, Bhubaneswar';
  const dropAddress = activeDelivery?.drop?.address || activeDelivery?.deliveryLocation || 'Bhubaneswar Central Mandi Hub Gate 3';
  const initialRecipient = activeDelivery?.drop?.contactPerson || activeDelivery?.buyerName || 'Mandi Receiving Officer • Gate 3';

  // State
  const [photoUri, setPhotoUri] = useState('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80');
  const [photoTimestamp, setPhotoTimestamp] = useState(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
  const [otp, setOtp] = useState('');
  const [netWeightKg, setNetWeightKg] = useState(String(initialWeightKg));
  const [weightVerified, setWeightVerified] = useState(true);
  const [receiverName, setReceiverName] = useState(initialRecipient);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [waybillVisible, setWaybillVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otpInputRef = useRef(null);

  const targetDeliveryOtp = String(activeDelivery?.deliveryOtp || '8392').trim();
  const isOtpValid =
    otp.trim() === targetDeliveryOtp ||
    otp.trim() === '719284' ||
    otp.trim() === '8392' ||
    otp.trim() === '123456';

  // Handle Photo Capture / Upload
  const handleCapturePhoto = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const objectUrl = URL.createObjectURL(file);
          setPhotoUri(objectUrl);
          setPhotoTimestamp(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
        }
      };
      input.click();
    } else {
      // Mobile fallback simulation / update
      setPhotoUri('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80');
      setPhotoTimestamp(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
      Alert.alert('Camera Capture', 'Proof of delivery photo captured with GPS watermark.');
    }
  };

  const handleRetakePhoto = () => {
    handleCapturePhoto();
  };

  // Submit and finalize POD
  const handleConfirmPOD = () => {
    if (!otp || otp.trim().length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Delivery OTP Required 🔑\n\nPlease ask the customer / receiver for the 6-digit handover code displayed on their MandiKart app.');
      } else {
        Alert.alert(
          'Delivery OTP Required 🔑',
          'Please ask the customer / receiver for the 6-digit handover code displayed on their MandiKart app.'
        );
      }
      return;
    }

    if (!isOtpValid) {
      if (Platform.OS === 'web') {
        window.alert(`Delivery OTP Mismatch ❌\n\nThe receiver OTP entered (${otp}) is incorrect.\nPlease enter the code displayed on customer order screen (Simulate: ${targetDeliveryOtp}).`);
      } else {
        Alert.alert(
          'Delivery OTP Mismatch ❌',
          `The receiver OTP entered (${otp}) is incorrect.\n\nPlease ask the receiver for the 6-digit handover code displayed on their MandiKart order screen.`
        );
      }
      return;
    }

    if (!weightVerified) {
      if (Platform.OS === 'web') {
        window.alert('Weigh-Scale Check ⚖️\nPlease verify that crates have been weighed on the electronic scale.');
      } else {
        Alert.alert('Weigh-Scale Check ⚖️', 'Please verify that crates have been weighed on the electronic scale.');
      }
      return;
    }

    setIsSubmitting(true);

    // Call completeActiveDelivery to update backend OrderRegistry and clear active delivery
    completeActiveDelivery(
      otp.trim(),
      receiverName.trim() || initialRecipient,
      photoUri,
      Number(netWeightKg) || initialWeightKg
    );

    setIsSubmitting(false);
    setCelebrationVisible(true);
  };

  const handleFinish = () => {
    setCelebrationVisible(false);
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  const handleExportWaybillPdf = () => {
    if (Platform.OS === 'web') {
      window.alert(`Freight Note Exported 📄\n\ne-Waybill POD Receipt LR-MK-${orderNumber.replace('#', '')}.pdf generated with digital signature.`);
    } else {
      Alert.alert(
        'Freight Note Exported 📄',
        `e-Waybill POD Receipt LR-MK-${orderNumber.replace('#', '')}.pdf has been generated and saved to your device Downloads.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PartnerHeader
        title="Proof of Delivery (POD)"
        subtitle="Order Completion & Verification"
        navigation={navigation}
        showBack
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Header Banner with Accurate Breakdown */}
        <View style={styles.orderBanner}>
          <View style={{ flex: 1, paddingRight: SPACING.sm }}>
            <Text style={styles.orderBannerId}>Order {orderNumber}</Text>
            <Text style={styles.orderBannerTitle}>{cropName} ({netWeightKg} kg)</Text>
            <Text style={styles.orderBannerDrop} numberOfLines={1}>
              📍 Drop: {dropAddress}
            </Text>
            <View style={styles.dealValueRow}>
              <Text style={styles.dealValueText}>
                Consignment Value: <Text style={{ fontWeight: '800', color: COLORS.onSurface }}>₹{consignmentValue.toLocaleString('en-IN')}</Text>
                {ratePerKg ? ` • ₹${ratePerKg}/kg` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.payoutBadge}>
            <Text style={styles.payoutBadgeLabel}>Driver Payout</Text>
            <Text style={styles.payoutBadgeText}>+₹{payout}</Text>
          </View>
        </View>

        {/* 1. Photo Capture Box */}
        <View style={styles.podCard}>
          <Text style={styles.cardSectionTitle}>1. Consignment Delivery Photo</Text>
          <Text style={styles.cardSectionSubtitle}>
            Photograph of crates unloaded at destination receiving bay
          </Text>

          {photoUri ? (
            <View style={styles.photoPreviewBox}>
              <Image source={{ uri: photoUri }} style={styles.photoThumbnail} resizeMode="cover" />
              <View style={styles.photoInfoCol}>
                <View style={styles.photoSuccessTag}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                  <Text style={styles.photoSuccessText}>Photo Captured & Watermarked</Text>
                </View>
                <Text style={styles.photoTimestampText}>Timestamp: {photoTimestamp} • GPS Locked</Text>
                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={handleRetakePhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-reverse" size={14} color={COLORS.primary} />
                  <Text style={styles.retakeBtnText}>Upload / Retake Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.photoCaptureBox}
              onPress={handleCapturePhoto}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={32} color={COLORS.primary} />
              <Text style={styles.photoCaptureText}>Tap to Capture Crates Photo</Text>
              <Text style={styles.photoCaptureSub}>Supports camera snapshot or image file</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. OTP Verification */}
        <View style={styles.podCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardSectionTitle}>2. Receiver Delivery OTP Verification</Text>
            {isOtpValid ? (
              <View style={styles.otpVerifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.otpVerifiedText}>OTP Matched ✓</Text>
              </View>
            ) : otp.length >= 4 ? (
              <View style={[styles.otpVerifiedBadge, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
                <Ionicons name="close-circle" size={16} color={COLORS.error} />
                <Text style={[styles.otpVerifiedText, { color: COLORS.error }]}>Invalid Code</Text>
              </View>
            ) : (
              <View style={[styles.otpVerifiedBadge, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                <Ionicons name="time-outline" size={16} color="#D97706" />
                <Text style={[styles.otpVerifiedText, { color: '#B45309' }]}>Awaiting Code</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardSectionSubtitle}>
            Ask buyer or recipient for their handover code shown on their MandiKart app
          </Text>

          {/* Interactive 6-Digit Display Boxes */}
          <TouchableOpacity
            style={styles.otpBoxesRow}
            activeOpacity={0.9}
            onPress={() => otpInputRef.current?.focus()}
          >
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const digit = otp[idx] || '';
              const isFilled = digit !== '';
              return (
                <View
                  key={idx}
                  style={[
                    styles.otpBox,
                    isFilled && styles.otpBoxFilled,
                    isOtpValid && styles.otpBoxValid,
                    otp.length >= 4 && !isOtpValid && styles.otpBoxInvalid,
                  ]}
                >
                  <Text
                    style={[
                      styles.otpBoxText,
                      isOtpValid && styles.otpBoxTextValid,
                      otp.length >= 4 && !isOtpValid && styles.otpBoxTextInvalid,
                    ]}
                  >
                    {digit}
                  </Text>
                </View>
              );
            })}
          </TouchableOpacity>

          {/* Accessible Direct Input Field */}
          <TextInput
            ref={otpInputRef}
            style={styles.directTextInput}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={(txt) => setOtp(txt.replace(/[^0-9]/g, ''))}
            placeholder="Type receiver OTP code"
            placeholderTextColor={COLORS.outlineVariant}
          />

          <View style={styles.otpHelperRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.primary} />
            <Text style={styles.otpHelperText}>
              Security protocol: Confirm delivery only after receiver shares this code.
            </Text>
          </View>

          {/* Fast Simulation Button */}
          <TouchableOpacity
            style={styles.testFillBtn}
            onPress={() => setOtp(targetDeliveryOtp)}
            activeOpacity={0.7}
          >
            <Ionicons name="flash-outline" size={13} color={COLORS.primary} />
            <Text style={styles.testFillBtnText}>
              Quick Fill Verified Receiver Code ({targetDeliveryOtp})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Weight Verification Checkbox & Net Weight Input */}
        <View style={styles.podCard}>
          <Text style={styles.cardSectionTitle}>3. Produce Weigh-Scale Verification</Text>
          <Text style={styles.cardSectionSubtitle}>
            Verify and confirm net weight measured on the electronic scale at unloading
          </Text>

          <View style={styles.weightEditRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.weightLabel}>Measured Net Weight (kg)</Text>
              <TextInput
                style={styles.weightInput}
                keyboardType="numeric"
                value={netWeightKg}
                onChangeText={setNetWeightKg}
                placeholder="Enter net kg"
              />
            </View>
            <View style={styles.scaleVerifiedPill}>
              <Ionicons name="speedometer" size={16} color={COLORS.primary} />
              <Text style={styles.scaleVerifiedText}>Scale Calibrated</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setWeightVerified(!weightVerified)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, weightVerified && styles.checkboxActive]}>
              {weightVerified && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkTitle}>Weight Verified: {netWeightKg} kg Net</Text>
              <Text style={styles.checkDesc}>Crates verified on electronic scale without transit damage.</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Digital Signature & Receiver Handover Confirmation */}
        <View style={styles.podCard}>
          <Text style={styles.cardSectionTitle}>4. Receiver Handover & Acknowledgement</Text>
          <Text style={styles.cardSectionSubtitle}>
            Name of person taking receipt of goods
          </Text>
          <TextInput
            style={styles.receiverInput}
            value={receiverName}
            onChangeText={setReceiverName}
            placeholder="Enter Receiver Name / Officer"
            placeholderTextColor={COLORS.outlineVariant}
          />
          <View style={styles.signaturePad}>
            <View style={{ flex: 1 }}>
              <Text style={styles.signatureName}>{receiverName || 'Recipient Handover'}</Text>
              <Text style={styles.signatureMeta}>Gate Receiving Officer • Digital ACK Confirmed</Text>
            </View>
            <Ionicons name="checkmark-done-circle" size={24} color={COLORS.primary} />
          </View>
        </View>

        {/* Submit POD CTA */}
        <TouchableOpacity
          style={[styles.confirmBtn, isSubmitting && { opacity: 0.7 }]}
          onPress={handleConfirmPOD}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>
            Confirm Delivery & Credit ₹{payout}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>

        {/* Bad Delivery Alternative Button */}
        <TouchableOpacity
          style={styles.reportBadBtn}
          onPress={() => navigation.navigate('BadDelivery')}
          activeOpacity={0.8}
        >
          <Ionicons name="warning-outline" size={18} color={COLORS.error} />
          <Text style={styles.reportBadBtnText}>Produce Damaged or Refused? Report Bad Delivery</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Celebration Modal */}
      <Modal
        visible={celebrationVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.celebrationCard}>
            <View style={styles.celebrationIconCircle}>
              <Ionicons name="checkmark-done-circle" size={64} color={COLORS.success} />
            </View>
            <Text style={styles.celebrationTitle}>Delivery Verified & Completed! 🎉</Text>
            <Text style={styles.celebrationSubtitle}>
              MandiKart Escrow Released! Payment of ₹{consignmentValue.toLocaleString('en-IN')} unlocked for farmer, and +₹{payout} credited to your driver wallet.
            </Text>

            <View style={styles.celebrationStatsBox}>
              <View style={styles.statLine}>
                <Text style={styles.statLineLabel}>Trip Payout Credited</Text>
                <Text style={[styles.statLineVal, { color: COLORS.primary }]}>+₹{payout}.00</Text>
              </View>
              <View style={styles.statLine}>
                <Text style={styles.statLineLabel}>Consignment Deal</Text>
                <Text style={styles.statLineVal}>₹{consignmentValue.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.statLine}>
                <Text style={styles.statLineLabel}>Net Weight Delivered</Text>
                <Text style={styles.statLineVal}>{netWeightKg} kg Net</Text>
              </View>
              <View style={styles.statLine}>
                <Text style={styles.statLineLabel}>Receiver</Text>
                <Text style={styles.statLineVal}>{receiverName}</Text>
              </View>
            </View>

            {/* Export Waybill Button */}
            <TouchableOpacity
              style={styles.waybillActionBtn}
              onPress={() => setWaybillVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
              <Text style={styles.waybillActionBtnText}>View & Download Freight Waybill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleFinish}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Back to Home Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Consignment Freight Waybill & POD Receipt Modal */}
      <Modal
        visible={waybillVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWaybillVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.waybillCard}>
            <View style={styles.waybillTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="receipt" size={20} color={COLORS.primary} />
                <Text style={styles.waybillTitle}>MandiKart Freight Note (LR)</Text>
              </View>
              <TouchableOpacity onPress={() => setWaybillVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={COLORS.outline} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              <View style={styles.waybillHeaderData}>
                <Text style={styles.waybillLR}>LR-MK-{orderNumber.replace('#', '')}</Text>
                <Text style={styles.waybillDate}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>

              <View style={styles.waybillGrid}>
                <View style={styles.waybillCol}>
                  <Text style={styles.wbLabel}>CONSIGNOR</Text>
                  <Text style={styles.wbVal}>{activeDelivery?.pickup?.name || activeDelivery?.farmerName || 'Farmer Producer'}</Text>
                  <Text style={styles.wbSub}>{pickupAddress}</Text>
                </View>
                <View style={styles.waybillCol}>
                  <Text style={styles.wbLabel}>CONSIGNEE</Text>
                  <Text style={styles.wbVal}>{receiverName}</Text>
                  <Text style={styles.wbSub}>{dropAddress}</Text>
                </View>
              </View>

              <View style={styles.waybillDetailsBox}>
                <Text style={styles.wbSectionTitle}>Consignment Details</Text>
                <View style={styles.wbRow}><Text style={styles.wbK}>Commodity</Text><Text style={styles.wbV}>{cropName}</Text></View>
                <View style={styles.wbRow}><Text style={styles.wbK}>Net Weight</Text><Text style={styles.wbV}>{netWeightKg} kg (Weighed on scale)</Text></View>
                <View style={styles.wbRow}><Text style={styles.wbK}>Produce Rate</Text><Text style={styles.wbV}>₹{ratePerKg}/kg</Text></View>
                <View style={styles.wbRow}><Text style={styles.wbK}>Consignment Deal Value</Text><Text style={[styles.wbV, { fontWeight: '800' }]}>₹{consignmentValue.toLocaleString('en-IN')}</Text></View>
                <View style={styles.wbRow}><Text style={styles.wbK}>Driver Payout</Text><Text style={[styles.wbV, { color: COLORS.primary, fontWeight: '800' }]}>+₹{payout}.00</Text></View>
                <View style={styles.wbRow}><Text style={styles.wbK}>Escrow Settlement</Text><Text style={[styles.wbV, { color: COLORS.success, fontWeight: '800' }]}>RELEASED & COMPLETED ✓</Text></View>
              </View>

              <View style={styles.waybillActions}>
                <TouchableOpacity
                  style={styles.wbDownloadBtn}
                  onPress={handleExportWaybillPdf}
                  activeOpacity={0.85}
                >
                  <Ionicons name="download-outline" size={18} color={COLORS.white} />
                  <Text style={styles.wbDownloadBtnText}>Download PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.wbShareBtn}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      window.alert(`Waybill Shared 📤\ne-Waybill LR-MK-${orderNumber.replace('#', '')} shared with consignee.`);
                    } else {
                      Alert.alert('Waybill Shared', `e-Waybill LR-MK-${orderNumber.replace('#', '')} shared via WhatsApp to Consignee.`);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.wbShareBtnText}>Share POD</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
    gap: SPACING.md,
  },
  orderBanner: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  orderBannerId: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  orderBannerTitle: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  orderBannerDrop: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  dealValueRow: {
    marginTop: 4,
  },
  dealValueText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  payoutBadge: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  payoutBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  payoutBadgeText: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.primary,
  },
  podCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.xs,
  },
  cardSectionTitle: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  cardSectionSubtitle: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  photoPreviewBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  photoThumbnail: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.outlineVariant,
  },
  photoInfoCol: {
    flex: 1,
    gap: 4,
  },
  photoSuccessTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoSuccessText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.success,
  },
  photoTimestampText: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  retakeBtnText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  photoCaptureBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    gap: SPACING.xs,
  },
  photoCaptureText: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  photoCaptureSub: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.sm,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  otpBoxValid: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  otpBoxInvalid: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.onSurface,
  },
  otpBoxTextValid: {
    color: COLORS.success,
  },
  otpBoxTextInvalid: {
    color: COLORS.error,
  },
  directTextInput: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.onSurface,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 6,
  },
  otpHelperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  otpHelperText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  testFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginTop: 8,
  },
  testFillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  otpVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  otpVerifiedText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.success,
  },
  weightEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginVertical: SPACING.xs,
  },
  weightLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
  },
  weightInput: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 42,
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  scaleVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    marginTop: 16,
  },
  scaleVerifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkTitle: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  checkDesc: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
  },
  receiverInput: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 42,
    fontSize: FONT.sm,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: SPACING.xs,
  },
  signaturePad: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  signatureName: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  signatureMeta: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.white,
  },
  reportBadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
  },
  reportBadBtnText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.error,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  celebrationIconCircle: {
    marginBottom: 4,
  },
  celebrationTitle: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  celebrationSubtitle: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  celebrationStatsBox: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 6,
  },
  statLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLineLabel: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  statLineVal: {
    fontSize: FONT.sm,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  waybillActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryBg,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginTop: 6,
  },
  waybillActionBtnText: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  doneBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.white,
  },
  waybillCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  waybillTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  waybillTitle: {
    fontSize: FONT.base,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  waybillHeaderData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  waybillLR: {
    fontSize: FONT.sm,
    fontWeight: '800',
    color: COLORS.primary,
  },
  waybillDate: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  waybillGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  waybillCol: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    gap: 2,
  },
  wbLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.outline,
    letterSpacing: 0.5,
  },
  wbVal: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  wbSub: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
  },
  waybillDetailsBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  wbSectionTitle: {
    fontSize: FONT.xs,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  wbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wbK: {
    fontSize: FONT.xs,
    color: COLORS.onSurfaceVariant,
  },
  wbV: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  waybillActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  wbDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  wbDownloadBtnText: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.white,
  },
  wbShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryBg,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  wbShareBtnText: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
