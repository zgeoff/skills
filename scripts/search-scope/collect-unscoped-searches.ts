export type SourceFile = { path: string; text: string };

export type UnscopedSearch = { path: string; line: number; text: string };

export function collectUnscopedSearches(files: readonly SourceFile[]): UnscopedSearch[] {
  return files.flatMap((file) =>
    collectLogicalLines(file.text)
      .filter((line) => collectCommands(line.text).some(isUnscopedSearch))
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

function collectCommands(text: string): string[] {
  return text.split(/\||;|&&|`/);
}

function isUnscopedSearch(command: string): boolean {
  return hasPersonFilter(command) && !hasOwnerScope(command);
}

// Each of these GitHub search filters matches a person's activity in every org.
const PERSON =
  'author(?:-name|-email)?|committer(?:-name|-email)?|involves|commenter|reviewed-by|assignee|mentions';
// A qualifier that follows a `-` excludes, and `{author:` is a jq object key.
const QUALIFIER_START = `(?<=^|[\\s"'+?=(&,])`;
const QUALIFIER_VALUE = '(?::|%3A)[\\w@$<{]';
const PERSON_QUALIFIER = new RegExp(`${QUALIFIER_START}(?:${PERSON})${QUALIFIER_VALUE}`, 'i');
const PERSON_FLAG = new RegExp(`(?<=^|[\\s"'])--(?:${PERSON})\\b`);
const GH_SEARCH = /\bgh\b.*(?<![-\w])search\b/;

function hasPersonFilter(command: string): boolean {
  return PERSON_QUALIFIER.test(command) || (GH_SEARCH.test(command) && PERSON_FLAG.test(command));
}

const OWNER_QUALIFIER = new RegExp(
  `${QUALIFIER_START}(?:owner|user|org|repo)${QUALIFIER_VALUE}`,
  'i',
);
const OWNER_FLAG = /(?<=^|[\s"'])(?:--owner|--repo|-R)(?=$|[\s="'])/;
// `gh pr list` and `gh issue list` search only the current repo, even with `--search`.
const REPO_COMMAND = /\bgh (?:pr|issue) list\b/;

function hasOwnerScope(command: string): boolean {
  return OWNER_QUALIFIER.test(command) || OWNER_FLAG.test(command) || REPO_COMMAND.test(command);
}
