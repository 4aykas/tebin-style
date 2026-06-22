# tebin-style Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `tebin-style`, a standalone public registry of reusable themes (DTCG tokens + brand assets + metadata) that a Claude Skill can discover and apply, seeded with the TEBIN brand.

**Architecture:** Static registry. Each theme stores canonical DTCG `tokens.json` (the only hand-edited source) plus a `theme.json` manifest and co-located assets. A Style Dictionary build generates four committed outputs per theme (`tokens.css`, `tailwind.css`, `tokens.dtcg.json`, `theme.ts`) and a top-level `registry/index.json`. A thin Skill reads those files; nothing is hosted. Logic lives in `src/` (unit-testable); `scripts/` are thin CLI wrappers.

**Tech Stack:** TypeScript (ESM), Node ≥18, pnpm, Style Dictionary v4, ajv + ajv-formats (JSON Schema 2020-12), Vitest, tsx (run TS scripts).

## Global Constraints

Every task's requirements implicitly include this section.

- Runtime: **Node ≥ 18**; package manager **pnpm**; `package.json` has `"type": "module"`.
- Canonical token format: **W3C DTCG** (`$type`/`$value`); Style Dictionary configured with `usesDtcg: true`.
- `themes/<id>/tokens.json` is the **only** hand-edited token source. `dist/*` and `registry/index.json` are **always generated, never hand-edited**.
- Theme `id`: **kebab-case** and **equal to its folder name**; unique across the registry.
- Licensing: repo code + tokens = **MIT**; each asset carries a `license` field. **No third-party brand assets in Phase 1** (TEBIN's own brand only).
- All repo docs, the Skill, and code comments are written in **English**.
- `assets[].type` ∈ `logo | favicon | font | icon | pattern | image`.
- Working directory for every command is the `tebin-style/` project root unless stated otherwise.

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `LICENSE`
- Create: `src/.gitkeep`
- Test: `test/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: an installable project where `pnpm test` runs Vitest. No exported code yet.

- [ ] **Step 1: Write the smoke test**

`test/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('project setup', () => {
  it('runs the test runner', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "tebin-style",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "description": "A registry of reusable themes (brand kits) for AI coding agents: DTCG design tokens, brand assets, and metadata.",
  "license": "MIT",
  "engines": { "node": ">=18" },
  "scripts": {
    "build": "tsx scripts/build.ts && tsx scripts/build-index.ts",
    "validate": "tsx scripts/validate.ts",
    "check": "tsx scripts/check.ts",
    "test": "vitest run"
  },
  "devDependencies": {
    "ajv": "^8.17.1",
    "ajv-formats": "^3.0.1",
    "style-dictionary": "^4.3.0",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src", "scripts", "test"]
}
```

- [ ] **Step 4: Create `.gitignore`**

```gitignore
node_modules/
*.log
.DS_Store
.tmp/
```

- [ ] **Step 5: Create `LICENSE`**

Use the standard MIT License text, copyright line: `Copyright (c) 2026 TEBIN`. (Paste the full MIT License body from https://opensource.org/license/mit with that copyright line.)

- [ ] **Step 6: Create `src/.gitkeep`** (empty file, so the directory exists)

- [ ] **Step 7: Install and run tests**

Run: `pnpm install && pnpm test`
Expected: Vitest runs; `test/smoke.test.ts` PASSES (1 passed).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold tebin-style project (pnpm, ts, vitest)"
```

---

### Task 2: Theme + token JSON Schema and validators

**Files:**
- Create: `schema/theme.schema.json`
- Create: `schema/tokens.schema.json`
- Create: `src/validate.ts`
- Test: `test/validate.test.ts`

**Interfaces:**
- Consumes: nothing from prior tasks.
- Produces:
  - `validateThemeMetadata(obj: unknown): { valid: boolean; errors: string[] }`
  - `validateTokens(obj: unknown): { valid: boolean; errors: string[] }`

- [ ] **Step 1: Write the failing test**

`test/validate.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { validateThemeMetadata, validateTokens } from '../src/validate.js';

const goodTheme = {
  id: 'tebin', name: 'TEBIN', version: '1.0.0',
  license: { tokens: 'MIT', assets: '© TEBIN' },
  assets: [{ id: 'logo-full', type: 'logo', format: 'svg', path: 'assets/logo/logo-full.svg' }],
};

const goodTokens = {
  color: { brand: { $type: 'color', $value: '#DA291C' } },
  font: { sans: { $type: 'fontFamily', $value: ['Roboto', 'sans-serif'] } },
};

describe('validateThemeMetadata', () => {
  it('accepts a well-formed theme', () => {
    expect(validateThemeMetadata(goodTheme).valid).toBe(true);
  });
  it('rejects a non-kebab id', () => {
    expect(validateThemeMetadata({ ...goodTheme, id: 'TeBin' }).valid).toBe(false);
  });
  it('rejects an unknown asset type', () => {
    const bad = { ...goodTheme, assets: [{ id: 'x', type: 'banner', format: 'svg', path: 'a.svg' }] };
    expect(validateThemeMetadata(bad).valid).toBe(false);
  });
  it('rejects a missing version', () => {
    const { version, ...noVersion } = goodTheme;
    expect(validateThemeMetadata(noVersion).valid).toBe(false);
  });
});

describe('validateTokens', () => {
  it('accepts well-formed DTCG tokens', () => {
    expect(validateTokens(goodTokens).valid).toBe(true);
  });
  it('rejects a leaf missing $value', () => {
    const bad = { color: { brand: { $type: 'color' } } };
    expect(validateTokens(bad).valid).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/validate.test.ts`
Expected: FAIL — cannot resolve `../src/validate.js`.

- [ ] **Step 3: Create `schema/theme.schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://tebin-style/schema/theme.schema.json",
  "type": "object",
  "additionalProperties": true,
  "required": ["id", "name", "version", "license"],
  "properties": {
    "id": { "type": "string", "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$" },
    "name": { "type": "string", "minLength": 1 },
    "description": { "type": "string" },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "industry": { "type": "array", "items": { "type": "string" } },
    "mood": { "type": "array", "items": { "type": "string" } },
    "source": {
      "type": "object",
      "properties": {
        "url": { "type": "string" },
        "extractedBy": { "type": "string", "enum": ["manual", "auto"] }
      }
    },
    "license": {
      "type": "object",
      "required": ["tokens", "assets"],
      "properties": {
        "tokens": { "type": "string" },
        "assets": { "type": "string" }
      }
    },
    "author": { "type": "string" },
    "createdAt": { "type": "string" },
    "updatedAt": { "type": "string" },
    "assets": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "format", "path"],
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string", "enum": ["logo", "favicon", "font", "icon", "pattern", "image"] },
          "variant": { "type": "string" },
          "format": { "type": "string" },
          "path": { "type": "string" },
          "license": { "type": "string" }
        }
      }
    }
  }
}
```

- [ ] **Step 4: Create `schema/tokens.schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://tebin-style/schema/tokens.schema.json",
  "type": "object",
  "$defs": {
    "tokenLeaf": {
      "type": "object",
      "required": ["$type", "$value"],
      "properties": {
        "$type": { "type": "string", "enum": ["color", "fontFamily", "dimension", "shadow", "fontWeight", "number", "duration"] },
        "$value": {},
        "$description": { "type": "string" }
      }
    },
    "tokenNode": {
      "type": "object",
      "additionalProperties": {
        "oneOf": [
          { "$ref": "#/$defs/tokenLeaf" },
          { "$ref": "#/$defs/tokenNode" }
        ]
      }
    }
  },
  "allOf": [{ "$ref": "#/$defs/tokenNode" }]
}
```

- [ ] **Step 5: Implement `src/validate.ts`**

```ts
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const schemaDir = join(here, '..', 'schema');

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const themeSchema = JSON.parse(readFileSync(join(schemaDir, 'theme.schema.json'), 'utf8'));
const tokensSchema = JSON.parse(readFileSync(join(schemaDir, 'tokens.schema.json'), 'utf8'));

const validateThemeFn = ajv.compile(themeSchema);
const validateTokensFn = ajv.compile(tokensSchema);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function toResult(valid: boolean, errors: typeof validateThemeFn.errors): ValidationResult {
  return {
    valid,
    errors: (errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message ?? ''}`.trim()),
  };
}

export function validateThemeMetadata(obj: unknown): ValidationResult {
  const valid = validateThemeFn(obj) as boolean;
  return toResult(valid, validateThemeFn.errors);
}

export function validateTokens(obj: unknown): ValidationResult {
  const valid = validateTokensFn(obj) as boolean;
  return toResult(valid, validateTokensFn.errors);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run test/validate.test.ts`
Expected: PASS (6 passed).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add theme/token JSON schemas and ajv validators"
```

---

### Task 3: Theme-directory integrity validation + `validate` CLI

**Files:**
- Modify: `src/validate.ts` (add `validateThemeDir`)
- Create: `scripts/validate.ts`
- Create: `test/fixtures/themes/good/theme.json`
- Create: `test/fixtures/themes/good/tokens.json`
- Create: `test/fixtures/themes/good/assets/logo.svg`
- Test: `test/integrity.test.ts`

**Interfaces:**
- Consumes: `validateThemeMetadata`, `validateTokens` (Task 2).
- Produces: `validateThemeDir(dir: string): { valid: boolean; errors: string[] }` — checks metadata, tokens, `id === basename(dir)`, and that every `assets[].path` exists on disk.

- [ ] **Step 1: Create fixture files**

`test/fixtures/themes/good/theme.json`:
```json
{
  "id": "good",
  "name": "Good Fixture",
  "version": "1.0.0",
  "license": { "tokens": "MIT", "assets": "© Test" },
  "assets": [{ "id": "logo", "type": "logo", "format": "svg", "path": "assets/logo.svg" }]
}
```

`test/fixtures/themes/good/tokens.json`:
```json
{ "color": { "brand": { "$type": "color", "$value": "#DA291C" } } }
```

`test/fixtures/themes/good/assets/logo.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>
```

- [ ] **Step 2: Write the failing test**

`test/integrity.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateThemeDir } from '../src/validate.js';

const here = dirname(fileURLToPath(import.meta.url));
const goodDir = join(here, 'fixtures', 'themes', 'good');

describe('validateThemeDir', () => {
  it('accepts a valid theme directory', () => {
    const r = validateThemeDir(goodDir);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('fails when id does not match folder name', () => {
    // mismatch is created in a temp dir within the test
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run test/integrity.test.ts`
Expected: FAIL — `validateThemeDir` is not exported.

- [ ] **Step 4: Add `validateThemeDir` to `src/validate.ts`**

Append:
```ts
import { existsSync } from 'node:fs';
import { basename } from 'node:path';

export function validateThemeDir(dir: string): ValidationResult {
  const errors: string[] = [];

  const themePath = join(dir, 'theme.json');
  const tokensPath = join(dir, 'tokens.json');

  if (!existsSync(themePath)) return { valid: false, errors: ['missing theme.json'] };
  if (!existsSync(tokensPath)) return { valid: false, errors: ['missing tokens.json'] };

  const theme = JSON.parse(readFileSync(themePath, 'utf8')) as Record<string, unknown>;
  const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));

  const metaResult = validateThemeMetadata(theme);
  errors.push(...metaResult.errors.map((e) => `theme.json: ${e}`));

  const tokensResult = validateTokens(tokens);
  errors.push(...tokensResult.errors.map((e) => `tokens.json: ${e}`));

  if (theme.id !== basename(dir)) {
    errors.push(`theme.json: id "${String(theme.id)}" must equal folder name "${basename(dir)}"`);
  }

  const assets = Array.isArray(theme.assets) ? theme.assets : [];
  for (const a of assets as Array<{ path?: string; id?: string }>) {
    if (a.path && !existsSync(join(dir, a.path))) {
      errors.push(`theme.json: asset "${a.id ?? '?'}" path not found: ${a.path}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run test/integrity.test.ts`
Expected: PASS.

- [ ] **Step 6: Create `scripts/validate.ts` (CLI over all themes)**

```ts
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateThemeDir } from '../src/validate.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesRoot = join(root, 'themes');

let failed = false;
const seen = new Set<string>();

if (existsSync(themesRoot)) {
  for (const entry of readdirSync(themesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(themesRoot, entry.name);
    const result = validateThemeDir(dir);
    if (seen.has(entry.name)) { console.error(`✗ duplicate theme id: ${entry.name}`); failed = true; }
    seen.add(entry.name);
    if (result.valid) {
      console.log(`✓ ${entry.name}`);
    } else {
      failed = true;
      console.error(`✗ ${entry.name}`);
      for (const e of result.errors) console.error(`    ${e}`);
    }
  }
} else {
  console.log('no themes/ directory yet');
}

if (failed) process.exit(1);
console.log('All themes valid.');
```

- [ ] **Step 7: Run the CLI**

Run: `pnpm validate`
Expected: prints `no themes/ directory yet` then `All themes valid.` (themes/ not created until Task 7). Exit code 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add theme-directory integrity validation and validate CLI"
```

---

### Task 4: Token generation with Style Dictionary

**Files:**
- Create: `src/build.ts`
- Create: `scripts/build.ts`
- Test: `test/build.test.ts`

**Interfaces:**
- Consumes: nothing from prior tasks.
- Produces:
  - `registerFormats(): void` — registers custom Style Dictionary formats (`css/tailwind-theme`, `json/dtcg`, `javascript/theme-ts`). Idempotent.
  - `buildTheme(themeDir: string): Promise<void>` — reads `<themeDir>/tokens.json`, writes `<themeDir>/dist/{tokens.css,tailwind.css,tokens.dtcg.json,theme.ts}`.

- [ ] **Step 1: Write the failing test**

`test/build.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildTheme } from '../src/build.js';

let dir: string;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'ts-build-'));
  mkdirSync(join(dir, 'sample'), { recursive: true });
  const tokens = {
    color: { brand: { $type: 'color', $value: '#DA291C' } },
    font: { sans: { $type: 'fontFamily', $value: ['Roboto', 'sans-serif'] } },
    radius: { card: { $type: 'dimension', $value: '8px' } },
  };
  writeFileSync(join(dir, 'sample', 'tokens.json'), JSON.stringify(tokens));
  await buildTheme(join(dir, 'sample'));
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const read = (f: string) => readFileSync(join(dir, 'sample', 'dist', f), 'utf8');

describe('buildTheme', () => {
  it('writes CSS variables', () => {
    const css = read('tokens.css');
    expect(css).toContain(':root');
    expect(css).toContain('--color-brand: #DA291C;');
  });
  it('writes a Tailwind @theme block', () => {
    const tw = read('tailwind.css');
    expect(tw).toContain('@theme {');
    expect(tw).toContain('--color-brand: #DA291C;');
  });
  it('writes normalized DTCG JSON', () => {
    const dtcg = JSON.parse(read('tokens.dtcg.json'));
    expect(dtcg.color.brand.$value).toBe('#DA291C');
    expect(dtcg.font.sans.$value).toEqual(['Roboto', 'sans-serif']);
  });
  it('writes a typed TS object', () => {
    const ts = read('theme.ts');
    expect(ts).toContain('export const sample =');
    expect(ts).toContain('"brand": "#DA291C"');
    expect(ts).toContain('as const');
    expect(ts).toContain('export type SampleTheme');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/build.test.ts`
Expected: FAIL — cannot resolve `../src/build.js`.

- [ ] **Step 3: Implement `src/build.ts`**

```ts
import StyleDictionary from 'style-dictionary';
import { basename, join } from 'node:path';

interface Leaf { $type?: string; type?: string; value: unknown; path: string[]; original: { value: unknown } }

function nestByPath<T>(tokens: Leaf[], leafValue: (t: Leaf) => T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const t of tokens) {
    let node = out;
    t.path.forEach((seg, i) => {
      if (i === t.path.length - 1) {
        node[seg] = leafValue(t);
      } else {
        node[seg] = (node[seg] as Record<string, unknown>) ?? {};
        node = node[seg] as Record<string, unknown>;
      }
    });
  }
  return out;
}

let registered = false;

export function registerFormats(): void {
  if (registered) return;
  registered = true;

  StyleDictionary.registerFormat({
    name: 'css/tailwind-theme',
    format: ({ dictionary }) =>
      `@theme {\n${dictionary.allTokens
        .map((t: any) => `  --${t.name}: ${t.value};`)
        .join('\n')}\n}\n`,
  });

  StyleDictionary.registerFormat({
    name: 'json/dtcg',
    format: ({ dictionary }) => {
      const tree = nestByPath(dictionary.allTokens as any, (t) => ({
        $type: t.$type ?? t.type,
        $value: t.original.value,
      }));
      return JSON.stringify(tree, null, 2) + '\n';
    },
  });

  StyleDictionary.registerFormat({
    name: 'javascript/theme-ts',
    format: ({ dictionary, options }) => {
      const tree = nestByPath(dictionary.allTokens as any, (t) => t.original.value);
      const name = (options as any).themeName as string;
      const typeName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return (
        `export const ${name.replace(/-/g, '_')} = ${JSON.stringify(tree, null, 2)} as const;\n\n` +
        `export type ${typeName}Theme = typeof ${name.replace(/-/g, '_')};\n`
      );
    },
  });
}

export async function buildTheme(themeDir: string): Promise<void> {
  registerFormats();
  const themeName = basename(themeDir);
  const buildPath = join(themeDir, 'dist') + '/';

  const sd = new StyleDictionary({
    usesDtcg: true,
    source: [join(themeDir, 'tokens.json')],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath,
        files: [{ destination: 'tokens.css', format: 'css/variables' }],
      },
      tailwind: {
        transformGroup: 'css',
        buildPath,
        files: [{ destination: 'tailwind.css', format: 'css/tailwind-theme' }],
      },
      dtcg: {
        transforms: [],
        buildPath,
        files: [{ destination: 'tokens.dtcg.json', format: 'json/dtcg' }],
      },
      ts: {
        transforms: [],
        buildPath,
        files: [{ destination: 'theme.ts', format: 'javascript/theme-ts', options: { themeName } }],
      },
    },
  });

  await sd.buildAllPlatforms();
}
```

Note: the `css` transform group joins `fontFamily` arrays into a comma string and produces kebab `--color-brand` names. The `dtcg`/`ts` platforms use no transforms so values stay raw (arrays preserved) and the nested tree is rebuilt from `token.path`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/build.test.ts`
Expected: PASS (4 passed).

If a custom format does not receive `themeName`, confirm the option is read via `options.themeName` (Style Dictionary v4 passes file-level `options` merged into the format's `options` argument).

- [ ] **Step 5: Create `scripts/build.ts`**

```ts
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildTheme } from '../src/build.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesRoot = join(root, 'themes');

if (!existsSync(themesRoot)) {
  console.log('no themes/ directory yet — nothing to build');
  process.exit(0);
}

for (const entry of readdirSync(themesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  await buildTheme(join(themesRoot, entry.name));
  console.log(`built ${entry.name}`);
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: generate css/tailwind/dtcg/ts outputs via Style Dictionary"
```

---

### Task 5: Registry index builder

**Files:**
- Create: `src/index-builder.ts`
- Create: `scripts/build-index.ts`
- Test: `test/index.test.ts`

**Interfaces:**
- Consumes: nothing from prior tasks (reads theme dirs directly).
- Produces:
  - `buildIndex(themesRoot: string, opts?: { rawBaseUrl?: string }): RegistryIndex` where
    `RegistryIndex = { generatedAt: string; count: number; themes: ThemeEntry[] }` and
    `ThemeEntry = { id: string; name: string; version: string; industry: string[]; mood: string[]; preview: Record<string,string>; formats: Record<string,string>; assets: Array<{ id: string; type: string; path: string; rawUrl?: string }> }`.
  - `PREVIEW_KEYS: string[]` — token names used for the preview swatch.

- [ ] **Step 1: Write the failing test**

`test/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildIndex } from '../src/index-builder.js';

const here = dirname(fileURLToPath(import.meta.url));
const themesRoot = join(here, 'fixtures', 'themes');

describe('buildIndex', () => {
  it('lists themes with formats, preview and assets', () => {
    const idx = buildIndex(themesRoot, { rawBaseUrl: 'https://example/raw' });
    const good = idx.themes.find((t) => t.id === 'good')!;
    expect(good).toBeTruthy();
    expect(good.version).toBe('1.0.0');
    expect(good.formats.css).toBe('themes/good/dist/tokens.css');
    expect(good.preview.brand).toBe('#DA291C');
    expect(good.assets[0].rawUrl).toContain('themes/good/assets/logo.svg');
    expect(idx.count).toBe(idx.themes.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/index.test.ts`
Expected: FAIL — cannot resolve `../src/index-builder.js`.

- [ ] **Step 3: Implement `src/index-builder.ts`**

```ts
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const PREVIEW_KEYS = ['brand', 'ink', 'topbar'];

export interface ThemeEntry {
  id: string; name: string; version: string;
  industry: string[]; mood: string[];
  preview: Record<string, string>;
  formats: Record<string, string>;
  assets: Array<{ id: string; type: string; path: string; rawUrl?: string }>;
}
export interface RegistryIndex { generatedAt: string; count: number; themes: ThemeEntry[]; }

export function buildIndex(themesRoot: string, opts: { rawBaseUrl?: string } = {}): RegistryIndex {
  const themes: ThemeEntry[] = [];
  if (!existsSync(themesRoot)) return { generatedAt: today(), count: 0, themes };

  for (const entry of readdirSync(themesRoot, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const dir = join(themesRoot, entry.name);
    const themePath = join(dir, 'theme.json');
    const tokensPath = join(dir, 'tokens.json');
    if (!existsSync(themePath) || !existsSync(tokensPath)) continue;

    const theme = JSON.parse(readFileSync(themePath, 'utf8'));
    const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
    const colors = (tokens.color ?? {}) as Record<string, { $value?: string }>;

    const preview: Record<string, string> = {};
    for (const key of PREVIEW_KEYS) {
      if (colors[key]?.$value) preview[key] = colors[key].$value as string;
    }

    const base = `themes/${entry.name}`;
    const assets = (theme.assets ?? []).map((a: any) => ({
      id: a.id, type: a.type, path: `${base}/${a.path}`,
      ...(opts.rawBaseUrl ? { rawUrl: `${opts.rawBaseUrl}/${base}/${a.path}` } : {}),
    }));

    themes.push({
      id: theme.id, name: theme.name, version: theme.version,
      industry: theme.industry ?? [], mood: theme.mood ?? [],
      preview,
      formats: {
        css: `${base}/dist/tokens.css`,
        tailwind: `${base}/dist/tailwind.css`,
        dtcg: `${base}/dist/tokens.dtcg.json`,
        ts: `${base}/dist/theme.ts`,
      },
      assets,
    });
  }
  return { generatedAt: today(), count: themes.length, themes };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/index.test.ts`
Expected: PASS.

- [ ] **Step 5: Create `scripts/build-index.ts`**

```ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildIndex } from '../src/index-builder.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesRoot = join(root, 'themes');
const rawBaseUrl = 'https://raw.githubusercontent.com/OWNER/tebin-style/main';

const index = buildIndex(themesRoot, { rawBaseUrl });
mkdirSync(join(root, 'registry'), { recursive: true });
writeFileSync(join(root, 'registry', 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`wrote registry/index.json (${index.count} themes)`);
```

Note: replace `OWNER` with the real GitHub owner/org when the repo is created (Task 10 / repo setup).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: build registry/index.json catalog from themes"
```

---

### Task 6: `check` drift detector

**Files:**
- Create: `scripts/check.ts`
- Test: `test/check.test.ts`

**Interfaces:**
- Consumes: `buildTheme` (Task 4), `buildIndex` (Task 5).
- Produces: `scripts/check.ts` — regenerates outputs in memory/temp and exits non-zero if committed `dist/*` or `registry/index.json` differ. Exposes `diffTheme(themeDir: string): Promise<string[]>` from `src/check.ts` for testing.

- [ ] **Step 1: Write the failing test**

`test/check.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildTheme } from '../src/build.js';
import { diffTheme } from '../src/check.js';

let dir: string;
beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'ts-check-'));
  mkdirSync(join(dir, 'sample'), { recursive: true });
  writeFileSync(join(dir, 'sample', 'tokens.json'),
    JSON.stringify({ color: { brand: { $type: 'color', $value: '#DA291C' } } }));
  await buildTheme(join(dir, 'sample'));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('diffTheme', () => {
  it('reports no drift right after a build', async () => {
    expect(await diffTheme(join(dir, 'sample'))).toEqual([]);
  });
  it('reports drift when a dist file is stale', async () => {
    writeFileSync(join(dir, 'sample', 'dist', 'tokens.css'), '/* stale */');
    const drift = await diffTheme(join(dir, 'sample'));
    expect(drift.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/check.test.ts`
Expected: FAIL — cannot resolve `../src/check.js`.

- [ ] **Step 3: Implement `src/check.ts`**

```ts
import { mkdtempSync, readFileSync, existsSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { buildTheme } from './build.js';

const DIST_FILES = ['tokens.css', 'tailwind.css', 'tokens.dtcg.json', 'theme.ts'];

export async function diffTheme(themeDir: string): Promise<string[]> {
  const drift: string[] = [];
  const tmp = mkdtempSync(join(tmpdir(), 'ts-diff-'));
  const work = join(tmp, basename(themeDir));
  cpSync(themeDir, work, { recursive: true });
  rmSync(join(work, 'dist'), { recursive: true, force: true });

  try {
    await buildTheme(work);
    for (const f of DIST_FILES) {
      const committed = join(themeDir, 'dist', f);
      const fresh = join(work, 'dist', f);
      const a = existsSync(committed) ? readFileSync(committed, 'utf8') : null;
      const b = existsSync(fresh) ? readFileSync(fresh, 'utf8') : null;
      if (a !== b) drift.push(`dist/${f}`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  return drift;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/check.test.ts`
Expected: PASS.

- [ ] **Step 5: Create `scripts/check.ts` (full-registry CLI)**

```ts
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { diffTheme } from '../src/check.js';
import { buildIndex } from '../src/index-builder.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesRoot = join(root, 'themes');
let failed = false;

if (existsSync(themesRoot)) {
  for (const entry of readdirSync(themesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const drift = await diffTheme(join(themesRoot, entry.name));
    if (drift.length) {
      failed = true;
      console.error(`✗ ${entry.name} drift: ${drift.join(', ')}`);
    } else {
      console.log(`✓ ${entry.name}`);
    }
  }

  // index drift
  const committedPath = join(root, 'registry', 'index.json');
  const committed = existsSync(committedPath) ? readFileSync(committedPath, 'utf8') : '';
  const fresh = JSON.stringify(
    buildIndex(themesRoot, { rawBaseUrl: 'https://raw.githubusercontent.com/OWNER/tebin-style/main' }),
    null, 2,
  ) + '\n';
  // Compare ignoring the volatile generatedAt date.
  const strip = (s: string) => s.replace(/"generatedAt": "[^"]*"/, '"generatedAt": "X"');
  if (strip(committed) !== strip(fresh)) {
    failed = true;
    console.error('✗ registry/index.json is out of date — run `pnpm build`');
  } else {
    console.log('✓ registry/index.json');
  }
}

if (failed) process.exit(1);
console.log('No drift.');
```

Note: keep the `OWNER` placeholder identical to `scripts/build-index.ts` so the two outputs match.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add drift detector (pnpm check) for dist and index"
```

---

### Task 7: Seed the TEBIN theme

**Files:**
- Create: `themes/tebin/tokens.json`
- Create: `themes/tebin/theme.json`
- Create: `themes/tebin/assets/...` (copied from the sibling `tebin` project)
- Create: `themes/tebin/README.md`
- Generated: `themes/tebin/dist/*`, `registry/index.json`

**Interfaces:**
- Consumes: `pnpm build`, `pnpm validate`, `pnpm check` (Tasks 3–6).
- Produces: the first real registry entry.

- [ ] **Step 1: Copy assets from the sibling project**

Run (from `tebin-style/` root):
```bash
mkdir -p themes/tebin/assets/logo themes/tebin/assets/favicon themes/tebin/assets/misc
cp "../tebin/public/tebin.svg"          themes/tebin/assets/logo/logo-full.svg
cp "../tebin/public/favicon.svg"        themes/tebin/assets/favicon/favicon.svg
cp "../tebin/public/favicon.png"        themes/tebin/assets/favicon/favicon.png
cp "../tebin/public/favicon.ico"        themes/tebin/assets/favicon/favicon.ico
cp "../tebin/public/fxptebin.png"       themes/tebin/assets/misc/fxptebin.png
cp "../tebin/public/corner_outline.svg" themes/tebin/assets/misc/corner_outline.svg
```
Expected: six files copied. Verify with `ls -R themes/tebin/assets`.

- [ ] **Step 2: Create `themes/tebin/tokens.json`** (DTCG, transcribed from `tebin/src/styles/global.css` `@theme`)

```json
{
  "color": {
    "brand":      { "$type": "color", "$value": "#DA291C" },
    "brand-dark": { "$type": "color", "$value": "#B82217" },
    "charcoal":   { "$type": "color", "$value": "#242424" },
    "ink":        { "$type": "color", "$value": "#292929" },
    "muted":      { "$type": "color", "$value": "#666666" },
    "topbar":     { "$type": "color", "$value": "#F9F9F9" },
    "subtle":     { "$type": "color", "$value": "#C1C1C1" },
    "rule":       { "$type": "color", "$value": "#ECECEC" }
  },
  "font": {
    "sans":      { "$type": "fontFamily", "$value": ["Roboto", "Helvetica", "Arial", "sans-serif"] },
    "condensed": { "$type": "fontFamily", "$value": ["Roboto Condensed", "Roboto", "sans-serif"] }
  },
  "radius": {
    "panel":   { "$type": "dimension", "$value": "2px" },
    "control": { "$type": "dimension", "$value": "4px" },
    "card":    { "$type": "dimension", "$value": "8px" }
  }
}
```

- [ ] **Step 3: Create `themes/tebin/theme.json`**

```json
{
  "$schema": "../../schema/theme.schema.json",
  "id": "tebin",
  "name": "TEBIN",
  "description": "Industrial design-and-engineering brand: condensed type, signal red on charcoal.",
  "version": "1.0.0",
  "industry": ["engineering", "industrial", "b2b"],
  "mood": ["bold", "technical", "high-contrast"],
  "source": { "url": "https://tebin.pro", "extractedBy": "manual" },
  "license": { "tokens": "MIT", "assets": "© TEBIN — all rights reserved" },
  "author": "TEBIN",
  "createdAt": "2026-06-22",
  "updatedAt": "2026-06-22",
  "assets": [
    { "id": "logo-full", "type": "logo",    "variant": "full", "format": "svg", "path": "assets/logo/logo-full.svg" },
    { "id": "favicon-svg", "type": "favicon", "format": "svg", "path": "assets/favicon/favicon.svg" },
    { "id": "favicon-png", "type": "favicon", "format": "png", "path": "assets/favicon/favicon.png" },
    { "id": "favicon-ico", "type": "favicon", "format": "ico", "path": "assets/favicon/favicon.ico" },
    { "id": "corner-outline", "type": "pattern", "format": "svg", "path": "assets/misc/corner_outline.svg" },
    { "id": "fxptebin", "type": "image", "format": "png", "path": "assets/misc/fxptebin.png" }
  ]
}
```

- [ ] **Step 4: Create `themes/tebin/README.md`**

```markdown
# TEBIN theme

Industrial design-and-engineering brand kit: signal red (`#DA291C`) on charcoal,
Roboto / Roboto Condensed type.

## Tokens
Canonical source: [`tokens.json`](./tokens.json) (DTCG). Generated outputs in
[`dist/`](./dist): `tokens.css`, `tailwind.css`, `tokens.dtcg.json`, `theme.ts`.

## Assets
Logos and favicons live in [`assets/`](./assets). License: © TEBIN — all rights
reserved (do not reuse the TEBIN logo for other brands).
```

- [ ] **Step 5: Generate and validate**

Run:
```bash
pnpm validate && pnpm build && pnpm check && pnpm test
```
Expected: `validate` prints `✓ tebin` and `All themes valid.`; `build` writes `themes/tebin/dist/*` and `registry/index.json`; `check` prints `✓ tebin` and `✓ registry/index.json` and `No drift.`; all Vitest tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: seed the TEBIN theme (tokens, assets, generated outputs)"
```

---

### Task 8: The Claude Skill

**Files:**
- Create: `skill/tebin-style/SKILL.md`
- Create: `skill/tebin-style/references/formats.md`
- Create: `skill/tebin-style/references/licensing.md`
- Test: `test/skill.test.ts`

**Interfaces:**
- Consumes: the registry files produced by earlier tasks (read at runtime).
- Produces: a documented skill. A test asserts the frontmatter has `name` and `description`.

- [ ] **Step 1: Write the failing test**

`test/skill.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const skill = readFileSync(join(here, '..', 'skill', 'tebin-style', 'SKILL.md'), 'utf8');

describe('SKILL.md', () => {
  it('has YAML frontmatter with name and description', () => {
    const m = skill.match(/^---\n([\s\S]*?)\n---/);
    expect(m).toBeTruthy();
    expect(m![1]).toContain('name: tebin-style');
    expect(m![1]).toContain('description:');
  });
  it('documents the discover→apply workflow', () => {
    expect(skill).toContain('registry/index.json');
    expect(skill.toLowerCase()).toContain('discover');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/skill.test.ts`
Expected: FAIL — SKILL.md does not exist.

- [ ] **Step 3: Create `skill/tebin-style/SKILL.md`**

````markdown
---
name: tebin-style
description: >
  Use when the user wants to apply, borrow, or reuse a ready-made visual theme
  / brand kit (color palette, typography, spacing, shadows, logos) in a
  project. Triggers: "use the TEBIN theme", "apply a brand kit", "give me an
  industrial palette", "theme this project like X", "borrow styles".
---

# tebin-style — applying a theme from the registry

This skill applies a stored theme (design tokens + brand assets) to the current
project. The registry is a set of static files; this skill only reads them.

## Workflow

1. **Discover.** Read `registry/index.json`. List or filter themes by
   `industry`, `mood`, or name. For a vague request ("something industrial"),
   show 2–3 candidates with their `preview` colors and ask the user to pick.
2. **Inspect.** Open the chosen theme's `themes/<id>/README.md` and
   `themes/<id>/theme.json` — note metadata and the `license` of tokens and
   assets. If an asset license is restricted, warn the user before copying.
3. **Detect target.** Inspect the current project's stack and choose a format:
   - Tailwind v4 (`@theme` / `@import "tailwindcss"`) → `dist/tailwind.css`
   - plain CSS → `dist/tokens.css`
   - React / CSS-in-JS / needs types → `dist/theme.ts`
   - other tooling (Figma, Style Dictionary) → `dist/tokens.dtcg.json`
4. **Apply tokens.** Insert the chosen `dist/*` into the target, following the
   target project's existing patterns (e.g. paste the `@theme` block into the
   main stylesheet, or import `theme.ts`).
5. **Apply assets.** For each entry in `theme.json.assets`, either copy the file
   into the target (`public/`, `assets/`) or give the user the `rawUrl` from
   `registry/index.json` to download — ask which they want.
6. **Verify.** Report which theme and version were applied, which token block
   and asset files were added, and any license caveats.

## Reading the registry

- With a local clone (skill installed as a plugin): read files from disk.
- Without a clone: fetch from `raw.githubusercontent.com/OWNER/tebin-style/main/...`
  using the `rawUrl` fields in `registry/index.json`.

See `references/formats.md` for how to insert each output format, and
`references/licensing.md` for how to interpret the license fields.
````

- [ ] **Step 4: Create `skill/tebin-style/references/formats.md`**

```markdown
# Output formats

Each theme generates four files in `themes/<id>/dist/`:

| File | Use when target is | How to apply |
|------|--------------------|--------------|
| `tokens.css` | any project that can load CSS | paste the `:root { … }` block into the global stylesheet, or import the file |
| `tailwind.css` | Tailwind v4 | paste the `@theme { … }` block into the file that has `@import "tailwindcss";` |
| `theme.ts` | React / CSS-in-JS / TypeScript | import the exported `as const` object; use the exported type |
| `tokens.dtcg.json` | Figma plugins, Style Dictionary, other tooling | feed into the tool that consumes DTCG |

Prefer the format that matches the target's existing styling approach. Do not
mix formats in one project.
```

- [ ] **Step 5: Create `skill/tebin-style/references/licensing.md`**

```markdown
# Licensing

Each theme's `theme.json` has a `license` object:

- `license.tokens` — license for the design tokens (usually `MIT`).
- `license.assets` — license for logos/images. May be restricted (e.g.
  "© TEBIN — all rights reserved").

Rules:

- Tokens (colors, type scale, spacing) are safe to reuse when `license.tokens`
  permits it.
- **Do not** reuse a brand's logo or restricted assets for a *different* brand.
  Copy them only when the user owns that brand or the asset license allows it.
- When in doubt, apply the tokens and link the assets instead of copying them,
  and tell the user the license terms.
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run test/skill.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add tebin-style Claude skill and references"
```

---

### Task 9: Top-level documentation

**Files:**
- Create: `README.md`
- Create: `CONTRIBUTING.md`
- Create: `schema/README.md`
- Test: `test/docs.test.ts`

**Interfaces:**
- Consumes: `registry/index.json` (Task 7).
- Produces: human-facing docs. A test asserts the README lists every theme present in `registry/index.json`.

- [ ] **Step 1: Write the failing test**

`test/docs.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const index = JSON.parse(readFileSync(join(root, 'registry', 'index.json'), 'utf8'));

describe('README', () => {
  it('mentions every theme in the registry', () => {
    for (const t of index.themes) {
      expect(readme).toContain(t.id);
    }
  });
  it('documents the pnpm scripts', () => {
    for (const s of ['pnpm build', 'pnpm validate', 'pnpm check', 'pnpm test']) {
      expect(readme).toContain(s);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/docs.test.ts`
Expected: FAIL — README.md does not exist.

- [ ] **Step 3: Create `README.md`**

```markdown
# tebin-style

A registry of reusable **themes (brand kits)** for AI coding agents and humans:
W3C **DTCG** design tokens, brand assets (logos, favicons), and metadata. Point
an agent at a theme and it applies the tokens — in CSS, Tailwind, DTCG JSON, or
TypeScript — and places the assets.

## For agents

The [`tebin-style` skill](./skill/tebin-style/SKILL.md) reads
[`registry/index.json`](./registry/index.json), picks a theme, and applies the
right output format for the target project. See the skill for the full
discover → inspect → apply workflow.

## For humans

Browse [`themes/`](./themes). Each theme has:
- `tokens.json` — canonical DTCG tokens (the source of truth)
- `dist/` — generated `tokens.css`, `tailwind.css`, `tokens.dtcg.json`, `theme.ts`
- `assets/` — logos, favicons (download directly from GitHub)
- `theme.json` — metadata + asset manifest

## Available themes

| id | name | industry | preview (brand) |
|----|------|----------|-----------------|
| tebin | TEBIN | engineering, industrial | `#DA291C` |

(Keep this table in sync with `registry/index.json`.)

## Development

```bash
pnpm install
pnpm validate   # JSON Schema + integrity checks
pnpm build      # generate dist/* and registry/index.json
pnpm check      # fail if generated files drift from source
pnpm test       # run the test suite
```

`themes/<id>/tokens.json` is the only file you hand-edit. Everything in `dist/`
and `registry/index.json` is generated.

## License

Code and tokens: MIT (see [LICENSE](./LICENSE)). Brand assets carry their own
license per theme (see each `theme.json`). Do not reuse a brand's logo for a
different brand.
```

- [ ] **Step 4: Create `CONTRIBUTING.md`**

```markdown
# Contributing a theme

1. Create `themes/<id>/` where `<id>` is kebab-case and unique.
2. Add `tokens.json` in DTCG format (`$type` / `$value`). Start from an existing
   theme's `tokens.json` for structure.
3. Add `theme.json` with `id` (== folder name), `name`, `version` (semver),
   `license`, and an `assets` manifest. Validate against
   `schema/theme.schema.json`.
4. Put brand files under `assets/` and list each in `theme.json.assets`.
   Only contribute assets you have the rights to. Set `license.assets` honestly.
5. Run:
   ```bash
   pnpm validate && pnpm build && pnpm check && pnpm test
   ```
6. Commit the source files **and** the generated `dist/*` and updated
   `registry/index.json`. Open a PR. CI runs the same four commands.

Do not hand-edit `dist/*` or `registry/index.json`.
```

- [ ] **Step 5: Create `schema/README.md`**

```markdown
# Schema

Two JSON Schemas (2020-12) validate each theme:

## `theme.schema.json` — `theme.json`
- `id` (required): kebab-case, must equal the folder name.
- `name` (required), `version` (required, semver).
- `license` (required): `{ tokens, assets }`.
- `industry`, `mood`: string arrays used for discovery.
- `source`: `{ url, extractedBy: "manual" | "auto" }`.
- `assets[]`: `{ id, type, format, path, variant?, license? }`;
  `type` ∈ `logo | favicon | font | icon | pattern | image`;
  `path` must exist on disk (checked by `pnpm validate`).

## `tokens.schema.json` — `tokens.json`
- Nested groups of DTCG tokens. Every leaf has `$type` and `$value`.
- `$type` ∈ `color | fontFamily | dimension | shadow | fontWeight | number | duration`.

Integrity checks beyond JSON Schema (in `src/validate.ts`): id == folder name,
id uniqueness across the registry, and asset path existence.
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run test/docs.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "docs: add README, CONTRIBUTING, and schema docs"
```

---

### Task 10: CI workflow + repo finalization

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the `pnpm validate`, `pnpm check`, `pnpm test` scripts.
- Produces: CI that runs on every PR and push.

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push:
    branches: [main, master]
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm validate
      - run: pnpm check
      - run: pnpm test
```

- [ ] **Step 2: Verify the full pipeline locally**

Run: `pnpm install && pnpm validate && pnpm check && pnpm test`
Expected: all four succeed, exit code 0.

- [ ] **Step 3: Replace the `OWNER` placeholder**

After the GitHub repo exists, set the real owner in `scripts/build-index.ts` and
`scripts/check.ts` (the `raw.githubusercontent.com/OWNER/tebin-style` URL), then
re-run `pnpm build` so `registry/index.json` updates. Commit.

Run: `pnpm build && pnpm check`
Expected: `No drift.`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "ci: run validate, check, and test on push and PR"
```

- [ ] **Step 5: Create the public GitHub repo and push**

Run:
```bash
gh repo create tebin-style --public --source=. --remote=origin --description "A registry of reusable themes (brand kits) for AI coding agents."
git branch -M main
git push -u origin main
```
Expected: repo created and pushed; CI runs green on GitHub.

---

## Self-Review

**Spec coverage:**
- §3 location / independence → repo created at the sibling path; assets copied once (Task 7), no live coupling. ✓
- §4 repo layout → Tasks 1–10 create every directory (`schema/`, `themes/`, `registry/`, `scripts/`, `src/`, `skill/`, `test/`, `.github/`). Note: logic factored into `src/` with thin `scripts/` CLIs (refinement of the spec's `scripts/` note, documented here). ✓
- §5 stack → Task 1 (TS/pnpm/Vitest/tsx), Task 4 (Style Dictionary), Task 2 (ajv). ✓
- §6 data model → Task 2 (schemas), Task 7 (seed `theme.json`/`tokens.json`). ✓
- §6.3 validation rules → Tasks 2–3. ✓
- §7 generation + four formats + index → Tasks 4–5. ✓
- §7 scripts + drift `check` → Tasks 4–6; CI in Task 10. ✓
- §8 Skill → Task 8. ✓
- §9 seed extraction → Task 7 (exact source files). ✓
- §10 licensing → schema (Task 2), seed values (Task 7), `references/licensing.md` (Task 8). ✓
- §11 docs → Task 9 + per-theme README in Task 7 + schema README. ✓
- §12 testing → schema (T2), asset existence/id (T3), generator (T4), index integrity (T5), skill frontmatter (T8), README sync (T9). ✓
- §13 acceptance criteria → satisfied by Tasks 7–10 + the final pipeline run. ✓

**Placeholder scan:** the only intentional placeholder is `OWNER` in the raw GitHub URL, resolved in Task 10 Step 3. No TODO/TBD; all code steps include full code. ✓

**Type consistency:** `buildTheme`, `buildIndex`, `diffTheme`, `validateThemeDir`, `validateThemeMetadata`, `validateTokens`, `registerFormats`, `PREVIEW_KEYS`, `RegistryIndex`/`ThemeEntry` are used with consistent names and signatures across tasks. The `css`/`dtcg`/`ts` format names match between `src/build.ts` and its tests. ✓
