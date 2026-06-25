# TEBIN Logo Usage Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the white-on-dark logo + standalone corner-mark assets and encode three `brand` logo-usage rules so agents/designers can look them up.

**Architecture:** Add three SVG assets to the TEBIN theme and register them in `themes/tebin/theme.json`; add three rules under a new `brand` category in `rules/rules.json`; regenerate the derived `registry/index.json` and `rules/dist/rules.md` with the existing builders; update the theme README. Everything flows through the existing schema-validation, drift-check, and MCP surfaces unchanged.

**Tech Stack:** TypeScript, tsx, vitest, AJV (JSON Schema), Style Dictionary. Package manager: pnpm.

## Global Constraints

- Rule ids match `^[a-z0-9]+(-[a-z0-9]+)*$`; severity is one of `MUST` / `SHOULD` / `NEVER` (from `schema/rules.schema.json`).
- Asset `type` is one of `logo|favicon|font|icon|pattern|image`; asset entries require `id`, `type`, `format`, `path` (from `schema/theme.schema.json`).
- `theme.json` `id` must equal the folder name (`tebin`); every asset `path` must exist on disk (enforced by `validateThemeDir`).
- Derived files are generated — never hand-edit `registry/index.json` or `rules/dist/rules.md`. Regenerate with `pnpm build`.
- New rules carry `source: "tebin brand"`.
- Brand red is `#ee3124` (the value used inside the logo SVG); white is `#fff`.
- Verification per task runs from the repo root: `pnpm test`, `pnpm validate`, `pnpm check`.

---

## File Structure

- `themes/tebin/assets/logo/logo-full-white.svg` — new, all-white logo.
- `themes/tebin/assets/misc/corner-mark.svg` — new, solid red corner mark.
- `themes/tebin/assets/misc/corner-mark-white.svg` — new, solid white corner mark.
- `themes/tebin/theme.json` — modify `assets[]` (register the three).
- `rules/rules.json` — modify (append three `brand` rules).
- `registry/index.json` — regenerated (do not hand-edit).
- `rules/dist/rules.md` — regenerated (do not hand-edit).
- `themes/tebin/README.md` — modify (document new assets + rules).
- `test/assets.test.ts` — new (asset wiring).
- `test/rules.test.ts` — new (brand rules).

---

### Task 1: White logo + corner-mark assets

**Files:**
- Create: `themes/tebin/assets/logo/logo-full-white.svg`
- Create: `themes/tebin/assets/misc/corner-mark.svg`
- Create: `themes/tebin/assets/misc/corner-mark-white.svg`
- Modify: `themes/tebin/theme.json` (assets array, after the `logo-full` entry / alongside the misc entries)
- Regenerate: `registry/index.json`
- Test: `test/assets.test.ts`

**Interfaces:**
- Consumes: `getAsset({ id, assetId })` from `mcp/tools.ts` → `{ type, format, path, content, ... }` (reads `registry/index.json` + the asset file).
- Produces: asset ids `logo-full-white`, `corner-mark`, `corner-mark-white` in theme `tebin`.

- [ ] **Step 1: Write the failing test**

Create `test/assets.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getAsset } from '../mcp/tools.js';

describe('tebin brand assets', () => {
  it('serves the all-white logo (no brand red, no grey)', () => {
    const a = getAsset({ id: 'tebin', assetId: 'logo-full-white' });
    expect(a.type).toBe('logo');
    expect(a.format).toBe('svg');
    expect(a.content).toContain('#fff');
    expect(a.content).not.toContain('#808285');
    expect(a.content).not.toContain('#ee3124');
  });

  it('serves the solid red corner mark', () => {
    const a = getAsset({ id: 'tebin', assetId: 'corner-mark' });
    expect(a.type).toBe('pattern');
    expect(a.content).toContain('#ee3124');
  });

  it('serves the white corner mark (no brand red)', () => {
    const a = getAsset({ id: 'tebin', assetId: 'corner-mark-white' });
    expect(a.content).toContain('#fff');
    expect(a.content).not.toContain('#ee3124');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run test/assets.test.ts`
Expected: FAIL — `getAsset` throws `NotFoundError: asset "logo-full-white" not found in theme "tebin"`.

- [ ] **Step 3: Create the white logo SVG**

