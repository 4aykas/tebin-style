---
version: alpha
name: "Slate"
description: "Neutral, modern SaaS palette: cool grays with a blue accent, Inter + JetBrains Mono."
colors:
  primary: "#2563EB"
  surface: "#FFFFFF"
  on-surface: "#0F172A"
  on-surface-muted: "#64748B"
  outline: "#E2E8F0"
  error: "#C7251A"
  warning: "#8A5300"
  success: "#1F6F43"
rounded:
  sm: 4px
  md: 8px
  lg: 12px
omitted:
  - section: "assets"
    reason: "Token-only theme; no brand assets exist."
  - section: "components"
    reason: "No canonical button exists across the TEBIN apps; codifying one would invent a house style rather than record one."
---
# Slate — design

> Generated from `tokens.json`, `theme.json` and `rules/rules.json` — do not edit by hand.

A neutral SaaS starter palette — blue accent, grey neutrals. Not a TEBIN brand:
use it when a project needs a competent default rather than a corporate identity.

**Version** 1.2.0. **Tokens** MIT. **Assets** MIT.

## Palette

| Token | HEX | RGB (Word, Excel) | Pantone | CMYK | Purpose |
| --- | --- | --- | --- | --- | --- |
| `color.brand` | `#2563EB` | 37, 99, 235 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.ink` | `#0F172A` | 15, 23, 42 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.muted` | `#64748B` | 100, 116, 139 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.topbar` | `#F8FAFC` | 248, 250, 252 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.surface` | `#FFFFFF` | 255, 255, 255 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.error` | `#C7251A` | 199, 37, 26 | not specified in the 2017 brand book | not specified in the 2017 brand book | Error text. 5.66:1 on #FFFFFF. |
| `color.warning` | `#8A5300` | 138, 83, 0 | not specified in the 2017 brand book | not specified in the 2017 brand book | Warning text. 6.33:1 on #FFFFFF. |
| `color.success` | `#1F6F43` | 31, 111, 67 | not specified in the 2017 brand book | not specified in the 2017 brand book | Success text. 6.15:1 on #FFFFFF. |
| `color.rule` | `#E2E8F0` | 226, 232, 240 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |

Where a cell reads "not specified in the 2017 brand book", no value was printed there — do not convert one from the RGB.

## Roles

A role is a pointer, not a copy — change the colour it names and every role using it follows.

| Role | Points at | Use for |
| --- | --- | --- |
| `role.primary` | `color.brand` | Accent. Fills, borders and large text. |
| `role.surface` | `color.surface` | The base page surface. |
| `role.on-surface` | `color.ink` | Primary text on the base surface. |
| `role.on-surface-muted` | `color.muted` | Secondary text on the base surface. |
| `role.outline` | `color.rule` | Hairlines and dividers. |
| `role.error` | `color.error` | Error text. |
| `role.warning` | `color.warning` | Warning text. |
| `role.success` | `color.success` | Success text. |

## Typography

- **sans** — Inter, system-ui, sans-serif
- **mono** — JetBrains Mono, ui-monospace, monospace

In Word, Excel, PowerPoint and Google Docs use **Arial**. It is the brand book's own substitute where Roboto is unavailable, and it is installed everywhere.

## Geometry

- `radius.sm` — 4px
- `radius.md` — 8px
- `radius.lg` — 12px

## Rules

### brand

- **[MUST]** On dark or saturated brand-color (e.g. corporate red) backgrounds, use the all-white monochrome logo — the corner mark and every letter white. — _The two-color logo loses the grey "IN" and puts red on red._
- **[NEVER]** Never place the two-color (red/grey) logo on a dark or red background; switch to the all-white logo instead.
- **[SHOULD]** The corner mark may stand alone as a decorative marker signalling TEBIN authorship — typically the top-right corner of a photo or slide. Keep it brand red on light backgrounds and white on dark or red ones.
- **[MUST]** Keep clear space around the logo at least the height of the "B" in the wordmark on all sides.
- **[NEVER]** Never re-create the wordmark by typing TEBIN in a font. The letterforms are drawn outlines, not type. Insert the supplied asset: SVG on the web, and PNG in Word, Excel, PowerPoint or anything else that cannot embed SVG. — _An agent handed only the repository link repeatedly styled the name as text instead of fetching the logo, which produces letterforms that are not the logo at all. The other brand rules govern placing the logo and quietly assume you already have the file; none of them forbids drawing it yourself, so a careful agent could follow every rule and still ship the wrong mark._
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
