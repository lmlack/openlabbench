/**
 * Where the site is served from: the root of openlabbench.gwark.dev.
 *
 * Next rewrites its own links and assets with `basePath`, but not paths we
 * write by hand, like the cheat sheet URLs in `data/cheatsheets.json`. Those
 * stay site-root-relative in the data and get the prefix here, at the point
 * of use, so the manifest never has a deploy location baked into it.
 */
export const BASE_PATH = "";

/** The origin the site is published under. Used to resolve metadata URLs. */
export const SITE_ORIGIN = "https://openlabbench.gwark.dev";

/** What the printed cheat sheets show, so a sheet on a bench can be found again. */
export const PUBLIC_URL = `openlabbench.gwark.dev${BASE_PATH}`;

/** Prefixes a site-root-relative path with the base path. */
export const asset = (p: string) => `${BASE_PATH}${p}`;
