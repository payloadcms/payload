# Agent-Friendly Migration CLI

**Date:** 2026-03-11
**Scope:** `migrate:create` and `migrate` commands
**Approach:** Composable flags — each flag does one thing, agents compose what they need

## Problem

AI coding agents (Claude, Codex, Cursor) cannot reliably use Payload's Drizzle-based migration system because:

1. Interactive prompts block headless execution
2. No structured output for agents to parse results
3. No way to check if a migration is needed without creating one
4. Exit codes don't distinguish "no changes" from "error"
5. No way to pipe custom SQL without writing intermediate files

Production outages result from pushing code that needed a migration but didn't get one, because agents couldn't detect or create migrations in their workflow.

## Design

### Exit Codes (always active, no flag needed)

| Code | Meaning | When |
|------|---------|------|
| 0 | Success | Migration created, or migrations ran successfully |
| 1 | Error | Invalid args, config error, SQL execution failure |
| 2 | No changes | `migrate:create` found no schema diff |

Current behavior exits 0 for "no changes" which is incorrect for CI gates. With this change, `migrate:create --skipEmpty` exits 2 when there's nothing to do, enabling CI checks like:

```bash
payload migrate:create --skipEmpty; code=$?
if [ $code -eq 2 ]; then echo "Schema is up to date"; fi
if [ $code -eq 1 ]; then echo "Error"; exit 1; fi
```

`--forceAcceptWarning` on `migrate` skips the dev-mode prompt entirely and proceeds.

### `--json` Flag

When passed, all output goes to stdout as a single JSON object. Logger output redirects to stderr.

**`migrate:create --json` output:**

```json
{
  "status": "created",
  "migrationName": "20260311_143022_add_users_table",
  "filePath": "/path/to/migrations/20260311_143022_add_users_table.ts",
  "schemaPath": "/path/to/migrations/20260311_143022_add_users_table.json",
  "upSQL": "ALTER TABLE \"users\" ADD COLUMN \"email\" varchar;",
  "downSQL": "ALTER TABLE \"users\" DROP COLUMN \"email\";",
  "hasChanges": true
}
```

No changes detected:
```json
{
  "status": "no-changes",
  "hasChanges": false
}
```

**`migrate --json` output:**

```json
{
  "status": "completed",
  "migrationsRan": [
    {"name": "20260311_143022_add_users_table", "durationMs": 42}
  ],
  "pending": 0
}
```

Error case:
```json
{
  "status": "error",
  "error": "Error running migration: relation already exists"
}
```

### `--dry-run` Flag

Applies to `migrate:create` and `migrate`.

**`migrate:create --dry-run`:**
- Generates schema diff (UP and DOWN SQL) as normal
- Does NOT write any files
- Exits 0 if changes exist, 2 if no changes
- Combined with `--json`, outputs the SQL that would be in the migration

**`migrate --dry-run`:**
- Connects to DB, reads migration records, compares against disk
- Reports which migrations would run without executing SQL
- Always exits 0 on success (the dry-run operation itself succeeded). The JSON/stdout output reports what's pending. Exit 1 only on error (e.g., can't connect to DB).

Note: `--dry-run` exit code 2 is only used by `migrate:create` (no schema changes). For `migrate --dry-run`, exit 0 means "dry run completed successfully" regardless of whether pending migrations exist — the output tells you what's pending.

**`--from-stdin` combined with `--dry-run`:** Invalid combination — exits 1 with error. Since `--from-stdin` provides explicit SQL, there's nothing to "dry run."

Does NOT validate SQL will succeed or acquire locks/transactions.

### `--from-stdin` Flag

Only applies to `migrate:create`.

```bash
echo '{"upSQL":"ALTER TABLE...","downSQL":"ALTER TABLE..."}' | payload migrate:create my_migration --from-stdin
```

Stdin JSON schema:
- `upSQL` (string, required)
- `downSQL` (string, optional — defaults to `// Migration code`)
- `imports` (string, optional)

Behavior:
- Skips Drizzle schema diff — uses provided SQL verbatim
- Still writes schema snapshot `.json` from current Drizzle schema state. This is intentional: the snapshot represents "what Drizzle thinks the schema is now" and is needed for future diffs. If custom SQL diverges from the Drizzle schema, the next `migrate:create` will generate a diff that reconciles them. This matches how `--file` (predefined migrations) already works.
- Still generates timestamped filename and updates `index.ts`
- Migration name from args is required
- Empty/invalid stdin (malformed JSON, missing required `upSQL` field) exits with code 1

Mutually exclusive with `--file`. Passing both exits code 1 with error.

## Agent Workflow Examples

**Check if migration needed:**
```bash
payload migrate:create --dry-run --json --skipEmpty
# Parse JSON, check hasChanges
```

**Auto-create migration:**
```bash
payload migrate:create my_migration --json --forceAcceptWarning
# Parse JSON for filePath and SQL
```

**Create with custom SQL:**
```bash
echo '{"upSQL":"...","downSQL":"..."}' | payload migrate:create my_migration --from-stdin --json
```

**Run pending migrations:**
```bash
payload migrate --json --forceAcceptWarning
# Parse JSON for migrationsRan
```

**CI gate — fail if migration missing:**
```bash
payload migrate:create --dry-run --skipEmpty
# Exit code 2 = up to date, 0 = changes exist (migration needed!), 1 = error
```

## Type Changes

### `CreateMigration` return type

The `CreateMigration` type in `packages/payload/src/database/types.ts` changes from:

```typescript
export type CreateMigration = (args: {
  file?: string
  forceAcceptWarning?: boolean
  migrationName?: string
  payload: Payload
  skipEmpty?: boolean
}) => Promise<void> | void
```

To:

