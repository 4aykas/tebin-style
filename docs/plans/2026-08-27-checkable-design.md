# Checkable Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the design system checkable and portable — the binding surfaces
as data, a contrast lint that fails on a real ratio, declared omissions, YAML
front matter, a token diff, and an MCP surface for all of it.

**Architecture:** Four new pure modules (`contrast`, `lint`, `front-matter`,
`diff`) with no new runtime dependency. `theme.json` gains `surfaces` and
`omitted`. `design-doc.ts` prepends generated front matter. The MCP server
exposes lint and diff as tools and `design-md` as a `get_theme` format.

**Tech Stack:** TypeScript (ESM, `tsx`), Ajv 2020, Vitest 2, pnpm.

**Spec:** `docs/specs/2026-08-27-checkable-design-design.md`

## Global Constraints

- **No new runtime dependency.** YAML is emitted by hand; the shape is a flat
  map plus one nested level.
- **`tokens.json` stays canonical.** Front matter is generated like
  `tokens.css`, and `pnpm check` guards it.
- **A checker that cannot check something says so.** Unreachable pairs are
  reported as `info`, never skipped silently.
- **The floor is 4.5:1 with no automatic large-text exemption.** A role does
  not know its own font size.
- **`surfaces` values are theme-author values**, recorded as such, and every
  finding names the surface it used.
- Every task ends green on `pnpm test` and `pnpm validate`; the last also on
  `pnpm check`.

## File Structure

| File | Responsibility |
| --- | --- |
| `src/contrast.ts` | **new** — relative luminance and WCAG ratio, pure |
| `src/lint.ts` | **new** — findings for one theme directory |
| `src/front-matter.ts` | **new** — YAML front matter from `tokens.json` |
| `src/diff.ts` | **new** — token diff between two theme dirs + regression |
| `src/design-doc.ts` | prepend front matter |
| `schema/theme.schema.json` | declare `surfaces` and `omitted` |
| `themes/*/theme.json` | add `surfaces`, add `omitted` where an absence is real |
| `mcp/tools.ts` | `lint_theme`, `diff_themes`, `design-md` format |
| `src/registry.ts` | `design-md` in `FORMAT_FILES` |

---

### Task 1: `surfaces` and `omitted` in the manifest

**Files:** `schema/theme.schema.json`, `themes/*/theme.json`, `test/integrity.test.ts`

**Produces:** `theme.surfaces = { light: string, dark?: string }` and
`theme.omitted = Array<{ section: string, reason: string }>`, consumed by
Tasks 3 and 4.

- [ ] **Step 1:** Write a failing test in `test/integrity.test.ts` asserting
  every shipped theme declares `surfaces.light`, that `tebin` declares
  `surfaces.dark` too, and that a manifest with an `omitted` entry missing
  `reason` fails `validateThemeMetadata`.
- [ ] **Step 2:** Run `pnpm vitest run test/integrity.test.ts` — expect FAIL.
- [ ] **Step 3:** Add to `schema/theme.schema.json` `properties`:

```json
    "surfaces": {
      "type": "object",
      "additionalProperties": false,
      "required": ["light"],
      "properties": {
        "light": { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" },
        "dark":  { "type": "string", "pattern": "^#[0-9a-fA-F]{6}$" }
      }
    },
    "omitted": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["section", "reason"],
        "properties": {
          "section": { "type": "string", "minLength": 1 },
          "reason": { "type": "string", "minLength": 1 }
        }
      }
    }
```

- [ ] **Step 4:** Add the values. `tebin`:
  `"surfaces": { "light": "#EFEEE9", "dark": "#242830" }` — the darkest light
  surface and the lightest dark surface in use, the two every `*-on-*` token
  was measured against. `tebin-classic`: `{ "light": "#FFFFFF" }`.
  `slate`: `{ "light": "#FFFFFF" }`.
- [ ] **Step 5:** Declare the three known absences:
  - `slate`: `{ "section": "assets", "reason": "Token-only theme; no brand assets exist." }`
  - `tebin-classic`: `{ "section": "role.outline", "reason": "Document theme: table rules come from Word's table styles, and the 2017 brand book names no hairline colour." }` and `{ "section": "role.status", "reason": "A printed page has no error, warning or success state." }`
  - every theme: `{ "section": "components", "reason": "No canonical button exists across the TEBIN apps; codifying one would invent a house style." }`
- [ ] **Step 6:** `pnpm vitest run && pnpm validate` — expect PASS. Commit.

---

### Task 2: `src/contrast.ts`

**Produces:** `relativeLuminance(hex: string): number` and
`contrastRatio(a: string, b: string): number`, consumed by Task 3.

- [ ] **Step 1:** Write `test/contrast.test.ts` with known values: black on
  white is 21, a colour against itself is 1, and `#EA6359` on `#242830` is
  4.52 to two decimals (the figure already published in the token's
  description — the test proves the doc).
- [ ] **Step 2:** Run it — expect FAIL, module missing.
- [ ] **Step 3:** Implement, reusing `hexToRgb` from `src/colors-csv.ts` so
  hex parsing has one home:

