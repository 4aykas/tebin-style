import StyleDictionary from 'style-dictionary';
import type { DesignTokens, PlatformConfig } from 'style-dictionary/types';
import { appendFileSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { MODE_GROUP, modeSelector, referencePath, modeNames, tokensForMode, leavesOf, baseTokens,
  type TokenTree } from './tokens.js';
import { surfaceIsDark } from './contrast.js';

interface Leaf {
  $type?: string;
  type?: string;
  name: string;
  $value?: unknown;
  value?: unknown;
  path: string[];
  original: { $value?: unknown; $type?: string; value?: unknown; $description?: string; $extensions?: Record<string, unknown> };
}

interface FluidTriple {
  min: string;
  pref: string;
  max: string;
}

/** Transformed value (css pipeline writes $value; fall back to value). */
function outValue(t: Leaf): unknown {
  return t.$value ?? t.value;
}

/** Canonical, untransformed value from the source token. */
function rawValue(t: Leaf): unknown {
  return t.original.$value ?? t.original.value;
}

function rawType(t: Leaf): string | undefined {
  return t.$type ?? t.original.$type ?? t.type;
}

function nestByPath<T>(tokens: Leaf[], leafValue: (t: Leaf) => T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const t of tokens) {
    let node = out;
    t.path.forEach((seg, i) => {
      if (i === t.path.length - 1) {
        node[seg] = leafValue(t);
      } else {
        node[seg] = (node[seg] as Record<string, unknown>) ?? {};
        node = node[seg] as Record<string, unknown>;
      }
    });
  }
  return out;
}

/** A token's variable plus the Tailwind utility namespaces it also fills. */
function tailwindNames(name: string, path: string[], type: string | undefined): string[] {
  const names = new Set([name]);
  if (type === 'color' && path[0] !== 'color') names.add(`color-${name}`);
  if (path[0] === 'type') names.add(name.replace(/^type-/, 'text-'));
  if (path[0] === 'lineHeight') names.add(`leading-${path.slice(1).join('-')}`);
  if (type === 'cubicBezier' && path[0] === 'motion') names.add(`ease-${path.slice(2).join('-')}`);
  return [...names];
}

