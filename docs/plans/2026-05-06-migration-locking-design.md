# Migration Locking Design

## Overview

Prevent race conditions when multiple Payload instances attempt to run migrations simultaneously in horizontally scaled deployments. This design implements a database-agnostic locking mechanism using Payload's global API.

## Problem Statement

In multi-instance deployments (Kubernetes, ECS, multiple Lambda cold starts), multiple instances can start simultaneously and attempt to run migrations concurrently. This creates race conditions:

1. Multiple instances check for pending migrations
2. All instances see the same pending migrations
3. All instances attempt to run the same migrations
4. Database deadlocks or duplicate errors occur

Current code in `/packages/drizzle/src/migrate.ts:78-87` has a time-of-check-to-time-of-use (TOCTOU) vulnerability where the "already ran" check happens outside the transaction.

## Design Goals

- **Database-agnostic**: Works across MongoDB, Postgres, SQLite, and all supported adapters
- **Transaction-based**: Leverages existing transaction infrastructure for atomicity
- **Graceful degradation**: Falls back to current behavior when transactions are disabled
- **Debuggable**: Provides visibility into lock state for troubleshooting
- **Safe**: Auto-detects and clears stale locks from crashed instances

## Architecture

### 1. Lock Global Schema

Create a new global `payload-migrations-lock` to store singleton lock state:

```typescript
{
  slug: 'payload-migrations-lock',
  admin: { hidden: true },
  endpoints: false,
  graphQL: false,
  fields: [
    {
      name: 'locked',
      type: 'checkbox',
      // Whether migrations are currently running
    },
    {
      name: 'locked_by',
      type: 'text',
      // UUID of instance holding the lock
    },
    {
      name: 'locked_at',
      type: 'date',
      // When lock was acquired
    },
    {
      name: 'expires_at',
      type: 'date',
      // When lock expires (for stale lock detection)
    },
  ],
}
```

**Why a global?**

- Globals are designed for singleton data
- Simpler API than managing a collection with a single document
- Automatic initialization

### 2. Lock Acquisition Logic

New utility: `/packages/drizzle/src/utilities/acquireMigrationLock.ts`

```typescript
interface AcquireLockResult {
  acquired: boolean
  instanceId: string
}

async function acquireMigrationLock({
  payload,
  req,
  timeout = 300000, // 5 minutes default
}: {
  payload: Payload
  req: PayloadRequest
  timeout?: number
}): Promise<AcquireLockResult>
```

**Algorithm:**

1. Check if transactions are available (`payload.db.beginTransaction`)

   - If not available: Log warning, return `{ acquired: true, instanceId: 'no-lock' }`
   - This allows operation in non-transactional environments with documented limitations

2. Generate instance ID: `crypto.randomUUID()`

3. Start transaction: `await initTransaction(req)`

4. Read current lock state: `await payload.findGlobal({ slug: 'payload-migrations-lock', req })`

5. Check if locked: `lock.locked && lock.expires_at > now()`

   - If locked: `await killTransaction(req)`, return `{ acquired: false, instanceId }`

6. If stale lock detected (`lock.locked && lock.expires_at <= now()`):

   - Log warning including previous `locked_by` value for debugging

7. Update global:

   ```typescript
   await payload.updateGlobal({
     slug: 'payload-migrations-lock',
     data: {
       locked: true,
       locked_by: instanceId,
       locked_at: new Date(),
       expires_at: new Date(Date.now() + timeout),
     },
     req,
   })
   ```

8. Commit transaction: `await commitTransaction(req)`

9. Return `{ acquired: true, instanceId }`

**Error handling:** Always call `killTransaction(req)` before throwing

**Why transactions?**

- Ensures atomic read-check-update operation
- Prevents race condition between steps 4-7
- Existing migration code already requires transactions

### 3. Lock Release Logic

New utility: `/packages/drizzle/src/utilities/releaseMigrationLock.ts`

```typescript
async function releaseMigrationLock({
  payload,
  req,
  instanceId,
}: {
  payload: Payload
  req: PayloadRequest
  instanceId: string
}): Promise<void>
```

**Algorithm:**

1. If `instanceId === 'no-lock'`: Skip (no transaction support)

2. Update global:

   ```typescript
   await payload.updateGlobal({
     slug: 'payload-migrations-lock',
     data: { locked: false },
   })
   ```

3. Log release with instanceId

**Notes:**

- Don't clear `locked_by`, `locked_at` - preserve for debugging
- No transaction needed for release (simple update)
- Idempotent (safe to call multiple times)

### 4. Integration into migrate.ts

Modify `/packages/drizzle/src/migrate.ts` to wrap migration process:

```typescript
export const migrate: DrizzleAdapter['migrate'] = async function migrate(
  this: DrizzleAdapter,
  args,
): Promise<void> {
  const { payload } = this
  const migrationFiles =
    args?.migrations || (await readMigrationFiles({ payload }))

  if (!migrationFiles.length) {
    payload.logger.info({ msg: 'No migrations to run.' })
    return
  }

  // Create request context for lock operations
  const lockReq = await createLocalReq({}, payload)

  // Try to acquire migration lock
  const { acquired, instanceId } = await acquireMigrationLock({
    payload,
    req: lockReq,
    timeout: 300000, // 5 minutes
  })

  if (!acquired) {
    payload.logger.info({
      msg: 'Another instance is running migrations. Skipping.',
    })
    return
  }

  payload.logger.info({
    msg: 'Acquired migration lock',
    instanceId,
  })

  try {
    // All existing migration logic stays here unchanged
    // ...
  } finally {
    // Always release lock, even on error
    await releaseMigrationLock({ payload, req: lockReq, instanceId })
    payload.logger.info({ msg: 'Released migration lock', instanceId })
  }
}
```

**Key points:**

