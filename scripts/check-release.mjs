import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const tag = process.env.GITHUB_REF_NAME;
if (tag !== `v${version}`) throw new Error(`Expected release tag v${version}, received ${tag}`);
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
if (!changelog.split(/\r?\n/).some(line => line.startsWith(`## ${version} — `))) {
  throw new Error(`Missing changelog entry for ${version}`);
}
console.log(`Release ${tag} matches package and changelog.`);
