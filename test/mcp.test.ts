import { describe, it, expect } from 'vitest';
import { listThemes, getTheme, getAsset, listRules, getRuleTool, toolDefinitions } from '../mcp/tools.js';
import { NotFoundError } from '../src/registry.js';

describe('list_themes', () => {
  it('returns tebin with no filters', () => {
    const r = listThemes({});
    expect(r.count).toBe(r.themes.length);
    expect(r.themes.some((t) => t.id === 'tebin')).toBe(true);
  });
  it('filters by industry', () => {
    expect(listThemes({ industry: 'engineering' }).themes.some((t) => t.id === 'tebin')).toBe(true);
    expect(listThemes({ industry: 'nope' }).count).toBe(0);
  });
  it('filters by query against id/name', () => {
    expect(listThemes({ query: 'teb' }).themes.some((t) => t.id === 'tebin')).toBe(true);
  });
});

describe('get_theme', () => {
  it('defaults to css', () => {
    const r = getTheme({ id: 'tebin' });
    expect(r.format).toBe('css');
    expect(r.content).toContain('--color-brand');
    expect(r.name).toBe('TEBIN');
  });
  it('returns the ts format', () => {
    expect(getTheme({ id: 'tebin', format: 'ts' }).content).toContain('export const tebin');
  });
  it('throws for an unknown theme', () => {
    expect(() => getTheme({ id: 'nope' })).toThrow(NotFoundError);
  });
});

describe('get_asset', () => {
  it('lists assets when no assetId', () => {
    const r = getAsset({ id: 'tebin' }) as { assets: Array<{ id: string }> };
    expect(r.assets.some((a) => a.id === 'logo-full')).toBe(true);
  });
  it('returns SVG content as utf8', () => {
    const r = getAsset({ id: 'tebin', assetId: 'logo-full' }) as { encoding: string; content: string; rawUrl: string };
    expect(r.encoding).toBe('utf8');
    expect(r.content).toContain('<svg');
    expect(r.rawUrl).toContain('themes/tebin/assets/logo/logo-full.svg');
  });
  it('returns binary content as base64', () => {
    const r = getAsset({ id: 'tebin', assetId: 'favicon-png' }) as { encoding: string };
    expect(r.encoding).toBe('base64');
  });
  it('throws for an unknown asset', () => {
    expect(() => getAsset({ id: 'tebin', assetId: 'nope' })).toThrow(NotFoundError);
  });
  it('returns a generated PNG as base64', () => {
    const r = getAsset({ id: 'tebin-classic', assetId: 'logo-full@1024' }) as {
      encoding: string;
      format: string;
      content: string;
    };
    expect(r.encoding).toBe('base64');
    expect(r.format).toBe('png');
    expect(r.content.length).toBeGreaterThan(1000);
  });
});

describe('list_rules / get_rule', () => {
  it('lists rules filtered by category', () => {
    const r = listRules({ category: 'forms' });
    expect(r.count).toBe(r.rules.length);
    expect(r.rules.every((x) => x.category === 'forms')).toBe(true);
  });
  it('gets a rule by id', () => {
    expect(getRuleTool({ id: 'forms-loading-button' }).severity).toBe('MUST');
  });
  it('throws for an unknown rule', () => {
    expect(() => getRuleTool({ id: 'nope' })).toThrow(NotFoundError);
  });
});

describe('toolDefinitions', () => {
  it('declares the seven tools', () => {
    expect(toolDefinitions.map((t) => t.name)).toEqual([
      'list_themes', 'get_theme', 'get_asset', 'list_rules',
      'lint_theme', 'diff_themes', 'get_rule',
    ]);
  });
});

describe('the checkable surface', () => {
  it('serves DESIGN.md as a format, so an agent can take the whole document', async () => {
    const { getTheme: gt } = await import('../mcp/tools.js');
    const r = gt({ id: 'tebin', format: 'design-md' });
    expect(r.filename).toBe('DESIGN.md');
    expect(r.content.startsWith('---')).toBe(true);
    expect(r.content).toContain('# TEBIN — design');
  });

  it('lints every shipped theme clean', async () => {
    const { lintThemeTool } = await import('../mcp/tools.js');
    for (const id of ['tebin', 'tebin-classic', 'slate']) {
      const r = lintThemeTool({ id });
      expect(r.summary.errors, `${id}`).toBe(0);
      expect(Array.isArray(r.findings)).toBe(true);
    }
  });

  it('diffs a theme against itself with no regression', async () => {
    const { diffThemesTool } = await import('../mcp/tools.js');
    const r = diffThemesTool({ a: 'tebin', b: 'tebin' });
    expect(r.regression).toBe(false);
  });

  it('refuses an unknown theme by name rather than returning nothing', async () => {
    const { lintThemeTool } = await import('../mcp/tools.js');
    expect(() => lintThemeTool({ id: 'nope' })).toThrow(NotFoundError);
  });

  it('registers the two new tools', () => {
    const names = toolDefinitions.map((t) => t.name);
    expect(names).toContain('lint_theme');
    expect(names).toContain('diff_themes');
  });
});
