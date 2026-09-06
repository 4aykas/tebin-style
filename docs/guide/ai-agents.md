# Using tebin-style with AI agents

Two integration routes — a **skill** (natural-language workflow) and an **MCP
server** (read-only tools) — plus a zero-setup fallback for hosts that support
neither.

Choose the route for your application, not just the model name:

| Application | Route |
|---|---|
| ChatGPT, Gemini Apps, Claude web | [Attach a guide and assets](chat-setup.md); use the shared starter instructions |
| Gemini Gems | Save the same instructions and add the selected theme's files as knowledge |
| Claude Code, Codex, Gemini CLI | Local MCP configuration below; the skill is optional |

The design files and MCP tools do not require a particular model provider.
The local MCP route needs **Node 22+**, **pnpm 11** and a clone.
The document-only route below needs no installation.

For a local setup:

```bash
git clone https://github.com/4aykas/tebin-style.git
cd tebin-style
pnpm install --frozen-lockfile
pnpm build
```

Note the absolute path of the clone — you point your agent at it below
(`/abs/path/to/tebin-style`; on Windows use `C:/Users/you/tebin-style`).

## Claude Code

```bash
# Skill — copy into your skills dir (all projects, or .claude/skills in one)
cp -r skill/tebin-style ~/.claude/skills/tebin-style
# MCP server
claude mcp add tebin-style -- node /abs/path/to/tebin-style/node_modules/tsx/dist/cli.mjs /abs/path/to/tebin-style/mcp/server.ts
```

Then ask: *"use the TEBIN Classic theme in this project."* Verify the server
with `claude mcp list`.

## Codex

Add the MCP server to `~/.codex/config.toml`:

```toml
[mcp_servers.tebin-style]
command = "node"
args = ["/abs/path/to/tebin-style/node_modules/tsx/dist/cli.mjs", "/abs/path/to/tebin-style/mcp/server.ts"]
```

Use forward slashes in Windows TOML paths, for example
`C:/Users/you/tebin-style/mcp/server.ts`. If the app cannot find Node, set
`command` to its full executable path. This direct Node launch avoids package
manager shell wrappers and works independently of the client's working directory.
See the [official MCP configuration guide](https://developers.openai.com/codex/mcp).

The optional skill is in `skill/tebin-style`; install it in the skill directory
supported by your client, or simply provide its instructions and the theme guide.

## Gemini CLI

Merge this entry into `mcpServers` in `~/.gemini/settings.json` (or the
project's `.gemini/settings.json`), preserving your existing settings:

```json
{
  "mcpServers": {
    "tebin-style": {
      "command": "node",
      "args": ["/abs/path/to/tebin-style/node_modules/tsx/dist/cli.mjs", "/abs/path/to/tebin-style/mcp/server.ts"]
    }
  }
}
```

Replace both paths with the clone's absolute paths; forward slashes also work
on Windows. Restart the client and check `/mcp list`, then try the first request
below. This uses Gemini CLI's documented
[stdio configuration](https://geminicli.com/docs/tools/mcp-server/).
It is not a configuration for the Gemini website.

## Any other MCP client

Register the same Node command and arguments shown above in your client's
stdio server configuration. For a manual startup check from the clone, run
`pnpm start:mcp`; it waits for protocol messages until you stop it. It does not
open a web page or start an HTTP server.

### MCP tools (read-only)

| Tool | Input | Returns |
|------|-------|---------|
| `list_themes` | `{ industry?, mood?, query? }` | matching theme summaries |
| `get_theme` | `{ id, format? }` | tokens in `css` \| `tailwind` \| `dtcg` \| `ts` \| `design-md` \| `colors-csv` |
| `get_asset` | `{ id, assetId? }` | asset list with licence, or one asset (SVG text / native PNG image / other binary base64) |
| `list_rules` | `{ theme?, medium?, category?, severity?, tag?, query? }` | rules matching the theme, medium and other filters |
| `get_rule` | `{ id }` | a single design rule |
| `lint_theme` | `{ id }` | contrast failures and broken references, with the ratio and the surface used |
| `diff_themes` | `{ a, b }` | token diff by group, plus a regression flag |

All seven tools advertise read-only, local-data behaviour. `get_theme` includes
licensing, declared surfaces and documented omissions. Theme search also covers
descriptions and tags, so `query: "print"` finds Classic. `colors-csv` exposes
the spreadsheet palette without asking an agent to parse CSS.

`design-md` returns the whole self-contained document, front matter included —
the same file a host with no MCP can be handed directly.

`lint_theme` reports what it could **not** check as well as what failed. A
finding with no ratio means no pairing rule reached that role; treat it as
uncovered, not as a pass.

`get_asset` also serves the generated PNGs, by ids of the form
`logo-full@1024` and `logo-full-white@1024-on-brand` — list a theme's assets
without an `assetId` to see them all. PNG responses use an MCP image block;
its accompanying text has metadata and a download URL, not a second copy of
the base64 image. SVGs remain text for direct embedding.

### A useful first request

Fetch rules for the actual target, for example
`list_rules({ theme: "tebin-classic", medium: "document" })` or
`list_rules({ theme: "tebin", medium: "web", category: "forms" })`.
Without scope filters the tool returns the full catalogue, including policies
that belong to a different theme or medium. Scoped results still need judgement:
some rules describe project policy rather than an accessibility standard.

> Use TEBIN Classic for this document. Read its design guide, use the supplied
> logo, and use Arial for the document text. Deliver the document with its assets.

An agent can start with `get_theme({ id: "tebin-classic", format: "design-md" })`,
then list assets with `get_asset({ id: "tebin-classic" })`. Modern website/app
work uses `id: "tebin"`. Reading a kit does not itself create or validate a
finished document or interface.

## ChatGPT, Gemini and Claude chats without a local MCP connection

Follow the [chat setup guide](chat-setup.md) for the exact files, reusable
instructions and acceptance checks. A local stdio command is not a hosted MCP
URL. This repository currently ships the local server only; ChatGPT's remote
integration requires a separately reachable server and the applicable account
features. See [OpenAI's connection guide](https://developers.openai.com/plugins/deploy/connect-chatgpt).

Paste the theme's `DESIGN.md` into the chat — for example
[tebin-classic/DESIGN.md](https://github.com/4aykas/tebin-style/blob/main/themes/tebin-classic/DESIGN.md).
It is generated to be self-contained: palette with RGB and print values,
semantic roles, the type and spacing scales, assets, and the brand rules.
Every link inside is absolute. A host still needs network access to fetch the
linked assets; for an offline session, attach them along with the guide or use
`llms.txt`, which includes the original vectors. No clone is needed for this route.
