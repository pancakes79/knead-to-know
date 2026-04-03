import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { BakersMathCalculator } from '../components/BakersMathCalculator';
import { colors, spacing } from '../constants/theme';

export function BakersMathScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <BakersMathCalculator />
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
