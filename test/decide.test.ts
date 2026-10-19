import { describe, it, expect } from 'vitest';
// @ts-expect-error -- a plain .mjs script without type declarations
import { resumeStep, tagStep, watchStart, watchStep, asksRunners, LIMITS } from '../scripts/decide.mjs';

// The cases of release.mjs --resume and gitea-api watch that a live Gitea
// cannot stage: a PR closed or ahead, a tag left behind, a runner down.

const branch = 'release/v1.2.3';
const A = 'a'.repeat(40), B = 'b'.repeat(40), M = 'c'.repeat(40);

describe('resumeStep', () => {
  it.each([
    ['the tag is out', { remoteTag: M, pr: null, local: '', localInPr: false }, { next: 'runs' }],
    ['an open PR', { remoteTag: '', pr: { number: '9', state: 'open', head: A }, local: A, localInPr: true }, { next: 'merge' }],
    ['an open PR, no local branch', { remoteTag: '', pr: { number: '9', state: 'open', head: A }, local: '', localInPr: false }, { next: 'merge' }],
    ['an open PR, a local branch behind it', { remoteTag: '', pr: { number: '9', state: 'open', head: A }, local: B, localInPr: true }, { next: 'merge' }],
    ['a merged PR', { remoteTag: '', pr: { number: '9', state: 'merged', head: A, merge: M }, local: '', localInPr: false }, { next: 'tag' }],
    ['a merged PR, the local branch at its head', { remoteTag: '', pr: { number: '9', state: 'merged', head: A, merge: M }, local: A, localInPr: true }, { next: 'tag' }],
  ])('%s', (_, input, want) => {
    expect(resumeStep({ branch, ...input })).toEqual(want);
  });

  it.each([
    ['no PR', { remoteTag: '', pr: null, local: '', localInPr: false }, /no pull request from release\/v1\.2\.3/],
    ['a closed PR', { remoteTag: '', pr: { number: '9', state: 'closed', head: A }, local: '', localInPr: false }, /#9 was closed/],
    ['a local branch ahead of an open PR', { remoteTag: '', pr: { number: '9', state: 'open', head: A }, local: B, localInPr: false }, /local release\/v1\.2\.3 at bbbbbbb has commits the PR \(at aaaaaaa\) lacks/],
    ['a local branch ahead of a merged PR', { remoteTag: '', pr: { number: '9', state: 'merged', head: A, merge: M }, local: B, localInPr: false }, /has commits the PR/],
  ])('refuses %s', (_, input, reason) => {
    expect(resumeStep({ branch, ...input }).refuse).toMatch(reason);
  });
});

describe('tagStep', () => {
  const pr = { number: '9', state: 'merged', head: A, merge: M };
  it('creates the tag on the merge', () => expect(tagStep({ tag: 'v1.2.3', pr, existing: '' })).toEqual({ create: true }));
  it('reuses a tag a failed push left on the merge', () => expect(tagStep({ tag: 'v1.2.3', pr, existing: M })).toEqual({ create: false }));
  it('refuses a local tag on another commit', () => expect(tagStep({ tag: 'v1.2.3', pr, existing: B }).refuse).toMatch(/is on bbbbbbb, not the merge ccccccc/));
  it('refuses a PR with no merge commit', () => expect(tagStep({ tag: 'v1.2.3', pr: { ...pr, merge: undefined }, existing: '' }).refuse).toMatch(/#9 reports no merge commit/));
  it('refuses when the PR is gone after the merge', () => expect(tagStep({ tag: 'v1.2.3', pr: null, existing: '' }).refuse).toMatch(/no longer found/));
});

describe('watchStep', () => {
  const MIN = 60_000;
  type Runners = { online: string[]; offline: string[] } | null;
  type Step = { s: { startedAt: number | null; offlineSince: number | null }; say?: string; warn?: string; stop?: string; jobs?: boolean };
  const online: Runners = { online: ['tower'], offline: [] };
  const down: Runners = { online: [], offline: ['tower'] };
  // Polls a run at the given minutes with the given runner answers.
  const poll = (ticks: Array<[number, string, Runners]>) => {
    let s = watchStart(0);
    const out: Step[] = [];
    for (const [min, status, runners] of ticks) {
      const step = watchStep(s, { status, now: min * MIN, runners: asksRunners(s, status, min * MIN) ? runners : null });
      s = step.s;
      out.push(step);
    }
    return out;
  };

  it('asks the runners only after two minutes in the queue', () => {
    const s = watchStart(0);
    expect(asksRunners(s, 'queued', LIMITS.ask)).toBe(false);
    expect(asksRunners(s, 'queued', LIMITS.ask + 1)).toBe(true);
    expect(asksRunners(s, 'running', LIMITS.ask + 1)).toBe(false);
  });

  it('says once that it waits behind a busy runner', () => {
    const steps = poll([[3, 'queued', online], [4, 'queued', online], [5, 'queued', online]]);
    expect(steps.map((x) => x.say ?? '')).toEqual(['queued behind a busy runner (tower); waiting', '', '']);
    expect(steps.some((x) => x.stop)).toBe(false);
  });

  it('stops five minutes after it saw every runner offline', () => {
    const steps = poll([[3, 'queued', down], [6, 'queued', down], [9, 'queued', down]]);
    expect(steps[0]!.warn).toMatch(/every runner is offline \(tower\)/);
    expect(steps[1]!.stop).toBeUndefined();
    expect(steps[2]!.stop).toMatch(/no runner came online/);
  });

  it('starts the offline count again when a runner comes back', () => {
    const steps = poll([[3, 'queued', down], [6, 'queued', online], [7, 'queued', down], [10, 'queued', down]]);
    expect(steps.some((x) => x.stop)).toBe(false);
    expect(steps[2]!.warn).toMatch(/every runner is offline/);
  });

  it('keeps waiting when the runners cannot be read', () => {
    const steps = poll([[3, 'queued', null], [60, 'queued', null], [179, 'queued', null]]);
    expect(steps.some((x) => x.stop || x.warn)).toBe(false);
  });

  it('stops a run queued for three hours', () => {
    expect(poll([[181, 'queued', online]])[0]!.stop).toMatch(/still queued after 3 hours/);
  });

  it('gives a started run 30 minutes from its start, not from the queue', () => {
    const steps = poll([[100, 'running', null], [129, 'running', null], [131, 'running', null]]);
    expect(steps[1]!.stop).toBeUndefined();
    expect(steps[2]!.stop).toBe(`still running after ${LIMITS.started / MIN} minutes`);
    expect(steps[2]!.jobs).toBe(true);
    expect(steps[2]!.s.startedAt).toBe(100 * MIN);
  });

  it('starts every clock again when a later job queues', () => {
    // Runners down at 3, the run starts at 4, a second job queues at 20 and
    // starts at 40: no stale offline count, no started time from minute 4.
    const steps = poll([[3, 'queued', down], [4, 'running', null], [20, 'queued', down], [23, 'queued', down], [40, 'running', null], [60, 'running', null]]);
    expect(steps.some((x) => x.stop)).toBe(false);
    expect(steps[3]!.warn).toMatch(/every runner is offline/);
    expect(steps[5]!.s.startedAt).toBe(40 * MIN);
  });

  it('ignores runners passed outside the ask window', () => {
    const step = watchStep(watchStart(0), { status: 'queued', now: MIN / 2, runners: down });
    expect(step.warn).toBeUndefined();
    expect(step.s.offlineSince).toBeNull();
  });

  it('prints no job list for a queue stop', () => {
    expect(poll([[181, 'queued', online]])[0]!.jobs).toBeUndefined();
  });
});
