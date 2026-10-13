import type { Metadata } from "next";
import Link from "next/link";
import { getBoards } from "@/lib/boards";
import { contributingUrl, editCrossRefUrl, hasRepo, newBoardUrl, repoUrl } from "@/lib/repo";
import { LEGEND_ORDER, PRIMARY_ROLES, SIGNAL_TAGS, signal } from "@/lib/signals";
import { asset } from "@/lib/base-path";

export const metadata: Metadata = {
  title: "Contribute",
  description:
    "How the pinout and cross-reference data is structured, and how to add a board or fix an error.",
  alternates: { canonical: asset("/contribute") },
};

const PIN_EXAMPLE = `{
  "number": 12,
  "name": "GPIO18",
  "primary": "gpio",
  "aliases": ["BCM 18", "PCM_CLK"],
  "tags": ["pwm", "clock"],
  "functions": ["PWM0", "PCM/I2S CLK", "SPI1 CE0"],
  "note": "The pin WS2812 libraries use, because it reaches PWM0 via DMA."
}`;

const BOARD_EXAMPLE = `{
  "slug": "my-board",
  "name": "My Board v1",
  "shortName": "MyBoard",
  "vendor": "Acme",
  "category": "mcu-board",
  "summary": "One or two sentences on what it is and what makes it awkward.",
  "logic": "3.3 V",
  "package": "2x20 2.54 mm",
  "layout": {
    "kind": "board",
    "numbering": "ccw",
    "rows": 20,
    "sideLabels": ["Pins 1-20", "Pins 21-40"]
  },
  "keywords": ["nicknames", "part numbers"],
  "notes": ["Gotchas, one per entry."],
  "docs": [{ "label": "Datasheet", "url": "https://…" }],
  "pins": [ /* … */ ]
}`;

const EQUIV_EXAMPLE = `{
  "part": "IRF540N",
  "confidence": "not-drop-in",
  "notes": "Looks like the same part and is constantly substituted
            for it, but it is NOT logic level: Rds(on) is specified
            at Vgs = 10 V and it barely turns on from a 5 V pin."
}`;