```typescript
export type MigrationCreateResult = {
  downSQL?: string
  filePath?: string
  hasChanges: boolean
  migrationName?: string
  schemaPath?: string
  status: 'created' | 'no-changes' | 'dry-run' | 'error'
  upSQL?: string
}

export type CreateMigration = (args: {
  dryRun?: boolean
  file?: string
  forceAcceptWarning?: boolean
  fromStdin?: string // raw JSON string from stdin
  json?: boolean
  migrationName?: string
  payload: Payload
  skipEmpty?: boolean
}) => Promise<MigrationCreateResult>
```

All adapter implementations (Drizzle `buildCreateMigration`, MongoDB `createMigration`) must be updated to return `MigrationCreateResult`. The caller in `packages/payload/src/bin/migrate.ts` handles JSON serialization and exit codes based on the result.

### `BaseDatabaseAdapter.migrate` type

The `migrate` method signature in `packages/payload/src/database/types.ts` must be extended:

```typescript
// Current
migrate: (args?: { migrations?: Migration[] }) => Promise<void>

// New
export type MigrateResult = {
  migrationsRan: Array<{ durationMs: number; name: string }>
  pending: number
  status: 'completed' | 'no-pending' | 'dry-run' | 'error'
}

migrate: (args?: {
  dryRun?: boolean
  forceAcceptWarning?: boolean
  json?: boolean
  migrations?: Migration[]
}) => Promise<MigrateResult>
```

`packages/payload/src/bin/migrate.ts` line 97 must pass `forceAcceptWarning`, `dryRun`, and `json` through to `adapter.migrate()`.

## Files to Modify

| File | Changes |
|------|---------|
| `packages/payload/src/bin/migrate.ts` | Parse new flags, pass to adapters, handle results, exit codes, stderr redirect |
| `packages/payload/src/database/types.ts` | Extend `CreateMigration` args/return type, extend `migrate` args/return type |
| `packages/drizzle/src/utilities/buildCreateMigration.ts` | Dry-run path, stdin reading, return `MigrationCreateResult` instead of void, exit code 2 |
| `packages/drizzle/src/migrate.ts` | Accept `forceAcceptWarning`/`dryRun`/`json` args, skip dev-mode prompt, dry-run path, return `MigrateResult` |
| `packages/payload/src/database/migrations/createMigration.ts` | MongoDB: same flags for parity, return `MigrationCreateResult` |

## New Files

| File | Purpose |
|------|---------|
| `packages/payload/src/database/migrations/types.ts` | Shared types for results and JSON output shapes |
| `packages/payload/src/utilities/jsonReporter.ts` | Collects data, writes JSON to stdout, redirects logger to stderr |

## Tests

Added to `test/database/migrations-cli.int.spec.ts`:

**`migrate:create` tests:**
- `--dry-run` reports changes exist without writing any files (verify dir is empty)
- `--dry-run` returns status `no-changes` when no schema diff
- `--dry-run --json` combined outputs valid JSON with `hasChanges` and SQL
- `--json` outputs valid JSON with all expected fields on creation
- `--from-stdin` creates migration from piped JSON with correct SQL in file
- `--from-stdin` with invalid JSON returns error result
- `--from-stdin` with missing `upSQL` field returns error result
- `--from-stdin --file` returns error (mutually exclusive)
- `--from-stdin --dry-run` returns error (mutually exclusive)
- `--skipEmpty` returns status `no-changes` (not success) when no schema diff
- `--json` error output has correct shape (`status: "error"`, `error` message)

**`migrate` tests:**
- `--json` outputs structured results with `migrationsRan` array
- `--dry-run` reports pending migrations without executing SQL
- `--forceAcceptWarning` skips dev-mode prompt (requires seeding a batch -1 record)

**Exit code testing approach:** Since `migrateCLI` calls `process.exit()` directly, tests must either mock `process.exit` via `vi.spyOn(process, 'exit').mockImplementation()` or the implementation should return the result and let the CLI entry point handle exit codes. The recommended approach is the latter — adapter methods return structured results, `migrate.ts` (bin) handles `process.exit` based on results. Tests call adapter methods directly via `migrateCLI` and assert on returned results.

## Documentation

Update `docs/database/migrations.mdx` with all new flags and agent workflow examples.

## Implementation Notes

**Logger redirection for `--json`:** The `prettySyncLogger` is configured at Payload init time (line 70-75 of `migrate.ts`). When `--json` is passed, the init must use a logger destination that writes to stderr instead of stdout. This is handled by passing a custom `loggerDestination` to `payload.init()` when `--json` is detected before init.

**MongoDB and `--dry-run`:** MongoDB does not have Drizzle schema diffs. For MongoDB, `migrate:create --dry-run` always returns `{status: "no-changes", hasChanges: false}` since MongoDB migrations are always blank templates. This is consistent — MongoDB users provide their own migration logic.

**`process.exit` elimination from adapters:** Currently `buildCreateMigration.ts` calls `process.exit(0)` in the no-changes path. This must be replaced with returning a `MigrationCreateResult` with `status: "no-changes"`. The `migrate.ts` (bin) caller handles the exit code. This is a cleaner separation and makes testing possible without mocking `process.exit`.

## Out of Scope

- `migrate:down`, `migrate:fresh`, `migrate:reset`, `migrate:refresh` (follow-up PR)
- Programmatic API changes beyond passing through new flags
- Changes to `db push` workflow

## PR Details

- **Title:** `feat: add agent-friendly flags to migrate:create and migrate commands`
- **Scope:** `packages/payload`, `packages/drizzle`, `packages/db-mongodb`
- **Conventional commit type:** `feat` (new CLI capabilities)
- **Breaking changes:** Exit code for "no changes" changes from 0 to 2 when using `--skipEmpty`. This is a bugfix-level change (the old behavior was incorrect for CI).
