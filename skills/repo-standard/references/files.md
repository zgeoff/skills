# Files

Write each file that the first four steps of the repo-standard skill name, with the content below.
Replace each placeholder: `<owner>` and `<repo>` name the GitHub repo, `@<scope>/<name>` is the npm
name, and `<command>` is the name a user types to run the CLI.

- [Root files](#root-files)
- [bunfig.toml](#bunfigtoml)
- [package.json](#packagejson)
- [tsconfig](#tsconfig)
- [AGENTS.md](#agentsmd)

## Root files

Write `.gitignore` with these lines:

```gitignore
node_modules
dist
coverage
*.tsbuildinfo
*.tgz
.worktrees
.env
.env.*
!.env.example
.claude/settings.local.json
.DS_Store
```

Write `LICENSE` as the MIT licence, and copy it into `packages/<name>/`.

## bunfig.toml

```toml
[install]
# symlinked node_modules, so code imports only what its package.json lists
linker = "isolated"
# bun add saves exact versions
exact = true
# install only releases at least 7 days old
minimumReleaseAge = 604800
# each first-party package by its full name, from `bun x @zgeoff/chex dependency-gates`
minimumReleaseAgeExcludes = []

[test]
preload = ["@zgeoff/bun-test-extended", "@zgeoff/testing/preload"]
```

Add under `[test]` whatever else the [testing](../../testing/SKILL.md) skill requires.

## package.json

Give the root `package.json` these fields:

- `"private": true` and `"type": "module"`;
- `"packageManager": "bun@<version>"`, with the version in `.bun-version`;
- `"workspaces": { "packages": ["packages/*"], "catalog": { … } }`, with every dependency's exact
  version in the catalog;
- the dev dependencies: each shared config from the Checks and hooks step, `@zgeoff/chex`,
  `@zgeoff/rig`, `@zgeoff/testing`, `@zgeoff/bun-test-extended`, `knip`, `lefthook`, `tsrs`,
  `typescript`, `@tsconfig/strictest` and `@types/bun`.

Give it these scripts. `chex init` writes `check:docs`, and `rig init` writes `test`.

| Script         | Command                                                                |
| -------------- | ---------------------------------------------------------------------- |
| `prepare`      | `lefthook install --force \|\| true`                                   |
| `audit`        | `bun audit`                                                            |
| `deadcode`     | `knip`, then `bash scripts/run-knip.sh` once the knip runner is synced |
| `format`       | `oxfmt . && format-codemod --quiet .`                                  |
| `format:check` | `oxfmt --check . && format-codemod --check --quiet .`                  |
| `lint`         | `oxlint`                                                               |
| `typecheck`    | `bun run --filter '*' typecheck && tsrs --fast -p .`                   |
| `test`         | `rig unit`                                                             |
| `check:docs`   | `chex prose length links readmes skill`                                |

Give the package's `package.json`, in `packages/<name>/`, these fields:

```json
{
  "name": "@<scope>/<name>",
  "version": "0.0.1",
  "description": "<one line on what the CLI does>",
  "license": "MIT",
  "type": "module",
  "bin": { "<command>": "./src/cli.ts" },
  "files": ["src", "!src/**/*.test.ts", "!src/test-utils"],
  "engines": { "bun": ">=<oldest Bun the CLI supports>" },
  "publishConfig": { "access": "public" },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/<owner>/<repo>.git",
    "directory": "packages/<name>"
  },
  "homepage": "https://github.com/<owner>/<repo>#readme",
  "bugs": "https://github.com/<owner>/<repo>/issues",
  "scripts": { "typecheck": "tsrs --fast" }
}
```

Write each dependency as `"catalog:"`. npm needs `repository.url` to name the repo the publish runs
in, and a free npm org needs `publishConfig.access`. When the CLI builds to `dist`, point `bin` at
the built file, set `files` to `["dist"]`, and add a `build` script.

## tsconfig

Write `tsconfig.base.json` at the root:

```json
{
  "extends": "@tsconfig/strictest/tsconfig.json",
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["ESNext"],
    "module": "Preserve",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "types": ["bun", "@zgeoff/bun-test-extended"]
  }
}
```

Write a `tsconfig.json` beside it that extends `./tsconfig.base.json` and includes the root's own
TypeScript, such as `*.ts` and `scripts/**/*.ts`. Write one in `packages/<name>/` that extends
`../../tsconfig.base.json` and includes `src`. Add no strictness option of your own:
`@tsconfig/strictest` sets them all.

## AGENTS.md

Give `AGENTS.md` these parts, in this order:

1. `# Agent Guidelines`, then a paragraph: what the repo is for, and what an agent hands back, which
   is a pull request into `main` with green CI that the agent never merges.
2. `## Required reading`: a table of the tasks, such as writing a test, with the skill to load for
   each.
3. `## Repo structure`: a `text` block with the top two levels and a line on each folder.
4. `## Checks`: the commands to run before a push.
5. `## Commits and pull requests`: Conventional Commits in the imperative mood, squash merges, and
   no attribution lines.

Say in Required reading that a synced skill is never edited in the repo: repo-sync overwrites it.
Put each rule of the repo's own in a `project-<name>` skill in `.agents/skills/`.
