import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { StarterFeedingCalculator } from '../components/StarterFeedingCalculator';
import { colors, spacing } from '../constants/theme';

export function StarterFeedingScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StarterFeedingCalculator />
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
