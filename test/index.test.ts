import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildIndex } from '../src/index-builder.js';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const themesRoot = join(here, 'fixtures', 'themes');

describe('buildIndex', () => {
  it('preserves asset licence overrides, including their generated PNGs', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ts-licence-'));
    try {
      const themeDir = join(tmp, 'tebin-classic');
      cpSync(join(here, '..', 'themes', 'tebin-classic'), themeDir, { recursive: true });
      const path = join(themeDir, 'theme.json');
      const theme = JSON.parse(readFileSync(path, 'utf8'));
      theme.assets[0].license = 'Test override';
      writeFileSync(path, JSON.stringify(theme));
      const assets = buildIndex(tmp).themes[0].assets;
      expect(assets.find((a) => a.id === 'logo-full')?.license).toBe('Test override');
      expect(assets.find((a) => a.id === 'logo-full@1024')?.license).toBe('Test override');
      expect(assets.find((a) => a.id === 'logo-full-white')?.license).toBe(theme.license.assets);
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  });
  it('lists themes with formats, preview and assets', () => {
    const idx = buildIndex(themesRoot, { rawBaseUrl: 'https://example/raw' });
    const good = idx.themes.find((t) => t.id === 'good')!;
    expect(good).toBeTruthy();
    expect(good.version).toBe('1.0.0');
    expect(good.formats.css).toBe('themes/good/dist/tokens.css');
    expect(good.preview.brand).toBe('#DA291C');
    expect(good.assets[0].rawUrl).toContain('themes/good/assets/logo.svg');
    expect(idx.count).toBe(idx.themes.length);
  });
});

describe('buildIndex raster entries', () => {
  const realThemes = join(here, '..', 'themes');
  const index = buildIndex(realThemes, { rawBaseUrl: 'https://example.test' });
  const classic = index.themes.find((t) => t.id === 'tebin-classic')!;

  it('keeps the hand-authored SVG assets first', () => {
    expect(classic.assets[0].id).toBe('logo-full');
    expect(classic.assets[0].path).toBe('themes/tebin-classic/assets/logo/logo-full.svg');
  });

  it('adds a raster entry per PNG', () => {
    const png = classic.assets.find((a) => a.id === 'logo-full@1024')!;
    expect(png.path).toBe('themes/tebin-classic/assets/png/logo-full-1024.png');
    expect(png.rawUrl).toBe('https://example.test/themes/tebin-classic/assets/png/logo-full-1024.png');
    expect(png.type).toBe('logo');
  });

  it('names a background variant in its id', () => {
    expect(classic.assets.some((a) => a.id === 'logo-full-white@1024-on-brand')).toBe(true);
  });

  it('leaves a theme with no raster pack unchanged', () => {
    const slate = index.themes.find((t) => t.id === 'slate')!;
    expect(slate.assets.every((a) => !a.id.includes('@'))).toBe(true);
  });
});
