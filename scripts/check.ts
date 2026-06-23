import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { diffTheme } from '../src/check.js';
import { buildIndex } from '../src/index-builder.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesRoot = join(root, 'themes');
let failed = false;

if (existsSync(themesRoot)) {
  for (const entry of readdirSync(themesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const drift = await diffTheme(join(themesRoot, entry.name));
    if (drift.length) {
      failed = true;
      console.error(`✗ ${entry.name} drift: ${drift.join(', ')}`);
    } else {
      console.log(`✓ ${entry.name}`);
    }
  }

  // index drift
  const committedPath = join(root, 'registry', 'index.json');
  const committed = existsSync(committedPath) ? readFileSync(committedPath, 'utf8') : '';
  const fresh =
    JSON.stringify(
      buildIndex(themesRoot, { rawBaseUrl: 'https://raw.githubusercontent.com/4aykas/tebin-style/main' }),
      null,
      2,
    ) + '\n';
  // Compare ignoring the volatile generatedAt date.
  const strip = (s: string) => s.replace(/"generatedAt": "[^"]*"/, '"generatedAt": "X"');
  if (strip(committed) !== strip(fresh)) {
    failed = true;
    console.error('✗ registry/index.json is out of date — run `pnpm build`');
  } else {
    console.log('✓ registry/index.json');
  }
}

if (failed) process.exit(1);
console.log('No drift.');
