# Checkable design: front matter, contrast lint, diff — design

Status: accepted · 2026-08-27 · follows `2026-08-27-token-depth-design.md`

## Why

Tranche 1 gave the themes real tokens. This tranche makes the design system
**checkable and portable**, which is the half the DESIGN.md format got right
and we do not have.

The pointed version: `rules.json` carries

> `[SHOULD]` Make a design policy checkable; a policy that lives only in prose
> is enforced only where somebody remembered it.

with the rationale that a no-webfont rule written in `AGENTS.md` was honoured
on the English pages and quietly not on thirty localized copies, so 31 public
pages fetched a Google font for a year. **This repository breaks that rule on
its own territory.** Every contrast figure it publishes lives in a
`$description` string:

- `"4.5:1 on #242830, the lightest dark surface in use"`
- `"Lowest step that clears 4.5:1 on the cream band"`
- `"0.45 lands at 4.3:1 on #111318, just under the floor"`

Nothing verifies any of them. Change a colour and the prose keeps its old
number, confidently.

## What lands

1. **`surfaces` in `theme.json`** — the binding surfaces as data, not prose.
2. **A contrast lint** that reads them and fails on a real ratio.
3. **`omitted`** — declared absence with a documented reason.
4. **YAML front matter** in the generated `DESIGN.md`.
5. **A token diff** with a regression flag.
6. **MCP surface** for all of it.

## Decisions

### D1 — The binding surfaces become data

The two numbers every text colour was measured against — `#EFEEE9`, the
darkest light surface in use, and `#242830`, the lightest dark one — appear
today only inside prose. They move into `theme.json`:

```json
"surfaces": { "light": "#EFEEE9", "dark": "#242830" }
```

This is the whole reason a lint is possible. Without it the checker would have
to guess which surface a token was meant for, and a guessing checker is worse
than none.

Picking the **binding** surface rather than a typical one is the rule from
`[[accessible-brand-colour]]`: choose against the lightest dark background and
the darkest light background in actual use, and every other surface passes for
free. A theme with no dark family declares only `light`.

### D2 — The lint pairs by name convention, and says what it could not check

Pairing is mechanical:

| Role suffix | Checked against |
| --- | --- |
| `*-on-light` | `surfaces.light` |
| `*-on-dark` | `surfaces.dark` |
| `on-surface`, `on-surface-muted` | `role.surface` |

Anything the convention does not reach is reported as `info: not checked`, not
silently skipped. A checker that quietly covers half the palette reads as
"everything passes" — the same failure the rules database already names.

Findings are JSON: `{ severity, path, message, ratio?, required? }` with an
`errors`/`warnings`/`infos` summary. `error` for a text role under its floor,
`warning` for a broken reference or an undeclared surface, `info` for
unreachable pairs and for passes worth seeing.

The floor is 4.5:1. Large-text roles are not exempted automatically — a role
does not know its own font size, and inventing an exemption is how a checker
starts lying.

### D3 — Front matter is generated, and says the size is a ceiling

`DESIGN.md` gains YAML front matter mapping our groups onto the spec's:
`role` → `colors`, `type` + `lineHeight` + `fontWeight` → `typography`,
`spacing` + `layout` → `spacing`, `radius` → `rounded`.

A fluid token contributes its **ceiling** as `fontSize`, which is valid under a
format whose `Dimension` admits only px/em/rem, and the prose beneath already
says the number is a ceiling. `omitted` is emitted from the declaration in D4.

Written by hand, not by a YAML library. The shape is a flat map plus one nested
level, and a dependency for that is not worth the supply chain.

### D4 — `omitted` is a declaration with a reason

In `theme.json`:

```json
"omitted": [
  { "section": "assets", "reason": "Token-only theme; no brand assets exist." }
]
```

The lint stops warning about a declared absence. An undeclared absence still
warns — that is the point of the mechanism. Three absences are known and get
declared: slate has no assets, `tebin-classic` has no `outline` and no status
roles, and no theme has component tokens.

### D5 — Diff compares two theme directories, and defines regression narrowly

`diff(a, b)` returns added / removed / modified per token group, plus each
side's lint summary and a `regression` boolean.

**A regression is an increase in lint errors.** Not a removed token — removing
one may be the point of the change. Not a changed value. A narrow definition
that is always true beats a broad one that gets ignored.

## Non-goals

- No component tokens. Unchanged from tranche 1.
- No new runtime dependency.
- The front matter does not become a source of truth. `tokens.json` stays DTCG
  and stays canonical; the front matter is generated like `tokens.css`.
- No automatic fixing. The lint reports; a human or an agent decides.

## Risk the author is accepting

`surfaces` is a new required-ish field with values taken from the site rather
than from the brand book. It is recorded as a theme-author value, the same way
`ink` and `topbar` already are, and the lint's output names the surface in
every finding so a wrong surface is visible rather than silent.
