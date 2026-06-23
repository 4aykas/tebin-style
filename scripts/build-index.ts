import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildIndex } from '../src/index-builder.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesRoot = join(root, 'themes');
const rawBaseUrl = 'https://raw.githubusercontent.com/4aykas/tebin-style/main';

const index = buildIndex(themesRoot, { rawBaseUrl });
mkdirSync(join(root, 'registry'), { recursive: true });
writeFileSync(join(root, 'registry', 'index.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`wrote registry/index.json (${index.count} themes)`);
