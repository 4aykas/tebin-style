import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { fileURLToPath } from 'node:url';
import { readFileSync, realpathSync, existsSync } from 'node:fs';
import { toolDefinitions } from './tools.js';
import { REPO_ROOT } from '../src/registry.js';
import { join } from 'node:path';

type Asset = { assetId: string; format: string; rawUrl?: string; bytes: number; content?: string };

const MIME_TYPES: Record<string, string> = { svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon' };

/**
 * One asset as MCP content. A PNG comes as an image block and an asset that
 * was not inlined as a resource_link; both carry the metadata as text. SVG
 * stays one JSON text block, ready to embed.
 */
function assetBlocks(asset: Asset): CallToolResult['content'] {
  const { content, ...metadata } = asset;
  const text = { type: 'text' as const, text: JSON.stringify(metadata, null, 2) };
  if (content === undefined) {
    if (!asset.rawUrl) return [text];
    return [text, { type: 'resource_link', uri: asset.rawUrl, name: asset.assetId,
      mimeType: MIME_TYPES[asset.format], size: asset.bytes }];
  }
  if (asset.format === 'png') return [text, { type: 'image', data: content, mimeType: 'image/png' }];
  return [{ type: 'text', text: JSON.stringify(asset, null, 2) }];
}

export function createServer(): McpServer {
  const { version } = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'));
  const server = new McpServer({ name: 'tebin-style', version });

  for (const def of toolDefinitions) {
    server.registerTool(
      def.name,
      { description: def.description, inputSchema: def.inputSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
      async (args: unknown) => {
        try {
          const result = await def.handler(args);
          if (def.name === 'get_asset' && result && typeof result === 'object' && 'assetId' in result) {
            return { content: assetBlocks(result as Asset) };
          }
          return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
        } catch (err) {
          return {
            content: [{ type: 'text' as const, text: err instanceof Error ? err.message : String(err) }],
            isError: true,
          };
        }
      },
    );
  }

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('tebin-style MCP server running on stdio');
}

if (process.argv[1] && existsSync(process.argv[1]) &&
    realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    console.error('Fatal error in tebin-style MCP server:', error);
    process.exit(1);
  });
}
