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

## Fix round 1

### Implementation

- Replaced the GraphQL publication regex's whole-argument matching with a small structure-aware scanner that:
  - identifies mutation field argument lists while skipping quoted and block-string contents;
  - considers only top-level field arguments for `action`, `locale`, and the legacy flags;
  - preserves nested `data.locale`, nested `data.publishAllLocales`, and matching text inside string values;
  - removes static false arguments whether GraphQL commas are present or omitted.
- Added an object safety gate for unresolved spread assignments and computed properties, leaving the object unchanged and emitting a manual-review note because they may override `action`, `locale`, or either legacy flag.
- Added a compatible mixed REST migration: `draft=false` plus `publishAllLocales=true` on a proven write becomes `action=publish` plus `locale=all` in the same run.

### RED evidence

All reviewer cases were added before production edits and the focused suite failed as expected:

```text
node_modules/.bin/vitest run packages/codemod/src/transforms/migrate-version-action-api/index.spec.ts
Test Files  1 failed (1)
Tests       5 failed | 28 passed (33)
```

The failures were the four new regression tests plus the idempotency loop, which caught the nested-only GraphQL field being rewritten on a second run.

### GREEN evidence

Each regression was run independently after its fix, followed by the full focused suite:

```text
node_modules/.bin/vitest run packages/codemod/src/transforms/migrate-version-action-api/index.spec.ts
Test Files  1 passed (1)
Tests       33 passed (33)
```

```text
pnpm --pm-on-fail=ignore --filter @payloadcms/codemod typecheck
$ tsc

node_modules/.bin/eslint packages/codemod/src/transforms/migrate-version-action-api/index.ts
0 errors, 0 warnings
```

### Tests and fixtures

- `all-locales-graphql-nested.*` proves only top-level operation arguments change while nested object fields and a string containing legacy-looking text remain byte-for-byte intact.
- `all-locales-graphql-comma-free.*` proves a false top-level flag is removed from comma-free GraphQL.
- `all-locales-mixed-rest.*` proves both compatible legacy REST arguments migrate in one run and the output is idempotent.
- `all-locales-object-ambiguous.*` proves unresolved spreads and computed properties remain unchanged, produce notes, and do not count as changed files.
- All four outputs were added to the existing idempotency loop.

### Self-review

- Confirmed nested-only GraphQL legacy-looking fields no longer trigger a rewrite or note in a proven Payload operation string.
- Confirmed GraphQL scanning ignores quoted strings, nested objects, lists, and nested parentheses when locating field argument boundaries.
- Confirmed object ambiguity is checked before static false removal, preventing partial rewrites when a later override may change effective values.
- Confirmed the mixed REST path consumes `draft=false` before the existing draft pass, leaving no second-run work.
- Confirmed the 29 pre-fix tests remain green alongside the four new regressions.

### Concerns

- None specific to the fix round. The GraphQL scanner remains intentionally conservative and only rewrites statically recognizable create/duplicate/update mutation fields in proven Payload GraphQL requests.

## Fix round 2

### Implementation

- Preserved the preceding whitespace separator when removing a single-line, comma-free GraphQL argument. The transform now produces `action: publish data: {}` instead of concatenating the adjacent tokens as `publishdata`.
- Scanned the literal content of double-quoted JavaScript strings rather than their outer source quotes, then used the AST string-literal setter to preserve valid JavaScript escaping and quote syntax after rewriting.

### RED evidence

The two exact regression fixtures were added before production edits:

```text
node_modules/.bin/vitest run packages/codemod/src/transforms/migrate-version-action-api/index.spec.ts
Test Files  1 failed (1)
Tests       2 failed | 33 passed (35)
```

The failures showed the invalid `action: publishdata: {}` result and the unchanged double-quoted GraphQL operation.

### GREEN evidence

Both regressions passed in isolation, followed by the full focused suite and typecheck:

```text
node_modules/.bin/vitest run packages/codemod/src/transforms/migrate-version-action-api/index.spec.ts
Test Files  1 passed (1)
Tests       35 passed (35)

pnpm --pm-on-fail=ignore --filter @payloadcms/codemod typecheck
$ tsc
```

### Tests and fixtures

- `all-locales-graphql-inline-comma-free.*` verifies exact valid output and second-run idempotency for a single-line comma-free false flag.
- `all-locales-graphql-double-quoted.*` verifies a top-level true flag migrates inside a double-quoted JavaScript GraphQL string and that the output is idempotent.

### Self-review

