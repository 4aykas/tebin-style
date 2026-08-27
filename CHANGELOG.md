# Changelog

## 1.6.0 — 2026-08-27

### Added
- **`brand-logo-never-typeset` (NEVER)** — never re-create the wordmark by
  typing TEBIN in a font. Reported from the field: handed only the repository
  link and asked to brand a spreadsheet, an agent gets the colours right and
  then sets the name as styled text instead of fetching the logo.

  The repository was at fault, not the agent. Nine brand rules governed how to
  *place* the logo and every one of them assumed you already had the file;
  none forbade drawing it yourself. An agent could follow all nine and still
  ship the wrong mark.

  It is not only a policy breach. `logo-full.svg` is seven `<path>` elements
  and no font reference at all — the letters are drawn outlines, so typing the
  name produces different letterforms however close the face looks.

  The rule now leads `llms.txt`, which is what a machine reads first, and
  repeats in the README beside the download table, at the top of the Office
  guide, and in the agent skill's asset step.

### Changed
- **One home for token references.** `resolveToken`, `resolveString` and
  `referencePath` move to `src/tokens.ts`. Three modules had been answering
  the question separately and disagreeing at the edges: the lint caught
  reference cycles, the front matter passed a dangling reference through as if
  it were a value, and the generated document stripped the braces with a
  regex. The differences that matter now sit at the call sites, where they are
  visible, instead of inside three near-identical functions.

  Found by the codebase knowledge graph, which put two functions named
  `resolve` in two different clusters — something a grep for `resolve` would
  have shown as two ordinary hits.

  The refactor is byte-for-byte behaviour-preserving: `pnpm check` reports no
  drift without a rebuild.

## 1.5.1 — 2026-08-27

Three consistency gaps a code review found after 1.5.0, all of them the same
shape: a change to the tokens that its neighbours were never told about.

### Fixed
- **The agent-facing guidance still sent errors to the signal red.**
  `skill/tebin-style/SKILL.md` and `docs/guide/developers.md` both said small
  red text takes `role.primary-on-*` — true while `role.error-*` aliased the
  brand reds, and wrong the moment 1.5.0 moved errors to brick. An agent
  colouring a validation message would have followed that sentence straight
  back to the colour the release moved off. Both now name `role.error-*`,
  `role.warning-*` and `role.success-*`, and a test pins it.
- **Palette previews printed labels below the floor this repo enforces.**
  `labelColor()` promised "black or white, whichever clears contrast" and in
  fact decided on a YIQ brightness threshold — a different quantity. `#EA6359`
  and `#D07C77` both landed just under it and took white labels at 3.27:1 and
  3.07:1, where black gives 6.43 and 6.83. It now picks by measured ratio, and
  a test asserts every swatch label in every theme clears 4.5:1.
- **Two published contrast figures were unpinned.** `contrast.test.ts` exists
  to stop a printed ratio drifting from the colour beside it, but 1.5.0 added
  "5.40:1 on #EFEEE9" and "4.81:1 on #242830" without adding the pins. Those
  strings are copied into `DESIGN.md`, `colors.csv` and `tokens.css`, so a
  later edit could have shipped a stale number in four files while every gate
  stayed green.

## 1.5.0 — 2026-08-27

The error colour was never missing. It was called something else.

### Changed
- `role.error-on-light` now points at **`color.brick` (`#A43F39`)** instead of
  the brand red. Brick is the 2017 brand book's secondary red, priced there in
  CMYK (`24/85/81/57`), and `tebin-expenses` has shipped it as `--color-alert`
  all along, commented *"errors — the red family, softened"*. Nothing was
  invented; the value was found.
- `role.error-on-dark` points at **`color.brick-on-dark` (`#D07C77`)**, derived
  by the method that produced `brand-on-dark`: hold the hue (3.4°) and the
  saturation (48%), lift the lightness until it clears the floor. It is marked
  a theme-author value, because the book prices no dark variant and brick's
  only production user ships no dark theme.
- `components.button-danger` therefore reads brick. Its label went from 5.47:1
  to **6.06:1** — the brand-book red is the better contrast as well as the
  better meaning.

### On the earlier decision this reverses
1.4.0 pointed error at the brand reds, arguing a second red would ask the
reader to tell two reds apart. Two things undid that:

- **Brick is not a second red anyone has to learn.** It is already in the brand
  book and already on screen in a TEBIN app.