- Lock acquired before checking migrations
- Lock held for entire migration batch
- Lock always released via `finally` block
- Separate request context for lock operations
- Non-blocking: if unavailable, instance exits gracefully

### 5. CLI Commands

#### migrate:status Enhancement

Enhance existing `migrate:status` command in `/packages/payload/src/bin/migrate.ts`:

```typescript
program
  .command('migrate:status')
  .description('Show migration status and lock state')
  .action(async () => {
    const payload = await getPayload({ config: await importConfig() })

    // Existing migration status output
    await payload.db.migrateStatus()

    // Add lock status
    const lock = await payload.findGlobal({
      slug: 'payload-migrations-lock',
    })

    console.log('\nMigration Lock Status:')
    console.log(`  Locked: ${lock.locked ? 'Yes' : 'No'}`)
    if (lock.locked) {
      console.log(`  Locked by: ${lock.locked_by}`)
      console.log(`  Locked at: ${lock.locked_at}`)
      console.log(`  Expires at: ${lock.expires_at}`)
      console.log(
        `  Status: ${lock.expires_at > new Date() ? 'Active' : 'STALE'}`,
      )
    }

    process.exit(0)
  })
```

#### migrate:unlock Command

New command to force release stuck locks:

```typescript
program
  .command('migrate:unlock')
  .description('Force release the migration lock')
  .action(async () => {
    const payload = await getPayload({
      config: await importConfig(),
      disableOnInit: true,
    })

    const lock = await payload.findGlobal({
      slug: 'payload-migrations-lock',
    })

    if (!lock.locked) {
      payload.logger.info({ msg: 'Migration lock is not currently held' })
      process.exit(0)
    }

    await payload.updateGlobal({
      slug: 'payload-migrations-lock',
      data: { locked: false },
    })

    payload.logger.info({
      msg: 'Migration lock forcibly released',
      was_locked_by: lock.locked_by,
    })
    process.exit(0)
  })
```

**Usage:**

```bash
# Check lock status
payload migrate:status

# Force unlock if stuck
payload migrate:unlock
```

## File Structure

New files:

- `/packages/payload/src/database/migrations/migrationsLockGlobal.ts` - Lock global definition
- `/packages/drizzle/src/utilities/acquireMigrationLock.ts` - Lock acquisition logic
- `/packages/drizzle/src/utilities/releaseMigrationLock.ts` - Lock release logic

Modified files:

- `/packages/drizzle/src/migrate.ts` - Add locking wrapper
- `/packages/payload/src/bin/migrate.ts` - Add CLI commands

## Testing Strategy

### Unit Tests

New file: `/packages/drizzle/src/utilities/migrationLock.spec.ts`

Test scenarios:

- Successful lock acquisition
- Failed acquisition when already locked
- Successful acquisition when lock is stale
- No-transaction scenario (graceful fallback)
- Lock release
- Transaction rollback on error

### Integration Tests

New suite or enhance existing: `/test/migrations/int.spec.ts`

Test scenarios:

- Two instances attempt migration simultaneously - only one succeeds
- First instance completes, second acquires lock and runs
- Stale lock detection after 5-minute timeout
- Migrations succeed with locking enabled
- Migrations succeed when transactions disabled (no locking, with warning)
- `migrate:unlock` command clears stuck lock
- `migrate:status` command shows correct lock state

### Manual Testing

Multi-instance deployment testing:

- Docker Compose with 3 replicas
- All start simultaneously
- Verify only one runs migrations
- Kill instance mid-migration
- Verify lock expires and next instance can run

## Trade-offs and Limitations

### Requires Transactions

**Limitation:** Lock mechanism requires transaction support. If transactions are disabled:

- Lock is skipped entirely
- Migration proceeds with current (unlocked) behavior
- Warning logged to inform administrators

**Rationale:** Migrations already use transactions (line 97-109 in migrate.ts). Applications disabling transactions likely run in single-instance mode or handle coordination externally.

**Documentation:** Clearly document that multi-instance deployments require transaction support.

### Lock Timeout

**Default:** 5 minutes

**Consideration:** If migrations take longer than timeout:

- Lock expires while migration is running
- Another instance could acquire lock and attempt migration
- Second instance would fail due to migration records already existing

**Mitigation:**

- 5 minutes should handle most migration batches
- Could make timeout configurable via environment variable
- Long-running migrations should be broken into smaller batches

### Single Lock for All Migrations

**Current design:** Single lock for entire migration batch

**Alternative considered:** Per-migration locking

- More complex implementation
- Minimal benefit (migrations should be fast)
- Current design is simpler and sufficient

## Security Considerations

- Lock global hidden from admin UI (`admin.hidden: true`)
- No REST/GraphQL endpoints exposed (`endpoints: false`, `graphQL: false`)
- Lock operations use internal request context
- No user-facing attack surface

## Backwards Compatibility

- Existing migrations work unchanged
- Lock global created automatically on first migration run
- No configuration changes required
- Opt-in via transaction support (already required)

## Deployment Recommendations

Document best practices for production:

1. **Preferred:** Run migrations as separate deployment step

   - CI/CD step before scaling instances
   - Init container in Kubernetes
   - Separate task in ECS/Fargate

2. **Alternative:** Run migrations on startup with locking

   - Ensure transactions are enabled
   - Monitor lock timeout for long migration batches
   - Use `migrate:status` to diagnose issues

3. **Emergency recovery:**
   - Use `migrate:unlock` to clear stuck locks
   - Check logs for crashed instance identifier
   - Verify migration state before re-running

## Future Enhancements (Not in Scope)

- Configurable lock timeout via environment variable
- Heartbeat mechanism to extend lock during long migrations
- Lock queue (if multiple instances waiting, run in order)
- Metrics/telemetry for lock contention