- The separator change is limited to the no-comma inline removal branch; comma-delimited and full-line removals retain their existing behavior.
- Only ordinary JavaScript string literals use `setLiteralValue`; template literals continue through their established source-text path.
- Existing nested GraphQL string preservation remains covered and green.

### Concerns

- None.

## Fix round 3

### Implementation

- Corrected double-quoted JavaScript string emission for GraphQL values containing escaped nested quotes.
- The transform now reads the decoded AST string value, performs the GraphQL rewrite on that value, and serializes changed double-quoted literals with `JSON.stringify`. This preserves the backslash-plus-quote pairs required by GraphQL while producing syntactically valid JavaScript.
- Single-quoted strings and template literals retain their existing write paths.

### RED evidence

The exact escaped-string fixture and parse/content/idempotency assertions were added before the production edit:

```text
node_modules/.bin/vitest run packages/codemod/src/transforms/migrate-version-action-api/index.spec.ts -t "escaped nested quotes"
Test Files  1 failed (1)
Tests       1 failed | 35 skipped (36)
```

The transformed source reported four TypeScript syntactic diagnostics and emitted too few backslashes around the nested `world` quotes.

### GREEN evidence

```text
node_modules/.bin/vitest run packages/codemod/src/transforms/migrate-version-action-api/index.spec.ts
Test Files  1 passed (1)
Tests       36 passed (36)

pnpm --pm-on-fail=ignore --filter @payloadcms/codemod typecheck
$ tsc
```

### Tests and fixtures

- `all-locales-graphql-escaped-string.input.ts`
- `all-locales-graphql-escaped-string.output.ts`
- The regression asserts zero TypeScript transpile diagnostics for input, expected output, and actual transformed output; exact fixture equality; preserved runtime GraphQL nested-string content; top-level flag migration; and second-run idempotency.

### Self-review

- Confirmed the serializer change is limited to changed double-quoted `StringLiteral` nodes.
- Confirmed the exact output retains `title: \"hello \\\"world\\\"\"` in JavaScript source while the parsed literal retains `title: "hello \\"world\\""` in GraphQL content.
- Confirmed all prior GraphQL structure, comma-free, double-quoted, REST, object-safety, draft, notes, and `filesChanged` tests remain green.

### Concerns

- None.

## Final review fix: localized data safety

### Root cause

The object-call migration treated every statically known concrete `locale` as replaceable
publication metadata. That is safe for publication-only calls, but not for a call with
non-empty `data`: changing `locale: 'es'` to `locale: 'all'` can redirect the localized
write to the default locale even though the legacy flag only broadened publication status.

### Implementation

- Added a conservative guard for Local API and SDK object calls with a static concrete locale.
- When such a call also has non-empty or non-statically-provable `data`, the transform leaves
  the call unchanged, does not count the file as changed, and emits a manual-review note that
  explains the localized write and all-locale publication must be separated manually.
- Calls whose locale is already `all`, or whose data is absent or a statically empty object,
  retain the established automatic migration.

### RED evidence

The localized-data fixture and idempotency assertion were added before the production guard:

```text
node_modules/.bin/vitest run packages/codemod/src/transforms/migrate-version-action-api/index.spec.ts
Test Files  1 failed (1)
Tests       2 failed | 35 passed (37)
```

The direct regression assertion and the idempotency loop both showed the unsafe rewrite from
`locale: 'es', publishAllLocales: true` to `locale: 'all'` while retaining the Spanish data.

### GREEN evidence

```text
node_modules/.bin/vitest run packages/codemod/src/transforms/migrate-version-action-api/index.spec.ts
Test Files  1 passed (1)
Tests       37 passed (37)

pnpm --pm-on-fail=ignore --filter @payloadcms/codemod typecheck
$ tsc
```

### Tests and fixtures

- `all-locales-localized-data.*` proves an explicit non-default locale plus non-empty data is
  unchanged, reports no changed file, emits a clear note, and remains idempotent.
- The existing static Local API and SDK fixture remains green with empty data, including the
  concrete-locale publish case and concrete-locale unpublish case.
- Existing REST, GraphQL, draft migration, notes, and exact `filesChanged` coverage remains green.

### Self-review

- The guard runs before changing the active all-locales flag or locale, so the unsafe call is
  preserved byte-for-byte.
- Dynamic, shorthand, and otherwise non-provable data values are treated conservatively as
  potential writes.
- The change is limited to object-call migration; no core, GraphQL runtime, or documentation
  files were modified.

### Concerns

- None. The transform intentionally asks for manual review rather than synthesizing a second
  write or guessing whether localized data can be redirected.
