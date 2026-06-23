import { describe, it, expect } from 'vitest';
import { buildRulesMarkdown } from '../src/rules-build.js';
import { loadRules } from '../src/rules.js';

describe('buildRulesMarkdown', () => {
  it('renders a grouped digest with severity badges', () => {
    const md = buildRulesMarkdown(loadRules());
    expect(md).toContain('# Design rules');
    expect(md).toContain('## forms');
    expect(md).toContain('**[MUST]**');
    expect(md).toContain('Loading buttons show a spinner');
  });
  it('omits the rationale dash when absent', () => {
    const md = buildRulesMarkdown([
      { id: 'x-y', category: 'misc', severity: 'MUST', statement: 'Do the thing.' },
    ]);
    expect(md).toContain('**[MUST]** Do the thing.\n');
    expect(md).not.toContain('— _');
  });
});
