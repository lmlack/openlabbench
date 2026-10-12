import { endpointLabel } from "@/lib/circuit";
import type { Board, Circuit } from "@/lib/types";

/**
 * The minimum circuit, as rows. The endpoints are the same machine-readable
 * ones the schematic is drawn from, printed with each pin's real name.
 */
export function CircuitTable({
  board,
  circuit,
  label,
}: {
  board: Board;
  circuit: Circuit;
  label?: string;
}) {
  return (
    <div className="mx-auto mt-6 w-full max-w-3xl">
      {/* Rules above, under the head and at the foot, and none between the
          rows or columns. A report sets a table the way a typesetter does. */}
      <table className="w-full border-collapse border-y-[1.5px] border-line-strong text-center text-sm">
        <caption className="caption-top pb-2 text-center text-sm">
          {label && <span className="font-semibold text-fg">{label}</span>}{" "}
          <span className="text-muted">External parts, and why each one is there.</span>
        </caption>
        <thead>
          <tr className="border-b border-line-strong text-xs uppercase tracking-wider text-subtle">
            <th scope="col" className="px-3 py-2.5 font-medium">
              Part
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Between
            </th>
            <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">
              Why
            </th>
          </tr>
        </thead>
        <tbody>
          {circuit.parts.map((c) => (
            <tr key={`${c.part}-${c.from}-${c.to}`}>
              <td className="px-3 py-2 align-top">
                <span className="font-mono font-medium text-fg">{c.part}</span>
                {!c.required && (
                  <span className="mt-0.5 block text-xs text-subtle">optional</span>
                )}
              </td>
              {/* Breaks between the two endpoints on a narrow screen, never
                  inside one: "DISCH (7)" split over two lines is unreadable. */}
              <td className="px-3 py-2 align-top font-mono text-xs text-muted">
                <span className="whitespace-nowrap">{endpointLabel(board, c.from)}</span>{" "}
                <span className="text-subtle">to</span>{" "}
                <span className="whitespace-nowrap">{endpointLabel(board, c.to)}</span>
              </td>
              <td className="hidden px-3 py-2 align-top text-xs leading-snug text-muted sm:table-cell">
                {c.why}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {circuit.note && (
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-snug text-muted">
          {circuit.note}
        </p>
      )}
    </div>
  );
}
