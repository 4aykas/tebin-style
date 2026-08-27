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
      'brand-logo-never-typeset',
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
    expect(getRule('brand-logo-never-typeset').severity).toBe('NEVER');
  });
});

describe('post-audit rules (2026-07-29)', () => {
  const NEW_IDS = [
    'typography-heading-word-break',
    'typography-body-wrap',
    'typography-display-multilingual',
    'typography-negative-tracking',
    'typography-manual-line-breaks',
    'typography-heading-scale',
    'performance-webfont-policy',
    'theming-policy-enforced',
  ];

  it('carries all eight', () => {
    const ids = loadRules().map((r) => r.id);
    for (const id of NEW_IDS) {
      expect(ids, id).toContain(id);
    }
  });

  it('has 63 rules with unique ids', () => {
    const rules = loadRules();
    expect(rules).toHaveLength(63);
    expect(new Set(rules.map((r) => r.id)).size).toBe(63);
  });

  it('opens a typography category of seven', () => {
    expect(filterRules({ category: 'typography' })).toHaveLength(7);
  });

  it('states the heading rule as a NEVER and names the shy escape hatch', () => {
    const rule = getRule('typography-heading-word-break');
    expect(rule.severity).toBe('NEVER');
    expect(rule.statement).toContain('&shy;');
  });
});

describe('rules that point at tokens', () => {
  it('the heading-scale rule names the token group that now carries the scale', () => {
    const rule = filterRules({ category: 'typography' }).find((r) => /scale/.test(r.statement));
    expect(rule).toBeDefined();
    expect(rule!.statement).toContain('type.h1');
  });

  it('names the supported way to shape a heading, not only the forbidden ones', () => {
    const rule = getRule('typography-heading-balance');
    expect(rule.severity).toBe('SHOULD');
    expect(rule.statement).toContain('text-wrap: balance');
  });
});
