# Architecture docs

A reader opens an architecture doc in `docs/architecture/` before they change a subsystem. An
architecture doc goes wrong when it lists the package's parts instead of the concept, retells one
function step by step, or gives facts without the reasons that connect them. The reader then knows
the names but can't predict what the system does. The rules in the [docs-writing skill](../SKILL.md)
apply throughout.

Contents: [working model](#give-the-reader-a-working-model) · [the concept](#open-with-the-concept)
· [mechanisms](#describe-a-mechanism-that-spans-files) ·
[reasons](#give-the-reason-in-the-sentence-that-needs-it) ·
[the set of docs](#shape-the-set-of-docs-around-concepts) · [what stays out](#what-stays-out)

## Give the reader a working model

After reading the doc, the reader knows:

- what the subsystem is for;
- what its parts are, and how they fit together;
- which part owns each piece of state;
- what stays true whatever a caller does;
- why the system is built this way.

To test the doc, pick a case it doesn't describe outright, such as a process that dies halfway
through a write. Predict from the doc alone what the system does, then check the code. If your
prediction was wrong, add the fact that would have made it right, and test one new case.

## Open with the concept

Say what the subsystem does in the domain's own terms, because the reader thinks in those terms
before they know the code. Name the package that implements it by its role, at most once. The bad
example below opens with the package's path instead.

- Bad: "`libs/stock-ledger` holds the ledger row, the two counters, and the reserve function."
- Good: "Every order a buyer places at a warehouse takes its stock from one place: that warehouse's
  stock ledger. The ledger is a single sequence of entries running forward. An order reserves the
  units it needs, ships from them, and leaves what is left for the order that follows."

## Describe a mechanism that spans files

Describe a mechanism when understanding it takes more than one file, or when its reason isn't
visible in the code. How a lease on a job passes to another worker when its holder stops is one: the
lease, the worker and the timeout live in different files. Write it as a paragraph of cause and
effect, because the reader can't change the subsystem safely without it. Leave out a step-by-step
account of one function: the reader can open the function.

## Give the reason in the sentence that needs it

Put the reason for each fact whose reason isn't obvious in the same sentence or the next, joined by
"because", "so" or "therefore". For the reason, say why the system works this way, or what would
fail if it didn't. Write a paragraph that explains a design choice in this order:

1. the problem;
2. its consequence;
3. the response;
4. the limit on the response: what the response doesn't cover, or the condition it needs.

A `**Why:**` marker is a bold label in front of a reason. Join a reason to its fact with "because"
instead. Keep the marker for a one-off decision that doesn't fit the argument of any paragraph. With
a `**Why:**` on every paragraph, the doc turns into a list of rules, and the reader loses how one
fact leads to the next.

- Bad:

  > The database factory detects a resume as a wall-clock gap. **Why:** timers don't run while the
  > machine is paused.
  >
  > The factory swaps in a fresh pool on a resume. **Why:** the database may have closed the old
  > sockets.

- Good:

  > The pool's timeouts stop while the process is paused. The host suspends an idle machine with its
  > memory intact, so the pool resumes holding its old sockets, and the database may have closed
  > them in the meantime. The database factory therefore detects a resume, as a wall-clock gap
  > between reads it takes on a timer, and swaps in a fresh pool for new queries. The gap threshold
  > stays above any stretch of work that blocks the event loop, so a long job never trips a reset
  > that would destroy its own queries.

State an invariant, a rule that holds whatever a caller does, in the paragraph about the part that
keeps it, with its reason beside it.

## Shape the set of docs around concepts

- **Keep an overview.** `docs/architecture/overview.md` shows the whole system on one page, so a
  reader can find the doc they need. It has a paragraph and a link for each of:
  - the path a request takes, end to end;
  - the topology: which processes and deployments exist, and how they reach each other;
  - the data: each store, and the shapes of data it holds;
  - each concern that cuts across the system.

  When you add an architecture doc, add a paragraph and a link for it to the overview, under the
  part of the system it belongs to. The overview isn't a product overview, which says what the
  product is and who it's for.

- **Write one architecture doc per concept, not per package.** A concept can span several packages,
  and a reader changing the concept needs all of it in one place. Split a doc at a concept boundary.
- **Link the docs whose concepts this one uses**, right after the opening sentences, with one
  sentence on what each covers, so the reader can open the facts next to these. An invented example:

  ```markdown
  [Replay verification](./replay-verification.md) covers the verifier that proves a stream and
  settles it.
  ```

- **Draw a diagram** for the overview's request path and topology, and in any doc whose subject is a
  pipeline, a state machine or a topology, under
  [Diagrams for pipelines, state machines, and topologies](../SKILL.md#diagrams-for-pipelines-state-machines-and-topologies).

## What stays out

Each of these has another owner, and a copy here would go out of date:

- **Design the code doesn't implement yet.** It goes under `docs/design/`. When a built part came
  from a design, link the design in one sentence.
- **What a user sees and does.** That goes in a guide, in `docs/guides/`.
- **The alternatives you rejected, and the history of the design.** Those go in a decision record, a
  numbered file in `docs/decisions/`, when the user signed off the choice.
- **Reference for internals**, such as one entry per protocol method, config key or module. That
  stays in the code, or in reference generated from it.
