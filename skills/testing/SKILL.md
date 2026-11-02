---
name: testing
description:
  Testing rules for zgeoff repos, covering where a test lives, test shape, setupTest and cleanup,
  test data, stored state seeded and read through the module that writes it, schemas, assertions,
  matchers, time, boundaries and speed. References cover seeding, slow tests and lanes, factories,
  databases, HTTP mocking, cleanup, observability, system tests, shell scripts, workflows and Claude
  Code mods, plus frontend, Go and NixOS where a repo uses them. Load it before you write or review
  a test. Load the repo's project-testing skill beside it, for the repo's lanes, utils and
  stand-ins; where they disagree, the project skill wins.
metadata:
  kind: rule-set
---

# Testing

## References

- [Seeding](./references/seeding.md): writing a seed or a seeder, a test over several states, and a
  state that no code in the module makes.
- [Slow tests and lanes](./references/slow-tests.md): a slow test, a per-run template, the run mode,
  and a lane.
- [Factories](./references/factories.md): writing a factory.
- [Database](./references/database.md): a package that owns a schema.
- [HTTP mocking](./references/http.md): a package that calls a remote service.
- [Cleanup](./references/cleanup.md): helpers that register cleanup, ordered cleanup, and a test
  that fails only in the full run.
- [Observability](./references/observability.md): code that records metrics, spans, error reports or
  logs.
- [System tests](./references/system-tests.md): end-to-end and evaluation suites, property tests,
  native timers, real transports, stateful stand-ins, and paths the host fixes.
- [Shell scripts](./references/shell.md): a shell script's test.
- [Workflows](./references/workflows.md): a GitHub Actions step's logic.
- [Claude Code mod checks](./references/claude-code-mods.md): a mod's hooks.

<!-- repo-sync needs ./references/frontend.md -->

- [Frontend](./references/frontend.md): React and TanStack clients in a web app.

<!-- repo-sync end -->

<!-- repo-sync needs ./references/go.md -->

- [Go testing](./references/go.md): Go tests.

<!-- repo-sync end -->

<!-- repo-sync needs ./references/nixos.md -->

- [NixOS testing](./references/nixos.md): Nix evaluation and VM tests.

<!-- repo-sync end -->

## Principles

- Write each test so a reader understands it from its body alone. Repeat a literal before you hide
  setup in a helper.
- Make each test pass alone, in any order, and beside every other test.
- Give each behaviour you add or change a test that runs it from the unit's entry, the function its
  callers call. The test fails when you revert the change.
- Test the behaviour, so a refactor that keeps the behaviour leaves every test green.
- When you change code, bring its tests in line with these rules.
- Never cut a test that checks behaviour. Never add one that checks nothing.
- Put a helper that tests share in the package's `test-utils/` folder, with its own tests. Search
  there before you write one.

## The test run

- Reset shared state after each test in the test preload, the file that `bunfig.toml` names under
  `[test] preload`. When you add module-level state, such as a cache, add its reset there.
- Override an environment variable through the env helper in `test-utils/`, never by assigning
  `process.env`.
- Start a shared resource, such as the MSW server, in the preload's `beforeAll`, and stop it in
  `afterAll`. Never start it at import.
- Pass `--no-isolate` in the test script, with every `--parallel=<N>`. Never run tests with
  isolation. Each file shares its worker's process, so reset all shared state in the preload.
- When a test fails only under CI's `--randomize`, it leaks state to another test. Rerun with the
  printed `--seed=<seed>` and fix the cause, never the order.

## Where a test lives

- Put a unit test beside its module, one test file per module, entry modules included:
  `src/parse-entry.test.ts` beside `src/parse-entry.ts`.
- Put a flow across several packages, run in one process, in `integration/`.
- Put tests that drive the built product from outside in `e2e/`: tests of the process itself, such
  as start-up, signals, exit codes and crash recovery, and one happy-path journey per main user
  flow. Test edge cases and denials in process.
