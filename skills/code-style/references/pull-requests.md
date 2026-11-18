# Pull requests

Never merge a type assertion that the maintainer, the person who merges the PR, hasn't approved.
Never commit a one-off codemod.

## Type assertions that stay

[Types](../SKILL.md#types) bans every type assertion except `as const`. When you can't remove one:

- In the PR description, say why the assertion has to stay, and ask the maintainer to approve it.
  The maintainer approves in a review or a comment.
- Disable the lint rule on that line only, with a comment that gives the reason.

## One-off codemods

When you edit the code with a script that you run only once, keep the script out of the repo.
Nothing runs it after the merge.

- Paste the script and the command that ran it into the PR description, in a `<details>` block.
