import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildIndex, keepGeneratedAt, type RegistryIndex } from '../src/index-builder.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themesRoot = join(root, 'themes');
const rawBaseUrl = 'https://raw.githubusercontent.com/4aykas/tebin-style/main';

const indexPath = join(root, 'registry', 'index.json');
const committed = existsSync(indexPath) ? (JSON.parse(readFileSync(indexPath, 'utf8')) as RegistryIndex) : undefined;
const index = keepGeneratedAt(buildIndex(themesRoot, { rawBaseUrl }), committed);
mkdirSync(join(root, 'registry'), { recursive: true });
writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
console.log(`wrote registry/index.json (${index.count} themes)`);
