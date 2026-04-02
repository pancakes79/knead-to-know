import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ProofingCalculator } from '../components/ProofingCalculator';
import { colors, spacing } from '../constants/theme';

export function ProofingCalculatorScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ProofingCalculator />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
});
