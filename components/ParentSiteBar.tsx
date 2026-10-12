import Link from "next/link";
import { GwarkMark } from "./GwarkMark";

/**
 * openlabbench sits under gwark.dev, so the relationship goes above the header
 * where a subsite banner belongs, not buried in the footer.
 */
export function ParentSiteBar() {
  return (
    <div className="no-print border-b border-line bg-raised">
      <Link
        href="https://gwark.dev"
        className="group mx-auto flex max-w-6xl items-center justify-center gap-2.5 px-4 py-2 text-sm sm:px-6"
      >
        <GwarkMark className="size-6 shrink-0" />
        <span className="text-muted">A project of</span>
        <span className="inline-flex items-center gap-1 font-semibold text-fg underline decoration-line-strong decoration-2 underline-offset-4 transition-colors group-hover:decoration-accent">
          gwark.dev
          <svg viewBox="0 0 16 16" className="size-3 shrink-0" aria-hidden="true">
            <path
              d="M5.5 10.5 10.5 5.5M6.5 5.5h4v4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Link>
    </div>
  );
}
