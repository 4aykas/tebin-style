import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

describe('tests render SVG without system fonts', () => {
  it('constructs Resvg only in test/resvg.ts', () => {
    const offenders = readdirSync(here)
      .filter((f) => f.endsWith('.ts') && f !== 'resvg.ts')
      .filter((f) => /new\s+Resvg\s*\(/.test(readFileSync(join(here, f), 'utf8')));
    expect(offenders, 'use renderNoFonts from ./resvg.js').toEqual([]);
  });
});