export default function ContributePage() {
  const boards = getBoards();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-center text-xl font-semibold tracking-tight sm:text-4xl">Contribute</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-muted">
        Each pinout is one JSON file, and the whole site is built from those files.
      </p>

      <Section title="Sending a change">
        {hasRepo ? (
          <>
            <p>
              You don&apos;t need to clone anything. GitHub makes a copy for you and opens the file in its editor.
            </p>
            <p className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-medium">
              <a href={newBoardUrl()!} className="text-accent hover:underline">
                Add a pinout
              </a>
              <a href={editCrossRefUrl()!} className="text-accent hover:underline">
                Edit the cross-reference
              </a>
              <a href={repoUrl()!} className="text-accent hover:underline">
                Browse the repo
              </a>
              <a href={contributingUrl()!} className="text-accent hover:underline">
                Contributing guide
              </a>
            </p>
            <p>Every board page also links to its own file at the bottom.</p>
          </>
        ) : (
          /* This fires when NEXT_PUBLIC_REPO is unset at build time, which is a
             build setting, not a statement about any repository. Say that, so a
             self-hosted copy is not told something false about its own repo. */
          <p>
            This build has no repository configured, so the edit links are hidden rather
            than pointing nowhere. Everything below still describes the data exactly.
          </p>
        )}
        <p>
          Every pin needs a source, like a datasheet page or a diagram from the maker. If you can&apos;t point to one, leave it out.
        </p>
      </Section>

      <Section title="Adding a pinout">
        <p>
          Add <Code>data/boards/&lt;slug&gt;.json</Code>. The board page, search, legend and cheat
          sheet all come from it.
        </p>
        <Pre>{BOARD_EXAMPLE}</Pre>
        <p>
          <Code>layout.numbering</Code> places the pins for you:
        </p>
        <ul className="space-y-1.5">
          <li>
            <Code>zigzag</Code>: 2×N headers, odd pins left, even right. Raspberry Pi.
          </li>
          <li>
            <Code>ccw</Code>: the DIP convention, pin 1 top-left, down the left and back up the
            right. DIP chips, Pico.
          </li>
          <li>
            <Code>explicit</Code>: each pin sets its own <Code>side</Code> and <Code>row</Code>.
            Skip a row number to leave a gap, as on the Arduino Uno headers.
          </li>
        </ul>
      </Section>

      <Section title="The pin object" id="schema">
        <Pre>{PIN_EXAMPLE}</Pre>
        <p>
          <Code>primary</Code> is the pin&apos;s electrical role and sets its color.{" "}
          <Code>tags</Code> are the buses it can be muxed onto.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <TokenList title="primary (pick one)" keys={Object.keys(PRIMARY_ROLES)} />
          <TokenList title="tags (any number)" keys={Object.keys(SIGNAL_TAGS)} />
        </div>

        <p>
          Use <Code>note</Code> for gotchas: strapping pins, on-board pull-ups, current limits,
          analog-only pins.
        </p>
      </Section>

      <Section title="Adding a cross-reference">
        <p>
          Append to <Code>data/crossref/parts.json</Code>. Every equivalent needs a{" "}
          <Code>notes</Code> string explaining the difference.
        </p>
        <Pre>{EQUIV_EXAMPLE}</Pre>
        <p>Confidence levels:</p>
        <ul className="space-y-1.5">
          <li>
            <Code>drop-in</Code>: same pinout and behavior, no code change.
          </li>
          <li>
            <Code>caveats</Code>: works, but a voltage, library flag, register or rating changes.
          </li>
          <li>
            <Code>not-drop-in</Code>: same job, different hardware.
          </li>
        </ul>
        <p>
          Set <Code>pinout</Code> to a board slug to link the two pages. Current slugs:{" "}
          {boards.map((b, i) => (
            <span key={b.slug}>
              {i > 0 && ", "}
              <Link href={`/pinouts/${b.slug}`} className="font-mono text-sm text-accent hover:underline">
                {b.slug}
              </Link>
            </span>
          ))}
          .
        </p>
      </Section>

      <Section title="Validation">
        <p>
          <Code>npm run validate</Code> runs before every build and fails it if:
        </p>
        <ul className="space-y-1.5">
          <li>a slug does not match its filename, or is not unique</li>
          <li>a <Code>primary</Code> or <Code>tag</Code> is not a known signal key</li>
          <li>pin numbers have gaps, or two pins share a grid slot</li>
          <li>a <Code>ccw</Code> or <Code>zigzag</Code> layout does not have rows x 2 pins</li>
          <li>a doc link is not https</li>
          <li>a cross-reference <Code>pinout</Code> names a board that does not exist</li>
          <li>an equivalent has no <Code>notes</Code></li>
        </ul>
      </Section>

      <Section title="Accuracy">
        <p>
          The data comes from manufacturer datasheets and diagrams. Clones and revisions can differ, so check your board&apos;s silkscreen before you power it up.
        </p>
      </Section>

      <Section title="Wanted">
        <p>Boards people have asked for that aren&apos;t here yet:</p>
        <ul className="space-y-1.5">
          <li>BBC micro:bit edge connector, 25 strips including the five rings</li>
          <li>Raspberry Pi Compute Module 4, both 100-pin connectors</li>
          <li>Orange Pi 5 and Radxa ROCK 5</li>
          <li>Seeed XIAO family, one footprint across SAMD21, RP2040, ESP32-C3 and nRF52840</li>
          <li>Teensy 4.0 and 4.1</li>
          <li>Arduino Mega 2560, and the Uno R4 which shares the R3 headers</li>
          <li>ESP32-C3 and S3 SuperMini, and the 38-pin ESP32-DevKitC</li>
          <li>OrangeCrab and other ECP5 FPGA boards in the Feather footprint</li>
          <li>MAX7219, HC-SR04, PCA9685, DS3231 and other common breakouts</li>
          <li>6522 VIA and 6551 ACIA, to go with the 6502</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-20">
      <h2 className="text-center text-lg font-semibold">{title}</h2>
      <div className="mt-4 space-y-4 text-center text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-sm text-fg">
      {children}
    </code>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="mx-auto w-fit max-w-full overflow-x-auto rounded-2xl border border-line bg-raised p-4 text-left font-mono text-sm leading-relaxed text-fg">
      {children}
    </pre>
  );
}

function TokenList({ title, keys }: { title: string; keys: string[] }) {
  return (
    <div className="w-full max-w-xs rounded-2xl border border-line bg-panel p-3 text-center sm:w-[17rem]">
      <p className="eyebrow">{title}</p>
      <ul className="mt-2 space-y-1">
        {LEGEND_ORDER.filter((k) => keys.includes(k)).map((k) => {
          const meta = signal(k);
          return (
            <li key={k} className="flex items-center justify-center gap-2 text-sm">
              <span className="size-2 rounded-full" style={{ background: meta.color }} />
              <span className="font-mono text-fg">{k}</span>
              <span className="text-subtle">{meta.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
