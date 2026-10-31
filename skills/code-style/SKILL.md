---
name: code-style
description:
  "Code style for zgeoff TypeScript repos: file layout, names, state, unions, types, structure,
  errors, comments, and the function-name verb table. Load it before you write, review or rename
  TypeScript, with the repo's project-code-style skill beside it, which only adds stricter rules."
metadata:
  kind: rule-set
---

# Code style

## Files and modules

- One main export per file, and the file is named for it: `parse-cli-args.ts` exports
  `parseCLIArgs`. `index.ts`, `types.ts` and `constants.ts` are exempt, and so is a side-effect-only
  module, named for what it does: `augment-bun-test.ts`.
- Inside a file: imports, the main export, then its helpers in the order it calls them. Each type or
  constant sits just above its first use.
- No classes, except a custom error (`class QuotaError extends Error`). Make objects with factory
  functions.

## Names

- Acronyms stay uppercase: `parseCLIArgs`, `userID`, `packageURL`. When one starts a camelCase name,
  it is all lowercase: `cliPath`, `idToken`.
- Name a value for what it holds, in full words: `session`, not `s`; `manager`, not `mgr`.
- Allowed short names: `x` and `y` (coordinates), `z` (zod), `$` (Bun's shell), `_` (unused), `ctx`,
  `id`, `db`, `args`, `params`, `repo`, `info`.
- A unit stays as a suffix: `timeoutMs`, never `ms` alone.

## State

- A status that is stored or sent out of the process gets a transition table: its states, the
  allowed moves, and one check, in the one place that writes it.
- A long-lived object with states only in memory, such as a reconnecting client, is an xstate
  machine.

## Waiting

- `Bun.sleep` in Bun-only code; `setTimeout` from `node:timers/promises` in code that ships to Node.
- One event: `events.once`. A promise that outside code settles: `Promise.withResolvers()`.
- Write `new Promise` by hand only when none of these fits.

## Unions

- Branch on a union with `match(value)…exhaustive()` from `ts-pattern`, never `switch`, so a new
  member fails the type check.
- End with `.otherwise()` only for an open value, such as a string from outside the program.

## Types

- No type assertions except `as const`. Use a type guard, an annotation, `satisfies`, or a schema
  parse.
- An assertion that has to stay needs the maintainer's approval in the PR, and a disable comment
  with the reason. In review, flag every new assertion, approved or not.
- Never let `any` reach a typed value. Make it `unknown` and narrow it, or parse it. `JSON.parse`
  returns `any`.

## Structure

- Data between processes or packages goes through the repo's typed interface: its RPC layer, a
  shared schema, or its CLI parser. Never a route matched, a body parsed, or arguments read by hand.
- A function that does I/O and branches heavily splits in two: a pure function that decides, and a
  thin one that acts.
- No wrapper that only passes its arguments on.
- No option, parameter or extension point until a caller passes it.
- Reach I/O through dependencies the caller passes in. Only the entry point builds real clients.

## Errors and logs

- Return an expected outcome, such as a miss or bad input from outside, as a value the return type
  names. Throw only what the caller can't plan for.
- Don't check what the value's source already guarantees.
- Assert a state that only a bug can reach.
- Log failures, state changes and slow calls, never every call on a hot path.

## Comments

- A `//` comment says why the obvious alternative is wrong, when the cause lives outside the file: a
  library bug, a runtime quirk, a measured number. Put it at the line, in three lines at most.
- Never restate what the code or a test shows.
- No history or project state ("previously", issue numbers, "not wired yet"). That goes in the
  commit.
- A caller-facing contract is a test whose name states it. An invariant that code in another package
  obeys is stated in the subsystem doc as well.
- Don't name another declaration in a comment; state the fact, so a rename can't leave it stale.

## One-off codemods

- A one-off codemod goes in the PR description, in a `<details>` block with the command that ran it,
  never in the repo.

## Function names

A function whose job has a row starts with that row's verb and keeps its guarantee. Any other
function takes any verb that fits, except a banned one.

| Job                                                                                                       | Verb                         | Guarantee                                     |
| --------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------- |
| yes/no answer                                                                                             | `is`, `has`, `can`, `should` | returns a boolean; no I/O                     |
| yes/no answer that needs I/O                                                                              | `probe`                      | returns a boolean; may do I/O                 |
| value from arguments, test data factories included                                                        | `build`                      | no I/O                                        |
| text or raw input → structure                                                                             | `parse`                      | no I/O                                        |
| value → text or markup                                                                                    | `format`, `render`           | no I/O                                        |
| choice among known alternatives                                                                           | `pick`                       | no I/O                                        |
| lookup that can miss                                                                                      | `find`                       | no I/O; can return null or undefined          |
| lookup that can't miss                                                                                    | `get`                        | no I/O; never returns null or undefined       |
| many values gathered from a traversal                                                                     | `collect`                    | no I/O                                        |
| cheap change of representation                                                                            | `to`                         | no I/O                                        |
| content in from outside the process                                                                       | `read`                       | may do I/O                                    |
| content out to outside the process                                                                        | `write`                      | may do I/O                                    |
| subprocess or task                                                                                        | `run`                        | may do I/O                                    |
| resource brought into existence                                                                           | `create`                     | may do I/O                                    |
| resource taken away                                                                                       | `remove`                     | may do I/O                                    |
| function that returns a function                                                                          | `make`                       | returns a function                            |
| higher-order wrapper                                                                                      | `with`                       | runs a callback inside a context              |
| React hook                                                                                                | `use`                        | follows the rules of hooks                    |
| event-callback prop or parameter                                                                          | `on`                         | follows the framework's callback convention   |
| function passed to an `on` prop, or a function that handles a framework lifecycle event such as a request | `handle`                     | follows the framework's callback convention   |
| a test file's per-test fixture                                                                            | `setupTest`                  | as the testing skill's setupTest section says |
| stored state put in place for a test, through the owner's writes                                          | `seed`                       | may do I/O; test code only                    |

- A pure function stays pure all the way down: a `build` that calls a `read` does I/O. Lint can't
  see I/O inside an npm package or behind a helper whose name hides it.
- A boolean with no I/O starts with `is`, `has`, `can` or `should`, even when another verb reads
  well. An I/O verb may return a success flag (`removeFile`), and `use`, `on` and `handle` keep
  their prefix.
- `make`, `with`, `use`, `on` and `to` take a suffix: `toPosixPath`.
- Banned: `process`, `manage`, `do`, `perform`, `execute`, `compute`, `fetch`, `save`, `store`,
  `delete`, `search`, `lookup`, and `handle` outside a callback. `resolve` is free: it names both a
  pure lookup and a filesystem search.
