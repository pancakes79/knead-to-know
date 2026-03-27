import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRecipes } from '../hooks/useRecipes';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';
import { RecipeStackParamList, Ingredient, RecipeStep } from '../types';

type RouteType = RouteProp<RecipeStackParamList, 'EditRecipe'>;
type NavType = NativeStackNavigationProp<RecipeStackParamList, 'EditRecipe'>;

export function EditRecipeScreen() {
  const route = useRoute<RouteType>();
  const nav = useNavigation<NavType>();
  const { getRecipe, updateRecipe } = useRecipes();
  const recipe = getRecipe(route.params.recipeId);

  const [name, setName] = useState(recipe?.name || '');
  const [source, setSource] = useState(recipe?.source || '');
  const [ingredientTexts, setIngredientTexts] = useState<string[]>(
    recipe?.ingredients
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => i.text) || ['']
  );
  const [stepTexts, setStepTexts] = useState<string[]>(
    recipe?.steps
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => s.text) || ['']
  );
  const [stepTypes, setStepTypes] = useState<('step' | 'stretch_folds' | 'proof')[]>(
    recipe?.steps
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => s.type) || ['step']
  );
  const [saving, setSaving] = useState(false);

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Recipe not found.</Text>
      </View>
    );
  }

  // ─── Ingredient helpers ───

  const updateIngredient = (index: number, text: string) => {
    const updated = [...ingredientTexts];
    updated[index] = text;
    setIngredientTexts(updated);
  };

  const addIngredient = () => {
    setIngredientTexts([...ingredientTexts, '']);
  };

  const removeIngredient = (index: number) => {
    if (ingredientTexts.length <= 1) return;
    setIngredientTexts(ingredientTexts.filter((_, i) => i !== index));
  };

  // ─── Step helpers ───

  const updateStep = (index: number, text: string) => {
    const updated = [...stepTexts];
    updated[index] = text;
    setStepTexts(updated);
  };

  const cycleStepType = (index: number) => {
    const updated = [...stepTypes];
    const cycle: ('step' | 'stretch_folds' | 'proof')[] = ['step', 'stretch_folds', 'proof'];
    const current = cycle.indexOf(updated[index]);
    updated[index] = cycle[(current + 1) % cycle.length];
    setStepTypes(updated);
  };

  const addStep = () => {
    setStepTexts([...stepTexts, '']);
    setStepTypes([...stepTypes, 'step']);
  };

  const removeStep = (index: number) => {
    if (stepTexts.length <= 1) return;
    setStepTexts(stepTexts.filter((_, i) => i !== index));
    setStepTypes(stepTypes.filter((_, i) => i !== index));
  };

  // ─── Save ───

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a recipe name.');
      return;
    }

    const filteredIngredients = ingredientTexts.filter((t) => t.trim());
    const filteredSteps = stepTexts.filter((t) => t.trim());

    if (filteredIngredients.length === 0) {
      Alert.alert('No Ingredients', 'Please add at least one ingredient.');
      return;
    }

    if (filteredSteps.length === 0) {
      Alert.alert('No Steps', 'Please add at least one step.');
      return;
    }

    setSaving(true);
    try {
      const ingredients: Ingredient[] = filteredIngredients.map((text, i) => ({
        id: `i${i + 1}`,
        text: text.trim(),
        sortOrder: i,
      }));

      // Map step types correctly (skip empty steps)
      let stepTypeIndex = 0;
      const steps: RecipeStep[] = filteredSteps.map((text, i) => {
        // Find the original index in the unfiltered array
        while (stepTypeIndex < stepTexts.length && !stepTexts[stepTypeIndex].trim()) {
          stepTypeIndex++;
        }
        const type = stepTypes[stepTypeIndex] || 'step';
        stepTypeIndex++;

        return {
          id: `s${i + 1}`,
          text: text.trim(),
          type,
          sortOrder: i,
        };
      });

      await updateRecipe(recipe.id, {
        name: name.trim(),
        source: source.trim(),
        ingredients,
        steps,
      });

      Alert.alert('Saved!', 'Recipe has been updated.', [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save recipe.');
    } finally {
      setSaving(false);
    }
  }, [name, source, ingredientTexts, stepTexts, stepTypes, recipe, updateRecipe, nav]);

  const stepTypeLabel = (type: 'step' | 'stretch_folds' | 'proof') => {
    switch (type) {
      case 'stretch_folds': return 'Fold';
      case 'proof': return 'Proof';
      default: return 'Step';
    }
  };

  const stepTypeColor = (type: 'step' | 'stretch_folds' | 'proof') => {
    switch (type) {
      case 'stretch_folds': return colors.amber;
      case 'proof': return colors.golden;
      default: return colors.borderLight;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Recipe Name */}
        <Text style={styles.label}>Recipe Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Recipe name"
          placeholderTextColor={colors.textMuted}
        />

        {/* Source */}
        <Text style={styles.label}>Source</Text>
        <TextInput
          style={styles.input}
          value={source}
          onChangeText={setSource}
          placeholder="Where this recipe came from"
          placeholderTextColor={colors.textMuted}
        />

        {/* Ingredients */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <TouchableOpacity style={styles.addItemButton} onPress={addIngredient}>
            <Text style={styles.addItemText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {ingredientTexts.map((text, index) => (
          <View key={`ing-${index}`} style={styles.editableRow}>
            <View style={styles.bullet} />
            <TextInput
              style={styles.rowInput}
              value={text}
              onChangeText={(t) => updateIngredient(index, t)}
              placeholder="e.g. 500g bread flour"
              placeholderTextColor={colors.textMuted}
            />
            {ingredientTexts.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeIngredient(index)}
              >
                <Text style={styles.removeButtonText}>X</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Steps */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Steps</Text>
          <TouchableOpacity style={styles.addItemButton} onPress={addStep}>
            <Text style={styles.addItemText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {stepTexts.map((text, index) => (
          <View key={`step-${index}`} style={styles.stepEditRow}>
            <TouchableOpacity
              style={[styles.stepTypeBadge, { backgroundColor: stepTypeColor(stepTypes[index]) }]}
              onPress={() => cycleStepType(index)}
            >
              <Text style={styles.stepTypeBadgeText}>{stepTypeLabel(stepTypes[index])}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.stepInput}
              value={text}
              onChangeText={(t) => updateStep(index, t)}
              placeholder="Describe this step..."
              placeholderTextColor={colors.textMuted}
              multiline
            />
            {stepTexts.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeStep(index)}
              >
                <Text style={styles.removeButtonText}>X</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <Text style={styles.hint}>
          Tap the step type badge (Step/Fold/Proof) to cycle between types. This controls timers during active bakes.
        </Text>

        {/* Save / Cancel */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => nav.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md + 2,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
  },
  addItemButton: {
    backgroundColor: colors.cream,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  addItemText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.amber,
  },
  editableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.golden,
  },
  rowInput: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FCEBEB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F7C1C1',
  },
  removeButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: '#A32D2D',
  },
  stepEditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepTypeBadge: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.md,
    minWidth: 50,
    alignItems: 'center',
  },
  stepTypeBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: '#fff',
  },
  stepInput: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#fff',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.xxxl,
  },
});
