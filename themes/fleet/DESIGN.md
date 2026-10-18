---
version: alpha
name: "FleetView"
description: "Operator console for a fleet of servers: dense, flat, slate on slate, colour spent only on state and one accent."
colors:
  surface: "#0F172A"
  surface-raised: "#1E293B"
  on-surface: "#F1F5F9"
  on-surface-muted: "#94A3B8"
  on-surface-subtle: "#8494AB"
  outline: "#334155"
  outline-subtle: "#1E293B"
  outline-strong: "#475569"
  outline-control: "#64748B"
  primary: "#4ADE80"
  primary-hover: "#22C55E"
  success: "#4ADE80"
  success-fill: "#4ADE80"
  warning: "#FBBF24"
  warning-fill: "#FBBF24"
  error: "#F87171"
  error-fill: "#F87171"
  error-hover: "#EF4444"
  error-subtle: "rgba(248, 113, 113, 0.12)"
  info: "#22D3EE"
  kind-pc: "#A78BFA"
  tone-fleet: "#4ADE80"
  tone-security: "#FBBF24"
  tone-tasks: "#60A5FA"
  tone-users: "#F472B6"
  tone-access: "#2DD4BF"
typography:
  xs:
    fontFamily: "Geist"
    fontSize: "0.75rem"
  sm:
    fontFamily: "Geist"
    fontSize: "0.8125rem"
  base:
    fontFamily: "Geist"
    fontSize: "0.875rem"
  md:
    fontFamily: "Geist"
    fontSize: "1rem"
  lg:
    fontFamily: "Geist"
    fontSize: "1.25rem"
  xl:
    fontFamily: "Geist"
    fontSize: "1.5rem"
rounded:
  tag: "3px"
  control: "4px"
  panel: "6px"
  dialog: "8px"
  overlay: "10px"
  pill: "999px"
spacing:
  1: "0.25rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  5: "1.25rem"
  6: "1.5rem"
  7: "1.75rem"
  8: "2rem"
  10: "2.5rem"
  14: "3.5rem"
  16: "4rem"
  pad-badge: "0.125rem 0.375rem"
  pad-chip: "0.25rem 0.5rem"
components:
  button:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.outline-control}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1.25rem"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    borderColor: "{colors.primary}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1.25rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    borderColor: "{colors.primary-hover}"
  button-danger:
    backgroundColor: "{colors.error-fill}"
    textColor: "{colors.surface}"
    borderColor: "{colors.error-fill}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1.25rem"
  button-danger-hover:
    backgroundColor: "{colors.error-hover}"
    borderColor: "{colors.error-hover}"
  button-danger-quiet:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.error}"
    borderColor: "{colors.error-fill}"
    rounded: "{rounded.control}"
    padding: "0.25rem 0.5rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.outline-control}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
---
# FleetView — design

> Generated from `tokens.json`, `theme.json` and `rules/rules.json` — do not edit by hand.

FleetView is an operator console. People open it because a machine is
misbehaving, and they read it under time pressure. Its surfaces are dense,
flat and slate on slate. Colour is kept for state, not decoration. Dark is the
default mode; light overrides the same tokens (see Modes).

## How the colour works

- **State, not palette.** `success`, `warning` and `error` appear only where
  the value they describe is on screen. A surface that merely relates to a
  problem keeps `on-surface` and `outline`.
- **One accent per view.** `primary` marks the primary action of a view and
  nothing else. Two accents on one screen means one of them is not primary.
- **Text and fill are separate tokens.** A state colour set as text uses the
  plain role (`success`, `warning`, `error`). A bar, dot, edge or badge border
  uses its `-fill` role. On dark they are the same value; on light the fill is
  too bright to read as text.
- **Destructive is spent slowly.** `error` is also the destructive colour. A
  control repeated down a list carries its label in `error` and fills only on
  hover or in its confirmation (`button-danger-quiet`), so a solid fill keeps
  meaning "this is the moment".
- **`on-surface-subtle`** is for a fact the operator should notice but not act
  on.
- **Edges.** Inputs, selects and buttons use `outline-control`, which reaches
  3:1 against the page. `outline` stays quiet for dividers and cards.
- **Status is a flat edge**, never a gradient, a glow or a shadow. A grid of
  cards then reads down one column of edges. Shadows only lift a surface off
  the page.

