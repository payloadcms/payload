# Agent-Friendly Migration CLI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add composable CLI flags (`--json`, `--dry-run`, `--from-stdin`) and meaningful exit codes to `migrate:create` and `migrate` commands so AI agents can reliably detect, create, and run migrations without interactive prompts.

**Architecture:** Adapter methods (`createMigration`, `migrate`) return structured result objects instead of void. The CLI entry point (`packages/payload/src/bin/migrate.ts`) handles JSON serialization, exit codes, and logger redirection based on flags. A thin `jsonReporter` utility handles JSON output to stdout.

**Tech Stack:** TypeScript, pino (logger), `prompts` library (existing), Node.js stdin streams

**Spec:** `docs/superpowers/specs/2026-03-11-agent-friendly-migrations-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/payload/src/database/types.ts` | Modify | Add `MigrationCreateResult`, `MigrateResult` types; update `CreateMigration` and `migrate` signatures |
| `packages/payload/src/utilities/jsonReporter.ts` | Create | Stderr logger destination + JSON stdout writer |
| `packages/payload/src/bin/migrate.ts` | Modify | Parse new flags, pass to adapters, handle results, exit codes, stderr redirect |
| `packages/drizzle/src/utilities/buildCreateMigration.ts` | Modify | Return `MigrationCreateResult`, dry-run path, stdin support, remove `process.exit` calls |
| `packages/drizzle/src/migrate.ts` | Modify | Accept new args, return `MigrateResult`, skip dev-mode prompt, dry-run path, remove `process.exit` calls |
| `packages/payload/src/database/migrations/createMigration.ts` | Modify | MongoDB adapter: return `MigrationCreateResult`, support new flags |
| `packages/payload/src/index.ts` | Modify | Export new result types |
| `test/database/migrations-cli.int.spec.ts` | Modify | Add tests for all new flags |
| `docs/database/migrations.mdx` | Modify | Document new flags and agent workflow examples |

---

## Chunk 1: Types and Foundation

### Task 1: Add result types to `packages/payload/src/database/types.ts`

**Files:**
- Modify: `packages/payload/src/database/types.ts:182-191`

- [ ] **Step 1: Add `MigrationCreateResult` type**

Add before the existing `CreateMigration` type at line 182:

```typescript
export type MigrationCreateResult = {
  downSQL?: string
  error?: string
  filePath?: string
  hasChanges: boolean
  migrationName?: string
  schemaPath?: string
  status: 'created' | 'dry-run' | 'error' | 'no-changes'
  upSQL?: string
}

export type MigrateResult = {
  error?: string
  migrationsRan: Array<{ durationMs: number; name: string }>
  pending: number
  status: 'completed' | 'dry-run' | 'error' | 'no-pending'
}
```

- [ ] **Step 2: Update `CreateMigration` type signature**

Replace the existing `CreateMigration` type (lines 182-191) with:

```typescript
export type CreateMigration = (args: {
  dryRun?: boolean
  file?: string
  forceAcceptWarning?: boolean
  fromStdin?: string
  migrationName?: string
  payload: Payload
  skipEmpty?: boolean
}) => Promise<MigrationCreateResult>
```

Note: `json` flag is NOT passed to adapters — the CLI entry point handles JSON serialization. `fromStdin` receives the raw JSON string already read from stdin.

- [ ] **Step 3: Update `migrate` method type on `BaseDatabaseAdapter`**

Find the `migrate` property on `BaseDatabaseAdapter` (line 92-95) and update:

```typescript
  /**
   * Run any migration up functions that have not yet been performed and update the status
   */
  migrate: (args?: {
    dryRun?: boolean
    forceAcceptWarning?: boolean
    migrations?: Migration[]
  }) => Promise<MigrateResult>
```

- [ ] **Step 4: Export new types from `packages/payload/src/index.ts`**

Find the existing migration exports (around line 1398) and add:

```typescript
export type { MigrationCreateResult, MigrateResult } from './database/types.js'
```

- [ ] **Step 5: Commit**

```bash
git add packages/payload/src/database/types.ts packages/payload/src/index.ts
git commit -m "feat: add MigrationCreateResult and MigrateResult types"
```

---

### Task 2: Create `jsonReporter` utility

**Files:**
- Create: `packages/payload/src/utilities/jsonReporter.ts`

- [ ] **Step 1: Create the jsonReporter utility**

