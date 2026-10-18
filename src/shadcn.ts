import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { contrastRatio } from './contrast.js';
import { hexToRgb } from './colors-csv.js';
import { resolveString, baseTokens, modeNames, tokensForMode, type TokenTree } from './tokens.js';

export const SHADCN_FILE = 'shadcn.json';
const ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json';
const RAW_BASE = 'https://raw.githubusercontent.com/4aykas/tebin-style/main';

interface Leaf { $value?: unknown }

export interface ShadcnItem {
  $schema: string;
  name: string;
  type: 'registry:theme';
  title: string;
  description?: string;
  docs: string;
  cssVars: { theme: Record<string, string>; light: Record<string, string>; dark?: Record<string, string> };
}

/** A font stack as CSS: multi-word family names need quotes. */
function fontStack(families: unknown): string | null {
  if (!Array.isArray(families)) return null;
  return families.map((f) => (/\s/.test(String(f)) ? `"${f}"` : String(f))).join(', ');
}

/**
 * A shadcn/ui theme item for a web theme, or null for a theme that is not
 * for the web.
 *
 * Only the variables a token states are written. shadcn merges an item into
 * the project's existing variables, so an honest partial theme keeps the
 * project's own value wherever this theme has no answer — dark mode
 * included, unless the theme has a dark mode of its own.
 */
export function buildShadcnItem(themeDir: string): ShadcnItem | null {
  const theme = JSON.parse(readFileSync(join(themeDir, 'theme.json'), 'utf8')) as {
    id: string; name: string; description?: string; media?: string[];
  };
  if (!theme.media?.includes('web')) return null;
  const all = JSON.parse(readFileSync(join(themeDir, 'tokens.json'), 'utf8')) as TokenTree;
  const tokens = baseTokens(all);
  const group = (name: string) => (tokens[name] ?? {}) as Record<string, Leaf>;

  // A theme with a light and a dark mode fills both; one with a single look
  // fills light only, and the project keeps its own dark values.
  const modes = modeNames(all);
  const isDark = (t: TokenTree) => {
    const surface = resolveString(t, ((t.role ?? {}) as Record<string, Leaf>).surface?.$value);
    return Boolean(surface && hexToRgb(surface) && contrastRatio(surface, '#000000') < contrastRatio(surface, '#FFFFFF'));
  };
  const views = [tokens, ...modes.map((m) => tokensForMode(all, m))];
  const lightTokens = views.find((t) => !isDark(t)) ?? tokens;
  const darkTokens = modes.length ? views.find(isDark) : undefined;

  const light = colourVars(lightTokens, 'light');
  const dark = darkTokens ? colourVars(darkTokens, 'dark') : undefined;

  // shadcn derives its radius scale from --radius, with rounded-md at
  // --radius minus 2px. Buttons and inputs use rounded-md, so the control
  // radius lands there.
  const radius = group('radius');
  const control = resolveString(tokens, (radius.control ?? radius.md)?.$value);
  const px = control ? /^(\d+(?:\.\d+)?)px$/.exec(control) : null;
  if (px) light.radius = `${Number(px[1]) + 2}px`;

  const themeVars: Record<string, string> = {};
  for (const [name, leaf] of Object.entries(group('font'))) {
    const stack = fontStack(leaf.$value);
    if (stack) themeVars[`font-${name}`] = stack;
  }
  const easing = ((tokens.motion ?? {}) as Record<string, Record<string, Leaf>>).easing ?? {};
  for (const [name, leaf] of Object.entries(easing)) {
    if (Array.isArray(leaf.$value)) themeVars[`ease-${name}`] = `cubic-bezier(${leaf.$value.join(', ')})`;
  }

  return {
    $schema: ITEM_SCHEMA,
    name: theme.id,
    type: 'registry:theme',
    title: theme.name,
    ...(theme.description ? { description: theme.description } : {}),
    docs: (dark
      ? `Light- and dark-mode colours and theme variables from the ${theme.name} theme. `
      : `Light-mode colours and theme variables from the ${theme.name} theme. Dark mode keeps your current values. `) +
      `Every token: ${RAW_BASE}/themes/${theme.id}/dist/tokens.css`,
    cssVars: { theme: themeVars, light, ...(dark ? { dark } : {}) },
  };
}

/** shadcn's colour variables from one mode's tokens; only those a token answers. */
function colourVars(tokens: TokenTree, look: 'light' | 'dark'): Record<string, string> {
  const group = (name: string) => (tokens[name] ?? {}) as Record<string, Leaf>;
  const role = (name: string) => resolveString(tokens, group('role')[name]?.$value);
  const component = (name: string, prop: string) => {
    const parts = (group('components')[name] ?? {}) as Record<string, Leaf>;
    return resolveString(tokens, parts[prop]?.$value);
  };
  const out: Record<string, string> = {};
  const set = (name: string, value: string | null) => { if (value) out[name] = value; };

  const surface = role('surface');
  const ink = role('on-surface');
  set('background', surface);
  set('foreground', ink);
  set('card', role('surface-raised') ?? surface);
  set('card-foreground', ink);
  set('popover', role('surface-raised') ?? surface);
  set('popover-foreground', ink);

  // shadcn's primary is the everyday button. A theme that says what that
  // button is wins over its identity colour.
  const primary = component('button-primary', 'backgroundColor') ?? role('primary');
  let onPrimary = component('button-primary', 'textColor');
  if (!onPrimary && primary && hexToRgb(primary)) {
    // The label is whichever end of the theme reads better on the fill.
    const ends = [surface, ink].filter((c): c is string => Boolean(c && hexToRgb(c)));
    onPrimary = ends.sort((a, b) => contrastRatio(b, primary) - contrastRatio(a, primary))[0] ?? null;
  }
  set('primary', primary);
  set('primary-foreground', onPrimary);
  set('ring', primary);
  set('muted-foreground', role('on-surface-muted'));
  set('destructive', role(`error-on-${look}`) ?? role('error'));
  set('border', role('outline'));
  set('input', role('outline-control') ?? role('outline'));
  return out;
}

/** The file's text, or null for a theme that gets none. */
export function shadcnFileContent(themeDir: string): string | null {
  const item = buildShadcnItem(themeDir);
  return item ? JSON.stringify(item, null, 2) + '\n' : null;
}

/** Writes dist/shadcn.json for a web theme, and removes a stale one otherwise. */
export function writeShadcnItem(themeDir: string): void {
  const path = join(themeDir, 'dist', SHADCN_FILE);
  const content = shadcnFileContent(themeDir);
  if (content === null) {
    if (existsSync(path)) rmSync(path);
    return;
  }
  mkdirSync(join(themeDir, 'dist'), { recursive: true });
  writeFileSync(path, content);
}
