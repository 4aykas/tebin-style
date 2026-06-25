# TEBIN Classic Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `tebin-classic` theme (tokens + classic-colored logo assets) decomposed from the 2017 TEBIN style guide, add the six brand rules the guide states, then delete the source PDF.

**Architecture:** New theme directory under `themes/tebin-classic/` (theme.json + tokens.json + 4 SVG assets + README), built by the existing `pnpm build` pipeline into `dist/` and registered in `registry/index.json`. Six brand rules append to the shared `rules/rules.json` (category `brand`). Root README table and brand-rule test update to match.

**Tech Stack:** TypeScript, tsx, vitest, AJV, Style Dictionary. pnpm.

## Global Constraints

- Theme `id` must equal its folder name (`tebin-classic`) and match `^[a-z0-9]+(-[a-z0-9]+)*$` (`validateThemeDir`).
- Every asset `path` in `theme.json` must exist on disk; asset `type` ∈ `logo|favicon|font|icon|pattern|image`.
- Tokens follow DTCG: each leaf has `$type` ∈ `color|fontFamily|dimension|shadow|fontWeight|number|duration` and `$value`.
- Rule ids match `^[a-z0-9]+(-[a-z0-9]+)*$`; severity ∈ `MUST|SHOULD|NEVER`; new rules carry `source: "tebin brand"`.
- `registry/index.json` and `rules/dist/rules.md` are generated — never hand-edit; regenerate with `pnpm build`.
- Registry preview reads `color.brand`, `color.ink`, `color.topbar` from tokens (`PREVIEW_KEYS`).
- `test/docs.test.ts` asserts the root `README.md` contains every registry theme id.
- Guide values: red `#DA291C`, grey `#898D8D`, ink `#1A1A1A`, white `#FFFFFF`; secondary `#B02954 #A43F39 #EB807A #F38B4C #FBD551 #69B7C2 #B3B4B6 #CDCDCE`.
- Verification runs from repo root: `pnpm build`, `pnpm test`, `pnpm validate`, `pnpm check`.

---

## File Structure

- `themes/tebin-classic/theme.json` — new, metadata + asset manifest.
- `themes/tebin-classic/tokens.json` — new, DTCG tokens (source of truth).
- `themes/tebin-classic/README.md` — new, short.
- `themes/tebin-classic/assets/logo/logo-full.svg` — new, classic colors.
- `themes/tebin-classic/assets/logo/logo-full-white.svg` — new, all white.
- `themes/tebin-classic/assets/misc/corner-mark.svg` — new, red.
- `themes/tebin-classic/assets/misc/corner-mark-white.svg` — new, white.
- `themes/tebin-classic/dist/*` — generated.
- `registry/index.json` — regenerated.
- `rules/rules.json` — modify (append 6 brand rules).
- `rules/dist/rules.md` — regenerated.
- `README.md` — modify ("Available themes" table).
- `test/assets.test.ts` — modify (add tebin-classic describe block).
- `test/rules.test.ts` — modify (brand-rule set grows to 9).
- `.src/Tebin_Style_Guide.pdf`, `.src/` — delete.

---

### Task 1: Create the `tebin-classic` theme (tokens, assets, metadata, README)

**Files:**
- Create: `themes/tebin-classic/tokens.json`, `theme.json`, `README.md`, and the 4 SVGs above
- Regenerate: `registry/index.json` and `themes/tebin-classic/dist/*`
- Modify: `README.md` (root, "Available themes" table)
- Test: `test/assets.test.ts`

**Interfaces:**
- Consumes: `getTheme({ id, format? })` and `getAsset({ id, assetId? })` from `mcp/tools.ts`.
- Produces: theme id `tebin-classic`; asset ids `logo-full`, `logo-full-white`, `corner-mark`, `corner-mark-white`.

- [ ] **Step 1: Write the failing test**

Append to `test/assets.test.ts`:

```ts
import { getTheme } from '../mcp/tools.js';

describe('tebin-classic theme', () => {
  it('serves classic-colored tokens (guide red + grey)', () => {
    const t = getTheme({ id: 'tebin-classic', format: 'css' });
    expect(t.name).toBe('TEBIN Classic');
    expect(t.content).toContain('#da291c');
    expect(t.content).toContain('#898d8d');
  });

  it('serves the classic logo with guide red and grey', () => {
    const a = getAsset({ id: 'tebin-classic', assetId: 'logo-full' });
    expect(a.type).toBe('logo');
    expect(a.content).toContain('#DA291C');
    expect(a.content).toContain('#898D8D');
  });

  it('serves the classic white logo and corner marks', () => {
    expect(getAsset({ id: 'tebin-classic', assetId: 'logo-full-white' }).content).toContain('#fff');
    expect(getAsset({ id: 'tebin-classic', assetId: 'corner-mark' }).content).toContain('#DA291C');
    expect(getAsset({ id: 'tebin-classic', assetId: 'corner-mark-white' }).content).toContain('#fff');
  });
});
```

