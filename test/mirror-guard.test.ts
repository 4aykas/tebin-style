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
    'bash -c "gh pr create --title x"',
    "pwsh -Command 'git push github main'",
    'eval "gh issue list"',
  ])('denies %s', (command) => {
    expect(verdict(command)).toMatch(/Gitea|origin/);
  });

  it.each([
    'git push --no-verify origin main',
    'git push -q -u origin feat/x --no-verify',
    'git commit --no-verify -m "wip"',
    'git add -A && git commit -n -m x',
    'git -C . push --no-verify',
    'git push --no-verif origin main',
    'git commit -anm "x"',
    'git -c core.hooksPath=/dev/null push origin main',
    'bash -c "git push --no-verify"',
  ])('denies skipping the hooks: %s', (command) => {
    expect(verdict(command)).toMatch(/hooks/);
  });

  it.each([
    'git push -n origin main',
    'git commit -m "say --no-verify is banned"; echo done',
    'git commit -q -F - <<EOF\nnever pass --no-verify\nEOF',
  ])('allows a dry run and a message that only names the flag: %s', (command) => {
    expect(verdict(command)).toBeNull();
  });

  it.each([
    'git push origin main',
    'git push -q origin v1.12.2',
    'gh run list -R 4aykas/tebin-style',
    'gh release view v1.12.2',
    'git ls-remote github refs/heads/main',
    'node scripts/gitea-api.mjs watch HEAD',
    'grep -n "gh pr" docs/agents/issue-tracker.md',
    'git commit --amend --no-edit',
    'bash -c "git push origin main"',
  ])('allows %s', (command) => {
    expect(verdict(command)).toBeNull();
  });
});
