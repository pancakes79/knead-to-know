import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRecipes } from '../hooks/useRecipes';
import { useAuth } from '../hooks/useAuth';
import { toggleRecipeSharing } from '../services/cloudApi';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';
import { RecipeStackParamList } from '../types';

type RouteType = RouteProp<RecipeStackParamList, 'RecipeDetail'>;
type NavType = NativeStackNavigationProp<RecipeStackParamList, 'RecipeDetail'>;

export function RecipeDetailScreen() {
  const route = useRoute<RouteType>();
  const nav = useNavigation<NavType>();
  const { getRecipe, updateRecipe, saveToMyRecipes } = useRecipes();
  const { user } = useAuth();
  const recipe = getRecipe(route.params.recipeId);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');
  const [sharing, setSharing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isOwner = recipe && user && recipe.ownerId === user.uid;

  const handleToggleShare = useCallback(async () => {
    if (!recipe) return;
    const newVisibility = recipe.visibility === 'shared' ? 'private' : 'shared';
    const action = newVisibility === 'shared' ? 'share' : 'unshare';

    Alert.alert(
      newVisibility === 'shared' ? 'Share Recipe' : 'Make Private',
      newVisibility === 'shared'
        ? 'This recipe will be visible to all users in the community.'
        : 'This recipe will only be visible to you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newVisibility === 'shared' ? 'Share' : 'Make Private',
          onPress: async () => {
            setSharing(true);
            try {
              await toggleRecipeSharing(recipe.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || `Failed to ${action} recipe.`);
            } finally {
              setSharing(false);
            }
          },
        },
      ]
    );
  }, [recipe]);

  const handleSaveToMyRecipes = useCallback(async () => {
    if (!recipe) return;
    setSaving(true);
    try {
      await saveToMyRecipes(recipe);
      Alert.alert('Saved!', 'Recipe has been added to your collection.');
      nav.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save recipe.');
    } finally {
      setSaving(false);
    }
  }, [recipe, saveToMyRecipes, nav]);

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Recipe not found.</Text>
      </View>
    );
  }

  const tabs = [
    { key: 'ingredients' as const, label: 'Ingredients' },
    { key: 'steps' as const, label: 'Steps' },
  ];

  return (
    <View style={styles.container}>
      {/* Recipe header */}
      <View style={styles.header}>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <Text style={styles.recipeSource}>{recipe.source}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{recipe.ingredients.length} ingredients</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{recipe.steps.length} steps</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => nav.navigate('ActiveBake', { recipeId: recipe.id })}
        >
          <Text style={styles.startButtonText}>Start Baking</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => nav.navigate('BakeLog', { recipeId: recipe.id })}
        >
          <Text style={styles.logButtonText}>Bake Log</Text>
        </TouchableOpacity>
      </View>

      {/* Edit / Share / Save to My Recipes */}
      {isOwner && (
        <View style={styles.ownerActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => nav.navigate('EditRecipe', { recipeId: recipe.id })}
          >
            <Text style={styles.editButtonText}>Edit Recipe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareButton, sharing && styles.shareButtonDisabled]}
            onPress={handleToggleShare}
            disabled={sharing}
          >
            <Text style={styles.shareButtonText}>
              {sharing
                ? 'Updating...'
                : recipe.visibility === 'shared'
                  ? 'Make Private'
                  : 'Share with Community'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {!isOwner && (
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveToMyRecipes}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save to My Recipes'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
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

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'ingredients' && (
          <View style={styles.listSection}>
            <Text style={styles.listHint}>
              Everything you'll need for this bake:
            </Text>
            {recipe.ingredients.map((ing, i) => (
              <View key={ing.id} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listItemText}>{ing.text}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'steps' && (
          <View style={styles.listSection}>
            <Text style={styles.listHint}>
              Tap "Start Baking" above for interactive checklists and timers.
            </Text>
            {recipe.steps.map((step, i) => (
              <View key={step.id} style={styles.stepItem}>
                <View style={[
                  styles.stepNumber,
                  step.type === 'stretch_folds' && styles.stepNumberStretch,
                  step.type === 'proof' && styles.stepNumberProof,
                ]}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listItemText}>{step.text}</Text>
                  {step.type === 'stretch_folds' && (
                    <Text style={styles.stepTag}>⌛ Includes 4 stretch & folds with 30-min timers</Text>
                  )}
                  {step.type === 'proof' && (
                    <Text style={styles.stepTag}>🌡 Use the proofing calculator for timing</Text>
                  )}
                </View>
              </View>
            ))}
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
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  recipeName: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  recipeSource: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  metaDot: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  startButton: {
    flex: 1,
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  startButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#fff',
  },
  logButton: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  logButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textSecondary,
  },
  ownerActions: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  editButton: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  editButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  shareButton: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.amber,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.amber,
  },
  saveButton: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: '#fff',
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
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.amber,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  listSection: {
    paddingTop: spacing.lg,
  },
  listHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.golden,
  },
  listItemText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberStretch: {
    backgroundColor: colors.amber,
  },
  stepNumberProof: {
    backgroundColor: colors.golden,
  },
  stepNumberText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: '#fff',
  },
  stepTag: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.amber,
    marginTop: 4,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.xxxl,
  },
});
