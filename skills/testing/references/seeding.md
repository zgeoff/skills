# Seeding

A seed puts stored state in place for a test by calling the code that owns that state. The owner is
the module whose code writes those rows or files. A concept is one kind of record the owner stores,
such as a note. The owner's test utils are the folder of test helpers its package exports for other
packages' tests, such as `src/test-utils/` exported as `<package>/test-utils`. When every test
outside the owner seeds through it, a schema or layout change breaks only the owner and its tests.

Write seeds this way even in a repo whose older tests still call `insertInto`. When you change code,
move that code's tests onto seeds; leave other tests as they are.

The traps:

- **A seed that branches on a state.** The branch copies the owner's state machine, and the copy
  goes wrong when the owner changes. Write one seed per state, each a straight line of calls.
- **A seed for a bundle of records,** such as `seedUserWithTwoNotes`. It hides the scenario. Call
  `user` and `note` in the test instead, and pass the user's id into the note's input.
- **A direct write because the owner's writer isn't exported.** Export the writer from the owner. An
  unexported writer, an awkward import or a slow call is never a reason to write directly.

- [The seeds an owner publishes](#the-seeds-an-owner-publishes)
- [Writing a seed](#writing-a-seed)
- [Publishing seeds](#publishing-seeds)
- [`buildSeeder` and `setupTest`](#buildseeder-and-setuptest)
- [What the test keeps visible](#what-the-test-keeps-visible)
- [Table-driven tests](#table-driven-tests)
- [A state no owner code makes](#a-state-no-owner-code-makes)
- [Interrupted operations](#interrupted-operations)
- [A seed's own test](#a-seeds-own-test)
- [The lint rules](#the-lint-rules)

## The seeds an owner publishes

Take the owner's state type, such as `type NoteStatus = 'draft' | 'archived'`.

- The base seed, `seedNote`, makes the record in the state the owner's create call gives it, here
  `draft`.
- Each other value of the state type gets one more seed, here `seedArchivedNote`.
- A concept with no state type gets only its base seed. When the owner has a status column but no
  union type, each value of the column is a state.
- Every other difference, such as a title or a timestamp, is input to a seed, never a new seed.

So the state type fixes the list, and you never decide whether a variant is worth adding. Never
write a seed that takes the state as an argument, such as `seedNote(deps, { status: 'archived' })`.
Its branches copy the owner's transitions.

## Writing a seed

Put each seed in its own file in the owner's test utils: `seed-note.ts` exports `seedNote`, and
`seed-archived-note.ts` exports `seedArchivedNote`.

A seed takes two arguments:

- the owner's deps, the handles its code already takes, such as `{ db, clock }`;
- a partial of the owner's input type, built into a full input by the type's `buildMock<Type>`
  factory. Write the factory first when it's missing, as the testing skill's
  [Test data](../SKILL.md#test-data) section says.

Inside, it calls the owner's writes in a straight line:

- The base seed calls the owner's create.
- A variant calls the seed of the state just before it, then the owner's transition. For draft,
  published, archived, `seedArchivedNote` calls `seedPublishedNote`, then `archiveNote`.
- When the owner's write returns a wider type than the seed promises, the seed narrows it with
  `invariant()` from `tiny-invariant`. An owner write can act on a different record than the one you
  meant, such as a write that takes the oldest note in a queue, and the `invariant()` call catches
  that.
- The time comes from `deps.clock`. A test that needs a fixed timestamp passes it in the input when
  the owner's input type has the field, and otherwise moves the clock before it calls the seed.

```ts
// seed-note.ts
export async function seedNote(deps: NotesDeps, input: Partial<NewNote> = {}): Promise<DraftNote> {
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

`archiveNote` already returns `ArchivedNote`, so the variant needs no `invariant()`.

When a seed needs a writer the owner keeps private, export that writer from the owner. When the
writer is buried inside a larger function, such as a request handler, move it into its own function
in the owner, and call it from both the handler and the seed.

## Publishing seeds

The owner's test utils export each seed and one builder for the owner, named for it, that binds the
seeds to deps:

```ts
export const buildNoteSeeds = (deps: NotesDeps) => ({
  note: (input?: Partial<NewNote>) => seedNote(deps, input),
  archivedNote: (input?: Partial<NewNote>) => seedArchivedNote(deps, input),
});
```

Each key is the seed's name without `seed`, so a test calls `ctx.seed.archivedNote(…)`. One owner
stores each concept, so two owners never publish the same key.

## `buildSeeder` and `setupTest`

Each package that seeds has one `buildSeeder(deps)` in `build-seeder.ts` in its test utils. It
builds the seeder, the object of bound seeds a test reaches as `ctx.seed`. It spreads the builder of
each owner whose state the package's tests need, and needs no test of its own, because TypeScript
checks it:

```ts
export const buildSeeder = (deps: TestDeps) => ({
  ...buildNoteSeeds(deps),
  ...buildAttachmentSeeds(deps),
});
```

`TestDeps` is the type of the deps the package's `setupTest()` wires. When a builder needs a handle
that `TestDeps` lacks, TypeScript fails, so add the handle to the wiring.

Every `setupTest()` in the package returns `seed: buildSeeder(deps)` beside the deps, so `ctx` holds
both. Binding the seeds is wiring: `setupTest()` still creates no data.

- **A test with two databases** puts both handles in `TestDeps`. Each builder takes the part it
  needs, such as `buildAuditSeeds({ db: deps.auditDB, clock: deps.clock })`, and the test still
  calls one `ctx.seed`.
- **A test with two hosts,** such as a sync test with a source and a target, calls `buildSeeder`
  once for each host's deps: `source: { ...sourceDeps, seed: buildSeeder(sourceDeps) }`. The test
  then calls `ctx.source.seed.note(…)` and `ctx.target.seed.note(…)`.

## What the test keeps visible

A seed only puts state in place. Keep these in the test body, where the reader sees them:

- the behaviour under test, as a real call through the unit's entry;
- each clock move;
- each effect on another record, such as stopping a job that also cancels the job's open tasks.
  Assert it in the test, never inside a seed.

When the test is about the first of two calls, both calls stay real. For example, a test of what
archiving does to a note's search entry archives the note with a real call, not with
`seedArchivedNote`. Use a seed when the test only needs the record to be in a state.

## Table-driven tests

A test over several states puts the unbound seed functions in its rows, and calls each with `ctx`,
which spreads the deps. In a test with two databases, pass the deps the owner's seeds take in place
of `ctx`. Never look a seed up by its label in a map you build: put the function in the row.

```ts
test.each([
  ['draft', seedNote],
  ['archived', seedArchivedNote],
])('it finds a %s note by its title', async (_label, seed) => {
  const ctx = await setupTest();
  const note = await seed(ctx, { title: 'Groceries' });

  expect(await ctx.service.searchNotes({ query: 'Groceries' })).toPartiallyContain({ id: note.id });
});
```

## A state no owner code makes

Some states no code in the repo produces today, such as a row an older version wrote before a column
became required. Write such a row directly, only inside a seed, with a `//` comment that names the
exact state. Each such state gets its own seed, published in the owner's builder beside the others,
and these are the only seeds beyond the state type's list.

```ts
export async function seedNoteWithoutTitle(deps: NotesDeps, input: Partial<NoteRow> = {}) {
  // A note from before titles were required: createNote now refuses a missing title.
  return deps.db
    .insertInto('notes')
    .values({ ...buildMockNoteRow(input), title: null })
    .returningAll()
    .executeTakeFirstOrThrow();
}
```

`buildMockNoteRow` builds the table's insert shape, where `buildMockNewNote` builds the owner's
input. If you can't name the exact state, call the owner.

## Interrupted operations

A state that spans two hosts, or that an operation leaves when it stops partway, never comes from a
seed. Examples are a commit that one host sent and the other never got, or a reset that stopped
halfway. Run the real operation, and make it fail at the step under test with a stand-in at the
boundary, such as a transport that rejects the second call.

## A seed's own test

Each `seed-<name>.ts` file has a `seed-<name>.test.ts` beside it. It asserts the rows and files the
seed writes, and that input overrides apply. Use `toMatchObject` on a row, because the database
computes some of its fields.

A seed's test sits in the owner, so it reads stored state directly like any other test of the owner.
It needs its test even in a repo that has the lint rules turned off.

## The lint rules

`@zgeoff/oxlint-config` checks the mechanical parts of this reference:

- `zgeoff/seed-only` fails a database write in a test file anywhere except a seed, the owner's own
  tests, a migration test, and a test of code whose product is SQL or storage. The owner's own tests
  may write directly, but use a seed when one makes the state.
- `zgeoff/function-verb` allows the `seed` verb only in test utils.
- The config also fails a `seed-<name>.ts` file with no test beside it.

A repo whose tests still write directly turns these rules off in its root oxlint config, with the
ticket that moves it to seeds as the reason.
