# State, waiting and file locks

## State

- When a status is saved outside the process or sent to another process, write a transition table
  for it: its states, the moves allowed between them, and one function that checks a move. Keep all
  three in the only module that writes the status.
- Build a long-lived object whose states live only in memory, such as a reconnecting client, as an
  xstate machine.

## Waiting

- Sleep with `Bun.sleep` in Bun-only code, and with `setTimeout` from `node:timers/promises` in code
  that ships to Node.
- Wait for one event with `events.once`. When code outside the promise's executor settles the
  promise, make it with `Promise.withResolvers()`.
- Write `new Promise` by hand only when none of these fits.

## File locks

- Lock a file across processes only with `withFileLock` from `@zgeoff/std/with-file-lock`, imported
  directly in the thin function that [Structure](../SKILL.md#structure) describes. Read, decide and
  write in its callback, so the lock spans all three. Write your own lock only for a need it can't
  meet, such as a lock readers share, and name the need in a comment.
