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

- `logo-full` — wordmark (red `TEB` + corner, grey `IN`).
- `logo-full-white` — all-white logo for dark or red backgrounds.
- `corner-mark` / `corner-mark-white` — the solid corner mark on its own.

See the `brand` rules in [`rules/dist/rules.md`](../../rules/dist/rules.md) for
logo usage (safezone, backgrounds, do-nots).
