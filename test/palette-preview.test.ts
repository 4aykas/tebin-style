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
