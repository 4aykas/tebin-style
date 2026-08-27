# TEBIN — design

> Generated from `tokens.json`, `theme.json` and `rules/rules.json` — do not edit by hand.

Industrial design-and-engineering brand kit: signal red on charcoal, Roboto /
Roboto Condensed type.

> **Type on tebin.pro is unloaded by design.** The site requests no webfont, so
> `--font-condensed` and `--font-sans` resolve to the visitor's system sans.
> Only the `og-preview/*` routes load Roboto Condensed, because the OG images
> are screenshotted from them and must render in the real face. If you are about
> to "fix" a missing font request on a public page — don't; it is deliberate.
> Consumers of this theme that *do* load webfonts get the intended face for free.

**Version** 1.2.0. **Tokens** MIT. **Assets** © TEBIN — all rights reserved.
**Source** https://tebin.pro.

## Palette

| Token | HEX | RGB (Word, Excel) | Pantone | CMYK | Purpose |
| --- | --- | --- | --- | --- | --- |
| `color.brand` | `#DA291C` | 218, 41, 28 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.brand-dark` | `#B82217` | 184, 34, 23 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.brand-on-dark` | `#EA6359` | 234, 99, 89 | not specified in the 2017 brand book | not specified in the 2017 brand book | Small red TEXT on dark surfaces only. 4.5:1 on #242830, the lightest dark surface in use, and more on every darker one. The identity red #DA291C stays the colour for the logo, fills, borders and large text, which need only 3:1. |
| `color.brand-on-light` | `#C7251A` | 199, 37, 26 | not specified in the 2017 brand book | not specified in the 2017 brand book | Small red TEXT on light surfaces only. 4.87:1 on #EFEEE9 and 5.32:1 on #F8F8F4. No single red clears 4.5:1 on both surface families: the luminance window is empty for any hue, so this is two tokens by arithmetic, not by preference. |
| `color.charcoal` | `#242424` | 36, 36, 36 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.ink` | `#292929` | 41, 41, 41 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.muted` | `#666666` | 102, 102, 102 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.topbar` | `#F9F9F9` | 249, 249, 249 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.subtle` | `#C1C1C1` | 193, 193, 193 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.rule` | `#ECECEC` | 236, 236, 236 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.paper` | `#FCFBF8` | 252, 251, 248 | not specified in the 2017 brand book | not specified in the 2017 brand book | Base page surface. Warm-tinted rather than pure #fff, which reads flat beside the cream band and the dark sections. |

Where a cell reads "not specified in the 2017 brand book", no value was printed there — do not convert one from the RGB.

### Translucent scale

Every semi-transparent colour comes from a step, never from an ad-hoc alpha; step 1 is always the strongest. Groups present in this theme: `on-dark`, `on-light`, `rule-dark`, `rule-light`, `surface-dark`. The steps below the contrast floor are for decoration, not for type. Full values: [tokens.json](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin/tokens.json).

## Roles

A role is a pointer, not a copy — change the colour it names and every role using it follows.

| Role | Points at | Use for |
| --- | --- | --- |
| `role.primary` | `color.brand` | Identity red. Logo, fills, borders and large text. Not small text — use the on-dark or on-light variant there. |
| `role.primary-on-dark` | `color.brand-on-dark` | Small red text on a dark surface. |
| `role.primary-on-light` | `color.brand-on-light` | Small red text on a light surface. |
| `role.surface` | `color.paper` | The base page surface. |
| `role.surface-inverse` | `color.charcoal` | The dark bands. |
| `role.on-surface` | `color.ink` | Primary text on the base surface. |
| `role.on-surface-muted` | `color.muted` | Secondary text on the base surface. |
| `role.outline` | `color.rule` | Hairlines and dividers on light surfaces. |

## Typography

- **sans** — Roboto, Helvetica, Arial, sans-serif — tebin.pro ships no webfont, so this resolves to Helvetica or Arial in practice. Deliberate — do not add a font request to make Roboto win.
- **condensed** — Roboto Condensed, Roboto, sans-serif — Same: no webfont is loaded on public pages, so this resolves to the visitor's system sans unless they happen to have Roboto Condensed installed. Only the og-preview/* pages request the real face, because the OG screenshots must render in it.
- **Weights** — heading 700

In Word, Excel, PowerPoint and Google Docs use **Arial**. It is the brand book's own substitute where Roboto is unavailable, and it is installed everywhere.

