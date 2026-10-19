import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { contrastRatio, surfaceIsDark, AA_NORMAL, PAIR_FLOORS, type ContrastPair } from './contrast.js';
import { hexToRgb } from './colors-csv.js';
import { referencePath, resolveToken, resolveString, baseTokens, leavesOf, modeNames, tokensForMode, MODE_GROUP,
  type TokenTree } from './tokens.js';

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

/** A measured pair: info when it reaches its floor, an error when it does not. */
function measured(path: string, fg: string, bg: string,
  { required = AA_NORMAL, label = '' }: { required?: number; label?: string } = {}): Finding {
  const ratio = contrastRatio(fg, bg);
  return { severity: ratio >= required ? 'info' : 'error', path,
    message: `${label}${fg} on ${bg} is ${ratio.toFixed(4)}:1`, ratio, required };
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
    contrastPairs?: Record<string, ContrastPair>;
    surfaces?: { light?: string; dark?: string };
    omitted?: Array<{ section: string; reason: string }>;
  };
  const tokens = JSON.parse(readFileSync(tokensPath, 'utf8')) as Tree;
  const checkValue = (value: unknown, path: string): void => {
    if (referencePath(value) !== null && resolveToken(tokens, value) === null) {
      push({ severity: 'warning', path, message: `${JSON.stringify(value)} does not resolve to a value` });
    } else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) checkValue(child, `${path}.${key}`);
    }
  };
  for (const [path, leaf] of leavesOf(tokens)) checkValue(leaf.$value, path);
  const omitted = new Set((theme.omitted ?? []).map((o) => o.section));

  const surfaces = theme.surfaces;
  if (!surfaces?.light) {
    push({ severity: 'warning', path: 'theme.surfaces',
           message: 'no surfaces declared, so no contrast could be checked' });
  }

  // Every mode is measured as a whole: the default first, then each mode with
  // its overrides laid over, its findings prefixed `mode.<name>:`.
  const measure = (tokens: Tree, at: (path: string) => string): void => {
    const push = (f: Finding) => findings.push({ ...f, path: at(f.path) });
    const roles = (tokens.role ?? {}) as Record<string, Leaf>;
    const paired = new Set(Object.values(theme.contrastPairs ?? {}).map((p) => referencePath(p.foreground)));
    const surfaceValue = resolveString(tokens, roles.surface?.$value);

    for (const [name, leaf] of Object.entries(roles)) {
      const path = `role.${name}`;
      // A broken reference is warned once, where it is written, and judged in
      // this tree: a mode can override a broken default with a valid value.
      if (name.startsWith('$')) continue;
      if (referencePath(leaf.$value) !== null && resolveToken(tokens, leaf.$value) === null) continue;
      const value = resolveString(tokens, leaf.$value);
      if (value === null) {
        push({ severity: 'warning', path,
               message: `${JSON.stringify(leaf.$value)} does not resolve to a value` });
        continue;
      }

      const which = surfaceFor(name);
      if (which === null && paired.has(path)) continue; // a contrast pair measures it
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

      push(measured(path, value, against));
    }

    for (const [name, pair] of Object.entries(theme.contrastPairs ?? {})) {
      const path = `contrastPairs.${name}`;
      const foreground = resolveString(tokens, pair.foreground);
      const background = resolveString(tokens, pair.background);
      if (!foreground || !background || !hexToRgb(foreground) || !hexToRgb(background)) {
        push({ severity: 'warning', path, message: 'not checked: explicit pair must resolve to two opaque hex colours' });
        continue;
      }
      // `min` sets the pair's floor: 3 for a non-text edge or icon (WCAG
      // 1.4.11), 7 for AAA text, 4.5 by default. Any other value is refused
      // here too, since lint_theme runs without the schema.
      if (pair.min !== undefined && !(PAIR_FLOORS as readonly number[]).includes(pair.min)) {
        push({ severity: 'error', path, message: `min ${JSON.stringify(pair.min)} is not one of ${PAIR_FLOORS.join(', ')}` });
        continue;
      }
      push(measured(path, foreground, background, { required: pair.min }));
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
      push(measured(path, fg, bg, { label: 'label ' }));
    }
  };

  const defaultTokens = baseTokens(tokens);
  measure(defaultTokens, (p) => p);
  // A mode reports only what it changes: a finding the default already made,
  // same check and same result, is not repeated once per mode.
  const seen = new Set(findings.map((f) => JSON.stringify([f.path, f.severity, f.message])));
  const baseLeaves = new Set(leavesOf(defaultTokens).map(([p]) => p));
  for (const mode of modeNames(tokens)) {
    const overrides = leavesOf(((tokens[MODE_GROUP] as Tree)[mode] ?? {}) as Tree);
    for (const [path] of overrides) {
      if (!baseLeaves.has(path)) {
        push({ severity: 'error', path: `${MODE_GROUP}.${mode}.${path}`,
               message: `overrides ${path}, which the default mode does not have` });
      }
    }
    const prefix = `${MODE_GROUP}.${mode}:`;
    const start = findings.length;
    measure(tokensForMode(tokens, mode), (p) => `${prefix}${p}`);
    const measured = findings.splice(start);
    findings.push(...measured.filter((f) =>
      !seen.has(JSON.stringify([f.path.slice(prefix.length), f.severity, f.message]))));
  }
  // The build sets each look's color-scheme from its surface; a theme with
  // modes whose surface is not an opaque hex would lose it without a word.
  const modes = modeNames(tokens);
  if (modes.length) {
    for (const [at, look] of [['role.surface', defaultTokens], ...modes.map((m) =>
      [`${MODE_GROUP}.${m}:role.surface`, tokensForMode(tokens, m)] as const)] as const) {
      if (surfaceIsDark(look) === null) {
        push({ severity: 'warning', path: at, message: 'not an opaque hex, so the build cannot set this look\'s color-scheme' });
      }
    }
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
    const leaves = new Map(leavesOf(tokens).map(([path, leaf]) => [path, leaf.$value]));
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
