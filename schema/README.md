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
  `path` must exist on disk — `pnpm validate` checks it.

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
Never convert a print value from RGB — where the book prints none, the
generated docs say so in words.

`pro.tebin.fluid` carries the real range of a fluid dimension, while `$value`
holds its ceiling:

```json
"$extensions": { "pro.tebin.fluid": { "min": "28px", "pref": "4.5vw", "max": "38px" } }
```

All three keys are required. `min` and `max` must be `px`, `rem` or `em`.

## `rules.schema.json` — validates `rules/rules.json`

An array of rules. Each needs `id` (unique, kebab-case), `category`,
`severity` (`MUST` | `SHOULD` | `NEVER`) and `statement`. Optional:
`rationale`, `tags`, `source`.

## Beyond JSON Schema

`src/validate.ts` also checks that a theme's `id` equals its folder name, that
ids are unique across the registry, and that every asset path exists.
