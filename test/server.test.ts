import { describe, it, expect } from 'vitest';
import { createServer } from '../mcp/server.js';
import { toolDefinitions, MAX_INLINE_BYTES } from '../mcp/tools.js';
import { loadIndex } from '../src/registry.js';
import { loadRules } from '../src/rules.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Runs fn against a fresh server over an in-memory link. */
async function withClient(fn: (client: Client) => Promise<void>): Promise<void> {
  const server = createServer();
  const client = new Client({ name: 'test', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    await fn(client);
  } finally {
    await client.close();
    await server.close();
  }
}

const text = (result: Awaited<ReturnType<Client['callTool']>>) =>
  (result.content as Array<{ text?: string }>).map((b) => b.text ?? '').join('\n');

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

  it('gives every tool a title and every parameter a description, with enums from the data', () => withClient(async (client) => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => [t.name, t.title, Object.keys(t.inputSchema.properties ?? {})])).toEqual([
      ['list_themes', 'List themes', ['industry', 'mood', 'query']],
      ['get_theme', 'Get theme', ['id', 'format']],
      ['get_asset', 'Get brand asset', ['id', 'assetId']],
      ['list_rules', 'List design rules', ['theme', 'medium', 'category', 'severity', 'tag', 'query']],
      ['lint_theme', 'Lint theme', ['id']],
      ['diff_themes', 'Compare themes', ['a', 'b']],
      ['get_rule', 'Get design rule', ['id']],
    ]);
    const themeIds = loadIndex().themes.map((t) => t.id).sort();
    const categories = [...new Set(loadRules().map((r) => r.category))].sort();
    for (const tool of tools) {
      expect(tool.description, tool.name).toBeTruthy();
      expect(tool.inputSchema.additionalProperties, tool.name).toBe(false);
      const props = tool.inputSchema.properties as Record<string, { description?: string; enum?: string[] }>;
      for (const [key, prop] of Object.entries(props)) {
        expect(prop.description, `${tool.name}.${key}`).toBeTruthy();
        if (['theme', 'a', 'b'].includes(key) || (key === 'id' && tool.name !== 'get_rule')) {
          expect(prop.enum, `${tool.name}.${key}`).toEqual(themeIds);
        }
      }
    }
    const listRules = tools.find((t) => t.name === 'list_rules')!.inputSchema.properties as Record<string, { enum?: string[] }>;
    expect(listRules.category?.enum).toEqual(categories);
    expect(client.getServerVersion()?.title).toBe('TEBIN Style');
    expect(client.getInstructions()).toContain('design-md');
  }));

  it('names the valid values when a value is unknown, in one line', () => withClient(async (client) => {
    const cases: Array<[string, Record<string, unknown>, string]> = [
      ['get_theme', { id: 'nope' }, 'tebin-classic'],
      ['list_rules', { category: 'nonexistent' }, 'typography'],
      ['get_rule', { id: 'nope' }, 'forms-loading-button'],
      ['get_asset', { id: 'tebin', assetId: 'nope' }, 'logo-full'],
      ['list_themes', { bogus: 1 }, 'bogus'],
    ];
    for (const [name, args, expected] of cases) {
      const result = await client.callTool({ name, arguments: args });
      expect(result.isError, name).toBe(true);
      expect(text(result), name).toContain(expected);
      expect(text(result), name).not.toContain('\n');
    }
    const empty = await client.callTool({ name: 'list_themes', arguments: { query: 'no such theme' } });
    expect(text(empty)).toContain('tebin-classic');
  }));

  it('keeps every get_asset response under the inline cap, linking larger files', async () => {
    const server = createServer();
    const client = new Client({ name: 'test', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      for (const theme of loadIndex().themes) {
        for (const asset of theme.assets) {
          const { content } = await client.callTool({ name: 'get_asset', arguments: { id: theme.id, assetId: asset.id } });
          const blocks = content as Array<{ type: string; text?: string; data?: string; uri?: string }>;
          const bytes = blocks.reduce((sum, b) => sum +
            (b.type === 'image' ? Buffer.from(b.data ?? '', 'base64').length : Buffer.byteLength(b.text ?? '')), 0);
          expect(bytes, `${theme.id}/${asset.id}`).toBeLessThanOrEqual(MAX_INLINE_BYTES);
          if (asset.bytes > MAX_INLINE_BYTES) {
            expect(blocks).toContainEqual(expect.objectContaining({ type: 'resource_link', uri: asset.rawUrl, size: asset.bytes }));
          }
        }
      }
    } finally {
      await client.close();
      await server.close();
    }
  });

  it('runs the committed bundle with only Node and the data files', async () => {
    // A copy with no node_modules proves the bundle is self-contained.
    const dir = mkdtempSync(join(tmpdir(), 'tebin-mcp-'));
    for (const path of ['package.json', 'registry', 'rules/rules.json', 'mcp/dist/server.mjs']) {
      cpSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), join(dir, path), { recursive: true });
    }
    const client = new Client({ name: 'stdio-test', version: '1.0.0' });
    const transport = new StdioClientTransport({
      command: process.execPath, args: [join(dir, 'mcp', 'dist', 'server.mjs')], cwd: tmpdir(), stderr: 'pipe',
    });
    try {
      await client.connect(transport);
      const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
      expect(client.getServerVersion()?.version).toBe(pkg.version);
      const result = await client.callTool({ name: 'list_themes', arguments: { query: 'print' } });
      expect(result.isError).not.toBe(true);
      expect(JSON.stringify(result.content)).toContain('tebin-classic');
    } finally {
      await client.close();
      await transport.close();
      rmSync(dir, { recursive: true, force: true });
    }
  }, 15000);
});