```typescript
import { build } from 'pino-pretty'

/**
 * Logger destination that writes to stderr instead of stdout.
 * Used when --json flag is active so logger output doesn't
 * pollute the JSON response on stdout.
 */
export const stderrSyncLoggerDestination = build({
  colorize: true,
  destination: 2, // stderr
  ignore: 'pid,hostname',
  sync: true,
  translateTime: 'SYS:HH:MM:ss',
})

/**
 * Write a JSON result object to stdout. Used by migration CLI
 * when --json flag is active.
 */
export const writeJsonResult = (result: Record<string, unknown>): void => {
  process.stdout.write(JSON.stringify(result) + '\n')
}
```

- [ ] **Step 2: Export from payload index**

Add to `packages/payload/src/index.ts` near other utility exports:

```typescript
export { stderrSyncLoggerDestination, writeJsonResult } from './utilities/jsonReporter.js'
```

- [ ] **Step 3: Commit**

```bash
git add packages/payload/src/utilities/jsonReporter.ts packages/payload/src/index.ts
git commit -m "feat: add jsonReporter utility for stderr logger and JSON stdout"
```

---

## Chunk 2: Drizzle `createMigration` — return results, dry-run, stdin

### Task 3: Refactor `buildCreateMigration` to return results and remove `process.exit`

**Files:**
- Modify: `packages/drizzle/src/utilities/buildCreateMigration.ts`

- [ ] **Step 1: Update the import and function signature**

Replace the existing imports and destructured args:

```typescript
import type { DrizzleSnapshotJSON } from 'drizzle-kit/api'
import type { CreateMigration, MigrationCreateResult, Payload } from 'payload'

import fs from 'fs'
import path from 'path'
import { getPredefinedMigration, writeMigrationIndex } from 'payload'
import prompts from 'prompts'

import type { DrizzleAdapter } from '../types.js'

import { getMigrationTemplate } from './getMigrationTemplate.js'
```

Update the inner function signature to destructure new args and declare a return type:

```typescript
  return async function createMigration(
    this: DrizzleAdapter,
    { dryRun, file, forceAcceptWarning, fromStdin, migrationName, payload, skipEmpty },
  ): Promise<MigrationCreateResult> {
```

- [ ] **Step 2: Add stdin parsing at the top of the function body (after dir creation)**

Insert after the `fs.mkdirSync(dir)` block (line 30), before `requireDrizzleKit()`:

```typescript
    // Handle --from-stdin: parse JSON from stdin, skip schema diff
    if (fromStdin) {
      if (file) {
        return {
          error: '--from-stdin and --file are mutually exclusive',
          hasChanges: false,
          status: 'error',
        }
      }

      if (dryRun) {
        return {
          error: '--from-stdin and --dry-run are mutually exclusive',
          hasChanges: false,
          status: 'error',
        }
      }

      if (!migrationName) {
        return {
          error: 'Migration name is required when using --from-stdin',
          hasChanges: false,
          status: 'error',
        }
      }

      let stdinData: { downSQL?: string; imports?: string; upSQL?: string }

      try {
        stdinData = JSON.parse(fromStdin)
      } catch {
        return {
          error: 'Invalid JSON provided via --from-stdin',
          hasChanges: false,
          status: 'error',
        }
      }

      if (!stdinData.upSQL) {
        return {
          error: 'Missing required "upSQL" field in --from-stdin JSON',
          hasChanges: false,
          status: 'error',
        }
      }

      const { generateDrizzleJson } = this.requireDrizzleKit()
      const drizzleJsonAfter = await generateDrizzleJson(this.schema)

      const [yyymmdd, hhmmss] = new Date().toISOString().split('T')
      const formattedDate = yyymmdd.replace(/\D/g, '')
      const formattedTime = hhmmss.split('.')[0].replace(/\D/g, '')
      const timestamp = `${formattedDate}_${formattedTime}`
      const fileName = `${timestamp}_${migrationName.replace(/\W/g, '_')}`
      const filePath = `${dir}/${fileName}`

      // Write schema snapshot for future diffs
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(drizzleJsonAfter, null, 2))

      const data = getMigrationTemplate({
        downSQL: stdinData.downSQL || `  // Migration code`,
        imports: stdinData.imports || '',
        packageName: payload.db.packageName,
        upSQL: stdinData.upSQL,
      })

      const fullPath = `${filePath}.ts`
      fs.writeFileSync(fullPath, data)

      writeMigrationIndex({ migrationsDir: payload.db.migrationDir })

      payload.logger.info({ msg: `Migration created at ${fullPath}` })

      return {
        downSQL: stdinData.downSQL,
        filePath: fullPath,
        hasChanges: true,
        migrationName: fileName,
        schemaPath: `${filePath}.json`,
        status: 'created',
        upSQL: stdinData.upSQL,
      }
    }
