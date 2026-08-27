# Changelog

## 1.1.0 — 2026-08-27

Token depth: the themes carried colours, font stacks and radii and nothing
else, so an agent handed one could paint a surface but not size a heading.
Read against the DESIGN.md format spec (google-labs-code/design.md), which is
not adopted as a source of truth — `tokens.json` stays DTCG, and the MCP
server stays the product.

### Added
- `color.brand-on-dark` (`#EA6359`) and `color.brand-on-light` (`#C7251A`) on
  the `tebin` theme. Small red text needs 4.5:1 and the identity red clears it
  on neither surface family; no single red can, because the luminance window is
  empty for any hue. These shipped on tebin.pro in July and had never reached
  the design system, so every consumer still got the pre-fix palette. The
  identity red `#DA291C` is unchanged and remains the colour for the logo,
  fills, borders and large text.
- A `role` group on all three themes: DTCG aliases mapping `primary`,
  `surface`, `on-surface` and, where a theme has them, `surface-inverse`,
  `on-surface-muted` and `outline` onto the existing descriptive names. Nothing
  was renamed. `tebin` additionally maps `primary-on-dark` / `primary-on-light`,
  because the red that fills and the red that can be read are different tokens.
- A typography scale on `tebin`: `type.h1` … `type.h5`, `type.body`,
  `lineHeight.heading` / `lineHeight.body`, `fontWeight.heading` — mirrored from
  the site's `global.css`, not designed anew.
- A spacing scale on `tebin`: `spacing.gutter` and the three section rhythms,
  plus `layout.container-default` / `-wide` / `-reading`.
- `$extensions["pro.tebin.fluid"]`, a declared `{ min, pref, max }` triple. The
  CSS build composes `clamp()` from it while `$value` carries the ceiling as a
  plain `px` dimension, which is what keeps a fluid scale expressible in a
  format whose `Dimension` admits only px/em/rem.
- Status roles. `tebin` gets `error`, `warning` and `success` in both surface
  variants; `slate` gets one variant each, because it has one surface family.
  `warning` and `success` are new colours chosen by the theme author and
  measured against the binding surfaces — `#EFEEE9`, the darkest light surface
  in use, and `#242830`, the lightest dark one. All six clear 4.5:1. The 2017
  brand book prices no status colours, and each token's description says so.
  **Error reuses the brand reds rather than adding a fourth red**: a second red
  would ask the reader to tell two reds apart, and `content-not-color-only`
  already requires an icon and a label beside any status.
  `tebin-classic` gets none — it is the theme for documents and print, where
  table rules come from Word's table styles and a page has no error state. For
  the same reason it has no `role.outline`.
- A rewritten agent skill. `skill/tebin-style/SKILL.md` had an unfilled `OWNER`
  placeholder that would 404, a description promising shadow tokens no theme
  has, and no mention of `DESIGN.md`. It now leads with how to reach the
  registry, points at `DESIGN.md` first, and teaches roles and the two-red
  rule. Five tests guard those defects.
- `typography-heading-balance`, a rule naming `text-wrap: balance` as the
  supported way to shape a heading. Two `NEVER` rules already removed every
  manual way to do it without naming one that works. Rules DB: 61 → 62.

### Changed
- `tokens.css` emits roles as `var()` references rather than duplicated
  literals, so repointing a colour moves every role that names it.
- `theme.ts` exports resolved colours; an alias would otherwise have shipped as
  the string `{color.brand}`.
- `tokens.dtcg.json` keeps aliases as aliases — a reference is a first-class
  DTCG value and round-tripping it is the point.
- The generated `DESIGN.md` gains `## Roles`, `## Spacing` and a `### Scale`
  table; the font-stack section takes the spec's heading name, `## Typography`.
- `typography-heading-scale` now names `type.h1 … type.h5` instead of pointing
  at a "global type scale" the design system did not contain.
- Theme versions: `tebin` 1.1.0 → 1.3.0, `slate` 1.0.0 → 1.2.0,
  `tebin-classic` 1.0.0 → 1.1.0.

### Not included
- Component tokens. The spec calls its own component section "actively
  evolving", and no canonical button exists across the three TEBIN apps to
  encode — writing one would invent a house style rather than record one.
- `tebin-classic` gets no `outline` role: its palette carries no colour
  documented as a hairline, and picking one of the brand-book greys would be
  invention. Same reason there is no `error` role anywhere.

## 1.0.0 — 2026-07-29

First tagged release. npm publication was considered and dropped — the
registry is for internal use and partner hand-offs, which the GitHub
Release ZIP covers; the npm name `tebin-style` was free as of 2026-07-29
if that ever changes.

### Added
- PNG brand assets in three widths per logo and three per corner mark, with
  on-red and on-charcoal variants for the white logo. Coloured tiles carry
  clear space per the brand's B-height rule.
- A generated, self-contained `DESIGN.md` per theme — every link absolute, so it
  can be pasted into a chat or saved beside a document.
- `dist/colors.csv` per theme: HEX, RGB, Pantone, CMYK, purpose.
- Generated palette previews for all three themes.
- Pantone and CMYK values on `tebin-classic`, read from the 2017 brand book. Where
  the book prints no value, the cell says so rather than showing a conversion.
- Six `typography` rules, plus `performance-webfont-policy` and
  `theming-policy-enforced` (53 → 61).
- Four guides in `docs/guide/`, and a README that opens with a download rather
  than a clone.
- A release workflow that attaches `tebin-brand-pack.zip` to the GitHub
  Release.

### Changed
- The README no longer documents installation, MCP tools or development; those
  moved into `docs/guide/`.
- `themes/tebin/README.md` now points at `DESIGN.md`; the no-webfont note lives in
  `themes/tebin/design.intro.md`.
- `registry/index.json` lists the generated PNGs as first-class assets
  (`logo-full@1024`), so the MCP `get_asset` tool serves them unchanged.
