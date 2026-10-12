"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex h-9 items-center gap-2 rounded-full border-[1.5px] border-line-strong bg-panel px-3 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
          <path d="M4.5 6V2.5h7V6" />
          <rect x="2" y="6" width="12" height="5" rx="1" />
          <path d="M4.5 9.5h7v4h-7z" />
        </g>
      </svg>
      {label}
    </button>
  );
}
