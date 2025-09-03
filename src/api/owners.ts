import { Owner } from "../types";

const BASE = "http://localhost:4000"; // or import.meta.env.VITE_API_BASE 

export async function listOwners(): Promise<Owner[]> {
  const r = await fetch(`${BASE}/api/owners`, { cache: "no-store" });
  if (!r.ok) throw new Error("Failed to load owners");
  return r.json();
}
export async function createOwner(name: string, kind: 'person' | 'home' = 'person'): Promise<Owner> {
  const r = await fetch(`${BASE}/api/owners`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, kind }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "Create failed");
  return r.json();
}
export async function updateOwner(id: number, name: string, kind: 'person' | 'home'): Promise<Owner> {
  const r = await fetch(`${BASE}/api/owners/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, kind }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "Update failed");
  return r.json();
}
export async function deleteOwner(id: number): Promise<void> {
  const r = await fetch(`${BASE}/api/owners/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error((await r.json()).error || "Delete failed");
}
