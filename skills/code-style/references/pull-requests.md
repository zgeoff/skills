# Pull requests

Get the maintainer's approval for each type assertion that stays, and keep each one-off codemod out
of the repo. The maintainer is the person who merges the PR.

## Type assertions that stay

[Types](../SKILL.md#types) bans every type assertion except `as const`. When you can't remove one:

- In the PR description, say why the assertion has to stay, and ask the maintainer to approve it in
  a review or a comment.
- Disable the lint rule on that line only, with a comment that gives the reason.

## One-off codemods

Keep a script that you run once to edit the code out of the repo. Nothing runs it after the merge.
Paste the script and the command that ran it into the PR description, in a `<details>` block.
