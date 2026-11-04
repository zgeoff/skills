---
name: ci-design
description:
  "Rules for CI in a zgeoff repo: workflows, jobs, test budgets, timeouts, triggers, builds and the
  dependency gates. Load it before you add, change or review a workflow, a job or a trigger, or a
  release-age exclude, override or audit ignore. For how to write tests, load the testing skill.
  Load the repo's project-ci-design skill beside it; where they disagree, the project skill wins."
metadata:
  kind: rule-set
---

# CI design

## Workflow lint

- After you change a workflow, run `bun x @zgeoff/chex workflows` and fix every warning. CI stays
  green on a warning.

## Jobs

Never edit `pr.yml`:
[repo-sync](https://github.com/zgeoff/tools/blob/main/docs/architecture/repo-sync.md) copies it from
zgeoff/tools and overwrites your change. `pr.yml` runs the shared
[`bun-checks.yml`](https://github.com/zgeoff/tools/blob/main/.github/workflows/bun-checks.yml) on
each pull request.

- Add CI work as a package script. With no `BUN_CHECK_SCRIPTS` set, `bun-checks.yml` runs the
  standard list: `audit`, `deadcode`, `format:check`, `lint`, `typecheck`, `test`, and each script
  the repo defines for a lane in [Lanes](../testing/references/slow-tests.md#lanes) except
  `model-api`.
- To run a script outside the standard list, such as a `test:kvm` lane only your repo has, list
  every script to run in the repo variable `BUN_CHECK_SCRIPTS`, such as
  `audit deadcode format:check lint typecheck test test:e2e test:kvm`. A script you leave out stops
  running, and a name that `package.json` lacks fails the run.
- Expect a private repo to run every script in one `checks` job. In a public repo, each standard
  lane script runs in its own `test-<lane>` job, each other listed `test:<name>` script in `test`,
  and the rest in `static`.
- Require `pr / checks` in the `main` ruleset. In a public repo, `checks` only gathers the other
  jobs' results, and fails when any of them fails.
- Put a job of your own in a workflow you write, such as `image.yml`.
- Never require a branch to be up to date before merge. The push run on `main` tests the merged
  tree.

Find the repo's test budget in the Facts table of its project-ci-design skill. The budget caps the
median test time of recent CI runs that restored no `actions/cache` entry. In a public repo, measure
each run's slowest test job. In a private one, add up the test and lane steps of its `checks` job.
When the repo has no budget, skip each rule that uses one.

- In a public repo, write a job of your own only when it saves 60 s of wall time over a script.
  Shard tests only when the repo is over its test budget.
- In a private repo, write a job of your own only for a heavy check: one on any runner but a
  GitHub-hosted `ubuntu-*`, or one that sets up KVM. Run it on `schedule` or `workflow_dispatch`. A
  required check runs on every push to a pull request, so never require a heavy check.
- Give a required job no `if:` or path filter. GitHub counts a skipped required check as a pass.

## Timeouts

- Set `timeout-minutes` on every job that runs steps. On a job that calls a reusable workflow, pass
  the timeout to the workflow's `timeout-minutes` input.
- Set 20 minutes on a job with tests until its tests have stayed within the test budget for a week
  of runs on `main`. Then set twice the budget plus the job's median time outside its tests.
- Set twice the median time on a job with no tests, and never less than 5 minutes.
- Set the timeout of the `bun-checks.yml` jobs with the repo variable `BUN_CHECK_TIMEOUT_MINUTES`.
  It covers every job, so use the slowest test job's figures.

## Reusable workflows

- Share steps as a reusable workflow. A composite action fails as one red line, with no step to
  point at.
- Before you write setup steps, look in `.github/workflows/` of zgeoff/tools for a shared workflow.
- In a workflow you write, pin each call of a zgeoff/tools workflow to the latest commit on `main`,
  with the `# main` comment:

  ```yaml
  uses: zgeoff/tools/.github/workflows/<name>.yml@<commit> # main
  ```

- Never move the pin by hand. Repo-sync opens a pull request that moves it.

## Step scripts

- Keep each `run:` to one plain command, with no shell `if`, loop, `&&`, `||`, `;`, pipe or
  `${{ }}`. Pass an expression's value through `env:`.
- Write the script in TypeScript under `scripts/<job>/`, and run it through a package script, such
  as `run: bun run --silent ci:tag-release` for `scripts/release/tag-release.ts`.
- Keep step scripts out of `.github/`. Each script's test sits beside it, and `bun test` skips
  hidden folders.

## Path filters

Filter a job only when you can list every path it reads, shared packages and `bun.lock` included.
Filter it with a `changes` job. Leave `paths` off the trigger: a workflow that never starts reports
no checks, so a required check in it blocks the merge.

```yaml
jobs:
  changes:
    uses: zgeoff/tools/.github/workflows/paths-changed.yml@<commit> # main
    with:
      paths: |
        services/api/**
        packages/shared/**
        bun.lock
  image: # not a required check, so a skip is safe
    needs: changes
    # != 'false', so a failed changes job still runs the image build
    if: ${{ !cancelled() && needs.changes.outputs.changed != 'false' }}
    timeout-minutes: 15
```

## Cancelling runs

- Run the checks of a push to `main` in a workflow apart from the pull-request one, such as a
  `main.yml` that calls `bun-checks.yml`. Never cancel its runs: a cancelled run leaves that merged
  commit untested.
- In each pull-request workflow you write, cancel the older run. Put the workflow's name in the
  group, so two workflows never cancel each other:

  ```yaml
  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
  ```

- Never cancel a release, deploy or migrate job: a deploy cut off halfway leaves its target half
  changed. Give the job its own job-level group, such as `deploy-${{ github.ref }}`, with
  `cancel-in-progress: false`.
- When checks and a deploy share a workflow, put the checks' group at job level too. Then a newer
  run cancels only the checks.
- In a workflow that runs only on `main`, group by `github.sha`, with `cancel-in-progress: false`.
  Then two runs of one commit, such as a rerun and a dispatch, wait for each other.

## Builds

- Build each artifact once per run. Pass an image on through the registry or buildx's `type=gha`
  cache, and a file through `actions/upload-artifact`.
- Never cache `~/.bun/install/cache` or `node_modules`. `bun install --frozen-lockfile` is faster
  than the restore.
- When a job reads git history, such as tags or old commits for a changelog, check out with
  `fetch-depth: 0` and `filter: blob:none`. For a diff against the base branch, use
  `fetch-depth: 2`.

## `workflow_run` triggers

When a job that `workflow_run` starts holds a secret or write access, give the job this `if:`. It
checks the event and the repo, because a fork's `main` passes the `branches:` filter.

```yaml
if: >-
  contains(fromJSON('["push","schedule"]'), github.event.workflow_run.event) &&
  github.event.workflow_run.head_repository.full_name == github.repository
```

## First-party packages

When `bunfig.toml` sets `minimumReleaseAge`, give each first-party package an exclude. Renovate
bumps each one as soon as it publishes, and `bun install` refuses a release younger than that age.

- Run `bun x @zgeoff/chex dependency-gates`, and add each first-party package it lists to
  `minimumReleaseAgeExcludes`, by its full name, such as `@zgeoff/std`. `bun-checks.yml` runs the
  same check on each pull request.
- Never write a scope, such as `@zgeoff/*`. Bun accepts it with no warning and lets nothing through.
- Never put a [removal comment](#dependency-exceptions) above a first-party exclude. The
  [audit-fix workflow](https://github.com/zgeoff/tools/blob/main/docs/architecture/dependency-updates.md#the-audit-fix-workflow),
  which runs each day, deletes the exclude on the comment's date.
- Add a missing exclude in a pull request of its own into `main`. Renovate drops a commit you push
  to its branch. After yours merges, tick the rebase checkbox in each red Renovate pull request.

## Dependency exceptions

A release-age exclude, an override and an audit ignore are each an exception. Add one for any other
package only for a named reason, such as a fix the repo needs. When an older release works, pin the
newest release older than `minimumReleaseAge` in `package.json`, and add no exception.

To add a release-age exclude:

1. Check that the release has npm provenance. When this prints nothing, pin an older release and
   stop here:

   ```bash
   npm view <package>@<version> dist.attestations.provenance
   ```

2. Add the package's name to `minimumReleaseAgeExcludes`, and pin it to one exact version in the
   root `package.json` catalog or an override.
3. Above the exclude, write a removal comment in the shape below, with the day the release passes
   `minimumReleaseAge`. Change only the package, its version and the dates: the audit-fix workflow
   and `chex dependency-gates` match the rest word for word.

   ```toml
   # @scope/example 2.4.1 (published 2026-10-30) ages past the gate ~2026-11-06 — remove then
   ```

For the other two exceptions:

- For an override, pin one exact version in `overrides` in `package.json`, with no comment.
- For an audit ignore, let the audit-fix workflow add it and set its expiry. By hand, add
  `--ignore <advisory-id>` to the `audit` script, and an entry under that ID in the root
  `audit-ignores.json` with its `package`, `reason` and ISO `expires` date.

Remove each exception once it guards nothing. `chex dependency-gates` fails the run on an exclude
past its date, an override that every locked version meets, and an ignore that no locked package
needs. It also fails on a release-age exclude with no removal comment, except a first-party one.
