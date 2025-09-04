import React, { useState } from 'react';
import type { Device } from '../types';
import { RssiIndicator } from './RssiIndicator';

interface DeviceTableProps {
  deviceMap: Record<string, Device>;
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
export const DeviceTable: React.FC<DeviceTableProps> = ({ deviceMap, onSetLabel, considerHomeMs, capturedAt }) => {
  // Track which device is currently being edited.
  const devices = Object.values(deviceMap);
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
          <tr className="bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
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
            const currentLabel = deviceMap[mac]?.label ?? device.label;
            const offlineButWithinWindow =
              !device.connected && timeSinceCapture < considerHomeMs;
            const consideredHome =
              device.display && (device.connected || offlineButWithinWindow);
            const hasOwner = Boolean(device.ownerId) && device.ownerId !== 1;

            return (
              <tr
                key={mac}
                className="border-b border-gray-200 dark:border-gray-700"
              >
                <td className="relative py-2 px-4">
                  {hasOwner && (
                    <span
                      className={`$${editingMac === mac ? "pt-[0.25rem] pl-1 " : ""
                        }absolute`}
                    >
                      👤
                    </span>
                  )}
                  {editingMac === mac ? (
                    <input
                      autoFocus
                      className={`${hasOwner ? "pl-7 " : ""
                        }w-full border border-gray-300 dark:border-gray-700 rounded px-1 py-1 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100`}
                      value={tempLabel}
                      onChange={(e) => setTempLabel(e.target.value)}
                      onBlur={() => handleLabelSave(mac)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleLabelSave(mac);
                        } else if (e.key === "Escape") {
                          setEditingMac(null);
                          setTempLabel("");
                        }
                      }}
                    />
                  ) : (
                    <button
                      className={`text-left hover:underline focus:outline-none ${hasOwner
                          ? "text-gray-900 dark:text-gray-100 pl-6"
                          : "text-gray-600 dark:text-gray-400"
                        }`}
                      onClick={() => {
                        setEditingMac(mac);
                        setTempLabel(currentLabel ?? device.display ?? "");
                      }}
                    >
                      {currentLabel ?? device.display}
                    </button>
                  )}
                </td>
                <td className="py-2 px-4 font-mono text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {mac}
                </td>
                <td className="py-2 px-4 capitalize">{device.band ?? "-"}</td>
                <td className="py-2 px-4">
                  <RssiIndicator rssi={device.rssi} />
                </td>
                <td className="py-2 px-4 whitespace-nowrap">{device.ip ?? "-"}</td>
                <td className="py-2 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${consideredHome
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-orange-100 text-yellow-800 dark:bg-orange-900/30 dark:text-yellow-300"
                      }`}
                  >
                    {consideredHome ? "Home" : "Away"}
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