import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => JSON.parse(readFileSync(join(root, '.claude-plugin', file), 'utf8'));
const marketplace = read('marketplace.json');
const plugin = read('plugin.json');

describe('Claude Code plugin', () => {
  it('is listed once in the tebin marketplace, from the repository root', () => {
    expect(marketplace.name).toBe('tebin');
    expect(marketplace.owner.name).toBeTruthy();
    expect(marketplace.plugins).toEqual([expect.objectContaining({ name: plugin.name, source: './' })]);
    expect(plugin.name).toBe('tebin-style');
  });

  it('omits version, so installs track the commit', () => {
    expect(plugin.version).toBeUndefined();
    expect(marketplace.plugins[0].version).toBeUndefined();
  });

  it('starts the bundled MCP server from the plugin root', () => {
    const { command, args } = plugin.mcpServers['tebin-style'];
    expect(command).toBe('node');
    expect(args).toEqual(['${CLAUDE_PLUGIN_ROOT}/mcp/dist/server.mjs']);
    expect(existsSync(join(root, args[0].replace('${CLAUDE_PLUGIN_ROOT}/', '')))).toBe(true);
    // A root .mcp.json would also load as project config, where the variable is unset.
    expect(existsSync(join(root, '.mcp.json'))).toBe(false);
  });

  it('finds each skill in the default skills/ directory', () => {
    const skills = readdirSync(join(root, 'skills'));
    expect(skills).toEqual(['tebin-style']);
    for (const id of skills) {
      const doc = readFileSync(join(root, 'skills', id, 'SKILL.md'), 'utf8');
      expect(doc).toMatch(new RegExp(`^---\\n[\\s\\S]*?^name: ${id}$`, 'm'));
    }
  });
});
