/**
 * Schema and sanity checks for data/. Runs as part of `npm run data`, so a
 * malformed contribution fails the build rather than rendering a broken pinout.
 */
import fs from "node:fs";
import path from "node:path";
import { PRIMARY_ROLES, SIGNAL_TAGS } from "../lib/signals.ts";
import type { Board, Part } from "../lib/types.ts";

const ROOT = process.cwd();
const BOARD_DIR = path.join(ROOT, "data", "boards");
const PARTS_FILE = path.join(ROOT, "data", "crossref", "parts.json");

const ROLES = new Set(Object.keys(PRIMARY_ROLES));
const TAGS = new Set(Object.keys(SIGNAL_TAGS));
const CATEGORIES = new Set(["sbc", "mcu-board", "mcu-chip", "ic"]);
const NUMBERINGS = new Set(["zigzag", "ccw", "explicit"]);
const CONFIDENCES = new Set(["drop-in", "caveats", "not-drop-in"]);

const errors: string[] = [];
const warnings: string[] = [];
const fail = (where: string, msg: string) => errors.push(`${where}: ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`${where}: ${msg}`);

// ---- boards ---------------------------------------------------------------
const slugs = new Set<string>();
const boards: Board[] = [];

for (const file of fs.readdirSync(BOARD_DIR).filter((f) => f.endsWith(".json"))) {
  const where = `data/boards/${file}`;
  let board: Board;
  try {
    board = JSON.parse(fs.readFileSync(path.join(BOARD_DIR, file), "utf8"));
  } catch (e) {
    fail(where, `invalid JSON, ${(e as Error).message}`);
    continue;
  }
  boards.push(board);

  for (const field of ["slug", "name", "shortName", "vendor", "summary", "logic", "package"]) {
    if (!board[field as keyof Board]) fail(where, `missing "${field}"`);
  }
  if (board.slug !== file.replace(/\.json$/, ""))
    fail(where, `slug "${board.slug}" does not match the filename`);
  if (slugs.has(board.slug)) fail(where, `duplicate slug "${board.slug}"`);
  slugs.add(board.slug);
  if (!CATEGORIES.has(board.category)) fail(where, `unknown category "${board.category}"`);
  if (!board.layout || !NUMBERINGS.has(board.layout.numbering))
    fail(where, `layout.numbering must be one of ${[...NUMBERINGS].join(", ")}`);
  if (!Array.isArray(board.pins) || board.pins.length === 0) {
    fail(where, "no pins");
    continue;
  }

  const numbering = board.layout.numbering;
  if (numbering !== "explicit" && board.pins.length !== board.layout.rows * 2)
    fail(
      where,
      `${numbering} layout needs rows*2 pins: ${board.layout.rows} rows but ${board.pins.length} pins`,
    );

  const occupied = new Set<string>();
  const numbers = new Set<number>();

  board.pins.forEach((pin, i) => {
    const at = `${where} pin[${i}] "${pin.name ?? "?"}"`;
    if (!pin.name) fail(at, "missing name");
    if (!ROLES.has(pin.primary)) fail(at, `unknown primary "${pin.primary}"`);
    for (const tag of pin.tags ?? [])
      if (!TAGS.has(tag)) fail(at, `unknown tag "${tag}"`);

    if (pin.number != null) {
      if (!Number.isInteger(pin.number) || pin.number < 1) fail(at, "number must be a positive integer");
      if (numbers.has(pin.number)) fail(at, `duplicate pin number ${pin.number}`);
      numbers.add(pin.number);
    }

    if (numbering === "explicit") {
      if (!pin.side || !pin.row) fail(at, "explicit layout requires side and row");
    } else if (pin.number == null && !pin.side) {
      fail(at, `${numbering} layout requires a pin number`);
    }

    // Resolve the grid slot exactly as lib/boards.ts does, and catch collisions.
    let side = pin.side;
    let row = pin.row;
    if (!side || !row) {
      const n = pin.number ?? i + 1;
      if (numbering === "zigzag") {
        side = n % 2 === 1 ? "left" : "right";
        row = Math.ceil(n / 2);
      } else {
        side = n <= board.layout.rows ? "left" : "right";
        row = n <= board.layout.rows ? n : board.layout.rows * 2 - n + 1;
      }
    }
    const slot = `${side}:${row}`;
    if (occupied.has(slot)) fail(at, `two pins land on the same slot ${slot}`);
    occupied.add(slot);
    if (row > board.layout.rows)
      fail(at, `row ${row} exceeds layout.rows (${board.layout.rows})`);
  });

  if (numbering !== "explicit") {
    const expected = Array.from({ length: board.pins.length }, (_, i) => i + 1);
    const missing = expected.filter((n) => !numbers.has(n));
    if (missing.length) fail(where, `pin numbers not contiguous, missing ${missing.join(", ")}`);
  }

  for (const doc of board.docs ?? [])
    if (!doc.url?.startsWith("https://")) fail(where, `doc "${doc.label}" is not an https URL`);

  // Bring-up snippets. The gotcha is mandatory for the same reason a
  // cross-reference needs notes: without it this is a tutorial, not a reference.
  const LANGS = new Set(["c", "asm"]);
  for (const snip of board.snippets ?? []) {
    const at = `${where} snippet "${snip.title ?? "?"}"`;
    for (const field of ["title", "toolchain", "code", "gotcha"] as const)
      if (!snip[field]?.trim()) fail(at, `missing "${field}"`);
    if (!LANGS.has(snip.lang)) fail(at, `lang must be one of ${[...LANGS].join(", ")}`);
    if ((snip.gotcha ?? "").trim().length < 30)
      fail(at, "gotcha needs to say something substantive");
    if ((snip.code ?? "").split("\n").length > 26)
      fail(at, "code is over 26 lines; this is meant to be a bring-up snippet, not a program");
    // A snippet that never names a register or an API call is prose.
    if (!/[A-Z]{2,}|\w+\(/.test(snip.code ?? ""))
      fail(at, "code does not reference any register or function");
  }

  const SYMBOLS = new Set(["cap", "res", "xtal", "link", "cell", "osc", "load"]);
  const NETS = new Set(["VCC", "GND", "MCU", "VM"]);

  // The schematic is drawn from these endpoints, so a bad reference would draw
  // a wire to a pin that does not exist. Check both ends of every part.
  if (board.circuit) {
    const at = `${where} circuit`;
    if (!board.circuit.title?.trim()) fail(at, "missing title");
    if (!board.circuit.parts?.length) fail(at, "no parts");
    const numbers = new Set((board.pins ?? []).map((p) => String(p.number)));
    for (const c of board.circuit.parts ?? []) {
      const row = `${at} "${c.part ?? "?"}"`;
      for (const f of ["part", "symbol", "from", "to", "why"] as const)
        if (!c[f]?.trim()) fail(row, `missing "${f}"`);
      if (c.symbol && !SYMBOLS.has(c.symbol))
        fail(row, `symbol must be one of ${[...SYMBOLS].join(", ")}`);
      if (typeof c.required !== "boolean") fail(row, "required must be true or false");
      if ((c.why ?? "").trim().length < 20) fail(row, "why needs to say something substantive");
      if (c.from && c.from === c.to) fail(row, `both ends are ${c.from}`);
      for (const end of [c.from, c.to]) {
        if (!end || NETS.has(end)) continue;
        if (!/^\d+$/.test(end))
          fail(row, `endpoint "${end}" is neither a pin number nor ${[...NETS].join(" / ")}`);
        else if (numbers.size && !numbers.has(end))
          fail(row, `references pin ${end}, which this board does not have`);
      }
    }
  }

  if (!board.notes?.length) warn(where, "no notes, the gotchas are the most useful part");
  if (!board.docs?.length) warn(where, "no primary source links");
}

// ---- cross-reference ------------------------------------------------------
let parts: Part[] = [];
try {
  parts = JSON.parse(fs.readFileSync(PARTS_FILE, "utf8"));
} catch (e) {
  fail("data/crossref/parts.json", `invalid JSON, ${(e as Error).message}`);
}

const partNames = new Set<string>();
for (const part of parts) {
  const where = `parts.json "${part.part}"`;
  if (!part.part || !part.summary) fail(where, "missing part or summary");
  if (partNames.has(part.part)) fail(where, "duplicate part");
  partNames.add(part.part);
  if (part.pinout && !slugs.has(part.pinout))
    fail(where, `pinout "${part.pinout}" is not a board slug`);
  if (!part.equivalents?.length) fail(where, "no equivalents");
  for (const eq of part.equivalents ?? []) {
    if (!CONFIDENCES.has(eq.confidence))
      fail(where, `equivalent "${eq.part}" has unknown confidence "${eq.confidence}"`);
    // The rule that makes this database worth more than a forum thread.
    if (!eq.notes || eq.notes.trim().length < 20)
      fail(where, `equivalent "${eq.part}" needs a substantive notes string`);
  }
}

// ---- report ---------------------------------------------------------------
for (const w of warnings) console.warn(`  warn  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

const pins = boards.reduce((n, b) => n + (b.pins?.length ?? 0), 0);
const snippets = boards.reduce((n, b) => n + (b.snippets?.length ?? 0), 0);
const circuits = boards.filter((b) => b.circuit).length;
const equivalents = parts.reduce((n, p) => n + (p.equivalents?.length ?? 0), 0);
console.log(
  `  validated ${boards.length} boards / ${pins} pins, ${parts.length} parts / ${equivalents} equivalents, ${snippets} snippets, ${circuits} circuits` +
    (warnings.length ? ` (${warnings.length} warnings)` : ""),
);

if (errors.length) {
  console.error(`\n${errors.length} data error(s). Fix the JSON above.`);
  process.exit(1);
}
