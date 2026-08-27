# TEBIN theme

Industrial design-and-engineering brand kit: signal red (`#DA291C`) on charcoal,
Roboto / Roboto Condensed type.

> Type, colour and usage: see [DESIGN.md](./DESIGN.md) — including why this
> theme's fonts are deliberately unloaded on tebin.pro.

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

## Roles

A role names a colour by its job. It points at a palette token, so repointing
the colour moves every role that uses it.

| Role | Points at | For |
| --- | --- | --- |
| `role.primary` | `color.brand` | logo, fills, borders, large text |
| `role.primary-on-dark` | `color.brand-on-dark` | small red text on dark |
| `role.primary-on-light` | `color.brand-on-light` | small red text on light |
| `role.surface` | `color.paper` | the page |
| `role.surface-inverse` | `color.charcoal` | the dark bands |
| `role.on-surface` | `color.ink` | text on the page |
| `role.on-surface-muted` | `color.muted` | secondary text |
| `role.outline` | `color.rule` | hairlines and dividers |
| `role.error-on-light` / `-on-dark` | `color.brand-on-*` | error text |
| `role.warning-on-light` / `-on-dark` | `color.warning-on-*` | warning text |
| `role.success-on-light` / `-on-dark` | `color.success-on-*` | success text |

The fill red and the text red are different tokens on purpose. `#DA291C`
clears 4.5:1 on neither surface family, and no red does — the luminance
window is empty for any hue.

Error reuses those same reds rather than adding a fourth one. A second red
would ask the reader to tell two reds apart, and `content-not-color-only`
already requires an icon and a label beside any status.

## Type and spacing

`type.h1` … `type.h5` and `type.body` carry the heading scale, with
`lineHeight.heading` (1.35), `lineHeight.body` (1.7) and
`fontWeight.heading` (700).

`spacing.gutter` and `spacing.section-compact` / `-standard` / `-feature`
carry the vertical rhythm. `layout.container-default` (1200px), `-wide`
(1400px) and `-reading` (760px) carry the content widths.

Every heading level and every spacing step is fluid. The token's `$value` is
the **ceiling**; the real range lives in `$extensions["pro.tebin.fluid"]` and
the CSS build composes `clamp()` from it. Sizes and ranges:
[DESIGN.md](./DESIGN.md).

## Assets

Logos and favicons live in [`assets/`](./assets). License: © TEBIN — all rights
reserved (do not reuse the TEBIN logo for other brands).

Need a PNG instead of SVG — e.g. for Word, Excel, PowerPoint, or a tool that
cannot embed SVG? Every logo ships pre-rendered in [`assets/png/`](./assets/png)
(128–2048 px, including flattened `-on-brand` / `-on-charcoal` variants for the
white logo). Direct download links for every size: [DESIGN.md](./DESIGN.md).

- `logo-full` — default two-color logo (red `TEB` + corner, grey `IN`).
- `logo-full-white` — all-white monochrome logo for dark or red backgrounds.
- `corner-mark` / `corner-mark-white` — the solid corner mark on its own, for
  use as a decorative TEBIN marker (e.g. top-right of a photo or slide).

### Logo usage

See the `brand` rules in [`rules/dist/rules.md`](../../rules/dist/rules.md):
on dark or corporate-red backgrounds use the all-white logo (corner and all
letters white); never place the two-color logo there.
