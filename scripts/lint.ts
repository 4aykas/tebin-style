import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { lintTheme } from '../src/lint.js';
import { REPO_ROOT } from '../src/registry.js';

const themesDir = join(REPO_ROOT, 'themes');
let errors = 0;

for (const id of readdirSync(themesDir)) {
  const result = lintTheme(join(themesDir, id));
  const { errors: e, warnings: w, infos: i } = result.summary;
  errors += e;
  console.log(`${e === 0 ? '✓' : '✗'} ${id} — ${e} error(s), ${w} warning(s), ${i} checked or noted`);
  for (const f of result.findings) {
    if (f.severity === 'info' && f.ratio !== undefined) continue; // a pass needs no line
    console.log(`    [${f.severity}] ${f.path}: ${f.message}`);
  }
}

if (errors > 0) {
  console.error(`\n${errors} contrast error(s).`);
  process.exit(1);
}
console.log('\nNo contrast errors.');
