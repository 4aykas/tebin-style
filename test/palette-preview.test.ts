import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
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
      const swatches = [...svg.matchAll(/<rect[^>]*fill="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]);
      const labels = [...svg.matchAll(/font-size="13"[^>]*fill="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]);
      expect(labels.length, id).toBe(swatches.length);
      swatches.forEach((bg, i) => {
        expect(contrastRatio(labels[i], bg), `${id} swatch ${bg} label ${labels[i]}`).toBeGreaterThanOrEqual(4.5);
      });
    }
  });
});
