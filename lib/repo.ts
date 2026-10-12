/**
 * Where contributions actually go.
 *
 * This defaults to the project's own public repository, so the edit links are
 * on in dev and in any build without remembering an environment variable. A
 * fork overrides it with NEXT_PUBLIC_REPO, and setting it to an empty string
 * turns every "edit this" link off rather than offering a dead end.
 *
 * It used to default to empty, from when there was no repository to point at.
 * That meant a build made without the variable quietly shipped a site with no
 * way to contribute to it, which is a bad failure to have as the default.
 */
export const REPO = process.env.NEXT_PUBLIC_REPO ?? "lmlack/openlabbench";

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

/** The contributing guide, which is where the accuracy rule actually lives. */
export function contributingUrl(): string | null {
  return hasRepo ? `${base()}/blob/${BRANCH}/CONTRIBUTING.md` : null;
}
