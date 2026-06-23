# tebin-style Phase 3 — Design Rules Database (Design)

Status: Approved design (Phase 3)
Date: 2026-06-23
Author: brainstormed with Claude
Builds on: Phase 1 (`2026-06-22-tebin-style-design.md`), Phase 2 (`2026-06-23-tebin-style-mcp-design.md`)

## 1. Summary

Phase 3 adds a **global design-rules database** to `tebin-style`: a curated set
of UI/UX/accessibility guidelines (MUST/SHOULD/NEVER), seeded from the
`tebin/AGENTS.md` rulebook and generalized. Rules are stored as structured JSON
(filterable), rendered to a human markdown digest, validated and drift-checked
like themes, and exposed through the existing skill and MCP server with two new
tools (`list_rules`, `get_rule`).

Rules are **theme-independent**: they describe how to build good UI regardless
of palette, so they form a top-level `rules/` dataset, not a per-theme field.

## 2. Goals and Non-Goals

### Goals
- Canonical `rules/rules.json` (hand-edited) + generated `rules/dist/rules.md`.
- JSON Schema validation + uniqueness, integrated into `pnpm validate`.
- Markdown digest generation, integrated into `pnpm build`.
- Drift detection for the digest, integrated into `pnpm check`.
- A `src/rules.ts` read layer (load/get/filter).
- Two new MCP tools: `list_rules`, `get_rule`.
- Skill update so agents fetch relevant rules when building/reviewing UI.
- Seed from `tebin/AGENTS.md` — a curated representative set across categories.

### Non-Goals
- No per-theme rules; rules are global.
- No rule "auto-enforcement"/linting — this is a knowledge source, not a linter.
- No new transport or hosting (reuses the Phase 2 stdio MCP server).
- Not a verbatim copy of every AGENTS.md line; a curated, expandable subset.

## 3. Data Model

A **rule** object:

```jsonc
{
  "id": "forms-loading-button",     // kebab-case, unique across the dataset
  "category": "forms",              // grouping key (recommended set below)
  "severity": "MUST",              // MUST | SHOULD | NEVER
  "statement": "Loading buttons show a spinner and keep their original label.",
  "rationale": "Avoids layout shift and keeps the action legible while pending.",
  "tags": ["button", "loading", "feedback"],
  "source": "tebin AGENTS.md"
}
```

- `severity`: fixed enum `MUST | SHOULD | NEVER`.
- `category`: string from a documented recommended set — `interactions`,
  `forms`, `navigation`, `feedback`, `touch`, `animation`, `layout`, `content`,
  `accessibility`, `performance`, `theming`.
- Required: `id`, `category`, `severity`, `statement`. Optional: `rationale`,
  `tags`, `source`.

`rules/rules.json` is a JSON array of these objects and is the only hand-edited
rules source. `rules/dist/rules.md` is always generated.

## 4. Storage Layout

```
tebin-style/
├─ rules/
│  ├─ rules.json          # canonical source (array of rules)
│  └─ dist/
│     └─ rules.md         # GENERATED digest, grouped by category
├─ schema/rules.schema.json   # NEW JSON Schema
├─ src/rules.ts               # NEW read layer
└─ src/rules-build.ts         # NEW pure markdown generator
```

## 5. Read Layer — `src/rules.ts`

- `type Severity = 'MUST' | 'SHOULD' | 'NEVER'`
- `interface Rule { id: string; category: string; severity: Severity; statement: string; rationale?: string; tags?: string[]; source?: string }`
- `loadRules(): Rule[]` — parse `rules/rules.json` (throws `NotFoundError` if missing).
- `getRule(id: string): Rule` — throws the existing `NotFoundError` (reused from `src/registry.ts`) for an unknown id.
- `filterRules(input: { category?: string; severity?: string; tag?: string; query?: string }): Rule[]`
  — case-insensitive; `category`/`severity` exact match; `tag` membership;
  `query` substring over `id` and `statement`.

## 6. Generation — `src/rules-build.ts` + `scripts/build-rules.ts`