- **The measurement that seemed to support the old reasoning was the wrong
  instrument.** A WCAG ratio between two colours measures a lightness
  difference, so it reads ~1.1 for brick against the signal red — and also ~1.1
  for *green* against the signal red. It says nothing about whether two hues are
  distinguishable. Brick separates from the signal red by saturation, 48%
  against 77%.

## 1.4.0 — 2026-08-27

Component tokens, after the reason for deferring them turned out to be wrong.

The recorded blocker was "no canonical button exists across the TEBIN apps".
Measuring settled it: `tebin-expenses` carries a reasoned button system in its
global stylesheet, commented with the decision itself — *the everyday action is
ink, not red; red is the colour of commitment.* `cv-astro` has the same shape
in a page-scoped copy. What tebin.pro has is not a variant of that button at
all but a different component: a square, uppercase, bordered editorial CTA.

So the answer was not one component with variants. It was two.

### Added
- A `components` group on `tebin`: `button-primary`, `button-commit`,
  `button-quiet`, `button-danger`, their hover variants, and `cta` with its own
  hover. Every colour is a reference; no component states a literal.
- `button-commit` exists because red carries meaning here. It is for submitting,
  publishing, sending — never a casual action. `button-primary` is ink.
- **The lint now measures a label against its own button.** This is the one
  contrast pair that needs no naming convention, because the component states
  both halves. A variant that overrides only the background inherits the base
  label colour, which is the pair a reader actually sees. All eight components
  pass; `button-commit` sits at 4.7:1, just over the floor.
- A `## Components` table in the generated `DESIGN.md`, carrying each
  component's reason and not only its values.
- `components` in the front matter, in the format's own shape. References are
  rewritten onto the format's sections — `{role.x}` becomes `{colors.x}`,
  `{radius.x}` becomes `{rounded.x}` — and a colour with no section to point at
  is written out as a value.

### Note on the format
`borderColor` is not in the DESIGN.md property set, which names only
`backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`,
`height` and `width`. A quiet button *is* its border, so the token stays; the
format's own rule for an unknown component property is to accept it with a
warning.

## 1.3.0 — 2026-08-27

The design system can now check itself. Its own rules database says a policy
that lives only in prose is enforced only where somebody remembered it — and
every contrast figure this repository published lived in a `$description`
string that nothing verified.

### Added
- `surfaces` in `theme.json`: the binding surfaces as data. For `tebin` those
  are `#EFEEE9`, the darkest light surface in use, and `#242830`, the lightest
  dark one — the two numbers every `*-on-*` colour was measured against, and
  which until now existed only inside prose.
- `omitted` in `theme.json`: an absence with a reason. A declared gap stops
  looking like an oversight, and the lint stops warning about it.
- `pnpm lint:themes` and the `lint_theme` MCP tool. Pairs each role with a
  surface by naming rule, reports a ratio under 4.5:1 as an error and a broken
  `{reference}` as a warning — **and reports what it could not check**, because
  a silent skip reads as a pass.
- `diff_themes` and `src/diff.ts`: token-level added / removed / modified per
  group, each side's lint summary, and a `regression` flag set only when
  contrast errors increase. A removed token is often the point of a change.
- YAML front matter in every generated `DESIGN.md`, mapping roles, the type
  scale, spacing and radii onto the DESIGN.md format. Roles resolve to values;
  a fluid level contributes its ceiling.
- `design-md` as a `get_theme` format, returning the whole document.

### Removed
- `role.on-surface-muted` from `tebin-classic`. The lint caught it on its first
  run: it pointed at the brand book's grey `#898D8D`, which is **3.36:1 on
  white** — below the floor for small text. That is the brand-red mistake one
  level over, a colour to paint with used as a colour to read. The book prices
  no darker grey, so the theme has no secondary text colour and says so.

## 1.2.0 — 2026-08-27

### Added
- `type.label-sm` (9px), `type.label-md` (10px) and `type.label-lg` (11px) on
  `tebin`. Measured, not chosen: 1324 CSS rule blocks on tebin.pro set
  `text-transform: uppercase`, and they are two populations — 612 labels at a
  fixed size and 451 headings using `clamp()`, which `type.h*` already covers.
  Among the labels, 9, 10 and 11px cover 72%.
- Label sizes are fixed. A 9px label does not scale with the viewport.

### Not included
- A tracking token. The same measurement found 20 distinct `letter-spacing`
  values across the label population with no winner — the most common holds
  17% — so tracking is chosen per role, not per size. There is no scale to
  describe, and inventing one would dress a guess as a measurement.

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
