import Link from "next/link";
import { GwarkMark } from "./GwarkMark";

export function SiteFooter({ boards, parts }: { boards: number; parts: number }) {
  return (
    <footer className="no-print mt-20 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-center sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-mono text-sm font-semibold">
            open<span className="text-accent">lab</span>bench
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Pinouts, part equivalents and printable cheat sheets. Every pin is a line of JSON in
            the repo.
          </p>
          <a
            href="https://gwark.dev"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] border-line-strong px-4 text-sm font-semibold transition-colors hover:border-fg"
          >
            <GwarkMark className="size-5 shrink-0" />
            More at gwark.dev
            <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden="true">
              <path
                d="M5.5 10.5 10.5 5.5M6.5 5.5h4v4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
        <div>
          <p className="eyebrow">Browse</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/pinouts" className="text-muted hover:text-fg">
                {boards} pinouts
              </Link>
            </li>
            <li>
              <Link href="/cross-reference" className="text-muted hover:text-fg">
                {parts} parts cross-referenced
              </Link>
            </li>
            <li>
              <Link href="/cheat-sheets" className="text-muted hover:text-fg">
                Printable cheat sheets
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">About</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/contribute" className="text-muted hover:text-fg">
                Add or fix data
              </Link>
            </li>
            <li>
              <Link href="/contribute#schema" className="text-muted hover:text-fg">
                Data schema
              </Link>
            </li>
            <li>
              <a href="https://gwark.dev" className="text-muted hover:text-fg">
                gwark.dev
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-6xl border-t border-line px-4 py-5 sm:px-6">
        <p className="mx-auto max-w-2xl text-center text-sm text-subtle">
          Compiled from manufacturer datasheets. Check your own board&apos;s silkscreen before you
          apply power. Revisions and clones differ.
        </p>
      </div>
    </footer>
  );
}
