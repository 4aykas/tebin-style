import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { diffThemes } from '../src/diff.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'ts-diff-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

const THEME = { id: 'x', name: 'X', version: '1.0.0', license: { tokens: 'MIT', assets: 'X' }, surfaces: { light: '#FFFFFF' } };

function make(name: string, tokens: unknown): string {
  const dir = join(tmp, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'theme.json'), JSON.stringify(THEME));
  writeFileSync(join(dir, 'tokens.json'), JSON.stringify(tokens));
  return dir;
}

const ok = {
  color: { paper: { $type: 'color', $value: '#FFFFFF' }, ink: { $type: 'color', $value: '#111111' } },
  role: { surface: { $type: 'color', $value: '{color.paper}' }, 'on-surface': { $type: 'color', $value: '{color.ink}' } },
};

describe('diffThemes', () => {
  const withRoles = (first: string, second: string) => ({ ...ok, role: {
    ...ok.role, 'on-surface': { $type: 'color', $value: first },
    'on-surface-muted': { $type: 'color', $value: second },
  } });

  it('detects a replacement failure even when error totals are unchanged', () => {
    const d = diffThemes(make('swap-a', withRoles('#CCCCCC', '#111111')),
      make('swap-b', withRoles('#111111', '#CCCCCC')));
    expect(d.findings.delta.errors).toBe(0);
    expect(d.regression).toBe(true);
    expect(d.findings.introduced.map(f => f.path)).toEqual(['role.on-surface-muted']);
    expect(d.findings.resolved.map(f => f.path)).toEqual(['role.on-surface']);
  });

  it('detects worsening existing contrast and ignores an improvement that still fails', () => {
    const a = make('worse-a', withRoles('#AAAAAA', '#111111'));
    const b = make('worse-b', withRoles('#CCCCCC', '#111111'));
    expect(diffThemes(a, b).findings.worsened).toHaveLength(1);
    expect(diffThemes(a, b).regression).toBe(true);
    expect(diffThemes(b, a).regression).toBe(false);
    expect(diffThemes(a, a).findings.introduced).toEqual([]);
  });

  it('exposes new broken references separately from contrast regressions', () => {
    const d = diffThemes(make('ref-a', ok), make('ref-b', { ...ok,
      spacing: { bad: { $type: 'dimension', $value: '{spacing.missing}' } },
    }));
    expect(d.findings.introduced.some(f => f.path === 'spacing.bad')).toBe(true);
    expect(d.regression).toBe(false);
  });
  it('detects changed fluid ranges, print references and types even with the same value', () => {
    const a = make('metadata-a', { ...ok,
      type: { h1: { $type: 'dimension', $value: '38px', $extensions: { 'pro.tebin.fluid': { min: '28px', pref: '4vw', max: '38px' } } } },
      extra: { x: { $type: 'number', $value: 1 }, red: { $type: 'color', $value: '#DA291C', $extensions: { 'pro.tebin.print': { pantone: '485 C' } } } },
    });
    const b = make('metadata-b', { ...ok,
      type: { h1: { $type: 'dimension', $value: '38px', $extensions: { 'pro.tebin.fluid': { min: '20px', pref: '4vw', max: '38px' } } } },
      extra: { x: { $type: 'fontWeight', $value: 1 }, red: { $type: 'color', $value: '#DA291C', $extensions: { 'pro.tebin.print': { pantone: '485 U' } } } },
    });
    const diff = diffThemes(a, b);
    expect(diff.tokens.type.modified).toEqual(['type.h1']);
    expect(diff.tokens.extra.modified).toEqual(['extra.red', 'extra.x']);
  });

  it('ignores object order and prose-only changes', () => {
    const a = make('order-a', { ...ok, x: { a: { $type: 'shadow', $value: { color: '#000000', blur: '2px' }, $description: 'Before' } } });
    const b = make('order-b', { ...ok, x: { a: { $value: { blur: '2px', color: '#000000' }, $type: 'shadow', $description: 'After' } } });
    expect(diffThemes(a, b).tokens).toEqual({});
  });
  it('reports nothing when a theme is compared with itself', () => {
    const a = make('same-a', ok);
    const b = join(tmp, 'same-b');
    cpSync(a, b, { recursive: true });
    const d = diffThemes(a, b);
    expect(Object.values(d.tokens).every((g) => !g.added.length && !g.removed.length && !g.modified.length)).toBe(true);
    expect(d.regression).toBe(false);
  });

  it('separates added, modified and removed by group', () => {
    const a = make('base', ok);
    const b = make('changed', {
      color: { paper: { $type: 'color', $value: '#FAFAFA' }, accent: { $type: 'color', $value: '#0000FF' } },
      role: { surface: { $type: 'color', $value: '{color.paper}' } },
    });
    const d = diffThemes(a, b);
    expect(d.tokens.color.added).toEqual(['color.accent']);
    expect(d.tokens.color.modified).toEqual(['color.paper']);
    expect(d.tokens.color.removed).toEqual(['color.ink']);
    expect(d.tokens.role.removed).toEqual(['role.on-surface']);
  });

  it('calls a new contrast error a regression', () => {
    const a = make('good', ok);
    const b = make('bad', {
      color: { paper: { $type: 'color', $value: '#FFFFFF' }, ink: { $type: 'color', $value: '#CCCCCC' } },
      role: { surface: { $type: 'color', $value: '{color.paper}' }, 'on-surface': { $type: 'color', $value: '{color.ink}' } },
    });
    const d = diffThemes(a, b);
    expect(d.findings.delta.errors).toBe(1);
    expect(d.regression).toBe(true);
  });

  it('does not call a removal a regression — dropping a token is often the point', () => {
    const a = make('full', ok);
    const b = make('trimmed', {
      color: { paper: { $type: 'color', $value: '#FFFFFF' } },
      role: { surface: { $type: 'color', $value: '{color.paper}' } },
    });
    const d = diffThemes(a, b);
    expect(d.tokens.role.removed).toEqual(['role.on-surface']);
    expect(d.regression).toBe(false);
  });

  it('runs on a real theme against itself', () => {
    const d = diffThemes(join(root, 'themes', 'tebin'), join(root, 'themes', 'tebin'));
    expect(d.regression).toBe(false);
    expect(d.findings.after.errors).toBe(0);
  });
});
