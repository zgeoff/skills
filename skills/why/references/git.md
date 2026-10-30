# Git and GitHub

Your caller also gave you investigator.md, which defines the target, the anchor and the sections of
your return, such as Gaps and Leads.

Commits and PRs hold the written reason closest to the code. Run steps 3 to 5 on the anchor's
commits and PRs first. Then go back to the commit that added the target.

Traps:

- **The first commit listed is the newest.** `git log` lists newest first, and the newest commit may
  only move or rename the code. Add `--reverse` and read from the top.
- **A shallow clone gives the wrong commit.** Its oldest commit looks as if it added every file, so
  every history search, such as `git log -S`, stops there. Check the clone first.
- **`-S` on a name misses a changed value.** It finds the commit that added the name. When the value
  changed later, such as from 5 to 3, search for the line with the value too.

1. When `git rev-parse --is-shallow-repository` prints `true`, run `git fetch --unshallow`. When the
   fetch fails, put the missing history under Gaps. Go on, and mark every history result as
   unreliable.
2. Find each commit that changed the target, scoped to its files:

   ```bash
   git log --reverse -S '<string>' --oneline -- <file>
   git log --reverse -G '<regex>' --oneline -- <file>
   ```

   `-S` finds the commits that change how many times an exact string appears. `-G` finds the commits
   whose changed lines match a pattern, such as `MAX_RETRIES\s*=\s*3`. `-G` also catches a changed
   value. Run both, with the target's name and with its whole line. Run each command once for each
   of the target's files. Skip a commit that only moves, renames or formats the code. When the
   history stops at a move, `git show --stat <hash>` on the move names the old path. Search again
   there.

3. Read each commit with `git show <hash>`. The other files it changed, and the names of its tests,
   can show why. Report what they show as indirect evidence.
4. Find each commit's PR. A squash merge puts `(#123)` at the end of the subject. Otherwise, run
   `gh pr list --search <hash> --state merged`. When you find no PR, the commit was pushed directly
   or its hash changed in a rebase. Put the commit under Gaps, as a commit with no PR.
5. Read each PR's:
   - body;
   - comments;
   - review summaries;
   - inline review threads. `gh pr view --json reviews` returns only the summaries, so fetch the
     threads too.

   `gh` fills in `{owner}` and `{repo}` from the current repo:

   ```bash
   gh pr view <number> --json title,body,comments,reviews,headRefName
   gh api --paginate repos/{owner}/{repo}/pulls/<number>/comments
   ```

   Read a GitHub issue the PR links too. It's part of this source. Note each ticket ID in the body
   and in the branch name (`headRefName`) under Leads.

6. Search the target's files in the working tree for a `TODO` comment about it. A `TODO` or a
   comment that states a reason is direct evidence.
7. Run `git log -i --grep=revert --format='%h %ad %s' --date=short -- <file>`. Keep the reverts that
   touch the target. Search for a re-apply with `-S` on the reverted line, after the revert's date.
   A revert followed by a re-apply is a sign of an incident. Report the pair as indirect evidence,
   with both dates, or the revert alone when nothing re-applied it.
