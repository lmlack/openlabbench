/**
 * Renders one printable SVG cheat sheet per board into public/cheatsheets.
 *
 * Deliberately a separate implementation from the interactive diagram: this one
 * is laid out for A4 paper and a monitor propped behind the bench, so it is
 * denser, light-themed, carries the gotchas inline, and has no hover state to
 * hide anything behind. Run by `npm run prebuild`.
 *
 * Node runs this .ts file directly (type stripping), so the signal palette is
 * imported from the same source the web UI uses rather than copied.
 */
import fs from "node:fs";
import path from "node:path";
import { PUBLIC_URL } from "../lib/base-path.ts";
import { ALL_SIGNALS } from "../lib/signals.ts";
import type { Board, HighlightKey, Pin, PlacedPin } from "../lib/types.ts";

const ROOT = process.cwd();
const BOARD_DIR = path.join(ROOT, "data", "boards");
const OUT_DIR = path.join(ROOT, "public", "cheatsheets");

// ---- geometry -------------------------------------------------------------
const W = 1240;
const PAD = 32;
const ROW_H = 23;
const BODY_W = 132;
const HEADER_H = 104;
const LEGEND_H = 30;

// Monospace advance at a given font size, close enough for layout without a
// text measurement API.
const adv = (size: number) => size * 0.62;
const textWidth = (s: string, size: number) => s.length * adv(size);

// A downloaded sheet carries no webfont, so the serif has to be one every
// machine already has. Identifiers stay monospaced.
const SERIF = "Georgia, 'Times New Roman', Times, serif";
const INK = "#1a1712";
const MUTED = "#4a443b";
const FAINT = "#857c6c";
const LINE = "#b3a894";
const HAIR = "#e3dac7";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Full-saturation hue: swatches, chip fills and strokes. */
function hue(key: HighlightKey): string {
  return ALL_SIGNALS[key]?.color ?? MUTED;
}

/**
 * The same hue darkened toward ink for use as text on white. The screen palette
 * is tuned for a dark background; several hues drop below 4.5:1 on paper
 * untouched. Mirrors the .sig-text rule in globals.css.
 */
