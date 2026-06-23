# tebin-style Phase 2 — MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local stdio MCP server to `tebin-style` exposing three read-only tools (`list_themes`, `get_theme`, `get_asset`) over the data committed in Phase 1.

**Architecture:** A shared read layer (`src/registry.ts`) reads the committed `registry/index.json`, `themes/<id>/dist/*`, and `themes/<id>/assets/*`. Pure handlers (`mcp/tools.ts`) implement the three tools and are unit-tested directly. A thin server (`mcp/server.ts`) wires those handlers to `@modelcontextprotocol/sdk` over `StdioServerTransport`, turning thrown errors into MCP tool errors.

**Tech Stack:** TypeScript (ESM), Node ≥18, pnpm, `@modelcontextprotocol/sdk` (v1.x), `zod`, Vitest, tsx.

## Global Constraints

Every task's requirements implicitly include this section.

- Runtime: Node ≥ 18; pnpm; `package.json` has `"type": "module"`. Working dir is the `tebin-style/` project root.
- Read **committed files only** — never regenerate `dist/*` or `registry/index.json` at runtime.
- All tools are **read-only**. No mutation, no network calls.
- SDK imports use the v1 subpaths: `@modelcontextprotocol/sdk/server/mcp.js` and `@modelcontextprotocol/sdk/server/stdio.js`.
- `registerTool(name, { description, inputSchema }, handler)` where `inputSchema` is a **Zod raw shape** (a plain object of zod validators, not `z.object(...)`).
- Pure handlers return plain data objects and throw `NotFoundError` on missing id/format/asset; the server serializes results to JSON text content and maps thrown errors to `{ isError: true }`.
- Asset encoding: `.svg` → `utf8` inline text; everything else (`.png`, `.ico`, …) → `base64`.
- Format files: `css`→`tokens.css`, `tailwind`→`tailwind.css`, `dtcg`→`tokens.dtcg.json`, `ts`→`theme.ts`.
- English for all code, comments, and docs.

---

### Task 1: Shared read layer (`src/registry.ts`)

**Files:**
- Create: `src/registry.ts`
- Test: `test/registry.test.ts`

**Interfaces:**
- Consumes: `RegistryIndex`, `ThemeEntry` types from `src/index-builder.ts` (Phase 1).
- Produces:
  - `class NotFoundError extends Error`
  - `REPO_ROOT: string`
  - `type Format = 'css' | 'tailwind' | 'dtcg' | 'ts'`
  - `FORMAT_FILES: Record<Format, string>`
  - `loadIndex(): RegistryIndex`
  - `loadThemeManifest(id: string): { id: string; name: string; version: string; license: { tokens: string; assets: string }; assets: Array<{ id: string; type: string; format: string; path: string }> }`
  - `readFormat(id: string, format: Format): { filename: string; content: string }`
  - `readAssetFile(repoRelPath: string): { format: string; encoding: 'utf8' | 'base64'; content: string }`

- [ ] **Step 1: Write the failing test**

`test/registry.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  loadIndex, loadThemeManifest, readFormat, readAssetFile, FORMAT_FILES, NotFoundError,
} from '../src/registry.js';

describe('registry read layer', () => {
  it('loads the committed index', () => {
    const idx = loadIndex();
    expect(idx.themes.some((t) => t.id === 'tebin')).toBe(true);
  });

  it('loads a theme manifest', () => {
    const m = loadThemeManifest('tebin');
    expect(m.name).toBe('TEBIN');
    expect(m.assets.some((a) => a.id === 'logo-full')).toBe(true);
  });

  it('throws NotFoundError for an unknown manifest', () => {
    expect(() => loadThemeManifest('nope')).toThrow(NotFoundError);
  });

  it('reads each generated format', () => {
    expect(readFormat('tebin', 'css').content).toContain('--color-brand');
    expect(readFormat('tebin', 'tailwind').content).toContain('@theme');
    expect(readFormat('tebin', 'ts').content).toContain('export const tebin');
    expect(JSON.parse(readFormat('tebin', 'dtcg').content).color.brand.$value).toBe('#DA291C');
  });

  it('maps all four formats to filenames', () => {
    expect(FORMAT_FILES).toEqual({
      css: 'tokens.css', tailwind: 'tailwind.css', dtcg: 'tokens.dtcg.json', ts: 'theme.ts',
    });
  });

  it('reads an SVG asset as utf8 text and a png as base64', () => {
    const svg = readAssetFile('themes/tebin/assets/logo/logo-full.svg');
    expect(svg.encoding).toBe('utf8');
    expect(svg.content).toContain('<svg');
    const png = readAssetFile('themes/tebin/assets/favicon/favicon.png');
    expect(png.encoding).toBe('base64');
    expect(png.content.length).toBeGreaterThan(0);
  });

  it('throws NotFoundError for a missing asset file', () => {
    expect(() => readAssetFile('themes/tebin/assets/nope.svg')).toThrow(NotFoundError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/registry.test.ts`
