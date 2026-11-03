# Factories

Write a `buildMock<Type>` factory for each domain type that crosses a module boundary, as
[Test data](../SKILL.md#test-data) in the testing skill sets. The factory returns the value and does
nothing else: it writes no database row and no file. A test that needs stored state calls the seeds
of the module that writes it, as [Stored state](../SKILL.md#stored-state) says, and those seeds
build their input with these factories.

Watch for these mistakes:

- A plain `...overrides` spread keeps a key whose override is `undefined`, and `toStrictEqual` then
  fails against a value with no such key. Drop those keys in the factory, as the example below does.
- Faker's values follow the order of its calls, so one new faker call elsewhere changes them. In a
  package with a golden test, one that pins output in an inline snapshot or compares it with a
  committed file, default every field to a literal value in place of faker.
- Never write a helper that presets overrides. The reader can't see its defaults. Only a seed named
  for a state, such as `archivedNote`, sets a field for the test, and only the field its name gives.

## Writing a factory

- Keep the factory, with its own test file, in `src/test-utils/` of the package that defines the
  type. For a type from a third-party package, such as an SDK result, keep it in the package that
  wraps that package. When no package wraps it, keep it in the package whose tests use it. Another
  package imports the factory by package name, through the `exports` entry that
  [Where a test lives](../SKILL.md#where-a-test-lives) describes.
- Name the file `build-mock-<type>.ts`, and export `buildMock<Type>` from it: `OrderLine` gets
  `build-mock-order-line.ts` and `buildMockOrderLine`. Use `build`, because the factory creates no
  resource.
- Take one argument of overrides. Return a complete value, with every optional field filled, and
  drop each key whose override is `undefined`. A test then leaves an optional field out with
  `{ note: undefined }`:

  ```ts
  export function buildMockOrderLine(overrides: Partial<OrderLine> = {}): OrderLine {
    const line = {
      id: faker.string.uuid(),
      orderID: faker.string.uuid(),
      status: 'open',
      quantity: faker.number.int({ min: 1, max: 9 }),
      note: faker.lorem.sentence(),
      ...overrides,
    };

    return Object.fromEntries(
      Object.entries(line).filter(([, value]) => value !== undefined),
    ) as OrderLine;
  }
  ```

- Default a field to a `@faker-js/faker` value when no test depends on its value. The reader then
  sees that the value doesn't matter. When the package has no `@faker-js/faker` dev dependency, add
  it.
- Call `faker.seed()` with a fixed number in the test preload of each package that uses faker, so a
  failing run gives the same values again. The test preload is the file that `bunfig.toml` names
  under `[test] preload`.
- Default an enum or a discriminator to the value most tests need.
- Default each foreign key to a new `faker.string.uuid()`, and never require a parent. When a test
  needs a real parent, seed the parent and pass its ID.
- When the type is a class, pass the merged fields to its constructor and return the instance, so
  `toStrictEqual` against a real instance passes.
- Build a nested object with its own factory, and pass it the nested override. Take a list field's
  override as the whole list.

  ```ts
  type ShipmentOverrides = Partial<Omit<Shipment, 'address'>> & { address?: Partial<Address> };

  export function buildMockShipment(overrides: ShipmentOverrides = {}): Shipment {
    const { address, ...rest } = overrides;

    return {
      id: faker.string.uuid(),
      carrier: 'post',
      address: buildMockAddress(address),
      ...rest,
    };
  }
  ```

- When a domain type has one shape as a database row and another in the API, write a factory for
  each shape, named for its type, such as `buildMockOrderLineRow` and `buildMockOrderLine`. Each
  factory still only builds a value.
- Call the factory in the test that uses its value, never in a shared constant or a hook.

## A factory's own test

Put the test beside the factory, as `build-mock-<type>.test.ts`, with these 2 tests:

- `test('it builds a default order line', …)`, with the type's name in place of order line. Assert
  the whole shape with `toStrictEqual` and asymmetric matchers.
- `test('it applies overrides on top of the defaults', …)`.

Add a test for each branch of the factory that those 2 can't reach, and check that it fails when you
delete the branch:

- the removal of a key whose override is `undefined`;
- a field that the factory works out from another field;
- a nested object or a list that the factory builds with another factory.

Never add a test of faker's output, or a second test of the plain merge of overrides.
