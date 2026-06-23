import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, NotFoundError } from './registry.js';

export type Severity = 'MUST' | 'SHOULD' | 'NEVER';

export interface Rule {
  id: string;
  category: string;
  severity: Severity;
  statement: string;
  rationale?: string;
  tags?: string[];
  source?: string;
}

export function loadRules(): Rule[] {
  const p = join(REPO_ROOT, 'rules', 'rules.json');
  if (!existsSync(p)) throw new NotFoundError('rules/rules.json not found');
  return JSON.parse(readFileSync(p, 'utf8')) as Rule[];
}

export function getRule(id: string): Rule {
  const rule = loadRules().find((r) => r.id === id);
  if (!rule) throw new NotFoundError(`rule "${id}" not found`);
  return rule;
}

export function filterRules(input: { category?: string; severity?: string; tag?: string; query?: string }): Rule[] {
  const { category, severity, tag, query } = input;
  let rules = loadRules();
  if (category) rules = rules.filter((r) => r.category.toLowerCase() === category.toLowerCase());
  if (severity) rules = rules.filter((r) => r.severity.toLowerCase() === severity.toLowerCase());
  if (tag) rules = rules.filter((r) => (r.tags ?? []).some((t) => t.toLowerCase() === tag.toLowerCase()));
  if (query) {
    const q = query.toLowerCase();
    rules = rules.filter((r) => r.id.toLowerCase().includes(q) || r.statement.toLowerCase().includes(q));
  }
  return rules;
}
