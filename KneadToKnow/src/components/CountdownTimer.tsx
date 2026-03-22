import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTimer } from '../hooks/useTimer';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

interface CountdownTimerProps {
  label: string;
  totalSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export function CountdownTimer({ label, totalSeconds, onComplete, autoStart = false }: CountdownTimerProps) {
  const timer = useTimer({ totalSeconds, label, onComplete, autoStart });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${timer.progress * 100}%`,
              backgroundColor: timer.isComplete ? colors.success : colors.amber,
            },
          ]}
        />
      </View>

      {/* Time + controls */}
      <View style={styles.row}>
        <Text style={[styles.time, timer.isComplete && styles.timeComplete]}>
          {timer.formattedTime}
        </Text>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.playButton, timer.isRunning && styles.pauseButton]}
            onPress={timer.toggle}
            disabled={timer.isComplete}
          >
            <Text style={styles.playButtonText}>
              {timer.isRunning ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={timer.reset}>
            <Text style={styles.resetButtonText}>↺</Text>
          </TouchableOpacity>
        </View>
      </View>

      {timer.isComplete && (
        <View style={styles.completeBanner}>
          <Text style={styles.completeText}>Timer complete!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cream,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.amber,
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.warningBorder,
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.pill,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontFamily: fonts.mono,
    fontSize: 32,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  timeComplete: {
    color: colors.success,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: colors.warning,
  },
  playButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 20,
    color: colors.amber,
  },
  completeBanner: {
    marginTop: spacing.sm,
    backgroundColor: colors.successBg,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  completeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.successText,
  },
});
