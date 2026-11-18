# Pull requests

Put in the pull request what the maintainer must approve and what never runs again.

## Type assertions

- When an assertion has to stay, get the maintainer's approval in the PR, and add a lint disable
  comment that gives the reason. In review, flag every new assertion, approved or not.

## One-off codemods

- Put a one-off codemod, a script you run once to edit the repo's code, in the PR description, in a
  `<details>` block with the command that ran it, never in the repo. Nothing runs it after the
  merge.
