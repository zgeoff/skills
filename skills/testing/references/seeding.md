# Seeding

A seed puts stored state in place for a test by calling the code that owns that state. The owner is
the module whose code writes those rows or files. When every test outside the owner seeds through
it, a schema or layout change breaks only the owner and its tests.

Write seeds this way even in a repo whose older tests still call `insertInto`. Leave those tests as
they are unless you work on their code.

The traps:

- **A seed that branches on a state.** The branch copies the owner's state machine, and the copy
  goes wrong when the owner changes. Write one seed per state, each a straight line of calls.
- **A seed for a bundle of records,** such as `seedUserWithTwoNotes`. It hides the scenario. Call
  `user` and `note` in the test instead.
- **A direct write because the owner's writer isn't exported.** Export the writer from the owner. An
  unexported writer, an awkward import or a slow call is never a reason to write directly.

- [The seeds an owner publishes](#the-seeds-an-owner-publishes)
- [Writing a seed](#writing-a-seed)
- [Publishing seeds](#publishing-seeds)
- [`buildSeed` and `setupTest`](#buildseed-and-setuptest)
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
- A concept with no state type gets only its base seed.
- Every other difference, such as a title or a timestamp, is input to a seed, never a new seed.

So the state type fixes the list, and you never decide whether a variant is worth adding. Never
write a seed that takes the state as an argument, such as `seedNote(deps, { status: 'archived' })`.
Its branches copy the owner's transitions.

## Writing a seed

Put each seed in its own file in the owner's test utils, the folder its `test-utils` entry exports:
`seed-note.ts` exports `seedNote`, and `seed-archived-note.ts` exports `seedArchivedNote`.

A seed takes two arguments:

- the owner's deps, the handles its code already takes, such as `{ db, clock }`;
- a partial of the owner's input type, built into a full input by the matching `buildMock<Type>`
  factory.

Inside, it calls the owner's writes in a straight line:

- The base seed calls the owner's create.
- A variant calls the base seed, then the owner's transition.
- When the owner's write returns a wider type than the seed promises, the seed narrows it with
  `invariant()` from `tiny-invariant`. An owner write can act on a different record than the one you
  meant, such as a claim that takes whichever task is due first, and the `invariant()` call catches
  that.
- The time comes from `deps.clock`. A test that needs a fixed timestamp passes it in the input,
  where the owner's input type has the field.

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

The owner's `test-utils` entry exports each seed and one builder that binds the seeds to deps:

```ts
export const buildNoteSeeds = (deps: NotesDeps) => ({
  note: (input?: Partial<NewNote>) => seedNote(deps, input),
  archivedNote: (input?: Partial<NewNote>) => seedArchivedNote(deps, input),
});
```

Each key is the seed's name without `seed`, so a test calls `ctx.seed.archivedNote(…)`. One owner
stores each concept, so two owners never publish the same key.

## `buildSeed` and `setupTest`

Each package that seeds has one `buildSeed(deps)` in its test utils. It spreads the builder of each
owner whose state the package's tests need:

```ts
export const buildSeed = (deps: TestDeps) => ({
  ...buildNoteSeeds(deps),
  ...buildAttachmentSeeds(deps),
});
```

`TestDeps` is the type of the deps the package's `setupTest()` wires. When a builder needs a handle
that `TestDeps` lacks, TypeScript fails, so add the handle to the wiring.

Every `setupTest()` in the package returns `seed: buildSeed(deps)` beside the deps, so `ctx` holds
both. Binding the seeds is wiring: `setupTest()` still creates no data.

- **A test with two databases** puts both handles in `TestDeps`. Each builder takes the part it
  needs, such as `buildAuditSeeds({ db: deps.auditDB, clock: deps.clock })`, and the test still
  calls one `ctx.seed`.
- **A test with two hosts,** such as a sync test with a source and a target, calls `buildSeed` once
  for each host's deps: `source: { ...sourceDeps, seed: buildSeed(sourceDeps) }`. The test then
  calls `ctx.source.seed.note(…)` and `ctx.target.seed.note(…)`.

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

A test over several states passes the unbound seed functions as case data. `ctx` spreads the deps,
so it satisfies the owner's deps type. Never map a label to a seed in a lookup of your own.

```ts
test.each([
  ['draft', seedNote],
  ['archived', seedArchivedNote],
])('it finds a %s note by its title', async (_label, seed) => {
  const ctx = await setupTest();
  const note = await seed(ctx, { title: 'Groceries' });

  expect(await ctx.client.searchNotes({ query: 'Groceries' })).toPartiallyContain({ id: note.id });
});
```

## A state no owner code makes

Some states no code in the repo produces today, such as a row an older version wrote before a column
became required. Write such a row directly, only inside a seed, with a `//` comment that names the
exact state. This seed is the one extra beyond the state type's list.

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
input. When you can't name a state that no owner code makes, call the owner.

## Interrupted operations

A state that spans two hosts, or that an operation leaves when it stops partway, never comes from a
seed. Examples are a commit that one host sent and the other never got, or a reset that stopped
halfway. Run the real operation, and make it fail at the step under test with a stand-in at the
boundary, such as a transport that rejects the second call.

## A seed's own test

Each `seed-<name>.ts` file has a `seed-<name>.test.ts` beside it. It asserts the rows and files the
seed writes, and that input overrides apply. Use `toMatchObject` on a row, because the database
computes some of its fields.

A seed's own test is one of the three kinds of test outside the owner that may read stored state
directly. The other two are a migration test and a test of code whose product is SQL or storage,
such as a database dialect.

## The lint rules

`@zgeoff/oxlint-config` checks the mechanical parts of this reference:

- `zgeoff/seed-only` fails a database write in a test file anywhere except a seed, the owner's own
  tests, and the three kinds of test above.
- `zgeoff/function-verb` allows the `seed` verb only in test utils.
- The config also fails a `seed-<name>.ts` file with no test beside it.

A repo whose tests still write directly turns these rules off in its root oxlint config, with the
ticket that moves it to seeds as the reason.
