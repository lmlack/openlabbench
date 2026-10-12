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
        {/* Below ~360px a pin row with five bus badges is wider than the
            screen. Scrolling the diagram inside its own card beats clipping
            badges or dropping them, and leaves the rest of the page intact. */}
        <div
          className="overflow-x-auto rounded-2xl border border-line bg-panel p-3 sm:p-5"
          onMouseLeave={() => setPeeked(null)}
        >
          <div className="grid gap-x-3 gap-y-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
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
  return (
    <div className="order-first flex min-h-28 items-center justify-center rounded-lg border border-line-strong bg-raised px-4 py-3 md:order-none md:w-28 md:px-0">
      <div className="flex flex-col items-center gap-2 md:[writing-mode:vertical-rl] md:rotate-180">
        {isChip && (
          <span
            className="size-4 rounded-full border border-line-strong md:mb-1"
            aria-label="Pin 1 notch marker"
            title="Pin 1 end"
          />
        )}
        <span className="text-sm font-semibold uppercase tracking-wider text-muted">
          {board.shortName.toUpperCase()}
        </span>
      </div>
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
  return (
    <div className="min-w-0">
      <p
        className={`eyebrow mb-2 ${
          mirror ? "md:text-left" : "md:text-right"
        }`}
      >
        {label}
      </p>
      <ul className="space-y-1">
        {rows.map((row) => {
          const pin = side === "left" ? row.left : row.right;
          if (!pin) {
            // Keeps the two columns in step where one side has a gap
            // (the Uno's power and analog headers are different lengths).
            return <li key={row.row} className="hidden h-9 md:block" aria-hidden="true" />;
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
      className={`flex h-9 w-full items-center gap-2 rounded-md border px-1.5 transition-all ${
        mirror ? "flex-row" : "flex-row md:flex-row-reverse"
      } ${dim ? "pin-dim" : ""} ${
        active ? "border-line-strong bg-raised" : "border-transparent hover:bg-raised"
      }`}
    >
      {/* Pin number sits against the board body, as it does on a real one.
          Omitted on packages whose pins are named rather than numbered. */}
      {pin.number != null && (
        <span className="flex size-6 shrink-0 items-center justify-center rounded border border-line bg-bg font-mono text-sm text-subtle">
          {pin.number}
        </span>
      )}

      <span
        className="sig-dot size-2.5 shrink-0 rounded-full"
        style={{ "--sig": meta.color } as React.CSSProperties}
        title={meta.label}
      />

      <span
        className="sig-text shrink-0 font-mono text-sm font-medium"
        style={{ "--sig": meta.color } as React.CSSProperties}
      >
        {pin.name}
      </span>

      {pin.voltage && (
        <span className="shrink-0 text-sm text-subtle">{pin.voltage}</span>
      )}

      <span className={`flex shrink-0 gap-1 ${mirror ? "" : "md:flex-row-reverse"}`}>
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
