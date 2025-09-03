/**
 * Common TypeScript interfaces used throughout the app. Keeping
 * types in a single file makes it easier to update the shared
 * data model as your backend evolves.
 */

export interface Device {
  mac: string; // DB
  label: string | null; // DB
  display: string | null;
  connected: boolean;
  band: string | null; // DB
  rssi: number | null;
  ip: string | null; // DB
  presenceType?: PresenceType; // DB
  ownerId?: number;
  ownerName?: string;
  ownerType?: string;
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

export interface Owner {
  id: number;
  name: string;
  kind: 'person' | 'home' | 'guest';
};

export type Category = 'home' | 'unclaimedDevicesNeedingLabels' | 'away';

export type PresenceType = 1 | 2 | null;

export type DeviceMap = Record<string, Device>;
export type OwnerMap = Record<number, Owner>;
