#!/usr/bin/env node
// A small client for the Gitea Actions API of tebin-oss/tebin-style (git.tebin.co),
// for reading a push's CI run. The token comes from GITEA_TOKEN or the file
// ~/.env/.gitea and is never printed. Retries a read on a network error, so a
// TLS hiccup does not read as a failed run; a failed POST stops instead.
//
//   node scripts/gitea-api.mjs watch [sha|ref] [workflow]   → waits for the run, prints jobs; exit 0 = green, else the failures too
//   node scripts/gitea-api.mjs run-for [sha|ref] [workflow] → run id, exit 1 if none
//   node scripts/gitea-api.mjs jobs <run>                   → "  name: conclusion" lines
//   node scripts/gitea-api.mjs logs <run>                   → the failed jobs' logs, cut to the failures
//   node scripts/gitea-api.mjs get <path> [field,a.b]       → any read: JSON, or one tab-separated line per item
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
const ROOT = `${process.env.GITEA_URL ?? 'https://git.tebin.co'}/api/v1`;
const BASE = `${ROOT}/repos/${REPO}`;

function token() {
  if (process.env.GITEA_TOKEN) return process.env.GITEA_TOKEN.trim();
  try { return readFileSync(join(homedir(), '.env', '.gitea'), 'utf8').trim(); } catch { /* none */ }
  console.error('no Gitea token: set GITEA_TOKEN or put it in ~/.env/.gitea');
  process.exit(2);
}

/**
 * A call to the repo's API (or, with `instance`, to the instance's). `soft`
 * answers null instead of exiting on a 4xx or a failed read: for a hint the
 * caller can do without.
 */
async function api(path, init = {}, { instance = false, soft = false } = {}) {
  // Only a read is retried. A POST that failed in flight (a reset after Gitea
  // took the merge) may have landed; sending it again would fail on its own
  // success, so the caller checks the state instead.
  const retry = (init.method ?? 'GET') === 'GET';
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch(`${instance ? ROOT : BASE}${path}`, { ...init, headers: { Authorization: `token ${token()}`, 'Content-Type': 'application/json' } });
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok && soft) return null;
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
      if (i === 5) { if (soft) return null; throw e; }
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
  const answer = await api('/admin/actions/runners', {}, { instance: true, soft: true });
  // No answer, or no instance runner (they may sit at org or repo level): no hint.
  const list = answer?.runners ?? [];
  if (!list.length) return null;
  const name = (r) => r.name;
  return { online: list.filter((r) => r.status !== 'offline').map(name), offline: list.filter((r) => r.status === 'offline').map(name) };
}

async function printJobs(run) {
  const { jobs = [] } = await api(`/actions/runs/${run}/jobs`);
  for (const j of jobs) console.log(`  ${j.name}: ${j.conclusion ?? j.status}`);
}

// A line that says why a job failed: a vitest FAIL, a thrown error, tsc, pnpm's exit.
const FAILURE = /\bFAIL\b|\b[A-Za-z]*Error\b|\berror TS\d+|ERR_|ENOBUFS|ELIFECYCLE|✗|×|\bTests? +\d+ failed|exit code [1-9]/;

/**
 * The failed jobs' logs, cut to the lines around each failure. A job log
 * runs to tens of kilobytes of colour codes and timestamps; the reason is a
 * dozen lines of it.
 */
