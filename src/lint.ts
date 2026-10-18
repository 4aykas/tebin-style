import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { contrastRatio, AA_NORMAL } from './contrast.js';
import { hexToRgb } from './colors-csv.js';
import { referencePath, resolveToken, resolveString, type TokenTree } from './tokens.js';

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
  coverage: { checked: number; unchecked: number };
}

/** A brand theme's ledger of token values and their sources. */
export const SOURCES_FILE = 'sources.json';

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
             summary: { errors: 0, warnings: 1, infos: 0 }, coverage: { checked: 0, unchecked: 1 } };
  }

  const theme = JSON.parse(readFileSync(themePath, 'utf8')) as {
    contrastPairs?: Record<string, { foreground: string; background: string }>;
    surfaces?: { light?: string; dark?: string };
    omitted?: Array<{ section: string; reason: string }>;
  };
  const tokens = JSON.parse(readFileSync(tokensPath, 'utf8')) as Tree;
  const broken = new Set<string>();
  const checkValue = (value: unknown, path: string): void => {
    if (referencePath(value) !== null && resolveToken(tokens, value) === null) {
      broken.add(path);
      push({ severity: 'warning', path, message: `${JSON.stringify(value)} does not resolve to a value` });
    } else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) checkValue(child, `${path}.${key}`);
    }
  };
  const checkReferences = (tree: Tree, prefix = ''): void => {
    for (const [key, child] of Object.entries(tree)) {
      if (key.startsWith('$') || !child || typeof child !== 'object') continue;
      const path = prefix ? `${prefix}.${key}` : key;
      const leaf = child as Leaf;
      if ('$value' in leaf) checkValue(leaf.$value, path);
      else checkReferences(child as Tree, path);
    }
  };
  checkReferences(tokens);
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
    if (name.startsWith('$') || broken.has(path)) continue;
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

    const ratio = contrastRatio(value, against);
    push({
      severity: ratio >= AA_NORMAL ? 'info' : 'error',
      path,
      message: `${value} on ${against} is ${ratio.toFixed(4)}:1`,
      ratio,
      required: AA_NORMAL,
    });
  }

  for (const [name, pair] of Object.entries(theme.contrastPairs ?? {})) {
    const path = `contrastPairs.${name}`;
    const foreground = resolveString(tokens, pair.foreground);
    const background = resolveString(tokens, pair.background);
    if (!foreground || !background || !hexToRgb(foreground) || !hexToRgb(background)) {
      push({ severity: 'warning', path, message: 'not checked: explicit pair must resolve to two opaque hex colours' });
      continue;
    }
    const ratio = contrastRatio(foreground, background);
    push({ severity: ratio >= AA_NORMAL ? 'info' : 'error', path,
      message: `${foreground} on ${background} is ${ratio.toFixed(4)}:1`, ratio, required: AA_NORMAL });
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
    const ratio = contrastRatio(fg, bg);
    push({
      severity: ratio >= AA_NORMAL ? 'info' : 'error',
      path,
      message: `label ${fg} on ${bg} is ${ratio.toFixed(4)}:1`,
      ratio,
      required: AA_NORMAL,
    });
  }

  // Motion tokens time UI state, where overshoot is banned
  // (animation-no-overshoot-ui). A curve overshoots when a y control point
  // leaves 0..1; a spring does when its damping ratio is below 1.
  const motion = (tokens.motion ?? {}) as Record<string, Record<string, unknown>>;
  for (const [name, leaf] of Object.entries((motion.easing ?? {}) as Record<string, Leaf>)) {
    const v = leaf.$value;
    if (!Array.isArray(v) || v.length !== 4 || !v.every((n) => typeof n === 'number')) continue;
    const [, y1, , y2] = v as number[];
    if (y1! < 0 || y1! > 1 || y2! < 0 || y2! > 1) {
      push({ severity: 'error', path: `motion.easing.${name}`,
             message: `cubic-bezier(${v.join(', ')}) overshoots: a y control point is outside 0..1` });
    }
  }
  for (const [name, spring] of Object.entries((motion.spring ?? {}) as Record<string, Record<string, Leaf>>)) {
    const [k, c, m] = ['stiffness', 'damping', 'mass'].map((p) => spring[p]?.$value);
    if (typeof k !== 'number' || typeof c !== 'number' || typeof m !== 'number' || k <= 0 || m <= 0) continue;
    const ratio = c / (2 * Math.sqrt(k * m));
    if (ratio < 1) {
      push({ severity: 'error', path: `motion.spring.${name}`,
             message: `damping ratio ${ratio.toFixed(2)} is below 1, so the spring overshoots` });
    }
  }

  // A brand theme keeps sources.json: every token's value with where it came
  // from. A token that is new, changed or gone fails until its entry names a
  // source, so a brand value cannot land unsourced. A `proposal:` source is
  // shipped but unconfirmed, and stays listed until it is checked.
  const sourcesPath = join(themeDir, SOURCES_FILE);
  if (existsSync(sourcesPath)) {
    const ledger = JSON.parse(readFileSync(sourcesPath, 'utf8')) as Record<string, { value: unknown; source: string }>;
    const leaves = new Map<string, unknown>();
    const collect = (tree: Tree, prefix = ''): void => {
      for (const [key, child] of Object.entries(tree)) {
        if (key.startsWith('$') || !child || typeof child !== 'object') continue;
        const path = prefix ? `${prefix}.${key}` : key;
        if ('$value' in child) leaves.set(path, (child as Leaf).$value);
        else collect(child as Tree, path);
      }
    };
    collect(tokens);
    for (const [path, value] of leaves) {
      const entry = ledger[path];
      if (!entry?.source?.trim()) {
        push({ severity: 'error', path, message: `no source in ${SOURCES_FILE}: add the value and where it came from` });
      } else if (JSON.stringify(entry.value) !== JSON.stringify(value)) {
        push({ severity: 'error', path,
               message: `value changed from ${JSON.stringify(entry.value)}: update ${SOURCES_FILE} with the new value and its source` });
      } else if (entry.source.startsWith('proposal')) {
        push({ severity: 'info', path, message: `unconfirmed: ${entry.source}` });
      }
    }
    for (const path of Object.keys(ledger)) {
      if (!leaves.has(path)) push({ severity: 'error', path, message: `in ${SOURCES_FILE} but not in tokens.json` });
    }
  }

  if (!('role' in tokens) && !omitted.has('role')) {
    push({ severity: 'warning', path: 'role', message: 'no role group, and no omitted entry explaining why' });
  }

  return {
    findings,
    coverage: {
      checked: findings.filter(f => f.ratio !== undefined).length,
      unchecked: findings.filter(f => f.ratio === undefined).length,
    },
    summary: {
      errors: findings.filter((f) => f.severity === 'error').length,
      warnings: findings.filter((f) => f.severity === 'warning').length,
      infos: findings.filter((f) => f.severity === 'info').length,
    },
  };
}
