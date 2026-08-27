# Token Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every theme the tokens an agent needs to build a page — semantic
roles, the accessible brand text colours, a typography scale and a spacing
scale — without renaming anything or breaking a consumer.

**Architecture:** All four additions are ordinary DTCG token groups in each
theme's `tokens.json`. Roles are aliases (`{color.brand}`), which Style
Dictionary v4 resolves natively; `tokens.css` emits them as `var()` references
via `outputReferences`. The fluid type and spacing scales keep their real
`clamp()` values through a custom transform that reads a
`$extensions["pro.tebin.fluid"]` triple, while `$value` holds the plain-`px`
maximum so the file stays valid under both DTCG and the DESIGN.md spec.

**Tech Stack:** TypeScript (ESM, `tsx`), Style Dictionary v4 (`usesDtcg: true`),
Ajv 2020, Vitest 2, pnpm.

**Spec:** `docs/specs/2026-08-27-token-depth-design.md`

## Global Constraints

- **Nothing is renamed and no existing value changes.** `brand`, `paper`, `ink`,
  `muted`, `rule`, `subtle`, `topbar`, `charcoal`, `brand-dark` keep their names
  and values. Consumers are tebin.pro, cv-astro, tebin-expenses, the npm package
  and the brand pack.
- **Print values come only from the 2017 brand book, never converted from RGB.**
  New colours carry no `pro.tebin.print` block, so `colors-csv.ts` prints
  `not specified in the 2017 brand book` for them. Do not add one.
- **The accessible red lands in `themes/tebin` only.** `tebin-classic` is the
  print/document theme and the ratios were measured against the web theme's
  surfaces. Do not copy the values across; do not invent classic equivalents.
- **No font request is added anywhere.** The no-webfont decision is a `NEVER`
  rule. A type scale sizes text; it does not load a face.
- **Licence split unchanged:** tokens MIT, assets "© TEBIN — all rights
  reserved".
- **`components` is out of scope.** So are the YAML front matter, the WCAG
  linter and the version diff — those are tranche 2, a separate plan.
- Every task ends green on `pnpm test` **and** `pnpm validate`. The last task
  additionally ends green on `pnpm check`.

## Verified mechanics (probed 2026-08-27, do not re-litigate)

These were confirmed by running Style Dictionary against a scratch theme:

- `size/rem` in the `css` transform group **does not** rewrite string dimensions.
  `"8px"` stays `8px`; `"38px"` stays `38px`.
- `outputReferences: true` on `css/variables` renders an alias as
  `--role-primary: var(--color-brand);`.
- On a platform with `transforms: []`, an alias resolves to its literal
  (`{color.brand}` → `#DA291C`) on `$value`, while `original.$value` keeps the
  reference string.
- `$extensions` survives onto the token object, so a custom transform can read
  `token.$extensions['pro.tebin.fluid']`.
- The `css` transform group is:
  `["attribute/cti","name/kebab","time/seconds","html/icon","size/rem","color/css","asset/url","fontFamily/css","cubicBezier/css","strokeStyle/css/shorthand","border/css/shorthand","typography/css/shorthand","transition/css/shorthand","shadow/css/shorthand"]`

## File Structure

| File | Responsibility | Change |
| --- | --- | --- |
| `themes/tebin/tokens.json` | The web theme's tokens | Add `color.brand-on-dark`, `color.brand-on-light`, `role`, `type`, `spacing`, `layout` |
| `themes/tebin-classic/tokens.json` | The document/print theme | Add `role` only (no measured type scale or accessible red exists for it) |
| `themes/slate/tokens.json` | The neutral starter theme | Add `role` only |
| `src/build.ts` | Style Dictionary formats and platforms | Register `tebin/fluid-clamp` transform + `css-tebin` group; `outputReferences` on `tokens.css`; `theme.ts` emits resolved values |
| `schema/tokens.schema.json` | Token contract | Declare `pro.tebin.fluid` |
| `src/design-doc.ts` | Generated `DESIGN.md` | New `## Roles`, `## Typography`, `## Spacing` sections |
| `rules/rules.json` | Rules database | Point the type-scale rule at the token that now exists |
| `test/build.test.ts` | Build behaviour | Alias + fluid cases |
| `test/tokens.test.ts` | **new** — content of the shipped themes | Roles resolve, scale is complete, no invented print values |
| `test/design-doc.test.ts` | Generated document | New sections asserted |

---

### Task 1: The accessible brand text colours

The design system is missing the two colours that fixed 1118 failing text nodes
on tebin.pro. They exist in `tebin/src/styles/global.css:20-21`.

**Files:**
- Modify: `themes/tebin/tokens.json` (the `color` group)
- Test: `test/tokens.test.ts` (create)

**Interfaces:**
- Produces: token paths `color.brand-on-dark` and `color.brand-on-light`,
  consumed by Task 2's `role.primary-on-dark` / `role.primary-on-light`.

- [ ] **Step 1: Write the failing test**

Create `test/tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (id: string) =>
  JSON.parse(readFileSync(join(root, 'themes', id, 'tokens.json'), 'utf8'));

describe('accessible brand text colours', () => {
  const tokens = load('tebin');

  it('carries a red that clears AA on dark surfaces', () => {
    expect(tokens.color['brand-on-dark'].$value).toBe('#EA6359');
  });

  it('carries a red that clears AA on light surfaces', () => {
    expect(tokens.color['brand-on-light'].$value).toBe('#C7251A');
  });

  it('names the surface each was measured against', () => {
    expect(tokens.color['brand-on-dark'].$description).toContain('#242830');
    expect(tokens.color['brand-on-light'].$description).toContain('#EFEEE9');
  });

  it('says the identity red is still the one for fills and large text', () => {
    expect(tokens.color['brand-on-dark'].$description).toContain('small text');
  });

  it('invents no print values for them', () => {
    expect(tokens.color['brand-on-dark'].$extensions).toBeUndefined();
    expect(tokens.color['brand-on-light'].$extensions).toBeUndefined();
  });

  it('does not copy them into the print theme, where they were never measured', () => {
    const classic = load('tebin-classic');
    expect(classic.color['brand-on-dark']).toBeUndefined();
    expect(classic.color['brand-on-light']).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run test/tokens.test.ts`
