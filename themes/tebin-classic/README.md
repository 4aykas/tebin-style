# TEBIN Classic theme

Faithful reproduction of the 2017 *TEBIN Branding Principles & Style Guide*
(Rev. A): Pantone red (`#DA291C`) + grey (`#898D8D`), Roboto type with an Arial
fallback for MS Office documents. The print-era corporate identity, distinct
from the modern web `tebin` theme.

## Tokens

Canonical source: [`tokens.json`](./tokens.json) (DTCG). Generated outputs in
[`dist/`](./dist): `tokens.css`, `tailwind.css`, `tokens.dtcg.json`, `theme.ts`.
Includes the primary red/grey, the 8-color secondary palette, and Roboto weights.

## Assets

Logos live in [`assets/`](./assets). License: © TEBIN — all rights reserved
(do not reuse the TEBIN logo for other brands).

Need a PNG instead of SVG — e.g. for Word, Excel, PowerPoint, or a tool that
cannot embed SVG? Every logo ships pre-rendered in [`assets/png/`](./assets/png)
(128–2048 px, including flattened `-on-brand` / `-on-charcoal` variants for the
white logo). Direct download links for every size: [DESIGN.md](./DESIGN.md).

- `logo-full` — wordmark (red `TEB` + corner, grey `IN`).
- `logo-full-white` — all-white logo for dark or red backgrounds.
- `corner-mark` / `corner-mark-white` — the solid corner mark on its own.

See the `brand` rules in [`rules/dist/rules.md`](../../rules/dist/rules.md) for
logo usage (safezone, backgrounds, do-nots).

## Roles

`role.primary`, `role.surface`, `role.on-surface` and `role.on-surface-muted`
point at palette colours rather than copying them.

This theme has no `role.outline`, and no status roles either. It is the theme
for documents and print: table rules come from Word's own table styles, and a
printed page has no error or success state. The 2017 brand book names no
hairline colour because a hairline colour is not something it needs to name.
