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
  return m ? m[1] : null;
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
