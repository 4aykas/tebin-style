# Design rules

> Generated from `rules/rules.json` — do not edit by hand.

## accessibility

- **[NEVER]** (web) Never disable browser zoom (user-scalable=no or maximum-scale=1).
- **[MUST]** (web) Text meets 4.5:1 against its own background (3:1 at 24px or larger). On the dark bands that means --on-dark-6 or stronger; on the cream band, --on-light-3 or stronger. The fainter steps are for decoration, not type. — _Before this rule the faintest labels on tebin.pro measured 1.8:1._
- **[MUST]** (tebin, web) Set body content, list items, table headers and clickable text at 11px or larger, and 13px or larger for running lists. Reserve 9px mono for non-essential kickers and codes.

## animation

- **[MUST]** (web) Honor prefers-reduced-motion with a reduced or disabled variant.
- **[MUST]** (web) Animate only compositor-friendly properties (transform, opacity). — _Avoids layout thrash and jank._
- **[NEVER]** (web) Never use transition: all; list the properties explicitly.
- **[NEVER]** (tebin, web) Never use overshoot or bounce easing (a cubic-bezier whose second control point exceeds 1) on UI state — reveals, buttons, modals, tooltips. — _Overshoot on UI state is a recognised generated-design tell; reserve it for genuine physical interactions such as a drag release._
- **[SHOULD]** (tebin, web) Limit scroll reveals to one orchestrated entrance plus the major content blocks; never stagger every item of a mapped list or fade in every section head. — _When everything animates on scroll the page never settles, and a staggered list is the clearest sign the reveal was applied by rule rather than by intent._

## brand

- **[MUST]** (tebin, tebin-classic) On dark or saturated brand-color (e.g. corporate red) backgrounds, use the all-white monochrome logo — the corner mark and every letter white. — _The two-color logo loses the grey "IN" and puts red on red._
- **[NEVER]** (tebin, tebin-classic) Never place the two-color (red/grey) logo on a dark or red background; switch to the all-white logo instead.
- **[SHOULD]** (tebin, tebin-classic) The corner mark may stand alone as a decorative marker signalling TEBIN authorship — typically the top-right corner of a photo or slide. Keep it brand red on light backgrounds and white on dark or red ones.
- **[MUST]** (tebin, tebin-classic) Keep clear space around the logo at least the height of the "B" in the wordmark on all sides.
- **[NEVER]** (tebin, tebin-classic) Never re-create the wordmark by typing TEBIN in a font. The letterforms are drawn outlines, not type. Insert the supplied asset: SVG on the web, and PNG in Word, Excel, PowerPoint or anything else that cannot embed SVG. — _An agent handed only the repository link repeatedly styled the name as text instead of fetching the logo, which produces letterforms that are not the logo at all. The other brand rules govern placing the logo and quietly assume you already have the file; none of them forbids drawing it yourself, so a careful agent could follow every rule and still ship the wrong mark._
- **[SHOULD]** (tebin, tebin-classic) On a busy or photographic background where the white logo lacks contrast, place the approved two-colour logo on a solid white rectangle with the required clear space. Do not place the white logo on white.
- **[NEVER]** (tebin, tebin-classic) Never apply disproportional transforms to the logo or rescale its elements independently.
- **[NEVER]** (tebin, tebin-classic) Never add shadows or other effects to the logo.
- **[NEVER]** (tebin, tebin-classic) Never recolor the logo outside the approved palette (red, grey, all-white, all-black).
- **[SHOULD]** (tebin, tebin-classic) For Classic corporate material, use Roboto where available and Arial in Office documents. For Modern, use the font stacks defined by the theme and respect the target project's font-loading policy.

## content

- **[MUST]** (web) Prefer native semantics (button, a, label, table) before ARIA.
- **[MUST]** (web) Give icon-only buttons a descriptive aria-label.
- **[MUST]** (web) Convey status with more than color alone; pair icons with text labels.
- **[MUST]** (web) Use font-variant-numeric: tabular-nums when comparing numbers in columns.
- **[NEVER]** (tebin, web) Never re-draw operating-system or browser chrome — traffic-light window bars, phone frames, fake IDE tabs — around a screenshot or code block; frame them typographically instead, with a rule, a filename and a rule. — _The reader already has real chrome; a painted-on copy is always slightly wrong and advertises that the surface is fake._
- **[SHOULD]** (tebin, web) Use a numbered section eyebrow only where the content is genuinely ordinal, cap it at one or two per page, and stack the heading directly beneath it rather than beside it. — _Numbering every section erases the hierarchy it implies — when each one is a chapter, none is._

## feedback

- **[MUST]** (web) Confirm destructive actions or provide an Undo window.
- **[MUST]** (web) Announce toasts and inline validation with a polite aria-live region.
- **[SHOULD]** (web) Use optimistic UI; reconcile on response and roll back or offer Undo on failure.

## forms

