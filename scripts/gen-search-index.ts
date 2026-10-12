/**
 * Writes the client search index to public/search-index.json.
 *
 * It used to be built in the root layout and handed to the header, which put
 * one entry per board, per pin and per part into the HTML of every page, and
 * again into the RSC payload beside it. A board page came to 458 KB for a few
 * kilobytes of actual content. The palette fetches this file the first time it
 * opens instead, so a page load pays for nothing it does not use and the index
 * becomes one cacheable download. Run by `npm run data`.
 */
import fs from "node:fs";
import path from "node:path";
import { buildSearchIndex } from "../lib/index-build.ts";

const OUT = path.join(process.cwd(), "public", "search-index.json");
const docs = buildSearchIndex();

// Not pretty printed: this is read by a machine and every byte is shipped.
fs.writeFileSync(OUT, JSON.stringify(docs));

const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`search index: ${docs.length} docs, ${kb} KB to public/search-index.json`);
