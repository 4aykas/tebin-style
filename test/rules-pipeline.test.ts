import { describe, it, expect } from 'vitest';
import { validateRulesData } from '../src/validate.js';
import { diffRules } from '../src/check.js';
import { writeRulesDigest } from '../src/rules-build.js';
import { loadRules } from '../src/rules.js';

describe('validateRulesData', () => {
  it('accepts the seeded rules', () => {
    expect(validateRulesData(loadRules()).valid).toBe(true);
  });
  it('rejects duplicate ids through the shared validation API', () => {
    const rule = loadRules()[0];
    expect(validateRulesData([rule, rule]).errors).toContain(`duplicate rule id: ${rule.id}`);
  });
  it('rejects an empty or unknown medium scope', () => {
    expect(validateRulesData([{ ...loadRules()[0], media: [] }]).valid).toBe(false);
    expect(validateRulesData([{ ...loadRules()[0], media: ['vr'] }]).valid).toBe(false);
  });
  it('rejects a misspelled theme scope when the registry ids are supplied', () => {
    expect(validateRulesData([{ ...loadRules()[0], themes: ['tebn'] }], ['tebin']).errors.join(' '))
      .toContain('unknown theme tebn');
  });
  it('rejects a rule with an invalid severity', () => {
    expect(validateRulesData([{ id: 'x-y', category: 'misc', severity: 'MAYBE', statement: 'x' }]).valid).toBe(false);
  });
  it('rejects a rule missing statement', () => {
    expect(validateRulesData([{ id: 'x-y', category: 'misc', severity: 'MUST' }]).valid).toBe(false);
  });
});

describe('diffRules', () => {
  it('reports no drift after a fresh digest write', () => {
    writeRulesDigest();
    expect(diffRules()).toEqual([]);
  });
});
