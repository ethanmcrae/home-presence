import React, { useMemo, useState } from 'react';
import { Category, Device, DeviceMap, Owner, OwnerMap, PresenceType } from '../types';
import { Select } from './Select';
import { FormattedIp } from './FormattedIp';

interface MaintenanceViewProps {
  onAddLabel: (mac: string, label: string, category: Category) => void;
  deviceMap: DeviceMap;
  owners: OwnerMap;
  onSetOwner: (mac: string, ownerId?: number, ownerName?: string) => void;
  onSetPresenceType: (mac: string, presenceType?: PresenceType) => void;
}

/**
 * The maintenance view lists all devices grouped by status so users can
 * assign or update friendly labels. Vendor lookup could be added later.
 * When the user provides a label and clicks Save, onAddLabel is invoked;
 * this updates the deviceMap in the parent and (for unknowns) removes the MAC.
 */
export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  onAddLabel,
  deviceMap,
  owners,
  onSetOwner,
  onSetPresenceType
}) => {
  type Row = { mac: string; label: string | null; display: string | null; ip: string | null; };

  const homeMacs: Device[] = [];
  const awayMacs: Device[] = [];

  for (const mac in deviceMap) {
    const device = deviceMap[mac];
    if (device.connected) homeMacs.push(device);
    else awayMacs.push(device);
  }

  const [editState, setEditState] = useState<Record<string, string>>({});

  const unclaimedDevices = Object.values(deviceMap).filter(d => !!!d.ownerId);

  const sections = useMemo(
    () => [
      {
        key: 'home',
        title: 'Home Devices',
        category: 'home' as Category,
        rows: homeMacs.map<Row>((d) => ({
          mac: d.mac,
          label: d.label,
          display: d.display,
          ip: (d as any).ip ?? (d as any).lastIp ?? undefined,
        })),
        emptyMsg: 'No home devices detected.',
      },
      {
        key: 'away',
        title: 'Away Devices',
        category: 'away' as Category,
        rows: awayMacs.map<Row>((d) => ({
          mac: d.mac,
          label: d.label,
          display: d.display,
          ip: (d as any).ip ?? (d as any).lastIp ?? undefined,
        })),
        emptyMsg: 'No away devices right now.',
      },
      {
        key: 'unknown',
        title: 'Unclaimed Devices',
        category: 'unclaimedDevicesNeedingLabels' as Category,
        rows: unclaimedDevices.map<Row>((d) => ({
          mac: d.mac,
          label: d.label,
          display: d.display,
          ip: (d as any).ip ?? (d as any).lastIp ?? undefined,
        })),
        emptyMsg: 'No unknown devices. Great job!',
      },
    ],
    [homeMacs, awayMacs, unclaimedDevices]
  );

  const handleSave = (mac: string, fallbackLabel: string | null, category: Category) => {
    const label = (editState[mac] ?? fallbackLabel ?? '').trim();
    if (label) {
      onAddLabel(mac, label, category);
      setEditState((prev) => {
        const { [mac]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const renderSection = (
    title: string,
    category: Category,
    rows: Row[],
    emptyMsg: string,
  ) => (
    <section key={title} className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-green-700 dark:text-green-300">{emptyMsg}</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <th className="py-2 px-4 text-left">Identifiers</th>
              <th className="py-2 px-4 text-left">Owner</th>
              <th className="py-2 px-4 text-left">Friendly Label</th>
              <th className="py-2 px-4 text-left">Device Type</th>
              <th className="py-2 px-4 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ mac, ip, label, display }) => {
              const effectiveLabel = (deviceMap[mac].label ?? label ?? '') as string;
              const current = editState[mac] ?? effectiveLabel;
              const ownerId = deviceMap[mac]?.ownerId ?? null;
              const presenceType = deviceMap[mac].presenceType ?? null;

              return (
                <tr key={mac} className="border-b border-gray-200 dark:border-gray-700">
                  {/* show friendly name in the first column */}
                  <td className="py-2 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                    <FormattedIp ip={ip} /> {ip && <>|</>} {display ? <>{display}</> : <>{ip || mac}</>}
                  </td>

                  <td className="py-2 px-4">
                    <Select
                      value={String(ownerId)}
                      onChange={(v) => {
                        const id = Number(v);
                        const nextId = v === null ? undefined : id;
                        const name = v === null ? undefined : owners[id]?.name ?? undefined;
                        onSetOwner(mac, nextId, name ?? undefined);
                      }}
                      placeholder="Unassigned"
                      options={Object.values(owners).map(o => ({
                        value: String(o.id),
                        label: (
                          <span className="flex items-center gap-1">
                            <span>{o.kind === 'home' ? '🏠' : '👤'}</span>
                            <span>{o.name}</span>
                          </span>
                        )
                      }))}
                    />
                  </td>

                  <td className="py-2 px-4">
                    <Select
                      value={presenceType == null ? "" : String(presenceType)}
                      onChange={(v) => {
                        const next =
                          v == null || v === "" ? null :
                            Number(v) === 1 ? 1 :
                              Number(v) === 2 ? 2 :
                                null;
                        onSetPresenceType(mac, next as PresenceType | null);
                      }}
                      unassignedRow={false}
                      className="relative inline-block"
                      buttonClassName="w-[7rem] border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-950 dark:text-gray-100 text-left flex items-center justify-between"
                      listClassName="w-[7rem] absolute z-10 mt-1 max-h-56 overflow-auto rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100 shadow"
                      options={[
                        {
                          value: "",
                          label: (
                            <span className="flex items-center gap-2">
                              <span className="inline-block rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs px-1.5 py-0.5">
                                Untracked
                              </span>
                            </span>
                          ),
                        },
                        {
                          value: "1",
                          label: (
                            <span className="flex items-center gap-2">
                              <span className="inline-block rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs px-1.5 py-0.5">
                                Primary
                              </span>
                            </span>
                          ),
                        },
                        {
                          value: "2",
                          label: (
                            <span className="flex items-center gap-2">
                              <span className="inline-block rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-1.5 py-0.5">
                                Secondary
                              </span>
                            </span>
                          ),
                        },
                      ]}
                    />
                  </td>


                  <td className="py-2 px-4">
                    <input
                      type="text"
                      className="w-full border border-gray-300 dark:border-gray-700 rounded px-1 py-1 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
                      placeholder="Enter label"
                      value={current}
                      onChange={(e) =>
                        setEditState((s) => ({ ...s, [mac]: e.target.value }))
                      }
                    />
                  </td>

                  <td className="py-2 px-4">
                    <button
                      onClick={() => handleSave(mac, effectiveLabel || null, category)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 text-sm disabled:opacity-50"
                      disabled={!current.trim()}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}

          </tbody>
        </table>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Maintenance</h2>
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        Assign friendly labels to devices to make the dashboard and presence views easier to interpret.
      </p>

      {sections.map((s) => renderSection(s.title, s.category, s.rows, s.emptyMsg))}
    </div>
  );

};
