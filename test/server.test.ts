import { describe, it, expect } from 'vitest';
import { createServer } from '../mcp/server.js';
import { toolDefinitions } from '../mcp/tools.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

describe('mcp server', () => {
  it('constructs without throwing', () => {
    expect(() => createServer()).not.toThrow();
  });
  it('registers exactly the seven known tools', () => {
    expect(toolDefinitions.map((t) => t.name)).toEqual([
      'list_themes', 'get_theme', 'get_asset', 'list_rules',
      'lint_theme', 'diff_themes', 'get_rule',
    ]);
  });

  it('negotiates the package version and returns native PNG content and useful errors', async () => {
    const server = createServer();
    const client = new Client({ name: 'test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
      expect(client.getServerVersion()?.version).toBe(pkg.version);
      const { tools } = await client.listTools();
      expect(tools).toHaveLength(7);
      expect(tools.every((t) => t.annotations?.readOnlyHint === true && t.annotations.openWorldHint === false)).toBe(true);
      const png = await client.callTool({ name: 'get_asset', arguments: { id: 'tebin-classic', assetId: 'logo-full@512' } });
      expect(png.content).toEqual([
        expect.objectContaining({ type: 'text', text: expect.stringContaining('© TEBIN') }),
        expect.objectContaining({ type: 'image', mimeType: 'image/png', data: expect.stringMatching(/^iVBOR/) }),
      ]);
      const csv = await client.callTool({ name: 'get_theme', arguments: { id: 'tebin-classic', format: 'colors-csv' } });
      expect(csv.isError).not.toBe(true);
      expect(JSON.stringify(csv.content)).toContain('485 C');
      const invalid = await client.callTool({ name: 'get_theme', arguments: { id: '../tebin' } });
      expect(invalid.isError).toBe(true);
      const missing = await client.callTool({ name: 'get_asset', arguments: { id: 'tebin', assetId: 'missing' } });
      expect(missing.isError).toBe(true);
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('starts over stdio from a different working directory', async () => {
    const client = new Client({ name: 'stdio-test', version: '1.0.0' });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [createRequire(import.meta.url).resolve('tsx/cli'), fileURLToPath(new URL('../mcp/server.ts', import.meta.url))],
      cwd: tmpdir(), stderr: 'pipe',
    });
    try {
      await client.connect(transport);
      const result = await client.callTool({ name: 'list_themes', arguments: { query: 'print' } });
      expect(result.isError).not.toBe(true);
      expect(JSON.stringify(result.content)).toContain('tebin-classic');
    } finally {
      await client.close();
      await transport.close();
    }
  }, 15000);
});
