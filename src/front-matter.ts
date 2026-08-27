import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { referencePath, resolveToken, type TokenTree } from './tokens.js';

interface Leaf { $type?: string; $value?: unknown; $extensions?: Record<string, unknown> }
type Tree = TokenTree;

/**
 * A value for the document: the literal a reference points at, or the
 * reference text itself when it leads nowhere. The format is a snapshot, so a
 * dangling reference is better printed than silently blanked — the lint is
 * where it gets reported.
 */
function forDocument(tokens: TokenTree, value: unknown): unknown {
  return resolveToken(tokens, value) ?? value;
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
  out += group('colors', Object.entries(roles).map(([k, leaf]) => [k, quote(String(forDocument(tokens, leaf.$value)))]));

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

  // components — the spec permits references here, so keep ours where the
  // target has a home in the emitted document and resolve the rest to values.
  // role.* becomes colors.*, radius.* becomes rounded.*; anything else (a raw
  // palette colour) has no section to point at and is written out.
  const components = (tokens.components ?? {}) as Record<string, Record<string, Leaf>>;
  const componentEntries = Object.entries(components);
  if (componentEntries.length) {
    out += 'components:\n';
    for (const [name, parts] of componentEntries) {
      out += `  ${name}:\n`;
      for (const [prop, leaf] of Object.entries(parts)) {
        const raw = leaf.$value;
        let emitted: string;
        const ref = referencePath(raw);
        if (ref?.startsWith('role.')) emitted = quote(`{colors.${ref.slice(5)}}`);
        else if (ref?.startsWith('radius.')) emitted = quote(`{rounded.${ref.slice(7)}}`);
        else {
          const value = String(forDocument(tokens, raw));
          emitted = leaf.$type === 'color' ? quote(value) : value;
        }
        out += `    ${prop}: ${emitted}\n`;
      }
    }
  }

  const omitted = theme.omitted ?? [];
  if (omitted.length) {
    out += 'omitted:\n';
    for (const o of omitted) out += `  - section: ${quote(o.section)}\n    reason: ${quote(o.reason)}\n`;
  }

  out += '---\n';
  return out;
}
