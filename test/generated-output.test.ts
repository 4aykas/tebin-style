import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { modeNames, modeSelector, tokensForMode, leavesOf, resolveToken, MODE_GROUP } from '../src/tokens.js';

// What the generators write, read back. Drift only says a file matches its
// source; these say the file is sound: no value a template failed to format,
// and every look of a theme the same in every format that carries it.

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const themes = readdirSync(join(root, 'themes'));
const TEXT = new Set(['.css', '.json', '.ts', '.csv', '.md', '.txt', '.svg']);

function generatedText(): Array<[string, string]> {
  const files = ['registry/index.json', 'rules/dist/rules.md', 'llms-full.txt'];
  for (const id of themes) {
    files.push(`themes/${id}/DESIGN.md`);
    for (const dir of ['dist', 'preview']) {
      const at = join(root, 'themes', id, dir);
      if (existsSync(at)) files.push(...readdirSync(at).map((f) => `themes/${id}/${dir}/${f}`));
    }
  }
  return files.filter((f) => TEXT.has(extname(f))).map((f) => [f, readFileSync(join(root, f), 'utf8')]);
}

/** `--name: value;` per block, keyed by the block's selector. */
function blocks(css: string): Map<string, Map<string, string>> {
  const out = new Map<string, Map<string, string>>();
  for (const [, selector, body] of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/^([^\s{][^{]*?)\s*\{([^}]*)\}/gm)) {
    const decls = out.get(selector!) ?? new Map<string, string>();
    for (const [, name, value] of body!.matchAll(/(--[\w-]+):\s*([^;]+);/g)) decls.set(name!, value!.trim());
    out.set(selector!, decls);
  }
  return out;
}

describe('generated files', () => {
  const files = generatedText();

  it('carry no value a template failed to format', () => {
    for (const [file, text] of files) {
      for (const bad of [/\[object Object\]/, /\bundefined\b/, /\bNaN\b/]) {
        expect(text, `${file} contains ${bad}`).not.toMatch(bad);
      }
    }
  });

  it('name every CSS variable they use, and no empty one', () => {
    for (const [file, text] of files.filter(([f]) => f.endsWith('.css'))) {
      expect(text, `${file} writes a variable with an empty name`).not.toMatch(/---/);
      const defined = new Set([...text.matchAll(/(--[\w-]+):/g)].map((m) => m[1]));
      for (const [, used] of text.matchAll(/var\((--[\w-]+)/g)) {
        expect(defined.has(used!), `${file} uses ${used} but never defines it`).toBe(true);
      }
    }
  });
});

describe('modes across formats', () => {
  const withModes = themes.filter((id) =>
    modeNames(JSON.parse(readFileSync(join(root, 'themes', id, 'tokens.json'), 'utf8'))).length > 0);

  it('has a theme with modes to check', () => {
    expect(withModes.length).toBeGreaterThan(0);
  });

  it.each(withModes)('%s: tailwind.css resolves to tokens.css in every mode', (id) => {
    const css = blocks(readFileSync(join(root, 'themes', id, 'dist', 'tokens.css'), 'utf8'));
    const tw = blocks(readFileSync(join(root, 'themes', id, 'dist', 'tailwind.css'), 'utf8'));
    const modes = modeNames(JSON.parse(readFileSync(join(root, 'themes', id, 'tokens.json'), 'utf8')));
    for (const mode of [null, ...modes]) {
      const look = (b: Map<string, Map<string, string>>, base: string) =>
        new Map([...b.get(base)!, ...(mode ? b.get(modeSelector(mode)) ?? [] : [])]);
      const vars = look(css, ':root');
      const resolve = (v: string, depth = 0): string =>
        depth > 20 ? v : v.replace(/var\((--[\w-]+)\)/g, (_, n: string) => resolve(vars.get(n) ?? n, depth + 1));
      const flat = look(tw, '@theme');
      for (const [name, value] of vars) {
        if (!flat.has(name)) continue;
        expect(flat.get(name)!.toLowerCase(), `${id} ${mode ?? 'default'} ${name}`).toBe(resolve(value).toLowerCase());
      }
    }
  });

  it.each(withModes)('%s: theme.ts holds every value each mode resolves to', (id) => {
    const source = JSON.parse(readFileSync(join(root, 'themes', id, 'tokens.json'), 'utf8'));
    const ts = readFileSync(join(root, 'themes', id, 'dist', 'theme.ts'), 'utf8');
    const theme = JSON.parse(/= (\{[\s\S]*\}) as const;/.exec(ts)![1]!);
    const at = (tree: any, path: string) => path.split('.').reduce((n, s) => n?.[s], tree);
    for (const mode of modeNames(source)) {
      const look = tokensForMode(source, mode);
      for (const [path, leaf] of leavesOf(look)) {
        const shipped = at(theme[MODE_GROUP][mode], path) ?? at(theme, path);
        expect(shipped, `${id} ${mode} ${path}`).toEqual(resolveToken(look, leaf.$value));
      }
    }
  });
});
