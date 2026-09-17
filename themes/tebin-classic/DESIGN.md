---
version: alpha
name: "TEBIN Classic"
description: "Faithful reproduction of the 2017 TEBIN print brand book: Pantone red + grey, Roboto / Arial, corporate-print identity."
colors:
  primary: "#DA291C"
  surface: "#FFFFFF"
  on-surface: "#1A1A1A"
omitted:
  - section: "role.outline"
    reason: "Document theme: table rules come from Word's own table styles, and the 2017 brand book names no hairline colour."
  - section: "role.on-surface-muted"
    reason: "The brand book's grey #898D8D is 3.36:1 on white — below the 4.5:1 floor for small text. It is a colour to paint with, not one to read; the book prices no darker grey, so this theme has no secondary text colour."
  - section: "role.status"
    reason: "A printed page has no error, warning or success state."
  - section: "components"
    reason: "No canonical button exists across the TEBIN apps; codifying one would invent a house style rather than record one."
---
# TEBIN Classic — design

> Generated from `tokens.json`, `theme.json` and `rules/rules.json` — do not edit by hand.

The 2017 TEBIN corporate identity, reproduced from the printed brand book:
Pantone red and grey, Roboto for screen, Arial in Office documents. Use this
theme for anything that has to match printed TEBIN material — a document, a
certificate, a slide deck, a business card.

The grey is specified twice in the book — Pantone 423 C and "Black 60%" — two
routes to the same ink; the tokens carry the Pantone name.

**Version** 1.1.1. **Tokens** MIT. **Assets** © TEBIN — all rights reserved.
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
- **[NEVER]** Never re-create the wordmark by typing TEBIN in a font. The letterforms are drawn outlines, not type. Insert the supplied asset: SVG on the web, and PNG in Word, Excel, PowerPoint or anything else that cannot embed SVG. — _An agent handed only the repository link repeatedly styled the name as text instead of fetching the logo, which produces letterforms that are not the logo at all. The other brand rules govern placing the logo and quietly assume you already have the file; none of them forbids drawing it yourself, so a careful agent could follow every rule and still ship the wrong mark._
- **[SHOULD]** On a busy or photographic background where the white logo lacks contrast, place the approved two-colour logo on a solid white rectangle with the required clear space. Do not place the white logo on white.
- **[NEVER]** Never apply disproportional transforms to the logo or rescale its elements independently.
- **[NEVER]** Never add shadows or other effects to the logo.
- **[NEVER]** Never recolor the logo outside the approved palette (red, grey, all-white, all-black).
- **[SHOULD]** For Classic corporate material, use Roboto where available and Arial in Office documents. For Modern, use the font stacks defined by the theme and respect the target project's font-loading policy.

### theming

- **[MUST]** (web) Set color-scheme: dark on <html> for dark themes.
- **[MUST]** (web) Give native <select> an explicit background-color and color (Windows fix).
- **[MUST]** (web) Resolve every colour through a named token; do not write hex or rgba() literals in component styles. — _Ad-hoc literals accumulated to roughly 3000 values across tebin.pro, which turned a contrast change into a repository-wide sweep instead of a single edit._
- **[SHOULD]** (web) Make a design policy checkable; a policy that lives only in prose is enforced only where somebody remembered it. — _A no-webfont rule written in AGENTS.md was honoured on the English pages and quietly not on the thirty localized copies, so 31 public pages fetched a Google font for a year._

## Using this elsewhere

- Word, Excel, PowerPoint, Google Docs — [the Office guide](https://github.com/4aykas/tebin-style/blob/main/docs/guide/office.md).
- A coding agent — [the agent guide](https://github.com/4aykas/tebin-style/blob/main/docs/guide/ai-agents.md).
- A web project — [the developer guide](https://github.com/4aykas/tebin-style/blob/main/docs/guide/developers.md).

Every link in this file is absolute, so the file keeps working when it is pasted into a chat or saved beside a document.
