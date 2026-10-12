import { getBoards } from "./boards.ts";
import { CATEGORY_LABELS, slugifyPart } from "./labels.ts";
import { getParts } from "./parts.ts";
import type { SearchDoc } from "./search";

const lower = (xs: (string | undefined)[]) =>
  xs.filter((x): x is string => Boolean(x)).map((x) => x.toLowerCase());

/**
 * Builds the client search index at build time. Boards, every individual pin,
 * and every cross-reference part, so "SDA", "GPIO18", "pin 12" and "TLC555"
 * all land somewhere useful.
 */
export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const board of getBoards()) {
    docs.push({
      kind: "board",
      title: board.name,
      subtitle: `${CATEGORY_LABELS[board.category]} · ${board.pins.length} pins · ${board.logic}`,
      href: `/pinouts/${board.slug}`,
      badge: board.vendor,
      weight: 1.6,
      terms: lower([
        board.name,
        board.shortName,
        board.slug.replace(/-/g, " "),
        board.vendor,
        ...(board.keywords ?? []),
      ]),
    });

    for (const pin of board.pins) {
      docs.push({
        kind: "pin",
        title: pin.name,
        subtitle: [
          pin.number ? `Pin ${pin.number}` : null,
          board.shortName,
          ...(pin.functions ?? []).slice(0, 2),
        ]
          .filter(Boolean)
          .join(" · "),
        href: `/pinouts/${board.slug}#pin-${pin.number ?? pin.name}`,
        badge: board.shortName,
        weight: 0.75,
        terms: lower([
          pin.name,
          ...(pin.aliases ?? []),
          ...(pin.functions ?? []),
          pin.number ? `pin ${pin.number}` : undefined,
        ]),
      });
    }
  }

  for (const part of getParts()) {
    docs.push({
      kind: "part",
      title: part.part,
      subtitle: part.summary,
      href: `/cross-reference#${slugifyPart(part.part)}`,
      badge: `${part.equivalents.length} alternatives`,
      weight: 1.4,
      terms: lower([
        part.part,
        ...(part.keywords ?? []),
        part.summary,
        ...part.equivalents.map((e) => e.part),
      ]),
    });
  }

  return docs;
}
