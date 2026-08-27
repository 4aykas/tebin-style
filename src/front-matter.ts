import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface Leaf { $type?: string; $value?: unknown; $extensions?: Record<string, unknown> }
type Tree = Record<string, unknown>;

/** Follows `{a.b}`; returns the literal when the path leads nowhere. */
function resolve(tokens: Tree, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const ref = /^\{([^}]+)\}$/.exec(value);
  if (!ref) return value;
  let node: unknown = tokens;
  for (const seg of ref[1].split('.')) {
    if (typeof node !== 'object' || node === null) return value;
    node = (node as Tree)[seg];
  }
  const leaf = node as Leaf | undefined;
  return leaf?.$value === undefined ? value : resolve(tokens, leaf.$value);
}

const quote = (s: string) => `"${s.replace(/"/g, '\\"')}"`;

function group(name: string, rows: Array<[string, string]>): string {
  if (!rows.length) return '';
  return `${name}:\n${rows.map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n`;
}

/**
 * The DESIGN.md format's front matter, generated from tokens.json.
 *
 * Written by hand rather than through a YAML library: the shape is a flat map
 * plus one nested level, and the values are strings and numbers we already
 * control.
 */
export function buildFrontMatter(themeDir: string): string {
  const theme = JSON.parse(readFileSync(join(themeDir, 'theme.json'), 'utf8')) as {
    name: string; version: string; description?: string;
    omitted?: Array<{ section: string; reason: string }>;
  };
  const tokens = JSON.parse(readFileSync(join(themeDir, 'tokens.json'), 'utf8')) as Tree;

  let out = '---\n';
  out += 'version: alpha\n';
  out += `name: ${quote(theme.name)}\n`;
  if (theme.description) out += `description: ${quote(theme.description)}\n`;

  // colors — semantic roles, resolved. The spec wants values, not our aliases.
  const roles = (tokens.role ?? {}) as Record<string, Leaf>;
  out += group('colors', Object.entries(roles).map(([k, leaf]) => [k, quote(String(resolve(tokens, leaf.$value)))]));

  // typography — one entry per level, ceiling as fontSize
  const type = (tokens.type ?? {}) as Record<string, Leaf>;
  const fonts = (tokens.font ?? {}) as Record<string, Leaf>;
  const lh = (tokens.lineHeight ?? {}) as Record<string, Leaf>;
  const fw = (tokens.fontWeight ?? {}) as Record<string, Leaf>;
  const stack = (key: string): string | null => {
    const v = fonts[key]?.$value;
    return Array.isArray(v) ? String(v[0]) : typeof v === 'string' ? v : null;
  };
  const typeEntries = Object.entries(type);
  if (typeEntries.length) {
    out += 'typography:\n';
    for (const [level, leaf] of typeEntries) {
      const heading = /^h[1-6]$/.test(level);
      const family = heading ? stack('condensed') ?? stack('sans') : stack('sans');
      out += `  ${level}:\n`;
      if (family) out += `    fontFamily: ${quote(family)}\n`;
      out += `    fontSize: ${leaf.$value}\n`;
      const weight = heading ? fw.heading?.$value : undefined;
      if (weight !== undefined) out += `    fontWeight: ${weight}\n`;
      const leading = heading ? lh.heading?.$value : level === 'body' ? lh.body?.$value : undefined;
      if (leading !== undefined) out += `    lineHeight: ${leading}\n`;
    }
  }

  // rounded and spacing
  const radius = (tokens.radius ?? {}) as Record<string, Leaf>;
  out += group('rounded', Object.entries(radius).map(([k, l]) => [k, String(l.$value)]));

  const spacing = (tokens.spacing ?? {}) as Record<string, Leaf>;
  const layout = (tokens.layout ?? {}) as Record<string, Leaf>;
  out += group('spacing', [
    ...Object.entries(spacing).map(([k, l]) => [k, String(l.$value)] as [string, string]),
    ...Object.entries(layout).map(([k, l]) => [k, String(l.$value)] as [string, string]),
  ]);

  const omitted = theme.omitted ?? [];
  if (omitted.length) {
    out += 'omitted:\n';
    for (const o of omitted) out += `  - section: ${quote(o.section)}\n    reason: ${quote(o.reason)}\n`;
  }

  out += '---\n';
  return out;
}
