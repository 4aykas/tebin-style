// Cuts a release in the order that works with a protected main and a push
// mirror, stopping at the first red step:
//   CHANGELOG "## Unreleased" → "## <version> — <today>", package.json version,
//   pnpm build + verify, a release/v<version> PR on Gitea, its CI, the merge,
//   the tag on the merge commit, then Gitea's release run and GitHub's.
// usage: node scripts/release.mjs <version> --reviewed [--resume]
// --reviewed says the diff since the last tag was reviewed against
// CODING_STANDARDS.md (AGENTS.md, Release); there is no release without it.
// --resume picks a stopped release up where it stopped (a runner down, a
// watch that gave up): it reads the PR and the tag from Gitea and runs only
// the steps still to do.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resumeStep, tagStep } from './decide.mjs';

const [version] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) throw new Error('usage: node scripts/release.mjs <version> --reviewed [--resume]');
if (!process.argv.includes('--reviewed')) {
  console.error('review the diff since the last tag against CODING_STANDARDS.md first, then pass --reviewed');
  process.exit(2);
}
const resume = process.argv.includes('--resume');
const tag = `v${version}`;
const branch = `release/${tag}`;
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], shell: process.platform === 'win32' && cmd === 'pnpm', ...opts }).trim();
const live = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' && cmd === 'pnpm' });
const step = (s) => console.log(`\n== ${s}`);
// scripts/gitea-api.mjs: `gitea` shows its output, `giteaOut` returns it.
const gitea = (...args) => live('node', ['scripts/gitea-api.mjs', ...args]);
const giteaOut = (...args) => sh('node', ['scripts/gitea-api.mjs', ...args]);
const quiet = (cmd, args) => { try { return sh(cmd, args, { stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };

/**
 * The release PR as `{ number, state, head, merge }`, or null when the branch
 * has none. Any other failure (a rejected token, the network) stops the
 * release with gitea-api's own message.
 */
function releasePr() {
  let line;
  try { line = giteaOut('pr-for', branch); } catch (e) { if (e.status === 1) return null; throw e; }
  const [number, state, head, merge] = line.split(' ');
  return { number, state, head, merge };
}

if (!resume) {
  step('main is clean and current');
  if (sh('git', ['branch', '--show-current']) !== 'main') throw new Error('run from main');
  if (sh('git', ['status', '--porcelain'])) throw new Error('the tree has uncommitted changes');
  sh('git', ['pull', '-q', '--ff-only', 'origin', 'main']);

  // The release branch comes first, so a red step leaves main clean: switch
  // back with `git checkout -f main` and delete the branch to start over.
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
  gitea('pr', `release: ${version}`);
}

// The commit the remote tag names (the peeled `^{}` line), or '' before the tag.
const remoteTagged = () => sh('git', ['ls-remote', 'origin', `refs/tags/${tag}^{}`]).split(/\s/)[0] ?? '';
// Which step comes next, and when to refuse: scripts/decide.mjs.
let tagged = remoteTagged();
let pr = tagged ? null : releasePr();
const local = quiet('git', ['rev-parse', '--verify', '-q', `refs/heads/${branch}`]);
let localInPr = false;
if (local && pr) {
  // The PR's head is on its branch, or in main's history once merged.
  quiet('git', ['fetch', '-q', 'origin', 'main']);
  quiet('git', ['fetch', '-q', 'origin', branch]);
  try { sh('git', ['merge-base', '--is-ancestor', local, pr.head], { stdio: ['ignore', 'pipe', 'ignore'] }); localInPr = true; } catch { /* ahead, or the head is unknown here */ }
}
const plan = resumeStep({ branch, remoteTag: tagged, pr, local, localInPr });
if (plan.refuse) throw new Error(plan.refuse);
if (plan.next !== 'runs') {
  if (plan.next === 'merge') {
    step(`CI for #${pr.number}`);
    gitea('watch', pr.head);
    gitea('merge', pr.number);
    // Gitea may report the merge a moment after it answers.
    for (let i = 0; i < 6 && !(pr = releasePr())?.merge; i++) await new Promise((r) => setTimeout(r, 5_000));
  }
  const existing = quiet('git', ['rev-parse', '--verify', '-q', `refs/tags/${tag}^{commit}`]);
  const tagging = tagStep({ tag, pr, existing });
  if (tagging.refuse) throw new Error(tagging.refuse);

  step(`tag ${tag} on ${pr.merge.slice(0, 7)}`);
  sh('git', ['checkout', '-q', 'main']);
  sh('git', ['pull', '-q', '--ff-only', 'origin', 'main']);
  if (local) sh('git', ['branch', '-D', branch]);
  if (tagging.create) sh('git', ['tag', '-a', tag, '-m', tag, pr.merge]);
  live('git', ['push', '-q', 'origin', tag]);
  tagged = pr.merge;
}

step('Gitea release run');
// The tagged commit, which watch can name even when the tag is only remote.
sh('git', ['fetch', '-q', 'origin', 'main']);
gitea('watch', tagged, 'release.yml');

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
