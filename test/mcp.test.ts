import { describe, it, expect } from 'vitest';
import { listThemes, getTheme, getAsset, toolDefinitions } from '../mcp/tools.js';
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
});

describe('toolDefinitions', () => {
  it('declares the three tools', () => {
    expect(toolDefinitions.map((t) => t.name)).toEqual(['list_themes', 'get_theme', 'get_asset']);
  });
});
