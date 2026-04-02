import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

export function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.lastUpdated}>Last updated: March 31, 2026</Text>

      <Text style={styles.body}>
        Knead to Know ("we," "our," or "the app") is a sourdough bread companion app. This Privacy Policy explains how we collect, use, and protect your information when you use our app.
      </Text>

      <Text style={styles.heading}>1. Information We Collect</Text>

      <Text style={styles.subheading}>Account Information</Text>
      <Text style={styles.body}>
        When you create an account, we collect your email address, display name, and authentication credentials through Google Sign-In. This information is managed by Firebase Authentication.
      </Text>

      <Text style={styles.subheading}>Recipe Data</Text>
      <Text style={styles.body}>
        We store recipes you create or import, including ingredients, steps, equipment lists, and any notes you add. Recipes you mark as "community" are visible to other users.
      </Text>

      <Text style={styles.subheading}>Bake Log Data</Text>
      <Text style={styles.body}>
        We store your bake log entries including dates, ratings, notes, and photos you choose to upload. Photos are stored in Firebase Storage and are only accessible to you.
      </Text>

      <Text style={styles.subheading}>Home Assistant Configuration</Text>
      <Text style={styles.body}>
        If you choose to connect a Home Assistant instance for automatic temperature readings, we store your Home Assistant URL, access token, and sensor entity ID on our server. These credentials are stored securely and are only used to fetch temperature data on your behalf.
      </Text>

      <Text style={styles.subheading}>Usage Data</Text>
      <Text style={styles.body}>
        We do not use third-party analytics or tracking services. We do not collect usage statistics, device information, or behavioral data beyond what is necessary to operate the app.
      </Text>

      <Text style={styles.heading}>2. How We Use Your Information</Text>
      <Text style={styles.body}>
        We use your information solely to provide and improve the app's functionality:{'\n\n'}
        • Authenticate your account and secure your data{'\n'}
        • Store and sync your recipes, bake logs, and settings across devices{'\n'}
        • Parse recipes from URLs you provide using AI (the recipe content is sent to Anthropic's Claude API for processing){'\n'}
        • Fetch temperature data from your Home Assistant instance if configured{'\n'}
        • Send local push notifications for timers you start within the app
      </Text>

      <Text style={styles.heading}>3. AI Recipe Parsing</Text>
      <Text style={styles.body}>
        When you import a recipe by URL, the webpage content is sent to Anthropic's Claude API to extract structured recipe data. This content is processed in real time and is not stored by Anthropic beyond the API request. Anthropic's data usage policy applies to this processing. No personal information is included in these requests.
      </Text>

      <Text style={styles.heading}>4. Data Storage and Security</Text>
      <Text style={styles.body}>
        Your data is stored using Google Firebase (Firestore and Firebase Storage). Data is transmitted over encrypted connections (HTTPS/TLS). We use Firebase Security Rules to ensure users can only access their own data. We do not sell, rent, or share your personal information with third parties.
      </Text>

      <Text style={styles.heading}>5. Community Recipes</Text>
      <Text style={styles.body}>
        If you share a recipe to the community section, the recipe name, source URL, ingredients, steps, and equipment become visible to all app users. Your display name is shown as the contributor. You can remove a community recipe at any time, which will make it private again.
      </Text>

      <Text style={styles.heading}>6. Data Retention and Deletion</Text>
      <Text style={styles.body}>
        Your data is retained as long as your account is active. You can delete your account at any time from the Settings screen. When you delete your account, all of your data is permanently removed, including:{'\n\n'}
        • Your user profile and authentication data{'\n'}
        • All recipes (both private and community){'\n'}
        • All bake log entries and uploaded photos{'\n'}
        • Home Assistant configuration{'\n\n'}
        This action is irreversible.
      </Text>

      <Text style={styles.heading}>7. Children's Privacy</Text>
      <Text style={styles.body}>
        Knead to Know is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can delete it.
      </Text>

      <Text style={styles.heading}>8. Notifications</Text>
      <Text style={styles.body}>
        The app may send local push notifications when timers you've started are complete. These notifications are generated entirely on your device and are not sent from our servers. You can disable notifications in your device's system settings at any time.
      </Text>

      <Text style={styles.heading}>9. Changes to This Policy</Text>
      <Text style={styles.body}>
        We may update this Privacy Policy from time to time. Changes will be reflected in the app with an updated "Last updated" date. Continued use of the app after changes constitutes acceptance of the revised policy.
      </Text>

      <Text style={styles.heading}>10. Contact</Text>
      <Text style={styles.body}>
        If you have questions about this Privacy Policy or your data, please contact us at kneadtoknow.support@gmail.com.
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
  subheading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
