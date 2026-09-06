# TeBin Style: critical audit, 6 September 2026

Baseline: `880e06d` on `main`, also confirmed on `origin/main` after fetching.
That commit already supplies `font.mono` and records the charcoal discrepancy.
This audit concerns the design repository, not a redesign or deployment of tebin.pro.

## Assessment

The foundation is useful: two distinct TEBIN styles, actual vector artwork,
semantic aliases, repeatable exports and a shared read-only access layer.
The main weaknesses were at the boundaries: exported files lost information,
some checks could falsely pass, and documentation promised more compatibility
or print readiness than the files delivered. Passing 274 baseline tests did
not establish those boundaries were correct.

Treat this as three connected layers:

| Layer | Requirement | Acceptance criterion |
|---|---|---|
| Design source | Modern and Classic remain distinct, with stable ids, provenance and actual artwork | A consumer can choose a style without borrowing undefined roles or redrawing a logo |
| Delivery and MCP | Local files and MCP expose the same versions, assets, licensing and supported formats | A real client can start from another directory, discover a style, retrieve its guide, CSV and image |
| Application guidance | People and agents can make web, document and print deliverables with clear limits | Guides explain font availability, contrast, physical image size and what requires a target-specific review |

## Defects corrected

| Priority | Finding | Resolution |
|---|---|---|
| High | DTCG export discarded print references, fluid ranges and descriptions | Preserve leaf metadata; regression tests cover both print and fluid values |
| High | Tailwind variables such as `--type-h1` did not generate `text-h1` | Add recognised namespaces, preserve old variables, test generated utilities with Tailwind itself |
| High | A ratio around 4.498 could round up to a passing 4.5 | Compare unrounded ratios for roles and component labels |
| High | Broken spacing/component references escaped lint; warning-only lint exited successfully | Walk reference values across the tree and fail the CLI on warnings |
| Medium | Theme comparisons missed type and extension changes | Compare canonicalised types, values and extensions, ignoring object key order |
| Medium | PNG freshness ignored tile colour and padding changes | Record render settings and check them; rebuild prunes only obsolete manifest-owned PNGs |
| Medium | Read paths accepted path-shaped theme ids and inherited format keys | Validate ids, own format keys and resolved asset boundaries |
| Medium | Type checking lacked Node declarations and excluded MCP | Add the dependency, include MCP, repair CommonJS typing and run in CI |
| Medium | MCP advertised version 0.1.0 and returned PNG as opaque JSON text | Read package version and return native image content with licence metadata |
| Medium | Registry discovery omitted design/CSV formats and descriptions | Expose both formats and search descriptions and tags |
| Medium | Print and Office instructions overpromised | Explain raster size, RGB versus print references, font substitution and Excel object anchoring |

Additional usability work: task-first public README, direct Node MCP launch,
one verification command, and a brand ZIP that includes all token formats and
the guides. No palette values, token ids, logo geometry or font choices were
changed by this audit.

## What the checks establish

The second pass also corrected a structural problem: the generated Slate guide
inherited TEBIN brand instructions, and Classic inherited Modern typography.
Rules now carry optional theme and medium scopes. Generated guides select the
theme; MCP callers can additionally select `web`, `document` or `print`.
Unscoped rules remain universal, and medium-specific rules are labelled in the
guides. This makes the distinction between brand identity and web implementation
explicit without changing existing token values.

Other second-pass corrections:

- Validate duplicate rule/asset ids, unknown rule themes, asset paths and formats,
  null token values, CMYK channel bounds, and fluid range/unit consistency.
  This remains a project schema, not a parser for every possible CSS value.
- Preserve an individual asset's licence in registry and MCP responses, including
  PNG derivatives; fall back to the theme licence only when no override exists.
- Update vulnerable dependencies: the local dependency audit changed from 32
  reported advisories to zero. This is a registry snapshot, not evidence that
  every old advisory was exploitable through the stdio server.
- Preserve multi-value dimensions when moving to Style Dictionary 5. A regression
  fixture catches the observed `14px 28px` to `14 28pxpx` conversion.
- Avoid rewriting an unchanged raster manifest, reducing unnecessary writes in
  synchronised folders. A Windows build had encountered a filesystem error on
  this file; the subsequent build and drift check completed successfully.
- Configure verification and brand packaging on both Windows and Ubuntu in CI.
  Local execution in this audit was on Windows; remote CI has not been run here.

Final local verification: **313 tests passed across 26 files**, with type checking,
schema validation, lint and generated-file drift checks also passing.

Verification covers schema/integrity, TypeScript, reference and supported
contrast checks, generated-file drift, documentation link targets, Tailwind
compilation, in-memory MCP calls and stdio startup from another directory.
PNG drift uses recorded inputs rather than comparing new raster bytes across
platforms. The ZIP command is also exercised locally on Windows.

A clean lint result is not a full accessibility certificate. Translucent
colours still require compositing on a known background; arbitrary component
states, keyboard behaviour and document layout require target-level checks.
`diff_themes.regression` retains its narrow meaning: the total contrast-error
count increased. It does not certify compatibility or catch every replacement
of one failure with a different failure.

## Next design work, in order

1. **Create one approved reference deliverable per medium.** A Classic letter
   or report, a presentation master, and a Modern form would establish layout,
   type hierarchy, tables, footers and real component states. Use those as
   evidence before inventing a large component-token catalogue.
2. **Separate recorded site choices from recommended defaults.** The newly
   recorded monospace labels are often 9–12 px, and font stacks do not ship the
   font files. Test readability and fallback behaviour in those reference
   deliverables before recommending the smallest sizes for new work.
   Track the existing [small-label issue #73](https://github.com/4aykas/tebin-style/issues/73)
   and [button-semantics issue #74](https://github.com/4aykas/tebin-style/issues/74):
   decide whether red denotes a commitment action or every primary action, then
   make the component examples and semantic roles agree.
3. **Resolve dark-surface semantics during the later website task.** The
   baseline records `color.charcoal` as unused on tebin.pro, while the binding
   dark surface is `#242830`. Decide whether the registry describes a reusable
   brand surface or mirrors the current site. Do not silently change consumers
   to make those two purposes appear identical.
   Continue this decision in [issue #72](https://github.com/4aykas/tebin-style/issues/72).
4. **Broaden conformance deliberately.** The token schema is a project-specific
   DTCG-style subset, not a guarantee of compatibility with every token importer.
   Add importer fixtures before migrating to another DTCG version. Print
   production similarly needs agreed profiles, proofs and delivery presets.

The first three items are design/product choices with visible outputs. An
extra MCP endpoint or a new framework would not resolve them on its own.

## Reference checks

- [W3C contrast threshold guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum): do not round a failing ratio up.
- [Tailwind theme namespaces](https://tailwindcss.com/docs/theme): utility generation depends on the namespace.
- [MCP tool annotations](https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/): read-only and closed-domain hints describe the tools' behaviour.
- [Codex MCP configuration](https://developers.openai.com/codex/mcp): command and argument configuration for local servers.
- [Style Dictionary 5 migration](https://styledictionary.com/versions/v5/migration/): runtime requirements and transformation changes.
- [Style Dictionary security advisory](https://github.com/style-dictionary/style-dictionary/security/advisories/GHSA-vj5c-m527-mpff) and [Vitest security advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-5xrq-8626-4rwp): reasons to update build/test dependencies.
