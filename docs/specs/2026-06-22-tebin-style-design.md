# tebin-style — Theme / Brand-Kit Registry (Design)

Status: Approved design (Phase 1 / MVP)
Date: 2026-06-22
Author: brainstormed with Claude

## 1. Summary

`tebin-style` is a standalone, public GitHub project: a **registry of reusable
visual themes (brand kits)** that an AI coding agent can browse and apply to a
new project. Each theme bundles **design tokens** (palette, typography,
spacing, radii, shadows), **brand assets** (vector logos, favicons, optional
fonts/images), and **metadata** (industry, mood, source, license).

The end vision is a platform combining (a) a token/theme database, (b) a design
rules/guidelines database, and (c) an automated extractor, delivered through a
Skill and/or an MCP server. That vision is **decomposed into phases**. This
spec covers **Phase 1 only**: the data foundation plus a thin Claude Skill.

### Phasing (for context; only Phase 1 is in scope here)

1. **Phase 1 (this spec):** schema + seed themes + a thin Skill that reads the
   registry. Delivers the core value — "agent borrows a style for a new
   project" — with zero hosting.
2. **Phase 2:** MCP server (`@modelcontextprotocol/sdk`) wrapping the same data
   and generator (`list_themes` / `get_theme` / `get_asset`).
3. **Phase 3:** design rules/guidelines database (a generalized `AGENTS.md`).
4. **Phase 4:** automated extractor (pull tokens from existing sites into the
   registry).

Out of scope for Phase 1: MCP server, rules database, automated extractor,
npm publishing, hosted CDN.

## 2. Goals and Non-Goals

### Goals

- A single source of truth per theme in the W3C **DTCG** token format.
- Generate four consumption formats from that canon: CSS variables, Tailwind v4
  `@theme`, normalized DTCG JSON, and a typed TS object.
- Co-locate brand assets with each theme and describe them in a manifest.
- A thin, well-documented Claude Skill that discovers, inspects, and applies a
  theme (tokens + assets) into a target project.
- First seed = the **TEBIN** brand, extracted once from the existing `tebin`
  project. The new project is otherwise fully independent of `tebin`.
- "Well documented": READMEs for the repo, the schema, and each theme, plus a
  contribution guide.

### Non-Goals

- No live/code coupling to the `tebin` repo — seed data is copied once.
- No runtime server in Phase 1.
- No third-party brand assets in Phase 1 (legally sensitive; see §9).

## 3. Location and Independence

```
C:\Users\maxudl\OneDrive - TEBIN\!_astro\
├─ tebin\          # existing site project (unchanged)
└─ tebin-style\    # THIS project — own git repo, public on GitHub as "tebin-style"
```

`tebin-style` is autonomous: own `package.json`, git history, CI. Nothing
imports from `tebin`; the only relationship is a one-time seed extraction.

## 4. Architecture and Repository Layout

```
tebin-style/
├─ README.md                  # what it is + quickstart (agents and humans)
├─ CONTRIBUTING.md            # how to add a theme
├─ LICENSE                    # MIT (code + tokens)
├─ package.json               # pnpm scripts: build, validate, test, check
├─ tsconfig.json
├─ schema/
│  ├─ theme.schema.json       # JSON Schema 2020-12: metadata + token rules
│  └─ README.md               # human docs for the schema
├─ themes/
│  └─ tebin/                  # first seed (own brand)
│     ├─ theme.json           # metadata + asset manifest
│     ├─ tokens.json          # canonical DTCG tokens (source of truth)
│     ├─ assets/              # brand materials (see §6)
│     ├─ dist/                # GENERATED, committed (see §7)
│     └─ README.md            # preview + usage for this theme
├─ registry/
│  └─ index.json             # GENERATED catalog of all themes
├─ scripts/
│  ├─ build.ts               # Style Dictionary: tokens.json -> dist/*
│  ├─ build-index.ts         # scan themes/ -> registry/index.json
│  └─ validate.ts            # validate each theme against schema + integrity
├─ skill/
│  └─ tebin-style/
│     ├─ SKILL.md            # the Claude skill instructions
│     └─ references/         # formats.md, licensing.md
├─ docs/specs/               # design docs (this file)
├─ .github/workflows/ci.yml  # validate + check + test on PR
└─ test/                     # vitest
```

### Data flow

1. Author adds/edits `themes/<id>/tokens.json` + `theme.json` + `assets/`.
2. `pnpm build` runs Style Dictionary to generate every `dist/*`, then
   `build-index` regenerates `registry/index.json`.
3. `pnpm validate` checks schema + asset existence + id uniqueness;
   `pnpm test` runs Vitest.
4. **Consumption:** the Skill reads `registry/index.json` to list/filter, then
   reads `themes/<id>/dist/<format>` and applies it into the target project,
   copying or linking assets as requested.

**Invariant:** `tokens.json` is the only hand-edited source. `dist/*` and
`registry/index.json` are always generated, never edited by hand. CI enforces
no drift between committed generated files and a fresh build.

## 5. Stack

