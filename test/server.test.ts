import { describe, it, expect } from 'vitest';
import { createServer } from '../mcp/server.js';
import { toolDefinitions } from '../mcp/tools.js';

describe('mcp server', () => {
  it('constructs without throwing', () => {
    expect(() => createServer()).not.toThrow();
  });
  it('registers exactly the three known tools', () => {
    expect(toolDefinitions.map((t) => t.name)).toEqual(['list_themes', 'get_theme', 'get_asset']);
  });
});
