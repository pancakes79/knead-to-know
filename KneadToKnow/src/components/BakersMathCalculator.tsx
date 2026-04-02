import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

interface HydrationPreset {
  label: string;
  hydration: number;
  description: string;
}

const PRESETS: HydrationPreset[] = [
  { label: 'Sandwich', hydration: 65, description: 'Tight crumb, easy to slice' },
  { label: 'Classic', hydration: 72, description: 'Balanced open crumb' },
  { label: 'Rustic', hydration: 78, description: 'More open, airy crumb' },
  { label: 'Ciabatta', hydration: 85, description: 'Very open, large holes' },
];

export function BakersMathCalculator() {
  const [doughWeight, setDoughWeight] = useState('900');
  const [hydration, setHydration] = useState(72);
  const [saltPct, setSaltPct] = useState('2');
  const [starterPct, setStarterPct] = useState('20');

  const targetWeight = parseFloat(doughWeight) || 0;
  const hydrationDec = hydration / 100;
  const saltDec = (parseFloat(saltPct) || 0) / 100;
  const starterDec = (parseFloat(starterPct) || 0) / 100;

  // Starter is typically 100% hydration (equal parts flour and water)
  // So starter contributes half its weight as flour and half as water
  // Total flour = base flour + starter flour
  // Total water = base water + starter water
  //
  // Let F = base flour weight
  // F + (starterDec * F)/2 = total flour
  // hydrationDec * (F + (starterDec * F)/2) = total water
  // But total water = base water + (starterDec * F)/2
  //
  // Simpler: express everything relative to total flour weight
  // totalFlour = F_total (100%)
  // water = hydration% of F_total
  // salt = salt% of F_total
  // starter = starter% of F_total
  //
  // Total dough = F_total + water + salt + starter
  // Total dough = F_total * (1 + hydration + salt + starter)
  // F_total = doughWeight / (1 + hydration + salt + starter)

  const divisor = 1 + hydrationDec + saltDec + starterDec;
  const flourWeight = divisor > 0 ? targetWeight / divisor : 0;
  const waterWeight = flourWeight * hydrationDec;
  const saltWeight = flourWeight * saltDec;
  const starterWeight = flourWeight * starterDec;

  const formatWeight = (n: number) => {
    if (n === 0) return '0g';
    if (n >= 10) return `${Math.round(n)}g`;
    return `${n.toFixed(1)}g`;
  };

  const selectPreset = (preset: HydrationPreset) => {
    setHydration(preset.hydration);
  };

  return (
    <View>
      <View style={styles.calcCard}>
        <Text style={styles.calcTitle}>Target Dough</Text>

        {/* Dough weight input */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Total dough weight</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={doughWeight}
              onChangeText={setDoughWeight}
              keyboardType="numeric"
              placeholder="900"
              placeholderTextColor={colors.textMuted}
              selectTextOnFocus
            />
            <Text style={styles.inputSuffix}>g</Text>
          </View>
        </View>

        {/* Hydration slider */}
        <Text style={styles.sliderTitle}>Hydration</Text>
        <View style={styles.sliderRow}>
          <Slider
            style={styles.slider}
            minimumValue={55}
            maximumValue={95}
            value={hydration}
            onValueChange={(v) => setHydration(Math.round(v))}
            minimumTrackTintColor={colors.golden}
            maximumTrackTintColor={colors.borderDark}
            thumbTintColor={colors.golden}
            step={1}
          />
          <Text style={styles.sliderValue}>{hydration}%</Text>
        </View>

        {/* Hydration presets */}
        <View style={styles.presetRow}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.label}
              style={[styles.presetChip, hydration === p.hydration && styles.presetChipActive]}
              onPress={() => selectPreset(p)}
            >
              <Text style={[styles.presetChipText, hydration === p.hydration && styles.presetChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {PRESETS.find((p) => p.hydration === hydration) && (
          <Text style={styles.presetDescription}>
            {PRESETS.find((p) => p.hydration === hydration)!.description}
          </Text>
        )}

        {/* Salt and starter % inputs */}
        <View style={styles.pctRow}>
          <View style={styles.pctInput}>
            <Text style={styles.pctLabel}>Salt %</Text>
            <View style={styles.pctInputWrap}>
              <TextInput
                style={styles.pctField}
                value={saltPct}
                onChangeText={setSaltPct}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={styles.pctSuffix}>%</Text>
            </View>
          </View>
          <View style={styles.pctInput}>
            <Text style={styles.pctLabel}>Starter %</Text>
            <View style={styles.pctInputWrap}>
              <TextInput
                style={styles.pctField}
                value={starterPct}
                onChangeText={setStarterPct}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={styles.pctSuffix}>%</Text>
            </View>
          </View>
        </View>

        {/* Results */}
        <Text style={styles.resultsTitle}>Ingredient Weights</Text>
        <View style={styles.resultsList}>
          <View style={styles.resultRow}>
            <View style={styles.resultDot} />
            <Text style={styles.resultName}>Flour</Text>
            <Text style={styles.resultPct}>100%</Text>
            <Text style={styles.resultWeight}>{formatWeight(flourWeight)}</Text>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.resultDot, styles.resultDotWater]} />
            <Text style={styles.resultName}>Water</Text>
            <Text style={styles.resultPct}>{hydration}%</Text>
            <Text style={styles.resultWeight}>{formatWeight(waterWeight)}</Text>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.resultDot, styles.resultDotSalt]} />
            <Text style={styles.resultName}>Salt</Text>
            <Text style={styles.resultPct}>{saltPct}%</Text>
            <Text style={styles.resultWeight}>{formatWeight(saltWeight)}</Text>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.resultDot, styles.resultDotStarter]} />
            <Text style={styles.resultName}>Starter</Text>
            <Text style={styles.resultPct}>{starterPct}%</Text>
            <Text style={styles.resultWeight}>{formatWeight(starterWeight)}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalWeight}>{formatWeight(flourWeight + waterWeight + saltWeight + starterWeight)}</Text>
        </View>

        <Text style={styles.hint}>
          All percentages are relative to total flour weight (baker's percentages).
          Starter assumed to be 100% hydration.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calcCard: {
    backgroundColor: colors.bgDark,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    marginBottom: spacing.lg,
  },
  calcTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.golden,
    marginBottom: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.mono,
    fontSize: 22,
    color: colors.golden,
    minWidth: 80,
    textAlign: 'center',
  },
  inputSuffix: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.golden,
    marginLeft: spacing.sm,
    opacity: 0.7,
  },
  sliderTitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textLight,
    opacity: 0.7,
    marginBottom: spacing.sm,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    fontFamily: fonts.mono,
    fontSize: 22,
    color: colors.golden,
    minWidth: 56,
    textAlign: 'right',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  presetChipActive: {
    backgroundColor: colors.golden,
    borderColor: colors.golden,
  },
  presetChipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textLight,
  },
  presetChipTextActive: {
    color: colors.bgDark,
  },
  presetDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textLight,
    opacity: 0.7,
    marginBottom: spacing.xl,
  },
  pctRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  pctInput: {
    flex: 1,
  },
  pctLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textLight,
    opacity: 0.7,
    marginBottom: spacing.sm,
  },
  pctInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pctField: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.golden,
    textAlign: 'center',
  },
  pctSuffix: {
    fontFamily: fonts.mono,
    fontSize: 16,
    color: colors.golden,
    marginLeft: spacing.sm,
    opacity: 0.7,
  },
  resultsTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.golden,
    marginBottom: spacing.md,
  },
  resultsList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(232, 168, 73, 0.1)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  resultDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.golden,
  },
  resultDotWater: {
    backgroundColor: '#5BA4CF',
  },
  resultDotSalt: {
    backgroundColor: '#B8B8B8',
  },
  resultDotStarter: {
    backgroundColor: '#8BC34A',
  },
  resultName: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textLight,
  },
  resultPct: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.6,
    minWidth: 44,
    textAlign: 'right',
  },
  resultWeight: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.golden,
    minWidth: 60,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 168, 73, 0.2)',
    marginBottom: spacing.lg,
  },
  totalLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textLight,
  },
  totalWeight: {
    fontFamily: fonts.mono,
    fontSize: 22,
    color: colors.golden,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    opacity: 0.5,
    lineHeight: 18,
  },
});
