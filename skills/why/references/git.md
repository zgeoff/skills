# Git and GitHub

Commits and PRs hold the written reason closest to the code. Your caller's anchor names the commits
and PRs already tied to the target. Start from them, and go further back.

Traps:

- **The first commit listed is the newest.** `git log` lists newest first, and the newest commit may
  only move or rename the code. Add `--reverse` and read from the top.
- **A shallow clone gives the wrong commit.** Its oldest commit looks as if it added every file, so
  `git log -S` names that commit as the one that added the string. Check the clone first.
- **A name is not a value.** `-S` on a constant's name finds the commit that added the constant.
  When the value changed later, such as from 5 to 3, search for the line with the value too.

1. When `git rev-parse --is-shallow-repository` prints `true`, run `git fetch --unshallow`. When the
   fetch fails, put the missing history under Gaps, and don't trust `-S`.
2. Find each commit that changed the target, scoped to its files:

   ```bash
   git log --reverse -S '<string>' --oneline -- <file>
   git log --reverse -G '<regex>' --oneline -- <file>
   ```

   `-S` finds the commits that change how many times an exact string appears. `-G` finds the commits
   whose changed lines match a pattern, such as `MAX_RETRIES\s*=\s*3`, which also catches a changed
   value. Skip a commit that only moves, renames or formats the code.

3. Read each commit with `git show <hash>`. Files that change together can share the reason, and the
   names of tests in the commit can state the edge case behind it.
4. Find each commit's PR. A squash merge puts `(#123)` at the end of the subject. Otherwise, run
   `gh pr list --search <hash> --state merged`. A commit with no PR was pushed directly: put it
   under Gaps.
5. Read the PR body, its comments, its review summaries and its inline review threads.
   `gh pr view --json reviews` returns only the summaries, so fetch the threads too. `gh` fills in
   `{owner}` and `{repo}` from the current repo:

   ```bash
   gh pr view <number> --json title,body,comments,reviews,headRefName
   gh api --paginate repos/{owner}/{repo}/pulls/<number>/comments
   ```

   Note each ticket ID in the body and in the branch name (`headRefName`) under Leads.

6. Search the target's files for a `TODO` comment about it. A person wrote it, so it counts as
   evidence.
7. Run `git log --grep=Revert --oneline -- <file>`. A revert followed by a re-apply is a sign of an
   incident. Report the pair as indirect evidence, with both dates.
