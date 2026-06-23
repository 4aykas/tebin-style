import { describe, it, expect } from 'vitest';
import {
  loadIndex, loadThemeManifest, readFormat, readAssetFile, FORMAT_FILES, NotFoundError,
} from '../src/registry.js';

describe('registry read layer', () => {
  it('loads the committed index', () => {
    const idx = loadIndex();
    expect(idx.themes.some((t) => t.id === 'tebin')).toBe(true);
  });

  it('loads a theme manifest', () => {
    const m = loadThemeManifest('tebin');
    expect(m.name).toBe('TEBIN');
    expect(m.assets.some((a) => a.id === 'logo-full')).toBe(true);
  });

  it('throws NotFoundError for an unknown manifest', () => {
    expect(() => loadThemeManifest('nope')).toThrow(NotFoundError);
  });

  it('reads each generated format', () => {
    expect(readFormat('tebin', 'css').content).toContain('--color-brand');
    expect(readFormat('tebin', 'tailwind').content).toContain('@theme');
    expect(readFormat('tebin', 'ts').content).toContain('export const tebin');
    expect(JSON.parse(readFormat('tebin', 'dtcg').content).color.brand.$value).toBe('#DA291C');
  });

  it('maps all four formats to filenames', () => {
    expect(FORMAT_FILES).toEqual({
      css: 'tokens.css', tailwind: 'tailwind.css', dtcg: 'tokens.dtcg.json', ts: 'theme.ts',
    });
  });

  it('reads an SVG asset as utf8 text and a png as base64', () => {
    const svg = readAssetFile('themes/tebin/assets/logo/logo-full.svg');
    expect(svg.encoding).toBe('utf8');
    expect(svg.content).toContain('<svg');
    const png = readAssetFile('themes/tebin/assets/favicon/favicon.png');
    expect(png.encoding).toBe('base64');
    expect(png.content.length).toBeGreaterThan(0);
  });

  it('throws NotFoundError for a missing asset file', () => {
    expect(() => readAssetFile('themes/tebin/assets/nope.svg')).toThrow(NotFoundError);
  });
});
