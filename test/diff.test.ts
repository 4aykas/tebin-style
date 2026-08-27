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
