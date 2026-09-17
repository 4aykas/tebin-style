import { z } from 'zod';
import type { ThemeEntry } from '../src/index-builder.js';
import {
  loadIndex, loadThemeManifest, readFormat, readAssetFile, FORMAT_FILES, NotFoundError,
  type Format,
} from '../src/registry.js';
import { filterRules, getRule as getRuleById, type Rule, type RuleFilters } from '../src/rules.js';
import { lintTheme, type LintResult } from '../src/lint.js';
import { diffThemes, type DiffResult } from '../src/diff.js';
import { join } from 'node:path';
import { REPO_ROOT } from '../src/registry.js';

const FORMATS = Object.keys(FORMAT_FILES) as Format[];

export function listThemes(input: { industry?: string; mood?: string; query?: string }): {
  count: number; themes: ThemeEntry[];
} {
  const { industry, mood, query } = input;
  let themes = loadIndex().themes;
  if (industry) themes = themes.filter((t) => t.industry.some((v) => v.toLowerCase() === industry.toLowerCase()));
  if (mood) themes = themes.filter((t) => t.mood.some((v) => v.toLowerCase() === mood.toLowerCase()));
  if (query) {
    const q = query.trim().toLowerCase();
    themes = themes.filter((t) => [t.id, t.name, t.description ?? '', ...t.industry, ...t.mood]
      .some((value) => value.toLowerCase().includes(q)));
  }
  return { count: themes.length, themes };
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

export function getAsset(input: { id: string; assetId?: string }) {
  const entry = loadIndex().themes.find((t) => t.id === input.id);
  if (!entry) throw new NotFoundError(`theme "${input.id}" not found`);

  if (!input.assetId) {
    return { id: entry.id, license: loadThemeManifest(input.id).license.assets, assets: entry.assets };
  }

  const asset = entry.assets.find((a) => a.id === input.assetId);
  if (!asset) throw new NotFoundError(`asset "${input.assetId}" not found in theme "${input.id}"`);

  const file = readAssetFile(asset.path);
  return {
    id: entry.id, assetId: asset.id, type: asset.type,
    format: file.format, path: asset.path, rawUrl: asset.rawUrl,
    license: asset.license ?? loadThemeManifest(input.id).license.assets,
    encoding: file.encoding, content: file.content,
  };
}

export function listRules(input: RuleFilters): {
  count: number; rules: Rule[];
} {
  if (input.theme) loadThemeManifest(input.theme);
  const rules = filterRules(input);
  return { count: rules.length, rules };
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

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: z.ZodRawShape;
  handler: (args: any) => unknown;
}

export const toolDefinitions: ToolDef[] = [
  {
    name: 'list_themes',
    description: 'List available themes with descriptions, formats and assets. Search names, descriptions or tags; tebin is modern, tebin-classic is the print/document identity.',
    inputSchema: {
      industry: z.string().optional(),
      mood: z.string().optional(),
      query: z.string().optional(),
    },
    handler: listThemes,
  },
  {
    name: 'get_theme',
    description: "Get a theme in css, tailwind, dtcg, ts, design-md or colors-csv (default css), with licensing, surfaces and documented omissions. Start with design-md for the complete design guide; colors-csv includes RGB and print references.",
    inputSchema: {
      id: z.string(),
      format: z.enum(FORMATS as [Format, ...Format[]]).optional(),
    },
    handler: getTheme,
  },
  {
    name: 'get_asset',
    description: "List a theme's brand assets, or fetch one asset (SVG as text, binary as base64) by assetId.",
    inputSchema: {
      id: z.string(),
      assetId: z.string().optional(),
    },
    handler: getAsset,
  },
  {
    name: 'list_rules',
    description: 'List design rules for a theme and medium (web, document, print), plus optional category, severity, tag or text filters. Omitted scope filters return the full catalogue; use scope to avoid applying website policies to print or another brand.',
    inputSchema: {
      category: z.string().optional(),
      theme: z.string().optional(),
      medium: z.enum(['web', 'document', 'print']).optional(),
      severity: z.enum(['MUST', 'SHOULD', 'NEVER']).optional(),
      tag: z.string().optional(),
      query: z.string().optional(),
    },
    handler: listRules,
  },
  {
    name: 'lint_theme',
    description:
      'Check a theme for contrast failures and broken token references. Returns findings with the measured ratio and the surface it was measured against; reports what it could not check rather than skipping it.',
    inputSchema: { id: z.string() },
    handler: lintThemeTool,
  },
  {
    name: 'diff_themes',
    description:
      'Compare two themes token by token: added, removed and modified per group, lint summaries and introduced, resolved or worsened findings. Regression means an introduced or worsened lint error, even when error totals are unchanged; it is not a compatibility guarantee.',
    inputSchema: { a: z.string(), b: z.string() },
    handler: diffThemesTool,
  },
  {
    name: 'get_rule',
    description: 'Get a single design rule by id.',
    inputSchema: {
      id: z.string(),
    },
    handler: getRuleTool,
  },
];