Create `themes/tebin/assets/logo/logo-full-white.svg` (same geometry as `logo-full.svg`, both classes white):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.33 166.23">
  <defs>
    <style>
      .cls-1, .cls-2 { fill: #fff; }
    </style>
  </defs>
  <path class="cls-2" d="M31.26,78.43H0v-28.16h94.18v28.16h-31.27v87.8h-31.65v-87.8Z"/>
  <path class="cls-2" d="M107.55,50.27h91.86v27.33h-60.53v17.56h54.82v25.35h-54.82v18.39h61.35v27.33h-92.67V50.27Z"/>
  <path class="cls-2" d="M215.85,50.27h58.57c14.36,0,24.47,3.64,31.16,10.43,4.57,4.64,7.34,10.77,7.34,19.05,0,13.42-7.51,21.37-17.62,25.84,13.86,4.63,22.68,12.59,22.68,28.65,0,19.88-15.99,31.97-43.24,31.97h-58.9V50.27ZM266.59,96.49c9.63,0,15.01-3.31,15.01-10.43,0-6.3-4.89-9.94-14.35-9.94h-20.56v20.37h19.9ZM271.16,140.39c9.63,0,15.17-3.81,15.17-10.93,0-6.3-4.9-10.43-15.5-10.43h-24.15v21.36h24.47Z"/>
  <path class="cls-1" d="M328.56,50.27h31.81v115.96h-31.81V50.27Z"/>
  <path class="cls-1" d="M375.96,50.27h29.53l46.99,61.29v-61.29h31.33v115.96h-27.74l-48.78-63.61v63.61h-31.33V50.27Z"/>
  <g>
    <path class="cls-2" d="M533.33,0v24.68h-49.51V0h49.51Z"/>
    <path class="cls-2" d="M533.33,50.28h-24.31V0h24.31v50.28Z"/>
  </g>
</svg>
```

- [ ] **Step 4: Create the solid red corner mark SVG**

Create `themes/tebin/assets/misc/corner-mark.svg` (the two corner paths from the logo, tight viewBox, no coordinate changes):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="483.82 0 49.51 50.28">
  <path fill="#ee3124" d="M533.33,0v24.68h-49.51V0h49.51Z"/>
  <path fill="#ee3124" d="M533.33,50.28h-24.31V0h24.31v50.28Z"/>
</svg>
```

- [ ] **Step 5: Create the white corner mark SVG**

Create `themes/tebin/assets/misc/corner-mark-white.svg`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="483.82 0 49.51 50.28">
  <path fill="#fff" d="M533.33,0v24.68h-49.51V0h49.51Z"/>
  <path fill="#fff" d="M533.33,50.28h-24.31V0h24.31v50.28Z"/>
</svg>
```

- [ ] **Step 6: Register the assets in `theme.json`**

In `themes/tebin/theme.json`, the `assets` array currently ends:

```json
    { "id": "corner-outline", "type": "pattern", "format": "svg", "path": "assets/misc/corner_outline.svg" },
    { "id": "fxptebin", "type": "image", "format": "png", "path": "assets/misc/fxptebin.png" }
  ]
```

Replace with (adds `logo-full-white` after `logo-full`, and the two corner marks in misc):

```json
    { "id": "logo-full", "type": "logo", "variant": "full", "format": "svg", "path": "assets/logo/logo-full.svg" },
    { "id": "logo-full-white", "type": "logo", "variant": "white", "format": "svg", "path": "assets/logo/logo-full-white.svg" },
    { "id": "favicon-svg", "type": "favicon", "format": "svg", "path": "assets/favicon/favicon.svg" },
    { "id": "favicon-png", "type": "favicon", "format": "png", "path": "assets/favicon/favicon.png" },
    { "id": "favicon-ico", "type": "favicon", "format": "ico", "path": "assets/favicon/favicon.ico" },
    { "id": "corner-outline", "type": "pattern", "format": "svg", "path": "assets/misc/corner_outline.svg" },
    { "id": "corner-mark", "type": "pattern", "variant": "solid", "format": "svg", "path": "assets/misc/corner-mark.svg" },
    { "id": "corner-mark-white", "type": "pattern", "variant": "white", "format": "svg", "path": "assets/misc/corner-mark-white.svg" },
    { "id": "fxptebin", "type": "image", "format": "png", "path": "assets/misc/fxptebin.png" }
  ]
```

(Keep the existing earlier entries; the snippet above is the full final array tail starting at `logo-full`.)

- [ ] **Step 7: Regenerate the registry index**

Run: `pnpm build`
Expected: prints `wrote registry/index.json (2 themes)` among the build output; `registry/index.json` now lists the three new assets under the `tebin` theme.

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm exec vitest run test/assets.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 9: Validate and drift-check**

Run: `pnpm validate && pnpm check`
Expected: `✓ tebin`, `✓ registry/index.json`, `✓ rules/dist/rules.md`, `No drift.`, `All themes valid.`

- [ ] **Step 10: Commit**

```bash
git add themes/tebin/assets/logo/logo-full-white.svg \
        themes/tebin/assets/misc/corner-mark.svg \
        themes/tebin/assets/misc/corner-mark-white.svg \
        themes/tebin/theme.json registry/index.json test/assets.test.ts
git commit -m "feat: add white logo + solid corner-mark assets to TEBIN theme"
```

---

### Task 2: Brand logo-usage rules

**Files:**
- Modify: `rules/rules.json` (append three objects)
- Regenerate: `rules/dist/rules.md`
- Test: `test/rules.test.ts`

**Interfaces:**
- Consumes: `filterRules({ category })` and `getRule(id)` from `src/rules.ts`.
- Produces: rule ids `brand-logo-white-on-dark` (MUST), `brand-logo-no-color-on-dark` (NEVER), `brand-corner-mark-decorative` (SHOULD), all `category: "brand"`.

- [ ] **Step 1: Write the failing test**

Create `test/rules.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { filterRules, getRule } from '../src/rules.js';

