# tebin-style Phase 3 — Design Rules Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global, theme-independent design-rules database (JSON canonical + generated markdown) to `tebin-style`, exposed via the existing skill and two new MCP tools.

**Architecture:** Mirror the themes pipeline. Canonical `rules/rules.json` is the only hand-edited source; `rules/dist/rules.md` is generated. A `src/rules.ts` read layer (load/get/filter) backs new `list_rules`/`get_rule` MCP tools. Validation, generation, and drift-check fold into the existing `validate`/`build`/`check` scripts.

**Tech Stack:** TypeScript (ESM), Node ≥18, pnpm, ajv (JSON Schema 2020-12), `@modelcontextprotocol/sdk` + zod (existing), Vitest, tsx.

## Global Constraints

Every task's requirements implicitly include this section.

- Working dir is the `tebin-style/` project root. Node ≥18; pnpm; `"type": "module"`.
- Rules are **global** (theme-independent) and live in top-level `rules/`.
- `rules/rules.json` is the only hand-edited rules source; `rules/dist/rules.md` is always generated, never hand-edited.
- Rule shape: required `id` (kebab-case, unique), `category` (string), `severity` (`MUST`|`SHOULD`|`NEVER`), `statement`; optional `rationale`, `tags` (string[]), `source`.
- Recommended categories: `interactions`, `forms`, `navigation`, `feedback`, `touch`, `animation`, `layout`, `content`, `accessibility`, `performance`, `theming`.
- Reuse `REPO_ROOT` and `NotFoundError` from `src/registry.ts`; do not redefine them.
- Pure handlers/builders throw `NotFoundError` on missing data; the MCP server already maps thrown errors to `{ isError: true }` (no server changes needed).
- English for all code, comments, docs.

---

### Task 1: Rules schema, seed data, and read layer

**Files:**
- Create: `schema/rules.schema.json`
- Create: `rules/rules.json`
- Create: `src/rules.ts`
- Test: `test/rules.test.ts`

**Interfaces:**
- Consumes: `REPO_ROOT`, `NotFoundError` from `src/registry.ts`.
- Produces:
  - `type Severity = 'MUST' | 'SHOULD' | 'NEVER'`
  - `interface Rule { id: string; category: string; severity: Severity; statement: string; rationale?: string; tags?: string[]; source?: string }`
  - `loadRules(): Rule[]`
  - `getRule(id: string): Rule`
  - `filterRules(input: { category?: string; severity?: string; tag?: string; query?: string }): Rule[]`

- [ ] **Step 1: Write the failing test**

`test/rules.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { loadRules, getRule, filterRules } from '../src/rules.js';
import { NotFoundError } from '../src/registry.js';

describe('rules read layer', () => {
  it('loads seeded rules', () => {
    const rules = loadRules();
    expect(rules.length).toBeGreaterThan(10);
    expect(rules.some((r) => r.id === 'forms-loading-button')).toBe(true);
  });
  it('gets a rule by id', () => {
    expect(getRule('forms-loading-button').severity).toBe('MUST');
  });
  it('throws NotFoundError for an unknown rule', () => {
    expect(() => getRule('nope')).toThrow(NotFoundError);
  });
  it('filters by category', () => {
    const forms = filterRules({ category: 'forms' });
    expect(forms.length).toBeGreaterThan(0);
    expect(forms.every((r) => r.category === 'forms')).toBe(true);
  });
  it('filters by severity', () => {
    expect(filterRules({ severity: 'NEVER' }).every((r) => r.severity === 'NEVER')).toBe(true);
  });
  it('filters by tag and query', () => {
    expect(filterRules({ tag: 'keyboard' }).length).toBeGreaterThan(0);
    expect(filterRules({ query: 'spinner' }).some((r) => r.id === 'forms-loading-button')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/rules.test.ts`
Expected: FAIL — cannot resolve `../src/rules.js`.

