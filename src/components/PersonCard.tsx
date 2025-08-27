import React from 'react';
import type { Device } from '../types';

/**
 * A card that summarizes the state of a single person. A person may have
 * multiple devices associated with them; they are considered home if any
 * device is considered connected (after applying the consider‑home
 * threshold). The card shows the person's name, their current status,
 * and the count of devices attached. You could extend this component to
 * show more details, such as which devices are connected or last seen.
 */
interface PersonCardProps {
  name: string;
  devices: Device[];
  isHome: boolean;
}

export const PersonCard: React.FC<PersonCardProps> = ({ name, devices, isHome }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold text-gray-900 truncate" title={name}>{name}</span>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${isHome
            ? 'bg-green-200 text-green-700'
            : 'bg-gray-200 text-gray-700'
          }`}
        >
          {isHome ? 'Home' : 'Away'}
        </span>
      </div>
      <div className="text-sm text-gray-500">
        {devices.length} device{devices.length === 1 ? '' : 's'}
      </div>
    </div>
  );
};