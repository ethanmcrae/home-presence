import React, { useEffect, useState } from "react";
import { listOwners, createOwner, updateOwner, deleteOwner } from "../api/owners";
import { Owner } from "../types";

export const SettingsOwners: React.FC = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<'person' | 'home'>('person');
  const [error, setError] = useState<string | null>(null);

  const load = async () => setOwners(await listOwners());
  useEffect(() => { load(); }, []);

  const add = async () => {
    try { await createOwner(name, kind); setName(""); setKind('person'); await load(); }
    catch (e: any) { setError(e?.message || "Create failed"); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Device Owners</h2>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex gap-2">
        <input className="border rounded px-2 py-1" placeholder="Name"
          value={name} onChange={(e) => setName(e.target.value)} />
        <select className="border rounded px-2 py-1" value={kind} onChange={(e) => setKind(e.target.value as any)}>
          <option value="person">Person</option>
          <option value="home">Home</option>
        </select>
        <button className="bg-indigo-600 text-white px-3 py-1 rounded" onClick={add} disabled={!name.trim()}>
          Add
        </button>
      </div>

      <table className="min-w-full text-sm">
        <thead><tr className="bg-gray-200"><th className="px-2 py-1 text-left">Name</th><th className="px-2 py-1">Kind</th><th /></tr></thead>
        <tbody>
          {owners.map(o => (
            <tr key={o.id} className="border-b">
              <td className="px-2 py-1">{o.name}</td>
              <td className="px-2 py-1">{o.kind}</td>
              <td className="px-2 py-1 text-right">
                {o.id !== 1 && (
                  <button
                    className="text-red-600"
                    onClick={async () => { try { await deleteOwner(o.id); await load(); } catch (e: any) { setError(e?.message || "Delete failed"); } }}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
