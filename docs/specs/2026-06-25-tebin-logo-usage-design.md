# TEBIN logo usage rules — design

Date: 2026-06-25
Status: approved (brainstorming)

## Problem

The TEBIN brand needs two logo-usage rules captured in the design-rules
database so agents and designers can look them up and apply them:

1. **White on dark/red.** On dark backgrounds, or on a saturated brand colour
   such as corporate red, the logo must become a single all-white monochrome
   mark — the corner mark *and* every letter white. The default two-color logo
   (red `TEB` + corner, grey `IN`) loses contrast on these backgrounds.
2. **Corner mark as decoration.** The corner mark is, in effect, a reduced
   version of the logo. It may stand alone as a decorative marker that signals
   TEBIN authorship — typically the top-right corner of a photo or slide.

## Scope and non-goals

- In scope: encode the two requirements as machine-readable rules, plus one
  `NEVER` counterpart for checkability; ship the white logo and solid
  corner-mark assets the rules reference; regenerate derived files; touch up
  the theme README.
- Non-goal: a runtime/pixel contrast linter that inspects backgrounds
  automatically. "Validation" in this repo means JSON-schema validation of
  `rules.json`, the digest drift-check, and surfacing rules through MCP
  (`list_rules` / `get_rule`) and `rules/dist/rules.md`. The rules are written
  so an agent or designer can apply and verify them; nothing measures contrast
  at render time.
- Non-goal: unrequested brand rules (clear-space, min-size, misuse gallery).

## Decisions (from brainstorming)

- **Placement:** a new `brand` category inside the shared `rules/rules.json`,
  consistent with the existing flat rule model. (Considered a theme-scoped
  rule block requiring schema/builder/MCP changes — rejected as too much work
  for two rules. The repo is already TEBIN-centric.)
- **Assets:** ship real files rather than rely only on CSS recolouring, because
  the rules reference a concrete white logo and a standalone corner mark.
- **Decorative corner shape:** the *solid* corner mark (identical to the mark
  inside `logo-full.svg`), not the existing outlined `corner-outline.svg`,
  which stays as a separate outlined variant.

## Assets to add (`themes/tebin/assets/`)

| File | id | type / variant | Purpose |
|---|---|---|---|
| `logo/logo-full-white.svg` | `logo-full-white` | logo / white | Copy of `logo-full.svg` with every path `fill:#fff` (corner + all letters white). For dark/red backgrounds. |
| `misc/corner-mark.svg` | `corner-mark` | pattern / solid | Solid corner mark extracted from the logo's `<g>`, brand red `#ee3124`, tight viewBox. Decorative marker. |
| `misc/corner-mark-white.svg` | `corner-mark-white` | pattern / white | Same shape, `fill:#fff`, for dark/red backgrounds. |

`corner-outline.svg` is unchanged.

Register all three in `themes/tebin/theme.json` `assets[]`. Regenerate
`registry/index.json` with the index builder (do not hand-edit) so each gets
its `rawUrl`.

## Rules to add (`rules/rules.json`, category `brand`)

All carry `source: "tebin brand"`.

1. `brand-logo-white-on-dark` — **MUST**
   > On dark or saturated brand-color (e.g. corporate red) backgrounds, use the
   > all-white monochrome logo — the corner mark and every letter white.

   rationale: the two-color logo loses the grey "IN" and puts red on red.
   tags: `["logo", "contrast", "color"]`

2. `brand-logo-no-color-on-dark` — **NEVER**
   > Never place the two-color (red/grey) logo on a dark or red background;
   > switch to the all-white logo instead.

   tags: `["logo", "contrast", "color"]`

3. `brand-corner-mark-decorative` — **SHOULD**
   > The corner mark may stand alone as a decorative marker signalling TEBIN
   > authorship — typically the top-right corner of a photo or slide. Keep it
   > brand red on light backgrounds and white on dark or red ones.

   tags: `["logo", "corner", "decoration"]`

## Pipeline and docs

- Regenerate `rules/dist/rules.md` (rules builder) — a new `## brand` section
  appears.
- Regenerate `registry/index.json` (index builder).
- Run `validate` (schema) and `check` (drift); both must be green.
- Update `themes/tebin/README.md`: mention the white logo + corner-mark assets
  and the brand logo-usage rules.

## Success criteria

- `list_rules({category:"brand"})` returns the three rules; `get_rule` resolves
  each id.
- `get_asset("tebin","logo-full-white")` / `"corner-mark"` /
  `"corner-mark-white"` return the new SVGs.
- `validate` and `check` pass with no drift.
- `rules/dist/rules.md` contains the `brand` section.
