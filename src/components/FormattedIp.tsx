import * as React from "react";

type FormattedIpProps = {
  ip: string | null;
  className?: string;
  /** How many digits to pad the target octet to (default 3). */
  padTo?: number;
  /** Which octets to pad: just the last one (default) or all. */
  scope?: "last" | "all";
};

export function FormattedIp({
  ip,
  className,
  padTo = 3,
  scope = "last",
}: FormattedIpProps) {
  if (!ip) return null;

  const parts = ip.split(".");
  // If not IPv4, render as-is
  if (parts.length !== 4) {
    return <span className={className}>{ip}</span>;
  }

  const renderOctet = (octet: string) => {
    const padded = octet.padStart(padTo, "0");
    const padLen = Math.max(0, padded.length - octet.length);
    const padding = padded.slice(0, padLen);
    const raw = octet;

    // If no padding was added, just render the raw octet
    if (!padLen) return <>{raw}</>;

    return (
      <>
        <span className="opacity-50">{padding}</span>
        {raw}
      </>
    );
  };

  const toRender =
    scope === "all"
      ? parts.map(renderOctet)
      : [
        parts[0],
        parts[1],
        parts[2],
        // Only last octet padded/faded
        renderOctet(parts[3]),
      ];

  return (
    <span className={["inline-flex items-baseline font-mono", className].filter(Boolean).join(" ")}>
      {toRender.map((seg, i) => (
        <React.Fragment key={i}>
          {i > 0 && "."}
          {seg}
        </React.Fragment>
      ))}
    </span>
  );
}
