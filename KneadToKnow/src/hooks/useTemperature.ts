import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import {
  fetchTemperature,
  TemperatureSource,
  TemperatureResult,
  TemperatureProviderConfig,
} from '../services/temperatureProvider';

interface UseTemperatureOptions {
  source: TemperatureSource;
  // HA config (from user's Firestore doc or .env)
  haUrl?: string;
  haToken?: string;
  haEntityId?: string;
  // Nest config (from user's Firestore doc)
  nestAccessToken?: string;
  nestProjectId?: string;
  nestDeviceId?: string;
  // Weather options
  indoorOffsetF?: number;
}

interface UseTemperatureReturn {
  loading: boolean;
  error: string | null;
  result: TemperatureResult | null;
  pullTemperature: () => Promise<number | null>;
}

export function useTemperature(options: UseTemperatureOptions): UseTemperatureReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TemperatureResult | null>(null);

  const pullTemperature = useCallback(async (): Promise<number | null> => {
    if (options.source === 'manual') {
      setError('Use the slider for manual mode.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      let config: TemperatureProviderConfig = { source: options.source };

      // ─── Weather: get device location ───
      if (options.source === 'weather') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission is needed for weather-based temperature. You can switch to manual mode in Settings.');
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        config.latitude = location.coords.latitude;
        config.longitude = location.coords.longitude;
        config.indoorOffsetF = options.indoorOffsetF ?? 3;
      }

      // ─── Home Assistant ───
      if (options.source === 'home_assistant') {
        config.haUrl = options.haUrl;
        config.haToken = options.haToken;
        config.haEntityId = options.haEntityId;
      }

      // ─── Google Nest ───
      if (options.source === 'google_nest') {
        config.nestAccessToken = options.nestAccessToken;
        config.nestProjectId = options.nestProjectId;
        config.nestDeviceId = options.nestDeviceId;
      }

      const tempResult = await fetchTemperature(config);
      setResult(tempResult);
      return tempResult.tempF;
    } catch (err: any) {
      setError(err.message || 'Failed to get temperature.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [options]);

  return { loading, error, result, pullTemperature };
}
