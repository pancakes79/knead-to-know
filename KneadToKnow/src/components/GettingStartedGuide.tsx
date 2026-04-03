import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

interface GuideStep {
  number: number;
  title: string;
  timeframe: string;
  sections: {
    heading?: string;
    body: string;
  }[];
}

const GUIDE_STEPS: GuideStep[] = [
  {
    number: 1,
    title: 'Create Your Starter',
    timeframe: 'Days 1-14',
    sections: [
      {
        heading: 'What you need',
        body: 'A wide-mouth glass jar, whole wheat or rye flour (for the first few days), all-purpose or bread flour, and water. That\'s it — wild yeast is already in the flour and in the air around you.',
      },
      {
        heading: 'Day 1',
        body: 'Mix 50g whole wheat flour and 50g lukewarm water (around 78°F) in your jar. Stir well, cover loosely, and leave at room temperature.',
      },
      {
        heading: 'Days 2-4',
        body: 'Every 24 hours, discard all but 50g of the mixture, then add 50g flour and 50g water. You may see some bubbles — that\'s a good sign. It might also smell funky or like acetone. This is normal. Don\'t give up.',
      },
      {
        heading: 'Days 5-7',
        body: 'Switch to feeding twice per day (every 12 hours). You can transition to bread flour or all-purpose now. Continue discarding down to 50g before each feed. The starter should start rising and falling predictably.',
      },
      {
        heading: 'Days 7-14',
        body: 'Your starter is ready when it consistently doubles in size within 4-6 hours of feeding and smells pleasantly sour and yeasty. The float test can help confirm: drop a spoonful in water — if it floats, it\'s active enough to bake with.',
      },
      {
        body: 'Don\'t worry if it takes longer than 14 days. Every environment is different. Warmer kitchens speed things up, cooler ones slow it down. Patience is the most important ingredient.',
      },
    ],
  },
  {
    number: 2,
    title: 'Maintaining Your Starter',
    timeframe: 'Ongoing',
    sections: [
      {
        heading: 'Daily baking',
        body: 'If you bake frequently, keep your starter at room temperature and feed it once or twice daily with a 1:1:1 or 1:2:2 ratio (starter:flour:water by weight). Use the Starter Feeding Calculator in Resources to figure out exact amounts.',
      },
      {
        heading: 'Weekly baking',
        body: 'Store your starter in the fridge. Feed it once a week by discarding down to a small amount and feeding 1:5:5. The night before you want to bake, take it out of the fridge and feed it at room temperature.',
      },
      {
        heading: 'Signs of a healthy starter',
        body: 'Doubles within 4-8 hours of feeding, has a pleasant tangy smell, is bubbly throughout, and passes the float test. The surface should be domed (not collapsed or liquid) when it\'s at its peak.',
      },
      {
        heading: 'Troubleshooting',
        body: 'Hooch (dark liquid on top) means your starter is hungry — just pour it off and feed. Mold (fuzzy spots, pink or orange streaks) means start over. A sluggish starter can often be revived with a few days of consistent twice-daily feedings at a warm temperature.',
      },
    ],
  },
  {
    number: 3,
    title: 'Your First Bake',
    timeframe: 'One day',
    sections: [
      {
        heading: 'Choose a recipe',
        body: 'Start with a basic white sourdough with 70-72% hydration. Import a recipe into this app or use one of the community recipes. Lower hydration doughs are easier to handle as a beginner.',
      },
      {
        heading: 'Mix the dough',
        body: 'Weigh your ingredients carefully using a digital scale. Mix flour and water, let it rest 30-60 minutes (autolyse), then add your starter and salt. Pinch and fold to incorporate everything.',
      },
      {
        heading: 'Build strength',
        body: 'During bulk fermentation, perform 3-4 sets of stretch and folds, about 30 minutes apart. This develops gluten without kneading. The app\'s Active Bake screen will guide you through each set with timers.',
      },
      {
        heading: 'Bulk fermentation',
        body: 'Let the dough ferment at room temperature until it\'s grown about 50% in volume, is jiggly, domed on top, and bubbly on the sides. Use the Proofing Calculator to estimate timing based on your dough temperature. This is the most important step — don\'t rush it.',
      },
      {
        heading: 'Shape',
        body: 'Turn the dough onto an unfloured surface. Pre-shape into a round, let it rest 15-20 minutes, then do your final shape. Place seam-side up in a floured banneton (rice flour works best to prevent sticking).',
      },
      {
        heading: 'Final proof',
        body: 'You have two options: proof at room temperature for 1-3 hours, or cover and refrigerate overnight (8-16 hours). Cold proofing develops more flavor and makes scoring much easier. Most bakers prefer overnight.',
      },
      {
        heading: 'Bake',
        body: 'Preheat your oven to 450-500°F with the Dutch oven inside for at least 45 minutes. Score the dough with a lame or razor blade. Carefully transfer to the hot Dutch oven. Bake covered for 20 minutes (steam phase), then remove the lid and bake another 20-25 minutes until deep golden brown.',
      },
      {
        heading: 'Cool — the hardest part',
        body: 'Let the bread cool on a wire rack for at least 1 hour, ideally 2. The interior is still cooking and the crumb is setting. Cutting too early will result in a gummy texture. Listen for the crackling sounds as it cools — that\'s the crust singing.',
      },
    ],
  },
  {
    number: 4,
    title: 'Common Beginner Mistakes',
    timeframe: 'Learn from others',
    sections: [
      {
        heading: 'Not using a scale',
        body: 'Volume measurements (cups) are wildly inconsistent for flour. A cup of flour can vary by 30% depending on how you scoop. Always weigh your ingredients in grams.',
      },
      {
        heading: 'Under-fermenting the dough',
        body: 'The most common mistake. If your bread is dense, gummy, or doesn\'t rise in the oven, it probably needed more time during bulk fermentation. Look for 50% volume increase, not a specific time.',
      },
      {
        heading: 'Using starter that isn\'t ready',
        body: 'Your starter should be at or near its peak (doubled, bubbly, domed) when you mix your dough. Using a sluggish or collapsed starter leads to long fermentation times and unpredictable results.',
      },
      {
        heading: 'Skipping the preheat',
        body: 'The Dutch oven and your oven need to be screaming hot. Preheat for at least 45 minutes. A cold Dutch oven = flat bread with no oven spring.',
      },
      {
        heading: 'Cutting bread too early',
        body: 'We know it\'s tempting. But the crumb needs time to set. Cutting a hot loaf will release all the steam and result in a gummy, doughy interior. Wait at least 1 hour.',
      },
      {
        heading: 'Giving up too soon',
        body: 'Your first few loaves might not be Instagram-worthy. That\'s completely normal. Every bake teaches you something. Keep notes in the Bake Log — tracking what you changed and what happened helps you improve faster than anything else.',
      },
    ],
  },
  {
    number: 5,
    title: 'Level Up Your Baking',
    timeframe: 'When you\'re ready',
    sections: [
      {
        heading: 'Experiment with hydration',
        body: 'Once you\'re comfortable at 70%, try 75%, then 80%. Higher hydration gives you a more open crumb but is harder to handle. The Baker\'s Math calculator can help you adjust recipes.',
      },
      {
        heading: 'Try different flours',
        body: 'Whole wheat, rye, spelt, einkorn — each brings different flavors and textures. Start by replacing 10-20% of your bread flour with a specialty flour and adjust from there.',
      },
      {
        heading: 'Add mix-ins',
        body: 'Cheese, herbs, olives, dried fruit, seeds, chocolate — fold them in during lamination or the last set of stretch and folds. About 20-30% of total dough weight is a good starting point for mix-ins.',
      },
      {
        heading: 'Master scoring',
        body: 'Scoring isn\'t just functional — it\'s artistic. Practice different patterns: a single ear, a cross, wheat stalk designs. A confident, swift slash at a 30-45° angle gives the best ear.',
      },
      {
        heading: 'Track and learn',
        body: 'Use this app\'s Bake Log to record every bake — temperature, timing, what you changed, and how it turned out. Over time, you\'ll build an intuition that no recipe can teach.',
      },
    ],
  },
];

