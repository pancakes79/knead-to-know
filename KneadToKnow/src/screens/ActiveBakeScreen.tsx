import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useRecipes } from '../hooks/useRecipes';
import { StretchFoldTracker } from '../components/StretchFoldTracker';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';
import { RecipeStackParamList } from '../types';

type RouteType = RouteProp<RecipeStackParamList, 'ActiveBake'>;

type ActiveTab = 'ingredients' | 'steps';

export function ActiveBakeScreen() {
  const route = useRoute<RouteType>();
  const { getRecipe } = useRecipes();

  // If opened from tab (no params), show a placeholder
  const recipeId = route.params?.recipeId;
  const recipe = recipeId ? getRecipe(recipeId) : null;

  const [activeTab, setActiveTab] = useState<ActiveTab>('ingredients');
  const [ingredientChecks, setIngredientChecks] = useState<Record<string, boolean>>({});
  const [stepChecks, setStepChecks] = useState<Record<string, boolean>>({});

  const toggleIngredient = useCallback((id: string) => {
    setIngredientChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleStep = useCallback((id: string) => {
    setStepChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (!recipe) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🍞</Text>
        <Text style={styles.emptyTitle}>No Active Bake</Text>
        <Text style={styles.emptyText}>
          Go to a recipe and tap "Start Baking" to begin tracking your bake here.
        </Text>
      </View>
    );
  }

  const ingredientsDone = recipe.ingredients.filter((i) => ingredientChecks[i.id]).length;
  const stepsDone = recipe.steps.filter((s) => stepChecks[s.id]).length;

  return (
    <View style={styles.container}>
      {/* Recipe name + progress */}
      <View style={styles.header}>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Ingredients</Text>
            <Text style={styles.progressValue}>
              {ingredientsDone}/{recipe.ingredients.length}
            </Text>
          </View>
          <View style={styles.progressDivider} />
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Steps</Text>
            <Text style={styles.progressValue}>
              {stepsDone}/{recipe.steps.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {([
          { key: 'ingredients' as const, label: `Ingredients (${ingredientsDone}/${recipe.ingredients.length})` },
          { key: 'steps' as const, label: `Steps (${stepsDone}/${recipe.steps.length})` },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Ingredients Checklist ── */}
        {activeTab === 'ingredients' && (
          <View style={styles.section}>
            <Text style={styles.sectionHint}>Check off ingredients as you gather them.</Text>
            {recipe.ingredients.map((ing) => {
              const checked = !!ingredientChecks[ing.id];
              return (
                <TouchableOpacity
                  key={ing.id}
                  style={[styles.checkItem, checked && styles.checkItemDone]}
                  onPress={() => toggleIngredient(ing.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxDone]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.checkText, checked && styles.checkTextDone]}>
                    {ing.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Steps Checklist ── */}
        {activeTab === 'steps' && (
          <View style={styles.section}>
            <Text style={styles.sectionHint}>Follow each step. Timers are built in.</Text>
            {recipe.steps.map((step) => {
              const checked = !!stepChecks[step.id];

              // Stretch & Folds — special component
              if (step.type === 'stretch_folds') {
                return <StretchFoldTracker key={step.id} />;
              }

              // Proofing step — with note
              if (step.type === 'proof') {
                return (
                  <TouchableOpacity
                    key={step.id}
                    style={[styles.checkItem, styles.checkItemProof, checked && styles.checkItemDone]}
                    onPress={() => toggleStep(step.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, styles.checkboxProof, checked && styles.checkboxDone]}>
                      {checked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.checkText, checked && styles.checkTextDone]}>
                        {step.text}
                      </Text>
                      <Text style={styles.proofHint}>
                        🌡 Use the Proofing tab for timing guidance
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }

              // Normal step
              return (
                <TouchableOpacity
                  key={step.id}
                  style={[styles.checkItem, checked && styles.checkItemDone]}
                  onPress={() => toggleStep(step.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxDone]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.checkText, checked && styles.checkTextDone]}>
                    {step.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  recipeName: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  progressItem: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  progressLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  progressValue: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.textPrimary,
  },
  progressDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.amber,
  },
  tabText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.amber,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  section: {
    paddingTop: spacing.lg,
  },
  sectionHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md + 2,
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  checkItemProof: {
    backgroundColor: colors.cream,
    borderColor: colors.warningBorder,
  },
  checkItemDone: {
    backgroundColor: colors.checkedBg,
    borderColor: colors.checkedBorder,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.unchecked,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxProof: {
    borderColor: colors.amber,
  },
  checkboxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  checkTextDone: {
    color: colors.checkedText,
    textDecorationLine: 'line-through',
  },
  proofHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.amber,
    marginTop: 4,
  },
});
