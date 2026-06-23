---
name: tebin-style
description: >
  Use when the user wants to apply, borrow, or reuse a ready-made visual theme
  / brand kit (color palette, typography, spacing, shadows, logos) in a
  project. Triggers: "use the TEBIN theme", "apply a brand kit", "give me an
  industrial palette", "theme this project like X", "borrow styles".
---

# tebin-style — applying a theme from the registry

This skill applies a stored theme (design tokens + brand assets) to the current
project. The registry is a set of static files; this skill only reads them.

## Workflow

1. **Discover.** Read `registry/index.json`. List or filter themes by
   `industry`, `mood`, or name. For a vague request ("something industrial"),
   show 2–3 candidates with their `preview` colors and ask the user to pick.
2. **Inspect.** Open the chosen theme's `themes/<id>/README.md` and
   `themes/<id>/theme.json` — note metadata and the `license` of tokens and
   assets. If an asset license is restricted, warn the user before copying.
3. **Detect target.** Inspect the current project's stack and choose a format:
   - Tailwind v4 (`@theme` / `@import "tailwindcss"`) → `dist/tailwind.css`
   - plain CSS → `dist/tokens.css`
   - React / CSS-in-JS / needs types → `dist/theme.ts`
   - other tooling (Figma, Style Dictionary) → `dist/tokens.dtcg.json`
4. **Apply tokens.** Insert the chosen `dist/*` into the target, following the
   target project's existing patterns (e.g. paste the `@theme` block into the
   main stylesheet, or import `theme.ts`).
5. **Apply assets.** For each entry in `theme.json.assets`, either copy the file
   into the target (`public/`, `assets/`) or give the user the `rawUrl` from
   `registry/index.json` to download — ask which they want.
6. **Verify.** Report which theme and version were applied, which token block
   and asset files were added, and any license caveats.

## Reading the registry

- With a local clone (skill installed as a plugin): read files from disk.
- Without a clone: fetch from `raw.githubusercontent.com/OWNER/tebin-style/main/...`
  using the `rawUrl` fields in `registry/index.json`.
- Via MCP: if the `tebin-style` MCP server is registered, call its
  `list_themes` / `get_theme` / `get_asset` tools instead of reading files.

See `references/formats.md` for how to insert each output format, and
`references/licensing.md` for how to interpret the license fields.
