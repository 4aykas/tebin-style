# Using tebin-style with AI agents

Two integration routes — a **skill** (natural-language workflow) and an **MCP
server** (read-only tools) — plus a zero-setup fallback for hosts that support
neither.

Choose the route for your application, not just the model name:

| Application | Route |
|---|---|
| ChatGPT, Gemini Apps, Claude web | [Attach a guide and assets](chat-setup.md); use the shared starter instructions |
| Gemini Gems | Save the same instructions and add the selected theme's files as knowledge |
| Claude Code | [Install the plugin](#claude-code): skill and MCP server, no clone |
| Codex, Cursor, Gemini CLI | Local MCP configuration below; the skill is optional |

The design files and MCP tools do not require a particular model provider.
The plugin and the local MCP route need **Node 22+**. The server is one
prebuilt file, `mcp/dist/server.mjs`: no install or build step.
The document-only route below needs no installation.

## Claude Code

Install the plugin. It brings the skill and the MCP server, with no clone:

```text
/plugin marketplace add 4aykas/tebin-style
/plugin install tebin-style@tebin
```

Then ask: *"use the TEBIN Classic theme in this project."* The skill starts on
its own, or run it as `/tebin-style:tebin-style`. Check the server with `/mcp`.
The plugin follows the repository's commits; run
`/plugin marketplace update tebin` to fetch the latest.

Without the plugin, register the [local MCP server](#local-mcp-server) from a clone:
`claude mcp add tebin-style -- node /abs/path/to/tebin-style/mcp/dist/server.mjs`.

## Skill for other agents

Install the skill for Codex, Cursor and other agents with the
[skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add 4aykas/tebin-style
```

## Local MCP server

The other clients run the server from a clone:

```bash
git clone https://github.com/4aykas/tebin-style.git
cd tebin-style
```

Note the absolute path of the clone — you point your agent at it below
(`/abs/path/to/tebin-style`; on Windows use `C:/Users/you/tebin-style`).

## Codex

Add the MCP server to `~/.codex/config.toml`:

```toml
[mcp_servers.tebin-style]
command = "node"
args = ["/abs/path/to/tebin-style/mcp/dist/server.mjs"]
```

Use forward slashes in Windows TOML paths, for example
`C:/Users/you/tebin-style/mcp/dist/server.mjs`. If the app cannot find Node, set
`command` to its full executable path.
See the [official MCP configuration guide](https://developers.openai.com/codex/mcp).

For the skill, see [Skill for other agents](#skill-for-other-agents), or simply
provide its instructions and the theme guide.

## Gemini CLI

Merge this entry into `mcpServers` in `~/.gemini/settings.json` (or the
project's `.gemini/settings.json`), preserving your existing settings:

```json
{
  "mcpServers": {
    "tebin-style": {
      "command": "node",
      "args": ["/abs/path/to/tebin-style/mcp/dist/server.mjs"]
    }
  }
}
```

Replace the path with the clone's absolute path; forward slashes also work
on Windows. Restart the client and check `/mcp list`, then try the first request
below. This uses Gemini CLI's documented
[stdio configuration](https://geminicli.com/docs/tools/mcp-server/).
It is not a configuration for the Gemini website.

## Any other MCP client

Register the same Node command and arguments shown above in your client's
stdio server configuration. For a manual startup check from the clone, run
`node mcp/dist/server.mjs`; it waits for protocol messages until you stop it. It does not
open a web page or start an HTTP server.

### MCP tools (read-only)

| Tool | Input | Returns |
|------|-------|---------|
| `list_themes` | `{ industry?, mood?, query? }` | matching theme summaries; assets come from `get_asset` |
| `get_theme` | `{ id, format? }` | tokens in `css` \| `tailwind` \| `dtcg` \| `ts` \| `design-md` \| `colors-csv` |
| `get_asset` | `{ id, assetId? }` | asset list with licence and size, or one asset (SVG text / native PNG image / link) |
| `list_rules` | `{ theme?, medium?, category?, severity?, tag?, query? }` | rules matching the theme, medium and other filters |
| `get_rule` | `{ id }` | a single design rule |
| `lint_theme` | `{ id }` | contrast failures and broken references, with the ratio and the surface used |
| `diff_themes` | `{ a, b }` | token diff by group, plus a regression flag |

`diff_themes` sets `regression` when a lint error appears or worsens, or a
measured pair loses its check (`findings.unchecked`).

`get_theme` includes licensing, declared surfaces and documented omissions.
Theme search also covers descriptions and tags, so `query: "print"` finds
Classic.

`design-md` returns the whole self-contained document, front matter included —
the same file a host with no MCP can be handed directly. `get_theme` sends a
short JSON metadata block, then the file itself as plain text.

Results are compact JSON. `list_themes`, `list_rules`, `get_rule`,
`lint_theme` and `diff_themes` also declare an `outputSchema` and return the
same object as `structuredContent`. An unknown theme id or category fails
with an error that names the valid values; each invalid argument gets its own
line.

`lint_theme` reports what it could **not** check as well as what failed. A
finding with no ratio means no pairing rule reached that role; treat it as
uncovered, not as a pass.

PNG ids look like `logo-full@1024` or `logo-full-white@1024-on-brand`. Files
over 200 KB and ICO come back as a `resource_link`.

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
Every link inside is absolute. A host still needs network access to fetch the
linked assets; for an offline session, attach them along with the guide or use
`llms.txt`, which includes the original vectors. No clone is needed for this route.
