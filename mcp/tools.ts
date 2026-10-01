import { z } from 'zod';
import type { CallToolResult, TextContent, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ThemeEntry } from '../src/index-builder.js';
import {
  loadIndex, loadThemeManifest, readFormat, readAssetFile, assetFormat, FORMAT_FILES, NotFoundError,
  type Format,
} from '../src/registry.js';
import { loadRules, filterRules, getRule as getRuleById, type Rule, type RuleFilters } from '../src/rules.js';
import { lintTheme, type LintResult } from '../src/lint.js';
import { diffThemes, type DiffResult } from '../src/diff.js';
import { join } from 'node:path';
import { REPO_ROOT } from '../src/registry.js';

const FORMATS = Object.keys(FORMAT_FILES) as Format[];

/** Theme summaries only: asset lists stay with get_asset, which keeps this response small. */
export function listThemes(input: { industry?: string; mood?: string; query?: string }): {
  count: number; themes: Array<Omit<ThemeEntry, 'assets'>>; hint?: string;
} {
  const { industry, mood, query } = input;
  const all = loadIndex().themes;
  let themes = all;
  if (industry) themes = themes.filter((t) => t.industry.some((v) => v.toLowerCase() === industry.toLowerCase()));
  if (mood) themes = themes.filter((t) => t.mood.some((v) => v.toLowerCase() === mood.toLowerCase()));
  if (query) {
    const q = query.trim().toLowerCase();
    themes = themes.filter((t) => [t.id, t.name, t.description ?? '', ...t.industry, ...t.mood]
      .some((value) => value.toLowerCase().includes(q)));
  }
  return {
    count: themes.length, themes: themes.map(({ assets: _assets, ...summary }) => summary),
    ...(themes.length ? {} : { hint: `No theme matches these filters; themes: ${all.map((t) => t.id).join(', ')}.` }),
  };
}

export function getTheme(input: { id: string; format?: Format }) {
  const format: Format = input.format ?? 'css';
  if (!Object.hasOwn(FORMAT_FILES, format)) throw new NotFoundError(`unknown format "${format}"`);
  const manifest = loadThemeManifest(input.id); // throws NotFoundError for unknown id
  const { filename, content } = readFormat(input.id, format);
  return {
    id: manifest.id, name: manifest.name, version: manifest.version,
    format, filename, license: manifest.license, description: manifest.description,
    surfaces: manifest.surfaces, omitted: manifest.omitted ?? [], content,
    contrastPairs: manifest.contrastPairs ?? {},
  };
}

/** Largest asset, in raw bytes, that get_asset returns inline; larger ones come back as a link. */
export const MAX_INLINE_BYTES = 200_000;
/** Formats a model can read inline: SVG as text, PNG as an image block. Others come back as a link. */
const INLINE_FORMATS = new Set(['svg', 'png']);

export function getAsset(input: { id: string; assetId?: string }) {
  const entry = loadIndex().themes.find((t) => t.id === input.id);
  if (!entry) throw new NotFoundError(`theme "${input.id}" not found`);

  if (!input.assetId) {
    return { id: entry.id, license: loadThemeManifest(input.id).license.assets, assets: entry.assets };
  }

  const asset = entry.assets.find((a) => a.id === input.assetId);
  if (!asset) {
    const ids = entry.assets.map((a) => a.id).join(', ') || 'none';
    throw new NotFoundError(`asset "${input.assetId}" not found in theme "${input.id}"; assets: ${ids}`);
  }

  const format = assetFormat(asset.path);
  const readable = INLINE_FORMATS.has(format);
  const file = readable && asset.bytes <= MAX_INLINE_BYTES ? readAssetFile(asset.path) : undefined;
  return {
    id: entry.id, assetId: asset.id, type: asset.type,
    format, path: asset.path, rawUrl: asset.rawUrl, bytes: asset.bytes,
    license: asset.license ?? loadThemeManifest(input.id).license.assets,
    encoding: file?.encoding, content: file?.content,
    note: file ? undefined
      : `${readable ? `Larger than ${MAX_INLINE_BYTES} bytes` : `${format.toUpperCase()} is not sent inline`}; download it from rawUrl.`,
  };
}

export function listRules(input: RuleFilters): {
  count: number; rules: Rule[]; hint?: string;
} {
  if (input.theme) loadThemeManifest(input.theme);
  const rules = filterRules(input);
  return {
    count: rules.length, rules,
    ...(rules.length ? {} : { hint: 'No rule matches these filters; drop tag or query, or list by theme and medium to see the tags in use.' }),
  };
}

