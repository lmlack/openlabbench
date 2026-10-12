"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "olb-theme-change";

/**
 * Light is the default. The <html data-theme> attribute is the source of truth,
 * set before first paint by the inline script in layout.tsx, so React reads the
 * DOM rather than owning the state and flashing the wrong palette.
 */
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";
const serverSnapshot = () => false;

function apply(dark: boolean) {
  if (dark) document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
  try {
    if (dark) localStorage.setItem("olb-theme", "dark");
    else localStorage.removeItem("olb-theme");
  } catch {
    // Private browsing: it still applies, it just is not remembered.
  }
  window.dispatchEvent(new Event(EVENT));
}

/**
 * A two-state segmented control rather than a bare icon button. It reads as a
 * control at a glance, shows which mode you are in, and matches the filter
 * segments on the cross-reference page.
 */
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, serverSnapshot);
  const set = useCallback((next: boolean) => () => apply(next), []);

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="flex shrink-0 items-center rounded-full border-[1.5px] border-line-strong bg-panel p-0.5"
    >
      <Segment on={!dark} onClick={set(false)} label="Light">
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="8" r="3.1" />
          <path d="M8 1.2v1.5M8 13.3v1.5M1.2 8h1.5M13.3 8h1.5M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M12.8 3.2l-1.1 1.1M4.3 11.7l-1.1 1.1" />
        </g>
      </Segment>
      <Segment on={dark} onClick={set(true)} label="Dark">
        <path d="M13.3 10.2A5.6 5.6 0 0 1 5.8 2.7 6 6 0 1 0 13.3 10.2Z" fill="currentColor" />
      </Segment>
    </div>
  );
}

function Segment({
  on,
  onClick,
  label,
  children,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      title={`${label} mode`}
      className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm transition-colors ${
        on ? "bg-solid font-semibold text-solid-fg" : "text-muted hover:text-fg"
      }`}
    >
      <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
        {children}
      </svg>
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
