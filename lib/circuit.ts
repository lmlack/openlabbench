import type { Board, Circuit, CircuitPart, CircuitSymbol, Pin } from "./types";

/**
 * Turns a validated `circuit.parts` list into schematic geometry. The picture
 * is computed from the same rows the table prints and the same pin data the
 * diagram uses, so it cannot drift away from either. Anything this cannot lay
 * out returns null and the page falls back to the table alone.
 */

const POWER = new Set(["power5", "power3", "vcc", "vin"]);

/**
 * Only a pin named as the part's actual supply gets a wire to the rail drawn
 * for it. The primary role is not enough on its own: a DS1307's VBAT and an
 * ATmega's AREF are both power pins and neither belongs on VCC. A numbered
 * name is excluded for the same reason: an L293D's VCC2 is the motor rail, so
 * a part with two supplies has to say in its data where each one goes.
 * A missing wire is a visible gap; a wrong one is a blown part.
 */
const SUPPLY_NAME = /^(VCC|VDD|VDDA|VDDIO|AVCC|AVDD|VS|VIN|VBUS|V\+)$/i;

// Atkinson Hyperlegible Mono at 13px, measured.
const CHAR_W = 7.6;
const RAIL_PAD = 26; // rail inset from the top and bottom edges
const SYM_ZONE = 64; // room on a rail-bound wire for its symbol
const LANE_H = 32; // one horizontal routing lane
const PIN_LABEL_H = 26;
const BODY_H = 54;
const MARGIN_X = 54;
const MIN_SPACING = 88;

/** Half the width of each symbol, so labels clear it. Matches CircuitDiagram. */
const HALF: Record<CircuitSymbol, number> = {
  cap: 13,
  res: 7,
  xtal: 10,
  link: 1,
  cell: 11,
  osc: 19,
  load: 10,
};

export type Orient = "v" | "h";
export type Net = "VCC" | "GND" | "MCU" | "VM";

/** Nets drawn as an off-chip terminal rather than as a rail. */
const TERMINALS = new Set<string>(["MCU", "VM"]);

export interface SchemSymbol {
  kind: CircuitSymbol;
  x: number;
  y: number;
  orient: Orient;
}

export interface SchemLabel {
  lines: string[];
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
}

export interface SchemWire {
  key: string;
  /** Polyline, already routed. */
  points: [number, number][];
  symbol?: SchemSymbol;
  label?: SchemLabel;
  /** Optional parts draw dashed. */
  dashed: boolean;
  /** Junction dots, where a wire taps a rail. */
  dots: [number, number][];
  title: string;
}

export interface SchemNode {
  x: number;
  /** Where the label starts: just clear of the pin's own wire. */
  labelX: number;
  /** Pin name, or the net name for an off-chip terminal. */
  name: string;
  number?: number;
  /** Which edges the pin has wires on, and so where its label is printed. */
  above: boolean;
  below: boolean;
  terminal: boolean;
}

export interface Schematic {
  width: number;
  height: number;
  vcc?: number;
  gnd?: number;
  rail: [number, number];
  body: { x: number; y: number; w: number; h: number; label: string };
  nodes: SchemNode[];
  wires: SchemWire[];
  /** True when at least one part is optional, so the caption explains dashes. */
  hasOptional: boolean;
}

/** "GND", "MCU", or a pin as "DISCH (7)". */
export function endpointLabel(board: Board, end: string): string {
  const n = Number(end);
  if (!Number.isInteger(n)) return end;
  const pin = board.pins.find((p) => p.number === n);
  return pin ? `${pin.name} (${n})` : `pin ${n}`;
}

