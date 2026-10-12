# Third-party components

The MIT grant in `LICENSE` and the CC BY grant in `LICENSE-CC-BY-4.0` cover this
project's own code and data. The components below are other people's work and
keep their own terms.

## Build and runtime

| Component | License |
| --- | --- |
| Next.js 16 | MIT |
| React, React DOM 19 | MIT |
| Tailwind CSS 4 | MIT |
| TypeScript, ESLint, `eslint-config-next` | Apache-2.0, MIT, MIT |

These are not copied into this repository, but the compiled output of the first
three ships inside the exported site.

## Fonts

Both are self-hosted by `next/font` at build time, so the font files are part of
the exported site in `out/_next/static/media/`.

| Font | Author | License |
| --- | --- | --- |
| Source Serif 4 | Frank Grießhammer, Adobe | SIL Open Font License 1.1 |
| Atkinson Hyperlegible Mono | Braille Institute of America | SIL Open Font License 1.1 |

The OFL permits bundling and redistribution with the site. The font names are
reserved: a modified copy has to be renamed.

## Pin data

The pinouts are transcribed from manufacturer datasheets and vendor diagrams,
which are cited per board in `docs`. Pin numbers, names and electrical limits
are facts about a part and are not anyone's copyright, so the CC BY grant
applies to this project's selection, wording and arrangement of them.

It does not reach the source documents. Datasheet text, drawings and
photographs stay the property of the manufacturer, and none of them are
reproduced here.
