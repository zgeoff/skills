# Kinds of code

These rules add to the [testing skill](../SKILL.md) for a schema, a parser or an access rule.

## Schemas and parsers

- Feed inline literal payloads, never a factory's. Build each rejected payload from the valid
  literal with one field changed.
- Assert a rejection's issue path with `toPartiallyContain({ path: ['title'] })`, never `issues[0]`
  or a bare `success: false`. Assert an accepted payload's `result.data` with `toStrictEqual`.

## Access rules

- Test that the allowed caller succeeds, and that another caller is refused, named in its title:
  `it rejects a note owned by another user`.
- When a read hides a record, assert the hidden result, such as `toBeNull()`.
