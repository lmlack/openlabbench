import { signal } from "@/lib/signals";
import type { Board, PlacedPin } from "@/lib/types";
import { SignalBadge } from "./SignalBadge";

/**
 * The full table: deep-link target for search hits, and what actually prints
 * when someone hits Cmd-P on a board page.
 */
export function PinTable({ board, pins }: { board: Board; pins: PlacedPin[] }) {
  const ordered = [...pins].sort((a, b) => {
    if (a.number != null && b.number != null) return a.number - b.number;
    if (a.side !== b.side) return a.side === "left" ? -1 : 1;
    return a.row - b.row;
  });

  // Boards drawn from several headers have no physical pin numbers, and only
  // some boards wire their headers to a chip pin worth listing. A column of
  // dashes tells the reader nothing, so each column shows only when it has data.
  const showNumber = pins.some((p) => p.number != null);
  const showChip = !!board.chipPinLabel && pins.some((p) => p.chipPin != null);

  return (
    <div className="border-y-[1.5px] border-line-strong">
      <table className="w-full border-collapse text-center text-sm">
        <caption className="sr-only">Complete pin reference for {board.name}</caption>
        <thead>
          <tr className="border-b border-line-strong eyebrow">
            {showNumber && (
              <th scope="col" className="w-14 px-3 py-2.5 font-medium">
                Pin
              </th>
            )}
            {showChip && (
              <th scope="col" className="w-20 px-3 py-2.5 font-medium">
                {board.chipPinLabel}
              </th>
            )}
            <th scope="col" className="px-3 py-2.5 font-medium">
              Name
            </th>
            <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">
              Also called
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Functions
            </th>
            <th scope="col" className="hidden px-3 py-2.5 font-medium lg:table-cell">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((pin) => {
            const meta = signal(pin.primary);
            return (
              <tr
                key={`${pin.side}-${pin.row}-${pin.name}`}
                id={`pin-${pin.number ?? pin.name}`}
                className="print-break-avoid border-b border-line/60 scroll-mt-20 last:border-0 target:bg-accent-soft"
              >
                {showNumber && (
                  <td className="px-3 py-2 align-top font-mono text-sm text-subtle">
                    {pin.number ?? "-"}
                  </td>
                )}
                {showChip && (
                  <td className="px-3 py-2 align-top font-mono text-sm text-subtle">
                    {pin.chipPin ?? "-"}
                  </td>
                )}
                <td className="px-3 py-2 align-top">
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className="sig-dot size-2 shrink-0 rounded-full"
                      style={{ "--sig": meta.color } as React.CSSProperties}
                      aria-hidden="true"
                    />
                    <span
                      className="sig-text font-mono font-medium"
                      style={{ "--sig": meta.color } as React.CSSProperties}
                    >
                      {pin.name}
                    </span>
                  </span>
                  {pin.voltage && (
                    <span className="mt-0.5 block text-sm text-subtle">
                      {pin.voltage}
                    </span>
                  )}
                  {pin.tags && pin.tags.length > 0 && (
                    <span className="mt-1 flex flex-wrap justify-center gap-1">
                      {pin.tags.map((t) => (
                        <SignalBadge key={t} k={t} size="xs" />
                      ))}
                    </span>
                  )}
                </td>
                <td className="hidden px-3 py-2 align-top font-mono text-sm text-muted sm:table-cell">
                  {pin.aliases?.join(", ") ?? "-"}
                </td>
                <td className="px-3 py-2 align-top font-mono text-sm text-muted">
                  {pin.functions && pin.functions.length > 0 ? pin.functions.join(", ") : "-"}
                </td>
                <td className="hidden max-w-xs px-3 py-2 align-top text-sm leading-relaxed text-muted lg:table-cell">
                  {pin.note ?? ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
