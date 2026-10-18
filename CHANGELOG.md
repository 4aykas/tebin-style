# Changelog

## Unreleased

### Themes
- New theme `fleet` (FleetView 1.0.0), the look of TEBIN's server console,
  taken from its dashboard stylesheet: a slate palette, roles for state text
  and state fills, one green accent, Geist and Geist Mono, a six-step type
  scale with a 12px floor, spacing, radii, shadows, button and input
  components, and the console's own invader as mark, app tile and favicon.
  Dark is the default; light is a mode. Every text pair reaches 4.5:1 in
  both. Seven web rules for `fleet`: state colour only on the finding, one
  accent per view, state text versus fill, quiet destructive controls in
  lists, status as a flat edge, mono for machine values, six sizes. Left
  out: the product's glossary and page layout, which describe the product,
  not its look.

### Formats
- Themes can have modes. `mode.<name>` repeats a token's path with that
  mode's value; `tokens.css` and `tailwind.css` add a
  `:root[data-theme="<name>"]` block per mode, `shadcn.json` fills `dark`
  for a theme with a dark mode, DESIGN.md gains a Modes table, and the
  registry lists `modes`. Lint measures contrast in every mode and fails an
  override with no default; a finding a mode does not change is reported
  once. In `tailwind.css`, whose values are resolved, a mode block also
  redefines every token that follows an overridden one, such as a button
  built on `role.primary`; `theme.ts` does the same under `mode.<name>`.
  In `shadcn.json`, `dark` takes `error-on-dark` where a theme has one.
- The brand pack carries `shadcn.json`, which its `llms.txt` and skill name.
- `check_image` refuses a PNG whose pixel data inflates past its header's
  size, instead of inflating a small file into gigabytes.
- A theme without `color.brand`, `ink` or `topbar` shows `role.primary`,
  `on-surface` and `surface` as its registry preview.
- DESIGN.md names Arial for Office only for a theme whose font stacks fall
  back to Arial; `slate` no longer claims it.

### Repository
- The Gitea repo lives in the public `tebin-oss` organisation:
  `git.tebin.co/tebin-oss/tebin-style`. The old `TEBIN/tebin-style` path
  redirects; `TEBIN` is visible only to signed-in users.
- A project hook, `.claude/hooks/mirror-guard.mjs`, denies `gh pr`,
  `gh issue` and `git push github`, which would land on the mirror.
- Gitea `main` takes changes only through a pull request with a green
  `CI / verify`, as GitHub's did. `scripts/gitea-api.mjs` gains `pr` and
  `merge`, and retries only reads, never a POST that may have landed. A
  `pre-push` hook (`.githooks`, set by `pnpm install` inside a git checkout,
  unless another hooks path is set) runs `pnpm verify` on a branch push; a
  tag-only push skips it.
- `scripts/release.mjs <version> --reviewed` cuts a release: changelog and
  version, build and verify, a PR with green CI, the merge, the tag, then both
  release runs.
- `CODING_STANDARDS.md`: a rule or `tebin` value agrees with the decisions
  recorded for tebin.pro; the release review runs against it.
- Tests read the generated files back: none may carry `[object Object]`,
  `undefined`, `NaN` or a CSS variable it uses but never defines, and a
  theme with modes must resolve to the same value in `tailwind.css` and
  `tokens.css` in every mode. `pnpm verify` prints about a third as much:
  Style Dictionary logs no line per file (its warnings now fail the build),
  and passing tests print no stdout. A code PR is reviewed before it merges.
- `CONTRIBUTING.md` is a full checklist for a new theme: intro, sources,
  contrast pairs, modes, theme rules and the three lists that name every
  theme. A test checks that `llms.txt` counts and names every theme. Rule
  tests no longer pin the number of rules.

### Lint
- `tebin` and `tebin-classic` gain `sources.json`: every token's value and
  its source. Lint fails a token with no entry, a changed value and a stale
  entry. The baseline is the theme's own premise (tebin.pro as built; the
  2017 brand book); `color.grey` names #91, and the `motion` group is
  `proposal`, listed as unconfirmed until checked against tebin.pro.
- A contrast pair can set `min`: 3 for a non-text edge or icon (WCAG
  1.4.11), 7 for AAA text; 4.5 stays the default. `fleet` now measures its
  control edges against the page and the raised surface at 3:1 in both modes,
  instead of listing that check as omitted. Lint refuses any other `min`, a
  role a pair measures is no longer called unchecked, and `diff_themes`
  calls a lowered floor a regression.
