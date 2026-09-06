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