```

- [ ] **Step 3: Replace the no-changes block with return-based flow**

Replace the existing no-changes block (lines 118-140 in original):

```typescript
      if (!upSQL?.length && !downSQL?.length) {
        if (skipEmpty || forceAcceptWarning) {
          if (dryRun) {
            return { hasChanges: false, status: 'dry-run' }
          }

          if (!forceAcceptWarning) {
            // skipEmpty without forceAcceptWarning: no changes, exit
            return { hasChanges: false, status: 'no-changes' }
          }

          // forceAcceptWarning: fall through to create blank migration
        } else {
          const { confirm: shouldCreateBlankMigration } = await prompts(
            {
              name: 'confirm',
              type: 'confirm',
              initial: false,
              message:
                'No schema changes detected. Would you like to create a blank migration file?',
            },
            {
              onCancel: () => {
                process.exit(0)
              },
            },
          )

          if (!shouldCreateBlankMigration) {
            return { hasChanges: false, status: 'no-changes' }
          }
        }
      }
```

- [ ] **Step 4: Add dry-run return before file writes (inside the `if (!upSQL)` block)**

This dry-run check lives INSIDE the `if (!upSQL)` block — it handles the case where we ran the schema diff and need to return the result without writing files. Insert after the no-changes check block, replacing the existing schema write:

```typescript
      // Dry-run inside schema diff path: return generated SQL without writing files
      if (dryRun) {
        return {
          downSQL: downSQL || undefined,
          hasChanges: !!(upSQL?.length || downSQL?.length),
          status: 'dry-run',
          upSQL: upSQL || undefined,
        }
      }

      // write schema
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(drizzleJsonAfter, null, 2))
```

This replaces the existing `fs.writeFileSync` for the schema snapshot (line 143 in original). Close the `if (!upSQL)` block here as before.

- [ ] **Step 5: Update the end of the function to return result**

Replace the final section (from `getMigrationTemplate` to end). Note: there is NO second dry-run check here — the predefined migration path (`--file` flag) does not support `--dry-run` since it always writes files. The dry-run return in Step 4 handles the schema-diff path.

```typescript
    const data = getMigrationTemplate({
      downSQL: downSQL || `  // Migration code`,
      imports,
      packageName: payload.db.packageName,
      upSQL: upSQL || `  // Migration code`,
    })

    const fullPath = `${filePath}.ts`

    // write migration
    fs.writeFileSync(fullPath, data)

    writeMigrationIndex({ migrationsDir: payload.db.migrationDir })

    payload.logger.info({ msg: `Migration created at ${fullPath}` })

    return {
      downSQL: downSQL || undefined,
      filePath: fullPath,
      hasChanges: !!(upSQL?.length || downSQL?.length),
      migrationName: fileName,
      schemaPath: `${filePath}.json`,
      status: 'created',
      upSQL: upSQL || undefined,
    }
