---
name: testing
description:
  Testing rules for zgeoff repos, covering where a test lives, test shape, setupTest and cleanup,
  test data, stored state seeded and checked through its owner, schemas, assertions, matchers, time,
  boundaries and speed. References cover seeding, slow tests and lanes, factories, databases, HTTP
  mocking, cleanup, observability, system tests, shell scripts, workflows and Claude Code mods, plus
  frontend, Go and NixOS where a repo uses them. Load it before you write or review a test, with the
  repo's project-testing skill beside it.
metadata:
  kind: rule-set
---

# Testing

## References

- [Seeding](./references/seeding.md): writing a seed or a seeder, a test over several states, and a
  state no owner code makes.
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

- A reader understands a test from its body alone. Repeat a literal rather than hide setup.
- Each test passes alone, in any order, and beside every other test.
- Each behaviour you add or change gets a test that runs it from the unit's entry, the function its
  callers call, and fails when you revert the change.
- A refactor that keeps the behaviour leaves every test green.
- When you change code, bring its tests in line with these rules.
- Never cut a test that checks behaviour. Never add one that checks nothing: when a lint rule asks
  for one, change the rule's config with a one-line reason.
- A helper tests use lives in the shared test utils with its own tests.

## The test run

- The `bunfig.toml` preload resets shared state after each test. Module-level state you add, such as
  a cache, gets its reset there.
- Override an environment variable through the env util in the shared test utils, never by assigning
  `process.env`.
- The preload starts a shared resource, such as the MSW server, in `beforeAll` and stops it in
  `afterAll`, never at import.
- Isolation hides a leak between files and never fixes one.
- A failure under `--randomize` is a leak. Rerun with the printed `--seed=<seed>` and fix the cause,
  never the order.

## Where a test lives

- `src/parse-entry.test.ts` beside `src/parse-entry.ts`, one test file per module, entry modules
  included.
- `integration/`: one flow across several packages, in one process.
- `e2e/`: the built product driven from outside. It holds tests of the process itself (start-up,
  signals, exit codes, crash recovery) and one happy-path journey per main user flow. Edge cases and
  denials run in process.
- `evals/`: evaluation suites.
- A test that needs one real system, such as a browser, goes in a lane: `<module>.browser.test.ts`.
  The lane's harness lives in a package with its own tests.
- No other `test/`, `tests/` or `__tests__` directory. A static check of config is a script, not a
  test.

## Test shape

- Top-level `test()` calls, no `describe`: hooks in its scope couple the tests.
- A title reads as verb, outcome, condition: `it rejects a title longer than 120 characters`. In a
  file that tests several units, a prefix replaces "it": `#archiveNote rejects an archived note`.
- Arrange, act, assert, with no phase comments. One act per test; two independent act-and-assert
  pairs are two tests. An earlier act the test depends on, such as saving the note it archives, is
  arrangement, with no assertion.
- An end-to-end journey may chain dependent acts, one file per journey.
- `test.each` only for cases that differ in values: rows of plain data or seed functions.

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
- Two loops may assert: one over a module's own registry that checks each entry is complete, and one
  that awaits each generated conformance case. Neither computes its expectation with the code it
  checks.
- Generated inputs or operation sequences use fast-check, as
  [System tests](./references/system-tests.md) describes.

## setupTest

- Per-test setup lives in one local `setupTest()` that each test calls. No `beforeAll`,
  `beforeEach`, `afterEach` or `afterAll` in a test file. A file with nothing to wire has none.
- `setupTest()` wires and creates no data: temp directories, the database, the clock, servers,
  clients, recorders, the unit, and the seeder. No `if`, and no argument a test's outcome depends
  on.
- Each test creates all of its data, even when every test in the file needs the same data. A test
  whose code reads the time sets the clock.
- The file declares nothing else at module level. A helper goes inline, becomes a matcher, or moves
  to the shared test utils.
- Exception: a skip condition Bun needs before the test runs, such as
  `const hasDocker = await probeDocker()`, may sit at module level, read only by `skipIf`, with a
  comment that `skipIf` takes a boolean.
- A returned closure only calls production helpers. One with a branch, loop or state moves to the
  shared test utils.
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

