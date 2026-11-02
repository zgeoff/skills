# Boundaries

Replace a boundary, never the code inside it. When code is hard to test without a stand-in, make it
take its I/O from its caller, and test the core with values.

## The stand-in for each boundary

| Boundary                                        | The test uses                                                  |
| ----------------------------------------------- | -------------------------------------------------------------- |
| A CLI                                           | The real binary, spawned                                       |
| A shell script                                  | The real script, through Bun's `$` ([Shell](./shell.md))       |
| The filesystem                                  | A real `mkdtemp` tree per test                                 |
| A database                                      | The real engine, isolated per test ([Database](./database.md)) |
| A remote HTTP or RPC service                    | MSW handlers ([HTTP mocking](./http.md))                       |
| A service with a cheap container                | The real service in a container                                |
| An SDK that sends command objects               | A stand-in for its send call                                   |
| A program the repo drives over its own protocol | A stateful stand-in ([System tests](./system-tests.md))        |

When a test needs a container, probe for Docker at module level, such as
`const hasDocker = await probeDocker()`, and read the value only in `skipIf`. Add a comment that
says `skipIf` needs the value before the test runs, so `setupTest()` can't make it.

## Failure branches

Reach a failure branch with a real failure: an address where nothing listens, an MSW handler that
returns the error, or a conflicting row. When nothing real reaches a branch, inject that dependency.

In a test of how code recovers after several calls fail, capture each failed call's rejection as a
value, `.then(() => null, (error: unknown) => error)`, and assert each one beside the final state.

## Module mocks

Never call `mock.module` in a test file. It leaks into every later file in the worker. When you want
to mock a module because of what it imports, fix the import graph.

Put a module mock in a preload, `register-<module>-mock.ts`, only when it is one of these:

- a stand-in for what the runtime can't host, such as WebGL, that reads from a stub store one
  exported setter changes;
- a wrapper that a library documents for testing, which keeps the real behaviour and adds one hook.

## Stand-in files

Put each stand-in in `test-utils/`, and name it for what it does:

- `start-stub-<thing>.ts` starts something long-running;
- `create-stub-<thing>.ts` creates a resource;
- `run-stub-<thing>.ts` is an executable script;
- `build-stub-<thing>.ts` is for the rest.

In a stand-in's own tests, check each thing it assumes about the real program, such as the shape of
a real response.