### Scale

| Level | Size | Fluid range |
| --- | --- | --- |
| `type.h1` | 38px | `clamp(28px, 4.5vw, 38px)` |
| `type.h2` | 34px | `clamp(24px, 3.8vw, 34px)` |
| `type.h3` | 28px | `clamp(20px, 3vw, 28px)` |
| `type.h4` | 24px | `clamp(18px, 2.4vw, 24px)` |
| `type.h5` | 20px | `clamp(16px, 2vw, 20px)` |
| `type.body` | 16px | fixed |

Where a level shows a fluid range, the size column is its **ceiling**, not a fixed size. Display type is sized against the locale with the longest words — a range that fits English alone is an English-only cap.

Leading: heading 1.35, body 1.7.
Weights: heading 700.

## Geometry

- `radius.panel` — 2px
- `radius.control` — 4px
- `radius.card` — 8px

## Spacing

| Step | Ceiling | Fluid range |
| --- | --- | --- |
| `spacing.gutter` | 48px | `clamp(20px, 4vw, 48px)` |
| `spacing.section-compact` | 64px | `clamp(40px, 5.5vw, 64px)` |
| `spacing.section-standard` | 88px | `clamp(56px, 7vw, 88px)` |
| `spacing.section-feature` | 112px | `clamp(72px, 9vw, 112px)` |

Container widths: `container-default` 1200px, `container-wide` 1400px, `container-reading` 760px.

## Assets

| Asset | Vector | PNG |
| --- | --- | --- |
| `logo-full` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/logo/logo-full.svg?raw=1) | [512 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/logo-full-512.png?raw=1) · [1024 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/logo-full-1024.png?raw=1) · [2048 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/logo-full-2048.png?raw=1) |
| `logo-full-white` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/logo/logo-full-white.svg?raw=1) | [512 px on brand](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/logo-full-white-512-on-brand.png?raw=1) · [512 px on charcoal](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/logo-full-white-512-on-charcoal.png?raw=1) · [1024 px on brand](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/logo-full-white-1024-on-brand.png?raw=1) · [1024 px on charcoal](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/logo-full-white-1024-on-charcoal.png?raw=1) · [2048 px on brand](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/logo-full-white-2048-on-brand.png?raw=1) · [2048 px on charcoal](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/logo-full-white-2048-on-charcoal.png?raw=1) |
| `favicon-svg` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/favicon/favicon.svg?raw=1) | [128 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/favicon-svg-128.png?raw=1) · [256 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/favicon-svg-256.png?raw=1) · [512 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/favicon-svg-512.png?raw=1) |
| `favicon-png` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/favicon/favicon.png?raw=1) | — |
| `favicon-ico` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/favicon/favicon.ico?raw=1) | — |
| `corner-outline` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/misc/corner_outline.svg?raw=1) | [128 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/corner-outline-128.png?raw=1) · [256 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/corner-outline-256.png?raw=1) · [512 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/corner-outline-512.png?raw=1) |
| `corner-mark` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/misc/corner-mark.svg?raw=1) | [128 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/corner-mark-128.png?raw=1) · [256 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/corner-mark-256.png?raw=1) · [512 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/corner-mark-512.png?raw=1) |
| `corner-mark-white` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/misc/corner-mark-white.svg?raw=1) | [128 px on brand](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/corner-mark-white-128-on-brand.png?raw=1) · [128 px on charcoal](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/corner-mark-white-128-on-charcoal.png?raw=1) · [256 px on brand](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/corner-mark-white-256-on-brand.png?raw=1) · [256 px on charcoal](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/corner-mark-white-256-on-charcoal.png?raw=1) · [512 px on brand](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/corner-mark-white-512-on-brand.png?raw=1) · [512 px on charcoal](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/png/corner-mark-white-512-on-charcoal.png?raw=1) |
| `fxptebin` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/assets/misc/fxptebin.png?raw=1) | — |

For scripts and agents, the same files without the HTML page around them: `https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin/…`. Note that a raw SVG is served as `text/plain`, so a browser shows its source — use the vector links above to download one by hand.

