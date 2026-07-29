import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { readManifest } from './raster.js';

export const PREVIEW_KEYS = ['brand', 'ink', 'topbar'];

export interface ThemeEntry {
  id: string;
  name: string;
  version: string;
  industry: string[];
  mood: string[];
  preview: Record<string, string>;
  formats: Record<string, string>;
  assets: Array<{ id: string; type: string; path: string; rawUrl?: string }>;
}

export interface RegistryIndex {
  generatedAt: string;
  count: number;
  themes: ThemeEntry[];
}

export function buildIndex(themesRoot: string, opts: { rawBaseUrl?: string } = {}): RegistryIndex {
  const themes: ThemeEntry[] = [];
  if (!existsSync(themesRoot)) return { generatedAt: today(), count: 0, themes };

  const dirs = readdirSync(themesRoot, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of dirs) {
    if (!entry.isDirectory()) continue;
    const dir = join(themesRoot, entry.name);
    const themePath = join(dir, 'theme.json');
    const tokensPath = join(dir, 'tokens.json');
    if (!existsSync(themePath) || !existsSync(tokensPath)) continue;

    const theme = JSON.parse(readFileSync(themePath, 'utf8'));
    const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
    const colors = (tokens.color ?? {}) as Record<string, { $value?: string }>;

    const preview: Record<string, string> = {};
    for (const key of PREVIEW_KEYS) {
      if (colors[key]?.$value) preview[key] = colors[key].$value as string;
    }

    const base = `themes/${entry.name}`;
    const assets = (theme.assets ?? []).map((a: { id: string; type: string; path: string }) => ({
      id: a.id,
      type: a.type,
      path: `${base}/${a.path}`,
      ...(opts.rawBaseUrl ? { rawUrl: `${opts.rawBaseUrl}/${base}/${a.path}` } : {}),
    }));

    // Raster outputs join the index as first-class assets (logo-full@1024,
    // logo-full-white@1024-on-brand), so get_asset serves PNGs with no new code.
    const rasterAssets = (readManifest(dir)?.outputs ?? []).map((o) => {
      const suffix = o.variant === 'transparent' ? '' : `-${o.variant}`;
      const sourceAsset = (theme.assets ?? []).find((a: { id: string }) => a.id === o.assetId);
      return {
        id: `${o.assetId}@${o.width}${suffix}`,
        type: sourceAsset?.type ?? 'raster',
        path: `${base}/${o.path}`,
        ...(opts.rawBaseUrl ? { rawUrl: `${opts.rawBaseUrl}/${base}/${o.path}` } : {}),
      };
    });

    themes.push({
      id: theme.id,
      name: theme.name,
      version: theme.version,
      industry: theme.industry ?? [],
      mood: theme.mood ?? [],
      preview,
      formats: {
        css: `${base}/dist/tokens.css`,
        tailwind: `${base}/dist/tailwind.css`,
        dtcg: `${base}/dist/tokens.dtcg.json`,
        ts: `${base}/dist/theme.ts`,
      },
      assets: [...assets, ...rasterAssets],
    });
  }
  return { generatedAt: today(), count: themes.length, themes };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
