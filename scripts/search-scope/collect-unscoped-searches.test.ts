import { expect, test } from 'bun:test';
import { collectUnscopedSearches } from './collect-unscoped-searches.ts';

test.each([
  ['gh search prs --author pip-moss --state open'],
  ['gh search issues --author=pip-moss'],
  ['gh search prs --involves pip-moss'],
  ['gh search commits --author-email pip@example.com'],
  ["gh api 'search/issues?q=author:pip-moss+is:pr'"],
  ["gh api 'search/issues?q=is:pr+author%3Apip-moss'"],
  ["gh api 'search/commits?q=author-email:pip@example.com'"],
  ["gh api 'search/issues?q=commenter:pip-moss'"],
  ['search(query: "is:pr author:pip-moss", type: ISSUE) {'],
  ["gh api 'search/issues?q=author:pip-moss+-org:acme'"],
  ['gh search prs --author pip-moss --json url | grep -R x .'],
  ['Run `gh search prs --author pip-moss`, never `gh pr list`.'],
  ['gh search prs --author pip-moss; gh pr list'],
  ["execa('gh', ['search', 'prs', '--author', login])"],
])('it reports the unscoped search %s', (line) => {
  const files = [{ path: 'docs/report.md', text: `# Report\n${line}\n` }];

  expect(collectUnscopedSearches(files)).toStrictEqual([
    { path: 'docs/report.md', line: 2, text: line },
  ]);
});

test.each([
  ['gh search prs --author pip-moss --owner acme'],
  ['gh search prs --author pip-moss --repo acme/ledger'],
  ['gh search prs --author pip-moss -R acme/ledger'],
  ["execa('gh', ['search', 'prs', '--author', login, '--owner', 'acme'])"],
  ["gh api 'search/issues?q=author:pip-moss+owner:acme'"],
  ["gh api 'search/issues?q=author:pip-moss+owner%3Aacme'"],
  ["gh api 'search/issues?q=author:pip-moss+user:acme'"],
  ['search(query: "author:pip-moss org:acme", type: ISSUE) {'],
  ['gh search prs "author:pip-moss repo:acme/ledger"'],
  ['gh pr list --search "author:pip-moss"'],
  ['gh issue list --search "author:pip-moss"'],
  ['gh pr list --author pip-moss'],
  ["gh api 'search/issues?q=is:pr+-author:app/renovate'"],
  ["gh api repos/acme/ledger/pulls --jq '.[] | {author:.user.login}'"],
  ['git log --format="author:%an"'],
  ['git log --author=pip-moss'],
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