- **[MUST]** (web) Use a font-size of at least 16px on mobile inputs to prevent iOS zoom.
- **[MUST]** (web) Loading buttons show a spinner and keep their original label. — _Avoids layout shift and keeps the action legible while pending._
- **[NEVER]** (web) Never block paste in inputs or textareas.
- **[MUST]** (web) Enter submits a focused single-line input; in a textarea, Cmd/Ctrl+Enter submits.
- **[MUST]** (web) Show validation errors inline next to fields and focus the first error on submit.
- **[MUST]** (web) Set autocomplete and a meaningful name, with the correct type and inputmode.
- **[MUST]** (web) Warn before navigating away from unsaved changes.

## interactions

- **[MUST]** (web) Provide visible focus rings using :focus-visible, grouped with :focus-within where appropriate. — _Keyboard users must see where focus is._
- **[NEVER]** (web) Never set outline: none without providing a visible focus replacement.
- **[MUST]** (web) Support full keyboard interaction per the WAI-ARIA Authoring Practices.

## layout

- **[MUST]** (web) Verify layouts on mobile, laptop, and ultra-wide (simulate ultra-wide at 50% zoom).
- **[MUST]** (web) Respect safe areas using env(safe-area-inset-*).
- **[MUST]** (web) Give flex children min-width: 0 so they can truncate.

## navigation

- **[MUST]** (web) Use <a>/<Link> for navigation so Cmd/Ctrl/middle-click work.
- **[NEVER]** (web) Never use a div with onClick for navigation.
- **[MUST]** (web) Reflect state in the URL (filters, tabs, pagination, expanded panels) for deep-linking.

## performance

- **[MUST]** (web) Set explicit image dimensions to prevent layout shift (CLS).
- **[MUST]** (web) Virtualize large lists (more than about 50 items).
- **[MUST]** (web) Preload above-the-fold images and lazy-load the rest.
- **[NEVER]** (web) Never add a webfont request to a project that deliberately ships none. — _On tebin.pro the font stack is unloaded on purpose; a well-meant @font-face or Google Fonts link silently changes every page._

## theming

- **[MUST]** (web) Set color-scheme: dark on <html> for dark themes.
- **[MUST]** (web) Give native <select> an explicit background-color and color (Windows fix).
- **[MUST]** (web) Resolve every colour through a named token; do not write hex or rgba() literals in component styles. — _Ad-hoc literals accumulated to roughly 3000 values across tebin.pro, which turned a contrast change into a repository-wide sweep instead of a single edit._
- **[MUST]** (tebin, web) Take translucent colours from the scale — on-dark, on-light, rule-dark, rule-light, surface-dark, brand-a — rather than inventing an alpha per use. — _Forty-odd different white alphas read as looseness even when no single value looks wrong._
- **[NEVER]** (tebin, web) Never use #fff as a page or panel surface; use --color-paper. — _Pure white reads flat and synthetic beside the cream band and the dark sections._
- **[SHOULD]** (tebin, web) On dark surfaces express elevation with a lighter surface step, not a shadow. — _A shadow on a dark ground reads as a coloured halo rather than as depth._
- **[SHOULD]** (web) Make a design policy checkable; a policy that lives only in prose is enforced only where somebody remembered it. — _A no-webfont rule written in AGENTS.md was honoured on the English pages and quietly not on the thirty localized copies, so 31 public pages fetched a Google font for a year._

## touch

- **[MUST]** (web) Use hit targets of at least 24px (44px on mobile); expand the hit area if the visual is smaller.
- **[MUST]** (web) Set touch-action: manipulation to prevent double-tap zoom delays.

## typography

- **[NEVER]** (tebin, web) A heading never breaks a word — not mid-letter and not with a hyphen. Do not put hyphens: auto, overflow-wrap: anywhere or &shy; on display type; resize the type or rewrite the line. — _Settled by the owner on 2026-07-29, reversing a sweep of 177 wrap rules made the day before; &shy; is not an escape hatch because the HTML minifier strips it._
- **[SHOULD]** (tebin, web) Body copy carries overflow-wrap: anywhere and hyphens: auto so long technical strings cannot overflow their column. — _The pair is right for running text and wrong for display type — the distinction is the rule._
- **[MUST]** (tebin, web) Size display type against the locale with the longest words, not against the source language. — _A vw-based display size that fits English becomes an English-only cap in a fractional grid column: German compounds overlapped the next column by up to 343px on production._
- **[NEVER]** (tebin, web) Never set a negative letter-spacing; tracking is zero or positive.
- **[NEVER]** (tebin, web) Never use <br> inside a heading to shape its lines. — _It welds words together for anything reading textContent, and it fixes a line count that every other breakpoint has to live with._
- **[SHOULD]** (tebin, web) Take heading sizes from the global type scale (type.h1 … type.h5 in the theme) rather than from per-page clamp() overrides. — _Page-local overrides accumulated until the global heading styles described almost nothing that shipped._
- **[SHOULD]** (tebin, web) Shape a heading's lines with text-wrap: balance (text-pretty for running text); it is the supported replacement for the manual <br> and hyphenation the other heading rules forbid. — _Two NEVER rules remove every manual way to even out a ragged heading without naming the one that works, and a rule that forbids the only known method is a rule people break._
