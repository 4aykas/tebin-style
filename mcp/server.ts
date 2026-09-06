import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { fileURLToPath } from 'node:url';
import { readFileSync, realpathSync, existsSync } from 'node:fs';
import { toolDefinitions } from './tools.js';

export function createServer(): McpServer {
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const server = new McpServer({ name: 'tebin-style', version });

  for (const def of toolDefinitions) {
    server.registerTool(
      def.name,
      { description: def.description, inputSchema: def.inputSchema,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
      async (args: unknown) => {
        try {
          const result = await def.handler(args);
          if (def.name === 'get_asset' && result && typeof result === 'object' &&
              'format' in result && result.format === 'png' && 'content' in result && typeof result.content === 'string') {
            const { content, ...metadata } = result;
            return { content: [
              { type: 'text' as const, text: JSON.stringify(metadata, null, 2) },
              { type: 'image' as const, data: content, mimeType: 'image/png' },
            ] };
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