async function printFailures(run) {
  const { jobs = [] } = await api(`/actions/runs/${run}/jobs`);
  for (const j of jobs.filter((j) => j.conclusion === 'failure')) {
    const res = await fetch(`${BASE}/actions/jobs/${j.id}/logs`, { headers: { Authorization: `token ${token()}` } }).catch(() => null);
    if (!res?.ok) { console.log(`\n-- ${j.name}: no log (HTTP ${res?.status ?? 'error'})`); continue; }
    const lines = (await res.text()).split('\n')
      .map((l) => l.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/^\S+Z /, '').trimEnd())
      // A `::error` annotation repeats the failure above it with its whole stack.
      .filter((l) => !l.startsWith('::'))
      .map((l) => (l.length > 240 ? `${l.slice(0, 240)}…` : l));
    const keep = new Set();
    lines.forEach((l, i) => { if (FAILURE.test(l)) for (let k = i; k < Math.min(i + 5, lines.length); k++) keep.add(k); });
    const shown = [...keep].sort((a, b) => a - b).slice(0, 120);
    console.log(`\n-- ${j.name}: ${shown.length ? '' : 'no failure line found, the end of the log'}`);
    if (!shown.length) for (let k = Math.max(0, lines.length - 20); k < lines.length; k++) shown.push(k);
    shown.forEach((k, n) => { if (n && k !== shown[n - 1] + 1) console.log('  …'); console.log(`  ${lines[k]}`); });
    if (keep.size > shown.length) console.log(`  … ${keep.size - shown.length} more lines`);
  }
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
  // A queued run waits up to three hours: a queue behind a busy runner is no
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
    } else if (Date.now() - queuedAt > 3 * 3600_000) {
      console.error('still queued after 3 hours: does a runner carry the job\'s labels?');
      process.exit(1);
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
      } else if (state) {
        offlineSince = null;
        if (!toldBusy) console.log(`queued behind a busy runner (${state.online.join(', ')}); waiting`);
        toldBusy = true;
      }
    }
    await sleep(20_000);
    run = await api(`/actions/runs/${run.id}`);
  }
  await printJobs(run.id);
  console.log(`conclusion: ${run.conclusion}`);
  if (run.conclusion !== 'success') { await printFailures(run.id); process.exit(1); }
} else if (cmd === 'jobs') {
  await printJobs(arg);
} else if (cmd === 'logs') {
  await printFailures(arg);
} else if (cmd === 'get') {
  // A read of any endpoint, for what no command covers. A path under admin/,
  // repos/, orgs/, user(s)/ or version is the instance's; any other, the repo's.
  // The leading slash is optional: Git Bash turns `/admin/...` into a file path.
  if (!arg || /^[A-Za-z]:/.test(arg)) { console.error('usage: get <path> [field,field.sub], e.g. get actions/runs/85 status'); process.exit(2); }
  const path = arg.startsWith('/') ? arg : `/${arg}`;
  const answer = await api(path, {}, { instance: /^\/(admin|repos|orgs|users?|version)\b/.test(path) });
  if (!extra) { console.log(JSON.stringify(answer, null, 2)); process.exit(0); }
  // A list comes wrapped ({ workflow_runs: [...], total_count }): unwrap it.
  const values = answer && !Array.isArray(answer) ? Object.values(answer) : [];
  const wrapped = values.filter(Array.isArray).length === 1 && values.every((v) => Array.isArray(v) || typeof v === 'number');
  const rows = Array.isArray(answer) ? answer : wrapped ? values.find(Array.isArray) : [answer];
  const pick = (o, path) => path.split('.').reduce((v, k) => v?.[k], o);
  for (const row of rows) console.log(extra.split(',').map((f) => JSON.stringify(pick(row, f)) ?? '-').join('\t'));
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
  // Gitea has no "newest" sort: take the recently updated, then the highest number.
  const pulls = await api('/pulls?state=all&sort=recentupdate&limit=50');
  const pr = pulls.filter((p) => p.head?.ref === arg || p.head?.label === arg)
    .sort((a, b) => b.number - a.number)[0];
  if (!pr) { console.error(`no pull request from ${arg}`); process.exit(1); }
  console.log([pr.number, pr.merged ? 'merged' : pr.state, pr.head.sha, pr.merged ? pr.merge_commit_sha : ''].join(' ').trim());
} else if (cmd === 'merge') {
  await api(`/pulls/${arg}/merge`, { method: 'POST', body: JSON.stringify({ Do: 'merge', delete_branch_after_merge: true }) });
  console.log(`merged #${arg}`);
} else {
  console.error('usage: gitea-api.mjs watch [sha] [workflow] | run-for [sha] [workflow] | jobs <run> | logs <run> | get <path> [fields] | rerun-failed <run> | pr <title> [body-file] | pr-for <branch> | merge <pr>');
  process.exit(2);
}
