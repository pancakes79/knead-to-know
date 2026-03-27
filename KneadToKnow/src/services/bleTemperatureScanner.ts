/**
 * BLE Temperature Scanner for Knead to Know
 *
 * Scans for nearby Bluetooth Low Energy temperature sensors using:
 *   1. Standard BLE Environmental Sensing Service (UUID 0x181A)
 *   2. RuuviTag RAWv2 format (manufacturer data, open protocol)
 *   3. Govee temperature sensors (manufacturer data pattern matching)
 *   4. Generic manufacturer data with recognizable temperature patterns
 *
 * Requires: react-native-ble-plx
 *   npx expo install react-native-ble-plx
 *
 * IMPORTANT: BLE requires a custom dev build (not Expo Go).
 *   Also add to app.json plugins:
 *   ["react-native-ble-plx", { "isBackgroundEnabled": false }]
 */

import { BleManager, Device, State } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

// ─── Standard BLE UUIDs ───
const ENVIRONMENTAL_SENSING_SERVICE = '0000181a-0000-1000-8000-00805f9b34fb';
const TEMPERATURE_CHARACTERISTIC = '00002a6e-0000-1000-8000-00805f9b34fb';

// ─── Known Manufacturer IDs ───
const RUUVI_MANUFACTURER_ID = 0x0499; // Ruuvi Innovations

// ─── Types ───

export interface BLETemperatureSensor {
  id: string;                // BLE device ID
  name: string;              // Display name
  tempC: number;             // Temperature in Celsius
  tempF: number;             // Temperature in Fahrenheit
  humidity?: number;         // Humidity % if available
  rssi: number;              // Signal strength (closer to 0 = stronger)
  type: 'standard' | 'ruuvi' | 'govee' | 'generic';
  lastSeen: Date;
}

type ScanCallback = (sensors: BLETemperatureSensor[]) => void;

// ─── Scanner Class ───

class BLETemperatureScanner {
  private manager: BleManager;
  private discoveredSensors: Map<string, BLETemperatureSensor> = new Map();
  private scanning = false;

  constructor() {
    this.manager = new BleManager();
  }

  // ─── Permissions ───

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version;

      if (apiLevel >= 31) {
        // Android 12+
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(results).every(
          (r) => r === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // Android < 12
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    // iOS permissions are handled by Info.plist
    return true;
  }

  async ensureBluetoothReady(): Promise<void> {
    const state = await this.manager.state();
    if (state !== State.PoweredOn) {
      throw new Error(
        'Bluetooth is turned off. Please enable Bluetooth in your device settings.'
      );
    }
  }

  // ─── Scanning ───

  async startScan(
    onUpdate: ScanCallback,
    durationMs: number = 10000
  ): Promise<BLETemperatureSensor[]> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error(
        'Bluetooth permissions are required to scan for temperature sensors.'
      );
    }

    await this.ensureBluetoothReady();

    this.discoveredSensors.clear();
    this.scanning = true;

