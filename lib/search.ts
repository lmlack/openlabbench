/**
 * A small, dependency-free scorer. The index is built on the server and shipped
 * with the page, so searching is instant and works offline.
 */

export type SearchKind = "board" | "pin" | "part";

export interface SearchDoc {
  kind: SearchKind;
  /** What the result row shows. */
  title: string;
  subtitle: string;
  href: string;
  /** Everything matchable, lowercased, highest-signal terms first. */
  terms: string[];
  /** Nudges boards above the hundreds of individual pins. */
  weight: number;
  badge?: string;
}

export interface SearchHit extends SearchDoc {
  score: number;
}

function scoreTerm(term: string, q: string): number {
  if (term === q) return 100;
  if (term.startsWith(q)) return 70 - Math.min(20, term.length - q.length);
  const at = term.indexOf(q);
  if (at > -1) {
    // A match at a word boundary is worth more than one mid-token.
    const boundary = at === 0 || !/[a-z0-9]/.test(term[at - 1]);
    return (boundary ? 45 : 28) - Math.min(12, at);
  }
  return subsequence(term, q);
}

/** Loose subsequence match, so "rpiheader" still finds the Pi header. */
function subsequence(term: string, q: string): number {
  let i = 0;
  let gaps = 0;
  let last = -1;
  for (const ch of q) {
    const at = term.indexOf(ch, i);
    if (at === -1) return 0;
    if (last > -1 && at > last + 1) gaps++;
    last = at;
    i = at + 1;
  }
  return Math.max(0, 18 - gaps * 2);
}

export function search(docs: SearchDoc[], query: string, limit = 24): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  // Multi-word queries must match every word somewhere in the document.
  const words = q.split(/\s+/);

  const hits: SearchHit[] = [];
  for (const doc of docs) {
    let total = 0;
    let matchedAll = true;
    for (const word of words) {
      let best = 0;
      for (let t = 0; t < doc.terms.length; t++) {
        // Terms are ordered by importance; later ones count for less.
        const decay = 1 - Math.min(0.6, t * 0.12);
        best = Math.max(best, scoreTerm(doc.terms[t], word) * decay);
      }
      if (best === 0) {
        matchedAll = false;
        break;
      }
      total += best;
    }
    if (!matchedAll) continue;
    hits.push({ ...doc, score: (total / words.length) * doc.weight });
  }

  return hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, limit);
}
