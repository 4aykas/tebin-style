import { describe, it, expect } from 'vitest';
import { validateRulesData } from '../src/validate.js';
import { diffRules } from '../src/check.js';
import { writeRulesDigest } from '../src/rules-build.js';
import { loadRules } from '../src/rules.js';

describe('validateRulesData', () => {
  it('accepts the seeded rules', () => {
    expect(validateRulesData(loadRules()).valid).toBe(true);
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
