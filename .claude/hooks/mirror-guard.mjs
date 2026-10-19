// PreToolUse hook: GitHub 4aykas/tebin-style is a push mirror of Gitea
// tebin-oss/tebin-style. A pull request or issue opened there is never seen,
// and a push to it is overwritten by the next mirror sync, so those commands
// are denied with the Gitea way to do the same. It also denies skipping the
// git hooks: .githooks/pre-push runs `pnpm verify`, the gate that keeps a
// red tree, or a committed secret, off a public repo.
import { fileURLToPath } from 'node:url';

// `git`, then its global options (`-C dir`, `-c key=value`, `--no-pager`).
const GIT = String.raw`(^|[\s;&|(])git(\.exe)?(\s+(-[Cc]\s+\S+|--?[\w-]+(=\S+)?))*\s+`;
const SKIP = 'Skipping the hooks skips pnpm verify, the gate before anything reaches the public repo. Run it and fix what it finds.';

const RULES = [
  // git takes any unambiguous prefix of a long option: --no-verif, --no-v.
  [new RegExp(`${GIT}(push|commit)\\b[^;&|\\n]*\\s--no-v\\w*`), SKIP],
  [new RegExp(`${GIT}commit\\b[^;&|\\n]*\\s-[A-Za-z]*n[A-Za-z]*(\\s|$)`, 'm'), 'git commit -n skips the hooks. Commit without -n.'],
  [/(^|[\s;&|(])git(\.exe)?\b[^;&|\n]*\s-c\s+core\.hookspath\b/i, SKIP],
  [/(^|[\s;&|(])gh(\.exe)?\s+(pr|issue)\b/, 'gh pr / gh issue reach the GitHub mirror. Open pull requests and issues on Gitea, git.tebin.co/tebin-oss/tebin-style, through its REST API (docs/agents/issue-tracker.md).'],
  [new RegExp(`${GIT}push\\s+(\\S+\\s+)*github\\b`), 'git push github writes to the mirror, which the next sync overwrites. Push to origin (Gitea); the mirror follows.'],
];

// A quoted string handed to a shell runs: `bash -c "..."`, `pwsh -Command '...'`, `eval "..."`.
const RUNS = /(?:\b(?:ba|z)?sh|\bpwsh|\bpowershell|\bcmd)(?:\.exe)?(?:\s+-[\w-]+)*?\s+(?:-c|-Command|\/c)\s+("(?:[^"\\]|\\.)*"|'[^']*')|\beval\s+("(?:[^"\\]|\\.)*"|'[^']*')/gi;

/** The deny reason for a shell command, or null when it may run. */
export function verdict(command) {
  // A quoted string is an argument, not a command: a commit message may name
  // a flag or a command without running it. One a shell runs is a command.
  for (const m of command.matchAll(RUNS)) {
    const reason = verdict((m[1] ?? m[2]).slice(1, -1));
    if (reason) return reason;
  }
  const bare = command.replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, '""');
  for (const [re, reason] of RULES) if (re.test(bare)) return reason;
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
