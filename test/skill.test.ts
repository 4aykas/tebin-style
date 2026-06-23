import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const skill = readFileSync(join(here, '..', 'skill', 'tebin-style', 'SKILL.md'), 'utf8');

describe('SKILL.md', () => {
  it('has YAML frontmatter with name and description', () => {
    const m = skill.match(/^---\n([\s\S]*?)\n---/);
    expect(m).toBeTruthy();
    expect(m![1]).toContain('name: tebin-style');
    expect(m![1]).toContain('description:');
  });
  it('documents the discover→apply workflow', () => {
    expect(skill).toContain('registry/index.json');
    expect(skill.toLowerCase()).toContain('discover');
  });
});
