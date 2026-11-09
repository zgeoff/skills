import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { $ } from 'bun';
import { collectUnscopedSearches } from './collect-unscoped-searches.ts';

const [root] = parseArgs({ allowPositionals: true }).positionals;

if (root === undefined) {
  console.error('usage: bun scripts/search-scope/check-search-scope.ts <repo root>');
  process.exit(2);
}

// git grep exits 1 when no file matches. The check's own tests hold unscoped searches on purpose.
const candidates =
  await $`git grep --untracked -I -l -z -i -E ${'author|committer|involves|commenter|reviewed-by|review-requested|assignee|mentions'} -- . ${':!scripts/search-scope/'}`
    .cwd(root)
    .nothrow()
    .quiet();

if (candidates.exitCode > 1) {
  console.error(candidates.stderr.toString().trim());
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
    'Each GitHub search above filters by a person, such as with author: or --involves, and names no owner, so it returns results from every org that person works in. Add an owner:, user:, org: or repo: qualifier, or the --owner or --repo flag, to the same command.',
  );
  process.exit(1);
}
