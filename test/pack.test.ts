import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix } from 'node:path';
import { packFileList, skillFileList } from '../scripts/build-pack.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('packFileList', () => {
  const files = packFileList(join(root, 'themes'));

  it('lists only files that exist', () => {
    for (const f of files) expect(existsSync(join(root, f)), f).toBe(true);
  });

  it('carries, for every theme, the vector, the raster, the document and the tokens', () => {
    for (const id of ['tebin', 'tebin-classic', 'slate']) {
      const own = files.filter((f) => f.startsWith(`themes/${id}/`));
      expect(own.some((f) => f.endsWith('DESIGN.md')), id).toBe(true);
      expect(own.some((f) => f.endsWith('dist/colors.csv')), id).toBe(true);
      expect(own.some((f) => f.endsWith('dist/tokens.css')), id).toBe(true);
      expect(own.some((f) => f.endsWith('dist/tokens.dtcg.json')), id).toBe(true);
      expect(own.some((f) => f.endsWith('dist/theme.ts')), id).toBe(true);
    }
    expect(files.some((f) => f.endsWith('.png'))).toBe(true);
    expect(files.some((f) => f.endsWith('.svg'))).toBe(true);
    expect(files).toContain('README.md');
    expect(files).toContain('docs/guide/office.md');
    expect(files).toContain('examples/README.md');
    expect(files).toContain('examples/classic/project-report.docx');
    expect(files).toContain('examples/classic/presentation-layouts.pptx');
    expect(files).toContain('examples/modern/project-form.html');
  });

  it('excludes source and build files', () => {
    expect(files.some((f) => f.includes('node_modules'))).toBe(false);
    expect(files.some((f) => f.endsWith('tokens.json'))).toBe(false);
    expect(files.some((f) => f.endsWith('manifest.json'))).toBe(false);
  });
});

describe('the brand pack is whole on its own', () => {
  const files = packFileList(join(root, 'themes'));

  it('resolves every relative link in its Markdown inside the pack', () => {
    for (const doc of files.filter((f) => f.endsWith('.md'))) {
      const md = readFileSync(join(root, doc), 'utf8');
      for (const [, link = ''] of md.matchAll(/\]\(([^)\s]+)/g)) {
        const target = link.replace(/#.*$/, '');
        if (!target || /^[a-z]+:/.test(target)) continue;
        expect(files, `${doc} → ${target}`).toContain(posix.join(posix.dirname(doc), target));
      }
    }
  });
});

describe('skillFileList', () => {
  it('holds the skill folder at the ZIP root, as claude.ai expects', () => {
    const files = skillFileList();
    expect(files).toContain('tebin-style/SKILL.md');
    for (const f of files) {
      expect(f.startsWith('tebin-style/'), f).toBe(true);
      expect(existsSync(join(root, 'skills', f)), f).toBe(true);
    }
  });
});
