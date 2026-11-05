Written with AI

# Atomic migration lock acquisition

## Problem

The current `findGlobal` → expiry check → `updateGlobal` sequence can let two
instances acquire the same lock. Wrapping these calls in a transaction does not
make acquisition exclusive under Postgres's default isolation level.

## Decision

Replace the read/check/write sequence with an adapter-level atomic conditional
write. Keep the existing lock metadata and core migration runner interface.
Only the instance whose write succeeds may run migrations.

Add an internal database adapter operation:

```ts
tryAcquireMigrationLock({
  instanceId,
  timeout,
}): Promise<{ acquired: boolean }>
```

The adapter must commit acquisition before returning success. The core utility
generates the instance ID and delegates acquisition to the adapter. Run migration
history checks only after successful acquisition.

## Storage and acquisition

- Enforce one lock record with a database-level unique singleton identity.
  The adapter may use a fixed ID or a dedicated unique key.
- Initialize that record idempotently; concurrent initialization must not create
  separate lock records. A missing record must not count as successful acquisition.
- Acquire only when the record is unlocked or its lease has expired.
- Set `locked`, `locked_by`, `locked_at`, and `expires_at` in the same write.
- Prefer database time for expiry checks and lease timestamps. SQLite timestamp
  values must use a consistent, sortable representation.
- A held lock returns `{ acquired: false }`. Database errors propagate; they must
  not be interpreted as an unlocked database.

Illustrative SQL, with parameters and timestamp encoding adapted to the driver:

```sql
UPDATE payload_migrations_lock
SET locked = TRUE,
    locked_by = :instance_id,
    locked_at = :now,
    expires_at = :expires_at
WHERE id = :lock_id
  AND (locked IS NOT TRUE OR expires_at <= :now)
RETURNING locked_by;
```

One returned row means acquisition succeeded. Zero rows means acquisition failed.
Do not implement this as a conditional read followed by an unconditional write.

## Adapter behavior

- **Postgres:** use the conditional `UPDATE … RETURNING`. Alternatively, acquire
  the existing singleton row with `SELECT … FOR UPDATE`, check its state, update
  it, and commit on the same connection in a short transaction.
- **SQLite:** use the conditional update as a single write transaction. For a
  multi-statement implementation, start with `BEGIN IMMEDIATE`. Handle busy errors
  with bounded retries. Do not hold the SQLite writer lock across the migration
  batch, whose migrations currently use separate transactions.
- **MongoDB:** use `findOneAndUpdate` with the singleton identity and availability
  predicate in the query. Initialize the uniquely identified record separately;
  an upsert against a held lock must not create another record.

If the lock schema is absent during an upgrade, require a documented single-instance
bootstrap step. Generate a SQL schema migration containing the lock global and
its unique `lock_key` index. On a fresh database or an upgrade missing that schema,
stop other migration runners and apply it once with:

```sh
payload migrate --skip-lock
```

The programmatic equivalent is `payload.db.migrate({ skipLock: true })`. This
explicit opt-out logs a warning. Remove it after bootstrap; subsequent migrations
fail if lock storage is missing or inaccessible. MongoDB initializes its document
and unique partial index atomically on first use and requires no SQL bootstrap.
Acquisition does not require transaction support in any adapter.

Multi-instance protection starts only after storage exists.

## Release and lease boundary

Release must conditionally update the singleton record only when
`locked_by === instanceId`; an old owner must not clear a newer owner's lock.

This plan guarantees exclusive acquisition while the lease is valid. The existing
five-minute timeout can still permit takeover during a long-running migration.
Lease renewal and handling a lost lease require a separate decision before claiming
exclusive execution for migrations of arbitrary duration.

## Acceptance tests

- Use independent adapter instances/connections against the same database.
- Concurrent acquisition of an unlocked record produces exactly one winner.
- Concurrent first-use initialization creates exactly one lock record and winner.
- An unexpired lock rejects acquisition; an expired lock permits one new owner.
- Releasing with an old owner ID preserves the current owner's lock.
- Database failures propagate; SQLite contention does not produce two winners.
- Exercise migration runners to verify that a losing instance never calls `up`.

Run these checks against Postgres, SQLite, and MongoDB using the shared integration
fixture. Mock-only tests cannot establish the concurrency guarantee.
