import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lintTheme, type LintResult } from './lint.js';

export interface GroupDiff { added: string[]; removed: string[]; modified: string[] }

export interface DiffResult {
  tokens: Record<string, GroupDiff>;
  findings: {
    before: LintResult['summary'];
    after: LintResult['summary'];
    delta: { errors: number; warnings: number };
    introduced: LintResult['findings'];
    resolved: LintResult['findings'];
    worsened: Array<{ before: LintResult['findings'][number]; after: LintResult['findings'][number] }>;
  };
  regression: boolean;
}

type Tree = Record<string, unknown>;
interface Leaf { $type?: string; $value?: unknown; $extensions?: unknown }

/** Object key order is not a design change; array order is. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [key, canonical(child)]));
  }
  return value;
}

/** `group.name` → serialised value, for every leaf in the tree. */
function flatten(tree: Tree, prefix: string[] = [], out = new Map<string, string>()): Map<string, string> {
  for (const [key, value] of Object.entries(tree)) {
    if (key.startsWith('$') || typeof value !== 'object' || value === null) continue;
    const leaf = value as Leaf;
    const path = [...prefix, key];
    if (leaf.$value !== undefined) out.set(path.join('.'), JSON.stringify(canonical({
      $type: leaf.$type, $value: leaf.$value, $extensions: leaf.$extensions,
    })));
    else flatten(value as Tree, path, out);
  }
  return out;
}

const groupOf = (path: string) => path.split('.')[0];

export function diffThemes(beforeDir: string, afterDir: string): DiffResult {
  const before = flatten(JSON.parse(readFileSync(join(beforeDir, 'tokens.json'), 'utf8')));
  const after = flatten(JSON.parse(readFileSync(join(afterDir, 'tokens.json'), 'utf8')));

  const tokens: Record<string, GroupDiff> = {};
  const groupFor = (path: string): GroupDiff =>
    (tokens[groupOf(path)] ??= { added: [], removed: [], modified: [] });

  for (const [path, value] of after) {
    if (!before.has(path)) groupFor(path).added.push(path);
    else if (before.get(path) !== value) groupFor(path).modified.push(path);
  }
  for (const path of before.keys()) {
    if (!after.has(path)) groupFor(path).removed.push(path);
  }
  for (const g of Object.values(tokens)) {
    g.added.sort(); g.removed.sort(); g.modified.sort();
  }

  const beforeLint = lintTheme(beforeDir);
  const afterLint = lintTheme(afterDir);
  const lintBefore = beforeLint.summary;
  const lintAfter = afterLint.summary;
  // Contrast text contains changing colours/ratios; identify that check by path.
  // Other diagnostics retain their message so distinct failures are not merged.
  const key = (f: LintResult['findings'][number]) => JSON.stringify([
    f.path, f.ratio !== undefined ? 'contrast' : f.message,
  ]);
  const failures = (lint: LintResult) => new Map(lint.findings
    .filter(f => f.severity !== 'info').map(f => [key(f), f]));
  const previous = failures(beforeLint);
  const current = failures(afterLint);
  const introduced = [...current].filter(([id]) => !previous.has(id)).map(([, f]) => f);
  const resolved = [...previous].filter(([id]) => !current.has(id)).map(([, f]) => f);
  const worsened: DiffResult['findings']['worsened'] = [];
  for (const [id, after] of current) {
    const before = previous.get(id);
    if (before && ((before.severity === 'warning' && after.severity === 'error') ||
      (before.ratio !== undefined && after.ratio !== undefined &&
        after.ratio / (after.required ?? 1) < before.ratio / (before.required ?? 1)))) {
      worsened.push({ before, after });
    }
  }

  return {
    tokens,
    findings: {
      before: lintBefore,
      after: lintAfter,
      introduced, resolved, worsened,
      delta: {
        errors: lintAfter.errors - lintBefore.errors,
        warnings: lintAfter.warnings - lintBefore.warnings,
      },
    },
    // Token removals and warnings are visible separately, not compatibility claims.
    regression: introduced.some(f => f.severity === 'error') ||
      worsened.some(f => f.after.severity === 'error'),
  };
}