- `buildRulesMarkdown(rules: Rule[]): string` (pure) — groups rules by category
  (stable order), and renders each as a list item:
  `**[MUST]** <statement> — _<rationale>_` (rationale omitted when absent).
  Includes a title and a per-category `##` heading.
- `scripts/build-rules.ts` — writes `rules/dist/rules.md`.
- Wired into the `build` script:
  `tsx scripts/build.ts && tsx scripts/build-index.ts && tsx scripts/build-rules.ts`.

## 7. Validation — extend `scripts/validate.ts`

- New `schema/rules.schema.json` (JSON Schema 2020-12): array; each item
  requires `id`, `category`, `severity` (enum), `statement`; optional
  `rationale`, `tags` (string array), `source`.
- A `validateRules()` pass: schema-validate `rules/rules.json` and check
  `id` uniqueness. The CLI prints `✓ rules` (or lists errors and exits 1)
  alongside the existing per-theme output.

## 8. Drift — extend `scripts/check.ts`

- `diffRules()` — regenerate `rules.md` from `rules.json` into a temp buffer and
  compare to the committed `rules/dist/rules.md`. Prints `✓ rules.md` or fails
  with a message to run `pnpm build`. Mirrors the existing theme/index drift
  checks.

## 9. MCP Tools — extend `mcp/tools.ts`

Two tools added to the existing `toolDefinitions` (3 → 5), backed by
`src/rules.ts`:

- `list_rules` — input `{ category?, severity?, tag?, query? }` (all optional);
  output `{ count: number; rules: Rule[] }` via `filterRules`.
- `get_rule` — input `{ id: string }`; output a single `Rule`; unknown id →
  `NotFoundError` → mapped to an MCP tool error (`isError: true`) by the server
  wrapper (no server changes needed; the loop already wraps every tool).

## 10. Skill Update — `skill/tebin-style/SKILL.md`

- Add a "Design rules" section: when building or reviewing UI, fetch relevant
  guidance via `list_rules` (filter by `category`/`severity`/`tag`) or read
  `rules/dist/rules.md`; cite `MUST`/`NEVER` rules when reviewing.
- Widen the frontmatter `description` triggers to include design rules / UI
  guidelines / accessibility rules, so the skill activates for guidance
  requests, not only theme application.

## 11. Seed Content

Transcribe and generalize `tebin/AGENTS.md` MUST/SHOULD/NEVER guidance into rule
objects spanning the recommended categories (interactions, forms, navigation,
feedback, touch, animation, layout, content, accessibility, performance,
theming). The seed is a curated, representative set (not every line verbatim),
expandable later per `CONTRIBUTING.md`. Each seeded rule sets
`source: "tebin AGENTS.md"`.

## 12. Testing

- `test/rules.test.ts`: `loadRules` returns the seeded rules; `getRule` unknown
  id throws `NotFoundError`; `filterRules` works by category, severity, tag, and
  query; `buildRulesMarkdown` output contains a `**[MUST]**` line and a category
  heading.
- Extend `test/mcp.test.ts`: `list_rules` filters; `get_rule` returns a known
  rule and throws on unknown.
- **Update existing assertions:** `test/mcp.test.ts` and `test/server.test.ts`
  currently assert `toolDefinitions` equals the three theme tools — update both
  to expect the five tool names in the same change so the suite stays green.
- All run under `pnpm test` / CI.

## 13. Documentation

- `README.md`: add a "Design rules" subsection (what the dataset is, the two MCP
  tools, where the digest lives).
- `CONTRIBUTING.md`: note how to add a rule (edit `rules.json`, run
  `validate`/`build`, commit the regenerated digest).

## 14. Acceptance Criteria

- `rules/rules.json` validates; `rules/dist/rules.md` is generated and
  drift-free.
- `pnpm validate && pnpm check && pnpm test` pass locally and in CI, including
  the new rules tests and the updated tool-count assertions.
- The MCP server exposes five tools; `list_rules`/`get_rule` return the shapes
  in §9, and unknown ids produce clean tool errors.
- The skill activates for UI-guidance requests and can surface relevant rules.
- README and CONTRIBUTING document the rules dataset.
