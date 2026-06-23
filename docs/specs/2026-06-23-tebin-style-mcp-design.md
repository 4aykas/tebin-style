# tebin-style Phase 2 — MCP Server (Design)

Status: Approved design (Phase 2)
Date: 2026-06-23
Author: brainstormed with Claude
Builds on: `docs/specs/2026-06-22-tebin-style-design.md` (Phase 1)

## 1. Summary

Phase 2 adds a **local MCP server** to the existing `tebin-style` repo so any
MCP-capable agent (Claude Code, Claude Desktop, etc.) can query the theme
registry programmatically through tools, instead of only reading files via the
skill. The server is a thin, read-only adapter over the data already produced
and committed in Phase 1 (`registry/index.json`, `themes/<id>/dist/*`, and
`themes/<id>/assets/*`).

It lives in the same repo and reuses Phase 1 logic. No new data model, no
hosting.

## 2. Goals and Non-Goals

### Goals
- A **stdio** MCP server exposing three read-only tools: `list_themes`,
  `get_theme`, `get_asset`.
- Read **committed files** at runtime (no build, no regeneration).
- Return assets agent-ready: SVG inline as text, PNG/ICO as base64.
- One shared read layer (`src/registry.ts`) used by the tool handlers.
- Pure, unit-tested handlers; the server file is a thin SDK wiring.
- Documented client registration.

### Non-Goals
- No HTTP/SSE or remote/hosted transport (stdio only).
- No write/mutation tools.
- No runtime regeneration of `dist/*` (Phase 1 CI already drift-checks it).
- No MCP **resources** API in this phase (tools only); may come later.
- No npm publish.

## 3. Architecture

New files in the existing repo:

```
tebin-style/
├─ src/registry.ts     # NEW shared read layer
├─ mcp/
│  ├─ tools.ts         # NEW pure tool handlers (testable)
│  └─ server.ts        # NEW MCP server: SDK + stdio wiring
└─ test/mcp.test.ts    # NEW unit tests over the handlers
```

Data flow: an MCP client spawns the server over stdio → a tool call invokes a
handler in `mcp/tools.ts` → the handler reads committed repo files via
`src/registry.ts` → returns structured JSON/text. `mcp/server.ts` only
translates between the SDK and the handlers (and turns thrown errors into MCP
tool errors). Keeping the handlers pure means tests need no protocol harness.

**Data access:** read the committed `registry/index.json`,
`themes/<id>/dist/<file>`, and `themes/<id>/assets/<path>` directly. Do **not**
regenerate at runtime.

## 4. Shared read layer — `src/registry.ts`

Resolves the repo root relative to the module and exposes:

- `loadIndex(): RegistryIndex` — parse committed `registry/index.json`. Reuses
  the `RegistryIndex` / `ThemeEntry` types from `src/index-builder.ts`.
- `FORMAT_FILES: Record<Format, string>` where
  `Format = 'css' | 'tailwind' | 'dtcg' | 'ts'`, mapping to
  `tokens.css | tailwind.css | tokens.dtcg.json | theme.ts`.
- `readFormat(id: string, format: Format): { filename: string; content: string }`
  — reads `themes/<id>/dist/<file>`; throws `NotFoundError` for unknown id/file.
- `loadThemeManifest(id: string): ThemeManifest` — parse `themes/<id>/theme.json`.
- `readAsset(id, assetId): { type; format; path; encoding: 'utf8' | 'base64'; content }`
  — SVG/text → utf8, else base64; throws `NotFoundError` for unknown id/assetId.

`NotFoundError` is a small typed `Error` subclass used for clean tool errors.

## 5. Tools — `mcp/tools.ts`

All read-only. Each handler is an exported pure function plus a JSON-schema-ish
input definition consumed by `server.ts`.

### `list_themes`
- Input: `{ industry?: string; mood?: string; query?: string }` (all optional).
- Output: `{ count: number; themes: ThemeEntry[] }`.
- Filters against `loadIndex()`: `industry`/`mood` match if present in the
  theme's arrays (case-insensitive); `query` matches `id`/`name` substring
  (case-insensitive). No filters → all themes.

### `get_theme`
- Input: `{ id: string; format?: 'css' | 'tailwind' | 'dtcg' | 'ts' }`
  (default `css`).
- Output: `{ id, name, version, format, filename, license, content }`.
- Looks up the theme in the index for metadata, then `readFormat(id, format)`.
- Unknown id or invalid format → error.

### `get_asset`
- Input: `{ id: string; assetId?: string }`.
- No `assetId`: `{ id, assets: Array<{ id, type, format, path, rawUrl }> }`
  (from the index entry's `assets`).
- With `assetId`: `{ id, assetId, type, format, path, rawUrl, encoding, content }`
  — `encoding: 'utf8'` with inline text for SVG/text, `encoding: 'base64'` for
  PNG/ICO and other binaries.
- Unknown id or assetId → error.

## 6. Server — `mcp/server.ts`

- Uses `@modelcontextprotocol/sdk`: an MCP server instance over
  `StdioServerTransport`.
- Registers the three tools with their input schemas and handlers from
  `mcp/tools.ts`.
- Wraps each handler call: returns the result as JSON text content; on a thrown
  error returns an MCP tool error (`isError: true`) with the message.
- The exact SDK entry points and tool-registration signature are verified
  against the current `@modelcontextprotocol/sdk` during planning so the
  implementation ships working code.

## 7. Error Handling

- Input shape/enum validated before any file access.
- Unknown `id` / `format` / `assetId` → `NotFoundError` → MCP tool error with a
  clear, specific message (e.g. `theme "foo" not found`).
- File-system/parse errors are caught and surfaced as tool errors, never crash
  the server process.

## 8. Testing — `test/mcp.test.ts`

Unit-test the pure handlers against the real committed `tebin` theme:

- `list_themes` with no filter returns `tebin`; `industry: "engineering"`
  includes it; `industry: "nope"` returns empty; `query: "teb"` matches.
- `get_theme tebin css` content contains `--color-brand`; `ts` contains
  `export const tebin`; `dtcg` parses to JSON with `color.brand.$value`;
  unknown id throws.
- `get_asset tebin` (no assetId) returns the manifest list including
  `logo-full`; `get_asset tebin logo-full` returns `encoding:"utf8"` content
  starting with `<svg`; `get_asset tebin favicon-png` returns
  `encoding:"base64"`; unknown assetId throws.

Runs under the existing `pnpm test` / CI; no protocol harness needed.

## 9. Packaging & Registration

- Add dependency `@modelcontextprotocol/sdk`.
- `package.json`: `"start:mcp": "tsx mcp/server.ts"` and a `bin` entry
  (`tebin-style-mcp`).
- README documents client registration, e.g.:
  ```jsonc
  { "mcpServers": {
    "tebin-style": { "command": "pnpm", "args": ["--dir", "/abs/path/tebin-style", "start:mcp"] }
  } }
  ```
- CI is unchanged; the new Vitest file is picked up automatically.

## 10. Acceptance Criteria

- `mcp/server.ts` starts over stdio and lists the three tools.
- `list_themes` / `get_theme` / `get_asset` return the shapes in §5 for the
  `tebin` theme, including inline SVG and base64 binary assets.
- Unknown id/format/assetId produce clean tool errors, not crashes.
- `pnpm validate && pnpm check && pnpm test` pass locally and in CI, including
  the new MCP handler tests.
- README documents how to register and run the server.
