import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { packFileList } from '../scripts/build-pack.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('packFileList', () => {
  const files = packFileList(join(root, 'themes'));

  it('lists only files that exist', () => {
    for (const f of files) expect(existsSync(join(root, f)), f).toBe(true);
  });

  it('carries, for every theme, the vector, the raster, the document and the tokens', () => {
    for (const id of ['tebin', 'tebin-classic', 'slate']) {
      const own = files.filter((f) => f.startsWith(`themes/${id}/`));
      expect(own.some((f) => f.endsWith('DESIGN.md')), id).toBe(true);
      expect(own.some((f) => f.endsWith('dist/colors.csv')), id).toBe(true);
      expect(own.some((f) => f.endsWith('dist/tokens.css')), id).toBe(true);
      expect(own.some((f) => f.endsWith('dist/tokens.dtcg.json')), id).toBe(true);
    }
    expect(files.some((f) => f.endsWith('.png'))).toBe(true);
    expect(files.some((f) => f.endsWith('.svg'))).toBe(true);
  });

  it('excludes source and build files', () => {
    expect(files.some((f) => f.includes('node_modules'))).toBe(false);
    expect(files.some((f) => f.endsWith('tokens.json'))).toBe(false);
    expect(files.some((f) => f.endsWith('manifest.json'))).toBe(false);
  });
});