- **Language/runtime:** TypeScript + Node, package manager **pnpm**.
- **Canonical token format:** W3C **DTCG** (`$type` / `$value`).
- **Generation:** **Style Dictionary** (DTCG → CSS/Tailwind/TS/JSON).
- **Validation:** JSON Schema 2020-12 (via `ajv`) + a custom integrity pass in
  `validate.ts` (asset existence, id uniqueness, theme-id == folder name).
- **Tests:** **Vitest**.
- **Delivery:** a Claude Skill (`SKILL.md` + `references/`), superpowers-style.

This stack carries directly into Phase 2: the MCP server is TS and wraps the
same data and generator.

## 6. Data Model

### 6.1 `theme.json` — metadata + asset manifest

```jsonc
{
  "$schema": "../../schema/theme.schema.json",
  "id": "tebin",                       // kebab-case, unique, == folder name
  "name": "TEBIN",
  "description": "Industrial design-and-engineering brand: condensed type, signal red.",
  "version": "1.0.0",                  // semver of the theme
  "industry": ["engineering", "industrial", "b2b"],
  "mood": ["bold", "technical", "high-contrast"],
  "source": { "url": "https://tebin.pro", "extractedBy": "manual" },
  "license": { "tokens": "MIT", "assets": "© TEBIN — all rights reserved" },
  "author": "TEBIN",
  "createdAt": "2026-06-22",
  "updatedAt": "2026-06-22",
  "assets": [
    { "id": "logo-full", "type": "logo", "variant": "full", "format": "svg",
      "path": "assets/logo/logo-full.svg" },
    { "id": "logo-mono", "type": "logo", "variant": "mono-black", "format": "svg",
      "path": "assets/logo/logo-mono-black.svg" },
    { "id": "favicon", "type": "favicon", "format": "svg",
      "path": "assets/favicon/favicon.svg" }
  ]
}
```

`assets[].type` ∈ `logo | favicon | font | icon | pattern | image`.

### 6.2 `tokens.json` — canonical DTCG tokens

```jsonc
{
  "color": {
    "brand":      { "$type": "color", "$value": "#DA291C" },
    "brand-dark": { "$type": "color", "$value": "#B82217" },
    "charcoal":   { "$type": "color", "$value": "#242424" },
    "ink":        { "$type": "color", "$value": "#292929" },
    "muted":      { "$type": "color", "$value": "#666666" },
    "topbar":     { "$type": "color", "$value": "#F9F9F9" },
    "subtle":     { "$type": "color", "$value": "#C1C1C1" },
    "rule":       { "$type": "color", "$value": "#ECECEC" }
  },
  "font": {
    "sans":      { "$type": "fontFamily", "$value": ["Roboto", "Helvetica", "Arial", "sans-serif"] },
    "condensed": { "$type": "fontFamily", "$value": ["Roboto Condensed", "Roboto", "sans-serif"] }
  },
  "radius": {
    "panel":   { "$type": "dimension", "$value": "2px" },
    "control": { "$type": "dimension", "$value": "4px" },
    "card":    { "$type": "dimension", "$value": "8px" }
  }
}
```

Spacing, font sizes, and shadows follow the same DTCG pattern and are added as
the seed is filled in. Container/section scales from the source `@theme` may be
added as `dimension` tokens (optional for MVP).

### 6.3 Validation rules (`schema/theme.schema.json` + `validate.ts`)

- `theme.json`: required `id` (kebab-case, equals folder name), `name`,
  `version` (semver), `license`; `assets[].type` in the enum; every
  `assets[].path` must exist on disk.
- `tokens.json`: valid DTCG — each leaf has `$type` ∈ {color, fontFamily,
  dimension, shadow, …} and `$value`; colors are valid hex/rgb; dimensions
  carry units.
- Integrity: theme `id` unique across the registry; generated files do not
  drift from a fresh build.

## 7. Generation Pipeline and Output Formats

`scripts/build.ts` reads `themes/*/tokens.json` and emits `dist/` per theme.

1. **`dist/tokens.css`** — framework-agnostic CSS custom properties on `:root`.
2. **`dist/tailwind.css`** — a Tailwind v4 `@theme { … }` block (matches how the
   `tebin` project consumes tokens).
3. **`dist/tokens.dtcg.json`** — normalized DTCG (references resolved) for
   Figma / Style Dictionary / other tools.
4. **`dist/theme.ts`** — a typed `as const` object plus an exported type, for
   React / CSS-in-JS.

`scripts/build-index.ts` writes `registry/index.json`:

```jsonc
{
  "generatedAt": "2026-06-22",
  "count": 1,
  "themes": [
    {
      "id": "tebin", "name": "TEBIN", "version": "1.0.0",
      "industry": ["engineering","industrial","b2b"], "mood": ["bold","technical"],
      "preview": { "brand": "#DA291C", "ink": "#292929", "topbar": "#F9F9F9" },
      "formats": {
        "css": "themes/tebin/dist/tokens.css",
        "tailwind": "themes/tebin/dist/tailwind.css",
        "dtcg": "themes/tebin/dist/tokens.dtcg.json",
        "ts": "themes/tebin/dist/theme.ts"
      },
      "assets": [
        { "id": "logo-full", "type": "logo",
          "path": "themes/tebin/assets/logo/logo-full.svg",
          "rawUrl": "https://raw.githubusercontent.com/<owner>/tebin-style/main/themes/tebin/assets/logo/logo-full.svg" }
      ]
    }
  ]
}
```

