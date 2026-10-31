#!/usr/bin/env bash
# First publish of packages that are new to npm, then their trusted publishers.
#
#   first-publish.sh check <pkg-dir>... [workflow-file] [--trust]
#       agent: no login, publishes nothing; on success, saves the plan
#   first-publish.sh
#       publisher: shows the saved plan, asks once, then logs in, publishes and verifies each package
#   first-publish.sh trust <pkg-dir>... [workflow-file]
#       publisher: adds the trusted publisher to packages already on npm
#
# Run check and trust from the repo root. workflow-file is the file under .github/workflows/
# that runs `npm publish` (default main.yml). Nothing here reads or prints a token: npm itself
# prompts for login and 2FA.
set -euo pipefail

plan_file=${NPM_FIRST_PUBLISH_PLAN:-${XDG_CACHE_HOME:-$HOME/.cache}/npm-first-publish/plan.json}

if [[ -t 1 ]]; then
  b=$'\e[1m' dim=$'\e[2m' red=$'\e[31m' green=$'\e[32m' yellow=$'\e[33m' cyan=$'\e[36m' off=$'\e[0m'
else
  b='' dim='' red='' green='' yellow='' cyan='' off=''
fi

die() {
  printf '\n  %s✗ %s%s\n\n' "$red" "$*" "$off" >&2
  exit 1
}
step() { printf '  %s●%s %s\n' "$cyan" "$off" "$*"; }
ok() { printf '  %s✓%s %s\n' "$green" "$off" "$*"; }
warn() { printf '  %s!%s %s\n' "$yellow" "$off" "$*"; }
note() { printf '    %s%s%s\n' "$dim" "$*" "$off"; }
title() { printf '\n  %s%s%s\n  %s%s%s\n\n' "$b" "$*" "$off" "$dim" "${*//?/─}" "$off"; }

# quiet runs a noisy command and shows its output only when it fails
quiet() {
  local log
  log=$(mktemp -p "$work")
  "$@" > "$log" 2>&1 || {
    cat "$log" >&2
    die "failed: $*"
  }
  rm -f "$log"
}

for tool in jq bun npm npx git curl; do
  command -v "$tool" > /dev/null || die "$tool is not on PATH"
done

# every tarball and log goes in one folder that the exit removes, on success or failure
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# trusted publishing needs `npm trust`, which arrived in npm 11.15.0
npm_trust() { npx -y "npm@>=11.15.0" trust "$@"; }

origin_slug() {
  git remote get-url origin | sed -E 's#^(git@github\.com:|https://github\.com/)##; s#\.git$##'
}

