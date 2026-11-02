# Boundaries

Replace the boundary a package talks to, such as the HTTP server, the database or the SDK client,
with a stand-in. Never replace code inside the package, such as `fetch`, an HTTP client or the
unit's own services, and never spy on a real method to make it fail. A `mock.module` call in a test
file leaks into every later file in the worker, so a module mock goes only in the test preload, as
[Module mocks](#module-mocks) says.

When code is hard to test without a stand-in, change the code so its caller passes in the I/O, such
as the client or the file reader. Then test the rest of the code with plain inputs.

## The stand-in for each boundary

| Boundary                                                   | The test uses                                                  |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| A CLI the code runs, its own or another, such as `git`     | The real binary, spawned                                       |
| A shell script                                             | The real script, through Bun's `$` ([Shell](./shell.md))       |
| The filesystem                                             | A real `mkdtemp` tree per test                                 |
| A database                                                 | The real engine, isolated per test ([Database](./database.md)) |
| A remote HTTP or RPC service                               | MSW handlers ([HTTP mocking](./http.md))                       |
| A service that runs in a container, such as Redis          | The real service in a container                                |
| An SDK client that sends command objects, such as AWS SDKs | A stand-in `send`, passed in where the code takes the client   |
| A program the repo drives over a protocol the repo defines | A stateful stand-in ([System tests](./system-tests.md))        |

When a test needs a container, probe for Docker at module level, such as
`const hasDocker = await probeDocker()`, and read the value only in `skipIf`. Search `test-utils/`
for a probe before you write one. Add a comment that `skipIf` reads the value before the test runs,
so `setupTest()` can't compute it.

## Failure branches

Reach a failure branch with a real failure: an address where nothing listens, an MSW handler that
returns the error, or a conflicting row. When no real failure reaches the branch, pass the code a
stand-in that throws, through the parameter that already takes that dependency.

To test how code recovers after several calls fail, turn each call's rejection into a value with
`.then(() => null, (error: unknown) => error)`. Then assert the list of errors and the final state
in the same test. A rejection left as a rejection stops the test at the first failed call.

## Module mocks

When you want to mock a module because of what it imports, move that import's side effect out of the
module, or pass the dependency in.

Put a module mock in its own file, `register-<module>-mock.ts`, that the test preload loads. Write
one only for these:

- an API the runtime lacks, such as WebGL, whose answers a test sets through one exported setter;
- a test wrapper that the library's own docs give, such as the zustand mock that resets each store
  after a test.

## Stand-in files

Put each stand-in in `test-utils/`, and name the file for what it does:

- `start-stub-<thing>.ts` starts a process or a server that keeps running;
- `create-stub-<thing>.ts` creates a resource on disk or in a service;
- `run-stub-<thing>.ts` is an executable script;
- `build-stub-<thing>.ts` returns a value, such as a stand-in `send`.

In a stand-in's own tests, check each thing it assumes about the real program against a response
recorded from that program.