## Type

`mono` carries identity and machine values: headings, section labels, names,
IDs and counts. `sans` carries prose. A value someone might compare down a
column is set in `mono` with tabular figures. Six sizes and nothing else;
nothing under 12px. Section and disclosure labels are `sm` mono capitals, body
and controls `base`, zone headings `md`, the page title `xl`.

A link inside running text is underlined. Nav items, chips, cards and table
values shaped like controls are not.

## Layout

A page is a stack of zones, each introduced by a `mono` label, in the order of
what the visit is for: live values first, then the actions people come to
perform, then details, then anything destructive. Content that costs a slow
round trip is collapsed until asked for, and says so. Spacing comes only from
the `spacing` scale; badges and chips use their own two paddings, because a
badge padded to the layout scale reads as a button.

**Version** 1.0.0. **Tokens** MIT. **Assets** © TEBIN — all rights reserved.
**Source** https://fleet.tebin.pro.

## Palette

| Token | HEX | RGB (Word, Excel) | Pantone | CMYK | Purpose |
| --- | --- | --- | --- | --- | --- |
| `color.slate-25` | `#FBFCFE` | 251, 252, 254 | not specified in the 2017 brand book | not specified in the 2017 brand book | Raised surface on the light page. |
| `color.slate-50` | `#F8FAFC` | 248, 250, 252 | not specified in the 2017 brand book | not specified in the 2017 brand book | The light page. |
| `color.slate-100` | `#F1F5F9` | 241, 245, 249 | not specified in the 2017 brand book | not specified in the 2017 brand book | Text on the dark page. |
| `color.slate-200` | `#E2E8F0` | 226, 232, 240 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.slate-300` | `#CBD5E1` | 203, 213, 225 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.slate-400` | `#94A3B8` | 148, 163, 184 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.slate-450` | `#8494AB` | 132, 148, 171 | not specified in the 2017 brand book | not specified in the 2017 brand book | Tertiary text on dark: 4.5:1 on the raised surface, where #64748B gave 3.07:1. |
| `color.slate-475` | `#808EA2` | 128, 142, 162 | not specified in the 2017 brand book | not specified in the 2017 brand book | Control edge on light: 3:1 against the page. |
| `color.slate-500` | `#64748B` | 100, 116, 139 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.slate-600` | `#475569` | 71, 85, 105 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.slate-700` | `#334155` | 51, 65, 85 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.slate-800` | `#1E293B` | 30, 41, 59 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.slate-900` | `#0F172A` | 15, 23, 42 | not specified in the 2017 brand book | not specified in the 2017 brand book | The dark page, and the browser chrome in dark mode. |
| `color.green-400` | `#4ADE80` | 74, 222, 128 | not specified in the 2017 brand book | not specified in the 2017 brand book | Accent and OK on dark. |
| `color.green-500` | `#22C55E` | 34, 197, 94 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.green-600` | `#16A34A` | 22, 163, 74 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.green-700` | `#15803D` | 21, 128, 61 | not specified in the 2017 brand book | not specified in the 2017 brand book | Accent on light: a button label and a link both reach 4.5:1, where #16A34A gave 3.15:1. |
| `color.green-800` | `#166534` | 22, 101, 52 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.amber-400` | `#FBBF24` | 251, 191, 36 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.amber-600` | `#D97706` | 217, 119, 6 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.amber-700` | `#B45309` | 180, 83, 9 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.amber-800` | `#92400E` | 146, 64, 14 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.red-400` | `#F87171` | 248, 113, 113 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.red-500` | `#EF4444` | 239, 68, 68 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.red-600` | `#DC2626` | 220, 38, 38 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.red-700` | `#B91C1C` | 185, 28, 28 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.cyan-400` | `#22D3EE` | 34, 211, 238 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.cyan-600` | `#0891B2` | 8, 145, 178 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.violet-400` | `#A78BFA` | 167, 139, 250 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.violet-600` | `#7C3AED` | 124, 58, 237 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.blue-400` | `#60A5FA` | 96, 165, 250 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.blue-700` | `#1D4ED8` | 29, 78, 216 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.pink-400` | `#F472B6` | 244, 114, 182 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.pink-700` | `#BE185D` | 190, 24, 93 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.teal-400` | `#2DD4BF` | 45, 212, 191 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |
| `color.teal-800` | `#115E59` | 17, 94, 89 | not specified in the 2017 brand book | not specified in the 2017 brand book | — |

