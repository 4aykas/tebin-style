# Developer guide

## Setup

You need **Node 18+** and **pnpm**. The skill and the MCP server read generated
files, so build once after cloning.

```bash
git clone https://github.com/4aykas/tebin-style.git
cd tebin-style
pnpm install
pnpm build
```

## Output formats

Each theme generates four token files in `themes/<id>/dist/`.

| File | Use it when | How |
|------|-------------|-----|
| `tokens.css` | the project can load CSS | paste the `:root { … }` block into the global stylesheet, or import the file |
| `tailwind.css` | Tailwind v4 | paste the `@theme { … }` block into the file that has `@import "tailwindcss";` |
| `theme.ts` | React, CSS-in-JS, TypeScript | import the `as const` object and its type |
| `tokens.dtcg.json` | Figma plugins, Style Dictionary, other tooling | feed it to the tool that reads DTCG |

Pick the one that matches how the project already styles things. Do not mix two
in one project.

`tokens.css` and `tailwind.css` carry transformed values: hex is lowercased,
font stacks are joined, and fluid values become `clamp()`. `tokens.dtcg.json`
and `theme.ts` carry the source values.

## Token groups

| Group | Holds |
|-------|-------|
| `color` | the palette |
| `role` | semantic names that point at palette colours |
| `type` | the typography scale |
| `lineHeight`, `fontWeight` | leading and weight |
| `spacing`, `layout` | the spacing scale and container widths |
| `radius` | corner radii |
| `font` | font stacks |

Not every theme has every group. `tebin` has all of them; `slate` and
`tebin-classic` carry colours, roles, fonts and radii.

### Roles are pointers

A role is an alias, not a copy:

```json
"role": { "surface": { "$type": "color", "$value": "{color.paper}" } }
```

In CSS it stays a reference, so repointing the colour moves every role that
names it:

```css
--role-surface: var(--color-paper);
```

`theme.ts` resolves roles to real colours, because a TypeScript consumer wants
a value. `tokens.dtcg.json` keeps the alias, because a reference is a
first-class DTCG value.

Roles separate fills from text. `role.primary` paints the logo, fills, borders
and large text. Small red text takes `role.primary-on-dark` or
`role.primary-on-light` — one red cannot clear 4.5:1 on both surface families.

### Fluid values

The type and spacing scales are fluid. `$value` holds the ceiling as plain
`px`, and the real range sits in an extension:

```json
"h1": {
  "$type": "dimension",
  "$value": "38px",
  "$extensions": { "pro.tebin.fluid": { "min": "28px", "pref": "4.5vw", "max": "38px" } }
}
```

The CSS build turns that into `clamp(28px, 4.5vw, 38px)`. Anything reading
`$value` alone gets `38px` and is not misled — the docs call it a ceiling.

The `vw` term is deliberate. Display type is sized against the locale with the
longest words: a range that fits English becomes an English-only cap, and
German compounds once overflowed the next column by 343px.

## Checking a theme

`pnpm lint:themes` measures every role that a naming rule can pair with a
surface, using the `surfaces` block in `theme.json` — the darkest light
surface and the lightest dark surface actually in use. A role under 4.5:1 is
an error; a broken `{reference}` is a warning.

It also prints what it could not check. A role no rule reaches is reported,
not skipped, because a checker that quietly covers half the palette reads as
"everything passes".

## Generated versus hand-edited

Hand-edited, per theme: `tokens.json` (the DTCG source), `theme.json`
(metadata and the asset list), `design.intro.md` (the prose opening of
`DESIGN.md`). Repository-wide: `rules/rules.json`.

Everything else is generated: `dist/*` including `colors.csv`, `assets/png/*`
and its `manifest.json`, `preview/palette.svg` and `.png`, `DESIGN.md`,
`registry/index.json`, `rules/dist/rules.md`. Edit the source, run the build,
commit both.

PNG bytes are never compared. Staleness comes from the raster manifest — the
source SVG's sha256 plus the size ladder — so a different resvg build cannot
fail CI for its own reasons.

## Scripts

```bash
pnpm validate   # JSON Schema and integrity checks
pnpm build      # generate everything listed above
pnpm check      # fail if a generated file drifts from its source
pnpm lint:themes # fail on a contrast error or a broken token reference
pnpm test       # run the test suite
```
