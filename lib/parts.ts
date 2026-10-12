import fs from "node:fs";
import path from "node:path";
import type { Part } from "./types";

const FILE = path.join(process.cwd(), "data", "crossref", "parts.json");

let cache: Part[] | null = null;

/** See the note in lib/boards.ts: caching in dev hides edits to data/. */
const MEMOIZE = process.env.NODE_ENV === "production";

export function getParts(): Part[] {
  if (MEMOIZE && cache) return cache;
  cache = (JSON.parse(fs.readFileSync(FILE, "utf8")) as Part[]).sort((a, b) =>
    a.part.localeCompare(b.part),
  );
  return cache;
}
