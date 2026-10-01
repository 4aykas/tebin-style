import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

// The stdio entry point, bundled to mcp/dist/server.mjs.
await createServer().connect(new StdioServerTransport());
console.error('tebin-style MCP server running on stdio');
