---
name: tebin-style
description: >
  Apply a stored brand theme — design tokens (colour, semantic roles, type,
  spacing, radii) and brand assets — to a project, or consult the design-rules
  database while building or reviewing UI. Use when the user names a theme or
  asks for a brand kit, or when the work needs UI, accessibility or design
  rules.
---

# tebin-style — applying a theme from the registry

The registry is a set of static files. This skill only reads them.

## Reach the registry first

Every step below depends on how you are reading. Pick one, once:

- **MCP** — if the `tebin-style` server is registered, call `list_themes`,
  `get_theme`, `get_asset`, `list_rules`, `get_rule`. Prefer this.
- **Local clone** — read the files from disk.
- **Neither** — fetch
  `https://raw.githubusercontent.com/4aykas/tebin-style/main/<path>`, or use the
  `rawUrl` fields already in `registry/index.json`.

## Apply a theme

1. **Discover.** Read `registry/index.json`. Filter by `industry`, `mood` or
   name. For a vague request ("something industrial"), offer 2–3 candidates
   with their preview colours and let the user pick. Done when one theme id is
   settled.
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
   and **PNG for documents and Office files** — Word, Excel, PowerPoint and
   libraries like openpyxl or python-docx cannot embed SVG. Ask the user
   whether to copy the file into the project or hand them the `rawUrl`.
   `references/licensing.md` governs what may be copied at all.
6. **Report.** Name the theme and version applied, the token block and asset
   files added, and the `license.assets` string verbatim for anything copied.

## Reach for a role, not a raw colour

Themes carry semantic roles that point at palette colours: `role.surface`,
`role.on-surface`, `role.outline`, `role.primary`. Style through the role, so
repointing a colour moves everything that names it.

Roles separate fills from text. `role.primary` paints the logo, fills, borders
and large text. **Small red text takes `role.primary-on-dark` or
`role.primary-on-light`** — one red cannot clear 4.5:1 on both a dark and a
light surface, because the luminance window is empty for any hue.

On `tebin`, `type.*` and `spacing.*` values are **ceilings**: the token's
`$value` is the top of a fluid range, and the CSS output carries the real
`clamp()`. Size display type against the locale with the longest words.

## Check before you claim it works

`lint_theme({ id })` measures contrast for every role a naming rule can pair
with a surface, and names what it could not reach. Run it after changing a
colour. `diff_themes({ a, b })` shows what moved between two themes and flags
a regression, which means only one thing: contrast errors went up.

## Design rules

While building or reviewing UI, consult the rules database for MUST / SHOULD /
NEVER guidance: `list_rules({ category?, severity?, tag?, query? })` and
`get_rule({ id })`, or read the digest at `rules/dist/rules.md`. Most rules
carry the reason they exist — quote it, not just the rule. When reviewing,
cite every `MUST` and `NEVER` the code violates.
