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
