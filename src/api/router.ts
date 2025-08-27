export async function getPresenceSnapshot() {
  const res = await fetch("http://localhost:4000/api/presence");
  if (!res.ok) throw new Error("Failed to fetch snapshot");
  return res.json();
}
