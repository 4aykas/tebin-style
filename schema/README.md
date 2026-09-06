# Schema

Three JSON Schemas (2020-12) guard this repository.

## `theme.schema.json` — validates `theme.json`

- `id` (required): kebab-case, must equal the folder name.
- `name` (required), `version` (required, semver).
- `license` (required): `{ tokens, assets }`.
- `industry`, `mood`: string arrays used for discovery.
- `source`: `{ url, extractedBy: "manual" | "auto" }`.
- `assets[]`: `{ id, type, format, path, variant?, license? }`.
  `type` is one of `logo | favicon | font | icon | pattern | image`.
  Asset ids must be unique within the theme. `path` uses forward slashes under
  `assets/`, must name a file inside the theme, and must match `format`.
  An asset-specific `license` overrides the theme default and follows generated PNGs.

## `tokens.schema.json` — validates `tokens.json`

Nested groups of DTCG tokens. Every leaf has `$type` and `$value`.

`$type` is one of `color | fontFamily | dimension | shadow | fontWeight |
number | duration`.

A `$value` may be a literal or a reference to another token, written
`{color.brand}`. Style Dictionary resolves it at build time.

### Extensions

Two `$extensions` blocks are defined. Both are optional.

`pro.tebin.print` carries print values that come only from the 2017 brand book:

```json
"$extensions": { "pro.tebin.print": { "pantone": "485 C", "cmyk": "0/95/100/0" } }
```

CMYK is slash-separated because the book's own `0.95.100.0` reads as a decimal.
Each component must be between 0 and 100 inclusive.
Never convert a print value from RGB — where the book prints none, the
generated docs say so in words.

`pro.tebin.fluid` carries the real range of a fluid dimension, while `$value`
holds its ceiling:

```json
"$extensions": { "pro.tebin.fluid": { "min": "28px", "pref": "4.5vw", "max": "38px" } }
```

All three keys are required. `min` and `max` must be valid numeric dimensions
using the same unit (`px`, `rem` or `em`), with `min <= max`. The resolved
token value must equal `max`; only dimension tokens may carry this extension.
Only colour tokens may carry print extensions. Null token values are rejected.

## `rules.schema.json` — validates `rules/rules.json`

An array of rules. Each needs `id` (unique, kebab-case), `category`,
`severity` (`MUST` | `SHOULD` | `NEVER`) and `statement`. Optional:
`rationale`, `tags`, `source`, `themes`, `media`.

`themes` limits a rule to theme ids; `media` limits it to `web`, `document`
and/or `print`. Omitted scope fields mean unrestricted. Supplied arrays must
be nonempty and unique. `pnpm validate` checks theme ids against the repository.
The digest displays scope, and generated theme guides exclude other themes' rules.

## Beyond JSON Schema

`src/validate.ts` checks folder/id agreement, asset and rule id uniqueness,
file boundaries and fluid-range consistency. The CLI validates rule scopes
against the theme folders. Malformed theme JSON is reported as a validation
failure instead of crashing the directory scan.
