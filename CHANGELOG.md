# Changelog

## 1.0.0 — 2026-07-29

First published release. The npm name `tebin-style` was free (checked
2026-07-29), so the package publishes unscoped.

### Added
- PNG brand assets in three widths per logo and three per corner mark, with
  on-red and on-charcoal variants for the white logo. Coloured tiles carry
  clear space per the brand's B-height rule.
- A generated, self-contained `DESIGN.md` per theme — every link absolute, so it
  can be pasted into a chat or saved beside a document.
- `dist/colors.csv` per theme: HEX, RGB, Pantone, CMYK, purpose.
- Generated palette previews for all three themes.
- Pantone and CMYK values on `tebin-classic`, read from the 2017 brand book. Where
  the book prints no value, the cell says so rather than showing a conversion.
- Six `typography` rules, plus `performance-webfont-policy` and
  `theming-policy-enforced` (53 → 61).
- Four guides in `docs/guide/`, and a README that opens with a download rather
  than a clone.
- A release workflow that attaches `tebin-brand-pack.zip` to the GitHub Release
  and publishes to npm.

### Changed
- The README no longer documents installation, MCP tools or development; those
  moved into `docs/guide/`.
- `themes/tebin/README.md` now points at `DESIGN.md`; the no-webfont note lives in
  `themes/tebin/design.intro.md`.
- `registry/index.json` lists the generated PNGs as first-class assets
  (`logo-full@1024`), so the MCP `get_asset` tool serves them unchanged.