Colour table as a spreadsheet: [colors.csv](https://github.com/4aykas/tebin-style/blob/main/themes/tebin/dist/colors.csv?raw=1).

## Rules

### brand

- **[MUST]** On dark or saturated brand-color (e.g. corporate red) backgrounds, use the all-white monochrome logo — the corner mark and every letter white. — _The two-color logo loses the grey "IN" and puts red on red._
- **[NEVER]** Never place the two-color (red/grey) logo on a dark or red background; switch to the all-white logo instead.
- **[SHOULD]** The corner mark may stand alone as a decorative marker signalling TEBIN authorship — typically the top-right corner of a photo or slide. Keep it brand red on light backgrounds and white on dark or red ones.
- **[MUST]** Keep clear space around the logo at least the height of the "B" in the wordmark on all sides.
- **[SHOULD]** On colored or photographic backgrounds where the white logo lacks contrast, place the logo inside a white rectangle (e.g. sponsorship contexts).
- **[NEVER]** Never apply disproportional transforms to the logo or rescale its elements independently.
- **[NEVER]** Never add shadows or other effects to the logo.
- **[NEVER]** Never recolor the logo outside the approved palette (red, grey, all-white, all-black).
- **[SHOULD]** Set brand text in Roboto; fall back to Arial where Roboto is unavailable (e.g. MS Office documents).

### typography

- **[NEVER]** A heading never breaks a word — not mid-letter and not with a hyphen. Do not put hyphens: auto, overflow-wrap: anywhere or &shy; on display type; resize the type or rewrite the line. — _Settled by the owner on 2026-07-29, reversing a sweep of 177 wrap rules made the day before; &shy; is not an escape hatch because the HTML minifier strips it._
- **[SHOULD]** Body copy carries overflow-wrap: anywhere and hyphens: auto so long technical strings cannot overflow their column. — _The pair is right for running text and wrong for display type — the distinction is the rule._
- **[MUST]** Size display type against the locale with the longest words, not against the source language. — _A vw-based display size that fits English becomes an English-only cap in a fractional grid column: German compounds overlapped the next column by up to 343px on production._
- **[NEVER]** Never set a negative letter-spacing; tracking is zero or positive.
- **[NEVER]** Never use <br> inside a heading to shape its lines. — _It welds words together for anything reading textContent, and it fixes a line count that every other breakpoint has to live with._
- **[SHOULD]** Take heading sizes from the global type scale (type.h1 … type.h5 in the theme) rather than from per-page clamp() overrides. — _Page-local overrides accumulated until the global heading styles described almost nothing that shipped._
- **[SHOULD]** Shape a heading's lines with text-wrap: balance (text-pretty for running text); it is the supported replacement for the manual <br> and hyphenation the other heading rules forbid. — _Two NEVER rules remove every manual way to even out a ragged heading without naming the one that works, and a rule that forbids the only known method is a rule people break._

### theming

- **[MUST]** Set color-scheme: dark on <html> for dark themes.
- **[MUST]** Give native <select> an explicit background-color and color (Windows fix).
- **[MUST]** Resolve every colour through a named token; do not write hex or rgba() literals in component styles. — _Ad-hoc literals accumulated to roughly 3000 values across tebin.pro, which turned a contrast change into a repository-wide sweep instead of a single edit._
- **[MUST]** Take translucent colours from the scale — on-dark, on-light, rule-dark, rule-light, surface-dark, brand-a — rather than inventing an alpha per use. — _Forty-odd different white alphas read as looseness even when no single value looks wrong._
- **[NEVER]** Never use #fff as a page or panel surface; use --color-paper. — _Pure white reads flat and synthetic beside the cream band and the dark sections._
- **[SHOULD]** On dark surfaces express elevation with a lighter surface step, not a shadow. — _A shadow on a dark ground reads as a coloured halo rather than as depth._
- **[SHOULD]** Make a design policy checkable; a policy that lives only in prose is enforced only where somebody remembered it. — _A no-webfont rule written in AGENTS.md was honoured on the English pages and quietly not on the thirty localized copies, so 31 public pages fetched a Google font for a year._

## Using this elsewhere

- Word, Excel, PowerPoint, Google Docs — [the Office guide](https://github.com/4aykas/tebin-style/blob/main/docs/guide/office.md).
- A coding agent — [the agent guide](https://github.com/4aykas/tebin-style/blob/main/docs/guide/ai-agents.md).
- A web project — [the developer guide](https://github.com/4aykas/tebin-style/blob/main/docs/guide/developers.md).

Every link in this file is absolute, so the file keeps working when it is pasted into a chat or saved beside a document.
