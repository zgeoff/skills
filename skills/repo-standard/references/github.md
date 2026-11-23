# GitHub

The repo settings and the ruleset of the repo-standard skill. `<owner>/<repo>` names the GitHub
repo.

## Repo settings

Run these after the first push:

```bash
gh repo edit <owner>/<repo> --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false --enable-auto-merge --delete-branch-on-merge
gh api -X PUT repos/<owner>/<repo>/actions/permissions/workflow -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true
gh api repos/<owner>/<repo> --jq '[.allow_squash_merge, .allow_merge_commit, .allow_rebase_merge, .allow_auto_merge, .delete_branch_on_merge]'
```

Expect: `[true,false,false,true,true]`.

Repo-sync and Renovate merge their pull requests with auto-merge. The release job opens its pull
request through the Actions permission that the second command grants.

## The ruleset

Add the ruleset after the synced `pr.yml` is on `main`. Write this file to your scratch folder as
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
