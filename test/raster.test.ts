import { describe, it, expect } from 'vitest';
import { mkdtempSync, cpSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildRaster, plannedOutputs, padSvg, LADDER, CLEAR_SPACE_RATIO } from '../src/raster.js';
import { diffAssets } from '../src/check.js';
import { Resvg } from '@resvg/resvg-js';

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

  it('keeps root namespaces and presentation attributes, so xlink input still renders', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
      'viewBox="0 0 10 10" fill="#00ff00"><defs><rect id="r" width="10" height="10"/></defs>' +
      '<use xlink:href="#r"/></svg>';
    const padded = padSvg(svg);
    expect(padded).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
    expect(padded).toContain('fill="#00ff00"');
    const { pixels, width, height } = new Resvg(padded, { fitTo: { mode: 'width', value: 24 } }).render();
    const centre = (Math.floor(height / 2) * width + Math.floor(width / 2)) * 4;
    expect([...pixels.subarray(centre, centre + 4)]).toEqual([0, 255, 0, 255]);
  });

  it('pads a single-quoted viewBox', () => {
    const padded = padSvg("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><rect/></svg>");
    expect(padded).toContain(`viewBox="0 0 ${10 + 20 * CLEAR_SPACE_RATIO} ${10 + 20 * CLEAR_SPACE_RATIO}"`);
  });

  it('refuses a tile it cannot pad instead of skipping the clear space', () => {
    expect(() => padSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>')).toThrow(/viewBox/);
    expect(() => padSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 0 10"/>')).toThrow(/viewBox/);
  });
});

describe('buildRaster', () => {
  it('removes obsolete generated PNGs but preserves unlisted files', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ts-raster-'));
    const work = join(tmp, 'tebin-classic');
    cpSync(classic, work, { recursive: true });
    try {
      const themePath = join(work, 'theme.json');
      const theme = JSON.parse(readFileSync(themePath, 'utf8'));
      theme.assets = [];
      writeFileSync(themePath, JSON.stringify(theme));
      const personal = join(work, 'assets', 'png', 'personal.png');
      writeFileSync(personal, 'unlisted file');
      expect((await buildRaster(work)).outputs).toEqual([]);
      expect(diffAssets(work)).toEqual([]);
      expect(existsSync(join(work, 'assets', 'png', 'logo-full-1024.png'))).toBe(false);
      expect(readFileSync(personal, 'utf8')).toBe('unlisted file');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('refuses to delete paths outside the generated asset directory', async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ts-raster-'));
    const work = join(tmp, 'tebin-classic');
    cpSync(classic, work, { recursive: true });
    try {
      const themePath = join(work, 'theme.json');
      const theme = JSON.parse(readFileSync(themePath, 'utf8'));
      theme.assets = [];
      writeFileSync(themePath, JSON.stringify(theme));
      writeFileSync(join(work, 'assets', 'png', 'manifest.json'), JSON.stringify({ outputs: [{ path: '../../keep.txt' }] }));
      await expect(buildRaster(work)).rejects.toThrow('refusing to remove');
      expect(existsSync(themePath)).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

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
