<div align="center">

<img src="themes/tebin-classic/preview/logo-hero.svg" width="300" alt="TEBIN" />

# tebin-style

**Brand kits for AI coding agents and humans** — W3C **DTCG** design tokens,
downloadable logos (SVG **and** PNG), machine-readable usage rules, and a
self-contained design guide per theme.

</div>

---

## Download

No terminal needed — click a size, then the Download button on the page that opens.

| | PNG for documents | Vector | The whole design |
|---|---|---|---|
| **TEBIN Classic** logo | [512 px](themes/tebin-classic/assets/png/logo-full-512.png?raw=1) · [1024 px](themes/tebin-classic/assets/png/logo-full-1024.png?raw=1) · [2048 px](themes/tebin-classic/assets/png/logo-full-2048.png?raw=1) | [SVG](themes/tebin-classic/assets/logo/logo-full.svg?raw=1) | [DESIGN.md](themes/tebin-classic/DESIGN.md) |
| white, on red / charcoal | [on red](themes/tebin-classic/assets/png/logo-full-white-1024-on-brand.png?raw=1) · [on charcoal](themes/tebin-classic/assets/png/logo-full-white-1024-on-charcoal.png?raw=1) | [SVG](themes/tebin-classic/assets/logo/logo-full-white.svg?raw=1) | |
| corner mark | [128 px](themes/tebin-classic/assets/png/corner-mark-128.png?raw=1) · [256 px](themes/tebin-classic/assets/png/corner-mark-256.png?raw=1) · [512 px](themes/tebin-classic/assets/png/corner-mark-512.png?raw=1) | [SVG](themes/tebin-classic/assets/misc/corner-mark.svg?raw=1) | |

Colour table for Excel: [colors.csv](themes/tebin-classic/dist/colors.csv?raw=1).
Every size of every asset, including the TEBIN web theme:
[tebin-classic/DESIGN.md](themes/tebin-classic/DESIGN.md) · [tebin/DESIGN.md](themes/tebin/DESIGN.md).

## Palette

![TEBIN Classic palette](themes/tebin-classic/preview/palette.png)

| Colour | HEX | RGB (Word, Excel) | Pantone |
|---|---|---|---|
| Brand red | `#DA291C` | 218, 41, 28 | 485 C |
| Grey | `#898D8D` | 137, 141, 141 | 423 C |
| Ink | `#1A1A1A` | 26, 26, 26 | — |

Full palette with CMYK and the secondary colours:
[DESIGN.md](themes/tebin-classic/DESIGN.md) ·
[colors.csv](themes/tebin-classic/dist/colors.csv?raw=1).

### Logo usage

![TEBIN logo on white, red, black](themes/tebin-classic/preview/logo-backgrounds.svg)

- On dark or red backgrounds use the **all-white** logo; the two-color logo is for light backgrounds only.
- Keep clear space around the logo of at least the **height of the "B"**.
- Never distort, add shadows, or recolor it outside the palette (red / grey / white / black).
- The **corner mark** may stand alone — e.g. top-right of a photo or slide — to signal TEBIN authorship.

## Two ways in

**"I just need the logo and the colours"** →
[quick start](docs/guide/quick-start.md) ·
[Word, Excel, PowerPoint, Google Docs](docs/guide/office.md)

**"I am wiring up an agent or a codebase"** →
[Claude Code, Codex and any MCP client](docs/guide/ai-agents.md) ·
[developer guide](docs/guide/developers.md)

## Themes

Each theme has `tokens.json` (canonical DTCG), generated `dist/*` (CSS,
Tailwind, DTCG JSON, TypeScript, `colors.csv`), `assets/` (SVG + PNG), and a
generated `DESIGN.md`:

| id | name | industry | brand | design |
|----|------|----------|-------|--------|
| `tebin-classic` | TEBIN Classic | engineering, industrial | `#DA291C` | [DESIGN.md](themes/tebin-classic/DESIGN.md) |
| `tebin` | TEBIN | engineering, industrial | `#DA291C` | [DESIGN.md](themes/tebin/DESIGN.md) |
| `slate` | Slate | saas, web, general | `#2563EB` | [DESIGN.md](themes/slate/DESIGN.md) |

## Rules

A database of 61 design rules (`MUST` / `SHOULD` / `NEVER`): global
UI/UX/accessibility/typography rules plus TEBIN `brand` rules. Source
[`rules/rules.json`](./rules/rules.json), digest
[`rules/dist/rules.md`](./rules/dist/rules.md).

## License

Code and tokens: MIT (see [LICENSE](./LICENSE)). Brand assets carry their own
license per theme — © TEBIN, all rights reserved. Do not reuse a brand's logo
for a different brand.
