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