(Keep the existing `getAsset` import at the top of the file; add `getTheme` to it or as shown.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run test/assets.test.ts`
Expected: FAIL — `getTheme`/`getAsset` throw `NotFoundError: theme "tebin-classic" not found`.

- [ ] **Step 3: Create `tokens.json`**

Create `themes/tebin-classic/tokens.json`:

```json
{
  "color": {
    "brand":        { "$type": "color", "$value": "#DA291C" },
    "grey":         { "$type": "color", "$value": "#898D8D" },
    "ink":          { "$type": "color", "$value": "#1A1A1A" },
    "topbar":       { "$type": "color", "$value": "#FFFFFF" },
    "maroon":       { "$type": "color", "$value": "#B02954" },
    "brick":        { "$type": "color", "$value": "#A43F39" },
    "salmon":       { "$type": "color", "$value": "#EB807A" },
    "orange":       { "$type": "color", "$value": "#F38B4C" },
    "yellow":       { "$type": "color", "$value": "#FBD551" },
    "teal":         { "$type": "color", "$value": "#69B7C2" },
    "grey-light":   { "$type": "color", "$value": "#B3B4B6" },
    "grey-lighter": { "$type": "color", "$value": "#CDCDCE" }
  },
  "font": {
    "sans":     { "$type": "fontFamily", "$value": ["Roboto", "Arial", "Helvetica", "sans-serif"] },
    "document": { "$type": "fontFamily", "$value": ["Arial", "Helvetica", "sans-serif"] }
  },
  "fontWeight": {
    "regular": { "$type": "fontWeight", "$value": 400 },
    "medium":  { "$type": "fontWeight", "$value": 500 },
    "bold":    { "$type": "fontWeight", "$value": 700 },
    "black":   { "$type": "fontWeight", "$value": 900 }
  }
}
```

- [ ] **Step 4: Create the SVG assets**

Create `themes/tebin-classic/assets/logo/logo-full.svg` (classic colors: `.cls-2` red, `.cls-1` grey):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.33 166.23">
  <defs>
    <style>
      .cls-1 { fill: #898D8D; }
      .cls-2 { fill: #DA291C; }
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

Create `themes/tebin-classic/assets/logo/logo-full-white.svg`:

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

Create `themes/tebin-classic/assets/misc/corner-mark.svg`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="483.82 0 49.51 50.28">
  <path fill="#DA291C" d="M533.33,0v24.68h-49.51V0h49.51Z"/>
  <path fill="#DA291C" d="M533.33,50.28h-24.31V0h24.31v50.28Z"/>
</svg>
```

Create `themes/tebin-classic/assets/misc/corner-mark-white.svg`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="483.82 0 49.51 50.28">
  <path fill="#fff" d="M533.33,0v24.68h-49.51V0h49.51Z"/>
  <path fill="#fff" d="M533.33,50.28h-24.31V0h24.31v50.28Z"/>
</svg>
```

- [ ] **Step 5: Create `theme.json`**

Create `themes/tebin-classic/theme.json`:

```json
{
  "$schema": "../../schema/theme.schema.json",
  "id": "tebin-classic",
  "name": "TEBIN Classic",
  "description": "Faithful reproduction of the 2017 TEBIN print brand book: Pantone red + grey, Roboto / Arial, corporate-print identity.",
  "version": "1.0.0",
  "industry": ["engineering", "industrial", "b2b"],
  "mood": ["classic", "corporate", "print"],
  "source": { "url": "TEBIN Branding Principles & Style Guide (2017, Rev. A)", "extractedBy": "manual" },
  "license": { "tokens": "MIT", "assets": "© TEBIN — all rights reserved" },
  "author": "TEBIN",
  "createdAt": "2026-06-25",
  "updatedAt": "2026-06-25",
  "assets": [
    { "id": "logo-full", "type": "logo", "variant": "full", "format": "svg", "path": "assets/logo/logo-full.svg" },
    { "id": "logo-full-white", "type": "logo", "variant": "white", "format": "svg", "path": "assets/logo/logo-full-white.svg" },
    { "id": "corner-mark", "type": "pattern", "variant": "solid", "format": "svg", "path": "assets/misc/corner-mark.svg" },
    { "id": "corner-mark-white", "type": "pattern", "variant": "white", "format": "svg", "path": "assets/misc/corner-mark-white.svg" }
  ]
}
```

- [ ] **Step 6: Create the theme README**

Create `themes/tebin-classic/README.md`:

```markdown
# TEBIN Classic theme

Faithful reproduction of the 2017 *TEBIN Branding Principles & Style Guide*
(Rev. A): Pantone red (`#DA291C`) + grey (`#898D8D`), Roboto type with an Arial
fallback for MS Office documents. The print-era corporate identity, distinct
from the modern web `tebin` theme.

## Tokens

Canonical source: [`tokens.json`](./tokens.json) (DTCG). Generated outputs in
[`dist/`](./dist): `tokens.css`, `tailwind.css`, `tokens.dtcg.json`, `theme.ts`.
Includes the primary red/grey, the 8-color secondary palette, and Roboto weights.

## Assets

Logos live in [`assets/`](./assets). License: © TEBIN — all rights reserved
(do not reuse the TEBIN logo for other brands).

- `logo-full` — wordmark (red `TEB` + corner, grey `IN`).
- `logo-full-white` — all-white logo for dark or red backgrounds.
- `corner-mark` / `corner-mark-white` — the solid corner mark on its own.

See the `brand` rules in [`rules/dist/rules.md`](../../rules/dist/rules.md) for
logo usage (safezone, backgrounds, do-nots).
```

- [ ] **Step 7: Build and update the root README table**

Run: `pnpm build`
Expected: `built slate`, `built tebin`, `built tebin-classic`, `wrote registry/index.json (3 themes)`.

Then in root `README.md`, the "Available themes" table:

```markdown
| id | name | industry | preview (brand) |
|----|------|----------|-----------------|
| tebin | TEBIN | engineering, industrial | `#DA291C` |
| slate | Slate | saas, web, general | `#2563EB` |
```

becomes:

```markdown
| id | name | industry | preview (brand) |
|----|------|----------|-----------------|
| tebin | TEBIN | engineering, industrial | `#DA291C` |
| tebin-classic | TEBIN Classic | engineering, industrial | `#DA291C` |
| slate | Slate | saas, web, general | `#2563EB` |
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `pnpm exec vitest run test/assets.test.ts`
Expected: PASS (all describe blocks, including the new `tebin-classic theme`).

- [ ] **Step 9: Validate and drift-check**

Run: `pnpm validate && pnpm check`
Expected: `✓ tebin-classic`, `✓ registry/index.json`, `All themes valid.`, `No drift.`

- [ ] **Step 10: Commit**

```bash
git add themes/tebin-classic registry/index.json README.md test/assets.test.ts
git commit -m "feat: add TEBIN Classic theme decomposed from the 2017 style guide"
```

---

### Task 2: Brand rules from the guide

**Files:**
- Modify: `rules/rules.json` (append 6 objects)
- Regenerate: `rules/dist/rules.md`
- Modify: `test/rules.test.ts` (brand set is now 9)

**Interfaces:**
- Consumes: `filterRules({ category })`, `getRule(id)` from `src/rules.ts`.
- Produces: rule ids `brand-logo-safezone` (MUST), `brand-logo-white-rectangle-on-busy` (SHOULD), `brand-logo-no-distort` (NEVER), `brand-logo-no-shadow` (NEVER), `brand-logo-no-recolor` (NEVER), `brand-font-roboto-arial` (SHOULD).

- [ ] **Step 1: Update the failing test**

In `test/rules.test.ts`, the `brand logo rules` describe block currently asserts exactly three ids. Replace that block with:

```ts
describe('brand logo rules', () => {
  it('exposes the full brand-category rule set', () => {
    const ids = filterRules({ category: 'brand' }).map((r) => r.id).sort();
    expect(ids).toEqual([
      'brand-corner-mark-decorative',
      'brand-font-roboto-arial',
      'brand-logo-no-color-on-dark',
      'brand-logo-no-distort',
      'brand-logo-no-recolor',
      'brand-logo-no-shadow',
      'brand-logo-safezone',
      'brand-logo-white-on-dark',
      'brand-logo-white-rectangle-on-busy',
    ]);
  });

  it('assigns the expected severities', () => {
    expect(getRule('brand-logo-white-on-dark').severity).toBe('MUST');
    expect(getRule('brand-logo-no-color-on-dark').severity).toBe('NEVER');
    expect(getRule('brand-corner-mark-decorative').severity).toBe('SHOULD');
    expect(getRule('brand-logo-safezone').severity).toBe('MUST');
    expect(getRule('brand-logo-no-distort').severity).toBe('NEVER');
    expect(getRule('brand-logo-no-shadow').severity).toBe('NEVER');
    expect(getRule('brand-logo-no-recolor').severity).toBe('NEVER');
    expect(getRule('brand-logo-white-rectangle-on-busy').severity).toBe('SHOULD');
    expect(getRule('brand-font-roboto-arial').severity).toBe('SHOULD');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run test/rules.test.ts`
Expected: FAIL — the set assertion gets only the 3 existing ids; `getRule('brand-logo-safezone')` throws `NotFoundError`.

- [ ] **Step 3: Append the rules to `rules.json`**

In `rules/rules.json`, the array currently ends with the `brand-corner-mark-decorative` object followed by `]`. Add a comma after it and insert the six rules before the closing `]`:

```json
  { "id": "brand-corner-mark-decorative", "category": "brand", "severity": "SHOULD", "statement": "The corner mark may stand alone as a decorative marker signalling TEBIN authorship — typically the top-right corner of a photo or slide. Keep it brand red on light backgrounds and white on dark or red ones.", "tags": ["logo", "corner", "decoration"], "source": "tebin brand" },
  { "id": "brand-logo-safezone", "category": "brand", "severity": "MUST", "statement": "Keep clear space around the logo at least the height of the \"B\" in the wordmark on all sides.", "tags": ["logo", "clearspace"], "source": "tebin brand" },
  { "id": "brand-logo-white-rectangle-on-busy", "category": "brand", "severity": "SHOULD", "statement": "On colored or photographic backgrounds where the white logo lacks contrast, place the logo inside a white rectangle (e.g. sponsorship contexts).", "tags": ["logo", "contrast", "background"], "source": "tebin brand" },
  { "id": "brand-logo-no-distort", "category": "brand", "severity": "NEVER", "statement": "Never apply disproportional transforms to the logo or rescale its elements independently.", "tags": ["logo", "geometry"], "source": "tebin brand" },
  { "id": "brand-logo-no-shadow", "category": "brand", "severity": "NEVER", "statement": "Never add shadows or other effects to the logo.", "tags": ["logo", "effects"], "source": "tebin brand" },
  { "id": "brand-logo-no-recolor", "category": "brand", "severity": "NEVER", "statement": "Never recolor the logo outside the approved palette (red, grey, all-white, all-black).", "tags": ["logo", "color"], "source": "tebin brand" },
  { "id": "brand-font-roboto-arial", "category": "brand", "severity": "SHOULD", "statement": "Set brand text in Roboto; fall back to Arial where Roboto is unavailable (e.g. MS Office documents).", "tags": ["typography", "font"], "source": "tebin brand" }
]
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run test/rules.test.ts`
Expected: PASS.

- [ ] **Step 5: Regenerate the digest**

Run: `pnpm build`
Expected: `rules/dist/rules.md` `## brand` section now lists nine rules.

- [ ] **Step 6: Validate and drift-check**

Run: `pnpm validate && pnpm check`
Expected: `✓ rules`, `✓ rules/dist/rules.md`, `No drift.`, `All themes valid.`

- [ ] **Step 7: Commit**

```bash
git add rules/rules.json rules/dist/rules.md test/rules.test.ts
git commit -m "feat: add TEBIN brand logo + typography rules from the style guide"
```

---

### Task 3: Delete the source PDF

**Files:**
- Delete: `.src/Tebin_Style_Guide.pdf` and the `.src/` directory.

**Interfaces:**
- Consumes: nothing. Produces: nothing.

- [ ] **Step 1: Remove the PDF and directory**

Run: `rm -rf .src`
Expected: no output.

- [ ] **Step 2: Confirm it is gone**

Run: `ls .src 2>&1 || echo "removed"`
Expected: prints `removed` (path no longer exists).

- [ ] **Step 3: Full verification**

Run: `pnpm test && pnpm validate && pnpm check`
Expected: all suites pass; `All themes valid.`; `No drift.`

- [ ] **Step 4: Commit (if the PDF was tracked)**

The PDF lives in untracked `.src/`, so deleting it leaves nothing to commit. Confirm with `git status --short` — if `.src/` no longer appears, there is nothing to commit for this task. (If it had been tracked, run `git add -A .src && git commit -m "chore: remove decomposed source style-guide PDF"`.)

---

## Notes

- The existing `tebin` theme is intentionally untouched; TEBIN Classic uses the guide-exact `#DA291C` / `#898D8D`.
- Print-application specifics (pt sizes, mm layouts for business card / Word / PPT / certificate / policy) are brand *usage*, not tokens — out of scope per the spec.
- `scripts/build.ts` auto-discovers every directory under `themes/`, so no builder change is needed for the new theme.
