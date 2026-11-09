import { join } from 'node:path';
import { $ } from 'bun';
import { collectUnscopedSearches } from './collect-unscoped-searches.ts';

const [root] = process.argv.slice(2);

if (root === undefined) {
  console.error('usage: bun scripts/search-scope/check-search-scope.ts <repo root>');
  process.exit(2);
}

// git grep exits 1 when no file matches. The check's own tests hold unscoped searches on purpose.
const candidates =
  await $`git grep --untracked -I -l -z -i author -- . ${':!scripts/search-scope/'}`
    .cwd(root)
    .nothrow()
    .quiet();

if (candidates.exitCode > 1) {
  console.error(candidates.stderr.toString());
  process.exit(candidates.exitCode);
}

const paths = candidates.stdout
  .toString()
  .split('\0')
  .filter((path) => path !== '');
const files = await Promise.all(
  paths.map(async (path) => ({ path, text: await Bun.file(join(root, path)).text() })),
);
const unscopedSearches = collectUnscopedSearches(files);

for (const search of unscopedSearches) {
  console.log(`${search.path}:${search.line}: ${search.text}`);
}

if (unscopedSearches.length > 0) {
  console.log(
    'Each GitHub search above filters by author with no owner, so it returns PRs and issues from every org the author works in. Add an owner:, user:, org: or repo: qualifier, or the --owner or --repo flag, on the same line.',
  );
  process.exit(1);
}