```

- [ ] **Step 6: Verify the complete function compiles**

Run: `cd /Users/markkropf/Developer/lib/payload && pnpm run build:drizzle 2>&1 | tail -20`

Expected: Build succeeds (there may be type errors in consumers, which is fine — we fix those next).

- [ ] **Step 7: Commit**

```bash
git add packages/drizzle/src/utilities/buildCreateMigration.ts
git commit -m "feat(drizzle): return MigrationCreateResult from createMigration, add dry-run and stdin support"
```

---

## Chunk 3: Drizzle `migrate` — return results, forceAcceptWarning, dry-run

### Task 4: Refactor `packages/drizzle/src/migrate.ts`

**Files:**
- Modify: `packages/drizzle/src/migrate.ts`

- [ ] **Step 1: Update imports and function signature**

Update the imports to include `MigrateResult`:

```typescript
import type { MigrateResult } from 'payload'
```

Update the function signature:

```typescript
export const migrate: DrizzleAdapter['migrate'] = async function migrate(
  this: DrizzleAdapter,
  args,
): Promise<MigrateResult> {
```

- [ ] **Step 2: Add early return for no migration files**

Replace the early return (lines 25-28):

```typescript
  if (!migrationFiles.length) {
    payload.logger.info({ msg: 'No migrations to run.' })
    return { migrationsRan: [], pending: 0, status: 'no-pending' }
  }
```

- [ ] **Step 3: Replace dev-mode prompt with forceAcceptWarning check**

Replace the prompts block (lines 46-68):

```typescript
    if (migrationsInDB.find((m) => m.batch === -1)) {
      if (args?.forceAcceptWarning) {
        // Skip prompt, proceed with migration
        migrationsInDB = migrationsInDB.filter((m) => m.batch !== -1)
      } else {
        const { confirm: runMigrations } = await prompts(
          {
            name: 'confirm',
            type: 'confirm',
            initial: false,
            message:
              "It looks like you've run Payload in dev mode, meaning you've dynamically pushed changes to your database.\n\n" +
              "If you'd like to run migrations, data loss will occur. Would you like to proceed?",
          },
          {
            onCancel: () => {
              process.exit(0)
            },
          },
        )

        if (!runMigrations) {
          process.exit(0)
        }
        migrationsInDB = migrationsInDB.filter((m) => m.batch !== -1)
      }
    }
```

- [ ] **Step 4: Add dry-run path and collect results**

Replace the migration execution loop (lines 75-87) with:

```typescript
  const newBatch = latestBatch + 1
  const migrationsRan: Array<{ durationMs: number; name: string }> = []

  // Determine which migrations need to run
  const pendingMigrations = migrationFiles.filter(
    (migration) => !migrationsInDB.find((existing) => existing.name === migration.name),
  )

  if (args?.dryRun) {
    return {
      migrationsRan: [],
      pending: pendingMigrations.length,
      status: 'dry-run',
    }
  }

  if (!pendingMigrations.length) {
    payload.logger.info({ msg: 'No migrations to run.' })
    return { migrationsRan: [], pending: 0, status: 'no-pending' }
  }

  // Execute 'up' function for each migration sequentially
  for (const migration of pendingMigrations) {
    const result = await runMigrationFile(payload, migration, newBatch)
    migrationsRan.push(result)
  }

  return { migrationsRan, pending: 0, status: 'completed' }
```

- [ ] **Step 5: Update `runMigrationFile` to return result instead of `process.exit`**

Replace the `runMigrationFile` function:

```typescript
async function runMigrationFile(
  payload: Payload,
  migration: Migration,
  batch: number,
): Promise<{ durationMs: number; name: string }> {
  const start = Date.now()
  const req = await createLocalReq({}, payload)

  payload.logger.info({ msg: `Migrating: ${migration.name}` })

  try {
    await initTransaction(req)
    const db = await getTransaction(payload.db as DrizzleAdapter, req)
    await migration.up({ db, payload, req })
    const durationMs = Date.now() - start
    payload.logger.info({ msg: `Migrated:  ${migration.name} (${durationMs}ms)` })
    await payload.create({
      collection: 'payload-migrations',
      data: {
        name: migration.name,
        batch,
      },
      req,
    })
    await commitTransaction(req)
    return { durationMs, name: migration.name }
  } catch (err: unknown) {
    await killTransaction(req)
    const errorMsg = parseError(err, `Error running migration ${migration.name}`)
    payload.logger.error({
      err,
      msg: errorMsg,
    })
    throw new Error(errorMsg)
  }
}
```

Note: We throw instead of `process.exit(1)`. The CLI entry point catches this and handles exit codes.

- [ ] **Step 6: Verify the module compiles**

Run: `cd /Users/markkropf/Developer/lib/payload && pnpm run build:drizzle 2>&1 | tail -20`

- [ ] **Step 7: Commit**

```bash
git add packages/drizzle/src/migrate.ts
git commit -m "feat(drizzle): return MigrateResult from migrate, add forceAcceptWarning and dry-run"
```

---

## Chunk 4: MongoDB adapter parity

### Task 5: Update MongoDB `createMigration` to return results

**Files:**
- Modify: `packages/payload/src/database/migrations/createMigration.ts`

- [ ] **Step 1: Update MongoDB createMigration to return MigrationCreateResult**

Replace entire file:

```typescript
import fs from 'fs'

import type { CreateMigration, MigrationCreateResult } from '../types.js'

import { writeMigrationIndex } from '../../index.js'
import { migrationTemplate } from './migrationTemplate.js'

export const createMigration: CreateMigration = function createMigration({
  dryRun,
  fromStdin,
  migrationName,
  payload,
}): Promise<MigrationCreateResult> {
  // MongoDB has no schema diffs — dry-run always reports no changes
  if (dryRun) {
    return Promise.resolve({ hasChanges: false, status: 'no-changes' })
  }

  const dir = payload.db.migrationDir
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }

  const [yyymmdd, hhmmss] = new Date().toISOString().split('T')
  const formattedDate = yyymmdd!.replace(/\D/g, '')
  const formattedTime = hhmmss!.split('.')[0]!.replace(/\D/g, '')

  const timestamp = `${formattedDate}_${formattedTime}`

  const formattedName = migrationName!.replace(/\W/g, '_')
  const fileName = `${timestamp}_${formattedName}`
  const filePath = `${dir}/${fileName}.ts`

  let migrationContent = migrationTemplate

  // Handle --from-stdin for MongoDB: use provided content instead of blank template
  if (fromStdin) {
    try {
      const stdinData = JSON.parse(fromStdin)
      if (!stdinData.upSQL) {
        return Promise.resolve({
          error: 'Missing required "upSQL" field in --from-stdin JSON',
          hasChanges: false,
          status: 'error',
        })
      }
      // For MongoDB, we write the up/down SQL into the template directly
      migrationContent = migrationTemplate
        .replace('// Migration code', stdinData.upSQL)
      // Note: MongoDB migration template is simpler than Drizzle's
    } catch {
      return Promise.resolve({
        error: 'Invalid JSON provided via --from-stdin',
        hasChanges: false,
        status: 'error',
      })
    }
  }

  fs.writeFileSync(filePath, migrationContent)

  writeMigrationIndex({ migrationsDir: payload.db.migrationDir })

  payload.logger.info({ msg: `Migration created at ${filePath}` })

  return Promise.resolve({
    filePath,
    hasChanges: false,
    migrationName: fileName,
    status: 'created',
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/payload/src/database/migrations/createMigration.ts
git commit -m "feat(db-mongodb): return MigrationCreateResult from createMigration"
```

---

## Chunk 5: CLI entry point — flag parsing, JSON output, exit codes

### Task 6: Update `packages/payload/src/bin/migrate.ts`

**Files:**
- Modify: `packages/payload/src/bin/migrate.ts`

- [ ] **Step 1: Add imports and stdin reader**

Add at the top of the file, after existing imports:

```typescript
import { stderrSyncLoggerDestination, writeJsonResult } from '../utilities/jsonReporter.js'
```

Add a helper function after the `prettySyncLogger` const:

```typescript
/**
 * Read all data from stdin. Returns empty string if stdin is a TTY (no pipe).
 */
async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return ''
  }

  const chunks: Buffer[] = []

  return new Promise((resolve) => {
    process.stdin.on('data', (chunk) => chunks.push(chunk))
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8').trim()))
    process.stdin.on('error', () => resolve(''))
  })
}
```

- [ ] **Step 2: Parse new flags**

After the existing `skipEmpty` line (line 59), add:

```typescript
  const json = formattedArgs.includes('json')
  const dryRun = formattedArgs.includes('dryRun')
  const fromStdinFlag = formattedArgs.includes('fromStdin')
```

- [ ] **Step 3: Redirect logger to stderr when `--json` is active**

The `InitOptions` type does NOT support `loggerDestination` — the existing `prettySyncLogger` spread in `migrate.ts` is dead code (silently ignored). Instead, reassign `payload.logger` after init.

Replace the `payload.init` block (lines 67-75) with:

```typescript
  process.env.PAYLOAD_MIGRATING = 'true'

  // Barebones instance to access database adapter
  await payload.init({
    config,
    disableDBConnect: args[0] === 'migrate:create',
    disableOnInit: true,
  })

  // When --json is active, redirect logger to stderr so JSON output on stdout is clean
  if (json) {
    const { pino } = await import('pino')
    payload.logger = pino(stderrSyncLoggerDestination)
  }
```

Note: This also removes the dead `...prettySyncLogger` spread. The existing logger from `config.logger` is used by default (set up in `payload.init` at line 818 of `index.ts`). We only override when `--json` needs stderr.

- [ ] **Step 4: Update `migrate:create` case to handle new flags and results**

Replace the `migrate:create` case (lines 99-111):

```typescript
    case 'migrate:create':
      try {
        let fromStdin: string | undefined

        if (fromStdinFlag) {
          fromStdin = await readStdin()
          if (!fromStdin) {
            if (json) {
              writeJsonResult({ error: 'No data received on stdin', hasChanges: false, status: 'error' })
            }
            payload.logger.error({ msg: 'No data received on stdin. Pipe JSON to stdin when using --from-stdin.' })
            process.exit(1)
          }
        }

        const result = await adapter.createMigration({
          dryRun,
          file,
          forceAcceptWarning,
          fromStdin,
          migrationName: args[1],
          payload,
          skipEmpty,
        })

        if (json) {
          writeJsonResult(result)
        }

        if (result.status === 'error') {
          process.exit(1)
        }

        if (result.status === 'no-changes') {
          process.exit(2)
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error'
        if (json) {
          writeJsonResult({ error, hasChanges: false, status: 'error' })
        }
        throw new Error(`Error creating migration: ${error}`)
      }
      break
```

- [ ] **Step 5: Update `migrate` case to pass new flags and handle results**

Replace the `migrate` case (lines 96-98):

```typescript
    case 'migrate':
      try {
        const result = await adapter.migrate({
          dryRun,
          forceAcceptWarning,
        })

        if (json) {
          writeJsonResult(result)
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error'
        if (json) {
          writeJsonResult({ error, migrationsRan: [], pending: 0, status: 'error' })
        }
        payload.logger.error({ msg: error })
        process.exit(1)
      }
      break
```

- [ ] **Step 6: Verify the module compiles**

Run: `cd /Users/markkropf/Developer/lib/payload && pnpm run build:core 2>&1 | tail -30`

- [ ] **Step 7: Commit**

```bash
git add packages/payload/src/bin/migrate.ts packages/payload/src/utilities/jsonReporter.ts
git commit -m "feat: wire up --json, --dry-run, --from-stdin flags in migration CLI"
```

---

## Chunk 6: Tests

### Task 7: Add `migrate:create` tests

**Files:**
- Modify: `test/database/migrations-cli.int.spec.ts`

All tests use `migrateCLI` from `payload` which calls the CLI entry point directly with `parsedArgs`. Tests assert on structured results by capturing them from the adapter — since the CLI now returns results before calling `process.exit`, we can spy on `process.exit` and verify behavior.

- [ ] **Step 1: Add `--dry-run` test that reports changes without writing files**

Add to the existing `describe('migrations CLI')` block:

```typescript
  it('should report changes with --dry-run without writing files', async () => {
    const config = await configPromise

    // First create a baseline migration so there's a schema diff
    await migrateCLI({
      config,
      migrationDir,
      parsedArgs: {
        _: ['migrate:create', 'baseline'],
        forceAcceptWarning: true,
      },
    })

    // Now dry-run should report no new changes (schema matches latest snapshot)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    try {
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'test_dry_run'],
          dryRun: true,
          skipEmpty: true,
        },
      })
    } catch {
      // process.exit(2) expected for no-changes
    }

    // Verify no new migration files written (only baseline + index)
    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

    expect(migrationFiles.length).toBe(1) // only the baseline

    exitSpy.mockRestore()
  })
