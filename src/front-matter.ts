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

/**
 * One YAML scalar. JSON is valid YAML: a number stays a number, and anything
 * else becomes a double-quoted string with its backslashes, quotes and
 * newlines escaped.
 */
const scalar = (v: unknown) => typeof v === 'number' ? String(v) : JSON.stringify(String(v));

function group(name: string, rows: Array<[string, string]>): string {
  if (!rows.length) return '';
  return `${name}:\n${rows.map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n`;
}

/**
 * The DESIGN.md format's front matter, generated from tokens.json.
 *
 * Written by hand rather than through a YAML library: the shape is a flat map
 * plus one nested level, and every value goes through `scalar`.
 */
export function buildFrontMatter(themeDir: string): string {
  const theme = JSON.parse(readFileSync(join(themeDir, 'theme.json'), 'utf8')) as {
    name: string; version: string; description?: string;
    omitted?: Array<{ section: string; reason: string }>;
  };
  const tokens = JSON.parse(readFileSync(join(themeDir, 'tokens.json'), 'utf8')) as Tree;
  const value = (v: unknown) => scalar(forDocument(tokens, v));
  const rows = (leaves: unknown) => Object.entries((leaves ?? {}) as Record<string, Leaf>)
    .map(([k, leaf]): [string, string] => [k, value(leaf.$value)]);

  let out = '---\n';
  out += 'version: alpha\n';
  out += `name: ${scalar(theme.name)}\n`;
  if (theme.description) out += `description: ${scalar(theme.description)}\n`;

  // colors — semantic roles, resolved. The spec wants values, not our aliases.
  out += group('colors', rows(tokens.role));

  // typography — one entry per level, ceiling as fontSize
  const type = (tokens.type ?? {}) as Record<string, Leaf>;
  const fonts = (tokens.font ?? {}) as Record<string, Leaf>;
  const lh = (tokens.lineHeight ?? {}) as Record<string, Leaf>;
  const fw = (tokens.fontWeight ?? {}) as Record<string, Leaf>;
  const stack = (key: string): string | null => {
    const v = forDocument(tokens, fonts[key]?.$value);
    return Array.isArray(v) ? String(v[0]) : typeof v === 'string' ? v : null;
  };
  const typeEntries = Object.entries(type);
  if (typeEntries.length) {
    out += 'typography:\n';
    for (const [level, leaf] of typeEntries) {
      const heading = /^h[1-6]$/.test(level);
      const family = heading ? stack('condensed') ?? stack('sans') : stack('sans');
      out += `  ${level}:\n`;
      if (family) out += `    fontFamily: ${scalar(family)}\n`;
      out += `    fontSize: ${value(leaf.$value)}\n`;
      const weight = heading ? fw.heading?.$value : undefined;
      if (weight !== undefined) out += `    fontWeight: ${value(weight)}\n`;
      const leading = heading ? lh.heading?.$value : level === 'body' ? lh.body?.$value : undefined;
      if (leading !== undefined) out += `    lineHeight: ${value(leading)}\n`;
    }
  }

  // rounded and spacing
  out += group('rounded', rows(tokens.radius));
  out += group('spacing', [...rows(tokens.spacing), ...rows(tokens.layout)]);

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
        const ref = referencePath(leaf.$value);
        const emitted = ref?.startsWith('role.') ? scalar(`{colors.${ref.slice(5)}}`)
          : ref?.startsWith('radius.') ? scalar(`{rounded.${ref.slice(7)}}`)
          : value(leaf.$value);
        out += `    ${prop}: ${emitted}\n`;
      }
    }
  }

  const omitted = theme.omitted ?? [];
  if (omitted.length) {
    out += 'omitted:\n';
    for (const o of omitted) out += `  - section: ${scalar(o.section)}\n    reason: ${scalar(o.reason)}\n`;
  }

  out += '---\n';
  return out;
}