export function getRuleTool(input: { id: string }): Rule {
  return getRuleById(input.id);
}

/** Resolves a theme id to its directory, refusing an unknown id by name. */
function themeDir(id: string): string {
  loadThemeManifest(id); // throws NotFoundError
  return join(REPO_ROOT, 'themes', id);
}

export function lintThemeTool(input: { id: string }): LintResult {
  return lintTheme(themeDir(input.id));
}

export function diffThemesTool(input: { a: string; b: string }): DiffResult {
  return diffThemes(themeDir(input.a), themeDir(input.b));
}

/**
 * The values a parameter accepts, read from the data at startup so the schema
 * cannot drift from the files. z.enum needs one value at least; with none, any string.
 */
function oneOf(values: string[]) {
  const [first, ...rest] = [...new Set(values)].sort();
  return first === undefined ? z.string() : z.enum([first, ...rest]);
}

const themes = loadIndex().themes;
const themeId = oneOf(themes.map((t) => t.id));
const category = oneOf(loadRules().map((r) => r.category));

const json = (value: unknown): TextContent => ({ type: 'text', text: JSON.stringify(value) });

/** Compact JSON for the model, and the same object as structuredContent for clients that read the outputSchema. */
const structured = (value: object): CallToolResult => ({ content: [json(value)], structuredContent: { ...value } });

const MIME_TYPES: Record<string, string> = { svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon' };

/**
 * One asset as MCP content. A PNG comes as an image block and an asset that
 * was not inlined as a resource_link; both carry the metadata as text. SVG
 * stays one JSON text block, ready to embed.
 */
function assetBlocks(asset: ReturnType<typeof getAsset>): CallToolResult['content'] {
  if (!('assetId' in asset)) return [json(asset)];
  const { content, ...metadata } = asset;
  if (content === undefined) {
    if (!asset.rawUrl) return [json(metadata)];
    return [json(metadata), { type: 'resource_link', uri: asset.rawUrl, name: asset.assetId,
      mimeType: MIME_TYPES[asset.format], size: asset.bytes }];
  }
  if (asset.format === 'png') return [json(metadata), { type: 'image', data: content, mimeType: 'image/png' }];
  return [json(asset)];
}

/** The theme file as raw text with real newlines, after a short metadata block. */
function themeBlocks({ content, ...metadata }: ReturnType<typeof getTheme>): CallToolResult['content'] {
  return [json(metadata), { type: 'text', text: content }];
}

// Output schemas. `satisfies` keeps each one in step with the type its tool returns.
const finding = z.object({
  severity: z.enum(['error', 'warning', 'info']), path: z.string(), message: z.string(),
  ratio: z.number().optional(), required: z.number().optional(),
});
const summary = z.object({ errors: z.number(), warnings: z.number(), infos: z.number() });
const lintOutput = z.object({
  findings: z.array(finding), summary, coverage: z.object({ checked: z.number(), unchecked: z.number() }),
}) satisfies z.ZodType<LintResult>;
const diffOutput = z.object({
  tokens: z.record(z.object({ added: z.array(z.string()), removed: z.array(z.string()), modified: z.array(z.string()) })),
  findings: z.object({
    before: summary, after: summary, delta: z.object({ errors: z.number(), warnings: z.number() }),
    introduced: z.array(finding), resolved: z.array(finding),
    worsened: z.array(z.object({ before: finding, after: finding })),
  }),
  regression: z.boolean(),
}) satisfies z.ZodType<DiffResult>;
const rule = z.object({
  id: z.string(), category: z.string(), severity: z.enum(['MUST', 'SHOULD', 'NEVER']), statement: z.string(),
  rationale: z.string().optional(), tags: z.array(z.string()).optional(), source: z.string().optional(),
  themes: z.array(z.string()).optional(), media: z.array(z.enum(['web', 'document', 'print'])).optional(),
}) satisfies z.ZodType<Rule>;
const rulesOutput = z.object({ count: z.number(), rules: z.array(rule), hint: z.string().optional() });
const themesOutput = z.object({
  count: z.number(),
  themes: z.array(z.object({
    id: z.string(), name: z.string(), version: z.string(), description: z.string().optional(),
    industry: z.array(z.string()), mood: z.array(z.string()),
    preview: z.record(z.string()), formats: z.record(z.string()),
  })),
  hint: z.string().optional(),
}) satisfies z.ZodType<ReturnType<typeof listThemes>>;

/** Every tool reads local files and changes nothing. */
const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

/** One tool: its registerTool config plus a handler that returns MCP content. */
export interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema: z.AnyZodObject;
  outputSchema?: z.AnyZodObject;
  annotations: ToolAnnotations;
  handler: (args: any) => CallToolResult;
}

