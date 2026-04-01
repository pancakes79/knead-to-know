import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveHAConfiguration, deleteAccount as deleteAccountServer } from '../services/cloudApi';
import { useAuth } from '../hooks/useAuth';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

type TempSource = 'manual' | 'homeassistant';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const { user, signOut, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);

  // Temperature source
  const [tempSource, setTempSource] = useState<TempSource>('manual');

  // Home Assistant config
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [entityId, setEntityId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveHA = useCallback(async () => {
    if (!baseUrl.trim() || !token.trim() || !entityId.trim()) {
      Alert.alert('Missing Info', 'Please fill in all three fields.');
      return;
    }

    setSaving(true);
    try {
      await saveHAConfiguration({
        url: baseUrl.trim().replace(/\/$/, ''),
        token: token.trim(),
        entityId: entityId.trim(),
      });
      setIsConnected(true);
      Alert.alert(
        'Connected!',
        'Home Assistant is set up. The proofing calculator can now pull your ambient temperature automatically.'
      );
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message || 'Could not connect to Home Assistant.');
    } finally {
      setSaving(false);
    }
  }, [baseUrl, token, entityId]);

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

  const tempSources: { key: TempSource; label: string; description: string }[] = [
    { key: 'manual', label: 'Manual', description: 'Set temperature manually on the proofing calculator' },
    { key: 'homeassistant', label: 'Home Assistant', description: 'Pull temperature from a Home Assistant sensor' },
  ];

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brandHeader}>
        <Text style={styles.brandTitle}>Knead to Know</Text>
        <Text style={styles.brandSubtitle}>SOURDOUGH COMPANION</Text>
      </View>
      <Text style={styles.title}>Settings</Text>

      {/* ── Profile Section ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <View style={styles.profileCard}>
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

        <View style={styles.actionList}>
          <TouchableOpacity style={styles.actionRow} onPress={handleSignOut}>
            <Text style={styles.actionText}>Sign Out</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => nav.navigate('PrivacyPolicy')}
          >
            <Text style={styles.actionText}>Privacy Policy</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, styles.actionRowLast]}
            onPress={() => nav.navigate('TermsOfService')}
          >
            <Text style={styles.actionText}>Terms of Service</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Temperature Source Section ── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TEMPERATURE SOURCE</Text>
        <Text style={styles.sectionHint}>
          Choose how the proofing calculator gets your ambient temperature.
        </Text>

        {/* Source selector */}
        <View style={styles.sourceSelector}>
          {tempSources.map((src) => (
            <TouchableOpacity
              key={src.key}
              style={[styles.sourceOption, tempSource === src.key && styles.sourceOptionActive]}
              onPress={() => setTempSource(src.key)}
            >
              <View style={styles.sourceRadioRow}>
                <View style={[styles.radio, tempSource === src.key && styles.radioActive]}>
                  {tempSource === src.key && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sourceLabel, tempSource === src.key && styles.sourceLabelActive]}>
                    {src.label}
                  </Text>
                  <Text style={styles.sourceDescription}>{src.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Home Assistant config (shown when HA is selected) */}
        {tempSource === 'homeassistant' && (
          <View style={styles.haConfig}>
            <View style={styles.haConfigHeader}>
              <Text style={styles.haConfigTitle}>Home Assistant Connection</Text>
              {isConnected && (
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedText}>Connected</Text>
                </View>
              )}
            </View>
            <Text style={styles.haConfigHint}>
              Your credentials are stored securely on the server — not on your phone.
            </Text>

            <Text style={styles.label}>Home Assistant URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://kneadtoknow.duckdns.org"
              placeholderTextColor={colors.textMuted}
              value={baseUrl}
              onChangeText={setBaseUrl}
              autoCapitalize="none"
              keyboardType="url"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              Use your HTTPS URL (e.g., https://yourname.duckdns.org or https://xxxxx.ui.nabu.casa)
            </Text>

            <Text style={[styles.label, { marginTop: spacing.lg }]}>Long-Lived Access Token</Text>
            <TextInput
              style={[styles.input, { fontFamily: fonts.mono, fontSize: 12 }]}
              placeholder="eyJhbGciOi..."
              placeholderTextColor={colors.textMuted}
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <Text style={styles.hint}>
              HA → Profile (bottom-left) → scroll to "Long-Lived Access Tokens" → Create Token
            </Text>

            <Text style={[styles.label, { marginTop: spacing.lg }]}>Temperature Sensor Entity ID</Text>
            <TextInput
              style={[styles.input, { fontFamily: fonts.mono, fontSize: 13 }]}
              placeholder="sensor.home_current_temperature"
              placeholderTextColor={colors.textMuted}
              value={entityId}
              onChangeText={setEntityId}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              HA → Developer Tools → States → search "temperature" → copy the entity_id
            </Text>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveHA}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isConnected ? 'Update Connection' : 'Test & Save'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
  brandHeader: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  brandTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
  },
  brandSubtitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: 4,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },

  // ─── Sections ───
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  sectionHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },

  // ─── Profile ───
  profileCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.golden,
  },
  avatarText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 20,
    color: colors.amber,
  },
  displayName: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  email: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  actionList: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  actionRowLast: {
    borderBottomWidth: 0,
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

  // ─── Temperature Source ───
  sourceSelector: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sourceOption: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  sourceOptionActive: {
    borderColor: colors.amber,
    backgroundColor: colors.cream,
  },
  sourceRadioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  radioActive: {
    borderColor: colors.amber,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.amber,
  },
  sourceLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  sourceLabelActive: {
    color: colors.amber,
  },
  sourceDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },

  // ─── Home Assistant Config ───
  haConfig: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  haConfigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  haConfigTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  connectedBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  connectedText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.successText,
  },
  haConfigHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs + 2,
  },
  input: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs + 2,
    lineHeight: 17,
  },
  saveButton: {
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },

  // ─── Danger Zone ───
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

  // ─── App Info ───
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
