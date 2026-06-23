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
