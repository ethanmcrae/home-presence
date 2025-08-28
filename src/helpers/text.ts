export function padIp(ip?: string): string | undefined {
  if (!ip) return;
  const parts = ip.split(".");
  if (parts.length !== 4) return ip; // return unchanged if not IPv4
  const last = parts[3].padStart(3, "0");
  return [...parts.slice(0, 3), last].join(".");
}
