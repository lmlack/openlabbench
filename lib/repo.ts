/**
 * Where contributions actually go.
 *
 * Until this points at a real repository, /contribute can describe the data
 * format but there is nowhere to send a fix, so the site hides every "edit
 * this" link rather than offering a dead end. Set REPO to "owner/name" once
 * the repo exists and the links appear everywhere at once: a per-board edit
 * link, a new-file link for a new pinout, and an issue link for a wrong pin.
 */
export const REPO = process.env.NEXT_PUBLIC_REPO ?? "";

export const BRANCH = process.env.NEXT_PUBLIC_REPO_BRANCH ?? "main";

export const hasRepo = REPO.length > 0;

const base = () => `https://github.com/${REPO}`;

/** Opens GitHub's web editor on one board's JSON, which forks for a stranger. */
export function editBoardUrl(slug: string): string | null {
  return hasRepo ? `${base()}/edit/${BRANCH}/data/boards/${slug}.json` : null;
}

export function editCrossRefUrl(): string | null {
  return hasRepo ? `${base()}/edit/${BRANCH}/data/crossref/parts.json` : null;
}

/** Prefilled new-file form, so adding a pinout does not need a local clone. */
export function newBoardUrl(): string | null {
  return hasRepo ? `${base()}/new/${BRANCH}/data/boards` : null;
}

export function issueUrl(title: string, body: string): string | null {
  if (!hasRepo) return null;
  const q = new URLSearchParams({ title, body });
  return `${base()}/issues/new?${q.toString()}`;
}

export function repoUrl(): string | null {
  return hasRepo ? base() : null;
}