```

- [ ] **Step 2: Add `--from-stdin` test**

```typescript
  it('should create migration from --from-stdin JSON', async () => {
    const config = await configPromise

    const stdinJSON = JSON.stringify({
      downSQL: '  await db.execute(sql`DROP TABLE IF EXISTS "test_table";`)',
      upSQL: '  await db.execute(sql`CREATE TABLE "test_table" ("id" serial PRIMARY KEY);`)',
    })

    await migrateCLI({
      config,
      migrationDir,
      parsedArgs: {
        _: ['migrate:create', 'from_stdin_test'],
        forceAcceptWarning: true,
        fromStdin: stdinJSON,
      },
    })

    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

    expect(migrationFiles.length).toBe(1)

    const content = fs.readFileSync(path.join(migrationDir, migrationFiles[0]!), 'utf8')

    expect(content).toContain('CREATE TABLE "test_table"')
    expect(content).toContain('DROP TABLE IF EXISTS "test_table"')
  })
```

- [ ] **Step 3: Add `--from-stdin` with invalid JSON test**

```typescript
  it('should return error for --from-stdin with invalid JSON', async () => {
    const config = await configPromise

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    try {
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'bad_json'],
          forceAcceptWarning: true,
          fromStdin: 'not valid json{{{',
        },
      })
    } catch {
      // Expected: process.exit(1) for error
    }

    // No migration files should be created
    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

    expect(migrationFiles.length).toBe(0)

    exitSpy.mockRestore()
  })
