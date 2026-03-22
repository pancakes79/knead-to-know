import * as SecureStore from 'expo-secure-store';

// ─── Configuration ───
// Priority: .env variables first, then in-app overrides stored in SecureStore
const HA_CONFIG_KEY = 'home_assistant_config';

interface HAConfig {
  baseUrl: string;     // e.g., "http://192.168.1.100:8123" or your Nabu Casa URL
  token: string;       // Long-lived access token
  entityId: string;    // e.g., "sensor.ecobee_current_temperature"
}

// ─── Environment defaults (from .env file) ───

function getEnvConfig(): HAConfig | null {
  const baseUrl = process.env.EXPO_PUBLIC_HA_URL;
  const token = process.env.EXPO_PUBLIC_HA_TOKEN;
  const entityId = process.env.EXPO_PUBLIC_HA_ENTITY_ID;

  if (baseUrl && token && entityId &&
      !baseUrl.includes('your-ha-ip') &&
      !token.includes('your_long_lived')) {
    return {
      baseUrl: baseUrl.replace(/\/$/, ''),
      token,
      entityId,
    };
  }
  return null;
}

// ─── Config Storage (in-app overrides) ───

export async function saveHAConfig(config: HAConfig): Promise<void> {
  await SecureStore.setItemAsync(HA_CONFIG_KEY, JSON.stringify(config));
}

export async function loadHAConfig(): Promise<HAConfig | null> {
  // Check SecureStore first (in-app overrides take priority)
  try {
    const stored = await SecureStore.getItemAsync(HA_CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // SecureStore not available or empty — fall through
  }

  // Fall back to .env values
  return getEnvConfig();
}

export async function clearHAConfig(): Promise<void> {
  await SecureStore.deleteItemAsync(HA_CONFIG_KEY);
}

export async function isConfigured(): Promise<boolean> {
  const config = await loadHAConfig();
  return config !== null;
}

/**
 * Check if configuration came from .env (pre-configured)
 * vs. manually entered in the Settings screen.
 */
export function hasEnvConfig(): boolean {
  return getEnvConfig() !== null;
}

// ─── Read Temperature ───

/**
 * Fetch the current ambient temperature from Home Assistant.
 *
 * Uses the HA REST API:
 *   GET /api/states/{entity_id}
 *   Authorization: Bearer {long_lived_token}
 *
 * Returns temperature in °F (converts from °C if needed).
 */
export async function getAmbientTemperature(): Promise<number> {
  const config = await loadHAConfig();
  if (!config) {
    throw new Error('Home Assistant not configured. Go to Settings to connect.');
  }

  const url = `${config.baseUrl}/api/states/${config.entityId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid Home Assistant token. Check your .env file or update in Settings.');
    }
    if (response.status === 404) {
      throw new Error(`Sensor "${config.entityId}" not found. Check the entity ID in your .env file or Settings.`);
    }
    throw new Error(`Home Assistant error: ${response.status}`);
  }

  const data = await response.json();

  // HA returns state as a string, e.g. "72.5"
  const temp = parseFloat(data.state);
  if (isNaN(temp)) {
    throw new Error(`Sensor returned invalid value: "${data.state}". Is it a temperature sensor?`);
  }

  // Check the unit and convert to °F if needed
  const unit = data.attributes?.unit_of_measurement || '';
  if (unit === '°C' || unit === 'C') {
    return Math.round((temp * 9 / 5 + 32) * 10) / 10;
  }

  return Math.round(temp * 10) / 10;
}

// ─── Discover Temperature Sensors ───

/**
 * Fetch all temperature sensors from Home Assistant.
 * Useful for finding the right entity ID during setup.
 */
export async function discoverTemperatureSensors(): Promise<Array<{
  entityId: string;
  friendlyName: string;
  currentTemp: string;
  unit: string;
}>> {
  const config = await loadHAConfig();
  if (!config) {
    throw new Error('Home Assistant not configured.');
  }

  const response = await fetch(`${config.baseUrl}/api/states`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sensors: ${response.status}`);
  }

  const allStates = await response.json();

  // Filter to only temperature sensors
  return allStates
    .filter((entity: any) => {
      const isTemp = entity.attributes?.device_class === 'temperature';
      const isTempUnit = ['°F', '°C', 'F', 'C'].includes(entity.attributes?.unit_of_measurement || '');
      const isSensor = entity.entity_id.startsWith('sensor.');
      return isSensor && (isTemp || isTempUnit);
    })
    .map((entity: any) => ({
      entityId: entity.entity_id,
      friendlyName: entity.attributes?.friendly_name || entity.entity_id,
      currentTemp: entity.state,
      unit: entity.attributes?.unit_of_measurement || '°F',
    }))
    .sort((a: any, b: any) => a.friendlyName.localeCompare(b.friendlyName));
}

// ─── Test Connection ───

/**
 * Quick test to verify the HA connection works.
 */
export async function testConnection(baseUrl: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/config`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
