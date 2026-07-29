import { describe, it, expect } from 'vitest';
import { mkdtempSync, cpSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildRaster, plannedOutputs, padSvg, LADDER, CLEAR_SPACE_RATIO } from '../src/raster.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const classic = join(root, 'themes', 'tebin-classic');

describe('plannedOutputs', () => {
  const planned = plannedOutputs(classic);

  it('gives a logo three widths', () => {
    const logo = planned.filter((o) => o.assetId === 'logo-full');
    expect(logo.map((o) => o.width).sort((a, b) => a - b)).toEqual([...LADDER.logo]);
    expect(logo.every((o) => o.background === null)).toBe(true);
  });

  it('gives a white logo backgrounds instead of transparency', () => {
    const white = planned.filter((o) => o.assetId === 'logo-full-white');
    expect(white).toHaveLength(LADDER.logo.length * 2);
    expect(white.every((o) => o.background !== null)).toBe(true);
    expect(white.map((o) => o.variant)).toContain('on-brand');
    expect(white.map((o) => o.variant)).toContain('on-charcoal');
  });

  it('names files by asset, width and variant', () => {
    const paths = planned.map((o) => o.path);
    expect(paths).toContain('assets/png/logo-full-1024.png');
    expect(paths).toContain('assets/png/logo-full-white-1024-on-brand.png');
    expect(paths).toContain('assets/png/corner-mark-256.png');
  });
});

describe('padSvg', () => {
  const logoSvg = readFileSync(join(classic, 'assets', 'logo', 'logo-full.svg'), 'utf8');

  it('adds the brand clear space around the viewBox', () => {
    const padded = padSvg(logoSvg);
    const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(padded)!;
    const pad = 166.23 * CLEAR_SPACE_RATIO;
    expect(Number(m[1])).toBeCloseTo(533.33 + 2 * pad, 1);
    expect(Number(m[2])).toBeCloseTo(166.23 + 2 * pad, 1);
  });

  it('keeps the original artwork inside', () => {
    expect(padSvg(logoSvg)).toContain('M31.26,78.43');
  });

  it('returns an svg with no viewBox unchanged', () => {
    expect(padSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>')).toContain('<rect/>');
  });
});

describe('buildRaster', () => {
  it('writes every planned file and a manifest that describes them', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ts-raster-'));
    const work = join(tmp, 'tebin-classic');
    cpSync(classic, work, { recursive: true });
    try {
      const manifest = await buildRaster(work);
      expect(manifest.outputs).toHaveLength(plannedOutputs(work).length);
      for (const out of manifest.outputs) {
        expect(existsSync(join(work, out.path)), out.path).toBe(true);
        expect(out.sourceSha256).toMatch(/^[0-9a-f]{64}$/);
        expect(out.height).toBeGreaterThan(0);
      }
      const written = JSON.parse(readFileSync(join(work, 'assets', 'png', 'manifest.json'), 'utf8'));
      expect(written.outputs.map((o: { path: string }) => o.path)).toEqual(
        [...written.outputs.map((o: { path: string }) => o.path)].sort(),
      );
      // No timestamp: a date would drift on every run and make check fail for its own reasons.
      expect(JSON.stringify(written)).not.toContain('generatedAt');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 60_000);
});
