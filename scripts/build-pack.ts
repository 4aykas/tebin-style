import { readdirSync, existsSync, mkdirSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const DIST_IN_PACK = ['tokens.css', 'tailwind.css', 'tokens.dtcg.json', 'theme.ts', 'colors.csv'];

/** Repo-relative paths that belong in the downloadable brand pack. */
export function packFileList(themesRoot: string): string[] {
  const files: string[] = [];
  const rel = (p: string) => relative(root, p).split('\\').join('/');

  for (const entry of readdirSync(themesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(themesRoot, entry.name);

    const doc = join(dir, 'DESIGN.md');
    if (existsSync(doc)) files.push(rel(doc));

    for (const f of DIST_IN_PACK) {
      const p = join(dir, 'dist', f);
      if (existsSync(p)) files.push(rel(p));
    }

    const walk = (sub: string): void => {
      if (!existsSync(sub)) return;
      for (const item of readdirSync(sub, { withFileTypes: true })) {
        const p = join(sub, item.name);
        if (item.isDirectory()) walk(p);
        else if (/\.(svg|png|ico)$/i.test(item.name)) files.push(rel(p));
      }
    };
    walk(join(dir, 'assets'));
    walk(join(dir, 'preview'));
  }

  files.push('rules/dist/rules.md', 'LICENSE', 'README.md');
  const examples = join(root, 'examples');
  const addExamples = (dir: string): void => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) addExamples(file);
      else if (/\.(md|html|docx|pptx)$/.test(entry.name)) files.push(rel(file));
    }
  };
  addExamples(examples);
  for (const file of readdirSync(join(root, 'docs', 'guide'))) {
    if (file.endsWith('.md')) files.push(`docs/guide/${file}`);
  }
  return files.filter((f) => !f.endsWith('manifest.json')).sort();
}

if (process.argv[2] === '--write') {
  const files = packFileList(join(root, 'themes'));
  mkdirSync(join(root, '.tmp'), { recursive: true });
  const out = join(root, '.tmp', 'tebin-brand-pack.zip');
  rmSync(out, { force: true });
  try {
    // `zip` is present on ubuntu-latest runners; -@ reads the file list from stdin.
    execFileSync('zip', ['-q', '-@', out], { cwd: root, input: files.join('\n') });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    // No zip CLI (Windows dev machine): stage the tree, then Compress-Archive it.
    const staging = mkdtempSync(join(root, '.tmp', 'brand-pack-'));
    try {
      for (const f of files) cpSync(join(root, f), join(staging, f));
      execFileSync('powershell.exe', [
        '-NoProfile', '-Command',
        'Compress-Archive -Path (Join-Path $env:TEBIN_PACK_STAGING "*") -DestinationPath $env:TEBIN_PACK_OUTPUT -Force',
      ], { env: { ...process.env, TEBIN_PACK_STAGING: staging, TEBIN_PACK_OUTPUT: out } });
    } finally {
      rmSync(staging, { recursive: true, force: true });
    }
  }
  console.log(`packed ${files.length} files into ${out}`);
}