```ts
import { hexToRgb } from './colors-csv.js';

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) throw new Error(`not an opaque hex colour: ${hex}`);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 4:** Run — expect PASS. Commit.

---

### Task 3: `src/lint.ts`

**Consumes:** Task 1's `surfaces`, Task 2's `contrastRatio`.
**Produces:** `lintTheme(themeDir: string): LintResult` where

```ts
export interface Finding {
  severity: 'error' | 'warning' | 'info';
  path: string;
  message: string;
  ratio?: number;
  required?: number;
}
export interface LintResult {
  findings: Finding[];
  summary: { errors: number; warnings: number; infos: number };
}
```

Consumed by Tasks 5 and 6.

- [ ] **Step 1:** Write `test/lint.test.ts` covering, on fixtures in a temp dir:
  a broken `{color.nope}` reference → one `warning`; a role pair under the
  floor → one `error` carrying `ratio` and `required: 4.5`; a role the
  convention cannot pair → one `info` whose message contains `not checked`; a
  theme with no `surfaces` → one `warning`; and, on the real `tebin` theme,
  `summary.errors === 0`.
- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** Implement. Resolution and pairing:
  - resolve `{a.b}` against the token tree; unresolved → `warning`.
  - `*-on-light` → `surfaces.light`; `*-on-dark` → `surfaces.dark` (missing
    `dark` while `*-on-dark` roles exist → `warning`).
  - `on-surface`, `on-surface-muted` → resolved `role.surface`.
  - any other role → `info`, message `"not checked: no surface pairing rule"`.
  - a resolved value that is not opaque hex → `info`, message
    `"not checked: not an opaque colour"` (the translucent scale needs a
    compositing model this lint does not have).
  - each checked pair emits `error` below 4.5, else `info` with the ratio.
- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5:** Add `pnpm lint:themes` to `package.json` scripts running
  `tsx scripts/lint.ts`, which lints every theme and exits non-zero on any
  error. Add the script. Commit.

---

### Task 4: `src/front-matter.ts`

**Consumes:** Task 1's `omitted`.
**Produces:** `buildFrontMatter(themeDir: string): string` — a `---`-fenced
YAML block ending in a newline. Consumed by Task 5.

- [ ] **Step 1:** Write `test/front-matter.test.ts`: the block opens and closes
  with `---`; `name` and `version` come from `theme.json`; `colors` carries the
  resolved role values as hex, not `{refs}`; `typography.h1.fontSize` is
  `38px` (the ceiling); `rounded` carries the radii; `spacing` carries the
  spacing steps and the container widths; `omitted` lists each declared
  section; and for `slate` the block contains no `typography` key at all
  (absent group → absent key, never an empty map).
- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** Implement. Emit by hand, two-space indent, quote every colour
  string. Map: `role` → `colors` (resolved), `type` + `lineHeight` +
  `fontWeight` → `typography` (each level gets `fontFamily` from
  `font.condensed` for `h*` and `font.sans` for `body`/`label*`, plus
  `fontSize`, `lineHeight`, `fontWeight` where known), `radius` → `rounded`,
  `spacing` + `layout` → `spacing`.
- [ ] **Step 4:** Run — expect PASS. Commit.

---

### Task 5: Front matter in the generated document

**Files:** `src/design-doc.ts`, `test/design-doc.test.ts`

- [ ] **Step 1:** Write a failing test: `buildDesignDoc` output starts with
  `---\n`, and the `# TEBIN — design` heading still appears after the closing
  fence.
- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** In `buildDesignDoc`, prepend `buildFrontMatter(themeDir)`
  before the `# ${theme.name} — design` line.
- [ ] **Step 4:** `pnpm build && pnpm test` — expect PASS, and
  `themes/*/DESIGN.md` now carries the block. Commit.

---

### Task 6: `src/diff.ts`

**Consumes:** Task 3's `lintTheme`.
**Produces:**

```ts
export interface DiffResult {
  tokens: Record<string, { added: string[]; removed: string[]; modified: string[] }>;
  findings: { before: LintResult['summary']; after: LintResult['summary']; delta: { errors: number; warnings: number } };
  regression: boolean;
}
export function diffThemes(beforeDir: string, afterDir: string): DiffResult;
```

- [ ] **Step 1:** Write `test/diff.test.ts` on temp fixtures: an added token
  appears in `added`; a changed `$value` in `modified`; a deleted token in
  `removed`; a diff of a theme against itself yields empty arrays and
  `regression: false`; and a change that introduces a contrast error yields
  `regression: true` while a change that merely removes a token does not.
- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** Implement. Flatten both token trees to `group.name` paths,
  compare by group. `regression = after.summary.errors > before.summary.errors`
  — nothing else.
- [ ] **Step 4:** Run — expect PASS. Commit.

---

### Task 7: MCP surface, docs, release

**Files:** `src/registry.ts`, `mcp/tools.ts`, `test/mcp.test.ts`,
`docs/guide/ai-agents.md`, `skill/tebin-style/SKILL.md`, `README.md`,
`CHANGELOG.md`, `package.json`

- [ ] **Step 1:** Write failing tests in `test/mcp.test.ts`: `get_theme` with
  `format: 'design-md'` returns the `DESIGN.md` content; `lint_theme({ id })`
  returns a summary with `errors === 0` for every shipped theme;
  `diff_themes({ a, b })` returns `regression: false` for a theme against
  itself.
- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** Add `'design-md': 'DESIGN.md'` to `FORMAT_FILES` and widen
  `Format`. Note `readFormat` reads from `dist/`, so `design-md` needs its own
  branch reading the theme root — add it there rather than moving the file.
- [ ] **Step 4:** Add `lintTheme` and `diffThemes` tool definitions to
  `toolDefinitions` with zod input schemas (`{ id }` and `{ a, b }`).
- [ ] **Step 5:** Run — expect PASS.
- [ ] **Step 6:** Document: the three new capabilities in
  `docs/guide/ai-agents.md`'s tool table, one line in the skill's rules
  section, `pnpm lint:themes` in `docs/guide/developers.md`, and a `## 1.3.0`
  CHANGELOG entry. Bump `package.json` to `1.3.0`.
- [ ] **Step 7:** `pnpm build && pnpm validate && pnpm test && pnpm check` —
  all green. Commit, merge, push.
