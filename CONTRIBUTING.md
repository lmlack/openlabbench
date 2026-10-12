# Contributing

Every pinout here is one JSON file in `data/boards/`. Adding a board means
adding a file, and fixing a pin means changing one line. There is no build
system to learn to do either.

## The one rule

**Check it against the datasheet or the vendor's own pinout diagram. Not against
memory, not against another pinout site, not against a photo of a breadboard.**

Pin data that is almost right is worse than no pin data, because someone will
trust it and wire 5 V into a 3.3 V pin. If a source is ambiguous, or two sources
disagree and you cannot tell which is right, leave the board out and say so in
the pull request. Omitting beats guessing.

Put the source in `docs` so the next person can check your work:

```json
"docs": [
  { "label": "TI NE555 datasheet", "url": "https://www.ti.com/lit/ds/symlink/ne555.pdf" }
]
```

Two things worth knowing, because both have caused real errors in this data:

- **Packages of the same part can have different pin orders.** The INA219's
  SOT-23 and SOIC versions are close to reversed. Say which one you drew.
- **Datasheets contradict themselves.** The Arduino UNO R4 datasheet prints
  `D0/TX0` and then describes it as the receiver. When the document disagrees
  with itself, find a second vendor document and note which one you followed.

## The quickest way to fix something

You do not need to clone anything. From the running site:

- Any board page has **Edit this file on GitHub**, which opens that board's JSON
  in GitHub's web editor and forks the repo for you.
- Any board page has **Report it instead**, which opens an issue prefilled with
  a space for the pin and the source.
- The [contribute page](https://gwark.dev/openlabbench/contribute) has the full
  schema with worked examples, plus one-click links to add a new board or edit
  the cross-reference.

That path needs no toolchain and no local setup.

## Running it locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run validate   # the same checks CI would run
```

`npm run validate` is the thing to run before opening a pull request. It is
strict on purpose, and it is faster than waiting for a review to tell you the
same thing.

## What validation will reject

Beyond the obvious missing fields and unknown enum values:

- A slug that does not match the filename, or a duplicate slug.
- Pin numbers that are not contiguous from 1, or two pins landing on the same
  slot in the layout.
- A `zigzag` or `ccw` layout whose pin count is not exactly `rows * 2`. Those
  numberings place pins for you, so the arithmetic has to work out.
- An `explicit` layout with a pin missing `side` or `row`, or a row past
  `layout.rows`.
- A `docs` URL that is not `https://`.
- A circuit row whose `why` is under 20 characters, or whose endpoints are the
  same node, or which references a pin the board does not have.
- A cross-reference equivalent without a substantive `notes` string. A bare list
  of part numbers is the thing this project exists to replace.
- A snippet over 26 lines, or one without a `gotcha`. These are bring-up
  snippets, not programs.

## What makes a good `note`

The `note` field is the point of the project. The pin name is already on the
silkscreen; what is not written down anywhere is what will bite you:

> "Strapping pin. Held low at reset, the chip enters the download bootloader."

> "Not 5 V tolerant, unlike the other three SPI pins."

> "The current and power registers read zero until you write the calibration
> register. Nothing is broken."

A note that restates the pin name is worse than no note, because it costs the
reader a line and teaches them nothing.

## House style for prose

Data files carry a lot of writing, and it should read as one voice:

- No em dashes. Use a comma, a colon, or a second sentence.
- US spelling.
- Plain sentences. Say the thing that is true and stop.

## Licensing

Code is MIT and the data and writing are CC BY 4.0, as described in
[README.md](README.md). Contributing means you are offering your change under
those terms, and confirming that the data came from a public datasheet or vendor
diagram rather than being copied out of someone else's pinout project.
