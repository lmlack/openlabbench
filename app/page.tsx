import Link from "next/link";
import { getBoards, signalCounts } from "@/lib/boards";
import { getParts } from "@/lib/parts";
import { LEGEND_ORDER, signal } from "@/lib/signals";

const FEATURED = [
  "raspberry-pi-40-pin",
  "esp32-devkit-v1",
  "stm32f103-blue-pill",
  "raspberry-pi-pico",
  "arduino-uno-r3",
  "mos-6502",
];

export default function Home() {
  const boards = getBoards();
  const parts = getParts();
  const equivalents = parts.reduce((n, p) => n + p.equivalents.length, 0);
  const featured = FEATURED.map((slug) => boards.find((b) => b.slug === slug)).filter(
    (b): b is NonNullable<typeof b> => Boolean(b),
  );

  return (
    <div>
      {/* Hero */}
      {/* The cover sheet of a technical memorandum: subject line, title, then
          the figures ruled off in a band the way a report states its scope. */}
      <section className="relative overflow-hidden border-b-[3px] border-double border-line-strong">
        <div className="bench-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:px-6 sm:py-16">
          <p className="eyebrow">Technical reference</p>
          <h1 className="mx-auto mt-2 max-w-3xl text-4xl font-normal leading-[1.1] tracking-tight sm:text-4xl">
            open<b className="font-extrabold">lab</b>bench
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-xl font-bold leading-snug text-muted">
            Pinouts, part swaps and cheat sheets you can print.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/pinouts"
              className="inline-flex h-11 items-center rounded-full bg-solid px-5 text-sm font-medium text-solid-fg transition-opacity hover:opacity-90"
            >
              Browse {boards.length} pinouts
            </Link>
            <Link
              href="/cross-reference"
              className="inline-flex h-11 items-center rounded-full border-[1.5px] border-line-strong bg-panel px-5 text-sm font-medium transition-colors hover:border-fg"
            >
              Find a substitute
            </Link>
          </div>

          <dl className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-x-12 gap-y-4 border-y border-line py-4">
            <Stat value={boards.length} label="pinouts" />
            <Stat value={parts.length} label="parts" />
            <Stat value={equivalents} label="substitutions" />
          </dl>
        </div>
      </section>

      {/* What it does */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap justify-center gap-5">
          <Feature
            href="/pinouts"
            title="Interactive pinouts"
            body="Hover a signal and every pin that carries it lights up. Click a pin to see its other names, what it can be used for, and the gotchas that are easy to miss."
            accent={signal("i2c").color}
          />
          <Feature
            href="/cross-reference"
            title="Part swaps"
            body="Out of a part? Find what can replace it. Each swap is rated and tells you what&apos;s different, like a BMP280 having no humidity sensor."
            accent={signal("spi").color}
          />
          <Feature
            href="/cheat-sheets"
            title="Printable cheat sheets"
            body="One sheet per board, made from the same data. They stay sharp at any size and print fine in black and white."
            accent={signal("pwm").color}
          />
        </div>
      </section>

      {/* Signal legend */}
      <section className="border-y border-line bg-panel">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6">
          <h2 className="text-lg font-semibold">The colors mean the same thing everywhere</h2>
          <p className="mx-auto mt-1.5 max-w-xl text-sm text-muted">
            A pin&apos;s color shows its main job. Extra buses get their own tags on top, since a pin can be GPIO and SPI clock at the same time.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {LEGEND_ORDER.map((key) => {
              const meta = signal(key);
              return (
                <span
                  key={key}
                  className="sig-chip flex items-center gap-2 rounded-full border-[1.5px] px-3 py-1.5"
                  style={{ "--sig": meta.color } as React.CSSProperties}
                  title={meta.hint}
                >
                  <span
                    className="sig-dot size-2 rounded-full"
                    style={{ "--sig": meta.color } as React.CSSProperties}
                  />
                  <span
                    className="sig-text text-sm"
                    style={{ "--sig": meta.color } as React.CSSProperties}
                  >
                    {meta.label}
                  </span>
                  <span className="hidden text-sm text-subtle sm:inline">{meta.hint}</span>
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured boards */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Start here</h2>
          <Link href="/pinouts" className="mt-1 inline-block text-sm text-accent hover:underline">
            All pinouts →
          </Link>
        </div>
        <ul className="mt-5 flex flex-wrap justify-center gap-3">
          {featured.map((board) => {
            const counts = signalCounts(board);
            return (
              <li key={board.slug} className="w-full max-w-sm sm:w-[21rem]">
                <Link
                  href={`/pinouts/${board.slug}`}
                  className="group flex h-full flex-col items-center rounded-2xl border border-line bg-panel p-4 text-center transition-colors hover:border-line-strong"
                >
                  <div className="flex items-baseline justify-center gap-2">
                    <h3 className="font-semibold group-hover:text-accent">{board.shortName}</h3>
                    <span className="shrink-0 text-sm text-subtle">{board.logic}</span>
                  </div>
                  <p className="mt-1 text-sm text-subtle">{board.name}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{board.summary}</p>
                  <div className="mt-auto flex flex-wrap justify-center gap-1 pt-3">
                    {LEGEND_ORDER.filter((k) => counts[k]).map((k) => (
                      <span
                        key={k}
                        className="size-1.5 rounded-full"
                        style={{ background: signal(k).color }}
                      />
                    ))}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Contribute */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl border border-line bg-panel p-6 text-center sm:p-8">
          <h2 className="text-lg font-semibold">It&apos;s all plain JSON</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Each pinout is one file in <span className="font-mono text-fg">data/boards/</span>. Add one and the page, search and cheat sheet show up on the next build.
          </p>
          <Link
            href="/contribute"
            className="mt-5 inline-flex h-10 items-center rounded-lg border border-line px-4 text-sm transition-colors hover:border-line-strong"
          >
            See how it works
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="text-center">
        <span className="block text-xl font-semibold tabular-nums">{value}</span>
        <span className="mt-0.5 block text-sm text-subtle">{label}</span>
      </dd>
    </div>
  );
}

function Feature({
  href,
  title,
  body,
  accent,
}: {
  href: string;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group w-full max-w-sm rounded-2xl border border-line bg-panel p-5 text-center transition-colors hover:border-line-strong sm:w-[21rem]"
    >
      <span className="mx-auto block h-1 w-10 rounded-full" style={{ background: accent }} />
      <h3 className="mt-4 font-semibold group-hover:text-accent">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </Link>
  );
}
