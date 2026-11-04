# Matchers

Pick a matcher by the kind of value it checks. The jest-extended matchers reach Bun through the
`@zgeoff/bun-test-extended` package. When one fails to load:

- When a matcher throws `TypeError` at run time, list the package first in the `preload` array of
  `bunfig.toml`.
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

- Write `.rejects` and `.resolves` without `await`. They are Bun's own, and Bun settles them inside
  the matcher.
- Always `await` `toResolve()` and `toReject()`. They come from the package and return a promise,
  and a test that doesn't await it ends before the check runs.
- Use a value matcher as a field of the expected value in `toStrictEqual`:
  `status: expect.toBeOneOf(['open', 'held'])`.
- Pass plain objects to `toPartiallyContain` and `toIncludeAllPartialMembers`. Given a matcher on
  its own, such as `expect.toStartWith('a')`, either call matches any non-empty array. To find an
  element by a matcher, use `toContainEqual(expect.toStartWith('a'))`.
