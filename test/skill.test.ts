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

describe('SKILL.md carries no stale instruction', () => {
  const description = skill.match(/^---\n([\s\S]*?)\n---/)![1];

  it('names the real repository owner, not a placeholder', () => {
    expect(skill).not.toContain('OWNER');
    expect(skill).toContain('raw.githubusercontent.com/4aykas/tebin-style');
  });

  it('promises only token groups that exist', () => {
    expect(description).not.toContain('shadow');
    expect(description).toContain('spacing');
  });

  it('sends the agent to the self-contained design document', () => {
    expect(skill).toContain('DESIGN.md');
  });

  it('teaches the accessible red, so small text does not get the fill colour', () => {
    expect(skill).toContain('role.primary-on-dark');
    expect(skill).toContain('4.5:1');
  });

  it('does not duplicate the format table that references/formats.md owns', () => {
    expect(skill).toContain('references/formats.md');
    expect(skill).not.toContain('| `tokens.css` |');
  });
});

describe('the skill routes status colours correctly', () => {
  it('sends errors to role.error, not to the signal red', () => {
    expect(skill).toContain('role.error-*');
    expect(skill).toContain('An error is not the signal red');
  });
});