    return new Promise((resolve) => {
      // Stop scanning after duration
      const timeout = setTimeout(() => {
        this.stopScan();
        resolve(Array.from(this.discoveredSensors.values()));
      }, durationMs);

      this.manager.startDeviceScan(
        null, // scan all services (we filter ourselves)
        { allowDuplicates: true },
        (error, device) => {
          if (error) {
            console.warn('BLE scan error:', error.message);
            return;
          }
          if (!device) return;

          const sensor = this.parseDevice(device);
          if (sensor) {
            this.discoveredSensors.set(sensor.id, sensor);
            onUpdate(Array.from(this.discoveredSensors.values()));
          }
        }
      );
    });
  }

  stopScan(): void {
    if (this.scanning) {
      this.manager.stopDeviceScan();
      this.scanning = false;
    }
  }

  // ─── Read from a specific standard ESS sensor ───

  async readStandardSensor(deviceId: string): Promise<number> {
    const device = await this.manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();

    const characteristic = await device.readCharacteristicForService(
      ENVIRONMENTAL_SENSING_SERVICE,
      TEMPERATURE_CHARACTERISTIC
    );

    await device.cancelConnection();

    if (!characteristic.value) {
      throw new Error('No temperature data received from sensor.');
    }

    // Standard BLE temperature is int16 in 0.01°C units, base64 encoded
    const bytes = base64ToBytes(characteristic.value);
    const rawValue = bytes[0] | (bytes[1] << 8);
    // Handle signed int16
    const signed = rawValue > 32767 ? rawValue - 65536 : rawValue;
    return signed / 100;
  }

  // ─── Parse device advertisement data ───

  private parseDevice(device: Device): BLETemperatureSensor | null {
    // Try each parser in order
    return (
      this.parseRuuviTag(device) ||
      this.parseGovee(device) ||
      this.parseStandardESS(device) ||
      this.parseGenericManufacturer(device)
    );
  }

  // ─── RuuviTag Parser (RAWv2 format, data format 5) ───

  private parseRuuviTag(device: Device): BLETemperatureSensor | null {
    const mfgData = device.manufacturerData;
    if (!mfgData) return null;

    const bytes = base64ToBytes(mfgData);
    if (bytes.length < 4) return null;

    // Check manufacturer ID (little-endian)
    const mfgId = bytes[0] | (bytes[1] << 8);
    if (mfgId !== RUUVI_MANUFACTURER_ID) return null;

    const dataFormat = bytes[2];

    // RAWv2 (format 5)
    if (dataFormat === 5 && bytes.length >= 16) {
      // Temperature: bytes 3-4, unsigned, in 0.005°C units
      const rawTemp = (bytes[3] << 8) | bytes[4];
      const tempC = (rawTemp - 32767.5) * 0.005;

      // Humidity: bytes 5-6, unsigned, in 0.0025% units
      const rawHumidity = (bytes[5] << 8) | bytes[6];
      const humidity = rawHumidity * 0.0025;

      if (tempC < -40 || tempC > 85) return null; // sanity check

      return {
        id: device.id,
        name: device.name || device.localName || `RuuviTag (${device.id.slice(-5)})`,
        tempC: Math.round(tempC * 100) / 100,
        tempF: Math.round((tempC * 9 / 5 + 32) * 10) / 10,
        humidity: Math.round(humidity * 10) / 10,
        rssi: device.rssi || -100,
        type: 'ruuvi',
        lastSeen: new Date(),
      };
    }

    // RAWv1 (format 3)
    if (dataFormat === 3 && bytes.length >= 14) {
      const tempUnsigned = bytes[4];
      const tempFraction = bytes[5];
      let tempC = tempUnsigned + tempFraction / 100;
      if (bytes[3] & 0x80) tempC = -tempC; // sign bit

      const humidity = bytes[3] & 0x7f; // 0.5% units * 2

      return {
        id: device.id,
        name: device.name || device.localName || `RuuviTag (${device.id.slice(-5)})`,
        tempC: Math.round(tempC * 100) / 100,
        tempF: Math.round((tempC * 9 / 5 + 32) * 10) / 10,
        humidity: humidity * 0.5,
        rssi: device.rssi || -100,
        type: 'ruuvi',
        lastSeen: new Date(),
      };
    }

    return null;
  }

  // ─── Govee Parser ───
  // Govee sensors encode temp and humidity in manufacturer data.
  // Pattern: 3 bytes of temp+humidity data where temp = (byte0 << 16 | byte1 << 8 | byte2) / 10000

  private parseGovee(device: Device): BLETemperatureSensor | null {
    const name = device.name || device.localName || '';
    if (!name.startsWith('GVH') && !name.startsWith('Govee')) return null;

    const mfgData = device.manufacturerData;
    if (!mfgData) return null;

    const bytes = base64ToBytes(mfgData);
    if (bytes.length < 8) return null;

    // Govee encoding: skip first 2 bytes (manufacturer ID),
    // then next 3 bytes encode temperature and humidity
    // The combined value divided by 1000 = temp in °C, remainder / 10 = humidity
    try {
      const rawValue = (bytes[3] << 16) | (bytes[4] << 8) | bytes[5];
      const isNegative = rawValue & 0x800000;
      const absValue = isNegative ? rawValue ^ 0x800000 : rawValue;

      const tempC = (isNegative ? -1 : 1) * Math.floor(absValue / 1000) / 10;
      const humidity = (absValue % 1000) / 10;

      if (tempC < -40 || tempC > 60) return null;

      return {
        id: device.id,
        name: name || `Govee Sensor (${device.id.slice(-5)})`,
        tempC: Math.round(tempC * 10) / 10,
        tempF: Math.round((tempC * 9 / 5 + 32) * 10) / 10,
        humidity: Math.round(humidity * 10) / 10,
        rssi: device.rssi || -100,
        type: 'govee',
        lastSeen: new Date(),
      };
    } catch {
      return null;
    }
  }

  // ─── Standard BLE Environmental Sensing Service ───
  // Some sensors advertise the ESS UUID in their service list

  private parseStandardESS(device: Device): BLETemperatureSensor | null {
    const serviceUUIDs = device.serviceUUIDs || [];
    const hasESS = serviceUUIDs.some(
      (uuid) => uuid.toLowerCase().includes('181a')
    );

    if (!hasESS) return null;

    // We found a standard ESS sensor but can't read the value from advertisement
    // alone — the proofing screen will connect and read the characteristic
    return {
      id: device.id,
      name: device.name || device.localName || `BLE Sensor (${device.id.slice(-5)})`,
      tempC: 0, // Placeholder — needs a connected read
      tempF: 0,
      rssi: device.rssi || -100,
      type: 'standard',
      lastSeen: new Date(),
    };
  }

  // ─── Generic manufacturer data pattern matching ───
  // Last resort: look for common temp/humidity patterns in manufacturer data

  private parseGenericManufacturer(device: Device): BLETemperatureSensor | null {
    // Only consider devices with names suggesting they're sensors
    const name = (device.name || device.localName || '').toLowerCase();
    const sensorKeywords = ['temp', 'thermo', 'hygro', 'sensor', 'monitor', 'weather'];
    const looksLikeSensor = sensorKeywords.some((kw) => name.includes(kw));

    if (!looksLikeSensor) return null;
    if (!device.manufacturerData) return null;

    // We found something that looks like a sensor but can't parse the data.
    // Return it so the user can see it, but with a zero temp
    // (they'll need to connect to read the actual value).
    return {
      id: device.id,
      name: device.name || device.localName || `Sensor (${device.id.slice(-5)})`,
      tempC: 0,
      tempF: 0,
      rssi: device.rssi || -100,
      type: 'generic',
      lastSeen: new Date(),
    };
  }

  // ─── Cleanup ───

  destroy(): void {
    this.stopScan();
    this.manager.destroy();
  }
}

// ─── Utility ───

function base64ToBytes(base64: string): number[] {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes: number[] = [];

  let buffer = 0;
  let bits = 0;

  for (const char of base64) {
    if (char === '=') break;
    const val = chars.indexOf(char);
    if (val === -1) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return bytes;
}

// ─── Singleton ───

let scannerInstance: BLETemperatureScanner | null = null;

export function getBLEScanner(): BLETemperatureScanner {
  if (!scannerInstance) {
    scannerInstance = new BLETemperatureScanner();
  }
  return scannerInstance;
}

export { BLETemperatureScanner };
