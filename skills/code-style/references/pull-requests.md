# Pull requests

Ask the maintainer, the person who merges the PR, to approve each type assertion that your change
adds or keeps. Never commit a one-off codemod.

## Type assertions that stay

The [Types](../SKILL.md#types) rules allow no type assertion except `as const`. When you can't
remove one:

- In the PR description, say why the assertion has to stay, and ask the maintainer to approve it in
  a review or a comment.
- Disable the lint rule for that line only. In the same comment, say why the assertion stays.

## One-off codemods

Never commit a script that you run once to edit the code. No one runs it again after the merge.
Paste the script and the command that ran it into the PR description, in a `<details>` block.
