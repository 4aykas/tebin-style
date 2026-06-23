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
