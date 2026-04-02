import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProofingCalculator } from '../components/ProofingCalculator';
import { StarterFeedingCalculator } from '../components/StarterFeedingCalculator';
import { BakersMathCalculator } from '../components/BakersMathCalculator';
import { SourdoughGlossary } from '../components/SourdoughGlossary';
import { CommonEquipment } from '../components/CommonEquipment';
import { GettingStartedGuide } from '../components/GettingStartedGuide';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

type ResourceSection = 'proofing' | 'feeding' | 'bakersMath' | 'glossary' | 'equipment' | 'gettingStarted' | null;

export function ResourcesScreen() {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<ResourceSection>(null);

  const toggle = (section: ResourceSection) => {
    setExpanded((prev) => (prev === section ? null : section));
  };

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
        {/* Proofing Calculator */}
        <TouchableOpacity
          style={[styles.card, expanded === 'proofing' && styles.cardActive]}
          onPress={() => toggle('proofing')}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🌡</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Proofing Calculator</Text>
              <Text style={styles.cardDescription}>Estimate proof time based on dough temperature</Text>
            </View>
            <Text style={styles.cardChevron}>{expanded === 'proofing' ? '▾' : '›'}</Text>
          </View>
        </TouchableOpacity>
        {expanded === 'proofing' && (
          <View style={styles.expandedContent}>
            <ProofingCalculator />
          </View>
        )}

        {/* Starter Feeding Calculator */}
        <TouchableOpacity
          style={[styles.card, expanded === 'feeding' && styles.cardActive]}
          onPress={() => toggle('feeding')}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🫙</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Starter Feeding Calculator</Text>
              <Text style={styles.cardDescription}>Calculate flour and water for common feeding ratios</Text>
            </View>
            <Text style={styles.cardChevron}>{expanded === 'feeding' ? '▾' : '›'}</Text>
          </View>
        </TouchableOpacity>
        {expanded === 'feeding' && (
          <View style={styles.expandedContent}>
            <StarterFeedingCalculator />
          </View>
        )}

        {/* Baker's Math Calculator */}
        <TouchableOpacity
          style={[styles.card, expanded === 'bakersMath' && styles.cardActive]}
          onPress={() => toggle('bakersMath')}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📐</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Baker's Math</Text>
              <Text style={styles.cardDescription}>Calculate ingredient weights from baker's percentages</Text>
            </View>
            <Text style={styles.cardChevron}>{expanded === 'bakersMath' ? '▾' : '›'}</Text>
          </View>
        </TouchableOpacity>
        {expanded === 'bakersMath' && (
          <View style={styles.expandedContent}>
            <BakersMathCalculator />
          </View>
        )}

        {/* Sourdough Glossary */}
        <TouchableOpacity
          style={[styles.card, expanded === 'glossary' && styles.cardActive]}
          onPress={() => toggle('glossary')}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📚</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Sourdough Glossary</Text>
              <Text style={styles.cardDescription}>Common terms and techniques explained</Text>
            </View>
            <Text style={styles.cardChevron}>{expanded === 'glossary' ? '▾' : '›'}</Text>
          </View>
        </TouchableOpacity>
        {expanded === 'glossary' && (
          <View style={styles.expandedContent}>
            <SourdoughGlossary />
          </View>
        )}

        {/* Common Equipment */}
        <TouchableOpacity
          style={[styles.card, expanded === 'equipment' && styles.cardActive]}
          onPress={() => toggle('equipment')}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🍳</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Common Equipment</Text>
              <Text style={styles.cardDescription}>Essential tools every sourdough baker needs</Text>
            </View>
            <Text style={styles.cardChevron}>{expanded === 'equipment' ? '▾' : '›'}</Text>
          </View>
        </TouchableOpacity>
        {expanded === 'equipment' && (
          <View style={styles.expandedContent}>
            <CommonEquipment />
          </View>
        )}

        {/* Getting Started Guide */}
        <TouchableOpacity
          style={[styles.card, expanded === 'gettingStarted' && styles.cardActive]}
          onPress={() => toggle('gettingStarted')}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🎓</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Getting Started</Text>
              <Text style={styles.cardDescription}>A guided tutorial for beginner sourdough bakers</Text>
            </View>
            <Text style={styles.cardChevron}>{expanded === 'gettingStarted' ? '▾' : '›'}</Text>
          </View>
        </TouchableOpacity>
        {expanded === 'gettingStarted' && (
          <View style={styles.expandedContent}>
            <GettingStartedGuide />
          </View>
        )}

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
  cardActive: {
    borderColor: colors.amber,
  },
  cardDisabled: {
    opacity: 0.5,
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
  cardTitleDisabled: {
    color: colors.textMuted,
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
  expandedContent: {
    marginBottom: spacing.md,
  },
});
