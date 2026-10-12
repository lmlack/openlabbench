import fs from "node:fs";
import path from "node:path";

export interface CheatSheet {
  slug: string;
  file: string;
  bytes: number;
  width: number;
  height: number;
}

/** Written by scripts/gen-cheatsheets.ts during prebuild. */
export function getCheatSheets(): CheatSheet[] {
  const file = path.join(process.cwd(), "data", "cheatsheets.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8")) as CheatSheet[];
}

export function getCheatSheet(slug: string): CheatSheet | undefined {
  return getCheatSheets().find((c) => c.slug === slug);
}
