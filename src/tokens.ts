/**
 * One home for what a token reference is and how to follow it.
 *
 * Three modules used to answer this question separately — the lint, the front
 * matter, and the generated document — and they disagreed at the edges: one
 * caught reference cycles, one passed a dangling reference through as if it
 * were a value, and one stripped the braces with a regex. The differences that
 * matter are real, so they now live at the call sites rather than inside three
 * near-identical functions.
 */

export type TokenTree = Record<string, unknown>;

export interface TokenLeaf {
  $type?: string;
  $value?: unknown;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

/** The path inside `{a.b}`, or null when the value is not a reference. */
export function referencePath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const m = /^\{([^}]+)\}$/.exec(value);
  return m?.[1] ?? null;
}

/**
 * Follows references until a literal.
 *
 * Returns the literal unchanged when the value is not a reference — a number,
 * a font stack array and a plain hex all pass straight through. Returns null
 * only when a reference leads nowhere: a path that does not exist, a leaf with
 * no `$value`, or a cycle.
 *
 * Callers decide what null means. The lint reports it as a broken reference;
 * the front matter falls back to printing the reference text.
 */
export function resolveToken(tokens: TokenTree, value: unknown, seen = new Set<string>()): unknown {
  const path = referencePath(value);
  if (path === null) return value;
  if (seen.has(path)) return null;
  seen.add(path);

  let node: unknown = tokens;
  for (const segment of path.split('.')) {
    if (typeof node !== 'object' || node === null) return null;
    node = (node as TokenTree)[segment];
  }
  const leaf = node as TokenLeaf | undefined;
  if (!leaf || leaf.$value === undefined) return null;
  return resolveToken(tokens, leaf.$value, seen);
}

/** Resolves to a string, or null when it does not resolve to one. */
export function resolveString(tokens: TokenTree, value: unknown): string | null {
  const resolved = resolveToken(tokens, value);
  return typeof resolved === 'string' ? resolved : null;
}

/**
 * Modes. A theme with more than one look keeps its default in the ordinary
 * groups and each other mode in `mode.<name>`, which repeats a token's path
 * with the value that mode gives it: `mode.light.role.surface` overrides
 * `role.surface`. A browser selects one with `:root[data-theme="<name>"]`.
 */
export const MODE_GROUP = 'mode';

/** CSS selector that turns a mode on. */
export const modeSelector = (mode: string) => `:root[data-theme="${mode}"]`;

/** The names under `mode`, in source order. */
export function modeNames(tokens: TokenTree): string[] {
  const group = tokens[MODE_GROUP];
  return group && typeof group === 'object' ? Object.keys(group).filter((k) => !k.startsWith('$')) : [];
}

/** Every `[path, leaf]` under a tree, as dotted paths. */
export function leavesOf(tree: TokenTree, prefix = ''): Array<[string, TokenLeaf]> {
  const out: Array<[string, TokenLeaf]> = [];
  for (const [key, child] of Object.entries(tree)) {
    if (key.startsWith('$') || !child || typeof child !== 'object') continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if ('$value' in child) out.push([path, child as TokenLeaf]);
    else out.push(...leavesOf(child as TokenTree, path));
  }
  return out;
}

/** The tree without its `mode` group: the default mode. */
export function baseTokens(tokens: TokenTree): TokenTree {
  const { [MODE_GROUP]: _modes, ...rest } = tokens;
  return rest;
}

/**
 * The tree as one mode sees it: the default with that mode's overrides laid
 * over, and no `mode` group. A reference inside an override resolves in the
 * merged tree, so it may point at the default palette.
 */
export function tokensForMode(tokens: TokenTree, mode: string): TokenTree {
  const merged = structuredClone(baseTokens(tokens));
  const overrides = ((tokens[MODE_GROUP] ?? {}) as TokenTree)[mode] as TokenTree | undefined;
  for (const [path, leaf] of leavesOf(overrides ?? {})) {
    let node = merged;
    const parts = path.split('.');
    for (const seg of parts.slice(0, -1)) {
      node[seg] = (node[seg] as TokenTree | undefined) ?? {};
      node = node[seg] as TokenTree;
    }
    const last = parts[parts.length - 1]!;
    node[last] = { ...((node[last] as TokenLeaf | undefined) ?? {}), $value: leaf.$value };
  }
  return merged;
}
