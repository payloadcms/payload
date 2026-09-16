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
