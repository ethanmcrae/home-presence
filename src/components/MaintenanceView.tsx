import React, { useMemo, useState } from 'react';
import { Category, Device } from '../types';

interface MaintenanceViewProps {
  homeMacs: Device[];
  unknownMacs: string[];   // raw MACs without labels yet
  awayMacs: Device[];
  onAddLabel: (mac: string, label: string, category: Category) => void;
}

/**
 * The maintenance view lists all devices grouped by status so users can
 * assign or update friendly labels. Vendor lookup could be added later.
 * When the user provides a label and clicks Save, onAddLabel is invoked;
 * this updates the labelMap in the parent and (for unknowns) removes the MAC.
 */
export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  homeMacs,
  unknownMacs,
  awayMacs,
  onAddLabel,
}) => {
  type Row = { mac: string; label: string | null; display?: string };

  const [editState, setEditState] = useState<Record<string, string>>({});

  const sections = useMemo(
    () => [
      {
        key: 'home',
        title: 'Home Devices',
        category: 'home' as Category,
        rows: homeMacs.map<Row>((d) => ({ mac: d.mac, label: d.label, display: d.display })),
        emptyMsg: 'No home devices detected.',
      },
      {
        key: 'away',
        title: 'Away Devices',
        category: 'away' as Category,
        rows: awayMacs.map<Row>((d) => ({ mac: d.mac, label: d.label, display: d.display })),
        emptyMsg: 'No away devices right now.',
      },
      {
        key: 'unknown',
        title: 'Unknown Devices',
        category: 'unknownMacsNeedingLabels' as Category,
        rows: unknownMacs.map<Row>((mac) => ({ mac, label: '' })),
        emptyMsg: 'No unknown devices. Great job!',
      },
    ],
    [homeMacs, awayMacs, unknownMacs]
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
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-green-700">{emptyMsg}</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="py-2 px-4 text-left">MAC Address</th>
              <th className="py-2 px-4 text-left">Friendly Label</th>
              <th className="py-2 px-4 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ mac, label, display }) => {
              const current = editState[mac] ?? label ?? '';
              return (
                <tr key={mac} className="border-b border-gray-200">
                  <td className="py-2 px-4 font-mono text-xs text-gray-600">{display || mac}</td>
                  <td className="py-2 px-4">
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded px-1 py-1 text-sm"
                      placeholder="Enter label"
                      value={current}
                      onChange={(e) =>
                        setEditState((s) => ({ ...s, [mac]: e.target.value }))
                      }
                    />
                  </td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => handleSave(mac, label, category)}
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
      <h2 className="text-xl font-semibold text-gray-900">Maintenance</h2>
      <p className="text-gray-600 text-sm">
        Assign friendly labels to devices to make the dashboard and presence views easier to interpret.
      </p>

      {sections.map((s) => renderSection(s.title, s.category, s.rows, s.emptyMsg))}
    </div>
  );
};
