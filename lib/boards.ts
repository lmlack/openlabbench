import fs from "node:fs";
import path from "node:path";
import type { Board, PlacedPin } from "./types";

const DIR = path.join(process.cwd(), "data", "boards");

let cache: Board[] | null = null;

/**
 * Memoize during a production build, where this is read once per page and the
 * files cannot change underneath us. In dev the server process is long lived,
 * so caching would mean a new file in data/boards never shows up until you
 * restart. Re-reading 18 small JSON files per request costs nothing.
 */
const MEMOIZE = process.env.NODE_ENV === "production";

/**
 * Reads every board in data/boards. Dropping a new JSON file in that directory
 * is all a contribution needs.
 */
export function getBoards(): Board[] {
  if (MEMOIZE && cache) return cache;
  cache = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as Board)
    .sort((a, b) => a.name.localeCompare(b.name));
  return cache;
}

export function getBoard(slug: string): Board | undefined {
  return getBoards().find((b) => b.slug === slug);
}

/** Resolve each pin onto the two-column grid the diagram draws. */
export function placePins(board: Board): PlacedPin[] {
  const { numbering, rows } = board.layout;
  return board.pins.map((pin, i) => {
    if (pin.side && pin.row) {
      return { ...pin, side: pin.side, row: pin.row };
    }
    const n = pin.number ?? i + 1;
    if (numbering === "zigzag") {
      // 2xN header: odd pins down the left, even pins down the right.
      return { ...pin, side: n % 2 === 1 ? "left" : "right", row: Math.ceil(n / 2) };
    }
    // Counter-clockwise (DIP, Pico): 1..rows down the left, then back up the right.
    return n <= rows
      ? { ...pin, side: "left", row: n }
      : { ...pin, side: "right", row: 2 * rows - n + 1 };
  });
}

export interface GridRow {
  row: number;
  left?: PlacedPin;
  right?: PlacedPin;
}

/** Row-major view of the placed pins, including rows that are empty on one side. */
export function pinGrid(board: Board): GridRow[] {
  const placed = placePins(board);
  const rows = Math.max(board.layout.rows, ...placed.map((p) => p.row));
  return Array.from({ length: rows }, (_, i) => ({
    row: i + 1,
    left: placed.find((p) => p.side === "left" && p.row === i + 1),
    right: placed.find((p) => p.side === "right" && p.row === i + 1),
  }));
}

/** Counts per highlight key, for the legend on a board page. */
export function signalCounts(board: Board): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const pin of board.pins) {
    for (const key of [pin.primary, ...(pin.tags ?? [])]) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}
