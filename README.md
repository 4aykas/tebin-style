<div align="center">
<img src="themes/tebin-classic/preview/logo-hero.svg" width="300" alt="TEBIN" />

# tebin-style

**The TEBIN design library for websites, apps, documents and print.**

Choose a style, download the real brand assets, or connect an AI agent to the same source.
</div>

## Choose your style

| Style | Best starting point for | Design guide |
|---|---|---|
| **TEBIN Modern** · `tebin` | Websites and apps: signal red, charcoal, sans, condensed and monospace type | [Open the guide](themes/tebin/DESIGN.md) |
| **TEBIN Classic** · `tebin-classic` | Corporate documents, presentations and print, based on the 2017 brand book | [Open the guide](themes/tebin-classic/DESIGN.md) |

These are two supported styles, not an old version and its replacement. Modern's
machine id stays `tebin`. Choose one for a deliverable; keep its colours, type
and rules together. [Slate](themes/slate/DESIGN.md) (`slate`) is an optional,
unbranded starter with tokens only.

## Get the logo

No installation required. Open a PNG link and save the image, or download the
SVG for a vector workflow. Use the supplied artwork: **never type or redraw the wordmark**.

| Asset | PNG download | SVG source |
|---|---|---|
| **Classic** full logo | [512 px](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin-classic/assets/png/logo-full-512.png) · [1024 px](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin-classic/assets/png/logo-full-1024.png) · [2048 px](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin-classic/assets/png/logo-full-2048.png) | [Vector](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin-classic/assets/logo/logo-full.svg) |
| **Modern** full logo | [512 px](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin/assets/png/logo-full-512.png) · [1024 px](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin/assets/png/logo-full-1024.png) · [2048 px](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin/assets/png/logo-full-2048.png) | [Vector](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin/assets/logo/logo-full.svg) |
| Classic white logo | [On red](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin-classic/assets/png/logo-full-white-1024-on-brand.png) · [On charcoal](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin-classic/assets/png/logo-full-white-1024-on-charcoal.png) | [White vector](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin-classic/assets/logo/logo-full-white.svg) |
| Classic corner mark | [128 px](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin-classic/assets/png/corner-mark-128.png) · [256 px](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin-classic/assets/png/corner-mark-256.png) · [512 px](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin-classic/assets/png/corner-mark-512.png) | [Vector](https://raw.githubusercontent.com/4aykas/tebin-style/main/themes/tebin-classic/assets/misc/corner-mark.svg) |

Use 512 px for small screen placements and 1024 px for documents or slides.
For print, prefer vector artwork and size raster images to the final physical
dimensions: 2048 px is about **173 mm wide at 300 ppi**, not a universal print size.
See the [print handoff guide](docs/guide/print.md).

White **PNGs** include a red or charcoal background and clear space. White
**SVGs** are transparent, for placement on a matching dark background.
Each style's design guide lists all available assets and sizes.

## Start with your task

| I want to… | Start here |
|---|---|
| Get a logo and the right colours | [Quick start](docs/guide/quick-start.md) |
| Make a document, spreadsheet or presentation | [Office guide](docs/guide/office.md) |
| Prepare artwork for a printer | [Print guide](docs/guide/print.md) |
| Build with an AI agent or connect MCP | [Agent and MCP guide](docs/guide/ai-agents.md) |
| Use ChatGPT, Gemini or Claude chat | [Files and ready-to-copy instructions](docs/guide/chat-setup.md) |
| Import CSS, Tailwind or TypeScript tokens | [Developer guide](docs/guide/developers.md) |

## Colours and brand essentials

![TEBIN Classic palette](themes/tebin-classic/preview/palette.png)

| Classic colour | HEX | RGB for Office | Print reference |
|---|---|---|---|
| Brand red | `#DA291C` | 218, 41, 28 | Pantone 485 C |
| Brand grey | `#898D8D` | 137, 141, 141 | Pantone 423 C |
| Ink | `#1A1A1A` | 26, 26, 26 | See the design guide |

Download the [Classic palette as CSV](themes/tebin-classic/dist/colors.csv)
or the [Modern palette as CSV](themes/tebin/dist/colors.csv).

Text colour depends on its background. Brand red is about **4.87:1 on white**,
but only **4.19:1 on Modern's cream `#EFEEE9`**. Modern provides
`primary-on-light` and `primary-on-dark` roles for small red text. Classic uses
its own roles on white. The design guides explain the pairings;
the theme checker reports untested combinations as well as failures.

![Logo backgrounds](themes/tebin-classic/preview/logo-backgrounds.svg)

- Use the two-colour logo on light backgrounds and the all-white logo on dark or red backgrounds.
- Keep clear space of at least the height of the **B** on all sides.
- Preserve proportions and approved colours; do not add shadows or effects.
- Use the corner mark on its own when a small authorship mark is appropriate.

## What is in this repository?

**Design source:** each theme has editable tokens, asset metadata and an
introduction. A build produces CSS, Tailwind v4, TypeScript, DTCG-style JSON,
colour CSV, PNGs and a self-contained `DESIGN.md`.

**Agent access:** a local, read-only MCP server exposes seven tools for theme
discovery, formats, assets, rules, contrast checks and comparisons. The same
files work without MCP; hand an agent `DESIGN.md` and the assets it needs.
Rules can be filtered by style and medium, so website policies do not become
instructions for Classic documents or another brand.

**Application guidance:** the [design rules](rules/dist/rules.md), guides and
reusable [agent skill](skill/tebin-style/SKILL.md) describe how to apply the
styles. This is a brand library with selected component tokens, not a complete
UI component library or a set of finished Word/PowerPoint templates.

For machines: [registry/index.json](registry/index.json) · [llms.txt](llms.txt).
For contributors: [CONTRIBUTING.md](CONTRIBUTING.md).
Raw links above track `main`; pin a commit in automation when you need reproducible files.

## Licence

Code and tokens: MIT — see [LICENSE](LICENSE). TEBIN brand assets: © TEBIN,
all rights reserved. Public access does not make the logos available for other brands.