```

- [ ] **Step 4: Add `--from-stdin` with missing upSQL test**

```typescript
  it('should return error for --from-stdin missing upSQL', async () => {
    const config = await configPromise

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    try {
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'missing_upsql'],
          forceAcceptWarning: true,
          fromStdin: JSON.stringify({ downSQL: 'DROP TABLE foo;' }),
        },
      })
    } catch {
      // Expected: process.exit(1) for error
    }

    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

    expect(migrationFiles.length).toBe(0)

    exitSpy.mockRestore()
  })
```

- [ ] **Step 5: Add mutually exclusive flags test**

```typescript
  it('should return error when --from-stdin and --file are both provided', async () => {
    const config = await configPromise

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    try {
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'conflict_test'],
          file: '/some/path.ts',
          forceAcceptWarning: true,
          fromStdin: JSON.stringify({ upSQL: 'SELECT 1;' }),
        },
      })
    } catch {
      // Expected error
    }

    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

    expect(migrationFiles.length).toBe(0)

    exitSpy.mockRestore()
  })
```

- [ ] **Step 6: Add `--from-stdin --dry-run` mutually exclusive test**

```typescript
  it('should return error when --from-stdin and --dry-run are both provided', async () => {
    const config = await configPromise

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    try {
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'stdin_dryrun'],
          dryRun: true,
          forceAcceptWarning: true,
          fromStdin: JSON.stringify({ upSQL: 'SELECT 1;' }),
        },
      })
    } catch {
      // Expected error
    }

    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.ts') && !f.startsWith('index'))

    expect(migrationFiles.length).toBe(0)

    exitSpy.mockRestore()
  })
