# Token depth: adopting DESIGN.md conventions — design

Status: accepted · 2026-08-27 · supersedes nothing

## Why

[google-labs-code/design.md](https://github.com/google-labs-code/design.md)
publishes a format for handing a visual identity to a coding agent: YAML front
matter carrying normative tokens, plus prose carrying the rationale. Reading it
against this repository produced one uncomfortable result — the format is not
what we are missing. **The tokens are.**

`tebin-style` already ships a generated `DESIGN.md` per theme, an MCP server,
DTCG tokens, a rules database with severities and rationales, print values, and
an asset pipeline. None of that is in the Google spec. But our themes carry only
colours, font families and radii. There is no type scale, no spacing scale, no
semantic roles, and no token aliasing — so an agent handed `tebin` can paint a
surface and cannot size a heading.

Two of those gaps predate the spec and were found by consulting the wiki, not
by reading Google:

1. **The accessible brand text colours are missing from the design system.**
   `tebin/src/styles/global.css:20-21` ships `--color-brand-on-dark: #EA6359`
   and `--color-brand-on-light: #C7251A`. The 2026-07-30 work that took
   tebin.pro from 1118 failing text nodes to zero produced them, and
   `[[accessible-brand-colour]]` proves they are arithmetically necessary: to
   clear 4.5:1 on `#242830` text luminance must be >= 0.2043 and on `#EFEEE9`
   it must be <= 0.1509, an empty window **for any hue**. The theme still
   carries only `brand` and `brand-dark`, so every consumer reading the design
   system reproduces the defect that was already fixed on the site.

2. **A type scale exists and was never mirrored.** `global.css:181-185` defines
   `h1..h5`, `global.css:113` the body size and leading, `global.css:101-104`
   the gutter and section rhythm. The theme has none of it, while
   `rules.json` already carries `[SHOULD] Take heading sizes from the global
   type scale rather than from per-page clamp() overrides` — a rule pointing at
   a scale the design system does not contain.

MCP remains the product. The spec is read here as a source of **conventions**,
in the sense of `[[codemod-sweeps]]`: somebody else's checklist is written for
somebody else's genre, so "this was already decided" is a third outcome beside
fix and skip.

## What we borrow

| From the spec | How it lands here |
| --- | --- |
| Semantic roles distinct from descriptive names | A `role` token group of DTCG aliases |
| A typography scale as tokens, not prose | A `type` group with fluid metadata |
| A spacing scale as tokens | `spacing` + `layout` groups |
| `{path.to.token}` references | DTCG aliases, already supported by Style Dictionary v4 |
| WCAG contrast as a lint, not a comment | Deferred to tranche 2 |
| YAML front matter in `DESIGN.md` | Deferred to tranche 2 |
| Version-to-version `diff` with a regression flag | Deferred to tranche 2 |
| A `components` layer | Deferred; the spec calls it "actively evolving" and its own version is `alpha` |

## What we do not borrow

- **The YAML front matter does not become the source of truth.** `tokens.json`
  stays DTCG and keeps `$extensions` for print values, which the spec has no
  concept of. Front matter will be a generated artefact like `tokens.css`.
- **Rules do not collapse into a flat Do's and Don'ts list.** Our records carry
  `id`, `severity`, `rationale`, `tags` and `source`; the spec's bullets carry
  none of that. The spec's section will be generated as a projection.
- **Token names are not renamed to the spec's.** `brand`, `paper`, `ink` stay.
  Renaming breaks tebin.pro, cv-astro, tebin-expenses, the published npm
  package and the brand pack, and buys only cosmetic conformance.

## Decisions

### D1 — Roles are a separate token group of aliases

A new top-level `role` group whose values are DTCG references into the existing
palette. Nothing is renamed, every consumer keeps working, and the roles appear
in `tokens.css`, `tailwind.css`, `theme.ts` and `tokens.dtcg.json` for free.

The role names must distinguish **fill from text**, because
`[[accessible-brand-colour]]` settled that "the brand red" and "red you can
read" are different concepts that were once the same variable — and that
sharing one variable shipped an `h2` at 2.57:1 on a red band. Hence
`role.primary` (fills, logo, large text) is a different token from
`role.primary-on-dark` and `role.primary-on-light` (small text).

Roles are only assigned where a colour already exists. There is no `error`
colour in any theme, so no `role.error` is invented.

### D2 — The type scale keeps its fluid values, in `$extensions`

The site's scale is `clamp(min, vw, max)`. The spec's `Dimension` admits only
`px`, `em`, `rem`, so **the spec cannot express our scale** — and the `vw` is
not incidental: `[MUST] Size display type against the locale with the longest
words` exists because a vw-based size that fit English overlapped the next
column by 343px in German.

So `$value` carries the maximum as a plain `px` dimension — valid under both
DTCG and the spec — and `$extensions["pro.tebin.fluid"]` carries the
`{ min, pref, max }` triple. The CSS build composes `clamp()` from the triple;
a consumer that only understands the spec reads the max and is not lied to.
The prose says the value is a ceiling, not a fixed size.

### D3 — `components` is deferred

The spec marks the component section as evolving and the whole format as
`alpha`. More to the point, no canonical button exists across the three TEBIN
apps to encode. Codifying one now would invent a house style rather than record
one.

## Constraints carried in from the wiki

- **Print values come only from the 2017 brand book, never converted from RGB.**
  New colours therefore carry the explicit "not specified in the 2017 brand
  book" that `colors-csv.ts` already emits.
- **The licence split stays**: tokens MIT, assets "© TEBIN — all rights
  reserved".
- **`tebin-classic` is the document/print theme.** Values measured against the
  web theme's surfaces do not transfer to it, so the accessible red lands in
  `tebin` only. Inventing a classic equivalent would be exactly the averaging
  the wiki forbids.
- **The no-webfont decision stands.** Adding a type scale does not add a font
  request, and the scale's `$description` must not read as though Roboto
  renders.

## Non-goals

- No change to any consuming application. This tranche only deepens the
  registry.
- No renaming, no removal, no change to existing token values.
- No new MCP tools. `get_theme` gains richer content, not a new signature.

## Deferred, with evidence — do not silently drop

- **`type.label`.** `global.css:155-162` has a real label treatment (condensed,
  700, 13px, uppercase, `letter-spacing: 0.08em`), but it appears on the skip
  link. One component is not evidence of a system level; needs a second sighting
  before it becomes a token.
- **`role.error`.** No error colour exists in any theme.
- **`role.outline` on `tebin-classic`.** That theme has no colour documented as
  a hairline — `grey-light` and `grey-lighter` are brand-book palette entries,
  not a stated line colour. Naming one is the owner's call.
- **The `omitted` convention** with documented reasons — belongs with the front
  matter in tranche 2, where a linter exists to be silenced.
- **The contrast floor as a check.** `on-dark-6` / `on-light-3` are recorded in
  prose and in a rule; making them executable is tranche 2.
