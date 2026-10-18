import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GENERATED_PATHS } from '../src/check.js';
import { FORMAT_FILES, loadIndex } from '../src/registry.js';
import { toolDefinitions } from '../mcp/tools.js';

// Lists that documents repeat from the code. Each test names the code as the
// source and fails the document that fell behind it.

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

/** A `themes/*` / `**` glob as a regex over repo-relative paths. */
function globToRegex(glob: string): RegExp {
  const body = glob.split('**').map((part) =>
    part.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')).join('.*');
  return new RegExp(`^${body}$`);
}

describe('generated paths', () => {
  it('AGENTS.md and the developer guide list every generated path', () => {
    for (const doc of ['AGENTS.md', 'docs/guide/developers.md']) {
      const text = read(doc);
      for (const path of GENERATED_PATHS) expect(text, `${doc} lacks ${path}`).toContain(`\`${path}\``);
    }
  });

  it('covers every file pnpm check reports as stale', () => {
    const script = read('scripts/check.ts');
    const reported = [...script.matchAll(/✗ ([\w./-]+) is out of date/g)].map((m) => m[1]!);
    expect(reported.length).toBeGreaterThan(2);
    for (const path of reported) {
      expect(GENERATED_PATHS.some((g) => globToRegex(g).test(path)), `${path} is not in GENERATED_PATHS`).toBe(true);
    }
  });
});

describe('theme formats', () => {
  it('the agent guide lists every get_theme format', () => {
    const row = read('docs/guide/ai-agents.md').split('\n').find((l) => l.startsWith('| `get_theme`')) ?? '';
    for (const format of Object.keys(FORMAT_FILES)) expect(row, format).toContain(`\`${format}\``);
  });

  it('the skill names every format file', () => {
    const skill = read('skills/tebin-style/SKILL.md') + read('skills/tebin-style/references/formats.md');
    for (const file of Object.values(FORMAT_FILES)) expect(skill, file).toContain(file);
  });
});

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

describe('themes', () => {
  const ids = loadIndex().themes.map((t) => t.id);

  it('llms.txt counts every theme and gives each a bullet', () => {
    const text = read('llms.txt');
    const match = /(\w+) themes ship here/.exec(text);
    expect(match, 'llms.txt has no "<N> themes ship here" line').not.toBeNull();
    expect(match![1]!.toLowerCase()).toBe(WORDS[ids.length]);
    for (const id of ids) expect(text, id).toContain(`- **${id}** — `);
  });
});

describe('MCP tools', () => {
  const names = toolDefinitions.map((t) => t.name);

  it('llms.txt counts and names every tool', () => {
    const match = /(\w+) read-only tools: ([^\n]+)/.exec(read('llms.txt'));
    expect(match, 'llms.txt has no "<N> read-only tools:" line').not.toBeNull();
    expect(match![1]!.toLowerCase()).toBe(WORDS[names.length]);
    for (const name of names) expect(match![2], name).toContain(`\`${name}\``);
  });

  it('the agent guide has a row for every tool', () => {
    const guide = read('docs/guide/ai-agents.md');
    for (const name of names) expect(guide, name).toContain(`| \`${name}\` |`);
  });
});
