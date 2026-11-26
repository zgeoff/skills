# GitHub

The repo settings and the ruleset of the repo-standard skill. `<owner>/<repo>` names the GitHub
repo.

## Repo settings

Run these after the first push, as a user with admin rights on the repo:

```bash
gh repo edit <owner>/<repo> --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --enable-auto-merge --delete-branch-on-merge
gh api -X PUT repos/<owner>/<repo>/actions/permissions/workflow -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true
gh api repos/<owner>/<repo> --jq '[.allow_squash_merge, .allow_merge_commit, .allow_rebase_merge, .allow_auto_merge, .delete_branch_on_merge]'
```

Expect: `[true,false,false,true,true]`.

The shared CI runs plain `lint` unless `BUN_CHECK_SCRIPTS` lists its scripts. Set the variable to
the standard list with `lint:full` in place of `lint`:

```bash
gh variable set BUN_CHECK_SCRIPTS -R <owner>/<repo> --body 'audit deadcode format:check lint:full typecheck test'
```

Expect: `gh variable list -R <owner>/<repo>` lists `BUN_CHECK_SCRIPTS`.

Repo-sync and Renovate merge their pull requests with auto-merge. The second command grants the
Actions permission that the release setup needs; for why, see the
[GitHub App section](https://github.com/zgeoff/tools/blob/main/RELEASING.md#github-app-required-for-the-automated-chain)
of the tools release doc. The release App's token opens the release pull request.

## Repo-sync secrets

Set the two repo-sync secrets with these commands in place of the runbook's. A pipe from `op read`
into `gh secret set` sets an empty secret when the read fails, and `&&` stops before the set:

```bash
id=$(op read 'op://agents/repo-sync-github-app/client-id') && gh secret set REPO_SYNC_APP_CLIENT_ID -R <owner>/<repo> --body "$id"
key=$(op read 'op://agents/repo-sync-github-app/private-key') && gh secret set REPO_SYNC_APP_PRIVATE_KEY -R <owner>/<repo> --body "$key"
```

Expect: `gh secret list -R <owner>/<repo>` lists both names. When `op read` fails because its
service-account token expired, mint a new one with `op-mint global`, the profile that reads the
`agents` vault, then run the commands again.

## The ruleset

Add the ruleset after the synced `pr.yml` is on `main`. Before then, nothing reports `pr / checks`,
so the ruleset would block every pull request. Write this file to your scratch folder as
`ruleset.json`:

```json
{
  "name": "main protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "bypass_actors": [],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "allowed_merge_methods": ["squash"],
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [{ "context": "pr / checks" }]
      }
    }
  ]
}
```

Then create it:

```bash
gh api -X POST repos/<owner>/<repo>/rulesets --input <scratch>/ruleset.json --jq '.enforcement'
```

Expect: `active`.

Leave `bypass_actors` empty: the owner merges through a pull request like everyone else. Leave
`strict_required_status_checks_policy` off: the push run on `main` tests the merged tree, as
[ci-design](../../ci-design/SKILL.md#jobs) says.
