import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildFrontMatter } from '../src/front-matter.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fm = (id: string) => buildFrontMatter(join(root, 'themes', id));

describe('buildFrontMatter', () => {
  const tebin = fm('tebin');

  it('is a fenced block', () => {
    expect(tebin.startsWith('---\n')).toBe(true);
    expect(tebin.trimEnd().endsWith('---')).toBe(true);
  });

  it('names the theme and the spec version it targets', () => {
    expect(tebin).toContain('name: "TEBIN"');
    expect(tebin).toContain('version: alpha');
  });

  it('resolves roles to values — an alias is ours, not the format\'s', () => {
    expect(tebin).toContain('primary: "#DA291C"');
    expect(tebin).not.toContain('{color.brand}');
  });

  it('gives a fluid level its ceiling, which is what the format can hold', () => {
    expect(tebin).toMatch(/ {2}h1:\n {4}fontFamily: "Roboto Condensed"\n {4}fontSize: 38px/);
  });

  it('carries rounded and spacing, containers included', () => {
    expect(tebin).toContain('rounded:');
    expect(tebin).toContain('card: 8px');
    expect(tebin).toContain('spacing:');
    expect(tebin).toContain('container-default: 1200px');
  });

  it('declares the omissions with their reasons', () => {
    expect(tebin).toContain('- section: "components"');
    expect(tebin).toContain('reason: "No canonical button');
  });

  it('omits a key entirely when the group is absent, rather than emitting an empty map', () => {
    const slate = fm('slate');
    expect(slate).not.toContain('typography:');
    expect(slate).not.toContain('spacing:');
    expect(slate).toContain('colors:');
  });
});
