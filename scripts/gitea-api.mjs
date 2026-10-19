#!/usr/bin/env node
// A small client for the Gitea Actions API of tebin-oss/tebin-style (git.tebin.co),
// for reading a push's CI run. The token comes from GITEA_TOKEN or the file
// ~/.env/.gitea and is never printed. Retries a read on a network error, so a
// TLS hiccup does not read as a failed run; a failed POST stops instead.
//
//   node scripts/gitea-api.mjs watch [sha|ref] [workflow]   → waits for the run, prints jobs; exit 0 = green
//   node scripts/gitea-api.mjs run-for [sha|ref] [workflow] → run id, exit 1 if none
//   node scripts/gitea-api.mjs jobs <run>                   → "  name: conclusion" lines
//   node scripts/gitea-api.mjs rerun-failed <run>
//   node scripts/gitea-api.mjs pr <title> [body-file]       → opens a PR from the current branch to main
//   node scripts/gitea-api.mjs pr-for <branch>              → "<n> <open|merged|closed> <head sha> [merge sha]"
//   node scripts/gitea-api.mjs merge <pr>                   → merges once CI is green, deletes the branch
// The workflow defaults to ci.yml; a tag's run is release.yml. `main` takes
// changes only through a PR with a green `CI / verify (pull_request)`.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const REPO = process.env.GITEA_REPO ?? 'tebin-oss/tebin-style';
const BASE = `${process.env.GITEA_URL ?? 'https://git.tebin.co'}/api/v1/repos/${REPO}`;

function token() {
  if (process.env.GITEA_TOKEN) return process.env.GITEA_TOKEN.trim();
  try { return readFileSync(join(homedir(), '.env', '.gitea'), 'utf8').trim(); } catch { /* none */ }
  console.error('no Gitea token: set GITEA_TOKEN or put it in ~/.env/.gitea');
  process.exit(2);
}

