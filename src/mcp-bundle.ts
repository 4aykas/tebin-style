import { writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { build } from 'esbuild';
import { REPO_ROOT } from './registry.js';

export const MCP_BUNDLE = join(REPO_ROOT, 'mcp', 'dist', 'server.mjs');

/** One self-contained file: the server needs only Node 22 and the repo's data files. */
export async function buildMcpBundle(): Promise<string> {
  const { outputFiles } = await build({
    entryPoints: [join(REPO_ROOT, 'mcp', 'stdio.ts')],
    absWorkingDir: REPO_ROOT,
    bundle: true, platform: 'node', format: 'esm', target: 'node22',
    banner: { js: '// Generated from mcp/stdio.ts by `pnpm build:mcp` — do not edit.' },
    write: false, logLevel: 'warning',
  });
  // esbuild labels modules by their real path. node_modules may be a link to
  // another disk; write it as node_modules/ so every machine gets the same bytes.
  const real = relative(REPO_ROOT, realpathSync(join(REPO_ROOT, 'node_modules'))).replaceAll('\\', '/');
  return outputFiles[0]!.text.replaceAll(`${real}/`, 'node_modules/');
}

export async function writeMcpBundle(): Promise<string> {
  const js = await buildMcpBundle();
  mkdirSync(dirname(MCP_BUNDLE), { recursive: true });
  writeFileSync(MCP_BUNDLE, js);
  return js;
}
