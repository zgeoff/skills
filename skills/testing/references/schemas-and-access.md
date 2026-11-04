# Schemas and access rules

A schema test passes for the wrong reason when a factory fills the payload or the test checks only
that parsing failed. An access test passes for the wrong reason when it checks only the caller the
rule allows.

## Schemas and parsers

Test through the parser's form that returns a result, such as Zod's `safeParse`, in place of the
form that throws, such as `parse`. The result holds every issue, so the test can assert the issue
path and the output. The examples use Zod's `{ success, data, error }`. Map them onto the result
shape of your parser.

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

- Test that each kind of caller the rule allows succeeds, such as a team editor and an admin.
- Write one test for each condition the rule checks. Give it a caller who fails that condition and
  passes every other one, so the test fails when someone deletes that check. Name the caller in the
  title, such as `it rejects an editor of another team`.
- Assert each refusal at the strictness the contract needs. For a thrown error, follow
  [Errors](../SKILL.md#errors). For a returned refusal, assert its code or status, such as
  `toBe(403)`.
- When the rule hides a record from a read, assert the refused caller's empty result, such as
  `toBeNull()` or `toStrictEqual([])`.
