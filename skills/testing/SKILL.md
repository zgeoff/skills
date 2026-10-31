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
---

# Testing

A test runs real code through the unit's entry and checks what callers can see. It reaches for a
stand-in only at a boundary it can't cross, and it creates all of its own data. Most broken suites
come from three traps: a helper that hides the scenario from the test body, a loose assertion that
lets a broken unit pass, and a test that writes or reads another module's tables. When existing
tests break these rules, align them while you work on the code they cover.

## Key rules

Each line links the section that explains it.

- [Loading the skill](#loading-the-skill): load `project-testing` beside this skill; it only adds
  rules.
- [The test run](#the-test-run): the preload resets shared state after each test, CI runs in random
  order, and isolation never fixes a leak.
- [Regimes](#regimes): the furthest edge a package's code reaches picks its regime and the reference
  to open.
- [Principles](#principles): visible beats concise, every test stands alone, and each changed
  behaviour has a test that fails without the change.
- [Where a test lives](#where-a-test-lives): beside its module, or in `integration/`, `evals/` or
  `e2e/`.
- [Structure and naming](#structure-and-naming): flat `test()` calls titled "it …", one act per
  test, no `describe`, and no loop of assertions.
- [Setup and cleanup](#setup-and-cleanup): one local `setupTest()` wires and creates no data, and
  `onTestFinished` follows each acquisition.
- [Test data](#test-data): literals stay inline, shared domain types get tested factories, and
  stand-ins hold no logic.
- [Stored state](#stored-state): seed and check database rows and stored files through the module
  that owns them.
- [Schemas and parsers](#schemas-and-parsers): feed inline payloads, and assert the issue path or
  the parsed data.
- [Assertions](#assertions): `toStrictEqual` on the full contract, each result on its own, inline
  snapshots only for golden output, a test per declared error, and narrowing before a matcher that
  passes on `undefined`.
- [Matchers](#matchers): use a jest-extended matcher in place of a hand-written check.
- [Time and waiting](#time-and-waiting): control time by argument, then injected clock, then fake
  timers, and wait on a condition, never a sleep.
- [Boundaries](#boundaries): a stand-in replaces a boundary, never the code inside it, a failure
  branch runs on a real failure, and `mock.module` lives only in a preload.
- [Speed](#speed): a unit test finishes in under 5 s; fix the cause, never the timeout.

## References

Open a reference when the task touches its area.

- [Seeding](./references/seeding.md): writing or changing a seed, a package's `buildSeed`, a test
  that needs a state no owner makes, and the seed lint rules.
- [Slow tests and lanes](./references/slow-tests.md): a test near its limit, a per-run template, a
  new lane, and a test that can't fit its lane.
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

This skill is the shared base that repo-sync delivers from zgeoff/skills: edit it there, never in a
downstream copy. When the repo has a `project-testing` skill, load it as well. It adds the repo's
harnesses, lanes and stricter rules, and it never relaxes a rule here: a repo that needs an
exception changes this skill.

A repo that runs the skill gate refuses an edit to a test file until the session has loaded the
skills the path needs. A subagent loads them itself, and a compaction clears every load. Change a
gated file with Edit, Write or MultiEdit, never with a Bash redirect, `sed -i` or a script: the gate
checks after the command, so a Bash write still breaks the rule.

The rules describe Bun tests. A reference for another runner maps them to that runner, and keeps
isolation, explicit scenarios, independent expectations, real boundaries and meaningful failures.

## The test run

- The repo's `bunfig.toml` preload registers the matchers and every reset that returns shared state
  to a clean baseline after each test. Those resets keep each file independent. A test overrides an
  environment variable through the repo's env util, never by assigning `process.env`.
- The preload starts a shared resource, such as the MSW server, in `beforeAll` and stops it in
  `afterAll`, never at import, so start and stop pair up in every run mode. A test process has one
  MSW server, and each package adds its handlers to it.
- Isolation (`--isolate`, or `--parallel` without `--no-isolate`) gives each file a fresh global and
  module registry. It hides a leak between files and never fixes one. A repo measures both modes
  before it chooses, and states its mode in its test script and its project-testing skill.
- The test script takes its worker count from the shared worker helper, never from a bare
  `--parallel`, which starts one worker per core.
- CI passes `--randomize`, and Bun prints the `--seed=<seed>` it used. A failure under
  `--randomize` is a leak: rerun with the printed seed and fix the leak at its cause, never by
  pinning the order.
- A resource each worker keeps across its files, such as a database cloned from the per-run
  template, is named after the worker's process, and no `afterAll` drops it.
- Never write a test only to satisfy a lint or layout rule, and never test that a shared lint rule
  fires in a repo that adopts it: change the rule's config, with a one-line reason.

## Regimes

Each package falls into one regime, chosen by the furthest edge its code reaches.

| Regime        | The package                                       | The edge it tests against                           | Reference                            |
| ------------- | ------------------------------------------------- | --------------------------------------------------- | ------------------------------------ |
| Pure          | A library or CLI with no service or database edge | Return values, temp directories, the spawned binary | none                                 |
| HTTP-mocked   | A client of a remote service, or a web app        | MSW handlers over an in-memory store                | [HTTP mocking](./references/http.md) |
| Real database | A service, app, or library that owns a schema     | The real engine, isolated per test                  | [Database](./references/database.md) |

<!-- repo-sync needs ./references/frontend.md -->

A web app in the HTTP-mocked regime follows [Frontend](./references/frontend.md) for its React and
TanStack clients.

<!-- repo-sync end -->

Code that records metrics, spans, error reports or structured logs follows
[Observability](./references/observability.md) in any regime.

## Principles

These decide a case the rules leave open.

- **Visible beats concise.** A reader understands a test from its body alone. Repeated literals
  cost a few lines; setup the reader can't see costs a wrong conclusion.
- **Every test stands alone.** It passes run by itself, in any order, and beside every other test.
- **Behaviour is the contract.** A refactor that keeps the behaviour, such as a renamed private
  helper, leaves every test green.
- **A test fails without its change.** Each behaviour a change adds gets a test that runs the
  changed path from the unit's entry and fails when the change is reverted. A test that checks only
  its own stand-in, or compares values it defined itself, passes either way.
- **Real first, stand-ins at the edge.** Each stand-in marks a spot where the test and production
  can disagree. Make it faithful: real status codes, real payload shapes, the production types.
- **Test utilities are code.** A helper tests depend on lives in the repo's shared test utils with
  its own tests, because a broken helper fails silently in every suite that uses it.
- **The assertion is the test.** One loose assertion lets a broken unit pass.

## Where a test lives

- `<package>/src/<file>.test.ts` holds the unit suite of one source file, beside it, so `src/`
  mirrors its tests. A program's entry module, such as `cli.ts`, keeps its test beside it too.
- `integration/` holds one flow across several packages, in one process. It runs in the unit run
  under every unit rule.
- `e2e/` drives the built product from outside, through its binary, CLI, HTTP or a socket. It holds
  tests of the process itself (start-up, signals, exit codes, crash recovery) and one happy-path
  journey per main user flow. A flow's edge cases and denials run in process.
- `evals/` holds the evaluation suites, which replay a committed corpus through the production path,
  in the unit run.
- A test that drives a real browser goes in `<module>.browser.test.ts`, in its own lane.
- The repo has no other `test/`, `tests/` or `__tests__` directory. A static check of config or
  generated text is a script, not a test.

To place a test, ask where its failure points: at the wiring, it belongs in `e2e/`; at the logic, in
the unit run.

## Structure and naming

- Write each test as a top-level `test(…)` call. `describe` is banned: its scope invites shared
  hooks that couple tests.
- A title starts with "it" and reads as verb, outcome, then condition:
  `it rejects a title longer than 120 characters`. It names observable behaviour, never an internal
  identifier.
- When one file tests several units, such as the procedures of a router, a `#<unit>` prefix takes
  the place of "it": `#archiveNote rejects a note that is already archived`.
- `zgeoff/test-shape` refuses `describe`, `it`, the four hooks, `toEqual`, and a title that starts
  with neither "it " nor a `#<unit> ` prefix.
- A body arranges, acts, then asserts, with no phase comments. A test acts once; its act may hold
  several calls whose combined result the assertions check, such as the two runs a determinism test
  compares. Two independent act-and-assert pairs are two tests. An earlier act the test depends on,
  such as saving the note it archives, is arrangement, with no assertion.
- `test.each` serves a closed decision table: rows of plain data, and a title that interpolates the
  input that varies. Any other set of cases gets a `test()` each.
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

Two loops stay legal: a completeness loop over a module's own registry, and a conformance loop that
awaits `expect(conformanceCase.run(app)).toResolve()`. Neither computes its expectation with the
transformation it checks. A loop that only arranges holds no assertion.

Use fast-check for generated inputs or operation sequences whose combinations matter. A property
runner may loop, branch and act more than once; [System tests](./references/system-tests.md) holds
its rules.

## Setup and cleanup

Process-wide setup and cleanup belong to the preload. Per-test setup belongs to one local function,
`setupTest()`, that each test calls. `beforeAll`, `beforeEach`, `afterEach` and `afterAll` never
appear in a test file.

- `setupTest()` holds only wiring: temp directories, the database, the clock, servers, clients,
  recorders, the unit built through its factory, and the seeds bound to them. It takes no argument,
  or a typed config that selects what to wire and carries no value a test's outcome depends on. It
  has no `if`.
- `setupTest()` creates no data. Data is any row, file, store entry or starting value the code under
  test reads. Each test creates all of its data in its arrange phase, even when every test in the
  file needs the same data. A wired clock starts at a fixed default; a test that reads the time
  sets it.
- A test file declares one function, `setupTest()`, and `zgeoff/setup-test-only` fails any other
  module-level declaration. A helper goes inline, becomes a registered matcher, or moves to the
  shared test utils with its own tests. One exception: a collection-time skip gate may keep its
  awaited probe at module level, with a comment, because Bun's `skipIf` takes a boolean.
- `setupTest()` may return a closure that only calls production helpers on the runtime it built. A
  closure with a branch, a loop or state of its own moves to the shared test utils.
- Each test file keeps its own `setupTest()`. A shared one gathers a flag for every suite.
- Hold the result in one `const`, and never destructure it. The binding names are fixed: `ctx` for
  `setupTest()`, `hook` for `renderHook(…)`, `rendered` for `render(…)`.

In this made-up example, `setupTest()` wires the client and the seeds, and the test seeds its own
user:

```ts
async function setupTest() {
  const db = await createTestDatabase();
  const deps = { db, clock: buildStubClock() };

  return { ...deps, client: createNotesClient(deps), seed: buildSeed(deps) };
}

test('it lists the notes of a user with none as empty', async () => {
  const ctx = await setupTest();
  const user = await ctx.seed.user({ name: 'ada' });

  expect(await ctx.client.listNotes({ userID: user.id })).toStrictEqual([]);
});
```

A `setupTest()` that seeds the user and returns it creates data, and breaks the rule.

Register cleanup with `onTestFinished` immediately after each acquisition, so a later step that
throws still releases it. It runs on failure, keeps teardown beside the acquisition, and needs no
guard for a resource the test never reached. `try`/`finally` never appears in a test.

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

A resource a test leaves behind costs memory too: `/tmp` and tmpfs data sit in RAM. A test never
relies on a unique key to avoid another test's rows. A test that passes alone and fails beside
others has found a cleanup gap, and [Cleanup](./references/cleanup.md) holds the steps that close
it.

## Test data

- Plain inputs stay inline at the call site: arguments, options, config values. Write the literal
  again in the next test. A module-level fixture, a shared baseline object, or a constant that only
  names a literal never appears in a test file.
- A domain type that crosses a module boundary gets a tested `build<Type>` factory in the shared
  test utils as soon as a test needs one. A type another package owns, such as an SDK result,
  crosses a boundary on its first use. A type private to the module under test stays inline.
  [Factories](./references/factories.md) holds how to write one.
- A factory builds plain data and writes nothing. Stored state comes from a seed, as
  [Stored state](#stored-state) describes.
- A stand-in's data stays inline: a fixed answer, a recorder (`mock()`), a no-op, an answer table
  read by one key, or a list of scripted answers passed to the tested answer-queue util. Any other
  code in a stand-in is logic, such as counting calls, keeping state or branching, and it moves to a
  tested util in the shared test utils.
- A stand-in util is named for what it impersonates: `start-stub-<thing>.ts` for one that starts
  something long-running, `create-stub-<thing>.ts` for one that creates a resource, and
  `build-stub-<thing>.ts` for the rest. Its tests pin what it assumes about the real thing.
- A chain of `mockReturnValueOnce` never appears: a call past the last answer returns the default
  without failing, where the answer-queue util throws.

## Stored state

Stored state means database rows and files on disk. Its owner is the module whose code writes them.
A test seeds stored state and checks it through its owner, so a schema or layout change breaks only
the owner and its tests.

**Checking.**

- The owner's own tests read its rows and files directly.
- Every other test reads them only through the owner's code: a read function for rows, a path
  helper for files. It never writes its own query and never builds a stored path by hand.
- If the unit under test already returns the fact, check its result. If the owner has no read
  function for the fact, add one to the owner, with its own test.
- A query that only sets up a failure, such as a trigger that makes a write fail, is setup, not a
  check.

**Seeding.**

- A test outside the owner never writes stored state itself. It calls a seed the owner publishes,
  through `ctx.seed`.
- The owner publishes one seed per concept, plus one per value of its own state type, such as
  `seedArchivedNote` for `NoteStatus`. Every other difference is input. A bundle of concepts is
  never a seed: the test composes the seeds.
- A seed calls the owner's writes in a straight line, with no branch on a state, and checks the
  postconditions it promises.
- The test keeps visible the behaviour under test (as a real call), clock moves, and side effects on
  other records.
- A direct write lives only inside a seed, beside a `//` comment naming the exact state the owner's
  code can't make.

`zgeoff/seed-only` fails a database write in a test file outside a seed or the owner's own tests.
[Seeding](./references/seeding.md) holds the full API, with two hosts, two databases, table-driven
tests and protocol states.

```ts
test('it restores an archived note', async () => {
  const ctx = await setupTest();
  const note = await ctx.seed.archivedNote({ title: 'Groceries' });

  await ctx.client.restoreNote({ noteID: note.id });

  expect((await readNote(ctx.db, note.id))?.status).toBe('draft');
});
```

Three kinds of test outside the owner may check stored state directly, and no others:

- a migration test;
- the own test of a seed, which checks the rows and files it writes;
- a test of code whose product is SQL or storage, such as a database dialect, which uses tables as
  its input.

Tests under `integration/` and `e2e/` get no exception. A new case changes this skill. A project
skill may name the owner of a table that several modules write, and adds nothing else here.

## Schemas and parsers

- Feed a parser inline literal payloads it accepts and rejects. A factory builds values made to
  pass the schema, so its output can't show a rejection.
- A rejection payload repeats the complete valid literal and alters one field.
- A rejection test asserts the path of the reported issue, because `success: false` passes for any
  reason: `expect(result.error?.issues).toPartiallyContain({ path: ['title'] })`. Never read
  `issues[0]`, which ties the test to issue order.
- An acceptance test asserts `result.data`: `toStrictEqual(payload)` for a schema that passes
  values through, or the transformed value. A bare `success: true` passes for a schema that strips a
  field.

## Assertions

- Use `toStrictEqual` when the test determines every field: the full shape is the contract. For
  fields the test doesn't determine, such as generated ids or timestamps, use asymmetric matchers
  inside `toStrictEqual`, or `toMatchObject`. A partial match chosen because the literal is long is
  a defect. `toEqual` never appears.
- Assert each result on its own. Never gather unrelated results into one object to put them under
  one `toStrictEqual`. A normalised projection of one result, such as a command's exit code, stdout
  and stderr, stays together.
- Derive an expected value from the contract, never with the unit's own calculation.
- After a mutation, one `toBe` on the field that changed is enough.
- A recovery test injects faults, then acts to recover. Each faulted call is arrangement: capture
  its rejection as a value with `.then(() => null, (error: unknown) => error)`, and assert each one
  at the end beside the final state.
- Snapshots are inline only. `toMatchInlineSnapshot` pins a golden value: machine output no person
  derives by reading the code, such as a generated SQL string. A hand-written value, such as a spec
  test vector, keeps an explicit matcher. File and component snapshots never appear.
- A deterministic pipeline's suite opens with a frozen-golden test (one hand-written input, the full
  output pinned inline) and a determinism test:
  `expect(run(input)).toStrictEqual(run(input))`. A generated file the repo commits, such as an
  OpenAPI document, is compared with the committed file.
- A stand-in's derived values, such as a fake hash, are not contract. Assert their properties.
- A sweep that deletes resources has a test naming what it never touches.

**Errors.**

- Assert an error at the strictness its contract needs: `toThrow()`, `toThrowWithMessage(Error, /…/)`
  when the message is contract, or `toMatchObject({ code })` for a typed code.
- Each error a unit declares has its own test. A throw that can't occur in production declares no
  error: delete the branch when a dependency's contract rules it out, otherwise write `invariant()`.
- A `try`/`catch` never asserts an error: when the call doesn't throw, the assertion never runs.
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

The `@zgeoff/bun-test-extended` preload registers the jest-extended matchers, with types. When a
matcher checks the property a test asserts, use it in place of a hand-written check such as
`expect(items.every(isOpen)).toBe(true)`, because the matcher reports the received value on failure.

| Value             | Matchers                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Array             | `toIncludeAllMembers`, `toIncludeSameMembers`, `toIncludeAllPartialMembers`, `toPartiallyContain`, `toSatisfyAll` |
| Object            | `toContainEntry`, `toContainEntries`, `toContainAllKeys`, `toBeFrozen`                                            |
| String            | `toStartWith`, `toEndWith`, `toInclude`, `toEqualCaseInsensitive`, `toEqualIgnoringWhitespace`                    |
| Any value         | `toBeNil`, `toBeOneOf`, `toSatisfy`, `toBeWithin`, `toBeEmpty`                                                    |
| Date              | `toBeAfter`, `toBeBefore`, `toBeBetween`, `toBeValidDate`                                                         |
| Mock              | `toHaveBeenCalledOnce`, `toHaveBeenCalledExactlyOnceWith`, `toHaveBeenCalledBefore`, `toHaveBeenCalledAfter`      |
| Error and promise | `toThrowWithMessage`, `toResolve`, `toReject`                                                                     |

Each works asymmetrically inside `toStrictEqual`, as in `status: expect.toBeOneOf(['open', 'held'])`.
`toPartiallyContain` and `toIncludeAllPartialMembers` take plain objects, never a bare asymmetric
matcher as an element: it has no own fields, so any non-empty array passes. A matcher inside a field
is checked. To find an element by a matcher, use `toContainEqual(expect.toStartWith('a'))`.

## Time and waiting

Control time in the most explicit form the code allows:

1. **A time argument:** `scheduler.advance(30_000)`.
2. **An injected clock:** code with its own loop or timers takes a `now` function or a clock, and
   the test steps it.
3. **Fake timers:** for code the repo doesn't own, `setSystemTime()` and fake timers, restored in
   `onTestFinished`.

A value that depends on the wall clock is built relative to `Date.now()` and asserted with range
matchers such as `toBeAfter` and `toBeWithin`, never an exact timestamp.

A test waits on a condition with a polling `waitFor`, never a sleep: a sleep costs its full length
on every run and still fails on a slow machine. When the code offers nothing to wait on, add a
signal, such as an event, a log marker or a state flag. A native or library timer, and a deliberate
fault delay, follow [System tests](./references/system-tests.md).

## Boundaries

Stand-ins replace a boundary, never the code inside it. A test never stubs `fetch`, an HTTP client,
or a method of the unit's own services: the path to the boundary runs for real, serialisation and
error handling included.

| Boundary                                        | The test uses                                                    |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| Pure computation                                | Return values, with no stand-in                                  |
| A CLI                                           | The real binary, spawned end to end                              |
| A shell script                                  | The real script, through Bun's `$`, as [Shell](./references/shell.md) describes |
| The filesystem                                  | A real `mkdtemp` tree per test                                   |
| A database                                      | The real engine, isolated per test                               |
| A remote HTTP or RPC service                    | MSW handlers                                                     |
| A service with a cheap container                | The real service in a container                                  |
| An SDK with a command layer                     | A stand-in at the command layer                                  |
| A program the repo drives over its own protocol | A stateful stand-in, as [System tests](./references/system-tests.md) describes |

A module that is hard to test without a stand-in takes its I/O from its caller: test the pure core
with values, and the I/O edge against the real boundary. Take every path from the temp root and pass
it in; never steer a module through `process.cwd()` or a `HOME` set after startup.

**Infrastructure failures.** A failure branch runs on a real failure: a driver pointed at an address
where nothing listens, an MSW handler that returns the error status, or real state that makes one
statement fail, such as a conflicting row. A spy that makes a method of a real object reject never
appears. A branch nothing real can reach shows a missing injection point: put that dependency behind
an injected boundary.

**Module mocks.** `mock.module` never appears in a test file: without isolation, a module mock in
one file applies to every file loaded after it. Two kinds are legal, each in a preload module named
`register-<module>-mock.ts`:

- a stand-in for what the test runtime can't host, such as a WebGL scene, read from a stub store
  that one exported setter changes;
- a wrapper a library documents for testing, which keeps the real behaviour and adds one hook.

A module mocked because of what it imports shows a defect in the import graph: fix the graph.

## Speed

A unit test finishes in under 5 s on CI. `zgeoff/max-test-timeout` refuses a timeout above the
file's lane limit, and `zgeoff/no-test-sleep` refuses a fixed sleep. When a test is slow, find its
cause in [Slow tests and lanes](./references/slow-tests.md) and make the fix it names; never raise
the timeout first. A lane holds only a test whose real system is the contract, never a test that is
only slow.
