import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateThemeDir, validateRulesData } from '../src/validate.js';

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

const rulesPath = join(root, 'rules', 'rules.json');
if (existsSync(rulesPath)) {
  try {
    const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
    const res = validateRulesData(rules, [...seen]);
    if (res.valid) console.log('✓ rules');
    else {
      failed = true;
      console.error('✗ rules');
      for (const e of res.errors) console.error(`    ${e}`);
    }
  } catch (error) {
    failed = true;
    console.error(`✗ rules/rules.json: ${error instanceof Error ? error.message : String(error)}`);
  }
} else {
  failed = true;
  console.error('✗ rules/rules.json is missing');
}

if (failed) process.exit(1);
console.log('All themes valid.');
