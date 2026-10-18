import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildTheme } from '../src/build.js';
import { lintTheme } from '../src/lint.js';
import { buildShadcnItem } from '../src/shadcn.js';
import { buildDesignDoc } from '../src/design-doc.js';
import { tokensForMode, modeNames, baseTokens } from '../src/tokens.js';

// A theme's default look lives in its ordinary groups; `mode.<name>` repeats a
// token's path with that mode's value.

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'ts-modes-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const color = (v: string) => ({ $type: 'color', $value: v });
const tokens = {
  color: { night: color('#0F172A'), day: color('#F8FAFC'), ink: color('#F1F5F9'), coal: color('#0F172A') },
  role: { surface: color('{color.night}'), 'on-surface': color('{color.ink}') },
  mode: { light: { role: { surface: color('{color.day}'), 'on-surface': color('{color.coal}') } } },
};
const theme = { id: 'm', name: 'M', version: '1.0.0', media: ['web'], license: { tokens: 'MIT', assets: 'MIT' },
  surfaces: { light: '#F8FAFC', dark: '#0F172A' } };

function fixture(name: string, t: unknown): string {
  const dir = join(tmp, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'theme.json'), JSON.stringify({ ...theme, id: name }));
  writeFileSync(join(dir, 'tokens.json'), JSON.stringify(t));
  return dir;
}

describe('mode helpers', () => {
  it('lays a mode over the default and drops the mode group', () => {
    expect(modeNames(tokens)).toEqual(['light']);
    expect(baseTokens(tokens)).not.toHaveProperty('mode');
    const light = tokensForMode(tokens, 'light') as typeof tokens;
    expect(light.role.surface.$value).toBe('{color.day}');
    expect(light.color.night.$value).toBe('#0F172A');
    expect(light).not.toHaveProperty('mode');
  });
});

describe('build with a mode', () => {
  let dir: string;
  beforeAll(async () => {
    dir = fixture('built', tokens);
    await buildTheme(dir);
  });
  const read = (f: string) => readFileSync(join(dir, 'dist', f), 'utf8');

  it('keeps the default in :root and adds one block per mode', () => {
    const css = read('tokens.css');
    expect(css).not.toContain('--mode-');
    expect(css).toContain(':root[data-theme="light"] {\n  --role-surface: var(--color-day);');
  });
  it('gives Tailwind the mode block with the utility names, resolved', () => {
    const tw = read('tailwind.css');
    expect(tw).toMatch(/:root\[data-theme="light"\] \{[^}]*--color-role-surface: #f8fafc;/i);
  });
});

describe('lint with a mode', () => {
  it('measures contrast in every mode, prefixed', () => {
    const r = lintTheme(fixture('measured', tokens));
    expect(r.findings.find((f) => f.path === 'role.on-surface')?.ratio).toBeGreaterThan(4.5);
    expect(r.findings.find((f) => f.path === 'mode.light:role.on-surface')?.ratio).toBeGreaterThan(4.5);
  });
  it('fails a mode whose text drops below 4.5:1, and an override with no default', () => {
    const bad = structuredClone(tokens) as any;
    bad.mode.light.role['on-surface'] = color('#94A3B8');
    bad.mode.light.role.ghost = color('#000000');
    const errors = lintTheme(fixture('bad', bad)).findings.filter((f) => f.severity === 'error').map((f) => f.path);
    expect(errors).toContain('mode.light:role.on-surface');
    expect(errors).toContain('mode.light.role.ghost');
  });
});

describe('shadcn with a mode', () => {
  it('fills light from the light mode and dark from the dark default', () => {
    const item = buildShadcnItem(fixture('shadcn', tokens))!;
    expect(item.cssVars.light.background).toBe('#F8FAFC');
    expect(item.cssVars.dark?.background).toBe('#0F172A');
  });
  it('fills dark for fleet and leaves it out for tebin', () => {
    expect(buildShadcnItem(join(root, 'themes', 'fleet'))!.cssVars.dark?.primary).toBe('#4ADE80');
    expect(buildShadcnItem(join(root, 'themes', 'tebin'))!.cssVars.dark).toBeUndefined();
  });
});

describe('DESIGN.md with a mode', () => {
  it('fleet gets a Modes section with each override against its default', () => {
    const doc = buildDesignDoc(join(root, 'themes', 'fleet'));
    expect(doc).toContain('## Modes');
    expect(doc).toContain('| `role.surface` | `#0F172A` | `#F8FAFC` |');
  });
  it('names Arial for Office only where a theme falls back to it', () => {
    expect(buildDesignDoc(join(root, 'themes', 'fleet'))).not.toContain('use **Arial**');
    expect(buildDesignDoc(join(root, 'themes', 'tebin-classic'))).toContain('use **Arial**');
  });
});
