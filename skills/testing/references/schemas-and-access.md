# Schemas and access rules

A schema test passes for the wrong reason when a factory fills the payload or the test checks only
that parsing failed. An access test passes for the wrong reason when it checks only the caller the
rule allows.

## Schemas and parsers

The examples use a schema whose `safeParse` returns `{ success, data, error }`, such as a Zod
schema. Map them onto the result shape of your parser.

- Write each payload as a literal in the test. A factory's defaults hide which field the test
  checks.
- Build each rejected payload from the valid literal, with one field changed. Then the one changed
  field is the only reason it can fail.
- Assert a rejection's issue path:
  `expect(result.error?.issues).toPartiallyContain({ path: ['title'] })`. Never assert `issues[0]`,
  because the order of the issues changes with the schema. Never assert a bare `success: false`,
  because it passes for any rejection.
- Assert an accepted payload's `result.data` with `toStrictEqual` against a literal of the output
  you expect. Then a trim, a coercion or a default shows in the test.

## Access rules

- Test that the allowed caller succeeds.
- Test that another caller is refused, and name that caller in the test title:
  `it rejects a note owned by another user`. Assert the refusal at the strictness the contract
  needs, as [Errors](../SKILL.md#errors) says.
- When a read returns nothing for a record the caller may not see, assert that empty result, such as
  `toBeNull()`.
