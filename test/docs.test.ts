import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { BLOB_BASE, RAW_BASE } from '../src/design-doc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const index = JSON.parse(readFileSync(join(root, 'registry', 'index.json'), 'utf8'));

/** Every link that points inside this repository must resolve to a real file. */
function repoTargets(markdown: string, fileDir: string): string[] {
  const targets: string[] = [];
  for (const [, link] of markdown.matchAll(/\]\(([^)\s]+)/g)) {
    const clean = link.split('#')[0].replace(/\?raw=1$/, '');
    if (!clean) continue;
    if (clean.startsWith(`${BLOB_BASE}/`)) targets.push(join(root, clean.slice(BLOB_BASE.length + 1)));
    else if (clean.startsWith(`${RAW_BASE}/`)) targets.push(join(root, clean.slice(RAW_BASE.length + 1)));
    else if (!/^[a-z]+:/.test(clean)) targets.push(join(fileDir, clean));
  }
  return targets;
}

describe('documentation links', () => {
  const files = [
    join(root, 'README.md'),
    ...readdirSync(join(root, 'docs', 'guide')).map((f) => join(root, 'docs', 'guide', f)),
    ...['tebin', 'tebin-classic', 'slate'].map((id) => join(root, 'themes', id, 'DESIGN.md')),
    join(root, 'themes', 'tebin', 'README.md'),
  ];

  for (const file of files) {
    it(`${file.replace(root, '.')} links only to files that exist`, () => {
      const dir = dirname(file);
      for (const target of repoTargets(readFileSync(file, 'utf8'), dir)) {
        expect(existsSync(target), `${file} → ${target}`).toBe(true);
      }
    });
  }

  // src="..." images in the README (the hero logo) must exist too.
  it('README image sources exist', () => {
    for (const [, src] of readme.matchAll(/src="([^"]+)"/g)) {
      expect(existsSync(join(root, src)), src).toBe(true);
    }
  });
});

describe('README', () => {
  it('mentions every theme in the registry', () => {
    for (const t of index.themes) {
      expect(readme).toContain(t.id);
    }
  });

  it('offers a PNG download before an SVG one', () => {
    // Markdown link targets end with `.png)` / `.svg)`; the hero <img src>
    // uses quotes, so it does not shadow the first download link.
    expect(readme.indexOf('.png)')).toBeGreaterThan(-1);
    expect(readme.indexOf('.svg)')).toBeGreaterThan(-1);
    expect(readme.indexOf('.png)')).toBeLessThan(readme.indexOf('.svg)'));
  });

  it('shows RGB values, not only a palette image', () => {
    expect(readme).toContain('218, 41, 28');
  });

  it('links all four guides', () => {
    for (const g of ['quick-start.md', 'office.md', 'ai-agents.md', 'developers.md']) {
      expect(readme).toContain(`docs/guide/${g}`);
    }
  });

  it('links each theme DESIGN.md', () => {
    for (const id of ['tebin', 'tebin-classic', 'slate']) {
      expect(readme).toContain(`themes/${id}/DESIGN.md`);
    }
  });
});

describe('developer guide', () => {
  it('documents the pnpm scripts (moved out of the README)', () => {
    const dev = readFileSync(join(root, 'docs', 'guide', 'developers.md'), 'utf8');
    for (const s of ['pnpm build', 'pnpm validate', 'pnpm check', 'pnpm test']) {
      expect(dev).toContain(s);
    }
  });
});
