// The decisions of `release.mjs --resume` and `gitea-api watch`, apart from
// git and the network, so test/decide.test.ts walks every case: most of
// them cannot be staged on a live Gitea.

/**
 * Where a release goes on from, given what the remote and this checkout hold:
 * `{ next: 'runs' }` once the tag is out, `'merge'` for an open PR, `'tag'`
 * for a merged one, or `{ refuse }` with the reason.
 * `pr` is `{ number, state, head, merge }` or null; `local` the local release
 * branch's commit or ''.
 */
export function resumeStep({ branch, remoteTag, pr, local }) {
  if (remoteTag) return { next: 'runs' };
  if (!pr) return { refuse: `no pull request from ${branch}: nothing to resume, run without --resume` };
  if (pr.state === 'closed') return { refuse: `#${pr.number} was closed without a merge` };
  // A local release branch past the PR's head holds commits the merge would
  // leave out, and the branch is deleted after it: push them first.
  if (local && local !== pr.head) return { refuse: `local ${branch} is at ${local.slice(0, 7)}, the PR at ${pr.head.slice(0, 7)}: push it, then resume` };
  return { next: pr.state === 'open' ? 'merge' : 'tag' };
}

/**
 * Whether to make the tag on the merge commit: `{ create }`, false when a run
 * whose push failed left the same tag behind, or `{ refuse }`.
 */
export function tagStep({ tag, pr, existing }) {
  if (!pr?.merge) return { refuse: `#${pr?.number} reports no merge commit` };
  if (existing && existing !== pr.merge) return { refuse: `local tag ${tag} is on ${existing.slice(0, 7)}, not the merge ${pr.merge.slice(0, 7)}` };
  return { create: !existing };
}

const MINUTE = 60_000;
// A queued run waits up to three hours: a queue behind a busy runner is no
// failure. The runners are asked after two minutes in the queue; with every
// one offline the watch waits five more for one to start. A started run gets
// 30 minutes.
export const LIMITS = { queued: 180 * MINUTE, ask: 2 * MINUTE, offline: 5 * MINUTE, started: 30 * MINUTE };

const isQueued = (status) => status === 'queued' || status === 'waiting';

/** A watch's state when it first sees the run. */
export const watchStart = (now) => ({ queuedAt: now, startedAt: null, offlineSince: null, toldBusy: false });

/** Whether this poll needs the runners' state for `watchStep`. */
export const asksRunners = (s, status, now) => isQueued(status) && now - s.queuedAt > LIMITS.ask && now - s.queuedAt <= LIMITS.queued;

/**
 * One poll of a run not yet completed. `runners` is `{ online, offline }`
 * when asked, null when the token may not read them (no hint, so no stop).
 * Answers the next state with an optional `say` (stdout), `warn` (stderr) or
 * `stop` (stderr, then exit 1).
 */
export function watchStep(s, { status, now, runners }) {
  if (!isQueued(status)) {
    const startedAt = s.startedAt ?? now;
    const next = { ...s, startedAt };
    return now - startedAt > LIMITS.started ? { s: next, stop: `still ${status} after 30 minutes` } : { s: next };
  }
  if (now - s.queuedAt > LIMITS.queued) return { s, stop: 'still queued after 3 hours: does a runner carry the job\'s labels?' };
  if (!runners) return { s };
  if (runners.online.length === 0) {
    if (!s.offlineSince) return { s: { ...s, offlineSince: now }, warn: `queued, and every runner is offline (${runners.offline.join(', ')}); waiting 5 minutes for one to start` };
    if (now - s.offlineSince > LIMITS.offline) return { s, stop: 'no runner came online: start it, then run watch again' };
    return { s };
  }
  const next = { ...s, offlineSince: null, toldBusy: true };
  return s.toldBusy ? { s: next } : { s: next, say: `queued behind a busy runner (${runners.online.join(', ')}); waiting` };
}
