export async function getPresenceSnapshot() {
  const res = await fetch("http://192.168.50.96:4000/api/presence");
  if (!res.ok) throw new Error("Failed to fetch snapshot");
  return res.json();
}
