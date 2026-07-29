# Brand pack, DESIGN.md and a manual for non-developers — design

Date: 2026-07-29
Status: approved (brainstorming)

## Problem

`tebin-style` serves developers and coding agents well: canonical DTCG tokens, four
generated formats, 53 design rules, an MCP server, a skill. It serves nobody else.

Concretely, as of this date:

1. **There is no PNG of any logo.** `tebin-classic` ships four SVG files;
   `tebin` ships SVG plus an incidental `favicon.png` and `fxptebin.png`. A
   colleague writing a Word document, an Excel workbook or a slide deck has
   nothing to take.
2. **The README's download links do not work for a non-developer.**
   `raw.githubusercontent.com` serves SVG as `text/plain`, so the browser shows
   source code, not a logo.
3. **The entry path is a terminal.** `git clone` + `pnpm install` + `pnpm build`
   is the first thing the README asks for.
4. **There is no single file that states the design.** Guidance is split across
   the root README, three `themes/*/README.md`, `rules/dist/rules.md` and the
   skill. Nothing can be handed to a chat model or dropped beside a Word
   document.
5. **There are no print or Office colour values.** `tebin-classic` is described
   as "Pantone red + grey", but the tokens hold neither Pantone nor CMYK nor the
   RGB triplets that Office colour pickers ask for.
6. **Only `tebin-classic` has previews.** `tebin` and `slate` show no image at all.
7. **There are no releases.** `package.json` is at `0.1.0`, themes are at `1.x`,
   there are no tags and no downloadable archive.
8. **Design decisions taken after 2026-07-22 never reached the rules database.**

On (8): the tebin technical audit and the four-locale port produced rules that
`tebin-style` does not carry. The most consequential is the owner's decision of
2026-07-29 — **a heading never breaks a word** — which reversed a sweep of 177
`overflow-wrap:anywhere; hyphens:auto` rules across 44 pages the day before. The
rules database is the only place where that reversal becomes queryable rather
than folklore.

Token values themselves have **not** drifted: `themes/tebin/tokens.json` matches
`tebin/src/styles/global.css` colour for colour and radius for radius, including
the translucent scale added 2026-07-22. Nothing in the repository would have
caught it if they had.

## Scope

In scope: generated PNG assets, generated per-theme `DESIGN.md`, generated
`colors.csv`, generated palette previews, print/Office colour values, a rewritten
README, four guides in `docs/guide/`, eight new design rules, a release workflow
with a ZIP brand pack, npm publication.

Out of scope, by decision:

- **Live drift checking against tebin.pro.** A scheduled job fetching the
  deployed CSS was offered and declined; reading the wiki and the logs for what
  changed after the technical audit replaced it.
- **Binary Office templates** (`.docx` / `.xlsx` / `.pptx`). Considered and cut:
  they do not diff in git and would need their own generator.
- **On-demand rasterization in MCP** (`get_asset({ format: 'png', size })`).
  Deferred, not rejected; it does not serve the person on github.com, who is the
  reason for this work. The design below leaves it a one-function addition.
- **Localized guides.** Everything stays English, per the standing documentation
  rule.

## Approach

Everything generated goes through the existing `pnpm build` / `pnpm check`
pipeline. The alternative — a `kit/` folder maintained by a script run by hand —
was rejected because it drifts silently, and the drift check is the part of this
work that has to keep holding after the work is done.

## Source of truth

`themes/<id>/tokens.json` remains the only hand-edited token file.

Colour tokens gain an optional DTCG-legal extension block:

```json
"brand": {
  "$type": "color",
  "$value": "#DA291C",
  "$extensions": { "pro.tebin.print": { "pantone": "485 C", "cmyk": "0/95/100/0" } }
}
```

`schema/tokens.schema.json` is extended to allow `$extensions` on a colour token
with that shape. Existing generators ignore it; the DTCG outputs are unaffected.

**Provenance rule: only values the 2017 brand book states.** No RGB→CMYK
conversion — a naive conversion is wrong for print and would be indistinguishable
from a measured value once written down. Where the book gives no value the
rendered cell reads `not specified in the 2017 brand book`.

Two values are already decomposed and recorded in
`docs/specs/2026-06-25-tebin-classic-theme-design.md`: red is **Pantone 485 C**,
grey is **Pantone 423 C** (Black 60%). The remaining Pantone values for the eight
secondary colours, and any CMYK values, are re-extracted from
`.input/Tebin_Style_Guide.pdf`, which sits in the working tree **untracked** —
internal brand material that should stay out of a public repository. `DESIGN.md`
therefore cites the book by name (the string already in `theme.json`'s
`source.url`), never by a repository link. The 2026-06-25
work used `pymupdf` for this; the same route applies. Print values are filled for
`tebin-classic` only — `tebin` is a web reinterpretation and `slate` is generic.

