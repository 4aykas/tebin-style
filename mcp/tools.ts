import { z } from 'zod';
import type { ThemeEntry } from '../src/index-builder.js';
import {
  loadIndex, loadThemeManifest, readFormat, readAssetFile, FORMAT_FILES, NotFoundError,
  type Format,
} from '../src/registry.js';
import { filterRules, getRule as getRuleById, type Rule } from '../src/rules.js';

const FORMATS = Object.keys(FORMAT_FILES) as Format[];

export function listThemes(input: { industry?: string; mood?: string; query?: string }): {
  count: number; themes: ThemeEntry[];
} {
  const { industry, mood, query } = input;
  let themes = loadIndex().themes;
  if (industry) themes = themes.filter((t) => t.industry.some((v) => v.toLowerCase() === industry.toLowerCase()));
  if (mood) themes = themes.filter((t) => t.mood.some((v) => v.toLowerCase() === mood.toLowerCase()));
  if (query) {
    const q = query.toLowerCase();
    themes = themes.filter((t) => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
  }
  return { count: themes.length, themes };
}

export function getTheme(input: { id: string; format?: Format }) {
  const format: Format = input.format ?? 'css';
  if (!FORMAT_FILES[format]) throw new NotFoundError(`unknown format "${format}"`);
  const manifest = loadThemeManifest(input.id); // throws NotFoundError for unknown id
  const { filename, content } = readFormat(input.id, format);
  return {
    id: manifest.id, name: manifest.name, version: manifest.version,
    format, filename, license: manifest.license, content,
  };
}

export function getAsset(input: { id: string; assetId?: string }) {
  const entry = loadIndex().themes.find((t) => t.id === input.id);
  if (!entry) throw new NotFoundError(`theme "${input.id}" not found`);

  if (!input.assetId) {
    return { id: entry.id, assets: entry.assets };
  }

  const asset = entry.assets.find((a) => a.id === input.assetId);
  if (!asset) throw new NotFoundError(`asset "${input.assetId}" not found in theme "${input.id}"`);

  const file = readAssetFile(asset.path);
  return {
    id: entry.id, assetId: asset.id, type: asset.type,
    format: file.format, path: asset.path, rawUrl: asset.rawUrl,
    encoding: file.encoding, content: file.content,
  };
}

export function listRules(input: { category?: string; severity?: string; tag?: string; query?: string }): {
  count: number; rules: Rule[];
} {
  const rules = filterRules(input);
  return { count: rules.length, rules };
}

export function getRuleTool(input: { id: string }): Rule {
  return getRuleById(input.id);
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
    description: 'List available themes, optionally filtered by industry, mood, or a name/id query.',
    inputSchema: {
      industry: z.string().optional(),
      mood: z.string().optional(),
      query: z.string().optional(),
    },
    handler: listThemes,
  },
  {
    name: 'get_theme',
    description: "Get a theme's design tokens in a chosen format (css, tailwind, dtcg, ts; default css).",
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
    description: 'List design rules (UI/UX/accessibility guidelines), filtered by category, severity, tag, or query.',
    inputSchema: {
      category: z.string().optional(),
      severity: z.enum(['MUST', 'SHOULD', 'NEVER']).optional(),
      tag: z.string().optional(),
      query: z.string().optional(),
    },
    handler: listRules,
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