describe('brand logo rules', () => {
  it('exposes exactly the three brand-category rules', () => {
    const ids = filterRules({ category: 'brand' }).map((r) => r.id).sort();
    expect(ids).toEqual([
      'brand-corner-mark-decorative',
      'brand-logo-no-color-on-dark',
      'brand-logo-white-on-dark',
    ]);
  });

  it('assigns the expected severities', () => {
    expect(getRule('brand-logo-white-on-dark').severity).toBe('MUST');
    expect(getRule('brand-logo-no-color-on-dark').severity).toBe('NEVER');
    expect(getRule('brand-corner-mark-decorative').severity).toBe('SHOULD');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run test/rules.test.ts`
Expected: FAIL — first assertion gets `[]`; `getRule` throws `NotFoundError: rule "brand-logo-white-on-dark" not found`.

- [ ] **Step 3: Append the rules to `rules.json`**

In `rules/rules.json`, the array currently ends with the `theming-native-select-colors` object followed by `]`. Change that last object's line to end with a comma and add the three rules before the closing `]`:

```json
  { "id": "theming-native-select-colors", "category": "theming", "severity": "MUST", "statement": "Give native <select> an explicit background-color and color (Windows fix).", "tags": ["theming"], "source": "tebin AGENTS.md" },
  { "id": "brand-logo-white-on-dark", "category": "brand", "severity": "MUST", "statement": "On dark or saturated brand-color (e.g. corporate red) backgrounds, use the all-white monochrome logo — the corner mark and every letter white.", "rationale": "The two-color logo loses the grey \"IN\" and puts red on red.", "tags": ["logo", "contrast", "color"], "source": "tebin brand" },
  { "id": "brand-logo-no-color-on-dark", "category": "brand", "severity": "NEVER", "statement": "Never place the two-color (red/grey) logo on a dark or red background; switch to the all-white logo instead.", "tags": ["logo", "contrast", "color"], "source": "tebin brand" },
  { "id": "brand-corner-mark-decorative", "category": "brand", "severity": "SHOULD", "statement": "The corner mark may stand alone as a decorative marker signalling TEBIN authorship — typically the top-right corner of a photo or slide. Keep it brand red on light backgrounds and white on dark or red ones.", "tags": ["logo", "corner", "decoration"], "source": "tebin brand" }
]
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run test/rules.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Regenerate the rules digest**

Run: `pnpm build`
Expected: `rules/dist/rules.md` now contains a `## brand` section listing the three rules (MUST/NEVER/SHOULD).

- [ ] **Step 6: Validate and drift-check**

Run: `pnpm validate && pnpm check`
Expected: `✓ rules`, `✓ rules/dist/rules.md`, `No drift.`, `All themes valid.` (schema valid, no duplicate ids, digest in sync).

- [ ] **Step 7: Commit**

```bash
git add rules/rules.json rules/dist/rules.md test/rules.test.ts
git commit -m "feat: add brand logo-usage rules (white-on-dark, corner mark)"
```

---

### Task 3: Document the new assets and rules

**Files:**
- Modify: `themes/tebin/README.md`

**Interfaces:**
- Consumes: nothing. Produces: nothing (documentation only).

- [ ] **Step 1: Update the theme README**

In `themes/tebin/README.md`, replace the `## Assets` section:

```markdown
## Assets

Logos and favicons live in [`assets/`](./assets). License: © TEBIN — all rights
reserved (do not reuse the TEBIN logo for other brands).
```

with:

```markdown
## Assets

Logos and favicons live in [`assets/`](./assets). License: © TEBIN — all rights
reserved (do not reuse the TEBIN logo for other brands).

- `logo-full` — default two-color logo (red `TEB` + corner, grey `IN`).
- `logo-full-white` — all-white monochrome logo for dark or red backgrounds.
- `corner-mark` / `corner-mark-white` — the solid corner mark on its own, for
  use as a decorative TEBIN marker (e.g. top-right of a photo or slide).

### Logo usage

See the `brand` rules in [`rules/dist/rules.md`](../../rules/dist/rules.md):
on dark or corporate-red backgrounds use the all-white logo (corner and all
letters white); never place the two-color logo there.
```

- [ ] **Step 2: Full verification**

Run: `pnpm test && pnpm validate && pnpm check`
Expected: all vitest suites pass; `All themes valid.`; `No drift.`

- [ ] **Step 3: Commit**

```bash
git add themes/tebin/README.md
git commit -m "docs: document TEBIN white logo + corner-mark assets and usage rules"
```

---

## Notes

- "Validation" here is schema validation + digest drift-check + MCP exposure, not a runtime contrast linter (see the spec's non-goals).
- No existing test pins the asset count or rule-category set, so the additions do not break current suites; `test/docs.test.ts` only checks theme ids and pnpm script names in the root README, which are unaffected.