## Generated artifacts

### 1. Raster assets — `scripts/build-assets.ts`

Rasterizes each theme's SVG assets with `@resvg/resvg-js` (prebuilt native
binaries, no system dependencies) into `themes/<id>/assets/png/`. The logo SVGs
contain only `<path>` elements — no `<text>` — so no font is needed at render
time and output does not depend on installed fonts.

| Asset | Sizes | Variants |
|---|---|---|
| `logo-full` | 512 / 1024 / 2048 px wide | transparent |
| `logo-full-white` | 512 / 1024 / 2048 px wide | on brand red, on charcoal |
| `corner-mark` | 128 / 256 / 512 px square | transparent |
| `corner-mark-white` | 128 / 256 / 512 px square | on brand red, on charcoal |

Names: `logo-full-1024.png`, `logo-full-white-1024-on-brand.png`. A white asset
gets no transparent variant — it is invisible in every file preview and in Word's
insert dialog. 2048 px spans half of A4 at roughly 300 dpi, so print from Word
does not pixelate.

Background colours come from the theme's own tokens (`color.brand`, and
`color.charcoal` where present, otherwise `color.ink`).

### 2. Palette previews

The same script generates `themes/<id>/preview/palette.svg` and `palette.png`
from the colour tokens for all three themes, so `tebin` and `slate` stop being
imageless. `tebin-classic`'s hand-drawn `logo-hero.svg` and
`logo-backgrounds.svg` stay as they are; its hand-drawn `palette.svg` is replaced
by the generated one, being derived data.

### 3. `themes/<id>/DESIGN.md` — `scripts/build-design-doc.ts`

One generated file per theme, headed `Generated from tokens.json, theme.json and
rules.json — do not edit by hand.` Sections:

1. **Identity** — name, version, licence, provenance (a link to the brand book
   for `tebin-classic`).
2. **Prose introduction** — inlined verbatim from `themes/<id>/design.intro.md`,
   the only hand-edited prose. The no-webfont warning currently at the top of
   `themes/tebin/README.md` moves here.
3. **Palette** — table: token, HEX, RGB, Pantone, CMYK, purpose (from
   `$description`).
4. **Type** — families, weights, and the "Arial in Office documents" exception
   stated separately rather than buried in a font stack.
5. **Geometry** — radii and any other dimension tokens.
6. **Assets** — table with a download link for the SVG and for every PNG size.
7. **Rules** — the `brand`, `typography` and `theming` rules as MUST / SHOULD /
   NEVER.
8. **Use and licence** — pointers to the guides; the asset licence caveat.

**Every link in `DESIGN.md` is absolute.** This is the property that makes the
file the deliverable it is meant to be: it keeps working when pasted into
Claude, ChatGPT or Gemini, or saved next to a Word document, outside the
repository. Relative links would be dead the moment the file leaves `themes/<id>/`.

### 4. `themes/<id>/dist/colors.csv`

Columns: token, hex, r, g, b, pantone, cmyk, purpose. Opens in Excel on a
double-click, which is what an Office user actually needs from a palette.

### 5. Registry merge — `scripts/build-index.ts`

`build-assets` writes `themes/<id>/assets/png/manifest.json`. `build-index.ts`
merges the hand-authored `theme.json.assets` with that manifest into
`registry/index.json`.

Consequence: **the MCP server serves PNGs with no code change.** `getAsset` reads
`registry/index.json` and already returns binaries as base64; raster entries get
ids of the form `logo-full@1024`. `theme.json` is not touched by any generator —
it stays a hand-edited file.

## Drift checking

Text artifacts (`DESIGN.md`, `colors.csv`, `palette.svg`, `rules/dist/rules.md`,
`dist/*`) are byte-compared by `pnpm check`, as today.

**PNG bytes are not compared.** Different `resvg` versions and platforms can
produce different bytes for identical input, which would turn `pnpm check` red on
CI without any real change — a check that fails for its own reasons stops being
read. Instead `assets/png/manifest.json` records, per output: the source SVG's
sha256, the requested width, the variant, the output path and the output's
sha256. `pnpm check` asserts that every manifest entry's file exists and that each
source SVG's current sha256 matches the manifest. Regeneration is therefore
required exactly when a logo or the size ladder changes, and never otherwise.

## Documentation

### README, rewritten

Order: logo → one sentence on what this is → **Download block** (PNG first, SVG
second) → palette as a table showing HEX and RGB, not only a picture → two tracks
("I need a logo and colours" → `docs/guide/`; "I am wiring up an agent" → skill
and MCP) → themes table → rules → licence. The `git clone` / `pnpm build`
material moves down and into `docs/guide/developers.md`.

