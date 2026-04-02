import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { CommonEquipment } from '../components/CommonEquipment';
import { colors, spacing } from '../constants/theme';

export function EquipmentScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <CommonEquipment />
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
