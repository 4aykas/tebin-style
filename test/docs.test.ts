import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const index = JSON.parse(readFileSync(join(root, 'registry', 'index.json'), 'utf8'));

describe('README', () => {
  it('mentions every theme in the registry', () => {
    for (const t of index.themes) {
      expect(readme).toContain(t.id);
    }
  });
  it('documents the pnpm scripts', () => {
    for (const s of ['pnpm build', 'pnpm validate', 'pnpm check', 'pnpm test']) {
      expect(readme).toContain(s);
    }
  });
});
