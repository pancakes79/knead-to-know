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
import { saveHAConfiguration } from '../services/cloudApi';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

export function SettingsScreen() {
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [entityId, setEntityId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!baseUrl.trim() || !token.trim() || !entityId.trim()) {
      Alert.alert('Missing Info', 'Please fill in all three fields.');
      return;
    }

    setSaving(true);
    try {
      // Cloud Function tests the connection AND saves to Firestore
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Settings</Text>

      {/* ── Home Assistant Connection ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Home Assistant</Text>
          {isConnected && (
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          )}
        </View>
        <Text style={styles.sectionHint}>
          Connect to Home Assistant to auto-detect your ambient temperature for proofing calculations.
          Your credentials are stored securely on the server — not on your phone.
        </Text>

        {/* URL */}
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

        {/* Token */}
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

        {/* Entity ID */}
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

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
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

        {isConnected && (
          <Text style={styles.savedHint}>
            The server tested your connection and saved your credentials.
            Use "Pull from Home Assistant" on the Proofing tab.
          </Text>
        )}
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
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
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
  sectionHint: {
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
  savedHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.success,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 17,
  },
});
