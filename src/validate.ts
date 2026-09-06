import { Ajv2020 } from 'ajv/dist/2020.js';
import { createRequire } from 'node:module';
import { readFileSync, existsSync, realpathSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, relative, isAbsolute, extname } from 'node:path';
import { resolveToken, type TokenTree } from './tokens.js';

const here = dirname(fileURLToPath(import.meta.url));
const schemaDir = join(here, '..', 'schema');

const ajv = new Ajv2020({ allErrors: true, strict: false });
const addFormats = createRequire(import.meta.url)('ajv-formats') as typeof import('ajv-formats').default;
addFormats(ajv);

const themeSchema = JSON.parse(readFileSync(join(schemaDir, 'theme.schema.json'), 'utf8'));
const tokensSchema = JSON.parse(readFileSync(join(schemaDir, 'tokens.schema.json'), 'utf8'));
const rulesSchema = JSON.parse(readFileSync(join(schemaDir, 'rules.schema.json'), 'utf8'));

const validateThemeFn = ajv.compile(themeSchema);
const validateTokensFn = ajv.compile(tokensSchema);
const validateRulesFn = ajv.compile(rulesSchema);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function toResult(valid: boolean, errors: typeof validateThemeFn.errors): ValidationResult {
  return {
    valid,
    errors: (errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message ?? ''}`.trim()),
  };
}

export function validateThemeMetadata(obj: unknown): ValidationResult {
  const valid = validateThemeFn(obj) as boolean;
  const result = toResult(valid, validateThemeFn.errors);
  if (!valid) return result;
  const ids = new Set<string>();
  for (const asset of (obj as { assets?: Array<{ id: string; path: string; format: string }> }).assets ?? []) {
    if (ids.has(asset.id)) result.errors.push(`duplicate asset id: ${asset.id}`);
    ids.add(asset.id);
    if (!/^assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+$/.test(asset.path) || asset.path.split('/').includes('..')) {
      result.errors.push(`asset ${asset.id}: path must name a file inside assets/ using forward slashes`);
    }
    if (extname(asset.path).slice(1).toLowerCase() !== asset.format.toLowerCase()) {
      result.errors.push(`asset ${asset.id}: format does not match file extension`);
    }
  }
  return { valid: result.errors.length === 0, errors: result.errors };
}

export function validateTokens(obj: unknown): ValidationResult {
  const valid = validateTokensFn(obj) as boolean;
  const result = toResult(valid, validateTokensFn.errors);
  if (!valid) return result;
  const tree = obj as TokenTree;
  const walk = (node: TokenTree, prefix = ''): void => {
    for (const [name, child] of Object.entries(node)) {
      if (name.startsWith('$') || !child || typeof child !== 'object') continue;
      const token = child as { $value?: unknown; $type?: string; $extensions?: Record<string, any> };
      const path = prefix ? `${prefix}.${name}` : name;
      if (!('$value' in token)) { walk(child as TokenTree, path); continue; }
      const fluid = token.$extensions?.['pro.tebin.fluid'];
      if (fluid) {
        const [, min, minUnit] = /^(-?[\d.]+)(px|rem|em)$/.exec(fluid.min)!;
        const [, max, maxUnit] = /^(-?[\d.]+)(px|rem|em)$/.exec(fluid.max)!;
        if (token.$type !== 'dimension') result.errors.push(`${path}: fluid extension requires a dimension token`);
        if (minUnit !== maxUnit) result.errors.push(`${path}: fluid bounds must use the same unit`);
        else if (Number(min) > Number(max)) result.errors.push(`${path}: fluid min must not exceed max`);
        if (resolveToken(tree, token.$value) !== fluid.max) result.errors.push(`${path}: fluid token value must equal its max ceiling`);
      }
      if (token.$extensions?.['pro.tebin.print'] && token.$type !== 'color') {
        result.errors.push(`${path}: print extension requires a color token`);
      }
    }
  };
  walk(tree);
  return { valid: result.errors.length === 0, errors: result.errors };
}

export function validateRulesData(obj: unknown, knownThemes?: readonly string[]): ValidationResult {
  const valid = validateRulesFn(obj) as boolean;
  const result = toResult(valid, validateRulesFn.errors);
  if (!valid) return result;
  const ids = new Set<string>();
  for (const rule of obj as Array<{ id: string; themes?: string[] }>) {
    if (ids.has(rule.id)) result.errors.push(`duplicate rule id: ${rule.id}`);
    ids.add(rule.id);
    for (const theme of rule.themes ?? []) {
      if (knownThemes && !knownThemes.includes(theme)) result.errors.push(`rule ${rule.id}: unknown theme ${theme}`);
    }
  }
  return { valid: result.errors.length === 0, errors: result.errors };
}

export function validateThemeDir(dir: string): ValidationResult {
  const errors: string[] = [];

  const themePath = join(dir, 'theme.json');
  const tokensPath = join(dir, 'tokens.json');

  if (!existsSync(themePath)) return { valid: false, errors: ['missing theme.json'] };
  if (!existsSync(tokensPath)) return { valid: false, errors: ['missing tokens.json'] };

  const readJson = (path: string): unknown => {
    try { return JSON.parse(readFileSync(path, 'utf8')); }
    catch (error) { errors.push(`${basename(path)}: ${error instanceof Error ? error.message : String(error)}`); return undefined; }
  };
  const themeData = readJson(themePath);
  const tokens = readJson(tokensPath);

  const metaResult = validateThemeMetadata(themeData);
  errors.push(...metaResult.errors.map((e) => `theme.json: ${e}`));

  const tokensResult = validateTokens(tokens);
  errors.push(...tokensResult.errors.map((e) => `tokens.json: ${e}`));
  if (!metaResult.valid) return { valid: false, errors };
  const theme = themeData as Record<string, unknown>;

  if (theme.id !== basename(dir)) {
    errors.push(`theme.json: id "${String(theme.id)}" must equal folder name "${basename(dir)}"`);
  }

  const assets = Array.isArray(theme.assets) ? theme.assets : [];
  for (const a of assets as Array<{ path?: string; id?: string }>) {
    if (a.path) {
      const target = join(dir, a.path);
      if (!existsSync(target)) errors.push(`theme.json: asset "${a.id ?? '?'}" path not found: ${a.path}`);
      else {
        const rel = relative(realpathSync(dir), realpathSync(target));
        if (rel.startsWith('..') || isAbsolute(rel) || !statSync(target).isFile()) {
          errors.push(`theme.json: asset "${a.id ?? '?'}" must be a file inside its theme`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
