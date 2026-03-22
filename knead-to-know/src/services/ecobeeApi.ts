import * as SecureStore from 'expo-secure-store';
import { ECOBEE_API_KEY } from '../config/secrets';

const ECOBEE_API = 'https://api.ecobee.com';
const TOKEN_KEY = 'ecobee_tokens';

interface EcobeeTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface EcobeePin {
  ecobeePin: string;
  code: string;
  scope: string;
  expires_in: number;
  interval: number;
}

// ─── Token Storage ───

async function saveTokens(tokens: EcobeeTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
}

async function loadTokens(): Promise<EcobeeTokens | null> {
  const stored = await SecureStore.getItemAsync(TOKEN_KEY);
  return stored ? JSON.parse(stored) : null;
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  const tokens = await loadTokens();
  return tokens !== null;
}

// ─── Step 1: Request a PIN ───

export async function requestPin(): Promise<EcobeePin> {
  const response = await fetch(
    `${ECOBEE_API}/authorize?response_type=ecobeePin&client_id=${ECOBEE_API_KEY}&scope=smartRead`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw new Error(`Failed to get PIN: ${response.status}`);
  }

  return response.json();
}

// ─── Step 2: Exchange authorization code for tokens ───
// Call this AFTER the user enters the PIN at ecobee.com/consumerportal

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const response = await fetch(`${ECOBEE_API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=ecobeePin&code=${code}&client_id=${ECOBEE_API_KEY}`,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  await saveTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  });
}

// ─── Token Refresh ───

async function refreshAccessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens) throw new Error('Not authenticated with Ecobee');

  // Token still valid
  if (tokens.expires_at > Date.now() + 60000) {
    return tokens.access_token;
  }

  // Refresh it
  const response = await fetch(`${ECOBEE_API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${tokens.refresh_token}&client_id=${ECOBEE_API_KEY}`,
  });

  if (!response.ok) {
    await clearTokens();
    throw new Error('Failed to refresh token — please re-authenticate');
  }

  const data = await response.json();
  const newTokens: EcobeeTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  await saveTokens(newTokens);
  return newTokens.access_token;
}

// ─── Step 3: Read Ambient Temperature ───

export async function getAmbientTemperature(): Promise<number> {
  const accessToken = await refreshAccessToken();

  const body = {
    selection: {
      selectionType: 'registered',
      selectionMatch: '',
      includeRuntime: true,
    },
  };

  const response = await fetch(
    `${ECOBEE_API}/1/thermostat?json=${encodeURIComponent(JSON.stringify(body))}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Ecobee API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.thermostatList || data.thermostatList.length === 0) {
    throw new Error('No thermostats found on your Ecobee account');
  }

  // Ecobee returns temperature in tenths of degrees Fahrenheit
  const rawTemp = data.thermostatList[0].runtime.actualTemperature;
  return rawTemp / 10; // e.g., 720 → 72.0°F
}
