/**
 * MandiKart — Requirement Wizard Stepper Header
 * Reusable progress bar & header across screens 2-7
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, Check } from 'lucide-react-native';
import { MKColors } from '@/constants/colors';

interface RequirementStepHeaderProps {
  currentStep: number; // 1 to 6
  stepTitle: string;
  subtitle?: string;
  onSaveDraft?: () => void;
  onBack?: () => void;
  isSavingDraft?: boolean;
}

const TOTAL_STEPS = 6;
const STEP_LABELS = [
  'Setup',
  'Products',
  'Specs',
  'Budget',
  'Delivery',
  'Review',
];

export const RequirementStepHeader: React.FC<RequirementStepHeaderProps> = ({
  currentStep,
  stepTitle,
  subtitle,
  onSaveDraft,
  onBack,
  isSavingDraft = false,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topRow}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
          <ArrowLeft size={22} color={MKColors.textPrimary} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.stepCounterText}>
            STEP {currentStep} OF {TOTAL_STEPS} • {STEP_LABELS[currentStep - 1]}
          </Text>
          <Text style={styles.screenTitle} numberOfLines={1}>
            {stepTitle}
          </Text>
        </View>

        {onSaveDraft && (
          <Pressable
            onPress={onSaveDraft}
            style={[styles.saveDraftBtn, isSavingDraft && { opacity: 0.6 }]}
            disabled={isSavingDraft}
          >
            <Bookmark size={15} color={MKColors.primaryGreen} />
            <Text style={styles.saveDraftText}>
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Progress Dots / Bar */}
      <View style={styles.progressRow}>
        {STEP_LABELS.map((label, idx) => {
          const stepNum = idx + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <View key={label} style={styles.stepSegment}>
              <View
                style={[
                  styles.progressBar,
                  isDone && styles.progressBarDone,
                  isCurrent && styles.progressBarCurrent,
                ]}
              />
            </View>
          );
        })}
      </View>

      {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5DFD4',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F1E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  stepCounterText: {
    fontSize: 10,
    fontWeight: '800',
    color: MKColors.primaryGreen,
    letterSpacing: 0.8,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1C1E',
    marginTop: 1,
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  saveDraftText: {
    fontSize: 12,
    fontWeight: '700',
    color: MKColors.primaryGreenDark,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  stepSegment: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ECE6DC',
  },
  progressBarDone: {
    backgroundColor: MKColors.primaryGreen,
  },
  progressBarCurrent: {
    backgroundColor: MKColors.accentOrange,
  },
  subtitleText: {
    fontSize: 12,
    color: '#5F6368',
    marginTop: 6,
  },
});
