# Task 3 report: REST, Admin UI, CLI, MCP, and GraphQL callers

## Implementation

- Removed `publishAllLocales` and `unpublishAllLocales` parsing/forwarding from collection and global REST endpoints.
- Removed the obsolete properties from CLI and MCP callers; their shared input schemas now expose `locale` without either boolean property.
- Changed Admin UI all-locale publication requests to send explicit action/locale pairs:
  - publish: `action=publish&locale=all`
  - unpublish: `action=unpublish&locale=all`
  - bulk unpublish: `action=unpublish&locale=all`
- Preserved the human-facing `version:publishAllLocales` label.
- Added `all` to GraphQL's `LocaleInputType`, enabling explicit all-locale create/update actions, and updated the generated test schema.
- Updated remaining test/eval callers to use `locale: 'all'` or a single locale without legacy flags.
- Verified the SDK has no independent legacy flag declarations; it inherits the core operation types.

## TDD evidence

### RED

After adding the GraphQL and MCP/CLI surface assertions first:

```text
PAYLOAD_DATABASE=sqlite corepack pnpm test:int test/plugin-mcp/int.spec.ts test/collections-graphql/int.spec.ts
```

The new GraphQL test failed as intended:

```text
Argument "locale" has invalid value all.
Value "all" does not exist in "LocaleInputType" enum.
```

That run also had two unrelated sandbox-only upload-server failures (`listen EPERM 127.0.0.1`). The later unsandboxed required run was fully green.

### GREEN

```text
corepack pnpm test:int test/plugin-mcp/int.spec.ts test/collections-graphql/int.spec.ts
Test Files 2 passed (2)
Tests 280 passed (280)
```

Additional focused checks:

```text
PAYLOAD_DATABASE=sqlite corepack pnpm test:int test/cli/int.spec.ts -t "(createDocuments|updateDocument|updateGlobal) --help --json"
Tests 3 passed

corepack pnpm test:int test/hierarchy/int.spec.ts -t "should handle localized drafts with different titles per locale"
Tests 1 passed
```

Type builds passed for `payload`, `@payloadcms/graphql`, `@payloadcms/plugin-mcp`, and `@payloadcms/ui`.

Targeted source lint completed with zero errors and one pre-existing warning in `PublishButton` for the unused `close` callback argument.

## Tests changed

- `test/plugin-mcp/int.spec.ts`
  - asserts create/update/global MCP schemas expose `locale` and omit both legacy boolean properties
  - verifies `updateDocument` publishes every locale via `action: 'publish', locale: 'all'`
- `test/cli/int.spec.ts`
  - asserts create/update/global CLI JSON help schemas expose `locale` and omit both legacy boolean properties
- `test/collections-graphql/int.spec.ts`
  - verifies an explicit GraphQL publish action accepts `locale: all` and publishes both configured locales
  - migrates the localized relationship fixture from `locale: '*'` plus the old boolean to `locale: 'all'`
- `test/hierarchy/int.spec.ts`, `test/evals/datasets/mcp.ts`, and `test/versions/collections/ErrorOnUnpublish.ts`
  - remove remaining legacy caller/test-fixture usage

## Production files changed

- REST: collection create/update/update-by-ID and global update endpoints
- CLI: collection create/update and global update commands
- Admin UI: PublishButton, UnpublishButton, and UnpublishMany drawer content
- MCP: collection create/update and global update tools
- GraphQL: locale input enum builder
- Generated GraphQL fixture schema

## Self-review

- Confirmed no production or test caller retains either legacy boolean name; remaining matches are schema-absence assertions and the unchanged translation key used for the UI label.
- Confirmed single-locale publication paths still send the active locale.
- Confirmed all-locale Admin UI paths include an explicit `publish` or `unpublish` action.
- Confirmed bulk unpublish no longer depends on the active Admin locale.
- Confirmed GraphQL exposes `all` without adding legacy mutation arguments.
- `git diff --check` passes.

## Concerns

- The first sandboxed runs could not access local MongoDB/test listener sockets; the required MongoDB integration command was rerun with local access and passed all 280 tests.
- The pre-commit `lint-staged` hook reports eight pre-existing `vitest/no-conditional-expect` errors in `test/hierarchy/int.spec.ts` because that file is touched by the legacy-flag migration. The focused hierarchy regression passes, changed production sources have zero lint errors, and the hook findings are unrelated to this change.

## Review fix round 1

### Implementation

- Changed the Admin “Publish all locales” flow into two ordered writes:
  1. publish the active locale with the current flat form values;
  2. publish `locale=all` with status-only data.
  This preserves non-default locale edits without replaying them into the default locale. New collection documents use the ID returned by the first form submission for the second transition.
- Extended the form submit result with its already-parsed JSON response so callers can safely obtain a newly created document ID without consuming the response body twice.
- Added an internal `returningLocale` operation option for collection create/update and global update. GraphQL captures the request's prior/default locale before writing with `locale=all`; the write still transitions all locales, while final field `afterRead` returns scalar localized fields compatible with the GraphQL schema.
- Updated the `ErrorOnUnpublish` fixture to detect REST all-locale intent through `req.query.locale`, which remains stable after hook request locale normalization.

### TDD evidence

RED was captured before production edits:

```text
GraphQL: String cannot represent value: { en: null, es: null }
REST fixture: expected response.status 400, received 200
Admin E2E: locale=all response returned localized objects to scalar UI data and the publish flow failed;
           the request also replayed the Spanish flat form value into the default locale.
```

GREEN verification:

```text
PAYLOAD_DATABASE=sqlite corepack pnpm test:int test/collections-graphql/int.spec.ts test/versions/int.spec.ts
Test Files 2 passed (2)
Tests 166 passed (166)

pnpm test:e2e localization --grep "should preserve non-default locale edits when publishing all locales" --workers 1
Tests 1 passed (1)

pnpm build:payload
pnpm build:graphql
pnpm build:ui
All three package builds passed.
```

The combined SQLite GraphQL/versions/MCP run passed 395 tests; the only two failures were the MCP upload-from-URL tests attempting to bind a sandboxed listener (`listen EPERM 127.0.0.1`). MCP production code was unchanged in this review round, and the earlier unsandboxed Task 3 run passed all 280 MCP/GraphQL tests.

### Review and cleanup

- The new Admin E2E begins on Spanish and verifies both persisted values (`en` unchanged, `es` edited) and both published statuses.
- The GraphQL mutation now selects a localized `title` and verifies a scalar default-locale response while the stored status map is published for both locales.
- The REST test verifies the exact public custom validation error and HTTP 400 response.
- Changed production sources lint with zero errors; remaining warnings predate this fix.
- `git diff --check` and Prettier checks pass.
- E2E-generated `tsconfig.base.json`, localization payload types, and database journal changes were restored/removed before commit.

### Review fix concerns

- Full Turbo builds required a temporary Corepack shim so nested package scripts consistently used the repository-pinned pnpm 11.9.0; no shim or generated build artifact is included in the commit.
- The repository pre-commit hook still reports 13 pre-existing `vitest/no-identical-title` errors in `test/versions/int.spec.ts`; none are in or caused by the added REST regression. Targeted production lint has zero errors, and the full versions suite passes 117/117.
