import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './registry.js';
import { loadRules, type Rule } from './rules.js';

export function buildRulesMarkdown(rules: Rule[]): string {
  const byCategory = new Map<string, Rule[]>();
  for (const rule of rules) {
    const list = byCategory.get(rule.category) ?? [];
    list.push(rule);
    byCategory.set(rule.category, list);
  }

  let out = '# Design rules\n\n> Generated from `rules/rules.json` — do not edit by hand.\n';
  for (const category of [...byCategory.keys()].sort()) {
    out += `\n## ${category}\n\n`;
    for (const rule of byCategory.get(category)!) {
      const rationale = rule.rationale ? ` — _${rule.rationale}_` : '';
      out += `- **[${rule.severity}]** ${rule.statement}${rationale}\n`;
    }
  }
  return out;
}

export function writeRulesDigest(): string {
  const md = buildRulesMarkdown(loadRules());
  mkdirSync(join(REPO_ROOT, 'rules', 'dist'), { recursive: true });
  writeFileSync(join(REPO_ROOT, 'rules', 'dist', 'rules.md'), md);
  return md;
}
