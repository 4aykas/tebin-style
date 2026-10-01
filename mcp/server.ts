import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFileSync } from 'node:fs';
import { toolDefinitions } from './tools.js';
import { REPO_ROOT } from '../src/registry.js';
import { join } from 'node:path';

/** Routing hints for hosts that search tools rather than list them all. */
const INSTRUCTIONS = [
  'TEBIN brand kits and design rules, served from local files.',
  'Start with get_theme format design-md for the whole design guide: tebin is the modern web identity, tebin-classic the print and document one.',
  'Scope list_rules by theme and medium. Fetch logos with get_asset; check a theme with lint_theme.',
].join('\n');

export function createServer(): McpServer {
  const { version } = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'));
  const server = new McpServer(
    { name: 'tebin-style', title: 'TEBIN Style', version, websiteUrl: 'https://github.com/4aykas/tebin-style' },
    { instructions: INSTRUCTIONS },
  );
  // The SDK turns a thrown error into an isError result carrying its message.
  for (const { name, handler, ...config } of toolDefinitions) server.registerTool(name, config, handler);
  return server;
}
