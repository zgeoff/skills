# Matchers

Pick a matcher by the kind of value it checks. The jest-extended matchers reach Bun through the
`@zgeoff/bun-test-extended` package. When the package isn't set up yet:

- When a matcher throws `TypeError` at run time, put the package at the start of the `preload` array
  of `bunfig.toml`.
- When `tsc` reports a matcher as unknown, add the package to `compilerOptions.types` in
  `tsconfig.json`.

| Value             | Matchers                                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Array             | `toIncludeAllMembers`, `toIncludeSameMembers`, `toIncludeAllPartialMembers`, `toPartiallyContain`, `toSatisfyAll` |
| Object            | `toContainEntry`, `toContainEntries`, `toContainAllKeys`, `toBeFrozen`                                            |
| String            | `toStartWith`, `toEndWith`, `toInclude`, `toEqualCaseInsensitive`, `toEqualIgnoringWhitespace`                    |
| Number            | `toBeWithin`                                                                                                      |
| Any value         | `toBeNil`, `toBeOneOf`, `toSatisfy`, `toBeEmpty`                                                                  |
| Date              | `toBeAfter`, `toBeBefore`, `toBeBetween`, `toBeValidDate`                                                         |
| Mock              | `toHaveBeenCalledOnce`, `toHaveBeenCalledExactlyOnceWith`, `toHaveBeenCalledBefore`, `toHaveBeenCalledAfter`      |
| Error and promise | `toThrowWithMessage`, `toResolve`, `toReject`                                                                     |

- Write Bun's own `.rejects` and `.resolves` without `await`. Bun settles the promise inside the
  matcher, so an `await` adds nothing.
- Always `await` the package's `toResolve()` and `toReject()`. Each returns a promise. When the test
  doesn't await that promise, the test ends before the check runs.
- When the promise waits on a Worker, use none of `.rejects`, `.resolves`, `toResolve()` and
  `toReject()`. Follow [A promise that waits on a Worker](#a-promise-that-waits-on-a-worker).
- For a field the test doesn't decide, put an asymmetric matcher in the value you pass to
  `toStrictEqual`, such as `status: expect.toBeOneOf(['open', 'held'])`.
- Pass `toPartiallyContain` an object, and `toIncludeAllPartialMembers` an array of objects. When
  you pass `expect.toStartWith('a')` in place of the object, either matcher matches any non-empty
  array. To find an element by a matcher, use `toContainEqual(expect.toStartWith('a'))`.

## A promise that waits on a Worker

Pass each promise that waits on a message from a Worker to `Promise.allSettled`, and assert on the
result. Assert a rejection's code with `toMatchObject`:

```ts
const [started] = await Promise.allSettled([startIndexer(ctx.worker)]);

expect(started).toMatchObject({ status: 'rejected', reason: { code: 'INDEX_UNREADABLE' } });
```

Assert a resolved value with `toStrictEqual`, such as
`toStrictEqual({ status: 'fulfilled', value: { entries: 3 } })`.

Once the Worker has answered one message, `.rejects`, `.resolves`, `toReject()` and `toResolve()`
miss its next one, and the test hangs, with or without `await`. A test whose Worker answers nothing
first can pass, then hang when a change to `setupTest()` sends the Worker a message. The hang shows
with a Worker from `new Worker()` and with one from `node:worker_threads`.

Keep `.rejects` for a promise that waits on a file read, a `fetch` or a subprocess. It settles
those.