/** A dotted token path as Style Dictionary's kebab variable name. */
const kebab = (path: string) =>
  path.split('.').map((s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()).join('-');

/** Keeps `mode.*` out of the default `:root` block. */
const notMode = (t: { path: string[] }) => t.path[0] !== MODE_GROUP;

/** The tokens one mode sees, through a platform's transforms, references resolved. */
async function modeLeaves(source: TokenTree, mode: string, platform: PlatformConfig): Promise<Leaf[]> {
  const sd = new StyleDictionary({
    usesDtcg: true,
    log: { verbosity: 'silent', warnings: 'error' },
    tokens: tokensForMode(source, mode) as DesignTokens,
    platforms: { out: platform },
  });
  return (await sd.getPlatformTokens('out')).allTokens as unknown as Leaf[];
}

const byPath = (leaves: Leaf[]) => new Map(leaves.map((t) => [t.path.join('.'), t]));

/**
 * The mode's tokens whose value differs from the default, each with its
 * default. A format holding resolved values (tailwind.css, theme.ts) writes
 * all of them, so a component built on an overridden role follows the mode.
 */
function changedLeaves(leaves: Leaf[], defaults: Map<string, Leaf>): Array<[Leaf, Leaf]> {
  return leaves.flatMap((t) => {
    const base = defaults.get(t.path.join('.'));
    return base && JSON.stringify(outValue(t)) !== JSON.stringify(outValue(base)) ? [[t, base] as [Leaf, Leaf]] : [];
  });
}

/**
 * One `:root[data-theme="<mode>"]` block per mode, appended to the CSS and
 * Tailwind files: each redefines the default token's own variable (and, for
 * Tailwind, its utility names), so every rule written against the default
 * follows the mode without a rule of its own.
 *
 * Each look also sets `color-scheme` from its surface, the default in a
 * plain `:root` block, so native controls, scrollbars and autofill follow
 * the mode (rule theming-color-scheme).
 */
function modeBlocks(source: TokenTree, perMode: Map<string, Leaf[]>, defaults: Map<string, Leaf>, tailwind: boolean): string {
  const scheme = (look: TokenTree) => {
    const dark = surfaceIsDark(look);
    return dark === null ? [] : [`  color-scheme: ${dark ? 'dark' : 'light'};`];
  };
  const base = scheme(baseTokens(source));
  let out = base.length ? `\n:root {\n${base.join('\n')}\n}\n` : '';
  for (const [mode, leaves] of perMode) {
    const lines: string[] = scheme(tokensForMode(source, mode));
    if (tailwind) {
      for (const [t, base] of changedLeaves(leaves, defaults)) {
        lines.push(...tailwindNames(base.name, t.path, rawType(t)).map((n) => `  --${n}: ${outValue(t)};`));
      }
    } else {
      // tokens.css keeps references, so only the overrides themselves are
      // redefined, a reference as a reference, as its default block does.
      const overridden = new Set(leavesOf(((source[MODE_GROUP] as TokenTree)[mode] ?? {}) as TokenTree).map(([p]) => p));
      for (const t of leaves) {
        const base = defaults.get(t.path.join('.'));
        if (!base || !overridden.has(t.path.join('.'))) continue;
        const ref = referencePath(rawValue(t));
        const value = ref ? `var(--${defaults.get(ref)?.name ?? kebab(ref)})` : outValue(t);
        lines.push(`  --${base.name}: ${value};`);
      }
    }
    if (lines.length) out += `\n${modeSelector(mode)} {\n${lines.join('\n')}\n}\n`;
  }
  return out;
}

let registered = false;

export function registerFormats(): void {
  if (registered) return;

  const sizeTransform = StyleDictionary.hooks.transforms['size/rem'];
  const cssTransforms = StyleDictionary.hooks.transformGroups.css;
  if (!sizeTransform || !cssTransforms) {
    throw new Error('style-dictionary lacks the size/rem transform or the css transform group');
  }
  registered = true;
  StyleDictionary.registerTransform({
    ...sizeTransform,
    name: 'tebin/size',
    type: 'value',
    transform: (token, platform, options) => {
      const value = options.usesDtcg ? token.$value : token.value;
      // The repository's dimension subset includes CSS padding shorthands.
      // SD 5 treats an entire string as one dimension and corrupts its units.
      if (typeof value === 'string') {
        const parts = value.trim().split(/\s+/);
        if (parts.length >= 2 && parts.length <= 4 &&
            parts.every((part) => /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|%)$/.test(part))) return value;
      }
      return sizeTransform.transform(token, platform, options);
    },
  });

  StyleDictionary.registerTransform({
    name: 'tebin/fluid-clamp',
    type: 'value',
    transitive: true,
    filter: (token) =>
      Boolean(
        (token as { $extensions?: Record<string, unknown> }).$extensions?.['pro.tebin.fluid'] ??
          (token.original as { $extensions?: Record<string, unknown> })?.$extensions?.['pro.tebin.fluid'],
      ),
    transform: (token) => {
      const ext =
        (token as { $extensions?: Record<string, FluidTriple> }).$extensions?.['pro.tebin.fluid'] ??
        (token.original as { $extensions: Record<string, FluidTriple> }).$extensions['pro.tebin.fluid'];
      if (!ext) throw new Error(`${token.name}: missing pro.tebin.fluid extension`);
      return `clamp(${ext.min}, ${ext.pref}, ${ext.max})`;
    },
  });

  StyleDictionary.registerTransformGroup({
    name: 'css-tebin',
    transforms: [...cssTransforms.map((name) => name === 'size/rem' ? 'tebin/size' : name), 'tebin/fluid-clamp'],
  });

  StyleDictionary.registerFormat({
    name: 'css/tailwind-theme',
    format: ({ dictionary }) =>
      `@theme {\n${(dictionary.allTokens as unknown as Leaf[])
        .flatMap((t) => tailwindNames(t.name, t.path, rawType(t)).map((name) => `  --${name}: ${outValue(t)};`))
        .join('\n')}\n}\n`,
  });

  StyleDictionary.registerFormat({
    name: 'json/dtcg',
    format: ({ dictionary }) => {
      const tree = nestByPath(dictionary.allTokens as unknown as Leaf[], (t) => ({
        $type: rawType(t),
        $value: rawValue(t),
        ...(t.original.$description !== undefined ? { $description: t.original.$description } : {}),
        ...(t.original.$extensions !== undefined ? { $extensions: t.original.$extensions } : {}),
      }));
      return JSON.stringify(tree, null, 2) + '\n';
    },
  });

  StyleDictionary.registerFormat({
    name: 'javascript/theme-ts',
    format: ({ dictionary, options }) => {
      const { themeName, modes = {} } = options as { themeName: string; modes?: Record<string, Leaf[]> };
      const leaves = dictionary.allTokens as unknown as Leaf[];
      const tree = nestByPath(leaves, (t) => outValue(t));
      // theme.ts holds resolved values, so `mode.<name>` carries every value
      // the mode changes, components built on a role among them.
      if (Object.keys(modes).length) {
        const defaults = byPath(leaves);
        tree[MODE_GROUP] = Object.fromEntries(Object.entries(modes).map(([mode, modeTokens]) =>
          [mode, nestByPath(changedLeaves(modeTokens, defaults).map(([t]) => t), (t) => outValue(t))]));
      }
      return themeTs(themeName, tree);
    },
  });
}

