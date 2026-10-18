// Creates the Gitea release for GITHUB_REF_NAME and attaches each file given,
// plus a `<file>.sha256` beside it. The notes are the tag's CHANGELOG entry.
// Runs in .gitea/workflows/release.yml with the job token in GITEA_TOKEN.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const tag = process.env.GITHUB_REF_NAME;
const token = process.env.GITEA_TOKEN;
const base = `${process.env.GITHUB_SERVER_URL}/api/v1/repos/${process.env.GITHUB_REPOSITORY}`;
const files = process.argv.slice(2);
if (!tag || !token || files.length === 0) throw new Error('usage: GITHUB_REF_NAME=… GITEA_TOKEN=… node scripts/gitea-release.mjs <file>…');

async function api(path, init = {}) {
  const res = await fetch(`${base}${path}`, { ...init, headers: { Authorization: `token ${token}`, ...init.headers } });
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const version = tag.replace(/^v/, '');
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const entry = changelog.split(/^## /m).find((s) => s.startsWith(`${version} — `)) ?? '';
const notes = entry.split(/\r?\n/).slice(1).join('\n').trim();

const release = await api('/releases', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tag_name: tag, name: tag, body: notes }),
});

for (const file of files) {
  const data = readFileSync(file);
  const sum = `${createHash('sha256').update(data).digest('hex')}  ${basename(file)}\n`;
  for (const [name, body] of [[basename(file), data], [`${basename(file)}.sha256`, Buffer.from(sum)]]) {
    const form = new FormData();
    form.append('attachment', new Blob([body]), name);
    await api(`/releases/${release.id}/assets?name=${encodeURIComponent(name)}`, { method: 'POST', body: form });
    console.log(`attached ${name}`);
  }
}
console.log(`${release.html_url}`);
