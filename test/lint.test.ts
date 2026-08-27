import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { lintTheme } from '../src/lint.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'ts-lint-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

function fixture(name: string, theme: unknown, tokens: unknown): string {
  const dir = join(tmp, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'theme.json'), JSON.stringify(theme));
  writeFileSync(join(dir, 'tokens.json'), JSON.stringify(tokens));
  return dir;
}

const base = { id: 'x', name: 'X', version: '1.0.0', license: { tokens: 'MIT', assets: 'X' } };

describe('lintTheme', () => {
  it('warns on a reference that resolves to nothing', () => {
    const dir = fixture('broken', { ...base, surfaces: { light: '#FFFFFF' } }, {
      color: { paper: { $type: 'color', $value: '#FFFFFF' } },
      role: { surface: { $type: 'color', $value: '{color.nope}' } },
    });
    const r = lintTheme(dir);
    const f = r.findings.find((x) => x.path === 'role.surface');
    expect(f?.severity).toBe('warning');
    expect(f?.message).toMatch(/does not resolve/);
  });

  it('errors when a text role falls under the floor, and shows the arithmetic', () => {
    const dir = fixture('lowcontrast', { ...base, surfaces: { light: '#FFFFFF' } }, {
      color: { paper: { $type: 'color', $value: '#FFFFFF' }, faint: { $type: 'color', $value: '#BBBBBB' } },
      role: { surface: { $type: 'color', $value: '{color.paper}' }, 'on-surface': { $type: 'color', $value: '{color.faint}' } },
    });
    const r = lintTheme(dir);
    const f = r.findings.find((x) => x.path === 'role.on-surface');
    expect(f?.severity).toBe('error');
    expect(f?.required).toBe(4.5);
    expect(f?.ratio).toBeLessThan(4.5);
    expect(f?.message).toContain('#FFFFFF');
    expect(r.summary.errors).toBe(1);
  });

  it('says out loud what it could not pair, instead of skipping it', () => {
    const dir = fixture('unpairable', { ...base, surfaces: { light: '#FFFFFF' } }, {
      color: { paper: { $type: 'color', $value: '#FFFFFF' }, x: { $type: 'color', $value: '#123456' } },
      role: { surface: { $type: 'color', $value: '{color.paper}' }, decorative: { $type: 'color', $value: '{color.x}' } },
    });
    const f = lintTheme(dir).findings.find((x) => x.path === 'role.decorative');
    expect(f?.severity).toBe('info');
    expect(f?.message).toContain('not checked');
  });

  it('does not pretend to measure a translucent colour', () => {
    const dir = fixture('alpha', { ...base, surfaces: { light: '#FFFFFF' } }, {
      color: { paper: { $type: 'color', $value: '#FFFFFF' }, veil: { $type: 'color', $value: 'rgba(0,0,0,0.5)' } },
      role: { surface: { $type: 'color', $value: '{color.paper}' }, 'on-surface': { $type: 'color', $value: '{color.veil}' } },
    });
    const f = lintTheme(dir).findings.find((x) => x.path === 'role.on-surface');
    expect(f?.severity).toBe('info');
    expect(f?.message).toContain('not an opaque colour');
  });

  it('warns when a theme uses -on-dark roles without declaring a dark surface', () => {
    const dir = fixture('nodark', { ...base, surfaces: { light: '#FFFFFF' } }, {
      color: { paper: { $type: 'color', $value: '#FFFFFF' }, hi: { $type: 'color', $value: '#EA6359' } },
      role: { surface: { $type: 'color', $value: '{color.paper}' }, 'primary-on-dark': { $type: 'color', $value: '{color.hi}' } },
    });
    const r = lintTheme(dir);
    expect(r.findings.some((x) => x.severity === 'warning' && /dark surface/.test(x.message))).toBe(true);
  });

  it('warns when the manifest declares no surfaces at all', () => {
    const dir = fixture('nosurfaces', base, { color: { a: { $type: 'color', $value: '#000000' } } });
    expect(lintTheme(dir).findings.some((x) => x.severity === 'warning' && /surfaces/.test(x.message))).toBe(true);
  });

  it('passes every theme this repository ships', () => {
    for (const id of ['tebin', 'tebin-classic', 'slate']) {
      const r = lintTheme(join(root, 'themes', id));
      expect(r.summary.errors, `${id}: ${JSON.stringify(r.findings.filter((f) => f.severity === 'error'))}`).toBe(0);
    }
  });

  it('actually checks something on the real themes — a silent pass is not a pass', () => {
    const r = lintTheme(join(root, 'themes', 'tebin'));
    const checked = r.findings.filter((f) => typeof f.ratio === 'number');
    expect(checked.length).toBeGreaterThan(4);
  });
});

describe('lintTheme on components', () => {
  const THEME = { ...base, surfaces: { light: '#FFFFFF' } };

  it('errors when a label cannot be read on its own button', () => {
    const dir = fixture('badbutton', THEME, {
      color: { paper: { $type: 'color', $value: '#FFFFFF' }, mid: { $type: 'color', $value: '#999999' } },
      role: { surface: { $type: 'color', $value: '{color.paper}' } },
      components: {
        'button-primary': {
          backgroundColor: { $type: 'color', $value: '{color.mid}' },
          textColor: { $type: 'color', $value: '{color.paper}' },
        },
      },
    });
    const f = lintTheme(dir).findings.find((x) => x.path === 'components.button-primary');
    expect(f?.severity).toBe('error');
    expect(f?.message).toContain('label');
  });

  it('lets a variant inherit the half it does not override', () => {
    const dir = fixture('variant', THEME, {
      color: { paper: { $type: 'color', $value: '#FFFFFF' }, ink: { $type: 'color', $value: '#111111' }, mid: { $type: 'color', $value: '#999999' } },
      role: { surface: { $type: 'color', $value: '{color.paper}' } },
      components: {
        'button-primary': {
          backgroundColor: { $type: 'color', $value: '{color.ink}' },
          textColor: { $type: 'color', $value: '{color.paper}' },
        },
        'button-primary-hover': { backgroundColor: { $type: 'color', $value: '{color.mid}' } },
      },
    });
    const f = lintTheme(dir).findings.find((x) => x.path === 'components.button-primary-hover');
    // The hover state states no textColor; it takes the base one, and that pair
    // is what a reader actually sees.
    expect(f?.ratio).toBeDefined();
    expect(f?.severity).toBe('error');
  });

  it('checks every component the tebin theme ships', () => {
    const r = lintTheme(join(root, 'themes', 'tebin'));
    const checked = r.findings.filter((f) => f.path.startsWith('components.') && f.ratio !== undefined);
    expect(checked.length).toBe(8);
    expect(r.summary.errors).toBe(0);
  });
});
