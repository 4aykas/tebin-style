import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildColorsCsv, hexToRgb } from '../src/colors-csv.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('hexToRgb', () => {
  it('parses a six-digit hex', () => {
    expect(hexToRgb('#DA291C')).toEqual({ r: 218, g: 41, b: 28 });
  });
  it('parses a three-digit hex', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
  });
  it('rejects a non-hex value', () => {
    expect(hexToRgb('rgba(255,255,255,0.9)')).toBeNull();
  });
});

describe('buildColorsCsv', () => {
  const csv = buildColorsCsv(join(root, 'themes', 'tebin-classic'));
  const lines = csv.trimEnd().split('\n');

  it('starts with the documented header', () => {
    expect(lines[0]).toBe('token,hex,r,g,b,pantone,cmyk,purpose');
  });

  it('has one row per opaque colour token', () => {
    expect(lines).toHaveLength(13); // header + 12 colours
  });

  it('agrees with the hex on every row', () => {
    for (const line of lines.slice(1)) {
      const [, hex, r, g, b] = line.split(',');
      expect(hexToRgb(hex)).toEqual({ r: Number(r), g: Number(g), b: Number(b) });
    }
  });

  it('carries the Pantone from the token extension', () => {
    const brand = lines.find((l) => l.startsWith('color.brand,'))!;
    expect(brand).toContain('485 C');
    expect(brand).toContain('0/95/100/0');
  });

  it('says so when the book gives no print value', () => {
    const ink = lines.find((l) => l.startsWith('color.ink,'))!;
    expect(ink).toContain('not specified in the 2017 brand book');
  });

  it('excludes the translucent scale', () => {
    const tebin = buildColorsCsv(join(root, 'themes', 'tebin'));
    expect(tebin).not.toContain('rgba');
    // Assert on the token's group, not on the substring "on-dark": the opaque
    // color.brand-on-dark is a real colour that belongs in the spreadsheet and
    // happens to contain it.
    const tokens = tebin.trim().split(/\r?\n/).slice(1).map((l) => l.split(',')[0]);
    for (const group of ['on-dark', 'on-light', 'rule-dark', 'rule-light', 'surface-dark', 'brand']) {
      expect(tokens.some((t) => t.startsWith(`${group}.`)), group).toBe(false);
    }
    expect(tokens).toContain('color.brand-on-dark');
  });
});
