# Direct mode

Build the goal's "For each item" part from the tools the target repo has and the kind of work each
item is. Read the repo's AGENTS.md and the skills it installs, under `.agents/skills/`, before you
write. Include a step only when its tool exists in that repo, or in the user's own skills. A step
that names a missing tool sends the session to look for it for hours.

| Kind of work                                       | Steps to include                                                                                                                                                                                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A code change                                      | Make the ticket a buildable work item with the work-items skill. Check the plan with the advisor tool when the session has one. Build it through the user's build workflow when one is installed, such as a build-feature skill, and name its reviewer, such as Codex. |
| A change to auth, secrets, money or migrations     | Add a review from another model family through the second-opinion skill, on the plan or the diff, as the user's instruction files say.                                                                                                                                 |
| A user-facing change in a repo with a verify setup | Run the repo's verify command, such as `bun verify` in a repo that uses wringer, update the journey, and publish the report into the PR. Leave this step out in a repo with no verify setup.                                                                           |
| A design                                           | Write it with the design-docs skill, run the repo's design tests when it has them, deslop, cold read, open the PR, walk the user through it one section at a time, and merge on their sign-off.                                                                        |
| A skill or a doc                                   | Follow the repo's writing skills, such as docs-writing and skill-writing, with a cold read and a deslop, and fill in the PR template's Checks lines.                                                                                                                   |
| A change that ships                                | Release and deploy by the repo's runbook, and run the checks it names after a deploy.                                                                                                                                                                                  |

Then add the steps every item shares:

- the bar for a merge, such as green CI on the latest push and every review finding fixed or
  answered;
- the rule for a flaky job, such as one rerun, then treat it as real;
- rebase before each merge, and merge one PR at a time when PRs touch the same files;
- clean up the worktree, the branches and any preview once the item lands;
- close the ticket only with evidence for each acceptance line.

When one goal spans repos with different tools, give each lane its own steps, or name the repo whose
steps differ.