- Put evaluation suites in `evals/`.
- Put a test that needs a real system the unit run can't host, such as a browser, in a lane. Give
  the file the lane's suffix, such as `<module>.browser.test.ts`, so only the lane's own script,
  such as `test:browser`, runs it. See [Slow tests and lanes](./references/slow-tests.md#lanes).
- Put a lane's harness, such as the code that starts the browser, in a package with its own tests.
- No other `test/`, `tests/` or `__tests__` directory. Check a config file, such as `package.json`,
  with a script in `scripts/`, never with a test.

## Test shape

- Write top-level `test()` calls, with no `describe`. Hooks in a `describe` couple its tests.
- Name the behaviour a caller sees in each title, never an internal identifier, as verb, outcome,
  condition: `it rejects a title longer than 120 characters`. In a file that tests several units,
  start the title with the unit in place of "it": `#archiveNote rejects an archived note`.
- Arrange, act, assert, with no phase comments. One act per test; two independent act-and-assert
  pairs are two tests. Treat an earlier act the test depends on, such as saving the note it
  archives, as arrangement, and don't assert on it.
- In an end-to-end journey, you may chain dependent acts. Give each journey its own file.
- Use `test.each` only for cases that differ in values. Give it rows of plain data or seed functions
  from [Stored state](#stored-state), and put the value that varies in the title.

```ts
test.each([
  ['1500ms', 1500],
  ['2s', 2000],
])('it parses %s as %d milliseconds', (input, expected) => {
  expect(parseDuration(input)).toBe(expected);
});
```

- No loop of assertions. Use `test.each`, or one collection matcher:
  `expect(listOpenNotes(store)).toSatisfyAll((note: Note) => note.archivedAt === null)`.
- You may assert in a loop over a list the module exports, such as a table of commands, to check
  that each entry is complete. You may also await each case that fast-check generates in a loop.
  Never compute the expected value with the code under test.
- Generate inputs or operation sequences with fast-check, as
  [System tests](./references/system-tests.md) describes.

## setupTest

- Put per-test setup in one local `setupTest()` that each test calls. No `beforeAll`, `beforeEach`,
  `afterEach` or `afterAll` in a test file. A file with nothing to wire has none.
- In `setupTest()`, wire the temp directories, the database, the clock, servers, clients, the
  recorders that capture what the unit sends, the unit, and the seeder from
  [Seeding](./references/seeding.md#buildseeder-and-setuptest). Create no data there. Give it no
  `if`, and no argument that a test's outcome depends on.
- Create all of a test's data in the test, even when every test in the file needs the same data. Set
  the time in each test whose code reads it, because a wired clock starts at a fixed default.
- Declare nothing else at module level. Inline a helper, make it a matcher, or move it to
  `test-utils/`.
- Declare a skip condition that Bun needs before the test runs at module level, such as
  `const hasDocker = await probeDocker()`. Read it only in `skipIf`, and add a comment that says
  `skipIf` needs the value before the test runs, so `setupTest()` can't make it.
- Keep each function that `setupTest()` returns, such as `readNotes: () => listNotes(db)`, to calls
  of production code. Move one with a branch, a loop or state to `test-utils/`.
- One `setupTest()` per file, never shared.
- Bind the result to one `const`, never destructured: `ctx` for `setupTest()`, `hook` for
  `renderHook()`, `rendered` for `render()`.

```ts
async function setupTest() {
  const db = await createTestDatabase();
  const deps = { db, clock: buildStubClock() };

  return { ...deps, service: createNotesService(deps), seed: buildSeeder(deps) };
}

test('it lists the notes of a user with none as empty', async () => {
  const ctx = await setupTest();
  const user = await ctx.seed.user({ name: 'ada' });

  expect(await ctx.service.listNotes({ userID: user.id })).toStrictEqual([]);
});
```

## Cleanup

- Register `onTestFinished` right after each acquisition, so a later throw still releases it. No
  `try`/`finally` in a test.

```ts
const dir = mkdtempSync(join(tmpdir(), 'notes-'));

onTestFinished(() => rm(dir, { recursive: true, force: true }));
```

- When a test changes process state, register `onTestFinished` right after the change. Skip it for
  state that the preload already resets.
- Never count on a random value, such as a random ID, to keep a test apart from another test's rows.
  Keep tests apart with the isolation the test database gives each test, as
  [Database](./references/database.md) describes, and with a folder of its own per test.
- When a test passes alone and fails in the full run, find the cleanup gap with
  [Cleanup](./references/cleanup.md).

## Test data

- Keep plain inputs inline: write the literal again in the next test. No module-level fixture,
  shared baseline object, or constant that only names a literal.
- Give a domain type that crosses a module boundary a tested `buildMock<Type>` factory in
  `test-utils/` on first use. A type that another package owns, such as an SDK result, counts too.
  Keep a type that is private to the module inline. See [Factories](./references/factories.md).
- Build only plain data in a factory, and write nothing.
- Give a stand-in data only: a fixed answer, `mock()`, a no-op, an answer table, or scripted answers
  through the answer-queue helper in `test-utils/`. Move anything else, such as counting calls or
  branching, to a tested helper there.
- Name a stand-in util for what it does: `start-stub-<thing>.ts` starts something long-running,
  `create-stub-<thing>.ts` creates a resource, `run-stub-<thing>.ts` is an executable script, and
  `build-stub-<thing>.ts` is for the rest. In its tests, check each thing it assumes about the real
  program, such as the shape of a real response.
- No `mockReturnValueOnce` or `mockResolvedValueOnce` chain: a call past the last answer returns the
  default silently, where the answer-queue helper throws.

## Stored state

When a test needs database rows or files on disk, go through the module that writes them. Only that
module's own tests, in its folder, may write and read them directly.

- Read through the module's code: a read function for rows, a path helper for files. If the unit
  under test already returns the fact, check its result. If no read function exists, add one to the
  module, with a test.
- Seed through the module: `ctx.seed.archivedNote({ title: 'Groceries' })`. Write a base seed for
  each kind of record, such as `note`, plus one seed for each other value of the module's state
  type, such as `archivedNote`. Pass everything else as input. See
  [Seeding](./references/seeding.md) for the rest.
- Never put the call under test, a clock move or a write to another record inside a seed, so the
  reader sees each one in the test.
- When no code in the module makes the state you need, write it directly inside a seed, with a `//`
  comment that names that state.
- Write and read directly in a migration test, too, or in a test of code whose product is SQL or
  storage, such as a database dialect. Never do it in `integration/` or `e2e/`.
- You may run a query that only sets up a failure, such as a trigger that makes a write fail.

```ts
test('it restores an archived note', async () => {
  const ctx = await setupTest();
  const note = await ctx.seed.archivedNote({ title: 'Groceries' });

  await ctx.service.restoreNote({ noteID: note.id });

  expect((await readNote(ctx.db, note.id))?.status).toBe('draft');
});
```

## Schemas and parsers

- Feed inline literal payloads, accepted and rejected. A factory can't show a rejection.
- Build a rejected payload from the complete valid literal, with one field changed.
- Assert the issue path: `expect(result.error?.issues).toPartiallyContain({ path: ['title'] })`.
  Never `issues[0]`, and never a bare `success: false`.
- For an accepted payload, assert `result.data`: `toStrictEqual(payload)`, or the transformed value.

## Assertions

- Assert the full contract with `toStrictEqual`. Put an asymmetric matcher inside it for a field the
  test doesn't decide, such as a generated ID. Use `toMatchObject` only for a raw row that the
  writing module's own test reads back, or for an error's typed code. Never use `toEqual`, and never
  match part of a value because its literal is long. When you read stored state back after a change,
  one `toBe` on the changed field is enough.
- Assert each result on its own. Assert the parts of one result together, such as a command's exit
  code, stdout and stderr.
- Derive the expected value from the contract, never with the unit's own calculation.
- In a test of how code recovers after several calls fail, capture each failed call's rejection as a
  value, `.then(() => null, (error: unknown) => error)`, and assert each one beside the final state.
- Use only inline snapshots, never of a component, and only for machine output that no person works
  out, such as generated SQL. Check a hand-written value, such as a spec test vector, with an
  explicit matcher.
- Give a deterministic generator a golden test and a test that runs the same input twice, as
  [System tests](./references/system-tests.md) describes.
- Give a sweep that deletes leftovers a test of what it leaves alone:
  `it never removes the files of a run that is still going`.

## Errors

- Assert at the strictness the contract needs: `toThrow()`, `toThrowWithMessage(Error, /…/)`, or
  `toMatchObject({ code })`.
- Give each declared error a test. A throw that can't happen in production isn't a declared error:
  delete the branch when a dependency's contract rules it out, and otherwise write `invariant()`
  from `tiny-invariant`.
- Never assert in a `try`/`catch`: when nothing throws, nothing is asserted.
- Write `.rejects` and `.resolves` without `await`, because Bun settles them inside the matcher.
  Always `await` `toResolve()` and `toReject()`.

```ts
const other = await ctx.seed.user({ name: 'grace' });

expect(ctx.service.archiveNote({ noteID: note.id, userID: other.id })).rejects.toMatchObject({
  code: 'NOT_FOUND',
});
```

## Access rules

- Give each access rule a test that the allowed caller succeeds, and a test that another caller is
  refused, with that caller named in the title: `it rejects a note owned by another user`.
- When a read hides a record, assert the hidden result, such as `toBeNull()`.

## Narrowing

- No branch in a test body. Give each path its own test.
- Before a matcher that passes on `undefined` (any `.not`, `toBeUndefined`, `toBeFalsy`, `toBeNil`),
  narrow with `invariant(value)`. Elsewhere `?.` is safe. When unsure, narrow.
- Copy a value out of a callback and assert after the call returns: an assertion inside a callback
  that never runs passes.

## Matchers

Use a jest-extended matcher over a hand-written check: `toSatisfyAll(isOpen)`, not
`expect(items.every(isOpen)).toBe(true)`, because it prints the received value. If `tsc` doesn't
know a matcher, add `@zgeoff/bun-test-extended` to `compilerOptions.types` in `tsconfig.json`.

| Value             | Matchers                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Array             | `toIncludeAllMembers`, `toIncludeSameMembers`, `toIncludeAllPartialMembers`, `toPartiallyContain`, `toSatisfyAll` |
| Object            | `toContainEntry`, `toContainEntries`, `toContainAllKeys`, `toBeFrozen`                                            |
| String            | `toStartWith`, `toEndWith`, `toInclude`, `toEqualCaseInsensitive`, `toEqualIgnoringWhitespace`                    |
| Any value         | `toBeNil`, `toBeOneOf`, `toSatisfy`, `toBeWithin`, `toBeEmpty`                                                    |
| Date              | `toBeAfter`, `toBeBefore`, `toBeBetween`, `toBeValidDate`                                                         |
| Mock              | `toHaveBeenCalledOnce`, `toHaveBeenCalledExactlyOnceWith`, `toHaveBeenCalledBefore`, `toHaveBeenCalledAfter`      |
| Error and promise | `toThrowWithMessage`, `toResolve`, `toReject`                                                                     |

- Use any of them inside `toStrictEqual`: `status: expect.toBeOneOf(['open', 'held'])`.
- `toPartiallyContain` and `toIncludeAllPartialMembers` take plain objects, never a bare asymmetric
  matcher, which matches any non-empty array. To find an element by a matcher, use
  `toContainEqual(expect.toStartWith('a'))`.

## Time and waiting

- Control time in the most explicit form the code allows:
  1. an argument: `expireSessions(store, { now: new Date('2026-01-01T12:00:00Z') })`;
  2. an injected clock: `ctx.clock.advance(30_000)`;
  3. fake timers, for code the repo doesn't own, restored in `onTestFinished`.
- When the code reads the real time and you can't pass the time in, build the expected value from
  `Date.now()`, and assert it with a range, such as `toBeWithin`.
- Wait on a condition with the `waitFor` helper in `test-utils/`, never a sleep. When the code has
  nothing to wait on, add a signal: an event, a log marker or a state flag.
- For native and library timers, see [System tests](./references/system-tests.md).

## Boundaries

- Test a package against the outermost boundary it talks to: pure, with HTTP mocked
  ([HTTP mocking](./references/http.md)), or with a real database
  ([Database](./references/database.md)). For code that records telemetry, also see
  [Observability](./references/observability.md).
- Replace a boundary, never the code inside it. Never stub `fetch`, an HTTP client, or the unit's
  own services.

| Boundary                                        | The test uses                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| A CLI                                           | The real binary, spawned                                            |
| A shell script                                  | The real script, through Bun's `$` ([Shell](./references/shell.md)) |
| The filesystem                                  | A real `mkdtemp` tree per test                                      |
| A database                                      | The real engine, isolated per test                                  |
| A remote HTTP or RPC service                    | MSW handlers                                                        |
| A service with a cheap container                | The real service in a container                                     |
| An SDK that sends command objects               | A stand-in for its send call                                        |
| A program the repo drives over its own protocol | A stateful stand-in ([System tests](./references/system-tests.md))  |

- When code is hard to test without a stand-in, make it take its I/O from its caller, and test the
  core with values.
- Pass every path in from the temp root. Never steer a module through `process.cwd()` or a `HOME`
  set after startup.
- Reach a failure branch with a real failure: an address where nothing listens, an MSW handler that
  returns the error, or a conflicting row. No spy that makes a real method reject. When nothing real
  reaches a branch, inject that dependency.
- No `mock.module` in a test file. It leaks into every later file in the worker. Put a module mock
  in a preload, `register-<module>-mock.ts`, only when it is one of these:
  - a stand-in for what the runtime can't host, such as WebGL, that reads from a stub store one
    exported setter changes;
  - a wrapper that a library documents for testing, which keeps the real behaviour and adds one
    hook.
- When you want to mock a module because of what it imports, fix the import graph.

## Speed

- Keep each unit test under 5 s on CI. When one is slower, fix its cause from the
  [slow-tests table](./references/slow-tests.md). Never raise the timeout first.
- Move a test to a lane only when the real system it needs can't run in the unit run, never because
  it is slow.
