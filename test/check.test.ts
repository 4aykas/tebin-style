import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildTheme } from '../src/build.js';
import { diffTheme } from '../src/check.js';

let dir: string;
beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'ts-check-'));
  mkdirSync(join(dir, 'sample'), { recursive: true });
  writeFileSync(
    join(dir, 'sample', 'tokens.json'),
    JSON.stringify({ color: { brand: { $type: 'color', $value: '#DA291C' } } }),
  );
  await buildTheme(join(dir, 'sample'));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('diffTheme', () => {
  it('reports no drift right after a build', async () => {
    expect(await diffTheme(join(dir, 'sample'))).toEqual([]);
  });
  it('reports drift when a dist file is stale', async () => {
    writeFileSync(join(dir, 'sample', 'dist', 'tokens.css'), '/* stale */');
    const drift = await diffTheme(join(dir, 'sample'));
    expect(drift.length).toBeGreaterThan(0);
  });
});
