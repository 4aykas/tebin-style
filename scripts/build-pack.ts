import { readdirSync, existsSync, mkdirSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const DIST_IN_PACK = ['tokens.css', 'tailwind.css', 'tokens.dtcg.json', 'theme.ts', 'colors.csv'];

const rel = (p: string) => relative(root, p).split('\\').join('/');

/** Repo-relative paths of the files under dir whose name matches re. */
function filesUnder(dir: string, re: RegExp): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((item) => !item.isDirectory() && re.test(item.name))
    .map((item) => rel(join(item.parentPath, item.name)));
}

/** Repo-relative paths that belong in the downloadable brand pack. */
export function packFileList(themesRoot: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(themesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(themesRoot, entry.name);

    const doc = join(dir, 'DESIGN.md');
    if (existsSync(doc)) files.push(rel(doc));

    for (const f of DIST_IN_PACK) {
      const p = join(dir, 'dist', f);
      if (existsSync(p)) files.push(rel(p));
    }

    for (const sub of ['assets', 'preview']) files.push(...filesUnder(join(dir, sub), /\.(svg|png|ico)$/i));
  }

  // The agent files travel too, so README links resolve and an offline agent has llms.txt.
  files.push('rules/dist/rules.md', 'LICENSE', 'README.md', 'llms.txt', 'registry/index.json');
  files.push(...skillFileList().map((f) => `skills/${f}`));
  files.push(...filesUnder(join(root, 'examples'), /\.(md|html|docx|pptx)$/));
  for (const file of readdirSync(join(root, 'docs', 'guide'))) {
    if (file.endsWith('.md')) files.push(`docs/guide/${file}`);
  }
  return files.filter((f) => !f.endsWith('manifest.json')).sort();
}

/** The skill folder, relative to skills/: the shape claude.ai expects in an uploaded ZIP. */
export function skillFileList(): string[] {
  return filesUnder(join(root, 'skills', 'tebin-style'), /./).map((f) => f.slice('skills/'.length)).sort();
}

/** Zip `files`, given relative to `cwd`, into `.tmp/<name>`. */
function writeZip(cwd: string, files: string[], name: string): void {
  mkdirSync(join(root, '.tmp'), { recursive: true });
  const out = join(root, '.tmp', name);
  rmSync(out, { force: true });
  try {
    // `zip` is present on ubuntu-latest runners; -@ reads the file list from stdin.
    execFileSync('zip', ['-q', '-@', out], { cwd, input: files.join('\n') });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    // No zip CLI (Windows dev machine): stage the tree, then Compress-Archive it.
    const staging = mkdtempSync(join(root, '.tmp', 'pack-'));
    try {
      for (const f of files) cpSync(join(cwd, f), join(staging, f));
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

if (process.argv[2] === '--write') {
  writeZip(root, packFileList(join(root, 'themes')), 'tebin-brand-pack.zip');
  writeZip(join(root, 'skills'), skillFileList(), 'tebin-style-skill.zip');
}
