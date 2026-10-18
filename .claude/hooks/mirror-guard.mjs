// PreToolUse hook: GitHub 4aykas/tebin-style is a push mirror of Gitea
// tebin-oss/tebin-style. A pull request or issue opened there is never seen,
// and a push to it is overwritten by the next mirror sync, so those commands
// are denied with the Gitea way to do the same.
import { fileURLToPath } from 'node:url';

const RULES = [
  [/(^|[\s;&|(])gh(\.exe)?\s+(pr|issue)\b/, 'gh pr / gh issue reach the GitHub mirror. Open pull requests and issues on Gitea, git.tebin.co/tebin-oss/tebin-style, through its REST API (docs/agents/issue-tracker.md).'],
  [/(^|[\s;&|(])git\s+push\s+(\S+\s+)*github\b/, 'git push github writes to the mirror, which the next sync overwrites. Push to origin (Gitea); the mirror follows.'],
];

/** The deny reason for a shell command, or null when it may run. */
export function verdict(command) {
  for (const [re, reason] of RULES) if (re.test(command)) return reason;
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
