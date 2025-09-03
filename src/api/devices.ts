import { Device, DeviceDetails } from "../types";

const BASE = "http://localhost:4000"; // or import.meta.env.VITE_API_BASE 

export async function listDeviceDetails(): Promise<Record<string, DeviceDetails>> {
  const res = await fetch(`${BASE}/api/devices`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch labels: ${res.status}`);
  const rows = (await res.json()) as DeviceDetails[];
  const map: Record<string, DeviceDetails> = {};
  rows.forEach(r => { map[r.mac] = r; });
  return map;
}

export async function upsertDevice(
  mac: string,
  payload: Partial<{ label: string | null; band: string | null; ip: string | null; ownerId: number | null; presenceType: 1 | 2 | null }>
) {
  const res = await fetch(`${BASE}/api/devices/${encodeURIComponent(mac)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to update device");
  return res.json() as Promise<Device>;
}


export async function upsertDeviceLabel(mac: string, label: string): Promise<DeviceDetails> {
  const res = await fetch(`${BASE}/api/devices/${encodeURIComponent(mac)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Failed to save label: ${res.status}`);
  }
  return (await res.json()) as DeviceDetails;
}

export async function setDeviceOwner(mac: string, ownerId: number | null) {
  const r = await fetch(`${BASE}/api/devices/${encodeURIComponent(mac)}/owner`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerId }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "Failed to set owner");
  return r.json();
}
