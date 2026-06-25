import { describe, it, expect } from 'vitest';
import { loadRules, getRule, filterRules } from '../src/rules.js';
import { NotFoundError } from '../src/registry.js';

describe('rules read layer', () => {
  it('loads seeded rules', () => {
    const rules = loadRules();
    expect(rules.length).toBeGreaterThan(10);
    expect(rules.some((r) => r.id === 'forms-loading-button')).toBe(true);
  });
  it('gets a rule by id', () => {
    expect(getRule('forms-loading-button').severity).toBe('MUST');
  });
  it('throws NotFoundError for an unknown rule', () => {
    expect(() => getRule('nope')).toThrow(NotFoundError);
  });
  it('filters by category', () => {
    const forms = filterRules({ category: 'forms' });
    expect(forms.length).toBeGreaterThan(0);
    expect(forms.every((r) => r.category === 'forms')).toBe(true);
  });
  it('filters by severity', () => {
    expect(filterRules({ severity: 'NEVER' }).every((r) => r.severity === 'NEVER')).toBe(true);
  });
  it('filters by tag and query', () => {
    expect(filterRules({ tag: 'keyboard' }).length).toBeGreaterThan(0);
    expect(filterRules({ query: 'spinner' }).some((r) => r.id === 'forms-loading-button')).toBe(true);
  });
});

describe('brand logo rules', () => {
  it('exposes the full brand-category rule set', () => {
    const ids = filterRules({ category: 'brand' }).map((r) => r.id).sort();
    expect(ids).toEqual([
      'brand-corner-mark-decorative',
      'brand-font-roboto-arial',
      'brand-logo-no-color-on-dark',
      'brand-logo-no-distort',
      'brand-logo-no-recolor',
      'brand-logo-no-shadow',
      'brand-logo-safezone',
      'brand-logo-white-on-dark',
      'brand-logo-white-rectangle-on-busy',
    ]);
  });

  it('assigns the expected severities', () => {
    expect(getRule('brand-logo-white-on-dark').severity).toBe('MUST');
    expect(getRule('brand-logo-no-color-on-dark').severity).toBe('NEVER');
    expect(getRule('brand-corner-mark-decorative').severity).toBe('SHOULD');
    expect(getRule('brand-logo-safezone').severity).toBe('MUST');
    expect(getRule('brand-logo-no-distort').severity).toBe('NEVER');
    expect(getRule('brand-logo-no-shadow').severity).toBe('NEVER');
    expect(getRule('brand-logo-no-recolor').severity).toBe('NEVER');
    expect(getRule('brand-logo-white-rectangle-on-busy').severity).toBe('SHOULD');
    expect(getRule('brand-font-roboto-arial').severity).toBe('SHOULD');
  });
});