Expected: FAIL — cannot resolve `../src/registry.js`.

- [ ] **Step 3: Implement `src/registry.ts`**

```ts
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import type { RegistryIndex } from './index-builder.js';

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export type Format = 'css' | 'tailwind' | 'dtcg' | 'ts';

export const FORMAT_FILES: Record<Format, string> = {
  css: 'tokens.css',
  tailwind: 'tailwind.css',
  dtcg: 'tokens.dtcg.json',
  ts: 'theme.ts',
};

export interface ThemeManifest {
  id: string;
  name: string;
  version: string;
  license: { tokens: string; assets: string };
  assets: Array<{ id: string; type: string; format: string; path: string }>;
}

export function loadIndex(): RegistryIndex {
  const p = join(REPO_ROOT, 'registry', 'index.json');
  if (!existsSync(p)) throw new NotFoundError('registry/index.json not found — run `pnpm build`');
  return JSON.parse(readFileSync(p, 'utf8')) as RegistryIndex;
}

export function loadThemeManifest(id: string): ThemeManifest {
  const p = join(REPO_ROOT, 'themes', id, 'theme.json');
  if (!existsSync(p)) throw new NotFoundError(`theme "${id}" not found`);
  return JSON.parse(readFileSync(p, 'utf8')) as ThemeManifest;
}

export function readFormat(id: string, format: Format): { filename: string; content: string } {
  const filename = FORMAT_FILES[format];
  if (!filename) throw new NotFoundError(`unknown format "${format}"`);
  const p = join(REPO_ROOT, 'themes', id, 'dist', filename);
  if (!existsSync(p)) throw new NotFoundError(`format "${format}" for theme "${id}" not found`);
  return { filename, content: readFileSync(p, 'utf8') };
}

export function readAssetFile(repoRelPath: string): { format: string; encoding: 'utf8' | 'base64'; content: string } {
  const p = join(REPO_ROOT, repoRelPath);
  if (!existsSync(p)) throw new NotFoundError(`asset file not found: ${repoRelPath}`);
  const ext = extname(repoRelPath).replace('.', '').toLowerCase();
  const isText = ext === 'svg';
  return {
    format: ext,
    encoding: isText ? 'utf8' : 'base64',
    content: readFileSync(p, isText ? 'utf8' : 'base64'),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/registry.test.ts`
Expected: PASS (7 passed).

- [ ] **Step 5: Commit**

```bash
git add src/registry.ts test/registry.test.ts
git commit -m "feat: add shared registry read layer for the MCP server"
```

---

### Task 2: Tool handlers (`mcp/tools.ts`)

**Files:**
- Create: `mcp/tools.ts`
- Test: `test/mcp.test.ts`

**Interfaces:**
- Consumes: `loadIndex`, `loadThemeManifest`, `readFormat`, `readAssetFile`, `FORMAT_FILES`, `NotFoundError`, `Format` (Task 1).
- Produces:
  - `listThemes(input: { industry?: string; mood?: string; query?: string }): { count: number; themes: ThemeEntry[] }`
  - `getTheme(input: { id: string; format?: Format }): { id; name; version; format; filename; license; content }`
  - `getAsset(input: { id: string; assetId?: string }): manifest list OR single asset payload`
  - `toolDefinitions: ToolDef[]` — array of `{ name, description, inputSchema, handler }` consumed by the server. `inputSchema` is a Zod raw shape.

