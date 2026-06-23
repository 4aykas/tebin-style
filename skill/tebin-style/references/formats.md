# Output formats

Each theme generates four files in `themes/<id>/dist/`:

| File | Use when target is | How to apply |
|------|--------------------|--------------|
| `tokens.css` | any project that can load CSS | paste the `:root { … }` block into the global stylesheet, or import the file |
| `tailwind.css` | Tailwind v4 | paste the `@theme { … }` block into the file that has `@import "tailwindcss";` |
| `theme.ts` | React / CSS-in-JS / TypeScript | import the exported `as const` object; use the exported type |
| `tokens.dtcg.json` | Figma plugins, Style Dictionary, other tooling | feed into the tool that consumes DTCG |

Prefer the format that matches the target's existing styling approach. Do not
mix formats in one project.

Note: `tokens.css` and `tailwind.css` carry the transformed values (hex
lowercased, font families joined into a CSS string). `tokens.dtcg.json` and
`theme.ts` keep the canonical source values (original hex case, font arrays).
