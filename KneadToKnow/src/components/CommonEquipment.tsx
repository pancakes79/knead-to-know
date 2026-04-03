import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

type Tier = 'essential' | 'recommended' | 'nice';

interface EquipmentItem {
  name: string;
  description: string;
  tier: Tier;
  tip?: string;
}

const TIER_LABELS: Record<Tier, string> = {
  essential: 'Essential',
  recommended: 'Recommended',
  nice: 'Nice to Have',
};

const TIER_COLORS: Record<Tier, string> = {
  essential: '#E57373',
  recommended: colors.amber,
  nice: '#8BC34A',
};

const EQUIPMENT: EquipmentItem[] = [
  // Essential
  { name: 'Digital Kitchen Scale', description: 'Accurate to 1g. Weighing ingredients is critical for consistent sourdough — volume measurements are too imprecise.', tier: 'essential', tip: 'Look for one that measures in 0.1g increments for small amounts like salt.' },
  { name: 'Large Mixing Bowl', description: 'A wide bowl (at least 4-quart) for mixing and bulk fermentation. Clear or straight-sided containers let you track dough rise.', tier: 'essential', tip: 'A clear, straight-sided Cambro container with volume markings makes tracking rise easy.' },
  { name: 'Dutch Oven', description: 'A heavy, lidded pot (5-7 qt) for baking. Traps steam during the first half of baking, creating a crispy crust and maximum oven spring.', tier: 'essential', tip: 'Cast iron or enameled cast iron both work. Lodge is a great budget option.' },
  { name: 'Bench Scraper', description: 'A flat metal or plastic blade for dividing dough, shaping, and cleaning your work surface. Essential for handling sticky dough.', tier: 'essential' },
  { name: 'Jar for Starter', description: 'A wide-mouth glass jar (pint or quart) for maintaining your sourdough starter. Glass lets you see activity and bubbles.', tier: 'essential', tip: 'Use a rubber band to mark the level after feeding so you can track the rise.' },

  // Recommended
  { name: 'Banneton / Proofing Basket', description: 'A cane or rattan basket that supports dough during its final proof and creates the classic flour ring pattern on the crust.', tier: 'recommended', tip: '9-inch round for boules, 10-inch oval for batards. Dust generously with rice flour to prevent sticking.' },
  { name: 'Bread Lame', description: 'A razor blade holder designed for scoring dough. The slight curve of the blade helps create an ear on the loaf.', tier: 'recommended', tip: 'Replace blades regularly — a dull blade drags and tears the dough instead of cutting cleanly.' },
  { name: 'Instant-Read Thermometer', description: 'For checking dough temperature (affects fermentation speed) and internal bread temperature (190-210°F when done).', tier: 'recommended', tip: 'Also useful for checking water temperature when mixing.' },
  { name: 'Danish Dough Whisk', description: 'A sturdy wire whisk designed for mixing heavy dough. Much easier than using a spoon and less messy than hands for initial mixing.', tier: 'recommended' },
  { name: 'Parchment Paper / Bread Sling', description: 'For transferring dough into the hot Dutch oven safely. A reusable silicone bread sling is an eco-friendly alternative.', tier: 'recommended' },
  { name: 'Cooling Rack', description: 'Allows air to circulate around the loaf after baking, preventing a soggy bottom. Let bread cool at least 1 hour before cutting.', tier: 'recommended' },
  { name: 'Spray Bottle', description: 'For misting dough with water before baking. Extra steam helps the crust stay flexible longer for better oven spring.', tier: 'recommended' },

  // Nice to have
  { name: 'Bread Knife', description: 'A long, serrated knife for slicing bread without crushing the crumb. A 10-inch offset bread knife gives the best results.', tier: 'nice' },
  { name: 'Proofing Box / Warm Spot Setup', description: 'A controlled warm environment (75-80°F) for consistent fermentation. Can be a dedicated proofing box, oven with light on, or a cooler with warm water.', tier: 'nice', tip: 'Your oven with just the light on usually stays around 75-80°F — a free proofing box.' },
  { name: 'Kitchen Timer', description: 'For tracking stretch and fold intervals, proof times, and bake times. A phone works, but a dedicated timer lets you keep your phone free.', tier: 'nice', tip: 'This app has built-in timers for all your baking steps!' },
  { name: 'Linen Couche', description: 'A flax linen cloth used to support baguettes and batards during proofing. The fabric texture prevents sticking without excess flour.', tier: 'nice' },
  { name: 'Baking Steel / Stone', description: 'A thick steel plate or ceramic stone that retains heat and gives bread a better bottom crust. Useful for baking directly on the stone instead of in a Dutch oven.', tier: 'nice' },
  { name: 'Rice Flour', description: 'For dusting bannetons and work surfaces. Rice flour doesn\'t absorb moisture like wheat flour, so it prevents sticking much better.', tier: 'nice' },
];

const TIERS: Tier[] = ['essential', 'recommended', 'nice'];

export function CommonEquipment() {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  return (
    <View>
      {TIERS.map((tier) => {
        const items = EQUIPMENT.filter((e) => e.tier === tier);
        return (
          <View key={tier} style={styles.tierSection}>
            <View style={styles.tierHeader}>
              <View style={[styles.tierDot, { backgroundColor: TIER_COLORS[tier] }]} />
              <Text style={styles.tierTitle}>{TIER_LABELS[tier]}</Text>
              <Text style={styles.tierCount}>{items.length}</Text>
            </View>

            {items.map((item) => {
              const isExpanded = expandedItem === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.item, isExpanded && styles.itemExpanded]}
                  onPress={() => setExpandedItem(isExpanded ? null : item.name)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemChevron}>{isExpanded ? '▾' : '›'}</Text>
                  </View>
                  {isExpanded && (
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemDescription}>{item.description}</Text>
                      {item.tip && (
                        <View style={styles.tipBox}>
                          <Text style={styles.tipLabel}>Tip</Text>
                          <Text style={styles.tipText}>{item.tip}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tierSection: {
    marginBottom: spacing.xl,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tierDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tierTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  tierCount: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.textMuted,
  },
  item: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  itemExpanded: {
    borderColor: colors.amber,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  itemChevron: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.amber,
  },
  itemDetails: {
    marginTop: spacing.md,
  },
  itemDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  tipBox: {
    marginTop: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    padding: spacing.md,
  },
  tipLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.amber,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
