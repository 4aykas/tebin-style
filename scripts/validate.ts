import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateThemeDir } from '../src/validate.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesRoot = join(root, 'themes');

let failed = false;
const seen = new Set<string>();

if (existsSync(themesRoot)) {
  for (const entry of readdirSync(themesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(themesRoot, entry.name);
    const result = validateThemeDir(dir);
    if (seen.has(entry.name)) { console.error(`✗ duplicate theme id: ${entry.name}`); failed = true; }
    seen.add(entry.name);
    if (result.valid) {
      console.log(`✓ ${entry.name}`);
    } else {
      failed = true;
      console.error(`✗ ${entry.name}`);
      for (const e of result.errors) console.error(`    ${e}`);
    }
  }
} else {
  console.log('no themes/ directory yet');
}

if (failed) process.exit(1);
console.log('All themes valid.');