Expected: FAIL — `Cannot read properties of undefined (reading '$value')`.

- [ ] **Step 3: Add the two tokens**

In `themes/tebin/tokens.json`, inside `"color"`, immediately after
`"brand-dark"`:

```json
    "brand-on-dark":  { "$type": "color", "$value": "#EA6359", "$description": "Small red TEXT on dark surfaces only. 4.5:1 on #242830, the lightest dark surface in use, and more on every darker one. The identity red #DA291C stays the colour for the logo, fills, borders and large text, which need only 3:1." },
    "brand-on-light": { "$type": "color", "$value": "#C7251A", "$description": "Small red TEXT on light surfaces only. 4.87:1 on #EFEEE9 and 5.32:1 on #F8F8F4. No single red clears 4.5:1 on both surface families: the luminance window is empty for any hue, so this is two tokens by arithmetic, not by preference." },
```

- [ ] **Step 4: Run the test and the validator**

Run: `pnpm vitest run test/tokens.test.ts && pnpm validate`
Expected: PASS, and validate reports every theme valid.

- [ ] **Step 5: Regenerate the derived files**

The new colours are opaque hex, so `collectColorRows` picks them up and they
enter `colors.csv`, `preview/palette.svg` and the `DESIGN.md` palette table.

Run: `pnpm build && pnpm vitest run`
Expected: all tests pass. `git status` shows `themes/tebin/dist/*`,
`themes/tebin/preview/*` and `themes/tebin/DESIGN.md` modified.

- [ ] **Step 6: Commit**

```bash
git add themes/tebin/tokens.json themes/tebin/dist themes/tebin/preview themes/tebin/DESIGN.md test/tokens.test.ts
git commit -m "Add the accessible brand text colours to the tebin theme"
```

---

### Task 2: Semantic roles as aliases

**Files:**
- Modify: `src/build.ts` (the `css` platform and the `javascript/theme-ts` format)
- Modify: `themes/tebin/tokens.json`, `themes/tebin-classic/tokens.json`, `themes/slate/tokens.json`
- Test: `test/build.test.ts`, `test/tokens.test.ts`

**Interfaces:**
- Consumes: `color.brand-on-dark` / `color.brand-on-light` from Task 1.
- Produces: a `role` group per theme. Task 6 renders it into `DESIGN.md`.

- [ ] **Step 1: Write the failing build test**

Append to `test/build.test.ts`:

```ts
describe('aliases', () => {
  let aliasDir: string;

  beforeAll(async () => {
    aliasDir = mkdtempSync(join(tmpdir(), 'ts-alias-'));
    mkdirSync(join(aliasDir, 'aliased'), { recursive: true });
    writeFileSync(
      join(aliasDir, 'aliased', 'tokens.json'),
      JSON.stringify({
        color: { brand: { $type: 'color', $value: '#DA291C' } },
        role: { primary: { $type: 'color', $value: '{color.brand}' } },
      }),
    );
    await buildTheme(join(aliasDir, 'aliased'));
  });

  afterAll(() => rmSync(aliasDir, { recursive: true, force: true }));

  const readAlias = (f: string) => readFileSync(join(aliasDir, 'aliased', 'dist', f), 'utf8');

  it('keeps the reference in CSS so a role follows its colour', () => {
    expect(readAlias('tokens.css')).toContain('--role-primary: var(--color-brand);');
  });

  it('keeps the reference in the DTCG export, where an alias is a first-class value', () => {
    expect(JSON.parse(readAlias('tokens.dtcg.json')).role.primary.$value).toBe('{color.brand}');
  });

  it('resolves the reference in the TS export, where a consumer wants a colour', () => {
    expect(readAlias('theme.ts')).toContain('"primary": "#DA291C"');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run test/build.test.ts`
Expected: FAIL on the CSS assertion (it renders `--role-primary: #da291c;`) and
on the TS assertion (it renders `"primary": "{color.brand}"`).

- [ ] **Step 3: Emit references in CSS and literals in TS**

In `src/build.ts`, change the `css` platform's file entry to carry the option:

```ts
      css: {
        transformGroup: 'css',
        buildPath,
        files: [
          { destination: 'tokens.css', format: 'css/variables', options: { outputReferences: true } },
        ],
      },
```

In the same file, change `javascript/theme-ts` to emit the resolved value. The
`ts` platform runs with `transforms: []`, so `outValue` is the resolved source
value — uppercase hex included — not a transformed one:

```ts
  StyleDictionary.registerFormat({
    name: 'javascript/theme-ts',
    format: ({ dictionary, options }) => {
      const tree = nestByPath(dictionary.allTokens as unknown as Leaf[], (t) => outValue(t));
```

Leave `json/dtcg` on `rawValue` — an alias is a legitimate DTCG value and
round-tripping it is the point.

- [ ] **Step 4: Run the build tests**

