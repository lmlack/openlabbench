import { signal } from "@/lib/signals";
import type { HighlightKey } from "@/lib/types";

/** Small labeled badge for a bus capability (I²C, SPI, PWM…). */
export function SignalBadge({ k, size = "sm" }: { k: HighlightKey; size?: "xs" | "sm" }) {
  const meta = signal(k);
  return (
    <span
      className={`sig-chip sig-text shrink-0 rounded border font-medium leading-none ${
        size === "xs" ? "px-1 py-0.5 text-sm" : "px-1.5 py-1 text-sm"
      }`}
      style={{ "--sig": meta.color } as React.CSSProperties}
    >
      {meta.label}
    </span>
  );
}

export function SignalDot({ k }: { k: HighlightKey }) {
  return (
    <span
      className="sig-dot size-2 shrink-0 rounded-full"
      style={{ "--sig": signal(k).color } as React.CSSProperties}
      aria-hidden="true"
    />
  );
}
