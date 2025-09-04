import React, { useEffect, useMemo, useState } from 'react';
import { PersonCard } from './components/PersonCard';
import { DeviceTable } from './components/DeviceTable';
import { MaintenanceView } from './components/MaintenanceView';
import type { Device, PresenceSnapshot, Category, DeviceMap, DeviceDetails, OwnerMap, PresenceType } from './types';
import { getPresenceSnapshot } from './api/router';
import { listDeviceDetails, upsertDevice, upsertDeviceLabel } from './api/devices';
import { listOwners } from './api/owners';
import { setDeviceOwner } from './api/devices';
import { SettingsOwners } from './components/SettingsOwners';
import { scrubNullish } from './helpers/objects';

function buildDeviceMapFrom(snapshot: PresenceSnapshot, dbDevices: Record<string, DeviceDetails>, owners: OwnerMap): DeviceMap {
  const merged: DeviceMap = {};
  const all: Device[] = [...snapshot.home, ...snapshot.away];
  for (const device of all) {
    const { mac } = device
    if (!merged[mac]) {
      const details = scrubNullish(dbDevices[mac] || {});
      // Try to assign owner
      const ownerDetails: any = {};
      if (details.ownerId && owners[details.ownerId]) {
        const owner = owners[details.ownerId];
        ownerDetails.ownerName = owner.name;
        ownerDetails.ownerType = owner.kind;
      }
      merged[mac] = { ...device, ...details, ...ownerDetails } as Device
    }
  }
  // Gather 'away' devices
  for (const mac in dbDevices) {
    if (merged[mac]) {
      continue; // Do not overwrite the router's data
    }
    
    const deviceRecord = dbDevices[mac];
    const awayDevice: Device = {
      label: null,
      display: null,
      connected: false,
      band: null,
      rssi: null,
      ip: null,
      ...deviceRecord, // Overwrite nulls with pre-recorded fields
    };
    merged[mac] = awayDevice
    console.log(mac, 'doesn\'t exist', awayDevice);
  }
  return merged;
}

/**
 * Root component for the home presence tracker application. This version
 * calls the router-backed getPresenceSnapshot() (no options) instead of
 * using dummyPresence. UI and behavior remain a drop-in replacement.
 */
