import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdtempSync, cpSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { Resvg } from '@resvg/resvg-js';
import { buildPaletteSvg } from '../src/palette-preview.js';
import { collectColorRows } from '../src/colors-csv.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('buildPaletteSvg', () => {
  for (const id of ['tebin', 'tebin-classic', 'slate']) {
    it(`draws one swatch per opaque colour of ${id}`, () => {
      const dir = join(root, 'themes', id);
      const svg = buildPaletteSvg(dir);
      const rows = collectColorRows(dir);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg.match(/<rect/g) ?? []).toHaveLength(rows.length);
      for (const row of rows) expect(svg).toContain(row.hex);
    });
  }
});

describe('committed previews', () => {
  for (const id of ['tebin', 'tebin-classic', 'slate']) {
    it(`${id} has both preview files`, () => {
      expect(existsSync(join(root, 'themes', id, 'preview', 'palette.svg'))).toBe(true);
      expect(existsSync(join(root, 'themes', id, 'preview', 'palette.png'))).toBe(true);
    });
  }
});

describe('swatch labels clear the floor the repo enforces', () => {
  it('never prints a label below 4.5:1 on its own swatch', async () => {
    const { contrastRatio } = await import('../src/contrast.js');
    const { buildPaletteSvg } = await import('../src/palette-preview.js');
    const { fileURLToPath } = await import('node:url');
    const { dirname, join } = await import('node:path');
    const repo = join(dirname(fileURLToPath(import.meta.url)), '..');

    for (const id of ['tebin', 'tebin-classic', 'slate']) {
      const svg = buildPaletteSvg(join(repo, 'themes', id));
      const swatches = [...svg.matchAll(/<rect[^>]*fill="(#[0-9A-Fa-f]{6})"/g)].map(([, hex = '']) => hex);
      const labels = [...svg.matchAll(/font-size="13"[^>]*fill="(#[0-9A-Fa-f]{6})"/g)].map(([, hex = '']) => hex);
      expect(labels.length, id).toBe(swatches.length);
      swatches.forEach((bg, i) => {
        expect(contrastRatio(labels[i] ?? '', bg), `${id} swatch ${bg} label ${labels[i]}`).toBeGreaterThanOrEqual(4.5);
      });
    }
  });
});

describe('token names in the palette SVG', () => {
  it('are XML-escaped, so any name yields a well-formed SVG', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ts-palette-'));
    const work = join(tmp, 'slate');
    cpSync(join(root, 'themes', 'slate'), work, { recursive: true });
    try {
      const tokensPath = join(work, 'tokens.json');
      const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
      tokens.color['a&b<c>"d'] = { $type: 'color', $value: '#123456' };
      writeFileSync(tokensPath, JSON.stringify(tokens));
      const svg = buildPaletteSvg(work);
      expect(svg).toContain('a&amp;b&lt;c&gt;&quot;d');
      expect(() => new Resvg(svg).render()).not.toThrow();
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