- [ ] **Step 1: Write the failing test**

`test/mcp.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { listThemes, getTheme, getAsset, toolDefinitions } from '../mcp/tools.js';
import { NotFoundError } from '../src/registry.js';

describe('list_themes', () => {
  it('returns tebin with no filters', () => {
    const r = listThemes({});
    expect(r.count).toBe(r.themes.length);
    expect(r.themes.some((t) => t.id === 'tebin')).toBe(true);
  });
  it('filters by industry', () => {
    expect(listThemes({ industry: 'engineering' }).themes.some((t) => t.id === 'tebin')).toBe(true);
    expect(listThemes({ industry: 'nope' }).count).toBe(0);
  });
  it('filters by query against id/name', () => {
    expect(listThemes({ query: 'teb' }).themes.some((t) => t.id === 'tebin')).toBe(true);
  });
});

describe('get_theme', () => {
  it('defaults to css', () => {
    const r = getTheme({ id: 'tebin' });
    expect(r.format).toBe('css');
    expect(r.content).toContain('--color-brand');
    expect(r.name).toBe('TEBIN');
  });
  it('returns the ts format', () => {
    expect(getTheme({ id: 'tebin', format: 'ts' }).content).toContain('export const tebin');
  });
  it('throws for an unknown theme', () => {
    expect(() => getTheme({ id: 'nope' })).toThrow(NotFoundError);
  });
});

describe('get_asset', () => {
  it('lists assets when no assetId', () => {
    const r = getAsset({ id: 'tebin' }) as { assets: Array<{ id: string }> };
    expect(r.assets.some((a) => a.id === 'logo-full')).toBe(true);
  });
  it('returns SVG content as utf8', () => {
    const r = getAsset({ id: 'tebin', assetId: 'logo-full' }) as { encoding: string; content: string; rawUrl: string };
    expect(r.encoding).toBe('utf8');
    expect(r.content).toContain('<svg');
    expect(r.rawUrl).toContain('themes/tebin/assets/logo/logo-full.svg');
  });
  it('returns binary content as base64', () => {
    const r = getAsset({ id: 'tebin', assetId: 'favicon-png' }) as { encoding: string };
    expect(r.encoding).toBe('base64');
  });
  it('throws for an unknown asset', () => {
    expect(() => getAsset({ id: 'tebin', assetId: 'nope' })).toThrow(NotFoundError);
  });
});

describe('toolDefinitions', () => {
  it('declares the three tools', () => {
    expect(toolDefinitions.map((t) => t.name)).toEqual(['list_themes', 'get_theme', 'get_asset']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/mcp.test.ts`
Expected: FAIL — cannot resolve `../mcp/tools.js`.

- [ ] **Step 3: Implement `mcp/tools.ts`**

