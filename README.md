# openlabbench

Pinouts, part equivalents, printable cheat sheets.

A static Next.js site. No database and no CMS: every pinout is one JSON file, and
the pages, the search index and the printable SVGs all come from it at build time.

Live at **<https://gwark.dev/openlabbench>**. To fix a pin or add a board, see
[CONTRIBUTING.md](CONTRIBUTING.md); the short version is that every pin has to
come from a datasheet or a vendor diagram, and you can edit a board's JSON from
the site without cloning anything.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export into out/
```

`npm run build` runs `prebuild` first, which validates `data/` and regenerates the
cheat sheets. Bad data fails the build rather than rendering a wrong pinout.

| script              | does                                                      |
| ------------------- | --------------------------------------------------------- |
| `npm run dev`       | validate, generate cheat sheets, start the dev server       |
| `npm run build`     | the above, then a static export to `out/`                   |
| `npm run data`      | validate and regenerate `public/cheatsheets/*.svg`          |
| `npm run validate`  | schema and sanity checks on `data/` only                    |
| `npm run lint`      | eslint                                                      |
| `npm run typecheck` | tsc --noEmit                                                |

`out/` is a directory of plain HTML. Host it anywhere.

## Pointing it at a repository

Contribution links point at `lmlack/openlabbench` by default, so they work in
dev and in any build with nothing to remember. Point them somewhere else, or
switch them off, with:

```bash
NEXT_PUBLIC_REPO=owner/name npm run build      # NEXT_PUBLIC_REPO_BRANCH defaults to main
NEXT_PUBLIC_REPO= npm run build                # empty: hide the links entirely
```

Every board page carries an "Edit this file on GitHub" link aimed at that
board's JSON, and `/contribute` offers one-click add and edit forms. GitHub
forks the repo for a stranger and opens its web editor, so a drive-by pin
correction needs no clone and no toolchain. Set to empty, the site says this
build has no repository configured rather than linking into a void.

## Layout

```
data/boards/*.json          one pinout per file, the unit of contribution
data/crossref/parts.json    part equivalents, graded and annotated
lib/signals.ts              signal taxonomy and color palette
lib/boards.ts               reads data/boards, resolves pins onto the grid
lib/search.ts               dependency-free scorer for the Cmd-K palette
scripts/validate-data.ts    schema checks, fails the build on bad data
scripts/gen-cheatsheets.ts  renders the printable SVGs
components/PinoutExplorer.tsx  the interactive diagram
public/cheatsheets/         generated, not committed
```

## How the data works

A pin has one **primary** electrical role, which sets its color, plus any number
of **tags** for buses it can be muxed onto. A GPIO that is also SPI clock is both,
which is why hovering "SPI" lights it up without changing what it fundamentally is.

```json
{
  "number": 12,
  "name": "GPIO18",
  "primary": "gpio",
  "aliases": ["BCM 18", "PCM_CLK"],
  "tags": ["pwm", "clock"],
  "functions": ["PWM0", "PCM/I2S CLK", "SPI1 CE0"],
  "note": "The pin WS2812 libraries use, because it reaches PWM0 via DMA."
}
```

Pin placement comes from `layout.numbering`, so you do not hand-place 40 pins:

- `zigzag`: 2xN headers, odd pins left and even pins right (Raspberry Pi header)
- `ccw`: counter-clockwise DIP convention, down the left then back up the right
  (DIP packages, Pico, Black Pill)
- `explicit`: each pin carries its own `side` and `row`, for packages with no
  physical numbering (Arduino, ESP32 and Blue Pill headers). A skipped row leaves
  a deliberate gap.

The `note` field is the point of the project. Strapping pins, on-board pull-ups,
current limits, analog-only pins: anything that is easy to get wrong.

In the cross-reference, an equivalent without a substantive `notes` string fails
validation.

See `/contribute` on the running site for the full schema.

## Two renderers, on purpose

The interactive diagram is HTML, not SVG: real buttons, real focus order,
selectable text, and it reflows on a phone. The cheat sheet is a separate SVG
renderer laid out for A4, denser, with the gotchas inline and no hover state
hiding anything. They share the data and the palette, not the layout code.

## Design notes

The page is a Bell Labs technical memorandum: warm stock, hairline rules, square
corners, no shadows, and one ink color, a deep blue, reserved for links and live
state. Light is the default and the intended look. The toggle offers the same
document under a desk lamp for a dim workshop; it is not tied to the OS setting.

Five type sizes and no others: 15px for UI, meta and badges, 17px for body, 19px
and 22px for headings, 36px for page titles. `text-xs` is aliased to `text-sm`, so
a stray utility cannot reintroduce a sixth. The scale lives in one `@theme` block
in `app/globals.css`.

Running text is Source Serif 4, a Times descendant drawn for screens rather than
for metal. Identifiers stay in Atkinson Hyperlegible Mono, from the Braille
Institute, which keeps 0 apart from O and 1 apart from l and I. Those pairs are
in almost every pin name, and mono is reserved for things you type exactly.
`next/font` self-hosts both at build time, so no request reaches Google when
someone loads a page.

The radius scale is zeroed in `@theme`, which squares every `rounded-*` utility
in the project at once. `rounded-full` needs a separate override, because
Tailwind hardcodes it to an infinite radius instead of reading the theme.

Sections, figures and tables are numbered from what a board actually has, so a
board with no circuit has no gap in its numbering and the schematic caption can
say which table it was drawn from.

Signal hues are chosen to separate from each other, which leaves several of them
around 2:1 as text on a light background, so `.sig-text` mixes them toward ink in
light mode. Every signal label measures at least 4.5:1 in both themes.

Card rows use flex-wrap with `justify-center`, not a grid, so a short final row
centers instead of hanging at the left edge.

openlabbench is a subsite of gwark.dev. The mark in the top bar is that project's
`assets/mark.svg`, kept in its brand teal in both themes.

## Accuracy

Transcribed from manufacturer datasheets and vendor pinout diagrams. The ESP32
DevKit V1, both STM32 boards and the two BeagleBone headers were checked against
published layouts rather than memory. Clones and revisions differ, so check your
own silkscreen before applying power.

This is the standard for new data too, not just a description of the old. If a
source is ambiguous or two sources disagree, the board stays out until one of
them wins. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Two licenses, because the code and the data are different kinds of work.

- **Code** (`app/`, `components/`, `lib/`, `scripts/`) is MIT. See `LICENSE`.
- **Data and writing** (`data/`, the generated cheat sheets in
  `public/cheatsheets/`, and this README) are Creative Commons Attribution 4.0.
  See `LICENSE-CC-BY-4.0`.

The split is deliberate. Reuse the code however you like, with no obligation
beyond keeping the notice. Reuse the pin data and the cheat sheets freely too,
but say where they came from, because a pinout with no provenance is the thing
this site exists to replace.

Attribution that satisfies CC BY:

```
openlabbench by lmlack, CC BY 4.0, https://gwark.dev/openlabbench/
```

The gwark mark (`public/gwark-mark.svg`) is brand identity, not content, and is
reserved rather than licensed.

Third-party components and the limits of the data grant are in
`THIRD-PARTY.md`.
