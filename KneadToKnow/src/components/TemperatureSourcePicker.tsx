import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TEMPERATURE_PROVIDERS, TemperatureSource } from '../services/temperatureProvider';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

interface TemperatureSourcePickerProps {
  selectedSource: TemperatureSource;
  onSelect: (source: TemperatureSource) => void;
}

export function TemperatureSourcePicker({ selectedSource, onSelect }: TemperatureSourcePickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Temperature Source</Text>
      <Text style={styles.hint}>
        Choose how the proofing calculator gets your ambient temperature.
      </Text>

      {TEMPERATURE_PROVIDERS.map((provider) => {
        const isSelected = selectedSource === provider.source;
        return (
          <TouchableOpacity
            key={provider.source}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => onSelect(provider.source)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.radioOuter}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.icon}>{provider.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, isSelected && styles.nameSelected]}>
                  {provider.name}
                </Text>
              </View>
              {provider.source === 'weather' && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}
            </View>
            <Text style={styles.description}>{provider.description}</Text>
          </TouchableOpacity>
        );
      })}

      {selectedSource === 'weather' && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            The weather-based estimate adds +3°F to the outdoor temperature to approximate a typical indoor environment. You can adjust this offset in your preferences.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm + 2,
  },
  cardSelected: {
    borderColor: colors.amber,
    backgroundColor: colors.cream,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.amber,
  },
  icon: {
    fontSize: 20,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  nameSelected: {
    color: colors.amber,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginLeft: 50,
  },
  recommendedBadge: {
    backgroundColor: '#EAF3DE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recommendedText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: '#3B6D11',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoBox: {
    backgroundColor: colors.cream,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  infoText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.amber,
    lineHeight: 17,
  },
});
