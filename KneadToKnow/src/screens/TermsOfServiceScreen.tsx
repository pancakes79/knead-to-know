import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '../constants/theme';

export function TermsOfServiceScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.lastUpdated}>Last updated: March 31, 2026</Text>

      <Text style={styles.body}>
        These Terms of Service ("Terms") govern your use of Knead to Know ("the app," "we," "our"). By using the app, you agree to these Terms.
      </Text>

      <Text style={styles.heading}>1. Use of the App</Text>
      <Text style={styles.body}>
        Knead to Know is a sourdough bread companion app that helps you manage recipes, track bakes, and learn about sourdough baking. You may use the app for personal, non-commercial purposes. You must be at least 13 years old to create an account.
      </Text>

      <Text style={styles.heading}>2. Accounts</Text>
      <Text style={styles.body}>
        You are responsible for maintaining the security of your account and for all activity that occurs under your account. You must provide accurate information when creating your account. We reserve the right to suspend or terminate accounts that violate these Terms.
      </Text>

      <Text style={styles.heading}>3. Your Content</Text>
      <Text style={styles.body}>
        You retain ownership of recipes, bake logs, photos, and other content you create in the app ("Your Content"). By sharing a recipe to the community section, you grant other users a non-exclusive right to view and use that recipe for personal baking purposes. You can revoke this by making the recipe private again.{'\n\n'}You are responsible for ensuring that Your Content does not infringe on the rights of others. Do not upload content that is illegal, harmful, or violates the intellectual property rights of others.
      </Text>

      <Text style={styles.heading}>4. Recipe Importing</Text>
      <Text style={styles.body}>
        The app allows you to import recipes from URLs using AI-powered parsing. Imported recipes are for your personal use. The accuracy of AI-parsed recipes is not guaranteed — you should always review imported recipes for correctness before baking. We are not responsible for errors in AI-parsed content.
      </Text>

      <Text style={styles.heading}>5. Community Recipes</Text>
      <Text style={styles.body}>
        Recipes shared to the community section are visible to all users. We do not verify or endorse community recipes. Use community recipes at your own discretion. We reserve the right to remove community recipes that are inappropriate, misleading, or violate these Terms.
      </Text>

      <Text style={styles.heading}>6. Calculators and Estimates</Text>
      <Text style={styles.body}>
        The proofing calculator, baker's math calculator, starter feeding calculator, and other tools in the app provide estimates based on general sourdough baking principles. Results are approximate and may not account for all variables in your specific environment. These tools are provided as helpful references, not guarantees. Your results may vary.
      </Text>

      <Text style={styles.heading}>7. Home Assistant Integration</Text>
      <Text style={styles.body}>
        If you connect a Home Assistant instance, you do so at your own risk. We are not responsible for issues arising from the Home Assistant integration, including but not limited to incorrect temperature readings, connection failures, or security of your Home Assistant instance. You are responsible for safeguarding your Home Assistant credentials.
      </Text>

      <Text style={styles.heading}>8. Notifications</Text>
      <Text style={styles.body}>
        The app may send local push notifications for timers. These are informational only. Do not rely solely on app notifications for food safety or time-critical baking steps. Always use your own judgment and additional timers as needed.
      </Text>

      <Text style={styles.heading}>9. Limitation of Liability</Text>
      <Text style={styles.body}>
        The app is provided "as is" without warranties of any kind, either express or implied. We are not liable for any damages arising from your use of the app, including but not limited to:{'\n\n'}
        • Failed bakes or wasted ingredients resulting from app estimates or AI-parsed recipes{'\n'}
        • Loss of data due to technical issues{'\n'}
        • Inaccurate temperature readings from connected devices{'\n'}
        • Any food safety issues{'\n\n'}
        You are solely responsible for your baking decisions and food safety practices.
      </Text>

      <Text style={styles.heading}>10. Account Deletion</Text>
      <Text style={styles.body}>
        You may delete your account at any time from the Settings screen. Deletion is permanent and removes all your data, including recipes, bake logs, photos, and settings. This action cannot be undone. Community recipes you shared will also be removed upon account deletion.
      </Text>

      <Text style={styles.heading}>11. Changes to These Terms</Text>
      <Text style={styles.body}>
        We may update these Terms from time to time. Changes will be reflected in the app with an updated "Last updated" date. Continued use of the app after changes constitutes acceptance of the revised Terms.
      </Text>

      <Text style={styles.heading}>12. Contact</Text>
      <Text style={styles.body}>
        If you have questions about these Terms, please contact us at kneadtoknow.support@gmail.com.
      </Text>

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
  lastUpdated: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  heading: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
