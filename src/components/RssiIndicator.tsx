// src/components/RssiIndicator.tsx
import React from "react";

type Props = { rssi: number | null | undefined; className?: string };

// Map RSSI (dBm) → 0..4 bars + text
function rssiToLevel(rssi: number): { bars: 0 | 1 | 2 | 3 | 4; text: string } {
  if (rssi >= -50) return { bars: 4, text: "Excellent" };
  if (rssi >= -60) return { bars: 3, text: "Good" };
  if (rssi >= -67) return { bars: 2, text: "Fair" };
  if (rssi >= -75) return { bars: 1, text: "Weak" };
  return { bars: 0, text: "Very weak" };
}

export const RssiIndicator: React.FC<Props> = ({ rssi, className }) => {
  if (rssi == null) return <span className={className}>-</span>;

  const { bars, text } = rssiToLevel(rssi);
  const cols = 4; // how many bars we draw
  const heights = [8, 12, 16, 20]; // px heights for each bar (left→right)

  return (
    <span className={`inline-flex items-center gap-2 ${className || ""}`} title={`${rssi} dBm`}>
      {/* bars */}
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {Array.from({ length: cols }).map((_, i) => {
          const active = i < bars;
          return (
            <span
              key={i}
              className={`w-1.5 rounded-sm ${active ? "bg-green-600" : "bg-gray-300"}`}
              style={{ height: heights[i] }}
            />
          );
        })}
      </span>
      {/* simple label for humans */}
      <span className="text-xs text-gray-700">{text}</span>
    </span>
  );
};
