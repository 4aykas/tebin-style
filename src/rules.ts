import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, NotFoundError } from './registry.js';

export const SEVERITIES = ['MUST', 'SHOULD', 'NEVER'] as const;
export type Severity = (typeof SEVERITIES)[number];
export const MEDIA = ['web', 'document', 'print'] as const;
export type Medium = (typeof MEDIA)[number];

export interface Rule {
  id: string;
  category: string;
  severity: Severity;
  statement: string;
  rationale?: string;
  tags?: string[];
  source?: string;
  themes?: string[];
  media?: Medium[];
}

export interface RuleFilters {
  category?: string; severity?: string; tag?: string; query?: string;
  theme?: string; medium?: Medium;
}

export function loadRules(): Rule[] {
  const p = join(REPO_ROOT, 'rules', 'rules.json');
  if (!existsSync(p)) throw new NotFoundError('rules/rules.json not found');
  return JSON.parse(readFileSync(p, 'utf8')) as Rule[];
}

export function getRule(id: string): Rule {
  const rules = loadRules();
  const rule = rules.find((r) => r.id === id);
  if (!rule) throw new NotFoundError(`rule "${id}" not found; ids: ${rules.map((r) => r.id).join(', ')}`);
  return rule;
}

export function filterRules(input: RuleFilters): Rule[] {
  const { category, severity, tag, query, theme, medium } = input;
  let rules = loadRules();
  if (theme) rules = rules.filter((r) => !r.themes || r.themes.includes(theme));
  if (medium) rules = rules.filter((r) => !r.media || r.media.includes(medium));
  if (category) rules = rules.filter((r) => r.category.toLowerCase() === category.toLowerCase());
  if (severity) rules = rules.filter((r) => r.severity.toLowerCase() === severity.toLowerCase());
  if (tag) rules = rules.filter((r) => (r.tags ?? []).some((t) => t.toLowerCase() === tag.toLowerCase()));
  if (query) {
    const q = query.trim().toLowerCase();
    rules = rules.filter((r) => [r.id, r.statement, r.rationale ?? '', ...(r.tags ?? [])]
      .some((value) => value.toLowerCase().includes(q)));
  }
  return rules;
}
