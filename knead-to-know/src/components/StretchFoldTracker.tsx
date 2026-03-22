import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CountdownTimer } from './CountdownTimer';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

const FOLDS = [
  '1st Stretch & Fold',
  '2nd Stretch & Fold',
  '3rd Stretch & Fold',
  '4th Stretch & Fold',
];

export function StretchFoldTracker() {
  const [currentFold, setCurrentFold] = useState(0);
  const allComplete = currentFold >= 4;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stretch & Folds</Text>
      <Text style={styles.subtitle}>4 sets, 30 minutes apart</Text>

      {FOLDS.map((fold, i) => {
        const isComplete = i < currentFold;
        const isCurrent = i === currentFold;
        const isFuture = i > currentFold;

        return (
          <View key={i} style={[styles.foldRow, isFuture && styles.foldRowFuture]}>
            <View style={styles.foldHeader}>
              <View style={[
                styles.foldDot,
                isComplete && styles.foldDotComplete,
                isCurrent && styles.foldDotCurrent,
              ]}>
                {isComplete ? (
                  <Text style={styles.foldDotCheck}>✓</Text>
                ) : (
                  <Text style={styles.foldDotNumber}>{i + 1}</Text>
                )}
              </View>
              <Text style={[
                styles.foldLabel,
                isComplete && styles.foldLabelComplete,
                isCurrent && styles.foldLabelCurrent,
              ]}>
                {fold}
              </Text>
              {isCurrent && (
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setCurrentFold(currentFold + 1)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>

            {isCurrent && !allComplete && (
              <CountdownTimer
                label="Rest before next fold"
                totalSeconds={1800} // 30 minutes
              />
            )}
          </View>
        );
      })}

      {allComplete && (
        <View style={styles.completeBanner}>
          <Text style={styles.completeText}>All stretch & folds complete!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.warningBorder,
    padding: spacing.lg,
    marginVertical: spacing.sm,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  foldRow: {
    marginBottom: spacing.md,
  },
  foldRowFuture: {
    opacity: 0.4,
  },
  foldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  foldDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foldDotComplete: {
    backgroundColor: colors.success,
  },
  foldDotCurrent: {
    backgroundColor: colors.amber,
  },
  foldDotCheck: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  foldDotNumber: {
    color: '#fff',
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
  foldLabel: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  foldLabelComplete: {
    color: colors.success,
    textDecorationLine: 'line-through',
  },
  foldLabelCurrent: {
    fontFamily: fonts.bodySemiBold,
  },
  doneButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  doneButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: '#fff',
  },
  completeBanner: {
    marginTop: spacing.sm,
    backgroundColor: colors.successBg,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  completeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.successText,
  },
});
