import React, { useState } from 'react';
import type { Device } from '../types';

interface DeviceTableProps {
  devices: Device[];
  labelMap: Record<string, string>;
  onSetLabel: (mac: string, label: string) => void;
  considerHomeMs: number;
  capturedAt: string;
}

/**
 * A table that lists all devices known to the system. Users can edit
 * the label (friendly name) of each device directly in the table. When
 * editing, an input field appears; on blur or Enter key press the new
 * label is saved via onSetLabel. Considered home status is computed
 * based on the device's connection status and the consider‑home window.
 */
export const DeviceTable: React.FC<DeviceTableProps> = ({ devices, labelMap, onSetLabel, considerHomeMs, capturedAt }) => {
  // Track which device is currently being edited.
  const [editingMac, setEditingMac] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState<string>('');

  // Compute the timestamp difference once; this could be updated on an interval
  // if you wanted the UI to reflect the passage of time. For a static demo
  // using dummy data it's fine to compute once.
  const capturedDate = new Date(capturedAt);
  const timeSinceCapture = Date.now() - capturedDate.getTime();

  const handleLabelSave = (mac: string) => {
    const trimmed = tempLabel.trim();
    onSetLabel(mac, trimmed);
    setEditingMac(null);
    setTempLabel('');
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            <th className="py-2 px-4 text-left">Name</th>
            <th className="py-2 px-4 text-left">MAC</th>
            <th className="py-2 px-4 text-left">Band</th>
            <th className="py-2 px-4 text-left">RSSI</th>
            <th className="py-2 px-4 text-left">IP</th>
            <th className="py-2 px-4 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => {
            const mac = device.mac;
            const currentLabel = labelMap[mac] ?? device.label;
            // Determine whether the device should be considered home. If the
            // device is currently connected, we mark it as home immediately.
            // Otherwise, if it's offline but the time since the snapshot is
            // less than the consider‑home window, we still treat it as home.
            const offlineButWithinWindow = !device.connected && timeSinceCapture < considerHomeMs;
            const consideredHome = device.connected || offlineButWithinWindow;

            return (
              <tr key={mac} className="border-b border-gray-200">
                <td className="py-2 px-4">
                  {editingMac === mac ? (
                    <input
                      autoFocus
                      className="w-full border border-gray-300 rounded px-1 py-1 text-sm"
                      value={tempLabel}
                      onChange={(e) => setTempLabel(e.target.value)}
                      onBlur={() => handleLabelSave(mac)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLabelSave(mac);
                        } else if (e.key === 'Escape') {
                          setEditingMac(null);
                          setTempLabel('');
                        }
                      }}
                    />
                  ) : (
                    <button
                      className="text-left text-indigo-600 hover:underline focus:outline-none"
                      onClick={() => {
                        setEditingMac(mac);
                        setTempLabel(currentLabel ?? device.display);
                      }}
                    >
                      {currentLabel ?? device.display}
                    </button>
                  )}
                </td>
                <td className="py-2 px-4 font-mono text-xs text-gray-600 whitespace-nowrap">{mac}</td>
                <td className="py-2 px-4 capitalize">{device.band ?? '-'}</td>
                <td className="py-2 px-4">
                  {device.rssi !== null ? `${device.rssi} dBm` : '-'}
                </td>
                <td className="py-2 px-4 whitespace-nowrap">{device.ip ?? '-'}</td>
                <td className="py-2 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${consideredHome
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {consideredHome ? 'Home' : 'Away'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};