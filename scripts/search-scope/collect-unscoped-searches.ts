export type SourceFile = { path: string; text: string };

export type UnscopedSearch = { path: string; line: number; text: string };

export function collectUnscopedSearches(files: readonly SourceFile[]): UnscopedSearch[] {
  return files.flatMap((file) =>
    collectLogicalLines(file.text)
      .filter((line) => hasAuthorFilter(line.text) && !hasOwnerScope(line.text))
      .map((line) => ({ path: file.path, line: line.line, text: line.text.trim() })),
  );
}

type LogicalLine = { line: number; text: string };

function collectLogicalLines(text: string): LogicalLine[] {
  const logicalLines: LogicalLine[] = [];
  let pending: LogicalLine | undefined;

  for (const [index, line] of text.split('\n').entries()) {
    const joined = pending
      ? { line: pending.line, text: `${pending.text} ${line}` }
      : { line: index + 1, text: line };

    if (line.trimEnd().endsWith('\\')) {
      pending = joined;
      continue;
    }

    logicalLines.push(joined);
    pending = undefined;
  }

  if (pending) {
    logicalLines.push(pending);
  }

  return logicalLines;
}

const AUTHOR_QUALIFIER = /\bauthor(?::|%3A)[^\s"'`]/i;
const AUTHOR_FLAG = /\bgh search \w+\b.*\s--author\b/;

function hasAuthorFilter(text: string): boolean {
  return AUTHOR_QUALIFIER.test(text) || AUTHOR_FLAG.test(text);
}

const OWNER_QUALIFIER = /\b(?:owner|user|org|repo)(?::|%3A)[^\s"'`]/i;
const OWNER_FLAG = /\s(?:--owner|--repo|-R)\b/;
// `gh pr list` and `gh issue list` search only the current repo, even with `--search`.
const REPO_COMMAND = /\bgh (?:pr|issue) list\b/;

function hasOwnerScope(text: string): boolean {
  return OWNER_QUALIFIER.test(text) || OWNER_FLAG.test(text) || REPO_COMMAND.test(text);
}
