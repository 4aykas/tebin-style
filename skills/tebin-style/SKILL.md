---
name: tebin-style
description: >
  Applies TEBIN brand themes — design tokens (colour, semantic roles, type,
  spacing, radii), logos and design rules — to websites, apps, Word, Excel and
  PowerPoint documents, and print. Use when the user mentions TEBIN, a theme,
  a brand kit, DESIGN.md or logo placement, or when building or reviewing UI
  needs design or accessibility rules.
---

# tebin-style — applying a theme from the registry

The registry is a set of static files. This skill only reads them.

## Reach the registry first

Every step below depends on how you are reading. Pick one, once:

- **MCP** — prefer the `tebin-style` server when it is connected. Its seven
  read-only tools: `list_themes`, `get_theme` (tokens, or the whole guide with
  `format: "design-md"`), `get_asset`, `list_rules`, `get_rule`, `lint_theme`,
  `diff_themes`. Below they are written `tebin-style:<tool>`; Claude Code
  names them `mcp__plugin_tebin-style_tebin-style__<tool>` from the plugin
  and `mcp__tebin-style__<tool>` from a standalone server.
- **Local clone** — read the files from disk.
- **Neither** — fetch
  `https://raw.githubusercontent.com/4aykas/tebin-style/main/<path>`, or use the
  `rawUrl` fields already in `registry/index.json`.
- **No network at all** — read `llms.txt` (repository root or brand pack). It
  inlines only the Classic wordmark and corner mark, in both colourways. For a
  Modern deliverable, ask for the `tebin` files rather than substitute Classic. Never draw the mark yourself. If the document tool
  cannot embed SVG, render the vector to PNG or use an attached PNG.

## Apply a theme

1. **Discover.** Read `registry/index.json`. Filter by `industry`, `mood` or
   name. For a vague request ("something industrial"), offer 2–3 candidates
   with their preview colours if a choice is needed. An explicit TEBIN request
   normally means `tebin` for modern web/app work and `tebin-classic` for
   corporate documents and print. Preserve a theme the user already chose.
2. **Read its `DESIGN.md`.** `themes/<id>/DESIGN.md` is generated to be
   self-contained: palette with RGB and print values, semantic roles, the type
   and spacing scales, every asset, and the brand rules. Read it before
   `README.md` or `theme.json` — those add metadata, not guidance.
3. **Detect the target and pick one format.** Match how the project already
   styles things: Tailwind v4 → `dist/tailwind.css`; plain CSS →
   `dist/tokens.css`; React, CSS-in-JS or TypeScript → `dist/theme.ts`; Figma
   or Style Dictionary → `dist/tokens.dtcg.json`. One format per project.
   `references/formats.md` has the insertion detail for each.
4. **Apply the tokens.** Insert the chosen `dist/*` following the target's
   existing patterns. Done when the target builds and the tokens resolve.
5. **Apply the assets.** `registry/index.json` is a superset of
   `theme.json.assets`: it also carries every pre-rendered PNG, with ids like
   `logo-full@1024` and `corner-mark-white@512-on-brand`. Use SVG for the web
   and **PNG for broad document compatibility**, especially with libraries
   like openpyxl or python-docx. Use SVG when the target supports it. Copy assets into
   the requested deliverable when that is part of the task; use `rawUrl` for
   downloading. Follow any explicit preference about local files versus links.
   **Insert the file; never set the wordmark as text.** Its letters are drawn
   outlines, not a font, so typing the name produces different letterforms.
   `references/licensing.md` governs what may be copied at all.
6. **Report.** Name the theme and version applied, the token block and asset
   files added, and the `license.assets` string verbatim for anything copied.

## Reach for a role, not a raw colour

Themes carry semantic roles that point at palette colours: `role.surface`,
`role.on-surface`, `role.outline`, `role.primary`. Style through the role, so
repointing a colour moves everything that names it.

Roles separate fills from text. `role.primary` paints the logo, fills, borders
and large text. **Small red text takes `role.primary-on-dark` or
`role.primary-on-light`** where the theme defines them. On `tebin` they are
sized for its hardest surfaces, the cream band `#EFEEE9` and the dark panel
`#242830` (`theme.json` `surfaces`), so they also pass on `role.surface` and
`role.surface-inverse`. Classic uses `role.primary` on white (about 4.87:1);
do not invent missing Modern roles in Classic. Always measure against the
actual background; normal text needs at least 4.5:1 without rounding up.

**An error is not the signal red.** Error, warning and success text take
`role.error-*`, `role.warning-*` and `role.success-*`. Reaching for
`role.primary-on-light` to colour a validation message paints it in the brand
colour and makes every error read as a call to action.

On `tebin`, `type.*` and `spacing.*` values are **ceilings**: the token's
`$value` is the top of a fluid range, and the CSS output carries the real
`clamp()`. Size display type against the locale with the longest words.

## Check before you claim it works

`tebin-style:lint_theme({ id })` measures contrast for every role a naming
rule can pair with a surface, and names what it could not reach. Run it after
changing a colour; without MCP, run `pnpm lint:themes` in a clone. If neither
is available, say that contrast was not checked.

`tebin-style:diff_themes({ a, b })` shows what moved between two themes. It
flags a regression when a lint error is introduced or worsens, or a measured
pair loses its ratio, even if the total stays unchanged. Inspect introduced,
resolved, worsened and unchecked findings; the flag does not establish
compatibility or coverage of untested states.

## Design rules

While building or reviewing UI, consult the rules database for MUST / SHOULD /
NEVER guidance: `tebin-style:list_rules({ theme?, medium?, category?, severity?, tag?, query? })`
and `tebin-style:get_rule({ id })`, or read the digest at `rules/dist/rules.md`.
Most rules carry the reason they exist — quote it, not just the rule. When reviewing,
cite applicable `MUST` and `NEVER` rules the code violates. Pass the chosen
theme and medium (`web`, `document`, or `print`) so Modern website policy does
not leak into Classic documents or an unrelated brand. Unfiltered results are
the full catalogue, not a checklist to apply wholesale.
