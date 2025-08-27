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
}

export interface PresenceSnapshot {
  capturedAt: string;
  home: Device[];
  away: Device[];
  unknownMacsNeedingLabels: string[];
}

export type Category = 'home' | 'unknownMacsNeedingLabels' | 'away';

/**
 * A simple mapping of MAC addresses to user-provided names. You might
 * store this in a backend database in the future. For now it's just
 * an in-memory record on the frontend.
 */
export type LabelMap = Record<string, string>;