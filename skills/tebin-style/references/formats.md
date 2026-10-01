# Output formats

Each theme generates four token files plus `colors.csv` in `themes/<id>/dist/`:

| File | Use when target is | How to apply |
|------|--------------------|--------------|
| `tokens.css` | any project that can load CSS | paste the `:root { … }` block into the global stylesheet, or import the file |
| `tailwind.css` | Tailwind v4 | paste the `@theme { … }` block into the file that has `@import "tailwindcss";` |
| `theme.ts` | React / CSS-in-JS / TypeScript | import the exported `as const` object; use the exported type |
| `tokens.dtcg.json` | Figma plugins, Style Dictionary, other tooling | feed into the tool that consumes DTCG |

Prefer the format that matches the target's existing styling approach. Do not
mix competing token sources in one target. The colour CSV and design guide can accompany any token format.

Note: `tokens.css` and `tailwind.css` carry the transformed values (hex
lowercased, font families joined into a CSS string). `tokens.dtcg.json` and
`theme.ts` keep the canonical source values (original hex case, font arrays).
DTCG retains descriptions and print/fluid extensions; TypeScript resolves
aliases and emits fluid ceilings.

Tailwind adds utility namespaces while keeping existing variables:
`type.h1` → `text-h1`, `role.surface` → `bg-role-surface`, and
`lineHeight.body` → `leading-body` when those tokens exist in the theme.
For Office and print colours, use `colors.csv` or MCP
`get_theme({ id, format: "colors-csv" })`.
