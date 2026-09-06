import StyleDictionary from 'style-dictionary';
import { basename, join } from 'node:path';

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

let registered = false;

export function registerFormats(): void {
  if (registered) return;
  registered = true;

  const sizeTransform = StyleDictionary.hooks.transforms['size/rem'];
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
      return `clamp(${ext.min}, ${ext.pref}, ${ext.max})`;
    },
  });

  StyleDictionary.registerTransformGroup({
    name: 'css-tebin',
    transforms: [...StyleDictionary.hooks.transformGroups.css.map((name) => name === 'size/rem' ? 'tebin/size' : name), 'tebin/fluid-clamp'],
  });

  StyleDictionary.registerFormat({
    name: 'css/tailwind-theme',
    format: ({ dictionary }) =>
      `@theme {\n${(dictionary.allTokens as unknown as Leaf[])
        .flatMap((t) => {
          // Keep existing variables and add Tailwind's utility namespaces.
          const names = new Set([t.name]);
          if (rawType(t) === 'color' && t.path[0] !== 'color') names.add(`color-${t.name}`);
          if (t.path[0] === 'type') names.add(t.name.replace(/^type-/, 'text-'));
          if (t.path[0] === 'lineHeight') names.add(`leading-${t.path.slice(1).join('-')}`);
          return [...names].map((name) => `  --${name}: ${outValue(t)};`);
        })
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
          { destination: 'tokens.css', format: 'css/variables', options: { outputReferences: true } },
        ],
      },
      tailwind: {
        transformGroup: 'css-tebin',
        buildPath,
        files: [{ destination: 'tailwind.css', format: 'css/tailwind-theme' }],
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
}
