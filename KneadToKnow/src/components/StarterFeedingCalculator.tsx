import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

interface FeedingRatio {
  label: string;
  description: string;
  starter: number;
  flour: number;
  water: number;
}

const COMMON_RATIOS: FeedingRatio[] = [
  { label: '1:1:1', description: 'Standard maintenance feed', starter: 1, flour: 1, water: 1 },
  { label: '1:2:2', description: 'Moderate feed, good for daily baking', starter: 1, flour: 2, water: 2 },
  { label: '1:3:3', description: 'Slower rise, more developed flavor', starter: 1, flour: 3, water: 3 },
  { label: '1:5:5', description: 'Long ferment, great tang and flavor', starter: 1, flour: 5, water: 5 },
  { label: '1:10:10', description: 'Very slow, ideal for overnight or travel', starter: 1, flour: 10, water: 10 },
];

export function StarterFeedingCalculator() {
  const [starterGrams, setStarterGrams] = useState('25');
  const [selectedRatio, setSelectedRatio] = useState<FeedingRatio>(COMMON_RATIOS[0]);

  const starterAmount = parseFloat(starterGrams) || 0;
  const flourAmount = starterAmount * (selectedRatio.flour / selectedRatio.starter);
  const waterAmount = starterAmount * (selectedRatio.water / selectedRatio.starter);
  const totalAmount = starterAmount + flourAmount + waterAmount;

  const formatWeight = (n: number) => {
    if (n === 0) return '0g';
    return n % 1 === 0 ? `${n}g` : `${n.toFixed(1)}g`;
  };

  return (
    <View>
      {/* Input card */}
      <View style={styles.calcCard}>
        <Text style={styles.calcTitle}>How much starter are you feeding?</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={starterGrams}
            onChangeText={setStarterGrams}
            keyboardType="numeric"
            placeholder="25"
            placeholderTextColor={colors.textMuted}
            selectTextOnFocus
          />
          <Text style={styles.inputUnit}>grams of starter</Text>
        </View>

        {/* Ratio selector */}
        <Text style={styles.ratioLabel}>Select feeding ratio:</Text>
        <View style={styles.ratioList}>
          {COMMON_RATIOS.map((ratio) => (
            <TouchableOpacity
              key={ratio.label}
              style={[styles.ratioChip, selectedRatio.label === ratio.label && styles.ratioChipActive]}
              onPress={() => setSelectedRatio(ratio)}
              activeOpacity={0.7}
            >
              <Text style={[styles.ratioChipText, selectedRatio.label === ratio.label && styles.ratioChipTextActive]}>
                {ratio.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratioDescription}>{selectedRatio.description}</Text>

        {/* Results */}
        <View style={styles.resultsRow}>
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>STARTER</Text>
            <Text style={styles.resultValue}>{formatWeight(starterAmount)}</Text>
          </View>
          <View style={[styles.resultBox, styles.resultBoxHighlight]}>
            <Text style={styles.resultLabel}>FLOUR</Text>
            <Text style={styles.resultValue}>{formatWeight(flourAmount)}</Text>
          </View>
          <View style={[styles.resultBox, styles.resultBoxHighlight]}>
            <Text style={styles.resultLabel}>WATER</Text>
            <Text style={styles.resultValue}>{formatWeight(waterAmount)}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total after feeding:</Text>
          <Text style={styles.totalValue}>{formatWeight(totalAmount)}</Text>
        </View>
      </View>

      {/* Reference chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Common Ratios Reference</Text>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartHeaderText, { flex: 1 }]}>Ratio</Text>
          <Text style={[styles.chartHeaderText, { flex: 2 }]}>Best For</Text>
          <Text style={[styles.chartHeaderText, { flex: 1, textAlign: 'right' }]}>Peak</Text>
        </View>
        {[
          { ratio: '1:1:1', use: 'Quick daily maintenance', peak: '4-6h' },
          { ratio: '1:2:2', use: 'Daily baking, moderate activity', peak: '6-8h' },
          { ratio: '1:3:3', use: 'Slower rise, more flavor', peak: '8-10h' },
          { ratio: '1:5:5', use: 'Overnight feeds', peak: '10-14h' },
          { ratio: '1:10:10', use: 'Travel, skipping a day', peak: '16-24h' },
        ].map((row) => (
          <View
            key={row.ratio}
            style={[
              styles.chartRow,
              selectedRatio.label === row.ratio && styles.chartRowActive,
            ]}
          >
            <Text style={[styles.chartCell, { flex: 1, fontFamily: fonts.mono }, selectedRatio.label === row.ratio && styles.chartCellActive]}>
              {row.ratio}
            </Text>
            <Text style={[styles.chartCell, { flex: 2 }, selectedRatio.label === row.ratio && styles.chartCellActive]}>
              {row.use}
            </Text>
            <Text style={[styles.chartCell, { flex: 1, textAlign: 'right' }, selectedRatio.label === row.ratio && styles.chartCellActive]}>
              {row.peak}
            </Text>
          </View>
        ))}
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
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.mono,
    fontSize: 24,
    color: colors.golden,
    minWidth: 90,
    textAlign: 'center',
  },
  inputUnit: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textLight,
    opacity: 0.8,
  },
  ratioLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textLight,
    opacity: 0.7,
    marginBottom: spacing.sm,
  },
  ratioList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ratioChip: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  ratioChipActive: {
    backgroundColor: colors.golden,
    borderColor: colors.golden,
  },
  ratioChipText: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.textLight,
  },
  ratioChipTextActive: {
    color: colors.bgDark,
    fontFamily: fonts.bodySemiBold,
  },
  ratioDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textLight,
    opacity: 0.7,
    marginBottom: spacing.xl,
  },
  resultsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultBox: {
    flex: 1,
    backgroundColor: 'rgba(232, 168, 73, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 73, 0.15)',
  },
  resultBoxHighlight: {
    backgroundColor: 'rgba(232, 168, 73, 0.2)',
    borderColor: 'rgba(232, 168, 73, 0.3)',
  },
  resultLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    color: colors.textLight,
    letterSpacing: 1,
    marginBottom: 2,
  },
  resultValue: {
    fontFamily: fonts.mono,
    fontSize: 22,
    color: colors.golden,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 168, 73, 0.2)',
  },
  totalLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textLight,
    opacity: 0.7,
  },
  totalValue: {
    fontFamily: fonts.mono,
    fontSize: 20,
    color: colors.golden,
  },
  chartSection: {
    paddingBottom: spacing.lg,
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
