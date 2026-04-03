import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

interface GlossaryEntry {
  term: string;
  definition: string;
  category: Category;
}

type Category = 'technique' | 'ingredient' | 'equipment' | 'science';

const CATEGORY_LABELS: Record<Category, string> = {
  technique: 'Technique',
  ingredient: 'Ingredient',
  equipment: 'Equipment',
  science: 'Science',
};

const CATEGORY_COLORS: Record<Category, string> = {
  technique: colors.amber,
  ingredient: '#8BC34A',
  equipment: '#5BA4CF',
  science: '#CE93D8',
};

const GLOSSARY: GlossaryEntry[] = [
  { term: 'Autolyse', definition: 'A rest period (usually 20-60 minutes) after mixing flour and water, before adding salt and starter. Allows flour to fully hydrate and gluten to begin developing, resulting in easier handling and better texture.', category: 'technique' },
  { term: 'Banneton', definition: 'A proofing basket, traditionally made of rattan or cane, used to support dough during its final rise. The basket gives the loaf its shape and creates a distinctive flour pattern on the crust.', category: 'equipment' },
  { term: "Baker's Percentage", definition: 'A system where every ingredient is expressed as a percentage of total flour weight. Flour is always 100%. For example, 72% hydration means water weight is 72% of flour weight.', category: 'science' },
  { term: 'Bench Rest', definition: 'A short rest (15-30 minutes) after pre-shaping the dough. Allows the gluten to relax so the dough is easier to shape into its final form.', category: 'technique' },
  { term: 'Bulk Fermentation', definition: 'The first and longest rise after mixing the dough. During bulk fermentation, yeast produces gas and develops flavor. This stage typically takes 4-12 hours depending on temperature.', category: 'technique' },
  { term: 'Coil Fold', definition: 'A gentle dough strengthening technique where you lift the dough from the center, letting the edges fold underneath. Less aggressive than stretch and folds, good for high-hydration doughs.', category: 'technique' },
  { term: 'Cold Retard', definition: 'Placing shaped dough in the refrigerator (38-42°F) for an extended period, usually 12-48 hours. Slows fermentation while developing complex flavors and making scoring easier.', category: 'technique' },
  { term: 'Crumb', definition: 'The interior texture of the bread. Described as open (large, irregular holes), tight (small, uniform holes), or closed. Crumb is affected by hydration, fermentation, and shaping.', category: 'science' },
  { term: 'Discard', definition: 'The portion of sourdough starter removed before feeding. Can be used in recipes like pancakes, crackers, and pizza dough to reduce waste.', category: 'ingredient' },
  { term: 'Dough Strength', definition: 'The ability of dough to hold its shape and trap gas. Built through folds, proper hydration, and adequate fermentation. Weak dough spreads flat; strong dough holds a dome shape.', category: 'science' },
  { term: 'Dutch Oven', definition: 'A heavy, lidded pot used to bake bread. Traps steam during the first phase of baking, allowing maximum oven spring and a crispy, blistered crust.', category: 'equipment' },
  { term: 'Ear', definition: 'The flap of crust that lifts along the score line during baking. A pronounced ear is a sign of good oven spring, proper scoring, and well-fermented dough.', category: 'science' },
  { term: 'Feed / Refresh', definition: 'Adding fresh flour and water to a sourdough starter to nourish the yeast and bacteria. Common ratios are 1:1:1, 1:2:2, and 1:5:5 (starter:flour:water by weight).', category: 'technique' },
  { term: 'Float Test', definition: 'A test to check if starter is ready: drop a spoonful into water. If it floats, the starter is active and full of gas. Not always reliable — the poke and dome tests can be more accurate.', category: 'technique' },
  { term: 'Gluten', definition: 'A network of proteins (glutenin and gliadin) that forms when flour is hydrated and worked. Gluten traps gas from fermentation, giving bread its structure and chew.', category: 'science' },
  { term: 'Hydration', definition: 'The ratio of water to flour in a dough, expressed as a percentage. 65% is low (stiff), 72% is moderate, 80%+ is high (wet, sticky). Higher hydration generally produces a more open crumb.', category: 'science' },
  { term: 'Lame', definition: 'A blade holder used to score (slash) the top of bread dough before baking. The score controls where the bread expands in the oven. A razor blade or sharp knife can also be used.', category: 'equipment' },
  { term: 'Lamination', definition: 'A folding technique where dough is stretched very thin on a wet surface, then folded over itself. Great for incorporating mix-ins (cheese, herbs) and building dough strength.', category: 'technique' },
  { term: 'Levain', definition: 'A portion of starter built up specifically for a bake, often with a different flour or ratio than the maintenance starter. Some bakers use "levain" and "starter" interchangeably.', category: 'ingredient' },
  { term: 'Oven Spring', definition: 'The rapid rise of bread during the first 10-15 minutes of baking. Caused by gas expansion and yeast activity before the crust sets. Good oven spring = tall, airy loaf.', category: 'science' },
  { term: 'Poke Test', definition: 'Press a floured finger into proofing dough. If it springs back slowly and leaves a slight indent, it is ready to bake. Springing back fast = underproofed. No spring back = overproofed.', category: 'technique' },
  { term: 'Pre-shape', definition: 'A gentle first shaping of the dough before the bench rest. Builds initial tension and shape (round or oval) that will be refined during final shaping.', category: 'technique' },
  { term: 'Proof / Final Proof', definition: 'The last rise after shaping, either at room temperature (1-4 hours) or cold in the fridge (8-48 hours). The dough should be puffy but not overinflated before baking.', category: 'technique' },
  { term: 'Scoring', definition: 'Slashing the top of the dough with a lame or blade just before baking. Controls where steam escapes and the bread expands. Depth is usually 1/4 to 1/2 inch.', category: 'technique' },
  { term: 'Starter', definition: 'A living culture of wild yeast and lactic acid bacteria maintained by regular feedings of flour and water. Used to leaven bread instead of commercial yeast. Takes 7-14 days to create from scratch.', category: 'ingredient' },
  { term: 'Stretch and Fold', definition: 'A dough strengthening technique performed during bulk fermentation. Grab one side of the dough, stretch it up, and fold it over the center. Rotate 90° and repeat 4 times. Usually done every 30 minutes for 3-4 sets.', category: 'technique' },
  { term: 'Windowpane Test', definition: 'Stretch a small piece of dough thin enough to see light through it without tearing. If it stretches translucent, gluten is well-developed. If it tears, it needs more development.', category: 'technique' },
];

