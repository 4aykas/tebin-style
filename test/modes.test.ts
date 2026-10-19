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
    expect(css).toContain(':root[data-theme="light"] {\n  color-scheme: light;\n  --role-surface: var(--color-day);');
  });
  it('gives Tailwind the mode block with the utility names, resolved', () => {
    const tw = read('tailwind.css');
    expect(tw).toMatch(/:root\[data-theme="light"\] \{[^}]*--color-role-surface: #f8fafc;/i);
  });
  it('sets color-scheme for the dark default and the light mode, in both files', () => {
    for (const file of ['tokens.css', 'tailwind.css']) {
      const css = read(file);
      expect(css, file).toContain(':root {\n  color-scheme: dark;\n}');
      expect(css, file).toContain(':root[data-theme="light"] {\n  color-scheme: light;');
    }
  });
});

describe('build with a mode that a component follows', () => {
  let dir: string;
  beforeAll(async () => {
    const t = structuredClone(tokens) as any;
    t.components = { button: { backgroundColor: color('{role.surface}') } };
    t.mode.highContrast = { role: { surface: color('#000000') } };
    dir = fixture('follows', t);
    await buildTheme(dir);
  });
  const read = (f: string) => readFileSync(join(dir, 'dist', f), 'utf8');

  it('redefines in Tailwind every token whose resolved value the mode changes', () => {
    expect(read('tailwind.css'))
      .toMatch(/:root\[data-theme="light"\] \{[^}]*--components-button-background-color: #f8fafc;/i);
  });
  it('names a camelCase mode\'s variables after the default token', () => {
    const css = read('tokens.css');
    // highContrast is as dark as the default, so it sets no scheme of its own.
    expect(css).toContain(':root[data-theme="highContrast"] {\n  --role-surface: #000000;');
    expect(css).not.toContain('---');
  });
});

describe('color-scheme without modes', () => {
  it('sets dark for a dark theme with one look, nothing for a light one', async () => {
    const dark = fixture('one-dark', { color: tokens.color, role: tokens.role });
    const light = fixture('one-light', { color: tokens.color, role: tokens.mode.light.role });
    await buildTheme(dark);
    await buildTheme(light);
    expect(readFileSync(join(dark, 'dist', 'tokens.css'), 'utf8')).toContain(':root {\n  color-scheme: dark;\n}');
    expect(readFileSync(join(light, 'dist', 'tokens.css'), 'utf8')).not.toContain('color-scheme');
  });
  it('warns for a one-look surface the scheme cannot be read from', () => {
    const t = { color: tokens.color, role: { ...tokens.role, surface: color('rgba(0, 0, 0, 0.9)') } };
    const warnings = lintTheme(fixture('one-translucent', t)).findings.filter((f) => f.severity === 'warning');
    expect(warnings.map((f) => f.path)).toContain('role.surface');
  });
});

describe('lint with a mode', () => {
  it('warns when a look\'s surface cannot give a color-scheme', () => {
    const t = structuredClone(tokens) as any;
    t.mode.light.role.surface = color('rgba(255, 255, 255, 0.9)');
    const warnings = lintTheme(fixture('no-scheme', t)).findings.filter((f) => f.severity === 'warning');
    expect(warnings.map((f) => f.path)).toContain('mode.light:role.surface');
  });
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
  it('reports a failure the mode does not change once, not once per mode', () => {
    const t = structuredClone(tokens) as any;
    t.components = { badge: { textColor: color('#777777'), backgroundColor: color('#888888') } };
    const errors = lintTheme(fixture('once', t)).findings.filter((f) => f.severity === 'error').map((f) => f.path);
    expect(errors).toEqual(['components.badge']);
  });
  it('measures a mode\'s valid value over a broken default, and warns the break once', () => {
    const t = structuredClone(tokens) as any;
    t.role['on-surface-muted'] = color('{color.missing}');
    t.mode.light.role['on-surface-muted'] = color('#334155');
    const findings = lintTheme(fixture('broken-default', t)).findings;
    expect(findings.find((f) => f.path === 'mode.light:role.on-surface-muted')?.ratio).toBeGreaterThan(4.5);
    expect(findings.filter((f) => f.severity === 'warning').map((f) => f.path)).toEqual(['role.on-surface-muted']);
  });
});

describe('shadcn with a mode', () => {
  it('fills light from the light mode and dark from the dark default', () => {
    const item = buildShadcnItem(fixture('shadcn', tokens))!;
    expect(item.cssVars.light.background).toBe('#F8FAFC');
    expect(item.cssVars.dark?.background).toBe('#0F172A');
  });
  it('takes destructive from the error role made for each look', () => {
    const t = structuredClone(tokens) as any;
    t.role['error-on-light'] = color('#B91C1C');
    t.role['error-on-dark'] = color('#F87171');
    const item = buildShadcnItem(fixture('destructive', t))!;
    expect(item.cssVars.light.destructive).toBe('#B91C1C');
    expect(item.cssVars.dark?.destructive).toBe('#F87171');
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
    expect(doc).toContain('| `shadow.sm` | `0px 1px 2px 0px rgba(0, 0, 0, 0.3)` |');
    expect(doc).not.toContain('[object Object]');
  });
  it('names Arial for Office only where a theme falls back to it', () => {
    expect(buildDesignDoc(join(root, 'themes', 'fleet'))).not.toContain('use **Arial**');
    expect(buildDesignDoc(join(root, 'themes', 'tebin-classic'))).toContain('use **Arial**');
  });
});
