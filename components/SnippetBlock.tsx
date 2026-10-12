import type { Snippet } from "@/lib/types";

/**
 * Bring-up code for a board. Kept to the configuration step, because that is
 * the part the pinout alone does not tell you.
 */
export function SnippetBlock({ snippets }: { snippets: Snippet[] }) {
  return (
    <ul className="mt-3 flex flex-wrap items-start justify-center gap-4">
      {snippets.map((s) => (
        <li
          key={s.title}
          className="print-break-avoid w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-panel"
        >
          <div className="border-b border-line px-4 py-3 text-center">
            <h3 className="text-base font-bold text-fg">{s.title}</h3>
            <p className="mt-0.5 text-sm text-subtle">{s.toolchain}</p>
          </div>
          <pre className="overflow-x-auto bg-raised px-4 py-3 text-left font-mono text-sm leading-relaxed text-fg">
            {s.code}
          </pre>
          <p className="callout-warn border-t px-4 py-3 text-center text-sm leading-snug">
            {s.gotcha}
          </p>
        </li>
      ))}
    </ul>
  );
}
