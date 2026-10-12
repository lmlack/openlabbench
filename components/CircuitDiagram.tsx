import type { Board, Circuit, CircuitSymbol } from "@/lib/types";
import { schematic, type Orient, type SchemWire } from "@/lib/circuit";

/**
 * The minimum circuit, drawn. Every wire, symbol and label comes out of the
 * same validated rows the table below prints, so the two cannot disagree and a
 * bad pin reference fails the build rather than drawing a wrong schematic.
 */
export function CircuitDiagram({
  board,
  circuit,
  label,
  tableRef,
}: {
  board: Board;
  circuit: Circuit;
  label?: string;
  tableRef?: string;
}) {
  const s = schematic(board, circuit);
  if (!s) return null;

  return (
    <figure className="mx-auto mt-4 w-full max-w-4xl">
      <div className="overflow-x-auto rounded-xl border border-line bg-panel p-3">
        {/* Fits the column on a desktop and never stretches past its natural
            size. Below the floor it scrolls instead of shrinking further,
            because a schematic whose labels are 5px tall is just a picture. */}
        <svg
          viewBox={`0 0 ${s.width} ${s.height}`}
          role="img"
          aria-label={`${circuit.title} for the ${board.name}`}
          className="mx-auto block h-auto w-full"
          style={{ maxWidth: s.width, minWidth: Math.min(s.width, 680) }}
        >
          {/* Supply rails first, so taps sit on top of them. */}
          {s.vcc !== undefined && <Rail y={s.vcc} x={s.rail} label="VCC" above />}
          {s.gnd !== undefined && <Rail y={s.gnd} x={s.rail} label="GND" />}

          <rect
            x={s.body.x}
            y={s.body.y}
            width={s.body.w}
            height={s.body.h}
            rx="0"
            fill="var(--raised)"
            stroke="var(--line-strong)"
            strokeWidth="1.6"
          />
          <text
            x={s.body.x + s.body.w / 2}
            y={s.body.y + s.body.h / 2 + 5}
            textAnchor="middle"
            fontSize="15"
            fontWeight="600"
            fill="var(--fg)"
          >
            {s.body.label}
          </text>

          {s.wires.map((w) => (
            <Wire key={w.key} wire={w} />
          ))}

          {s.nodes.map((n) =>
            n.terminal ? (
              <g key={`t-${n.name}`}>
                <rect
                  x={n.x - 25}
                  y={s.body.y + s.body.h / 2 - 13}
                  width="50"
                  height="26"
                  rx="0"
                  fill="var(--panel)"
                  stroke="var(--line-strong)"
                  strokeWidth="1.4"
                  strokeDasharray="4 3"
                />
                <text
                  x={n.x}
                  y={s.body.y + s.body.h / 2 + 4}
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--fg-muted)"
                  className="font-mono"
                >
                  {n.name}
                </text>
              </g>
            ) : (
              <g key={`p-${n.number}`}>
                {/* A column carrying wires on both edges is still one pin, so
                    it gets named on both rather than reading as two. */}
                {(n.above || !n.below) && (
                  <PinLabel x={n.labelX} y={s.body.y - 9} name={n.name} number={n.number} />
                )}
                {n.below && (
                  <PinLabel
                    x={n.labelX}
                    y={s.body.y + s.body.h + 19}
                    name={n.name}
                    number={n.number}
                  />
                )}
              </g>
            ),
          )}
        </svg>
      </div>
      <figcaption className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted">
        {label && <span className="font-semibold text-fg">{label}</span>} {circuit.title},
        drawn from {tableRef ?? "the table below"}.{" "}
        {s.hasOptional && "Dashed parts are optional. "}
        Crossing wires are not connected.
      </figcaption>
    </figure>
  );
}

function PinLabel({
  x,
  y,
  name,
  number,
}: {
  x: number;
  y: number;
  name: string;
  number?: number;
}) {
  return (
    <text x={x} y={y} textAnchor="start" fontSize="13" fill="var(--fg)" className="font-mono">
      {name}
      <tspan fill="var(--fg-subtle)"> {number}</tspan>
    </text>
  );
}