- [ ] **Step 3: Create `schema/rules.schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://tebin-style/schema/rules.schema.json",
  "type": "array",
  "items": {
    "type": "object",
    "additionalProperties": false,
    "required": ["id", "category", "severity", "statement"],
    "properties": {
      "id": { "type": "string", "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$" },
      "category": { "type": "string", "minLength": 1 },
      "severity": { "type": "string", "enum": ["MUST", "SHOULD", "NEVER"] },
      "statement": { "type": "string", "minLength": 1 },
      "rationale": { "type": "string" },
      "tags": { "type": "array", "items": { "type": "string" } },
      "source": { "type": "string" }
    }
  }
}
```

- [ ] **Step 4: Create `rules/rules.json`** (curated seed from `tebin/AGENTS.md`)

```json
[
  { "id": "interactions-focus-visible", "category": "interactions", "severity": "MUST", "statement": "Provide visible focus rings using :focus-visible, grouped with :focus-within where appropriate.", "rationale": "Keyboard users must see where focus is.", "tags": ["keyboard", "focus"], "source": "tebin AGENTS.md" },
  { "id": "interactions-no-outline-none", "category": "interactions", "severity": "NEVER", "statement": "Never set outline: none without providing a visible focus replacement.", "tags": ["keyboard", "focus"], "source": "tebin AGENTS.md" },
  { "id": "interactions-keyboard-apg", "category": "interactions", "severity": "MUST", "statement": "Support full keyboard interaction per the WAI-ARIA Authoring Practices.", "tags": ["keyboard"], "source": "tebin AGENTS.md" },
  { "id": "touch-hit-target", "category": "touch", "severity": "MUST", "statement": "Use hit targets of at least 24px (44px on mobile); expand the hit area if the visual is smaller.", "tags": ["touch", "target"], "source": "tebin AGENTS.md" },
  { "id": "touch-action-manipulation", "category": "touch", "severity": "MUST", "statement": "Set touch-action: manipulation to prevent double-tap zoom delays.", "tags": ["touch"], "source": "tebin AGENTS.md" },
  { "id": "forms-input-font-size", "category": "forms", "severity": "MUST", "statement": "Use a font-size of at least 16px on mobile inputs to prevent iOS zoom.", "tags": ["forms", "mobile"], "source": "tebin AGENTS.md" },
  { "id": "forms-loading-button", "category": "forms", "severity": "MUST", "statement": "Loading buttons show a spinner and keep their original label.", "rationale": "Avoids layout shift and keeps the action legible while pending.", "tags": ["button", "loading", "feedback"], "source": "tebin AGENTS.md" },
  { "id": "forms-no-block-paste", "category": "forms", "severity": "NEVER", "statement": "Never block paste in inputs or textareas.", "tags": ["forms", "paste"], "source": "tebin AGENTS.md" },
  { "id": "forms-enter-submits", "category": "forms", "severity": "MUST", "statement": "Enter submits a focused single-line input; in a textarea, Cmd/Ctrl+Enter submits.", "tags": ["forms", "keyboard"], "source": "tebin AGENTS.md" },
  { "id": "forms-errors-inline", "category": "forms", "severity": "MUST", "statement": "Show validation errors inline next to fields and focus the first error on submit.", "tags": ["forms", "validation"], "source": "tebin AGENTS.md" },
  { "id": "forms-autocomplete", "category": "forms", "severity": "MUST", "statement": "Set autocomplete and a meaningful name, with the correct type and inputmode.", "tags": ["forms"], "source": "tebin AGENTS.md" },
  { "id": "forms-warn-unsaved", "category": "forms", "severity": "MUST", "statement": "Warn before navigating away from unsaved changes.", "tags": ["forms"], "source": "tebin AGENTS.md" },
  { "id": "navigation-anchor-links", "category": "navigation", "severity": "MUST", "statement": "Use <a>/<Link> for navigation so Cmd/Ctrl/middle-click work.", "tags": ["navigation", "links"], "source": "tebin AGENTS.md" },
  { "id": "navigation-no-div-onclick", "category": "navigation", "severity": "NEVER", "statement": "Never use a div with onClick for navigation.", "tags": ["navigation"], "source": "tebin AGENTS.md" },
  { "id": "navigation-url-reflects-state", "category": "navigation", "severity": "MUST", "statement": "Reflect state in the URL (filters, tabs, pagination, expanded panels) for deep-linking.", "tags": ["navigation", "state"], "source": "tebin AGENTS.md" },
  { "id": "feedback-confirm-destructive", "category": "feedback", "severity": "MUST", "statement": "Confirm destructive actions or provide an Undo window.", "tags": ["feedback", "safety"], "source": "tebin AGENTS.md" },
  { "id": "feedback-aria-live", "category": "feedback", "severity": "MUST", "statement": "Announce toasts and inline validation with a polite aria-live region.", "tags": ["feedback", "accessibility"], "source": "tebin AGENTS.md" },
  { "id": "feedback-optimistic", "category": "feedback", "severity": "SHOULD", "statement": "Use optimistic UI; reconcile on response and roll back or offer Undo on failure.", "tags": ["feedback"], "source": "tebin AGENTS.md" },
  { "id": "animation-reduced-motion", "category": "animation", "severity": "MUST", "statement": "Honor prefers-reduced-motion with a reduced or disabled variant.", "tags": ["animation", "accessibility"], "source": "tebin AGENTS.md" },
  { "id": "animation-compositor-props", "category": "animation", "severity": "MUST", "statement": "Animate only compositor-friendly properties (transform, opacity).", "rationale": "Avoids layout thrash and jank.", "tags": ["animation", "performance"], "source": "tebin AGENTS.md" },
  { "id": "animation-no-transition-all", "category": "animation", "severity": "NEVER", "statement": "Never use transition: all; list the properties explicitly.", "tags": ["animation"], "source": "tebin AGENTS.md" },
  { "id": "layout-test-breakpoints", "category": "layout", "severity": "MUST", "statement": "Verify layouts on mobile, laptop, and ultra-wide (simulate ultra-wide at 50% zoom).", "tags": ["layout", "responsive"], "source": "tebin AGENTS.md" },
  { "id": "layout-safe-areas", "category": "layout", "severity": "MUST", "statement": "Respect safe areas using env(safe-area-inset-*).", "tags": ["layout", "mobile"], "source": "tebin AGENTS.md" },
  { "id": "layout-flex-min-w-0", "category": "layout", "severity": "MUST", "statement": "Give flex children min-width: 0 so they can truncate.", "tags": ["layout"], "source": "tebin AGENTS.md" },
  { "id": "content-native-semantics", "category": "content", "severity": "MUST", "statement": "Prefer native semantics (button, a, label, table) before ARIA.", "tags": ["accessibility", "semantics"], "source": "tebin AGENTS.md" },
  { "id": "content-icon-button-label", "category": "content", "severity": "MUST", "statement": "Give icon-only buttons a descriptive aria-label.", "tags": ["accessibility"], "source": "tebin AGENTS.md" },
  { "id": "content-not-color-only", "category": "content", "severity": "MUST", "statement": "Convey status with more than color alone; pair icons with text labels.", "tags": ["accessibility", "color"], "source": "tebin AGENTS.md" },
  { "id": "content-tabular-nums", "category": "content", "severity": "MUST", "statement": "Use font-variant-numeric: tabular-nums when comparing numbers in columns.", "tags": ["content", "typography"], "source": "tebin AGENTS.md" },
  { "id": "performance-prevent-cls", "category": "performance", "severity": "MUST", "statement": "Set explicit image dimensions to prevent layout shift (CLS).", "tags": ["performance", "images"], "source": "tebin AGENTS.md" },
  { "id": "performance-virtualize-lists", "category": "performance", "severity": "MUST", "statement": "Virtualize large lists (more than about 50 items).", "tags": ["performance"], "source": "tebin AGENTS.md" },
  { "id": "performance-lazy-images", "category": "performance", "severity": "MUST", "statement": "Preload above-the-fold images and lazy-load the rest.", "tags": ["performance", "images"], "source": "tebin AGENTS.md" },
  { "id": "accessibility-no-disable-zoom", "category": "accessibility", "severity": "NEVER", "statement": "Never disable browser zoom (user-scalable=no or maximum-scale=1).", "tags": ["accessibility", "zoom"], "source": "tebin AGENTS.md" },
  { "id": "theming-color-scheme", "category": "theming", "severity": "MUST", "statement": "Set color-scheme: dark on <html> for dark themes.", "tags": ["theming", "darkmode"], "source": "tebin AGENTS.md" },
  { "id": "theming-native-select-colors", "category": "theming", "severity": "MUST", "statement": "Give native <select> an explicit background-color and color (Windows fix).", "tags": ["theming"], "source": "tebin AGENTS.md" }
]
```