Where a cell reads "not specified in the 2017 brand book", no value was printed there — do not convert one from the RGB.

## Roles

A role is a pointer, not a copy — change the colour it names and every role using it follows.

| Role | Points at | Use for |
| --- | --- | --- |
| `role.surface` | `color.slate-900` | The page. Dark is the default mode. |
| `role.surface-raised` | `color.slate-800` | Cards, panels, dialogs and the default button. |
| `role.on-surface` | `color.slate-100` | Text. |
| `role.on-surface-muted` | `color.slate-400` | Secondary text: labels, meta. |
| `role.on-surface-subtle` | `color.slate-450` | A fact the operator should notice but not act on. |
| `role.outline` | `color.slate-700` | Dividers and card edges. Stays quiet. |
| `role.outline-subtle` | `color.slate-800` | — |
| `role.outline-strong` | `color.slate-600` | — |
| `role.outline-control` | `color.slate-500` | Inputs, selects and buttons: 3:1 against the page, so a control's edge is visible. |
| `role.primary` | `color.green-400` | The accent: the primary action of a view and nothing else. As text and as fill. |
| `role.primary-hover` | `color.green-500` | — |
| `role.success` | `color.green-400` | OK set as text. |
| `role.success-fill` | `color.green-400` | OK as a bar, dot, edge or badge border. |
| `role.warning` | `color.amber-400` | Warn set as text. |
| `role.warning-fill` | `color.amber-400` | — |
| `role.error` | `color.red-400` | Crit set as text. Also the destructive-action colour. |
| `role.error-fill` | `color.red-400` | — |
| `role.error-hover` | `color.red-500` | — |
| `role.error-subtle` | `rgba(248, 113, 113, 0.12)` | The danger zone's tint. |
| `role.info` | `color.cyan-400` | Informational fill. |
| `role.kind-pc` | `color.violet-400` | Marks a desktop PC among servers, apart from the state colours and the accent. |
| `role.tone-fleet` | `color.green-400` | Section colour in the nav. An active label is set in its tone on a 14% tint of it. |
| `role.tone-security` | `color.amber-400` | — |
| `role.tone-tasks` | `color.blue-400` | — |
| `role.tone-users` | `color.pink-400` | — |
| `role.tone-access` | `color.teal-400` | — |

## Modes

The tables above are the default mode. One more mode overrides the same tokens, so every rule written against a token follows the mode. Turn one on with its selector; `tokens.css` and `tailwind.css` carry each as its own block.

### light — `:root[data-theme="light"]`

| Token | Default | light |
| --- | --- | --- |
| `role.surface` | `#0F172A` | `#F8FAFC` |
| `role.surface-raised` | `#1E293B` | `#FBFCFE` |
| `role.on-surface` | `#F1F5F9` | `#0F172A` |
| `role.on-surface-muted` | `#94A3B8` | `#475569` |
| `role.on-surface-subtle` | `#8494AB` | `#64748B` |
| `role.outline` | `#334155` | `#CBD5E1` |
| `role.outline-subtle` | `#1E293B` | `#E2E8F0` |
| `role.outline-strong` | `#475569` | `#94A3B8` |
| `role.outline-control` | `#64748B` | `#808EA2` |
| `role.primary` | `#4ADE80` | `#15803D` |
| `role.primary-hover` | `#22C55E` | `#166534` |
| `role.success` | `#4ADE80` | `#15803D` |
| `role.success-fill` | `#4ADE80` | `#16A34A` |
| `role.warning` | `#FBBF24` | `#B45309` |
| `role.warning-fill` | `#FBBF24` | `#D97706` |
| `role.error` | `#F87171` | `#B91C1C` |
| `role.error-fill` | `#F87171` | `#DC2626` |
| `role.error-hover` | `#EF4444` | `#B91C1C` |
| `role.error-subtle` | `rgba(248, 113, 113, 0.12)` | `rgba(220, 38, 38, 0.12)` |
| `role.info` | `#22D3EE` | `#0891B2` |
| `role.kind-pc` | `#A78BFA` | `#7C3AED` |
| `role.tone-fleet` | `#4ADE80` | `#166534` |
| `role.tone-security` | `#FBBF24` | `#92400E` |
| `role.tone-tasks` | `#60A5FA` | `#1D4ED8` |
| `role.tone-users` | `#F472B6` | `#BE185D` |
| `role.tone-access` | `#2DD4BF` | `#115E59` |
| `shadow.sm` | `[object Object]` | `[object Object]` |
| `shadow.md` | `[object Object]` | `[object Object]` |
| `shadow.lg` | `[object Object]` | `[object Object]` |

