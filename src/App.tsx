import React, { useEffect, useMemo, useState } from 'react';
import { PersonCard } from './components/PersonCard';
import { DeviceTable } from './components/DeviceTable';
import { MaintenanceView } from './components/MaintenanceView';
import type { Device as UiDevice, PresenceSnapshot as UiPresenceSnapshot, LabelMap, Category } from './types';
import { getPresenceSnapshot } from './api/router';

/**
 * Root component for the home presence tracker application. This version
 * calls the router-backed getPresenceSnapshot() (no options) instead of
 * using dummyPresence. UI and behavior remain a drop-in replacement.
 */
const App: React.FC = () => {
  // Live presence snapshot fetched from the router API.
  const [snapshot, setSnapshot] = useState<UiPresenceSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // A map of MAC → label. When the user assigns a new label in the
  // maintenance view or device table this state is updated.
  const [labelMap, setLabelMap] = useState<LabelMap>({});

  // Consider‑home threshold in milliseconds. Devices that are offline
  // but last seen within this period will still be counted as home.
  const [considerHomeMs, setConsiderHomeMs] = useState<number>(5 * 60 * 1000); // default 5 minutes

  // Which tab is active: 'dashboard' or 'maintenance'.
  const [activeTab, setActiveTab] = useState<'dashboard' | 'maintenance'>('dashboard');

  // Fetch a fresh snapshot from the router. Options are intentionally
  // omitted per the requirement — we call getPresenceSnapshot() directly.
  const fetchSnapshot = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getPresenceSnapshot();
      // The presence module's type is shape-compatible with our UI types.
      setSnapshot(snap as unknown as UiPresenceSnapshot);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to load presence snapshot');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchSnapshot();
    })();
    return () => {
      mounted = false; // for symmetry; no ongoing polling by default
    };
  }, []);

  // On snapshot change, populate the label map with any labels present.
  useEffect(() => {
    if (!snapshot) return;
    const initial: LabelMap = {};
    const allDevices: UiDevice[] = [...snapshot.home, ...snapshot.away];
    allDevices.forEach((device) => {
      if (device.label) {
        initial[device.mac] = device.label;
      }
    });
    setLabelMap(initial);
  }, [snapshot]);

  /** Assigns a new label to a MAC address. */
  const handleSetLabel = (mac: string, label: string) => {
    setLabelMap((prev) => {
      const next = { ...prev };
      if (!label) delete next[mac];
      else next[mac] = label;
      return next;
    });
  };

  /** Adds a label and removes the MAC from unknownMacs. */
  const handleAddLabel = (mac: string, label: string, category: Category) => {
    handleSetLabel(mac, label);
    setSnapshot((prev) => {
      if (!prev) return prev;
      const filteredUnknown = prev[category].filter((m) => m !== mac);
      return { ...prev, [category]: filteredUnknown };
    });
  };

  /** Derive persons from the current snapshot + label map. */
  const persons = useMemo(() => {
    if (!snapshot) return [] as { name: string; devices: UiDevice[]; isHome: boolean }[];

    const grouped: Record<string, UiDevice[]> = {};
    const allDevices: UiDevice[] = [...snapshot.home, ...snapshot.away];
    allDevices.forEach((device) => {
      const name = labelMap[device.mac] ?? device.display;
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(device);
    });

    const capturedDate = new Date(snapshot.capturedAt);
    const timeSinceCapture = Date.now() - capturedDate.getTime();

    return Object.entries(grouped).map(([name, devices]) => {
      const isHome = devices.some((d) => {
        const offlineButWithinWindow = !d.connected && timeSinceCapture < considerHomeMs;
        return d.connected || offlineButWithinWindow;
      });
      return { name, devices, isHome };
    });
  }, [snapshot, labelMap, considerHomeMs]);

  const allDevices: UiDevice[] = useMemo(() => {
    if (!snapshot) return [] as UiDevice[];
    return [...snapshot.home, ...snapshot.away];
  }, [snapshot]);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Presence Tracker</h1>
          <p className="text-sm text-gray-600">Router-backed</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
            onClick={fetchSnapshot}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm">
          {error}
        </div>
      )}

      {loading && !snapshot && (
        <div className="animate-pulse text-gray-600">Loading presence…</div>
      )}

      {snapshot && (
        <>
          <nav className="mb-6 flex gap-4">
            <button
              className={`px-3 py-2 rounded ${activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`px-3 py-2 rounded ${activeTab === 'maintenance'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              onClick={() => setActiveTab('maintenance')}
            >
              Maintenance
            </button>
          </nav>

          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Presence assertions control */}
              <div className="bg-white p-4 rounded-xl shadow-md flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="considerHome" className="text-gray-700 text-sm">
                    Consider home window (minutes):
                  </label>
                  <input
                    id="considerHome"
                    type="number"
                    className="border rounded px-2 py-1 w-20"
                    value={Math.round(considerHomeMs / 1000 / 60)}
                    min={0}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value, 10);
                      setConsiderHomeMs(Math.max(0, minutes) * 60 * 1000);
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Devices that disconnect will still be treated as home if they were last seen
                  within this many minutes. Captured at {new Date(snapshot.capturedAt).toLocaleString()}.
                </p>
              </div>

              {/* Persons grid */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">People</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {persons.map((p) => (
                    <PersonCard key={p.name} name={p.name} devices={p.devices} isHome={p.isHome} />
                  ))}
                </div>
              </div>

              {/* Devices table */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Devices</h2>
                <DeviceTable
                  devices={allDevices}
                  labelMap={labelMap}
                  onSetLabel={handleSetLabel}
                  considerHomeMs={considerHomeMs}
                  capturedAt={snapshot.capturedAt}
                />
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView
              homeMacs={snapshot.home}
              unknownMacs={snapshot.unknownMacsNeedingLabels}
              awayMacs={snapshot.away}
              onAddLabel={handleAddLabel}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
