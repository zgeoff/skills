# Dependency exceptions

Add an exception only for the reason that [Dependency exceptions](../SKILL.md#dependency-exceptions)
asks for, and follow the section for its kind.

## Release-age excludes

1. Add the package's name to `minimumReleaseAgeExcludes` in `bunfig.toml`.
2. Lock the release:
   - For a direct dependency, pin the release in the root `package.json` catalog.
   - For a transitive dependency that every range in `bun.lock` admits, run `bun update <package>`.
     It locks the newest release those ranges admit, which can be newer than the fix, and leaves
     `package.json` alone. Add no override: `chex dependency-gates` fails the run on an override
     that every range admits.
   - For a transitive dependency that a range in `bun.lock` leaves out, add an
     [override](#overrides). A catalog entry reaches only direct dependencies.
3. Read the version that `bun.lock` now locks, and check that it has npm provenance. When this
   prints nothing, undo steps 1 and 2, use an older release, and stop here:

   ```bash
   npm view <package>@<version> dist.attestations.provenance
   ```

4. Above the exclude, write a removal comment in the shape below, for the locked version. Date the
   removal `minimumReleaseAge` seconds after the publish date from
   `npm view <package> 'time[<version>]'`. Change only the package, its version and the dates:
   `chex dependency-gates` and the audit-fix workflow match the rest word for word.

   ```toml
   # @scope/example 2.4.1 (published 2026-10-30) ages past the gate ~2026-11-06 — remove then (audit-fix)
   ```

## Overrides

Pin one exact version in `overrides` in `package.json`. JSON takes no comments, so give the reason
in the pull request.

## Audit ignores

Let the audit-fix workflow add each ignore and set its expiry. By hand, add `--ignore <advisory-id>`
to the `audit` script, and an entry under that ID in the root `audit-ignores.json` with its
`package`, `reason` and ISO `expires` date.
