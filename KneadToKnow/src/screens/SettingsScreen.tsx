import React, { useState, useEffect, useCallback } from 'react';
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
import {
  saveHAConfig,
  loadHAConfig,
  clearHAConfig,
  testConnection,
  discoverTemperatureSensors,
  hasEnvConfig,
} from '../services/homeAssistantApi';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

export function SettingsScreen() {
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [entityId, setEntityId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [preConfigured, setPreConfigured] = useState(false);
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [testing, setTesting] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [sensors, setSensors] = useState<Array<{
    entityId: string;
    friendlyName: string;
    currentTemp: string;
    unit: string;
  }>>([]);

  // Load existing config
  useEffect(() => {
    const envReady = hasEnvConfig();
    setPreConfigured(envReady);

    loadHAConfig().then((config) => {
      if (config) {
        setBaseUrl(config.baseUrl);
        setToken(config.token);
        setEntityId(config.entityId);
        setIsConnected(true);
      }
    });
  }, []);

  const handleTestConnection = useCallback(async () => {
    if (!baseUrl.trim() || !token.trim()) {
      Alert.alert('Missing Info', 'Please enter both the URL and token.');
      return;
    }

    setTesting(true);
    const url = baseUrl.trim().replace(/\/$/, ''); // Remove trailing slash
    const success = await testConnection(url, token.trim());
    setTesting(false);

    if (success) {
      setBaseUrl(url);
      Alert.alert('Connected!', 'Home Assistant connection is working.');
      // Auto-discover sensors
      handleDiscoverSensors(url, token.trim());
    } else {
      Alert.alert(
        'Connection Failed',
        'Could not reach Home Assistant. Check the URL and token.\n\n' +
        'Tips:\n' +
        '• Make sure your phone is on the same WiFi network\n' +
        '• The URL should look like http://192.168.1.XX:8123\n' +
        '• Or use your Nabu Casa URL: https://xxxxx.ui.nabu.casa'
      );
    }
  }, [baseUrl, token]);

  const handleDiscoverSensors = useCallback(async (url?: string, tok?: string) => {
    setDiscovering(true);
    try {
      // Temporarily save config for the API call
      const tempUrl = url || baseUrl;
      const tempToken = tok || token;
      await saveHAConfig({ baseUrl: tempUrl, token: tempToken, entityId: entityId || 'temp' });

      const found = await discoverTemperatureSensors();
      setSensors(found);

      if (found.length === 0) {
        Alert.alert('No Sensors Found', 'No temperature sensors were found in Home Assistant.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setDiscovering(false);
    }
  }, [baseUrl, token, entityId]);

  const handleSelectSensor = useCallback((selectedEntityId: string) => {
    setEntityId(selectedEntityId);
  }, []);

  const handleSave = useCallback(async () => {
    if (!baseUrl.trim() || !token.trim() || !entityId.trim()) {
      Alert.alert('Missing Info', 'Please fill in all fields and select a sensor.');
      return;
    }

    await saveHAConfig({
      baseUrl: baseUrl.trim().replace(/\/$/, ''),
      token: token.trim(),
      entityId: entityId.trim(),
    });

    setIsConnected(true);
    Alert.alert('Saved!', 'Home Assistant is connected. The proofing calculator can now pull your ambient temperature automatically.');
  }, [baseUrl, token, entityId]);

  const handleDisconnect = useCallback(async () => {
    Alert.alert('Disconnect?', 'This will remove your Home Assistant connection.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await clearHAConfig();
          setBaseUrl('');
          setToken('');
          setEntityId('');
          setSensors([]);
          setIsConnected(false);
        },
      },
    ]);
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Settings</Text>

      {/* ── Home Assistant Connection ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Home Assistant</Text>
          {isConnected && (
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedText}>{preConfigured ? 'Ready' : 'Connected'}</Text>
            </View>
          )}
        </View>
        <Text style={styles.sectionHint}>
          Auto-detect your ambient temperature for proofing calculations.
        </Text>

        {/* Pre-configured state — clean summary */}
        {preConfigured && isConnected && !showManualOverride && (
          <View>
            <View style={styles.preConfigCard}>
              <Text style={styles.preConfigLabel}>Sensor</Text>
              <Text style={styles.preConfigValue}>{entityId}</Text>
            </View>
            <View style={[styles.preConfigCard, { marginTop: spacing.sm }]}>
              <Text style={styles.preConfigLabel}>Server</Text>
              <Text style={styles.preConfigValue}>{baseUrl}</Text>
            </View>
            <View style={[styles.preConfigCard, { marginTop: spacing.sm }]}>
              <Text style={styles.preConfigLabel}>Token</Text>
              <Text style={styles.preConfigValue}>••••••••••{token.slice(-6)}</Text>
            </View>

            {/* Test button */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator color={colors.amber} size="small" />
              ) : (
                <Text style={styles.testButtonText}>Test Connection</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: spacing.lg, alignItems: 'center' }}
              onPress={() => setShowManualOverride(true)}
            >
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.textMuted }}>
                Change connection settings...
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Manual config form — shown when not pre-configured or when override requested */}
        {(!preConfigured || !isConnected || showManualOverride) && (
          <View>
            {showManualOverride && (
              <View style={styles.overrideBanner}>
                <Text style={styles.overrideBannerText}>
                  Editing will override the .env configuration. Clear the override to revert.
                </Text>
              </View>
            )}

            {/* URL */}
            <Text style={styles.label}>Home Assistant URL</Text>
            <TextInput
              style={styles.input}
              placeholder="http://192.168.1.100:8123"
              placeholderTextColor={colors.textMuted}
              value={baseUrl}
              onChangeText={setBaseUrl}
              autoCapitalize="none"
              keyboardType="url"
              autoCorrect={false}
            />

            {/* Token */}
            <Text style={[styles.label, { marginTop: spacing.md }]}>Long-Lived Access Token</Text>
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
              Get this from HA → Profile (bottom-left) → scroll to "Long-Lived Access Tokens" → Create Token
            </Text>

            {/* Test connection button */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator color={colors.amber} size="small" />
              ) : (
                <Text style={styles.testButtonText}>Test Connection</Text>
              )}
            </TouchableOpacity>

            {/* Sensor selector */}
            {sensors.length > 0 && (
              <View style={styles.sensorSection}>
                <Text style={[styles.label, { marginBottom: spacing.sm }]}>Select Temperature Sensor</Text>
                {sensors.map((sensor) => (
                  <TouchableOpacity
                    key={sensor.entityId}
                    style={[
                      styles.sensorCard,
                      entityId === sensor.entityId && styles.sensorCardSelected,
                    ]}
                    onPress={() => handleSelectSensor(sensor.entityId)}
                  >
                    <View style={styles.sensorRadio}>
                      {entityId === sensor.entityId && <View style={styles.sensorRadioDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sensorName}>{sensor.friendlyName}</Text>
                      <Text style={styles.sensorEntity}>{sensor.entityId}</Text>
                    </View>
                    <Text style={styles.sensorTemp}>
                      {sensor.currentTemp}{sensor.unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Manual entity ID (alternative) */}
            {sensors.length === 0 && (
              <>
                <Text style={[styles.label, { marginTop: spacing.md }]}>
                  Sensor Entity ID (manual)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="sensor.ecobee_current_temperature"
                  placeholderTextColor={colors.textMuted}
                  value={entityId}
                  onChangeText={setEntityId}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.hint}>
                  Find this in HA → Developer Tools → States → search for "temperature"
                </Text>
              </>
            )}

            {/* Save / Disconnect / Cancel */}
            <View style={styles.buttonRow}>
              {showManualOverride && (
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={async () => {
                    await clearHAConfig();
                    const envConf = hasEnvConfig();
                    if (envConf) {
                      // Reload from .env
                      const config = await loadHAConfig();
                      if (config) {
                        setBaseUrl(config.baseUrl);
                        setToken(config.token);
                        setEntityId(config.entityId);
                      }
                    }
                    setShowManualOverride(false);
                  }}
                >
                  <Text style={styles.disconnectButtonText}>Reset to Default</Text>
                </TouchableOpacity>
              )}
              {isConnected && !showManualOverride && (
                <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                  <Text style={styles.disconnectButtonText}>Disconnect</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveButton, { flex: 1 }]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  {isConnected ? 'Update' : 'Save & Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  testButton: {
    marginTop: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  testButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.amber,
  },
  sensorSection: {
    marginTop: spacing.lg,
  },
  sensorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  sensorCardSelected: {
    borderColor: colors.amber,
    backgroundColor: colors.cream,
  },
  sensorRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensorRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.amber,
  },
  sensorName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sensorEntity: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  sensorTemp: {
    fontFamily: fonts.mono,
    fontSize: 16,
    color: colors.amber,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#fff',
  },
  disconnectButton: {
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  disconnectButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textMuted,
  },
  preConfigCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  preConfigLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
    minWidth: 60,
  },
  preConfigValue: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  overrideBanner: {
    backgroundColor: colors.warningBg,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  overrideBannerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.amber,
    lineHeight: 17,
  },
});
