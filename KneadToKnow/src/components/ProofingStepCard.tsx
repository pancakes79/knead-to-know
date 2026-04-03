import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { CountdownTimer } from './CountdownTimer';
import { getProofingEstimate, fToC } from '../constants/proofingData';
import { getHATemperature } from '../services/cloudApi';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

interface ProofingStepCardProps {
  stepText: string;
  checked: boolean;
  onToggle: () => void;
}

export function ProofingStepCard({ stepText, checked, onToggle }: ProofingStepCardProps) {
  const [tempF, setTempF] = useState(72);
  const [timerStarted, setTimerStarted] = useState(false);
  const [tempSource, setTempSource] = useState<string | null>(null);

  // Try to fetch temperature from Home Assistant on mount
  useEffect(() => {
    let cancelled = false;
    getHATemperature()
      .then((result) => {
        if (!cancelled && result.tempF) {
          const clamped = Math.round(Math.min(85, Math.max(60, result.tempF)));
          setTempF(clamped);
          setTempSource(result.sensorName || 'Home Assistant');
        }
      })
      .catch(() => {
        // HA not configured or unreachable — stay on manual default
      });
    return () => { cancelled = true; };
  }, []);

  const estimate = getProofingEstimate(tempF);
  const timerSeconds = Math.round(estimate.hours * 3600);

  const handleSliderChange = useCallback((value: number) => {
    setTempF(Math.round(value));
    setTimerStarted(false);
  }, []);

  return (
    <View style={styles.container}>
      {/* Step checkbox row */}
      <TouchableOpacity
        style={[styles.checkItem, checked && styles.checkItemDone]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, styles.checkboxProof, checked && styles.checkboxDone]}>
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.checkText, checked && styles.checkTextDone]}>
            {stepText}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Inline proofing calculator — only show when not checked off */}
      {!checked && (
        <View style={styles.calcCard}>
          <Text style={styles.calcTitle}>
            Proofing Calculator
            {tempSource ? ` · ${tempSource}` : ''}
          </Text>

          {/* Temperature slider */}
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Dough Temp</Text>
            <Slider
              style={styles.slider}
              minimumValue={60}
              maximumValue={85}
              value={tempF}
              onValueChange={handleSliderChange}
              minimumTrackTintColor={colors.golden}
              maximumTrackTintColor={colors.borderDark}
              thumbTintColor={colors.golden}
              step={1}
            />
            <Text style={styles.tempDisplay}>{tempF}°F</Text>
          </View>

          {/* Estimate display */}
          <View style={styles.estimateRow}>
            <View style={styles.estimateBox}>
              <Text style={styles.estimateLabel}>EST. TIME</Text>
              <Text style={styles.estimateValue}>{estimate.hours}h</Text>
            </View>
            <View style={styles.estimateBox}>
              <Text style={styles.estimateLabel}>TARGET RISE</Text>
              <Text style={styles.estimateValue}>{estimate.rise}%</Text>
            </View>
            <View style={styles.estimateBox}>
              <Text style={styles.estimateLabel}>TEMP °C</Text>
              <Text style={styles.estimateValue}>{fToC(tempF)}°</Text>
            </View>
          </View>

          {/* Start timer or show active timer */}
          {!timerStarted ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => setTimerStarted(true)}
            >
              <Text style={styles.startButtonText}>Start Proof Timer ({estimate.hours}h)</Text>
            </TouchableOpacity>
          ) : (
            <CountdownTimer
              label={`Proofing at ${tempF}°F — ${estimate.rise}% target rise`}
              totalSeconds={timerSeconds}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md + 2,
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  checkItemDone: {
    backgroundColor: colors.checkedBg,
    borderColor: colors.checkedBorder,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.unchecked,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxProof: {
    borderColor: colors.amber,
  },
  checkboxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  checkTextDone: {
    color: colors.checkedText,
    textDecorationLine: 'line-through',
  },
  calcCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.bgDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  calcTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.golden,
    marginBottom: spacing.md,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sliderLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textLight,
    opacity: 0.7,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  tempDisplay: {
    fontFamily: fonts.mono,
    fontSize: 20,
    color: colors.golden,
    minWidth: 56,
    textAlign: 'right',
  },
  estimateRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  estimateBox: {
    flex: 1,
    backgroundColor: 'rgba(232, 168, 73, 0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 73, 0.25)',
  },
  estimateLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    color: colors.textLight,
    letterSpacing: 1,
    marginBottom: 2,
  },
  estimateValue: {
    fontFamily: fonts.mono,
    fontSize: 20,
    color: colors.golden,
  },
  startButton: {
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  startButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#fff',
  },
});
