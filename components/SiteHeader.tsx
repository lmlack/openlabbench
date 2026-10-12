"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { SearchDoc } from "@/lib/search";
import { SearchPalette } from "./SearchPalette";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/pinouts", label: "Pinouts" },
  { href: "/cross-reference", label: "Cross-reference" },
  { href: "/cheat-sheets", label: "Cheat sheets" },
  { href: "/contribute", label: "Contribute" },
];

export function SiteHeader({ index }: { index: SearchDoc[] }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);

  return (
    /* A thick-thin rule under the masthead, the way a report rules off its
       running head. No backdrop blur: it buys nothing on an opaque bar and a
       backdrop-filter makes the header the containing block for fixed children. */
    <header className="no-print sticky top-0 z-40 border-b-[3px] border-double border-line-strong bg-bg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex flex-1 items-center gap-2.5"
          onClick={() => setMenu(false)}
        >
          <Logo />
          <span className="hidden text-sm font-semibold uppercase tracking-[0.18em] min-[360px]:inline">
            open<span className="text-accent">lab</span>bench
          </span>
        </Link>

        <nav className="hidden shrink-0 items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const on = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 px-2.5 py-1 text-sm transition-colors ${
                  on ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchPalette index={index} />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-label="Menu"
            className="flex size-9 items-center justify-center border border-line-strong text-muted lg:hidden"
          >
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
              <path
                d={menu ? "M3.5 3.5l9 9M12.5 3.5l-9 9" : "M2 4.5h12M2 8h12M2 11.5h12"}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {menu && (
        <nav className="border-t border-line px-4 pb-3 text-center lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenu(false)}
              className="block py-2.5 text-sm text-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 text-accent" aria-hidden="true">
      <rect
        x="5.5"
        y="3.5"
        width="13"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <g fill="currentColor">
        <circle cx="3.2" cy="7" r="1.1" />
        <circle cx="3.2" cy="12" r="1.1" />
        <circle cx="3.2" cy="17" r="1.1" />
        <circle cx="20.8" cy="7" r="1.1" />
        <circle cx="20.8" cy="12" r="1.1" />
        <circle cx="20.8" cy="17" r="1.1" />
      </g>
      <path
        d="M9 9h6M9 12h6M9 15h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
