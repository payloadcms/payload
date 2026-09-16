# Task 4 report: Codemod migration

## Implementation

- Extended `migrate-version-action-api` without changing its existing draft migration paths.
- Migrated statically safe Local API and SDK options:
  - matching `publishAllLocales: true` becomes `locale: 'all'` for `action: 'publish'`;
  - matching `unpublishAllLocales: true` becomes `locale: 'all'` for `action: 'unpublish'`;
  - an existing static locale is replaced with `'all'`;
  - static false flags are removed.
- Added equivalent rewrites for proven Payload REST URLs and GraphQL mutation strings.
- Kept dynamic flags/locales/actions, conflicting flags/actions, missing explicit actions, detached options, wrapper calls, and context-free REST/GraphQL strings unchanged and emitted manual-review notes.
- Preserved no-op behavior, idempotency, and exact `filesChanged` accounting.
- Updated the codemod README with the removed-flag migration and manual-review cases.

## TDD evidence

### RED

Fixtures and assertions were added before production changes, then the required focused command was run:

```text
node_modules/.bin/vitest run packages/codemod/src/transforms/migrate-version-action-api/index.spec.ts
Test Files  1 failed (1)
Tests       5 failed | 24 passed (29)
```

The five expected failures covered Local API/SDK output, REST output, GraphQL output, unsafe-note behavior, and exact `filesChanged` reporting.

### GREEN

Fresh final verification:

```text
node_modules/.bin/vitest run packages/codemod/src/transforms/migrate-version-action-api/index.spec.ts
Test Files  1 passed (1)
Tests       29 passed (29)
```

Additional checks:

```text
pnpm --pm-on-fail=ignore --filter @payloadcms/codemod typecheck
$ tsc

pnpm --pm-on-fail=ignore --filter @payloadcms/codemod lint
0 errors, 6 pre-existing warnings in unrelated transforms

node_modules/.bin/prettier --check <changed codemod source/spec/README>
All matched files use Prettier code style!

git diff --check
clean
```

## Tests and fixtures

- Added object-call fixtures for Local API and SDK publish/unpublish, static locale replacement, and static false removal.
- Added proven Payload REST URL fixtures for true conversion, concrete locale replacement, and false removal.
- Added proven Payload GraphQL mutation fixtures for publish/unpublish conversion and false removal.
- Added unsafe fixtures for dynamic flag/locale values, dual-flag conflicts, action conflicts, missing explicit action, detached options, ambiguous REST, and detached GraphQL.
- Added the new output fixtures to the idempotency loop and included rewritten/unsafe files in exact `filesChanged` coverage.

## Files

- `packages/codemod/src/transforms/migrate-version-action-api/index.ts`
- `packages/codemod/src/transforms/migrate-version-action-api/index.spec.ts`
- `packages/codemod/src/transforms/migrate-version-action-api/all-locales.input.ts`
- `packages/codemod/src/transforms/migrate-version-action-api/all-locales.output.ts`
- `packages/codemod/src/transforms/migrate-version-action-api/all-locales-rest.input.ts`
- `packages/codemod/src/transforms/migrate-version-action-api/all-locales-rest.output.ts`
- `packages/codemod/src/transforms/migrate-version-action-api/all-locales-graphql.input.ts`
- `packages/codemod/src/transforms/migrate-version-action-api/all-locales-graphql.output.ts`
- `packages/codemod/src/transforms/migrate-version-action-api/all-locales-unsafe.input.ts`
- `packages/codemod/src/transforms/migrate-version-action-api/all-locales-unsafe.output.ts`
- `packages/codemod/README.md`

## Self-review

- Verified all automatic true rewrites retain or replace a matching explicit publication action and produce `locale: 'all'`.
- Verified static false removal is independent and safe, including when both legacy flags are false.
- Verified unsafe true cases remain unchanged rather than receiving a partial locale rewrite.
- Verified string rewrites require the transform's existing proven Payload URL/GraphQL context.
- Verified existing draft fixtures and all pre-existing focused tests remain green.
- Verified a second run over every new output fixture is a no-op.

## Concerns

- Package-wide lint reports six existing warnings in unrelated codemod transforms; it reports zero errors and no warnings in the changed production file.
- The repository's pnpm launcher attempted an unavailable registry signature check without `--pm-on-fail=ignore`; the local pinned pnpm invocation with that flag completed typecheck and lint successfully.