const App: React.FC = () => {
  // Live presence snapshot fetched from the router API.
  const [snapshot, setSnapshot] = useState<PresenceSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // A map of MAC → device details. When the user updates a device in the
  // maintenance view or device table this state is updated.
  const [deviceMap, setDeviceMap] = useState<DeviceMap>({});

  // Consider‑home threshold in milliseconds. Devices that are offline
  // but last seen within this period will still be counted as home.
  const [considerHomeMs, setConsiderHomeMs] = useState<number>(5 * 60 * 1000); // default 5 minutes

  // Which tab is active: 'dashboard' or 'maintenance'.
  const [activeTab, setActiveTab] = useState<'dashboard' | 'maintenance' | 'settings'>('dashboard');

  // Owners list
  const [owners, setOwners] = useState<OwnerMap>({});

  // Fetch a fresh snapshot from the router. Options are intentionally
  // omitted per the requirement — we call getPresenceSnapshot() directly.
  const fetchSnapshot = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getPresenceSnapshot();
      // The presence module's type is shape-compatible with our UI types.
      setSnapshot(snap as unknown as PresenceSnapshot);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to load presence snapshot');
    } finally {
      setLoading(false);
    }
  };

  const loadOwnersOnce = async () => {
    try {
      const os = await listOwners();
      const map: OwnerMap = {};
      for (const o of os) map[o.id] = o;

      setOwners(map);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshDerivedFromSnapshot = async (snap: PresenceSnapshot, opts?: { canceled?: () => boolean }) => {
    try {
      const dbDevices = await listDeviceDetails();
      if (opts?.canceled?.()) return;
      setDeviceMap(buildDeviceMapFrom(snap, dbDevices, owners));
    } catch (e) {
      console.error(e);
    }
  };

  // On mount: fetch snapshot and owners
  useEffect(() => {
    loadOwnersOnce();
    fetchSnapshot();
  }, []);

  // Whenever snapshot changes: rebuild devices
  useEffect(() => {
    if (!snapshot) return;
    let cancelled = false;
    const canceled = () => cancelled;

    (async () => {
      await refreshDerivedFromSnapshot(snapshot, { canceled });
    })();

    return () => { cancelled = true; };
  }, [snapshot, owners]);

  /** Assigns a new label to a MAC address. */
  const handleSetLabel = async (mac: string, label: string) => {
    // optimistic update
    setDeviceMap((prev) => {
      const next = { ...prev };
      if (!label) delete next[mac]; else next[mac] = { ...next[mac], label };
      return next;
    });

    try {
      await upsertDeviceLabel(mac, label);
    } catch (e: any) {
      console.error(e);
      // rollback
      setDeviceMap((prev) => {
        const next = { ...prev };
        // revert to previous value by reloading from server (simple approach):
        // you could also cache the "before" value locally for a more exact rollback
        return next; // keep optimistic value while we show the error
      });
      setError(e?.message || 'Failed to save label');
    }
  };

  /** Adds a label and removes the MAC from unknownMacs. */
  const handleAddLabel = async (mac: string, label: string, category: Category) => {
    await handleSetLabel(mac, label);
    setSnapshot((prev) => {
      if (!prev) return prev;
      const filteredUnknown = prev[category].filter((m) => m !== mac);
      return { ...prev, [category]: filteredUnknown };
    });
  };

  const handleSetOwner = async (mac: string, ownerId?: number, ownerName?: string) => {
    try {
      await setDeviceOwner(mac, ownerId ?? null);
      const updatedDevice: Device = { ...deviceMap[mac], ownerId, ownerName }
      setDeviceMap((map) => ({ ...map, [mac]: updatedDevice }));
    } catch (e: any) {
      setError(e?.message || "Failed to set owner");
    }
  };

  const handleSetPresenceType = async (mac: string, presenceType?: PresenceType) => {
    try {
      await upsertDevice(mac, { presenceType });
      const updatedDevice: Device = { ...deviceMap[mac], presenceType: presenceType ?? null }
      setDeviceMap((map) => ({ ...map, [mac]: updatedDevice }));
    } catch (e: any) {
      setError(e?.message || "Failed to update presence type for device");
    }
  };

  /** Derive persons from the current snapshot + label map. */
  const persons = useMemo(() => {
    if (!snapshot) return [] as { name: string; devices: Record<'primary' | 'secondary' | 'all', Device[]>; isHome: boolean }[];

    const grouped: Record<string, Record<'primary' | 'secondary' | 'all', Device[]>> = {};
    const allDevices: Device[] = [...Object.values(deviceMap)];

    // Initialize each person's device lists
    for (const ownerId in owners) {
      const owner = owners[ownerId];
      if (owner.id === 1) continue;
      grouped[owner.name] = { primary: [], secondary: [], all: [] };
    }

    // Populate devices
    allDevices.forEach((device) => {
      const owner = device?.ownerName;
      if (owner && device.ownerId !== 1) {
        if (device.presenceType) {
          grouped[owner].all.push(device);
          if (device.presenceType === 1) {
            grouped[owner].primary.push(device);
          } else if (device.presenceType === 2) {
            grouped[owner].secondary.push(device);
          }
        }
      }
    });

    const capturedDate = new Date(snapshot.capturedAt);
    const timeSinceCapture = Date.now() - capturedDate.getTime();

    return Object.entries(grouped).map(([name, devices]) => {
      const isHome = devices.all.some((d) => {
        const offlineButWithinWindow = !d.connected && timeSinceCapture < considerHomeMs;
        return d.presenceType === 1 && d.display && (d.connected || offlineButWithinWindow);
      });
      return { name, devices, isHome };
    });
  }, [snapshot, deviceMap, considerHomeMs]);

  return (
    <div className="max-w-7xl mx-auto p-4 bg-gray-50 text-gray-900 dark:bg-[#0b0f18] dark:text-gray-100 min-h-screen">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Home Presence Tracker</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Creepy stalky roomate watchy</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-60 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 dark:focus:ring-indigo-400/50"
            onClick={fetchSnapshot}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/50">
          {error}
        </div>
      )}

      {loading && !snapshot && (
        <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading presence…</div>
      )}

      {snapshot && (
        <>
          <nav className="mb-6 flex gap-2 sm:gap-4">
            <button
              className={`${activeTab === "dashboard"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100/90 dark:hover:bg-gray-700"
                } px-3 py-2 rounded transition-colors`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`${activeTab === "maintenance"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100/90 dark:hover:bg-gray-700"
                } px-3 py-2 rounded transition-colors`}
              onClick={() => setActiveTab("maintenance")}
            >
              Maintenance
            </button>
            <button
              className={`${activeTab === "settings"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100/90 dark:hover:bg-gray-700"
                } px-3 py-2 rounded transition-colors`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </nav>

          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Presence assertions control */}
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md flex flex-col gap-2 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <label htmlFor="considerHome" className="text-gray-700 dark:text-gray-200 text-sm">
                    Consider home window (minutes):
                  </label>
                  <input
                    id="considerHome"
                    type="number"
                    className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 w-20 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 dark:focus:ring-indigo-400/50"
                    value={Math.round(considerHomeMs / 1000 / 60)}
                    min={0}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value, 10);
                      setConsiderHomeMs(Math.max(0, minutes) * 60 * 1000);
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Devices that disconnect will still be treated as home if they were last seen within this many minutes. Captured at {new Date(snapshot.capturedAt).toLocaleString()}.
                </p>
              </div>

              {/* Persons grid */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">People</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {persons.map((p) => (
                    <PersonCard key={p.name} name={p.name} devices={p.devices} isHome={p.isHome} />
                  ))}
                </div>
              </div>

              {/* Devices table */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Devices</h2>
                <DeviceTable
                  deviceMap={deviceMap}
                  onSetLabel={handleSetLabel}
                  considerHomeMs={considerHomeMs}
                  capturedAt={snapshot.capturedAt}
                />
              </div>
            </div>
          )}

          {activeTab === "maintenance" && (
            <MaintenanceView
              onAddLabel={handleAddLabel}
              deviceMap={deviceMap}
              owners={owners}
              onSetOwner={handleSetOwner}
              onSetPresenceType={handleSetPresenceType}
            />
          )}

          {activeTab === "settings" && <SettingsOwners />}
        </>
      )}
    </div>
  );
};

export default App;
