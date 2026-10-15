/**
 * Presentational maps, kept free of node:fs so client components can import
 * them without pulling the build-time data loaders into the bundle.
 */
import type React from "react";
import type { BoardCategory, Confidence, PartCategory } from "./types";

export const CATEGORY_LABELS: Record<BoardCategory, string> = {
  sbc: "Single-board computer",
  "mcu-board": "Dev board",
  "mcu-chip": "Microcontroller",
  ic: "Integrated circuit",
};

export const PART_CATEGORY_LABELS: Record<PartCategory, string> = {
  microcontroller: "Microcontrollers",
  transceiver: "Transceivers & radio",
  sensor: "Sensors",
  logic: "Logic",
  regulator: "Power & regulators",
  analog: "Analog",
  driver: "Drivers",
  interface: "Interface & peripherals",
  discrete: "Discretes",
};

export const CONFIDENCE_META: Record<
  Confidence,
  { label: string; blurb: string; color: string; ink: string }
> = {
  "drop-in": {
    label: "Drop-in",
    blurb: "Same pinout and behavior. Swap it in with no changes.",
    color: "#22c55e",
    ink: "#147236",
  },
  caveats: {
    label: "With caveats",
    blurb: "Works with a small change. Read the note before you solder.",
    color: "#eab308",
    ink: "#8f5a00",
  },
  "not-drop-in": {
    label: "Not drop-in",
    blurb: "Does the same job, but the pinout or interface is different.",
    color: "#f97316",
    ink: "#b91c1c",
  },
};

/**
 * Inline style for anything tinted by confidence. The generic light-mode
 * .sig-text mix pulls green, yellow and orange toward the same olive brown,
 * and these three exist to be told apart at a glance. So light mode gets a
 * hand-picked ink per level (green 142°, amber 38°, red 0°, each over 4.8:1
 * on both cream surfaces). Dark mode still uses the raw hue.
 */
export function confidenceStyle(c: Confidence): React.CSSProperties {
  const meta = CONFIDENCE_META[c];
  return { "--sig": meta.color, "--sig-ink": meta.ink } as React.CSSProperties;
}

export const CONFIDENCE_ORDER: Confidence[] = ["drop-in", "caveats", "not-drop-in"];

export function slugifyPart(part: string): string {
  return part
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
