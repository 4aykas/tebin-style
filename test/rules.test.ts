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
  it('exposes exactly the three brand-category rules', () => {
    const ids = filterRules({ category: 'brand' }).map((r) => r.id).sort();
    expect(ids).toEqual([
      'brand-corner-mark-decorative',
      'brand-logo-no-color-on-dark',
      'brand-logo-white-on-dark',
    ]);
  });

  it('assigns the expected severities', () => {
    expect(getRule('brand-logo-white-on-dark').severity).toBe('MUST');
    expect(getRule('brand-logo-no-color-on-dark').severity).toBe('NEVER');
    expect(getRule('brand-corner-mark-decorative').severity).toBe('SHOULD');
  });
});
