import { mkdtempSync, readFileSync, existsSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { buildTheme } from './build.js';
import { REPO_ROOT } from './registry.js';
import { loadRules } from './rules.js';
import { buildRulesMarkdown } from './rules-build.js';

const DIST_FILES = ['tokens.css', 'tailwind.css', 'tokens.dtcg.json', 'theme.ts'];

export function diffRules(): string[] {
  const committedPath = join(REPO_ROOT, 'rules', 'dist', 'rules.md');
  const committed = existsSync(committedPath) ? readFileSync(committedPath, 'utf8') : '';
  const fresh = buildRulesMarkdown(loadRules());
  return committed === fresh ? [] : ['rules/dist/rules.md'];
}

export async function diffTheme(themeDir: string): Promise<string[]> {
  const drift: string[] = [];
  const tmp = mkdtempSync(join(tmpdir(), 'ts-diff-'));
  const work = join(tmp, basename(themeDir));
  cpSync(themeDir, work, { recursive: true });
  rmSync(join(work, 'dist'), { recursive: true, force: true });

  try {
    await buildTheme(work);
    for (const f of DIST_FILES) {
      const committed = join(themeDir, 'dist', f);
      const fresh = join(work, 'dist', f);
      const a = existsSync(committed) ? readFileSync(committed, 'utf8') : null;
      const b = existsSync(fresh) ? readFileSync(fresh, 'utf8') : null;
      if (a !== b) drift.push(`dist/${f}`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  return drift;
}
