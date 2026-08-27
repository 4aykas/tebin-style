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

describe('the new token groups reach the document', () => {
  const tebin = buildDesignDoc(join(root, 'themes', 'tebin'));

  it('lists the roles and what each points at', () => {
    expect(tebin).toContain('## Roles');
    expect(tebin).toContain('`role.primary`');
    expect(tebin).toContain('`color.brand`');
  });

  it('warns that the fill red is not the text red', () => {
    expect(tebin).toContain('role.primary-on-dark');
    expect(tebin).toContain('small text');
  });

  it('prints the type scale with its fluid range, not just the ceiling', () => {
    expect(tebin).toContain('## Typography');
    expect(tebin).toContain('clamp(28px, 4.5vw, 38px)');
  });

  it('prints the spacing scale and the container widths', () => {
    expect(tebin).toContain('## Spacing');
    expect(tebin).toContain('1200px');
  });

  it('omits the sections a theme does not have', () => {
    const slate = buildDesignDoc(join(root, 'themes', 'slate'));
    expect(slate).not.toContain('## Spacing');
  });
});

describe('the asset table names the real format', () => {
  const tebin = buildDesignDoc(join(root, 'themes', 'tebin'));

  it('does not call a PNG or an ICO a vector', () => {
    const rows = tebin.split(/\r?\n/).filter((l) => l.startsWith('| `favicon-'));
    const png = rows.find((l) => l.includes('favicon-png'))!;
    const ico = rows.find((l) => l.includes('favicon-ico'))!;
    expect(png).toContain('[PNG]');
    expect(ico).toContain('[ICO]');
    expect(png).not.toContain('[SVG]');
    expect(ico).not.toContain('[SVG]');
  });

  it('still labels a real vector SVG', () => {
    const row = tebin.split(/\r?\n/).find((l) => l.startsWith('| `logo-full` |'))!;
    expect(row).toContain('[SVG]');
  });
});

describe('the document carries machine-readable tokens', () => {
  const tebin = buildDesignDoc(join(root, 'themes', 'tebin'));

  it('opens with front matter, then the human document', () => {
    expect(tebin.startsWith('---\n')).toBe(true);
    expect(tebin).toContain('\n# TEBIN — design');
    expect(tebin.indexOf('---')).toBeLessThan(tebin.indexOf('# TEBIN'));
  });

  it('an agent given only this file can read the palette without prose', () => {
    expect(tebin).toContain('colors:');
    expect(tebin).toContain('primary: "#DA291C"');
  });
});
