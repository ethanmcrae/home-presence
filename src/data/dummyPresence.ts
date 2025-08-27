import { PresenceSnapshot } from '../types';

/**
 * Dummy presence data used for development. In production your
 * frontend would fetch snapshots from your Express backend (which
 * calls presence.ts). The structure here matches the output of
 * presence.ts exactly: capturedAt timestamp, home and away arrays
 * of devices, and unknownMacsNeedingLabels. Feel free to add more
 * devices for testing.
 */
export const dummyPresence: PresenceSnapshot = {
  capturedAt: '2025-08-26T22:27:46.450Z',
  home: [
    {
      mac: 'EC:B5:FA:9E:77:6D',
      label: null,
      display: 'ecb5fa9e776d',
      connected: true,
      band: 'wired',
      rssi: 0,
      ip: '192.168.50.12'
    }
  ],
  away: [
    {
      mac: '00:00:00:00:00:00',
      label: null,
      display: 'example-away-device',
      connected: false,
      band: '5g',
      rssi: -100,
      ip: '192.168.50.250'
    }
  ],
  unknownMacsNeedingLabels: ['EC:B5:FA:9E:77:6D']
};