# Seeding

A seed puts stored state in place for a test by calling the owner's own writes. The owner is the
module whose code writes those rows or files. Because every test outside the owner seeds through the
owner, a schema or layout change breaks only the owner and its tests.

The traps:

- **A seed that branches on a state.** It copies the owner's state machine, and it drifts the day
  the owner changes. Write one seed per state, each a straight line.
- **A bundle seed.** `seedUserWithTwoNotes` hides the scenario. The test composes `user` and `note`
  itself.
- **A direct write because the owner's writer isn't exported.** Export it from the owner. A missing
  export, an awkward import or the cost of a call never justifies a direct write.

## Contents

- [The seeds an owner publishes](#the-seeds-an-owner-publishes)
- [Writing a seed](#writing-a-seed)
- [Publishing seeds](#publishing-seeds)
- [`buildSeed` and `setupTest`](#buildseed-and-setuptest)
- [Two databases and two hosts](#two-databases-and-two-hosts)
- [What the test keeps visible](#what-the-test-keeps-visible)
- [Table-driven tests](#table-driven-tests)
- [A state the owner can't make](#a-state-the-owner-cant-make)
- [Protocol states](#protocol-states)
- [A seed's own test](#a-seeds-own-test)
- [The lint rules](#the-lint-rules)

## The seeds an owner publishes

- One seed per concept the owner stores, such as `seedNote`.
- One more per value of the owner's own state type. For a `NoteStatus` of `'draft' | 'archived'`,
  that is `seedNote` (the first state) and `seedArchivedNote`. The type fixes the set, so nobody
  decides when a variant is worth adding.
- A concept with no state type gets only its base seed.
- Every other difference is input: a partial of the concept's fields, timestamps included.

Never add a seed for a bundle of concepts, a seed with a `state` argument, or a seed named for a
path (`to: 'archived'`). Each copies a decision the owner already makes.

## Writing a seed

A seed is a `seed<State?><Concept>` function in a `seed-<state?>-<concept>.ts` file in the owner's
test utils. `seed` is the verb for stored state put in place for a test: it may do I/O, and it
appears only in test code.

- It takes the owner's deps and a partial input, and returns the owner's type for that state.
- It builds its input with the concept's `build` factory, so defaults live in one place.
- It calls the owner's writes in a straight line, with no branch on a state.
- A state variant calls the base seed, then the owner's transition.
- It checks the postconditions it promises with `invariant()`, because an owner write can act on a
  different record than the one asked for, such as a claim that takes whichever task is due.
- It takes time from the deps' clock, and timestamps as input, never from `Date.now()`.

```ts
// seed-note.ts
export async function seedNote(deps: NotesDeps, input: Partial<NewNote> = {}): Promise<Note> {
  const note = await createNote(deps.db, buildMockNewNote(input), deps.clock.now());

  invariant(note.status === 'draft');

  return note;
}

// seed-archived-note.ts
export async function seedArchivedNote(
  deps: NotesDeps,
  input: Partial<NewNote> = {},
): Promise<ArchivedNote> {
  const note = await seedNote(deps, input);

  return archiveNote(deps.db, note.id, deps.clock.now());
}
```

## Publishing seeds

The owner exports its seeds from its `test-utils` entry, with one builder that binds them to deps:

```ts
export const buildNoteSeeds = (deps: NotesDeps) => ({
  note: (input?: Partial<NewNote>) => seedNote(deps, input),
  archivedNote: (input?: Partial<NewNote>) => seedArchivedNote(deps, input),
});
```

The key drops the `seed` prefix, so a test reads `ctx.seed.archivedNote(…)`. When a seed needs a
writer the owner keeps private, the owner exports it. When the writer is tangled with other work,
extract the complete writer in the owner and call it from both places.

## `buildSeed` and `setupTest`

Each package that seeds has one `buildSeed(deps)` in its test utils. It spreads the builders of
every owner its deps can serve:

```ts
export const buildSeed = (deps: TestDeps) => ({
  ...buildNoteSeeds(deps),
  ...buildAttachmentSeeds(deps),
});
```

TypeScript fails when a builder needs a dep that `TestDeps` lacks. Every `setupTest()` in the
package returns `seed: buildSeed(deps)`. Binding the seeds is wiring: `setupTest()` still creates no
data, and each test calls the seeds it needs.

## Two databases and two hosts

- **Two databases** widen `TestDeps`. Each builder takes the part it needs, such as
  `buildAuditSeeds({ db: deps.auditDB, clock: deps.clock })`. The test still sees one `ctx.seed`.
- **Two hosts**, such as a source and a target in a sync test, each get their own deps and seeds:
  `ctx.source.seed.note(…)` and `ctx.target.seed.note(…)`.

## What the test keeps visible

A seed puts state in place. The test keeps these in its own body:

- the behaviour under test, as a real call through the unit's entry;
- each clock move;
- side effects on other records, such as a stop that cancels the open actions, or a verify that
  deletes the user's other sessions. Assert them in the test, never inside a seed.

An earlier act the test depends on stays a real call in the arrange phase when that act is what the
test is about. When it only gets the record into a state, use the seed.

## Table-driven tests

A matrix over states passes the seed functions as case data. No dispatcher maps a label to a seed:

```ts
test.each([
  ['draft', seedNote],
  ['archived', seedArchivedNote],
])('it lists a %s note in search results', async (_label, seed) => {
  const ctx = await setupTest();
  const note = await seed(ctx, { title: 'Groceries' });

  expect(await ctx.client.searchNotes({ query: 'Groceries' })).toPartiallyContain({ id: note.id });
});
```

## A state the owner can't make

Some states no owner code produces, such as a row written by an older version, or a record another
tenant owns whose writer the test can't reach. Write those directly, only inside a seed, with a `//`
comment that names the exact state:

```ts
export async function seedLegacyNote(deps: NotesDeps, input: Partial<NewNote> = {}) {
  // A note from before the title column was required: createNote refuses a missing title.
  return deps.db
    .insertInto('notes')
    .values({ ...buildMockNoteRow(input), title: null })
    .returningAll()
    .executeTakeFirstOrThrow();
}
```

A comment that can't name the state means the seed calls the owner instead.

## Protocol states

A state that spans hosts or interrupts an operation, such as a commit lost between two hosts or a
reset stopped halfway, never comes from a seed. Run the real protocol, and stop it at the step under
test with a fault stub at the boundary.

## A seed's own test

Each `seed-*.ts` file has a test beside it. It is one of the three kinds of test that check stored
state directly: it asserts the rows and files the seed writes, and that input overrides apply. Use
`toMatchObject` on a row, because the database computes some of its fields.

## The lint rules

`@zgeoff/oxlint-config` checks the mechanical parts:

- **`zgeoff/seed-only`** fails a database write in a test file: `insertInto`, `updateTable`,
  `deleteFrom`, or raw `INSERT`, `UPDATE` or `DELETE`. It allows a write inside a `seed*` function
  in test utils, in the owner's own tests, and in a migration test or a test of code whose product
  is SQL or storage. The owner's tests are those in a folder whose non-test files write the same
  table. A table name that isn't a string literal fails.
- **`zgeoff/function-verb`** allows the `seed` verb only in test utils.
- **Pairing** fails a `seed-*.ts` file with no test beside it.

The rules ship as errors. A repo that still seeds by direct writes disables them in its root oxlint
config, with its rollout ticket as the reason, and its rollout turns them on.