load_package() {
  manifest="$1/package.json"
  [[ -f $manifest ]] || die "no package.json in $1 (run from the repo root)"
  name=$(jq -r .name "$manifest")
  version=$(jq -r .version "$manifest")
  scope=""
  if [[ $name == @*/* ]]; then
    scope=${name%%/*}
    scope=${scope#@}
  fi
}

preflight() {
  [[ $(jq -r '.private // false' "$manifest") == false ]] || die "$name is \"private\": true"
  if npm view "$name" version > /dev/null 2>&1; then
    die "$name is already on npm; later versions go through CI. To add OIDC: first-publish.sh trust $pkg_dir"
  fi

  # npm checks repository.url against the workflow's repo for provenance and OIDC
  local repo_url slug wf
  repo_url=$(jq -r '.repository.url // .repository // empty' "$manifest")
  slug=$(origin_slug)
  [[ -n $repo_url ]] || die "$manifest has no repository.url; OIDC and provenance need it"
  [[ $repo_url == *"github.com/$slug"* ]] || die "repository.url ($repo_url) does not name origin ($slug)"

  wf=".github/workflows/$workflow"
  [[ -f $wf ]] || die "$wf does not exist; trusted publishing names this file"
  grep -q 'id-token: write' "$wf" || die "$wf grants no 'id-token: write'; OIDC needs it"

  if [[ -n $scope ]]; then
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' "https://registry.npmjs.org/-/org/$scope/package")
    case $code in
      200) ok "scope @$scope exists on npm" ;;
      404) die "scope @$scope does not exist. Create the org at https://www.npmjs.com/org/create, then rerun" ;;
      *) die "scope lookup for @$scope returned HTTP $code" ;;
    esac
  fi
}

pack() {
  if [[ -n $(jq -r '.scripts.build // empty' "$manifest") ]]; then
    (cd "$pkg_dir" && quiet bun run build)
  fi
  # bun pm pack rewrites workspace: and catalog: ranges; npm pack would ship them raw
  local out
  out=$(mktemp -d -p "$work")
  (cd "$pkg_dir" && quiet bun pm pack --destination "$out")
  tarball=$(ls "$out"/*.tgz)
}

login() {
  user=$(npm whoami 2> /dev/null) || {
    step "npm login: finish it in the browser"
    npm login
    user=$(npm whoami)
  }
  ok "logged in to npm as $b$user$off"
}

check_member() {
  [[ -z $scope || $scope == "$user" ]] && return
  npm org ls "$scope" 2> /dev/null | grep -qw "$user" \
    || die "$user is not a member of the @$scope org. An owner adds you at https://www.npmjs.com/settings/$scope/members"
  ok "$user is a member of @$scope"
}

add_trust() {
  local slug
  slug=$(origin_slug)
  step "trusted publisher for $b$name$off: $slug → $workflow"
  note "npm asks for 2FA. The publisher expires if no CI publish uses it within 2 days."
  npm_trust github "$name" --repo "$slug" --file "$workflow" --allow-publish --yes
  ok "trusted publishing on for $name"
}

parse_args() {
  pkg_dirs=() workflow=main.yml want_trust=false
  for arg in "$@"; do
    case $arg in
      --trust) want_trust=true ;;
      *.yml | *.yaml) workflow=$arg ;;
      -*) die "unknown flag: $arg" ;;
      *) pkg_dirs+=("${arg%/}") ;;
    esac
  done
  ((${#pkg_dirs[@]})) || die "name at least one package folder, such as packages/core"
}

cmd_check() {
  parse_args "$@"
  title "Preflight"
  quiet bun install --frozen-lockfile
  local entries=()
  for pkg_dir in "${pkg_dirs[@]}"; do
    load_package "$pkg_dir"
    step "$b$name@$version$off"
    preflight
    pack
    note "files: $(tar tzf "$tarball" | sed 's#^package/##' | paste -sd ' ')"
    quiet npm publish "$tarball" --access public --dry-run
    ok "npm accepts the dry run"
    entries+=("$(jq -n --arg dir "$pkg_dir" --arg name "$name" --arg version "$version" '{dir:$dir,name:$name,version:$version}')")
  done
  mkdir -p "$(dirname "$plan_file")"
  printf '%s\n' "${entries[@]}" | jq -s \
    --arg repo "$PWD" --arg slug "$(origin_slug)" --arg ref "$(git rev-parse --short HEAD)" \
    --arg workflow "$workflow" --argjson trust "$want_trust" \
    '{repo:$repo,slug:$slug,ref:$ref,workflow:$workflow,trust:$trust,packages:.}' > "$plan_file"
  printf '\n'
  ok "plan saved. The publisher runs: ${b}npm-first-publish$off"
  printf '\n'
}

cmd_run() {
  [[ -f $plan_file ]] || die "no plan to publish. Ask the agent to run the check first"
  local repo slug ref count
  repo=$(jq -r .repo "$plan_file")
  slug=$(jq -r .slug "$plan_file")
  ref=$(jq -r .ref "$plan_file")
  workflow=$(jq -r .workflow "$plan_file")
  want_trust=$(jq -r .trust "$plan_file")
  count=$(jq '.packages | length' "$plan_file")
  [[ -t 0 ]] || die "run this in a terminal: npm needs one for login and 2FA"
  ((count)) || die "every package in the plan is published. Ask the agent for the next step"
  cd "$repo" || die "the plan's repo folder is gone: $repo"
  [[ $(git rev-parse --short HEAD) == "$ref" ]] || die "the repo moved off $ref since the check. Ask the agent to check again"

  title "First publish to npm"
  jq -r '.packages[] | "\(.name)@\(.version)"' "$plan_file" | while read -r p; do
    printf '    📦 %s%s%s\n' "$b" "$p" "$off"
  done
  printf '\n    %sfrom%s     %s @ %s\n' "$dim" "$off" "$slug" "$ref"
  if $want_trust; then
    printf '    %sthen%s     trusted publishing for %s\n' "$dim" "$off" "$workflow"
  else
    printf '    %slater%s    trusted publishing, when the first CI release is near\n' "$dim" "$off"
  fi
  printf '\n    npm asks you to log in and approve with 2FA. Nothing else to type.\n\n'
  read -r -p "  Publish $count package(s)? [Y/n] " answer
  [[ ${answer:-y} =~ ^[Yy] ]] || die "stopped. Nothing was published"
  printf '\n'

  login
  quiet bun install --frozen-lockfile
  # npm prompts for 2FA only when stdin is a terminal, so the loop must not read from a pipe
  local done=() dirs
  mapfile -t dirs < <(jq -r '.packages[].dir' "$plan_file")
  for pkg_dir in "${dirs[@]}"; do
    load_package "$pkg_dir"
    printf '\n'
    step "$b$name@$version$off"
    check_member
    preflight > /dev/null
    pack
    npm publish "$tarball" --access public --loglevel warn
    # npm's exit code is the proof: the registry can take minutes to serve a new package, but
    # trusted publishing works on it at once. Drop the package from the plan so a rerun skips it.
    jq --arg dir "$pkg_dir" '.packages |= map(select(.dir != $dir))' "$plan_file" > "$plan_file.tmp"
    mv "$plan_file.tmp" "$plan_file"
    ok "published ${b}$name@$version$off"
    if $want_trust; then add_trust; fi
    done+=("$name@$version")
  done

  rm -f "$plan_file"
  title "Done"
  for p in "${done[@]}"; do printf '    %s✓%s %s  %shttps://www.npmjs.com/package/%s%s\n' "$green" "$off" "$p" "$dim" "${p%@*}" "$off"; done
  printf '\n    %sThe package page can take a few minutes to appear.%s\n' "$dim" "$off"
  printf '    Tell the agent it is done.\n\n'
}

cmd_trust() {
  parse_args "$@"
  title "Trusted publishing"
  login
  for pkg_dir in "${pkg_dirs[@]}"; do
    load_package "$pkg_dir"
    check_member
    add_trust
  done
  printf '\n'
}

case ${1:-} in
  check) cmd_check "${@:2}" ;;
  trust) cmd_trust "${@:2}" ;;
  "") cmd_run ;;
  *) die "usage: first-publish.sh [check|trust <pkg-dir>... [workflow-file] [--trust]]" ;;
esac