async function api(path, init = {}) {
  // Only a read is retried. A POST that failed in flight (a reset after Gitea
  // took the merge) may have landed; sending it again would fail on its own
  // success, so the caller checks the state instead.
  const retry = (init.method ?? 'GET') === 'GET';
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch(`${BASE}${path}`, { ...init, headers: { Authorization: `token ${token()}`, 'Content-Type': 'application/json' } });
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      // A 4xx is no hiccup (expired token, wrong repo): retrying it would leave
      // a watcher waiting forever.
      if (!res.ok) {
        console.error(`Gitea API ${path}: HTTP ${res.status}${res.status === 401 ? ' (token rejected: ~/.env/.gitea)' : ''}`);
        process.exit(2);
      }
      // Some calls (a PR merge) answer 200 with an empty body; parsing it
      // would throw and retry a merge that already happened.
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } catch (e) {
      if (!retry) {
        console.error(`Gitea API ${init.method} ${path} failed (${e.message}); it may have landed: check before running it again.`);
        process.exit(2);
      }
      if (i === 5) throw e;
      await new Promise((r) => setTimeout(r, 10_000));
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Gitea matches head_sha only in full: a short SHA or a ref finds nothing.
const fullSha = (ref) => execFileSync('git', ['rev-parse', `${ref ?? 'HEAD'}^{commit}`], { encoding: 'utf8' }).trim();

/** The named workflow's run for a commit, or undefined. */
async function runFor(sha, workflow) {
  const { workflow_runs = [] } = await api(`/actions/runs?head_sha=${sha}&limit=20`);
  return workflow_runs.find((r) => (r.path ?? '').split('@')[0].endsWith(workflow));
}

/**
 * The instance's runners by state, or null when the token may not see them:
 * the list is an admin endpoint, and a missing answer only means no hint.
 */
async function runners() {
  try {
    const res = await fetch(`${process.env.GITEA_URL ?? 'https://git.tebin.co'}/api/v1/admin/actions/runners`,
      { headers: { Authorization: `token ${token()}` } });
    if (!res.ok) return null;
    const { runners: list = [] } = await res.json();
    const name = (r) => r.name;
    return { online: list.filter((r) => r.status !== 'offline').map(name), offline: list.filter((r) => r.status === 'offline').map(name) };
  } catch {
    return null;
  }
}

async function printJobs(run) {
  const { jobs = [] } = await api(`/actions/runs/${run}/jobs`);
  for (const j of jobs) console.log(`  ${j.name}: ${j.conclusion ?? j.status}`);
}

const [cmd, arg, extra] = process.argv.slice(2);
const workflow = extra ?? 'ci.yml';
if (cmd === 'run-for') {
  const sha = fullSha(arg);
  const run = await runFor(sha, workflow);
  if (!run) { console.error(`no ${workflow} run for ${sha} (yet)`); process.exit(1); }
  console.log(run.id);
} else if (cmd === 'watch') {
  const sha = fullSha(arg);
  let run;
  for (let i = 0; i < 12 && !(run = await runFor(sha, workflow)); i++) await sleep(10_000);
  if (!run) { console.error(`no ${workflow} run for ${sha} after 2 minutes: was it pushed to origin?`); process.exit(1); }
  console.log(`run ${run.id} for ${sha.slice(0, 7)}`);
  // A queued run waits as long as a runner is up, busy or not: a queue is no
  // failure. With every runner offline it says so, waits five minutes for one
  // to start, then stops. A run that started gets 30 minutes.
  const queuedAt = Date.now();
  let startedAt = null, offlineSince = null, toldBusy = false;
  while (run.status !== 'completed') {
    if (run.status !== 'queued' && run.status !== 'waiting') {
      startedAt ??= Date.now();
      if (Date.now() - startedAt > 30 * 60_000) {
        await printJobs(run.id);
        console.error(`still ${run.status} after 30 minutes`);
        process.exit(1);
      }
    } else if (Date.now() - queuedAt > 2 * 60_000) {
      const state = await runners();
      if (state && state.online.length === 0) {
        if (!offlineSince) {
          offlineSince = Date.now();
          console.error(`queued, and every runner is offline (${state.offline.join(', ')}); waiting 5 minutes for one to start`);
        } else if (Date.now() - offlineSince > 5 * 60_000) {
          console.error('no runner came online: start it, then run watch again');
          process.exit(1);
        }
      } else if (state && !toldBusy) {
        toldBusy = true;
        offlineSince = null;
        console.log(`queued behind a busy runner (${state.online.join(', ')}); waiting`);
      }
    }
    await sleep(20_000);
    run = await api(`/actions/runs/${run.id}`);
  }
  await printJobs(run.id);
  console.log(`conclusion: ${run.conclusion}`);
  if (run.conclusion !== 'success') process.exit(1);
} else if (cmd === 'jobs') {
  await printJobs(arg);
} else if (cmd === 'rerun-failed') {
  await api(`/actions/runs/${arg}/rerun-failed-jobs`, { method: 'POST' });
} else if (cmd === 'pr') {
  const head = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
  const body = extra ? readFileSync(extra, 'utf8') : '';
  const pr = await api('/pulls', { method: 'POST', body: JSON.stringify({ head, base: 'main', title: arg, body }) });
  console.log(`#${pr.number} ${pr.html_url}`);
} else if (cmd === 'pr-for') {
  // "<number> <open|merged|closed> <head sha> [merge sha]" for the newest PR
  // from a branch. Once the branch is deleted its name lives on in head.label.
  const pulls = await api('/pulls?state=all&sort=newest&limit=50');
  const pr = pulls.find((p) => p.head?.ref === arg || p.head?.label === arg);
  if (!pr) { console.error(`no pull request from ${arg}`); process.exit(1); }
  console.log([pr.number, pr.merged ? 'merged' : pr.state, pr.head.sha, pr.merged ? pr.merge_commit_sha : ''].join(' ').trim());
} else if (cmd === 'merge') {
  await api(`/pulls/${arg}/merge`, { method: 'POST', body: JSON.stringify({ Do: 'merge', delete_branch_after_merge: true }) });
  console.log(`merged #${arg}`);
} else {
  console.error('usage: gitea-api.mjs watch [sha] [workflow] | run-for [sha] [workflow] | jobs <run> | rerun-failed <run> | pr <title> [body-file] | pr-for <branch> | merge <pr>');
  process.exit(2);
}