### Scripts (`package.json`)

- `pnpm build` — generate all `dist/*` + `registry/index.json`.
- `pnpm validate` — JSON Schema + asset existence + id uniqueness.
- `pnpm test` — Vitest.
- `pnpm check` — `validate`, then build into a temp dir and diff against the
  committed output (drift detector for CI).

### CI (`.github/workflows/ci.yml`)

On every PR: `pnpm validate && pnpm check && pnpm test`.

## 8. The Skill (`skill/tebin-style/SKILL.md`)

Thin: it only reads registry files; it hosts nothing.

Frontmatter:

```yaml
---
name: tebin-style
description: >
  Use when the user wants to apply, borrow, or reuse a ready-made visual theme
  / brand kit (color palette, typography, spacing, shadows, logos) in a
  project. Triggers: "use the TEBIN theme", "apply a brand kit", "give me an
  industrial palette", "theme this project like X", "borrow styles".
---
```

Workflow encoded in `SKILL.md`:

1. **Discover** — read `registry/index.json`; filter by `industry` / `mood` /
   name; for vague requests, show 2–3 candidates with preview colors.
2. **Inspect** — open the chosen theme's `README.md` + `theme.json` (metadata,
   assets, license). Warn before copying assets with a restricted license.
3. **Detect target** — inspect the target project's stack (Tailwind? Astro?
   React?) and pick a format: Tailwind v4 → `dist/tailwind.css`; plain CSS →
   `dist/tokens.css`; React/CSS-in-JS → `dist/theme.ts`; other tooling →
   `dist/tokens.dtcg.json`.
4. **Apply tokens** — insert the chosen `dist/*` into the target, following the
   target project's existing patterns.
5. **Apply assets** — per `assets[]`, either copy files into the target
   (`public/`, `assets/`) or return the raw URL for download, as requested.
6. **Verify** — report which theme/version was applied, which tokens/files were
   added, and any license caveats.

`references/` (loaded on demand): `formats.md` (when to pick which output and
how to insert it) and `licensing.md` (how to interpret the license field).

Consumption for MVP: the agent reads files from a **local clone** of the repo
(installed as a Claude plugin/skill) or fetches `raw.githubusercontent.com`
when working without a clone. No server.

## 9. Seed Extraction from TEBIN (one-time)

Source files in the existing `tebin` project:

- **Tokens** — `src/styles/global.css`, the `@theme` block: palette (brand,
  brand-dark, charcoal, ink, muted, topbar, subtle, rule), fonts (sans,
  condensed), and the `--radius-*` values. Translate manually into DTCG in
  `themes/tebin/tokens.json`.
- **Assets** — from `tebin/public/`: `tebin.svg` → `assets/logo/logo-full.svg`;
  `favicon.svg` / `favicon.png` / `favicon.ico` → `assets/favicon/`;
  `fxptebin.png` → `assets/misc/`; `corner_outline.svg` → `assets/misc/` (or a
  logo variant if appropriate).

After extraction the seed is self-contained; `tebin-style` never reads `tebin`
again.

## 10. Licensing

- Repo code and tokens: **MIT** (`LICENSE`).
- Assets: per-record `license` field. TEBIN assets are "© TEBIN".
- Third-party brands (future phases): store references/URLs only, or require an
  explicit license; documented in `references/licensing.md`. Not in Phase 1.

## 11. Documentation Deliverables

- `README.md` — purpose; quickstart for agents (how the Skill finds/applies a
  theme) and humans (how to download a logo or token file); a table of
  available themes.
- `CONTRIBUTING.md` — how to add a theme (folder structure, run
  `validate` + `build`, open a PR).
- `schema/README.md` — `theme.json` fields and token rules.
- `themes/<id>/README.md` — theme preview + asset links.
- `skill/tebin-style/SKILL.md` + `references/`.

## 12. Testing Strategy

Vitest covers:

- Schema validation of every theme.
- Existence of each `assets[].path`.
- `id` uniqueness and `id == folder name`.
- Generator snapshot tests: `tokens.json` input → expected `dist/*` output.
- `registry/index.json` integrity (matches the set of themes on disk).

## 13. Acceptance Criteria (Phase 1)

- `tebin-style` exists as an independent repo at the path in §3, public on
  GitHub.
- `themes/tebin/` contains a valid `theme.json`, DTCG `tokens.json`, real
  assets, generated `dist/*`, and a `README.md`.
- `pnpm validate && pnpm check && pnpm test` pass locally and in CI.
- The Skill can, from a clean target project, discover the TEBIN theme, apply
  tokens in the correct format for that project's stack, and place/link the
  logo assets.
- README, CONTRIBUTING, and schema docs are present and accurate.
