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
  };
  regression: boolean;
}

type Tree = Record<string, unknown>;
interface Leaf { $type?: string; $value?: unknown }

/** `group.name` → serialised value, for every leaf in the tree. */
function flatten(tree: Tree, prefix: string[] = [], out = new Map<string, string>()): Map<string, string> {
  for (const [key, value] of Object.entries(tree)) {
    if (key.startsWith('$') || typeof value !== 'object' || value === null) continue;
    const leaf = value as Leaf;
    const path = [...prefix, key];
    if (leaf.$value !== undefined) out.set(path.join('.'), JSON.stringify(leaf.$value));
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

  const lintBefore = lintTheme(beforeDir).summary;
  const lintAfter = lintTheme(afterDir).summary;

  return {
    tokens,
    findings: {
      before: lintBefore,
      after: lintAfter,
      delta: {
        errors: lintAfter.errors - lintBefore.errors,
        warnings: lintAfter.warnings - lintBefore.warnings,
      },
    },
    // Narrow on purpose. A removed token may be the whole point of the change,
    // and a changed value usually is. Only new contrast errors are a regression,
    // because a broad definition that fires on every edit gets ignored.
    regression: lintAfter.errors > lintBefore.errors,
  };
}