- [ ] **Step 5: Implement `src/rules.ts`**

```ts
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, NotFoundError } from './registry.js';

export type Severity = 'MUST' | 'SHOULD' | 'NEVER';

export interface Rule {
  id: string;
  category: string;
  severity: Severity;
  statement: string;
  rationale?: string;
  tags?: string[];
  source?: string;
}

export function loadRules(): Rule[] {
  const p = join(REPO_ROOT, 'rules', 'rules.json');
  if (!existsSync(p)) throw new NotFoundError('rules/rules.json not found');
  return JSON.parse(readFileSync(p, 'utf8')) as Rule[];
}

export function getRule(id: string): Rule {
  const rule = loadRules().find((r) => r.id === id);
  if (!rule) throw new NotFoundError(`rule "${id}" not found`);
  return rule;
}

export function filterRules(input: { category?: string; severity?: string; tag?: string; query?: string }): Rule[] {
  const { category, severity, tag, query } = input;
  let rules = loadRules();
  if (category) rules = rules.filter((r) => r.category.toLowerCase() === category.toLowerCase());
  if (severity) rules = rules.filter((r) => r.severity.toLowerCase() === severity.toLowerCase());
  if (tag) rules = rules.filter((r) => (r.tags ?? []).some((t) => t.toLowerCase() === tag.toLowerCase()));
  if (query) {
    const q = query.toLowerCase();
    rules = rules.filter((r) => r.id.toLowerCase().includes(q) || r.statement.toLowerCase().includes(q));
  }
  return rules;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run test/rules.test.ts`
