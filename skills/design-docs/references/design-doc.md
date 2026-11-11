# Design doc template

Read [SKILL.md](../SKILL.md) first: it says what goes in each section and who the owner and the
builder are.

## Write a design doc

1. Copy the block below to `docs/design/<work>.md`, where `<work>` names the work in kebab case,
   such as `order-holds.md`.
2. Replace the example values. They describe an invented warehouse service.
3. Delete each `<!-- -->` comment.
4. Delete Shape when the design is one function or one type. Delete Out of scope and Open questions
   when they have nothing to say. Keep every other section.
5. Leave file paths out of the text and the code. The builder finds a symbol by name. Links to other
   docs are fine.

Avoid these mistakes:

- prose that retells a contract the Contracts section shows;
- an option the owner turned down, a dated note, or a note addressed to the owner;
- an open question with nothing named to settle it, or one the builder could settle alone.

````markdown
# <Work name>

- **Status:** draft
- **Decision records:** [0012](../decisions/0012-holds-expire-after-15-minutes.md)

<!-- Status is draft until the owner approves the design, then agreed. Decision records lists each record the design links; delete that bullet when there are none.  -->

<!-- The summary: 2 or 3 sentences on what changes, for whom, and the approach in one line. -->

Orders hold stock while the buyer checks out, so two buyers can't pay for the last unit. A hold
lives in the stock ledger and expires on its own.

## Shape

<!-- One mermaid diagram of the main path, 10 nodes or fewer. Errors and retries go in Constraints. With no flow to show, draw the parts and what each one owns. -->

```mermaid
flowchart LR
  order -->|"holds.place"| ledger[stock ledger]
  ledger -->|"holdID"| order
  timer -->|"expired"| ledger
```

## Contracts

<!-- The call first, with a result in a comment that matches its type. Then the types, each one defined here or named with the module that owns it. Name the module that owns each new type in a comment. For an HTTP endpoint, show the request and the response in an `http` block. A rule for one field goes in a comment on that field.  -->

```ts
const hold = await holds.place({ orderID, sku: 'BOLT-M6', units: 40 });
// → { holdID: 'h_8f2', units: 40, expiresAt: '2026-03-02T10:15:00Z' }
//   or { error: 'insufficient-stock', available: 12 }
```

```ts
// holds module. Adapters: SQLite, and an in-memory fake for tests.
interface HoldStore {
  place(input: PlaceHold): Promise<Hold | InsufficientStock>;
  release(holdID: string): Promise<void>; // idempotent
}

type PlaceHold = { orderID: string; sku: string; units: number };
type InsufficientStock = { error: 'insufficient-stock'; available: number };

interface Hold {
  holdID: string;
  units: number; // > 0
  expiresAt: string; // placed + 15 minutes
}
```

## Constraints

<!-- The rules the code must keep, one per line, each one a test could check: invariants, limits with numbers, failures and what happens on each, what must never happen. -->

- Held units never exceed the units on the shelf.
- When a hold expires, its units return to the shelf within 1 minute.
- `release` of an unknown or expired hold succeeds and changes nothing.
- When two orders race for the last units, one gets the hold and the other gets
  `insufficient-stock`.

## Decisions

<!-- Each choice made between options, one line each: the choice, its reason, and a link to its decision record when one exists. A rule the code must keep goes in Constraints. -->

- **Holds expire after 15 minutes.** A checkout that takes longer has been abandoned.
  [0012](../decisions/0012-holds-expire-after-15-minutes.md)
- **The ledger is the only writer of stock counts.** Two writers drift apart.

## Builder decides

<!-- What the design leaves to the builder on purpose: names, layout, wording. Keep at least one line, so the owner sees what was left open. -->

- The names of internal functions and files.
- How the expiry timer is scheduled.
- The wording of each error message.

## Out of scope

<!-- What a reader might expect this work to do, and it doesn't, with where it lives or why not. -->

- Holds across warehouses. Each warehouse holds its own stock.

## Open questions

<!-- Each question: what settles it (the owner, a spike or a measurement), and what the code does until then. When it is settled, move the answer into Decisions and delete the question. -->

- **Can staff extend a hold?** The owner settles it. Until then, a hold never extends.
````

## Split a long design

Split a design that passes about 400 lines with its code. Cut it where one part calls another
through a contract, so each doc owns the contracts of its part.

1. Make the folder `docs/design/<work>/`, with one doc per part, named after the part, such as
   `ledger.md`.
2. Give the folder a `README.md` with the title, the header bullets, the summary, a Shape diagram of
   how the parts connect, a table of the docs, and each decision that spans parts.
3. Give each doc the sections above, with its own Shape diagram and its own header bullets.
4. Add one `../` to each link out of the folder, such as `../../decisions/`.
