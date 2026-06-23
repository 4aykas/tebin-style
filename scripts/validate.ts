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
  const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
  const res = validateRulesData(rules);
  const ids = new Set<string>();
  let dup = false;
  if (Array.isArray(rules)) {
    for (const r of rules) {
      if (ids.has(r.id)) { dup = true; console.error(`✗ duplicate rule id: ${r.id}`); }
      ids.add(r.id);
    }
  }
  if (res.valid && !dup) {
    console.log('✓ rules');
  } else {
    failed = true;
    console.error('✗ rules');
    for (const e of res.errors) console.error(`    ${e}`);
  }
}

if (failed) process.exit(1);
console.log('All themes valid.');
