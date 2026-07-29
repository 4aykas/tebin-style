import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDesignDoc, DOC_CATEGORIES } from '../src/design-doc.js';
import { collectColorRows } from '../src/colors-csv.js';
import { filterRules } from '../src/rules.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('buildDesignDoc', () => {
  const dir = join(root, 'themes', 'tebin-classic');
  const doc = buildDesignDoc(dir);

  it('says it is generated', () => {
    expect(doc).toContain('do not edit by hand');
  });

  it('inlines the hand-written intro', () => {
    const intro = readFileSync(join(dir, 'design.intro.md'), 'utf8').trim();
    expect(doc).toContain(intro.split('\n')[0]);
  });

  it('lists every colour token with its hex and rgb', () => {
    for (const row of collectColorRows(dir)) {
      expect(doc, row.token).toContain(row.hex);
      expect(doc, row.token).toContain(`${row.rgb.r}, ${row.rgb.g}, ${row.rgb.b}`);
    }
  });

  it('states the missing print value in words', () => {
    expect(doc).toContain('not specified in the 2017 brand book');
  });

  it('offers a download link for every PNG size', () => {
    for (const width of [512, 1024, 2048]) {
      expect(doc).toContain(`assets/png/logo-full-${width}.png?raw=1`);
    }
  });

  it('carries every brand, typography and theming rule', () => {
    for (const category of DOC_CATEGORIES) {
      for (const rule of filterRules({ category })) {
        expect(doc, rule.id).toContain(rule.statement);
      }
    }
  });

  it('has no relative links — the file must survive being copied out of the repo', () => {
    const links = [...doc.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
    expect(links.length).toBeGreaterThan(5);
    for (const link of links) {
      expect(link, link).toMatch(/^https:\/\//);
    }
  });

  it('names Arial as the Office face', () => {
    expect(doc).toContain('Arial');
  });
});

describe('every theme', () => {
  for (const id of ['tebin', 'tebin-classic', 'slate']) {
    it(`${id} builds a document`, () => {
      expect(buildDesignDoc(join(root, 'themes', id)).length).toBeGreaterThan(500);
    });
  }

  it('tebin documents its translucent scale', () => {
    const doc = buildDesignDoc(join(root, 'themes', 'tebin'));
    expect(doc).toContain('Translucent scale');
    expect(doc).toContain('on-dark');
  });
});
