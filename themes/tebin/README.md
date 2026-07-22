# TEBIN theme

Industrial design-and-engineering brand kit: signal red (`#DA291C`) on charcoal,
Roboto / Roboto Condensed type.

## Tokens

Canonical source: [`tokens.json`](./tokens.json) (DTCG). Generated outputs in
[`dist/`](./dist): `tokens.css`, `tailwind.css`, `tokens.dtcg.json`, `theme.ts`.

### Translucent scale

Every semi-transparent colour comes from a step, never from an ad-hoc alpha.
Step 1 is always the strongest.

| Group | Steps | Use |
| --- | --- | --- |
| `--on-dark-1…10` | .90 → .20 | Text and icons on dark surfaces |
| `--on-light-1…7` | .82 → .30 | Text and icons on light surfaces |
| `--rule-dark-1…4` | .13 → .06 | Hairlines on dark |
| `--rule-light-1…3` | .20 → .06 | Hairlines on light |
| `--surface-dark-1…3` | .05 → .02 | Raised panels on dark |
| `--brand-a1…a7` | .88 → .06 | Brand red at reduced opacity |

Contrast floor: `--on-dark-6` on the dark bands, `--on-light-3` on the cream
band. The steps below those are for decoration, not for type — see
`accessibility-text-contrast` in [`rules/dist/rules.md`](../../rules/dist/rules.md).

`--color-paper` (`#FCFBF8`) is the base page surface. Pure `#fff` is not used:
it reads flat beside the cream band and the dark sections.

## Assets

Logos and favicons live in [`assets/`](./assets). License: © TEBIN — all rights
reserved (do not reuse the TEBIN logo for other brands).

- `logo-full` — default two-color logo (red `TEB` + corner, grey `IN`).
- `logo-full-white` — all-white monochrome logo for dark or red backgrounds.
- `corner-mark` / `corner-mark-white` — the solid corner mark on its own, for
  use as a decorative TEBIN marker (e.g. top-right of a photo or slide).

### Logo usage

See the `brand` rules in [`rules/dist/rules.md`](../../rules/dist/rules.md):
on dark or corporate-red backgrounds use the all-white logo (corner and all
letters white); never place the two-color logo there.