/** Two lines at most, split at the space nearest the middle. */
function wrap(text: string): string[] {
  if (text.length <= 9 || !text.includes(" ")) return [text];
  const mid = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++)
    if (text[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best < 0 ? [text] : [text.slice(0, best), text.slice(best + 1)];
}

const widest = (lines: string[]) => Math.max(...lines.map((l) => l.length)) * CHAR_W;

type End = { net: Net } | { pin: number };

interface Vertical {
  part?: CircuitPart;
  /** Pin number as a string, or a terminal name: both hang off a rail. */
  node: string;
  rail: "VCC" | "GND";
}

interface Band {
  part: CircuitPart;
  a: string; // node key
  b: string;
}

export function schematic(board: Board, circuit: Circuit): Schematic | null {
  const byNumber = new Map<number, Pin>();
  for (const p of board.pins) if (typeof p.number === "number") byNumber.set(p.number, p);
  if (byNumber.size === 0) return null;

  const parse = (s: string): End | null => {
    if (s === "VCC" || s === "GND" || TERMINALS.has(s)) return { net: s as Net };
    const n = Number(s);
    return Number.isInteger(n) && byNumber.has(n) ? { pin: n } : null;
  };

  const verticals: Vertical[] = [];
  const bands: Band[] = [];
  const pinSet = new Set<number>();
  const terminals = new Set<string>();

  for (const c of circuit.parts) {
    const a = parse(c.from);
    const b = parse(c.to);
    if (!a || !b) return null;
    const ends = [a, b];
    for (const e of ends) {
      if ("pin" in e) pinSet.add(e.pin);
      else if (TERMINALS.has(e.net)) terminals.add(e.net);
    }
    const pins = ends.filter((e): e is { pin: number } => "pin" in e);
    const nets = ends.filter((e): e is { net: Net } => "net" in e);
    if (pins.length === 2) {
      bands.push({ part: c, a: String(pins[0].pin), b: String(pins[1].pin) });
    } else if (pins.length === 1 && TERMINALS.has(nets[0].net)) {
      bands.push({ part: c, a: nets[0].net, b: String(pins[0].pin) });
    } else if (pins.length === 1) {
      verticals.push({ part: c, node: String(pins[0].pin), rail: nets[0].net as "VCC" | "GND" });
    } else {
      // Both ends are nets. A terminal to a rail is the lower leg of a
      // divider and hangs off the terminal; rail to rail has nothing to
      // hang off at all.
      const term = nets.find((n) => TERMINALS.has(n.net));
      const rail = nets.find((n) => n.net === "VCC" || n.net === "GND");
      if (!term || !rail) return null;
      terminals.add(term.net);
      verticals.push({ part: c, node: term.net, rail: rail.net as "VCC" | "GND" });
    }
  }

  // Supply pins get a wire to their rail even when no part names them: a
  // schematic that leaves GND unconnected is not a schematic. Skip the whole
  // lot on a board with many supply pins, where it would be noise.
  const supply = board.pins.filter(
    (p) =>
      typeof p.number === "number" &&
      (p.primary === "gnd" ||
        (POWER.has(p.primary) &&
          [p.name, ...(p.aliases ?? [])].some((n) => SUPPLY_NAME.test(n)))),
  );
  const includeAllSupply = supply.length <= 8;
  for (const p of supply) {
    const n = p.number as number;
    if (!includeAllSupply && !pinSet.has(n)) continue;
    pinSet.add(n);
    const rail = p.primary === "gnd" ? "GND" : "VCC";
    // An explicit row already ties this pin to its rail, so do not double it.
    if (!verticals.some((v) => v.node === String(n) && v.rail === rail))
      verticals.push({ node: String(n), rail });
  }

  const pinOrder = [...pinSet].sort((x, y) => x - y);
  if (pinOrder.length === 0) return null;

  // Each off-chip terminal goes on whichever end its parts point at.
  const terminalSide = (t: string) => {
    const idx = bands
      .filter((b) => b.a === t || b.b === t)
      .map((b) => pinOrder.indexOf(Number(b.a === t ? b.b : b.a)));
    const avg = idx.reduce((n, i) => n + i, 0) / Math.max(idx.length, 1);
    return avg > (pinOrder.length - 1) / 2 ? "right" : "left";
  };
  const used = [...terminals];
  const order: string[] = [
    ...used.filter((t) => terminalSide(t) === "left"),
    ...pinOrder.map(String),
    ...used.filter((t) => terminalSide(t) === "right"),
  ];

  // Column pitch has to clear the widest thing hanging in a column: a pin
  // label, or a rail-bound part's label sitting beside its symbol.
  let pitch = MIN_SPACING;
  for (const v of verticals) {
    if (!v.part) continue;
    pitch = Math.max(pitch, widest(wrap(v.part.part)) + HALF[v.part.symbol] + 32);
  }
  for (const n of pinOrder) {
    const pin = byNumber.get(n) as Pin;
    pitch = Math.max(pitch, (`${pin.name} ${n}`.length + 1) * CHAR_W + 14);
  }
  pitch = Math.ceil(pitch);

  const x = new Map<string, number>();
  order.forEach((k, i) => x.set(k, MARGIN_X + i * pitch));
  let width = MARGIN_X * 2 + (order.length - 1) * pitch;

  // Which side of the chip each band route runs on: the side it crosses the
  // fewest rail-bound wires.
  const laneSide = new Map<Band, "above" | "below">();
  for (const b of bands) {
    const lo = Math.min(x.get(b.a) as number, x.get(b.b) as number);
    const hi = Math.max(x.get(b.a) as number, x.get(b.b) as number);
    let up = 0;
    let down = 0;
    for (const v of verticals) {
      const vx = x.get(v.node) as number;
      if (vx <= lo || vx >= hi) continue;
      if (v.rail === "VCC") up++;
      else down++;
    }
    laneSide.set(b, up <= down ? "above" : "below");
  }

  // Lanes, widest span first so a nested route never lands on top of its parent.
  const laneOf = new Map<Band, number>();
  const laneCount = { above: 0, below: 0 };
  for (const side of ["above", "below"] as const) {
    const mine = bands
      .filter((b) => laneSide.get(b) === side)
      .map((b) => {
        const lo = Math.min(x.get(b.a) as number, x.get(b.b) as number);
        const hi = Math.max(x.get(b.a) as number, x.get(b.b) as number);
        return { b, lo, hi };
      })
      .sort((p, q) => p.lo - q.lo || q.hi - q.lo - (p.hi - p.lo));
    const ends: number[] = [];
    for (const { b, lo, hi } of mine) {
      let lane = ends.findIndex((e) => e + 110 < lo);
      if (lane < 0) {
        lane = ends.length;
        ends.push(hi);
      } else ends[lane] = hi;
      laneOf.set(b, lane);
    }
    laneCount[side] = ends.length;
  }

  const hasUp = verticals.some((v) => v.rail === "VCC");
  const hasDown = verticals.some((v) => v.rail === "GND");

  const aboveH =
    (hasUp ? RAIL_PAD + SYM_ZONE : 12) + laneCount.above * LANE_H + PIN_LABEL_H;
  const bodyTop = aboveH;
  const bodyBottom = bodyTop + BODY_H;
  const belowH = PIN_LABEL_H + laneCount.below * LANE_H + (hasDown ? SYM_ZONE + RAIL_PAD : 12);
  const height = bodyBottom + belowH;
  const vcc = hasUp ? RAIL_PAD : undefined;
  const gnd = hasDown ? height - RAIL_PAD : undefined;

  const bodyX = (x.get(String(pinOrder[0])) as number) - 30;
  const bodyW = (x.get(String(pinOrder[pinOrder.length - 1])) as number) + 30 - bodyX;
  const bodyMid = bodyTop + BODY_H / 2;

  const laneY = (side: "above" | "below", lane: number) =>
    side === "above"
      ? bodyTop - PIN_LABEL_H - 6 - lane * LANE_H
      : bodyBottom + PIN_LABEL_H + 6 + lane * LANE_H;

  const wires: SchemWire[] = [];
  const upFrom = new Set<number>();
  const downFrom = new Set<number>();

  // Rail-bound parts. Several from one pin to one rail get their own column
  // with a short jog, so two decoupling caps do not land on the same wire.
  const groups = new Map<string, Vertical[]>();
  for (const v of verticals) {
    const k = `${v.node}-${v.rail}`;
    groups.set(k, [...(groups.get(k) ?? []), v]);
  }
  for (const [, group] of groups) {
    group.forEach((v, i) => {
      const up = v.rail === "VCC";
      const isTerm = TERMINALS.has(v.node);
      if (!isTerm) (up ? upFrom : downFrom).add(Number(v.node));
      const px = x.get(v.node) as number;
      const off = group.length > 1 ? (i - (group.length - 1) / 2) * 38 : 0;
      const start = isTerm ? (up ? bodyMid - 13 : bodyMid + 13) : up ? bodyTop : bodyBottom;
      const railY = (up ? vcc : gnd) as number;
      const points: [number, number][] = off
        ? [
            [px, start],
            [px, start + (up ? -14 : 14)],
            [px + off, start + (up ? -14 : 14)],
            [px + off, railY],
          ]
        : [
            [px, start],
            [px, railY],
          ];
      const symY = up ? railY + SYM_ZONE / 2 : railY - SYM_ZONE / 2;
      wires.push({
        key: `v-${v.node}-${v.rail}-${i}`,
        points,
        symbol: v.part
          ? { kind: v.part.symbol, x: px + off, y: symY, orient: "v" }
          : undefined,
        label: v.part
          ? {
              lines: wrap(v.part.part),
              x: px + off + (off < 0 ? -1 : 1) * (HALF[v.part.symbol] + 6),
              y: symY,
              anchor: off < 0 ? "end" : "start",
            }
          : undefined,
        dashed: v.part ? !v.part.required : false,
        dots: [[px + off, railY]],
        title: v.part
          ? `${v.part.part} between ${endpointLabel(board, v.node)} and ${v.rail}`
          : `${endpointLabel(board, v.node)} to ${v.rail}`,
      });
    });
  }

  // Pin to pin, and pin to the off-chip terminal.
  bands.forEach((b, i) => {
    const side = laneSide.get(b) as "above" | "below";
    const y = laneY(side, laneOf.get(b) as number);
    const attach = (k: string) =>
      TERMINALS.has(k)
        ? side === "above"
          ? bodyMid - 13
          : bodyMid + 13
        : side === "above"
          ? bodyTop
          : bodyBottom;
    const ax = x.get(b.a) as number;
    const bx = x.get(b.b) as number;
    const touched = side === "above" ? upFrom : downFrom;
    if (!TERMINALS.has(b.a)) touched.add(Number(b.a));
    if (!TERMINALS.has(b.b)) touched.add(Number(b.b));
    const mid = (ax + bx) / 2;
    wires.push({
      key: `b-${i}`,
      points: [
        [ax, attach(b.a)],
        [ax, y],
        [bx, y],
        [bx, attach(b.b)],
      ],
      symbol: { kind: b.part.symbol, x: mid, y, orient: "h" },
      label: { lines: [b.part.part], x: mid, y: y - 15, anchor: "middle" },
      dashed: !b.part.required,
      dots: [],
      title: `${b.part.part} between ${endpointLabel(board, b.a)} and ${endpointLabel(board, b.b)}`,
    });
  });

  const nodes: SchemNode[] = order.map((k) => {
    const nx = x.get(k) as number;
    if (TERMINALS.has(k))
      return { x: nx, labelX: nx, name: k, above: false, below: false, terminal: true };
    const n = Number(k);
    const pin = byNumber.get(n) as Pin;
    return {
      x: nx,
      labelX: nx + 7,
      name: pin.name,
      number: n,
      above: upFrom.has(n),
      below: downFrom.has(n),
      terminal: false,
    };
  });

  // Labels hang off the ends of the drawing, and a stacked part's label can
  // hang off the left of the first column. Measure everything, then slide the
  // whole picture clear of both edges.
  let lo = 0;
  let hi = width;
  const span = (l: SchemLabel) => {
    const w = widest(l.lines);
    if (l.anchor === "start") return [l.x, l.x + w];
    if (l.anchor === "end") return [l.x - w, l.x];
    return [l.x - w / 2, l.x + w / 2];
  };
  for (const w of wires) {
    for (const [px] of w.points) {
      lo = Math.min(lo, px);
      hi = Math.max(hi, px);
    }
    if (!w.label) continue;
    const [a, b] = span(w.label);
    lo = Math.min(lo, a);
    hi = Math.max(hi, b);
  }
  for (const n of nodes) {
    const w = n.terminal ? 25 : (`${n.name} ${n.number}`.length + 1) * CHAR_W;
    lo = Math.min(lo, n.terminal ? n.x - 25 : n.x);
    hi = Math.max(hi, n.labelX + w);
  }

  const dx = Math.max(0, 12 - lo);
  if (dx) {
    for (const w of wires) {
      w.points = w.points.map(([px, py]) => [px + dx, py]);
      w.dots = w.dots.map(([px, py]) => [px + dx, py]);
      if (w.symbol) w.symbol.x += dx;
      if (w.label) w.label.x += dx;
    }
    for (const n of nodes) {
      n.x += dx;
      n.labelX += dx;
    }
  }
  width = Math.ceil(Math.max(width, hi) + dx + 12);

  return {
    width,
    height,
    vcc,
    gnd,
    rail: [12, width - 12],
    body: { x: bodyX + dx, y: bodyTop, w: bodyW, h: BODY_H, label: board.shortName },
    nodes,
    wires,
    hasOptional: circuit.parts.some((c) => !c.required),
  };
}
