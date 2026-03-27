import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { deleteAccount as deleteAccountServer } from '../services/cloudApi';
import { useAuth } from '../hooks/useAuth';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

export function ProfileScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', onPress: () => signOut() },
    ]);
  }, [signOut]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data including recipes, bake logs, and photos. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccountServer();
              // Auth state listener will handle navigation back to sign-in
            } catch (error: any) {
              Alert.alert('Error', error.message);
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [deleteAccount]);

  if (!user) return null;

  const initial = (user.displayName?.[0] || user.email?.[0] || '?').toUpperCase();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Profile</Text>

      {/* ── User Info Card ── */}
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {user.displayName && (
              <Text style={styles.displayName}>{user.displayName}</Text>
            )}
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
      </View>

      {/* ── Actions ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.actionRow} onPress={handleSignOut}>
          <Text style={styles.actionText}>Sign Out</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => Linking.openURL('https://kneadtoknow.app/privacy')}
        >
          <Text style={styles.actionText}>Privacy Policy</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => Linking.openURL('https://kneadtoknow.app/terms')}
        >
          <Text style={styles.actionText}>Terms of Service</Text>
          <Text style={styles.actionChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ── Danger Zone ── */}
      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <Text style={styles.dangerHint}>
          Deleting your account removes all your data permanently including recipes, bake logs, and photos. This action cannot be undone.
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* App info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Knead to Know v1.0.0</Text>
        <Text style={styles.appInfoText}>Made with flour, water, and code</Text>
      </View>

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
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.golden,
  },
  avatarText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 22,
    color: colors.amber,
  },
  displayName: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  email: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  actionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  actionChevron: {
    fontSize: 20,
    color: colors.textMuted,
  },
  dangerSection: {
    backgroundColor: '#FCEBEB',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: '#F7C1C1',
    marginBottom: spacing.xxl,
  },
  dangerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: '#A32D2D',
    marginBottom: spacing.sm,
  },
  dangerHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#791F1F',
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  deleteButton: {
    backgroundColor: '#E24B4A',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#fff',
  },
  appInfo: {
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xl,
  },
  appInfoText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
});
