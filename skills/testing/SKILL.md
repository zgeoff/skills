---
name: testing
description:
  Testing rules for zgeoff repos — the three package regimes, flat behavioural tests, a setupTest
  that wires and creates no data, inline data and tested factories, stored state seeded and checked
  through the module that owns it, strict assertions and inline snapshots, controlled time,
  condition waits, real filesystems and transports, the narrow cases for module mocks, and the
  per-test limit of each lane. References cover the seed API, slow tests and lanes, real databases,
  HTTP mocking with MSW, observability, cleanup, system tests and Claude Code mod checks, and, in a
  repo that uses them, React and TanStack clients and native Go and NixOS conventions. Load when
  designing, writing, or reviewing tests.
metadata:
  kind: rule-set
---

# Testing

You write tests that run real code through the unit's entry, the function or procedure its callers
call, and check what those callers can see. Each test creates all of its own data, and uses a
stand-in only at a boundary it can't cross. Watch for a helper that hides the scenario from the test
body, a loose assertion that lets a broken unit pass, and a test that writes or reads another
module's tables. When you change code, bring the tests of that code in line with these rules.

Hand back the tests you added or changed, with the unit run and lint passing. For each behaviour you
changed, name the test that fails without your change, and show it: revert the change, run the test,
and see it fail.

## Key rules

Each line links the section that explains it.

