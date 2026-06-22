import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const schemaDir = join(here, '..', 'schema');

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const themeSchema = JSON.parse(readFileSync(join(schemaDir, 'theme.schema.json'), 'utf8'));
const tokensSchema = JSON.parse(readFileSync(join(schemaDir, 'tokens.schema.json'), 'utf8'));

const validateThemeFn = ajv.compile(themeSchema);
const validateTokensFn = ajv.compile(tokensSchema);

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
  return toResult(valid, validateThemeFn.errors);
}

export function validateTokens(obj: unknown): ValidationResult {
  const valid = validateTokensFn(obj) as boolean;
  return toResult(valid, validateTokensFn.errors);
}

export function validateThemeDir(dir: string): ValidationResult {
  const errors: string[] = [];

  const themePath = join(dir, 'theme.json');
  const tokensPath = join(dir, 'tokens.json');

  if (!existsSync(themePath)) return { valid: false, errors: ['missing theme.json'] };
  if (!existsSync(tokensPath)) return { valid: false, errors: ['missing tokens.json'] };

  const theme = JSON.parse(readFileSync(themePath, 'utf8')) as Record<string, unknown>;
  const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));

  const metaResult = validateThemeMetadata(theme);
  errors.push(...metaResult.errors.map((e) => `theme.json: ${e}`));

  const tokensResult = validateTokens(tokens);
  errors.push(...tokensResult.errors.map((e) => `tokens.json: ${e}`));

  if (theme.id !== basename(dir)) {
    errors.push(`theme.json: id "${String(theme.id)}" must equal folder name "${basename(dir)}"`);
  }

  const assets = Array.isArray(theme.assets) ? theme.assets : [];
  for (const a of assets as Array<{ path?: string; id?: string }>) {
    if (a.path && !existsSync(join(dir, a.path))) {
      errors.push(`theme.json: asset "${a.id ?? '?'}" path not found: ${a.path}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