**Link policy.** Human-facing links point at the GitHub **blob** page, which
renders a preview and offers a Download button, with `?raw=1` for a direct
download. `raw.githubusercontent.com` links remain but are labelled as being for
scripts and agents. This is the specific fix for SVG being served as
`text/plain`.

### `docs/guide/`

| File | Audience | Content |
|---|---|---|
| `quick-start.md` | anyone | Get the logo and the colours without a terminal. |
| `office.md` | Word / Excel / PowerPoint / Google Docs | Which PNG size to take, where to type the RGB values, when Arial replaces Roboto, the clear-space rule, and what not to do to the logo. |
| `ai-agents.md` | agent users | Claude Code (skill and MCP), Codex, any MCP client, and "paste `DESIGN.md` into the chat" for hosts with no MCP. |
| `developers.md` | developers | Clone, build, the four token formats, contributing. |

## New design rules

New category `typography` — the database has none today. `schema/rules.schema.json`
takes `category` as a free string, so no schema change is needed.

| id | severity | statement |
|---|---|---|
| `typography-heading-word-break` | NEVER | A heading never breaks a word — not mid-letter, not with a hyphen. No `hyphens: auto`, no `overflow-wrap: anywhere`, no `&shy;` on display type; resize the type or rewrite the line. |
| `typography-body-wrap` | SHOULD | Body copy carries `overflow-wrap: anywhere` and `hyphens: auto`, so long technical strings cannot overflow. |
| `typography-display-multilingual` | MUST | Size display type against the locale with the longest words, not against the source language. |
| `typography-negative-tracking` | NEVER | `letter-spacing` is zero or positive; never negative. |
| `typography-manual-line-breaks` | NEVER | No `<br>` inside a heading to shape a line. |
| `typography-heading-scale` | SHOULD | Heading sizes come from the global scale, not from per-page `clamp()` overrides. |
| `performance-webfont-policy` | NEVER | Never add a webfont request to a project that deliberately ships none. |
| `theming-policy-enforced` | SHOULD | A design policy that lives only in prose is enforced only where somebody remembered it; make it checkable. |

Rationale fields carry the evidence: `&shy;` is stripped by the HTML minifier;
German compounds overflowed the next grid column by up to 343 px where an English
heading fit; 31 public pages fetched a Google font for a year because the policy
in `AGENTS.md` was enforced on the English pages and not on the thirty localized
copies.

The `touch` category already carries the 24 px / 44 px target rule, so the
`docs/design-system-audit.md` finding about hit targets adds nothing new.

Count: 53 → 61.

## Release and publication

`.github/workflows/release.yml`, on tag `v*`: build, assemble
`tebin-brand-pack.zip` (per theme: PNG, SVG, `DESIGN.md`, `colors.csv`,
`tokens.css`, `tokens.dtcg.json`), attach it to the GitHub Release, then
`npm publish` with an explicit `files` allow-list.

`package.json` goes from `0.1.0` to `1.0.0`; themes keep their own semver; a
`CHANGELOG.md` is added. The existing CI job (`validate` / `check` / `test`) is
unchanged in shape — it is what catches a forgotten regeneration.

Publication needs an `NPM_TOKEN` repository secret, which only the owner can add.

## Tests

Extending the existing vitest suites:

- **`build-assets`** — the manifest matches the declared size ladder; every
  declared PNG exists; mutating a source SVG in a temp fixture makes the manifest
  stale, and `check` reports it.
- **`DESIGN.md`** — every colour token appears; **every link is absolute** (no
  `](./` or `](../`); this is what keeps the file usable outside the repository);
  every rule in the selected categories appears; a missing Pantone renders as the
  explicit sentence, never as an empty cell.
- **`colors.csv`** — one row per colour token; each row's RGB agrees with its HEX.
- **Link walk** — every link in the README, the guides and each `DESIGN.md` that
  points inside the repository resolves to a file that exists. This is the class
  of check that would have caught the current `text/plain` download links.
- **Rules** — new ids are unique and match the id pattern; the digest is
  regenerated.

## Risks and open items

- **The npm name `tebin-style` is unverified.** First implementation step;
  publish scoped if it is taken.
- **PDF extraction may come up empty for CMYK.** The brand book may state Pantone
  without CMYK. Then the cell says so; no value is invented.
- **Repository size.** Roughly 36 PNG files, a few megabytes. That is the price
  of a Download button that works without a terminal.
- **`.input/Tebin_Style_Guide.pdf` was slated for deletion** by the 2026-06-25
  plan and is still present in the working tree, untracked. It is the only source
  for the print values, so it should not be deleted while this work is open; add
  `.input/` to `.gitignore` so it cannot be committed by accident. Decide its
  long-term home after extraction — it is the owner's call, not a cleanup step.
