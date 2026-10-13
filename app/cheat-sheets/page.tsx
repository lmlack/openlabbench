import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";
import { getBoards } from "@/lib/boards";
import { getCheatSheets } from "@/lib/cheatsheets";
import { asset } from "@/lib/base-path";

export const metadata: Metadata = {
  title: "Cheat sheets",
  description:
    "Printable vector cheat sheets for every pinout in the database. Plain SVG, sharp at any size.",
  alternates: { canonical: asset("/cheat-sheets") },
};

export default function CheatSheetsPage() {
  const sheets = getCheatSheets();
  const boards = getBoards();
  const rows = sheets
    .map((sheet) => ({ sheet, board: boards.find((b) => b.slug === sheet.slug) }))
    .filter((r) => r.board);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-col items-center gap-5 text-center">
        <div className="max-w-2xl">
          <h1 className="text-xl font-semibold tracking-tight sm:text-4xl">Cheat sheets</h1>
          <p className="mt-3 text-muted">
            One printable sheet per pinout, made from the same data the site uses. They&apos;re plain SVG, so you can tape one above your bench or blow it up to poster size.
          </p>
        </div>
        <PrintButton label="Print all" />
      </header>

      <p className="mt-4 text-center text-sm text-subtle">
        {sheets.length} sheets · all vector, so they stay sharp
      </p>

      <ul className="mt-8 space-y-8">
        {rows.map(({ sheet, board }) => (
          <li
            key={sheet.slug}
            className="print-break-avoid overflow-hidden rounded-2xl border border-line bg-panel"
          >
            <div className="no-print flex flex-col items-center gap-3 border-b border-line px-4 py-4 text-center">
              <div>
                <h2 className="font-medium">{board!.name}</h2>
                <p className="text-sm text-subtle">
                  {sheet.width}×{sheet.height} · {(sheet.bytes / 1024).toFixed(1)} KB SVG
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/pinouts/${sheet.slug}`}
                  className="inline-flex h-9 items-center rounded-full border-[1.5px] border-line-strong px-3 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
                >
                  Interactive
                </Link>
                <a
                  href={asset(sheet.file)}
                  download={`${sheet.slug}-cheatsheet.svg`}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-solid px-3 text-sm font-medium text-solid-fg transition-opacity hover:opacity-90"
                >
                  Download SVG
                </a>
              </div>
            </div>
            <div className="bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset(sheet.file)}
                alt={`${board!.name} pinout cheat sheet`}
                width={sheet.width}
                height={sheet.height}
                loading="lazy"
                className="h-auto w-full"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
