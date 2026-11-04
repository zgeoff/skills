# Schemas and access rules

A schema test passes for the wrong reason when a factory fills the payload or the test checks only
that parsing failed. An access test passes for the wrong reason when it checks only the caller the
rule allows.

## Schemas and parsers

The examples use a schema whose `safeParse` returns `{ success, data, error }`, such as a Zod
schema. Test through a parser's non-throwing form, such as `safeParse` in place of `parse`. Map the
examples onto the result shape of your parser.

- Write each payload as a literal in the test. With a factory's defaults, the reader can't see which
  field the test checks.
- Build each rejected payload from the valid literal, with one field changed or removed. Then that
  one field is the only reason the payload can fail.
- Assert a rejection's issue path:
  `expect(result.error?.issues).toPartiallyContain({ path: ['title'] })`. Never assert `issues[0]`,
  because the order of the issues changes with the schema. Never assert a bare `success: false`,
  because it passes for any rejection.
- Assert an accepted payload's `result.data` with `toStrictEqual` against a literal of the output
  you expect. Then a trim, a coercion or a default shows in the test.

## Access rules

- Test that the allowed caller succeeds.
- Write one test for each condition the rule checks, with a caller who fails that condition:
  `it rejects a caller who isn't signed in`, `it rejects an editor of another team`.
- Assert each refusal at the strictness the contract needs. For a thrown error, follow
  [Errors](../SKILL.md#errors). For a returned refusal, assert its code or status, such as
  `toBe(403)`.
- When the rule hides a record from a read, assert the refused caller's empty result, such as
  `toBeNull()` or `toStrictEqual([])`.
