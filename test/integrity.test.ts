import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync } from 'node:fs';
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
