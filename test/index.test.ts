import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildIndex } from '../src/index-builder.js';

const here = dirname(fileURLToPath(import.meta.url));
const themesRoot = join(here, 'fixtures', 'themes');

describe('buildIndex', () => {
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
