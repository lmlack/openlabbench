import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { BASE_PATH, SITE_ORIGIN } from "@/lib/base-path";
import { getBoards } from "@/lib/boards";

/**
 * Every page this site has, for crawlers.
 *
 * The site is served from the root of openlabbench.gwark.dev, so this file
 * lands at /sitemap.xml, next to the robots.txt that points to it.
 *
 * lastModified comes from the mtime of the board's JSON file: the pin data is
 * the page. It is honest on a machine where the files were actually edited and
 * meaningless on a fresh clone, where every file is checkout time, so if this
 * ever builds in CI the dates should come from git rather than the filesystem.
 */
// Reading the data files off disk makes this route look dynamic to the
// builder, and `output: export` refuses to guess. It is static: the files
// cannot change between the build and the request, because there is no server.
export const dynamic = "force-static";

const url = (p: string) => `${SITE_ORIGIN}${BASE_PATH}${p}`;

const BOARD_DIR = path.join(process.cwd(), "data", "boards");

function editedAt(slug: string): Date | undefined {
  try {
    return fs.statSync(path.join(BOARD_DIR, `${slug}.json`)).mtime;
  } catch {
    return undefined;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const boards = getBoards();

  // The newest board edit stands in for the pages that list them.
  const newest = boards
    .map((b) => editedAt(b.slug))
    .filter((d): d is Date => d instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return [
    { url: url("/"), lastModified: newest, changeFrequency: "weekly", priority: 1 },
    { url: url("/pinouts/"), lastModified: newest, changeFrequency: "weekly", priority: 0.9 },
    { url: url("/cross-reference/"), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/cheat-sheets/"), lastModified: newest, changeFrequency: "weekly", priority: 0.7 },
    { url: url("/contribute/"), changeFrequency: "yearly", priority: 0.3 },
    // The board pages are what people arrive on, so they rank above the
    // indexes that merely link to them.
    ...boards.map((b) => ({
      url: url(`/pinouts/${b.slug}/`),
      lastModified: editedAt(b.slug),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
