import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

type ResourcesStackParamList = {
  ResourcesMain: undefined;
  ProofingCalculator: undefined;
  StarterFeeding: undefined;
  BakersMath: undefined;
  Glossary: undefined;
  Equipment: undefined;
  GettingStarted: undefined;
};

type Nav = NativeStackNavigationProp<ResourcesStackParamList, 'ResourcesMain'>;

const RESOURCES = [
  {
    key: 'ProofingCalculator' as const,
    icon: '🌡',
    title: 'Proofing Calculator',
    description: 'Estimate proof time based on dough temperature',
  },
  {
    key: 'StarterFeeding' as const,
    icon: '🫙',
    title: 'Starter Feeding Calculator',
    description: 'Calculate flour and water for common feeding ratios',
  },
  {
    key: 'BakersMath' as const,
    icon: '📐',
    title: "Baker's Math",
    description: "Calculate ingredient weights from baker's percentages",
  },
  {
    key: 'Glossary' as const,
    icon: '📚',
    title: 'Sourdough Glossary',
    description: 'Common terms and techniques explained',
  },
  {
    key: 'Equipment' as const,
    icon: '🍳',
    title: 'Common Equipment',
    description: 'Essential tools every sourdough baker needs',
  },
  {
    key: 'GettingStarted' as const,
    icon: '🎓',
    title: 'Getting Started',
    description: 'A guided tutorial for beginner sourdough bakers',
  },
];

export function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.brandHeader}>
        <Text style={styles.brandTitle}>Knead to Know</Text>
        <Text style={styles.brandSubtitle}>SOURDOUGH COMPANION</Text>
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>Resources</Text>
        <Text style={styles.subtitle}>Tools and references for your baking journey</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {RESOURCES.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.card}
            onPress={() => nav.navigate(item.key)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{item.icon}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
              <Text style={styles.cardChevron}>›</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  brandHeader: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  brandTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
  },
  brandSubtitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: 4,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
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
    fontSize: 14,
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  cardChevron: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.amber,
  },
});