export const toolDefinitions: ToolDef[] = [
  {
    name: 'list_themes',
    title: 'List themes',
    description: "List available themes with descriptions and formats; get_asset lists a theme's assets. Search names, descriptions or tags; tebin is modern, tebin-classic is the print/document identity.",
    inputSchema: z.strictObject({
      industry: oneOf(themes.flatMap((t) => t.industry)).optional().describe('Only themes for this industry.'),
      mood: oneOf(themes.flatMap((t) => t.mood)).optional().describe('Only themes with this mood.'),
      query: z.string().optional().describe('Text to find in the id, name, description, industries or moods, such as "print".'),
    }),
    outputSchema: themesOutput,
    annotations: READ_ONLY,
    handler: (args) => structured(listThemes(args)),
  },
  {
    name: 'get_theme',
    title: 'Get theme',
    description: 'Get a theme in css, tailwind, dtcg, ts, design-md or colors-csv (default css), with licensing, surfaces and documented omissions. Start with design-md for the complete design guide; colors-csv includes RGB and print references.',
    inputSchema: z.strictObject({
      id: themeId.describe('Theme id.'),
      format: z.enum(FORMATS as [Format, ...Format[]]).optional()
        .describe('File to return (default css). design-md is the whole design guide.'),
    }),
    annotations: READ_ONLY,
    handler: (args) => ({ content: themeBlocks(getTheme(args)) }),
  },
  {
    name: 'get_asset',
    title: 'Get brand asset',
    description: "List a theme's brand assets with sizes, or fetch one by assetId: SVG as text, PNG up to 200 KB as an image, anything else as a link.",
    inputSchema: z.strictObject({
      id: themeId.describe('Theme id.'),
      assetId: z.string().optional()
        .describe("Asset id, such as logo-full or logo-full@1024. Omit it to list the theme's assets."),
    }),
    annotations: READ_ONLY,
    handler: (args) => ({ content: assetBlocks(getAsset(args)) }),
  },
  {
    name: 'list_rules',
    title: 'List design rules',
    description: 'List design rules for a theme and medium (web, document, print), plus optional category, severity, tag or text filters. Omitted scope filters return the full catalogue; use scope to avoid applying website policies to print or another brand.',
    inputSchema: z.strictObject({
      theme: themeId.optional().describe('Keep rules for this theme. Rules without a theme scope apply to every theme.'),
      medium: z.enum(['web', 'document', 'print']).optional()
        .describe('Keep rules for this medium. Rules without a medium scope apply to every medium.'),
      category: category.optional().describe('Rule category.'),
      severity: z.enum(['MUST', 'SHOULD', 'NEVER']).optional().describe('Rule strength.'),
      tag: z.string().optional().describe('Exact tag, such as contrast or focus.'),
      query: z.string().optional().describe('Text to find in the id, statement, rationale or tags.'),
    }),
    outputSchema: rulesOutput,
    annotations: READ_ONLY,
    handler: (args) => structured(listRules(args)),
  },
  {
    name: 'lint_theme',
    title: 'Lint theme',
    description:
      'Check a theme for contrast failures and broken token references. Returns findings with the measured ratio and the surface it was measured against; reports what it could not check rather than skipping it.',
    inputSchema: z.strictObject({ id: themeId.describe('Theme id.') }),
    outputSchema: lintOutput,
    annotations: READ_ONLY,
    handler: (args) => structured(lintThemeTool(args)),
  },
  {
    name: 'diff_themes',
    title: 'Compare themes',
    description:
      'Compare two themes token by token: added, removed and modified per group, lint summaries and introduced, resolved or worsened findings. Regression means an introduced or worsened lint error, even when error totals are unchanged; it is not a compatibility guarantee.',
    inputSchema: z.strictObject({
      a: themeId.describe('Theme to compare from (before).'),
      b: themeId.describe('Theme to compare to (after).'),
    }),
    outputSchema: diffOutput,
    annotations: READ_ONLY,
    handler: (args) => structured(diffThemesTool(args)),
  },
  {
    name: 'get_rule',
    title: 'Get design rule',
    description: 'Get a single design rule by id.',
    inputSchema: z.strictObject({
      id: z.string().describe('Rule id, such as forms-loading-button. list_rules shows every id.'),
    }),
    outputSchema: rule,
    annotations: READ_ONLY,
    handler: (args) => structured(getRuleTool(args)),
  },
];