Expected: PASS (6 passed).

- [ ] **Step 7: Commit**

```bash
git add schema/rules.schema.json rules/rules.json src/rules.ts test/rules.test.ts
git commit -m "feat: add design-rules schema, seed data, and read layer"
```

---

### Task 2: Markdown digest generation

**Files:**
- Create: `src/rules-build.ts`
- Create: `scripts/build-rules.ts`
- Modify: `package.json` (extend `build` script)
- Test: `test/rules-build.test.ts`

**Interfaces:**
- Consumes: `loadRules`, `Rule` (Task 1); `REPO_ROOT` (registry).
- Produces:
  - `buildRulesMarkdown(rules: Rule[]): string`
  - `writeRulesDigest(): string` — writes `rules/dist/rules.md`, returns the markdown.

- [ ] **Step 1: Write the failing test**

`test/rules-build.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildRulesMarkdown } from '../src/rules-build.js';
import { loadRules } from '../src/rules.js';

describe('buildRulesMarkdown', () => {
  it('renders a grouped digest with severity badges', () => {
    const md = buildRulesMarkdown(loadRules());
    expect(md).toContain('# Design rules');
    expect(md).toContain('## forms');
    expect(md).toContain('**[MUST]**');
    expect(md).toContain('Loading buttons show a spinner');
  });
  it('omits the rationale dash when absent', () => {
    const md = buildRulesMarkdown([
      { id: 'x-y', category: 'misc', severity: 'MUST', statement: 'Do the thing.' },
    ]);
    expect(md).toContain('**[MUST]** Do the thing.\n');
    expect(md).not.toContain('— _');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/rules-build.test.ts`
Expected: FAIL — cannot resolve `../src/rules-build.js`.

- [ ] **Step 3: Implement `src/rules-build.ts`**

```ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './registry.js';
import { loadRules, type Rule } from './rules.js';

export function buildRulesMarkdown(rules: Rule[]): string {
  const byCategory = new Map<string, Rule[]>();
  for (const rule of rules) {
    const list = byCategory.get(rule.category) ?? [];
    list.push(rule);
    byCategory.set(rule.category, list);
  }

  let out = '# Design rules\n\n> Generated from `rules/rules.json` — do not edit by hand.\n';
  for (const category of [...byCategory.keys()].sort()) {
    out += `\n## ${category}\n\n`;
    for (const rule of byCategory.get(category)!) {
      const rationale = rule.rationale ? ` — _${rule.rationale}_` : '';
      out += `- **[${rule.severity}]** ${rule.statement}${rationale}\n`;
    }
  }
  return out;
}

export function writeRulesDigest(): string {
  const md = buildRulesMarkdown(loadRules());
  mkdirSync(join(REPO_ROOT, 'rules', 'dist'), { recursive: true });
  writeFileSync(join(REPO_ROOT, 'rules', 'dist', 'rules.md'), md);
  return md;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/rules-build.test.ts`
Expected: PASS (2 passed).

- [ ] **Step 5: Create `scripts/build-rules.ts`**

```ts
import { writeRulesDigest } from '../src/rules-build.js';

const md = writeRulesDigest();
console.log(`wrote rules/dist/rules.md (${md.split('\n').length} lines)`);
```

- [ ] **Step 6: Extend the `build` script in `package.json`**

Change the `build` script to:
```json
    "build": "tsx scripts/build.ts && tsx scripts/build-index.ts && tsx scripts/build-rules.ts",
```

- [ ] **Step 7: Generate the digest**

Run: `pnpm build`
Expected: ends with `wrote rules/dist/rules.md (...)`; `rules/dist/rules.md` now exists and contains `## forms` and `**[MUST]**`.

- [ ] **Step 8: Commit**

```bash
git add src/rules-build.ts scripts/build-rules.ts package.json rules/dist/rules.md test/rules-build.test.ts
git commit -m "feat: generate rules/dist/rules.md digest from rules.json"
```

---

### Task 3: Validation and drift-check integration

**Files:**
- Modify: `src/validate.ts` (add `validateRulesData`)
- Modify: `scripts/validate.ts` (validate `rules.json`)
- Modify: `src/check.ts` (add `diffRules`)
- Modify: `scripts/check.ts` (check rules digest drift)
- Test: `test/rules-pipeline.test.ts`

**Interfaces:**
- Consumes: `loadRules`, `buildRulesMarkdown` (Tasks 1–2); ajv setup + `ValidationResult` (existing `src/validate.ts`); `REPO_ROOT` (registry).
- Produces:
  - `validateRulesData(obj: unknown): ValidationResult` (in `src/validate.ts`)
  - `diffRules(): string[]` (in `src/check.ts`)

- [ ] **Step 1: Write the failing test**

`test/rules-pipeline.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { validateRulesData } from '../src/validate.js';
import { diffRules } from '../src/check.js';
import { writeRulesDigest } from '../src/rules-build.js';
import { loadRules } from '../src/rules.js';

describe('validateRulesData', () => {
  it('accepts the seeded rules', () => {
    expect(validateRulesData(loadRules()).valid).toBe(true);
  });
  it('rejects a rule with an invalid severity', () => {
    expect(validateRulesData([{ id: 'x-y', category: 'misc', severity: 'MAYBE', statement: 'x' }]).valid).toBe(false);
  });
  it('rejects a rule missing statement', () => {
    expect(validateRulesData([{ id: 'x-y', category: 'misc', severity: 'MUST' }]).valid).toBe(false);
  });
});

describe('diffRules', () => {
  it('reports no drift after a fresh digest write', () => {
    writeRulesDigest();
    expect(diffRules()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/rules-pipeline.test.ts`
Expected: FAIL — `validateRulesData` / `diffRules` are not exported.

- [ ] **Step 3: Add `validateRulesData` to `src/validate.ts`**

After the existing `validateTokensFn` setup near the top, add the rules schema compile (next to the other `ajv.compile` calls):
```ts
const rulesSchema = JSON.parse(readFileSync(join(schemaDir, 'rules.schema.json'), 'utf8'));
const validateRulesFn = ajv.compile(rulesSchema);
```

Then add this exported function (next to `validateTokens`):
```ts
export function validateRulesData(obj: unknown): ValidationResult {
  const valid = validateRulesFn(obj) as boolean;
  return toResult(valid, validateRulesFn.errors);
}
```

- [ ] **Step 4: Add `diffRules` to `src/check.ts`**

Add imports at the top of `src/check.ts`:
```ts
import { REPO_ROOT } from './registry.js';
import { loadRules } from './rules.js';
import { buildRulesMarkdown } from './rules-build.js';
```

Add the function (note: `readFileSync`, `existsSync`, `join` are already imported in this file):
```ts
export function diffRules(): string[] {
  const committedPath = join(REPO_ROOT, 'rules', 'dist', 'rules.md');
  const committed = existsSync(committedPath) ? readFileSync(committedPath, 'utf8') : '';
  const fresh = buildRulesMarkdown(loadRules());
  return committed === fresh ? [] : ['rules/dist/rules.md'];
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run test/rules-pipeline.test.ts`
Expected: PASS (4 passed).

- [ ] **Step 6: Wire rules validation into `scripts/validate.ts`**

Add to the imports:
```ts
import { validateThemeDir, validateRulesData } from '../src/validate.js';
```
(replace the existing `import { validateThemeDir } from '../src/validate.js';` line).

Before the final `if (failed) process.exit(1);`, add:
```ts
const rulesPath = join(root, 'rules', 'rules.json');
if (existsSync(rulesPath)) {
  const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
  const res = validateRulesData(rules);
  const ids = new Set<string>();
  let dup = false;
  if (Array.isArray(rules)) {
    for (const r of rules) {
      if (ids.has(r.id)) { dup = true; console.error(`✗ duplicate rule id: ${r.id}`); }
      ids.add(r.id);
    }
  }
  if (res.valid && !dup) {
    console.log('✓ rules');
  } else {
    failed = true;
    console.error('✗ rules');
    for (const e of res.errors) console.error(`    ${e}`);
  }
}
```
Ensure `readFileSync` is imported in `scripts/validate.ts` (add it to the existing `node:fs` import alongside `readdirSync, existsSync`).

- [ ] **Step 7: Wire rules drift into `scripts/check.ts`**

Add to the imports:
```ts
import { diffTheme, diffRules } from '../src/check.js';
```
(replace the existing `import { diffTheme } from '../src/check.js';` line).

Before the final `if (failed) process.exit(1);`, add:
```ts
if (existsSync(join(root, 'rules', 'rules.json'))) {
  const rulesDrift = diffRules();
  if (rulesDrift.length) {
    failed = true;
    console.error('✗ rules/dist/rules.md is out of date — run `pnpm build`');
  } else {
    console.log('✓ rules/dist/rules.md');
  }
}
```

- [ ] **Step 8: Run validate + check**

Run: `pnpm validate && pnpm check`
Expected: validate prints `✓ rules` and `All themes valid.`; check prints `✓ rules/dist/rules.md` and `No drift.`

- [ ] **Step 9: Commit**

```bash
git add src/validate.ts scripts/validate.ts src/check.ts scripts/check.ts test/rules-pipeline.test.ts
git commit -m "feat: validate rules.json and drift-check the rules digest"
```

---

### Task 4: MCP tools `list_rules` and `get_rule`

**Files:**
- Modify: `mcp/tools.ts`
- Modify: `test/mcp.test.ts`
- Modify: `test/server.test.ts`

**Interfaces:**
- Consumes: `filterRules`, `getRule`, `Rule` (Task 1); existing `toolDefinitions`, `z` (`mcp/tools.ts`).
- Produces: `listRules(input)`, `getRuleTool(input)` and two extra entries in `toolDefinitions` (now 5 total: `list_themes`, `get_theme`, `get_asset`, `list_rules`, `get_rule`).

- [ ] **Step 1: Update the failing tests**

In `test/mcp.test.ts`, change the `toolDefinitions` assertion to:
```ts
  it('declares the five tools', () => {
    expect(toolDefinitions.map((t) => t.name)).toEqual([
      'list_themes', 'get_theme', 'get_asset', 'list_rules', 'get_rule',
    ]);
  });
```
And append a new block:
```ts
import { listRules, getRuleTool } from '../mcp/tools.js';

describe('list_rules / get_rule', () => {
  it('lists rules filtered by category', () => {
    const r = listRules({ category: 'forms' });
    expect(r.count).toBe(r.rules.length);
    expect(r.rules.every((x) => x.category === 'forms')).toBe(true);
  });
  it('gets a rule by id', () => {
    expect(getRuleTool({ id: 'forms-loading-button' }).severity).toBe('MUST');
  });
  it('throws for an unknown rule', () => {
    expect(() => getRuleTool({ id: 'nope' })).toThrow(NotFoundError);
  });
});
```
(The `NotFoundError` import already exists at the top of `test/mcp.test.ts`; if not, add `import { NotFoundError } from '../src/registry.js';`.)

In `test/server.test.ts`, change the assertion to:
```ts
  it('registers exactly the five known tools', () => {
    expect(toolDefinitions.map((t) => t.name)).toEqual([
      'list_themes', 'get_theme', 'get_asset', 'list_rules', 'get_rule',
    ]);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run test/mcp.test.ts test/server.test.ts`
Expected: FAIL — `listRules`/`getRuleTool` not exported and the tool list has only three entries.

- [ ] **Step 3: Extend `mcp/tools.ts`**

Add to the imports from the rules module:
```ts
import { filterRules, getRule as getRuleById, type Rule } from '../src/rules.js';
```

Add the two handlers (after `getAsset`):
```ts
export function listRules(input: { category?: string; severity?: string; tag?: string; query?: string }): {
  count: number; rules: Rule[];
} {
  const rules = filterRules(input);
  return { count: rules.length, rules };
}

export function getRuleTool(input: { id: string }): Rule {
  return getRuleById(input.id);
}
```

Add two entries to the end of the `toolDefinitions` array:
```ts
  {
    name: 'list_rules',
    description: 'List design rules (UI/UX/accessibility guidelines), filtered by category, severity, tag, or query.',
    inputSchema: {
      category: z.string().optional(),
      severity: z.enum(['MUST', 'SHOULD', 'NEVER']).optional(),
      tag: z.string().optional(),
      query: z.string().optional(),
    },
    handler: listRules,
  },
  {
    name: 'get_rule',
    description: 'Get a single design rule by id.',
    inputSchema: {
      id: z.string(),
    },
    handler: getRuleTool,
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run test/mcp.test.ts test/server.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mcp/tools.ts test/mcp.test.ts test/server.test.ts
git commit -m "feat: add list_rules and get_rule MCP tools"
```

---

### Task 5: Skill, docs, and final verification

**Files:**
- Modify: `skill/tebin-style/SKILL.md`
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces: documentation; no new code symbols.

- [ ] **Step 1: Update `skill/tebin-style/SKILL.md`**

Widen the `description` in the frontmatter to add design-rules triggers — change it to:
```yaml
description: >
  Use when the user wants to apply, borrow, or reuse a ready-made visual theme
  / brand kit (color palette, typography, spacing, shadows, logos) in a
  project, OR wants design rules / UI guidelines / accessibility rules while
  building or reviewing UI. Triggers: "use the TEBIN theme", "apply a brand
  kit", "give me an industrial palette", "theme this project like X", "borrow
  styles", "UI rules", "accessibility guidelines", "design dos and don'ts".
```

Add a new section before "## Reading the registry":
```markdown
## Design rules

When building or reviewing UI, consult the rules database for
MUST/SHOULD/NEVER guidance:

- Filter via the MCP tool `list_rules({ category?, severity?, tag?, query? })`,
  or read the digest at `rules/dist/rules.md`.
- Fetch one rule with `get_rule({ id })`.
- When reviewing, cite the `MUST`/`NEVER` rules the code violates.
```

- [ ] **Step 2: Update `README.md`**

Add a section after the "MCP server" section:
```markdown
## Design rules

`tebin-style` includes a global, theme-independent database of UI/UX/accessibility
rules (MUST/SHOULD/NEVER), seeded from a generalized engineering rulebook.

- Source: [`rules/rules.json`](./rules/rules.json) (canonical).
- Digest: [`rules/dist/rules.md`](./rules/dist/rules.md) (generated).
- MCP tools: `list_rules({ category?, severity?, tag?, query? })` and `get_rule({ id })`.
```

- [ ] **Step 3: Update `CONTRIBUTING.md`**

Append:
```markdown
## Contributing a design rule

1. Add an object to `rules/rules.json` with a unique kebab-case `id`, a
   `category`, a `severity` (`MUST` | `SHOULD` | `NEVER`), and a `statement`
   (optional `rationale`, `tags`, `source`).
2. Run `pnpm validate && pnpm build && pnpm check && pnpm test`.
3. Commit `rules/rules.json` and the regenerated `rules/dist/rules.md`.
```

- [ ] **Step 4: Full verification**

Run: `pnpm validate && pnpm check && pnpm test`
Expected: validate `✓ rules` + `All themes valid.`; check `✓ rules/dist/rules.md` + `No drift.`; all test files pass (themes, registry, mcp, server, rules, rules-build, rules-pipeline).

- [ ] **Step 5: Commit, merge to main, push**

```bash
git add -A
git commit -m "docs: document the design-rules database (skill, README, CONTRIBUTING)"
git checkout main
git merge --ff-only <current-branch>
git push origin main
```

- [ ] **Step 6: Confirm CI is green**

Run: `gh run watch "$(gh run list --branch main --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status`
Expected: run completes with `success`.

---

## Self-Review

**Spec coverage:**
- §3 data model → Task 1 (schema + seed + types). ✓
- §4 storage layout → Tasks 1–2 create `rules/rules.json`, `rules/dist/rules.md`, `schema/rules.schema.json`, `src/rules.ts`, `src/rules-build.ts`. ✓
- §5 read layer → Task 1 (`loadRules`/`getRule`/`filterRules`). ✓
- §6 generation → Task 2 (`buildRulesMarkdown`/`writeRulesDigest` + `build-rules.ts` + build script). ✓
- §7 validation → Task 3 (`validateRulesData` + `scripts/validate.ts`). ✓
- §8 drift → Task 3 (`diffRules` + `scripts/check.ts`). ✓
- §9 MCP tools → Task 4 (`list_rules`/`get_rule` + toolDefinitions). ✓
- §10 skill update → Task 5. ✓
- §11 seed content → Task 1 step 4 (33 rules across categories, `source: tebin AGENTS.md`). ✓
- §12 testing → Tasks 1–4 test files + updated tool-count assertions in `test/mcp.test.ts` and `test/server.test.ts`. ✓
- §13 documentation → Task 5 (README + CONTRIBUTING). ✓
- §14 acceptance criteria → Task 5 steps 4–6. ✓

**Placeholder scan:** no TODO/TBD; every code step shows full code. The only literal placeholder is `<current-branch>` in the final merge command, resolved at execution. ✓

**Type consistency:** `Rule`, `Severity`, `loadRules`, `getRule`, `filterRules`, `buildRulesMarkdown`, `writeRulesDigest`, `validateRulesData`, `diffRules`, `listRules`, `getRuleTool` are named consistently across tasks; `getRule` is imported into `mcp/tools.ts` as `getRuleById` to avoid colliding with the existing names there; `REPO_ROOT`/`NotFoundError`/`ValidationResult` reuse existing exports. The five tool names match between `mcp/tools.ts`, `test/mcp.test.ts`, and `test/server.test.ts`. ✓