```ts
import { z } from 'zod';
import type { ThemeEntry } from '../src/index-builder.js';
import {
  loadIndex, loadThemeManifest, readFormat, readAssetFile, FORMAT_FILES, NotFoundError,
  type Format,
} from '../src/registry.js';

const FORMATS = Object.keys(FORMAT_FILES) as Format[];

export function listThemes(input: { industry?: string; mood?: string; query?: string }): {
  count: number; themes: ThemeEntry[];
} {
  const { industry, mood, query } = input;
  let themes = loadIndex().themes;
  if (industry) themes = themes.filter((t) => t.industry.some((v) => v.toLowerCase() === industry.toLowerCase()));
  if (mood) themes = themes.filter((t) => t.mood.some((v) => v.toLowerCase() === mood.toLowerCase()));
  if (query) {
    const q = query.toLowerCase();
    themes = themes.filter((t) => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
  }
  return { count: themes.length, themes };
}

export function getTheme(input: { id: string; format?: Format }) {
  const format: Format = input.format ?? 'css';
  if (!FORMAT_FILES[format]) throw new NotFoundError(`unknown format "${format}"`);
  const manifest = loadThemeManifest(input.id); // throws NotFoundError for unknown id
  const { filename, content } = readFormat(input.id, format);
  return {
    id: manifest.id, name: manifest.name, version: manifest.version,
    format, filename, license: manifest.license, content,
  };
}

export function getAsset(input: { id: string; assetId?: string }) {
  const entry = loadIndex().themes.find((t) => t.id === input.id);
  if (!entry) throw new NotFoundError(`theme "${input.id}" not found`);

  if (!input.assetId) {
    return { id: entry.id, assets: entry.assets };
  }

  const asset = entry.assets.find((a) => a.id === input.assetId);
  if (!asset) throw new NotFoundError(`asset "${input.assetId}" not found in theme "${input.id}"`);

  const file = readAssetFile(asset.path);
  return {
    id: entry.id, assetId: asset.id, type: asset.type,
    format: file.format, path: asset.path, rawUrl: asset.rawUrl,
    encoding: file.encoding, content: file.content,
  };
}

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: z.ZodRawShape;
  handler: (args: any) => unknown;
}

export const toolDefinitions: ToolDef[] = [
  {
    name: 'list_themes',
    description: 'List available themes, optionally filtered by industry, mood, or a name/id query.',
    inputSchema: {
      industry: z.string().optional(),
      mood: z.string().optional(),
      query: z.string().optional(),
    },
    handler: listThemes,
  },
  {
    name: 'get_theme',
    description: 'Get a theme\'s design tokens in a chosen format (css, tailwind, dtcg, ts; default css).',
    inputSchema: {
      id: z.string(),
      format: z.enum(FORMATS as [Format, ...Format[]]).optional(),
    },
    handler: getTheme,
  },
  {
    name: 'get_asset',
    description: 'List a theme\'s brand assets, or fetch one asset (SVG as text, binary as base64) by assetId.',
    inputSchema: {
      id: z.string(),
      assetId: z.string().optional(),
    },
    handler: getAsset,
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/mcp.test.ts`
Expected: PASS (10 passed).

- [ ] **Step 5: Commit**

```bash
git add mcp/tools.ts test/mcp.test.ts
git commit -m "feat: add MCP tool handlers (list_themes, get_theme, get_asset)"
```

---

### Task 3: MCP server, packaging, docs

**Files:**
- Create: `mcp/server.ts`
- Test: `test/server.test.ts`
- Modify: `package.json` (deps + scripts)
- Modify: `README.md` (registration section)
- Modify: `skill/tebin-style/SKILL.md` (note the MCP alternative)

**Interfaces:**
- Consumes: `toolDefinitions` (Task 2).
- Produces: `createServer(): McpServer` and a guarded `main()` that connects over stdio.

- [ ] **Step 1: Install the SDK and zod**

Run: `pnpm add @modelcontextprotocol/sdk@^1.18.0 zod@^3.23.8`
Expected: both added to `dependencies`; install exits 0.

- [ ] **Step 2: Write the failing test**

`test/server.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createServer } from '../mcp/server.js';
import { toolDefinitions } from '../mcp/tools.js';

describe('mcp server', () => {
  it('constructs without throwing', () => {
    expect(() => createServer()).not.toThrow();
  });
  it('registers exactly the three known tools', () => {
    expect(toolDefinitions.map((t) => t.name)).toEqual(['list_themes', 'get_theme', 'get_asset']);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm vitest run test/server.test.ts`
Expected: FAIL — cannot resolve `../mcp/server.js`.

- [ ] **Step 4: Implement `mcp/server.ts`**

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { fileURLToPath } from 'node:url';
import { toolDefinitions } from './tools.js';

