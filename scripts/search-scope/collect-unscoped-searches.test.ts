import { expect, test } from 'bun:test';
import { collectUnscopedSearches } from './collect-unscoped-searches.ts';

test.each([
  ['gh search prs --author pip-moss --state open'],
  ['gh search issues --author=pip-moss'],
  ["gh api 'search/issues?q=author:pip-moss+is:pr'"],
  ["gh api 'search/issues?q=is:pr+author%3Apip-moss'"],
  ['search(query: "is:pr author:pip-moss", type: ISSUE) {'],
])('it reports the author-only search %s', (line) => {
  const files = [{ path: 'docs/report.md', text: `# Report\n${line}\n` }];

  expect(collectUnscopedSearches(files)).toStrictEqual([
    { path: 'docs/report.md', line: 2, text: line },
  ]);
});

test.each([
  ['gh search prs --author pip-moss --owner acme'],
  ['gh search prs --author pip-moss -R acme/ledger'],
  ["gh api 'search/issues?q=author:pip-moss+user:acme'"],
  ['search(query: "author:pip-moss org:acme", type: ISSUE) {'],
  ['gh search prs "author:pip-moss repo:acme/ledger"'],
  ['gh pr list --search "author:pip-moss"'],
  ['gh pr list --author pip-moss'],
  ['Author: Pip Moss'],
])('it passes %s', (line) => {
  const files = [{ path: 'docs/report.md', text: `# Report\n${line}\n` }];

  expect(collectUnscopedSearches(files)).toStrictEqual([]);
});

test('it reports a search continued over several shell lines at its first line', () => {
  const files = [
    {
      path: 'scripts/report.sh',
      text: 'set -eu\ngh search prs \\\n  --author pip-moss \\\n  --merged\necho done\n',
    },
  ];

  expect(collectUnscopedSearches(files)).toStrictEqual([
    {
      path: 'scripts/report.sh',
      line: 2,
      text: 'gh search prs \\   --author pip-moss \\   --merged',
    },
  ]);
});

test('it passes a search whose owner sits on a continued shell line', () => {
  const files = [
    {
      path: 'scripts/report.sh',
      text: 'gh search prs \\\n  --author pip-moss \\\n  --owner acme\n',
    },
  ];

  expect(collectUnscopedSearches(files)).toStrictEqual([]);
});
