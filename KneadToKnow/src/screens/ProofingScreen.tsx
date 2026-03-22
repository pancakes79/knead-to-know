import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProofingEstimate, cToF, fToC, PROOFING_CHART } from '../constants/proofingData';
import { getAmbientTemperature, isConfigured } from '../services/homeAssistantApi';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

type TempUnit = 'F' | 'C';

export function ProofingScreen() {
  const insets = useSafeAreaInsets();
  const [tempF, setTempF] = useState(72);
  const [unit, setUnit] = useState<TempUnit>('F');
  const [loadingHA, setLoadingHA] = useState(false);

  const displayTemp = unit === 'F' ? tempF : fToC(tempF);
  const estimate = getProofingEstimate(tempF);

  const handleUnitToggle = useCallback((newUnit: TempUnit) => {
    setUnit(newUnit);
  }, []);

  const handleSliderChange = useCallback((value: number) => {
    if (unit === 'F') {
      setTempF(Math.round(value));
    } else {
      setTempF(cToF(Math.round(value)));
    }
  }, [unit]);

  const handleHAPull = useCallback(async () => {
    setLoadingHA(true);
    try {
      const configured = await isConfigured();
      if (!configured) {
        Alert.alert(
          'Home Assistant Not Connected',
          'Go to Settings to connect your Home Assistant instance.',
          [{ text: 'OK' }]
        );
        return;
      }
      const temp = await getAmbientTemperature();
      setTempF(Math.round(temp));
      setUnit('F');
      Alert.alert('Temperature Updated', `Current ambient: ${Math.round(temp)}°F`);
    } catch (error: any) {
      Alert.alert('Home Assistant Error', error.message);
    } finally {
      setLoadingHA(false);
    }
  }, []);

  const sliderMin = unit === 'F' ? 60 : 15;
  const sliderMax = unit === 'F' ? 85 : 30;
  const sliderValue = unit === 'F' ? tempF : fToC(tempF);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Proofing Calculator</Text>
        <Text style={styles.subtitle}>Based on The Sourdough Journey Dough Temping Guide</Text>
      </View>

      {/* Dark calculator card */}
      <View style={styles.calcCard}>
        {/* Unit toggle */}
        <View style={styles.unitRow}>
          {(['F', 'C'] as TempUnit[]).map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitButton, unit === u && styles.unitButtonActive]}
              onPress={() => handleUnitToggle(u)}
            >
              <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>°{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Temperature slider */}
        <View style={styles.sliderRow}>
          <Slider
            style={styles.slider}
            minimumValue={sliderMin}
            maximumValue={sliderMax}
            value={sliderValue}
            onValueChange={handleSliderChange}
            minimumTrackTintColor={colors.golden}
            maximumTrackTintColor={colors.borderDark}
            thumbTintColor={colors.golden}
            step={1}
          />
          <Text style={styles.tempDisplay}>
            {Math.round(displayTemp)}°{unit}
          </Text>
        </View>

        {/* Results */}
        <View style={styles.resultsRow}>
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>EST. PROOF TIME</Text>
            <Text style={styles.resultValue}>{estimate.hours}h</Text>
          </View>
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>TARGET RISE</Text>
            <Text style={styles.resultValue}>{estimate.rise}%</Text>
          </View>
        </View>

        {/* Home Assistant button */}
        <TouchableOpacity
          style={styles.haButton}
          onPress={handleHAPull}
          disabled={loadingHA}
        >
          {loadingHA ? (
            <ActivityIndicator color={colors.golden} size="small" />
          ) : (
            <Text style={styles.haText}>🏠 Pull from Home Assistant</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Reference chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Quick Reference</Text>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartHeaderText, { flex: 1 }]}>Temp</Text>
          <Text style={[styles.chartHeaderText, { flex: 1 }]}>Time</Text>
          <Text style={[styles.chartHeaderText, { flex: 1 }]}>Rise</Text>
        </View>
        {PROOFING_CHART.filter((_, i) => i % 2 === 0).map((row) => (
          <View
            key={row.tempF}
            style={[
              styles.chartRow,
              Math.round(tempF) === row.tempF && styles.chartRowActive,
            ]}
          >
            <Text style={[styles.chartCell, { flex: 1 }, Math.round(tempF) === row.tempF && styles.chartCellActive]}>
              {row.tempF}°F / {row.tempC}°C
            </Text>
            <Text style={[styles.chartCell, { flex: 1 }, Math.round(tempF) === row.tempF && styles.chartCellActive]}>
              {row.hours} hrs
            </Text>
            <Text style={[styles.chartCell, { flex: 1 }, Math.round(tempF) === row.tempF && styles.chartCellActive]}>
              {row.rise}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  calcCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.bgDark,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    marginBottom: spacing.xl,
  },
  unitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  unitButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  unitButtonActive: {
    backgroundColor: colors.golden,
    borderColor: colors.golden,
  },
  unitText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textLight,
  },
  unitTextActive: {
    color: colors.bgDark,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  tempDisplay: {
    fontFamily: fonts.mono,
    fontSize: 28,
    color: colors.golden,
    minWidth: 80,
    textAlign: 'right',
  },
  resultsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  resultBox: {
    flex: 1,
    backgroundColor: 'rgba(232, 168, 73, 0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 73, 0.25)',
  },
  resultLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.textLight,
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultValue: {
    fontFamily: fonts.mono,
    fontSize: 28,
    color: colors.golden,
  },
  haButton: {
    backgroundColor: 'rgba(232, 168, 73, 0.1)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 73, 0.2)',
    borderStyle: 'dashed',
  },
  haText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textLight,
  },
  chartSection: {
    paddingHorizontal: spacing.xl,
    flex: 1,
  },
  chartTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chartHeaderText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  chartRowActive: {
    backgroundColor: colors.cream,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  chartCell: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chartCellActive: {
    fontFamily: fonts.bodySemiBold,
    color: colors.amber,
  },
});