export function createServer(): McpServer {
  const server = new McpServer({ name: 'tebin-style', version: '0.1.0' });

  for (const def of toolDefinitions) {
    server.registerTool(
      def.name,
      { description: def.description, inputSchema: def.inputSchema },
      async (args: unknown) => {
        try {
          const result = await def.handler(args);
          return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          return {
            content: [{ type: 'text' as const, text: err instanceof Error ? err.message : String(err) }],
            isError: true,
          };
        }
      },
    );
  }

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('tebin-style MCP server running on stdio');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('Fatal error in tebin-style MCP server:', error);
    process.exit(1);
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run test/server.test.ts`
Expected: PASS (2 passed).

- [ ] **Step 6: Add the `start:mcp` script to `package.json`**

In the `"scripts"` block add:
```json
    "start:mcp": "tsx mcp/server.ts"
```

- [ ] **Step 7: Smoke-test the server boots over stdio**

Run: `printf '' | pnpm start:mcp & sleep 2; kill %1 2>/dev/null; echo done`
Expected: stderr prints `tebin-style MCP server running on stdio` (the process waits on stdio until killed). `done` printed.

- [ ] **Step 8: Document registration in `README.md`**

Add a section after "For agents":
```markdown
## MCP server

`tebin-style` also ships a local [MCP](https://modelcontextprotocol.io) server
exposing read-only tools `list_themes`, `get_theme`, and `get_asset`.

Run it: `pnpm start:mcp` (stdio). Register it in an MCP client, e.g.:

​```jsonc
{ "mcpServers": {
  "tebin-style": { "command": "pnpm", "args": ["--dir", "/abs/path/to/tebin-style", "start:mcp"] }
} }
​```

- `list_themes({ industry?, mood?, query? })` → matching theme summaries
- `get_theme({ id, format? })` → tokens in `css` | `tailwind` | `dtcg` | `ts` (default `css`)
- `get_asset({ id, assetId? })` → asset list, or one asset (SVG as text, binary as base64)
```

- [ ] **Step 9: Note the MCP option in `skill/tebin-style/SKILL.md`**

Under "Reading the registry", append:
```markdown
- Via MCP: if the `tebin-style` MCP server is registered, call its
  `list_themes` / `get_theme` / `get_asset` tools instead of reading files.
```

- [ ] **Step 10: Full verification**

Run: `pnpm validate && pnpm check && pnpm test`
Expected: validate `✓ tebin`; check `No drift.`; all test files pass including `registry`, `mcp`, and `server` suites.

- [ ] **Step 11: Commit and push**

```bash
git add -A
git commit -m "feat: add stdio MCP server, scripts, and docs"
git push
```

- [ ] **Step 12: Confirm CI is green**

Run: `gh run watch "$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status`
Expected: run completes with `success`.

---

## Self-Review

**Spec coverage:**
- §3 architecture / file layout → Tasks 1–3 create `src/registry.ts`, `mcp/tools.ts`, `mcp/server.ts`, `test/mcp.test.ts` (+ `test/registry.test.ts`, `test/server.test.ts`). ✓
- §4 read layer functions → Task 1 (`loadIndex`, `loadThemeManifest`, `readFormat`, `readAssetFile`, `FORMAT_FILES`, `NotFoundError`). Note: spec sketched a single `readAsset(id, assetId)`; implemented as `readAssetFile(path)` + composition in `getAsset` so the index supplies `rawUrl`/`path` and the read layer stays path-only. ✓
- §5 tools + shapes → Task 2 (`listThemes`, `getTheme`, `getAsset`, `toolDefinitions`). ✓
- §6 server (SDK + stdio) → Task 3. ✓
- §7 error handling → `NotFoundError` (Tasks 1–2) mapped to `isError` in the server wrapper (Task 3); enum/shape validated by zod `inputSchema`. ✓
- §8 testing → Tasks 1–3 test files, run under `pnpm test`/CI. ✓
- §9 packaging & registration → Task 3 (dep add, `start:mcp`, README, skill note). Deviation: no `bin` entry — a `.ts` bin needs a build/shebang that is not cross-platform; the documented `start:mcp` (tsx) is the stdio entry point. ✓
- §10 acceptance criteria → Tasks 3.7 (boots), 3.10 (validate/check/test), 3.12 (CI). ✓

**Placeholder scan:** no TODO/TBD; every code step has full code. The README JSONC fence uses a zero-width separator in the plan only to nest a code block in markdown — when writing the file, use a normal ```` ``` ```` fence. ✓

**Type consistency:** `Format`, `FORMAT_FILES`, `NotFoundError`, `loadIndex`, `loadThemeManifest`, `readFormat`, `readAssetFile`, `listThemes`, `getTheme`, `getAsset`, `toolDefinitions`, `createServer` are named consistently across tasks; `ThemeEntry`/`RegistryIndex` reuse the Phase 1 `src/index-builder.ts` exports. ✓
