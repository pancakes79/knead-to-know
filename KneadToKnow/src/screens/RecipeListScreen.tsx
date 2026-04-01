import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
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
      {isCommunity && recipe.ownerName && (
        <Text style={styles.cardOwner}>Shared by {recipe.ownerName}</Text>
      )}
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

export function RecipeListScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { recipes, communityRecipes, loading } = useRecipes();
  const [activeTab, setActiveTab] = useState<'mine' | 'community'>('mine');
  const [search, setSearch] = useState('');

  const filteredCommunity = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return communityRecipes;
    return communityRecipes.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.source.toLowerCase().includes(q) ||
      (r.ownerName && r.ownerName.toLowerCase().includes(q)) ||
      r.ingredients.some((ing) => ing.text.toLowerCase().includes(q))
    );
  }, [communityRecipes, search]);

  const tabs = [
    { key: 'mine' as const, label: 'My Recipes' },
    { key: 'community' as const, label: 'Community' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Knead to Know</Text>
        <Text style={styles.subtitle}>SOURDOUGH COMPANION</Text>
      </View>

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

      {/* My Recipes tab */}
      {activeTab === 'mine' && (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RecipeCard recipe={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>My Recipes</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => nav.navigate('ImportRecipe')}
              >
                <Text style={styles.addButtonText}>+ Add Recipe</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No recipes yet. Tap "+ Add Recipe" to import one!
              </Text>
            </View>
          }
        />
      )}

      {/* Community tab */}
      {activeTab === 'community' && (
        <FlatList
          data={filteredCommunity}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RecipeCard recipe={item} isCommunity />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name, ingredient, or baker..."
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
              {search.trim() !== '' && (
                <Text style={styles.searchResultCount}>
                  {filteredCommunity.length} result{filteredCommunity.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {search.trim()
                  ? 'No recipes match your search.'
                  : 'No community recipes yet. Share one of yours to get things started!'}
              </Text>
            </View>
          }
        />
      )}
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
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.amber,
  },
  tabText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  listHeaderTitle: {
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
  searchInput: {
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  searchResultCount: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
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
  cardOwner: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.golden,
    marginTop: spacing.sm,
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
