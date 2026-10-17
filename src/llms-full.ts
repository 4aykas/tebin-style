import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { byCodepoint } from './raster.js';
import { REPO_ROOT } from './registry.js';
import { loadRules } from './rules.js';
import { buildRulesMarkdown } from './rules-build.js';

export const LLMS_FULL = join(REPO_ROOT, 'llms-full.txt');

/**
 * llms.txt followed by every theme's DESIGN.md and the full rule set, so an
 * agent gets the whole registry in one fetch. Built from the committed
 * DESIGN.md files, so it runs after they are written.
 */
export function buildLlmsFull(root = REPO_ROOT): string {
  const parts = [readFileSync(join(root, 'llms.txt'), 'utf8').trimEnd()];
  const themesRoot = join(root, 'themes');
  const ids = readdirSync(themesRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(themesRoot, e.name, 'DESIGN.md')))
    .map((e) => e.name)
    .sort(byCodepoint);
  for (const id of ids) {
    parts.push(`<!-- themes/${id}/DESIGN.md -->\n\n${readFileSync(join(themesRoot, id, 'DESIGN.md'), 'utf8').trimEnd()}`);
  }
  parts.push(`<!-- rules/dist/rules.md -->\n\n${buildRulesMarkdown(loadRules()).trimEnd()}`);
  return parts.join('\n\n---\n\n') + '\n';
}

export function writeLlmsFull(): string {
  const text = buildLlmsFull();
  writeFileSync(LLMS_FULL, text);
  return text;
}
