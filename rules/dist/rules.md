# Design rules

> Generated from `rules/rules.json` — do not edit by hand.

## accessibility

- **[NEVER]** Never disable browser zoom (user-scalable=no or maximum-scale=1).

## animation

- **[MUST]** Honor prefers-reduced-motion with a reduced or disabled variant.
- **[MUST]** Animate only compositor-friendly properties (transform, opacity). — _Avoids layout thrash and jank._
- **[NEVER]** Never use transition: all; list the properties explicitly.

## brand

- **[MUST]** On dark or saturated brand-color (e.g. corporate red) backgrounds, use the all-white monochrome logo — the corner mark and every letter white. — _The two-color logo loses the grey "IN" and puts red on red._
- **[NEVER]** Never place the two-color (red/grey) logo on a dark or red background; switch to the all-white logo instead.
- **[SHOULD]** The corner mark may stand alone as a decorative marker signalling TEBIN authorship — typically the top-right corner of a photo or slide. Keep it brand red on light backgrounds and white on dark or red ones.
- **[MUST]** Keep clear space around the logo at least the height of the "B" in the wordmark on all sides.
- **[SHOULD]** On colored or photographic backgrounds where the white logo lacks contrast, place the logo inside a white rectangle (e.g. sponsorship contexts).
- **[NEVER]** Never apply disproportional transforms to the logo or rescale its elements independently.
- **[NEVER]** Never add shadows or other effects to the logo.
- **[NEVER]** Never recolor the logo outside the approved palette (red, grey, all-white, all-black).
- **[SHOULD]** Set brand text in Roboto; fall back to Arial where Roboto is unavailable (e.g. MS Office documents).

## content

- **[MUST]** Prefer native semantics (button, a, label, table) before ARIA.
- **[MUST]** Give icon-only buttons a descriptive aria-label.
- **[MUST]** Convey status with more than color alone; pair icons with text labels.
- **[MUST]** Use font-variant-numeric: tabular-nums when comparing numbers in columns.

## feedback

- **[MUST]** Confirm destructive actions or provide an Undo window.
- **[MUST]** Announce toasts and inline validation with a polite aria-live region.
- **[SHOULD]** Use optimistic UI; reconcile on response and roll back or offer Undo on failure.

## forms

- **[MUST]** Use a font-size of at least 16px on mobile inputs to prevent iOS zoom.
- **[MUST]** Loading buttons show a spinner and keep their original label. — _Avoids layout shift and keeps the action legible while pending._
- **[NEVER]** Never block paste in inputs or textareas.
- **[MUST]** Enter submits a focused single-line input; in a textarea, Cmd/Ctrl+Enter submits.
- **[MUST]** Show validation errors inline next to fields and focus the first error on submit.
- **[MUST]** Set autocomplete and a meaningful name, with the correct type and inputmode.
- **[MUST]** Warn before navigating away from unsaved changes.

## interactions

- **[MUST]** Provide visible focus rings using :focus-visible, grouped with :focus-within where appropriate. — _Keyboard users must see where focus is._
- **[NEVER]** Never set outline: none without providing a visible focus replacement.
- **[MUST]** Support full keyboard interaction per the WAI-ARIA Authoring Practices.

## layout

- **[MUST]** Verify layouts on mobile, laptop, and ultra-wide (simulate ultra-wide at 50% zoom).
- **[MUST]** Respect safe areas using env(safe-area-inset-*).
- **[MUST]** Give flex children min-width: 0 so they can truncate.

## navigation

- **[MUST]** Use <a>/<Link> for navigation so Cmd/Ctrl/middle-click work.
- **[NEVER]** Never use a div with onClick for navigation.
- **[MUST]** Reflect state in the URL (filters, tabs, pagination, expanded panels) for deep-linking.

## performance

- **[MUST]** Set explicit image dimensions to prevent layout shift (CLS).
- **[MUST]** Virtualize large lists (more than about 50 items).
- **[MUST]** Preload above-the-fold images and lazy-load the rest.

## theming

- **[MUST]** Set color-scheme: dark on <html> for dark themes.
- **[MUST]** Give native <select> an explicit background-color and color (Windows fix).

## touch

- **[MUST]** Use hit targets of at least 24px (44px on mobile); expand the hit area if the visual is smaller.
- **[MUST]** Set touch-action: manipulation to prevent double-tap zoom delays.
