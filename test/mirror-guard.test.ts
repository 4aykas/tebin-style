import { describe, it, expect } from 'vitest';
// @ts-expect-error -- a plain .mjs hook without type declarations
import { verdict } from '../.claude/hooks/mirror-guard.mjs';

describe('mirror guard hook', () => {
  it.each([
    'gh pr create --base main --title x',
    'gh issue list --state open',
    'cd repo && gh pr merge 98 --merge',
    'gh.exe issue view 12',
    'git push github main',
    'git push -q github v1.12.2',
  ])('denies %s', (command) => {
    expect(verdict(command)).toMatch(/Gitea|origin/);
  });

  it.each([
    'git push origin main',
    'git push -q origin v1.12.2',
    'gh run list -R 4aykas/tebin-style',
    'gh release view v1.12.2',
    'git ls-remote github refs/heads/main',
    'node scripts/gitea-api.mjs watch HEAD',
    'grep -n "gh pr" docs/agents/issue-tracker.md',
  ])('allows %s', (command) => {
    expect(verdict(command)).toBeNull();
  });
});
