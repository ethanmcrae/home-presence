/**
 * Common TypeScript interfaces used throughout the app. Keeping
 * types in a single file makes it easier to update the shared
 * data model as your backend evolves.
 */

export interface Device {
  mac: string;
  label: string | null;
  display: string;
  connected: boolean;
  band: string | null;
  rssi: number | null;
  ip: string | null;
  ownerId?: number;
  ownerName?: string;
}

/**
 * Device data from the device API call
 */
export interface DeviceDetails {
  mac: string;
  label?: string;
  ownerId?: number;
  ownerName?: string;
};

export interface PresenceSnapshot {
  capturedAt: string;
  home: Device[];
  away: Device[];
  unclaimedDevicesNeedingLabels: string[];
}

export type Category = 'home' | 'unclaimedDevicesNeedingLabels' | 'away';

/**
 * A temporary placeholder mapping of MAC addresses to user-provided names. You might
 * store this in a backend database in the future. For now it's just
 * an in-memory record on the frontend.
 */
export type LabelMap = Record<string, string>;

export type DeviceMap = Record<string, Device>;