Run: `pnpm vitest run test/build.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing role-content test**

Append to `test/tokens.test.ts`:

```ts
describe('semantic roles', () => {
  const THEMES = ['tebin', 'tebin-classic', 'slate'];

  for (const id of THEMES) {
    it(`${id} maps the three roles every theme can honour`, () => {
      const { role } = load(id);
      for (const name of ['primary', 'surface', 'on-surface']) {
        expect(role?.[name]?.$value, `${id}.${name}`).toMatch(/^\{[a-z-]+\.[a-z0-9-]+\}$/);
      }
    });

    it(`${id} states no role as a literal — a role is a pointer, not a copy`, () => {
      for (const [name, leaf] of Object.entries(load(id).role as Record<string, { $value: string }>)) {
        expect(leaf.$value, `${id}.${name}`).not.toMatch(/^#/);
      }
    });
  }

  it('separates the red that fills from the red that can be read', () => {
    const { role } = load('tebin');
    expect(role.primary.$value).toBe('{color.brand}');
    expect(role['primary-on-dark'].$value).toBe('{color.brand-on-dark}');
    expect(role['primary-on-light'].$value).toBe('{color.brand-on-light}');
  });

  it('invents no error role, because no theme has an error colour', () => {
    for (const id of THEMES) expect(load(id).role.error).toBeUndefined();
  });

  it('maps outline only where a colour is documented as a hairline', () => {
    expect(load('tebin').role.outline.$value).toBe('{color.rule}');
    expect(load('slate').role.outline.$value).toBe('{color.rule}');
    // tebin-classic has no rule colour — only brand-book greys, none of which
    // is documented as a hairline. Picking one would be invention, so the
    // theme carries no outline role until the owner names the colour.
    expect(load('tebin-classic').role.outline).toBeUndefined();
  });

  it('keeps roles out of the spreadsheet, which lists real colours only', async () => {
    const { collectColorRows } = await import('../src/colors-csv.js');
    const rows = collectColorRows(join(root, 'themes', 'tebin'));
    expect(rows.some((r) => r.token.startsWith('role.'))).toBe(false);
  });
});
```

- [ ] **Step 6: Run it and watch it fail**

Run: `pnpm vitest run test/tokens.test.ts`
Expected: FAIL — `role` is undefined in every theme.

- [ ] **Step 7: Add the role group to `themes/tebin/tokens.json`**

Insert as a new top-level group, after `"brand"` and before `"font"`:

```json
  "role": {
    "primary":          { "$type": "color", "$value": "{color.brand}", "$description": "Identity red. Logo, fills, borders and large text. Not small text — use the on-dark or on-light variant there." },
    "primary-on-dark":  { "$type": "color", "$value": "{color.brand-on-dark}", "$description": "Small red text on a dark surface." },
    "primary-on-light": { "$type": "color", "$value": "{color.brand-on-light}", "$description": "Small red text on a light surface." },
    "surface":          { "$type": "color", "$value": "{color.paper}", "$description": "The base page surface." },
    "surface-inverse":  { "$type": "color", "$value": "{color.charcoal}", "$description": "The dark bands." },
    "on-surface":       { "$type": "color", "$value": "{color.ink}", "$description": "Primary text on the base surface." },
    "on-surface-muted": { "$type": "color", "$value": "{color.muted}", "$description": "Secondary text on the base surface." },
    "outline":          { "$type": "color", "$value": "{color.rule}", "$description": "Hairlines and dividers on light surfaces." }
  },
```

- [ ] **Step 8: Add the role group to the other two themes**

These two themes have their own palettes, already checked against this plan.
Neither gets `primary-on-dark` / `primary-on-light`: those values were measured
against the web theme's surfaces and exist nowhere else.

`themes/slate/tokens.json` — palette is `brand`, `ink`, `muted`, `topbar`,
`surface`, `rule`:

```json
  "role": {
    "primary":          { "$type": "color", "$value": "{color.brand}", "$description": "Accent. Fills, borders and large text." },
    "surface":          { "$type": "color", "$value": "{color.surface}", "$description": "The base page surface." },
    "on-surface":       { "$type": "color", "$value": "{color.ink}", "$description": "Primary text on the base surface." },
    "on-surface-muted": { "$type": "color", "$value": "{color.muted}", "$description": "Secondary text on the base surface." },
    "outline":          { "$type": "color", "$value": "{color.rule}", "$description": "Hairlines and dividers." }
  },
```

`themes/tebin-classic/tokens.json` — palette is `brand`, `grey`, `ink`,
`topbar`, six brand-book accents and two light greys. It is the print/document
theme, so its surface is the white page:

```json
  "role": {
    "primary":          { "$type": "color", "$value": "{color.brand}", "$description": "Identity red. Fills and large text." },
    "surface":          { "$type": "color", "$value": "{color.topbar}", "$description": "The white page a document prints on." },
    "on-surface":       { "$type": "color", "$value": "{color.ink}", "$description": "Body text on the page." },
    "on-surface-muted": { "$type": "color", "$value": "{color.grey}", "$description": "Secondary text on the page." }
  },
```

No `outline` and no `surface-inverse` here. The theme has no colour documented
as a hairline — `grey-light` and `grey-lighter` are brand-book palette entries,
not a stated line colour — and no dark surface. Assigning one would be
invention. Record it as an open question rather than choosing.

- [ ] **Step 9: Run the tests and the validator**

Run: `pnpm vitest run && pnpm validate`
Expected: PASS.

- [ ] **Step 10: Regenerate and commit**

```bash
pnpm build && pnpm vitest run
git add src/build.ts themes/*/tokens.json themes/*/dist themes/*/DESIGN.md test/build.test.ts test/tokens.test.ts
git commit -m "Add semantic role tokens as aliases over the descriptive palette"
```

---

### Task 3: The fluid-clamp transform and its schema

Adds the mechanism the type and spacing scales need, before either exists.

**Files:**
- Modify: `src/build.ts`
- Modify: `schema/tokens.schema.json`
- Test: `test/build.test.ts`, `test/tokens.test.ts`

**Interfaces:**
- Produces: `$extensions["pro.tebin.fluid"] = { min, pref, max }` renders as
  `clamp(min, pref, max)` in `tokens.css` and `tailwind.css`, while `$value`
  (the max) is what `tokens.dtcg.json` and `theme.ts` carry. Tasks 4 and 5
  consume this.

- [ ] **Step 1: Write the failing test**

Append to `test/build.test.ts`:

```ts
describe('fluid dimensions', () => {
  let fluidDir: string;

  beforeAll(async () => {
    fluidDir = mkdtempSync(join(tmpdir(), 'ts-fluid-'));
    mkdirSync(join(fluidDir, 'fluid'), { recursive: true });
    writeFileSync(
      join(fluidDir, 'fluid', 'tokens.json'),
      JSON.stringify({
        type: {
          h1: {
            $type: 'dimension',
            $value: '38px',
            $extensions: { 'pro.tebin.fluid': { min: '28px', pref: '4.5vw', max: '38px' } },
          },
        },
        radius: { card: { $type: 'dimension', $value: '8px' } },
      }),
    );
    await buildTheme(join(fluidDir, 'fluid'));
  });

  afterAll(() => rmSync(fluidDir, { recursive: true, force: true }));

  const readFluid = (f: string) => readFileSync(join(fluidDir, 'fluid', 'dist', f), 'utf8');

  it('composes clamp() in CSS', () => {
    expect(readFluid('tokens.css')).toContain('--type-h1: clamp(28px, 4.5vw, 38px);');
  });

  it('composes clamp() in the Tailwind theme too', () => {
    expect(readFluid('tailwind.css')).toContain('--type-h1: clamp(28px, 4.5vw, 38px);');
  });

  it('leaves a plain dimension alone', () => {
    expect(readFluid('tokens.css')).toContain('--radius-card: 8px;');
  });

  it('exports the ceiling, not the clamp, where the spec expects a Dimension', () => {
    expect(JSON.parse(readFluid('tokens.dtcg.json')).type.h1.$value).toBe('38px');
    expect(readFluid('theme.ts')).toContain('"h1": "38px"');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run test/build.test.ts`
Expected: FAIL — `--type-h1: 38px;` where `clamp(...)` was expected.

- [ ] **Step 3: Register the transform and the group**

In `src/build.ts`, add this interface near `Leaf` at the top of the file:

```ts
interface FluidTriple {
  min: string;
  pref: string;
  max: string;
}
```

Then, inside `registerFormats()` (it already guards with `registered`), add
before the format registrations:

```ts
  StyleDictionary.registerTransform({
    name: 'tebin/fluid-clamp',
    type: 'value',
    transitive: true,
    filter: (token) =>
      Boolean(
        (token as { $extensions?: Record<string, unknown> }).$extensions?.['pro.tebin.fluid'] ??
          (token.original as { $extensions?: Record<string, unknown> })?.$extensions?.['pro.tebin.fluid'],
      ),
    transform: (token) => {
      const ext =
        (token as { $extensions?: Record<string, FluidTriple> }).$extensions?.['pro.tebin.fluid'] ??
        (token.original as { $extensions: Record<string, FluidTriple> }).$extensions['pro.tebin.fluid'];
      return `clamp(${ext.min}, ${ext.pref}, ${ext.max})`;
    },
  });

  StyleDictionary.registerTransformGroup({
    name: 'css-tebin',
    transforms: [...StyleDictionary.hooks.transformGroups.css, 'tebin/fluid-clamp'],
  });
```

Then point both CSS-producing platforms at the new group — `css` and `tailwind`
only. `dtcg` and `ts` keep `transforms: []`, which is exactly why they still
export the `px` ceiling:

```ts
      css: {
        transformGroup: 'css-tebin',
        buildPath,
        files: [
          { destination: 'tokens.css', format: 'css/variables', options: { outputReferences: true } },
        ],
      },
      tailwind: {
        transformGroup: 'css-tebin',
        buildPath,
        files: [{ destination: 'tailwind.css', format: 'css/tailwind-theme' }],
      },
```

- [ ] **Step 4: Run the test**

Run: `pnpm vitest run test/build.test.ts`
Expected: PASS.

- [ ] **Step 5: Declare the extension in the schema**

In `schema/tokens.schema.json`, inside
`$defs.tokenLeaf.properties.$extensions.properties`, after the
`pro.tebin.print` block:

```json
            "pro.tebin.fluid": {
              "type": "object",
              "additionalProperties": false,
              "required": ["min", "pref", "max"],
              "properties": {
                "min":  { "type": "string", "pattern": "^-?[0-9.]+(px|rem|em)$" },
                "pref": { "type": "string", "minLength": 1 },
                "max":  { "type": "string", "pattern": "^-?[0-9.]+(px|rem|em)$" }
              }
            }
```

- [ ] **Step 6: Prove the schema rejects a malformed triple**

Append to `test/tokens.test.ts`:

```ts
describe('the fluid extension contract', () => {
  it('rejects a triple that is missing a bound', async () => {
    const { validateTokens } = await import('../src/validate.js');
    const bad = {
      type: {
        h1: {
          $type: 'dimension',
          $value: '38px',
          $extensions: { 'pro.tebin.fluid': { min: '28px', max: '38px' } },
        },
      },
    };
    expect(validateTokens(bad).valid).toBe(false);
  });

  it('accepts a complete triple', async () => {
    const { validateTokens } = await import('../src/validate.js');
    const good = {
      type: {
        h1: {
          $type: 'dimension',
          $value: '38px',
          $extensions: { 'pro.tebin.fluid': { min: '28px', pref: '4.5vw', max: '38px' } },
        },
      },
    };
    expect(validateTokens(good).valid).toBe(true);
  });
});
```

- [ ] **Step 7: Run everything and commit**

Run: `pnpm vitest run && pnpm validate`
Expected: PASS.

```bash
git add src/build.ts schema/tokens.schema.json test/build.test.ts test/tokens.test.ts
git commit -m "Render fluid dimensions as clamp() from a declared min/pref/max triple"
```

---

### Task 4: The typography scale

Mirrors what tebin.pro actually ships. Sources, verbatim:
`tebin/src/styles/global.css:113` (body 16px / 1.7), `:177` (headings
`--font-condensed`, weight 700, line-height 1.35), `:181-185` (the five clamps).

**Files:**
- Modify: `themes/tebin/tokens.json`
- Test: `test/tokens.test.ts`

**Interfaces:**
- Consumes: the `pro.tebin.fluid` mechanism from Task 3.
- Produces: `type.*`, `fontWeight.*`, `lineHeight.*` in the `tebin` theme.
  Task 6 renders them into `DESIGN.md`.

- [ ] **Step 1: Write the failing test**

Append to `test/tokens.test.ts`:

```ts
describe('typography scale', () => {
  const tokens = load('tebin');

  it('has the five heading levels the site ships', () => {
    for (const level of ['h1', 'h2', 'h3', 'h4', 'h5']) {
      expect(tokens.type?.[level], level).toBeDefined();
    }
  });

  it('carries h1 as the real fluid triple, ceiling on $value', () => {
    expect(tokens.type.h1.$value).toBe('38px');
    expect(tokens.type.h1.$extensions['pro.tebin.fluid']).toEqual({
      min: '28px',
      pref: '4.5vw',
      max: '38px',
    });
  });

  it('descends monotonically', () => {
    const sizes = ['h1', 'h2', 'h3', 'h4', 'h5'].map((l) => parseFloat(tokens.type[l].$value));
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeLessThan(sizes[i - 1]);
  });

  it('carries body copy as a fixed size — it is not display type', () => {
    expect(tokens.type.body.$value).toBe('16px');
    expect(tokens.type.body.$extensions).toBeUndefined();
  });

  it('carries both leadings', () => {
    expect(tokens.lineHeight.heading.$value).toBe(1.35);
    expect(tokens.lineHeight.body.$value).toBe(1.7);
  });

  it('carries the heading weight', () => {
    expect(tokens.fontWeight.heading.$value).toBe(700);
  });

  it('says the ceiling is a ceiling, so nobody reads it as a fixed size', () => {
    expect(tokens.type.h1.$description).toContain('longest');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run test/tokens.test.ts`
Expected: FAIL — `tokens.type` is undefined.

- [ ] **Step 3: Add the groups**

In `themes/tebin/tokens.json`, after `"font"` and before `"radius"`:

```json
  "fontWeight": {
    "heading": { "$type": "fontWeight", "$value": 700 }
  },
  "lineHeight": {
    "heading": { "$type": "number", "$value": 1.35 },
    "body":    { "$type": "number", "$value": 1.7 }
  },
  "type": {
    "h1":   { "$type": "dimension", "$value": "38px", "$extensions": { "pro.tebin.fluid": { "min": "28px", "pref": "4.5vw", "max": "38px" } }, "$description": "Set in the condensed face at weight 700, leading 1.35. The value is the ceiling of a fluid range, not a fixed size: display type is sized against the locale with the longest words, because a vw size that fitted English overlapped the next column by 343px in German." },
    "h2":   { "$type": "dimension", "$value": "34px", "$extensions": { "pro.tebin.fluid": { "min": "24px", "pref": "3.8vw", "max": "34px" } }, "$description": "Ceiling of a fluid range sized against the longest-word locale. See h1." },
    "h3":   { "$type": "dimension", "$value": "28px", "$extensions": { "pro.tebin.fluid": { "min": "20px", "pref": "3vw",   "max": "28px" } }, "$description": "Ceiling of a fluid range sized against the longest-word locale. See h1." },
    "h4":   { "$type": "dimension", "$value": "24px", "$extensions": { "pro.tebin.fluid": { "min": "18px", "pref": "2.4vw", "max": "24px" } }, "$description": "Ceiling of a fluid range sized against the longest-word locale. See h1." },
    "h5":   { "$type": "dimension", "$value": "20px", "$extensions": { "pro.tebin.fluid": { "min": "16px", "pref": "2vw",   "max": "20px" } }, "$description": "Ceiling of a fluid range sized against the longest-word locale. See h1." },
    "body": { "$type": "dimension", "$value": "16px", "$description": "Body copy is a fixed size with leading 1.7. Running text is not display type and does not scale with the viewport." }
  },
```

- [ ] **Step 4: Run tests, validate, regenerate**

Run: `pnpm vitest run && pnpm validate && pnpm build && pnpm vitest run`
Expected: PASS. `themes/tebin/dist/tokens.css` now carries
`--type-h1: clamp(28px, 4.5vw, 38px);`.

- [ ] **Step 5: Commit**

```bash
git add themes/tebin/tokens.json themes/tebin/dist themes/tebin/DESIGN.md test/tokens.test.ts
git commit -m "Mirror tebin.pro's typography scale into the theme"
```

---

### Task 5: The spacing and layout scales

Sources: `tebin/src/styles/global.css:98-104`.

**Files:**
- Modify: `themes/tebin/tokens.json`
- Test: `test/tokens.test.ts`

**Interfaces:**
- Consumes: the `pro.tebin.fluid` mechanism from Task 3.
- Produces: `spacing.*` and `layout.*` in the `tebin` theme. Task 6 renders them
  into `DESIGN.md`.

- [ ] **Step 1: Write the failing test**

Append to `test/tokens.test.ts`:

```ts
describe('spacing and layout', () => {
  const tokens = load('tebin');

  it('carries the page gutter as a fluid value', () => {
    expect(tokens.spacing.gutter.$value).toBe('48px');
    expect(tokens.spacing.gutter.$extensions['pro.tebin.fluid'].pref).toBe('4vw');
  });

  it('carries the three section rhythms', () => {
    for (const step of ['section-compact', 'section-standard', 'section-feature']) {
      expect(tokens.spacing[step], step).toBeDefined();
    }
  });

  it('grows monotonically from compact to feature', () => {
    const steps = ['section-compact', 'section-standard', 'section-feature']
      .map((s) => parseFloat(tokens.spacing[s].$value));
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
  });

  it('carries the three container widths as fixed maxima', () => {
    expect(tokens.layout['container-default'].$value).toBe('1200px');
    expect(tokens.layout['container-wide'].$value).toBe('1400px');
    expect(tokens.layout['container-reading'].$value).toBe('760px');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run test/tokens.test.ts`
Expected: FAIL — `tokens.spacing` is undefined.

- [ ] **Step 3: Add the groups**

In `themes/tebin/tokens.json`, after `"type"` and before `"radius"`:

```json
  "spacing": {
    "gutter":           { "$type": "dimension", "$value": "48px",  "$extensions": { "pro.tebin.fluid": { "min": "20px", "pref": "4vw",   "max": "48px" } },  "$description": "Page gutter. Ceiling of a fluid range." },
    "section-compact":  { "$type": "dimension", "$value": "64px",  "$extensions": { "pro.tebin.fluid": { "min": "40px", "pref": "5.5vw", "max": "64px" } },  "$description": "Vertical rhythm between tight sections. Ceiling of a fluid range." },
    "section-standard": { "$type": "dimension", "$value": "88px",  "$extensions": { "pro.tebin.fluid": { "min": "56px", "pref": "7vw",   "max": "88px" } },  "$description": "The default band spacing. Ceiling of a fluid range." },
    "section-feature":  { "$type": "dimension", "$value": "112px", "$extensions": { "pro.tebin.fluid": { "min": "72px", "pref": "9vw",   "max": "112px" } }, "$description": "Around a feature band. Ceiling of a fluid range." }
  },
  "layout": {
    "container-default": { "$type": "dimension", "$value": "1200px", "$description": "Default content width." },
    "container-wide":    { "$type": "dimension", "$value": "1400px", "$description": "Wide content width." },
    "container-reading": { "$type": "dimension", "$value": "760px",  "$description": "Measure for long-form running text." }
  },
```

- [ ] **Step 4: Run, validate, regenerate, commit**

```bash
pnpm vitest run && pnpm validate && pnpm build && pnpm vitest run
git add themes/tebin/tokens.json themes/tebin/dist themes/tebin/DESIGN.md test/tokens.test.ts
git commit -m "Mirror tebin.pro's spacing and container scales into the theme"
```

---

### Task 6: Render the new groups into DESIGN.md

The generated document currently shows Palette, Type, Geometry, Assets and
Rules. Three new sections make the new tokens visible to anyone handed only the
file. The type section takes the spec's name, `Typography`, without dropping
anything the existing `## Type` section says about the font stacks.

**Files:**
- Modify: `src/design-doc.ts`
- Test: `test/design-doc.test.ts`

**Interfaces:**
- Consumes: `role.*`, `type.*`, `lineHeight.*`, `fontWeight.*`, `spacing.*`,
  `layout.*` from Tasks 2, 4 and 5.
- Produces: `roleSection`, `typeScaleSection`, `spacingSection` — each takes
  `themeDir: string` and returns `string`, empty when the group is absent. That
  is the contract `geometrySection` already uses.

- [ ] **Step 1: Write the failing test**

Append to `test/design-doc.test.ts`:

```ts
describe('the new token groups reach the document', () => {
  const tebin = buildDesignDoc(join(root, 'themes', 'tebin'));

  it('lists the roles and what each points at', () => {
    expect(tebin).toContain('## Roles');
    expect(tebin).toContain('`role.primary`');
    expect(tebin).toContain('`color.brand`');
  });

  it('warns that the fill red is not the text red', () => {
    expect(tebin).toContain('role.primary-on-dark');
    expect(tebin).toContain('small text');
  });

  it('prints the type scale with its fluid range, not just the ceiling', () => {
    expect(tebin).toContain('## Typography');
    expect(tebin).toContain('clamp(28px, 4.5vw, 38px)');
  });

  it('prints the spacing scale and the container widths', () => {
    expect(tebin).toContain('## Spacing');
    expect(tebin).toContain('1200px');
  });

  it('omits the sections a theme does not have', () => {
    const slate = buildDesignDoc(join(root, 'themes', 'slate'));
    expect(slate).not.toContain('## Spacing');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run test/design-doc.test.ts`
Expected: FAIL — `## Roles` not found.

- [ ] **Step 3: Add the three section builders**

In `src/design-doc.ts`, after `geometrySection`:

```ts
function roleSection(themeDir: string): string {
  const tokens = readTokens(themeDir) as {
    role?: Record<string, { $value?: string; $description?: string }>;
  };
  const roles = Object.entries(tokens.role ?? {});
  if (!roles.length) return '';
  let out =
    '\n## Roles\n\nA role is a pointer, not a copy — change the colour it names and every role using it follows.\n\n';
  out += '| Role | Points at | Use for |\n| --- | --- | --- |\n';
  for (const [name, leaf] of roles) {
    const target = (leaf.$value ?? '').replace(/^\{|\}$/g, '');
    out += `| \`role.${name}\` | \`${target}\` | ${leaf.$description ?? '—'} |\n`;
  }
  return out;
}

function typeScaleSection(themeDir: string): string {
  const tokens = readTokens(themeDir) as {
    type?: Record<string, {
      $value?: string;
      $extensions?: Record<string, { min: string; pref: string; max: string }>;
    }>;
    lineHeight?: Record<string, { $value?: number }>;
    fontWeight?: Record<string, { $value?: number }>;
  };
  const levels = Object.entries(tokens.type ?? {});
  if (!levels.length) return '';
  let out = '\n## Typography\n\n| Level | Size | Fluid range |\n| --- | --- | --- |\n';
  for (const [name, leaf] of levels) {
    const fluid = leaf.$extensions?.['pro.tebin.fluid'];
    const range = fluid ? `\`clamp(${fluid.min}, ${fluid.pref}, ${fluid.max})\`` : 'fixed';
    out += `| \`type.${name}\` | ${leaf.$value} | ${range} |\n`;
  }
  out +=
    '\nWhere a level shows a fluid range, the size column is its **ceiling**, not a fixed size. Display type is sized against the locale with the longest words — a range that fits English alone is an English-only cap.\n';
  const lh = Object.entries(tokens.lineHeight ?? {});
  if (lh.length) out += `\nLeading: ${lh.map(([n, l]) => `${n} ${l.$value}`).join(', ')}.\n`;
  const fw = Object.entries(tokens.fontWeight ?? {});
  if (fw.length) out += `Weights: ${fw.map(([n, l]) => `${n} ${l.$value}`).join(', ')}.\n`;
  return out;
}

function spacingSection(themeDir: string): string {
  const tokens = readTokens(themeDir) as {
    spacing?: Record<string, {
      $value?: string;
      $extensions?: Record<string, { min: string; pref: string; max: string }>;
    }>;
    layout?: Record<string, { $value?: string; $description?: string }>;
  };
  const steps = Object.entries(tokens.spacing ?? {});
  const containers = Object.entries(tokens.layout ?? {});
  if (!steps.length && !containers.length) return '';
  let out = '\n## Spacing\n\n';
  if (steps.length) {
    out += '| Step | Ceiling | Fluid range |\n| --- | --- | --- |\n';
    for (const [name, leaf] of steps) {
      const fluid = leaf.$extensions?.['pro.tebin.fluid'];
      const range = fluid ? `\`clamp(${fluid.min}, ${fluid.pref}, ${fluid.max})\`` : 'fixed';
      out += `| \`spacing.${name}\` | ${leaf.$value} | ${range} |\n`;
    }
  }
  if (containers.length) {
    out += `\nContainer widths: ${containers.map(([n, l]) => `\`${n}\` ${l.$value}`).join(', ')}.\n`;
  }
  return out;
}
```

Then call them in `buildDesignDoc`, so the order runs palette → roles → font
stacks → type scale → geometry → spacing:

```ts
  out += translucentNote(themeDir, theme.id);
  out += roleSection(themeDir);
  out += typeSection(themeDir);
  out += typeScaleSection(themeDir);
  out += geometrySection(themeDir);
  out += spacingSection(themeDir);
  out += assetSection(themeDir, theme);
```

- [ ] **Step 4: Run the test**

Run: `pnpm vitest run test/design-doc.test.ts`
Expected: PASS.

- [ ] **Step 5: Regenerate and read the result**

Run: `pnpm build && cat themes/tebin/DESIGN.md`
Read it as a stranger would: the tables must render, and every link must still
be absolute — the existing test enforces that, but confirm the new sections
introduced none.

- [ ] **Step 6: Commit**

```bash
git add src/design-doc.ts themes/*/DESIGN.md test/design-doc.test.ts
git commit -m "Show roles, the type scale and the spacing scale in DESIGN.md"
```

---

### Task 7: Point the type-scale rule at the scale, and release

`rules.json` carries a typography rule telling the reader to take heading sizes
from "the global type scale" — a scale the design system did not contain until
Task 4. Now it does, so the rule can name it.

**Files:**
- Modify: `rules/rules.json`
- Modify: `themes/tebin/theme.json`
- Modify: `CHANGELOG.md`
- Test: `test/rules.test.ts`

- [ ] **Step 1: Find the rule and confirm its id**

Run:

```bash
node -e "console.log(JSON.stringify(require('./rules/rules.json').filter(r=>r.category==='typography'&&/scale/.test(r.statement)),null,2))"
```

Expected: one record. Use its actual `id` — do not assume one.

- [ ] **Step 2: Write the failing test**

Append to `test/rules.test.ts`:

```ts
it('the heading-scale rule names the token group that now carries the scale', () => {
  const rule = filterRules({ category: 'typography' }).find((r) => /scale/.test(r.statement));
  expect(rule).toBeDefined();
  expect(rule!.statement).toContain('type.h1');
});
```

If `filterRules` is not already imported in that file, add it from
`../src/rules.js`.

- [ ] **Step 3: Run it and watch it fail**

Run: `pnpm vitest run test/rules.test.ts`
Expected: FAIL.

- [ ] **Step 4: Update the statement**

Edit that record's `statement` in `rules/rules.json` to read:

```
Take heading sizes from the global type scale (type.h1 … type.h5 in the theme) rather than from per-page clamp() overrides.
```

Leave `id`, `severity`, `rationale`, `tags` and `source` untouched — the
rationale still describes why the rule exists and has not changed.

- [ ] **Step 5: Close the heading-shaping gap the guidelines review found**

Two `NEVER` rules remove every manual way to shape a ragged heading —
`typography-manual-line-breaks` (no `<br>`) and `typography-heading-word-break`
(no hyphenation) — and neither names the one method that works. A rule that
forbids the only known technique without offering a replacement is a rule people
break; that is how the 177 wrap rules reverted on 2026-07-29 got written.

Write the failing test first, in `test/rules.test.ts`:

```ts
it('names the supported way to shape a heading, not only the forbidden ones', () => {
  const rule = getRule('typography-heading-balance');
  expect(rule.severity).toBe('SHOULD');
  expect(rule.statement).toContain('text-wrap: balance');
});
```

Run: `pnpm vitest run test/rules.test.ts`
Expected: FAIL — `NotFoundError`.

Then add the record to `rules/rules.json`, immediately after
`typography-heading-scale`:

```json
  { "id": "typography-heading-balance", "category": "typography", "severity": "SHOULD", "statement": "Shape a heading's lines with text-wrap: balance (text-pretty for running text); it is the supported replacement for the manual <br> and hyphenation the other heading rules forbid.", "rationale": "Two NEVER rules remove every manual way to even out a ragged heading without naming the one that works, and a rule that forbids the only known method is a rule people break.", "tags": ["headings", "wrapping", "css"], "source": "Web Interface Guidelines review 2026-08-27" },
```

Run: `pnpm vitest run test/rules.test.ts`
Expected: PASS.

- [ ] **Step 6: Bump the versions — they are two different numbers**

The repository and each theme version independently. Today:
`package.json` and the latest `CHANGELOG.md` heading are at `1.0.0`, while
`themes/tebin/theme.json` is at `1.1.0`. Do not conflate them.

- `themes/tebin/theme.json` — `"version": "1.2.0"`, `"updatedAt": "2026-08-27"`
  (new tokens in that theme).
- `themes/tebin-classic/theme.json` and `themes/slate/theme.json` — bump each
  theme's own patch or minor version and `updatedAt`, since both gained a role
  group.
- `package.json` — `"version": "1.1.0"` (the repository release).

Run: `pnpm build && pnpm validate && pnpm test && pnpm check`
Expected: all green, and `pnpm check` reports no drift — every generated file
matches its source.

- [ ] **Step 7: Record the tranche in the changelog**

Add a `## 1.1.0 — 2026-08-27` section to `CHANGELOG.md`, above `## 1.0.0`,
following that entry's existing `### Added` / `### Changed` shape. It must name:
the accessible brand text colours and why they are two tokens; the role aliases
across all three themes; the typography scale and the spacing and container
scales on `tebin`; that `tokens.css` now emits roles as `var()` references
rather than duplicated literals; and that `theme.ts` now exports resolved
colours where it previously would have exported a reference string. Note which
theme versions moved, and the new `typography-heading-balance` rule.

- [ ] **Step 8: Commit**

```bash
git add rules/rules.json rules/dist themes/*/theme.json themes/*/dist themes/*/DESIGN.md registry/index.json package.json CHANGELOG.md test/rules.test.ts
git commit -m "Point the heading-scale rule at the tokens and release 1.1.0"
```

## Open questions this tranche deliberately leaves to the owner

Do not answer these by choosing a plausible value — record them and ask.

- **`tebin-classic` has no hairline colour.** `grey-light` (`#B3B4B6`) and
  `grey-lighter` (`#CDCDCE`) are brand-book palette entries, not a stated line
  colour. Until one is named, the theme carries no `role.outline`.
- **`tebin-classic` has no dark surface**, so no `role.surface-inverse`.
- **No theme has an error colour**, so no `role.error` anywhere.
- **`type.label`.** `tebin/src/styles/global.css:155-162` shows a real label
  treatment — condensed, 700, 13px, uppercase, `letter-spacing: 0.08em` — but
  on the skip link alone. One component is not evidence of a system level.
- **Whether `tebin-classic` needs its own type scale.** It is the document
  theme; document type is set in Word, not in CSS, so the web scale may not
  transfer at all.

---

## Tranche 2 — a separate plan, written after this one lands

Not placeholders: each has a decided shape, and each needs the tokens this
tranche adds before it can be built.

1. **YAML front matter in `DESIGN.md`** — generated from `tokens.json`, mapping
   `role` / `type` / `spacing` / `radius` onto the spec's `colors` /
   `typography` / `spacing` / `rounded`, with the fluid ceilings as `fontSize`
   and the fluid ranges explained in the prose beneath.
2. **A WCAG contrast lint** — executable at last, because
   `[SHOULD] Make a design policy checkable` is currently violated on this
   repository's own territory: the contrast floors live in `$description`
   strings that nothing verifies. Carry across the trap recorded in
   `[[accessible-brand-colour]]` — a gate that reads tokens is structurally
   blind to a colour that never became a token, so the check asserts on the
   property, not the location.
3. **`omitted` with documented reasons** — meaningful only once a linter exists
   to be silenced. Covers slate having no assets, and no theme having an error
   colour.
4. **A version diff with a regression flag** — token-level added / removed /
   modified between two versions of a theme, feeding both `CHANGELOG.md` and CI.
5. **Three MCP tools** — `get_design_doc`, `lint_theme`, `diff_themes`, plus
   `design-md` as a new `format` on `get_theme`.
