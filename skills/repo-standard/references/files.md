# Files

Write each file that the first three steps of the repo-standard skill name, with the content below.
Replace each placeholder: `<owner>` and `<repo>` name the GitHub repo, `@<scope>/<name>` is the npm
name, and `<command>` is the name a user types to run the CLI.

- [Root files](#root-files)
- [bunfig.toml](#bunfigtoml)
- [package.json](#packagejson)
- [tsconfig](#tsconfig)
- [lefthook.yml](#lefthookyml)
- [Tool configs](#tool-configs)

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
minimumReleaseAgeExcludes = [
  "@zgeoff/bun-test-extended",
  "@zgeoff/chex",
  "@zgeoff/commitlint-config",
  "@zgeoff/diet",
  "@zgeoff/format-codemod",
  "@zgeoff/oxfmt-config",
  "@zgeoff/oxlint-config",
  "@zgeoff/rig",
  "@zgeoff/std",
  "@zgeoff/testing",
]

[test]
preload = ["@zgeoff/bun-test-extended", "@zgeoff/testing/preload"]
```

Start the excludes with every `@zgeoff/*` package that the root `package.json` lists, and with
`@zgeoff/std`, which another of them installs. `chex dependency-gates` reads `bun.lock`, so it can't
list them before the first install. Add under `[test]` whatever else the
[testing](../../testing/SKILL.md) skill requires.

## package.json

Give the root `package.json` these fields:

- `"private": true` and `"type": "module"`;
- `"packageManager": "bun@<version>"`, with the version in `.bun-version`;
- `"workspaces": { "packages": ["packages/*"], "catalog": { … } }`, with every dependency's exact
  version in the catalog;
- the dev dependencies:
  - the shared configs and the tools they run: `@zgeoff/oxfmt-config`, `oxfmt`,
    `@zgeoff/format-codemod`, `@zgeoff/oxlint-config`, `oxlint`, `@stylistic/eslint-plugin`,
    `@zgeoff/commitlint-config` and `@commitlint/cli`;
  - the checks and tests: `@zgeoff/chex`, `@zgeoff/diet`, `@zgeoff/rig`, `@zgeoff/testing`,
    `@zgeoff/bun-test-extended`, `knip` and `lefthook`;
  - TypeScript: `tsrs`, `typescript`, `@tsconfig/strictest` and `@types/bun`.

Give it these scripts. `chex init` writes `check:docs`, and `rig init` writes `test`.

| Script         | Command                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------ |
| `prepare`      | `lefthook install --force \|\| true`                                                             |
| `audit`        | `bun audit`                                                                                      |
| `deadcode`     | `knip`, then `bash scripts/run-knip.sh` once the knip runner is synced                           |
| `format`       | `oxfmt . && format-codemod --quiet .`                                                            |
| `format:check` | `oxfmt --check . && format-codemod --check --quiet .`                                            |
| `lint`         | `oxlint`                                                                                         |
| `lint:full`    | `TSRS_FAST=1 oxlint --type-aware --type-check --report-unused-disable-directives-severity error` |
| `typecheck`    | `bun run --filter '*' typecheck && tsrs --fast -p .`                                             |
| `test`         | `rig unit`                                                                                       |
| `check:docs`   | `chex prose length links readmes skill`                                                          |

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

## lefthook.yml

Write it before the first `bun install`, with the pre-commit fixers and the commit-msg hook. The
chex baseline holds neither. `chex init` adds the `extends` line and its guard jobs later.

```yaml
pre-commit:
  jobs:
    - name: oxlint --fix
      glob: '*.{js,mjs,cjs,ts,mts,cts}'
      run: node_modules/.bin/oxlint --fix --no-error-on-unmatched-pattern {staged_files}
      stage_fixed: true
    - name: oxfmt
      glob: '*.{js,mjs,cjs,ts,mts,cts,json,jsonc,md,yml,yaml}'
      run: node_modules/.bin/oxfmt --no-error-on-unmatched-pattern {staged_files}
      stage_fixed: true
    - name: format-codemod
      glob: '*.{ts,tsx}'
      exclude: ['**/dist/**', '**/coverage/**', '.worktrees/**']
      run: node_modules/.bin/format-codemod --quiet {staged_files}
      stage_fixed: true

commit-msg:
  jobs:
    - name: commitlint
      run: node_modules/.bin/commitlint --edit {1}
```

## Tool configs

Write `oxfmt.config.ts`. oxfmt rewraps Markdown, so keep it off the synced copies and off the design
docs and decision records, which keep the wrapping their authors gave them:

```ts
import config from '@zgeoff/oxfmt-config';
import { defineConfig } from 'oxfmt';

export default defineConfig({
  ...config,
  ignorePatterns: [
    ...config.ignorePatterns,
    // copies that repo-sync delivers; one line per synced skill
    '.agents/skills/testing/**',
    '.claude/hooks/**',
    'docs/decisions/**',
    'docs/design/**',
  ],
});
```

Write `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "extends": ["./node_modules/@zgeoff/oxlint-config/oxlintrc.json"],
  "env": { "node": true, "es2024": true },
  "ignorePatterns": [".agents/**", ".claude/**", ".worktrees/**"]
}
```

Write `knip.json`. knip sees no import of `@stylistic/eslint-plugin`, which the shared oxlint config
loads, or of `@zgeoff/diet`, which the chex baseline runs, so ignore both:

```json
{
  "$schema": "./node_modules/knip/schema.json",
  "ignore": [".claude/**"],
  "ignoreDependencies": ["@stylistic/eslint-plugin", "@zgeoff/diet"],
  "workspaces": {
    ".": { "entry": ["rig.config.ts"] },
    "packages/*": { "entry": ["src/**/*.test.ts"] }
  }
}
```

Write `commitlint.config.js` as `export default { extends: ['@zgeoff/commitlint-config'] };`.
