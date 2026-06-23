import { describe, it, expect } from 'vitest';
import { createServer } from '../mcp/server.js';
import { toolDefinitions } from '../mcp/tools.js';

describe('mcp server', () => {
  it('constructs without throwing', () => {
    expect(() => createServer()).not.toThrow();
  });
  it('registers exactly the five known tools', () => {
    expect(toolDefinitions.map((t) => t.name)).toEqual([
      'list_themes', 'get_theme', 'get_asset', 'list_rules', 'get_rule',
    ]);
  });
});
