# FleetView theme

The look of FleetView, TEBIN's console for its server fleet: slate surfaces,
one green accent, Geist and Geist Mono. Dark by default, with a light mode.

> Colour, type, layout and contrast: see [DESIGN.md](./DESIGN.md).

## Tokens

Source: [`tokens.json`](./tokens.json) (DTCG). Generated files are in
[`dist/`](./dist): `tokens.css`, `tailwind.css`, `tokens.dtcg.json`,
`theme.ts`, `colors.csv` and `shadcn.json`.

The default mode is dark. `mode.light` repeats the role and shadow tokens with
their light values. In `tokens.css` and `tailwind.css` it is a second block,
`:root[data-theme="light"]`, so every rule written against a token follows the
mode. Set the attribute before the first paint, and let `theme-color` take the
active `role.surface`.

## Assets

The mark is FleetView's own invader, drawn on an 8×8 grid.

| File | Use |
| --- | --- |
| `assets/logo/logo-mark.svg` | The invader in the accent, transparent |
| `assets/logo/logo-tile.svg` | The invader on the dark page tile: app and launcher icon |
| `assets/favicon/favicon.svg`, `.png`, `.ico` | Browser tab |

PNG sizes for each SVG are in `assets/png/`.
