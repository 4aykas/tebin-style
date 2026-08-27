import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (id: string) =>
  JSON.parse(readFileSync(join(root, 'themes', id, 'tokens.json'), 'utf8'));

describe('accessible brand text colours', () => {
  const tokens = load('tebin');

  it('carries a red that clears AA on dark surfaces', () => {
    expect(tokens.color['brand-on-dark'].$value).toBe('#EA6359');
  });

  it('carries a red that clears AA on light surfaces', () => {
    expect(tokens.color['brand-on-light'].$value).toBe('#C7251A');
  });

  it('names the surface each was measured against', () => {
    expect(tokens.color['brand-on-dark'].$description).toContain('#242830');
    expect(tokens.color['brand-on-light'].$description).toContain('#EFEEE9');
  });

  it('says the identity red is still the one for fills and large text', () => {
    expect(tokens.color['brand-on-dark'].$description).toContain('fills');
    expect(tokens.color['brand-on-dark'].$description).toContain('large text');
  });

  it('invents no print values for them', () => {
    expect(tokens.color['brand-on-dark'].$extensions).toBeUndefined();
    expect(tokens.color['brand-on-light'].$extensions).toBeUndefined();
  });

  it('does not copy them into the print theme, where they were never measured', () => {
    const classic = load('tebin-classic');
    expect(classic.color['brand-on-dark']).toBeUndefined();
    expect(classic.color['brand-on-light']).toBeUndefined();
  });
});

describe('semantic roles', () => {
  const THEMES = ['tebin', 'tebin-classic', 'slate'];

  for (const id of THEMES) {
    it(`${id} maps the three roles every theme can honour`, () => {
      const { role } = load(id);
      for (const name of ['primary', 'surface', 'on-surface']) {
        expect(role?.[name]?.$value, `${id}.${name}`).toMatch(/^\{[a-z-]+\.[a-z0-9-]+\}$/);
      }
    });

    it(`${id} states no role as a literal — a role is a pointer, not a copy`, () => {
      for (const [name, leaf] of Object.entries(load(id).role as Record<string, { $value: string }>)) {
        expect(leaf.$value, `${id}.${name}`).not.toMatch(/^#/);
      }
    });
  }

  it('separates the red that fills from the red that can be read', () => {
    const { role } = load('tebin');
    expect(role.primary.$value).toBe('{color.brand}');
    expect(role['primary-on-dark'].$value).toBe('{color.brand-on-dark}');
    expect(role['primary-on-light'].$value).toBe('{color.brand-on-light}');
  });

  it('invents no error role, because no theme has an error colour', () => {
    for (const id of THEMES) expect(load(id).role.error).toBeUndefined();
  });

  it('maps outline only where a colour is documented as a hairline', () => {
    expect(load('tebin').role.outline.$value).toBe('{color.rule}');
    expect(load('slate').role.outline.$value).toBe('{color.rule}');
    expect(load('tebin-classic').role.outline).toBeUndefined();
  });

  it('keeps roles out of the spreadsheet, which lists real colours only', async () => {
    const { collectColorRows } = await import('../src/colors-csv.js');
    const rows = collectColorRows(join(root, 'themes', 'tebin'));
    expect(rows.some((r) => r.token.startsWith('role.'))).toBe(false);
  });
});