- Process state a test changes gets its `onTestFinished` right after the change. State a preload
  reset covers needs nothing.
- Never count on a random value to keep a test apart from another test's rows.
- A test that passes alone and fails in the full run has a cleanup gap:
  [Cleanup](./references/cleanup.md).

## Test data

- Plain inputs stay inline: write the literal again in the next test. No module-level fixture,
  shared baseline object, or constant that only names a literal.
- A domain type that crosses a module boundary gets a tested `buildMock<Type>` factory in the shared
  test utils on first use. A type another package owns, such as an SDK result, counts. A type
  private to the module stays inline. [Factories](./references/factories.md).
- A factory builds plain data and writes nothing.
- A stand-in holds data only: a fixed answer, `mock()`, a no-op, an answer table, or scripted
  answers through the answer-queue util. Anything else, such as counting calls or branching, moves
  to a tested util.
- Stand-in utils: `start-stub-<thing>.ts` starts something long-running, `create-stub-<thing>.ts`
  creates a resource, `run-stub-<thing>.ts` is an executable script, `build-stub-<thing>.ts` is the
  rest. Their tests pin what they assume about the real thing.
- No `mockReturnValueOnce` or `mockResolvedValueOnce` chain: a call past the last answer returns the
  default silently, where the answer-queue util throws.

## Stored state

Stored state is database rows and files on disk. Its owner is the module whose code writes them. The
owner's own tests are the tests in its folder.

- The owner's tests may write and read its state directly.
- Every other test reads through the owner's code: a read function for rows, a path helper for
  files. If the unit already returns the fact, check its result. If the owner has no read function
  for it, add one, with a test.
- Every other test seeds through the owner: `ctx.seed.archivedNote({ title: 'Groceries' })`. One
  seed per concept, plus one per value of the owner's state type; everything else is input.
  [Seeding](./references/seeding.md) holds the rest.
- The test body keeps the behaviour under test as a real call, each clock move, and each effect on
  another record.
- A direct write lives only inside a seed, with a `//` comment naming the state no owner code makes.
- Exceptions, and no others: a migration test, and a test of code whose product is SQL or storage,
  such as a database dialect. `integration/` and `e2e/` get none.
- A query that only sets up a failure, such as a trigger that makes a write fail, is setup.

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
- A rejected payload is the complete valid literal with one field altered.
- Assert the issue path: `expect(result.error?.issues).toPartiallyContain({ path: ['title'] })`.
  Never `issues[0]`, and never a bare `success: false`.
- An accepted payload asserts `result.data`: `toStrictEqual(payload)`, or the transformed value.

## Assertions

- `toStrictEqual` on the full contract. A field the test doesn't determine, such as a generated id,
  gets an asymmetric matcher inside it. `toMatchObject` only for a raw row an owner's test reads
  back. Never `toEqual`, and never a partial match because the literal is long.
- Assert each result on its own. A projection of one result, such as a command's exit code, stdout
  and stderr, stays together.
- Derive the expected value from the contract, never with the unit's own calculation.
- Reading stored state back after a mutation, one `toBe` on the changed field is enough.
- A recovery test captures each faulted call's rejection as a value,
  `.then(() => null, (error: unknown) => error)`, and asserts each one beside the final state.
- Snapshots are inline only, and only for machine output no person derives, such as generated SQL. A
  hand-written value, such as a spec test vector, keeps an explicit matcher.
- A deterministic generator gets a golden test and a same-input-twice test, as
  [System tests](./references/system-tests.md) describes.
- A sweep that deletes leftovers has a test of what it leaves alone:
  `it never removes another owner's files`.

## Errors

- Assert at the strictness the contract needs: `toThrow()`, `toThrowWithMessage(Error, /…/)`, or
  `toMatchObject({ code })`.
- Each declared error gets a test. A throw that can't happen in production is no declared error:
  delete the branch, or write `invariant()` from `tiny-invariant`.
- Never assert in a `try`/`catch`: when nothing throws, nothing is asserted.
- No `await` before `.rejects` or `.resolves`; always `await` `toResolve()` and `toReject()`.

