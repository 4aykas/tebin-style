# Contributing a theme

1. Create `themes/<id>/` where `<id>` is kebab-case and unique.
2. Add `tokens.json` in DTCG format (`$type` / `$value`). Start from an existing
   theme's `tokens.json` for structure. A `$value` may reference another token
   as `{color.brand}`; see [`schema/README.md`](./schema/README.md) for the two
   `$extensions` blocks, print values and fluid ranges.
3. Add `theme.json` with `id` (== folder name), `name`, `version` (semver),
   `license`, and an `assets` manifest. Validate against
   `schema/theme.schema.json`.
   In `theme.json` also set `surfaces` and the `contrastPairs` the lint
   measures. Record any check the lint cannot make in `omitted`, with the
   reason.
4. Put brand files under `assets/` and list each in `theme.json.assets`.
   Only contribute assets you have the rights to. Set `license.assets` honestly.
5. Write `design.intro.md`: the opening of the generated `DESIGN.md`, in the
   theme's own words. Add a short `README.md` for the theme folder.
6. A brand theme adds `sources.json`: every token's value and where it came
   from. `pnpm lint:themes` fails on a token without an entry.
7. A theme with a light and a dark look puts the second look under
   `mode.<name>` in `tokens.json`. See "Modes" in
   [`docs/guide/developers.md`](./docs/guide/developers.md).
8. Rules that apply to this theme alone go in `rules/rules.json` with
   `"themes": ["<id>"]`.
9. Name the theme in three lists: a row in the README table, a bullet in
   `llms.txt` (and its theme count), and the theme choice in
   `skills/tebin-style/SKILL.md`. Tests check the first two.
10. Run:
    ```bash
    pnpm build && pnpm verify
    ```
    A running MCP server keeps the theme list it started with. Restart it
    (`/mcp` in Claude Code) to call the tools on the new theme.
11. Commit the source files **and** every generated output (`dist/`,
    `DESIGN.md`, `assets/png/`, `preview/`, `registry/index.json`). Open a pull
    request on [git.tebin.co/tebin-oss/tebin-style](https://git.tebin.co/tebin-oss/tebin-style);
    GitHub is a mirror. CI runs `pnpm verify` on the committed outputs before a rebuild can hide drift.

The theme is complete when every step above has its file and `pnpm verify`
passes.

Do not hand-edit generated files. [`AGENTS.md`](./AGENTS.md#generated-files)
lists them all.

## Contributing a design rule

1. Add an object to `rules/rules.json` with a unique kebab-case `id`, a
   `category`, a `severity` (`MUST` | `SHOULD` | `NEVER`), and a `statement`
   (optional `rationale`, `tags`, `source`).
2. Run `pnpm build && pnpm verify`.
3. Commit `rules/rules.json` and the regenerated `rules/dist/rules.md`.
