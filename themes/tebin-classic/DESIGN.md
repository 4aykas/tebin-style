# TEBIN Classic — design

> Generated from `tokens.json`, `theme.json` and `rules/rules.json` — do not edit by hand.

The 2017 TEBIN corporate identity, reproduced from the printed brand book:
Pantone red and grey, Roboto for screen, Arial in Office documents. Use this
theme for anything that has to match printed TEBIN material — a document, a
certificate, a slide deck, a business card.

The grey is specified twice in the book — Pantone 423 C and "Black 60%" — two
routes to the same ink; the tokens carry the Pantone name.

**Version** 1.1.0. **Tokens** MIT. **Assets** © TEBIN — all rights reserved.
**Source** TEBIN Branding Principles & Style Guide (2017, Rev. A).

## Palette

| Token | HEX | RGB (Word, Excel) | Pantone | CMYK | Purpose |
| --- | --- | --- | --- | --- | --- |
| `color.brand` | `#DA291C` | 218, 41, 28 | 485 C | 0/95/100/0 | Brand red — emphasis and the logo. Never recolor the logo with the secondary palette. |
| `color.grey` | `#898D8D` | 137, 141, 141 | 423 C | 22/14/18/45 | Brand grey — secondary text and UI, the IN of the wordmark. |
| `color.ink` | `#1A1A1A` | 26, 26, 26 | not specified in the 2017 brand book | not specified in the 2017 brand book | Body text. |
| `color.topbar` | `#FFFFFF` | 255, 255, 255 | not specified in the 2017 brand book | not specified in the 2017 brand book | Surfaces. |
| `color.maroon` | `#B02954` | 176, 41, 84 | not specified in the 2017 brand book | 23/97/54/8 | — |
| `color.brick` | `#A43F39` | 164, 63, 57 | not specified in the 2017 brand book | 24/85/81/57 | — |
| `color.salmon` | `#EB807A` | 235, 128, 122 | not specified in the 2017 brand book | 2/62/46/0 | — |
| `color.orange` | `#F38B4C` | 243, 139, 76 | not specified in the 2017 brand book | 0/54/80/0 | — |
| `color.yellow` | `#FBD551` | 251, 213, 81 | not specified in the 2017 brand book | 2/13/84/0 | — |
| `color.teal` | `#69B7C2` | 105, 183, 194 | not specified in the 2017 brand book | 58/10/21/0 | — |
| `color.grey-light` | `#B3B4B6` | 179, 180, 182 | not specified in the 2017 brand book | 31/23/23/0 | — |
| `color.grey-lighter` | `#CDCDCE` | 205, 205, 206 | not specified in the 2017 brand book | 19/15/15/0 | — |

Where a cell reads "not specified in the 2017 brand book", no value was printed there — do not convert one from the RGB.

## Roles

A role is a pointer, not a copy — change the colour it names and every role using it follows.

| Role | Points at | Use for |
| --- | --- | --- |
| `role.primary` | `color.brand` | Identity red. Fills and large text. |
| `role.surface` | `color.topbar` | The white page a document prints on. |
| `role.on-surface` | `color.ink` | Body text on the page. |

## Typography

- **sans** — Roboto, Arial, Helvetica, sans-serif
- **document** — Arial, Helvetica, sans-serif
- **Weights** — regular 400, medium 500, bold 700, black 900

In Word, Excel, PowerPoint and Google Docs use **Arial**. It is the brand book's own substitute where Roboto is unavailable, and it is installed everywhere.

## Assets

| Asset | Source | PNG |
| --- | --- | --- |
| `logo-full` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/logo/logo-full.svg?raw=1) | [512 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/logo-full-512.png?raw=1) · [1024 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/logo-full-1024.png?raw=1) · [2048 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/logo-full-2048.png?raw=1) |
| `logo-full-white` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/logo/logo-full-white.svg?raw=1) | [512 px on brand](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/logo-full-white-512-on-brand.png?raw=1) · [512 px on charcoal](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/logo-full-white-512-on-charcoal.png?raw=1) · [1024 px on brand](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/logo-full-white-1024-on-brand.png?raw=1) · [1024 px on charcoal](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/logo-full-white-1024-on-charcoal.png?raw=1) · [2048 px on brand](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/logo-full-white-2048-on-brand.png?raw=1) · [2048 px on charcoal](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/logo-full-white-2048-on-charcoal.png?raw=1) |
| `corner-mark` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/misc/corner-mark.svg?raw=1) | [128 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/corner-mark-128.png?raw=1) · [256 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/corner-mark-256.png?raw=1) · [512 px](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/corner-mark-512.png?raw=1) |
| `corner-mark-white` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/misc/corner-mark-white.svg?raw=1) | [128 px on brand](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/corner-mark-white-128-on-brand.png?raw=1) · [128 px on charcoal](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/corner-mark-white-128-on-charcoal.png?raw=1) · [256 px on brand](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/corner-mark-white-256-on-brand.png?raw=1) · [256 px on charcoal](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/corner-mark-white-256-on-charcoal.png?raw=1) · [512 px on brand](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/corner-mark-white-512-on-brand.png?raw=1) · [512 px on charcoal](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/assets/png/corner-mark-white-512-on-charcoal.png?raw=1) |

For scripts and agents, the same files without the HTML page around them: `https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin-classic/…`. Note that a raw SVG is served as `text/plain`, so a browser shows its source — use the vector links above to download one by hand.

Colour table as a spreadsheet: [colors.csv](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/dist/colors.csv?raw=1).

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