```

- [ ] **Step 7: Add `--skipEmpty` exit code 2 test**

```typescript
  it('should exit with code 2 when --skipEmpty and no schema changes', async () => {
    const config = await configPromise

    // Create baseline so schema is in sync
    await migrateCLI({
      config,
      migrationDir,
      parsedArgs: {
        _: ['migrate:create', 'baseline'],
        forceAcceptWarning: true,
      },
    })

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`)
    })

    try {
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'should_be_empty'],
          skipEmpty: true,
        },
      })
    } catch (err) {
      // Verify exit code 2 (no changes), not 0
      expect((err as Error).message).toContain('process.exit(2)')
    }

    exitSpy.mockRestore()
  })
```

- [ ] **Step 8: Add `--json --dry-run` combined test**

```typescript
  it('should output valid JSON with --json --dry-run combined', async () => {
    const config = await configPromise

    // Capture stdout
    const stdoutChunks: string[] = []
    const originalWrite = process.stdout.write
    process.stdout.write = (chunk: string | Uint8Array) => {
      stdoutChunks.push(chunk.toString())
      return true
    }

    // Create baseline first
    await migrateCLI({
      config,
      migrationDir,
      parsedArgs: {
        _: ['migrate:create', 'json_baseline'],
        forceAcceptWarning: true,
      },
    })

    stdoutChunks.length = 0 // Clear baseline output

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })

    try {
      await migrateCLI({
        config,
        migrationDir,
        parsedArgs: {
          _: ['migrate:create', 'json_dry_run'],
          dryRun: true,
          json: true,
          skipEmpty: true,
        },
      })
    } catch {
      // exit expected
    }

    process.stdout.write = originalWrite
    exitSpy.mockRestore()

    // Find the JSON line in stdout
    const jsonLine = stdoutChunks.find((c) => c.startsWith('{'))
    expect(jsonLine).toBeDefined()

    const result = JSON.parse(jsonLine!)

    expect(result.status).toBe('dry-run')
    expect(typeof result.hasChanges).toBe('boolean')
  })
```

- [ ] **Step 9: Run tests**

Run: `cd /Users/markkropf/Developer/lib/payload && pnpm run test:int migrations-cli 2>&1 | tail -40`

Expected: All new tests pass alongside existing tests.

- [ ] **Step 10: Commit**

```bash
git add test/database/migrations-cli.int.spec.ts
git commit -m "test: add tests for --dry-run, --from-stdin, mutually exclusive flags, and exit codes"
```

---

## Chunk 7: Documentation

### Task 8: Update migration docs

**Files:**
- Modify: `docs/database/migrations.mdx`

- [ ] **Step 1: Find the existing CLI flags section in migrations.mdx**

Read the file and locate where `--skip-empty` and `--force-accept-warning` are documented.

- [ ] **Step 2: Add new flags documentation**

Add a new section after the existing flags documentation. The exact content:

```markdown
### Agent & CI Flags

These flags make migration commands work in non-interactive environments like AI agents, CI pipelines, and automation scripts.

#### `--json`

Output structured JSON to stdout instead of human-readable logs. Logger output is redirected to stderr so it doesn't interfere with JSON parsing.

Works with: `migrate:create`, `migrate`

```bash
# Check if migration is needed
payload migrate:create --dry-run --json --skip-empty
# Output: {"status":"dry-run","hasChanges":true,"upSQL":"ALTER TABLE...","downSQL":"ALTER TABLE..."}

# Create migration and capture result
payload migrate:create my_migration --json --force-accept-warning
# Output: {"status":"created","filePath":"...","migrationName":"...","upSQL":"...","downSQL":"...","hasChanges":true}

# Run migrations and capture result
payload migrate --json --force-accept-warning
# Output: {"status":"completed","migrationsRan":[{"name":"...","durationMs":42}],"pending":0}
```

#### `--dry-run`

Preview what would happen without making changes. For `migrate:create`, generates the schema diff without writing files. For `migrate`, reports pending migrations without executing them.

Works with: `migrate:create`, `migrate`

```bash
# Check if schema changes need a migration
payload migrate:create --dry-run --skip-empty
# Exit code 0 = changes detected, 2 = no changes, 1 = error

# Check for pending migrations
payload migrate --dry-run
```

#### `--from-stdin`

Read migration SQL from stdin as JSON instead of auto-generating from schema diff. Useful for AI agents that want to provide custom or modified SQL.

Works with: `migrate:create`

```bash
echo '{"upSQL":"  await db.execute(sql`ALTER TABLE ...`)","downSQL":"  await db.execute(sql`ALTER TABLE ...`)"}' \
  | payload migrate:create my_migration --from-stdin
```

The JSON object accepts:
- `upSQL` (required) - The up migration code
- `downSQL` (optional) - The down migration code
- `imports` (optional) - Additional import statements

Cannot be combined with `--file` or `--dry-run`.

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success — migration created or executed |
| 1 | Error — invalid args, config error, or execution failure |
| 2 | No changes — `migrate:create` found no schema diff (with `--skip-empty`) |

### Agent Workflow Examples

**CI gate to ensure migrations are up to date:**
```bash
payload migrate:create --dry-run --skip-empty
# Exit code 2 means schema is in sync
# Exit code 0 means a migration is needed — fail the CI check
```

**Full agent workflow:**
```bash
# 1. Check if changes need a migration
result=$(payload migrate:create --dry-run --json --skip-empty)

# 2. If changes detected, create the migration
if echo "$result" | jq -e '.hasChanges' > /dev/null; then
  payload migrate:create my_feature --json --force-accept-warning
fi

# 3. Run pending migrations
payload migrate --json --force-accept-warning
```

- [ ] **Step 3: Commit**

```bash
git add docs/database/migrations.mdx
git commit -m "docs: add agent & CI flags documentation for migrations"
```

---

## Chunk 8: Final verification and cleanup

### Task 9: End-to-end verification

- [ ] **Step 1: Build all affected packages**

Run: `cd /Users/markkropf/Developer/lib/payload && pnpm run build:core 2>&1 | tail -30`

Expected: Clean build with no errors.

- [ ] **Step 2: Run the full migration test suite**

Run: `cd /Users/markkropf/Developer/lib/payload && pnpm run test:int migrations-cli 2>&1 | tail -40`

Expected: All tests pass.

- [ ] **Step 3: Run the database integration tests**

Run: `cd /Users/markkropf/Developer/lib/payload && pnpm run test:int database 2>&1 | tail -40`

Expected: All existing migration tests still pass (no regressions).

- [ ] **Step 4: Run linter**

Run: `cd /Users/markkropf/Developer/lib/payload && pnpm run lint 2>&1 | tail -20`

Expected: No new lint errors.

- [ ] **Step 5: Final commit with any fixups**

If any issues were found in steps 1-4, fix them and commit:

```bash
git add -A
git commit -m "chore: fix lint and type issues from agent-friendly migration flags"
```

- [ ] **Step 6: Verify git log shows clean history**

Run: `git log --oneline -10`

Expected commits in order:
1. `feat: add MigrationCreateResult and MigrateResult types`
2. `feat: add jsonReporter utility for stderr logger and JSON stdout`
3. `feat(drizzle): return MigrationCreateResult from createMigration, add dry-run and stdin support`
4. `feat(drizzle): return MigrateResult from migrate, add forceAcceptWarning and dry-run`
5. `feat(db-mongodb): return MigrationCreateResult from createMigration`
6. `feat: wire up --json, --dry-run, --from-stdin flags in migration CLI`
7. `test: add tests for --dry-run, --from-stdin, and mutually exclusive flags`
8. `docs: add agent & CI flags documentation for migrations`