export function SourdoughGlossary() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<Category | 'all'>('all');

  const filtered = GLOSSARY.filter((entry) => {
    const matchesSearch = !search ||
      entry.term.toLowerCase().includes(search.toLowerCase()) ||
      entry.definition.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeFilter === 'all' || entry.category === activeFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <View>
      {/* Search */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search terms..."
          placeholderTextColor={colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filters */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, activeFilter === cat && { backgroundColor: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] }]}
            onPress={() => setActiveFilter(activeFilter === cat ? 'all' : cat)}
          >
            <Text style={[styles.filterChipText, activeFilter === cat && styles.filterChipTextActive]}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results count */}
      <Text style={styles.resultCount}>{filtered.length} term{filtered.length !== 1 ? 's' : ''}</Text>

      {/* Entries */}
      {filtered.map((entry) => (
        <View key={entry.term} style={styles.entry}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTerm}>{entry.term}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[entry.category] + '20', borderColor: CATEGORY_COLORS[entry.category] + '40' }]}>
              <Text style={[styles.categoryBadgeText, { color: CATEGORY_COLORS[entry.category] }]}>
                {CATEGORY_LABELS[entry.category]}
              </Text>
            </View>
          </View>
          <Text style={styles.entryDefinition}>{entry.definition}</Text>
        </View>
      ))}

      {filtered.length === 0 && (
        <Text style={styles.emptyText}>No terms found matching "{search}"</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  clearButton: {
    padding: spacing.sm,
  },
  clearButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textMuted,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  filterChipText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  resultCount: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  entry: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  entryTerm: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  entryDefinition: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
});
