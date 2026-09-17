import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, relative, isAbsolute, win32 } from 'node:path';
import type { RegistryIndex } from './index-builder.js';

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export type Format = 'css' | 'tailwind' | 'dtcg' | 'ts' | 'design-md' | 'colors-csv';

export const FORMAT_FILES: Record<Format, string> = {
  css: 'tokens.css',
  tailwind: 'tailwind.css',
  dtcg: 'tokens.dtcg.json',
  ts: 'theme.ts',
  'design-md': 'DESIGN.md',
  'colors-csv': 'colors.csv',
};

function containedFile(root: string, path: string): string {
  if (isAbsolute(path) || win32.isAbsolute(path) || path.split(/[\\/]/).includes('..')) {
    throw new NotFoundError('path must stay inside the theme');
  }
  const target = join(root, path);
  if (existsSync(target)) {
    const rel = relative(realpathSync(root), realpathSync(target));
    if (rel === '..' || rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(rel)) {
      throw new NotFoundError('path must stay inside the theme');
    }
  }
  return target;
}

function themePath(id: string): string {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) throw new NotFoundError(`invalid theme id "${id}"`);
  return containedFile(join(REPO_ROOT, 'themes'), id);
}

/** DESIGN.md is generated beside the source, not into dist/. */
const ROOT_LEVEL_FORMATS = new Set<Format>(['design-md']);

export interface ThemeManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  surfaces?: { light?: string; dark?: string };
  contrastPairs?: Record<string, { foreground: string; background: string }>;
  omitted?: Array<{ section: string; reason: string }>;
  license: { tokens: string; assets: string };
  assets: Array<{ id: string; type: string; format: string; path: string }>;
}

export function loadIndex(): RegistryIndex {
  const p = join(REPO_ROOT, 'registry', 'index.json');
  if (!existsSync(p)) throw new NotFoundError('registry/index.json not found — run `pnpm build`');
  return JSON.parse(readFileSync(p, 'utf8')) as RegistryIndex;
}

export function loadThemeManifest(id: string): ThemeManifest {
  const p = containedFile(themePath(id), 'theme.json');
  if (!existsSync(p)) throw new NotFoundError(`theme "${id}" not found`);
  return JSON.parse(readFileSync(p, 'utf8')) as ThemeManifest;
}

export function readFormat(id: string, format: Format): { filename: string; content: string } {
  if (!Object.hasOwn(FORMAT_FILES, format)) throw new NotFoundError(`unknown format "${format}"`);
  const filename = FORMAT_FILES[format];
  const p = containedFile(themePath(id), ROOT_LEVEL_FORMATS.has(format) ? filename : `dist/${filename}`);
  if (!existsSync(p)) throw new NotFoundError(`format "${format}" for theme "${id}" not found`);
  return { filename, content: readFileSync(p, 'utf8') };
}

export function readAssetFile(repoRelPath: string): { format: string; encoding: 'utf8' | 'base64'; content: string } {
  const match = /^themes\/([^/]+)\/assets\/(.+)$/.exec(repoRelPath);
  if (!match) throw new NotFoundError('asset path must be inside a theme assets directory');
  const p = containedFile(containedFile(themePath(match[1]), 'assets'), match[2]);
  if (!existsSync(p)) throw new NotFoundError(`asset file not found: ${repoRelPath}`);
  const ext = extname(repoRelPath).replace('.', '').toLowerCase();
  const isText = ext === 'svg';
  return {
    format: ext,
    encoding: isText ? 'utf8' : 'base64',
    content: readFileSync(p, isText ? 'utf8' : 'base64'),
  };
}