function ink(key: HighlightKey): string {
  const hex = hue(key).replace("#", "");
  const mix = (a: number, b: number) => Math.round(a * 0.58 + b * 0.42);
  const r = mix(parseInt(hex.slice(0, 2), 16), 0x0b);
  const g = mix(parseInt(hex.slice(2, 4), 16), 0x12);
  const b = mix(parseInt(hex.slice(4, 6), 16), 0x20);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Greedy wrap by estimated width. */
function wrap(text: string, maxWidth: number, size: number): string[] {
  const max = Math.max(8, Math.floor(maxWidth / adv(size)));
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (!line) line = word;
    else if (line.length + 1 + word.length <= max) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Same placement rules as lib/boards.ts, kept in sync by shape of the data. */
function placePins(board: Board): PlacedPin[] {
  const { numbering, rows } = board.layout;
  return board.pins.map((pin: Pin, i: number) => {
    if (pin.side && pin.row) return { ...pin, side: pin.side, row: pin.row };
    const n = pin.number ?? i + 1;
    if (numbering === "zigzag") {
      return { ...pin, side: n % 2 === 1 ? "left" : "right", row: Math.ceil(n / 2) } as PlacedPin;
    }
    return (
      n <= rows
        ? { ...pin, side: "left", row: n }
        : { ...pin, side: "right", row: 2 * rows - n + 1 }
    ) as PlacedPin;
  });
}

// ---- pieces ---------------------------------------------------------------

/** Lays out tag chips outward from `startX`; returns the markup and its width. */
function tagChips(
  tags: HighlightKey[],
  startX: number,
  y: number,
  dir: 1 | -1,
): { svg: string; width: number } {
  const size = 7.5;
  const out: string[] = [];
  let used = 0;
  for (const tag of tags) {
    const label = ALL_SIGNALS[tag].label;
    const w = textWidth(label, size) + 9;
    const x = dir === 1 ? startX + used : startX - used - w;
    const c = hue(tag);
    out.push(
      `<g><rect x="${x.toFixed(1)}" y="${(y - 6.5).toFixed(1)}" width="${w.toFixed(1)}" height="13" rx="0" fill="${c}" fill-opacity="0.14" stroke="${c}" stroke-opacity="0.5" stroke-width="0.6"/>` +
        `<text x="${(x + w / 2).toFixed(1)}" y="${(y + 2.6).toFixed(1)}" font-size="${size}" fill="${ink(tag)}" text-anchor="middle">${esc(label)}</text></g>`,
    );
    used += w + 3;
  }
  return { svg: out.join(""), width: Math.max(0, used - 3) };
}

function pinRow(pin: PlacedPin, y: number, side: "left" | "right", cx: number): string {
  const mirror = side === "right";
  const edge = mirror ? cx + BODY_W / 2 : cx - BODY_W / 2;
  const dir: 1 | -1 = mirror ? 1 : -1;
  const anchor = mirror ? "start" : "end";
  const mid = y + ROW_H / 2;

  const parts: string[] = [];

  // Lead line out of the board body, as on a real pinout card.
  parts.push(
    `<line x1="${edge}" y1="${mid}" x2="${(edge + dir * 8).toFixed(1)}" y2="${mid}" stroke="${LINE}" stroke-width="1"/>`,
  );

  // Pin number box, hard against the body. Omitted on packages whose pins are
  // named rather than numbered (the Arduino headers).
  if (pin.number != null) {
    const numX = edge + dir * 10;
    const boxX = mirror ? numX : numX - 22;
    parts.push(
      `<rect x="${boxX.toFixed(1)}" y="${(mid - 7.5).toFixed(1)}" width="22" height="15" rx="0" fill="#faf7f0" stroke="${LINE}" stroke-width="0.8"/>` +
        `<text x="${(boxX + 11).toFixed(1)}" y="${(mid + 3.6).toFixed(1)}" font-size="9" fill="${MUTED}" text-anchor="middle">${esc(String(pin.number))}</text>`,
    );
  }

  // Role swatch and name
  parts.push(
    `<circle cx="${(edge + dir * 42).toFixed(1)}" cy="${mid}" r="3.4" fill="${hue(pin.primary)}"/>`,
  );
  parts.push(
    `<text x="${(edge + dir * 52).toFixed(1)}" y="${(mid + 4).toFixed(1)}" font-size="12.5" font-weight="600" fill="${ink(pin.primary)}" text-anchor="${anchor}">${esc(pin.name)}</text>`,
  );

  // Tag block starts at a fixed offset so the chips line up down the column.
  const TAGS_AT = 126;
  let consumed = TAGS_AT;
  if (pin.tags?.length) {
    const { svg, width } = tagChips(pin.tags, edge + dir * TAGS_AT, mid, dir);
    parts.push(svg);
    consumed = TAGS_AT + width;
  }

  // Voltage leads the detail text, which keeps it on one baseline per row.
  const detail = [pin.voltage, ...(pin.functions ?? [])].filter(Boolean).join(" · ");
  if (detail) {
    const fnEnd = edge + dir * (consumed + 10);
    const room = mirror ? W - PAD - 14 - fnEnd : fnEnd - PAD - 14;
    const maxChars = Math.max(6, Math.floor(room / adv(8.5)));
    const shown = detail.length > maxChars ? `${detail.slice(0, maxChars - 1)}…` : detail;
    parts.push(
      `<text x="${fnEnd.toFixed(1)}" y="${(mid + 3.2).toFixed(1)}" font-size="8.5" fill="${MUTED}" text-anchor="${anchor}">${esc(shown)}</text>`,
    );
  }

  // Gotcha marker, parked in the outer margin where it reads as a column.
  if (pin.note) {
    const mx = mirror ? W - PAD - 5 : PAD + 5;
    parts.push(
      `<circle cx="${mx}" cy="${mid}" r="5" fill="#f59e0b" fill-opacity="0.18"/>` +
        `<text x="${mx}" y="${(mid + 3).toFixed(1)}" font-size="8.5" font-weight="700" fill="#b45309" text-anchor="middle">!</text>`,
    );
  }

  return `<g>${parts.join("")}</g>`;
}

function legend(board: Board, y: number): string {
  const used = new Set<HighlightKey>();
  for (const pin of board.pins) {
    used.add(pin.primary);
    for (const t of pin.tags ?? []) used.add(t);
  }
  const keys = (Object.keys(ALL_SIGNALS) as HighlightKey[]).filter((k) => used.has(k));

  let x = PAD;
  const out: string[] = [];
  for (const k of keys) {
    const label = ALL_SIGNALS[k].label;
    out.push(
      `<circle cx="${(x + 4).toFixed(1)}" cy="${y}" r="3.4" fill="${hue(k)}"/>` +
        `<text x="${(x + 12).toFixed(1)}" y="${(y + 3.4).toFixed(1)}" font-size="9" fill="${MUTED}">${esc(label)}</text>`,
    );
    x += 12 + textWidth(label, 9) + 14;
  }
  return out.join("");
}

function render(board: Board): string {
  const placed = placePins(board);
  const rows = Math.max(board.layout.rows, ...placed.map((p) => p.row));
  const cx = W / 2;
  const gridTop = HEADER_H + LEGEND_H;

  // Up to three gotchas, wrapped into two columns under the diagram.
  const notes = (board.notes ?? []).slice(0, 3);
  const noteColW = (W - PAD * 2 - 24) / 2;
  const noteLines = notes.map((n) => wrap(n, noteColW - 14, 8.5));
  const noteBlockH = notes.length
    ? 26 + Math.max(
        noteLines.slice(0, 2).reduce((a, l) => a + l.length * 11 + 10, 0),
        noteLines.slice(2).reduce((a, l) => a + l.length * 11 + 10, 0),
      )
    : 0;

  const gridH = rows * ROW_H;
  const H = Math.round(gridTop + gridH + 24 + noteBlockH + 46);

  const body: string[] = [];

  // Header
  body.push(
    `<text x="${PAD}" y="42" font-size="25" font-weight="700" fill="${INK}" font-family="${SERIF}">${esc(board.name)}</text>`,
    `<text x="${PAD}" y="62" font-size="10.5" fill="${MUTED}">${esc(board.vendor)} · ${esc(board.package)}</text>`,
    `<text x="${PAD}" y="80" font-size="11" font-weight="700" fill="${INK}">Logic: ${esc(board.logic)}</text>`,
    `<text x="${W - PAD}" y="42" font-size="12" font-weight="700" fill="${INK}" text-anchor="end" font-family="${SERIF}" letter-spacing="1.5">OPENLABBENCH</text>`,
    `<text x="${W - PAD}" y="58" font-size="9" fill="${FAINT}" text-anchor="end">${PUBLIC_URL}/pinouts/${esc(board.slug)}</text>`,
    `<line x1="${PAD}" y1="90" x2="${W - PAD}" y2="90" stroke="${INK}" stroke-width="1"/>` +
      `<line x1="${PAD}" y1="93" x2="${W - PAD}" y2="93" stroke="${INK}" stroke-width="0.6"/>`,
    legend(board, HEADER_H + 10),
  );

  // Board body
  const bodyTop = gridTop + 4;
  const bodyH = gridH - 8;
  body.push(
    `<rect x="${cx - BODY_W / 2}" y="${bodyTop}" width="${BODY_W}" height="${bodyH}" rx="0" fill="#f1ece0" stroke="${LINE}" stroke-width="1.2"/>`,
  );
  if (board.layout.kind === "dip") {
    // Pin-1 notch, the orientation marker that matters on a DIP package.
    body.push(
      `<path d="M ${cx - 13} ${bodyTop} A 13 13 0 0 0 ${cx + 13} ${bodyTop}" fill="none" stroke="${LINE}" stroke-width="1.2"/>`,
    );
  }
  body.push(
    `<text x="${cx}" y="${bodyTop + bodyH / 2}" font-size="13" font-weight="700" fill="${MUTED}" text-anchor="middle" transform="rotate(-90 ${cx} ${bodyTop + bodyH / 2})">${esc(board.shortName.toUpperCase())}</text>`,
  );

  // Side labels
  if (board.layout.sideLabels) {
    body.push(
      `<text x="${cx - BODY_W / 2 - 10}" y="${gridTop - 6}" font-size="8.5" fill="${FAINT}" text-anchor="end">${esc(board.layout.sideLabels[0])}</text>`,
      `<text x="${cx + BODY_W / 2 + 10}" y="${gridTop - 6}" font-size="8.5" fill="${FAINT}">${esc(board.layout.sideLabels[1])}</text>`,
    );
  }

  // Pin rows, with alternating banding to keep the eye on one line
  for (let r = 1; r <= rows; r++) {
    const y = gridTop + (r - 1) * ROW_H;
    if (r % 2 === 0) {
      body.push(
        `<rect x="${PAD}" y="${y}" width="${W - PAD * 2}" height="${ROW_H}" fill="${HAIR}" fill-opacity="0.55"/>`,
      );
    }
    const left = placed.find((p) => p.side === "left" && p.row === r);
    const right = placed.find((p) => p.side === "right" && p.row === r);
    if (left) body.push(pinRow(left, y, "left", cx));
    if (right) body.push(pinRow(right, y, "right", cx));
  }

  // Gotchas
  if (notes.length) {
    const top = gridTop + gridH + 26;
    body.push(
      `<line x1="${PAD}" y1="${top - 16}" x2="${W - PAD}" y2="${top - 16}" stroke="${LINE}" stroke-width="1"/>`,
      `<text x="${PAD}" y="${top - 2}" font-size="10" font-weight="700" fill="${INK}">CAUTION</text>`,
    );
    let yL = top + 16;
    let yR = top + 16;
    notes.forEach((_, i) => {
      const col = i % 2;
      const x = PAD + col * (noteColW + 24);
      let y = col === 0 ? yL : yR;
      body.push(`<circle cx="${x + 3}" cy="${y - 3}" r="2.4" fill="#f59e0b"/>`);
      for (const ln of noteLines[i]) {
        body.push(
          `<text x="${x + 13}" y="${y}" font-size="8.5" fill="${MUTED}">${esc(ln)}</text>`,
        );
        y += 11;
      }
      y += 10;
      if (col === 0) yL = y;
      else yR = y;
    });
  }

  body.push(
    `<text x="${PAD}" y="${H - 16}" font-size="8" fill="${FAINT}">Compiled from manufacturer datasheets, verify against your own board revision before applying power.</text>`,
    `<text x="${W - PAD}" y="${H - 16}" font-size="8" fill="${FAINT}" text-anchor="end">${PUBLIC_URL}</text>`,
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(board.name)} pinout cheat sheet">
<title>${esc(board.name)}, pinout cheat sheet</title>
<desc>${esc(board.summary)}</desc>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<g font-family="'Atkinson Hyperlegible Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">
${body.join("\n")}
</g>
</svg>
`;
}

// ---- run ------------------------------------------------------------------
fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs.readdirSync(BOARD_DIR).filter((f) => f.endsWith(".json"));
const manifest: { slug: string; file: string; bytes: number; width: number; height: number }[] = [];

for (const file of files) {
  const board = JSON.parse(fs.readFileSync(path.join(BOARD_DIR, file), "utf8")) as Board;
  const svg = render(board);
  const out = path.join(OUT_DIR, `${board.slug}.svg`);
  fs.writeFileSync(out, svg);
  const height = Number(svg.match(/height="(\d+)"/)?.[1] ?? 0);
  manifest.push({
    slug: board.slug,
    file: `/cheatsheets/${board.slug}.svg`,
    bytes: Buffer.byteLength(svg),
    width: W,
    height,
  });
  console.log(`  ${board.slug}.svg  ${W}x${height}  ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`);
}

fs.writeFileSync(
  path.join(ROOT, "data", "cheatsheets.json"),
  `${JSON.stringify(manifest.sort((a, b) => a.slug.localeCompare(b.slug)), null, 2)}\n`,
);
console.log(`\n${manifest.length} cheat sheets written to public/cheatsheets`);
