import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

// The repo is public and mirrored to GitHub every few hours, and the Gitea
// and GitHub tokens live beside it in ~/.env. A secret that lands in a commit
// stays in the history after a later removal, so pnpm verify (and with it the
// pre-push hook) fails before it can leave the machine.

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BINARY = new Set(['.png', '.ico', '.zip', '.docx', '.pptx', '.xlsx', '.pdf', '.woff', '.woff2', '.ttf']);

const SECRETS: Array<[RegExp, string]> = [
  [/\bgh[pousr]_[A-Za-z0-9]{36,}/, 'a GitHub token'],
  [/\bgithub_pat_[A-Za-z0-9_]{60,}/, 'a GitHub fine-grained token'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
  [/\b(?:token|authorization)\b[^\n]{0,40}?\b[0-9a-f]{40}\b/i, 'a 40-hex token (Gitea) beside the word token'],
  [/\b(?:password|secret|api[_-]?key)\b["']?\s*[:=]\s*["'][^"'\s$<{]{12,}["']/i, 'a hardcoded credential'],
];

// Tracked files and new ones not yet added (minus .gitignore), so a secret
// in a new file fails the first verify, before the commit.
const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'],
  { cwd: root, encoding: 'utf8' }).split('\n')
  .filter((f) => f && !BINARY.has(extname(f).toLowerCase()) && existsSync(join(root, f)));

describe('tracked files', () => {
  it('carry no token, key or password', () => {
    const hits: string[] = [];
    for (const file of tracked) {
      const lines = readFileSync(join(root, file), 'utf8').split('\n');
      lines.forEach((line, i) => {
        for (const [re, what] of SECRETS) if (re.test(line)) hits.push(`${file}:${i + 1} looks like ${what}`);
      });
    }
    expect(hits, 'unstage it, keep the value in ~/.env, and rotate it if it was real').toEqual([]);
  });

  it('would catch each kind', () => {
    const samples = [
      // Built in pieces, so this file does not trip the scan it tests.
      `ghp_${'a'.repeat(36)}`, `github_pat_${'b'.repeat(70)}`, `${'-'.repeat(5)}BEGIN OPENSSH PRIVATE KEY${'-'.repeat(5)}`,
      `Authorization: token ${'0123456789abcdef'.repeat(2)}01234567`, `api_key = "${'x'.repeat(20)}"`,
    ];
    for (const sample of samples) expect(SECRETS.some(([re]) => re.test(sample)), sample).toBe(true);
    expect(SECRETS.some(([re]) => re.test('GITEA_TOKEN: ${{ github.token }}'))).toBe(false);
  });
});
