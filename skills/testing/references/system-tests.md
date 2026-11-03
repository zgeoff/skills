# System tests

Never sleep to let a service settle. Wait on a condition. Never overwrite, truncate, mount or delete
a host resource that this run didn't create. Never mark a Rust lane test with `#[ignore]`: no lane
runs it, and no one sees it stop.

These rules add to the [testing skill](../SKILL.md) for a test that runs a whole program, a browser
or a VM, or that touches something the whole host shares, such as a kernel timer or a fixed path.
Jump to the section for your test:

- [End-to-end suites](#end-to-end-suites)
- [Real applications and transport](#real-applications-and-transport)
- [Stateful stand-ins](#stateful-stand-ins)
- [Browser suites](#browser-suites)
- [Native timers and scenario delays](#native-timers-and-scenario-delays)
- [Property tests](#property-tests)
- [Evaluation suites](#evaluation-suites)
- [Benchmarks](#benchmarks)
- [Golden tests](#golden-tests)
- [Program-fixed paths and global resources](#program-fixed-paths-and-global-resources)
- [Rust lanes](#rust-lanes)

## End-to-end suites

An `e2e/` test starts a program that its package builds, as a process, and drives it from outside.

### Start the program through rig

- Declare each program in `programs` in `rig.config.ts`: its package, its source entry, its build
  command and its artifact.
- In an `e2e/` test, start a program only with `runProgram` or `startProgram` from `@zgeoff/rig/e2e`
  ([rig](https://github.com/zgeoff/tools/tree/main/packages/rig)), or with a helper in
  `src/test-utils/` that calls one of them. `runProgram` runs the program to its exit, for a `cli-`
  or `build-` test. `startProgram` leaves it running and returns a handle that stops it. Never build
  the program's command in the test.
- Run the lane with `bun run test:e2e`. The script that `rig init` writes calls `rig e2e`, which
  builds each program once, and the tests run the artifact. When you run an `e2e/` file with
  `bun test` on your machine, the helpers start the program from its source. In CI, the helpers
  throw when `rig e2e` didn't build the program, so CI never tests the source.

```ts
// packages/ledger/e2e/stop-on-signal.test.ts, in a made-up repo
import { startProgram } from '@zgeoff/rig/e2e';

test('it exits 0 on SIGTERM', async () => {
  const ledger = await startProgram('ledger', { ready: { url: '/health' } });

  expect(await ledger.stop('SIGTERM')).toBe(0);
});
```

### What an e2e test checks

Start each `e2e/` file name with the prefix of what it checks. Test anything else as a unit or
`integration/` test of the code it reaches. Guarantees, Supported versions and Journeys are rows of
the Facts table in the repo's project-testing skill, as the list below the table says.

| Prefix     | What the test checks                                                          | How many tests                                       |
| ---------- | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| `start-`   | the program starts and reports ready, or refuses a bad config                 | per program, 1 ready and 1 refused config            |
| `stop-`    | a signal or a shutdown command, then a clean exit                             | 1 per signal or shutdown command the program handles |
| `crash-`   | the program is killed mid-work, and the next start recovers                   | 1 per named fault point                              |
| `fault-`   | a service the program uses fails, and the program recovers when it comes back | 1 per named fault point                              |
| `cli-`     | a command's wiring: its exit code and output                                  | per command, 1 success and 1 failure                 |
| `build-`   | the artifact itself: it runs from a clean folder, with its assets             | 1 per artifact                                       |
| `runtime-` | a code path the unit run can't load, such as React Server Components          | 1 per such path                                      |
| `enforce-` | a guarantee that only the real environment enforces, such as a memory limit   | 1 per entry in Guarantees                            |
| `compat-`  | two versions meet, such as an older client and a newer server                 | 1 per entry in Supported versions                    |
| `journey-` | one core user journey, such as signing in, on its success path                | 1 per entry in Journeys                              |

- Give each `crash-` and `fault-` test its own named fault point: a point in the program's code,
  such as `queue.after-commit`, where the program stops or fails when a test asks it to. The program
  reads the request from an option that the test passes to `startProgram`, such as an environment
  variable. A `fault-` test makes the program's call to the service fail at its fault point, and
  leaves the real service running. Test a second case at the same point, with other input, in the
  test process, where [Where a test lives](../SKILL.md#where-a-test-lives) puts it: beside its
  module, or in `integration/`.
- List the entries of Journeys, Guarantees and Supported versions in the Facts table of the repo's
  project-testing skill. When the product gains a journey, a guarantee or a version it supports, add
  the entry and its test in one pull request. Never add an entry only to make room for a test.
- Test each other case of a journey, such as a wrong password, as a unit or `integration/` test.
- Test each argument and flag of a CLI through its real parser in a unit test, and keep the code
  that builds the CLI's commands importable for it. The `cli-` tests check only each command's
  wiring.

### Files and shared hosts

Give each `e2e/` test file, such as `e2e/journey-checkout.test.ts`, its own `setupTest` and cleanup.
Inside an `e2e/` test, you may chain acts, and assert after each one, because each act needs the
state that the act before it left. Outside `e2e/`, a test still has one act.

- To share a slow host or service, such as a VM or a database container, across the `e2e/` tests,
  start it in the `start` hook of the e2e lane in `rig.config.ts`, and stop it in the lane's `stop`
  hook. rig runs these hooks once per lane run, outside the test files. Pass the address that the
  tests need, such as a connection string, through an environment variable that the `start` hook
  sets. Never start it in the `[test] preload`. Every unit run loads that file too, and would start
  the host or service for nothing, or fail on a machine without it. Wire everything else in each
  file's own `setupTest`, as [setupTest](../SKILL.md#setuptest) says.
- Reset the shared host or service to its starting state from each file's `setupTest`. When the host
  or service has no reset, rebuild its state there, such as by recreating the database.
- Give the reset helper its own test file in `src/test-utils/`. Test that the reset reaches the
  starting state from what a test changed, from what a test left when it failed midway, and from
  what the test process left when it got a `SIGINT`.

## Real applications and transport

Test a client that the repo ships, such as a CLI or an SDK, against the real service from the same
repo. Give each test data that only it uses. Use a stand-in only for a host boundary that the
runtime can't run.

In the unit run, call the service in the test's process, as
[the cause table](./slow-tests.md#causes-and-fixes) says. When the client runs as a child process,
start the service on a real port, so the child reaches it, and put the test in `e2e/`.

For a remote HTTP service, use MSW, as in [Boundaries](../SKILL.md#boundaries). Write a stand-in
server on a real socket only when MSW can't intercept the call, such as:

- a call that checks a certificate, or goes through TLS or a tunnel;
- a call on a Unix socket whose options MSW drops;
- a request from a child process, a container or a VM.

Try MSW on the call first, with the version the repo installs. In a stand-in server, keep real
routing and serialization, back its state with a schema, and fail loudly on each call it doesn't
expect.

## Stateful stand-ins

When the repo starts a program in another process and drives it over its own protocol, such as a
worker, a language server or a sandboxed guest, test the host against a stateful stand-in of the
program:

- Send and accept the real messages over the real framing.
- Keep the state the program keeps, and answer from that state.
- In a test, shape the state through the stand-in's methods, and drive the host through its real
  code.
- Run the real program only in the program's own suite, so the host's tests start no process.

Write a stand-in with state, never one that each test scripts. With a scripted stand-in, each test
writes out the program's behaviour again, and the stand-in accepts a message the real program
refuses, so a host bug passes.

In this made-up example, a build host sends jobs to a worker process that keeps a cache of
checked-out repositories. When the host skips the checkout for a repository the worker evicted, the
stand-in refuses the build, as the real worker does:

```ts
test('it checks a repository out again after the worker evicts it', async () => {
  const ctx = await setupTest(); // the build host, wired to the stand-in worker

  await ctx.host.build({ repo: 'acme/api', ref: 'main' });

  ctx.worker.evict('acme/api');

  await ctx.host.build({ repo: 'acme/api', ref: 'main' });

  expect(ctx.worker.received.map((message) => message.type)).toStrictEqual([
    'checkout',
    'build',
    'checkout',
    'build',
  ]);
});
```

A scripted worker answers the second `build` with whatever its script holds, so a host that never
sends the second `checkout` still passes.

Keep the stand-in in `src/test-utils/` as `start-stub-<program>.ts`, with its own tests, as in
[Test data](../SKILL.md#test-data). In each of those tests, check one behaviour the stand-in copies
from the real program, such as the refusal for an evicted repository.

When the stand-in makes up a value, such as a fake hash or a fake signature, assert only its
properties: its shape, that the same input gives the same output, and that different inputs give
different outputs.

## Browser suites

Name a browser suite `<module>.browser.test.ts`, beside the module it tests, and run it in the
browser lane of [`@zgeoff/rig`](https://github.com/zgeoff/tools/tree/main/packages/rig) with
`bun run test:browser`. The lane's preload starts Chrome. In `setupTest`, open a view on that Chrome
with `new Bun.WebView({ backend: 'chrome' })`, and close the view in `onTestFinished`. To set up the
lane, its build and its memory cap, follow
[Setting up the browser lane](https://github.com/zgeoff/tools/blob/main/docs/guides/browser-lane.md).

Never run Playwright under `bun test`. Use Playwright only for an `e2e/` lane that needs Firefox,
WebKit on Linux or a live system, because `Bun.WebView` has no Firefox and runs WebKit only on
macOS.

### Page code

Send page code longer than one line through `runInPage(view, fn, arg, schema)` from `@zgeoff/rig`,
never as a string passed to `view.evaluate`. Write the page code as a real function in the test, so
the type checker and the linter check it.

- Pass the function everything it reads in `arg`. The function runs in the page and sees only its
  argument and the page's globals, so a test variable in its body passes the type check and throws a
  `ReferenceError` in the page.
- Parse the result with a zod schema, with no cast. The parse also fails a result that JSON can't
  carry, such as a `Blob`, which arrives as `{}`.
- Leave a one-line `view.evaluate` call as it is.

### Time and helpers

- Keep the browser lane's 10 s limit in every browser suite. Never give a browser test the disable
  comment for a test over its limit.
- When a browser test runs longer, find its cause in
  [the cause table](./slow-tests.md#causes-and-fixes). Move a build out of the test and into the
  lane's `build:browser` script. Replace a fixed wait with a wait for the element or the event.
  Split a test of a whole user flow into a test per component or page.
- Test navigation across the web app's routes in a browser suite.
- Give each browser helper of the repo's own, such as one that opens a view, its own test file.
- Keep every test that needs no page out of a browser suite, so it runs in the fast unit run.

## Native timers and scenario delays

Find which kind of timer your test waits on, then follow the rules under its heading.

### A timer the runtime or the kernel runs

- Set the timer, such as a server's idle timeout, through its real setting, to the shortest value
  that still behaves like the real one. When the runtime reads the setting only at start-up, start a
  child process for this test alone, with the setting.
- Check that the timer fires. Add a second test that stops whatever keeps the operation inside the
  timeout, such as a keep-alive ping, and checks that the timeout then ends the operation. A test
  that only sets a short value never sees the timer fire.
- Test the default value in its own test. Wait out the real default only when the runtime has no
  shorter setting that behaves the same. Wait for the timeout's event with `waitFor`, and keep the
  test in the unit run with the disable comment that the "A test over its limit" section of
  [Slow tests and lanes](./slow-tests.md) gives.

### A timer inside a library

- Pass the shortest duration the library accepts, and wait on an event you can see.
- When the timer ends a silent peer, such as a heartbeat timeout, add a second test that shows the
  same duration doesn't fire while the peer still answers.
- Use fake timers only when the library's timers don't interleave with real I/O.

### A deadline in a process the test spawns

When the repo's code sets a deadline in a process the test spawns, such as a crash harness's settle
window, read its length from an option of that code, or from a constant exported outside the test
file. Wait on a condition that the test checks or the process reports.

### A deadline in the test's own process

When the repo's code sets a deadline in the test's own process, including with a `setTimeout`, pass
the time in as an argument or an injected clock, in the order
[Time and waiting](../SKILL.md#time-and-waiting) gives.

### Delays in a scenario

You may use a real delay to set the rate of an end-to-end workload or the offset of a seeded fault.
Name the rate or the fault in a comment, and keep the seed. To claim that a fault lands in the
middle of an operation, assert the order of the operation's start, the fault and the operation's
end, from events the code emits. Check both the fault and the recovery. Use a fixed wait only when
the elapsed time is part of the contract.

## Property tests

You may assert in a loop over a list the module exports, such as a table of commands, to check that
each entry is complete, and await each case that fast-check generates in a loop.

Use fast-check when the combinations of generated inputs or of operation sequences matter. For a
fixed list of cases, use `test.each`. Await an async `fc.assert`, so a failed property fails the
test.

Inside the property runner and the function that applies each generated operation, you may loop over
operations, branch on the expected outcome, and check invariants after each operation. Every other
test still follows the testing skill's rules on loops, branches and one act per test.

- Check the transitions that matter, as well as the final state. Let an unexpected error fail the
  property. Never catch it in a branch for an expected outcome.
- Derive invariants from an independent contract or a simpler model, never from a copy of the
  production algorithm.
- Start each generated case from clean state, and release its resources before the next case. Get
  them from a tested helper that cleans up inside the case, on success and on failure.
  `onTestFinished` runs once, after the whole Bun test, so it can't keep the generated cases apart.
- When a property fails, fast-check prints the seed, the path and the shrunk counterexample. Replay
  the failure by passing that `seed` and `path` to `fc.assert`. When the counterexample shows
  behaviour the suite must keep, add a fixed test with it.
- Never cut generated cases to make a suite faster. Fix the cause from
  [the cause table](./slow-tests.md#causes-and-fixes).

## Evaluation suites

Give each evaluation its own folder, `evals/<name>/`, in the package whose code it scores, with
these files:

| File                 | What it holds or does                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `corpus.json`        | the committed cases or recorded traffic                                                  |
| `report.json`        | the committed results of the last scoring run                                            |
| `<name>.test.ts`     | the test, in the unit run, under the 5 s limit                                           |
| `run-<name>-eval.ts` | scores the code, such as a model's answers, and writes `report.json`; `rig eval` runs it |

When the scoring runs offline, make the test replay the corpus through the production path and
compare the result with `report.json`. When the scoring needs a live model, the test can't replay
it: make the test build the parts of the report that the code decides, and compare those. A test
that passes on a stale report checks nothing.

- Read the committed corpus or report through one tested loader. Never copy its cases into the test
  as literals.
- Keep an evaluation's helpers in `src/test-utils/`. Put measurement code that several packages use,
  such as a confidence interval or a report writer, in a package of its own that exports it.
- Use a stand-in only for what a recording can't reproduce, such as the disk or the code host's API,
  and inject it into the production path.
- Keep a test that calls a live API out of `evals/`, such as a test that pins how a model SDK
  behaves. Give it the `.model-api` suffix, beside its module or in `integration/`, as
  [Lanes](./slow-tests.md#lanes) describes.

## Benchmarks

- Put a benchmark of one module beside it, as `src/<module>.bench.ts`.
- Put a benchmark of a running program in `bench/<name>.bench.ts` of the package that builds the
  program, and start the program with `startProgram`. Keep only these entry files in `bench/`. Put
  their logic, with its tests, in `src/test-utils/`.
- Export each benchmark with `defineBench` from `@zgeoff/rig/bench`, with a budget for each number
  it records. Run benchmarks with `rig bench`, never in a test run. It builds each program once,
  runs the `start` hook of the lane that `bench.lane` in `rig.config.ts` names, so the benchmarks
  get that lane's shared services, and fails when a number breaks its budget.

```ts
// packages/ledger/bench/import-statement.bench.ts, in a made-up repo
import { defineBench, startProgram } from '@zgeoff/rig/bench';
import { timeImport } from '../src/test-utils/time-import.ts';

export default defineBench({
  budget: { importMs: { max: 800 } },
  run: async () => {
    const ledger = await startProgram('ledger');

    return { importMs: await timeImport(ledger, 'statement.csv') };
  },
});
```

## Golden tests

Use only inline snapshots, never of a component, and only for machine output that no person works
out, such as generated SQL. Check a hand-written value, such as a spec test vector, with an explicit
matcher.

For any pipeline whose output depends only on its input, write a golden test and a determinism test,
beside the pipeline's module:

- In each golden test, write one input by hand as a literal, and pin the full output in an inline
  snapshot. Never build the input with a factory call. A change to the factory would change the
  input, and updating the snapshot would hide that.
- When the output is a file the repo commits, such as an OpenAPI document, compare the output with
  that file in place of an inline snapshot.
- In the determinism test, assert that the same input gives equal outputs:
  `expect(run(input)).toStrictEqual(run(input))`.

## Program-fixed paths and global resources

When a kernel or a program fixes a path, such as a certificate trust directory, procfs or a VM mount
point, name the program or the spec that fixes it in a comment.

- Put the path inside something the test created, such as a temp directory, a mount namespace or a
  container. Check that the path is inside it before you write there. When you can't check that, use
  a VM or a container that only this run uses.
- Create each test's own files and records in that test, and clean them up.
- Give a resource that the whole machine shares a name that sets this run apart, the way `mkdtemp`
  does.
- Before you overwrite, truncate, mount or delete a resource, check that this run created it, such
  as from a list the run keeps of what it made. A generated name alone proves nothing.
- Register cleanup right after you acquire a resource, and release only what this run acquired. Make
  the cleanup safe to run after a partial failure, an interrupt, or a shutdown that already released
  the resource.

## Rust lanes

Run a Rust crate's lanes through cargo-nextest, with the limits in [Lanes](./slow-tests.md#lanes).
Mark a lane with a test path prefix, such as `e2e::` or `host::`, as a folder or a file suffix does
for Bun. Define the lanes in the repo's `.config/nextest.toml`, as in this made-up example:

```toml
[profile.default]
slow-timeout = { period = "5s", terminate-after = 1 }
default-filter = "not (test(/^e2e::/) | test(/^host::/))"

[profile.e2e]
default-filter = "test(/^e2e::/)"
slow-timeout = { period = "15s", terminate-after = 1 }

# 48 s on CI, OPS-212
[[profile.e2e.overrides]]
filter = "test(=e2e::restores_a_volume_from_its_oldest_snapshot)"
slow-timeout = { period = "60s", terminate-after = 1 }
```

- Run the unit tests with the default profile. Its `slow-timeout` ends a test at the 5 s limit, and
  its `default-filter` leaves out every lane prefix.
- Give each lane one profile, with the lane's prefix in `default-filter` and the lane's limit in
  `slow-timeout`. A profile takes every setting it doesn't set from `default`. Run the lane with
  `cargo nextest run --profile <lane>`.
- Give a test over its limit an override in its profile, with a comment that gives the time it takes
  on CI and a ticket, or `floor:` and its evidence, as the "A test over its limit" section of
  [Slow tests and lanes](./slow-tests.md) says.
- Never mark a lane test with `#[ignore]`. nextest runs an ignored test only with `--run-ignored`,
  which no lane's command passes, so the test stops running and no one sees.
