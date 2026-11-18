# Pull requests

Put the case for a type assertion that has to stay, and each one-off codemod, in the pull request,
where the reviewer sees them. Keep both out of the merged code. Never merge an assertion without the
maintainer's approval.

## Type assertions that stay

[Types](../SKILL.md#types) bans every type assertion except `as const`. When you can't remove one:

- Ask the maintainer, the person who merges the PR, to approve it in the PR description.
- Disable the lint rule on that line only, in a comment that gives the reason.
- In review, flag each assertion the diff adds, approved or not, so each one gets a second look.

## One-off codemods

A one-off codemod is a script you run once to edit the repo's code. Nothing runs it after the merge.

- Paste the script and the command that ran it into the PR description, in a `<details>` block.
- Delete the script from the branch before the merge.
