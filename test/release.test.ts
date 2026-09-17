import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('release gate', () => {
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const run = (tag: string) => spawnSync(process.execPath,
    [fileURLToPath(new URL('../scripts/check-release.mjs', import.meta.url))],
    { env: { ...process.env, GITHUB_REF_NAME: tag }, encoding: 'utf8' });
  it('accepts the documented package version', () => {
    expect(run(`v${version}`).status).toBe(0);
  });
  it('rejects a tag for another version', () => {
    const result = run('v0.0.0');
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Expected release tag');
  });
});
