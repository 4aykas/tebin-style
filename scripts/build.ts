import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildTheme } from '../src/build.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesRoot = join(root, 'themes');

if (!existsSync(themesRoot)) {
  console.log('no themes/ directory yet — nothing to build');
  process.exit(0);
}

for (const entry of readdirSync(themesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  await buildTheme(join(themesRoot, entry.name));
  console.log(`built ${entry.name}`);
}
