"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { search, type SearchDoc, type SearchHit } from "@/lib/search";

const KIND_LABEL: Record<SearchDoc["kind"], string> = {
  board: "Pinout",
  pin: "Pin",
  part: "Part",
};

// Shown when the box is empty, one per kind of thing the index holds.
const EXAMPLES = ["GPIO18", "SDA", "Pico", "74HC595", "555"];

const KIND_COLOR: Record<SearchDoc["kind"], string> = {
  board: "#38bdf8",
  pin: "#22c55e",
  part: "#a855f7",
};

export function SearchPalette({ index }: { index: SearchDoc[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();

  const hits = useMemo(() => search(index, query, 20), [index, query]);

  const openPalette = useCallback(() => {
    setOpen(true);
    setActive(0);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) close();
        else openPalette();
        return;
      }
      // "/" opens search the way it does in most docs sites, unless the user
      // is already typing into something.
      const target = e.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        openPalette();
      }
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openPalette, close]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-i="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(hit: SearchHit) {
    close();
    router.push(hit.href);
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="group flex size-9 items-center justify-center rounded-full border-[1.5px] border-line-strong bg-panel text-sm text-subtle transition-colors hover:border-fg hover:text-fg sm:w-44 sm:justify-between sm:px-3"
      >
        <span className="flex min-w-0 items-center gap-2">
          <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <circle cx="7" cy="7" r="4.5" />
              <path d="M10.4 10.4 14 14" />
            </g>
          </svg>
          <span className="hidden whitespace-nowrap sm:inline">Search</span>
        </span>
        <kbd className="hidden rounded border border-line-strong px-1.5 font-mono text-sm sm:block">
          ⌘K
        </kbd>
      </button>

      {/*
        Portalled to <body> deliberately. The header carries backdrop-blur, and a
        backdrop-filter on an ancestor becomes the containing block for fixed
        children. That pinned this overlay inside the header's own box, so the
        backdrop covered only the header, clicking anywhere else did nothing,
        and Escape was the only way out.
      */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[8vh]">
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-panel"
          >
            <div className="flex items-center gap-3 border-b border-line pl-5 pr-3">
              <svg viewBox="0 0 16 16" className="size-5 shrink-0 text-subtle" aria-hidden="true">
                <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="M10.4 10.4 14 14" />
                </g>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((i) => Math.min(i + 1, hits.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && hits[active]) {
                    e.preventDefault();
                    go(hits[active]);
                  }
                }}
                placeholder="Search pins, boards and parts"
                className="h-16 min-w-0 flex-1 bg-transparent px-1 text-base text-fg outline-none placeholder:text-subtle"
                aria-controls="search-results"
                aria-activedescendant={hits[active] ? `search-hit-${active}` : undefined}
              />
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="flex h-8 shrink-0 items-center rounded-full border border-line-strong px-2.5 text-sm font-medium text-subtle transition-colors hover:border-fg hover:text-fg"
              >
                Esc
              </button>
            </div>

            {query && hits.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">
                Nothing matches <span className="font-mono text-fg">{query}</span>. Missing a board?{" "}
                <Link
                  href="/contribute"
                  onClick={close}
                  className="text-accent underline underline-offset-2"
                >
                  Add it
                </Link>
                .
              </p>
            ) : (
              <ul
                ref={listRef}
                id="search-results"
                role="listbox"
                className="max-h-[52vh] overflow-y-auto p-2 empty:hidden"
              >
                {(query ? hits : []).map((hit, i) => (
                  <li key={`${hit.href}-${hit.title}-${i}`}>
                    <button
                      type="button"
                      id={`search-hit-${i}`}
                      data-i={i}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => go(hit)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        i === active ? "bg-raised" : ""
                      }`}
                    >
                      <span
                        className="w-16 shrink-0 rounded-full border px-2 py-0.5 text-center text-sm font-medium"
                        style={{
                          color: KIND_COLOR[hit.kind],
                          borderColor: `color-mix(in srgb, ${KIND_COLOR[hit.kind]} 40%, transparent)`,
                        }}
                      >
                        {KIND_LABEL[hit.kind]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm text-fg ${hit.kind === "board" ? "" : "font-mono"}`}>{hit.title}</span>
                        <span className="block truncate text-sm text-muted">{hit.subtitle}</span>
                      </span>
                      {hit.badge && (
                        <span className="hidden shrink-0 text-sm text-subtle sm:block">
                          {hit.badge}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!query && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-muted">
                  {index.length.toLocaleString()} pins, boards and parts. Try:
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {EXAMPLES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setQuery(q);
                        inputRef.current?.focus();
                      }}
                      className="rounded-full border-[1.5px] border-line-strong px-3 py-1 font-mono text-sm text-fg transition-colors hover:border-fg"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Keyboard hints only make sense where there is a keyboard. */}
            <div className="hidden items-center justify-center gap-5 border-t border-line px-5 py-2.5 text-sm text-subtle sm:flex">
              <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> to move</span>
              <span><Kbd>↵</Kbd> to open</span>
              <span><Kbd>Esc</Kbd> to close</span>
            </div>
          </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line-strong bg-raised px-1.5 font-sans text-sm text-muted">
      {children}
    </kbd>
  );
}
