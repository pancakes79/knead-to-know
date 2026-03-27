/**
 * Temperature Provider System for Knead to Know
 *
 * Supports four sources, from simplest to most advanced:
 *   1. Weather API (Open-Meteo) — free, no key, uses device location
 *   2. Manual slider — user sets it themselves
 *   3. Home Assistant — local smart home hub
 *   4. Google Nest — Google's SDM API
 *
 * Each provider returns temperature in °F.
 * The active provider is stored per-user in Firestore.
 */

export type TemperatureSource = 'weather' | 'manual' | 'home_assistant' | 'google_nest' | 'bluetooth';

export interface TemperatureResult {
  tempF: number;
  source: TemperatureSource;
  label: string;           // e.g., "Outdoor: 72°F (est. indoor: 74°F)"
  timestamp: Date;
  isEstimate: boolean;     // true for weather API (outdoor → indoor estimate)
}

export interface TemperatureProviderConfig {
  source: TemperatureSource;
  // Weather API
  latitude?: number;
  longitude?: number;
  indoorOffsetF?: number;  // default +3°F added to outdoor temp
  // Home Assistant
  haUrl?: string;
  haToken?: string;
  haEntityId?: string;
  // Google Nest
  nestAccessToken?: string;
  nestDeviceId?: string;
  nestProjectId?: string;
  // Bluetooth
  bleSensorId?: string;
  bleTempF?: number;  // pre-read value from BLESensorPicker
}

// ─── Weather API (Open-Meteo) ───
// Completely free, no API key needed, no signup
// Returns outdoor temperature — we add an indoor offset estimate

async function fetchWeatherTemperature(
  latitude: number,
  longitude: number,
  indoorOffsetF: number = 3
): Promise<TemperatureResult> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m` +
    `&temperature_unit=fahrenheit`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  const outdoorTempF = data.current.temperature_2m;
  const estimatedIndoorF = Math.round((outdoorTempF + indoorOffsetF) * 10) / 10;

  return {
    tempF: estimatedIndoorF,
    source: 'weather',
    label: `Outdoor: ${Math.round(outdoorTempF)}°F → Est. indoor: ${Math.round(estimatedIndoorF)}°F`,
    timestamp: new Date(),
    isEstimate: true,
  };
}

// ─── Home Assistant ───

async function fetchHATemperature(
  url: string,
  token: string,
  entityId: string
): Promise<TemperatureResult> {
  const response = await fetch(`${url}/api/states/${entityId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Invalid Home Assistant token.');
    if (response.status === 404) throw new Error(`Sensor "${entityId}" not found.`);
    throw new Error(`Home Assistant error: ${response.status}`);
  }

  const data = await response.json();
  let tempF = parseFloat(data.state);
  if (isNaN(tempF)) throw new Error(`Invalid sensor value: "${data.state}"`);

  const unit = data.attributes?.unit_of_measurement || '';
  if (unit === '°C' || unit === 'C') {
    tempF = Math.round((tempF * 9 / 5 + 32) * 10) / 10;
  }

  const name = data.attributes?.friendly_name || entityId;

  return {
    tempF,
    source: 'home_assistant',
    label: `${name}: ${Math.round(tempF)}°F`,
    timestamp: new Date(),
    isEstimate: false,
  };
}

// ─── Google Nest ───

async function fetchNestTemperature(
  accessToken: string,
  projectId: string,
  deviceId: string
): Promise<TemperatureResult> {
  const url =
    `https://smartdevicemanagement.googleapis.com/v1/` +
    `enterprises/${projectId}/devices/${deviceId}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Nest token expired. Please re-authenticate.');
    throw new Error(`Nest API error: ${response.status}`);
  }

  const data = await response.json();
  const tempC = data.traits?.['sdm.devices.traits.Temperature']?.ambientTemperatureCelsius;

  if (tempC === undefined || tempC === null) {
    throw new Error('Could not read temperature from Nest device.');
  }

  const tempF = Math.round((tempC * 9 / 5 + 32) * 10) / 10;
  const name = data.traits?.['sdm.devices.traits.Info']?.customName || 'Nest Thermostat';

  return {
    tempF,
    source: 'google_nest',
    label: `${name}: ${Math.round(tempF)}°F`,
    timestamp: new Date(),
    isEstimate: false,
  };
}

// ─── Main fetch function ───

export async function fetchTemperature(
  config: TemperatureProviderConfig
): Promise<TemperatureResult> {
  switch (config.source) {
    case 'weather':
      if (!config.latitude || !config.longitude) {
        throw new Error('Location not available. Please enable location services or enter temperature manually.');
      }
      return fetchWeatherTemperature(
        config.latitude,
        config.longitude,
        config.indoorOffsetF ?? 3
      );

    case 'home_assistant':
      if (!config.haUrl || !config.haToken || !config.haEntityId) {
        throw new Error('Home Assistant not configured. Go to Settings to connect.');
      }
      return fetchHATemperature(config.haUrl, config.haToken, config.haEntityId);

    case 'google_nest':
      if (!config.nestAccessToken || !config.nestProjectId || !config.nestDeviceId) {
        throw new Error('Google Nest not configured. Go to Settings to connect.');
      }
      return fetchNestTemperature(
        config.nestAccessToken,
        config.nestProjectId,
        config.nestDeviceId
      );

    case 'manual':
      throw new Error('Manual mode — use the slider.');

    case 'bluetooth':
      if (!config.bleTempF && config.bleTempF !== 0) {
        throw new Error('No Bluetooth sensor reading. Go to Settings to scan and select a sensor.');
      }
      return {
        tempF: config.bleTempF,
        source: 'bluetooth',
        label: `BLE Sensor: ${Math.round(config.bleTempF)}°F`,
        timestamp: new Date(),
        isEstimate: false,
      };

    default:
      throw new Error(`Unknown temperature source: ${config.source}`);
  }
}

// ─── Provider metadata (for Settings UI) ───

export const TEMPERATURE_PROVIDERS: Array<{
  source: TemperatureSource;
  name: string;
  description: string;
  icon: string;
  setupRequired: boolean;
}> = [
  {
    source: 'weather',
    name: 'Weather (automatic)',
    description: 'Uses your location to estimate indoor temperature from outdoor weather data. No setup needed.',
    icon: '🌤',
    setupRequired: false,
  },
  {
    source: 'manual',
    name: 'Manual',
    description: 'Set the temperature yourself using a slider.',
    icon: '🎚',
    setupRequired: false,
  },
  {
    source: 'home_assistant',
    name: 'Home Assistant',
    description: 'Pull temperature from a sensor in your Home Assistant setup.',
    icon: '🏠',
    setupRequired: true,
  },
  {
    source: 'google_nest',
    name: 'Google Nest',
    description: 'Read ambient temperature from your Nest thermostat. Requires a one-time $5 Google API fee.',
    icon: '🌡',
    setupRequired: true,
  },
  {
    source: 'bluetooth',
    name: 'Bluetooth Sensor',
    description: 'Connect to a nearby BLE temperature sensor. Works with RuuviTag, Govee, and standard Bluetooth sensors.',
    icon: '📡',
    setupRequired: true,
  },
];
