# tebin-style

A registry of reusable **themes (brand kits)** for AI coding agents and humans:
W3C **DTCG** design tokens, brand assets (logos, favicons), and metadata. Point
an agent at a theme and it applies the tokens — in CSS, Tailwind, DTCG JSON, or
TypeScript — and places the assets.

`tebin-style` plugs into an AI coding agent in two ways, and you can use either
or both:

- **The skill** — natural-language workflow. You say "theme this project like
  TEBIN" and the agent discovers, inspects, and applies a theme. It reads the
  registry files directly (or via the MCP server if registered).
- **The MCP server** — read-only tools (`list_themes`, `get_theme`,
  `get_asset`, `list_rules`, `get_rule`) the agent can call to fetch tokens,
  assets, and design rules as structured data.

## Install

The skill and the MCP server both read **generated** files (`dist/*`,
`registry/index.json`, `rules/dist/*`), so you must clone and build once.

Prerequisites: **Node ≥ 18** and **pnpm**.

```bash
git clone https://github.com/4aykas/tebin-style.git
cd tebin-style
pnpm install
pnpm build      # generates dist/*, registry/index.json, rules/dist/*
```

Note the absolute path of the clone — you'll point your agent at it below.
(Replace `/abs/path/to/tebin-style` in the snippets with that path. On Windows
use a path like `C:/Users/you/tebin-style`.)

## Use with Claude Code

**Skill.** Copy (or symlink) the skill folder into your skills directory —
`~/.claude/skills/` for all projects, or `.claude/skills/` inside one project:

```bash
cp -r skill/tebin-style ~/.claude/skills/tebin-style
```

Restart Claude Code, then just ask: *"use the TEBIN theme in this project"* or
*"give me an industrial palette"*. The skill activates on those triggers.

**MCP server.** Register the stdio server with the CLI:

```bash
claude mcp add tebin-style -- pnpm --dir /abs/path/to/tebin-style start:mcp
```

…or add it to a project's `.mcp.json` by hand:

```jsonc
{ "mcpServers": {
  "tebin-style": { "command": "pnpm", "args": ["--dir", "/abs/path/to/tebin-style", "start:mcp"] }
} }
```

Verify with `claude mcp list`. The tools then appear as
`mcp__tebin-style__list_themes`, etc.

## Use with Codex

**MCP server.** Add the server to `~/.codex/config.toml`:

```toml
[mcp_servers.tebin-style]
command = "pnpm"
args = ["--dir", "/abs/path/to/tebin-style", "start:mcp"]
```

**Skill.** Codex loads skills natively from its skills directory; place the
folder there:

```bash
cp -r skill/tebin-style ~/.codex/skills/tebin-style
```

If your Codex version doesn't auto-discover skills, you can still get the same
behavior from the MCP tools alone, or point Codex at
[`skill/tebin-style/SKILL.md`](./skill/tebin-style/SKILL.md) for the
discover → inspect → apply workflow.

## Use with any other MCP client

The server speaks MCP over stdio. Run `pnpm --dir /abs/path/to/tebin-style
start:mcp` and register it the way your client expects (command + args, as
above). It works with any [MCP](https://modelcontextprotocol.io)-capable host.

## MCP tools

| Tool | Input | Returns |
|------|-------|---------|
| `list_themes` | `{ industry?, mood?, query? }` | matching theme summaries |
| `get_theme` | `{ id, format? }` | tokens in `css` \| `tailwind` \| `dtcg` \| `ts` (default `css`) |
| `get_asset` | `{ id, assetId? }` | asset list, or one asset (SVG as text, binary as base64) |
| `list_rules` | `{ category?, severity?, tag?, query? }` | matching design rules |
| `get_rule` | `{ id }` | a single design rule |

All tools are read-only — they never modify the registry or your project.

## The skill workflow

The [`tebin-style` skill](./skill/tebin-style/SKILL.md) reads
[`registry/index.json`](./registry/index.json), then:

1. **Discover** — list/filter themes by `industry`, `mood`, or name.
2. **Inspect** — read the theme's `README.md` / `theme.json`, check licenses.
3. **Detect target** — pick the output format for the project's stack
   (Tailwind v4, plain CSS, `theme.ts`, or DTCG JSON).
4. **Apply** — paste tokens into the target and copy/link the assets.
5. **Verify** — report theme, version, files added, and license caveats.

See the skill for the full details.

## Design rules

`tebin-style` includes a global, theme-independent database of UI/UX/accessibility
rules (MUST/SHOULD/NEVER), seeded from a generalized engineering rulebook.

- Source: [`rules/rules.json`](./rules/rules.json) (canonical).
- Digest: [`rules/dist/rules.md`](./rules/dist/rules.md) (generated).
- MCP tools: `list_rules({ category?, severity?, tag?, query? })` and `get_rule({ id })`.

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
| slate | Slate | saas, web, general | `#2563EB` |

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
