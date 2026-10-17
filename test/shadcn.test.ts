import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildShadcnItem } from '../src/shadcn.js';
import { contrastRatio } from '../src/contrast.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'ts-shadcn-'));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

function fixture(name: string, theme: unknown, tokens: unknown): string {
  const dir = join(tmp, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'theme.json'), JSON.stringify(theme));
  writeFileSync(join(dir, 'tokens.json'), JSON.stringify(tokens));
  return dir;
}

describe('buildShadcnItem', () => {
  const tebin = buildShadcnItem(join(root, 'themes', 'tebin'))!;

  it('makes a registry:theme item named after the theme', () => {
    expect(tebin.type).toBe('registry:theme');
    expect(tebin.name).toBe('tebin');
    expect(tebin.$schema).toBe('https://ui.shadcn.com/schema/registry-item.json');
  });

  it('takes primary from the everyday button, so tebin primary is ink, not red', () => {
    expect(tebin.cssVars.light.primary).toBe('#292929');
    expect(tebin.cssVars.light['primary-foreground']).toBe('#FCFBF8');
    expect(tebin.cssVars.light.primary).not.toBe('#DA291C');
  });

  it('lands the control radius on rounded-md', () => {
    expect(tebin.cssVars.light.radius).toBe('6px');
  });

  it('carries font stacks with quoted multi-word names, and the easing curves', () => {
    expect(tebin.cssVars.theme['font-condensed']).toBe('"Roboto Condensed", Roboto, sans-serif');
    expect(tebin.cssVars.theme['ease-enter']).toBe('cubic-bezier(0.23, 1, 0.32, 1)');
  });

  it('picks the better-reading end of the theme for a label when no button says', () => {
    const slate = buildShadcnItem(join(root, 'themes', 'slate'))!;
    const { primary, 'primary-foreground': label } = slate.cssVars.light;
    expect(primary).toBe('#2563EB');
    expect(contrastRatio(label!, primary!)).toBeGreaterThanOrEqual(4.5);
  });

  it('makes no item for a theme that is not for the web', () => {
    expect(buildShadcnItem(join(root, 'themes', 'tebin-classic'))).toBeNull();
  });

  it('leaves out every variable the theme has no token for', () => {
    const dir = fixture('partial', { id: 'p', name: 'P', media: ['web'] },
      { role: { surface: { $value: '#FFFFFF' } } });
    expect(buildShadcnItem(dir)!.cssVars).toEqual({ theme: {}, light: { background: '#FFFFFF', card: '#FFFFFF', popover: '#FFFFFF' } });
  });
});
