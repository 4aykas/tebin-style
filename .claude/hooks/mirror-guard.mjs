// PreToolUse hook: GitHub 4aykas/tebin-style is a push mirror of Gitea
// tebin-oss/tebin-style. A pull request or issue opened there is never seen,
// and a push to it is overwritten by the next mirror sync, so those commands
// are denied with the Gitea way to do the same. It also denies skipping the
// git hooks: .githooks/pre-push runs `pnpm verify`, the gate that keeps a
// red tree, or a committed secret, off a public repo.
import { fileURLToPath } from 'node:url';

// It guards against a slip, not an adversary: CI on the protected main is
// the gate. So it catches the forms an agent writes, and lets a message that
// only names them through.

// `git`, then its global options (`-C dir`, `--git-dir dir`, `--no-pager`).
const GIT = String.raw`(^|[\s;&|(])git(\.exe)?(\s+(-[Cc]\s+\S+|--(git-dir|work-tree|namespace|exec-path)\s+\S+|--?[\w-]+(=\S+)?))*\s+`;
const SKIP = 'Skipping the hooks skips pnpm verify, the gate before anything reaches the public repo. Run it and fix what it finds.';

const RULES = [
  // git takes an unambiguous prefix of a long option: --no-veri, not --no-verbose.
  [new RegExp(`${GIT}(push|commit)\\b[^;&|\\n]*\\s--no-veri\\w*`), SKIP],
  // -n alone or in a cluster of commit's flags that take no value (-an, -qn);
  // after -m, -F, -u and the like the rest of the token is a value.
  [new RegExp(`${GIT}commit\\b[^;&|\\n]*\\s-[aeiopqsvz]*n[A-Za-z]*(\\s|$)`, 'm'), 'git commit -n skips the hooks. Commit without -n.'],
  // An override of the hooks folder, however it is set: -c, git config, GIT_CONFIG_*.
  [/core\.hookspath/i, SKIP],
  [/(^|[\s;&|(])gh(\.exe)?\s+(pr|issue)\b/, 'gh pr / gh issue reach the GitHub mirror. Open pull requests and issues on Gitea, git.tebin.co/tebin-oss/tebin-style, through its REST API (docs/agents/issue-tracker.md).'],
  [new RegExp(`${GIT}push\\s+(\\S+\\s+)*github\\b`), 'git push github writes to the mirror, which the next sync overwrites. Push to origin (Gitea); the mirror follows.'],
];

const QUOTED = String.raw`("(?:[^"\\]|\\.)*"|'[^']*')`;
// A quoted string a shell runs, where a command starts: `bash -lc "..."`,
// `pwsh -Command '...'`, `eval "..."`, `iex "..."`.
const RUNS = new RegExp(String.raw`(?:^|[;&|(]\s*)(?:(?:(?:ba|z)?sh|pwsh|powershell|cmd)(?:\.exe)?(?:\s+-[\w-]+)*?\s+(?:-\w*c|-Command|\/c)|eval|iex|Invoke-Expression)\s+${QUOTED}`, 'gi');

/** The deny reason for a shell command, or null when it may run. */
export function verdict(command) {
  // A quoted string is an argument, not a command: a commit message may name
  // a flag or a command without running it. One a shell runs is a command.
  for (const m of command.matchAll(RUNS)) {
    const inner = m[1].startsWith('"') ? m[1].slice(1, -1).replace(/\\(["\\])/g, '$1') : m[1].slice(1, -1);
    const reason = verdict(inner);
    if (reason) return reason;
  }
  const bare = command.replace(new RegExp(QUOTED, 'g'), '""');
  for (const [re, reason] of RULES) if (re.test(bare)) return reason;
  // -c "core.hooksPath=..." hides the key in quotes.
  if (/(^|[\s;&|(])git(\.exe)?\b[^;&|\n]*\s-c\s*["']core\.hookspath/i.test(command)) return SKIP;
  return null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const reason = verdict(JSON.parse(input).tool_input?.command ?? '');
  if (reason) {
    console.log(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
    }));
  }
}