- `pnpm lint:themes` counts roles with no surface pairing rule in one line
  per theme, each role once across modes; `--verbose` lists them. Other
  unchecked findings still print.

## 1.12.2 — 2026-10-18

### Repository
- The repo moves to Gitea, `git.tebin.co/TEBIN/tebin-style` (public), for
  pull requests, issues, CI and releases. GitHub `4aykas/tebin-style` stays
  as a push mirror, so raw URLs, the plugin marketplace and the GitHub
  release keep working. CI runs Linux on Gitea and Windows on GitHub. A tag
  makes two releases: Gitea's, and GitHub's with build provenance.
  Dependabot is removed: its pull requests would land on the mirror.

## 1.12.1 — 2026-10-17

### Rules
- `layout-reserve-state-space` no longer asks for an error slot held under
  every field. A field's error line may open below it when it appears only
  after blur. This follows the tebin.pro contact form: a standing slot under
  three of seven fields broke the row rhythm. Buttons, counters and check
  marks still keep their size from the first paint.

## 1.12.0 — 2026-10-17

### Assets (tebin)
- The logo, corner mark and corner outline are redrawn in the brand book's
  screen colours, `#DA291C` and `#898D8D` (#91). They were `#EE3124`,
  `#808285` and `#EE3425`, print-to-screen conversions that sat ΔE 4.8 away
  from the theme's own red. The shapes are unchanged and now match the Classic
  logo exactly. PNGs are regenerated.

### Tokens (tebin)
- New `color.grey` `#898D8D` (Pantone 423 C), the IN of the wordmark. A colour
  to paint with, not a text colour.
- `font.mono` removed. tebin.pro dropped its monospace voice on 2026-10-07:
  the 97 rules that asked for JetBrains Mono (never shipped, rendered as
  Courier New) now use Roboto Condensed at 11px or more. `font.sans` and
  `font.condensed` descriptions no longer claim the site loads no webfont.
- New `motion` group (theme 1.8.0): durations `fast` 120ms, `base` 200ms and
  `slow` 300ms; easing `enter`, `exit` and `linear` (`cubicBezier`); springs
  `ui` and `panel` as stiffness, damping and mass. Every curve and spring
  settles without overshoot. Values follow interior.dev, a reviewed set of
  React micro-interactions.

### Formats
- Web themes ship `dist/shadcn.json`, a shadcn/ui `registry:theme` item:
  `npx shadcn@latest add <raw URL>`. It sets only the variables a token
  answers. `primary` is the everyday button, so on `tebin` it is ink, not red.
  MCP `get_theme` serves it as format `shadcn`. `theme.json` gains `media`
  (`web`, `document`, `print`) to say which themes are web themes.
- New `llms-full.txt`: `llms.txt`, every theme's DESIGN.md and all rules in
  one file. `pnpm check` fails when it is stale.
- Tailwind output adds the `--ease-*` namespace, so `ease-enter` works.
- `DESIGN.md` gains a Motion section where a theme has motion tokens.

### Docs
- `llms.txt` and the agent guide list all eight MCP tools; `check_image` was
  missing from both. New `test/doc-lists.test.ts` holds the generated-file
  lists, the format lists and the tool lists in the docs to the code.
- New `CODING_STANDARDS.md` for review: brand values name a source,
  borrowing reviews record what they left, rules state the target.

### Lint
- A motion token that overshoots is an error: a curve with a y control point
  outside 0..1, or a spring with a damping ratio below 1.

### Rules
- `performance-webfont-policy` now states what tebin.pro ships: self-hosted
  Roboto and Roboto Condensed at 400 and 700 only, plus Cormorant Garamond
  italic on about-us. The old text said the site loads no webfont, which has
  not been true since 2026-06; weights 300 and 500 were dropped in 2026-10
  after a measurement over the built site.
- New `content-no-invented-claims` (NEVER, every theme and medium): branded
  material carries only copy the user supplied or a source states (#89).
- Six new web rules from a review of interior.dev:
  `interactions-gesture-cancel`, `interactions-aria-disabled`,
  `feedback-live-settled`, `animation-disclosure-opacity-first`,
  `layout-reserve-state-space` and, for `tebin`, `animation-motion-tokens`.
  Left out: interior's "accent marks what is yours" rule. On `tebin` red is
  the identity and commit colour and ink the everyday button, so the rule
  would contradict the theme.
- `forms-loading-button` allows a short state label ("Saving…") when the
  button already reserves the width of its longest state. Spinner beside the
  label stays the default.
- `animation-reduced-motion` says what the reduced variant keeps: the new
  state arrives at once and in full. Only the travel is dropped.

### MCP server
- New tool `check_image` (#90): compares a local PNG's main colours with a
  theme's palette by CIEDE2000 and counts those over a threshold (default 10).
  It decodes PNG itself, so the bundle gains no dependency. JPEG and
  interlaced PNG are refused by name.

### Skill
- The skill states that it applies a brand and never redesigns it (#89).
- `references/formats.md` covers Word, PowerPoint and Excel files built with
  python-docx, python-pptx and openpyxl: colours, Arial and the logo PNG.

## 1.11.0 — 2026-10-02

### Breaking for MCP clients
- `get_theme` returns a JSON metadata block, then the raw file as a second
  text block.
- `list_themes` no longer includes asset lists; `get_asset` has them.

### MCP server
- Ship the server as a committed esbuild bundle, `mcp/dist/server.mjs`. It
  runs with Node 22 alone, without a dev install; `pnpm check` fails when it is stale.
- `get_asset` inlines SVG and PNG up to 200 KB. Larger files and other
  binaries come back as a `resource_link`. The index records each asset's `bytes`.
- Every tool has a title, described parameters and enums for theme ids,
  industries, moods and categories. Unknown values fail with the valid ones named.
- Tools return compact JSON, and `structuredContent` with an `outputSchema`.

### Plugin and skill
- The repo is the `tebin` plugin marketplace: `/plugin marketplace add
  4aykas/tebin-style`, then `/plugin install tebin-style@tebin`.
- Move `skill/` to `skills/`. The release attaches the skill as its own ZIP
  for claude.ai upload. The brand pack now carries `skills/`, `llms.txt` and the index.
- Fix contradictions in `llms.txt` and SKILL.md: real contrast ratios for
  `#DA291C`, all seven MCP tools, the Classic-only vector note.

### Fixed
- `diff_themes` reports a pair that lost its contrast check as `unchecked`
  and a regression, not as resolved.
- DESIGN.md front matter is safe YAML: strings are quoted and escaped; token
  references are resolved.
- `padSvg` keeps root attributes and reads a single-quoted `viewBox`.
- Validation rejects unsafe theme SVGs (`<image>`, `<script>`, external
  `href`, DOCTYPE). Preview and table text is escaped.

### Hardening
- Pin every action by SHA, let Dependabot update them, and run CI with a
  read-only token.
- Split the release into a read-only build and a publish job that runs no
  repo code. The tag must be on `main`; ZIPs get SHA-256 files and provenance.
- `tsconfig` enables `noUncheckedIndexedAccess`.

### Dependencies and packaging
- The package is private; npm publishing stays dropped.
- MCP SDK 1.31.0, Style Dictionary 5.5.5, tsx 4.23.15; `yaml` added for tests.
- `pnpm build` keeps the index `generatedAt` date when nothing else changed.
- Dependabot updates GitHub Actions only. npm updates are manual, because the
  MCP bundle must be rebuilt; AGENTS.md lists the steps.

## 1.10.0 — 2026-09-17

- Add explicit opaque foreground/background `contrastPairs` to theme metadata,
  expose them through MCP, and report measured/unmeasured finding counts.
- Add reviewed reference candidates: a Classic report, three presentation
  layouts and a Modern form with validation and keyboard states. Brand approval
  and live cross-model evaluation are still pending; see examples/README.md.
- Include reference files and their guidance in the downloadable brand pack.

## 1.9.0 — 2026-09-17

- Detect introduced and worsened lint errors individually in `diff_themes`,
  including replacement failures with unchanged totals. Expose introduced,
  resolved and worsened findings while retaining existing summary fields.
- Align the package/MCP release version and reject mismatched release tags.
  Theme versions remain independent from the tooling release version.

### Second audit pass
- Upgrade Style Dictionary to 5.5.2, Vitest to 3.2.7 and the MCP SDK to 1.30.0;
  refresh transitive dependencies. Registry audit on 2026-09-06: 32 reported
  advisories before the update, zero after it. Preserve CSS padding shorthands
  explicitly across the Style Dictionary major upgrade.
- Add rule scopes (`themes`, `media`) and MCP filters (`theme`, `medium`).
  Slate no longer inherits TEBIN logo rules; Classic no longer inherits Modern
  typography rules. Clarify which logo belongs on a white backing rectangle.
- Validate CMYK bounds, fluid-range consistency, duplicate ids and asset paths;
  report malformed metadata without aborting validation.
- Preserve per-asset licence overrides in the index, generated PNG entries and MCP.
- Configure Linux and Windows CI verification and brand-pack creation.

### Fixed
- Preserve descriptions and print/fluid extensions in DTCG exports; compare
  token types and extensions as well as values in theme diffs.
- Generate Tailwind utility namespaces for semantic colours, type and leading,
  while retaining the existing custom properties.
- Compare full-precision contrast ratios and check references outside roles.
  The lint command now fails on warnings as documented.
- Track PNG background and clear-space settings, detect missing palette PNGs,
  and remove obsolete generated PNGs when their source assets are removed.
- Reject invalid theme ids and asset paths; resolve filesystem boundaries.
- Type-check the MCP server, declare Node types, and require Node 22+ to match pnpm 11.

### Improved
- Add shared ChatGPT, Gemini and Claude chat instructions, explicit Gemini CLI
  MCP setup, and a repeatable cross-client acceptance task; include the new guide
  in the brand pack. Clarify offline artwork and local versus hosted MCP access.
- MCP reports the package version, advertises read-only tools, searches theme
  descriptions/tags and exposes `colors-csv`, surfaces and documented omissions.
- **MCP PNG response change:** `get_asset` now returns an image content block
  plus metadata instead of a base64 string inside JSON text. Direct `getAsset`
  helper calls still return base64. SVG and other binary responses are unchanged.
- One `pnpm verify` command runs CI/release checks. Tests exercise real MCP
  stdio connections and actual Tailwind utility compilation.
- Public README centres Modern and Classic; guides distinguish print assets
  from press-ready output and document direct Node MCP startup.
- Brand ZIPs include the TypeScript export, README and user guides; the Windows
  pack fallback handles paths through environment variables.

See the [audit and remaining design work](docs/audits/2026-09-06-design-system.md).

## 1.8.0 — 2026-09-06

### Added
- **`font.mono` on `tebin`** — `JetBrains Mono, Courier New, monospace`. An
  audit of tebin.pro against this registry found a third type voice the
  registry did not know about: 58 rule blocks set a monospace face for tags,
  kickers, specification lists and the Tier-classification figure, nearly all
  at 9–12px uppercase. A consumer building from the theme could not reproduce
  those surfaces, and a reviewer reading the theme would call them off-brand.

  Recorded as it ships, with a description that says what it costs: no webfont
  loads, so the face visitors actually see is Courier New — the thinnest and
  worst-rendering of the site's three voices at that size. Whether the mono
  voice stays is the owner's call; the token makes the question visible instead
  of leaving the answer implicit in 58 stylesheets.

### Noted, not changed
- The same audit found `color.charcoal` (`#242424`, `role.surface-inverse`)
  is not painted anywhere on tebin.pro. The dark bands use `#0a0a0a`, `#111318`,
  `#1C202A` and `#242830` — the last being the declared binding surface. The
  token describes a surface the site does not have. Changing a value is outside
  this repository's own constraint (nothing renamed, no value changed without
  the owner), so this is a recorded contradiction awaiting a decision, not a fix.
- Theme version `tebin` 1.6.0 → 1.7.0.

## 1.7.0 — 2026-08-27

### Added
- **`llms.txt` now carries the vector source inline** — the wordmark and the
  corner mark, in both colourways, quoted verbatim in fenced `svg` blocks.

  Field report, one release after `brand-logo-never-typeset` shipped: the rule
  worked. Handed the repository link and asked to brand a spreadsheet, the
  agent correctly refused to redraw the logo — and then could not proceed,
  because its host has no network and rejects a raw link
  (`url_not_accessible`). The rule turned a silent wrong answer into an honest
  stop, which is better, but the agent was still stuck.

  Inlining the source removes the fetch. The four marks are 2.8 KB together, so
  an agent that can write SVG now has the real geometry rather than its
  impression of it, and the ban on drawing stops being a dead end.

  A test asserts each block is byte-identical to the file it quotes — verified
  by changing one hex digit and watching it fail. A copy that can drift from
  its original is worse than a link.

  This does not help Word, Excel or PowerPoint, which cannot embed SVG at all.
  There a person still has to hand over a PNG, and the guides say so.
- A fourth access mode in the agent skill: **no network at all**. It listed
  MCP, a local clone and a raw fetch, and assumed one of them would work.

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
