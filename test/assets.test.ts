import { describe, it, expect } from 'vitest';
import { getAsset, getTheme } from '../mcp/tools.js';

describe('tebin brand assets', () => {
  it('serves the all-white logo (no brand red, no grey)', () => {
    const a = getAsset({ id: 'tebin', assetId: 'logo-full-white' });
    expect(a.type).toBe('logo');
    expect(a.format).toBe('svg');
    expect(a.content).toContain('#fff');
    expect(a.content).not.toContain('#808285');
    expect(a.content).not.toContain('#ee3124');
  });

  it('serves the solid red corner mark', () => {
    const a = getAsset({ id: 'tebin', assetId: 'corner-mark' });
    expect(a.type).toBe('pattern');
    expect(a.content).toContain('#ee3124');
  });

  it('serves the white corner mark (no brand red)', () => {
    const a = getAsset({ id: 'tebin', assetId: 'corner-mark-white' });
    expect(a.content).toContain('#fff');
    expect(a.content).not.toContain('#ee3124');
  });
});

describe('tebin-classic theme', () => {
  it('serves classic-colored tokens (guide red + grey)', () => {
    const t = getTheme({ id: 'tebin-classic', format: 'css' });
    expect(t.name).toBe('TEBIN Classic');
    expect(t.content).toContain('#da291c');
    expect(t.content).toContain('#898d8d');
  });

  it('serves the classic logo with guide red and grey', () => {
    const a = getAsset({ id: 'tebin-classic', assetId: 'logo-full' });
    expect(a.type).toBe('logo');
    expect(a.content).toContain('#DA291C');
    expect(a.content).toContain('#898D8D');
  });

  it('serves the classic white logo and corner marks', () => {
    expect(getAsset({ id: 'tebin-classic', assetId: 'logo-full-white' }).content).toContain('#fff');
    expect(getAsset({ id: 'tebin-classic', assetId: 'corner-mark' }).content).toContain('#DA291C');
    expect(getAsset({ id: 'tebin-classic', assetId: 'corner-mark-white' }).content).toContain('#fff');
  });
});
