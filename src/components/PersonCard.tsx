import React, { useState } from 'react';
import type { Device } from '../types';

interface PersonCardProps {
  name: string;
  devices: Record<'primary' | 'secondary' | 'all', Device[]>;
  isHome: boolean;
}

export function PersonCard({ name, devices, isHome }: PersonCardProps) {
  return (
    <details
      className="group self-start bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 w-full border border-gray-100 dark:border-gray-800"
    >
      <summary className="flex justify-between items-center cursor-pointer list-none">
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate" title={name}>
          {name}
        </span>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${isHome
                ? 'bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200/90'
              }`}
          >
            {isHome ? 'Home' : 'Away'}
          </span>
          <svg
            className="w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-200 group-open:rotate-180"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </summary>

      {/* Content */}
      <div className="mt-2 grid overflow-hidden transition-[grid-template-rows] duration-200
                      [grid-template-rows:0fr] group-open:[grid-template-rows:1fr]">
        <div className="min-h-0 overflow-hidden flex flex-col gap-1 pt-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {devices.primary.length} primary device{devices.primary.length === 1 ? '' : 's'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {devices.secondary.length} extra device{devices.secondary.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>
    </details>
  );
}
