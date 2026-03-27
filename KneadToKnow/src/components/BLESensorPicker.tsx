import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { getBLEScanner, BLETemperatureSensor } from '../services/bleTemperatureScanner';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

interface BLESensorPickerProps {
  onSensorSelect: (sensor: BLETemperatureSensor) => void;
  selectedSensorId?: string;
}

export function BLESensorPicker({ onSensorSelect, selectedSensorId }: BLESensorPickerProps) {
  const [scanning, setScanning] = useState(false);
  const [sensors, setSensors] = useState<BLETemperatureSensor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation while scanning
  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [scanning]);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setSensors([]);

    try {
      const scanner = getBLEScanner();
      await scanner.startScan(
        (found) => {
          // Sort by signal strength (strongest first)
          const sorted = [...found].sort((a, b) => b.rssi - a.rssi);
          setSensors(sorted);
        },
        15000 // 15 second scan
      );
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Scan Error', err.message);
    } finally {
      setScanning(false);
    }
  }, []);

  const getSignalBars = (rssi: number): number => {
    if (rssi >= -50) return 4;
    if (rssi >= -65) return 3;
    if (rssi >= -80) return 2;
    return 1;
  };

  const getTypeLabel = (type: BLETemperatureSensor['type']): string => {
    switch (type) {
      case 'ruuvi': return 'RuuviTag';
      case 'govee': return 'Govee';
      case 'standard': return 'BLE Standard';
      case 'generic': return 'Sensor';
    }
  };

  const getTypeBadgeColor = (type: BLETemperatureSensor['type']) => {
    switch (type) {
      case 'ruuvi': return { bg: '#E6F1FB', text: '#0C447C' };
      case 'govee': return { bg: '#EAF3DE', text: '#3B6D11' };
      case 'standard': return { bg: '#EEEDFE', text: '#3C3489' };
      case 'generic': return { bg: '#F1EFE8', text: '#444441' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bluetooth Sensors</Text>
        <Text style={styles.subtitle}>
          Scan for nearby BLE temperature sensors. Works with RuuviTag, Govee, 
          and any sensor using the standard Bluetooth temperature profile.
        </Text>
      </View>

      {/* Scan button */}
      <TouchableOpacity
        style={[styles.scanButton, scanning && styles.scanButtonActive]}
        onPress={scanning ? () => getBLEScanner().stopScan() : handleScan}
        activeOpacity={0.7}
      >
        {scanning ? (
          <View style={styles.scanButtonInner}>
            <Animated.View style={{
              opacity: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
            }}>
              <ActivityIndicator color="#fff" size="small" />
            </Animated.View>
            <Text style={styles.scanButtonText}>Scanning... Tap to stop</Text>
          </View>
        ) : (
          <View style={styles.scanButtonInner}>
            <Text style={styles.scanIcon}>📡</Text>
            <Text style={styles.scanButtonText}>
              {sensors.length > 0 ? 'Scan Again' : 'Scan for Sensors'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Error */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Results */}
      {sensors.length > 0 && (
        <View style={styles.results}>
          <Text style={styles.resultsLabel}>
            Found {sensors.length} sensor{sensors.length !== 1 ? 's' : ''}
          </Text>

          {sensors.map((sensor) => {
            const isSelected = selectedSensorId === sensor.id;
            const signalBars = getSignalBars(sensor.rssi);
            const typeStyle = getTypeBadgeColor(sensor.type);
            const hasTemp = sensor.tempC !== 0;

            return (
              <TouchableOpacity
                key={sensor.id}
                style={[styles.sensorCard, isSelected && styles.sensorCardSelected]}
                onPress={() => onSensorSelect(sensor)}
                activeOpacity={0.7}
              >
                <View style={styles.sensorHeader}>
                  {/* Radio */}
                  <View style={styles.radioOuter}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>

                  {/* Name & type */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sensorName}>{sensor.name}</Text>
                    <View style={styles.sensorMeta}>
                      <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
                        <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>
                          {getTypeLabel(sensor.type)}
                        </Text>
                      </View>

                      {/* Signal strength */}
                      <View style={styles.signalBars}>
                        {[1, 2, 3, 4].map((bar) => (
                          <View
                            key={bar}
                            style={[
                              styles.signalBar,
                              { height: 4 + bar * 3 },
                              bar <= signalBars ? styles.signalBarActive : styles.signalBarInactive,
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Temperature reading */}
                  {hasTemp ? (
                    <View style={styles.tempReading}>
                      <Text style={styles.tempValue}>{Math.round(sensor.tempF)}°F</Text>
                      <Text style={styles.tempSubvalue}>{sensor.tempC}°C</Text>
                    </View>
                  ) : (
                    <View style={styles.tempReading}>
                      <Text style={styles.tempPlaceholder}>Tap to read</Text>
                    </View>
                  )}
                </View>

                {/* Humidity if available */}
                {sensor.humidity !== undefined && sensor.humidity > 0 && (
                  <Text style={styles.humidityText}>
                    Humidity: {sensor.humidity}%
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Empty state after scan */}
      {!scanning && sensors.length === 0 && error === null && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>
            No sensors found yet. Make sure your Bluetooth sensor is nearby and turned on, 
            then tap "Scan for Sensors."
          </Text>
          <Text style={styles.emptyHint}>
            Supported: RuuviTag, Govee, ThermoPro, and any sensor using Bluetooth 
            Environmental Sensing standard.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  scanButton: {
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scanButtonActive: {
    backgroundColor: colors.textSecondary,
  },
  scanButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scanIcon: {
    fontSize: 18,
  },
  scanButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: '#fff',
  },
  errorBox: {
    backgroundColor: '#FCEBEB',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#F7C1C1',
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#A32D2D',
    lineHeight: 18,
  },
  results: {
    marginBottom: spacing.lg,
  },
  resultsLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm + 2,
  },
  sensorCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm + 2,
  },
  sensorCardSelected: {
    borderColor: colors.amber,
    backgroundColor: colors.cream,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.amber,
  },
  sensorName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sensorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  signalBar: {
    width: 4,
    borderRadius: 1,
  },
  signalBarActive: {
    backgroundColor: colors.success,
  },
  signalBarInactive: {
    backgroundColor: colors.borderLight,
  },
  tempReading: {
    alignItems: 'flex-end',
  },
  tempValue: {
    fontFamily: fonts.mono,
    fontSize: 20,
    color: colors.amber,
    fontWeight: '500',
  },
  tempSubvalue: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textMuted,
  },
  tempPlaceholder: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  humidityText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginLeft: 32,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  emptyHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
