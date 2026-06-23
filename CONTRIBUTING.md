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
