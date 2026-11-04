---
name: ci-design
description:
  "How CI runs in a zgeoff repo: job layout, test budgets, timeouts, reusable workflows, step
  scripts, path filters, cancelling, builds, checkout depth, reruns, first-party packages and
  dependency exceptions. Load it before you add, change or review a workflow, a job or a trigger, or
  a release-age exclude, override or audit ignore. For how to write tests, load the testing skill.
  Load the repo's project-ci-design skill beside it; where they disagree, the project skill wins."
metadata:
  kind: rule-set
---

# CI design

After you change a workflow, run `bun x @zgeoff/chex workflows` and fix every warning. CI stays
green on a warning.

## Jobs

Call [`bun-checks.yml`](https://github.com/zgeoff/tools/blob/main/.github/workflows/bun-checks.yml)
from zgeoff/tools in the repo's CI workflow, pinned as [Reusable workflows](#reusable-workflows)
says. Make its `checks` job a required check. GitHub lists it as `<your job> / checks`.

`bun-checks.yml` runs `audit`, `deadcode`, `format:check`, `lint`, `typecheck` and `test`, then each
lane script the repo defines, from the `laneNames` in
[`plan-check-scripts.ts`](https://github.com/zgeoff/tools/blob/main/packages/chex/src/ci-plan/plan-check-scripts.ts):
`test:e2e`, `test:browser`, `test:docker`, `test:host`, `test:agent-sdk` and `test:crash`. In a
public repo, it runs each lane script in a `test-<lane>` job of its own, `test` and each other
`test:<name>` script in one `test` job, and every other script in one `static` job. In a private
repo, it runs every script as a step of the one `checks` job, because GitHub bills each job at least
a minute.

Add CI work as a package script. To run a script outside that list, set the repo variable
`BUN_CHECK_SCRIPTS` to the scripts to run, separated by spaces, with each one from the list you
keep. A name that `package.json` lacks fails the run.

Look up the repo's test budget in the Facts table of its project-ci-design skill. The budget limits
the median time of the CI tests on a run that restores no `actions/cache` entry: of the slowest
`test` or `test-<lane>` job in a public repo, and of the sum of the test steps in a private one.
When the repo has no budget, skip each rule below that uses one.

- In a public repo, write a job of your own only when it saves 60 s of wall time over a script in
  `bun-checks.yml`. Shard tests only when the repo is still over its test budget.
- In a private repo, write a job of your own only for a heavy check: one on any runner but a
  GitHub-hosted `ubuntu-*`, or one that sets up KVM. Run it on `schedule` or `workflow_dispatch`,
  because GitHub bills its minutes on every push to a pull request. Never make it a required check.
- When you make a job of your own a required check, give it no `if:` or path filter that can skip
  it. GitHub counts a skipped required check as a pass.

## Timeouts

Set `timeout-minutes` on every job that runs steps. GitHub refuses the key on a job that calls a
reusable workflow, such as the `changes` job under [Path filters](#path-filters), so the called
workflow sets its own timeouts. Set the timeout of `bun-checks.yml` with the repo variable
`BUN_CHECK_TIMEOUT_MINUTES`, and pass it to the workflow's `timeout-minutes` input:
`timeout-minutes: ${{ fromJSON(vars.BUN_CHECK_TIMEOUT_MINUTES || '20') }}` under `with:`.

While the repo has no test budget, set the timeout to 20 minutes. When its tests have stayed within
the budget for a week, set it to twice the budget plus the job's median time outside its tests, with
a floor of 5 minutes. Read the median from the job's recent runs. For a job with no tests, use twice
its median time. In a public repo, one timeout covers every job: use the slowest test job's figures.

## Reusable workflows

Share steps as a reusable workflow. A composite action's failure shows as one red line, with no step
to point at. Check zgeoff/tools for a shared one before you write setup steps by hand. When you add
the call, pin it to the latest commit on `main`:

```yaml
uses: zgeoff/tools/.github/workflows/<name>.yml@<commit> # main
```

After that, never move the pin by hand.
[repo-sync](https://github.com/zgeoff/tools/blob/main/docs/architecture/repo-sync.md) in
zgeoff/tools opens a pull request in each repo that moves the pin to the new commit.

## Step scripts

Keep each `run:` to one plain command, such as `run: bun run --silent ci:tag-release`, with no `if`,
loop, `&&`, `||`, `;`, pipe or `${{ }}`. Pass an expression's value through `env:`.

Write the script a step runs in TypeScript, in a folder of `scripts/` named for the workflow job
that runs it, such as `scripts/release/tag-release.ts` for a `release` job. Run it through a package
script. Keep it out of `.github/`: `bun test` skips hidden folders.

## Path filters

Filter a job only when its inputs are a known part of the tree, such as an image, a native build or
an e2e suite. Filter it with a `changes` job, never with `paths` on a trigger. If the workflow
doesn't start, its required check never reports and the pull request can't merge.

```yaml
jobs:
  changes:
    uses: zgeoff/tools/.github/workflows/paths-changed.yml@<commit> # main
    with:
      paths: |
        services/api/**
        bun.lock
        .github/workflows/image.yml
  image: # not a required check, so a skip is safe
    needs: changes
    # != 'false', so a failed changes job still runs the image build
    if: ${{ !cancelled() && needs.changes.outputs.changed != 'false' }}
```

## Cancelling runs

- In a checks workflow, cancel the older run when a newer commit arrives:

```yaml
concurrency:
  group: checks-${{ github.ref }}
  cancel-in-progress: true
```

- Never cancel a release, deploy or migrate job, because a deploy cut off halfway leaves its target
  half changed. Give it a job-level group, such as `deploy-${{ github.ref }}`, with
  `cancel-in-progress: false`. When the checks share that workflow, move their group to job level
  too. A workflow-level group cancels every job in the run, the deploy included.
- In a workflow that runs only on `main`, group by `github.sha`, with `cancel-in-progress: false`.
  Then no later push cancels a commit's run.

## Builds

- Build each artifact once per run. Pass an image on through the registry or buildx's `type=gha`
  cache, and a file through `actions/upload-artifact`.
- Never cache `~/.bun/install/cache` or `node_modules`. `bun install --frozen-lockfile` runs faster
  than the restore.
- When a job reads history, check out with `fetch-depth: 0` and `filter: blob:none`, or `filter: ''`
  when it reads many old files. For a diff against the base branch, use `fetch-depth: 2`.

## Merging and `workflow_run`

Don't require a branch to be up to date before merge. The push run on `main` tests the merged tree.

A `workflow_run` trigger takes a `branches:` filter, but a fork's `main` matches it. When the job
holds a secret or write access, check the event and the repo too:

```yaml
if: >-
  contains(fromJSON('["push","schedule"]'), github.event.workflow_run.event) &&
  github.event.workflow_run.head_repository.full_name == github.repository
```

## First-party packages

Add each package under a scope that
[`first-party-scopes.ts`](https://github.com/zgeoff/tools/blob/main/packages/chex/src/dependency-gates/first-party-scopes.ts)
lists to the `minimumReleaseAgeExcludes` list in `bunfig.toml`, by its full name, such as
`@zgeoff/std`. `minimumReleaseAge` in `bunfig.toml` makes `bun install` refuse each release younger
than that age. Renovate bumps these packages as soon as they publish, so without an exclude each new
release fails to install. Skip this section in a repo that sets no `minimumReleaseAge`.

- Exclude each one the lock file installs, even one that only another package depends on.
  `chex dependency-gates` lists each one that has no exclude.
- Never write a scope, such as `@zgeoff/*`. Bun accepts a scope entry with no warning, and the entry
  lets no package through.
- Never put a dated removal comment above a first-party exclude. The audit-fix workflow deletes an
  exclude on the date in that comment.
- Add a missing exclude in its own pull request on `main`, because Renovate rebuilds its own branch
  and drops your commit. After it merges, tick the rebase checkbox in each red Renovate pull
  request.

## Dependency exceptions

For any other package, add an exception only for a named reason, such as a fix the repo needs. If an
older release works, pin the newest one that is older than `minimumReleaseAge`, and add no
exception. Add the exception as one of these:

- For a release-age exclude, put the package's name in `minimumReleaseAgeExcludes`, and pin it to
  one exact version in the root `package.json` catalog or an override.
- For an override, add an entry to the `overrides` of `package.json`, pinned to one exact version.
  It needs no comment.
- For an audit ignore, add an `--ignore` flag for one advisory ID to the `audit` script in
  `package.json`. Key an entry in the root `audit-ignores.json` by that ID, with its `package`,
  `reason` and ISO `expires` date, the day the audit-fix workflow audits the advisory again.

Before you add a release-age exclude, check that the release has npm provenance:

```bash
npm view <package>@<version> dist.attestations.provenance
```

If it prints nothing, don't exclude the release: pin an older one, or wait until it passes
`minimumReleaseAge`.

Above a release-age exclude, write by hand a dated removal comment in the form the
[audit-fix workflow](https://github.com/zgeoff/tools/blob/main/.github/workflows/audit-fix.yml)
writes. Give the date the release passes `minimumReleaseAge`. Keep the wording exactly, "ages past
the gate" included: the audit-fix workflow and the check match it.

```toml
# @scope/example 2.4.1 (published 2026-10-30) ages past the gate ~2026-11-06 — remove then
```

`chex dependency-gates` in `bun-checks.yml` fails the run when you break one of these:

- Never leave a release-age exclude past its date, or with no removal comment. A first-party exclude
  passes with no comment.
- Never leave a first-party package with no exclude.
- Never keep an override that changes nothing: one every locked version meets.
- Never keep an audit ignore that no locked package needs.
