import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRecipes } from '../hooks/useRecipes';
import { useActiveBake, ActiveBake } from '../hooks/useActiveBake';
import { StretchFoldTracker } from '../components/StretchFoldTracker';
import { CountdownTimer } from '../components/CountdownTimer';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

type ActiveTab = 'ingredients' | 'steps';

function formatElapsed(start: Date): string {
  const ms = Date.now() - start.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

// ─── Bake Picker (shown when multiple bakes or none selected) ───

function BakePicker({
  bakes,
  onSelect,
}: {
  bakes: ActiveBake[];
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.pickerContainer}>
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerTitle}>Active Bakes</Text>
        <Text style={styles.pickerSubtitle}>
          {bakes.length} bake{bakes.length !== 1 ? 's' : ''} in progress
        </Text>
      </View>
      <FlatList
        data={bakes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.pickerList}
        renderItem={({ item }) => {
          const ingredientCount = Object.values(item.ingredientChecks).filter(Boolean).length;
          const stepCount = Object.values(item.stepChecks).filter(Boolean).length;

          return (
            <TouchableOpacity
              style={styles.bakeCard}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.bakeCardName}>{item.recipeName}</Text>
              <View style={styles.bakeCardMeta}>
                <Text style={styles.bakeCardMetaText}>
                  Started {formatElapsed(item.startedAt)}
                </Text>
                <Text style={styles.bakeCardDot}>·</Text>
                <Text style={styles.bakeCardMetaText}>
                  {ingredientCount} ing · {stepCount} steps done
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

// ─── Active Bake Detail ───

function BakeDetail({
  bake,
  onFinish,
  onBack,
  showBackButton,
}: {
  bake: ActiveBake;
  onFinish: () => void;
  onBack: () => void;
  showBackButton: boolean;
}) {
  const { getRecipe } = useRecipes();
  const { toggleIngredient, toggleStep } = useActiveBake();
  const [activeTab, setActiveTab] = useState<ActiveTab>('ingredients');

  const recipe = getRecipe(bake.recipeId);
  if (!recipe) return null;

  const ingredientChecks = bake.ingredientChecks;
  const stepChecks = bake.stepChecks;
  const ingredientsDone = recipe.ingredients.filter((i) => ingredientChecks[i.id]).length;
  const stepsDone = recipe.steps.filter((s) => stepChecks[s.id]).length;
  const allStepsDone = stepsDone === recipe.steps.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {showBackButton && (
          <TouchableOpacity style={styles.backRow} onPress={onBack}>
            <Text style={styles.backText}>‹ All Bakes</Text>
          </TouchableOpacity>
        )}
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
        {/* Ingredients Checklist */}
        {activeTab === 'ingredients' && (
          <View style={styles.section}>
            <Text style={styles.sectionHint}>Check off ingredients as you gather them.</Text>
            {recipe.ingredients.map((ing) => {
              const checked = !!ingredientChecks[ing.id];
              return (
                <TouchableOpacity
                  key={ing.id}
                  style={[styles.checkItem, checked && styles.checkItemDone]}
                  onPress={() => toggleIngredient(bake.id, ing.id)}
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

        {/* Steps Checklist */}
        {activeTab === 'steps' && (
          <View style={styles.section}>
            <Text style={styles.sectionHint}>Follow each step. Timers are built in.</Text>
            {recipe.steps.map((step) => {
              const checked = !!stepChecks[step.id];

              if (step.type === 'stretch_folds') {
                return <StretchFoldTracker key={step.id} />;
              }

              if (step.type === 'proof') {
                return (
                  <TouchableOpacity
                    key={step.id}
                    style={[styles.checkItem, styles.checkItemProof, checked && styles.checkItemDone]}
                    onPress={() => toggleStep(bake.id, step.id)}
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

              return (
                <TouchableOpacity
                  key={step.id}
                  style={[styles.checkItem, checked && styles.checkItemDone]}
                  onPress={() => toggleStep(bake.id, step.id)}
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

            {/* Finish Bake button */}
            <TouchableOpacity
              style={[styles.finishButton, !allStepsDone && styles.finishButtonInactive]}
              onPress={onFinish}
            >
              <Text style={[styles.finishButtonText, !allStepsDone && styles.finishButtonTextInactive]}>
                Finish Bake
              </Text>
            </TouchableOpacity>
            {!allStepsDone && (
              <Text style={styles.finishHint}>
                Complete all steps to finish, or tap to finish early.
              </Text>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ───

export function ActiveBakeScreen() {
  const nav = useNavigation<any>();
  const { activeBakes, selectedBakeId, selectedBake, selectBake, endBake } = useActiveBake();

  const handleFinish = useCallback((bake: ActiveBake) => {
    Alert.alert(
      'Finish Bake',
      'Are you sure you want to finish this bake?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: () => {
            const recipeId = bake.recipeId;
            endBake(bake.id);
            nav.navigate('BakeComplete', { recipeId });
          },
        },
      ]
    );
  }, [endBake, nav]);

  const handleBack = useCallback(() => {
    selectBake('');
  }, [selectBake]);

  // No active bakes
  if (activeBakes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🍞</Text>
        <Text style={styles.emptyTitle}>No Active Bakes</Text>
        <Text style={styles.emptyText}>
          Go to a recipe and tap "Start Baking" to begin tracking your bake here.
        </Text>
      </View>
    );
  }

  // Single active bake — go straight to it
  if (activeBakes.length === 1) {
    const bake = activeBakes[0];
    return (
      <BakeDetail
        bake={bake}
        onFinish={() => handleFinish(bake)}
        onBack={handleBack}
        showBackButton={false}
      />
    );
  }

  // Multiple bakes — show picker or selected bake
  if (selectedBake) {
    return (
      <BakeDetail
        bake={selectedBake}
        onFinish={() => handleFinish(selectedBake)}
        onBack={handleBack}
        showBackButton={true}
      />
    );
  }

  return <BakePicker bakes={activeBakes} onSelect={selectBake} />;
}

const styles = StyleSheet.create({
  // ─── Picker ───
  pickerContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  pickerHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  pickerTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pickerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  pickerList: {
    paddingHorizontal: spacing.xl,
  },
  bakeCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  bakeCardName: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  bakeCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bakeCardMetaText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  bakeCardDot: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },

  // ─── Empty ───
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

  // ─── Bake Detail ───
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backRow: {
    marginBottom: spacing.sm,
  },
  backText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.amber,
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
  finishButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  finishButtonInactive: {
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  finishButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },
  finishButtonTextInactive: {
    color: colors.textMuted,
  },
  finishHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