```ts
expect(readNote(ctx.db, { noteID: note.id, userID: 'user_b' })).rejects.toMatchObject({
  code: 'NOT_FOUND',
});
```

## Access rules

- An access rule lands with two tests: the allowed caller succeeds, and the other is refused, named
  in the title: `it rejects a note owned by another user`.
- A read that hides a record asserts the hidden result, such as `toBeNull()`.

## Narrowing

- No branch in a test body; each path gets its own test.
- Before a matcher that passes on `undefined` (any `.not`, `toBeUndefined`, `toBeFalsy`, `toBeNil`),
  narrow with `invariant(value)`. Elsewhere `?.` is safe. When unsure, narrow.
- Copy a value out of a callback and assert after the call returns: an assertion inside a callback
  that never runs passes.

## Matchers

Use a jest-extended matcher over a hand-written check: `toSatisfyAll(isOpen)`, not
`expect(items.every(isOpen)).toBe(true)`, because it prints the received value. Each package's
`augment-bun-test.ts` import gives `tsc` their types.

| Value             | Matchers                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Array             | `toIncludeAllMembers`, `toIncludeSameMembers`, `toIncludeAllPartialMembers`, `toPartiallyContain`, `toSatisfyAll` |
| Object            | `toContainEntry`, `toContainEntries`, `toContainAllKeys`, `toBeFrozen`                                            |
| String            | `toStartWith`, `toEndWith`, `toInclude`, `toEqualCaseInsensitive`, `toEqualIgnoringWhitespace`                    |
| Any value         | `toBeNil`, `toBeOneOf`, `toSatisfy`, `toBeWithin`, `toBeEmpty`                                                    |
| Date              | `toBeAfter`, `toBeBefore`, `toBeBetween`, `toBeValidDate`                                                         |
| Mock              | `toHaveBeenCalledOnce`, `toHaveBeenCalledExactlyOnceWith`, `toHaveBeenCalledBefore`, `toHaveBeenCalledAfter`      |
| Error and promise | `toThrowWithMessage`, `toResolve`, `toReject`                                                                     |

- Each works inside `toStrictEqual`: `status: expect.toBeOneOf(['open', 'held'])`.
- `toPartiallyContain` and `toIncludeAllPartialMembers` take plain objects, never a bare asymmetric
  matcher, which matches any non-empty array. To find an element by a matcher, use
  `toContainEqual(expect.toStartWith('a'))`.

## Time and waiting

- Control time in the most explicit form the code allows:
  1. an argument: `expireSessions(store, { now: new Date('2026-01-01T12:00:00Z') })`;
  2. an injected clock: `ctx.clock.advance(30_000)`;
  3. fake timers, for code the repo doesn't own, restored in `onTestFinished`.
- A wall-clock value is built from `Date.now()` and asserted with a range, such as `toBeWithin`.
- Wait on a condition with `waitFor`, never a sleep. When the code has nothing to wait on, add a
  signal: an event, a log marker or a state flag.
- Native and library timers follow [System tests](./references/system-tests.md).

## Boundaries

- The furthest edge a package reaches sets its regime: pure, HTTP-mocked
  ([HTTP mocking](./references/http.md)), or real database ([Database](./references/database.md)).
  Code that records telemetry also follows [Observability](./references/observability.md).
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

- Code hard to test without a stand-in takes its I/O from its caller: test the core with values.
- Pass every path in from the temp root. Never steer a module through `process.cwd()` or `HOME`.
- A failure branch runs on a real failure: an address where nothing listens, an MSW handler that
  returns the error, or a conflicting row. No spy that makes a real method reject. When nothing real
  reaches a branch, inject that dependency.
- No `mock.module` in a test file: without isolation it leaks into every later file. Two kinds live
  in a preload, `register-<module>-mock.ts`: a stand-in for what the runtime can't host, such as
  WebGL, and a wrapper a library documents for testing.
- A module you want to mock for what it imports shows a bad import graph. Fix the graph.

## Speed

- A unit test finishes in under 5 s on CI. Fix the cause the
  [slow-tests table](./references/slow-tests.md) names; never raise the timeout first.
- A test moves to a lane only when the real system it needs can't run in the unit run, never because
  it is slow.