function Rail({
  y,
  x,
  label,
  above,
}: {
  y: number;
  x: [number, number];
  label: string;
  above?: boolean;
}) {
  return (
    <g>
      <line x1={x[0]} y1={y} x2={x[1]} y2={y} stroke="var(--fg)" strokeWidth="1.8" />
      <text
        x={x[0]}
        y={above ? y - 8 : y + 17}
        fontSize="13"
        fill="var(--fg)"
        className="font-mono"
      >
        {label}
      </text>
    </g>
  );
}

function Wire({ wire }: { wire: SchemWire }) {
  return (
    <g>
      <title>{wire.title}</title>
      <polyline
        points={wire.points.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke="var(--fg-muted)"
        strokeWidth="1.4"
        strokeDasharray={wire.dashed ? "5 4" : undefined}
      />
      {wire.dots.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.8" fill="var(--fg-muted)" />
      ))}
      {wire.symbol && (
        <Symbol kind={wire.symbol.kind} x={wire.symbol.x} y={wire.symbol.y} orient={wire.symbol.orient} />
      )}
      {wire.label && (
        <text
          x={wire.label.x}
          y={wire.label.y - (wire.label.lines.length - 1) * 7}
          textAnchor={wire.label.anchor}
          fontSize="13"
          fill="var(--fg)"
          className="font-mono"
        >
          {wire.label.lines.map((line, i) => (
            <tspan key={line} x={wire.label!.x} dy={i === 0 ? 4 : 15}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
}

const ink = { stroke: "var(--fg)", strokeWidth: 1.6, fill: "none" } as const;

/**
 * Symbols are authored running vertically and rotated for horizontal wires.
 * Each one erases the length of wire it covers, so the polyline can be routed
 * without being split around its components.
 */
function Symbol({
  kind,
  x,
  y,
  orient,
}: {
  kind: CircuitSymbol;
  x: number;
  y: number;
  orient: Orient;
}) {
  if (kind === "link") return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${orient === "h" ? 90 : 0})`}>
      {kind === "cap" && (
        <>
          <rect x="-13" y="-5" width="26" height="10" fill="var(--panel)" />
          <path d="M-11 -4h22M-11 4h22" {...ink} strokeLinecap="round" />
        </>
      )}
      {kind === "res" && (
        <rect x="-7" y="-17" width="14" height="34" {...ink} fill="var(--panel)" />
      )}
      {kind === "xtal" && (
        <>
          <rect x="-10" y="-8" width="20" height="16" fill="var(--panel)" />
          <path d="M-10 -7h20M-10 7h20" {...ink} strokeLinecap="round" />
          <rect x="-6" y="-4.5" width="12" height="9" {...ink} fill="var(--panel)" />
        </>
      )}
      {kind === "cell" && (
        <>
          <rect x="-11" y="-11" width="22" height="22" fill="var(--panel)" />
          <path d="M-10 -9h20M-5.5 -3h11M-10 3h20M-5.5 9h11" {...ink} strokeLinecap="round" />
        </>
      )}
      {kind === "osc" && (
        <>
          <rect x="-19" y="-15" width="38" height="30" rx="0" {...ink} fill="var(--panel)" />
          <g transform={orient === "h" ? "rotate(-90)" : undefined}>
            <path d="M-11 3v-6h5.5v6h5.5v-6H11" {...ink} strokeWidth="1.3" fill="none" />
          </g>
        </>
      )}
      {kind === "load" && (
        <>
          <rect x="-10" y="-18" width="20" height="36" fill="var(--panel)" />
          <path
            d="M0 -18a6 6 0 0 1 0 12a6 6 0 0 1 0 12a6 6 0 0 1 0 12"
            {...ink}
            transform="translate(-0.5 0)"
          />
        </>
      )}
    </g>
  );
}
