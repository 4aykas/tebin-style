import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateThemeMetadata, validateTokens } from '../src/validate.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

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

  it('accepts a print extension', () => {
    const withPrint = {
      color: {
        brand: {
          $type: 'color',
          $value: '#DA291C',
          $extensions: { 'pro.tebin.print': { pantone: '485 C', cmyk: '0/95/100/0' } },
        },
      },
    };
    expect(validateTokens(withPrint).valid).toBe(true);
  });

  it('rejects a CMYK that is not four slash-separated numbers', () => {
    const bad = {
      color: {
        brand: { $type: 'color', $value: '#DA291C', $extensions: { 'pro.tebin.print': { cmyk: '0.95.100.0' } } },
      },
    };
    expect(validateTokens(bad).valid).toBe(false);
  });

  it('rejects an unknown key inside the print extension', () => {
    const bad = {
      color: {
        brand: { $type: 'color', $value: '#DA291C', $extensions: { 'pro.tebin.print': { hks: '15' } } },
      },
    };
    expect(validateTokens(bad).valid).toBe(false);
  });
});

describe('tebin-classic print values', () => {
  const tokens = JSON.parse(readFileSync(join(root, 'themes', 'tebin-classic', 'tokens.json'), 'utf8'));

  it('carries the brand-book Pantone for red and grey', () => {
    expect(tokens.color.brand.$extensions['pro.tebin.print'].pantone).toBe('485 C');
    expect(tokens.color.grey.$extensions['pro.tebin.print'].pantone).toBe('423 C');
  });

  it('carries the brand-book CMYK for every colour the book prices', () => {
    const priced: Record<string, string> = {
      brand: '0/95/100/0',
      grey: '22/14/18/45',
      maroon: '23/97/54/8',
      brick: '24/85/81/57',
      salmon: '2/62/46/0',
      orange: '0/54/80/0',
      yellow: '2/13/84/0',
      teal: '58/10/21/0',
      'grey-light': '31/23/23/0',
      'grey-lighter': '19/15/15/0',
    };
    for (const [name, cmyk] of Object.entries(priced)) {
      expect(tokens.color[name].$extensions['pro.tebin.print'].cmyk, name).toBe(cmyk);
    }
  });

  it('leaves the two colours absent from the book without print values', () => {
    // ink and topbar were added by the theme author; the 2017 book does not price them.
    expect(tokens.color.ink.$extensions).toBeUndefined();
    expect(tokens.color.topbar.$extensions).toBeUndefined();
  });

  it('never invents a print value', () => {
    for (const [name, token] of Object.entries<Record<string, any>>(tokens.color)) {
      const print = token.$extensions?.['pro.tebin.print'];
      if (!print) continue;
      for (const key of Object.keys(print)) {
        expect(['pantone', 'cmyk'], `${name}.${key}`).toContain(key);
        expect(print[key], `${name}.${key} must not be empty`).toBeTruthy();
      }
    }
  });
});
