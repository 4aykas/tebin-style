# Using tebin-style with AI agents

Two integration routes — a **skill** (natural-language workflow) and an **MCP
server** (read-only tools) — plus a zero-setup fallback for hosts that support
neither.

All routes need a local clone once:

```bash
git clone https://github.com/4aykas/tebin-style.git
cd tebin-style
pnpm install
pnpm build
```

Note the absolute path of the clone — you point your agent at it below
(`/abs/path/to/tebin-style`; on Windows use `C:/Users/you/tebin-style`).

## Claude Code

```bash
# Skill — copy into your skills dir (all projects, or .claude/skills in one)
cp -r skill/tebin-style ~/.claude/skills/tebin-style
# MCP server
claude mcp add tebin-style -- pnpm --dir /abs/path/to/tebin-style start:mcp
```

Then ask: *"use the TEBIN Classic theme in this project."* Verify the server
with `claude mcp list`.

## Codex

Add the MCP server to `~/.codex/config.toml`:

```toml
[mcp_servers.tebin-style]
command = "pnpm"
args = ["--dir", "/abs/path/to/tebin-style", "start:mcp"]
```

Place the skill at `~/.codex/skills/tebin-style` if your version auto-discovers
skills.

## Any other MCP client

Run `pnpm --dir /abs/path/to/tebin-style start:mcp` (stdio) and register it the
way your host expects. Works with any [MCP](https://modelcontextprotocol.io)
client.

### MCP tools (read-only)

| Tool | Input | Returns |
|------|-------|---------|
| `list_themes` | `{ industry?, mood?, query? }` | matching theme summaries |
| `get_theme` | `{ id, format? }` | tokens in `css` \| `tailwind` \| `dtcg` \| `ts` |
| `get_asset` | `{ id, assetId? }` | asset list, or one asset (SVG text / binary base64) |
| `list_rules` | `{ category?, severity?, tag?, query? }` | matching design rules |
| `get_rule` | `{ id }` | a single design rule |

`get_asset` also serves the generated PNGs, by ids of the form
`logo-full@1024` and `logo-full-white@1024-on-brand` — list a theme's assets
without an `assetId` to see them all.

## A host with no MCP (ChatGPT, Gemini, Claude on the web)

Paste the theme's `DESIGN.md` into the chat — for example
[tebin-classic/DESIGN.md](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/DESIGN.md).
It is generated to be self-contained: palette with RGB and print values, type,
assets, and the brand rules, with every link absolute, so the file keeps
working wherever it lands.
