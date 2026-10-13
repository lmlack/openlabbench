"use client";

import { useMemo, useState } from "react";
import type { GridRow } from "@/lib/boards";
import { LEGEND_ORDER, signal } from "@/lib/signals";
import type { Board, HighlightKey, PlacedPin } from "@/lib/types";
import { SignalBadge } from "./SignalBadge";

interface Props {
  board: Board;
  grid: GridRow[];
  counts: Record<string, number>;
}

export function PinoutExplorer({ board, grid, counts }: Props) {
  /** Set by clicking legend chips, survives mouse-out. */
  const [locked, setLocked] = useState<Set<HighlightKey>>(new Set());
  /** Set by hovering a legend chip, transient preview. */
  const [hoverKey, setHoverKey] = useState<HighlightKey | null>(null);
  /** Hovered or focused pin. */
  const [peeked, setPeeked] = useState<PlacedPin | null>(null);
  /** Clicked pin, stays until cleared, so you can read it and look away. */
  const [pinned, setPinned] = useState<PlacedPin | null>(null);

  const activeKeys = useMemo<Set<HighlightKey> | null>(() => {
    if (locked.size) return locked;
    if (hoverKey) return new Set([hoverKey]);
    return null;
  }, [locked, hoverKey]);

  const legendKeys = LEGEND_ORDER.filter((k) => counts[k]);
  const inspected = peeked ?? pinned;

  function toggle(key: HighlightKey) {
    setLocked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function dimmed(pin: PlacedPin) {
    if (!activeKeys) return false;
    return ![pin.primary, ...(pin.tags ?? [])].some((k) => activeKeys.has(k));
  }

  const matched = activeKeys
    ? board.pins.filter((p) => [p.primary, ...(p.tags ?? [])].some((k) => activeKeys.has(k))).length
    : 0;

  return (
    <div>
      {/* Legend doubles as the filter control. */}
      <div className="no-print rounded-2xl border border-line bg-panel p-3 sm:p-4">
        <div className="mb-3 flex flex-col items-center gap-1 text-center">
          <h2 className="text-base font-semibold">
            Highlight a signal
            <span className="ml-2 font-normal text-subtle">hover to preview, click to keep</span>
          </h2>
          {locked.size > 0 && (
            <button
              type="button"
              onClick={() => setLocked(new Set())}
              className="text-sm text-accent hover:underline"
            >
              clear {locked.size} filter{locked.size > 1 ? "s" : ""} · {matched} pins
            </button>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {legendKeys.map((key) => {
            const meta = signal(key);
            const on = locked.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                onMouseEnter={() => setHoverKey(key)}
                onMouseLeave={() => setHoverKey(null)}
                onFocus={() => setHoverKey(key)}
                onBlur={() => setHoverKey(null)}
                aria-pressed={on}
                title={meta.hint}
                className={`sig-chip sig-text flex items-center gap-1.5 rounded-full border-[1.5px] px-2.5 py-1.5 text-sm font-medium transition-all ${
                  on ? "ring-2 ring-offset-1 ring-offset-panel" : "hover:brightness-125"
                }`}
                style={
                  {
                    "--sig": meta.color,
                    ...(on ? { boxShadow: `0 0 0 1px ${meta.color}` } : {}),
                  } as React.CSSProperties
                }
              >
                <span className="sig-dot size-2 rounded-full" style={{ "--sig": meta.color } as React.CSSProperties} />
                {meta.label}
                <span className="text-sm opacity-70">{counts[key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ---- Diagram ---- */}
        {/* Pins stay on both sides of the body at every width: where each pin
            sits is the point of a pinout. Phones get a narrow body and drop
            the bus badges and voltages, which the inspector and the table
            still show. A board with very long names on a very narrow screen
            scrolls inside its own card rather than squeezing. */}
        <div
          className="overflow-x-auto rounded-2xl border border-line bg-panel p-2 sm:p-5"
          onMouseLeave={() => setPeeked(null)}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-1 max-[380px]:gap-x-0.5 md:gap-x-3">
            <PinColumn
              rows={grid}
              side="left"
              label={board.layout.sideLabels?.[0] ?? "Left"}
              dimmed={dimmed}
              inspected={inspected}
              onPeek={setPeeked}
              onSelect={setPinned}
            />

            <BoardBody board={board} />

            <PinColumn
              rows={grid}
              side="right"
              label={board.layout.sideLabels?.[1] ?? "Right"}
              dimmed={dimmed}
              inspected={inspected}
              onPeek={setPeeked}
              onSelect={setPinned}
            />
          </div>
        </div>

        {/* ---- Inspector ---- */}
        <div className="no-print xl:sticky xl:top-20 xl:self-start">
          <Inspector
            pin={inspected}
            board={board}
            isPinned={Boolean(pinned && !peeked)}
            onClear={() => {
              setPinned(null);
              setPeeked(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function BoardBody({ board }: { board: Board }) {
  const isChip = board.layout.kind === "dip";
  // A DIP's notch sits at the pin-1 end, the top here, between pin 1 and the
  // last pin. Drawn as a half-circle cut into the top edge, as on the real
  // part, so it lines up with pin 1 however many pins the chip has.
  return (
    <div className="relative flex w-8 items-center justify-center rounded-lg border border-line-strong bg-raised py-3 md:w-28">
      {isChip && (
        <span
          className="absolute -top-px left-1/2 h-2.5 w-5 -translate-x-1/2 rounded-b-full border border-t-0 border-line-strong bg-panel md:h-3.5 md:w-7"
          aria-label="Pin 1 notch marker"
          title="Pin 1 end"
        />
      )}
      <span className="rotate-180 text-xs font-semibold uppercase tracking-wider text-muted [writing-mode:vertical-rl] md:text-sm">
        {board.shortName.toUpperCase()}
      </span>
    </div>
  );
}

interface ColumnProps {
  rows: GridRow[];
  side: "left" | "right";
  label: string;
  dimmed: (pin: PlacedPin) => boolean;
  inspected: PlacedPin | null;
  onPeek: (pin: PlacedPin | null) => void;
  onSelect: (pin: PlacedPin | null) => void;
}

function PinColumn({ rows, side, label, dimmed, inspected, onPeek, onSelect }: ColumnProps) {
  const mirror = side === "right";
  const has = rows.map((row) => Boolean(side === "left" ? row.left : row.right));
  const firstPin = has.indexOf(true);
  const lastPin = has.lastIndexOf(true);
  return (
    <div className="min-w-0">
      <p className={`eyebrow mb-2 ${mirror ? "text-left" : "text-right"}`}>
        {label}
      </p>
      <ul className="space-y-1">
        {rows.map((row, i) => {
          const pin = side === "left" ? row.left : row.right;
          // Before this side's first pin or after its last, an empty row is
          // only padding to line the columns up, not a gap on the board.
          if (!pin && (i < firstPin || i > lastPin)) {
            return <li key={row.row} className="h-9" aria-hidden="true" />;
          }
          if (!pin) {
            // A real gap on the board: the space between two header blocks
            // (the Uno's D0-D7 and D8-D15, or its power and analog headers).
            // Drawn as a marked break so it does not read as a missing pin.
            return (
              <li
                key={row.row}
                className="flex h-9 items-center gap-2 px-1 text-subtle"
                aria-hidden="true"
                title="Gap between headers on the board"
              >
                <span className="flex-1 border-t border-dashed border-line-strong" />
                <span className="text-[10px] uppercase tracking-widest">gap</span>
                <span className="flex-1 border-t border-dashed border-line-strong" />
              </li>
            );
          }
          return (
            <li key={`${row.row}-${pin.name}`}>
              <PinRow
                pin={pin}
                mirror={mirror}
                dim={dimmed(pin)}
                active={
                  inspected?.name === pin.name &&
                  inspected?.row === pin.row &&
                  inspected?.side === pin.side
                }
                onPeek={onPeek}
                onSelect={onSelect}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PinRow({
  pin,
  mirror,
  dim,
  active,
  onPeek,
  onSelect,
}: {
  pin: PlacedPin;
  mirror: boolean;
  dim: boolean;
  active: boolean;
  onPeek: (pin: PlacedPin | null) => void;
  onSelect: (pin: PlacedPin | null) => void;
}) {
  const meta = signal(pin.primary);
  return (
    <button
      type="button"
      onMouseEnter={() => onPeek(pin)}
      onFocus={() => onPeek(pin)}
      onBlur={() => onPeek(null)}
      onClick={() => onSelect(pin)}
      aria-label={`${pin.name}${pin.number ? `, pin ${pin.number}` : ""}, ${meta.label}`}
      className={`flex h-9 w-full items-center gap-1 rounded-md border px-0.5 transition-all md:gap-2 md:px-1.5 ${
        mirror ? "flex-row" : "flex-row-reverse"
      } ${dim ? "pin-dim" : ""} ${
        active ? "border-line-strong bg-raised" : "border-transparent hover:bg-raised"
      }`}
    >
      {/* Pin number sits against the board body, as it does on a real one.
          Omitted on packages whose pins are named rather than numbered. */}
      {pin.number != null && (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded border border-line bg-bg px-0.5 font-mono text-xs text-subtle md:size-6 md:px-0 md:text-sm">
          {pin.number}
        </span>
      )}

      <span
        className="sig-dot size-2 shrink-0 rounded-full md:size-2.5"
        style={{ "--sig": meta.color } as React.CSSProperties}
        title={meta.label}
      />

      <span
        // The few 9- and 10-character names (BeagleBone, Rock 5B) set slightly
        // tighter on phones, so they fit beside the body like the rest.
        className={`sig-text shrink-0 font-mono text-xs font-medium md:text-sm ${
          pin.name.length >= 9 ? "max-md:text-[11px] max-md:tracking-tight" : ""
        }`}
        style={{ "--sig": meta.color } as React.CSSProperties}
      >
        {pin.name}
      </span>

      {pin.voltage && (
        <span className="hidden shrink-0 text-sm text-subtle md:inline">{pin.voltage}</span>
      )}

      <span className={`hidden shrink-0 gap-1 md:flex ${mirror ? "" : "flex-row-reverse"}`}>
        {(pin.tags ?? []).map((t) => (
          <SignalBadge key={t} k={t} size="xs" />
        ))}
      </span>

      {/* Spacer: pushes the gotcha marker out to the margin so the markers form
          a column, and keeps the pin name and tags hugging the board body.
          Peripheral mappings live in the inspector, the table and the cheat
          sheet; squeezing them in here only ever produced truncation. */}
      <span className="min-w-0 flex-1" />

      {pin.note && (
        <span
          className="flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-500"
          title={pin.note}
          aria-hidden="true"
        >
          !
        </span>
      )}
    </button>
  );
}

function Inspector({
  pin,
  board,
  isPinned,
  onClear,
}: {
  pin: PlacedPin | null;
  board: Board;
  isPinned: boolean;
  onClear: () => void;
}) {
  if (!pin) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-4 text-center">
        <p className="text-base font-semibold">Pin detail</p>
        <p className="mt-1 text-sm text-muted">
          Hover a pin for its mappings and gotchas. Click to keep it here.
        </p>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-subtle">Logic level</dt>
            <dd className="text-right text-fg">{board.logic}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-subtle">Package</dt>
            <dd className="text-right text-fg">{board.package}</dd>
          </div>
        </dl>
      </div>
    );
  }

  const meta = signal(pin.primary);
  return (
    <div className="rounded-2xl border border-line bg-panel p-4 text-center">
      <div className="flex items-start justify-center gap-3">
        <div>
          <p
            className="sig-text font-mono text-xl font-semibold"
            style={{ "--sig": meta.color } as React.CSSProperties}
          >
            {pin.name}
          </p>
          <p className="mt-0.5 text-sm text-subtle">
            {pin.number ? `Physical pin ${pin.number} · ` : ""}
            {meta.label}
          </p>
        </div>
        {isPinned && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-sm text-accent hover:underline"
          >
            unpin
          </button>
        )}
      </div>

      {pin.voltage && (
        <p
          className="sig-text mt-3 text-sm"
          style={{ "--sig": meta.color } as React.CSSProperties}
        >
          {pin.voltage}
        </p>
      )}

      {pin.aliases && pin.aliases.length > 0 && (
        <div className="mt-3">
          <p className="eyebrow">
            Also called
          </p>
          <p className="mt-1 font-mono text-sm text-muted">{pin.aliases.join(" · ")}</p>
        </div>
      )}

      {pin.tags && pin.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1">
          {pin.tags.map((t) => (
            <SignalBadge key={t} k={t} />
          ))}
        </div>
      )}

      {pin.functions && pin.functions.length > 0 && (
        <div className="mt-3">
          <p className="eyebrow">
            Functions
          </p>
          <ul className="mt-1 space-y-0.5">
            {pin.functions.map((f) => (
              <li key={f} className="font-mono text-sm text-muted">
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pin.note && (
        <p className="callout-warn mt-4 rounded-lg border p-2.5 text-sm leading-relaxed">
          {pin.note}
        </p>
      )}
    </div>
  );
}
