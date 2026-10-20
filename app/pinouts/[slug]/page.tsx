import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PinoutExplorer } from "@/components/PinoutExplorer";
import { PinTable } from "@/components/PinTable";
import { CircuitTable } from "@/components/CircuitTable";
import { CircuitDiagram } from "@/components/CircuitDiagram";
import { SnippetBlock } from "@/components/SnippetBlock";
import { PrintButton } from "@/components/PrintButton";
import { getBoard, getBoards, pinGrid, placePins, signalCounts } from "@/lib/boards";
import { getCheatSheet } from "@/lib/cheatsheets";
import { asset } from "@/lib/base-path";
import { CATEGORY_LABELS } from "@/lib/labels";
import { getParts } from "@/lib/parts";
import { editBoardUrl, issueUrl } from "@/lib/repo";
import { slugifyPart } from "@/lib/labels";

export function generateStaticParams() {
  return getBoards().map((board) => ({ slug: board.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/pinouts/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const board = getBoard(slug);
  if (!board) return {};
  return {
    title: `${board.name} pinout`,
    description: `${board.summary} Interactive diagram, full pin table and a printable cheat sheet.`,
    alternates: { canonical: asset(`/pinouts/${board.slug}`) },
    openGraph: {
      title: `${board.name} pinout`,
      description: board.summary,
      // The site card, not the board's own cheat sheet: that one is an SVG,
      // and no social scraper renders SVG. Named explicitly because Next
      // replaces the parent openGraph object here rather than merging into
      // it, so leaving images out means no image at all.
      images: [{ url: asset("/og.png"), width: 1200, height: 630, alt: "openlabbench: hardware pinouts, part swaps and printable cheat sheets." }],
    },
  };
}

const jumpLink =
  "inline-flex items-center gap-1.5 border-b border-transparent text-fg transition-colors hover:border-accent hover:text-accent";

const SECTION_TITLES: Record<string, string> = {
  diagram: "Pinout diagram",
  "watch-out": "Caution",
  circuit: "Minimum circuit",
  "bring-up": "Register configuration",
  "pin-table": "Full pin reference",
};

/** Fig. 1, Fig. 2, ... numbered in the order the page prints them. */
function figureLabel(n: number) {
  return `Fig. ${n}.`;
}

export default async function BoardPage({ params }: PageProps<"/pinouts/[slug]">) {
  const { slug } = await params;
  const board = getBoard(slug);
  if (!board) notFound();

  // Section and figure numbers are positions in the document, so they are
  // derived from which sections this board actually has rather than hardcoded.
  const sections = [
    "diagram",
    board.notes?.length ? "watch-out" : "",
    board.circuit ? "circuit" : "",
    board.snippets?.length ? "bring-up" : "",
    "pin-table",
  ].filter(Boolean);
  const sectionNo = (id: string) => sections.indexOf(id) + 1;
  const sectionTitle = (id: string) =>
    id === "circuit" && board.circuit ? board.circuit.title : SECTION_TITLES[id];
  const figures = ["diagram", board.circuit ? "circuit" : ""].filter(Boolean);
  const figureNo = (id: string) => figures.indexOf(id) + 1;
  const tables = [board.circuit ? "circuit" : "", "pin-table"].filter(Boolean);
  const tableNo = (id: string) => tables.indexOf(id) + 1;

  const grid = pinGrid(board);
  const placed = placePins(board);
  const counts = signalCounts(board);
  const sheet = getCheatSheet(board.slug);
  // Parts whose cross-reference entry points back at this pinout.
  const related = getParts().filter((p) => p.pinout === board.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <nav className="no-print mb-6 text-center text-sm">
        <Link href="/pinouts" className="text-muted hover:text-fg">
          All pinouts
        </Link>
      </nav>

      <header className="flex flex-col items-center gap-6 text-center">
        <div className="max-w-2xl">
          <p className="eyebrow">
            {board.vendor} · {CATEGORY_LABELS[board.category]}
          </p>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight sm:text-4xl">
            {board.name}
          </h1>
          <p className="mt-3 text-muted">{board.summary}</p>
        </div>

        <div className="no-print flex flex-wrap justify-center gap-2">
          {sheet && (
            <a
              href={asset(sheet.file)}
              download={`${board.slug}-cheatsheet.svg`}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-solid px-3 text-sm font-medium text-solid-fg transition-opacity hover:opacity-90"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
                <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M8 2v8M4.5 7 8 10.5 11.5 7M2.5 13h11" />
                </g>
              </svg>
              Cheat sheet (SVG)
            </a>
          )}
          <PrintButton label="Print this page" />
        </div>

        {/* A contents line, the way a report lists its sections. The numbers
            are the same ones printed on the headings below. */}
        <nav
          aria-label="Contents"
          className="no-print w-full max-w-3xl border-y border-line py-2.5"
        >
          <p className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm">
            <span className="eyebrow">Contents</span>
            {sections.map((id) => (
              <a key={id} href={`#${id}`} className={jumpLink}>
                <span className="font-mono text-subtle">{sectionNo(id)}.</span>
                {sectionTitle(id)}
                {id === "watch-out" && (
                  <span className="text-subtle">({board.notes?.length})</span>
                )}
              </a>
            ))}
          </p>
        </nav>
      </header>

      <dl className="mt-6 grid gap-px border-y border-line bg-line sm:grid-cols-2">
        <Spec label="Logic level" value={board.logic} emphasis />
        <Spec label="Package" value={board.package} />
      </dl>

      <section id="diagram" className="mt-10 scroll-mt-20">
        <SectionHead n={sectionNo("diagram")} title="Pinout diagram" />
        <PinoutExplorer board={board} grid={grid} counts={counts} />
        <Caption label={figureLabel(figureNo("diagram"))}>
          {board.name}, {board.package.split(" / ")[0]}. Hover or tap a signal to light
          up every pin that carries it.
        </Caption>
      </section>

      {board.notes && board.notes.length > 0 && (
        <section id="watch-out" className="mt-12 scroll-mt-20">
          <SectionHead n={sectionNo("watch-out")} title="Caution" />
          <ul className="mt-4 flex flex-wrap justify-center gap-2.5">
            {board.notes.map((note) => {
              const unchecked = note.match(/^Needs checking:\s*/);
              return (
                <li
                  key={note}
                  className={`print-break-avoid w-full max-w-xl border px-4 py-3 text-center text-sm leading-snug lg:w-[27rem] ${
                    unchecked ? "callout-warn" : "border-line bg-panel text-muted"
                  }`}
                >
                  {unchecked ? (
                    <>
                      <strong className="font-semibold">Needs checking:</strong>{" "}
                      {note.slice(unchecked[0].length)}
                    </>
                  ) : (
                    note
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {board.circuit && (
        <section id="circuit" className="mt-12 scroll-mt-20">
          <SectionHead
            n={sectionNo("circuit")}
            title={board.circuit.title}
            sub="What has to go around the chip before it will run."
          />
          <CircuitDiagram
            board={board}
            circuit={board.circuit}
            label={figureLabel(figureNo("circuit"))}
            tableRef={`Table ${tableNo("circuit")}`}
          />
          <CircuitTable
            board={board}
            circuit={board.circuit}
            label={`Table ${tableNo("circuit")}.`}
          />
        </section>
      )}

      {board.snippets && board.snippets.length > 0 && (
        <section id="bring-up" className="mt-12 scroll-mt-20">
          <SectionHead
            n={sectionNo("bring-up")}
            title="Register configuration"
            sub="Code that sets up the pins shown on the diagram."
          />
          <SnippetBlock snippets={board.snippets} />
        </section>
      )}

      <section id="pin-table" className="mt-12 scroll-mt-20">
        <SectionHead
          n={sectionNo("pin-table")}
          title="Full pin reference"
          sub="Every pin, alias and mapping. This table is included when you print the page."
        />
        <p className="mb-2 mt-4 text-center text-sm">
          <span className="font-semibold">Table {tableNo("pin-table")}.</span>{" "}
          <span className="text-muted">Pin assignments.</span>
        </p>
        <PinTable board={board} pins={placed} />
      </section>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {related.length > 0 && (
          <section className="w-full max-w-md border border-line bg-panel p-4">
            <h2 className="text-center text-base font-semibold">Looking for a substitute?</h2>
            <ul className="mt-3 space-y-2 text-center">
              {related.map((part) => (
                <li key={part.part}>
                  <Link
                    href={`/cross-reference#${slugifyPart(part.part)}`}
                    className="text-sm text-accent hover:underline"
                  >
                    {part.part}, {part.equivalents.length} alternatives
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {board.docs && board.docs.length > 0 && (
          <section className="w-full max-w-md border border-line bg-panel p-4">
            <h2 className="text-center text-base font-semibold">Primary sources</h2>
            <ul className="mt-3 space-y-2 text-center">
              {board.docs.map((doc) => (
                <li key={doc.url}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm text-accent hover:underline"
                  >
                    {doc.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <FixThis board={board.slug} name={board.name} />
    </div>
  );
}

/** A numbered section heading, the way a report rules off a part. */
function SectionHead({ n, title, sub }: { n: number; title: string; sub?: string }) {
  return (
    <div className="mb-4 text-center">
      <h2 className="text-lg font-bold">
        <span className="mr-2 font-mono text-sm font-normal text-subtle">{n}.</span>
        {title}
      </h2>
      {sub && <p className="mx-auto mt-1 max-w-xl text-sm text-muted">{sub}</p>}
    </div>
  );
}

/** Fig. n. Caption, set under the figure it belongs to. */
function Caption({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted">
      <span className="font-semibold text-fg">{label}</span> {children}
    </p>
  );
}

function Spec({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="bg-panel px-4 py-3 text-center">
      <dt className="eyebrow">{label}</dt>
      <dd
        className={`mt-0.5 text-base ${emphasis ? "font-semibold text-fg" : "text-fg"}`}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * The contribution loop, such as it is. With a repo configured these are real
 * one-click links: GitHub forks the repo for a stranger and opens its web
 * editor on the exact file. Without one there is nowhere to send a fix, so the
 * page says so plainly instead of linking into a void.
 */
function FixThis({ board, name }: { board: string; name: string }) {
  const edit = editBoardUrl(board);
  const issue = issueUrl(
    `Pin data: ${name}`,
    `Which pin is wrong, and what should it be?\n\nSource (datasheet page or vendor diagram):\n`,
  );

  return (
    <section className="no-print mt-10 text-center text-sm text-subtle">
      <p>
        To fix a wrong pin, edit{" "}
        <span className="font-mono">data/boards/{board}.json</span>.
      </p>
      {edit && issue ? (
        <p className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <a href={edit} className="text-accent hover:underline">
            Edit this file on GitHub
          </a>
          <a href={issue} className="text-accent hover:underline">
            Open an issue
          </a>
        </p>
      ) : (
        <p className="mt-2">
          <Link href="/contribute" className="text-accent hover:underline">
            How the data works
          </Link>
        </p>
      )}
    </section>
  );
}