export function GettingStartedGuide() {
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  return (
    <View>
      <Text style={styles.intro}>
        Everything you need to go from zero to your first loaf of sourdough bread.
      </Text>

      {GUIDE_STEPS.map((step) => {
        const isExpanded = expandedStep === step.number;
        return (
          <View key={step.number}>
            <TouchableOpacity
              style={[styles.stepHeader, isExpanded && styles.stepHeaderActive]}
              onPress={() => setExpandedStep(isExpanded ? null : step.number)}
              activeOpacity={0.7}
            >
              <View style={[styles.stepNumber, isExpanded && styles.stepNumberActive]}>
                <Text style={[styles.stepNumberText, isExpanded && styles.stepNumberTextActive]}>
                  {step.number}
                </Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, isExpanded && styles.stepTitleActive]}>{step.title}</Text>
                <Text style={styles.stepTimeframe}>{step.timeframe}</Text>
              </View>
              <Text style={styles.stepChevron}>{isExpanded ? '▾' : '›'}</Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.stepContent}>
                {step.sections.map((section, i) => (
                  <View key={i} style={styles.section}>
                    {section.heading && (
                      <Text style={styles.sectionHeading}>{section.heading}</Text>
                    )}
                    <Text style={styles.sectionBody}>{section.body}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Connector line between steps */}
            {step.number < GUIDE_STEPS.length && (
              <View style={styles.connector}>
                <View style={styles.connectorLine} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.xl,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  stepHeaderActive: {
    borderColor: colors.amber,
    backgroundColor: colors.cream,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  stepNumberText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textMuted,
  },
  stepNumberTextActive: {
    color: '#fff',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepTitleActive: {
    color: colors.amber,
  },
  stepTimeframe: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  stepChevron: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.amber,
  },
  stepContent: {
    paddingLeft: spacing.lg + 18,
    paddingRight: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  connector: {
    alignItems: 'center',
    height: spacing.md,
    paddingLeft: spacing.lg + 18,
  },
  connectorLine: {
    width: 2,
    height: '100%',
    backgroundColor: colors.border,
    alignSelf: 'flex-start',
  },
});
