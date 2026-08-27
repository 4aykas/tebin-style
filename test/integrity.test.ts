import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateThemeDir } from '../src/validate.js';

const here = dirname(fileURLToPath(import.meta.url));
const goodDir = join(here, 'fixtures', 'themes', 'good');

describe('validateThemeDir', () => {
  it('accepts a valid theme directory', () => {
    const r = validateThemeDir(goodDir);
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('fails when id does not match folder name', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ts-integrity-'));
    const mismatch = join(tmp, 'other-name');
    cpSync(goodDir, mismatch, { recursive: true });
    try {
      const r = validateThemeDir(mismatch);
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.includes('must equal folder name'))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('fails when an asset path is missing', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ts-integrity-'));
    const dir = join(tmp, 'good');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'theme.json'), JSON.stringify({
      id: 'good', name: 'X', version: '1.0.0',
      license: { tokens: 'MIT', assets: 'X' },
      assets: [{ id: 'logo', type: 'logo', format: 'svg', path: 'assets/missing.svg' }],
    }));
    writeFileSync(join(dir, 'tokens.json'), JSON.stringify({ color: { brand: { $type: 'color', $value: '#000000' } } }));
    try {
      const r = validateThemeDir(dir);
      expect(r.valid).toBe(false);
      expect(r.errors.some((e) => e.includes('path not found'))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('the manifest declares what the lint needs', () => {
  const themeDir = (id: string) => join(here, '..', 'themes', id);
  const manifest = (id: string) =>
    JSON.parse(readFileSync(join(themeDir(id), 'theme.json'), 'utf8'));

  for (const id of ['tebin', 'tebin-classic', 'slate']) {
    it(`${id} names the binding light surface`, () => {
      expect(manifest(id).surfaces?.light, id).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  }

  it('tebin names a dark surface too, because it has dark bands', () => {
    expect(manifest('tebin').surfaces.dark).toBe('#242830');
  });

  it('every theme declares why it has no component tokens', () => {
    for (const id of ['tebin', 'tebin-classic', 'slate']) {
      const sections = (manifest(id).omitted ?? []).map((o: { section: string }) => o.section);
      expect(sections, id).toContain('components');
    }
  });

  it('rejects an omission with no reason — a bare skip explains nothing', async () => {
    const { validateThemeMetadata } = await import('../src/validate.js');
    const bad = {
      id: 'x', name: 'X', version: '1.0.0',
      license: { tokens: 'MIT', assets: 'X' },
      omitted: [{ section: 'components' }],
    };
    expect(validateThemeMetadata(bad).valid).toBe(false);
  });
});
