import { describe, it, expect } from 'vitest';
import { readFileSync, mkdtempSync, cpSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateThemeMetadata, validateTokens, validateThemeDir, svgHazards } from '../src/validate.js';

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
  it('rejects duplicate ids, traversal paths and mismatched formats before a build', () => {
    const asset = goodTheme.assets[0];
    expect(validateThemeMetadata({ ...goodTheme, assets: [asset, asset] }).errors.join(' ')).toContain('duplicate asset id');
    for (const path of ['../logo.svg', 'assets/../logo.svg', 'assets\\logo.svg', '/tmp/logo.svg']) {
      expect(validateThemeMetadata({ ...goodTheme, assets: [{ ...asset, path }] }).valid, path).toBe(false);
    }
    expect(validateThemeMetadata({ ...goodTheme, assets: [{ ...asset, format: 'png' }] }).valid).toBe(false);
  });
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
  it.each(['101/0/0/0', '0/999/0/0', '-1/0/0/0'])('rejects out-of-range CMYK %s', (cmyk) => {
    expect(validateTokens({ color: { brand: { $type: 'color', $value: '#DA291C',
      $extensions: { 'pro.tebin.print': { cmyk } } } } }).valid).toBe(false);
  });

  it('rejects null values', () => {
    expect(validateTokens({ color: { brand: { $type: 'color', $value: null } } }).valid).toBe(false);
  });

  it.each([
    { min: '..px', pref: '4vw', max: '38px' },
    { min: '40px', pref: '4vw', max: '38px' },
    { min: '1rem', pref: '4vw', max: '38px' },
    { min: '28px', pref: '4vw', max: '40px' },
  ])('rejects invalid or inconsistent fluid range %j', (fluid) => {
    expect(validateTokens({ type: { h1: { $type: 'dimension', $value: '38px',
      $extensions: { 'pro.tebin.fluid': fluid } } } }).valid).toBe(false);
  });

  it('accepts a fluid ceiling reference and rejects extensions on the wrong token type', () => {
    const tokens = { size: { max: { $type: 'dimension', $value: '38px' },
      title: { $type: 'dimension', $value: '{size.max}',
        $extensions: { 'pro.tebin.fluid': { min: '28px', pref: '4vw', max: '38px' } } } } };
    expect(validateTokens(tokens).valid).toBe(true);
    expect(validateTokens({ x: { $type: 'number', $value: 1,
      $extensions: { 'pro.tebin.print': { cmyk: '0/0/0/0' } } } }).valid).toBe(false);
  });
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

describe('svgHazards', () => {
  const wrap = (body: string): string => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${body}</svg>`;

  it.each([
    ['an image', '<image href="logo.png"/>'],
    ['a script', '<script>alert(1)</script>'],
    ['foreign content', '<foreignObject><div/></foreignObject>'],
    ['an http href', '<use href="https://example.com/a.svg#x"/>'],
    ['a file href', '<use xlink:href="file:///etc/passwd"/>'],
    ['an absolute path href', "<use href='/abs/path.svg#x'/>"],
  ])('flags %s', (_, body) => {
    expect(svgHazards(wrap(body))).not.toEqual([]);
  });

  it('flags a DOCTYPE or ENTITY declaration', () => {
    expect(svgHazards(`<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]>${wrap('')}`)).not.toEqual([]);
  });

  it('allows a #fragment reference', () => {
    expect(svgHazards(wrap('<defs><rect id="r"/></defs><use xlink:href="#r"/><use href="#r"/>'))).toEqual([]);
  });

  it('passes every shipped theme SVG', () => {
    for (const id of ['tebin', 'tebin-classic', 'slate']) {
      const theme = JSON.parse(readFileSync(join(root, 'themes', id, 'theme.json'), 'utf8'));
      for (const asset of theme.assets ?? []) {
        if (asset.format !== 'svg') continue;
        expect(svgHazards(readFileSync(join(root, 'themes', id, asset.path), 'utf8')), asset.path).toEqual([]);
      }
    }
  });
});

describe('validateThemeDir', () => {
  it('rejects a theme SVG that would load a local file when rendered', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'ts-validate-'));
    const work = join(tmp, 'tebin-classic');
    cpSync(join(root, 'themes', 'tebin-classic'), work, { recursive: true });
    try {
      expect(validateThemeDir(work).valid).toBe(true);
      writeFileSync(join(work, 'assets', 'logo', 'logo-full.svg'),
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><image href="/abs/path.png"/></svg>');
      expect(validateThemeDir(work).errors.join(' ')).toContain('logo-full');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
