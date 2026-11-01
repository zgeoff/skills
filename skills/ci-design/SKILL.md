---
name: ci-design
description:
  'How CI runs in a zgeoff repo: job layout, timeouts, test budgets, reusable workflows, step
  scripts, path filters, cancelling, building once, checkout depth, reruns and dependency
  exceptions. Load it before you add, change or review a workflow, a job, a trigger, a Renovate
  setting that starts CI runs, or a release-age exclude, override or audit ignore. How tests are
  written is in the testing skill. Load the repo's project-ci-design skill beside it; where they
  disagree, the project skill wins.'
metadata:
  kind: rule-set
---

# CI design

## Public and private repos

A public repo's runner minutes are free, so it runs parallel jobs. A private repo pays at least a
minute per job, so it runs one. `bun-checks.yml` in zgeoff/tools picks the layout from the repo's
visibility.

| Repo    | Jobs                                                  | Test budget covers        |
| ------- | ----------------------------------------------------- | ------------------------- |
| Public  | `gitleaks`, `static`, `test`, `test-<lane>`, `checks` | the slowest test job      |
| Private | `checks`, with each of those as a named step          | the sum of the test steps |

- `checks` is the required check in both. GitHub counts a skipped required check as a pass, so
  `checks` always runs. In a public repo it needs every other job, and fails when one failed or was
  cancelled; a job skipped by design, such as the lanes of a repo without lanes, passes.
- Public: split work into its own job only when that saves 60 s of wall time. Start at most 10 jobs
  at once. Shard tests only when the repo is still over budget.
- Private: add a second job only for another runner (KVM, macOS) or another trigger. Run a heavy
  check nightly or on demand. Skip a lane's step when the pull request can't affect it.
- A heavy check is a job on any runner but a GitHub-hosted Ubuntu label, such as macOS, Windows or a
  self-hosted runner, or a job that sets up KVM. In a private repo, never trigger one on
  `pull_request` or `pull_request_target`.
- `bun x @zgeoff/chex workflows` flags a heavy check on a pull request trigger in a private repo. In
  a workflow you write by hand, set `CHECKS_PROFILE` to `public` or `private` in the job's `env:`;
  `bun-checks.yml` sets it for you. When `CHECKS_PROFILE` is unset, as in a pre-push hook, chex runs
  `gh repo view` to read the visibility, and treats the repo as private when that fails. The lookup
  is in
  [`read-checks-profile.ts`](https://github.com/zgeoff/tools/blob/main/packages/chex/src/read-checks-profile.ts).

## Timeouts

- Every job sets `timeout-minutes`, except one that calls a reusable workflow, where GitHub refuses
  the key.
- Use 20 minutes until the tests have stayed within budget for a week. Then use twice the test
  budget plus the job's median time outside its tests, at least 5 minutes.

## Test budgets and timing data

- Each run on main uploads one JSON artifact: each test's time, from
  `bun test --reporter=junit --reporter-outfile=<file>` (Bun writes nothing without both flags), and
  peak memory, from the memory-cap script. A weekly audit files an issue for each repo over budget.
- `bun-checks.yml` does this. A workflow written by hand does it too.

## Reusable workflows

- Share steps as a reusable workflow, never a composite action: a composite action's failure shows
  as one red line, with no step that failed.
- Shared ones live in zgeoff/tools: `zgeoff/tools/.github/workflows/<name>.yml@<commit> # main`, a
  commit the repo-sync pull request moves. Check there before you write setup steps by hand.

## Step scripts

- A `run:` is one plain command: `run: bun run --silent ci:tag-release`. No `if`, loops, `&&`, `||`,
  `;`, pipes or `${{ }}`. Pass expression values through `env:`.
- Anything more goes in a TypeScript script in `scripts/<area>/`, run through a package script, so
  its tests run on every pull request. Never under `.github/`: `bun test` skips hidden folders.
- An existing `.sh` step script stays.

## Path filters

- Filter a job only when its inputs are a known part of the tree: an image, a native build, an e2e
  suite.
- Never use `on.pull_request.paths` on a workflow with required checks: a skipped workflow never
  reports, and the merge blocks. Filter inside the workflow with a `changes` job instead:

```yaml
jobs:
  changes:
    uses: zgeoff/tools/.github/workflows/paths-changed.yml@<commit> # main
    with:
      paths: |
        services/api/**
        bun.lock
        .github/workflows/image.yml
  image:
    needs: changes
    if: ${{ !cancelled() && needs.changes.outputs.changed != 'false' }}
```

- Test `!= 'false'`, never `== 'true'`, so a failed `changes` job still runs the work.
- List the workflow's own file in `paths`.
- Give the `push` trigger no `paths`, so main runs every job.

## Cancelling runs

- A checks workflow cancels the older run when a newer commit arrives:

```yaml
concurrency:
  group: checks-${{ github.ref }}
  cancel-in-progress: true
```

- A workflow that runs only on main never cancels: group it by `github.sha`, with
  `cancel-in-progress: false`.
- Never cancel a release, deploy or migrate job: a deploy cut off halfway leaves its target half
  changed. Give each one its own job-level group with `cancel-in-progress: false`, and set the
  checks group per job, since a workflow-level group covers every job.

## Build once

- Build each artifact once per run. Pass an image through the registry or buildx's `type=gha` cache,
  and a file through `actions/upload-artifact`.
- Never cache `~/.bun/install/cache` or `node_modules`: restoring it is slower than
  `bun install --frozen-lockfile`. Other caches, such as a Nix store, are fine.

## Checkout depth

- Depth 1, the default, for a job that never reads history.
- `fetch-depth: 0` with `filter: blob:none` for one that does: a secret scan, an affected-packages
  build, a size check, a commit-message check.
- `filter: ''` for a job that reads many old files. `fetch-depth: 2` for a diff against the base.

## No needless reruns

- Renovate rebases only on a conflict (`rebaseWhen: "conflicted"`). Never require a branch to be up
  to date before merge: main's push run already tests the merged tree.
- A `workflow_run` trigger gets a `branches:` filter.
- `branches:` matches the name alone, so a fork's `main` passes it. A job with a secret or write
  access also checks the event and the repo:

```yaml
if: >-
  contains(fromJSON('["push","schedule"]'), github.event.workflow_run.event) &&
  github.event.workflow_run.head_repository.full_name == github.repository
```

## Dependency exceptions

A release-age exclude, a root override or an audit ignore, added by hand.

- Add one only for a named reason, such as a fix the repo needs. When an older release works, pin
  the newest one that passes the gate instead.
- Scope it to each package by full name, pinned to one exact version.
- A release-age exclude needs npm provenance on each release:
  `npm view <package>@<version> dist.attestations.provenance` prints a `predicateType`, or nothing.
  No attestation, no exclude.
- A release-age exclude carries the dated removal comment the audit-fix workflow writes. An audit
  ignore carries an `audit-ignores.json` entry with a reason and an expiry. An override needs
  neither.
- Every Bun repo runs the shared dependency gates check (`bun-checks.yml`, or
  `bun run check:dependency-gates`), which fails on a gate whose reason is gone. Never copy it.
