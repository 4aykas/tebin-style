import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildTheme } from '../src/build.js';

let dir: string;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'ts-build-'));
  mkdirSync(join(dir, 'sample'), { recursive: true });
  const tokens = {
    color: { brand: { $type: 'color', $value: '#DA291C' } },
    font: { sans: { $type: 'fontFamily', $value: ['Roboto', 'sans-serif'] } },
    radius: { card: { $type: 'dimension', $value: '8px' } },
  };
  writeFileSync(join(dir, 'sample', 'tokens.json'), JSON.stringify(tokens));
  await buildTheme(join(dir, 'sample'));
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const read = (f: string) => readFileSync(join(dir, 'sample', 'dist', f), 'utf8');

describe('buildTheme', () => {
  it('writes CSS variables (hex lowercased by the css transform)', () => {
    const css = read('tokens.css');
    expect(css).toContain(':root');
    expect(css).toContain('--color-brand: #da291c;');
  });
  it('writes a Tailwind @theme block', () => {
    const tw = read('tailwind.css');
    expect(tw).toContain('@theme {');
    expect(tw).toContain('--color-brand: #da291c;');
  });
  it('writes normalized DTCG JSON', () => {
    const dtcg = JSON.parse(read('tokens.dtcg.json'));
    expect(dtcg.color.brand.$value).toBe('#DA291C');
    expect(dtcg.font.sans.$value).toEqual(['Roboto', 'sans-serif']);
  });
  it('writes a typed TS object', () => {
    const ts = read('theme.ts');
    expect(ts).toContain('export const sample =');
    expect(ts).toContain('"brand": "#DA291C"');
    expect(ts).toContain('as const');
    expect(ts).toContain('export type SampleTheme');
  });
});

describe('aliases', () => {
  let aliasDir: string;

  beforeAll(async () => {
    aliasDir = mkdtempSync(join(tmpdir(), 'ts-alias-'));
    mkdirSync(join(aliasDir, 'aliased'), { recursive: true });
    writeFileSync(
      join(aliasDir, 'aliased', 'tokens.json'),
      JSON.stringify({
        color: { brand: { $type: 'color', $value: '#DA291C' } },
        role: { primary: { $type: 'color', $value: '{color.brand}' } },
      }),
    );
    await buildTheme(join(aliasDir, 'aliased'));
  });

  afterAll(() => rmSync(aliasDir, { recursive: true, force: true }));

  const readAlias = (f: string) => readFileSync(join(aliasDir, 'aliased', 'dist', f), 'utf8');

  it('keeps the reference in CSS so a role follows its colour', () => {
    expect(readAlias('tokens.css')).toContain('--role-primary: var(--color-brand);');
  });

  it('keeps the reference in the DTCG export, where an alias is a first-class value', () => {
    expect(JSON.parse(readAlias('tokens.dtcg.json')).role.primary.$value).toBe('{color.brand}');
  });

  it('resolves the reference in the TS export, where a consumer wants a colour', () => {
    expect(readAlias('theme.ts')).toContain('"primary": "#DA291C"');
  });
});

describe('fluid dimensions', () => {
  let fluidDir: string;

  beforeAll(async () => {
    fluidDir = mkdtempSync(join(tmpdir(), 'ts-fluid-'));
    mkdirSync(join(fluidDir, 'fluid'), { recursive: true });
    writeFileSync(
      join(fluidDir, 'fluid', 'tokens.json'),
      JSON.stringify({
        type: {
          h1: {
            $type: 'dimension',
            $value: '38px',
            $extensions: { 'pro.tebin.fluid': { min: '28px', pref: '4.5vw', max: '38px' } },
          },
        },
        radius: { card: { $type: 'dimension', $value: '8px' } },
      }),
    );
    await buildTheme(join(fluidDir, 'fluid'));
  });

  afterAll(() => rmSync(fluidDir, { recursive: true, force: true }));

  const readFluid = (f: string) => readFileSync(join(fluidDir, 'fluid', 'dist', f), 'utf8');

  it('composes clamp() in CSS', () => {
    expect(readFluid('tokens.css')).toContain('--type-h1: clamp(28px, 4.5vw, 38px);');
  });

  it('composes clamp() in the Tailwind theme too', () => {
    expect(readFluid('tailwind.css')).toContain('--type-h1: clamp(28px, 4.5vw, 38px);');
  });

  it('leaves a plain dimension alone', () => {
    expect(readFluid('tokens.css')).toContain('--radius-card: 8px;');
  });

  it('exports the ceiling, not the clamp, where the spec expects a Dimension', () => {
    expect(JSON.parse(readFluid('tokens.dtcg.json')).type.h1.$value).toBe('38px');
    expect(readFluid('theme.ts')).toContain('"h1": "38px"');
  });
});
