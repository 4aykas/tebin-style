import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import type { RegistryIndex } from './index-builder.js';

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export type Format = 'css' | 'tailwind' | 'dtcg' | 'ts';

export const FORMAT_FILES: Record<Format, string> = {
  css: 'tokens.css',
  tailwind: 'tailwind.css',
  dtcg: 'tokens.dtcg.json',
  ts: 'theme.ts',
};

export interface ThemeManifest {
  id: string;
  name: string;
  version: string;
  license: { tokens: string; assets: string };
  assets: Array<{ id: string; type: string; format: string; path: string }>;
}

export function loadIndex(): RegistryIndex {
  const p = join(REPO_ROOT, 'registry', 'index.json');
  if (!existsSync(p)) throw new NotFoundError('registry/index.json not found — run `pnpm build`');
  return JSON.parse(readFileSync(p, 'utf8')) as RegistryIndex;
}

export function loadThemeManifest(id: string): ThemeManifest {
  const p = join(REPO_ROOT, 'themes', id, 'theme.json');
  if (!existsSync(p)) throw new NotFoundError(`theme "${id}" not found`);
  return JSON.parse(readFileSync(p, 'utf8')) as ThemeManifest;
}

export function readFormat(id: string, format: Format): { filename: string; content: string } {
  const filename = FORMAT_FILES[format];
  if (!filename) throw new NotFoundError(`unknown format "${format}"`);
  const p = join(REPO_ROOT, 'themes', id, 'dist', filename);
  if (!existsSync(p)) throw new NotFoundError(`format "${format}" for theme "${id}" not found`);
  return { filename, content: readFileSync(p, 'utf8') };
}

export function readAssetFile(repoRelPath: string): { format: string; encoding: 'utf8' | 'base64'; content: string } {
  const p = join(REPO_ROOT, repoRelPath);
  if (!existsSync(p)) throw new NotFoundError(`asset file not found: ${repoRelPath}`);
  const ext = extname(repoRelPath).replace('.', '').toLowerCase();
  const isText = ext === 'svg';
  return {
    format: ext,
    encoding: isText ? 'utf8' : 'base64',
    content: readFileSync(p, isText ? 'utf8' : 'base64'),
  };
}
