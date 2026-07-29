import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildTheme } from '../src/build.js';
import { writeColorsCsv } from '../src/colors-csv.js';
import { diffTheme, diffAssets } from '../src/check.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let dir: string;
beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'ts-check-'));
  mkdirSync(join(dir, 'sample'), { recursive: true });
  writeFileSync(
    join(dir, 'sample', 'tokens.json'),
    JSON.stringify({ color: { brand: { $type: 'color', $value: '#DA291C' } } }),
  );
  await buildTheme(join(dir, 'sample'));
  writeColorsCsv(join(dir, 'sample')); // the fixture must mirror the build pipeline
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

describe('diffAssets', () => {
  const classic = join(root, 'themes', 'tebin-classic');

  it('is silent on the committed tree', () => {
    expect(diffAssets(classic)).toEqual([]);
  });

  it('is silent on a theme with no SVG assets', () => {
    expect(diffAssets(join(root, 'themes', 'slate'))).toEqual([]);
  });

  it('reports a changed source SVG', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ts-assets-'));
    const work = join(tmp, 'tebin-classic');
    cpSync(classic, work, { recursive: true });
    try {
      const svg = join(work, 'assets', 'logo', 'logo-full.svg');
      writeFileSync(svg, readFileSync(svg, 'utf8').replace('#DA291C', '#FF0000'));
      const drift = diffAssets(work);
      expect(drift.length).toBeGreaterThan(0);
      expect(drift.join(' ')).toContain('logo-full.svg');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports a missing PNG', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ts-assets-'));
    const work = join(tmp, 'tebin-classic');
    cpSync(classic, work, { recursive: true });
    try {
      unlinkSync(join(work, 'assets', 'png', 'logo-full-1024.png'));
      expect(diffAssets(work).join(' ')).toContain('logo-full-1024.png');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports a manifest that no longer matches the ladder', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ts-assets-'));
    const work = join(tmp, 'tebin-classic');
    cpSync(classic, work, { recursive: true });
    try {
      const p = join(work, 'assets', 'png', 'manifest.json');
      const m = JSON.parse(readFileSync(p, 'utf8'));
      m.outputs.pop();
      writeFileSync(p, JSON.stringify(m, null, 2) + '\n');
      expect(diffAssets(work).join(' ')).toContain('manifest.json');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
