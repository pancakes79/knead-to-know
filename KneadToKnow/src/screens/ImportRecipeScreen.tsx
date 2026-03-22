import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useRecipes } from '../hooks/useRecipes';
import { parseRecipeFromUrl, parseRecipeFromText } from '../services/recipeParser';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

type ImportTab = 'url' | 'file' | 'manual';

export function ImportRecipeScreen() {
  const nav = useNavigation();
  const { addRecipe } = useRecipes();
  const [tab, setTab] = useState<ImportTab>('url');
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);

  // Manual entry fields
  const [manualName, setManualName] = useState('');
  const [manualIngredients, setManualIngredients] = useState('');
  const [manualSteps, setManualSteps] = useState('');

  const handleUrlImport = async () => {
    if (!url.trim()) return;
    setImporting(true);
    try {
      const parsed = await parseRecipeFromUrl(url.trim());
      await addRecipe(parsed);
      Alert.alert('Success!', `"${parsed.name}" has been added to your recipe bank.`);
      nav.goBack();
    } catch (error: any) {
      Alert.alert('Import Failed', error.message || 'Could not parse the recipe. Try a different URL.');
    } finally {
      setImporting(false);
    }
  };

  const handleFileImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf', 'application/json'],
      });

      if (result.canceled) return;

      setImporting(true);
      const file = result.assets[0];

      // Read the file content
      const response = await fetch(file.uri);
      const text = await response.text();

      const parsed = await parseRecipeFromText(text, file.name || 'Uploaded file');
      await addRecipe(parsed);
      Alert.alert('Success!', `"${parsed.name}" has been added to your recipe bank.`);
      nav.goBack();
    } catch (error: any) {
      Alert.alert('Import Failed', error.message || 'Could not parse the file.');
    } finally {
      setImporting(false);
    }
  };

  const handleManualSave = async () => {
    if (!manualName.trim()) {
      Alert.alert('Missing Name', 'Please enter a recipe name.');
      return;
    }

    const ingredients = manualIngredients
      .split('\n')
      .filter((line) => line.trim())
      .map((text, i) => ({ id: `i${i + 1}`, text: text.trim(), sortOrder: i }));

    const steps = manualSteps
      .split('\n')
      .filter((line) => line.trim())
      .map((text, i) => {
        const lower = text.toLowerCase();
        let type: 'step' | 'stretch_folds' | 'proof' = 'step';
        if (lower.includes('stretch') && lower.includes('fold')) type = 'stretch_folds';
        else if (lower.includes('proof') || lower.includes('bulk ferment') || lower.includes('bulk rise')) type = 'proof';

        return { id: `s${i + 1}`, text: text.trim(), type, sortOrder: i };
      });

    await addRecipe({
      name: manualName.trim(),
      source: 'Manual entry',
      ingredients,
      steps,
    });

    Alert.alert('Saved!', `"${manualName.trim()}" has been added.`);
    nav.goBack();
  };

  const tabs: { key: ImportTab; label: string }[] = [
    { key: 'url', label: 'From URL' },
    { key: 'file', label: 'Upload' },
    { key: 'manual', label: 'Manual' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Tab selector */}
      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* URL Import */}
      {tab === 'url' && (
        <View style={styles.section}>
          <Text style={styles.label}>Recipe URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/sourdough-recipe..."
            placeholderTextColor={colors.textMuted}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
          <Text style={styles.hint}>
            Paste a link to any recipe page. The app uses AI to automatically extract ingredients and steps.
          </Text>
          <TouchableOpacity
            style={[styles.importButton, (!url.trim() || importing) && styles.importButtonDisabled]}
            onPress={handleUrlImport}
            disabled={!url.trim() || importing}
          >
            {importing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.importButtonText}>Import Recipe</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* File Import */}
      {tab === 'file' && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.fileDropzone} onPress={handleFileImport} disabled={importing}>
            {importing ? (
              <ActivityIndicator color={colors.amber} />
            ) : (
              <>
                <Text style={styles.fileIcon}>📄</Text>
                <Text style={styles.fileText}>Tap to select a recipe file</Text>
                <Text style={styles.fileHint}>Supports .txt, .pdf, .json</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.hint}>
            Upload a text file, PDF, or JSON with your recipe. AI will parse it into ingredients and steps.
          </Text>
        </View>
      )}

      {/* Manual Entry */}
      {tab === 'manual' && (
        <View style={styles.section}>
          <Text style={styles.label}>Recipe Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Classic Sourdough Boule"
            placeholderTextColor={colors.textMuted}
            value={manualName}
            onChangeText={setManualName}
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Ingredients (one per line)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={'500g bread flour\n350g water\n100g starter\n10g salt'}
            placeholderTextColor={colors.textMuted}
            value={manualIngredients}
            onChangeText={setManualIngredients}
            multiline
            textAlignVertical="top"
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Steps (one per line)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={'Mix flour and water. Autolyse 30 min.\nAdd starter and salt.\nStretch and folds (4 sets, 30 min apart)\nBulk proof until doubled.\nShape and cold retard overnight.\nBake in Dutch oven at 500°F.'}
            placeholderTextColor={colors.textMuted}
            value={manualSteps}
            onChangeText={setManualSteps}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.hint}>
            Tip: Include "stretch and fold" or "proof" in a step and the app will auto-detect it for timers.
          </Text>

          <TouchableOpacity style={styles.importButton} onPress={handleManualSave}>
            <Text style={styles.importButtonText}>Save Recipe</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: spacing.xl,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
  },
  tabActive: {
    borderColor: colors.amber,
    backgroundColor: colors.cream,
  },
  tabText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.amber,
  },
  section: {},
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
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
  textArea: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  importButton: {
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },
  fileDropzone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    padding: spacing.xxxl,
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
  },
  fileIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  fileText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fileHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
});