## Typography

- **sans** — Geist, -apple-system, Segoe UI, Helvetica, sans-serif — Prose.
- **mono** — Geist Mono, JetBrains Mono, Consolas, Liberation Mono, Menlo, monospace — Identity and machine values: headings, section labels, names, IDs, counts. A value compared down a column takes tabular figures.
- **Weights** — control 600

### Scale

| Level | Size | Fluid range |
| --- | --- | --- |
| `type.xs` | 0.75rem | fixed |
| `type.sm` | 0.8125rem | fixed |
| `type.base` | 0.875rem | fixed |
| `type.md` | 1rem | fixed |
| `type.lg` | 1.25rem | fixed |
| `type.xl` | 1.5rem | fixed |

Where a level shows a fluid range, the size column is its **ceiling**, not a fixed size. Display type is sized against the locale with the longest words — a range that fits English alone is an English-only cap.
Weights: control 600.

## Geometry

- `radius.tag` — 3px
- `radius.control` — 4px
- `radius.panel` — 6px
- `radius.dialog` — 8px
- `radius.overlay` — 10px
- `radius.pill` — 999px

## Spacing

| Step | Ceiling | Fluid range |
| --- | --- | --- |
| `spacing.1` | 0.25rem | fixed |
| `spacing.2` | 0.5rem | fixed |
| `spacing.3` | 0.75rem | fixed |
| `spacing.4` | 1rem | fixed |
| `spacing.5` | 1.25rem | fixed |
| `spacing.6` | 1.5rem | fixed |
| `spacing.7` | 1.75rem | fixed |
| `spacing.8` | 2rem | fixed |
| `spacing.10` | 2.5rem | fixed |
| `spacing.14` | 3.5rem | fixed |
| `spacing.16` | 4rem | fixed |
| `spacing.pad-badge` | 0.125rem 0.375rem | fixed |
| `spacing.pad-chip` | 0.25rem 0.5rem | fixed |

## Motion

| Token | Value | Use for |
| --- | --- | --- |
| `motion.duration.fast` | 150ms | Colour, border and shadow changes on a control or card. |
| `motion.duration.press` | 80ms | A hold-to-confirm fill, at constant speed. |

Springs are for motion libraries that take stiffness, damping and mass, such as Motion. Every curve and spring here settles without overshoot; under `prefers-reduced-motion` the state arrives at once.

## Components

| Component | Background | Text | Border | Shape | Padding | Height |
| --- | --- | --- | --- | --- | --- | --- |
| `button` | `role.surface-raised` | `role.on-surface` | `role.outline-control` | `radius.control` | `0.5rem 1.25rem` | — |
| `button-primary` | `role.primary` | `role.surface` | `role.primary` | `radius.control` | `0.5rem 1.25rem` | — |
| `button-primary-hover` | `role.primary-hover` | — | `role.primary-hover` | — | — | — |
| `button-danger` | `role.error-fill` | `role.surface` | `role.error-fill` | `radius.control` | `0.5rem 1.25rem` | — |
| `button-danger-hover` | `role.error-hover` | — | `role.error-hover` | — | — | — |
| `button-danger-quiet` | `role.surface-raised` | `role.error` | `role.error-fill` | `radius.control` | `0.25rem 0.5rem` | — |
| `input` | `role.surface` | `role.on-surface` | `role.outline-control` | `radius.control` | `0.5rem 1rem` | — |

A variant states only what it changes; everything else comes from the component it names.

- **`button-primary.backgroundColor`** — One per view: two accents on one screen means one of them is not primary.
- **`button-danger.backgroundColor`** — The solid fill means "this is the moment": in a confirmation, or a single destructive action.
- **`button-danger-quiet.textColor`** — Repeated down a list: intent in the label's colour, the fill only on hover or in its confirmation.