function themeTs(name: string, tree: Record<string, unknown>): string {
  const safe = name.replace(/-/g, '_');
  const typeName =
    name.charAt(0).toUpperCase() + name.slice(1).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return (
    `export const ${safe} = ${JSON.stringify(tree, null, 2)} as const;\n\n` +
    `export type ${typeName}Theme = typeof ${safe};\n`
  );
}

export async function buildTheme(themeDir: string): Promise<void> {
  registerFormats();
  const themeName = basename(themeDir);
  const buildPath = join(themeDir, 'dist') + '/';

  // Each mode is resolved once per pipeline: the CSS one feeds tokens.css and
  // tailwind.css, the plain one theme.ts.
  const source = JSON.parse(readFileSync(join(themeDir, 'tokens.json'), 'utf8')) as TokenTree;
  const cssModes = new Map<string, Leaf[]>();
  const tsModes: Record<string, Leaf[]> = {};
  for (const mode of modeNames(source)) {
    cssModes.set(mode, await modeLeaves(source, mode, { transformGroup: 'css-tebin' }));
    tsModes[mode] = await modeLeaves(source, mode, { transforms: ['name/kebab'] });
  }

  const sd = new StyleDictionary({
    usesDtcg: true,
    // No line per written file; a warning (a name collision, a broken
    // reference) fails the build instead of scrolling past.
    log: { verbosity: 'silent', warnings: 'error' },
    source: [join(themeDir, 'tokens.json')],
    platforms: {
      css: {
        transformGroup: 'css-tebin',
        buildPath,
        files: [
          { destination: 'tokens.css', format: 'css/variables', filter: notMode, options: { outputReferences: true } },
        ],
      },
      tailwind: {
        transformGroup: 'css-tebin',
        buildPath,
        files: [{ destination: 'tailwind.css', format: 'css/tailwind-theme', filter: notMode }],
      },
      dtcg: {
        transforms: ['name/kebab'],
        buildPath,
        files: [{ destination: 'tokens.dtcg.json', format: 'json/dtcg' }],
      },
      ts: {
        transforms: ['name/kebab'],
        buildPath,
        files: [{ destination: 'theme.ts', format: 'javascript/theme-ts', filter: notMode,
          options: { themeName, modes: tsModes } }],
      },
    },
  });

  await sd.buildAllPlatforms();

  if (cssModes.size === 0) return;
  for (const [platform, file] of [['css', 'tokens.css'], ['tailwind', 'tailwind.css']] as const) {
    const defaults = byPath(((await sd.getPlatformTokens(platform)).allTokens as unknown as Leaf[]).filter(notMode));
    const blocks = modeBlocks(source, cssModes, defaults, platform === 'tailwind');
    if (blocks) appendFileSync(join(themeDir, 'dist', file), blocks);
  }
}
