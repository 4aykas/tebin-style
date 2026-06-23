# Licensing

Each theme's `theme.json` has a `license` object:

- `license.tokens` — license for the design tokens (usually `MIT`).
- `license.assets` — license for logos/images. May be restricted (e.g.
  "© TEBIN — all rights reserved").

Rules:

- Tokens (colors, type scale, spacing) are safe to reuse when `license.tokens`
  permits it.
- **Do not** reuse a brand's logo or restricted assets for a *different* brand.
  Copy them only when the user owns that brand or the asset license allows it.
- When in doubt, apply the tokens and link the assets instead of copying them,
  and tell the user the license terms.
