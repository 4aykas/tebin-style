# Developer guide

## Explicit contrast checks

Theme metadata can declare `contrastPairs`, a map of named pairs containing
`foreground` and `background`. Each value is an opaque hex colour or a token
reference such as `{color.brand}`. These additional checks use the normal-text
4.5:1 threshold; they do not replace the existing role/component checks.
Unresolved or translucent pairs produce warnings rather than assumed passes.

`lint_theme` returns `coverage.checked` (findings with a measured ratio) and
`coverage.unchecked` (all other findings, including unresolved references).
These are diagnostic counts, not a percentage of all possible UI states.
The Classic and Modern manifests include examples; MCP `get_theme` returns
the same declarations.


## Setup

You need **Node 22+** and **pnpm 11** (the exact pnpm version is pinned in `package.json`). The skill and the MCP server read generated
files, so build once after cloning.

```bash
git clone https://github.com/4aykas/tebin-style.git
cd tebin-style
pnpm install --frozen-lockfile
pnpm build
```

## Output formats

Each theme generates four token files and a colour CSV in `themes/<id>/dist/`.

| File | Use it when | How |
|------|-------------|-----|
| `tokens.css` | the project can load CSS | paste the `:root { … }` block into the global stylesheet, or import the file |
| `tailwind.css` | Tailwind v4 | paste the `@theme { … }` block into the file that has `@import "tailwindcss";` |
| `theme.ts` | React, CSS-in-JS, TypeScript | import the `as const` object and its type |
| `tokens.dtcg.json` | Figma plugins, Style Dictionary, other tooling | feed it to the tool that reads DTCG |

Pick one token format as the styling source for a target. The generated
`colors.csv` and design guide can accompany it. The JSON uses this repository's
DTCG-style subset; confirm compatibility with the receiving tool's token version.

`tokens.css` and `tailwind.css` carry transformed values: hex is lowercased,
font stacks are joined, and fluid values become `clamp()`. `tokens.dtcg.json`
and `theme.ts` carry the source values.

The DTCG export retains `$description` and `$extensions`, including print
references and fluid ranges. TypeScript resolves aliases to literal values
and exposes fluid ceilings rather than CSS `clamp()` expressions.

### Tailwind v4 utilities

The generated theme keeps existing custom property names and adds
[Tailwind utility namespaces](https://tailwindcss.com/docs/theme):

| Source token | Utility variable | Example class |
|---|---|---|
| `role.surface` | `--color-role-surface` | `bg-role-surface` |
| `role.on-surface` | `--color-role-on-surface` | `text-role-on-surface` |
| `type.h1` | `--text-h1` | `text-h1` |
| `lineHeight.body` | `--leading-body` | `leading-body` |

Typography and spacing tokens exist only in themes that define them. Importing
the theme does not load fonts or provide ready-made accessible components.

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
and large text. Small red text in Modern takes `role.primary-on-dark` or
`role.primary-on-light`. Classic instead uses its own `role.primary` on white;
its identity red measures about 4.87:1 there.

Status text is separate again: `role.error-*`, `role.warning-*` and
`role.success-*`. The error red is `brick`, not the signal red, so an error
does not read as a call to action.

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

`pnpm lint:themes` checks references throughout the token tree and measures every role that a naming rule can pair with a
surface, using the `surfaces` block in `theme.json` — the darkest light
surface and the lightest dark surface actually in use. A role under 4.5:1 is
an error; a broken `{reference}` is a warning. Both errors and warnings fail
this command. Ratios are compared before rounding, so 4.499:1 fails 4.5:1.

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
source SVG's sha256 plus the size ladder, background colour and clear space — so a different resvg build cannot
fail CI for its own reasons.

## Scripts

```bash
pnpm verify     # types, validation, lint, drift and tests; used by CI/releases
pnpm typecheck  # TypeScript, including the MCP server
pnpm validate   # JSON Schema and integrity checks
pnpm build      # generate everything listed above
pnpm check      # fail if a generated file drifts from its source
pnpm lint:themes # fail on a contrast error or a broken token reference
pnpm test       # run the test suite, including an actual MCP connection
pnpm pack:brand # build .tmp/tebin-brand-pack.zip from generated files
pnpm audit     # check current dependency advisories (requires the registry)
```

CI verifies and packs on Linux and Windows. Dependency audit is separate from
the deterministic checks because its results depend on current registry data.
After dependency updates, rebuild and inspect output changes before accepting
them. Style Dictionary 5 needs the local shorthand transform to preserve
multi-value padding tokens such as `14px 28px`.
