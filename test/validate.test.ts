import { describe, it, expect } from 'vitest';
import { validateThemeMetadata, validateTokens } from '../src/validate.js';

const goodTheme = {
  id: 'tebin', name: 'TEBIN', version: '1.0.0',
  license: { tokens: 'MIT', assets: '© TEBIN' },
  assets: [{ id: 'logo-full', type: 'logo', format: 'svg', path: 'assets/logo/logo-full.svg' }],
};

const goodTokens = {
  color: { brand: { $type: 'color', $value: '#DA291C' } },
  font: { sans: { $type: 'fontFamily', $value: ['Roboto', 'sans-serif'] } },
};

describe('validateThemeMetadata', () => {
  it('accepts a well-formed theme', () => {
    expect(validateThemeMetadata(goodTheme).valid).toBe(true);
  });
  it('rejects a non-kebab id', () => {
    expect(validateThemeMetadata({ ...goodTheme, id: 'TeBin' }).valid).toBe(false);
  });
  it('rejects an unknown asset type', () => {
    const bad = { ...goodTheme, assets: [{ id: 'x', type: 'banner', format: 'svg', path: 'a.svg' }] };
    expect(validateThemeMetadata(bad).valid).toBe(false);
  });
  it('rejects a missing version', () => {
    const { version, ...noVersion } = goodTheme;
    expect(validateThemeMetadata(noVersion).valid).toBe(false);
  });
});

describe('validateTokens', () => {
  it('accepts well-formed DTCG tokens', () => {
    expect(validateTokens(goodTokens).valid).toBe(true);
  });
  it('rejects a leaf missing $value', () => {
    const bad = { color: { brand: { $type: 'color' } } };
    expect(validateTokens(bad).valid).toBe(false);
  });
});
