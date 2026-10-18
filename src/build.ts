import StyleDictionary from 'style-dictionary';
import { appendFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { MODE_GROUP, modeSelector, referencePath } from './tokens.js';

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

/**
 * One `:root[data-theme="<mode>"]` block per mode, appended to the CSS and
 * Tailwind files: each override redefines the default token's own variable
 * (and, for Tailwind, its utility names), so every rule written against the
 * default follows the mode without a rule of its own. Values are resolved.
 */
function modeBlocks(tokens: Leaf[], tailwind: boolean): string {
  const byMode = new Map<string, string[]>();
  for (const t of tokens) {
    if (t.path[0] !== MODE_GROUP || t.path.length < 3) continue;
    const mode = t.path[1]!;
    const base = t.path.slice(2);
    const name = t.name.slice(`${MODE_GROUP}-${mode}-`.length);
    const names = tailwind ? tailwindNames(name, base, rawType(t)) : [name];
    // tokens.css keeps a reference as a reference, as its default block does.
    const ref = tailwind ? null : referencePath(rawValue(t));
    const value = ref ? `var(--${kebab(ref)})` : outValue(t);
    const lines = byMode.get(mode) ?? [];
    lines.push(...names.map((n) => `  --${n}: ${value};`));
    byMode.set(mode, lines);
  }
  return [...byMode].map(([mode, lines]) => `\n${modeSelector(mode)} {\n${lines.join('\n')}\n}\n`).join('');
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
      const tree = nestByPath(dictionary.allTokens as unknown as Leaf[], (t) => outValue(t));
      const name = (options as { themeName: string }).themeName;
      const safe = name.replace(/-/g, '_');
      const typeName =
        name.charAt(0).toUpperCase() + name.slice(1).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      return (
        `export const ${safe} = ${JSON.stringify(tree, null, 2)} as const;\n\n` +
        `export type ${typeName}Theme = typeof ${safe};\n`
      );
    },
  });
}

export async function buildTheme(themeDir: string): Promise<void> {
  registerFormats();
  const themeName = basename(themeDir);
  const buildPath = join(themeDir, 'dist') + '/';

  const sd = new StyleDictionary({
    usesDtcg: true,
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
        files: [{ destination: 'theme.ts', format: 'javascript/theme-ts', options: { themeName } }],
      },
    },
  });

  await sd.buildAllPlatforms();

  for (const [platform, file] of [['css', 'tokens.css'], ['tailwind', 'tailwind.css']] as const) {
    const { allTokens } = await sd.getPlatformTokens(platform);
    const blocks = modeBlocks(allTokens as unknown as Leaf[], platform === 'tailwind');
    if (blocks) appendFileSync(join(themeDir, 'dist', file), blocks);
  }
}
