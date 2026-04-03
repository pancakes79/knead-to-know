import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SourdoughGlossary } from '../components/SourdoughGlossary';
import { colors, spacing } from '../constants/theme';

export function GlossaryScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SourdoughGlossary />
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
