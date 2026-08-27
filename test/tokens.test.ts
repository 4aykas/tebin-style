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

  it('gives a status role to the themes that render state, not to the print theme', () => {
    expect(load('slate').role.error).toBeDefined();
    expect(load('tebin').role['error-on-light']).toBeDefined();
    expect(load('tebin-classic').role.error).toBeUndefined();
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

describe('the fluid extension contract', () => {
  it('rejects a triple that is missing a bound', async () => {
    const { validateTokens } = await import('../src/validate.js');
    const bad = {
      type: {
        h1: {
          $type: 'dimension',
          $value: '38px',
          $extensions: { 'pro.tebin.fluid': { min: '28px', max: '38px' } },
        },
      },
    };
    expect(validateTokens(bad).valid).toBe(false);
  });

  it('accepts a complete triple', async () => {
    const { validateTokens } = await import('../src/validate.js');
    const good = {
      type: {
        h1: {
          $type: 'dimension',
          $value: '38px',
          $extensions: { 'pro.tebin.fluid': { min: '28px', pref: '4.5vw', max: '38px' } },
        },
      },
    };
    expect(validateTokens(good).valid).toBe(true);
  });
});

describe('typography scale', () => {
  const tokens = load('tebin');

  it('has the five heading levels the site ships', () => {
    for (const level of ['h1', 'h2', 'h3', 'h4', 'h5']) {
      expect(tokens.type?.[level], level).toBeDefined();
    }
  });

  it('carries h1 as the real fluid triple, ceiling on $value', () => {
    expect(tokens.type.h1.$value).toBe('38px');
    expect(tokens.type.h1.$extensions['pro.tebin.fluid']).toEqual({
      min: '28px',
      pref: '4.5vw',
      max: '38px',
    });
  });

  it('descends monotonically', () => {
    const sizes = ['h1', 'h2', 'h3', 'h4', 'h5'].map((l) => parseFloat(tokens.type[l].$value));
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeLessThan(sizes[i - 1]);
  });

  it('carries body copy as a fixed size — it is not display type', () => {
    expect(tokens.type.body.$value).toBe('16px');
    expect(tokens.type.body.$extensions).toBeUndefined();
  });

  it('carries both leadings', () => {
    expect(tokens.lineHeight.heading.$value).toBe(1.35);
    expect(tokens.lineHeight.body.$value).toBe(1.7);
  });

  it('carries the heading weight', () => {
    expect(tokens.fontWeight.heading.$value).toBe(700);
  });

  it('says the ceiling is a ceiling, so nobody reads it as a fixed size', () => {
    expect(tokens.type.h1.$description).toContain('longest');
  });
});

describe('spacing and layout', () => {
  const tokens = load('tebin');

  it('carries the page gutter as a fluid value', () => {
    expect(tokens.spacing.gutter.$value).toBe('48px');
    expect(tokens.spacing.gutter.$extensions['pro.tebin.fluid'].pref).toBe('4vw');
  });

  it('carries the three section rhythms', () => {
    for (const step of ['section-compact', 'section-standard', 'section-feature']) {
      expect(tokens.spacing[step], step).toBeDefined();
    }
  });

  it('grows monotonically from compact to feature', () => {
    const steps = ['section-compact', 'section-standard', 'section-feature']
      .map((s) => parseFloat(tokens.spacing[s].$value));
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
  });

  it('carries the three container widths as fixed maxima', () => {
    expect(tokens.layout['container-default'].$value).toBe('1200px');
    expect(tokens.layout['container-wide'].$value).toBe('1400px');
    expect(tokens.layout['container-reading'].$value).toBe('760px');
  });
});

describe('status roles', () => {
  it('tebin carries all three statuses in both surface variants', () => {
    const { role } = load('tebin');
    for (const name of [
      'error-on-light', 'error-on-dark',
      'warning-on-light', 'warning-on-dark',
      'success-on-light', 'success-on-dark',
    ]) {
      expect(role[name]?.$value, name).toMatch(/^\{color\./);
    }
  });

  it('reuses the brand reds for error rather than adding a second red', () => {
    const { role, color } = load('tebin');
    expect(role['error-on-light'].$value).toBe('{color.brand-on-light}');
    expect(role['error-on-dark'].$value).toBe('{color.brand-on-dark}');
    const reds = Object.keys(color).filter((k) => k.startsWith('error'));
    expect(reds).toEqual([]);
  });

  it('slate carries one variant per status, because it has one surface family', () => {
    const { role } = load('slate');
    for (const name of ['error', 'warning', 'success']) {
      expect(role[name]?.$value, name).toMatch(/^\{color\./);
    }
    expect(role['error-on-dark']).toBeUndefined();
  });

  it('leaves the document theme alone — a printed page has no status state', () => {
    const { role } = load('tebin-classic');
    for (const name of ['error', 'warning', 'success', 'error-on-light']) {
      expect(role[name], name).toBeUndefined();
    }
  });

  it('records the measured ratio and the surface it was measured against', () => {
    const { color } = load('tebin');
    for (const name of ['warning-on-light', 'success-on-light']) {
      expect(color[name].$description, name).toContain('#EFEEE9');
    }
    for (const name of ['warning-on-dark', 'success-on-dark']) {
      expect(color[name].$description, name).toContain('#242830');
    }
  });
});
