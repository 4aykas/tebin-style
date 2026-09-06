# TEBIN in ChatGPT, Gemini and Claude

Use the same source files in each chat. No Claude skill installation or local
server is needed for this route. Model output still needs inspection: reading a
guide does not guarantee a correct document, image or interface.

## Prepare one style

Download the files from one row. Save the guide and attach it to the chat; if
Markdown upload is unavailable, paste its contents or save the text as `.txt`.
Attach the actual logo image separately so the model can place the original.

| Style | Guide | Logo for a light background | Palette |
|---|---|---|---|
| Modern (`tebin`) | [DESIGN.md](../../themes/tebin/DESIGN.md) | [PNG](../../themes/tebin/assets/png/logo-full-1024.png) | [CSV](../../themes/tebin/dist/colors.csv) |
| Classic (`tebin-classic`) | [DESIGN.md](../../themes/tebin-classic/DESIGN.md) | [PNG](../../themes/tebin-classic/assets/png/logo-full-1024.png) | [CSV](../../themes/tebin-classic/dist/colors.csv) |

The guide is required; the CSV is useful for spreadsheets and exact colour
entry. For web development, also supply the selected theme's CSS or Tailwind
export. For print, use the original SVG and the [print guide](print.md).
For a dark background, select the approved white asset listed in DESIGN.md.

Extract a downloaded brand ZIP first and attach only the relevant files.
A link in a message does not establish that the assistant fetched its contents.
Use attachments when browsing is unavailable. Keep all files from the same
commit or release; replace saved knowledge files when upgrading the kit.

## Shared starter instructions

Copy this text into a chat. It can also be saved in an available persistent
instruction field, such as a Gemini Gem, with the guide added as knowledge.
[Google documents Gems' reusable instructions and file support](https://gemini.google/overview/gems/).

```text
Use the attached TEBIN design guide as the source for this deliverable.
Style: [Modern / tebin OR Classic / tebin-classic].
Medium: [web, document, or print].
Deliverable: [what to create, audience, dimensions or file format].

Start by identifying the guide and assets you can actually read. Use only
this style's colours, typography and applicable rules; do not mix the styles.
Apply web-only rules only to web work. If a required source is unavailable,
name the missing file instead of guessing its contents.

Place the supplied logo unchanged as an asset, preserving its proportions
and clear space. Never typeset, redraw or generate a replacement wordmark.
If the original cannot be embedded, report that limitation explicitly.

Use fonts available in the output environment and disclose substitutions.
Check text against its actual background, including interactive states for
web work. Do not describe an unchecked combination as accessible.
Follow explicit task requirements; flag any conflict with the brand guide.

Produce the requested artifact when your tools support it. Inspect the
rendered result if possible. State which checks you actually performed and
which need human review; do not claim to have rendered or tested it otherwise.
```

For a Classic document, specify Arial when Office portability is required.
For Modern code, request imports from the supplied tokens and actual logo files.
Image generation alone is not a reliable way to reproduce exact brand artwork;
place the original logo during composition.

## Check the setup with a real task

Use the same task in each application: a one-page Classic project summary with
a title, short introduction, three-row table and the supplied logo. Check:

- The output uses the selected guide and the original logo, without distortion.
- Colours match the CSV and text remains readable on its actual background.
- Fonts are available or substitutions are disclosed; the table fits the page.
- The requested file opens correctly, and the assistant reports actual checks.

Repeat with a Modern form when web output matters, including focus, error and
disabled states. Compare the results, not just whether the assistant says it
understands TEBIN. This repository's automated tests cover the data and MCP
protocol; they do not certify outputs from every model or account.

For live tool access in Claude Code, Codex or Gemini CLI, use the
[MCP setup guide](ai-agents.md). Ordinary chat attachment setup does not install
an MCP server or grant access to local files.
