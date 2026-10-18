// `pnpm install` runs this: it points git at .githooks, so the pre-push hook
// runs `pnpm verify`. Outside a git checkout (a tarball, a release ZIP, a
// Docker context) it does nothing, and it leaves a hooks path the developer
// set to something else alone.
import { execFileSync } from 'node:child_process';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

try {
  git('rev-parse', '--git-dir');
} catch {
  process.exit(0);
}
let current = '';
try { current = git('config', 'core.hooksPath'); } catch { /* unset */ }
if (current && current !== '.githooks') {
  console.warn(`core.hooksPath is ${current}; the .githooks pre-push gate is not installed.`);
} else if (!current) {
  git('config', 'core.hooksPath', '.githooks');
}
