import type { Metadata } from "next";
import { CrossReferenceExplorer } from "@/components/CrossReferenceExplorer";
import { CONFIDENCE_META, CONFIDENCE_ORDER, confidenceStyle } from "@/lib/labels";
import { getParts } from "@/lib/parts";
import { asset } from "@/lib/base-path";

export const metadata: Metadata = {
  title: "Part cross-reference",
  description:
    "Searchable equivalents for microcontrollers, transceivers, sensors, logic and power parts, each with the caveat that actually matters.",
  alternates: { canonical: asset("/cross-reference") },
};

export default function CrossReferencePage() {
  const parts = getParts();
  const total = parts.reduce((n, p) => n + p.equivalents.length, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-xl font-semibold tracking-tight sm:text-4xl">Part cross-reference</h1>
        <p className="mt-3 text-muted">
          {total} alternatives across {parts.length} parts. Every one says <em>why</em> it is or is
          not a straight swap.
        </p>
      </header>

      <dl className="mt-6 flex flex-wrap justify-center gap-2">
        {CONFIDENCE_ORDER.map((c) => (
          <div key={c} className="w-full max-w-xs rounded-2xl border border-line bg-panel p-3 text-center sm:w-[19rem]">
            <dt
              className="sig-text text-sm font-medium"
              style={confidenceStyle(c)}
            >
              {CONFIDENCE_META[c].label}
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">{CONFIDENCE_META[c].blurb}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <CrossReferenceExplorer parts={parts} />
      </div>
    </div>
  );
}
