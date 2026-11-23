# Release

The release setup of the repo-standard skill, for one package in `packages/<name>/`. Load
[npm-publish](../../npm-publish/SKILL.md) before you start: it owns the first publish and the
trusted publisher.

A release takes two runs of `main.yml`. The push run of a merged release pull request tags the
release, then dispatches a second run at the tag, which publishes. npm provenance names the run's
own commit, so only a run at the tag can publish.

## The release config

Write `release-please-config.json` at the root:

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "bump-minor-pre-major": true,
  "include-component-in-tag": true,
  "include-v-in-tag": false,
  "tag-separator": "@",
  "packages": {
    "packages/<name>": { "component": "@<scope>/<name>" }
  }
}
```

Write `.release-please-manifest.json` as `{ "packages/<name>": "0.0.1" }`, the version you publish
by hand. Each tag then reads `@<scope>/<name>@<version>`.

## The main.yml jobs

Write `main.yml` in `.github/workflows/`, on a push to `main` and on `workflow_dispatch` with an
input that takes the package folders to publish. Model it on the `main.yml` of
[zgeoff/tools](https://github.com/zgeoff/tools/blob/main/.github/workflows/main.yml), which runs the
same flow, and change these:

- In `checks`, call
  [`bun-checks.yml`](https://github.com/zgeoff/tools/blob/main/.github/workflows/bun-checks.yml) at
  a pinned commit of zgeoff/tools, on both events.
- In `release`, call
  [`release-please.yml`](https://github.com/zgeoff/tools/blob/main/.github/workflows/release-please.yml)
  at a pinned commit, with `merge: false`, the `RELEASE_APP_ID` variable and the
  `RELEASE_APP_PRIVATE_KEY` secret. Run it only when the `RELEASE_ENABLED` repo variable is `true`,
  so no release opens before the first publish.
- In `dispatch-publish`, run a step script, `ci:dispatch-publish`, that reads the release's tag and
  starts `main.yml` at that tag with `gh workflow run`, passing `["packages/<name>"]`. The tools
  script
  [`dispatch-tag-publish.sh`](https://github.com/zgeoff/tools/blob/main/scripts/src/release/dispatch-tag-publish.sh)
  does the same for many packages.
- In `publish`, on `workflow_dispatch` only and after `checks`, call
  [`npm-publish.yml`](https://github.com/zgeoff/tools/blob/main/.github/workflows/npm-publish.yml)
  at a pinned commit with the folders from the input. Grant the job `id-token: write`: npm checks
  the caller's workflow file.

Load [ci-design](../../ci-design/SKILL.md) before you write the file, for the concurrency groups,
timeouts and step scripts. Then run `bun x @zgeoff/chex workflows`.

## The first release

npm expires an unused trusted publisher after 2 days, so do steps 3 to 6 within 2 days.

1. Install the release GitHub App on the repo. Set its client ID as the `RELEASE_APP_ID` repo
   variable and its private key as the `RELEASE_APP_PRIVATE_KEY` secret, as the
   [GitHub App section](https://github.com/zgeoff/tools/blob/main/RELEASING.md#github-app-required-for-the-automated-chain)
   of the tools release doc says. Expect `gh variable list -R <owner>/<repo>` to list
   `RELEASE_APP_ID`.
2. Merge the release config and `main.yml` in a pull request.
3. Publish `0.0.1` by hand with a trusted publisher for `main.yml`, as npm-publish says. Expect
   `npm view @<scope>/<name> version` to print `0.0.1`.
4. Turn the release job on with `gh variable set RELEASE_ENABLED -R <owner>/<repo> --body true`.
5. Merge a `feat` or `fix` pull request. Expect the release job to open a release pull request.
6. Ask the owner to merge the release pull request. Expect `npm view @<scope>/<name> version` to
   print the new version, which CI published with provenance.
