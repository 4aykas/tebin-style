// Cuts a release in the order that works with a protected main and a push
// mirror, stopping at the first red step:
//   CHANGELOG "## Unreleased" → "## <version> — <today>", package.json version,
//   pnpm build + verify, a release/v<version> PR on Gitea, its CI, the merge,
//   the tag on the merge commit, then Gitea's release run and GitHub's.
// usage: node scripts/release.mjs <version> --reviewed
// --reviewed says the diff since the last tag was reviewed against
// CODING_STANDARDS.md (AGENTS.md, Release); there is no release without it.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const [version] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) throw new Error('usage: node scripts/release.mjs <version> --reviewed');
if (!process.argv.includes('--reviewed')) {
  console.error('review the diff since the last tag against CODING_STANDARDS.md first, then pass --reviewed');
  process.exit(2);
}
const tag = `v${version}`;
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], shell: process.platform === 'win32' && cmd === 'pnpm', ...opts }).trim();
const live = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' && cmd === 'pnpm' });
const step = (s) => console.log(`\n== ${s}`);

step('main is clean and current');
if (sh('git', ['branch', '--show-current']) !== 'main') throw new Error('run from main');
if (sh('git', ['status', '--porcelain'])) throw new Error('the tree has uncommitted changes');
sh('git', ['pull', '-q', '--ff-only', 'origin', 'main']);

// The release branch comes first, so a red step leaves main clean: switch
// back with `git checkout -f main` and delete the branch to start over.
const branch = `release/${tag}`;
sh('git', ['checkout', '-q', '-b', branch]);

step(`changelog and package.json → ${version}`);
const today = new Date().toISOString().slice(0, 10);
const changelog = readFileSync('CHANGELOG.md', 'utf8');
if (!/^## Unreleased$/m.test(changelog)) throw new Error('CHANGELOG.md has no "## Unreleased" section');
writeFileSync('CHANGELOG.md', changelog.replace(/^## Unreleased$/m, `## ${version} — ${today}`));
const pkg = readFileSync('package.json', 'utf8');
writeFileSync('package.json', pkg.replace(/"version": "[^"]+"/, `"version": "${version}"`));

step('build and verify');
live('pnpm', ['build']);
// The pre-push hook runs verify on the branch push; run it here only when the
// hook is not installed, so one release runs the gate once on this machine.
let hooks = '';
try { hooks = sh('git', ['config', 'core.hooksPath']); } catch { /* unset */ }
if (hooks !== '.githooks') live('pnpm', ['verify']);

step('pull request');
// The tree was clean at the start, so everything here is the bump and what
// the build made from it, new generated files included.
sh('git', ['add', '-A']);
sh('git', ['commit', '-q', '-m', `release: ${version}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`]);
live('git', ['push', '-q', '-u', 'origin', branch]);
const pr = sh('node', ['scripts/gitea-api.mjs', 'pr', `release: ${version}`]).match(/^#(\d+)/)?.[1];
if (!pr) throw new Error('no pull request number');
live('node', ['scripts/gitea-api.mjs', 'watch', 'HEAD']);
live('node', ['scripts/gitea-api.mjs', 'merge', pr]);
sh('git', ['checkout', '-q', 'main']);
sh('git', ['pull', '-q', '--ff-only', 'origin', 'main']);
sh('git', ['branch', '-D', branch]);

step(`tag ${tag}`);
sh('git', ['tag', '-a', tag, '-m', tag]);
live('git', ['push', '-q', 'origin', tag]);
live('node', ['scripts/gitea-api.mjs', 'watch', tag, 'release.yml']);

step('GitHub release from the mirrored tag');
for (let i = 0; i < 60; i++) {
  const runs = JSON.parse(sh('gh', ['run', 'list', '-R', '4aykas/tebin-style', '--workflow', 'release.yml', '--limit', '5', '--json', 'headBranch,status,conclusion,url']));
  const run = runs.find((r) => r.headBranch === tag);
  if (run?.status === 'completed') {
    console.log(`${run.conclusion}: ${run.url}`);
    if (run.conclusion !== 'success') process.exit(1);
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 20_000));
}
console.error('no completed GitHub release run after 20 minutes: is the push mirror syncing?');
process.exit(1);
