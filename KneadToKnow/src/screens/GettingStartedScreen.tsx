import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { GettingStartedGuide } from '../components/GettingStartedGuide';
import { colors, spacing } from '../constants/theme';

export function GettingStartedScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <GettingStartedGuide />
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
