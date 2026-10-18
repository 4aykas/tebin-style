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