## Assets

| Asset | Source | PNG |
| --- | --- | --- |
| `logo-mark` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/logo/logo-mark.svg?raw=1) | [512 px](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/png/logo-mark-512.png?raw=1) · [1024 px](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/png/logo-mark-1024.png?raw=1) · [2048 px](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/png/logo-mark-2048.png?raw=1) |
| `logo-tile` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/logo/logo-tile.svg?raw=1) | [512 px](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/png/logo-tile-512.png?raw=1) · [1024 px](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/png/logo-tile-1024.png?raw=1) · [2048 px](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/png/logo-tile-2048.png?raw=1) |
| `favicon-svg` | [SVG](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/favicon/favicon.svg?raw=1) | [128 px](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/png/favicon-svg-128.png?raw=1) · [256 px](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/png/favicon-svg-256.png?raw=1) · [512 px](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/png/favicon-svg-512.png?raw=1) |
| `favicon-png` | [PNG](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/favicon/favicon.png?raw=1) | — |
| `favicon-ico` | [ICO](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/assets/favicon/favicon.ico?raw=1) | — |

For scripts and agents, the same files without the HTML page around them: `https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/fleet/…`. Note that a raw SVG is served as `text/plain`, so a browser shows its source — use the vector links above to download one by hand.

Colour table as a spreadsheet: [colors.csv](https://github.com/4aykas/tebin-style/blob/main/themes/fleet/dist/colors.csv?raw=1).

## Rules

### typography

- **[MUST]** (web) Set identity and machine values in mono: headings, section labels, names, IDs, counts; a value compared down a column takes tabular figures. Prose is sans. — _Machine values are scanned and compared, and mono with tabular figures keeps them aligned._
- **[MUST]** (web) Use the six sizes of the type scale (xs to xl) and nothing else, and nothing under 12px; inputs on a touch screen are 16px. — _A dense console stays legible only with a fixed floor; below 16px iOS zooms into a focused field._

### theming

- **[MUST]** (web) Set color-scheme: dark on <html> for dark themes.
- **[MUST]** (web) Give native <select> an explicit background-color and color (Windows fix).
- **[MUST]** (web) Resolve every colour through a named token; do not write hex or rgba() literals in component styles. — _Ad-hoc literals accumulated to roughly 3000 values across tebin.pro, which turned a contrast change into a repository-wide sweep instead of a single edit._
- **[SHOULD]** (web) Make a design policy checkable; a policy that lives only in prose is enforced only where somebody remembered it. — _A no-webfont rule written in AGENTS.md was honoured on the English pages and quietly not on the thirty localized copies, so 31 public pages fetched a Google font for a year._
- **[MUST]** (web) Use success, warning and error only where the value they describe is on screen; a surface that merely relates to a problem keeps on-surface and outline. — _An operator reads colour as a finding. Colour on a surface that is not the finding sends the eye to the wrong place under time pressure._
- **[MUST]** (web) Spend the accent (role.primary) on the primary action of a view and nothing else; two accents on one screen means one of them is not primary. — _The accent answers "what do I do here"; a second one makes the answer ambiguous._
- **[MUST]** (web) Set a state colour as text with its plain role (success, warning, error) and as a bar, dot, edge or badge border with its -fill role. — _On light the fill is too bright to read as text; the two are the same value only on dark._
- **[SHOULD]** (web) A destructive control repeated down a list carries its label in error and fills only on hover or in its confirmation; keep the solid fill for the one moment of commitment. — _Repeated solid red stops meaning "this is the moment" and becomes background._
- **[NEVER]** (web) Never express status with a gradient, a glow or a shadow; status is a flat edge or a flat fill. — _A grid of cards reads down one column of edges; depth only lifts a surface off the page._

## Using this elsewhere

- Word, Excel, PowerPoint, Google Docs — [the Office guide](https://github.com/4aykas/tebin-style/blob/main/docs/guide/office.md).
- A coding agent — [the agent guide](https://github.com/4aykas/tebin-style/blob/main/docs/guide/ai-agents.md).
- A web project — [the developer guide](https://github.com/4aykas/tebin-style/blob/main/docs/guide/developers.md).

Every link in this file is absolute, so the file keeps working when it is pasted into a chat or saved beside a document.
