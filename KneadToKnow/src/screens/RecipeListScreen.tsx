import React, { useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRecipes } from '../hooks/useRecipes';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';
import { RecipeStackParamList, Recipe } from '../types';

type Nav = NativeStackNavigationProp<RecipeStackParamList, 'RecipeList'>;

function RecipeCard({ recipe, isCommunity }: { recipe: Recipe; isCommunity?: boolean }) {
  const nav = useNavigation<Nav>();

  return (
    <TouchableOpacity
      style={[styles.card, isCommunity && styles.cardCommunity]}
      onPress={() => nav.navigate('RecipeDetail', { recipeId: recipe.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{recipe.name}</Text>
          <Text style={styles.cardSource}>{recipe.source}</Text>
        </View>
        {recipe.visibility === 'shared' && !isCommunity && (
          <View style={styles.sharedBadge}>
            <Text style={styles.sharedBadgeText}>Shared</Text>
          </View>
        )}
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.cardMetaText}>
          {recipe.ingredients.length} ingredients
        </Text>
        <Text style={styles.cardMetaDot}>·</Text>
        <Text style={styles.cardMetaText}>{recipe.steps.length} steps</Text>
      </View>
    </TouchableOpacity>
  );
}

type SectionData = { title: string; data: Recipe[]; isCommunity: boolean };

export function RecipeListScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { recipes, communityRecipes, loading } = useRecipes();
  const [showCommunity, setShowCommunity] = useState(true);

  const sections: SectionData[] = [
    { title: 'My Recipes', data: recipes, isCommunity: false },
    ...(showCommunity && communityRecipes.length > 0
      ? [{ title: 'Community Recipes', data: communityRecipes, isCommunity: true }]
      : []),
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Knead{'\n'}to Know</Text>
        <Text style={styles.subtitle}>SOURDOUGH COMPANION</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, section }) => (
          <RecipeCard recipe={item} isCommunity={(section as SectionData).isCommunity} />
        )}
        renderSectionHeader={({ section }) => {
          const s = section as SectionData;
          return (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              {s.title === 'My Recipes' && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => nav.navigate('ImportRecipe')}
                >
                  <Text style={styles.addButtonText}>+ Add Recipe</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        renderSectionFooter={({ section }) => {
          const s = section as SectionData;
          if (s.data.length === 0 && s.title === 'My Recipes') {
            return (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  No recipes yet. Tap "+ Add Recipe" to import one!
                </Text>
              </View>
            );
          }
          return null;
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.headingHeavy,
    fontSize: 36,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  addButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: '#fff',
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardCommunity: {
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  sharedBadge: {
    backgroundColor: colors.cream,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
  },
  sharedBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.amber,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSource: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  cardMeta: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  cardMetaText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  cardMetaDot: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  empty: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