- [Loading the skill](#loading-the-skill): load `project-testing` beside this skill; it only adds
  rules.
- [The test run](#the-test-run): the preload resets shared state after each test, CI runs in random
  order, and isolation never fixes a leak.
- [Principles](#principles): visible beats concise, every test stands alone, and each changed
  behaviour has a test that fails without the change.
- [Where a test lives](#where-a-test-lives): beside its module, or in `integration/`, `evals/` or
  `e2e/`.
- [Structure and naming](#structure-and-naming): flat `test()` calls titled "it …", one act per
  test, no `describe`, and no loop of assertions.
- [Setup and cleanup](#setup-and-cleanup): one local `setupTest()` wires the dependencies and
  creates no data, and `onTestFinished` follows each acquisition.
- [Test data](#test-data): literals stay inline, shared domain types get tested factories, and
  stand-ins hold no logic.
- [Stored state](#stored-state): seed and check database rows and stored files through the module
  that owns them.
- [Schemas and parsers](#schemas-and-parsers): feed inline payloads, and assert the issue path or
  the parsed data.
- [Assertions](#assertions): `toStrictEqual` on the full contract, each result on its own, inline
  snapshots only, a test per declared error, and narrowing before a loose matcher.
- [Matchers](#matchers): use a jest-extended matcher in place of a hand-written check.
- [Time and waiting](#time-and-waiting): control time by argument, then injected clock, then fake
  timers, and wait on a condition, never a sleep.
- [Boundaries](#boundaries): pick the package's regime by its furthest edge, replace only a
  boundary, fail on a real failure, and keep `mock.module` in a preload.
- [Speed](#speed): a unit test finishes in under 5 s; fix the cause, never the timeout.

## References

- [Seeding](./references/seeding.md): writing or changing a seed, a package's `buildSeed`, a test
  over several states, and a state no owner code makes.
- [Slow tests and lanes](./references/slow-tests.md): a slow test, a per-run template, the run mode,
  and a lane.
- [Factories](./references/factories.md): writing or changing a factory.
- [Database](./references/database.md): a package that owns a schema.
- [HTTP mocking](./references/http.md): a package in the HTTP-mocked regime.
- [Cleanup](./references/cleanup.md): helpers that register cleanup, ordered cleanup, and a test
  that fails only in the full run.
- [Observability](./references/observability.md): code that records metrics, spans, error reports,
  or structured logs.
- [System tests](./references/system-tests.md): end-to-end and evaluation suites, property tests,
  native timers, real transports, stateful stand-ins, and paths the host fixes.
- [Shell scripts](./references/shell.md): a shell script's test, run through Bun's `$` shell.
- [Workflows](./references/workflows.md): a GitHub Actions step's logic, tested through its script.
- [Claude Code mod checks](./references/claude-code-mods.md): a mod's hooks, which
  `claude plugin test` runs.

<!-- repo-sync needs ./references/frontend.md -->

- [Frontend](./references/frontend.md): React and TanStack clients in a web app.

<!-- repo-sync end -->

<!-- repo-sync needs ./references/go.md -->

- [Go testing](./references/go.md): Go tests.

<!-- repo-sync end -->

<!-- repo-sync needs ./references/nixos.md -->

- [NixOS testing](./references/nixos.md): Nix evaluation and VM tests.

<!-- repo-sync end -->

## Loading the skill

This skill is the shared base that repo-sync, the job that copies shared skills into each repo,
delivers from zgeoff/skills: edit it there, never in a downstream copy. When the repo has a
`project-testing` skill, load it as well. It adds the repo's harnesses, lanes and stricter rules,
and it never relaxes a rule here: a repo that needs an exception changes this skill.

Some repos run a skill gate, a hook that refuses an edit to a test file until your session has
loaded this skill. Load it again after a compaction, and in each subagent. Edit a test file with
Edit or Write, never through Bash: the gate checks a Bash command only after it has changed the
file.

The rules describe Bun tests. A reference for another runner maps them to that runner.

## The test run

The unit run is the repo's plain `bun test` script: every test file outside a lane, run on each pull
request and before each push. A lane is a separate script for tests that need one real system, such
as a browser, with its own time limit, as [Speed](#speed) describes.

- The repo's `bunfig.toml` preload registers the matchers and the resets that return shared state to
  a clean baseline after each test. When your change adds module-level state, such as a cache, add
  its reset to the preload.
- Override an environment variable through the repo's env util in the shared test utils, never by
  assigning `process.env`. The preload restores each override.
- The preload starts a shared resource, such as the MSW server, in `beforeAll` and stops it in
  `afterAll`, never at import, so start and stop pair up in every run mode.
- Isolation (`--isolate`, or `--parallel` without `--no-isolate`) gives each file a fresh global and
  module registry. It hides a leak between files and never fixes one.
- CI passes `--randomize`, and Bun prints the `--seed=<seed>` it used. A failure under `--randomize`
  is a leak: rerun with the printed seed and fix the leak at its cause, never by pinning the order.

## Principles

These decide a case the rules leave open.

- **Visible beats concise.** A reader understands a test from its body alone. Repeated literals cost
  a few lines; setup the reader can't see costs a wrong conclusion.
- **Every test stands alone.** It passes run by itself, in any order, and beside every other test.
- **Behaviour is the contract.** A refactor that keeps the behaviour leaves every test green.
- **A test fails without its change.** Each behaviour a change adds gets a test that runs the
  changed path from the unit's entry and fails when the change is reverted. A test that checks only
  its own stand-in, or compares values it defined itself, passes either way.
- **Real first, stand-ins at the edge.** Each stand-in marks a spot where the test and production
  can disagree. Make it faithful: real status codes, real payload shapes, the production types.
- **Test utilities are code.** A helper tests depend on lives in the repo's shared test utils with
  its own tests, because a broken helper fails silently in every suite that uses it.
- **Never cut a test that checks behaviour, and never add one that checks nothing.** When a lint
  rule asks for a test with nothing to check, such as a test file for a module with no logic, change
  the rule's config with a one-line reason. A repo that adopts a shared lint rule never tests that
  the rule fires.

## Where a test lives

- `<package>/src/<file>.test.ts` holds the unit suite of one source file, beside it, so `src/`
  mirrors its tests. A program's entry module, such as `cli.ts`, keeps its test beside it too.
- `integration/` holds one flow across several packages, in one process, in the unit run.
- `e2e/` drives the built product from outside, through its binary, CLI, HTTP or a socket. It holds
  tests of the process itself (start-up, signals, exit codes, crash recovery) and one happy-path
  journey per main user flow. A flow's edge cases and denials run in process.
- `evals/` holds the evaluation suites, in the unit run.
- A test that drives a real browser goes in `<module>.browser.test.ts`, in the browser lane.
- A lane's harness, the code that starts the lane's real system, lives in a package with its own
  unit tests, never beside the lane's test files.
- The repo has no other `test/`, `tests/` or `__tests__` directory. A static check of config or
  generated text is a script, not a test.

To place a test, ask where its failure points: at the wiring of the built product, `e2e/`; at the
wiring between packages, `integration/`; at the logic, beside the module.

## Structure and naming

- Write each test as a top-level `test(…)` call. Never use `describe`: shared hooks in its scope
  couple the tests.
- A title starts with "it" and reads as verb, outcome, then condition:
  `it rejects a title longer than 120 characters`. It names observable behaviour, never an internal
  identifier.
- When one file tests several units, such as the procedures of a router, a `#<unit>` prefix takes
  the place of "it": `#archiveNote rejects a note that is already archived`.
- `zgeoff/test-shape` refuses `describe`, `it`, the four hooks, `toEqual`, and a title that starts
  with neither "it " nor a `#<unit> ` prefix.
- A body arranges, acts, then asserts, with no phase comments. A test acts once; its act may hold
  several calls whose combined result the assertions check. Two independent act-and-assert pairs are
  two tests. An earlier act the test depends on, such as saving the note it archives, is
  arrangement, with no assertion.
- Use `test.each` only for cases that differ in values alone: rows of plain data, or of the owner's
  seed functions, and a title that interpolates the value that varies. Give any other set of cases a
  `test()` each.
- An end-to-end journey test may chain dependent act-and-assert phases, one file per journey.

```ts
test.each([
  ['1500ms', 1500],
  ['2s', 2000],
])('it parses %s as %d milliseconds', (input, expected) => {
  expect(parseDuration(input)).toBe(expected);
});
```

A loop that asserts once per input hides which input failed and stops at the first failure. Use
`test.each`, or one collection matcher over the items of one result:

```ts
expect(listOpenNotes(store)).toSatisfyAll((note: Note) => note.archivedAt === null);
```

Two kinds of loop may assert, as long as neither computes its expectation with the code it checks:

- a loop over a module's own registry that checks each entry is complete, such as every exported
  renderer having a preview;
- a loop that awaits each generated case of a conformance suite:
  `await expect(conformanceCase.run(app)).toResolve()`.

A loop that only arranges, such as inserting 51 rows to cross a page limit, holds no assertion. For
generated inputs or operation sequences, use fast-check, as
[System tests](./references/system-tests.md) describes.

## Setup and cleanup

Process-wide setup and cleanup belong to the preload. Per-test setup belongs to one local function,
`setupTest()`, that each test calls. A file with nothing to wire has no `setupTest()`. `beforeAll`,
`beforeEach`, `afterEach` and `afterAll` never appear in a test file.

- `setupTest()` holds only wiring: temp directories, the database, the clock, servers, clients,
  recorders, the unit built through its factory, and the seeds bound to them. It takes no argument,
  or a typed config that selects what to wire and carries no value a test's outcome depends on. It
  has no `if`.
- `setupTest()` creates no data. Data is any row, file, store entry or starting value the code under
  test reads. Each test creates all of its data in its arrange phase, even when every test in the
  file needs the same data. A wired clock starts at a fixed default; when the code under test reads
  the time, set the clock in the test's arrange phase.
- A test file declares one function, `setupTest()`, and `zgeoff/setup-test-only` fails any other
  module-level declaration. A helper goes inline, becomes a registered matcher, or moves to the
  shared test utils with its own tests.
- One exception: a test that Bun must skip before it runs, such as one that needs a binary the host
  may lack. Bun's `skipIf` takes a boolean, so you may compute that boolean at module level with an
  awaited check, such as `const hasDocker = await probeDocker()`, with a comment giving that reason.
  Name each repeated condition once, and read those names only in `skipIf`.
- `setupTest()` may return a closure that only calls production helpers on the runtime it built. A
  closure with a branch, a loop or state of its own moves to the shared test utils.
- Each test file keeps its own `setupTest()`.
- Hold the result in one `const`, and never destructure it. The binding names are fixed: `ctx` for
  `setupTest()`, `hook` for `renderHook(…)`, `rendered` for `render(…)`.

Here `setupTest()` wires the service and the seeds, and the test seeds its own user:

```ts
async function setupTest() {
  const db = await createTestDatabase();
  const deps = { db, clock: buildStubClock() };

  return { ...deps, service: createNotesService(deps), seed: buildSeed(deps) };
}

test('it lists the notes of a user with none as empty', async () => {
  const ctx = await setupTest();
  const user = await ctx.seed.user({ name: 'ada' });

  expect(await ctx.service.listNotes({ userID: user.id })).toStrictEqual([]);
});
```

Register cleanup with `onTestFinished` immediately after each acquisition, so a later step that
throws still releases it. `try`/`finally` never appears in a test.

```ts
function setupTest() {
  const dir = mkdtempSync(join(tmpdir(), 'notes-'));

  onTestFinished(() => rm(dir, { recursive: true, force: true }));

  return { dir };
}
```

| State                                                   | Cleanup                                           |
| ------------------------------------------------------- | ------------------------------------------------- |
| A resource that `setupTest()` or the test body acquires | `onTestFinished(…)` immediately after acquisition |
| Process state the test body changes                     | `onTestFinished(…)` immediately after the change  |
| State that a preload reset covers                       | Nothing                                           |

Random values are fine as data, but never count on one to keep a test apart from another test's
rows: the resets keep tests apart. A test that passes alone and fails beside others has found a
cleanup gap, and [Cleanup](./references/cleanup.md) holds the steps that close it.

## Test data

- Plain inputs stay inline at the call site: arguments, options, config values. Write the literal
  again in the next test. A module-level fixture, a shared baseline object, or a constant that only
  names a literal never appears in a test file.
- A domain type that crosses a module boundary gets a tested `buildMock<Type>` factory in the shared
  test utils as soon as a test needs one. A type another package owns, such as an SDK result,
  crosses a boundary on its first use. A type private to the module under test stays inline.
  [Factories](./references/factories.md) holds how to write one.
- A factory builds plain data and writes nothing. Stored state comes from a seed, as
  [Stored state](#stored-state) describes.
- A stand-in's data stays inline: a fixed answer, a recorder (`mock()`), a no-op, an answer table
  read by one key, or a list of scripted answers passed to the answer-queue util in the shared test
  utils. Any other code in a stand-in is logic, such as counting calls, keeping state or branching,
  and it moves to a tested util in the shared test utils.
- A stand-in util is named for what it impersonates: `start-stub-<thing>.ts` for one that starts
  something long-running, `create-stub-<thing>.ts` for one that creates a resource, and
  `build-stub-<thing>.ts` for the rest. An executable stand-in script is `run-stub-<thing>.ts`. The
  util's tests pin what it assumes about the real thing.
- A chain of `mockReturnValueOnce` or `mockResolvedValueOnce` never appears: a call past the last
  answer returns the default without failing, where the answer-queue util throws.

## Stored state

Stored state means database rows and files on disk. Its owner is the module whose code writes them,
and the owner's own tests are the tests in that module's folder. Seed and check stored state through
its owner, so a schema or layout change breaks only the owner and its tests.

**Inside the owner.** The owner's own tests may write and read its rows and files directly. They may
also use its seeds.

**Outside the owner, checking.**

- Read rows and files only through the owner's code: a read function for rows, a path helper for
  files. Never write your own query or build a stored path by hand.
- If the unit under test already returns the fact, check its result. If the owner has no read
  function for the fact, add one to the owner, with its own test.
- A query that only sets up a failure, such as a trigger that makes a write fail, is setup, not a
  check.

**Outside the owner, seeding.** Never write stored state yourself. Call the owner's seeds through
`ctx.seed`: one per concept, plus one per value of the owner's state type, such as `archivedNote`.
Pass every other difference as input, and call one seed per concept the test needs. Keep these in
the test body:

- the behaviour under test, as a real call;
- each clock move;
- each effect on another record, asserted in the test, never inside a seed.

Before you write or change a seed, read [Seeding](./references/seeding.md). A direct write lives
only inside a seed, with a `//` comment naming the state the owner's code can't make.

```ts
test('it restores an archived note', async () => {
  const ctx = await setupTest();
  const note = await ctx.seed.archivedNote({ title: 'Groceries' });

  await ctx.service.restoreNote({ noteID: note.id });

  expect((await readNote(ctx.db, note.id))?.status).toBe('draft');
});
```

Two kinds of test outside the owner may write and read stored state directly, and no others: a
migration test, and a test of code whose product is SQL or storage, such as a database dialect. A
seed's own test sits in the owner, so it counts as one of the owner's tests.

`zgeoff/seed-only` fails a database write in any other test file. Tests under `integration/` and
`e2e/` get no exception. A project skill may name the owner of a table that several modules write.
It never adds another exception.

## Schemas and parsers

- Feed a parser inline literal payloads it accepts and rejects. A factory builds values made to pass
  the schema, so its output can't show a rejection.
- A rejection payload repeats the complete valid literal and alters one field.
- A rejection test asserts the path of the reported issue, because `success: false` passes for any
  reason: `expect(result.error?.issues).toPartiallyContain({ path: ['title'] })`. Never read
  `issues[0]`, which ties the test to issue order.
- An acceptance test asserts `result.data`: `toStrictEqual(payload)` for a schema that passes values
  through, or the transformed value. A bare `success: true` passes for a schema that strips a field.

## Assertions

- Use `toStrictEqual` when the test determines every field: the full shape is the contract. For a
  field the test doesn't determine, such as a generated id or a default timestamp, put an asymmetric
  matcher inside `toStrictEqual`. Use `toMatchObject` only for a raw row an owner's test reads back.
  A partial match chosen because the literal is long is a defect. `toEqual` never appears.
- Assert each result on its own. Never gather unrelated results into one object to put them under
  one `toStrictEqual`. A normalised projection of one result, such as a command's exit code, stdout
  and stderr, stays together.
- Derive an expected value from the contract, never with the unit's own calculation.
- When a test reads back stored state after a mutation, one `toBe` on the field that changed is
  enough.
- A recovery test injects faults, then acts to recover. Each faulted call is arrangement: capture
  its rejection as a value with `.then(() => null, (error: unknown) => error)`, and assert each one
  at the end beside the final state.
- Snapshots are inline only. `toMatchInlineSnapshot` pins machine output no person derives by
  reading the code, such as a generated SQL string. A hand-written value, such as a spec test
  vector, keeps an explicit matcher. File and component snapshots never appear.
- Code that turns the same input into the same output every time, such as a report generator, gets a
  test that pins one hand-written input's full output inline, and a test that runs the same input
  twice and compares the results, as [System tests](./references/system-tests.md) describes.
- A sweep, code that deletes leftover resources, has a test asserting what it leaves alone, such as
  `it never removes another owner's files`.

**Errors.**

- Assert an error at the strictness its contract needs: `toThrow()`,
  `toThrowWithMessage(Error, /…/)` when the message is contract, or `toMatchObject({ code })` for a
  typed code.
- Each error a unit declares has its own test. A throw that can't occur in production declares no
  error: delete the branch when a dependency's contract rules it out, otherwise write `invariant()`
  from `tiny-invariant`.
- A `try`/`catch` never asserts an error: when nothing throws, the assertion never runs.
- Write `.rejects` and `.resolves` chains without `await`, because Bun settles them inside the
  matcher. Always `await` `toResolve()` and `toReject()`.

**Authorisation pairs.** An access rule lands with two tests: the allowed caller succeeds, and the
other caller is refused, named in the title, as in `it rejects a note owned by another user`. A read
path that hides a record asserts the hidden result, such as `toBeNull()`.

**Narrowing.** A test body never branches; each path gets its own test. Narrow a value that may be
missing with `invariant(value)` before a matcher that passes on `undefined`: a `.not` matcher,
`toBeUndefined`, `toBeFalsy` or `toBeNil`. With any other matcher, `?.` is safe, because a missing
value fails. When unsure, narrow. An assertion inside a callback passes when the callback never
runs: copy the value out and assert after the call returns.

## Matchers

The `@zgeoff/bun-test-extended` preload registers the jest-extended matchers, and each package's
`augment-bun-test.ts` import gives `tsc` their types. When a matcher checks the property a test
asserts, use it in place of a hand-written check such as `expect(items.every(isOpen)).toBe(true)`,
because the matcher reports the received value on failure.

| Value             | Matchers                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Array             | `toIncludeAllMembers`, `toIncludeSameMembers`, `toIncludeAllPartialMembers`, `toPartiallyContain`, `toSatisfyAll` |
| Object            | `toContainEntry`, `toContainEntries`, `toContainAllKeys`, `toBeFrozen`                                            |
| String            | `toStartWith`, `toEndWith`, `toInclude`, `toEqualCaseInsensitive`, `toEqualIgnoringWhitespace`                    |
| Any value         | `toBeNil`, `toBeOneOf`, `toSatisfy`, `toBeWithin`, `toBeEmpty`                                                    |
| Date              | `toBeAfter`, `toBeBefore`, `toBeBetween`, `toBeValidDate`                                                         |
| Mock              | `toHaveBeenCalledOnce`, `toHaveBeenCalledExactlyOnceWith`, `toHaveBeenCalledBefore`, `toHaveBeenCalledAfter`      |
| Error and promise | `toThrowWithMessage`, `toResolve`, `toReject`                                                                     |

Each works asymmetrically inside `toStrictEqual`, as in
`status: expect.toBeOneOf(['open', 'held'])`. Give `toPartiallyContain` and
`toIncludeAllPartialMembers` plain objects, never a bare asymmetric matcher: it has no own fields,
so any non-empty array passes. To find an element by a matcher, use
`toContainEqual(expect.toStartWith('a'))`.

## Time and waiting

Control time in the most explicit form the code allows:

1. **A time argument.** Code that works out what is due takes the time as a parameter, and the test
   passes it: `expireSessions(store, { now: new Date('2026-01-01T12:00:00Z') })`.
2. **An injected clock.** Code with its own loop or timers takes a clock in its deps, and the test
   steps it: `ctx.clock.advance(30_000)`.
3. **Fake timers.** For code the repo doesn't own, `setSystemTime()` and fake timers, restored in
   `onTestFinished`.

A value that depends on the wall clock is built relative to `Date.now()` and asserted with range
matchers such as `toBeAfter` and `toBeWithin`, never an exact timestamp.

Wait on a condition with a polling `waitFor`, never a sleep: a sleep costs its full length on every
run and still fails on a slow machine. When the code offers nothing to wait on, add a signal, such
as an event, a log marker or a state flag. A native or library timer, and a deliberate fault delay,
follow [System tests](./references/system-tests.md).

## Boundaries

Pick a package's regime by the furthest edge its code reaches:

- **Pure:** return values, temp directories and a spawned binary.
- **HTTP-mocked:** MSW handlers over an in-memory store, as [HTTP mocking](./references/http.md)
  describes.
- **Real database:** the real engine, isolated per test, as [Database](./references/database.md)
  describes.

Code that records metrics, spans, error reports or logs also follows
[Observability](./references/observability.md).

Replace a boundary, never the code inside it. Never stub `fetch`, an HTTP client, or a method of the
unit's own services: the path to the boundary runs for real, serialisation and error handling
included.

| Boundary                                        | The test uses                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Pure computation                                | Return values, with no stand-in                                                 |
| A CLI                                           | The real binary, spawned end to end                                             |
| A shell script                                  | The real script, through Bun's `$`, as [Shell](./references/shell.md) describes |
| The filesystem                                  | A real `mkdtemp` tree per test                                                  |
| A database                                      | The real engine, isolated per test                                              |
| A remote HTTP or RPC service                    | MSW handlers                                                                    |
| A service with a cheap container                | The real service in a container                                                 |
| An SDK that sends command objects               | A stand-in for its send call                                                    |
| A program the repo drives over its own protocol | A stateful stand-in, as [System tests](./references/system-tests.md) describes  |

A module that is hard to test without a stand-in takes its I/O from its caller: test the pure core
with values, and the I/O edge against the real boundary. Take every path from the temp root and pass
it in; never steer a module through `process.cwd()` or a `HOME` set after startup.

**Infrastructure failures.** Run a failure branch on a real failure: a driver pointed at an address
where nothing listens, an MSW handler that returns the error status, or real state that makes one
statement fail, such as a conflicting row. Never use a spy that makes a method of a real object
reject. When nothing real reaches a branch, put that dependency behind an injected boundary.

**Module mocks.** `mock.module` never appears in a test file: without isolation, a module mock in
one file applies to every file loaded after it. Two kinds are legal, each in a preload module named
`register-<module>-mock.ts`:

- a stand-in for what the test runtime can't host, such as a WebGL scene, read from a stub store
  that one exported setter changes;
- a wrapper a library documents for testing, which keeps the real behaviour and adds one hook.

When you want to mock a module because of what it imports, fix the import graph instead.

## Speed

A unit test finishes in under 5 s on CI. `zgeoff/max-test-timeout` refuses a timeout above the limit
of the file's lane, and `zgeoff/no-test-sleep` refuses a fixed sleep. When a test is slow, find its
cause in [Slow tests and lanes](./references/slow-tests.md) and make the fix it names; never raise
the timeout first. Move a test to a lane only when the real system it needs, such as a browser or a
VM, can't run in the unit run. A test that is only slow stays in the unit run and gets fixed.
