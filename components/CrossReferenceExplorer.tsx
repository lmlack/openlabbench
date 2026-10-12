"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CONFIDENCE_META,
  CONFIDENCE_ORDER,
  confidenceStyle,
  PART_CATEGORY_LABELS,
  slugifyPart,
} from "@/lib/labels";
import type { Confidence, Part, PartCategory } from "@/lib/types";

const haystack = (part: Part) =>
  [
    part.part,
    part.summary,
    ...(part.keywords ?? []),
    ...Object.values(part.specs),
    ...part.equivalents.flatMap((e) => [e.part, e.notes]),
  ]
    .join(" ")
    .toLowerCase();

export function CrossReferenceExplorer({ parts }: { parts: Part[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PartCategory | "all">("all");
  const [confidence, setConfidence] = useState<Confidence | "all">("all");

  const indexed = useMemo(
    () => parts.map((part) => ({ part, text: haystack(part) })),
    [parts],
  );

  const categories = useMemo(() => {
    const seen = new Map<PartCategory, number>();
    for (const p of parts) seen.set(p.category, (seen.get(p.category) ?? 0) + 1);
    return [...seen.entries()].sort((a, b) =>
      PART_CATEGORY_LABELS[a[0]].localeCompare(PART_CATEGORY_LABELS[b[0]]),
    );
  }, [parts]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const words = q ? q.split(/\s+/) : [];
    return indexed
      .filter(({ part, text }) => {
        if (category !== "all" && part.category !== category) return false;
        if (confidence !== "all" && !part.equivalents.some((e) => e.confidence === confidence))
          return false;
        return words.every((w) => text.includes(w));
      })
      .map(({ part }) => part);
  }, [indexed, query, category, confidence]);

  // A deep link from search lands on a part; make sure no filter is hiding it.
  useEffect(() => {
    if (!window.location.hash) return;
    const el = document.getElementById(window.location.hash.slice(1));
    el?.scrollIntoView({ block: "start" });
  }, []);

  const shownEquivalents = results.reduce(
    (n, p) =>
      n +
      (confidence === "all"
        ? p.equivalents.length
        : p.equivalents.filter((e) => e.confidence === confidence).length),
    0,
  );

  return (
    <div>
      <div className="no-print sticky top-14 z-20 -mx-4 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <svg
              viewBox="0 0 16 16"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
              aria-hidden="true"
            >
              <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.4 10.4 14 14" />
              </g>
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Part number or function"
              aria-label="Search parts"
              className="h-10 w-full rounded-lg border border-line bg-panel pl-9 pr-3 text-sm outline-none placeholder:text-subtle focus:border-accent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* The native arrow ignores padding and sat flush on the right
                edge, so it is drawn here instead. */}
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PartCategory | "all")}
                aria-label="Filter by category"
                className="h-10 appearance-none rounded-lg border border-line bg-panel pl-3 pr-9 text-sm text-muted outline-none focus:border-accent"
              >
                <option value="all">All categories</option>
                {categories.map(([cat, n]) => (
                  <option key={cat} value={cat}>
                    {PART_CATEGORY_LABELS[cat]} ({n})
                  </option>
                ))}
              </select>
              <svg
                viewBox="0 0 16 16"
                className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-subtle"
                aria-hidden="true"
              >
                <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="flex rounded-lg border border-line bg-panel p-0.5">
              {(["all", ...CONFIDENCE_ORDER] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setConfidence(c)}
                  className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    confidence === c ? "bg-raised" : "text-subtle hover:text-muted"
                  } ${confidence === c && c !== "all" ? "sig-text" : ""} ${
                    confidence === c && c === "all" ? "text-fg" : ""
                  }`}
                  style={
                    c !== "all"
                      ? confidenceStyle(c)
                      : undefined
                  }
                >
                  {c === "all" ? "Any" : CONFIDENCE_META[c].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-2 text-center text-sm text-subtle">
          {results.length} part{results.length === 1 ? "" : "s"} · {shownEquivalents} alternatives
        </p>
      </div>

      {results.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-muted">
            No match for <span className="font-mono text-fg">{query}</span>.
          </p>
          <Link href="/contribute" className="mt-2 inline-block text-sm text-accent hover:underline">
            Add this part to the database
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {results.map((part) => (
            <PartCard key={part.part} part={part} filter={confidence} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PartCard({ part, filter }: { part: Part; filter: Confidence | "all" }) {
  const equivalents =
    filter === "all" ? part.equivalents : part.equivalents.filter((e) => e.confidence === filter);

  return (
    <li
      id={slugifyPart(part.part)}
      className="print-break-avoid scroll-mt-32 overflow-hidden rounded-2xl border border-line bg-panel target:border-accent"
    >
      <div className="border-b border-line p-4 text-center">
        <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
          <h2 className="font-mono text-lg font-semibold">{part.part}</h2>
          <span className="eyebrow">
            {PART_CATEGORY_LABELS[part.category]}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">{part.summary}</p>

        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {Object.entries(part.specs).map(([k, v]) => (
            <span
              key={k}
              className="rounded border border-line bg-raised px-2 py-1 text-sm text-muted"
            >
              <span className="text-subtle">{k}</span> {v}
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-3 text-sm">
          {part.pinout && (
            <Link href={`/pinouts/${part.pinout}`} className="text-accent hover:underline">
              View pinout →
            </Link>
          )}
          <a
            href={`https://octopart.com/search?q=${encodeURIComponent(part.part)}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-subtle hover:text-muted"
          >
            Stock & pricing ↗
          </a>
        </div>
      </div>

      <ul className="divide-y divide-line">
        {equivalents.map((eq) => {
          const meta = CONFIDENCE_META[eq.confidence];
          return (
            <li key={eq.part} className="p-4 text-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
                  <span className="font-mono text-sm font-medium">{eq.part}</span>
                  <span
                    className="sig-chip sig-text rounded border px-1.5 py-0.5 text-sm"
                    style={confidenceStyle(eq.confidence)}
                    title={meta.blurb}
                  >
                    {meta.label}
                  </span>
                </div>
                <p className="mx-auto mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                  {eq.notes}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </li>
  );
}
