import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { contrastRatio, AA_NORMAL } from './contrast.js';
import { hexToRgb } from './colors-csv.js';
import { resolveString, type TokenTree } from './tokens.js';

export interface Finding {
  severity: 'error' | 'warning' | 'info';
  path: string;
  message: string;
  ratio?: number;
  required?: number;
}

export interface LintResult {
  findings: Finding[];
  summary: { errors: number; warnings: number; infos: number };
}

interface Leaf { $type?: string; $value?: unknown }
type Tree = TokenTree;

/**
 * Which surface a role is measured against, from its name alone.
 *
 * Deliberately mechanical. A pairing rule that guesses is worse than one that
 * admits it does not know, so anything this does not match is reported rather
 * than skipped.
 */
const TEXT_ON_SURFACE = new Set(['on-surface', 'on-surface-muted', 'error', 'warning', 'success']);

function surfaceFor(role: string): 'light' | 'dark' | 'surface' | null {
  if (role.endsWith('-on-light')) return 'light';
  if (role.endsWith('-on-dark')) return 'dark';
  if (TEXT_ON_SURFACE.has(role)) return 'surface';
  return null;
}

export function lintTheme(themeDir: string): LintResult {
  const findings: Finding[] = [];
  const push = (f: Finding) => findings.push(f);

  const themePath = join(themeDir, 'theme.json');
  const tokensPath = join(themeDir, 'tokens.json');
  if (!existsSync(themePath) || !existsSync(tokensPath)) {
    return { findings: [{ severity: 'warning', path: '.', message: 'not a theme directory' }],
             summary: { errors: 0, warnings: 1, infos: 0 } };
  }

  const theme = JSON.parse(readFileSync(themePath, 'utf8')) as {
    surfaces?: { light?: string; dark?: string };
    omitted?: Array<{ section: string; reason: string }>;
  };
  const tokens = JSON.parse(readFileSync(tokensPath, 'utf8')) as Tree;
  const omitted = new Set((theme.omitted ?? []).map((o) => o.section));

  const surfaces = theme.surfaces;
  if (!surfaces?.light) {
    push({ severity: 'warning', path: 'theme.surfaces',
           message: 'no surfaces declared, so no contrast could be checked' });
  }

  const roles = (tokens.role ?? {}) as Record<string, Leaf>;
  const surfaceValue = resolveString(tokens, roles.surface?.$value);

  for (const [name, leaf] of Object.entries(roles)) {
    const path = `role.${name}`;
    const value = resolveString(tokens, leaf.$value);
    if (value === null) {
      push({ severity: 'warning', path,
             message: `${JSON.stringify(leaf.$value)} does not resolve to a value` });
      continue;
    }

    const which = surfaceFor(name);
    if (which === null) {
      push({ severity: 'info', path, message: 'not checked: no surface pairing rule for this name' });
      continue;
    }

    const against =
      which === 'surface' ? surfaceValue : which === 'light' ? surfaces?.light : surfaces?.dark;

    if (!against) {
      push({ severity: 'warning', path,
             message: `names a ${which} surface, but the manifest declares no ${which} surface to measure against` });
      continue;
    }
    if (!hexToRgb(value) || !hexToRgb(against)) {
      push({ severity: 'info', path,
             message: 'not checked: not an opaque colour, and a translucent value has no ratio until it is composited' });
      continue;
    }

    const ratio = Math.round(contrastRatio(value, against) * 100) / 100;
    push({
      severity: ratio >= AA_NORMAL ? 'info' : 'error',
      path,
      message: `${value} on ${against} is ${ratio}:1`,
      ratio,
      required: AA_NORMAL,
    });
  }

  // A component states both of its colours, so it is the one pair that needs no
  // naming convention to find. A variant that overrides only one of them
  // inherits the other from its base — 'button-primary-hover' from
  // 'button-primary' — which is how the source stylesheets are written.
  const components = (tokens.components ?? {}) as Record<string, Record<string, Leaf>>;
  for (const [name, parts] of Object.entries(components)) {
    const base = name.replace(/-(hover|active|pressed|focus)$/, '');
    const inherited = base === name ? undefined : components[base];
    const pick = (prop: string) =>
      resolveString(tokens, parts[prop]?.$value ?? inherited?.[prop]?.$value);

    const fg = pick('textColor');
    const bg = pick('backgroundColor');
    const path = `components.${name}`;
    if (!fg || !bg) {
      push({ severity: 'info', path, message: 'not checked: states no text or no background colour' });
      continue;
    }
    if (!hexToRgb(fg) || !hexToRgb(bg)) {
      push({ severity: 'info', path, message: 'not checked: not an opaque colour' });
      continue;
    }
    const ratio = Math.round(contrastRatio(fg, bg) * 100) / 100;
    push({
      severity: ratio >= AA_NORMAL ? 'info' : 'error',
      path,
      message: `label ${fg} on ${bg} is ${ratio}:1`,
      ratio,
      required: AA_NORMAL,
    });
  }

  if (!('role' in tokens) && !omitted.has('role')) {
    push({ severity: 'warning', path: 'role', message: 'no role group, and no omitted entry explaining why' });
  }

  return {
    findings,
    summary: {
      errors: findings.filter((f) => f.severity === 'error').length,
      warnings: findings.filter((f) => f.severity === 'warning').length,
      infos: findings.filter((f) => f.severity === 'info').length,
    },
  };
}
