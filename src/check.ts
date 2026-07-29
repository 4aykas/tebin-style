import { mkdtempSync, readFileSync, existsSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { buildTheme } from './build.js';
import { buildColorsCsv } from './colors-csv.js';
import { buildPaletteSvg } from './palette-preview.js';
import { plannedOutputs, readManifest, sha256OfFile } from './raster.js';
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

/**
 * Staleness of the raster pack, without comparing PNG bytes: resvg output can
 * differ across versions and platforms, and a check that fails for its own
 * reasons stops being read. Regeneration is required exactly when a source SVG
 * or the size ladder changes.
 */
export function diffAssets(themeDir: string): string[] {
  const planned = plannedOutputs(themeDir);
  if (planned.length === 0) return [];

  const manifest = readManifest(themeDir);
  if (!manifest) return ['assets/png/manifest.json is missing'];

  const drift: string[] = [];
  const byPath = new Map(manifest.outputs.map((o) => [o.path, o]));

  for (const item of planned) {
    if (!byPath.has(item.path)) drift.push(`assets/png/manifest.json does not list ${item.path}`);
  }
  for (const out of manifest.outputs) {
    if (!planned.some((p) => p.path === out.path)) {
      drift.push(`assets/png/manifest.json lists ${out.path}, which the ladder no longer plans`);
    }
    const outAbs = join(themeDir, out.path);
    if (!existsSync(outAbs)) {
      drift.push(`${out.path} is missing`);
      continue;
    }
    const sourceAbs = join(themeDir, out.source);
    if (!existsSync(sourceAbs)) {
      drift.push(`${out.source} is missing`);
      continue;
    }
    if (sha256OfFile(sourceAbs) !== out.sourceSha256) {
      drift.push(`${out.source} changed since ${out.path} was generated`);
    }
  }
  return [...new Set(drift)];
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
    const committedCsvPath = join(themeDir, 'dist', 'colors.csv');
    const committedCsv = existsSync(committedCsvPath) ? readFileSync(committedCsvPath, 'utf8') : null;
    if (committedCsv !== buildColorsCsv(themeDir)) drift.push('dist/colors.csv');
    // Only the SVG is compared; palette.png is raster and follows the no-byte-compare rule.
    const committedSvgPath = join(themeDir, 'preview', 'palette.svg');
    const committedSvg = existsSync(committedSvgPath) ? readFileSync(committedSvgPath, 'utf8') : null;
    if (committedSvg !== buildPaletteSvg(themeDir)) drift.push('preview/palette.svg');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  return drift;
}
